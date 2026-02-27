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

## Troubleshooting: 404 for /api (logs, custom-domain, health)

When the app is open at `https://api.pingdemo.com:3000` (or your custom domain), requests to `/api/logs/read`, `/api/settings/custom-domain`, and `/api/health` go through Vite’s proxy to the backend on port 3001. If you see **404 (Not Found)** for these URLs in the browser console, the backend is almost certainly **not running**.

- **Fix**: Start the full stack so both frontend and backend run: `./run.sh` (from the project root). That starts the backend (HTTPS on 3001) and the frontend (Vite on 3000); Vite proxies `/api` to the backend.
- **If you only run `npm run dev`**: Only the frontend runs. The proxy has no backend to forward to, so `/api/*` requests can return 404. Use `./run.sh` for logs, custom domain save, and health checks to work.
- **Log files**: `GET /api/logs/read?file=pingone-api.log&...` returns **200 with empty content** when the file does not exist yet (e.g. no PingOne API calls have been logged). So a 404 for `/api/logs/read` means the request did not reach the backend (proxy/backend down).

## Troubleshooting: WebSocket connection failed (wss://...)

If you see **WebSocket connection to 'wss://api.pingdemo.com:3000/?token=...' failed** in the console, that is Vite’s Hot Module Replacement (HMR) client trying to connect. With a custom domain and self-signed cert, the browser often blocks or drops the HMR WebSocket; the app still works, but hot reload does not.

- **Fix**: Start the app with **`./run.sh`** and use the custom domain when prompted. The script sets `VITE_HMR_HOST` so HMR is disabled and the WebSocket is not used. You will not get hot reload when using a custom domain, but the console error goes away.
- **If you started with `npm run dev`**: Set `VITE_HMR_HOST` to your domain (e.g. `api.pingdemo.com`) before starting, or start via `./run.sh` instead.

---

## 5. Log tail options (interactive)

- **Status**: Done.
- **Behavior**: After servers start, run.sh prompts “Would you like to tail a log file? (Y/n)”. If yes, it shows 12 options:
  - **1–8**: PingOne/flow logs (pingone-api.log, real-api.log, server.log, sms, email, whatsapp, voice, fido).
  - **9**: `backend.log` (project root) — same as `tail -f backend.log`.
  - **10**: `frontend.log` (project root) — same as `tail -f frontend.log`.
  - **11**: `logs/startup.log`.
  - **12**: No tail — exit without following a log.
- **Default**: If the user presses Enter at “Enter your choice (1–12)”, the script uses **option 1 (pingone-api.log)**. The prompt states: “Default: 1 (pingone-api.log). Option 12 = no tail.”
- **Quick tail commands** (shown in the final banner): `tail -f backend.log`, `tail -f frontend.log`, `tail -f logs/server.log`, and `tail -f logs/pingone-api.log`.
- **Debug Log Viewer** (floating panel / popout): The same startup log types are selectable in the app’s Debug Log Viewer (Live tail • Popout window). The dropdown lists the 11 run.sh log options first (PingOne API, Real API, Server, SMS, Email, WhatsApp, Voice, FIDO2, Backend, Frontend, Startup), then any additional files returned by the log API.

---

## Changelog

- **2025-02**: run-config-ssl.js added; custom domain and cert stored in SQLite; run.sh loads config and passes cert paths to backend; optional hosts file update prompt; server.js getCertPaths(); --change-domain flag and help updated.
- **2025-02**: Log tail options: option 12 (No tail) added; options 9/10 use project-root backend.log and frontend.log; default choice is 1 (pingone-api.log); banner shows tail -f backend.log, tail -f frontend.log, tail -f logs/server.log.
