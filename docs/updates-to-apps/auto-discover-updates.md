# Auto-Discover & Discovery Panel Updates

**App/Component:** Auto-Discover Page (`/auto-discover`) & DiscoveryPanel Component  
**Last Updated:** 2026-02-27  
**Owner:** OAuth Playground Team

---

## Change Log

### 2026-02-27: Migrated to Unified Token Storage System

#### Summary

Upgraded DiscoveryPanel and AutoDiscover page from legacy localStorage/credentialManager to modern unified token storage (IndexedDB + SQLite).

#### Scope

**Components Touched:**
- `src/components/DiscoveryPanel.tsx` - Modal for OIDC discovery
- `src/pages/AutoDiscover.tsx` - Auto-discovery page

#### Compatibility

**Classification:** MINOR (backward compatible)

**Rationale:**
- No contract changes
- Additive improvement (async storage)
- Falls back to legacy localStorage for compatibility
- Still works with existing data

#### Changes Made

**DiscoveryPanel.tsx:**

Before (Legacy):
```typescript
// Synchronous localStorage access
const stored = localStorage.getItem('unified_worker_token');
const preferences = credentialManager.loadDiscoveryPreferences();
const credentials = unifiedWorkerTokenService.loadCredentials(); // Sync
```

After (Unified Storage):
```typescript
// Async unified storage
const workerCreds = await unifiedWorkerTokenService.loadCredentials();
const oauthCreds = await unifiedWorkerTokenService.storageService?.getOAuthCredentials();
// Falls back to localStorage for legacy support
```

**Key Changes:**
1. Replaced synchronous localStorage reads with async `loadCredentials()`
2. Added async `getOAuthCredentials()` for OAuth config
3. Converted initialization `useState()` to `useEffect()` with async loader
4. Updated `workerTokenUpdated` event handler to async
5. Auto-populates Environment ID from unified storage

**AutoDiscover.tsx:**

Before (Legacy):
```typescript
const success = credentialManager.saveConfigCredentials({
  environmentId,
  clientId,
  authEndpoint,
  // ...
});
```

After (Unified Storage):
```typescript
const storageService = new UnifiedTokenStorageService();
await storageService.storeOAuthCredentials(
  {
    environmentId,
    clientId,
    authEndpoint,
    // ...
  },
  {
    environmentId,
    flowType: 'authz_code',
    flowName: 'Auto-Discovered Configuration',
  }
);
```

**Key Changes:**
1. Replaced `credentialManager.saveConfigCredentials()` with `storeOAuthCredentials()`
2. Made `handleConfigurationDiscovered` async
3. Stores discovered endpoints in IndexedDB + SQLite (dual storage)
4. Added metadata for flow tracking

#### Storage Pattern

**Storage System:** Dual storage (IndexedDB + SQLite backend)

**Data Flow:**
1. **Load:** Check IndexedDB → Check SQLite → Fallback to localStorage
2. **Save:** Write to IndexedDB + SQLite simultaneously
3. **Events:** Emit `workerTokenUpdated` on credential changes

**Keys/APIs Used:**
- IndexedDB: `oauth_credentials` type in unified storage
- SQLite: Via `/api/tokens/store` endpoint
- Legacy localStorage: `pingone_discovery_preferences` (read-only fallback)

#### Files Modified

- `src/components/DiscoveryPanel.tsx` (775 lines)
  - Lines 312-396: Async credential loading in useEffect
  - Lines 383-396: Async worker token update handler
- `src/pages/AutoDiscover.tsx` (190 lines)
  - Lines 1-9: Import changes (UnifiedTokenStorageService)
  - Lines 108-137: Async configuration saving

#### Testing

**How to Verify:**

1. Navigate to https://api.pingdemo.com:3000/auto-discover
2. Click "Start OIDC Discovery" - modal should open
3. **Environment ID should auto-populate** from worker token
4. Enter Environment ID (if empty) and select Region
5. Click "Discover Configuration"
6. Verify endpoints are displayed
7. Click "Apply Configuration"
8. **Check IndexedDB:** Open DevTools → Application → IndexedDB → `unified_token_storage` → `tokens` → Look for `oauth_credentials` entry
9. **Check SQLite:** Backend should log credential storage to SQLite
10. Refresh page - Environment ID should persist

**Expected Behavior:**
- ✅ Environment ID auto-populates from unified storage
- ✅ Discovery saves to both IndexedDB and SQLite
- ✅ Data persists across page refreshes
- ✅ Falls back to localStorage for legacy data

#### Rollback Plan

**If issues occur:**

1. **Revert files:**
   ```bash
   git revert <commit-hash>
   ```

2. **Quick fix (restore legacy):**
   - Restore `credentialManager` import in AutoDiscover.tsx
   - Restore sync `localStorage` access in DiscoveryPanel.tsx
   - Remove async/await from handlers

3. **Verify rollback:**
   - Check discovery modal opens
   - Verify credentials save to localStorage
   - Test discovery flow end-to-end

#### Migration Notes

**No migration required for end users.**

**For developers:**
- DiscoveryPanel now uses async pattern - ensure any code calling it handles async state loading
- Environment ID may initially be empty while loading from storage (shows loading state)
- Worker token updates trigger automatic Environment ID population

#### Risk Areas

**Low Risk:**
- Backward compatible (falls back to localStorage)
- No breaking changes to external contracts
- Async pattern is standard across codebase

**Monitoring:**
- Watch for "Failed to load stored discovery preferences" errors in console
- Check IndexedDB storage quota warnings
- Monitor backend `/api/tokens/store` endpoint for 500 errors

#### Dependencies

**Services Used:**
- `unifiedWorkerTokenService` - Worker token credential management
- `UnifiedTokenStorageService` - OAuth credential storage (IndexedDB + SQLite)
- `discoveryService` - OIDC endpoint discovery

**Events:**
- Listens: `workerTokenUpdated` - Updates Environment ID when token changes
- Emits: None (storage service emits internal events)

#### Related Documentation

- [V9 Migration Lessons Learned](../migration/V9_MIGRATION_LESSONS_LEARNED.md) - Storage migration patterns
- [Unified Storage Service](../../src/services/unifiedTokenStorageService.ts) - Storage implementation
- [Worker Token Service](../../src/services/unifiedWorkerTokenService.ts) - Worker token management

---

## Component Overview

### DiscoveryPanel (Modal)

**Purpose:** Modal dialog for discovering PingOne OIDC configuration endpoints

**Key Features:**
- Auto-populates Environment ID from worker token
- Validates Environment ID format (UUID)
- Fetches OIDC configuration from `.well-known/openid-configuration`
- Displays formatted or raw JSON response
- Copy-to-clipboard for all endpoints
- Saves discovered configuration to unified storage

**Props:**
```typescript
interface DiscoveryPanelProps {
  onConfigurationDiscovered: (config: OpenIDConfiguration, environmentId: string) => void;
  onClose: () => void;
}
```

**Storage Integration:**
- Loads: Worker token credentials, OAuth credentials
- Saves: Discovery preferences to localStorage (legacy)
- Events: Listens to `workerTokenUpdated`

### AutoDiscover Page

**Path:** `/auto-discover`  
**Sidebar:** Developer Tools → OIDC Discovery

**Purpose:** Landing page for OIDC discovery feature

**Key Features:**
- Explains OIDC discovery process
- Opens DiscoveryPanel modal
- Displays success message after discovery
- Saves discovered endpoints to unified storage

**Storage Integration:**
- Saves: OAuth credentials to IndexedDB + SQLite
- Format: Complete OIDC configuration with all endpoints

---

## API Endpoints Used

| Method | Endpoint | Purpose | Notes |
|--------|----------|---------|-------|
| POST | `/api/pingone/oidc-discovery` | Fetch OIDC config | Via discoveryService |
| POST | `/api/tokens/store` | Save credentials | Via UnifiedTokenStorageService |
| GET | `/api/tokens/query` | Load credentials | Via UnifiedTokenStorageService |

---

## Storage Schema

**IndexedDB (oauth_credentials type):**
```typescript
{
  id: "oauth_<environmentId>_<clientId>",
  type: "oauth_credentials",
  value: JSON.stringify({
    environmentId: string,
    clientId: string,
    redirectUri: string,
    scopes: string[],
    authEndpoint: string,
    tokenEndpoint: string,
    userInfoEndpoint: string,
    endSessionEndpoint: string,
  }),
  expiresAt: null,
  issuedAt: number,
  source: "system",
  environmentId: string,
  clientId: string,
  flowType: "authz_code",
  flowName: "Auto-Discovered Configuration",
  metadata: { credentials }
}
```

**SQLite (via backend API):**
- Same structure as IndexedDB
- Persisted to `tokens.db` via `/api/tokens/store`

**Legacy localStorage:**
```typescript
// Key: pingone_discovery_preferences
{
  environmentId: string,
  region: "us" | "eu" | "ca" | "ap",
  lastUpdated: number
}
```

---

## Future Improvements

- [ ] Remove localStorage fallback after full migration period
- [ ] Add discovery history (recently discovered environments)
- [ ] Cache discovered configurations by environment ID
- [ ] Add environment ID validation against PingOne API
- [ ] Support paste PingOne URL to extract environment ID
- [ ] Add region auto-detection from issuer URL

---
