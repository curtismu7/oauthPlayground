# Credential Saving Analysis Report

## Executive Summary

Credential saving in the OAuth Playground application has persistent issues related to:
1. **Inconsistent parameter signatures** across flows
2. **Multiple storage locations** without clear hierarchy
3. **Missing flowConfig parameter** in many save calls
4. **Cross-flow contamination** during save/load cycles
5. **Incomplete credential objects** being saved

## Critical Findings

### 1. **Inconsistent saveFlowCredentials() Signatures**

The `saveFlowCredentials` function accepts:
```typescript
saveFlowCredentials(
  flowKey: string,
  credentials: StepCredentials,
  flowConfig?: T,
  additionalState?: Partial<FlowPersistentState<T>>,
  options?: { showToast?: boolean }
)
```

**But usage varies:**

#### ✅ Correct Usage (Authorization Code V7):
```typescript
await FlowCredentialService.saveFlowCredentials(
  persistKey,
  credentials,
  flowConfig,  // ✅ Provides flowConfig
  {
    flowVariant,  // ✅ Provides additional state
    pkce: pkceCodes,
    authorizationCode: authCode,
    tokens: { ... }
  },
  { showToast: false }
);
```

#### ❌ Incorrect Usage (Implicit Flow V7):
```typescript
await FlowCredentialService.saveFlowCredentials(
  'implicit-v7',
  credentials
  // ❌ Missing flowConfig and additionalState
);
```

#### ❌ Incorrect Usage (CIBA Flow V7):
```typescript
FlowCredentialService.saveFlowCredentials('ciba-v7', updatedCredentials, {
  showToast: false
  // ❌ Passing options as 3rd param instead of 5th
});
```

### 2. **Storage Location Confusion**

Credentials are saved to THREE different locations:
1. **credentialManager** (shared across all flows) - via `saveAllCredentials()`
2. **localStorage** with flow-specific key - via `saveFlowState()`
3. **sessionStorage** with flow-specific key - via legacy `saveAuthzFlowCredentials()`

**Problem**: Authorization Code flow saves to ALL THREE, causing conflicts:
```typescript
// Line 1496: Saves to FlowCredentialService (writes to credentialManager AND localStorage)
await FlowCredentialService.saveFlowCredentials(persistKey, credentials, flowConfig, {...});

// Line 1520: ALSO saves to credentialManager with different key
credentialManager.saveAuthzFlowCredentials({...});
```

### 3. **Missing Flow Configuration**

Most flows don't provide `flowConfig` when saving:
- **Implicit Flow**: Only saves credentials object
- **CIBA Flow**: Only saves credentials object  
- **Client Credentials**: Only saves credentials object
- **Device Authorization**: Only saves credentials object

**Result**: Flow-specific configuration (like `responseType`, `scopes`, `clientAuthMethod`) is lost on reload.

### 4. **Incomplete Credential Objects**

Many flows save incomplete credential objects:
```typescript
// Client Credentials Flow - saves without checking all required fields
FlowCredentialService.saveFlowCredentials('client-credentials-v7', controller.credentials, {
  showToast: false
});
```

**Problem**: If `controller.credentials` is missing fields like `responseType` or `grantType`, empty values are saved, causing cross-flow contamination.

### 5. **Cross-Flow Contamination Risk**

The current save mechanism:
1. Saves to `credentialManager` (SHARED storage)
2. Saves to flow-specific localStorage key
3. When ANOTHER flow loads, it reads from credentialManager FIRST
4. If credentialManager has wrong flow's credentials, contamination occurs

**Example Flow**:
```
User in Implicit Flow:
1. Saves credentials with responseType='token'
2. Credentials saved to credentialManager (SHARED)
3. User navigates to Authorization Code Flow
4. Authorization Code loads from credentialManager
5. Gets responseType='token' (WRONG - should be 'code')
```

We added normalization in loading, but the root cause is SAVING shared credentials with flow-specific values.

## Recommendations

### Immediate Fixes

1. **Standardize saveFlowCredentials() calls across ALL flows**
   - Always provide `flowConfig` parameter
   - Always provide `additionalState` with flowVariant
   - Use correct parameter order

2. **Stop saving to credentialManager for flow-specific data**
   - Each flow should ONLY save to its own flow-specific localStorage key
   - Remove calls to `credentialManager.saveAuthzFlowCredentials()`
   - Keep credentialManager for SHARED data only (environmentId, issuerUrl, endpoints)

3. **Add validation before saving**
   - Validate `grantType` matches the flow
   - Validate `responseType` matches the flow
   - Validate `redirectUri` matches the flow
   - Clear fields that don't apply to the current flow

4. **Implement save abstraction layer**
   Create a flow-specific save function for each flow:
   ```typescript
   // In useImplicitFlowController.ts
   const saveCredentialsForImplicitFlow = async (creds: StepCredentials) => {
     // 1. Normalize credentials for Implicit flow
     const normalized = {
       ...creds,
       responseType: creeds.responseType || (flowVariant === 'oidc' ? 'id_token token' : 'token'),
       grantType: '', // Implicit doesn't have grant type
       redirectUri: creeds.redirectUri || (flowVariant === 'oidc' ? 
         'https://localhost:3000/implicit-callback' : 
         'https://localhost:3000/oauth-implicit-callback')
     };
     
     // 2. Save with flow-specific context
     await FlowCredentialService.saveFlowCredentials(
       'implicit-v7',
       normalized,
       { 
         flowVariant,
         responseType: normalized.responseType,
         redirectUri: normalized.redirectUri
       },
       {
         flowVariant,
         timestamp: Date.now()
       }
     );
   };
   ```

### Long-Term Improvements

1. **Separate shared vs. flow-specific storage**
   - Shared storage: environmentId, issuerUrl, endpoints (never flow-specific values)
   - Flow-specific storage: clientId, clientSecret, responseType, grantType, redirectUri

2. **Implement storage key hierarchy**
   ```
   'oauth-playground-flow-credentials': {  // Shared
     environmentId: '...',
     issuerUrl: '...'
   }
   'oauth-playground-flow-implicit-v7': {  // Flow-specific
     credentials: { ...flow-specific fields... },
     flowConfig: { ... }
   }
   ```

3. **Add migration utility**
   - Detect old credential format
   - Migrate to new format on load
   - Clear old credentialManager entries

4. **Add comprehensive tests**
   - Test saving credentials for each flow
   - Test loading credentials doesn't contaminate other flows
   - Test navigation between flows maintains correct credentials

## Files Requiring Updates

1. **ImplicitFlowV7.tsx** (line 559-562) - Add flowConfig parameter
2. **CIBAFlowV7.tsx** (line 870) - Fix parameter order
3. **ClientCredentialsFlowV7_Complete.tsx** (line 435) - Add flowConfig parameter
4. **DeviceAuthorizationFlowV7.tsx** - Add proper save with flowConfig
5. **RARFlowV7.tsx** - Add proper save with flowConfig
6. **JWTBearerTokenFlowV7.tsx** - Add proper save with flowConfig

## Action Items

- [ ] Update all saveFlowCredentials() calls to include flowConfig
- [ ] Remove redundant saves to credentialManager
- [ ] Add flow-specific save wrappers in each controller
- [ ] Implement validation before saving
- [ ] Add migration utility for old credential format
- [ ] Write tests for credential save/load cycles
- [ ] Document proper save patterns for future developers

## Code Examples

### Current (Broken) Pattern:
```typescript
// Only saves credentials, loses flowConfig
await FlowCredentialService.saveFlowCredentials('implicit-v7', credentials);
```

### Fixed Pattern:
```typescript
// Saves credentials WITH flowConfig
await FlowCredentialService.saveFlowCredentials(
  'implicit-v7',
  normalizedCredentials,
  {
    flowVariant: selectedVariant,
    responseType: normalizedCredentials.responseType,
    redirectUri: normalizedCredentials.redirectUri,
    clientAuthMethod: normalizedCredentials.clientAuthMethod
  },
  {
    flowVariant: selectedVariant,
    timestamp: Date.now()
  },
  { showToast: true }
);
```

