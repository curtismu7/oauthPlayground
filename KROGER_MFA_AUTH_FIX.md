# Kroger MFA Authentication Flow - Fix Summary

## Issues Fixed

### 1. Wrong Client ID Being Used
**Problem:** Authorization requests were using the wrong client ID from legacy credentials instead of flow-specific credentials.

**Solution:** 
- Added `overrideConfig` parameter to `login()` function in NewAuthContext
- Kroger wrapper now passes flow-specific credentials to override global config
- File: `src/contexts/NewAuthContext.tsx`, `src/pages/flows/KrogerGroceryStoreMFAWrapper.tsx`

### 2. Invalid Scopes
**Problem:** Application was requesting scopes (`p1:read:user`, `openid profile email`) that weren't enabled in PingOne.

**Solution:**
- Changed default scope to `openid` (always granted in PingOne)
- Updated AuthorizationCodeConfigModal to show correct defaults
- Files: `src/components/AuthorizationCodeConfigModal.tsx`, `src/pages/flows/KrogerGroceryStoreMFAWrapper.tsx`

### 3. Redirect URI Mismatch
**Problem:** Code was using `/callback` but PingOne expected `/authz-callback`.

**Solution:**
- Created flow-specific redirect URI: `/kroger-authz-callback`
- Added route in App.tsx
- Updated all defaults throughout the flow
- Added warning message in modal about exact URI matching
- Files: `src/App.tsx`, `src/components/AuthorizationCodeConfigModal.tsx`, `src/pages/flows/KrogerGroceryStoreMFAWrapper.tsx`

### 4. Missing Credentials in Callback
**Problem:** Callback handler couldn't find client credentials for token exchange.

**Solution:**
- Store complete credentials (including client secret) in flowContext sessionStorage
- Callback reads credentials from flowContext instead of relying on global config
- File: `src/pages/flows/KrogerGroceryStoreMFAWrapper.tsx`

## Key Changes

### NewAuthContext.tsx
- Added optional `overrideConfig` parameter to `login()` function
- Allows flows to pass their own credentials without affecting global state

### KrogerGroceryStoreMFAWrapper.tsx
- Sets flowContext with complete credentials before login
- Passes override credentials to login()
- Uses flow-specific redirect URI: `https://localhost:3000/kroger-authz-callback`
- Default scope: `openid`

### AuthorizationCodeConfigModal.tsx
- Added warning about redirect URI needing exact match
- Changed default scope from `p1:read:user` to `openid`
- Changed default redirect URI from `/callback` to `/authz-callback`
- Better handling of empty/missing credentials

### App.tsx
- Added route: `/kroger-authz-callback` → `<AuthzCallback />`

## Configuration Requirements

### PingOne Application Settings
1. **Grant Types:** Authorization Code (enabled ✓)
2. **Response Types:** Code (enabled ✓)
3. **PKCE Enforcement:** Required
4. **Token Auth Method:** Client Secret Post
5. **Redirect URIs:** Must include `https://localhost:3000/kroger-authz-callback`
6. **Scopes:** At minimum `openid` (always granted)

### Flow Configuration
Users must configure via "Configure Auth Code Client" button:
- Environment ID
- Client ID
- Client Secret
- Redirect URI: `https://localhost:3000/kroger-authz-callback`
- Scopes: `openid` (or other enabled scopes)

## Flow Sequence

1. User clicks "Sign in with PingOne"
2. Wrapper validates credentials are configured
3. Wrapper stores flowContext with credentials in sessionStorage
4. Wrapper calls `login()` with override credentials
5. NewAuthContext builds authorization URL with override credentials
6. User redirected to PingOne for authentication
7. PingOne redirects back to `/kroger-authz-callback`
8. AuthzCallback reads credentials from flowContext
9. Callback exchanges code for tokens using flow credentials
10. User redirected back to Kroger MFA flow with tokens

## Testing

To test the flow:
1. Configure Auth Code Client with valid PingOne credentials
2. Ensure redirect URI matches exactly in PingOne
3. Click "Sign in with PingOne"
4. Complete authentication in PingOne
5. Should redirect back to Kroger flow with access token

## Future Improvements

- Consider applying flowContext pattern to all V7 flows for better credential isolation
- Add validation to ensure redirect URI in modal matches PingOne configuration
- Add scope validation against PingOne application configuration
