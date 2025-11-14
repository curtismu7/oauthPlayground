# Redirect URI Debug Steps

## Confirmed Configuration ✅
- **PingOne**: `https://localhost:3000/authz-callback` (no trailing slash)
- **Code Generation**: Correct ✅

## Next: Test the Flow

### Step 1: Open Authorization Code Flow
1. Navigate to: **OAuth Authorization Code Flow V6**
2. Open Browser DevTools Console (F12)
3. Filter logs by: `REDIRECT URI AUDIT`

### Step 2: Configure Credentials
1. Enter your PingOne credentials
2. **IMPORTANT**: Check the redirect URI field
3. It should show: `https://localhost:3000/authz-callback`

### Step 3: Generate Authorization URL
1. Click "Generate Authorization URL"
2. Check console for these logs:

```
🔍 [REDIRECT URI AUDIT] Authorization Request: {
  configuredRedirectUri: "https://localhost:3000/authz-callback",
  hasTrailingSlash: false,
  protocol: "https",
  windowOrigin: "https://localhost:3000",
  windowProtocol: "https:",
  matchesWindowOrigin: true
}

🔍 [REDIRECT URI AUDIT] URL Params: {
  redirect_uri_param: "https://localhost:3000/authz-callback",
  redirect_uri_encoded: "https%3A%2F%2Flocalhost%3A3000%2Fauthz-callback",
  params_toString: "..." 
}
```

### Step 4: Copy the Actual Authorization URL
1. Copy the full authorization URL that was generated
2. Look at the `redirect_uri` parameter in the URL

### What to Check:

#### ❌ Common Issues:

**Issue 1: Protocol Mismatch**
```
windowOrigin: "http://localhost:3000"  // ❌ HTTP not HTTPS
configuredRedirectUri: "https://localhost:3000/authz-callback"
```
**Fix**: Access app at `https://localhost:3000` not `http://localhost:3000`

**Issue 2: Trailing Slash Added**
```
redirect_uri_param: "https://localhost:3000/authz-callback/"  // ❌ has trailing slash
```
**Fix**: Check if credentials have trailing slash stored

**Issue 3: Wrong Origin**
```
windowOrigin: "https://localhost:3001"  // ❌ Wrong port
configuredRedirectUri: "https://localhost:3000/authz-callback"
```
**Fix**: Access app on correct port (3000)

**Issue 4: Encoded vs Not Encoded**
- URLSearchParams should handle encoding automatically
- PingOne accepts both encoded and unencoded
- This is rarely the issue

### Step 5: Share Results

**Please share:**
1. The console output from `🔍 [REDIRECT URI AUDIT]`
2. The actual authorization URL generated
3. The exact error from PingOne (if any)

Then I can identify the exact issue and fix it!

## Quick Self-Check

Before running the flow, verify:
- [ ] You're accessing the app at `https://localhost:3000` (not http)
- [ ] The redirect URI in credentials has NO trailing slash
- [ ] The redirect URI in credentials starts with `https://`
- [ ] Browser shows secure lock icon (🔒)

## Expected Success:

If everything is correct, you should see:
```
✅ configuredRedirectUri: "https://localhost:3000/authz-callback"
✅ hasTrailingSlash: false
✅ protocol: "https"
✅ windowOrigin: "https://localhost:3000"
✅ matchesWindowOrigin: true
```

All ✅ = No mismatch should occur!

