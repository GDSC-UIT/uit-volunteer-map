import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { writeFileSync } from 'node:fs';
const results = [];
const base = { ...process.env, DB_PATH: ':memory:', DATABASE_PATH: ':memory:', NODE_ENV: 'test', HOST: '127.0.0.1', JWT_SECRET: 'r13-synthetic-startup', CORS_ORIGINS: 'http://localhost:3001' };
async function run(name, overrides) {
  const child = spawn(process.execPath, ['packages/backend/dist/index.js'], { env: { ...base, ...overrides }, windowsHide: true });
  let output = '';
  child.stdout.on('data', data => output += data); child.stderr.on('data', data => output += data);
  let timer;
  try {
    const code = await Promise.race([new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); }), new Promise((_, reject) => { timer = setTimeout(() => { child.kill(); reject(Error('Startup did not terminate')); }, 10000); })]);
    if (code !== 1 || !output.includes('Server startup failed.') || output.includes('private-sentinel')) throw Error(name + ' failed safe startup assertion');
    results.push({ name, exitCode: code, sanitized: true, passed: true });
  } finally { clearTimeout(timer); }
}
await run('invalid port', { PORT: 'private-sentinel' });
await run('missing JWT', { JWT_SECRET: '' });
await run('production requires explicit origins', { NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(32), CORS_ORIGINS: '' });
const occupied = createServer(); await new Promise(resolve => occupied.listen(0, '127.0.0.1', resolve));
try { await run('asynchronous port bind failure', { PORT: String(occupied.address().port) }); }
finally { await new Promise(resolve => occupied.close(resolve)); }
writeFileSync('output/verification/r13/startup-results.json', JSON.stringify({ node: process.version, results, database: ':memory:' }, null, 2) + '\n');
console.log(JSON.stringify(results));
