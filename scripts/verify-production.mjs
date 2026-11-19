import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { availablePort, startProcess, stopProcess, waitForProcess } from './verification-process.mjs';
import { createTestDatabase } from './test-postgres.mjs';

const backend = resolve(dirname(fileURLToPath(import.meta.url)), '../packages/backend');
const port = await availablePort();
const db = await createTestDatabase();
const origin = `http://127.0.0.1:${port}`;
const credentials = { username: 'production-fixture-admin', password: 'test-production-only-secret' };
const env = {
  ...process.env, NODE_ENV: 'production', SERVE_FRONTEND: 'true', IMPORT_XTN_2026: 'true',
  HOST: '127.0.0.1', PORT: String(port), DATABASE_URL: db.url, CORS_ORIGINS: '',
  RENDER: 'true', RENDER_EXTERNAL_URL: origin,
  JWT_SECRET: 'temporary-jwt-for-production-verification',
  PRODUCTION_ADMIN_USERNAME: credentials.username, PRODUCTION_ADMIN_PASSWORD: credentials.password,
  PRODUCTION_ADMIN_EMAIL: 'production-fixture@example.test',
};
const processes = new Set();
const run = (script, args = [], overrides = {}) =>
  startProcess([script, ...args], { cwd: backend, env: { ...env, ...overrides } }, processes);
async function command(script, args = [], overrides = {}, expectedExit = 0) {
  const child = run(script, args, overrides);
  const result = await waitForProcess(child, 20000);
  assert.equal(result.code, expectedExit, child.output);
  return child.output;
}
async function request(path, init = {}, base = origin) {
  return fetch(base + path, { signal: AbortSignal.timeout(1500), ...init });
}
async function read(path) {
  const response = await request(path);
  assert.equal(response.status, 200, path);
  const body = await response.json();
  assert.equal(body.success, true, path);
  return body.data;
}
async function startServer(overrides = {}, base = origin) {
  const child = run('dist/index.js', ['--production'], overrides);
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.ok(!child.closed, child.output);
    const response = await request('/api/health', {}, base).catch(() => undefined);
    if (response?.ok) return child;
    await delay(100);
  }
  throw new Error('Production health timeout.\n' + child.output);
}
function login({ username, password }, requestOrigin = origin) {
  return request('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: requestOrigin },
    body: JSON.stringify({ username, password }),
  });
}

let browser;
try {
  assert.match(await command('dist/index.js', ['--production'], { DATABASE_URL: '' }, 1), /DATABASE_URL/);
  await db.query('CREATE TABLE "UnknownDatabase" (id integer)');
  assert.match(await command('dist/index.js', ['--production'], {}, 1), /Unsupported PostgreSQL migration history/);
  await db.query('DROP TABLE "UnknownDatabase"');
  assert.match(await command('dist/index.js', ['--production'], { PRODUCTION_ADMIN_PASSWORD: '' }, 1), /PRODUCTION_ADMIN_PASSWORD/);
  assert.equal((await db.query("SELECT to_regclass('public.migrations') AS name"))[0].name, null);
  await stopProcess(await startServer({ IMPORT_XTN_2026: 'false' }));
  assert.match(await command('dist/db/seeds/index.js', ['--xtn-2026', '--dry-run']), /"dryRun":true,"created":true/);
  for (const table of ['Campaign', 'ContentImport']) {
    assert.equal((await db.query(`SELECT COUNT(*)::int AS n FROM "${table}"`))[0].n, 0);
  }
  const secondPort = await availablePort();
  const [server, overlapping] = await Promise.all([
    startServer(), startServer({ PORT: String(secondPort) }, `http://127.0.0.1:${secondPort}`),
  ]);
  const logs = [server.output, overlapping.output].join('\n');
  assert.equal(logs.match(/"created":true.*"teams":9,"posts":38,"photos":6/g)?.length, 1);
  assert.equal(logs.match(/"created":false/g)?.length, 1);
  await stopProcess(overlapping);
  assert.equal((await request('/api/health/live')).status, 200);
  const campaigns = await read('/api/campaigns');
  assert.equal(campaigns.length, 1);
  const [campaign] = campaigns;
  const id = campaign.campaignId;
  assert.equal(campaign.campaignName, 'Xuân Tình Nguyện 2026');
  assert.equal(campaign.attachments.length, 1);
  const teams = await read(`/api/teams?campaignId=${id}`);
  assert.equal(teams.length, 9);
  assert.ok(teams.every(team => team.campaignId === id));
  const posts = await read(`/api/posts?campaignId=${id}`);
  assert.equal(posts.length, 38);
  assert.ok(posts.every(post => post.coordinates === null && post.author === null));
  assert.equal((await request('/api/unknown', { headers: { Accept: 'text/html' } })).status, 404);
  assert.equal((await request('/assets/missing.js')).status, 404);
  assert.equal((await login(credentials, 'https://example.test')).status, 403);
  assert.equal((await request('/api/admin')).status, 401);
  assert.equal((await login(credentials)).status, 200);

  const photoPosts = await Promise.all(posts.filter(post => post.thumbnail).map(post => read(`/api/posts/${post.postId}`)));
  assert.equal(photoPosts.length, 3);
  const photoFiles = new Set();
  for (const post of photoPosts) {
    assert.equal(post.photos.length, 2);
    const scope = await read(`/api/posts?teamId=${post.team.teamId}`);
    assert.ok(scope.some(item => item.postId === post.postId));
    for (const [index, photo] of post.photos.entries()) {
      assert.equal(photo.position, index);
      assert.equal(photo.isFirstImage, index === 0);
      const response = await request(photo.imageUrl);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('Content-Type'), /^image\/jpeg/);
      assert.equal(Buffer.from(await response.arrayBuffer()).readUInt16BE(), 0xffd8);
      photoFiles.add(photo.imageUrl);
    }
  }
  assert.equal(photoFiles.size, 6);
  assert.ok(photoFiles.has(campaign.attachments[0].imageUrl));

  const featured = photoPosts.find(post => post.title === 'Lễ Hội quân Xuân Tình Nguyện 2026');
  assert.ok(featured);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.text().includes('Content Security Policy')) errors.push(message.text()); });
  await page.goto(origin);
  await page.getByRole('link', { name: campaign.campaignName }).click();
  await page.getByRole('heading', { name: campaign.campaignName }).waitFor();
  await page.getByRole('link', { name: `Xem bài đăng: ${featured.title}` }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: featured.title }).waitFor();
  await page.getByRole('link', { name: 'Nguồn UIT' }).waitFor();
  await page.waitForFunction(alt => Array.from(document.images).some(image => image.alt === alt && image.naturalWidth > 0), featured.photos[0].title);
  await page.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
  await page.waitForFunction(alt => Array.from(document.images).some(image => image.alt === alt && image.naturalWidth > 0), featured.photos[1].title);
  await page.goto(origin + '/admin/dashboard');
  await page.waitForURL('**/login');
  await page.getByLabel('Tên đăng nhập').fill(credentials.username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'ĐĂNG NHẬP', exact: true }).click();
  await page.waitForURL('**/admin/dashboard');
  assert.deepEqual(errors, []);
  await browser.close();
  browser = undefined;
  await stopProcess(server);

  assert.deepEqual(await db.query('SELECT "Username" FROM "Account"'), [{ Username: credentials.username }]);
  await db.query('UPDATE "Post" SET "Title" = $1 WHERE "PostId" = $2', ['Tiêu đề đã được biên tập', featured.postId]);
  const restarted = await startServer({
    PRODUCTION_ADMIN_USERNAME: '', PRODUCTION_ADMIN_EMAIL: '', PRODUCTION_ADMIN_PASSWORD: '',
  });
  assert.match(restarted.output, /"created":false/);
  assert.equal((await login(credentials)).status, 200);
  assert.equal((await read(`/api/posts?campaignId=${id}`)).length, 38);
  assert.equal((await read(`/api/posts/${featured.postId}`)).title, 'Tiêu đề đã được biên tập');
  console.log('PostgreSQL production startup, dry-run, archive import, repeat protection, restart and real browser PASS.');
} finally {
  try {
    await browser?.close();
    await Promise.all([...processes].map(stopProcess));
  } finally {
    await db.close();
  }
}
