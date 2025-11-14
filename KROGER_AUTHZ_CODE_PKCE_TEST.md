# Kroger MFA - Authorization Code with PKCE Test Plan

## Test Scenario: Basic Authorization Code Flow with PKCE

### Prerequisites
- ✅ Authorization Code client configured in PingOne
- ✅ Worker token available for MFA operations
- ✅ Test user exists in PingOne environment
- ✅ Redirect URI configured: `https://localhost:3001/flows/kroger-grocery-store-mfa`

### Test Steps

#### 1. Initial Configuration
**Action**: Navigate to Kroger MFA flow
**URL**: `https://localhost:3001/flows/kroger-grocery-store-mfa`

**Expected**:
- Page loads without errors
- Step 0: "Authenticate with Kroger" displayed
- Configuration panel available

#### 2. Configure Authorization Code Client
**Action**: Open configuration panel and enter:
- Environment ID: `b9817c16-9910-4415-b67e-4ac687da74d9`
- Client ID: `a4f963ea-0736-456a-be72-b1fa4f63f81f`
- Client Secret: (from .env)
- Redirect URI: `https://localhost:3001/flows/kroger-grocery-store-mfa`
- Scopes: `openid profile email`

**Expected**:
- Configuration saves successfully
- "Start Authentication" button becomes enabled

#### 3. Select Authentication Mode
**Action**: Select "Redirectless Mode"

**Expected**:
- Radio button selected
- Mode indicator shows "Redirectless"

#### 4. Initiate Authentication
**Action**: Click "Start Redirectless Authentication"

**Expected**:
- PKCE code verifier generated (43 characters)
- PKCE code challenge generated (SHA-256 hash)
- PKCE codes saved to localStorage: `pingone_pkce_codes:kroger-grocery-store-mfa`
- Login form appears

**Verify in Console**:
```javascript
// Check PKCE codes were saved
const pkce = JSON.parse(localStorage.getItem('pingone_pkce_codes:kroger-grocery-store-mfa'));
console.log('Code Verifier:', pkce.codeVerifier);
console.log('Code Challenge:', pkce.codeChallenge);
console.log('Challenge Method:', pkce.codeChallengeMethod); // Should be 'S256'
```

#### 5. Enter Credentials
**Action**: Enter test user credentials
- Username: `curtis` (or your test user)
- Password: (test user password)

**Expected**:
- Form accepts input
- Submit button enabled

#### 6. Submit Login
**Action**: Click "Sign In"

**Expected**:
- RedirectlessAuthService.completeFlow() called
- Authorization request sent with PKCE challenge
- PingOne authentication flow completes
- Authorization code received

**Verify in Console**:
```javascript
// Check auth code was stored
const authCode = sessionStorage.getItem('kroger-grocery-store-mfa_auth_code');
console.log('Auth Code:', authCode);
```

#### 7. Token Exchange
**Action**: Automatic after auth code received

**Expected**:
- PKCE code verifier loaded from localStorage
- Token exchange request includes:
  - `grant_type=authorization_code`
  - `code={authCode}`
  - `redirect_uri={redirectUri}`
  - `client_id={clientId}`
  - `client_secret={clientSecret}`
  - `code_verifier={codeVerifier}` ✅ **CRITICAL: Must be included**
- PingOne validates PKCE (challenge matches verifier)
- Tokens received:
  - `access_token`
  - `id_token`
  - `refresh_token` (if offline_access scope)

**Verify in Network Tab**:
```
POST https://auth.pingone.com/{envId}/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authCode}
&redirect_uri={redirectUri}
&client_id={clientId}
&client_secret={clientSecret}
&code_verifier={codeVerifier}  ← Must be present!
```

#### 8. User Profile Lookup
**Action**: Automatic after token exchange

**Expected**:
- Worker token used for API call
- User lookup by username
- User ID (UUID) retrieved
- User info stored in state

**Verify in Console**:
```javascript
// Check user info
console.log('User ID:', userInfo.id);
console.log('Username:', userInfo.username);
```

#### 9. MFA Context Initialization
**Action**: Automatic after user lookup

**Expected**:
- MFAProvider initialized with:
  - `accessToken`: Worker token
  - `environmentId`: Environment ID
  - `userId`: User ID (UUID)
- Base component receives context
- Step transitions to "Select MFA Method"

#### 10. Verify MFA Ready
**Action**: Check MFA context in base component

**Expected**:
- `mfaAccessToken` available
- `mfaEnvironmentId` available
- `mfaUserId` available
- Device registration buttons enabled

**Verify in Console**:
```javascript
// In React DevTools, check KrogerGroceryStoreMFA component
// Should see mfaAccessToken, mfaEnvironmentId, mfaUserId from context
```

## Success Criteria

### ✅ PKCE Flow
- [ ] Code verifier generated (43 chars, base64url)
- [ ] Code challenge generated (SHA-256 of verifier, base64url)
- [ ] Challenge method is 'S256'
- [ ] PKCE codes saved to localStorage
- [ ] Code verifier loaded during token exchange
- [ ] Code verifier included in token request
- [ ] PingOne accepts PKCE and returns tokens

### ✅ Token Exchange
- [ ] Authorization code received
- [ ] Token exchange request sent
- [ ] PKCE verifier included
- [ ] Access token received
- [ ] ID token received
- [ ] Refresh token received (if offline_access)

### ✅ User Context
- [ ] User lookup successful
- [ ] User ID (UUID) retrieved
- [ ] User info stored correctly

### ✅ MFA Context
- [ ] MFAProvider initialized
- [ ] Credentials passed to context
- [ ] Base component receives credentials
- [ ] Device operations ready

## Common Issues

### Issue 1: PKCE Verifier Not Included
**Symptom**: Token exchange fails with "invalid_grant" or PKCE validation error
**Fix**: Ensure `codeVerifier` is loaded from localStorage and included in token request

### Issue 2: Code Challenge Mismatch
**Symptom**: PingOne rejects token exchange
**Fix**: Verify code challenge is SHA-256 hash of verifier, base64url encoded

### Issue 3: User ID Not Found
**Symptom**: MFA operations fail with "user not found"
**Fix**: Ensure user lookup returns actual UUID, not username

### Issue 4: MFA Context Not Available
**Symptom**: Base component can't access credentials
**Fix**: Verify MFAProvider is wrapping base component with correct props

## Test Commands

### Check PKCE Codes
```javascript
const pkce = JSON.parse(localStorage.getItem('pingone_pkce_codes:kroger-grocery-store-mfa'));
console.log('PKCE Codes:', pkce);
```

### Check Auth Code
```javascript
const code = sessionStorage.getItem('kroger-grocery-store-mfa_auth_code');
console.log('Auth Code:', code);
```

### Check User Info
```javascript
// In React DevTools, inspect KrogerGroceryStoreMFA_New component state
// Look for userInfo object
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter by "token"
3. Look for POST to `/as/token`
4. Check request payload includes `code_verifier`

## Next Steps After Basic Test

Once basic AuthZ with PKCE passes:
1. Test redirect mode (vs redirectless)
2. Test with offline_access scope
3. Test token refresh
4. Test MFA device registration
5. Test MFA challenge/verification
6. Test error scenarios

---

**Status**: Ready to test
**Last Updated**: 2025-11-12
