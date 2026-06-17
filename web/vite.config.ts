import path from 'node:path';
import { createRequire } from 'node:module';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { tuttiUISystemDev } from '@tutti-os/ui-system/dev-vite';

const require = createRequire(import.meta.url);
const reactPath = path.dirname(require.resolve('react/package.json'));
const reactDomPath = path.dirname(require.resolve('react-dom/package.json'));
const devApiTarget = process.env.AUTOMATION_DEV_API_TARGET || 'http://127.0.0.1:8787';
const isWatchBuild = process.argv.includes('--watch');

export default defineConfig({
  plugins: [react(), tailwindcss(), tuttiUISystemDev()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: reactPath,
      'react-dom': reactDomPath,
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../static'),
    emptyOutDir: !isWatchBuild,
    assetsDir: 'assets',
  },
  publicDir: 'public',
  server: {
    proxy: {
      '/api': devApiTarget,
      '/tutti': devApiTarget,
    },
  },
});
