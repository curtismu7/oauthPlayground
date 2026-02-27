# environmentIdService.ts — new dual-storage service

**File:** `src/services/environmentIdService.ts`
**Change type:** New file
**Storage policy:** Fully compliant with `prompt-all.md` — IndexedDB + SQLite

---

## Purpose

Replaces the localStorage-only `EnvironmentIdServiceV8` as the canonical
write path for the environment ID. Implements the same dual-storage pattern
as `customDomainService`.

## Stores

| Store | Key | Notes |
| --- | --- | --- |
| IndexedDB | DB `oauth_playground_app_config`, store `settings`, key `environment_id` | Same DB as customDomainService — fast, local |
| SQLite (API) | `POST /api/settings/environment-id` | Backend-persisted, survives server restart |
| localStorage | `v8:global_environment_id` | Compat fallback for `EnvironmentIdServiceV8` consumers |

## Exports

### `loadEnvironmentId(): Promise<string | null>`

Async. Priority: IndexedDB → API → localStorage.
Backfills IndexedDB from API when IDB is empty.
Used in `useAutoEnvironmentId` on mount for async hydration.

### `saveEnvironmentId(id: string): Promise<void>`

Async. Writes IndexedDB + API concurrently (via `Promise.allSettled`), then
localStorage. Dispatches `environmentIdUpdated` window event.
Called by:
- `useAutoEnvironmentId.setEnvironmentId()`
- `unifiedWorkerTokenService.saveCredentials()` (cascade)
- `comprehensiveFlowDataService.saveSharedEnvironment()` (cascade)

### `getEnvIdFromIndexedDB(): Promise<string | null>`

Exported for testing and direct access if needed.

## Validation

Only accepts valid UUIDs (`/^[0-9a-f]{8}-[0-9a-f]{4}-.../i`).
Invalid values are silently rejected — no partial saves.

## Rollback

Delete the file. Revert `unifiedWorkerTokenService.ts` and
`comprehensiveFlowDataService.ts` to use `EnvironmentIdServiceV8` directly.
Update `useAutoEnvironmentId.ts` to remove the `loadEnvironmentId()` async call.
