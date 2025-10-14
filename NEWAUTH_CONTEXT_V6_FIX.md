# NewAuthContext V6 Flow Detection Fix ✅

## Issue
**Error:** "Token exchange failed: Invalid authorization code or PKCE mismatch"

V6 flows (OAuth, OIDC, PAR, RAR) were failing with PKCE mismatch errors even though PKCE codes were correctly stored in sessionStorage.

## Root Cause
**NewAuthContext was intercepting V6 flow callbacks and doing immediate token exchange instead of redirecting to the flow page!**

### The Problem Flow
1. User completes authentication on PingOne
2. PingOne redirects to `/authz-callback?code=...`
3. **NewAuthContext detects the callback URL** (wraps entire app)
4. It looks for `flowContext` in sessionStorage → **NOT FOUND** (V6 flows use `active_oauth_flow` instead!)
5. Falls through to immediate token exchange
6. Uses WRONG/OLD `code_verifier` from generic key
7. Token exchange fails with PKCE mismatch!

### Why This Happened
- **V3 flows** set `flowContext` in sessionStorage with `flow: 'oauth-authorization-code-v3'`
- **V6 flows** set `active_oauth_flow` in sessionStorage with value `'oauth-authorization-code-v6'`
- NewAuthContext only checked for `flowContext`, not `active_oauth_flow`
- Result: V6 flows were treated as "unknown" flows → immediate token exchange

## Solution
Added fallback check in NewAuthContext to detect V6 flows using `active_oauth_flow` when `flowContext` is not present.

### Code Changes
**File:** `src/contexts/NewAuthContext.tsx`

**Added after line 1132:**
```typescript
// FALLBACK: Check for V6 flows using active_oauth_flow (when flowContext is not set)
const activeOAuthFlow = sessionStorage.getItem('active_oauth_flow');
if (activeOAuthFlow) {
    console.log(' [NewAuthContext] V6 FLOW DETECTED via active_oauth_flow:', activeOAuthFlow);
    
    // Persist auth code for the flow page
    if (code) {
        sessionStorage.setItem('oauth_auth_code', code);
        sessionStorage.setItem(`${activeOAuthFlow}-authCode`, code);
    }
    if (state) {
        sessionStorage.setItem('oauth_state', state);
    }
    
    // Determine redirect path based on active flow
    let returnPath = '/flows/oauth-authorization-code-v6';
    if (activeOAuthFlow.includes('oidc-authorization-code')) {
        returnPath = '/flows/oidc-authorization-code-v6';
    } else if (activeOAuthFlow.includes('oauth-authorization-code')) {
        returnPath = '/flows/oauth-authorization-code-v6';
    } else if (activeOAuthFlow.includes('par')) {
        returnPath = '/flows/par-flow';
    } else if (activeOAuthFlow.includes('rar')) {
        returnPath = '/flows/rar-flow';
    }
    
    console.log(' [NewAuthContext] Deferring to V6 flow page:', returnPath);
    return { success: true, redirectUrl: returnPath };
}
```

## How It Works Now

### Correct Flow (After Fix)
1. User completes authentication on PingOne
2. PingOne redirects to `/authz-callback?code=...`
3. **NewAuthContext detects callback URL**
4. Checks for `flowContext` → NOT FOUND
5. **✅ NEW: Checks for `active_oauth_flow`** → FOUND: `'oauth-authorization-code-v6'`
6. Stores auth code: `sessionStorage.setItem('oauth-authorization-code-v6-authCode', code)`
7. **Returns redirect URL:** `/flows/oauth-authorization-code-v6`
8. App redirects to the flow page
9. V6 flow page loads PKCE codes from correct key: `oauth-authorization-code-v6-pkce-codes`
10. Token exchange succeeds! ✅

## Benefits
1. **V6 flows now work correctly** - No more PKCE mismatch
2. **No breaking changes** - V3 flows still use `flowContext` and work as before
3. **Consistent behavior** - All V6 flows (OAuth, OIDC, PAR, RAR) now defer to their flow pages
4. **Proper PKCE handling** - Each flow uses its own stored PKCE codes

## Files Modified
- ✅ `src/contexts/NewAuthContext.tsx` - Added `active_oauth_flow` fallback detection
- ✅ `src/hooks/useAuthorizationCodeFlowController.ts` - Fixed PKCE retrieval key (previous fix)

## Testing
To verify the fix:

1. Clear storage: `sessionStorage.clear(); localStorage.clear();`
2. Navigate to OAuth Authorization Code V6 flow
3. Enter credentials and save
4. Click "Step 2: Redirect to PingOne"
5. Log in to PingOne
6. **Check console for:**
   ```
   ✅ [NewAuthContext] V6 FLOW DETECTED via active_oauth_flow: oauth-authorization-code-v6
   ✅ [NewAuthContext] Deferring to V6 flow page: /flows/oauth-authorization-code-v6
   ```
7. Verify you're redirected to the flow page (NOT stuck on `/authz-callback`)
8. Verify token exchange succeeds
9. Verify you get access_token and id_token

## Related Fixes
This fix complements:
- **PKCE Retrieval Fix** (`PKCE_MISMATCH_FIX.md`) - Ensures correct key is used for PKCE codes
- **Redirect Mode Fix** (`V6_FLOWS_COMPREHENSIVE_FIX.md`) - Switched from popup to redirect mode
- **Credential Storage Fix** (`OAUTH_AUTHZ_FLOWS_FIXED.md`) - Added `saveAuthzFlowCredentials()`

## Status
✅ **FIXED** - V6 flows now correctly defer to flow pages instead of immediate token exchange

---

**Date:** October 12, 2025  
**Issue:** NewAuthContext intercepting V6 callbacks  
**Resolution:** Added `active_oauth_flow` fallback detection  
**Impact:** Fixes OAuth, OIDC, PAR, RAR V6 flows  
**File:** `src/contexts/NewAuthContext.tsx`

