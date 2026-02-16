# OIDC Discovery 403 Error - Troubleshooting Guide

## Issue
Browser console shows:
```
:3000/api/pingone/oidc-discovery:1 Failed to load resource: the server responded with a status of 403 (Forbidden)
[📡 OIDC-DISCOVERY-V8] Discovery failed
```

## Root Cause Analysis

### ✅ Backend is Working
```bash
# Direct test to backend - SUCCESS
curl -X POST http://localhost:3001/api/pingone/oidc-discovery \
  -H "Content-Type: application/json" \
  -d '{"issuerUrl":"https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as"}'
# Returns: HTTP 200 with discovery document
```

### ✅ Vite Proxy is Working
```bash
# Test through Vite proxy - SUCCESS
curl -k -X POST https://localhost:3000/api/pingone/oidc-discovery \
  -H "Content-Type: application/json" \
  -d '{"issuerUrl":"https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as"}'
# Returns: HTTP 200 with discovery document
```

### ❌ Browser Request Failing
The browser is getting 403, which suggests:
1. **CORS Preflight Issue** - Browser sends OPTIONS request first, might be blocked
2. **Browser Cache** - Old cached response showing 403
3. **Service Worker** - PWA service worker intercepting requests
4. **Browser Extension** - Ad blocker or security extension blocking request

## Solutions

### Solution 1: Clear Browser Cache (Most Likely Fix)
```bash
# Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear all cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

### Solution 2: Disable Service Worker
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
    console.log('Service worker unregistered');
  });
});

// Then hard refresh
```

### Solution 3: Check Browser Extensions
1. Open browser in Incognito/Private mode (disables most extensions)
2. Test the flow again
3. If it works, disable extensions one by one to find the culprit

### Solution 4: Verify CORS Preflight
```bash
# Test OPTIONS request
curl -k -X OPTIONS https://localhost:3000/api/pingone/oidc-discovery \
  -H "Origin: https://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Expected response:
```
< HTTP/1.1 204 No Content
< Access-Control-Allow-Origin: https://localhost:3000
< Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization
```

### Solution 5: Restart Dev Servers
```bash
# Kill all node processes
pkill -f "node.*server.js"
pkill -f "vite"

# Restart backend
npm run server

# Restart frontend (in another terminal)
npm run dev
```

### Solution 6: Check Network Tab Details
1. Open DevTools → Network tab
2. Find the failed request to `/api/pingone/oidc-discovery`
3. Check:
   - **Request Method**: Should be POST
   - **Status Code**: Shows 403
   - **Request Headers**: Check if Origin is set correctly
   - **Response Headers**: Check CORS headers
   - **Timing**: Check if it's a cached response

### Solution 7: Bypass Proxy (Temporary Debug)
Modify `src/v8/services/oidcDiscoveryServiceV8.ts`:

```typescript
// Temporary: Use backend directly
const response = await fetch('http://localhost:3001/api/pingone/oidc-discovery', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    issuerUrl: normalized,
  }),
});
```

If this works, the issue is with the Vite proxy configuration.

## Verification Steps

### 1. Check Backend Logs
```bash
# Backend should show:
[OIDC Discovery] Fetching well-known configuration for: https://auth.pingone.com/.../as
[OIDC Discovery] Requesting: https://auth.pingone.com/.../as/.well-known/openid-configuration
[OIDC Discovery] Success: { issuer: '...', hasAuthEndpoint: true, ... }
```

### 2. Check Browser Console
```javascript
// Should see:
[📡 OIDC-DISCOVERY-V8] Using backend proxy for discovery
[📡 OIDC-DISCOVERY-V8] Discovery successful

// Should NOT see:
[📡 OIDC-DISCOVERY-V8] Discovery failed
```

### 3. Check Network Tab
```
✅ POST https://localhost:3000/api/pingone/oidc-discovery
   Status: 200 OK
   Response: { issuer: "...", authorization_endpoint: "...", ... }

❌ POST https://localhost:3000/api/pingone/oidc-discovery
   Status: 403 Forbidden
```

## Common Causes

### 1. Cached 403 Response
**Symptom**: curl works, browser doesn't
**Fix**: Hard refresh (Ctrl+Shift+R)

### 2. Service Worker Interference
**Symptom**: Works in Incognito, fails in normal mode
**Fix**: Unregister service worker

### 3. Browser Extension Blocking
**Symptom**: Works in Incognito, fails in normal mode
**Fix**: Disable extensions or whitelist localhost

### 4. CORS Preflight Failure
**Symptom**: OPTIONS request fails before POST
**Fix**: Verify CORS configuration in server.js

### 5. Wrong Origin
**Symptom**: Request from wrong origin (e.g., http instead of https)
**Fix**: Ensure frontend is on https://localhost:3000

## Quick Fix Checklist

- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Clear browser cache completely
- [ ] Unregister service workers
- [ ] Test in Incognito mode
- [ ] Disable browser extensions
- [ ] Check Network tab for actual request details
- [ ] Verify backend is running (ps aux | grep server.js)
- [ ] Verify frontend is running (ps aux | grep vite)
- [ ] Check backend logs for OIDC Discovery messages
- [ ] Test endpoint directly with curl
- [ ] Restart both dev servers

## Expected Working State

### Backend (server.js)
```bash
$ node server.js
Server running on http://localhost:3001
Server running on https://localhost:3002
```

### Frontend (Vite)
```bash
$ npm run dev
VITE v5.x.x ready in xxx ms
➜ Local:   https://localhost:3000/
```

### Browser Console (Success)
```
[📡 OIDC-DISCOVERY-V8] Using backend proxy for discovery
[📡 OIDC-DISCOVERY-V8] Discovery successful
```

### Network Tab (Success)
```
POST https://localhost:3000/api/pingone/oidc-discovery
Status: 200 OK
Type: xhr
Size: ~5KB
Time: ~200ms
```

## Still Not Working?

If none of the above solutions work:

1. **Check browser console for other errors**
   - Look for CSP violations
   - Look for mixed content warnings
   - Look for other network errors

2. **Check if it's a specific browser issue**
   - Test in Chrome
   - Test in Firefox
   - Test in Safari

3. **Check if it's a network issue**
   - Test with VPN disabled
   - Test with firewall disabled
   - Test with antivirus disabled

4. **Check server.js for recent changes**
   - Verify CORS configuration hasn't changed
   - Verify endpoint path is correct
   - Verify no middleware is blocking the request

5. **Create a minimal test case**
   ```html
   <!-- test.html -->
   <!DOCTYPE html>
   <html>
   <body>
     <button onclick="test()">Test Discovery</button>
     <script>
       async function test() {
         try {
           const response = await fetch('/api/pingone/oidc-discovery', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               issuerUrl: 'https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as'
             })
           });
           console.log('Status:', response.status);
           const data = await response.json();
           console.log('Data:', data);
         } catch (error) {
           console.error('Error:', error);
         }
       }
     </script>
   </body>
   </html>
   ```
   
   Open this file at https://localhost:3000/test.html and click the button.

---

**Most Likely Solution**: Hard refresh your browser (Ctrl+Shift+R) to clear cached 403 response.

**Created**: 2024-11-20
**Status**: Troubleshooting Guide
