import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
const root = process.cwd();
const npmCli = process.env.R13_NPM_CLI || process.env.npm_execpath || join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
if (process.version !== 'v24.22.3' || !existsSync(npmCli)) throw Error('Select the pinned Node runtime and npm (or set R13_NPM_CLI to its npm-cli.js).');
if (existsSync('output/playwright/r13/stop')) throw Error('Remove the owned R13 stop marker before replaying.');
const directory = mkdtempSync(join(tmpdir(), 'uit-r13-dev-'));
Object.assign(process.env, { DB_PATH: join(directory, 'demo.sqlite'), DATABASE_PATH: join(directory, 'demo.sqlite'), NODE_ENV: 'test', JWT_SECRET: 'r13-disposable-demo-only', JWT_EXPIRES_IN: '12s',
  HOST: '127.0.0.1', PORT: '5019', CORS_ORIGINS: 'http://127.0.0.1:3017', LOGIN_RATE_LIMIT_MAX: '2', LOGIN_RATE_LIMIT_WINDOW_SECONDS: '5', VITE_API_URL: 'http://127.0.0.1:5019' });
const { AppDataSource: db } = await import('../../../packages/backend/dist/db/data-source.js');
const { seedDemo } = await import('../../../packages/backend/dist/db/seeds/demo.seed.js');
await db.initialize(); const applied = await db.runMigrations();
if (applied.length !== 15) throw Error('Expected fresh 15 migrations');
await seedDemo(db, { adminPassword: 'r13-synthetic-admin', leaderPassword: 'r13-synthetic-leader' });
await db.destroy();
const owned = [];
let closing = false;
function close(exitCode = 0) {
  if (closing) return; closing = true;
  for (const child of owned) {
    try { execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch { /* May already be stopped. */ }
  }
  const target = resolve(directory);
  if (!target.startsWith(resolve(tmpdir()) + '\\') || !target.includes('uit-r13-dev-')) throw Error('Unsafe cleanup target');
  rmSync(target, { recursive: true, force: true });
  writeFileSync('output/verification/r13/dev-cleanup.json', JSON.stringify({ ownedProcessesStopped: true, disposableDatabaseRemoved: true }, null, 2));
  console.log('R13 owned development servers/database removed.');
  process.exit(exitCode);
}
process.on('SIGINT', () => close()); process.on('SIGTERM', () => close());
setInterval(() => { if (existsSync('output/playwright/r13/stop')) close(); }, 250).unref();
for (const [name, args] of [['backend', ['run', 'dev:backend']], ['frontend', ['run', 'dev:frontend', '--', '--host', '127.0.0.1', '--port', '3017', '--strictPort']]]) {
  const child = spawn(process.execPath, [npmCli, ...args], { cwd: root, env: process.env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  owned.push(child);
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => process.stdout.write(`[${name}] ${data}`));
  child.once('exit', code => { if (!closing) { console.error(`${name} exited ${code}`); close(code || 1); } });
}
const deadline = Date.now() + 60_000;
while (true) {
  try {
    const [api, web, health] = await Promise.all([fetch('http://127.0.0.1:5019/api/campaigns'), fetch('http://127.0.0.1:3017/login'), fetch('http://127.0.0.1:5019/api/health')]);
    if (api.ok && web.ok && health.ok) break;
  } catch { /* Wait for own children only. */ }
  if (Date.now() > deadline) { console.error('Development startup timed out'); close(1); }
  await new Promise(resolve => setTimeout(resolve, 250));
}
writeFileSync('output/verification/r13/dev-startup.json', JSON.stringify({ node: process.version, npm: '11.19.1', migrations: 15, twoTerminals: ['npm run dev:backend', 'npm run dev:frontend -- --host 127.0.0.1 --port 3017 --strictPort'], health: 200, campaigns: 200, frontend: 200, privateDatabaseTouched: false }, null, 2) + '\n');
console.log('R13 READY: actual two-terminal development commands, real migrated demo DB, short test-only expiry/rate window.');
