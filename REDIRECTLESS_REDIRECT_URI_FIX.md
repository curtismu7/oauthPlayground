# Fixed: Redirectless Flow Using Wrong Redirect URI

## Date: October 29, 2025

## Problem
The backend was **hardcoding** `urn:pingidentity:redirectless` as the redirect URI, but this URI was:
1. **Not registered** in the PingOne application
2. **Not required** - PingOne accepts regular redirect URIs for redirectless flows

This caused PingOne to return an **HTML error page** instead of JSON, resulting in a 500 error.

## Root Cause
**File:** `server.js` line 1690
```javascript
// BEFORE (WRONG):
authParams.set('redirect_uri', 'urn:pingidentity:redirectless');

// AFTER (CORRECT):
authParams.set('redirect_uri', redirectUri || 'https://localhost:3000/p1auth-callback');
```

## What Changed
1. ✅ Backend now uses `redirectUri` from the request body
2. ✅ Falls back to `https://localhost:3000/p1auth-callback` if not provided
3. ✅ Added logging to show which redirect URI is being used

## How to Test

### Step 1: Restart Backend Server
```bash
# In your backend terminal, press Ctrl+C to stop, then:
cd /Users/cmuir/P1Import-apps/oauth-playground
node server.js
```

### Step 2: Verify Configuration
1. Navigate to: `http://localhost:3000/pingone-authentication`
2. Check that **Redirect URI** field shows: `https://localhost:3000/p1auth-callback`
3. This URI should be **registered in PingOne** (Applications → [Your App] → Configuration → Redirect URIs)

### Step 3: Test Redirectless Flow
1. Fill in credentials on the PingOne Authentication page
2. Scroll to **Redirectless Flow Configuration**
3. Enter username/password or click **HEB Grocery Login**
4. Click **Launch Redirectless Flow**

### Step 4: Check Backend Logs
You should now see:
```
[PingOne Redirectless] Redirect URI: https://localhost:3000/p1auth-callback
[PingOne Redirectless] POST Body: ...redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fp1auth-callback...
```

NOT:
```
[PingOne Redirectless] POST Body: ...redirect_uri=urn%3Apingidentity%3Aredirectless...
```

## Expected Result
✅ PingOne should return JSON (not HTML)
✅ You should see either:
   - 401 Unauthorized (credential issue - separate problem)
   - OR a flow status like `USERNAME_PASSWORD_REQUIRED`

❌ You should NO LONGER see:
   - 500 Internal Server Error
   - "Unexpected token '<', \"<!doctype \"... is not valid JSON"
   - HTML error page from PingOne

## Important Notes

### About Redirectless Flows
Even though this is a "redirectless" flow using `response_mode=pi.flow`:
- ✅ PingOne still **requires** a valid `redirect_uri` parameter
- ✅ The URI must be **registered** in your PingOne application
- ✅ The redirect won't actually happen (tokens are returned directly)

### Registered Redirect URIs in PingOne
Make sure these are registered in PingOne Admin Console → Applications → [Your App]:
- `https://localhost:3000/p1auth-callback` (for PingOne Authentication flow)
- `https://localhost:3000/authz-callback` (for Authorization Code flow)

## Next Steps
After the backend restarts, the 500 error should be fixed. If you still see a 401 error, that's the credential authentication issue we discussed earlier (separate problem).

## Files Changed
- `server.js` - Line 1690: Use `redirectUri` from request instead of hardcoded value
- `server.js` - Line 1683: Added logging for redirect URI
