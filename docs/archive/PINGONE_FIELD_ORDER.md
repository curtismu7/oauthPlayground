# PingOne Field Order Reference

**Date:** 2024-11-16  
**Purpose:** Educational - Match PingOne Console field order

---

## PingOne Console Field Order

### General Section (Collapsible)
1. **Environment ID** (read-only in PingOne, but editable in our tool)
2. **Client ID** (read-only in PingOne, but editable in our tool)
3. **Client Secret** (with show/hide toggle)
4. **Previous Client Secret** (if exists)

### OIDC Settings Section (Collapsible)
1. **Token Auth Method** (Token Endpoint Authentication)
   - Client Secret Post
   - Client Secret Basic
   - Client Secret JWT
   - Private Key JWT
   - None

2. **Response Type**
   - Code
   - Token
   - ID Token
   - Code ID Token
   - Code Token
   - Code Token ID Token
   - None Specified

3. **Grant Type**
   - Authorization Code
   - Implicit
   - Refresh Token
   - Client Credentials
   - Resource Owner Password Credentials
   - Device Code
   - Token Exchange

4. **Redirect URIs** (list)
   - Multiple URIs allowed
   - Must match exactly

5. **Sign Off URLs** (Post-Logout Redirect URIs)
   - Multiple URIs allowed
   - Must match exactly

6. **Scopes** (list)
   - openid
   - profile
   - email
   - address
   - phone
   - Custom scopes

---

## Our V8U Implementation Order

To match PingOne for educational purposes:

### 1. Specification & Flow Type (Our Addition - Top)
- Spec Version (OAuth 2.0 / 2.1 / OIDC)
- Flow Type (Authorization Code, Implicit, etc.)
- **Note:** This is our addition to help users understand specs

### 2. General Section (Collapsible)
- Environment ID
- Client ID
- Client Secret

### 3. OIDC Settings Section (Collapsible)
- Token Endpoint Authentication
- Response Type (if applicable)
- Grant Type (read-only, based on flow)
- Redirect URI
- Post-Logout Redirect URI (Sign Off URLs)
- Scopes

### 4. Advanced Section (Collapsible - Optional)
- Login Hint
- PKCE (checkbox)
- Refresh Token (checkbox)
- Other advanced options

---

## API Documentation Links

### OAuth 2.0 / 2.1
- **Authorization Code:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-and-authentication-apis-authorize-authorization-code
- **Implicit:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-and-authentication-apis-authorize-implicit
- **Client Credentials:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-and-authentication-apis-token-client-credentials
- **Device Code:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-and-authentication-apis-device-authorization-request
- **ROPC:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-and-authentication-apis-token-resource-owner-password-credentials

### OpenID Connect
- **OIDC Core:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#openid-connect
- **UserInfo:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-user-info
- **Token Introspection:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#introspect-token
- **Token Revocation:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#revoke-token

### General
- **PingOne API Overview:** https://apidocs.pingidentity.com/pingone/platform/v1/api/
- **OAuth 2.0 Endpoints:** https://apidocs.pingidentity.com/pingone/platform/v1/api/#authorization-and-authentication-apis

---

## Implementation Notes

1. **Collapsible Sections** - Match PingOne's collapsible sections
2. **Field Order** - Exactly match PingOne for educational purposes
3. **API Links** - Add "📖 View API Docs" link for each flow type
4. **Tooltips** - Explain why fields are in this order (matches PingOne)

