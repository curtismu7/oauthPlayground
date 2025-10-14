# Token Introspection Debugging Guide

## Issue: Token Shows as "Inactive" When It Shouldn't Be

### What "Inactive" Means
When PingOne returns `{ "active": false }`, it means:
1. ✅ The introspection call **succeeded** (200 OK response)
2. ❌ PingOne says the token is **not valid** for some reason

### Common Causes (NOT token expiration)

#### 1. **Client ID Mismatch** ⭐ MOST COMMON
- The client ID used for introspection MUST be the same client that issued the token
- OR the client must have permission to introspect other clients' tokens

**Check:**
```
Console should show:
[V6 Flow] Using flow credentials for introspection: {
  hasEnvironmentId: true,
  hasClientId: true,    // ← This client ID
  hasClientSecret: true
}
```

**Fix:** Make sure the same client ID is used for BOTH:
- Getting the token (Step 2-3)
- Introspecting the token (Step 5)

#### 2. **Client Not Enabled for Introspection**
The PingOne client must have "Token Introspection" enabled.

**Check in PingOne Admin Console:**
1. Go to Applications → Your Application
2. Click on the "Resources" tab
3. Make sure "openid" and "profile" resources are enabled
4. Click on "Configuration" tab
5. Scroll to "Token Endpoint Authentication Method"
6. Verify it's set to "Client Secret Post" or "Client Secret Basic"

#### 3. **Wrong Introspection Endpoint**
The endpoint should match your environment.

**Check in Console:**
```
Should show:
introspectionEndpoint: "https://auth.pingone.com/YOUR_ENV_ID/as/introspect"
```

#### 4. **Token Revoked or Invalid**
- Token was revoked
- Token was issued for a different resource
- Token signature is invalid

### How to Debug

#### Step 1: Check Console Logs
Open browser console and look for:
```
🔍 [V6 Flow] Using flow credentials for introspection: { ... }
```

#### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Click "Introspect Access Token"
3. Find the `/api/introspect-token` request
4. Check:
   - Request payload (client_id, token, etc.)
   - Response body (should have `active: false` plus maybe error info)

#### Step 3: Check Server Logs
Look at the terminal running `node server.js`:
```
[Introspect Token] Received request: {
  hasToken: true,
  hasClientId: true,
  hasClientSecret: true,
  hasIntrospectionEndpoint: true,
  tokenAuthMethod: 'client_secret_post'
}
```

#### Step 4: Verify PingOne Configuration
1. **Same Client for Everything:**
   - Step 1 credentials = Step 5 introspection credentials
   
2. **Client Type:**
   - Must be "Web App" or "Single Page App" (not "Worker")
   
3. **Grant Types Enabled:**
   - Authorization Code
   - Refresh Token (optional)
   - Implicit (if using implicit flow)

4. **Token Endpoint Auth Method:**
   - Should match what the app is using (`client_secret_post`)

### Quick Test: Get Fresh Token

1. Click "Reset Flow" button
2. Go through the flow completely (Steps 1-4)
3. Get NEW tokens
4. Try introspection again

If the **FRESH** token also shows "inactive", then it's definitely a configuration issue, not expiration.

### What to Check in Your Current Session

Please provide the following from your browser console:
```javascript
// 1. What client ID is being used?
// Look for: [V6 Flow] Using flow credentials for introspection

// 2. What's the introspection endpoint?
// Look for: introspectionEndpoint: "https://..."

// 3. What's the full response?
// Look for the response body after clicking "Introspect Access Token"
```

### Most Likely Issue

**90% of the time, this is a client ID mismatch:**
- You got the token using Client A
- You're trying to introspect using Client B
- PingOne says "nope, Client B can't introspect Client A's tokens"

**Solution:** Use the SAME credentials throughout the entire flow.

