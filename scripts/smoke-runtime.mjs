import { startProcess, waitForProcess, stopProcess, availablePort } from './verification-process.mjs';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendRoot = join(repoRoot, 'packages/backend');
const devDbPath = join(backendRoot, 'src/data/database.sqlite');

function databaseHash() {
  return existsSync(devDbPath)
    ? createHash('sha256').update(readFileSync(devDbPath)).digest('hex')
    : null;
}

async function runSmokeTest() {
  const initialHash = databaseHash();
  const tempRoot = resolve(tmpdir());
  const workDir = mkdtempSync(join(tempRoot, 'uit-volunteer-map-smoke-'));
  const databasePath = join(workDir, 'database.sqlite');
  const processes = new Set();
  const controller = new AbortController();
  const onInterrupt = () => controller.abort(new Error('Smoke test interrupted'));
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onInterrupt);
  const errors = [];
  console.log('Smoke workspace: ' + workDir);

  try {
    // npm supplies its own JS entry point on Windows and Unix. Running it with
    // Node avoids npm.cmd shell quoting and any global installation path.
    const npmCli = process.env.npm_execpath;
    if (!npmCli || !isAbsolute(npmCli) || !existsSync(npmCli)) {
      throw new Error('Cannot resolve npm CLI. Invoke this check with npm run test:smoke.');
    }
    const env = {
      ...process.env,
      DB_PATH: databasePath,
      DATABASE_PATH: databasePath,
      NODE_ENV: 'test', HOST: '127.0.0.1', CORS_ORIGINS: 'http://localhost:3001', JWT_EXPIRES_IN: '1h',
      JWT_SECRET: 'smoke-runtime-verification-secret',
    };
    const runNpm = async (args, timeoutMs = 30000) => {
      const record = startProcess([npmCli, ...args], { cwd: repoRoot, env }, processes);
      try {
        const result = await waitForProcess(record, timeoutMs, controller.signal);
        if (record.error) throw record.error;
        if (result.code !== 0) {
          throw new Error('Exited ' + result.code + ', signal ' + (result.signal || 'none'));
        }
        return record.output;
      } catch (error) {
        throw new Error('npm ' + args.join(' ') + ' failed: ' + error.message + '\n' + record.output, { cause: error });
      }
    };

    console.log('1. Building current shared/backend source...');
    await runNpm(['run', 'build:backend'], 120000);
    console.log('2. Running compiled migrations...');
    const migrations = await runNpm(['run', 'migration:run:dist', '-w', '@uit-volunteer-map/backend']);
    const count = migrations.match(/Migration .+ has been executed successfully\./g)?.length || 0;
    console.log('   Applied ' + count + ' migrations.');
    console.log('3. Running compiled seed...');
    await runNpm(['run', 'seed:dist', '-w', '@uit-volunteer-map/backend']);

    const port = await availablePort();
    controller.signal.throwIfAborted();
    const server = startProcess(['dist/index.js'], {
      cwd: backendRoot, env: { ...env, PORT: String(port) },
    }, processes);
    console.log('4. Backend PID ' + server.child.pid + '; health http://127.0.0.1:' + port + '/api/health');
    const deadline = Date.now() + 15000;
    let healthy = false;
    while (Date.now() < deadline) {
      controller.signal.throwIfAborted();
      if (server.error) throw server.error;
      if (server.closed) throw new Error('Backend exited before health check.\n' + server.output);
      try {
        const response = await fetch('http://127.0.0.1:' + port + '/api/health', {
          signal: AbortSignal.timeout(Math.max(1, Math.min(1000, deadline - Date.now()))),
        });
        const body = response.status === 200 ? await response.json() : null;
        if (body?.success === true && body?.data?.status === 'healthy') {
          healthy = true;
          break;
        }
      } catch {
        // Connection refusal and request timeouts are bounded startup retries.
      }
      await new Promise((done) => setTimeout(done, 100));
    }
    if (!healthy) throw new Error('Health check timed out after 15s.\n' + server.output);
    console.log('   Health responded HTTP 200 (healthy).');
  } catch (error) {
    errors.push(error);
  } finally {
    for (const record of processes) {
      try { await stopProcess(record); } catch (error) { errors.push(error); }
    }
    try {
      // Verify the resolved deletion target is this invocation's own temp child.
      const childPath = relative(tempRoot, resolve(workDir));
      if (isAbsolute(childPath) || childPath.startsWith('..') || !basename(workDir).startsWith('uit-volunteer-map-smoke-')) {
        throw new Error('Refusing cleanup outside smoke temp directory: ' + workDir);
      }
      rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      console.log('5. Disposable workspace removed.');
    } catch (error) { errors.push(error); }
    try {
      if (databaseHash() !== initialHash) throw new Error('Developer database changed during smoke test.');
    } catch (error) { errors.push(error); }
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onInterrupt);
  }
  if (errors.length) throw new AggregateError(errors, 'Runtime smoke test failed');
  console.log('Runtime smoke test PASS; child processes stopped; developer database unchanged.');
}

runSmokeTest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
