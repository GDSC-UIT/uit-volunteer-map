import { spawn, execFile } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

// Unix children own a process group so timed-out npm commands can be stopped
// along with their compiler/CLI children. Only this invocation's PIDs are used.
export function startProcess(args, { cwd, env }, processes) {
  const child = spawn(process.execPath, args, {
    cwd, env, shell: false, windowsHide: true,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const record = { child, output: '', error: null, closed: false, completion: null };
  const capture = (data) => { record.output = (record.output + data.toString()).slice(-65536); };
  child.stdout.on('data', capture);
  child.stderr.on('data', capture);
  child.once('error', (error) => { record.error = error; });
  record.completion = new Promise((done) => {
    child.once('close', (code, signal) => {
      record.closed = true;
      processes.delete(record);
      done({ code, signal });
    });
  });
  processes.add(record);
  return record;
}

export async function waitForProcess(record, timeoutMs, signal) {
  let timer;
  let onAbort;
  try {
    signal?.throwIfAborted();
    return await Promise.race([
      record.completion,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Process timed out after ' + timeoutMs + 'ms')), timeoutMs);
        onAbort = () => reject(signal.reason);
        signal?.addEventListener('abort', onAbort, { once: true });
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (onAbort) signal?.removeEventListener('abort', onAbort);
  }
}

export async function stopProcess(record) {
  if (record.closed) return;
  const pid = record.child.pid;
  if (!pid) {
    await waitForProcess(record, 5000);
    return;
  }
  if (process.platform === 'win32') {
    const taskkill = join(process.env.SystemRoot || 'C:\\Windows', 'System32/taskkill.exe');
    try {
      await execFileAsync(taskkill, ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true, timeout: 5000,
      });
    } catch (error) {
      if (!record.closed && record.child.exitCode === null && record.child.signalCode === null) throw error;
    }
  } else {
    try { process.kill(-pid, 'SIGTERM'); } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
    try {
      await waitForProcess(record, 2000);
    } catch {
      // Escalate below if the process did not finish during the grace period.
    }
    // Also stop surviving descendants if the process-group leader exited first.
    try { process.kill(-pid, 'SIGKILL'); } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
  await waitForProcess(record, 5000);
}

export async function availablePort() {
  const server = createServer();
  return new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close((error) => error ? reject(error) : done(port));
    });
  });
}
