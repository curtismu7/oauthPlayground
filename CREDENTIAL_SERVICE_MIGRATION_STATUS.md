# FlowCredentialService Migration Status

## Overview

This document tracks the migration of all flow controllers to use the unified `FlowCredentialService` instead of directly calling `credentialManager` methods.

## Migration Status

### ✅ Completed (Using FlowCredentialService)

1. **useClientCredentialsFlowController.ts** ✅
   - Uses: `FlowCredentialService.loadFlowCredentials()`
   - Uses: `FlowCredentialService.saveFlowCredentials()`
   - Status: Fully migrated

2. **useHybridFlowController.ts** ✅
   - Uses: `FlowCredentialService.loadFlowCredentials()`
   - Uses: `FlowCredentialService.saveFlowCredentials()`
   - Status: Fully migrated

### ⚠️ Needs Migration (Using old credentialManager pattern)

3. **useAuthorizationCodeFlowController.ts** ⚠️
   - Currently uses: `credentialManager.loadAuthzFlowCredentials()`
   - Currently uses: `credentialManager.saveAuthzFlowCredentials()`
   - Line 164-170: Load logic
   - Line 1168-1200: Save logic
   - **Action needed**: Migrate to FlowCredentialService

4. **useWorkerTokenFlowController.ts** ⚠️
   - Currently uses: `credentialManager.loadWorkerFlowCredentials()`
   - Currently uses: `credentialManager.saveWorkerFlowCredentials()`
   - Line 74: Load logic in `loadInitialCredentials()`
   - Line 341-401: Save logic
   - Line 457: Additional load check in useEffect
   - **Action needed**: Migrate to FlowCredentialService

5. **useImplicitFlowController.ts** ⚠️
   - Currently uses: `credentialManager.loadImplicitFlowCredentials()`
   - Currently uses: `credentialManager.saveImplicitFlowCredentials()`
   - Line 154-160: Load logic
   - Line 557-598: Save logic
   - Line 640: Additional load check in useEffect
   - **Action needed**: Migrate to FlowCredentialService

### 🔍 To Be Investigated

6. **useJWTBearerFlowController.ts** 🔍
   - Status: Needs investigation
   - Check if it loads/saves credentials

7. **useResourceOwnerPasswordFlowController.ts** 🔍
   - Status: Needs investigation
   - Check if it loads/saves credentials

8. **useTokenRevocationFlowController.ts** 🔍
   - Status: Likely utility-only (no credential persistence)

9. **useTokenIntrospectionFlowController.ts** 🔍
   - Status: Likely utility-only (no credential persistence)

10. **useUserInfoFlowController.ts** 🔍
    - Status: Likely utility-only (no credential persistence)

## PingOne-Specific Flows

### To Check

- **PingOnePARFlowV6.tsx / PingOnePARFlowV6_New.tsx**
  - Check if it has a dedicated controller
  - May use inline credential management
  - Action: Verify it's using ComprehensiveCredentialsService

- **WorkerTokenFlowV6.tsx**
  - Uses: `useWorkerTokenFlowController` (see item #4 above)
  - Action: Already tracked above

## Migration Priority

### High Priority (Active Flows)

1. ✅ Client Credentials V6 - **DONE**
2. ✅ Hybrid Flow V6 - **DONE**
3. ⚠️ Authorization Code (OAuth/OIDC) - **NEEDS MIGRATION**
4. ⚠️ Worker Token V6 - **NEEDS MIGRATION**
5. ⚠️ Implicit Flow (OAuth/OIDC) - **NEEDS MIGRATION**

### Medium Priority

6. JWT Bearer Flow
7. Resource Owner Password Flow

### Low Priority (Utility Flows)

8. Token Revocation
9. Token Introspection
10. UserInfo

## Migration Checklist per Controller

When migrating a controller, follow these steps:

- [ ] Import `FlowCredentialService` from `../services/flowCredentialService`
- [ ] Replace load logic:
  - Remove: `credentialManager.loadXXXCredentials()`
  - Add: `FlowCredentialService.loadFlowCredentials({ flowKey, defaultCredentials })`
- [ ] Replace save logic:
  - Remove: `credentialManager.saveXXXCredentials()`
  - Add: `FlowCredentialService.saveFlowCredentials(flowKey, credentials, flowConfig, additionalState)`
- [ ] Test loading credentials on mount
- [ ] Test saving credentials
- [ ] Test cross-flow credential sharing
- [ ] Verify no linter errors
- [ ] Update this document

## Benefits of Migration

### For Each Migrated Controller:

✅ **Consistency**: All flows use the same credential management logic
✅ **Shared Credentials**: Credentials automatically shared across flows
✅ **Better Logging**: Built-in debug logging
✅ **Type Safety**: Full TypeScript support
✅ **Maintainability**: Single source of truth for credential logic
✅ **Flow-Specific State**: Each flow can persist its own config/tokens

## Migration Example

### Before (Old Pattern):

```typescript
// Load
const loaded = credentialManager.loadAuthzFlowCredentials();
if (loaded.environmentId && loaded.clientId) {
  setCredentials(loaded);
}

// Save
await credentialManager.saveAuthzFlowCredentials(credentials);
```

### After (New Pattern):

```typescript
// Load
const { credentials: loadedCreds, flowState } = 
  await FlowCredentialService.loadFlowCredentials({
    flowKey: 'authorization-code-v6',
    defaultCredentials: { grantType: 'authorization_code' },
  });

if (loadedCreds) {
  setCredentials(loadedCreds);
}

// Save
await FlowCredentialService.saveFlowCredentials(
  'authorization-code-v6',
  credentials,
  flowConfig,
  { tokens, pkce }
);
```

## Notes

### Why Keep credentialManager?

The `credentialManager` is still used internally by `FlowCredentialService`. We're not removing it, just standardizing how controllers interact with it.

### Backward Compatibility

Old credentials saved with `credentialManager` will still be loaded by `FlowCredentialService` through the shared credentials system.

### Testing Strategy

1. Test on a controller already migrated (Client Credentials or Hybrid)
2. Enter credentials and save
3. Refresh page - credentials should persist
4. Go to different flow - credentials should be pre-filled
5. Update credentials in new flow and save
6. Return to first flow - should see updated credentials

## Next Steps

1. Complete migration of high-priority controllers:
   - Authorization Code Controller
   - Worker Token Controller
   - Implicit Flow Controller

2. Investigate medium-priority controllers:
   - JWT Bearer
   - Resource Owner Password

3. Verify PingOne-specific flows are properly integrated

4. Update guide documentation with examples from all migrated flows

## Last Updated

**Date**: 2025-10-11
**Status**: 2/5 high-priority controllers migrated (40% complete)
**Next**: Migrate Authorization Code, Worker Token, and Implicit controllers




