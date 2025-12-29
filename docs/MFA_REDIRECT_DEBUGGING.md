# MFA Redirect Debugging Guide

**Last Updated:** 2025-02-05  
**Version:** 7.7.2

---

## Problem

Users are being redirected to the MFA Hub (`/v8/mfa-hub`) instead of the specific flow page (e.g., `/v8/mfa/register/email/device`) after PingOne authentication.

---

## Debugging Steps

### Step 1: Check Browser Console

Open browser console (F12) and look for these log messages:

#### Before Redirect to PingOne:
```
[👤 USER-LOGIN-MODAL-V8] ✅ Stored return path: /v8/mfa/register/email/device?step=1
[👤 USER-LOGIN-MODAL-V8] 🔍 DEBUG: Verified stored return path: /v8/mfa/register/email/device?step=1
[👤 USER-LOGIN-MODAL-V8] 🔍 DEBUG: Redirect URI decision: { isMfaFlow: true, finalRedirectUri: "https://localhost:3000/user-mfa-login-callback", ... }
```

**Expected:** Should show the return path being stored and the redirect URI being set to `user-mfa-login-callback`.

#### After OAuth Callback:
```
[🔄 CALLBACK-HANDLER-V8U] ✅ User login callback detected - redirecting back to MFA flow
[🔄 CALLBACK-HANDLER-V8U] 🔍 DEBUG: All sessionStorage keys: [...]
[🔄 CALLBACK-HANDLER-V8U] 🔍 DEBUG: Return path value: /v8/mfa/register/email/device?step=1
[🔄 CALLBACK-HANDLER-V8U] ✅ Found stored return path: /v8/mfa/register/email/device?step=1
[🔄 CALLBACK-HANDLER-V8U] 🚀 Redirecting to MFA flow: /v8/mfa/register/email/device?step=1?code=...
```

**If you see:**
```
[🔄 CALLBACK-HANDLER-V8U] ⚠️ No return path found in sessionStorage!
[🔄 CALLBACK-HANDLER-V8U] ⚠️ Redirecting to MFA hub as fallback
```

This means the return path was not found. See **Common Issues** below.

---

## Common Issues

### Issue 1: PingOne Application Not Configured with New Redirect URI

**Symptom:** OAuth callback goes to wrong route or fails.

**Fix:**
1. Go to PingOne Console: https://console.pingone.com/
2. Navigate to your application (the one with the Client ID you're using)
3. Go to **Configuration** → **Redirect URIs**
4. **Add** this URI if it's not there:
   ```
   https://localhost:3000/user-mfa-login-callback
   ```
5. **Save** the application
6. **Clear browser cache** and try again

---

### Issue 2: Cached Credentials Using Old Redirect URI

**Symptom:** The redirect URI field shows `user-login-callback` instead of `user-mfa-login-callback`.

**Fix:**

#### Option A: Clear in UI
1. Open the User Login Modal
2. Find the "Redirect URI" field
3. **Delete the value** (or change it to `https://localhost:3000/user-mfa-login-callback`)
4. Click "Save Configuration"
5. Try the flow again

#### Option B: Clear in Browser Console
```javascript
// Clear cached credentials
localStorage.removeItem('user-login-v8');
sessionStorage.removeItem('user_login_credentials_temp_v8');
sessionStorage.removeItem('user_login_redirect_uri_v8');

// Reload page
location.reload();
```

---

### Issue 3: SessionStorage Cleared Prematurely

**Symptom:** Console shows return path was stored, but it's missing when callback handler runs.

**Possible Causes:**
- Browser extension clearing sessionStorage
- Multiple tabs/windows interfering
- Service worker clearing storage

**Fix:**
1. **Close all other tabs** with the app open
2. **Disable browser extensions** temporarily
3. **Clear browser cache** completely
4. Try again in a **fresh incognito/private window**

---

### Issue 4: Wrong Redirect URI in PingOne Authorization Request

**Symptom:** PingOne rejects the authorization request or redirects to wrong callback.

**Check:**
1. In browser console, look for the authorization URL before redirect
2. Check the `redirect_uri` parameter in the URL
3. It should be: `redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fuser-mfa-login-callback`

**If it's wrong:**
- The cached credentials have the old redirect URI
- Follow **Issue 2** fix above

---

## Manual Verification

### Check SessionStorage Before Redirect

1. Open browser console (F12)
2. Before clicking "Start Authentication", run:
```javascript
console.log('Return path:', sessionStorage.getItem('user_login_return_to_mfa'));
console.log('All keys:', Object.keys(sessionStorage));
```

3. Click "Start Authentication"
4. Immediately check again (before redirect):
```javascript
console.log('Return path after click:', sessionStorage.getItem('user_login_return_to_mfa'));
```

**Expected:** Should show the full path (e.g., `/v8/mfa/register/email/device?step=1`)

### Check SessionStorage After Callback

1. After PingOne redirects back, check console
2. Look for the callback handler logs
3. If return path is missing, manually check:
```javascript
console.log('Return path:', sessionStorage.getItem('user_login_return_to_mfa'));
console.log('All keys:', Object.keys(sessionStorage));
```

---

## Quick Fix Script

If nothing else works, run this in browser console **before** clicking "Start Authentication":

```javascript
// Force set return path
const currentPath = window.location.pathname;
const currentSearch = window.location.search;
const fullPath = currentSearch ? `${currentPath}${currentSearch}` : currentPath;

if (currentPath.startsWith('/v8/mfa')) {
  sessionStorage.setItem('user_login_return_to_mfa', fullPath);
  console.log('✅ Manually set return path:', fullPath);
} else {
  console.warn('⚠️ Not an MFA flow path:', currentPath);
}
```

---

## Expected Flow

1. ✅ User is on `/v8/mfa/register/email/device?step=1`
2. ✅ User clicks "Start Authentication"
3. ✅ `user_login_return_to_mfa` is stored in sessionStorage with value `/v8/mfa/register/email/device?step=1`
4. ✅ Redirect URI is set to `https://localhost:3000/user-mfa-login-callback`
5. ✅ User authenticates with PingOne
6. ✅ PingOne redirects to `/user-mfa-login-callback?code=...&state=...`
7. ✅ `CallbackHandlerV8U` reads `user_login_return_to_mfa` from sessionStorage
8. ✅ User is redirected to `/v8/mfa/register/email/device?step=1?code=...&state=...`
9. ✅ Flow continues from where they left off

---

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Check the exact console errors** - copy and paste them
2. **Check the network tab** - see what redirect URI is actually being sent to PingOne
3. **Verify PingOne app configuration** - make sure `user-mfa-login-callback` is in the Redirect URIs list
4. **Try in incognito mode** - to rule out browser extensions/cache
5. **Check if multiple tabs are open** - close all other tabs

---

## Related Files

- `src/v8/components/UserLoginModalV8.tsx` - Stores return path before redirect
- `src/v8u/components/CallbackHandlerV8U.tsx` - Reads return path and redirects
- `src/v8/flows/shared/MFAFlowBaseV8.tsx` - Handles state restoration after redirect

