import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_DIR = path.join(ROOT, '.dev');
const dataDir = path.join(DEV_DIR, 'data');
const logDir = path.join(DEV_DIR, 'logs');
const runtimeDir = path.join(DEV_DIR, 'runtime');

for (const dir of [dataDir, logDir, runtimeDir]) {
  mkdirSync(dir, { recursive: true });
}

const port = process.env.AUTOMATION_DEV_PORT || '8787';
const host = process.env.AUTOMATION_DEV_HOST || '127.0.0.1';
const python = process.env.TUTTI_APP_PYTHON || 'python3';

const env = {
  ...process.env,
  TUTTI_APP_PACKAGE_DIR: ROOT,
  TUTTI_APP_DATA_DIR: dataDir,
  TUTTI_APP_LOG_DIR: logDir,
  TUTTI_APP_RUNTIME_DIR: runtimeDir,
  TUTTI_APP_ID: 'automation',
  TUTTI_WORKSPACE_ID: process.env.TUTTI_WORKSPACE_ID || 'dev-workspace',
  TUTTI_WORKSPACE_NAME: process.env.TUTTI_WORKSPACE_NAME || 'Dev Workspace',
  TUTTI_WORKSPACE_ROOT: process.env.TUTTI_WORKSPACE_ROOT || ROOT,
  TUTTI_APP_HOST: host,
  TUTTI_APP_PORT: port,
  TUTTI_APP_BASE_URL: `http://${host}:${port}`,
  TUTTI_CLI: process.env.TUTTI_CLI || 'tutti',
};

console.log(`Automation dev server listening on http://${host}:${port}`);
console.log(`Data dir: ${dataDir}`);

const child = spawn(python, [path.join(ROOT, 'server.py')], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
