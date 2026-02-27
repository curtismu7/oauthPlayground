# HelioMart Password Reset — Updates

Tracking changes to the HelioMart Password Reset demo page and its supporting hook.

**Page:** `/security/password-reset`  
**File:** `src/pages/security/HelioMartPasswordReset.tsx`

---

## Update 1 — Stop Auto-Fetching Worker Token on Page Load

**Commit:** `d05801ddb`  
**Date:** 2026-02-27  
**Type:** fix (UX + security — no breaking changes)

### Problem

On page load, `useGlobalWorkerToken()` called `workerTokenManager.getWorkerToken()`, which, if credentials are configured, would **silently call the PingOne token API** before the user took any action. This was undesirable for the password-reset page, where the operator controls when authentication is established.

Additionally, the `workerTokenUpdated` event listener was missing from the hook entirely, so token status never updated reactively after the user generated a token via the modal.

### Changes

#### `src/hooks/useGlobalWorkerToken.ts`

Added `UseGlobalWorkerTokenOptions` interface with `autoFetch?: boolean` (default `true`):

```typescript
export interface UseGlobalWorkerTokenOptions {
  /**
   * When false, reads the stored token only — no API call.
   * Defaults to true (auto-fetch when credentials are configured).
   */
  autoFetch?: boolean;
}

export const useGlobalWorkerToken = (
  options: UseGlobalWorkerTokenOptions = {}
): GlobalWorkerTokenStatus => {
  const { autoFetch = true } = options;
  // ...
};
```

- Added `checkTokenStatusSilent()` — reads from `unifiedWorkerTokenService.getTokenDataSync()` / `hasValidTokenSync()` with no API call
- Added `workerTokenUpdated` event listener in both modes so token status updates reactively when another component generates or clears a token
- All other callers unaffected — `autoFetch` defaults to `true`

#### `src/pages/security/HelioMartPasswordReset.tsx`

1. **`useGlobalWorkerToken({ autoFetch: false })`** — page no longer triggers an API call on mount
2. **Added `handleGetWorkerToken`** — opens `WorkerTokenModalV8`
3. **Added `handleClearWorkerToken`** — calls `unifiedWorkerTokenService.clearToken()` and dispatches `workerTokenUpdated`
4. **Worker Token button** — uses `handleGetWorkerToken`; label is "Get Worker Token" / "Worker Token Ready"; a "Clear Token" button appears when a valid token exists
5. **`loadConfig` effect** — replaced raw `localStorage.getItem('unified_worker_token')` + `JSON.parse` with `unifiedWorkerTokenService.getTokenDataSync()` for consistency
6. **`workerTokenUpdated` listener** — updated to use `unifiedWorkerTokenService.getTokenDataSync()` instead of direct localStorage

### Classification: fix (PATCH)

No breaking changes. Other pages that call `useGlobalWorkerToken()` with no arguments continue to auto-fetch as before.

### Files Modified

| File | Description |
|------|-------------|
| `src/hooks/useGlobalWorkerToken.ts` | Added `autoFetch` option; added `workerTokenUpdated` event listener |
| `src/pages/security/HelioMartPasswordReset.tsx` | Use `autoFetch: false`; add `handleGetWorkerToken` / `handleClearWorkerToken`; replace raw localStorage access |

### Before / After

**Before:** Page load → `useGlobalWorkerToken()` → `workerTokenManager.getWorkerToken()` → API call to PingOne token endpoint (if credentials configured)

**After:** Page load → `useGlobalWorkerToken({ autoFetch: false })` → reads stored token from memory/localStorage only → no network request. User clicks "Get Worker Token" button to generate a token via modal.

### Verification

1. Navigate to `/security/password-reset`
2. Open Network tab — confirm no token endpoint request fires on load
3. Click "Get Worker Token" — WorkerTokenModalV8 opens
4. Generate token — button turns green ("Worker Token Ready"), "Clear Token" appears
5. Click "Clear Token" — button returns to red ("Get Worker Token")
