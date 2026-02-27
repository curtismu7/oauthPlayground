# PingOne API: Proxy vs Direct and Tracking

## Behavior

- **Localhost** (`localhost` or `127.0.0.1`): Use the **backend proxy** for PingOne API calls.
  - All requests go to `/api/pingone/*`; the backend forwards to PingOne (avoids CORS).
  - Tracking: backend logs each call to `pingone-api.log` and can attach `x-pingone-calls-id` on the response; frontend can pull call details for the API display.

- **Custom domain** (e.g. `api.pingdemo.com`): Callers **may call PingOne direct** (browser → PingOne).
  - Direct URLs: `https://api.pingone.com`, `https://auth.pingone.com` (or `.eu`, `.asia`, `.ca` by region).
  - Tracking: when using `trackedFetch` with a direct PingOne URL, the client reports the call to the backend via `POST /api/pingone/log-call`, and the backend writes it to `pingone-api.log`. UI tracking (API call list) is unchanged.

So **API calls are tracked either way** (proxy path: backend logs; direct path: client reports to backend, which logs).

## Custom Domain & API Test page

**Path:** `/custom-domain-test` (sidebar: Admin & Configuration → Custom Domain & API Test)

Lets users:

- View and change the custom domain (same save/redirect behavior as Dashboard Config).
- Test backend APIs from the current origin: GET /api/health, GET /api/settings/custom-domain, GET /api/logs/list, GET /api/version. Each has a "Test" button that shows status and a short response preview. Useful to confirm the app works when using a custom domain (e.g. `https://api.pingdemo.com:3000`).

## Key files

| File | Purpose |
| --- | --- |
| `src/pages/CustomDomainTestPage.tsx` | Custom Domain & API Test page (domain + API test buttons) |
| `src/utils/pingOneApiConfig.ts` | `shouldUsePingOneProxy()`, `getPingOnePlatformBaseUrl(region)`, `getPingOneAuthBaseUrl(region)` |
| `src/utils/trackedFetch.ts` | Tracks all PingOne calls in UI; for direct URLs, also POSTs to `/api/pingone/log-call` |
| `server.js` | `POST /api/pingone/log-call` — accepts client-reported call and calls `logPingOneApiCall()` to write to `pingone-api.log` |

## Using proxy vs direct in code

- To **always use proxy** (current default): keep calling `pingOneFetch('/api/pingone/...')` or `fetch('/api/pingone/...')`. No change.
- To **use direct when on custom domain**: use `shouldUsePingOneProxy()`. If false, build the full PingOne URL with `getPingOnePlatformBaseUrl(region)` or `getPingOneAuthBaseUrl(region)` and call `trackedFetch(directUrl, init)`. The call will be tracked in the UI and in `pingone-api.log` via `POST /api/pingone/log-call`.

## Tests

- **`src/utils/pingOneApiConfig.test.ts`**: `shouldUsePingOneProxy()` true for localhost/127.0.0.1, false for custom domain; `getPingOnePlatformBaseUrl` / `getPingOneAuthBaseUrl` return empty string (proxy) vs regional base URL (direct).
- **`src/utils/trackedFetch.test.ts`**: Proxy (`/api/pingone/*`) calls fetch once, no log-call. Direct (`https://api.pingone.com/*` or `auth.pingone.com`) calls fetch twice (actual URL then `POST /api/pingone/log-call`); log-call payload includes url, method, status, operationName. Network error on direct still triggers log-call with status 0.

Run: `npm run test:run -- src/utils/pingOneApiConfig.test.ts src/utils/trackedFetch.test.ts`

## Console messages when using custom domain

- **WebSocket connection to 'wss://...' failed** — Vite HMR. Start the app with `./run.sh` (and choose your custom domain) so `VITE_HMR_HOST` is set and HMR is disabled. See also `docs/updates-to-apps/run-sh-updates.md` (Troubleshooting: WebSocket).
- **Worker Token credentials not configured** — Expected when worker token is not set up. Logged at `console.debug` only so it does not appear as an error in the console.
- **GET /api/logs/read 404** — The request did not reach the backend (e.g. backend not running). Start the full stack with `./run.sh`. When the backend is running, a missing log file returns 200 with empty content, not 404.

## Changelog

- **2025-02**: Added `pingOneApiConfig.ts` (proxy vs direct by host). Added `POST /api/pingone/log-call` for client-reported direct calls. Updated `trackedFetch` to report direct PingOne calls to the backend for logging. Added unit tests for both proxy and direct (localhost and custom domain).
