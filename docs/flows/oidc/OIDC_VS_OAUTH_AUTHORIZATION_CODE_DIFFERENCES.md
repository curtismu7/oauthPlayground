# OIDC vs OAuth Authorization Code Flow Differences 🔐

**Date:** 2025-10-08  
**Purpose:** Comprehensive comparison of OIDC and OAuth Authorization Code flows  
**Context:** Both flows use the same underlying OAuth 2.0 Authorization Code flow but serve different purposes

---

## Quick Summary

| Aspect | OAuth Authorization Code | OIDC Authorization Code |
|--------|-------------------------|-------------------------|
| **Purpose** | API Authorization | User Authentication + API Authorization |
| **Tokens Returned** | Access Token only | ID Token + Access Token |
| **Scope Required** | No `openid` scope | Must include `openid` scope |
| **User Identity** | No user identity claims | Full user identity claims |
| **UserInfo Endpoint** | Not used | Used to get user profile |
| **Authentication** | Authorization only | Full authentication |

---

## Detailed Comparison

### **1. Purpose & Use Cases**

#### **OAuth 2.0 Authorization Code Flow:**
- **Purpose:** API authorization and resource access
- **Use Case:** Allow an application to access user's data on another service
- **Example:** "Allow this app to read my Google Drive files"
- **Result:** App gets access token to call Google Drive API

#### **OIDC Authorization Code Flow:**
- **Purpose:** User authentication + API authorization
- **Use Case:** Log user into your app AND access their data
- **Example:** "Log me into this app using my Google account AND let it access my profile"
- **Result:** App gets user identity (who they are) + access token (what they can do)

---

### **2. Tokens Returned**

#### **OAuth 2.0 Authorization Code:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read write"
}
```
- ✅ **Access Token** - For API calls
- ❌ **No ID Token** - No user identity
- ❌ **No User Claims** - No user information

#### **OIDC Authorization Code:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```
- ✅ **Access Token** - For API calls
- ✅ **ID Token** - Contains user identity claims
- ✅ **User Claims** - Name, email, profile info

---

### **3. Scope Requirements**

#### **OAuth 2.0 Authorization Code:**
```http
GET /authorize?
  response_type=code&
  client_id=your_client_id&
  redirect_uri=https://yourapp.com/callback&
  scope=read write&
  state=random_state
```
- **Scopes:** `read`, `write`, `admin`, etc.
- **No `openid` scope required**
- **Focus:** What the app can do

#### **OIDC Authorization Code:**
```http
GET /authorize?
  response_type=code&
  client_id=your_client_id&
  redirect_uri=https://yourapp.com/callback&
  scope=openid profile email&
  state=random_state&
  nonce=random_nonce
```
- **Scopes:** Must include `openid` + optional `profile`, `email`, `address`
- **`openid` scope required** for OIDC
- **Focus:** Who the user is + what the app can do

---

### **4. ID Token vs Access Token**

#### **Access Token (Both Flows):**
```json
{
  "aud": ["https://api.example.com"],
  "scope": "read write",
  "client_id": "your_client_id",
  "exp": 1234567890
}
```
- **Purpose:** API authorization
- **Contains:** Scopes, client info, expiration
- **Used for:** Calling protected APIs

#### **ID Token (OIDC Only):**
```json
{
  "iss": "https://auth.example.com",
  "sub": "user123",
  "aud": "your_client_id",
  "exp": 1234567890,
  "iat": 1234567800,
  "nonce": "random_nonce",
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```
- **Purpose:** User authentication
- **Contains:** User identity claims
- **Used for:** Logging user into your app

---

### **5. User Information Access**

#### **OAuth 2.0 Authorization Code:**
- ❌ **No user identity** in tokens
- ❌ **No UserInfo endpoint** typically used
- ❌ **No user profile** information
- ✅ **API access only** - can call protected APIs

#### **OIDC Authorization Code:**
- ✅ **User identity** in ID token
- ✅ **UserInfo endpoint** available
- ✅ **User profile** information
- ✅ **API access** + user authentication

**UserInfo Endpoint Call:**
```http
GET /userinfo
Authorization: Bearer access_token

Response:
{
  "sub": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```

---

### **6. Security Considerations**

#### **OAuth 2.0 Authorization Code:**
- **PKCE Required:** For public clients (mobile, SPA)
- **State Parameter:** CSRF protection
- **Client Authentication:** For confidential clients
- **Token Storage:** Secure storage of access tokens

#### **OIDC Authorization Code:**
- **All OAuth 2.0 security** + additional OIDC security
- **Nonce Parameter:** Replay attack protection for ID tokens
- **Token Validation:** Both access token AND ID token validation
- **User Session:** Manage user login state

---

### **7. Implementation Differences**

#### **OAuth 2.0 Authorization Code Flow:**
```typescript
// 1. Generate authorization URL
const authUrl = `https://auth.example.com/authorize?
  response_type=code&
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  scope=read write&
  state=${state}`;

// 2. Exchange code for tokens
const tokenResponse = await fetch('/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri
  })
});

// 3. Use access token for API calls
const apiResponse = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

#### **OIDC Authorization Code Flow:**
```typescript
// 1. Generate authorization URL (with openid scope)
const authUrl = `https://auth.example.com/authorize?
  response_type=code&
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  scope=openid profile email&
  state=${state}&
  nonce=${nonce}`;

// 2. Exchange code for tokens (same as OAuth)
const tokenResponse = await fetch('/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authorizationCode,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri
  })
});

// 3. Validate ID token and extract user info
const idToken = tokenResponse.id_token;
const userInfo = validateAndDecodeIdToken(idToken);
console.log('User logged in:', userInfo.name, userInfo.email);

// 4. Use access token for API calls
const apiResponse = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

### **8. When to Use Which**

#### **Use OAuth 2.0 Authorization Code When:**
- ✅ You only need API access
- ✅ You don't need user identity
- ✅ You're building a service-to-service integration
- ✅ You're building a data aggregation app
- ✅ You don't need to "log the user in"

**Examples:**
- Twitter API integration (post tweets)
- GitHub API integration (access repositories)
- Google Drive API integration (access files)
- Weather API integration (get weather data)

#### **Use OIDC Authorization Code When:**
- ✅ You need to authenticate users
- ✅ You need user identity information
- ✅ You're building a user-facing application
- ✅ You need to "log the user in"
- ✅ You need user profile information

**Examples:**
- Social login (Google, Facebook, GitHub)
- Single Sign-On (SSO) systems
- User profile management
- Multi-tenant applications
- Enterprise identity systems

---

### **9. Configuration Differences in Our Flows**

#### **OAuth Authorization Code V5:**
```typescript
// Configuration
{
  responseType: 'code',
  scope: '', // No openid scope
  grantType: 'authorization_code',
  // No ID token handling
  // No UserInfo endpoint
  // No nonce parameter
}
```

#### **OIDC Authorization Code V5:**
```typescript
// Configuration
{
  responseType: 'code',
  scope: 'openid profile email', // Must include openid
  grantType: 'authorization_code',
  // ID token handling
  // UserInfo endpoint integration
  // Nonce parameter for security
}
```

---

### **10. Token Management Differences**

#### **OAuth 2.0 Authorization Code:**
- **Store:** Access token only
- **Validate:** Access token expiration
- **Refresh:** Access token refresh
- **Revoke:** Access token revocation

#### **OIDC Authorization Code:**
- **Store:** Both ID token and access token
- **Validate:** Both token types
- **Refresh:** Access token refresh (ID token not refreshable)
- **Revoke:** Both tokens
- **Session:** User login state management

---

## Summary

### **OAuth 2.0 Authorization Code:**
- **Focus:** "What can this app do?"
- **Result:** API access only
- **Use Case:** Service integrations, data access
- **Tokens:** Access token only
- **User Identity:** None

### **OIDC Authorization Code:**
- **Focus:** "Who is this user AND what can this app do?"
- **Result:** User authentication + API access
- **Use Case:** User login, social authentication, SSO
- **Tokens:** ID token + Access token
- **User Identity:** Full user identity

---

## Key Takeaway

**OIDC Authorization Code = OAuth 2.0 Authorization Code + User Authentication**

OIDC builds on top of OAuth 2.0 to add user identity and authentication capabilities. If you need to know who the user is, use OIDC. If you only need API access, use OAuth 2.0.

Both flows use the same underlying OAuth 2.0 Authorization Code flow mechanism, but OIDC adds the `openid` scope and ID token to provide user authentication on top of API authorization.
