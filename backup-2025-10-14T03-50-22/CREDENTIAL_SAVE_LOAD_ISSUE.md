# Credential Save/Load Issue - Root Cause Found

## Problem
User reports: "Either save credentials button is not working, or the wrong credentials are being restored."

## Root Cause: Load/Save Mismatch ❌

### What Happens on SAVE ✅
**File**: `src/hooks/useAuthorizationCodeFlowController.ts` (line 1189)

```typescript
const success = await FlowCredentialService.saveFlowCredentials(
    persistKey, // 'oauth-authorization-code-v6'
    credentials,
    flowConfig,
    { flowVariant, pkce: pkceCodes, ...},
    { showToast: false }
);
```

**Saves to**: `localStorage` with key prefix: `oauth-authorization-code-v6-...`

### What Happens on LOAD ❌
**File**: `src/hooks/useAuthorizationCodeFlowController.ts` (line 154-166)

```typescript
const loadInitialCredentials = (variant: FlowVariant): StepCredentials => {
    // Load credentials using credentialManager (FlowCredentialService will handle this in useEffect)
    let loaded = credentialManager.getAllCredentials();
    
    return {
        environmentId: loaded.environmentId || '',
        clientId: loaded.clientId || '',
        clientSecret: loaded.clientSecret || '',
        redirectUri: loaded.redirectUri || getCallbackUrlForFlow('authorization-code'),
        scope: mergedScopes,
        ...
    };
};
```

**Loads from**: `credentialManager.getAllCredentials()` - generic shared storage, NOT flow-specific!

## The Problem

1. **User configures credentials in OAuth Authorization Code Flow V6**
2. **User clicks "Save Configuration"**
   - ✅ Saves to: `localStorage['oauth-authorization-code-v6-...']`
3. **User refreshes page**
   - ❌ Loads from: `localStorage['pingone_permanent_credentials']` or other generic keys
   - ❌ Does NOT load from flow-specific key: `oauth-authorization-code-v6-...`
4. **Result**: User sees old/generic credentials, not the ones they just saved!

## Why This Happens

The comment on line 165 says:
```
// Load credentials using credentialManager (FlowCredentialService will handle this in useEffect)
```

**BUT**: There is NO `useEffect` that loads credentials using `FlowCredentialService.loadFlowCredentials`!

The controller is missing the load logic on mount.

## Solution

### Option 1: Add useEffect to Load Flow-Specific Credentials (Recommended)

Add this after line 327 in `useAuthorizationCodeFlowController.ts`:

```typescript
// Load flow-specific credentials on mount
useEffect(() => {
    const loadData = async () => {
        try {
            const { credentials: loadedCreds, hasSharedCredentials } = 
                await FlowCredentialService.loadFlowCredentials<FlowConfig>({
                    flowKey: persistKey,
                    defaultCredentials: loadInitialCredentials(flowVariant),
                });

            if (loadedCreds && hasSharedCredentials) {
                setCredentials(loadedCreds);
                setHasCredentialsSaved(true);
                console.log('✅ [useAuthorizationCodeFlowController] Loaded flow-specific credentials', {
                    flowKey: persistKey,
                    environmentId: loadedCreds.environmentId,
                    clientId: loadedCreds.clientId?.substring(0, 8) + '...',
                });
            }
        } catch (error) {
            console.error('❌ [useAuthorizationCodeFlowController] Failed to load credentials', error);
        }
    };

    loadData();
}, [flowVariant, persistKey]);
```

### Option 2: Update loadInitialCredentials to Use FlowCredentialService (Alternative)

Change `loadInitialCredentials` to be async and use FlowCredentialService:

```typescript
const loadInitialCredentials = async (variant: FlowVariant, persistKey: string): Promise<StepCredentials> => {
    const { credentials } = await FlowCredentialService.loadFlowCredentials<FlowConfig>({
        flowKey: persistKey,
        defaultCredentials: createEmptyCredentials(),
    });
    
    return credentials || createEmptyCredentials();
};
```

**But this requires changing the entire initialization flow, so Option 1 is better.**

## Comparison with Working Flow: Hybrid Flow

The Hybrid Flow DOES have this useEffect (lines 152-181):

```typescript
// Load saved credentials on mount using FlowCredentialService
useEffect(() => {
    const loadData = async () => {
        try {
            const { credentials: loadedCreds, hasSharedCredentials } = 
                await FlowCredentialService.loadFlowCredentials<HybridFlowConfig>({
                    flowKey: persistKey,
                    defaultCredentials: { /* ... */ },
                });

            if (loadedCreds) {
                setCredentialsState(loadedCreds);
                setHasValidCredentials(true);
                log.info('Loaded saved credentials from FlowCredentialService');
            }
        } catch (error) {
            log.error('Failed to load credentials', error);
        }
    };

    loadData();
}, [flowVariant, flowConfig, persistKey]);
```

**This is exactly what Authorization Code Flow is missing!**

## Files to Fix

- [ ] `src/hooks/useAuthorizationCodeFlowController.ts`
  - Add useEffect to load flow-specific credentials on mount
  - Place after line 327 (after other useEffects)

## Expected Behavior After Fix

1. **User configures credentials in OAuth Authorization Code Flow V6**
2. **User clicks "Save Configuration"**
   - ✅ Saves to: `localStorage['oauth-authorization-code-v6-...']`
3. **User refreshes page**
   - ✅ useEffect runs on mount
   - ✅ Loads from: `localStorage['oauth-authorization-code-v6-...']`
   - ✅ Sets credentials state with saved values
4. **Result**: User sees the credentials they saved! ✅

## Testing Checklist

After implementing fix:
- [ ] Save credentials in OAuth Authorization Code Flow V6
- [ ] Note the environmentId and clientId
- [ ] Refresh the page (F5)
- [ ] Verify credentials are restored correctly
- [ ] Verify "Configuration saved successfully!" toast appears
- [ ] Verify all other flows still work (Hybrid, Implicit, etc.)

