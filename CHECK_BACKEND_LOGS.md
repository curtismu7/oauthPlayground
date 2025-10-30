# Backend Logs Needed

## Problem
We're still getting a 500 error with HTML response from PingOne, even though we fixed the `redirectUri` extraction.

## What to Check

### 1. Backend Terminal Logs
Look for these specific log lines in your backend terminal:

```bash
[PingOne Redirectless] Received request body: {...}
[PingOne Redirectless] Starting authorization request
[PingOne Redirectless] Environment ID: b9817c16-9910-4415-b67e-4ac687da74d9
[PingOne Redirectless] Client ID: bdb78dcc...
[PingOne Redirectless] Has Client Secret: true
[PingOne Redirectless] Redirect URI: https://localhost:3000/p1auth-callback  <-- THIS IS KEY!
[PingOne Redirectless] Scopes: openid
[PingOne Redirectless] Has PKCE: true
```

### 2. Response Error Logs
Look for these error logs showing what PingOne returned:

```bash
[PingOne Redirectless] Response is not valid JSON: <!doctype html>...
```

This will tell us what HTML error page PingOne is returning.

## Most Likely Issue

If the backend logs show `[PingOne Redirectless] Redirect URI: https://localhost:3000/p1auth-callback`, but PingOne is still returning HTML, then:

**❌ The redirect URI `https://localhost:3000/p1auth-callback` is NOT registered in your PingOne application**

### How to Fix

1. Log into PingOne Admin Console
2. Go to: Applications → [Your Application] → Configuration
3. Under **Redirect URIs**, add:
   ```
   https://localhost:3000/p1auth-callback
   ```
4. Click **Save**
5. Try the redirectless flow again

## Alternative Issue

If the backend logs show `redirectUri is not defined`, then the backend did not restart properly. Kill and restart:

```bash
pkill -f "node server.js"
cd /Users/cmuir/P1Import-apps/oauth-playground
node server.js
```


