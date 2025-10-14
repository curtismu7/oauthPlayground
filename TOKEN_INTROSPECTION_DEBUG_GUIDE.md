# Token Introspection Debug Guide - "Inactive" Status

**Issue:** Token introspection shows "Inactive" for valid, non-expired tokens

---

## ✅ Fixes Applied

### 1. DOM Nesting Warning - FIXED ✅

**Problem:** `<ul>` cannot appear as descendant of `<p>`

**Solution:** 
- Created `InfoBlock` (div-based) styled component
- Replaced `<InfoText>` (p-based) with `<InfoBlock>` where lists are used
- Fixed 3 instances in educational content section

**Result:** DOM nesting warning eliminated!

### 2. Enhanced Introspection Debugging - ADDED ✅

**Added comprehensive console logging:**

```typescript
console.log('🔍 [V6 Flow] Token Introspection Request:', {
    environmentId: credentials.environmentId,
    clientId: credentials.clientId,
    hasClientSecret: !!credentials.clientSecret,
    tokenPreview: token.substring(0, 20) + '...',
});

console.log('🔍 [V6 Flow] Introspection endpoint:', introspectionEndpoint);

console.log('🔍 [V6 Flow] Introspection Response:', {
    active: result.response.active,
    client_id: result.response.client_id,
    scope: result.response.scope,
    exp: result.response.exp,
});
```

---

## 🔍 Debugging Steps

### Step 1: Check Console Logs

Open the browser console and run the flow. Look for these logs:

**When you click "Introspect Access Token":**

```
🔍 [V6 Flow] Token Introspection Request: {
    environmentId: "b9817c16-9910-4415-b67e-4ac687da74d9",
    clientId: "a4f963ea-0736-456a-be72-b1fa4f63f81f",
    hasClientSecret: true,
    tokenPreview: "eyJhbGciOiJSUzI1NiIs..."
}
```

**Then check the endpoint:**
```
🔍 [V6 Flow] Introspection endpoint: https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/introspect
```

**Finally, check the response:**
```
🔍 [V6 Flow] Introspection Response: {
    active: false,
    client_id: "a4f963ea-0736-456a-be72-b1fa4f63f81f",
    scope: "openid profile",
    exp: 1760295000
}
```

---

### Step 2: Verify Client ID Match

**Critical Check:**

The `client_id` used to get the token MUST match the `client_id` used for introspection.

**How to verify:**

1. **When you got the token** (Step 4 - Token Exchange), check the console:
   ```
   Credentials used: { clientId: "a4f963ea-0736-456a-be72-b1fa4f63f81f" }
   ```

2. **When you introspect** (Step 5), check the console:
   ```
   🔍 [V6 Flow] Token Introspection Request: {
       clientId: "a4f963ea-0736-456a-be72-b1fa4f63f81f"
   }
   ```

3. **If they DON'T match → That's your problem!**

---

### Step 3: Check Token Expiration

Even if the token just came back, check if it's expired:

```
🔍 [V6 Flow] Introspection Response: {
    active: false,
    exp: 1760295000  // Unix timestamp
}
```

**To check if expired:**

```javascript
// In browser console:
const exp = 1760295000; // Your exp value
const now = Math.floor(Date.now() / 1000);
const expiresIn = exp - now;

if (expiresIn < 0) {
    console.log('Token is EXPIRED by', Math.abs(expiresIn), 'seconds');
} else {
    console.log('Token expires in', expiresIn, 'seconds');
}
```

---

### Step 4: Check Network Request

Open DevTools → Network tab:

1. Filter for "introspect-token"
2. Click on the request
3. Check **Request Payload:**

```json
{
    "token": "eyJhbGci...",
    "client_id": "a4f963ea-0736-456a-be72-b1fa4f63f81f",
    "client_secret": "***",
    "token_type_hint": "access_token",
    "introspection_endpoint": "https://auth.pingone.com/.../as/introspect"
}
```

4. Check **Response:**

```json
{
    "active": false,
    "client_id": "a4f963ea-0736-456a-be72-b1fa4f63f81f"
}
```

---

## 🐛 Common Causes of "Inactive" Status

### Cause 1: Client ID Mismatch ⭐ MOST COMMON

**Problem:** Token was issued to Client A, but you're trying to introspect with Client B.

**How it happens:**
1. You start the flow with Client A credentials
2. You get a token (issued to Client A)
3. You change credentials to Client B
4. You try to introspect → FAILS (Client B can't introspect Client A's tokens)

**Solution:**
- Use the "Reset Flow" button
- Start over with ONE set of credentials
- Don't change credentials mid-flow

---

### Cause 2: Token Already Expired

**Problem:** Token expired between exchange and introspection.

**How it happens:**
- PingOne tokens typically expire in 1 hour (3600 seconds)
- If you wait too long between steps, token expires

**Solution:**
- Complete the flow quickly
- Check exp claim: `exp - Date.now()/1000` should be positive

---

### Cause 3: Wrong Environment

**Problem:** Token issued in Environment A, introspecting in Environment B.

**Solution:**
- Verify `environmentId` matches in both requests
- Check console logs for environment ID

---

### Cause 4: PingOne Client Configuration

**Problem:** Client doesn't have introspection capability enabled.

**Solution:**
1. Go to PingOne Admin Console
2. Applications → Your Application
3. Check "Token Introspection" is enabled
4. Check "Token Endpoint Authentication Method" matches your flow

---

## ✅ What Should Work Now

**After these fixes:**

1. ✅ DOM nesting warning is gone
2. ✅ Console logs show detailed introspection info
3. ✅ You can identify if client ID mismatches
4. ✅ You can verify token expiration
5. ✅ You can debug the full request/response

---

## 📋 Next Steps for User

**Please do the following and report back:**

1. **Open browser console**
2. **Go to OAuth Authorization Code V6 flow**
3. **Complete the entire flow from start to finish:**
   - Step 1: Enter credentials
   - Step 2-3: Authorize
   - Step 4: Exchange tokens
   - Step 5: Introspect token

4. **Copy and paste the console logs** that start with:
   - `🔍 [V6 Flow] Token Introspection Request:`
   - `🔍 [V6 Flow] Introspection Response:`

5. **Tell me:**
   - What's the `active` value? (true or false)
   - What's the `client_id` in the response?
   - Did you change credentials between steps?

---

## 🎯 Expected Result

**If everything works correctly, you should see:**

```
🔍 [V6 Flow] Introspection Response: {
    active: true,  // ✅ Should be true!
    client_id: "a4f963ea-0736-456a-be72-b1fa4f63f81f",
    scope: "openid profile",
    exp: 1760295000
}
```

**And the UI should show:**
- ✅ Active (green checkmark)
- Token details displayed
- Scope information
- Expiration time

---

**End of Debug Guide**

