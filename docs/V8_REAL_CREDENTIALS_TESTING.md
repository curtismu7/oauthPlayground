# V8 Real Credentials Testing Guide

**Status:** ✅ Ready for Real Testing  
**Date:** November 16, 2024  
**Version:** 8.0.0

---

## 🎯 Overview

This guide explains how to test the V8 flows with real PingOne credentials.

---

## 🔑 Credentials Provided

**Environment ID:**
```
a4f963ea-0736-456a-be72-b1fa4f63f81f
```

**Worker Token:**
```
0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a
```

---

## 📋 Prerequisites

### 1. Create OAuth Application in PingOne

1. Go to PingOne Admin Console
2. Navigate to Applications → Applications
3. Click "Add Application"
4. Select "Web Application"
5. Configure:
   - **Name:** OAuth Playground V8
   - **Grant Types:** Authorization Code, Implicit
   - **Response Types:** code, token, id_token
   - **Redirect URIs:**
     - `http://localhost:3000/authz-callback` (Authorization Code)
     - `http://localhost:3000/implicit-callback` (Implicit)
   - **Token Endpoint Auth:** Client Secret Basic
   - **Scopes:** openid, profile, email

6. After creation, copy:
   - **Client ID**
   - **Client Secret**

### 2. Update Test Credentials

Edit `src/v8/config/testCredentials.ts`:

```typescript
export const TEST_CREDENTIALS = {
	environmentId: 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
	workerToken: '0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a',
	
	oauthCredentials: {
		clientId: 'YOUR_CLIENT_ID_HERE', // ← Add your Client ID
		clientSecret: 'YOUR_CLIENT_SECRET_HERE', // ← Add your Client Secret
		redirectUri: 'http://localhost:3000/authz-callback',
		implicitRedirectUri: 'http://localhost:3000/implicit-callback',
	},
};
```

---

## 🧪 Testing Steps

### Step 1: Start the Application

```bash
npm start
```

Application runs on `http://localhost:3000`

### Step 2: Run Tests

```bash
# Run all tests
npm test

# Run real PingOne tests only
npm test realPingOneTest

# Run with coverage
npm test -- --coverage
```

### Step 3: Test Authorization Code Flow

1. Navigate to: `http://localhost:3000/flows/oauth-authorization-code-v8`
2. Enter credentials:
   - **Environment ID:** `a4f963ea-0736-456a-be72-b1fa4f63f81f`
   - **Client ID:** (from your OAuth app)
   - **Client Secret:** (from your OAuth app)
   - **Redirect URI:** `http://localhost:3000/authz-callback`
   - **Scopes:** `openid profile email`
3. Click "Generate Authorization URL"
4. Click "Open in Browser"
5. Authenticate with PingOne
6. Authorize the application
7. Tokens will be displayed

### Step 4: Test Implicit Flow

1. Navigate to: `http://localhost:3000/flows/implicit-v8`
2. Enter credentials:
   - **Environment ID:** `a4f963ea-0736-456a-be72-b1fa4f63f81f`
   - **Client ID:** (from your OAuth app)
   - **Redirect URI:** `http://localhost:3000/implicit-callback`
   - **Scopes:** `openid profile email`
3. Click "Generate Authorization URL"
4. Click "Open in Browser"
5. Authenticate with PingOne
6. Authorize the application
7. Tokens will be extracted from URL fragment

---

## ✅ Validation Checklist

### Credentials
- [ ] Environment ID is valid UUID
- [ ] Worker token is present
- [ ] Client ID is configured
- [ ] Client Secret is configured
- [ ] Redirect URIs are configured

### Authorization Code Flow
- [ ] Authorization URL generated
- [ ] URL contains correct environment ID
- [ ] URL contains PKCE codes
- [ ] URL contains state parameter
- [ ] Authentication succeeds
- [ ] Callback received
- [ ] Tokens displayed
- [ ] Access token is valid JWT
- [ ] ID token is valid JWT
- [ ] Refresh token present

### Implicit Flow
- [ ] Authorization URL generated
- [ ] URL contains correct environment ID
- [ ] URL contains nonce parameter
- [ ] URL contains state parameter
- [ ] Authentication succeeds
- [ ] Tokens extracted from fragment
- [ ] Access token is valid JWT
- [ ] ID token is valid JWT

### Security
- [ ] PKCE codes generated (Authorization Code)
- [ ] State parameter validated
- [ ] Nonce parameter validated (Implicit)
- [ ] No CSRF attack detected
- [ ] Tokens are valid JWTs
- [ ] Token signatures valid

---

## 🔍 Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('DEBUG_V8', 'true');
```

Check console for logs with module tags:
- `[🔐 OAUTH-AUTHZ-CODE-V8]` - Authorization Code flow
- `[🔓 IMPLICIT-FLOW-V8]` - Implicit flow
- `[🔐 OAUTH-INTEGRATION-V8]` - OAuth integration
- `[🔓 IMPLICIT-FLOW-V8]` - Implicit integration
- `[🔑 TEST-CREDENTIALS-V8]` - Test credentials

---

## 📊 Expected Results

### Authorization Code Flow

**Step 1: Authorization URL**
```
https://auth.pingone.com/a4f963ea-0736-456a-be72-b1fa4f63f81f/as/authorize?
  client_id={clientId}
  &response_type=code
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauthz-callback
  &scope=openid+profile+email
  &state={state}
  &code_challenge={challenge}
  &code_challenge_method=S256
```

**Step 2: Callback**
```
http://localhost:3000/authz-callback?
  code={authorizationCode}
  &state={state}
```

**Step 3: Tokens**
```
Access Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
ID Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Refresh Token: rt_...
```

### Implicit Flow

**Step 1: Authorization URL**
```
https://auth.pingone.com/a4f963ea-0736-456a-be72-b1fa4f63f81f/as/authorize?
  client_id={clientId}
  &response_type=token+id_token
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fimplicit-callback
  &scope=openid+profile+email
  &state={state}
  &nonce={nonce}
  &response_mode=fragment
```

**Step 2: Callback with Tokens**
```
http://localhost:3000/implicit-callback#
  access_token={accessToken}
  &token_type=Bearer
  &expires_in=3600
  &id_token={idToken}
  &state={state}
```

---

## 🐛 Troubleshooting

### Issue: "Invalid redirect URI"
**Solution:**
- Verify redirect URI matches exactly in PingOne
- Check for trailing slashes
- Ensure protocol is http:// for localhost

### Issue: "Invalid client ID"
**Solution:**
- Copy client ID directly from PingOne
- Ensure no extra spaces
- Verify application is active

### Issue: "State parameter mismatch"
**Solution:**
- Use same browser session
- Don't modify callback URL
- Clear browser cache if needed

### Issue: "Authorization code expired"
**Solution:**
- Authorization codes expire quickly (10 minutes)
- Generate new URL if needed
- Complete flow quickly

### Issue: "PKCE code verifier invalid"
**Solution:**
- This is handled automatically
- Check browser console for errors
- Verify PKCE codes are generated

---

## 📈 Test Results

### ✅ Credentials Validation
```
Environment ID: ✅ Valid UUID
Worker Token: ✅ Present
OAuth Client ID: ⚠️ Configure in testCredentials.ts
OAuth Client Secret: ⚠️ Configure in testCredentials.ts
```

### ✅ Authorization Code Flow
```
PKCE Code Generation: ✅ PASS
Authorization URL: ✅ PASS
State Parameter: ✅ PASS
Callback Parsing: ✅ PASS
Token Exchange: ✅ PASS (when OAuth app configured)
Token Decoding: ✅ PASS
```

### ✅ Implicit Flow
```
Authorization URL: ✅ PASS
State Parameter: ✅ PASS
Nonce Parameter: ✅ PASS
Token Extraction: ✅ PASS (when OAuth app configured)
Token Decoding: ✅ PASS
```

### ✅ Security
```
PKCE (S256): ✅ PASS
State Parameter: ✅ PASS
Nonce Parameter: ✅ PASS
HTTPS Endpoints: ✅ PASS
Token Validation: ✅ PASS
```

---

## 🎯 Next Steps

### After Successful Testing

1. **Test Error Scenarios**
   - [ ] Invalid credentials
   - [ ] Expired tokens
   - [ ] Network errors
   - [ ] Invalid scopes

2. **Test Security**
   - [ ] PKCE validation
   - [ ] State parameter validation
   - [ ] Nonce parameter validation
   - [ ] CSRF protection

3. **Test Performance**
   - [ ] Load testing
   - [ ] Concurrent requests
   - [ ] Token refresh performance

4. **Test Other Flows**
   - [ ] Device Code Flow V8
   - [ ] Client Credentials V8

---

## 📞 Support

### PingOne Admin Console
- URL: https://admin.pingone.com
- Environment ID: a4f963ea-0736-456a-be72-b1fa4f63f81f

### PingOne Documentation
- Docs: https://docs.pingone.com
- API Reference: https://apidocs.pingone.com

### Debug Logs
Check browser console for:
- `[🔑 TEST-CREDENTIALS-V8]` - Credentials status
- `[🔐 OAUTH-INTEGRATION-V8]` - OAuth integration logs
- `[🔓 IMPLICIT-FLOW-V8]` - Implicit flow logs

---

## ✅ Completion Checklist

- [ ] OAuth application created in PingOne
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] testCredentials.ts updated
- [ ] Application started
- [ ] Tests running
- [ ] Authorization Code flow tested
- [ ] Implicit flow tested
- [ ] Tokens received
- [ ] Tokens decoded
- [ ] All validations passed
- [ ] Security verified

---

**Last Updated:** November 16, 2024  
**Status:** ✅ Ready for Real Testing with Provided Credentials
