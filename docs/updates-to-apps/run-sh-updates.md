# run.sh (Dev Server) Updates — Tracking

Changes to the development startup script and related tooling so we can restore behavior after a regression.

## Entry point

- **Primary script**: `scripts/development/run.sh` (root `run.sh` may be a symlink to it).
- **SSL/domain helper**: `scripts/development/run-config-ssl.js` — loads or prompts for custom domain, generates cert, persists in SQLite.

---

## 1. Custom domain and SSL certificate

- **Status**: Done.
- **Behavior**:
  - On startup, `run.sh` runs `node scripts/development/run-config-ssl.js` (or with `--prompt` when `--change-domain` is passed).
  - Script reads/writes **SQLite** DB: `config/run-config.db`, table `run_ssl_config` (single row: `domain`, `cert_path`, `key_path`, `updated_at`).
  - If no saved config or `--prompt`: prompts for "Custom domain [api.pingdemo.com]"; generates self-signed cert with `openssl` for that CN; saves paths and domain to DB.
  - Script prints to stdout: `FRONTEND_HOST`, `BACKEND_HOST`, `SSL_CERT_PATH`, `SSL_KEY_PATH`; `run.sh` evals this and exports for the backend.
  - Backend (`server.js`) uses `getCertPaths()`: if env `SSL_CERT_PATH` and `SSL_KEY_PATH` are set and files exist, use them; else fall back to `generateSelfSignedCert()` (localhost cert in `certs/`).
- **Flags**: `./run.sh --change-domain` prompts to change domain and regenerate cert.
- **Persistence**: `config/run-config.db` (add to `.gitignore`); certs in `certs/<sanitized-domain>.crt` and `.key`.

---

## 2. Hosts file prompt

- **Status**: Done.
- **Behavior**: After loading SSL config, `run.sh` calls `ask_and_update_hosts_file()`.
  - Asks: "Add/update hosts file so \<domain\> resolves to 127.0.0.1? (y/N):".
  - If yes: appends `127.0.0.1 \<domain\>` to `/etc/hosts` (macOS/Linux) via `sudo`; if entry already present, skips.
  - Skipped when `-quick` or `-default`.
- **Purpose**: So the custom domain (e.g. api.pingdemo.com) resolves locally without editing hosts by hand.

---

## 3. Frontend/backend URLs and HMR

- **Status**: Done.
- **Behavior**:
  - `FRONTEND_HOST` / `BACKEND_HOST` come from run-config-ssl (default api.pingdemo.com).
  - `FRONTEND_URL="https://${FRONTEND_HOST}:3000"`, `BACKEND_URL="https://${BACKEND_HOST}:3001"`.
  - Before starting Vite: `export VITE_HMR_HOST="$FRONTEND_HOST"` so HMR WebSocket uses the custom domain (avoids connection to localhost when using api.pingdemo.com).
  - Vite started with `--host` so the dev server is reachable on the custom host.
- **Backend**: Started with `BACKEND_PORT=3001` and inherits `SSL_CERT_PATH` / `SSL_KEY_PATH` from the shell (exported after eval).
- **Dashboard Config**: Before starting Vite, `run.sh` exports `VITE_PUBLIC_APP_URL="https://${FRONTEND_HOST}:3000"` so the Dashboard’s Config section can show the custom domain (e.g. <https://api.pingdemo.com:3000>). See `docs/updates-to-apps/dashboard-updates.md` §6.

---

## 4. Help and flags

- **Flags**: `-quick`, `-default`, `--change-domain` (prompt to change custom domain and regenerate cert).
- **Help**: `./run.sh --help` documents options; "DEFAULT BEHAVIOR" includes step 2b for custom domain and hosts file.

---

## Key files to restore

| File | Purpose |
| ---- | ------- |
| `scripts/development/run.sh` | Main script; load_ssl_config, ask_and_update_hosts_file, resize/hosts in help |
| `scripts/development/run-config-ssl.js` | SQLite + prompt + openssl cert generation; stdout var=value for eval |
| `server.js` | getCertPaths() prefers env SSL_CERT_PATH/SSL_KEY_PATH |
| `config/run-config.db` | SQLite DB (local only; in .gitignore) |
| `.gitignore` | config/run-config.db and -journal |

---

## Changelog

- **2025-02**: run-config-ssl.js added; custom domain and cert stored in SQLite; run.sh loads config and passes cert paths to backend; optional hosts file update prompt; server.js getCertPaths(); --change-domain flag and help updated.
