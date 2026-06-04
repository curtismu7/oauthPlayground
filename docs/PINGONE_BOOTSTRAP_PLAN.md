# Plan: Track + Bootstrap the PingOne apps oauthPlayground needs

**Goal:** (1) keep a single source of truth for the PingOne apps/resources/scopes/redirect-URIs the
playground uses, and (2) a one-command bootstrap that creates them in a user's own PingOne
environment — so a new user isn't hand-configuring apps in the console.
**Status:** Plan + initial tracking artifact (`pingone/manifest.json`). No bootstrap code yet.
**Date:** June 2026.

---

## 1. What exists today

**oauthPlayground:** no provisioning. It currently **borrows AI-Demo's PingOne apps** — the `.env`
(gitignored) was populated by sourcing AI-Demo's worker/user client IDs+secrets. There is **no**
bootstrap script and **no** config tracking (only `.env.example` placeholders). This is the gap.

**AI-Demo:** has a complete, proven bootstrap we mirror:
- `demo_api_server/scripts/bootstrapPingOne.js` (CLI: browser/terminal/env cred input, idempotent,
  `--recreate-apps` / `--wipe-environment`, writes `.env`).
- `demo_api_server/services/pingoneProvisionService.js` (the engine: `getWorkerToken` →
  `createResourceServer` / `createScopes` / `createApplication` / `grantScopesToApplication` /
  `createUser` / `setUserPassword`; lookup-by-name idempotency; PUT-merge drift correction).
- `scope-topology.json` — the **declarative manifest** of resources/scopes/apps it provisions.
- npm scripts: `pingone:bootstrap`, `pingone:recreate`, `pingone:wipe`, `setup:fresh`.

**Key facts learned from AI-Demo (carry over):**
- Worker token: `client_credentials` with **client_secret_basic**; worker app needs the
  **Identity Data Admin** role to create apps/users/resources.
- App create: `POST /environments/{env}/applications` with UPPERCASE `grantTypes`,
  `tokenEndpointAuthMethod`, `responseTypes: ['CODE']` + `pkceEnforcement: 'S256_REQUIRED'` for
  auth-code web apps. Update = **full PUT** (strip read-only fields).
- **WORKER apps can't hold scope grants** — they authorize via roles. Non-worker apps get scopes via
  `POST /applications/{id}/grants` with `{ resource:{id}, scopes:[{id}] }`.
- Idempotency = lookup-by-name, then PUT-merge on drift.
- Secrets are written to `.env` after creation (never committed); `SESSION_SECRET` preserved.

---

## 2. The tracking artifact (done): `pingone/manifest.json`

A declarative spec of exactly what the playground needs — the single source of truth the bootstrap
reads. It defines:
- **1 resource server** `OAuth Playground API` (audience `oauthplayground.api`) with `read`/`write`
  scopes — so the playground can demo scoped tokens, introspection, and token-exchange audiences.
- **User app** (`WEB_APP`, CLIENT_SECRET_POST, PKCE S256) with the interactive grants
  (authorization_code, refresh, device, token-exchange, CIBA) and all callback paths.
- **SPA app** (optional, `SINGLE_PAGE_APP`, auth method `NONE`) to demo PKCE-without-secret.
- **Worker app** (`WORKER`, client_secret_basic, Identity Data Admin role) for client-credentials /
  worker-token AND the bootstrap's own Management-API calls.
- **demoUser** for interactive login.
- **Redirect URIs** = hosts × paths (both `https://localhost:3000` and `https://api.ping.demo:3000`).

Client IDs/secrets are **not** in the manifest — they're written to `.env` post-creation.

---

## 3. Bootstrap implementation plan (mirror AI-Demo, scoped)

| Piece | File (new in oauthPlayground) | Source to adapt |
|-------|-------------------------------|-----------------|
| Provision engine | `scripts/pingone/provisionService.cjs` | AI-Demo `pingoneProvisionService.js` — keep `getWorkerToken/initialize/makeRequest/createResourceServer/createScopes/createApplication/grantScopesToApplication/createUser/setUserPassword`; drop banking/MCP/agent-specific apps |
| Manifest reader | (inline) | reads `pingone/manifest.json`, expands redirectUris = hosts × paths |
| CLI | `scripts/pingone/bootstrap.cjs` | AI-Demo `bootstrapPingOne.js` — cred input (env vars / terminal prompt), `--recreate`, confirm, write `.env` |
| .env writer | (in CLI) | write `VITE_PINGONE_*` keys from created app IDs/secrets; preserve existing values |
| npm scripts | `package.json` | `"pingone:bootstrap"`, `"pingone:recreate"` |
| Docs | this file + `.env.example` update | — |

**Flow:** prompt for env id + region + **worker creds** (a worker app the user creates once with
Identity Data Admin, or reuses) → worker token → for each resource/scope/app/user in the manifest:
lookup-by-name, create-or-PUT-merge, grant scopes (non-worker apps), assign role (worker), register
both-host redirect URIs → write `VITE_PINGONE_*` to `.env`.

CommonJS (`.cjs`) since the repo is ESM; reuse the vault loader pattern if secrets should land in the
vault instead of `.env`.

---

## 4. Apps we've touched this session (current tracked state)

Recorded so we know what's live in the borrowed AI-Demo env (`d02d2305-…`, region `com`):

| App | Client ID | Type | Used for | Changes we made |
|-----|-----------|------|----------|-----------------|
| Demo User App | `b7d00976-…` | WEB_APP, CLIENT_SECRET_POST, PKCE S256 | flows2 Authorization Code (real) | **Added redirect URIs:** `https://localhost:3000/{authz-callback,callback,v2/flows/authz-callback}` + `https://api.ping.demo:3000/v2/flows/authz-callback` |
| Demo Worker | `15881ac7-…` | WORKER, client_secret_basic | flows2 Client Credentials (real) + Management API (our PingOne edits) | none (reused) |
| Demo AI Agent / MCP Exchanger | `d21c5124-…` / `d3f8fead-…` | WEB_APP | (available for token-exchange demos) | none |

> These are AI-Demo's apps. The bootstrap will create oauthPlayground's **own** equivalents
> (per the manifest) so the playground is self-contained.

---

## 5. Phasing

| Phase | Deliverable |
|-------|-------------|
| P1 ✅ | `pingone/manifest.json` (tracking source of truth) + this plan |
| P2 | `provisionService.cjs` — port the engine; unit-test against the manifest (dry-run: print the API calls) |
| P3 | `bootstrap.cjs` CLI — cred input + confirm + run + write `.env`; `npm run pingone:bootstrap` |
| P4 | Idempotency + `--recreate` + redirect-URI sync for both hosts; verify re-run is clean |
| P5 | `.env.example` + README "Provision your PingOne" section; optional vault integration |

---

## 6. Open decisions

1. **One user app with many grants vs. split per grant family.** The manifest starts with one
   broad user app (auth-code/device/CIBA/token-exchange). If PingOne rejects a combo, P2 splits it.
   (Recommend: start broad, split on validation failure.)
2. **Secrets to `.env` or the vault?** AI-Demo writes `.env`. The playground now has the vault — we
   could write secrets there instead. (Recommend: `.env` for parity + simplicity; vault optional.)
3. **Worker app: create or require pre-existing?** Creating a worker app needs an *existing*
   admin-roled worker to call the Management API (chicken-and-egg). AI-Demo asks the user to make one
   worker app once. (Recommend: same — prompt for a pre-made worker, bootstrap creates the rest.)
4. **Legacy flows (implicit/hybrid/ROPC):** omitted by default (OAuth 2.1 deprecates them). Add a
   `legacy` app entry only if those flows must run real. (Recommend: omit; they stay mock-only.)
