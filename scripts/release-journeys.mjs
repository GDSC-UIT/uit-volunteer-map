import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer, request as proxyRequest } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startProcess, waitForProcess, stopProcess, availablePort } from './verification-process.mjs';
import { releaseApiChecks } from './release-api-checks.mjs';
import { releaseBrowserChecks } from './release-browser-checks.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, process.env.RELEASE_EVIDENCE_DIR || 'output/playwright/r14');
const evidencePath = relative(join(root, 'output/playwright'), output);
if (isAbsolute(evidencePath) || evidencePath.startsWith('..')) throw Error('Evidence must stay under output/playwright');
mkdirSync(output, { recursive: true });
const tempRoot = resolve(tmpdir()), work = mkdtempSync(join(tempRoot, 'uit-r14-journeys-'));
const devDb = join(root, 'packages/backend/src/data/database.sqlite');
const hash = path => existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null;
const before = [devDb, devDb + '-wal', devDb + '-shm'].map(hash);
const children = new Set(), errors = [];
const controller = new AbortController();
const interrupted = () => {
  controller.abort(Error('Release journeys interrupted or timed out'));
  void browser?.close().catch(() => undefined);
};
process.once('SIGINT', interrupted); process.once('SIGTERM', interrupted);
let db, apiServer, webServer, browser;
const timeout = setTimeout(interrupted, 300000);
const report = { node: process.version, passed: false, checks: [], browser: [], cleanup: false };
async function runNode(args, env = process.env) {
  const child = startProcess(args, { cwd: root, env }, children);
  const result = await waitForProcess(child, 120000, controller.signal);
  if (child.error || result.code !== 0) throw Error('Release subprocess failed: ' + args.join(' ') + '\n' + child.output);
  return child.output;
}
async function listen(server, port = 0) {
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  return `http://127.0.0.1:${server.address().port}`;
}
try {
  if (!process.argv.includes('--built')) {
    assert.ok(process.env.npm_execpath, 'Run through npm run test:journeys');
    console.log('Building current shared/backend/frontend for an isolated same-origin API...');
    await runNode([process.env.npm_execpath, 'run', 'build'], { ...process.env, VITE_API_URL: '' });
  }
  for (const target of ['packages/frontend/public', 'packages/frontend/dist']) await runNode(['scripts/check-map-assets.mjs', target]);
  const webPort = await availablePort(), webOrigin = `http://127.0.0.1:${webPort}`;
  Object.assign(process.env, { DB_PATH: join(work, 'release.sqlite'), DATABASE_PATH: join(work, 'release.sqlite'), NODE_ENV: 'test',
    JWT_SECRET: 'r14-disposable-release-only', JWT_EXPIRES_IN: '1h', CORS_ORIGINS: webOrigin, LOGIN_RATE_LIMIT_MAX: '10', LOGIN_RATE_LIMIT_WINDOW_SECONDS: '900' });
  ({ AppDataSource: db } = await import('../packages/backend/dist/db/data-source.js'));
  assert.equal(db.options.synchronize, false);
  await db.initialize();
  const applied = await db.runMigrations(); assert.equal(applied.length, 15);
  assert.equal((await db.runMigrations()).length, 0);
  const { seedDemo } = await import('../packages/backend/dist/db/seeds/demo.seed.js');
  const credentials = { adminPassword: 'r14-synthetic-admin', leaderPassword: 'r14-synthetic-leader' };
  const demo = await seedDemo(db, credentials); assert.equal((await seedDemo(db, credentials)).created, false);
  const { default: app } = await import('../packages/backend/dist/app.js');
  apiServer = createServer(app); const api = await listen(apiServer);
  const dist = join(root, 'packages/frontend/dist');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.geojson': 'application/geo+json', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
  webServer = createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
      const upstream = proxyRequest(api + req.url, { method: req.method, headers: { ...req.headers, host: new URL(api).host } }, result => { res.writeHead(result.statusCode, result.headers); result.pipe(res); });
      upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Test proxy failed'); });
      req.pipe(upstream); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, webOrigin).pathname);
      const path = resolve(dist, '.' + pathname);
      const child = relative(dist, path);
      if (isAbsolute(child) || child.startsWith('..')) { res.writeHead(403).end(); return; }
      const file = existsSync(path) && extname(path) ? path : !extname(path) ? join(dist, 'index.html') : null;
      if (!file) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  await listen(webServer, webPort);
  report.checks.push('15 fresh migrations; restart no-op; demo seed twice; source and built map hashes/provenance');
  report.checks.push(...await releaseApiChecks({ base: api + '/api', webOrigin, db, demo }));
  console.log('Migrated API invariants PASS; starting real browser journeys.');
  browser = await chromium.launch({ headless: !process.argv.includes('--headed') });
  for (const [width, height] of [[375, 667], [1440, 900]]) {
    controller.signal.throwIfAborted();
    const context = await browser.newContext({ viewport: { width, height } });
    try { report.browser.push(await releaseBrowserChecks({ context, origin: webOrigin, demo, width, height, output })); }
    finally { await context.close(); }
  }
  assert.deepEqual(await db.query('PRAGMA foreign_key_check'), []);
  report.passed = true;
} catch (error) {
  report.error = error.message;
  errors.push(error);
} finally {
  clearTimeout(timeout);
  try { await browser?.close(); } catch (error) { errors.push(error); }
  for (const server of [webServer, apiServer]) if (server?.listening) {
    server.closeAllConnections(); await new Promise(done => server.close(done));
  }
  if (db?.isInitialized) await db.destroy();
  for (const child of children) { try { await stopProcess(child); } catch (error) { errors.push(error); } }
  const child = relative(tempRoot, resolve(work));
  if (isAbsolute(child) || child.startsWith('..') || !basename(work).startsWith('uit-r14-journeys-')) throw Error('Unsafe cleanup target');
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  report.developerDatabaseUnchanged = [devDb, devDb + '-wal', devDb + '-shm'].map(hash).every((value, index) => value === before[index]);
  if (!report.developerDatabaseUnchanged) errors.push(Error('Developer database changed'));
  report.cleanup = true;
  report.passed = report.passed && errors.length === 0;
  report.sourceHashes = Object.fromEntries(['scripts/release-journeys.mjs', 'scripts/release-api-checks.mjs', 'scripts/release-browser-checks.mjs', 'scripts/verification-process.mjs'].map(path => [path, hash(join(root, path))]));
  writeFileSync(join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  process.removeListener('SIGINT', interrupted); process.removeListener('SIGTERM', interrupted);
}
if (errors.length) { console.error(new AggregateError(errors, 'Release journeys failed')); process.exitCode = 1; }
else console.log('Release journeys PASS: migrated API lifecycle, Guest/Admin/Leader browser at 375x667 and 1440x900; owned resources removed.');
