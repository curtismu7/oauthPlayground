# Implicit Callback 404 Troubleshooting Guide

## Issue
Getting 404 error when redirected to `/implicit-callback` with tokens.

## Quick Checks

### 1. Is the Dev Server Running?
```bash
# Check if running on port 3000
lsof -i :3000

# If not running, start it:
npm run dev
```

### 2. Check Session Storage Flags

Open browser console and run:
```javascript
console.log('OAuth Flag:', sessionStorage.getItem('oauth-implicit-v5-flow-active'));
console.log('OIDC Flag:', sessionStorage.getItem('oidc-implicit-v5-flow-active'));
```

**Expected:** One of these should be `'true'`

If both are `null`, the callback won't know which flow to redirect to!

### 3. Check Your PingOne Redirect URI Configuration

In your PingOne application settings, make sure the redirect URI matches EXACTLY:

**For OAuth Implicit:**
```
https://localhost:3000/oauth-implicit-callback
```

**For OIDC Implicit:**
```
https://localhost:3000/oidc-implicit-callback
```

**Or use the generic callback (works for both):**
```
https://localhost:3000/implicit-callback
```

## How the Callback Flow Works

1. **User starts flow** → Session storage flag is set
2. **User redirects to PingOne** → PingOne authenticates
3. **PingOne redirects back** → Tokens in URL hash
4. **Callback page loads** → Checks session storage flags
5. **Redirects to flow page** → With tokens in hash

## Current Setup

Based on your URL, you're using:
- ✅ HTTPS: Yes (`https://localhost:3000`)
- ✅ Tokens present: Yes (access_token in hash)
- ⚠️ Callback URL: `/implicit-callback` (generic, should work)

## Solutions

### Solution 1: Use Flow-Specific Callback URLs (Recommended)

Update your PingOne application redirect URI to:

**For OAuth 2.0 Implicit (authorization only):**
```
https://localhost:3000/oauth-implicit-callback
```

**For OIDC Implicit (authentication + authorization):**
```
https://localhost:3000/oidc-implicit-callback
```

### Solution 2: Manually Set Session Storage (For Testing)

Before clicking "Redirect to PingOne", open console and run:

**For OAuth flow:**
```javascript
sessionStorage.setItem('oauth-implicit-v5-flow-active', 'true');
sessionStorage.removeItem('oidc-implicit-v5-flow-active');
```

**For OIDC flow:**
```javascript
sessionStorage.setItem('oidc-implicit-v5-flow-active', 'true');
sessionStorage.removeItem('oauth-implicit-v5-flow-active');
```

### Solution 3: Check if Page is Actually Loading

The callback page should show:
- 🔄 "Processing Implicit Grant" (loading)
- ✅ "Implicit Grant Successful" (success)
- Then auto-redirect to the flow page

If you're seeing a blank page or actual 404, the issue is different.

## Debug Steps

### Step 1: Open Browser DevTools Console

Look for these log messages:
```
🔐 [ImplicitCallback] Debug parsing: ...
🔐 [ImplicitCallback] V5 implicit grant received, returning to flow
```

### Step 2: Check Network Tab

- Look for the `/implicit-callback` request
- Should be 200 OK (not 404)
- Check if React app is loading

### Step 3: Check Application Tab → Session Storage

Should see:
```
Key: oauth-implicit-v5-flow-active
Value: true

OR

Key: oidc-implicit-v5-flow-active  
Value: true
```

## Common Issues

### Issue 1: Session Storage Flag Missing

**Symptom:** Callback shows "Deprecated flow" warning  
**Cause:** Session storage flags not set before redirect  
**Fix:** Ensure you click "Generate Authorization URL" before redirecting

### Issue 2: Wrong Redirect URI in PingOne

**Symptom:** 404 or CORS error  
**Cause:** Redirect URI in PingOne doesn't match actual URL  
**Fix:** Update PingOne app redirect URI to match exactly

### Issue 3: React Router Not Loading

**Symptom:** Actual 404 page (not React app)  
**Cause:** Vite dev server not running or crashed  
**Fix:** Restart dev server with `npm run dev`

### Issue 4: HTTPS Certificate Issues

**Symptom:** Browser blocks page load  
**Cause:** Self-signed SSL certificate  
**Fix:** Click "Advanced" → "Proceed to localhost (unsafe)" in browser

## Verify Your Setup

Run this in the flow page console BEFORE clicking "Redirect to PingOne":

```javascript
// This should happen automatically, but you can check:
console.log('Session flags:', {
  oauth: sessionStorage.getItem('oauth-implicit-v5-flow-active'),
  oidc: sessionStorage.getItem('oidc-implicit-v5-flow-active')
});

// Your auth URL should look like:
// https://auth.pingone.com/{env-id}/as/authorize?
//   client_id=...
//   &redirect_uri=https://localhost:3000/oauth-implicit-callback  (or oidc-implicit-callback)
//   &response_type=token  (OAuth) or id_token token (OIDC)
//   &state=...
```

## What Your URL Shows

From your error URL, I can see:
- ✅ `access_token` is present
- ✅ `token_type=Bearer`  
- ✅ `expires_in=3600`
- ✅ `scope=openid` - This suggests it's an OIDC flow
- ✅ `state=mc36ykv60ve8p6g30lj14`
- ⚠️ Response type appears to be `token` only (no `id_token`)

**This looks like OAuth 2.0 Implicit, not OIDC Implicit** (scope=openid but no id_token)

You should use:
- **Redirect URI:** `https://localhost:3000/oauth-implicit-callback`
- **Flow:** OAuth Implicit V5 (`/flows/oauth-implicit-v5`)

## Still Not Working?

Share:
1. Console output (any errors?)
2. What page you see (blank? 404? callback page?)
3. Session storage contents
4. Which flow you started from

---

**Quick Fix to Try Right Now:**

1. Go to: `https://localhost:3000/flows/oauth-implicit-v5`
2. Fill in credentials
3. Click "Generate Authorization URL"  
4. **Check console for:** `Session storage flag set`
5. Then click "Redirect to PingOne"
6. After authentication, should redirect back successfully

If it still fails, the session storage flag might not be persisting through the redirect.

