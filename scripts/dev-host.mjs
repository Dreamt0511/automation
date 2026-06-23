import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packageTuttiApp } from './package-tutti-app.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = path.join(ROOT, 'static');
const nextMode = process.argv.includes('--next');
const nextPackageRoot = path.join(ROOT, 'dist/tutti-app/automation-next');
const nextArchivePath = path.join(ROOT, 'dist/tutti-app/automation-next.zip');

if (nextMode) {
  const result = await packageTuttiApp({
    archivePath: nextArchivePath,
    packageRoot: nextPackageRoot,
    variant: 'next',
  });
  console.log('Packaged Automation Next');
  console.log(`  Package: ${result.packageRoot}`);
  console.log(`  Import archive: ${result.archivePath}`);
  console.log('');
}

console.log(nextMode ? 'Host static watch mode for Automation Next' : 'Host static watch mode');
console.log('');
console.log('This rebuilds frontend assets into:');
console.log(`  ${staticDir}`);
console.log('');
console.log('Use one of these Tutti host workflows:');
console.log('');
if (nextMode) {
  console.log('1. Import the generated archive');
  console.log(`   - ${nextArchivePath}`);
  console.log('   - It installs as appId automation-next / name Automation Next');
  console.log('   - Import once; the package bootstrap runs this repo server.py directly');
  console.log('');
  console.log('2. Live updates after that');
  console.log('   - Frontend: keep this watch process running and refresh the app webview after rebuilds');
  console.log('   - Backend: restart Automation Next after editing server.py');
  console.log('');
} else {
  console.log('1. Local app imported from this repo root (recommended)');
  console.log('   - App Center imports the repository root, not dist/tutti-app/automation');
  console.log('   - Keep this watch process running');
  console.log('   - Refresh the app webview after each rebuild (Cmd/Ctrl+R)');
  console.log('');
  console.log('2. Packaged app with live static override');
  console.log(`   - export TUTTI_AUTOMATION_STATIC_DIR=${staticDir}`);
  console.log('   - Launch Tutti Desktop from the same shell so the env var is inherited');
  console.log('   - Keep this watch process running and refresh the app webview after rebuilds');
  console.log('');
}
console.log('Notes:');
console.log('- Python server changes still require restarting the app in Tutti');
console.log('- Browser dev with mock JSB remains faster for most UI work: pnpm dev:full');
console.log('');

const child = spawn('pnpm', ['--filter', '@automation/web', 'build', '--', '--watch'], {
  cwd: ROOT,
  env: process.env,
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
