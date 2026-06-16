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
- Frontend dev server: `pnpm dev`
- Build frontend into `static/`: `pnpm build:web`
- Package Tutti app: `pnpm package:tutti-app`
- Python server tests: `pnpm test:server`

When changing user-visible copy, update `web/src/i18n/messages/en.json` and `web/src/i18n/messages/zh-CN.json` together.

When changing CLI commands, keep `tutti.cli.json`, `COMMANDS.md`, and the `/tutti/cli/*` handlers in `server.py` synchronized.
