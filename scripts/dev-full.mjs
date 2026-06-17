import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const children = [];

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(code);
}

function run(label, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
    ...options,
  });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (signal) {
      shutdown(0);
      return;
    }
    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
      shutdown(code);
    }
  });
  return child;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0));
}

console.log('Starting automation dev stack (API server + Vite)...');
run('dev-server', process.execPath, ['scripts/dev-server.mjs']);
run('vite', 'pnpm', ['--filter', '@automation/web', 'dev']);
