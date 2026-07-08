# Plan: Migrate All V8, V8U, and V8M to workerTokenService

## Overview
This plan outlines the migration of all worker token usage across V8, V8U, and V8M codebases to use the centralized `workerTokenService`. This ensures a single source of truth for worker tokens across the entire application.

## Current State Analysis

### ✅ Already Migrated
- `src/pages/ClientGenerator.tsx` - Uses `workerTokenService`
- `src/pages/Configuration.tsx` - Uses `workerTokenService`
- `src/components/WorkerTokenStatusLabel.tsx` - Uses `workerTokenService`
- `src/components/ConfigurationURIChecker.tsx` - Uses `workerTokenService`
- `src/components/WorkerTokenModal.tsx` - Uses `workerTokenService`

### ❌ Needs Migration

#### V8 Services (High Priority)
1. **`src/v8/services/appDiscoveryService.ts`**
   - Currently uses: `DualStorageService` with custom keys (`v8:worker-token`)
   - Methods to update:
     - `getWorkerToken()` - Should use `workerTokenService.getToken()`
     - `getStoredWorkerToken()` - Should use `workerTokenService.getToken()`
     - `getStoredWorkerTokenSync()` - Should use `workerTokenService.loadCredentialsSync()` + `getToken()`
     - `storeWorkerToken()` - Should use `workerTokenService.saveToken()`
     - `clearWorkerToken()` - Should use `workerTokenService.clearToken()`

2. **`src/v8/services/configCheckerService.ts`**
   - Currently: Accepts `workerToken` as parameter
   - Action: Update callers to use `workerTokenService.getToken()` before calling
   - Note: Service itself doesn't need changes, just callers

3. **`src/v8/services/workerTokenStatusService.ts`**
   - Currently: Checks localStorage directly
   - Action: Update to use `workerTokenService.getToken()` and `loadCredentials()`

#### V8 Components (High Priority)
4. **`src/v8/components/AppPicker.tsx`**
   - Currently: Uses `AppDiscoveryService.getStoredWorkerToken()` and `localStorage.removeItem('worker_token_expires_at')`
   - Action: 
     - Replace `AppDiscoveryService.getStoredWorkerToken()` with `workerTokenService.getToken()`
     - Remove direct localStorage access
     - Use `workerTokenService.clearToken()` instead of manual clearing

5. **`src/v8/components/WorkerTokenModal.tsx`**
   - Currently: Uses `localStorage.getItem('worker_credentials_v8')` and `localStorage.setItem('worker_credentials_v8')`
   - Action:
     - Replace with `workerTokenService.loadCredentials()` and `workerTokenService.saveCredentials()`
     - After token generation, use `workerTokenService.saveToken()`

#### V8U Components (High Priority)
6. **`src/v8u/components/AppDiscoveryModalV8U.tsx`**
   - Currently: Uses `AppDiscoveryService.getStoredWorkerToken()`
   - Action: Replace with `workerTokenService.getToken()`

7. **`src/v8u/components/CompactAppPickerV8U.tsx`**
   - Currently: Uses `AppDiscoveryService.getStoredWorkerToken()`
   - Action: Replace with `workerTokenService.getToken()`

8. **`src/v8u/components/CredentialsFormV8U.tsx`**
   - Currently: May use `AppDiscoveryService` for config checker
   - Action: Ensure config checker calls use `workerTokenService.getToken()`

9. **`src/v8u/components/UnifiedFlowSteps.tsx`**
   - Currently: May use worker token for config checker
   - Action: Ensure all worker token access uses `workerTokenService.getToken()`

10. **`src/v8u/flows/UnifiedOAuthFlowV8U.tsx`**
    - Currently: May use worker token indirectly
    - Action: Review and ensure all worker token access uses `workerTokenService.getToken()`

#### V8M (Medium Priority - Verify Usage)
11. **`src/v8m/pages/V8MTokenExchange.tsx`**
    - Currently: Unknown - needs verification
    - Action: Search for worker token usage and migrate if found

#### V8 Flows (Medium Priority)
12. **`src/v8/flows/OAuthAuthorizationCodeFlow.tsx`**
    - Action: Review for worker token usage (likely via config checker)

13. **`src/v8/flows/ImplicitFlow.tsx`**
    - Action: Review for worker token usage (likely via config checker)

14. **`src/v8/flows/PingOnePARFlow/PingOnePARFlow.tsx`**
    - Action: Review for worker token usage (likely via config checker)

#### Test Files (Low Priority)
15. **`src/v8/services/__tests__/appDiscoveryService.test.ts`**
    - Action: Update tests to mock `workerTokenService` instead of localStorage

16. **`src/v8/services/__tests__/flowResetService.test.ts`**
    - Action: Update tests to use `workerTokenService` instead of direct localStorage

## Migration Strategy

### Phase 1: Core Services (Week 1)
**Priority: CRITICAL** - These are the foundation that other components depend on.

1. **Migrate `appDiscoveryService.ts`**
   - Replace all worker token storage/retrieval with `workerTokenService`
   - Keep the service interface the same (backwards compatible)
   - Update internal implementation only
   - **Estimated Time**: 2-3 hours

2. **Migrate `workerTokenStatusService.ts`**
   - Update to read from `workerTokenService`
   - **Estimated Time**: 1 hour

### Phase 2: Components (Week 1-2)
**Priority: HIGH** - These directly affect user experience.

3. **Migrate V8 Components**
   - `AppPicker.tsx`
   - `WorkerTokenModal.tsx`
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
   - `OAuthAuthorizationCodeFlow.tsx`
   - `ImplicitFlow.tsx`
   - `PingOnePARFlow.tsx`
   - **Estimated Time**: 2-3 hours

6. **Review V8M**
   - `V8MTokenExchange.tsx`
   - **Estimated Time**: 1 hour

### Phase 4: Testing & Cleanup (Week 2-3)
**Priority: LOW** - Ensure everything works correctly.

7. **Update Tests**
   - Update all test files to use `workerTokenService` mocks
   - **Estimated Time**: 2-3 hours

8. **Remove Legacy Code**
   - Remove old localStorage keys: `v8:worker-token`, `worker_credentials_v8`, `worker_token_expires_at`
   - Remove deprecated methods from `appDiscoveryService` if any
   - **Estimated Time**: 1 hour

## Detailed Migration Steps

### Step 1: Update `appDiscoveryService.ts`

```typescript
// BEFORE
static async getStoredWorkerToken(): Promise<string | null> {
  const result = await DualStorageService.load<WorkerTokenInfo>({
    directory: AppDiscoveryService.WORKER_TOKEN_DIRECTORY,
    filename: AppDiscoveryService.WORKER_TOKEN_FILENAME,
    browserStorageKey: AppDiscoveryService.WORKER_TOKEN_KEY,
  });
  // ... expiration checking
  return tokenInfo.token;
}

// AFTER
static async getStoredWorkerToken(): Promise<string | null> {
  return await workerTokenService.getToken();
}
```

**Changes:**
- Remove `WORKER_TOKEN_KEY`, `WORKER_TOKEN_DIRECTORY`, `WORKER_TOKEN_FILENAME` constants
- Remove `DualStorageService` dependency
- Simplify `getStoredWorkerToken()` to call `workerTokenService.getToken()`
- Simplify `getStoredWorkerTokenSync()` to use `workerTokenService.loadCredentialsSync()` + check token
- Update `storeWorkerToken()` to use `workerTokenService.saveToken()`
- Update `clearWorkerToken()` to use `workerTokenService.clearToken()`

### Step 2: Update `workerTokenStatusService.ts`

```typescript
// BEFORE
static checkWorkerTokenStatus(): WorkerTokenStatus {
  const token = localStorage.getItem('worker_token');
  const expiresAt = localStorage.getItem('worker_token_expires_at');
  // ... validation logic
}

// AFTER
static checkWorkerTokenStatus(): WorkerTokenStatus {
  const credentials = workerTokenService.loadCredentialsSync();
  const token = credentials ? /* get token from service */ : null;
  // Use workerTokenService.getToken() for async version
  // ... validation logic
}
```

### Step 3: Update Components

**Pattern for all components:**
```typescript
// BEFORE
const workerToken = await AppDiscoveryService.getStoredWorkerToken();
// or
const workerToken = localStorage.getItem('worker_token');

// AFTER
import { workerTokenService } from '../v8/services/workerTokenService';
const workerToken = await workerTokenService.getToken();
```

**For clearing tokens:**
```typescript
// BEFORE
localStorage.removeItem('worker_token');
localStorage.removeItem('worker_token_expires_at');

// AFTER
await workerTokenService.clearToken(); // or clearCredentials() if clearing everything
```

### Step 4: Update Config Checker Usage

**Pattern:**
```typescript
// BEFORE
const config = await ConfigCheckerService.fetchAppConfig(
  environmentId,
  clientId,
  workerToken // passed from component state
);

// AFTER
const workerToken = await workerTokenService.getToken();
if (!workerToken) {
  toast.error('Worker token required');
  return;
}
const config = await ConfigCheckerService.fetchAppConfig(
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

✅ All V8, V8U, and V8M code uses `workerTokenService`  
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

- The `workerTokenService` already handles:
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

