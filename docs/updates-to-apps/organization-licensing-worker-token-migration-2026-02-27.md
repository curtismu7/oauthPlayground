# OrganizationLicensing — Worker Token localStorage Migration

**Date:** 2026-02-27  
**Commit:** (pending)  
**Type:** fix  
**Scope:** `src/pages/OrganizationLicensing.tsx`  
**Compatibility:** PATCH — internal change, no contract change  

---

## Summary

Migrated `OrganizationLicensing.tsx` from direct `localStorage.getItem('unified_worker_token')` reads to `unifiedWorkerTokenService.getTokenDataSync()`, per the storage policy in `docs/prompts/prompt-all.md` (Error 6 in `docs/migration/migrate_vscode.md`).

Pages must use `unifiedWorkerTokenService` for consistent worker token access — it reads from dual storage (IndexedDB + SQLite) and provides a typed `UnifiedWorkerTokenData` object instead of raw JSON parsing.

---

## Files Modified

- `src/pages/OrganizationLicensing.tsx` — replaced two raw localStorage reads + JSON.parse with `unifiedWorkerTokenService.getTokenDataSync()`

---

## Changes

### 1. Added import

```tsx
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
```

### 2. `initializeFlow()` — envId fallback

**Before:**
```tsx
const stored = localStorage.getItem('unified_worker_token');
if (stored) {
  const data = JSON.parse(stored);
  envId = data.credentials?.environmentId || '';
}
```

**After:**
```tsx
const data = unifiedWorkerTokenService.getTokenDataSync();
envId = data?.credentials?.environmentId || '';
```

### 3. `handleTokenUpdate` event listener

**Before:**
```tsx
const stored = localStorage.getItem('unified_worker_token');
if (stored) {
  const data = JSON.parse(stored);
  if (data.credentials?.environmentId && ...) { ... }
}
```

**After:**
```tsx
const data = unifiedWorkerTokenService.getTokenDataSync();
if (data?.credentials?.environmentId && ...) { ... }
```

---

## Why

- `localStorage` direct reads bypass dual storage (IndexedDB + SQLite) — token may be stale or absent if stored via the unified service
- Raw `JSON.parse` is fragile; `getTokenDataSync()` returns a typed `UnifiedWorkerTokenData | null`
- Consistent with all other V8/V8.5 pages that use `unifiedWorkerTokenService`

---

## Testing

- Visit `/organization-licensing` with a valid worker token stored via WorkerTokenSectionV8
- Environment ID should auto-populate from the unified service
- Token update events (`workerTokenUpdated`) should still trigger re-reads

---

## Rollback

```bash
git revert HEAD
```
