# How to Clear OAuth/OIDC Flow SessionStorage

If you're experiencing issues with flows jumping to the wrong step (e.g., OIDC V5 going to step 4 instead of step 0), it's likely due to stale authorization codes in your browser's sessionStorage.

## Quick Fix: Clear SessionStorage via Browser Console

1. **Open Browser Console**:
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
   - Click on the "Console" tab

2. **Paste and Run This Script**:

```javascript
// Clear all OAuth/OIDC flow sessionStorage
const keysToRemove = [
  'oauth_auth_code',
  'oauth_state',
  'flowContext',
  'oauth-authorization-code-v5-current-step',
  'oidc-authorization-code-v5-current-step',
  'oidc-authorization-code-v6-current-step',
  'oauth-authorization-code-v5-app-config',
  'oidc-authorization-code-v5-app-config',
  'oidc-authorization-code-v6-app-config',
  'restore_step'
];

keysToRemove.forEach(key => {
  if (sessionStorage.getItem(key)) {
    console.log(`Removing: ${key}`);
    sessionStorage.removeItem(key);
  }
});

console.log('✅ SessionStorage cleared! Please refresh the page.');
```

3. **Refresh the Page**: Press `F5` or `Cmd+R` (Mac) / `Ctrl+R` (Windows/Linux)

## What Was Fixed

The flows now check if authorization codes in sessionStorage are "stale" (older than 10 minutes). Stale codes are automatically ignored, preventing the flow from jumping to step 4 with an expired authorization code.

## Why This Happens

- Authorization codes from PingOne are stored in sessionStorage when you complete an OAuth/OIDC redirect
- These codes typically expire within 5-10 minutes
- If you navigate away and come back later, the old code might still be in sessionStorage
- The flow would try to use this stale code and jump to the token exchange step

## Prevention

The application now automatically:
- Stores timestamps with authorization codes
- Ignores codes older than 10 minutes
- Clears stale codes automatically

However, if you want to manually clear everything and start fresh, use the script above.







