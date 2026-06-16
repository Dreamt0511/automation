import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, chmod, copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const DEFAULT_PACKAGE_ROOT = path.join(REPO_ROOT, 'dist/tutti-app/automation');

const REQUIRED_OUTPUT_FILES = [
  'AGENTS.md',
  'bootstrap.sh',
  'COMMANDS.md',
  'icon.png',
  'locales/zh-CN/manifest.json',
  'server.py',
  'static/index.html',
  'tutti.app.json',
  'tutti.cli.json',
];

const INCLUDED_ROOT_FILES = new Set([
  'AGENTS.tutti-app.md',
  'bootstrap.sh',
  'COMMANDS.md',
  'icon.png',
  'server.py',
  'server_test.py',
  'tutti.app.json',
  'tutti.cli.json',
]);

const INCLUDED_PREFIXES = ['locales/', 'static/'];
const EXCLUDED_PREFIXES = ['.git/', 'dist/', 'node_modules/', 'web/'];

export async function packageTuttiApp(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const packageRoot = options.packageRoot ?? DEFAULT_PACKAGE_ROOT;

  await run('pnpm', ['build:web'], { cwd: repoRoot });
  await rm(packageRoot, { recursive: true, force: true });
  await mkdir(packageRoot, { recursive: true });

  const files = await listFiles(repoRoot);
  for (const relativePath of files) {
    if (!shouldInclude(relativePath)) continue;
    const target = relativePath === 'AGENTS.tutti-app.md' ? 'AGENTS.md' : relativePath;
    await copyPlannedFile(repoRoot, packageRoot, relativePath, target);
  }

  await chmod(path.join(packageRoot, 'bootstrap.sh'), 0o755);
  await validatePackageOutput(packageRoot);
  return { packageRoot };
}

function shouldInclude(relativePath) {
  if (EXCLUDED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) {
    return false;
  }
  if (INCLUDED_ROOT_FILES.has(relativePath)) {
    return true;
  }
  return INCLUDED_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
}

async function listFiles(root) {
  const result = [];
  await walk(root, '', result);
  return result;
}

async function walk(root, relativeDir, result) {
  const absoluteDir = path.join(root, relativeDir);
  for (const entry of await readdir(absoluteDir, { withFileTypes: true })) {
    const relativePath = toPosix(path.join(relativeDir, entry.name));
    if (entry.isDirectory()) {
      if (['.git', 'dist', 'node_modules', 'web'].includes(entry.name)) continue;
      await walk(root, relativePath, result);
      continue;
    }
    if (entry.isFile()) result.push(relativePath);
  }
}

async function copyPlannedFile(repoRoot, packageRoot, sourceRelative, targetRelative) {
  const sourcePath = path.join(repoRoot, sourceRelative);
  const targetPath = path.join(packageRoot, targetRelative);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
}

async function validatePackageOutput(packageRoot) {
  for (const relativePath of REQUIRED_OUTPUT_FILES) {
    await assertFile(path.join(packageRoot, relativePath), `${relativePath} is required`);
  }
  await access(path.join(packageRoot, 'bootstrap.sh'), fsConstants.X_OK);
}

async function assertFile(filePath, message) {
  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) throw new Error(message);
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: 'inherit', env: process.env });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code ?? 'unknown status'}`));
    });
  });
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await packageTuttiApp();
  console.log(`Packaged Tutti app at ${result.packageRoot}`);
}
