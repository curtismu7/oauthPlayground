# Canonical Storage Services

One canonical service per data type. New code MUST use these; do not add new
localStorage/sessionStorage key schemes for data a canonical service already owns.

## The three canonical services

| Data type            | Canonical service                                      | Key scheme                          |
| -------------------- | ------------------------------------------------------ | ----------------------------------- |
| V9 flow credentials  | `src/services/v9/V9CredentialStorageService.ts`        | `unified_oauth_v9:<flowKey>`        |
| Tokens               | `src/services/unifiedTokenStorageService.ts`           | unified token storage keys          |
| Worker tokens        | `src/services/unifiedWorkerTokenService.ts`            | unified worker-token keys           |

### V9CredentialStorageService (V9 flow credentials)

- 4-layer persistence: memory cache → localStorage → IndexedDB → SQLite backup.
- Per-flow isolation via `flowKey` (normalized to a `v9:` prefix, e.g. `v9:rar`,
  `v9:pingone-par`).
- **Dependency:** it delegates layers 2–4 to
  `src/v8u/services/unifiedOAuthCredentialsServiceV8U.ts`. Any V8U decommission
  work MUST preserve that service (or first re-home the delegation) — see
  `docs/V8_DECOMMISSION_PLAN.md` and cross-reference this dependency there.
- The old `src/services/v9/core/V9FlowCredentialService.ts` (single localStorage
  key `v9:credentials`) was deleted in the storage-consolidation tranche; pages
  read the canonical store first, with a one-time inline fallback to the legacy
  key where it mattered (RAR flow).

### unifiedTokenStorageService (tokens)

All OAuth/OIDC token persistence (access/refresh/ID tokens) goes through this
service. Do not stash tokens under ad-hoc keys.

### unifiedWorkerTokenService (worker tokens)

Worker-app (client-credentials) tokens have their own lifecycle and cache; use
this service rather than the general token store.

## flows2 is separate — do not migrate it

`src/flows2` uses its own BFF/LMDB-backed layer via `useFlowCredentials` /
`useFlowStorage`. That is intentional: flows2 state lives server-side behind the
BFF, not in browser localStorage. Do NOT migrate flows2 onto the localStorage
canonicals above.

## Deliberately out of scope: OAuth-handshake sessionStorage state

The sessionStorage keys used mid-handshake (`oauth_state`, `code_verifier`,
`auth_code`, and friends) are shared across `NewAuthContext`,
`useAuthorizationCodeFlowController`, `AuthorizationCallback`, `AuthzCallback`,
and `ImplicitCallback`. They are NOT consolidated here on purpose: the reader
and writer often live on opposite sides of a full-page redirect, so any change
must be key-preserving end-to-end. That work needs a dedicated
session-handshake store as its own workstream. The deleted
`flowStorageService`'s key scheme (recoverable from git history) was a good
design starting point for it.

## Deleted in this tranche

- `src/services/v9/core/V9FlowCredentialService.ts` (superseded by V9CredentialStorageService)
- `src/services/flowStorageService.ts` (zero importers; key scheme noted above)
- `src/services/workerTokenDiscoveryService.ts` + its test (zero importers)
- `src/services/flowConfigService.ts`, `src/services/flowStateService.ts`
  (only reachable via the `commonImportsService` barrel; no consumer used them)
