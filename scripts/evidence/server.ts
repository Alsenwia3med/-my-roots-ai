/**
 * Starting and stopping the production server for an evidence run.
 *
 * This exists because of a bug that twice produced wrong evidence. The scripts spawn
 * `npm start` through a shell, so `child.kill()` kills the shell and leaves `next start`
 * listening. The next run then finds the port occupied, fails to bind, and silently measures
 * the PREVIOUS build — which is how a fixed defect kept appearing broken across several runs.
 *
 * Two guards, because one was not enough:
 *   - `startServer` refuses to run at all if the port is already in use, so a stale server is a
 *     loud failure instead of a wrong answer;
 *   - `stopServer` kills the whole process tree, so a stale server does not survive the run.
 */

import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { connect } from 'node:net';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** True when something is already listening on the port. */
export function portInUse(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ port, host });
    const done = (used: boolean) => {
      socket.destroy();
      resolve(used);
    };
    socket.setTimeout(1000);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

export function stopServer(child: ChildProcess | null): void {
  if (!child?.pid) return;
  if (process.platform === 'win32') {
    // /T kills the children the shell spawned; without it `next start` keeps the port.
    try {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      /* already gone */
    }
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

export interface StartOptions {
  port: number;
  env?: Record<string, string>;
  /** Seconds to wait for the health endpoint. */
  timeoutSeconds?: number;
}

/**
 * Starts `next start` on the given port and waits for it to answer. Throws if the port is
 * already occupied — measuring against someone else's server is never the intended behaviour.
 */
export async function startServer({ port, env = {}, timeoutSeconds = 45 }: StartOptions): Promise<ChildProcess> {
  if (await portInUse(port)) {
    throw new Error(
      `port ${port} is already in use. A previous evidence run probably left a server behind. ` +
        `Refusing to continue, because the run would silently measure that older build. ` +
        `On Windows: netstat -ano | grep ":${port}" then taskkill /PID <pid> /T /F`,
    );
  }

  const child = spawn('npm', ['start', '--', '--port', String(port)], {
    stdio: process.env.EVIDENCE_DEBUG ? 'pipe' : 'ignore',
    shell: true,
    env: { ...process.env, PORT: String(port), ...env },
    detached: process.platform !== 'win32',
  });

  if (process.env.EVIDENCE_DEBUG) {
    child.stdout?.on('data', (d) => process.stdout.write(`  [server] ${d}`));
    child.stderr?.on('data', (d) => process.stdout.write(`  [server] ${d}`));
  }

  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < timeoutSeconds * 2; i += 1) {
    await sleep(500);
    try {
      if ((await fetch(`${origin}/api/v1/health`)).status < 500) return child;
    } catch {
      /* not up yet */
    }
  }

  stopServer(child);
  throw new Error(`the production server did not answer on ${origin} within ${timeoutSeconds}s`);
}
