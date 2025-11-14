# Redirectless Flow Authentication Test Plan

## Issue Fixed
The PingOne Flow API (`/api/pingone/flows/check-username-password`) was returning `401 Unauthorized` because client authentication credentials were missing.

## Changes Made

### Backend (`server.js`)
- Added `clientId` and `clientSecret` parameters to `/api/pingone/flows/check-username-password` endpoint
- Added validation for required client credentials
- Added `Authorization: Basic {base64(clientId:clientSecret)}` header to PingOne Flow API requests
- Added detailed logging for debugging

### Frontend (`PingOneAuthentication.tsx`)
- Updated the fetch call to include `clientId` and `clientSecret` from config
- Uses `config.clientId.trim()` and `config.clientSecret.trim()` with fallback to `DEFAULT_CONFIG`

## Test Procedure

### Prerequisites
1. Valid PingOne application with:
   - Client ID
   - Client Secret
   - Valid redirect URI registered: `https://localhost:3000/authz-callback`
   - User credentials for testing

### Test Steps

#### 1. **Test with Kroger Login Popup (Username/Password)**
   
   **Steps:**
   a. Navigate to PingOne Authentication page (`https://localhost:3000/pingone-authentication`)
   
   b. Fill in configuration:
   - Environment ID: `b9817c16-9910-4415-b67e-4ac687da74d9`
   - Client ID: `a4f963ea-0736-456a-be72-b1fa4f63f81f`
   - Client Secret: `0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a`
   - Scopes: `openid`
   
   c. Select **Redirectless** mode
   
   d. Set Authentication Method to **Username & Password**
   
   e. Leave username/password fields empty (to trigger Kroger login popup)
   
   f. Click **Launch Redirectless Flow**
   
   g. In Kroger login popup:
   - Username: `curtis7`
   - Password: `Wolverine7&`
   - Click **Sign In**
   
   **Expected Results:**
   - ✅ Backend receives username/password from frontend
   - ✅ Backend sends `clientId` and `clientSecret` to PingOne Flow API
   - ✅ PingOne Flow API authenticates the client (no 401 error)
   - ✅ Username/password are validated by PingOne
   - ✅ Flow status changes to `COMPLETED` or returns tokens
   - ✅ User sees success message with tokens displayed

#### 2. **Test with Pre-filled Credentials**
   
   **Steps:**
   a. On PingOne Authentication page, fill in:
   - Environment ID
   - Client ID
   - Client Secret
   - Username: `curtis7`
   - Password: `Wolverine7&`
   
   b. Click **Launch Redirectless Flow**
   
   **Expected Results:**
   - ✅ No Kroger popup shown (credentials already provided)
   - ✅ Backend receives all credentials including client auth
   - ✅ Flow completes successfully with tokens

#### 3. **Test Error Handling - Invalid Client Credentials**
   
   **Steps:**
   a. Use invalid client secret
   
   b. Try to launch redirectless flow
   
   **Expected Results:**
   - ✅ Clear error message about invalid client credentials
   - ❌ Should NOT show "INVALID_TOKEN" error
   - ❌ Should NOT show generic 401 error

#### 4. **Test Error Handling - Invalid User Credentials**
   
   **Steps:**
   a. Use valid client credentials but invalid username/password
   
   b. Try to launch redirectless flow
   
   **Expected Results:**
   - ✅ Client authentication succeeds
   - ✅ Clear error message about invalid username/password
   - ❌ Should NOT show client authentication errors

## Backend Logs to Verify

Look for these log entries in the terminal running the backend:

```
[PingOne Flow Check] Received request body: { ... }
[PingOne Flow Check] Calling flow URL: https://auth.pingone.com/...
[PingOne Flow Check] Username: cur...
[PingOne Flow Check] Client ID: a4f963ea...
[PingOne Flow Check] Has Client Secret: true
[PingOne Flow Check] Request body: username=curtis7&password=...
[PingOne Flow Check] Success: { status: 'COMPLETED', hasResumeUrl: true/false }
```

## Success Criteria

- ✅ No 401 Unauthorized errors from PingOne Flow API
- ✅ No "INVALID_TOKEN" errors
- ✅ Client authentication works (clientId + clientSecret sent via Basic Auth)
- ✅ Username/password validation works
- ✅ Tokens are returned successfully
- ✅ Kroger login popup works correctly
- ✅ Error messages are clear and actionable

## Common Issues to Check

1. **Missing Client Secret in Frontend Config**
   - Verify `config.clientSecret` is populated
   - Check `DEFAULT_CONFIG.clientSecret` has a value

2. **Backend Not Receiving Credentials**
   - Check network tab: POST body should include `clientId` and `clientSecret`
   - Backend logs should show these values

3. **Authorization Header Not Set**
   - Backend should create: `Authorization: Basic base64(clientId:clientSecret)`
   - PingOne should accept this header

4. **Flow URL Incorrect**
   - Should be: `https://auth.pingone.com/{envId}/flows/{flowId}`
   - Comes from initial authorize response: `_links.usernamePassword.check.href`

## Debugging Commands

If issues persist, run these in browser console:

```javascript
// Check config
console.log('Config:', {
  clientId: config.clientId,
  hasClientSecret: !!config.clientSecret,
  environmentId: config.environmentId
});

// Check what's being sent
// (open Network tab and inspect the POST to /api/pingone/flows/check-username-password)
```

## PingOne API Documentation Reference

According to PingOne Flow API docs, when calling a flow's `usernamePassword.check` endpoint:
- **Required**: Client authentication via `Authorization: Basic` header
- **Required**: `username` and `password` in POST body
- **Content-Type**: `application/x-www-form-urlencoded`
- **Accept**: `application/json`

Our implementation now correctly follows this pattern.


