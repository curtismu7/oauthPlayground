# Plan: Migrate All V8, V8U, and V8M to workerTokenServiceV8

## Overview
This plan outlines the migration of all worker token usage across V8, V8U, and V8M codebases to use the centralized `workerTokenServiceV8`. This ensures a single source of truth for worker tokens across the entire application.

## Current State Analysis

### ✅ Already Migrated
- `src/pages/ClientGenerator.tsx` - Uses `workerTokenServiceV8`
- `src/pages/Configuration.tsx` - Uses `workerTokenServiceV8`
- `src/components/WorkerTokenStatusLabel.tsx` - Uses `workerTokenServiceV8`
- `src/components/ConfigurationURIChecker.tsx` - Uses `workerTokenServiceV8`
- `src/components/WorkerTokenModal.tsx` - Uses `workerTokenServiceV8`

### ❌ Needs Migration

#### V8 Services (High Priority)
1. **`src/v8/services/appDiscoveryServiceV8.ts`**
   - Currently uses: `DualStorageServiceV8` with custom keys (`v8:worker-token`)
   - Methods to update:
     - `getWorkerToken()` - Should use `workerTokenServiceV8.getToken()`
     - `getStoredWorkerToken()` - Should use `workerTokenServiceV8.getToken()`
     - `getStoredWorkerTokenSync()` - Should use `workerTokenServiceV8.loadCredentialsSync()` + `getToken()`
     - `storeWorkerToken()` - Should use `workerTokenServiceV8.saveToken()`
     - `clearWorkerToken()` - Should use `workerTokenServiceV8.clearToken()`

2. **`src/v8/services/configCheckerServiceV8.ts`**
   - Currently: Accepts `workerToken` as parameter
   - Action: Update callers to use `workerTokenServiceV8.getToken()` before calling
   - Note: Service itself doesn't need changes, just callers

3. **`src/v8/services/workerTokenStatusServiceV8.ts`**
   - Currently: Checks localStorage directly
   - Action: Update to use `workerTokenServiceV8.getToken()` and `loadCredentials()`

#### V8 Components (High Priority)
4. **`src/v8/components/AppPickerV8.tsx`**
   - Currently: Uses `AppDiscoveryServiceV8.getStoredWorkerToken()` and `localStorage.removeItem('worker_token_expires_at')`
   - Action: 
     - Replace `AppDiscoveryServiceV8.getStoredWorkerToken()` with `workerTokenServiceV8.getToken()`
     - Remove direct localStorage access
     - Use `workerTokenServiceV8.clearToken()` instead of manual clearing

5. **`src/v8/components/WorkerTokenModalV8.tsx`**
   - Currently: Uses `localStorage.getItem('worker_credentials_v8')` and `localStorage.setItem('worker_credentials_v8')`
   - Action:
     - Replace with `workerTokenServiceV8.loadCredentials()` and `workerTokenServiceV8.saveCredentials()`
     - After token generation, use `workerTokenServiceV8.saveToken()`

#### V8U Components (High Priority)
6. **`src/v8u/components/AppDiscoveryModalV8U.tsx`**
   - Currently: Uses `AppDiscoveryServiceV8.getStoredWorkerToken()`
   - Action: Replace with `workerTokenServiceV8.getToken()`

7. **`src/v8u/components/CompactAppPickerV8U.tsx`**
   - Currently: Uses `AppDiscoveryServiceV8.getStoredWorkerToken()`
   - Action: Replace with `workerTokenServiceV8.getToken()`

8. **`src/v8u/components/CredentialsFormV8U.tsx`**
   - Currently: May use `AppDiscoveryServiceV8` for config checker
   - Action: Ensure config checker calls use `workerTokenServiceV8.getToken()`

9. **`src/v8u/components/UnifiedFlowSteps.tsx`**
   - Currently: May use worker token for config checker
   - Action: Ensure all worker token access uses `workerTokenServiceV8.getToken()`

10. **`src/v8u/flows/UnifiedOAuthFlowV8U.tsx`**
    - Currently: May use worker token indirectly
    - Action: Review and ensure all worker token access uses `workerTokenServiceV8.getToken()`

#### V8M (Medium Priority - Verify Usage)
11. **`src/v8m/pages/V8MTokenExchange.tsx`**
    - Currently: Unknown - needs verification
    - Action: Search for worker token usage and migrate if found

#### V8 Flows (Medium Priority)
12. **`src/v8/flows/OAuthAuthorizationCodeFlowV8.tsx`**
    - Action: Review for worker token usage (likely via config checker)

13. **`src/v8/flows/ImplicitFlowV8.tsx`**
    - Action: Review for worker token usage (likely via config checker)

14. **`src/v8/flows/PingOnePARFlowV8/PingOnePARFlowV8.tsx`**
    - Action: Review for worker token usage (likely via config checker)

#### Test Files (Low Priority)
15. **`src/v8/services/__tests__/appDiscoveryServiceV8.test.ts`**
    - Action: Update tests to mock `workerTokenServiceV8` instead of localStorage

16. **`src/v8/services/__tests__/flowResetServiceV8.test.ts`**
    - Action: Update tests to use `workerTokenServiceV8` instead of direct localStorage

## Migration Strategy

### Phase 1: Core Services (Week 1)
**Priority: CRITICAL** - These are the foundation that other components depend on.

1. **Migrate `appDiscoveryServiceV8.ts`**
   - Replace all worker token storage/retrieval with `workerTokenServiceV8`
   - Keep the service interface the same (backwards compatible)
   - Update internal implementation only
   - **Estimated Time**: 2-3 hours

2. **Migrate `workerTokenStatusServiceV8.ts`**
   - Update to read from `workerTokenServiceV8`
   - **Estimated Time**: 1 hour

### Phase 2: Components (Week 1-2)
**Priority: HIGH** - These directly affect user experience.

3. **Migrate V8 Components**
   - `AppPickerV8.tsx`
   - `WorkerTokenModalV8.tsx`
   - **Estimated Time**: 2-3 hours

4. **Migrate V8U Components**
   - `AppDiscoveryModalV8U.tsx`
   - `CompactAppPickerV8U.tsx`
   - `CredentialsFormV8U.tsx`
   - `UnifiedFlowSteps.tsx`
   - `UnifiedOAuthFlowV8U.tsx`
   - **Estimated Time**: 3-4 hours

### Phase 3: Flow Components (Week 2)
**Priority: MEDIUM** - These use worker tokens indirectly.

5. **Review and Update V8 Flows**
   - `OAuthAuthorizationCodeFlowV8.tsx`
   - `ImplicitFlowV8.tsx`
   - `PingOnePARFlowV8.tsx`
   - **Estimated Time**: 2-3 hours

6. **Review V8M**
   - `V8MTokenExchange.tsx`
   - **Estimated Time**: 1 hour

### Phase 4: Testing & Cleanup (Week 2-3)
**Priority: LOW** - Ensure everything works correctly.

7. **Update Tests**
   - Update all test files to use `workerTokenServiceV8` mocks
   - **Estimated Time**: 2-3 hours

8. **Remove Legacy Code**
   - Remove old localStorage keys: `v8:worker-token`, `worker_credentials_v8`, `worker_token_expires_at`
   - Remove deprecated methods from `appDiscoveryServiceV8` if any
   - **Estimated Time**: 1 hour

## Detailed Migration Steps

### Step 1: Update `appDiscoveryServiceV8.ts`

```typescript
// BEFORE
static async getStoredWorkerToken(): Promise<string | null> {
  const result = await DualStorageServiceV8.load<WorkerTokenInfo>({
    directory: AppDiscoveryServiceV8.WORKER_TOKEN_DIRECTORY,
    filename: AppDiscoveryServiceV8.WORKER_TOKEN_FILENAME,
    browserStorageKey: AppDiscoveryServiceV8.WORKER_TOKEN_KEY,
  });
  // ... expiration checking
  return tokenInfo.token;
}

// AFTER
static async getStoredWorkerToken(): Promise<string | null> {
  return await workerTokenServiceV8.getToken();
}
```

**Changes:**
- Remove `WORKER_TOKEN_KEY`, `WORKER_TOKEN_DIRECTORY`, `WORKER_TOKEN_FILENAME` constants
- Remove `DualStorageServiceV8` dependency
- Simplify `getStoredWorkerToken()` to call `workerTokenServiceV8.getToken()`
- Simplify `getStoredWorkerTokenSync()` to use `workerTokenServiceV8.loadCredentialsSync()` + check token
- Update `storeWorkerToken()` to use `workerTokenServiceV8.saveToken()`
- Update `clearWorkerToken()` to use `workerTokenServiceV8.clearToken()`

### Step 2: Update `workerTokenStatusServiceV8.ts`

```typescript
// BEFORE
static checkWorkerTokenStatus(): WorkerTokenStatus {
  const token = localStorage.getItem('worker_token');
  const expiresAt = localStorage.getItem('worker_token_expires_at');
  // ... validation logic
}

// AFTER
static checkWorkerTokenStatus(): WorkerTokenStatus {
  const credentials = workerTokenServiceV8.loadCredentialsSync();
  const token = credentials ? /* get token from service */ : null;
  // Use workerTokenServiceV8.getToken() for async version
  // ... validation logic
}
```

### Step 3: Update Components

**Pattern for all components:**
```typescript
// BEFORE
const workerToken = await AppDiscoveryServiceV8.getStoredWorkerToken();
// or
const workerToken = localStorage.getItem('worker_token');

// AFTER
import { workerTokenServiceV8 } from '../v8/services/workerTokenServiceV8';
const workerToken = await workerTokenServiceV8.getToken();
```

**For clearing tokens:**
```typescript
// BEFORE
localStorage.removeItem('worker_token');
localStorage.removeItem('worker_token_expires_at');

// AFTER
await workerTokenServiceV8.clearToken(); // or clearCredentials() if clearing everything
```

### Step 4: Update Config Checker Usage

**Pattern:**
```typescript
// BEFORE
const config = await ConfigCheckerServiceV8.fetchAppConfig(
  environmentId,
  clientId,
  workerToken // passed from component state
);

// AFTER
const workerToken = await workerTokenServiceV8.getToken();
if (!workerToken) {
  toastV8.error('Worker token required');
  return;
}
const config = await ConfigCheckerServiceV8.fetchAppConfig(
  environmentId,
  clientId,
  workerToken
);
```

## Testing Checklist

After each phase, test:

- [ ] Worker token can be generated and saved
- [ ] Worker token persists across page refreshes
- [ ] Worker token is shared across all V8/V8U/V8M flows
- [ ] Config Checker works in all flows
- [ ] App Discovery works in all flows
- [ ] Worker token expiration is handled correctly
- [ ] Clearing worker token works everywhere
- [ ] No duplicate storage keys remain
- [ ] All components show consistent worker token status

## Rollback Plan

If issues arise:

1. Keep old code commented out for 1-2 weeks
2. Add feature flag to switch between old/new implementation
3. Monitor error logs for worker token related issues
4. Have quick revert script ready

## Success Criteria

✅ All V8, V8U, and V8M code uses `workerTokenServiceV8`  
✅ No direct localStorage access for worker tokens  
✅ No duplicate worker token storage mechanisms  
✅ All components show consistent worker token status  
✅ Worker tokens persist across browser refreshes  
✅ All tests pass  
✅ No console errors related to worker tokens  

## Estimated Total Time

- **Phase 1**: 3-4 hours
- **Phase 2**: 5-7 hours
- **Phase 3**: 3-4 hours
- **Phase 4**: 3-4 hours
- **Total**: ~14-19 hours

## Notes

- The `workerTokenServiceV8` already handles:
  - Memory caching
  - Browser localStorage
  - IndexedDB backup
  - Token expiration
  - Cross-tab synchronization (via storage events)

- Components should listen for `workerTokenUpdated` events to refresh UI:
  ```typescript
  useEffect(() => {
    const handleUpdate = () => {
      // Refresh worker token status
    };
    window.addEventListener('workerTokenUpdated', handleUpdate);
    return () => window.removeEventListener('workerTokenUpdated', handleUpdate);
  }, []);
  ```

- The service provides both async (`getToken()`, `loadCredentials()`) and sync (`loadCredentialsSync()`) methods for backwards compatibility.

