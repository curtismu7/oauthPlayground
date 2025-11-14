# OAuth 2.0 vs OIDC Authorization Code Flow - Standards Comparison 🔐

**Date:** 2025-10-08  
**Standards:** RFC 6749 (OAuth 2.0) vs OpenID Connect Core 1.0  
**Flow Type:** Authorization Code Flow  

---

## Executive Summary

**TL;DR:** OIDC Authorization Code Flow = OAuth 2.0 Authorization Code Flow + User Authentication

Both flows use the **exact same underlying OAuth 2.0 mechanism** (authorization code exchange), but OIDC adds user identity and authentication on top of API authorization.

| Aspect | OAuth 2.0 Authorization Code | OIDC Authorization Code |
|--------|----------------------------|------------------------|
| **Standard** | RFC 6749 | OpenID Connect Core 1.0 |
| **Purpose** | API Authorization | User Authentication + API Authorization |
| **Question Answered** | "What can this app do?" | "Who is this user?" + "What can this app do?" |
| **Tokens Returned** | Access Token only | ID Token + Access Token |
| **User Identity** | No | Yes (in ID Token) |
| **Scope Required** | Any scopes | Must include `openid` |
| **Use Case** | Access user's data on another service | Log user into your app |

---

## Detailed Standards Comparison

### **1. Protocol Standards** 📜

#### **OAuth 2.0 Authorization Code Flow**
- **Standard:** RFC 6749 - The OAuth 2.0 Authorization Framework (October 2012)
- **Section:** Section 4.1 - Authorization Code Grant
- **Purpose:** Delegated authorization
- **Focus:** What the application is authorized to do

#### **OIDC Authorization Code Flow**
- **Standard:** OpenID Connect Core 1.0 (November 2014)
- **Section:** Section 3.1 - Authentication using the Authorization Code Flow
- **Built On:** OAuth 2.0 RFC 6749
- **Purpose:** User authentication + delegated authorization
- **Focus:** Who the user is + what the application is authorized to do

---

### **2. Authorization Request Differences** 🔗

#### **OAuth 2.0 Authorization Request**

**Standard Requirement (RFC 6749 Section 4.1.1):**
```http
GET /authorize?
  response_type=code&           ✅ REQUIRED
  client_id=CLIENT_ID&          ✅ REQUIRED
  redirect_uri=REDIRECT_URI&    🟡 OPTIONAL (but recommended)
  scope=SCOPES&                 🟡 OPTIONAL
  state=STATE                   🟡 RECOMMENDED
```

**Parameters:**
- `response_type`: Must be `code`
- `client_id`: The client identifier
- `redirect_uri`: Where to redirect after authorization
- `scope`: Requested permissions (e.g., `read`, `write`, `admin`)
- `state`: CSRF protection (recommended but not required)

**Example:**
```http
https://auth.example.com/authorize?
  response_type=code&
  client_id=abc123&
  redirect_uri=https://app.example.com/callback&
  scope=read write&
  state=xyz789
```

#### **OIDC Authorization Request**

**Standard Requirement (OIDC Core Section 3.1.2.1):**
```http
GET /authorize?
  response_type=code&           ✅ REQUIRED
  client_id=CLIENT_ID&          ✅ REQUIRED
  redirect_uri=REDIRECT_URI&    ✅ REQUIRED
  scope=openid [profile email]& ✅ REQUIRED (must include openid)
  state=STATE&                  🟡 RECOMMENDED
  nonce=NONCE                   ✅ REQUIRED (for implicit, recommended for code)
```

**Parameters:**
- `response_type`: Must be `code`
- `client_id`: The client identifier
- `redirect_uri`: Where to redirect after authorization (REQUIRED in OIDC)
- `scope`: **MUST include `openid`** + optional `profile`, `email`, `address`, `phone`
- `state`: CSRF protection (recommended)
- `nonce`: Replay attack protection (required for implicit, recommended for code flow)

**Example:**
```http
https://auth.example.com/authorize?
  response_type=code&
  client_id=abc123&
  redirect_uri=https://app.example.com/callback&
  scope=openid profile email&
  state=xyz789&
  nonce=abc456
```

**Key Differences:**
1. ✅ **`openid` scope is REQUIRED** in OIDC
2. ✅ **`redirect_uri` is REQUIRED** in OIDC (optional in OAuth)
3. ✅ **`nonce` parameter** is recommended in OIDC (not in OAuth)
4. ✅ **Special scopes** (`profile`, `email`, `address`, `phone`) in OIDC

---

### **3. Authorization Response** 📨

#### **OAuth 2.0 Authorization Response (RFC 6749 Section 4.1.2)**

**Success Response:**
```http
HTTP/1.1 302 Found
Location: https://app.example.com/callback?
  code=AUTHORIZATION_CODE&
  state=xyz789
```

**Parameters:**
- `code`: The authorization code (REQUIRED)
- `state`: State parameter from request (if provided)

#### **OIDC Authorization Response (OIDC Core Section 3.1.2.5)**

**Success Response:**
```http
HTTP/1.1 302 Found
Location: https://app.example.com/callback?
  code=AUTHORIZATION_CODE&
  state=xyz789
```

**Parameters:**
- `code`: The authorization code (REQUIRED)
- `state`: State parameter from request (REQUIRED if sent in request)

**Key Differences:**
- ✅ **State validation is REQUIRED** in OIDC if state was sent
- Both responses look identical, but the **authorization code** in OIDC will result in an ID token

---

### **4. Token Request** 🎫

#### **OAuth 2.0 Token Request (RFC 6749 Section 4.1.3)**

```http
POST /token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic Base64(client_id:client_secret)

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=REDIRECT_URI&
client_id=CLIENT_ID
```

**Parameters:**
- `grant_type`: Must be `authorization_code` (REQUIRED)
- `code`: The authorization code (REQUIRED)
- `redirect_uri`: Must match the authorization request (REQUIRED if included in auth request)
- `client_id`: Client identifier (REQUIRED if not using HTTP Basic Auth)

#### **OIDC Token Request (OIDC Core Section 3.1.3.1)**

```http
POST /token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic Base64(client_id:client_secret)

grant_type=authorization_code&
code=AUTHORIZATION_CODE&
redirect_uri=REDIRECT_URI&
client_id=CLIENT_ID
```

**Parameters:** Identical to OAuth 2.0

**Key Differences:**
- ✅ **No difference in request format**
- ✅ **Difference is in the response** (includes ID token)

---

### **5. Token Response** 🎁

#### **OAuth 2.0 Token Response (RFC 6749 Section 4.1.4)**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "read write"
}
```

**Fields:**
- `access_token`: The access token (REQUIRED)
- `token_type`: Token type (usually "Bearer") (REQUIRED)
- `expires_in`: Token lifetime in seconds (RECOMMENDED)
- `refresh_token`: Refresh token (OPTIONAL)
- `scope`: Granted scopes (OPTIONAL)

**No ID Token, No User Identity**

#### **OIDC Token Response (OIDC Core Section 3.1.3.3)**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "openid profile email",
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Fields:**
- `access_token`: The access token (REQUIRED)
- `token_type`: Token type (usually "Bearer") (REQUIRED)
- `expires_in`: Token lifetime in seconds (RECOMMENDED)
- `refresh_token`: Refresh token (OPTIONAL)
- `scope`: Granted scopes (OPTIONAL)
- **`id_token`: JWT containing user identity claims (REQUIRED)** ⭐

**Key Differences:**
1. ✅ **ID Token is present** (REQUIRED in OIDC)
2. ✅ **Scope includes `openid`**
3. ✅ **User identity information** is in the ID token

---

### **6. ID Token Structure** 🎫

#### **OAuth 2.0**
- ❌ **No ID Token**
- ❌ **No user identity**
- ❌ **No authentication information**

#### **OIDC ID Token (OIDC Core Section 2)**

**JWT Structure:**
```json
{
  "iss": "https://auth.example.com",
  "sub": "248289761001",
  "aud": "abc123",
  "nonce": "n-0S6_WzA2Mj",
  "exp": 1311281970,
  "iat": 1311280970,
  "auth_time": 1311280969,
  "acr": "urn:mace:incommon:iap:silver",
  "amr": ["pwd", "mfa"],
  "azp": "abc123",
  
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane.doe@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}
```

**Standard Claims (OIDC Core Section 5.1):**

**Required Claims:**
- `iss`: Issuer identifier (REQUIRED)
- `sub`: Subject identifier (unique user ID) (REQUIRED)
- `aud`: Audience (client_id) (REQUIRED)
- `exp`: Expiration time (REQUIRED)
- `iat`: Issued at time (REQUIRED)

**Optional but Common Claims:**
- `auth_time`: When user authentication occurred
- `nonce`: Nonce from authorization request (REQUIRED if nonce was sent)
- `acr`: Authentication Context Class Reference
- `amr`: Authentication Methods References
- `azp`: Authorized party (client_id)

**User Profile Claims:**
- `name`: Full name
- `given_name`: First name
- `family_name`: Last name
- `email`: Email address
- `email_verified`: Email verification status
- `picture`: Profile picture URL

---

### **7. UserInfo Endpoint** 👤

#### **OAuth 2.0**
- ❌ **No UserInfo endpoint**
- ❌ **No standardized way to get user info**
- Each provider may have their own user API

#### **OIDC UserInfo Endpoint (OIDC Core Section 5.3)**

**Request:**
```http
GET /userinfo
Authorization: Bearer ACCESS_TOKEN
```

**Response:**
```json
{
  "sub": "248289761001",
  "name": "Jane Doe",
  "given_name": "Jane",
  "family_name": "Doe",
  "email": "jane.doe@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg",
  "updated_at": 1311280970
}
```

**Standard Claims:**
- Same as ID Token claims
- `sub` MUST match the `sub` in the ID token
- Can return additional user information

**Key Differences:**
1. ✅ **Standardized endpoint** for getting user information
2. ✅ **Standard claim names** across all OIDC providers
3. ✅ **Additional claims** beyond ID token
4. ✅ **Dynamic user info** (can change after ID token issued)

---

### **8. Discovery Endpoint** 🔍

#### **OAuth 2.0**
- ❌ **No standard discovery mechanism**
- Authorization server metadata is not standardized
- Each provider documents endpoints differently

#### **OIDC Discovery (OIDC Discovery Section 3)**

**Request:**
```http
GET /.well-known/openid-configuration
```

**Response:**
```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "registration_endpoint": "https://auth.example.com/register",
  "scopes_supported": ["openid", "profile", "email", "address", "phone"],
  "response_types_supported": ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],
  "response_modes_supported": ["query", "fragment", "form_post"],
  "grant_types_supported": ["authorization_code", "implicit", "refresh_token"],
  "subject_types_supported": ["public", "pairwise"],
  "id_token_signing_alg_values_supported": ["RS256", "ES256"],
  "claims_supported": ["sub", "name", "email", "email_verified", "picture"]
}
```

**Key Benefits:**
1. ✅ **Automatic endpoint discovery**
2. ✅ **Supported features discovery**
3. ✅ **No manual configuration needed**
4. ✅ **Standard across all OIDC providers**

---

### **9. Token Validation** ✅

#### **OAuth 2.0 Access Token Validation**

**Methods:**
1. **Token Introspection (RFC 7662)** - Optional extension
   ```http
   POST /introspect
   Content-Type: application/x-www-form-urlencoded
   
   token=ACCESS_TOKEN&
   token_type_hint=access_token
   ```

2. **Bearer Token Usage (RFC 6750)**
   - Let resource server validate the token
   - No standard for how validation occurs

**Key Points:**
- ❌ No standard validation process
- ❌ Access token format is not specified
- ❌ Validation is implementation-specific

#### **OIDC ID Token Validation (OIDC Core Section 3.1.3.7)**

**Required Validation Steps:**

1. ✅ **Verify JWT signature** using JWKS from `jwks_uri`
2. ✅ **Validate `iss` claim** matches authorization server
3. ✅ **Validate `aud` claim** includes client ID
4. ✅ **Validate `exp` claim** token not expired
5. ✅ **Validate `iat` claim** token not issued in future
6. ✅ **Validate `nonce` claim** matches request (if sent)
7. ✅ **Validate `azp` claim** if multiple audiences

**Example Validation:**
```javascript
// 1. Decode JWT
const decoded = jwt.decode(idToken, { complete: true });

// 2. Get signing key from JWKS
const key = await getSigningKey(decoded.header.kid);

// 3. Verify signature
const verified = jwt.verify(idToken, key);

// 4. Validate claims
if (verified.iss !== 'https://auth.example.com') throw new Error('Invalid issuer');
if (verified.aud !== 'abc123') throw new Error('Invalid audience');
if (verified.exp < Date.now() / 1000) throw new Error('Token expired');
if (verified.nonce !== requestNonce) throw new Error('Invalid nonce');
```

**Key Differences:**
1. ✅ **Standard validation process** (cryptographically verified)
2. ✅ **JWT format** (self-contained)
3. ✅ **Client-side validation** possible
4. ✅ **No server round-trip** needed for validation

---

### **10. Security Considerations** 🔒

#### **OAuth 2.0 Security (RFC 6749 Section 10)**

**Required:**
- ✅ TLS/HTTPS for all endpoints
- ✅ CSRF protection via `state` parameter (recommended)
- ✅ Client authentication for confidential clients
- ✅ Authorization code single-use only
- ✅ PKCE for public clients (RFC 7636)

**Not Standardized:**
- ❌ Token format
- ❌ Token validation
- ❌ User identity verification

#### **OIDC Security (OIDC Core Section 16)**

**All OAuth 2.0 Security Requirements PLUS:**

1. ✅ **Nonce parameter** - Replay attack protection
   - Random value in authorization request
   - Must be present in ID token
   - Client must verify nonce matches

2. ✅ **ID Token signature verification** - Cryptographic validation
   - JWT signature using JWKS
   - Prevents token tampering
   - Verifies token issuer

3. ✅ **`at_hash` claim** - Access token binding
   - Hash of access token in ID token
   - Prevents token substitution attacks

4. ✅ **`c_hash` claim** - Authorization code binding
   - Hash of authorization code in ID token
   - Prevents code substitution attacks

5. ✅ **User authentication time** - Session management
   - `auth_time` claim
   - `max_age` parameter
   - Forced re-authentication

**OIDC Security Example:**
```javascript
// Authorization request with security parameters
const authUrl = `${authorizationEndpoint}?
  response_type=code&
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  scope=openid profile email&
  state=${generateState()}&        // CSRF protection
  nonce=${generateNonce()}&        // Replay protection
  code_challenge=${codeChallenge}& // PKCE protection
  code_challenge_method=S256&
  max_age=3600`;                   // Force re-auth if older than 1 hour
```

---

### **11. Use Cases Comparison** 🎯

#### **OAuth 2.0 Authorization Code - Use Cases**

**✅ When to Use:**
1. **API Authorization Only**
   - Access user's data on another service
   - No need to know who the user is
   - Example: Post to user's Twitter account

2. **Service-to-Service Integration**
   - Backend service accessing another service
   - No user identity needed
   - Example: Backup service accessing Google Drive

3. **Data Aggregation**
   - Collect data from multiple sources
   - Focus on data access, not user identity
   - Example: Financial aggregator accessing bank APIs

4. **Third-Party App Permissions**
   - Grant permissions to third-party app
   - App doesn't need to know user details
   - Example: Scheduling app accessing calendar

**Examples:**
- ✅ Twitter API integration (post tweets, read timeline)
- ✅ GitHub API integration (access repositories, create issues)
- ✅ Google Drive API (read/write files)
- ✅ Spotify API (play music, create playlists)
- ✅ Dropbox API (access files)

#### **OIDC Authorization Code - Use Cases**

**✅ When to Use:**
1. **User Authentication (Login)**
   - Log user into your application
   - Need to know who the user is
   - Example: "Sign in with Google"

2. **Single Sign-On (SSO)**
   - Central authentication for multiple apps
   - Share user identity across apps
   - Example: Enterprise SSO system

3. **User Profile Management**
   - Display user information in your app
   - Pre-fill forms with user data
   - Example: E-commerce checkout with profile data

4. **Identity Verification**
   - Verify user's email, phone, or identity
   - Trusted identity provider
   - Example: Banking app identity verification

5. **Federated Identity**
   - Use external identity provider
   - Don't manage user credentials
   - Example: SaaS app using corporate identity

**Examples:**
- ✅ Social login (Google, Facebook, Microsoft, GitHub)
- ✅ Enterprise SSO (Okta, Auth0, Azure AD)
- ✅ Multi-tenant applications
- ✅ B2B applications with customer identity
- ✅ Mobile app user authentication
- ✅ SaaS application login

---

### **12. Implementation Complexity** 🛠️

#### **OAuth 2.0 Authorization Code**

**Implementation Steps:**
1. Register client with authorization server
2. Implement authorization request
3. Handle authorization response
4. Exchange code for access token
5. Use access token for API calls
6. Implement token refresh (if supported)

**Complexity: MEDIUM**
- ✅ Straightforward flow
- ✅ No token validation needed (server-side)
- ✅ No user identity handling
- ❌ Each provider is different
- ❌ No standard discovery

**Libraries Needed:**
- HTTP client
- OAuth 2.0 library (optional)

#### **OIDC Authorization Code**

**Implementation Steps:**
1. Discover OIDC endpoints (automatic)
2. Register client with authorization server
3. Implement authorization request (with nonce)
4. Handle authorization response
5. Exchange code for access token + ID token
6. **Validate ID token signature**
7. **Extract user identity from ID token**
8. (Optional) Call UserInfo endpoint
9. Use access token for API calls
10. Implement token refresh
11. **Handle user session management**

**Complexity: MEDIUM-HIGH**
- ✅ Standard across all providers
- ✅ Automatic discovery
- ✅ Well-documented
- ❌ ID token validation required
- ❌ JWT handling needed
- ❌ More security considerations

**Libraries Needed:**
- HTTP client
- **OIDC library** (recommended)
- **JWT library** (for validation)
- JWKS client (for signature verification)

---

### **13. Standards Evolution** 📈

#### **OAuth 2.0 Timeline**
- **2012:** RFC 6749 - OAuth 2.0 Framework
- **2015:** RFC 7636 - PKCE (Proof Key for Code Exchange)
- **2017:** RFC 8252 - OAuth for Native Apps
- **2020:** OAuth 2.0 Security Best Current Practice

#### **OIDC Timeline**
- **2014:** OpenID Connect Core 1.0
- **2014:** OpenID Connect Discovery 1.0
- **2014:** OpenID Connect Dynamic Registration 1.0
- **2019:** OpenID Connect for Identity Assurance 1.0
- **2021:** Financial-grade API (FAPI) 2.0

**Key Point:** OIDC is built on OAuth 2.0 and adds authentication capabilities on top of the authorization framework.

---

### **14. Provider Support** 🌐

#### **OAuth 2.0 Authorization Code Support**

**Major Providers:**
- ✅ Google APIs
- ✅ Facebook Graph API
- ✅ Twitter API
- ✅ GitHub API
- ✅ Spotify API
- ✅ Dropbox API
- ✅ Salesforce API
- ✅ Microsoft Graph API
- ✅ AWS Cognito
- ✅ LinkedIn API

**Use Case:** API access, data integration

#### **OIDC Authorization Code Support**

**Major Identity Providers:**
- ✅ Google Sign-In
- ✅ Microsoft Azure AD
- ✅ Okta
- ✅ Auth0
- ✅ PingOne (PingIdentity)
- ✅ Keycloak
- ✅ AWS Cognito
- ✅ OneLogin
- ✅ ForgeRock
- ✅ GitLab
- ✅ Apple Sign In

**Use Case:** User authentication, SSO, identity

---

### **15. Code Comparison** 💻

#### **OAuth 2.0 Authorization Code - Complete Flow**

```javascript
// 1. Generate authorization URL
const authUrl = `${authorizationEndpoint}?` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=${encodeURIComponent('read write')}&` +
  `state=${state}`;

// 2. Redirect user to authorization URL
window.location.href = authUrl;

// 3. Handle callback (on redirect_uri)
const code = new URLSearchParams(window.location.search).get('code');
const returnedState = new URLSearchParams(window.location.search).get('state');

// 4. Validate state
if (returnedState !== state) {
  throw new Error('Invalid state');
}

// 5. Exchange code for access token
const tokenResponse = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  })
});

const tokens = await tokenResponse.json();
// {
//   "access_token": "...",
//   "token_type": "Bearer",
//   "expires_in": 3600
// }

// 6. Use access token to call API
const apiResponse = await fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${tokens.access_token}`
  }
});

// That's it! No user identity information.
```

#### **OIDC Authorization Code - Complete Flow**

```javascript
// 0. Discover OIDC endpoints (automatic)
const discoveryResponse = await fetch(
  `${issuer}/.well-known/openid-configuration`
);
const config = await discoveryResponse.json();
const { 
  authorization_endpoint,
  token_endpoint,
  userinfo_endpoint,
  jwks_uri 
} = config;

// 1. Generate authorization URL with nonce
const nonce = generateNonce();
const authUrl = `${authorization_endpoint}?` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=${encodeURIComponent('openid profile email')}&` +
  `state=${state}&` +
  `nonce=${nonce}`;  // Add nonce for security

// 2. Redirect user to authorization URL
window.location.href = authUrl;

// 3. Handle callback (on redirect_uri)
const code = new URLSearchParams(window.location.search).get('code');
const returnedState = new URLSearchParams(window.location.search).get('state');

// 4. Validate state
if (returnedState !== state) {
  throw new Error('Invalid state');
}

// 5. Exchange code for tokens (access token + ID token)
const tokenResponse = await fetch(token_endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
  },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  })
});

const tokens = await tokenResponse.json();
// {
//   "access_token": "...",
//   "token_type": "Bearer",
//   "expires_in": 3600,
//   "id_token": "eyJhbGciOiJSUzI1NiIs..."  // ⭐ ID Token!
// }

// 6. Validate ID token signature
const jwks = await fetch(jwks_uri).then(r => r.json());
const idTokenVerified = await verifyJWT(tokens.id_token, jwks);

// 7. Validate ID token claims
if (idTokenVerified.iss !== issuer) throw new Error('Invalid issuer');
if (idTokenVerified.aud !== clientId) throw new Error('Invalid audience');
if (idTokenVerified.exp < Date.now() / 1000) throw new Error('Token expired');
if (idTokenVerified.nonce !== nonce) throw new Error('Invalid nonce');

// 8. Extract user identity from ID token
const userIdentity = {
  userId: idTokenVerified.sub,
  name: idTokenVerified.name,
  email: idTokenVerified.email,
  emailVerified: idTokenVerified.email_verified,
  picture: idTokenVerified.picture
};

// 9. (Optional) Get additional user info from UserInfo endpoint
const userinfoResponse = await fetch(userinfo_endpoint, {
  headers: {
    'Authorization': `Bearer ${tokens.access_token}`
  }
});
const userinfo = await userinfoResponse.json();

// 10. Log user into your app
console.log('User logged in:', userIdentity);

// 11. Use access token to call API
const apiResponse = await fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${tokens.access_token}`
  }
});
```

**Key Code Differences:**
1. ✅ OIDC requires `nonce` parameter
2. ✅ OIDC returns ID token
3. ✅ OIDC requires ID token validation
4. ✅ OIDC provides user identity
5. ✅ OIDC has UserInfo endpoint
6. ✅ OIDC has automatic discovery

---

## Summary Table

| Feature | OAuth 2.0 Authorization Code | OIDC Authorization Code |
|---------|----------------------------|------------------------|
| **Standard** | RFC 6749 | OpenID Connect Core 1.0 |
| **Purpose** | API Authorization | User Authentication + API Authorization |
| **Tokens** | Access Token | Access Token + ID Token |
| **User Identity** | No | Yes (in ID Token) |
| **Scope** | Any scopes | Must include `openid` |
| **Nonce Parameter** | No | Yes (recommended) |
| **Token Validation** | Implementation-specific | Standard JWT validation |
| **UserInfo Endpoint** | No | Yes (standard) |
| **Discovery** | No | Yes (/.well-known/openid-configuration) |
| **JWKS** | No | Yes (for signature verification) |
| **User Claims** | No | Yes (standard claims) |
| **Authentication Time** | No | Yes (`auth_time` claim) |
| **Single Sign-On** | No | Yes |
| **Complexity** | Medium | Medium-High |
| **Use Case** | "What can this app do?" | "Who is this user?" |

---

## Key Takeaways 🎓

1. **OIDC = OAuth 2.0 + Authentication**
   - OIDC is built on top of OAuth 2.0
   - Uses the same authorization code flow
   - Adds user identity and authentication

2. **Use OAuth 2.0 When:**
   - You only need API access
   - You don't need to know who the user is
   - You're building service-to-service integration

3. **Use OIDC When:**
   - You need to authenticate users
   - You need user identity information
   - You're building "Sign in with..." functionality
   - You need Single Sign-On (SSO)

4. **Standards Matter:**
   - OIDC provides standard discovery
   - OIDC provides standard user claims
   - OIDC provides standard token validation
   - OAuth 2.0 is more flexible but less standardized for identity

5. **Security:**
   - Both require HTTPS/TLS
   - Both use state parameter for CSRF protection
   - OIDC adds nonce for replay protection
   - OIDC adds cryptographic token validation

---

## Conclusion

OAuth 2.0 Authorization Code Flow and OIDC Authorization Code Flow use the **same underlying mechanism** (authorization code exchange), but serve **different purposes**:

- **OAuth 2.0:** "What can this app do?" (Authorization)
- **OIDC:** "Who is this user?" + "What can this app do?" (Authentication + Authorization)

If you need to know **who the user is**, use **OIDC**.  
If you only need **API access**, use **OAuth 2.0**.

**In practice:** Most modern applications use OIDC because they need both user authentication and API authorization.

---

**References:**
- RFC 6749: The OAuth 2.0 Authorization Framework
- OpenID Connect Core 1.0
- OpenID Connect Discovery 1.0
- RFC 7636: Proof Key for Code Exchange (PKCE)
- OAuth 2.0 Security Best Current Practice

---

**Created:** 2025-10-08  
**Session:** Configuration Summary Service Professional Redesign  
**Status:** ✅ Complete and comprehensive
