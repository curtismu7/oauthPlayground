# Apps in This Repo — Scope for prompt-all.md

This file lists the **apps and services** in the oauth-playground repo that are covered by the AI Engineering Safety & Efficiency rules in `prompt-all.md` (mirrored in `.cursor/rules/apps-and-services-updates.mdc`). Use it for inventory-first impact analysis and for understanding backend requirements.

---

## Apps and services

| App / service        | Description                          | Key entry / doc                    |
| -------------------- | ------------------------------------ | ---------------------------------- |
| **OAuth Playground** | Main frontend (Vite, React, TS)      | `src/App.tsx`, routes under `src/` |
| **Backend API**      | Express server (HTTPS, port 3001)    | `server.js`, `/api/*`               |
| **Dashboard**        | Dashboard page and Config section    | `docs/updates-to-apps/dashboard-updates.md` |
| **Menu (Ping UI)**   | Sidebar menu, config, resize, DnD     | `docs/updates-to-apps/menu-updates.md`      |
| **run.sh**           | Dev startup: frontend + backend + SSL| `docs/updates-to-apps/run-sh-updates.md`    |

When you change code under `src/`, `server*.js`, `docs/updates-to-apps/`, or `scripts/`, follow prompt-all (inventory, change packet, Definition of Done, storage policy for persisted config/UI).

---

## 404 for /api (logs, custom-domain, health)

When the app is open at `https://api.pingdemo.com:3000` (or your custom domain), requests to `/api/logs/read`, `/api/settings/custom-domain`, and `/api/health` go through Vite’s proxy to the **backend on port 3001**.

If you see **404 (Not Found)** in the browser console for these URLs:

- **Cause**: The backend is not running.
- **Fix**: Start the full stack so both frontend and backend run: **`./run.sh`** from the project root. That starts the backend (HTTPS on 3001) and the frontend (Vite on 3000); Vite proxies `/api` to the backend.
- **If you only run `npm run dev`**: Only the frontend runs; the proxy has no backend to forward to, so `/api/*` can return 404.

See `docs/updates-to-apps/run-sh-updates.md` (Troubleshooting) for more detail.

---

## Per-app docs in this folder

- **dashboard-updates.md** — Dashboard UI, API Status, Config (custom domain), Quick Access, Recent Activity.
- **menu-updates.md** — Ping UI sidebar, `sidebarMenuConfig.ts`, resize, drag-and-drop.
- **run-sh-updates.md** — Custom domain, SSL, hosts file, frontend/backend URLs, troubleshooting 404 for /api.
- **CredentialManagement** — Route `/credential-management`. Hosts two tabs: **Flow Credentials** (import/export/clear credential sets) and **Token Tester** (JWT decode, claims display, PingOne API validation). V8 Worker Token Modal (`WorkerTokenModalV8` + `useGlobalWorkerToken`). The old `/worker-token-tester` route now redirects here. See `docs/migration/V9_MIGRATION_LESSONS_LEARNED.md` § "Page Consolidation: 4 → 3 Pages" for full change log.

---

## References

- **Rules**: `prompt-all.md` (root); Cursor rule: `.cursor/rules/apps-and-services-updates.mdc`.
- **Storage policy**: Dual storage (IndexedDB + SQLite via API) for config/UI — see prompt-all § STORAGE POLICY; examples: `customDomainService`, `/api/settings/*`, `settingsDB`.
