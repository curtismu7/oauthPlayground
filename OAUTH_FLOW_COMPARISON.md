# 🔐 OAuth Flow Comparison: Authorization vs JWT Bearer vs SAML Bearer

## Overview

This document explains the key differences between three OAuth 2.0 client authentication methods:
1. **Authorization Code Flow** - Interactive user authentication
2. **JWT Bearer Token Flow (RFC 7523)** - PKI-based client authentication
3. **SAML Bearer Assertion Flow (RFC 7522)** - IdP-based client authentication

---

## Quick Comparison Table

| Feature | Authorization Code | JWT Bearer | SAML Bearer |
|---------|-------------------|------------|-------------|
| **User Interaction** | ✅ Required | ❌ None | ❌ None |
| **Browser Required** | ✅ Yes | ❌ No | ❌ No |
| **Client Type** | Public/Confidential | Confidential | Confidential |
| **Authentication Method** | User credentials | Client assertion (JWT) | IdP assertion (SAML) |
| **Grant Type** | `authorization_code` | `urn:ietf:params:oauth:grant-type:jwt-bearer` | `urn:ietf:params:oauth:grant-type:saml2-bearer` |
| **Use Case** | User authentication | Server-to-server | Enterprise SSO |
| **Cryptography** | Optional (PKCE) | Required (JWT signing) | Required (SAML signing) |
| **Key Management** | Client secret | Private/Public key pair | IdP trust relationship |
| **Assertion Lifetime** | N/A | JWT `exp` claim | SAML `NotOnOrAfter` |
| **Trust Model** | Client secret | PKI certificates | IdP federation |

---

## Detailed Comparison

### 1. Authorization Code Flow

**What it is:**
- Interactive flow requiring user authentication
- User logs in via browser
- Authorization code exchanged for tokens

**When to use:**
- Web applications with user login
- Mobile apps with user accounts
- Any scenario requiring user consent

**How it works:**
```
1. Client redirects user to authorization server
2. User authenticates and consents
3. Authorization server redirects back with code
4. Client exchanges code for access token
```

**Key Characteristics:**
- ✅ User context and identity
- ✅ Delegated authorization
- ✅ Refresh tokens available
- ❌ Requires browser/UI
- ❌ User must be present

---

### 2. JWT Bearer Token Flow (RFC 7523)

**What it is:**
- Client authenticates using a self-signed JWT
- No user interaction required
- PKI-based authentication

**When to use:**
- Microservices communication
- Batch processing
- Automated systems
- High-security environments
- Server-to-server with PKI

**How it works:**
```
1. Client creates JWT with claims (iss, sub, aud, exp, jti)
2. Client signs JWT with private key
3. Client sends JWT to token endpoint
4. Server verifies signature and issues token
```

**Key Characteristics:**
- ✅ No user interaction
- ✅ Strong cryptographic authentication
- ✅ Self-contained assertions
- ✅ Private key never transmitted
- ❌ Requires key management
- ❌ More complex setup

**JWT Structure:**
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "iss": "client-id",
    "sub": "client-id",
    "aud": "https://auth.example.com/token",
    "exp": 1640995200,
    "iat": 1640991600,
    "jti": "unique-jwt-id"
  }
}
```

---

### 3. SAML Bearer Assertion Flow (RFC 7522)

**What it is:**
- Client uses SAML assertion from IdP
- Leverages existing SAML infrastructure
- Federation-based authentication

**When to use:**
- Enterprise SSO integration
- Legacy SAML systems
- Cross-domain authentication
- Federation scenarios
- Corporate identity management

**How it works:**
```
1. Client obtains SAML assertion from IdP
2. Client verifies assertion validity
3. Client sends SAML assertion to token endpoint
4. Server validates assertion and issues token
```

**Key Characteristics:**
- ✅ No user interaction (after SSO)
- ✅ Leverages existing IdP infrastructure
- ✅ Enterprise-grade trust
- ✅ Attribute-based authorization
- ❌ Requires SAML IdP
- ❌ More complex XML processing

**SAML Assertion Structure:**
```xml
<saml:Assertion>
  <saml:Issuer>https://idp.example.com</saml:Issuer>
  <saml:Subject>
    <saml:NameID>user@example.com</saml:NameID>
  </saml:Subject>
  <saml:Conditions NotBefore="..." NotOnOrAfter="...">
    <saml:AudienceRestriction>
      <saml:Audience>https://auth.example.com</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
</saml:Assertion>
```

---

## Use Case Scenarios

### Scenario 1: User-Facing Web Application
**Best Choice:** Authorization Code Flow
- User needs to log in
- Need user identity and consent
- Delegated access to user's data

### Scenario 2: Microservice Communication
**Best Choice:** JWT Bearer Token Flow
- Service A calls Service B
- No user involved
- Need strong authentication
- PKI infrastructure available

### Scenario 3: Enterprise SSO Integration
**Best Choice:** SAML Bearer Assertion Flow
- Existing SAML infrastructure
- Corporate identity provider
- Federation requirements
- Legacy system integration

### Scenario 4: Mobile App with User Login
**Best Choice:** Authorization Code Flow + PKCE
- User authentication required
- Mobile platform
- No client secret storage

### Scenario 5: Batch Processing Job
**Best Choice:** JWT Bearer Token Flow
- Automated system
- No user interaction
- Scheduled execution
- High security requirements

---

## Security Considerations

### Authorization Code Flow
- ✅ User must authenticate
- ✅ PKCE prevents code interception
- ✅ State parameter prevents CSRF
- ⚠️ Client secret must be protected
- ⚠️ Redirect URI must be validated

### JWT Bearer Token Flow
- ✅ Private key never transmitted
- ✅ Cryptographic signature verification
- ✅ Short-lived assertions
- ✅ Replay protection via `jti`
- ⚠️ Private key must be secured
- ⚠️ Clock skew considerations

### SAML Bearer Assertion Flow
- ✅ XML signature verification
- ✅ Trust relationship with IdP
- ✅ Attribute-based authorization
- ✅ Assertion lifecycle management
- ⚠️ Complex XML processing
- ⚠️ IdP must be trusted

---

## Token Request Comparison

### Authorization Code Flow
```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE_HERE
&redirect_uri=https://client.example.com/callback
&client_id=CLIENT_ID
&client_secret=CLIENT_SECRET
```

### JWT Bearer Token Flow
```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
&scope=read write
```

### SAML Bearer Assertion Flow
```http
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer
&assertion=PHNhbWw6QXNzZXJ0aW9uIHhtbG5zOnNhbWw9InVyb...
&scope=read write
```

---

## Implementation Complexity

### Authorization Code Flow
**Complexity:** Medium
- Client-side redirect handling
- State management
- Token exchange logic
- PKCE implementation (recommended)

### JWT Bearer Token Flow
**Complexity:** High
- JWT library integration
- Private key management
- Signature generation
- Claim validation

### SAML Bearer Assertion Flow
**Complexity:** Very High
- SAML library integration
- XML processing
- IdP integration
- Trust relationship setup
- Signature verification

---

## Industry Adoption

### Authorization Code Flow
- 🌟 Most widely used
- ✅ Supported by all OAuth providers
- ✅ Standard for user-facing apps
- **Examples:** Google, Facebook, GitHub, Microsoft

### JWT Bearer Token Flow
- 🏢 Common in enterprise
- ✅ Supported by enterprise OAuth servers
- ✅ Standard for service accounts
- **Examples:** Google Service Accounts, Auth0 Machine-to-Machine

### SAML Bearer Assertion Flow
- 🏛️ Common in large enterprises
- ⚠️ Less common than JWT Bearer
- ✅ Standard for SAML federation
- **Examples:** Enterprise SaaS, Government systems

---

## Summary

**Use Authorization Code when:**
- You have users
- You need user consent
- You're building a user-facing application

**Use JWT Bearer when:**
- You have no users (service accounts)
- You have PKI infrastructure
- You need strong cryptographic authentication
- You're building microservices

**Use SAML Bearer when:**
- You have existing SAML infrastructure
- You need enterprise SSO integration
- You're federating with identity providers
- You're working with legacy systems

---

## PingOne Support

| Flow | PingOne Support |
|------|----------------|
| Authorization Code | ✅ Fully Supported |
| JWT Bearer | ❌ Not Supported |
| SAML Bearer | ❌ Not Supported |

**Note:** JWT Bearer and SAML Bearer flows in this playground are mock/educational implementations to demonstrate the concepts and specifications.
