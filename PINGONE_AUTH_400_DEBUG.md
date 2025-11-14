# PingOne Authentication 400 Error - Debugging Guide

## Error
```
POST https://localhost:3000/api/pingone/flows/check-username-password 400 (Bad Request)
Error: The request could not be completed. One or more validation errors were in the request.
```

## Common Causes

### 1. Missing or Invalid Session Cookies
The PingOne Flow API is stateful and requires cookies from Step 1 (/as/authorize).

**Check:**
- Open browser DevTools → Network tab
- Find the POST to `/api/pingone/flows/check-username-password`
- Check the request payload - does it include `sessionId`?
- Check server logs - does it say "✅ Including X cookies" or "⚠️ NO COOKIES PROVIDED"?

**Fix:**
- Ensure Step 1 (authorization) completes successfully
- Verify cookies are being captured and stored
- Check that `sessionId` is being passed from Step 1 to Step 2

### 2. Flow Has Expired
PingOne flows expire after a certain time (usually 15 minutes).

**Check:**
- Look at the flow's `expiresAt` timestamp in Step 1 response
- Compare with current time

**Fix:**
- Start a fresh flow from the beginning
- Don't wait too long between steps

### 3. Invalid Username/Password Format
PingOne may reject credentials that don't meet format requirements.

**Check:**
- Username should not have leading/trailing spaces
- Password should not be empty
- Check if there are special characters causing issues

**Fix:**
- Ensure credentials are being sent exactly as entered (no trimming)
- Verify the username exists in PingOne

### 4. Wrong Content-Type Header
The server should send: `application/vnd.pingidentity.usernamePassword.check+json`

**Check server.js line ~4270:**
```javascript
'Content-Type': 'application/vnd.pingidentity.usernamePassword.check+json',
```

### 5. Flow Not in Correct State
The flow must be in `USERNAME_PASSWORD_REQUIRED` status.

**Check:**
- Step 1 response should have `status: "USERNAME_PASSWORD_REQUIRED"`
- If status is different, the flow may not support username/password auth

## Debugging Steps

### Step 1: Check Server Logs
Look for these log messages in your terminal:
```
[PingOne Flow Check] Received request body: ...
[PingOne Flow Check] Username (length): ...
[PingOne Flow Check] Password (length): ...
[PingOne Flow Check] Using stored cookies: X
[PingOne Flow Check] Response status: 400 Bad Request
```

### Step 2: Check Network Tab
1. Open DevTools → Network
2. Find the POST to `/api/pingone/flows/check-username-password`
3. Click on it
4. Check the **Request Payload**:
   ```json
   {
     "flowUrl": "https://auth.pingone.com/.../flows/...",
     "username": "...",
     "password": "...",
     "sessionId": "..."
   }
   ```
5. Check the **Response**:
   ```json
   {
     "error": "...",
     "error_description": "...",
     "details": { ... }
   }
   ```

### Step 3: Check PingOne Response Details
The server logs should show:
```
[PingOne Flow Check] PingOne API Error: {
  status: 400,
  statusText: 'Bad Request',
  responseData: { ... }
}
```

Look at `responseData` for specific validation errors from PingOne.

## Quick Fixes

### Fix 1: Ensure Fresh Flow
```javascript
// In your component, ensure you're starting fresh
const handleLogin = async () => {
  // Clear any old session data
  setSessionId(null);
  
  // Start from Step 1
  await startAuthorizationFlow();
};
```

### Fix 2: Verify Cookie Handling
Check that cookies from Step 1 are being captured:
```javascript
// After Step 1 completes
console.log('Session ID:', sessionId);
console.log('Flow ID:', flowId);
```

### Fix 3: Check Username/Password
```javascript
// Before sending
console.log('Username length:', username.length);
console.log('Password length:', password.length);
console.log('Has whitespace:', username !== username.trim());
```

## Most Likely Cause

Based on the error message, the most common cause is **missing or invalid session cookies**. 

**Action:** Check your server logs for this line:
```
[PingOne Flow Check] ⚠️  NO COOKIES PROVIDED!
```

If you see this warning, the issue is that cookies from Step 1 are not being passed to Step 2.

**Solution:** Ensure the `sessionId` from Step 1 is being stored and passed to Step 2.
