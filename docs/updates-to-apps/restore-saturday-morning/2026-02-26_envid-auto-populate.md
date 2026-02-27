# Changelog — Environment ID Auto-Populate

**Date:** 2026-02-26
**Compatibility:** MINOR (additive, backward compatible)
**Affected apps/services:** 9 pages + 2 services + 2 new files

---

## Summary

Built a 3-layer system so users never have to type the PingOne environment ID
again once a worker token is configured:

1. **`useAutoEnvironmentId` hook** reads from all 5 known storage locations in
   priority order and stays reactive to `environmentIdUpdated` window events.
2. **Cascade sync** in `unifiedWorkerTokenService` and `comprehensiveFlowDataService`
   writes the environment ID to the canonical `EnvironmentIdServiceV8` store
   whenever credentials are saved, so any flow that configures a worker token
   propagates the envId everywhere.
3. **9 pages updated** to use `readBestEnvironmentId()` as their initial state,
   replacing empty strings or single-source lookups.

Additionally fixed: `HelioMartPasswordReset` crash caused by calling
`PageLayoutService.createPageLayout()` inside `useMemo` (styled-components v6
calls `useContext` internally → Rules of Hooks violation).

---

## Scope

### New files

- `src/hooks/useAutoEnvironmentId.ts`
- `src/components/AutoEnvironmentIdInput.tsx`

### Modified files

- `src/services/unifiedWorkerTokenService.ts` — cascade sync on `saveCredentials()`
- `src/services/comprehensiveFlowDataService.ts` — cascade sync on `saveSharedEnvironment()`
- `src/pages/security/HelioMartPasswordReset.tsx` — hooks crash fix + envId auto-populate
- `src/pages/PingOneUserProfile.tsx`
- `src/pages/PingOneWebhookViewer.tsx`
- `src/pages/PingOneAuditActivities.tsx`
- `src/pages/PasskeyManager.tsx`
- `src/pages/flows/JWTBearerTokenFlowV7.tsx`
- `src/pages/flows/RARFlowV7.tsx`
- `src/v8/pages/DeleteAllDevicesUtilityV8.tsx`
- `src/v8/pages/MFADeviceCreateDemoV8.tsx`
- `src/v8/flows/EmailMFASignOnFlowV8.tsx`
- `src/services/pageLayoutService.ts` — debug instrumentation removed (no functional change)

---

## Compatibility

**MINOR** — all changes are additive:

- New hook and component can be ignored by consumers that don't import them.
- Pages fall back gracefully if no envId is stored (returns `''`).
- Cascade sync in services is wrapped in try/catch and is non-breaking on failure.
- `createPageLayout()` moved to module scope is functionally equivalent to the
  previous `useMemo` call (same config, same result, same cache key).

---

## Contract changes

### `unifiedWorkerTokenService.saveCredentials()`

**Before:** Saved to localStorage, IndexedDB, unified storage, SQLite.
**After:** Same as before + additionally calls `EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId)`.
No breaking change to the function signature or return value.

### `comprehensiveFlowDataService.saveSharedEnvironment()`

**Before:** Saved to localStorage only.
**After:** Same + async cascade to `EnvironmentIdServiceV8` (best-effort, errors silently swallowed).
No breaking change.

---

## Storage policy

**Fully compliant with `prompt-all.md` dual-storage requirement.**

### New service: `src/services/environmentIdService.ts`

Implements the same dual-storage pattern as `customDomainService`:

| Store | Key/Endpoint | Purpose |
| --- | --- | --- |
| IndexedDB | `oauth_playground_app_config` / `settings` / key `environment_id` | Fast client read, survives page refresh |
| SQLite (API) | `POST /api/settings/environment-id` | Survives server restart, restorable across sessions |
| localStorage | `v8:global_environment_id` | Compat with `EnvironmentIdServiceV8` and legacy consumers |

On **read** (`loadEnvironmentId()`): IndexedDB → API → localStorage (with backfill).
On **write** (`saveEnvironmentId()`): writes IndexedDB + API concurrently, then localStorage; dispatches `environmentIdUpdated`.

### Updated cascade paths

- `unifiedWorkerTokenService.saveCredentials()` → `saveEnvironmentId()` (dual store)
- `comprehensiveFlowDataService.saveSharedEnvironment()` → `saveEnvironmentId()` (dual store)
- `useAutoEnvironmentId` hook → on mount calls `loadEnvironmentId()` async to hydrate from IndexedDB/API

---

## Testing

### Manual smoke test

1. Clear all browser storage and localStorage.
2. Navigate to any updated page (e.g. `/security/password-reset`).
3. All environment ID fields should be empty.
4. Configure a worker token (enter Environment ID + Client ID + Secret, click Save).
5. Navigate to any other page (e.g. `/v8/delete-all-devices`, `/user-profile`).
6. Environment ID fields should be pre-filled without user input.
7. Confirm no React console errors on `/security/password-reset`.

### Biome

Run: `npx @biomejs/biome check src/hooks/useAutoEnvironmentId.ts src/components/AutoEnvironmentIdInput.tsx ...`
Result: 0 errors · 6 warnings (all suppressed with biome-ignore, pre-existing or intentional)

---

## Rollback plan

```bash
# Remove new files
rm src/hooks/useAutoEnvironmentId.ts
rm src/components/AutoEnvironmentIdInput.tsx

# Revert services and pages
git checkout HEAD -- \
  src/services/unifiedWorkerTokenService.ts \
  src/services/comprehensiveFlowDataService.ts \
  src/pages/PingOneUserProfile.tsx \
  src/pages/PingOneWebhookViewer.tsx \
  src/pages/PingOneAuditActivities.tsx \
  src/pages/PasskeyManager.tsx \
  src/pages/flows/JWTBearerTokenFlowV7.tsx \
  src/pages/flows/RARFlowV7.tsx \
  src/v8/pages/DeleteAllDevicesUtilityV8.tsx \
  src/v8/pages/MFADeviceCreateDemoV8.tsx \
  src/v8/flows/EmailMFASignOnFlowV8.tsx

# HelioMartPasswordReset hooks crash fix — do NOT revert unless you want the crash back
# git checkout HEAD -- src/pages/security/HelioMartPasswordReset.tsx
```
