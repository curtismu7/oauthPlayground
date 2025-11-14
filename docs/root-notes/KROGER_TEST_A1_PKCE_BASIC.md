# Test Case A1: PKCE (S256) + Base Scopes - Kroger MFA Flow

## Test Case ID: A1
**Description**: Public Client with PKCE (S256), response_mode=query, base scopes  
**Flow**: Redirectless Authorization Code with PKCE  
**Date**: 2025-11-12  
**Tester**: Automated via Kroger MFA Flow

---

## 1. Environment Preparation

### Authorization Server Endpoints
- [x] `AUTHZ_ENDPOINT`: `https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize`
- [x] `TOKEN_ENDPOINT`: `https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/token`

### Client Credentials
- [x] Client ID: `a4f963ea-0736-456a-be72-b1fa4f63f81f`
- [x] Client Secret: (configured in .env)
- [x] Client Type: Confidential (using client_secret_post)

### Shared Parameters
- [x] `REDIRECT_URI`: `https://localhost:3001/flows/kroger-grocery-store-mfa`
- [x] `SCOPE_BASE`: `openid profile email`
- [x] `STATE`: Generated dynamically (`kroger-grocery-store-mfa-{timestamp}`)
- [x] `NONCE`: Not used in this flow
- [x] `CODE_VERIFIER`: Generated (43 chars, base64url)
- [x] `CODE_CHALLENGE`: Derived (SHA-256 of verifier, base64url)
- [x] `CODE_CHALLENGE_METHOD`: `S256`

### Logging
- [x] Tokens redacted in logs
- [x] Console logging enabled for debugging

---

## 2. Test Execution

### Step 1: Navigate to Flow
**Action**: Open browser to `https://localhost:3001/flows/kroger-grocery-store-mfa`

**Expected**:
- Page loads successfully
- Step 0: "Authenticate with Kroger" displayed

**Result**: [ ] Pass [ ] Fail  
**Evidence**: Screenshot of initial page

---

### Step 2: Configure Client
**Action**: Enter authorization code client credentials

**Input**:
```json
{
  "environmentId": "b9817c16-9910-4415-b67e-4ac687da74d9",
  "clientId": "a4f963ea-0736-456a-be72-b1fa4f63f81f",
  "clientSecret": "***",
  "redirectUri": "https://localhost:3001/flows/kroger-grocery-store-mfa",
  "scopes": "openid profile email"
}
```

**Expected**:
- Configuration saves to localStorage
- "Start Authentication" button enabled

**Result**: [ ] Pass [ ] Fail  
**Evidence**: localStorage screenshot

---

### Step 3: Generate PKCE Codes
**Action**: Click "Start Redirectless Authentication"

**Expected**:
```javascript
{
  "codeVerifier": "<43-char base64url string>",
  "codeChallenge": "<base64url SHA-256 hash>",
  "codeChallengeMethod": "S256"
}
```

**Verification Command**:
```javascript
const pkce = JSON.parse(localStorage.getItem('pingone_pkce_codes:kroger-grocery-store-mfa'));
console.log('Code Verifier Length:', pkce.codeVerifier.length); // Should be 43
console.log('Code Challenge:', pkce.codeChallenge);
console.log('Method:', pkce.codeChallengeMethod); // Should be 'S256'
```

**Result**: [ ] Pass [ ] Fail  
**Evidence**: Console output showing PKCE codes

---

### Step 4: Build Authorization Request
**Action**: Automatic - RedirectlessAuthService builds request

**Expected Request**:
```http
POST https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize
Content-Type: application/x-www-form-urlencoded

client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f
&response_type=code
&redirect_uri=https://localhost:3001/flows/kroger-grocery-store-mfa
&scope=openid+profile+email
&state=kroger-grocery-store-mfa-{timestamp}
&code_challenge={base64url_challenge}
&code_challenge_method=S256
&login_hint=curtis
```

**Result**: [ ] Pass [ ] Fail  
**Evidence**: Network tab screenshot

---

### Step 5: Authenticate User
**Action**: Enter credentials and submit
- Username: `curtis`
- Password: `***`

**Expected**:
- PingOne authentication flow completes
- Authorization code returned

**Result**: [ ] Pass [ ] Fail  
**Evidence**: Network response showing code

---

### Step 6: Capture Authorization Response
**Expected Response**:
```json
{
  "code": "auth-code-xyz...",
  "state": "kroger-grocery-store-mfa-{timestamp}"
}
```

**Verification Command**:
```javascript
const code = sessionStorage.getItem('kroger-grocery-store-mfa_auth_code');
const state = sessionStorage.getItem('kroger-grocery-store-mfa_state');
console.log('Auth Code:', code);
console.log('State:', state);
```

**Result**: [ ] Pass [ ] Fail  
**Evidence**: Console output

---

### Step 7: Exchange Code for Tokens
**Action**: Automatic - exchangeAuthorizationCode() called

**Expected Token Request**:
```http
POST https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authCode}
&redirect_uri=https://localhost:3001/flows/kroger-grocery-store-mfa
&client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f
&client_secret={clientSecret}
&code_verifier={codeVerifier}  ← CRITICAL: Must be present!
```

**Expected Token Response**:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email",
  "id_token": "eyJhbGci..."
}
```

**Verification**:
- [ ] Request includes `code_verifier`
- [ ] Response status: 200 OK
- [ ] `access_token` present
- [ ] `id_token` present
- [ ] `token_type` is "Bearer"
- [ ] `expires_in` is reasonable (3600)

**Result**: [ ] Pass [ ] Fail  
**Evidence**: Network tab showing request/response

---

### Step 8: Validate Assertions
**Assertions**:
- [ ] State preserved (matches original)
- [ ] ID token present
- [ ] Access token present
- [ ] PKCE verifier was included in token request
- [ ] PingOne accepted PKCE validation
- [ ] No errors in console
- [ ] User transitioned to Step 1 (MFA Selection)

**Result**: [ ] Pass [ ] Fail

---

## 3. Evidence Bundle

### Authorization Request
```
<Paste full authorization request from Network tab>
```

### Authorization Response
```json
{
  "code": "redacted",
  "state": "kroger-grocery-store-mfa-1731398400"
}
```

### Token Request
```
<Paste full token request from Network tab>
```

### Token Response
```json
{
  "access_token": "redacted",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email",
  "id_token": "redacted"
}
```

### Console Output
```
<Paste relevant console logs>
```

### Screenshots
1. Initial page load
2. Configuration saved
3. PKCE codes generated
4. Authorization request
5. Token exchange request (showing code_verifier)
6. Token response
7. Final state (Step 1 - MFA Selection)

---

## 4. Test Result Summary

### Overall Result: [ ] PASS [ ] FAIL

### Key Findings:
- PKCE Generation: [ ] Working [ ] Failed
- PKCE Storage: [ ] Working [ ] Failed
- PKCE in Token Exchange: [ ] Working [ ] Failed
- Token Receipt: [ ] Working [ ] Failed
- State Preservation: [ ] Working [ ] Failed

### Issues Found:
```
<List any issues discovered>
```

### Notes:
```
<Additional observations>
```

---

## 5. Acceptance Criteria

- [x] Authorization response contains `code` and matches `state`
- [x] Token response includes expected tokens
- [x] PKCE enforcement confirmed (code_verifier included)
- [x] Security checks: state preserved, redirect_uri validated
- [x] Logging includes timestamps without exposing secrets
- [x] User successfully transitions to next step

---

## 6. Next Steps

After A1 passes:
- [ ] Test A2: PKCE with response_mode=form_post
- [ ] Test A3: PKCE + offline_access (refresh token)
- [ ] Test B1: Confidential client with basic auth
- [ ] Test N4: Wrong code_verifier (negative test)

---

**Test Status**: Ready to Execute  
**Last Updated**: 2025-11-12
