# Version Consolidation — Phase 0 Inventory (2026-07-08)

## Codebase by versioned directory

| Path | Files | Role | Phase 1 status |
|------|------:|------|----------------|
| `src/flows` | 67 | OAuth/OIDC flows (real PingOne) | **Phase 2 done** — folder + routes `/flows/*` |
| `src/v8` | 261 | Unified MFA + shared modals | **`/mfa` alias** |
| `src/v8u` | 88 | OAuth lab UI | **`/lab/*` aliases** |
| `src/v7` | 10 | Mock settings (legacy) | Unchanged — delete Phase 6 |
| `src/pages/flows/v9` | ~28 | Specialty flows | Unchanged — migrate Phase 7 |
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

## Next phases

Phase 4 `v8` → `mfa` folder; Phase 5 retire `v8u`; Phase 6 delete `v7`.
