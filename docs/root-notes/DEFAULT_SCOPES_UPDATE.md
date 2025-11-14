# Default Scopes Update to 'openid'

## Changes Made

### 1. Client Credentials Flow ✅
**File**: `src/hooks/useClientCredentialsFlowController.ts`

Updated default scopes from `'api:read api:write'` to `'openid'`:

```typescript
const createEmptyCredentials = (): StepCredentials => ({
    // ...
    scope: 'openid',        // Changed from 'api:read api:write'
    scopes: 'openid',       // Changed from 'api:read api:write'
    // ...
});

const createEmptyConfig = (): ClientCredentialsConfig => ({
    // ...
    scopes: 'openid',       // Changed from 'api:read api:write'
    // ...
});
```

### 2. All Other Flows
Most other flows already default to `'openid'` or `'openid profile email'`:

- ✅ **Authorization Code Flow**: Already uses `'openid'`
- ✅ **Implicit Flow**: Already uses `'openid'`
- ✅ **Hybrid Flow**: Already uses `'openid'`
- ✅ **Device Authorization**: Uses `'openid profile email'`
- ✅ **RAR Flows**: Use `'openid profile email'`
- ✅ **Comprehensive Credentials Service**: Defaults to `'openid profile email'`

## Clear All Saved Credentials

To start fresh with the new default scopes, run this script in your browser console:

### How to Clear:
1. Open the OAuth Playground in your browser
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Copy and paste the script below
5. Press **Enter**
6. **Refresh the page** (Cmd+R or Ctrl+R)

### The Script:

```javascript
console.log("🧹 Clearing all saved OAuth credentials from localStorage...\n");

const credentialKeys = [
    'client_credentials_config', 'client_credentials_tokens',
    'client-credentials-v5', 'client-credentials-oauth-client-credentials-v5',
    'device_flow_credentials', 'device_authorization_v6_credentials',
    'oidc_device_authorization_v6_credentials', 'authorization_code_credentials',
    'oauth-authorization-code-v6', 'oidc-authorization-code-v6',
    'authz-callback-state', 'rar-v5-credentials', 'rar-v6-credentials',
    'rar-v5-authorization-details', 'rar-v6-authorization-details',
    'rar-v5-auth-url', 'rar-v6-auth-url', 'par-v6-credentials',
    'pingone-par-v6-credentials', 'implicit-flow-v5', 'implicit-flow-v6',
    'oauth-implicit-v5-1-config', 'hybrid-flow-v5', 'hybrid-flow-v6',
    'oidc_hybrid_v3_credentials', 'resource-owner-password-v5',
    'resource-owner-password-v6', 'worker-token-flow-v5',
    'worker-token-flow-v6', 'jwt-bearer-flow-v5', 'jwt-bearer-flow-v6',
    'saml-bearer-flow-v5', 'saml-bearer-flow-v6', 'pingone_config',
    'pingone_permanent_credentials', 'login_credentials',
    'oauth-v4-test-config', 'flow_source',
    'oidc_client_credentials_v3_credentials',
    'oauth2_client_credentials_v3_credentials',
    'oidc_implicit_v3_credentials', 'oauth2_implicit_v3_credentials',
    'oidc_hybrid_v3_credentials',
];

let clearedCount = 0;
credentialKeys.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`✅ Cleared: ${key}`);
        clearedCount++;
    }
});

// Clear any additional credential-like keys
const allKeys = Object.keys(localStorage);
const patterns = [/credentials/i, /oauth/i, /oidc/i, /token/i, /flow.*v[0-9]/i];
allKeys.forEach(key => {
    if (patterns.some(p => p.test(key)) && !credentialKeys.includes(key)) {
        try {
            const val = JSON.parse(localStorage.getItem(key));
            if (val.clientId || val.clientSecret || val.environmentId || val.credentials) {
                localStorage.removeItem(key);
                console.log(`✅ Cleared (pattern): ${key}`);
                clearedCount++;
            }
        } catch (e) {}
    }
});

console.log(`\n📊 Cleared ${clearedCount} credential entries`);
console.log(`\n✨ All credentials cleared! Refresh the page to start fresh with 'openid' scopes.`);
```

## After Clearing

1. **Refresh the page** (Cmd+R or Ctrl+R)
2. All flows will start with clean default credentials
3. Client Credentials will default to `openid` scope
4. Other flows will default to `openid` or `openid profile email`
5. Enter your new credentials and they will save properly

## Testing

To verify the new defaults:

1. Clear credentials using the script above
2. Refresh the page
3. Go to **Client Credentials Flow V5**
4. Check the Scopes field - should show `openid`
5. Go to other flows - should see `openid` or `openid profile email`

## Benefits

- ✅ Consistent default scopes across all flows
- ✅ OIDC-compliant by default (`openid` is required for OIDC)
- ✅ Fresh start with no old credential conflicts
- ✅ All input fields now work properly with debouncing

