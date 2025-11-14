# Clear All Credentials Script

## Purpose
Reset all saved OAuth credentials from localStorage to start fresh with default `openid` scopes.

## How to Use

1. **Open your browser** to the OAuth Playground app
2. **Press F12** to open Developer Tools
3. **Click on the Console tab**
4. **Copy and paste the script below**
5. **Press Enter**
6. **Refresh the page** (Cmd+R or Ctrl+R)

## Script

```javascript
// Clear All Saved Credentials Script
// Copy and paste this into your browser console (F12) to reset all credentials to fresh state

console.log("🧹 Clearing all saved OAuth credentials from localStorage...\n");

// List of all credential storage keys across all flows
const credentialKeys = [
    // Client Credentials
    'client_credentials_config',
    'client_credentials_tokens',
    'client-credentials-v5',
    'client-credentials-oauth-client-credentials-v5',
    
    // Device Authorization
    'device_flow_credentials',
    'device_authorization_v6_credentials',
    'oidc_device_authorization_v6_credentials',
    
    // Authorization Code
    'authorization_code_credentials',
    'oauth-authorization-code-v6',
    'oidc-authorization-code-v6',
    'authz-callback-state',
    
    // RAR (Rich Authorization Requests)
    'rar-v5-credentials',
    'rar-v6-credentials',
    'rar-v5-authorization-details',
    'rar-v6-authorization-details',
    'rar-v5-auth-url',
    'rar-v6-auth-url',
    
    // PAR (Pushed Authorization Request)
    'par-v6-credentials',
    'pingone-par-v6-credentials',
    
    // Implicit Flow
    'implicit-flow-v5',
    'implicit-flow-v6',
    'oauth-implicit-v5-1-config',
    
    // Hybrid Flow
    'hybrid-flow-v5',
    'hybrid-flow-v6',
    'oidc_hybrid_v3_credentials',
    
    // Resource Owner Password
    'resource-owner-password-v5',
    'resource-owner-password-v6',
    
    // Worker Token Flow
    'worker-token-flow-v5',
    'worker-token-flow-v6',
    
    // JWT Bearer
    'jwt-bearer-flow-v5',
    'jwt-bearer-flow-v6',
    
    // SAML Bearer
    'saml-bearer-flow-v5',
    'saml-bearer-flow-v6',
    
    // Legacy/Shared credentials
    'pingone_config',
    'pingone_permanent_credentials',
    'login_credentials',
    'oauth-v4-test-config',
    'flow_source',
    
    // V3 flows
    'oidc_client_credentials_v3_credentials',
    'oauth2_client_credentials_v3_credentials',
    'oidc_implicit_v3_credentials',
    'oauth2_implicit_v3_credentials',
    'oidc_hybrid_v3_credentials',
];

let clearedCount = 0;
let skippedCount = 0;

credentialKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
        localStorage.removeItem(key);
        console.log(`✅ Cleared: ${key}`);
        clearedCount++;
    } else {
        skippedCount++;
    }
});

// Also clear any keys that match common patterns
const allKeys = Object.keys(localStorage);
const patterns = [
    /credentials/i,
    /oauth/i,
    /oidc/i,
    /token/i,
    /flow.*v[0-9]/i,
];

allKeys.forEach(key => {
    if (patterns.some(pattern => pattern.test(key)) && !credentialKeys.includes(key)) {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                const parsed = JSON.parse(value);
                if (parsed.clientId || parsed.clientSecret || parsed.environmentId || parsed.credentials) {
                    localStorage.removeItem(key);
                    console.log(`✅ Cleared (pattern match): ${key}`);
                    clearedCount++;
                }
            } catch (e) {
                // Not JSON, skip
            }
        }
    }
});

console.log(`\n📊 Summary:`);
console.log(`   Cleared: ${clearedCount} credential entries`);
console.log(`   Skipped: ${skippedCount} (not found)`);
console.log(`\n✨ All credentials cleared! Refresh the page to start fresh with default 'openid' scopes.`);
```

## What This Clears

- ✅ Client Credentials Flow credentials
- ✅ Device Authorization Flow credentials
- ✅ Authorization Code Flow credentials
- ✅ RAR (Rich Authorization Requests) credentials
- ✅ PAR (Pushed Authorization Request) credentials
- ✅ Implicit Flow credentials
- ✅ Hybrid Flow credentials
- ✅ Resource Owner Password credentials
- ✅ Worker Token Flow credentials
- ✅ JWT Bearer Flow credentials
- ✅ SAML Bearer Flow credentials
- ✅ All legacy/shared credentials
- ✅ All V3 flow credentials

## After Running

1. **Refresh the page** (Cmd+R or Ctrl+R)
2. All flows will start with fresh default credentials
3. Default scopes will be `openid` for all flows
4. You can enter new credentials and they will save properly

## Note

- This does NOT clear UI settings, preferences, or discovery cache
- Only OAuth credential data is cleared
- Safe to run multiple times

