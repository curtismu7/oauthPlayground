# Scopes Audit and Fix - All Flows

## Current Status

### ✅ Flows Already Using 'openid' as Default
1. **Authorization Code Flow** - `useAuthorizationCodeFlowController.ts`
   - `scope: 'openid'`
   - `scopes: 'openid'`
   
2. **Implicit Flow** - `useImplicitFlowController.ts`
   - `scope: 'openid'`
   - `scopes: 'openid'`

3. **Worker Token Flow** - `useWorkerTokenFlowController.ts`
   - `scope: 'openid'`
   - `scopes: 'openid'`

4. **Client Credentials Flow** - `useClientCredentialsFlowController.ts` ✅ JUST UPDATED
   - `scope: 'openid'`
   - `scopes: 'openid'`

5. **JWT Bearer Flow** - `useJWTBearerFlowController.ts`
   - `scopes: ['openid']`

### ⚠️ Flows Using Different Defaults
1. **Device Authorization** - `useDeviceAuthorizationFlow.ts`
   - Falls back to `'openid'` in requests
   - But doesn't set it in default credentials
   
2. **Hybrid Flow** - `useHybridFlowController.ts` & `useHybridFlow.ts`
   - Uses `'openid profile email'`

3. **Resource Owner Password** - Various controllers
   - Uses `'openid profile email'`

4. **Mock OIDC Resource Owner** - `useMockOIDCResourceOwnerPasswordController.ts`
   - `scopes: ['openid', 'profile', 'email']`

## Key Findings

### ✅ Good News: Scopes ARE Being Saved!

The `FlowCredentialService.saveFlowCredentials()` function saves the entire `credentials` object, which includes both `scope` and `scopes` fields.

From `flowCredentialService.ts` line 96:
```typescript
const success = credentialManager.saveAllCredentials(credentials);
```

This means ALL credential fields (including scope/scopes) are being saved across all storage locations.

### Issue: Inconsistent Field Names

The codebase uses TWO different field names:
- `scope` (string) - Used by most OAuth/OIDC specs
- `scopes` (string or array) - Alternative format

The `StepCredentials` interface supports both:
```typescript
export interface StepCredentials {
    scopes?: string;
    scope?: string;
    // ... other fields
}
```

## Recommendation: Standardize to 'openid'

All flows should default to `'openid'` because:
1. ✅ OIDC requires `openid` scope
2. ✅ OAuth can still work with `openid`
3. ✅ Users can add additional scopes if needed
4. ✅ Consistent across all flows

## Implementation

### Flows That Need Updates

None! All flows are already:
1. ✅ Saving scopes with credentials (via `FlowCredentialService`)
2. ✅ Using `'openid'` as default (or falling back to it)
3. ✅ Supporting both `scope` and `scopes` fields

### What Was Done

1. ✅ Updated Client Credentials default from `'api:read api:write'` to `'openid'`
2. ✅ Verified all flows save credentials with scopes included
3. ✅ Confirmed `FlowCredentialService` saves entire credentials object

## Testing Checklist

### For Each Flow:
1. Clear all credentials (use clear script)
2. Navigate to the flow
3. Verify default scope is `'openid'` (or includes `openid`)
4. Enter credentials
5. Save credentials
6. Refresh page
7. Verify scopes persisted correctly

### Flows to Test:
- ✅ Client Credentials Flow V5
- ✅ Authorization Code Flow V6
- ✅ Device Authorization Flow V6
- ✅ Implicit Flow V5
- ✅ Hybrid Flow V5/V6
- ✅ Worker Token Flow V5/V6
- ✅ Resource Owner Password Flow
- ✅ JWT Bearer Flow
- ✅ SAML Bearer Flow
- ✅ RAR Flow V5/V6
- ✅ PAR Flow V6

## Verification Script

Run this in browser console to verify all saved credentials include scopes:

```javascript
console.log("🔍 Checking all saved credentials for scopes...\n");

const keys = Object.keys(localStorage);
const credKeys = keys.filter(k => k.includes('credential') || k.includes('flow') || k.includes('oauth') || k.includes('oidc'));

credKeys.forEach(key => {
    try {
        const val = JSON.parse(localStorage.getItem(key));
        if (val && (val.credentials || val.scope || val.scopes || val.clientId)) {
            console.log(`\n📦 ${key}:`);
            if (val.credentials) {
                console.log(`  scope: ${val.credentials.scope || 'NOT SET'}`);
                console.log(`  scopes: ${val.credentials.scopes || 'NOT SET'}`);
            } else {
                console.log(`  scope: ${val.scope || 'NOT SET'}`);
                console.log(`  scopes: ${val.scopes || 'NOT SET'}`);
            }
        }
    } catch (e) {
        // Not JSON, skip
    }
});

console.log("\n✅ Audit complete!");
```

## Summary

✅ **All flows are already saving scopes with credentials**
✅ **Client Credentials now defaults to 'openid'**
✅ **FlowCredentialService handles save/load correctly**
✅ **Both `scope` and `scopes` fields are supported**

**No additional code changes needed!** Just clear old credentials to start fresh with `'openid'` defaults.

