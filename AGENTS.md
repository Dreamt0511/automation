# AGENTS.md

## Scope

This file applies to the whole `automation` repository.

## Layout

- `web/`: React frontend (Vite)
- `static/`: Vite build output consumed by `server.py` (generated, not committed)
- `server.py`: Python HTTP server and automation runtime
- `bootstrap.sh`: Tutti app entrypoint
- `tutti.app.json` / `tutti.cli.json`: App Center and CLI manifests

## Development

- Install: `pnpm install`
- Browser UI dev with mock JSB + local API: `pnpm dev:full`
- Frontend-only dev server: `pnpm dev`
- Local API server only: `pnpm dev:server`
- Tutti host static watch (refresh webview after rebuild): `pnpm dev:host`
- Build frontend into `static/`: `pnpm build:web`
- Package Tutti app: `pnpm package:tutti-app`
- Python server tests: `pnpm test:server`

### Dev modes

- `pnpm dev:full`: best default for UI work. Runs `server.py` on `127.0.0.1:8787` and Vite on `5173`. Vite proxies `/api` and `/tutti`. In dev, the frontend installs a mock `window.tuttiExternal` only when the host has not already injected one.
- `pnpm dev:host`: rebuilds `static/` on file changes for validation inside Tutti Desktop. Keep the app open and refresh the webview after each rebuild. Prefer importing the local app from this repository root. If you are running a packaged copy from `dist/tutti-app/automation`, export `TUTTI_AUTOMATION_STATIC_DIR` to this repo's `static/` directory and launch Tutti from the same shell so the app process inherits it.
- `server.py` reads `TUTTI_AUTOMATION_STATIC_DIR` when present; otherwise it serves `TUTTI_APP_PACKAGE_DIR/static`.

### UI System

The frontend uses `@tutti-os/ui-system` for shared primitives (Button, Dialog, DropdownMenu, Popover, etc.).

- Entry imports: `@tutti-os/ui-system/styles.css`, then `web/src/style.css` (Tailwind v4), then `web/src/styles.css` (Automation layout).
- Vite plugins: `@tailwindcss/vite` and `tuttiUISystemDev()` from `@tutti-os/ui-system/dev-vite`.
- Optional live ui-system source sync: run `pnpm --filter @tutti-os/ui-system dev:server` in the nextop repo, then start `pnpm dev`. Without the dev server, Vite falls back to the linked package in `node_modules`.

When changing user-visible copy, update `web/src/i18n/messages/en.json` and `web/src/i18n/messages/zh-CN.json` together.

When changing CLI commands, keep `tutti.cli.json`, `COMMANDS.md`, and the `/tutti/cli/*` handlers in `server.py` synchronized.
