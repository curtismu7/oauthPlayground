# Version Consolidation — Phase 0 Inventory (2026-07-08)

## Codebase by versioned directory

| Path | Files | Role | Phase 1 status |
|------|------:|------|----------------|
| `src/flows` | 67 | OAuth/OIDC flows (real PingOne) | **Phase 2 done** — folder + routes `/flows/*` |
| `src/mfa` | 261 | Unified MFA + shared modals | **Phase 4 done** — was `v8`; routes `/mfa` + legacy `/v8/*` |
| `src/lab` | 88 | OAuth lab UI | **Phase 5 done** — was `v8u`; routes `/lab/*` + legacy `/v8u/*` |
| `src/v7` | — | Mock settings (legacy) | **Phase 6 done** — deleted; mock UI → `flows/mock-ui/` |
| `src/flows/specialty` | 17 | Specialty/educational flows | **Phase 7 done** — was `pages/flows/v9` |
| `src/platform` | many | Platform services (not legacy) | **Phase 3 done** — was `services/v9` |

## Phase 1 canonical routes (live)

| Canonical | Legacy redirect |
|-----------|-----------------|
| `/use-cases` | `/v2/use-cases` |
| `/flows/client-credentials` | `/v2/flows/client-credentials` |
| `/flows/authorization-code` | `/v2/flows/authorization-code` |
| `/flows/device-authorization` | `/v2/flows/device-authorization` |
| `/flows/token-exchange` | `/v2/flows/token-exchange` |
| `/flows/token-introspection` | `/v2/flows/token-introspection` |
| `/flows/userinfo` | `/v2/flows/userinfo` |
| `/flows/token-revocation` | `/v2/flows/token-revocation` |
| `/flows/par` | `/v2/flows/par` |
| `/flows/refresh-token` | `/v2/flows/refresh-token` |
| `/flows/oidc-discovery` | `/v2/flows/oidc-discovery` |
| `/flows/dpop` | `/v2/flows/dpop` |
| `/flows/redirectless` | `/v2/flows/redirectless` |
| `/flows/implicit-hybrid` | `/v2/flows/implicit-hybrid` |
| `/flows/ropc` | `/v2/flows/ropc` |
| `/flows/saml-bearer` | `/v2/flows/saml-bearer` |
| `/mfa` | `/v8/unified-mfa` |
| `/lab/token-monitoring` | `/v8u/token-monitoring` |
| `/lab/flow-comparison` | `/v8u/flow-comparison` |
| `/lab/oauth-authz` | `/v8u/unified/oauth-authz` (dual-mount for `:step`) |
| `/flows/worker-token` | `/flows/worker-token-v9` |

Constants: `src/config/canonicalRoutes.ts`

## Sidebar

`sidebarMenuConfig.ts` now links only canonical paths for flows, MFA, lab, and worker token.

## Still versioned in nav (Phase 7+)

- `/flows/*-v9`, `*-v1` specialty flows
- `/v8/delete-all-devices`, `/v8/mfa/*` sub-routes
- `/v7/settings`
- `/v9/*` docs and debug popout

## Regression checks (Phase 1)

1. `npm run build` passes
2. `/flows/client-credentials` loads (not only `/v2/...`)
3. `/v2/flows/client-credentials` redirects to `/flows/client-credentials`
4. `/mfa` loads; `/v8/unified-mfa` redirects
5. Sidebar links use canonical paths
6. E2E: `/v8u/unified` still works (unchanged path)

## Phase 2 (done)

- `git mv src/flows2` → `src/flows`
- Import paths updated in `App.tsx`, `design/__tests__`, `CombinedTokenPage`, `V7MCIBAFlowV9`
- Session storage keys (`flows2:authz:pending`, etc.) unchanged for backward compatibility

## Phase 3 (done)

- `git mv src/services/v9` → `src/platform`
- All `@/services/v9/*` and relative import paths updated across `src/` and `scripts/`
- Service class names (`V9*`) unchanged — symbol rename is Phase 8

## Phase 4 (done)

- `git mv src/v8` → `src/mfa`
- `@/v8/*` path aliases → `@/mfa/*` in `tsconfig.json` and `vite.config.ts`
- ~200+ import sites updated; URL routes `/v8/*` unchanged (legacy redirects)
- `V8*` symbol names unchanged — Phase 8

## Phase 5 (done)

- `git mv src/v8u` → `src/lab`
- `@/v8u/*` import paths → `@/lab/*` across `src/` and `scripts/`
- URL routes `/v8u/*` unchanged (legacy redirects to `/lab/*` where applicable)
- Session keys (`v8u_flow_settings_*`, `v8u-oauth-authz-*` state prefixes) unchanged for browser back-compat
- `V8U*` symbol names unchanged — Phase 8

## Phase 6 (done)

- Deleted `src/v7/` (orphan components + broken tests removed)
- Retained mock UI: `src/flows/mock-ui/` (`V7MMockBanner`, `mockFlowStyles`, `mockMode`)
- Settings page → `src/pages/MockServerSettingsPage.tsx`; legacy route `/v7/settings` unchanged
- `v7m:mode` localStorage key unchanged for browser back-compat

## Phase 7 (done)

- `git mv src/pages/flows/v9` → `src/flows/specialty`
- Import paths updated in `App.tsx` and all 17 specialty flow files (`../../../` → `../../`, framework/mock-ui → sibling paths)
- URL routes (`/flows/*-v9`, etc.) unchanged — Phase 8 symbol/route cleanup

## Phase 8a (done)

- `App.tsx`: `Flows2*` lazy components → `Flows*`
- `V9_COLORS` → `COLORS`; `V9ColorStandards.ts` → `ColorStandards.ts`
- `V7MMockBanner` → `MockBanner` in `flows/mock-ui/`
- `platform/mock/`: `V9Mock*` files and symbols → `Mock*`

## Phase 8b (done)

- `platform/`: all `V9*` / `v9*` service files renamed (e.g. `ModernMessagingService`, `CredentialStorageService`, `platformFlowHeaderService`)
- `components/v9/V9ModernMessagingComponents.tsx` → `components/ModernMessagingComponents.tsx`
- Symbols: `V9ModernMessagingService` → `ModernMessagingService`, `V9CredentialStorageService` → `CredentialStorageService`, etc.
- `V9LoggingService` export → `PlatformLoggingService` (file `LoggingService.ts`)

## Phase 8c (done)

- `mfa/`: 185 `*V8*` files renamed (strip `V8` from filenames)
- Symbols: `*V8` suffix removed from exports/imports (~843 files touched)
- Collision fix: `MFAFlowV8` router → `MFARouterFlow.tsx` (pages `MFAFlow.tsx` unchanged)
- Singleton fix: `workerTokenConfigService` export (class `WorkerTokenConfigService`)

## Phase 8 remaining (8d)

| Batch | Scope |
|-------|--------|
| **8d** | `lab/`: `*V8U` components/services; specialty flow `*V9` filenames; canonical routes for `/flows/*-v9` |

## Next phases

Phase 9 CI test scope.
