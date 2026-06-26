import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageTuttiApp } from './package-tutti-app.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const BUILD_ROOT = path.join(ROOT, 'dist', 'tutti-app');
const DEV_PACKAGE_ROOT = path.join(BUILD_ROOT, 'automation-dev');
const DEV_ZIP_NAME = 'automation-dev.zip';
const DEV_ZIP_PATH = path.join(BUILD_ROOT, DEV_ZIP_NAME);
const DEV_STATE_PATH = path.join(BUILD_ROOT, 'dev-state.json');
const DEV_SUMMARY_PATH = path.join(BUILD_ROOT, 'dev-summary.json');
const CATALOG_PATH = path.join(BUILD_ROOT, 'dev-catalog.json');
const SERVE_PID_PATH = path.join(BUILD_ROOT, '.serve.pid');
const DEFAULT_SERVE_PORT = 20_001;
const DEFAULT_TUTTI_ROOT = '/Users/ryan/dev/nexight/tutti';

function log(message) {
  console.log(`[dev-tutti] ${message}`);
}

function fail(message) {
  console.error(`[dev-tutti] ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? ROOT,
      env: { ...process.env, ...options.env },
      stdio: options.stdio ?? 'inherit',
      shell: false,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readSourceBaseVersion() {
  const manifest = await readJson(path.join(ROOT, 'tutti.app.json'));
  return String(manifest.version ?? '0.0.0').trim();
}

async function readDevState() {
  try {
    return await readJson(DEV_STATE_PATH);
  } catch {
    const baseVersion = await readSourceBaseVersion();
    return {
      baseVersion,
      devCounter: 0,
      version: `${baseVersion}-dev.0`,
    };
  }
}

async function nextDevVersion({ bump = true } = {}) {
  const state = await readDevState();
  const baseVersion = await readSourceBaseVersion();
  state.baseVersion = baseVersion;
  if (bump) {
    state.devCounter = Number(state.devCounter ?? 0) + 1;
  }
  state.version = `${baseVersion}-dev.${state.devCounter}`;
  await writeJson(DEV_STATE_PATH, state);
  return state;
}

function resolveServePort() {
  const raw = process.env.AUTOMATION_TUTTI_DEV_PORT?.trim();
  const port = raw ? Number(raw) : DEFAULT_SERVE_PORT;
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    fail(`invalid AUTOMATION_TUTTI_DEV_PORT: ${raw ?? ''}`);
  }
  return port;
}

function resolveTuttiRoot() {
  return path.resolve(process.env.TUTTI_ROOT?.trim() || DEFAULT_TUTTI_ROOT);
}

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function buildCatalog({ manifest, zipSha256, servePort }) {
  const baseUrl = `http://127.0.0.1:${servePort}`;
  return {
    schemaVersion: 'tutti.app.catalog.v1',
    apps: [
      {
        manifest,
        distribution: {
          kind: 'remote',
          artifactUrl: `${baseUrl}/${DEV_ZIP_NAME}`,
          artifactSha256: zipSha256,
          iconUrl: `${baseUrl}/automation-dev/icon.png`,
        },
      },
    ],
  };
}

async function packageForDev({ bump = true } = {}) {
  const state = await nextDevVersion({ bump });
  log(`packaging automation@${state.version} ...`);
  const result = await packageTuttiApp({
    archivePath: DEV_ZIP_PATH,
    packageRoot: DEV_PACKAGE_ROOT,
    version: state.version,
  });
  const manifest = await readJson(path.join(result.packageRoot, 'tutti.app.json'));
  const zipSha256 = await sha256File(result.archivePath);
  const servePort = resolveServePort();
  const catalog = buildCatalog({ manifest, zipSha256, servePort });
  await writeJson(CATALOG_PATH, catalog);

  const summary = {
    version: state.version,
    catalogPath: CATALOG_PATH,
    stableZipPath: result.archivePath,
    zipSha256,
    packageRoot: result.packageRoot,
    serveBaseUrl: `http://127.0.0.1:${servePort}`,
  };
  await writeJson(DEV_SUMMARY_PATH, summary);
  log(`package ready: ${state.version}`);
  log(`catalog: ${CATALOG_PATH}`);
  log(`artifact: ${summary.serveBaseUrl}/${DEV_ZIP_NAME}`);
  return summary;
}

function contentTypeFor(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.zip':
      return 'application/zip';
    case '.sh':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readServePid() {
  try {
    const raw = (await readFile(SERVE_PID_PATH, 'utf8')).trim();
    const pid = Number(raw);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

async function startServe() {
  const port = resolveServePort();
  const existingPid = await readServePid();
  if (existingPid && isProcessRunning(existingPid)) {
    log(`artifact server already running on :${port} (pid ${existingPid})`);
    return existingPid;
  }

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
      const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
      const filePath = path.resolve(BUILD_ROOT, relativePath);
      if (!filePath.startsWith(BUILD_ROOT)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        response.writeHead(404);
        response.end('Not Found');
        return;
      }
      response.writeHead(200, {
        'Content-Type': contentTypeFor(filePath),
        'Content-Length': fileStat.size,
        'Cache-Control': 'no-store',
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404);
      response.end('Not Found');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  const pid = process.pid;
  await writeFile(SERVE_PID_PATH, `${pid}\n`);
  log(`artifact server listening on http://127.0.0.1:${port}/`);
  log(`serving directory: ${BUILD_ROOT}`);

  const shutdown = async () => {
    server.close();
    try {
      await writeFile(SERVE_PID_PATH, '');
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return pid;
}

async function ensureServeRunning() {
  const pid = await readServePid();
  if (pid && isProcessRunning(pid)) {
    log(`artifact server already running (pid ${pid})`);
    return pid;
  }

  const child = spawn(process.execPath, [SCRIPT_PATH, 'serve'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const runningPid = await readServePid();
    if (runningPid && isProcessRunning(runningPid)) {
      log(`artifact server started (pid ${runningPid})`);
      return runningPid;
    }
  }

  fail('artifact server failed to start');
}

async function stopTuttiDevProcesses() {
  const patterns = [
    'make dev-gui',
    'electron-vite dev',
    '/tutti/apps/desktop/build/tuttid/tuttid',
    '/tutti/apps/desktop/node_modules/.bin/../electron-vite/bin/electron-vite.js dev',
  ];
  const killed = new Set();
  for (const pattern of patterns) {
    const result = spawnSync('pgrep', ['-f', pattern], { encoding: 'utf8' });
    for (const line of (result.stdout ?? '').split('\n')) {
      const pid = Number.parseInt(line.trim(), 10);
      if (!Number.isFinite(pid) || killed.has(pid)) continue;
      try {
        process.kill(pid, 'SIGTERM');
        killed.add(pid);
      } catch {
        // ignore
      }
    }
  }
  const servePid = await readServePid();
  if (servePid && isProcessRunning(servePid)) {
    try {
      process.kill(servePid, 'SIGTERM');
      killed.add(servePid);
    } catch {
      // ignore
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));
  for (const pid of killed) {
    if (!isProcessRunning(pid)) continue;
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // ignore
    }
  }
  log(`stopped ${killed.size} dev process(es)`);
}

function printReloadInstructions(summary) {
  console.log('');
  log('reload complete. In Tutti App Center:');
  log('1. Open App Center and refresh the catalog');
  log('2. Reinstall or update Automation if prompted');
  log(`3. Current dev version: ${summary.version}`);
  console.log('');
}

async function startTutti() {
  const tuttiRoot = resolveTuttiRoot();
  try {
    await access(path.join(tuttiRoot, 'Makefile'));
  } catch {
    fail(`Tutti root not found: ${tuttiRoot}. Set TUTTI_ROOT if needed.`);
  }

  try {
    await access(CATALOG_PATH);
  } catch {
    await packageForDev({ bump: false });
  }

  await ensureServeRunning();

  const env = {
    ...process.env,
    TUTTI_ENV: 'development',
    TUTTI_APP_CATALOG_FILE: CATALOG_PATH,
    TUTTI_APP_CATALOG_URL: '',
  };

  log(`starting Tutti from ${tuttiRoot}`);
  log(`TUTTI_APP_CATALOG_FILE=${CATALOG_PATH}`);
  await run('make', ['dev-gui'], { cwd: tuttiRoot, env });
}

async function printStatus() {
  try {
    const summary = await readJson(DEV_SUMMARY_PATH);
    log(`version: ${summary.version}`);
    log(`catalog: ${summary.catalogPath}`);
    log(`artifact: ${summary.serveBaseUrl}/${DEV_ZIP_NAME}`);
  } catch {
    log('no dev package yet. Run: pnpm dev:tutti:reload');
  }
  const pid = await readServePid();
  log(`serve pid: ${pid && isProcessRunning(pid) ? pid : 'not running'}`);
}

function printHelp() {
  console.log(`Usage:
  pnpm dev:tutti         # package if needed, serve artifacts, start Tutti dev GUI
  pnpm dev:tutti:reload  # rebuild package and refresh local catalog
  pnpm dev:tutti:serve   # run local artifact HTTP server only
  pnpm dev:tutti:stop    # stop Tutti dev GUI / artifact server
  pnpm dev:tutti:status  # show current dev package status

Environment:
  TUTTI_ROOT                  Tutti repo path (default: ${DEFAULT_TUTTI_ROOT})
  AUTOMATION_TUTTI_DEV_PORT   Artifact server port (default: ${DEFAULT_SERVE_PORT})
`);
}

async function main() {
  const [command = 'help'] = process.argv.slice(2);

  switch (command) {
    case 'package':
      await packageForDev({ bump: true });
      break;
    case 'serve':
      await mkdir(BUILD_ROOT, { recursive: true });
      await startServe();
      break;
    case 'start':
      await startTutti();
      break;
    case 'reload': {
      const summary = await packageForDev({ bump: true });
      await ensureServeRunning();
      printReloadInstructions(summary);
      break;
    }
    case 'status':
      await printStatus();
      break;
    case 'stop':
      await stopTuttiDevProcesses();
      break;
    default:
      printHelp();
      break;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  });
}
