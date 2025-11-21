# V8 Quick Reference Card

**Quick access to credentials and testing info**

---

## 🔐 Real Credentials

### Client Secret
```
0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a
```

### Redirect URIs
```
Authorization Code: http://localhost:3000/authz-callback
Implicit Flow: http://localhost:3000/implicit-callback
```

### App Configuration
```
Token Auth: Client Secret Post
PKCE: REQUIRED (S256)
Grant Types: Authorization Code, Implicit, Device, Client Credentials
Response Types: Code, ID Token, Access Token
```

---

## 🚀 Quick Start

### Authorization Code Flow V8
```
1. Sidebar → V8 Flows (Latest) → Authorization Code (V8)
2. Enter credentials
3. Click "Generate Authorization URL"
4. Click "Open in Browser"
5. Authenticate with PingOne
6. Tokens displayed automatically
```

### Implicit Flow V8
```
1. Sidebar → V8 Flows (Latest) → Implicit Flow (V8)
2. Enter credentials
3. Click "Generate Authorization URL"
4. Click "Open in Browser"
5. Authenticate with PingOne
6. Tokens extracted from URL fragment
```

---

## 📋 Form Fields

### Authorization Code Flow
```
Environment ID: [Your PingOne Environment ID]
Client ID: [Your Client ID]
Client Secret: 0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a
Redirect URI: http://localhost:3000/authz-callback
Scopes: openid profile email
```

### Implicit Flow
```
Environment ID: [Your PingOne Environment ID]
Client ID: [Your Client ID]
Redirect URI: http://localhost:3000/implicit-callback
Scopes: openid profile email
```

---

## ✅ Validation Checklist

- [ ] Environment ID is valid UUID
- [ ] Client ID is not empty
- [ ] Redirect URI matches exactly
- [ ] Scopes include at least one
- [ ] "Next" button enables
- [ ] Authorization URL generated
- [ ] Authentication successful
- [ ] Tokens received
- [ ] Tokens are valid JWTs

---

## 🔐 Security Features

### Authorization Code Flow
- ✅ PKCE (S256) - Code verifier & challenge
- ✅ State parameter - CSRF protection
- ✅ Secure token exchange - Backend to backend

### Implicit Flow
- ✅ State parameter - CSRF protection
- ✅ Nonce parameter - Replay attack protection
- ✅ Fragment-based tokens - Not in query string

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Invalid redirect URI | Verify exact match in PingOne |
| Invalid client secret | Use provided secret exactly |
| PKCE code verifier invalid | System generates automatically |
| State parameter mismatch | Use same browser session |
| Authorization code expired | Complete flow within 10 minutes |

---

## 📊 Expected Results

### Authorization Code Flow
```
✅ PKCE codes generated (S256)
✅ State parameter unique
✅ Authorization URL built correctly
✅ Authentication successful
✅ Authorization code received
✅ Tokens exchanged successfully
✅ Access token, ID token, refresh token
```

### Implicit Flow
```
✅ State parameter unique
✅ Nonce parameter unique
✅ Authorization URL built correctly
✅ Authentication successful
✅ Tokens in URL fragment
✅ Access token, ID token
```

---

## 🔗 URLs

### Authorization Endpoint
```
https://auth.pingone.com/{environmentId}/as/authorize
```

### Token Endpoint
```
https://auth.pingone.com/{environmentId}/as/token
```

### Callback URLs
```
Authorization Code: http://localhost:3000/authz-callback
Implicit: http://localhost:3000/implicit-callback
```

---

## 🧪 Testing Steps

### 1. Start Application
```bash
npm start
```

### 2. Navigate to Flow
```
Sidebar → V8 Flows (Latest) → [Flow Name]
```

### 3. Enter Credentials
```
Copy credentials from this guide
Paste into form fields
```

### 4. Generate URL
```
Click "Generate Authorization URL"
```

### 5. Authenticate
```
Click "Open in Browser"
Login with PingOne credentials
Authorize application
```

### 6. View Tokens
```
Tokens displayed automatically
Click "Decode" to view claims
```

---

## 📞 Debug

### Enable Debug Logging
```javascript
localStorage.setItem('DEBUG_V8', 'true');
```

### Module Tags
```
[🔐 OAUTH-AUTHZ-CODE-V8] - Authorization Code
[🔓 IMPLICIT-FLOW-V8] - Implicit Flow
[🔐 OAUTH-INTEGRATION-V8] - OAuth Integration
[✅ VALIDATION-V8] - Validation
```

---

## 🎯 Worker Token (Optional)

**When Needed:**
- App Discovery feature
- PingOne Admin API integration

**How to Get:**
1. PingOne Admin Console
2. Settings → Integrations → Worker Tokens
3. Create new token
4. Copy token value

**Note:** Not needed for basic OAuth flows

---

## 📚 Documentation

- **Full Guide:** docs/V8_REAL_CREDENTIALS_GUIDE.md
- **Authorization Code:** docs/V8_AUTHORIZATION_CODE_FLOW.md
- **Implicit Flow:** docs/V8_IMPLICIT_FLOW.md
- **Complete Summary:** docs/V8_FLOWS_COMPLETE.md

---

**Last Updated:** November 16, 2024  
**Status:** ✅ Ready for Testing
