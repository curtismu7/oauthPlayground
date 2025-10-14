# Fix Implicit Flow - Correct Client ID

## Correct Client ID for Implicit Flow
```
b875caab-7644-438d-848e-06ffe2a5b7ca
```

## Quick Fix - Run in Browser Console (F12)

**Copy and paste this into your browser console:**

```javascript
// Update permanent credentials with correct Implicit flow client ID
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');

console.log("❌ OLD Client ID:", creds.clientId);
console.log("❌ OLD Redirect URI:", creds.redirectUri);

// Update with correct Implicit flow values
creds.clientId = 'b875caab-7644-438d-848e-06ffe2a5b7ca';
creds.redirectUri = 'https://localhost:3000/implicit-callback';

// Save updated credentials
localStorage.setItem('pingone_permanent_credentials', JSON.stringify(creds));

console.log("✅ NEW Client ID:", creds.clientId);
console.log("✅ NEW Redirect URI:", creds.redirectUri);
console.log("✅ Credentials updated! Reloading...");

// Reload page to apply changes
location.reload();
```

## Verify the Fix

After reloading, run this to confirm:

```javascript
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
console.log("Current Client ID:", creds.clientId);
console.log("Expected:", "b875caab-7644-438d-848e-06ffe2a5b7ca");
console.log("Match:", creds.clientId === 'b875caab-7644-438d-848e-06ffe2a5b7ca' ? '✅ CORRECT' : '❌ WRONG');
```

## PingOne Configuration Checklist

Make sure your PingOne application `b875caab-7644-438d-848e-06ffe2a5b7ca` has:

1. ✅ **Grant Types**: Implicit enabled
2. ✅ **Response Types**: 
   - Token (for OAuth implicit)
   - ID Token (for OIDC implicit)
3. ✅ **Redirect URI**: `https://localhost:3000/implicit-callback`
4. ✅ **Application Type**: OIDC Web App or Single Page App
5. ✅ **Token Endpoint Auth**: None (public client)

## After Fixing

1. ✅ Run the console script above
2. ✅ Page will reload automatically
3. ✅ Go to Implicit Flow page
4. ✅ Click "Save Configuration" to persist
5. ✅ Try the flow again!

## Summary

- **Wrong Client ID** (was loading): Various wrong IDs from other flows
- **Correct Client ID** (should be): `b875caab-7644-438d-848e-06ffe2a5b7ca`
- **Redirect URI**: `https://localhost:3000/implicit-callback`

The issue was that the Implicit flow was loading shared credentials from `localStorage` that had the wrong client ID from another flow.

