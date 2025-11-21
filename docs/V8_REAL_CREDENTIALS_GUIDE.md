# V8 Real Credentials Testing Guide

**Status:** ✅ Ready for Real Testing  
**Date:** November 16, 2024  
**Version:** 8.0.0

---

## 🔐 Real PingOne Credentials

### OAuth Application Configuration

**Application Name:** OAuth Playground V8

**Token Auth Method:** Client Secret Post

**Response Type:** Code, ID Token, Access Token

**Grant Types:** 
- Client Credentials
- Refresh Token
- Device Authorization
- Authorization Code
- Implicit

**PKCE Enforcement:** REQUIRED

**Refresh Token Duration:** 30 Days

**Refresh Token Rolling Duration:** 180 Days

---

## 📋 Credentials to Use

### Environment ID
```
(From your PingOne admin console URL)
Example: 12345678-1234-1234-1234-123456789012
```

### Client ID
```
(From application settings)
Example: abc123def456...
```

### Client Secret
```
0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a
```

### Redirect URIs (Configured)
```
https://localhost:3000/authz-callback
http://localhost:3000/authz-callback
https://localhost:3000/kroger-authz-callback
https://localhost:3000/test-authz-pkce
https://localhost:3000/test-authz-callback
http://localhost:3000/test-callback
```

### For V8 Flows, Use:
```
http://localhost:3000/authz-callback (Authorization Code)
http://localhost:3000/implicit-callback (Implicit Flow)
```

---

## 🧪 Testing Authorization Code Flow V8

### Step 1: Navigate to Flow
```
Sidebar → V8 Flows (Latest) → Authorization Code (V8)
```

### Step 2: Enter Credentials

**Form Fields:**
```
Environment ID: [Your PingOne Environment ID]
Client ID: [Your Client ID]
Client Secret: 0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a
Redirect URI: http://localhost:3000/authz-callback
Scopes: openid profile email
```

### Step 3: Generate Authorization URL
1. Click "Generate Authorization URL"
2. System will:
   - Generate PKCE codes (required by app)
   - Generate state parameter
   - Build authorization URL
   - Display the URL

### Step 4: Authenticate
1. Click "Open in Browser"
2. Authenticate with PingOne
3. Authorize the application
4. You'll be redirected back with authorization code

### Step 5: Exchange for Tokens
1. System automatically exchanges code for tokens
2. Tokens are displayed:
   - Access Token (JWT)
   - ID Token (JWT)
   - Refresh Token

---

## 🧪 Testing Implicit Flow V8

### Step 1: Navigate to Flow
```
Sidebar → V8 Flows (Latest) → Implicit Flow (V8)
```

### Step 2: Enter Credentials

**Form Fields:**
```
Environment ID: [Your PingOne Environment ID]
Client ID: [Your Client ID]
Redirect URI: http://localhost:3000/implicit-callback
Scopes: openid profile email
```

### Step 3: Generate Authorization URL
1. Click "Generate Authorization URL"
2. System will:
   - Generate state parameter
   - Generate nonce parameter
   - Build authorization URL
   - Display the URL

### Step 4: Authenticate
1. Click "Open in Browser"
2. Authenticate with PingOne
3. Authorize the application
4. You'll be redirected back with tokens in URL fragment

### Step 5: View Tokens
1. Tokens are automatically extracted from URL fragment
2. Tokens are displayed:
   - Access Token (JWT)
   - ID Token (JWT)

---

## 🔑 Worker Token Credentials (Optional)

If you need to use the App Discovery feature or PingOne Admin API integration, you'll need worker token credentials:

### Worker Token Setup

**What is a Worker Token?**
- Service account token for PingOne Admin API
- Used for app discovery and configuration
- 24-hour expiry (configurable)

**To Get Worker Token:**
1. Go to PingOne Admin Console
2. Settings → Integrations → Worker Tokens
3. Create new worker token
4. Copy the token value

**Using Worker Token in V8:**
```
The flows will prompt for worker token when needed
for features like:
- App Discovery (auto-discover apps in environment)
- Configuration Checking (compare with PingOne settings)
- Advanced features
```

**Note:** Worker token is OPTIONAL for basic OAuth flows
- Authorization Code Flow: ❌ Not needed
- Implicit Flow: ❌ Not needed
- App Discovery: ✅ Needed

---

## ✅ Validation Checklist

### Before Testing

- [ ] PingOne account active
- [ ] OAuth application created
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] Redirect URIs configured
- [ ] PKCE enforcement enabled
- [ ] Application is active

### During Testing

- [ ] Environment ID is valid UUID
- [ ] Client ID is not empty
- [ ] Client Secret is correct
- [ ] Redirect URI matches exactly
- [ ] Scopes include at least one
- [ ] "Next" button enables

### After Testing

- [ ] Authorization URL generated
- [ ] Authentication successful
- [ ] Callback received
- [ ] Tokens displayed
- [ ] Tokens are valid JWTs
- [ ] Token claims visible

---

## 🔐 Security Notes

### PKCE Enforcement
- ✅ Your app has PKCE REQUIRED
- ✅ Authorization Code flow uses S256
- ✅ Code verifier is 128 characters
- ✅ Code challenge is SHA256 hash

### State Parameter
- ✅ Unique for each request
- ✅ Validated on callback
- ✅ Prevents CSRF attacks

### Nonce Parameter (Implicit)
- ✅ Unique for each request
- ✅ Validated in ID token
- ✅ Prevents replay attacks

### Token Security
- ✅ Tokens are JWTs with RS256 signature
- ✅ Signature verified by PingOne
- ✅ Tokens expire after configured time
- ✅ Refresh tokens can be revoked

---

## 🐛 Troubleshooting

### Issue: "Invalid redirect URI"
**Solution:**
- Verify redirect URI matches exactly in PingOne
- Check for trailing slashes
- Ensure protocol matches (http vs https)
- For localhost, http:// is allowed

### Issue: "Invalid client ID"
**Solution:**
- Copy client ID directly from PingOne
- Ensure no extra spaces
- Verify application is active

### Issue: "Invalid client secret"
**Solution:**
- Use: `0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a`
- Copy exactly as shown
- No extra spaces or characters

### Issue: "PKCE code verifier invalid"
**Solution:**
- PKCE is REQUIRED for your app
- System generates codes automatically
- Check browser console for errors
- Verify PKCE codes are generated

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

---

## 📊 Expected Results

### Authorization Code Flow

**Step 0: Credentials**
```
✅ All fields validate
✅ "Next" button enables
✅ No errors displayed
```

**Step 1: Authorization URL**
```
✅ URL contains environment ID
✅ URL contains client ID
✅ URL contains redirect URI
✅ URL contains scopes
✅ State parameter present
✅ Code challenge present (PKCE)
✅ Code challenge method is S256
```

**Step 2: Callback**
```
✅ Authorization code extracted
✅ State parameter validated
✅ No CSRF attack detected
✅ Code is not empty
```

**Step 3: Tokens**
```
✅ Access token received (JWT)
✅ ID token received (JWT)
✅ Refresh token received
✅ Token type is "Bearer"
✅ Expiry time is reasonable (3600 seconds)
```

### Implicit Flow

**Step 0: Credentials**
```
✅ All fields validate
✅ "Next" button enables
✅ No errors displayed
```

**Step 1: Authorization URL**
```
✅ URL contains environment ID
✅ URL contains client ID
✅ URL contains redirect URI
✅ URL contains scopes
✅ State parameter present
✅ Nonce parameter present
✅ Response mode is fragment
```

**Step 2: Tokens**
```
✅ Access token extracted from fragment
✅ ID token extracted from fragment
✅ State parameter validated
✅ Tokens are valid JWTs
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
   - [ ] Device Code Flow V8
   - [ ] Client Credentials V8
   - [ ] Other flows as needed

---

## 📞 Support

### Debug Mode
Enable debug logging in browser console:
```javascript
localStorage.setItem('DEBUG_V8', 'true');
```

### Check Logs
Look for module tags in console:
- `[🔐 OAUTH-AUTHZ-CODE-V8]` - Authorization Code flow
- `[🔓 IMPLICIT-FLOW-V8]` - Implicit flow
- `[🔐 OAUTH-INTEGRATION-V8]` - OAuth integration
- `[✅ VALIDATION-V8]` - Validation

### PingOne Support
- Admin Console: https://admin.pingone.com
- Documentation: https://docs.pingone.com
- API Reference: https://apidocs.pingone.com

---

## ✅ Completion Checklist

- [ ] Credentials copied
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
**Status:** ✅ Ready for Real Testing with Real Credentials
