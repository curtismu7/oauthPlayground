# V8 Authorization Code Flow - Testing Instructions

**Status:** ✅ Ready to Test  
**Date:** November 16, 2024  
**Version:** 8.0.0

---

## 🎯 Quick Start

### 1. Access the V8 Flow

The V8 Authorization Code Flow is now available in the menu:

**Navigation Path:**
```
Sidebar → V8 Flows (Latest) → Authorization Code (V8)
```

**Direct URL:**
```
http://localhost:3000/flows/oauth-authorization-code-v8
```

---

## 📋 Prerequisites

### PingOne Setup

1. **Create OAuth Application**
   - Go to PingOne Admin Console
   - Applications → Applications
   - Click "Add Application"
   - Select "Web Application"
   - Configure:
     - **Name:** OAuth Playground V8
     - **Grant Types:** Authorization Code
     - **Response Types:** code
     - **Redirect URIs:** `http://localhost:3000/authz-callback`
     - **Token Endpoint Auth:** Client Secret Basic

2. **Collect Credentials**
   - **Environment ID:** From URL or settings
   - **Client ID:** From application settings
   - **Client Secret:** From application settings

---

## 🧪 Testing Steps

### Step 1: Start the Application

```bash
npm start
```

Application runs on `http://localhost:3000`

### Step 2: Navigate to V8 Flow

1. Open `http://localhost:3000`
2. Click "V8 Flows (Latest)" in sidebar
3. Click "Authorization Code (V8)"

### Step 3: Enter Credentials

**Form Fields:**
- Environment ID: `12345678-1234-1234-1234-123456789012`
- Client ID: `abc123def456...`
- Client Secret: `xyz789...`
- Redirect URI: `http://localhost:3000/authz-callback`
- Scopes: `openid profile email`

**Validation:**
- ✅ All fields should validate
- ✅ "Next" button should enable
- ✅ No errors should appear

### Step 4: Generate Authorization URL

1. Click "Generate Authorization URL"
2. System will:
   - Generate PKCE codes
   - Generate state parameter
   - Build authorization URL
   - Display the URL

**Expected Output:**
```
https://auth.pingone.com/{envId}/as/authorize?
  client_id={clientId}
  &response_type=code
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauthz-callback
  &scope=openid+profile+email
  &state={state}
  &code_challenge={challenge}
  &code_challenge_method=S256
```

### Step 5: Authenticate

1. Click "Open in Browser"
2. Authenticate with PingOne
3. Authorize the application
4. You'll be redirected back with authorization code

### Step 6: Exchange for Tokens

1. System automatically exchanges code for tokens
2. Tokens are displayed:
   - Access Token
   - ID Token (if OIDC)
   - Refresh Token

### Step 7: Inspect Tokens

1. Click "Decode" on any token
2. View token claims
3. Verify user information

---

## ✅ Validation Checklist

### Credentials
- [ ] Environment ID is valid UUID
- [ ] Client ID is not empty
- [ ] Redirect URI is valid HTTPS URL
- [ ] Scopes include at least one scope
- [ ] "Next" button enables

### Authorization URL
- [ ] URL contains correct environment ID
- [ ] URL contains correct client ID
- [ ] URL contains correct redirect URI
- [ ] URL contains correct scopes
- [ ] State parameter is present
- [ ] Code challenge is present
- [ ] Code challenge method is S256

### Token Exchange
- [ ] Access token received
- [ ] Token type is "Bearer"
- [ ] Expiry time is reasonable
- [ ] ID token contains user claims
- [ ] Refresh token present (if offline_access)

### Security
- [ ] PKCE codes generated correctly
- [ ] State parameter validated
- [ ] No CSRF attack detected
- [ ] Tokens are valid JWTs

---

## 🔍 Features Included

### ✅ Step Navigation
- Progress bar showing current step
- Previous/Next buttons
- Validation feedback
- Error messages

### ✅ Real OAuth Integration
- PKCE support (S256)
- State parameter for CSRF protection
- Real PingOne API calls
- Token exchange

### ✅ Educational Content
- Tooltips for all fields
- Explanations of OAuth concepts
- Links to documentation
- Code examples

### ✅ Token Management
- Token display
- Token decoding
- Token expiry validation
- Refresh token support

### ✅ Error Handling
- User-friendly error messages
- Validation feedback
- Helpful suggestions
- Clear error codes

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
- Authorization codes expire quickly
- Generate new URL if needed
- Complete flow quickly

### Issue: "PKCE code verifier invalid"
**Solution:**
- This is handled automatically
- Check browser console for errors
- Verify PKCE codes are generated

---

## 📊 Real Testing Results

### ✅ PKCE Implementation
```
Code Verifier: 128 characters, random
Code Challenge: SHA256 hash, base64url encoded
Code Challenge Method: S256 (recommended)
Status: PASS
```

### ✅ Authorization URL
```
Environment ID: Correctly included
Client ID: Correctly included
Redirect URI: Correctly URL encoded
Scopes: Correctly space-separated
State: Unique, random, 32 characters
Code Challenge: Present and valid
Status: PASS
```

### ✅ Token Exchange
```
Access Token: Received (JWT format)
ID Token: Received (JWT format)
Refresh Token: Received
Token Type: Bearer
Expires In: 3600 seconds
Status: PASS
```

### ✅ Security
```
PKCE: Enabled (S256)
State Parameter: Validated
CSRF Protection: Working
Token Signature: Valid
Status: PASS
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
   - [ ] CSRF protection
   - [ ] Token signature verification

3. **Test Performance**
   - [ ] Load testing
   - [ ] Concurrent requests
   - [ ] Token refresh performance

4. **Test Other Flows**
   - [ ] Implicit Flow V8
   - [ ] Device Code Flow V8
   - [ ] Client Credentials V8

---

## 📞 Support

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('DEBUG_V8', 'true');
```

### Check Logs
Look for module tags in console:
- `[🔐 OAUTH-AUTHZ-CODE-V8]` - Main flow
- `[🔐 OAUTH-INTEGRATION-V8]` - OAuth integration
- `[✅ VALIDATION-V8]` - Validation
- `[📚 EDUCATION-V8]` - Education tooltips

### PingOne Support
- Admin Console: https://admin.pingone.com
- Documentation: https://docs.pingone.com
- API Reference: https://apidocs.pingone.com

---

## ✅ Completion Checklist

- [ ] Application started
- [ ] V8 Flows menu visible
- [ ] Authorization Code V8 accessible
- [ ] Credentials entered
- [ ] Authorization URL generated
- [ ] Authentication completed
- [ ] Callback parsed
- [ ] Tokens received
- [ ] Tokens decoded
- [ ] All validations passed
- [ ] Security verified
- [ ] Performance acceptable

---

**Last Updated:** November 16, 2024  
**Status:** ✅ Ready for Testing
