# PingOne OAuth/OIDC Feature Support Matrix

## Complete Parameter & Feature Comparison for Authorization Code Flows

This document provides a **comprehensive** comparison of OAuth 2.0 and OpenID Connect features supported by PingOne versus the full specifications, specifically for **Authorization Code Flows**.

---

## Core Required Parameters (Authorization Request)

| Parameter | OAuth 2.0 | OIDC | PingOne Support | Notes |
|-----------|-----------|------|-----------------|-------|
| `response_type` | ✅ Required | ✅ Required | ✅ Full | `code` for authz code flow |
| `client_id` | ✅ Required | ✅ Required | ✅ Full | Application client ID |
| `redirect_uri` | ✅ Required | ✅ Required | ✅ Full | Must match registered URI exactly |
| `scope` | ✅ Required | ✅ Required | ✅ Full | Space-separated scopes |
| `state` | ⚠️ Recommended | ✅ Required | ✅ Full | CSRF protection |
| `nonce` | N/A | ✅ Required | ✅ Full | Replay attack protection (OIDC only) |

**All core parameters are fully supported by PingOne** ✅

---

## PKCE Parameters (RFC 7636)

| Parameter | Spec | PingOne Support | Notes |
|-----------|------|-----------------|-------|
| `code_challenge` | ✅ Required (public clients) | ✅ Full | SHA256 or plain |
| `code_challenge_method` | ✅ Required | ✅ Full | `S256` recommended, `plain` supported |
| `code_verifier` | ✅ Required (token request) | ✅ Full | Sent in token exchange |

**PingOne PKCE Status:**
- ✅ **Mandatory for public clients** (SPAs, mobile apps)
- ✅ **Recommended for confidential clients**
- ✅ **S256 method fully supported**
- ✅ **Enforced by application configuration**

---

## Advanced Authorization Parameters

### ✅ Well-Supported by PingOne

| Parameter | Spec | PingOne | Implementation | In Flows |
|-----------|------|---------|----------------|----------|
| **audience** | OAuth 2.0 Extension | ✅ Good | Target API/resource server | OAuth/OIDC Authz ✅ |
| **prompt** | OIDC Core 3.1.2.1 | ✅ Good | `none`, `login`, `consent`, `select_account` | OAuth/OIDC Authz ✅ |
| **claims** | OIDC Core 5.5 | ✅ Good | Request specific claims | OIDC Authz ✅ |
| **login_hint** | OIDC Core 3.1.2.1 | ⚠️ Limited | Pre-fill username | Can try, limited |
| **id_token_hint** | OIDC Core 3.1.2.1 | ⚠️ Limited | Seamless re-auth | Enterprise configs |

### ❌ Not Supported by PingOne

| Parameter | Spec | PingOne | Reason |
|-----------|------|---------|--------|
| **resource** | RFC 8707 | ❌ No | Newer spec (2019), not widely adopted |
| **display** | OIDC Core 3.1.2.1 | ❌ Limited | UI adaptation complex |
| **ui_locales** | OIDC Core 3.1.2.1 | ❌ No | i18n not implemented |
| **claims_locales** | OIDC Core 3.1.2.1 | ❌ No | Claim value localization not supported |
| **acr_values** | OIDC Core 3.1.2.1 | ⚠️ Limited | Requires auth policy configuration |
| **max_age** | OIDC Core 3.1.2.1 | ⚠️ Limited | May conflict with SSO settings |

### ⛔ Never Supported (Security/Complexity)

| Parameter | Spec | PingOne | Reason |
|-----------|------|---------|--------|
| **request** | OIDC Core 6.1 | ❌ No | JAR (JWT-secured request) - complex |
| **request_uri** | OIDC Core 6.2 | ❌ No | Request by reference - not needed |
| **registration** | OAuth 2.0 Dynamic Reg | ❌ No | Dynamic client registration - use admin portal |

---

## Token Request Parameters

### Authorization Code Exchange

| Parameter | Spec | PingOne | Notes |
|-----------|------|---------|-------|
| `grant_type` | ✅ Required | ✅ Full | `authorization_code` |
| `code` | ✅ Required | ✅ Full | Authorization code from callback |
| `redirect_uri` | ✅ Required | ✅ Full | Must match authorization request |
| `code_verifier` | PKCE | ✅ Full | PKCE verification |
| `client_id` | ✅ Required (public) | ✅ Full | Client identification |
| `client_secret` | ✅ Required (confidential) | ✅ Full | Client authentication |

**PingOne Token Endpoint:** Fully spec-compliant ✅

---

## Client Authentication Methods

| Method | Spec | PingOne Support | Use Case |
|--------|------|-----------------|----------|
| **client_secret_post** | OAuth 2.0 | ✅ Full | Secret in POST body |
| **client_secret_basic** | OAuth 2.0 | ✅ Full | Secret in Basic Auth header |
| **client_secret_jwt** | OIDC Core 9 | ✅ Full | JWT signed with client secret |
| **private_key_jwt** | OIDC Core 9 | ✅ Full | JWT signed with private key |
| **none** | OAuth 2.0 | ✅ Full | Public clients (with PKCE) |

**PingOne Status:** All standard authentication methods supported ✅

---

## Token Types & Claims

### Access Token

| Feature | PingOne Support | Notes |
|---------|-----------------|-------|
| **JWT Format** | ✅ Yes | Signed JWTs |
| **Opaque Format** | ⚠️ Configurable | Can be opaque tokens |
| **`aud` claim** | ✅ Yes | Reflects audience parameter |
| **`scope` claim** | ✅ Yes | Granted scopes |
| **`sub` claim** | ✅ Yes | User subject identifier |
| **`iss` claim** | ✅ Yes | PingOne issuer URL |
| **`exp` claim** | ✅ Yes | Token expiration |
| **Custom claims** | ✅ Yes | Via attribute mapping |

### ID Token (OIDC)

| Feature | PingOne Support | Notes |
|---------|-----------------|-------|
| **All required claims** | ✅ Yes | `iss`, `sub`, `aud`, `exp`, `iat` |
| **`nonce` claim** | ✅ Yes | Matches request nonce |
| **`auth_time` claim** | ✅ Yes | Authentication timestamp |
| **`acr` claim** | ⚠️ Limited | If ACR configured |
| **`amr` claim** | ✅ Yes | Authentication methods |
| **Standard profile claims** | ✅ Yes | `name`, `email`, `picture`, etc. |
| **Custom claims** | ✅ Yes | Via claims request |

### Refresh Token

| Feature | PingOne Support | Notes |
|---------|-----------------|-------|
| **Refresh token issuance** | ✅ Yes | With `offline_access` scope |
| **Refresh token rotation** | ✅ Yes | Configurable |
| **Refresh token expiration** | ✅ Yes | Configurable lifetime |
| **Refresh token revocation** | ✅ Yes | Via revocation endpoint |

---

## Endpoints

| Endpoint | Spec | PingOne | Status |
|----------|------|---------|--------|
| **Authorization Endpoint** | OAuth 2.0 | ✅ Full | `/as/authorize` |
| **Token Endpoint** | OAuth 2.0 | ✅ Full | `/as/token` |
| **UserInfo Endpoint** | OIDC Core | ✅ Full | `/as/userinfo` |
| **JWKS Endpoint** | OIDC Discovery | ✅ Full | `/as/jwks` |
| **Revocation Endpoint** | RFC 7009 | ✅ Full | `/as/revoke` |
| **Introspection Endpoint** | RFC 7662 | ✅ Full | `/as/introspect` |
| **End Session Endpoint** | OIDC Session Mgmt | ✅ Full | `/as/signoff` |
| **Discovery Endpoint** | OIDC Discovery | ✅ Full | `/.well-known/openid-configuration` |

**All standard endpoints supported** ✅

---

## Session Management & Logout

| Feature | Spec | PingOne Support | Notes |
|---------|------|-----------------|-------|
| **RP-Initiated Logout** | OIDC Session Mgmt | ✅ Full | `/as/signoff` |
| **Post-Logout Redirect URI** | OIDC Session Mgmt | ✅ Full | Must be registered |
| **`id_token_hint` (logout)** | OIDC Session Mgmt | ✅ Full | Identifies session |
| **`state` (logout)** | OIDC Session Mgmt | ✅ Full | Passed to post-logout URI |
| **Front-Channel Logout** | OIDC Front-Channel | ⚠️ Limited | Enterprise feature |
| **Back-Channel Logout** | OIDC Back-Channel | ⚠️ Limited | Enterprise feature |
| **Session Management** | OIDC Session Mgmt | ⚠️ Limited | iframe-based check |

---

## Security Features

| Feature | Spec | PingOne Support | Implementation |
|---------|------|-----------------|----------------|
| **PKCE** | RFC 7636 | ✅ Mandatory (public) | S256 + plain |
| **State Parameter** | OAuth 2.0 | ✅ Required | CSRF protection |
| **Nonce** | OIDC Core | ✅ Required | Replay protection |
| **HTTPS Only** | OAuth 2.0 | ✅ Enforced | All endpoints |
| **Token Binding** | RFC 8473 | ❌ No | Complex, not widely adopted |
| **DPoP** | RFC 9449 | ❌ No | Sender-constrained tokens |
| **mTLS** | RFC 8705 | ⚠️ Limited | Enterprise feature |
| **PAR** | RFC 9126 | ⚠️ Limited | Pushed Authorization Requests |

---

## Scopes

### Standard OAuth 2.0 Scopes

| Scope | Purpose | PingOne Support |
|-------|---------|-----------------|
| `openid` | OIDC authentication | ✅ Required for OIDC |
| `profile` | Profile claims | ✅ Full |
| `email` | Email claims | ✅ Full |
| `address` | Address claims | ✅ Full |
| `phone` | Phone claims | ✅ Full |
| `offline_access` | Refresh tokens | ✅ Full |

### Custom Scopes

| Feature | PingOne Support | Notes |
|---------|-----------------|-------|
| **Custom scopes** | ✅ Full | Define in application |
| **Scope mapping** | ✅ Full | Map to claims/permissions |
| **Dynamic scopes** | ✅ Full | Request-time scopes |
| **Scope consent** | ✅ Full | User consent for scopes |

---

## Response Types

| Response Type | Spec | Flow | PingOne Support |
|---------------|------|------|-----------------|
| `code` | OAuth 2.0 | Authorization Code | ✅ Full |
| `token` | OAuth 2.0 | Implicit (deprecated) | ✅ Full |
| `id_token` | OIDC | Implicit (deprecated) | ✅ Full |
| `code id_token` | OIDC | Hybrid | ✅ Full |
| `code token` | OIDC | Hybrid | ✅ Full |
| `code id_token token` | OIDC | Hybrid | ✅ Full |

**Note:** Implicit flow is deprecated. Use Authorization Code + PKCE.

---

## Response Modes

| Response Mode | Spec | PingOne Support | Notes |
|---------------|------|-----------------|-------|
| `query` | OAuth 2.0 | ✅ Full | Default for `code` |
| `fragment` | OAuth 2.0 | ✅ Full | Default for implicit |
| `form_post` | OAuth 2.0 Multiple Response Types | ✅ Full | POST to redirect_uri |
| `jwt` | JARM (JWT-secured Auth Response) | ❌ No | Not implemented |

---

## Error Responses

| Error Code | Spec | PingOne Support | Description |
|------------|------|-----------------|-------------|
| `invalid_request` | OAuth 2.0 | ✅ Full | Malformed request |
| `unauthorized_client` | OAuth 2.0 | ✅ Full | Client not authorized |
| `access_denied` | OAuth 2.0 | ✅ Full | User denied consent |
| `unsupported_response_type` | OAuth 2.0 | ✅ Full | Invalid response_type |
| `invalid_scope` | OAuth 2.0 | ✅ Full | Invalid/unknown scope |
| `server_error` | OAuth 2.0 | ✅ Full | Server error |
| `temporarily_unavailable` | OAuth 2.0 | ✅ Full | Service unavailable |
| `interaction_required` | OIDC | ✅ Full | User interaction needed |
| `login_required` | OIDC | ✅ Full | Re-authentication required |
| `consent_required` | OIDC | ✅ Full | User consent required |
| `invalid_grant` | OAuth 2.0 | ✅ Full | Invalid/expired code |

**Error handling is spec-compliant** ✅

---

## What's Implemented in Our Flows

### OAuth Authorization Code Flow V6
**Implemented Parameters:**
- ✅ All core required parameters
- ✅ PKCE (S256)
- ✅ State
- ✅ Audience (advanced)
- ✅ Prompt (advanced)
- ✅ Login hint (limited)
- ❌ Resources (not shown - unsupported)
- ❌ Display (not shown - unsupported)

### OIDC Authorization Code Flow V6
**Implemented Parameters:**
- ✅ All core required parameters
- ✅ PKCE (S256)
- ✅ State
- ✅ Nonce
- ✅ Audience (advanced)
- ✅ Prompt (advanced)
- ✅ Claims request (advanced)
- ✅ Login hint (limited)
- ❌ Resources (not shown - unsupported)
- ❌ Display (not shown - unsupported)
- ❌ UI Locales (not shown - unsupported)

---

## Recommendations by Use Case

### Public Clients (SPA, Mobile)
**Must Use:**
- ✅ Authorization Code Flow
- ✅ PKCE (S256 method)
- ✅ State parameter
- ✅ Nonce (OIDC)
- ❌ No client secret

**PingOne Configuration:**
- Token endpoint auth method: `none`
- PKCE: Required
- Refresh tokens: Optional

### Confidential Clients (Web Apps)
**Must Use:**
- ✅ Authorization Code Flow
- ✅ Client Secret (or private_key_jwt)
- ✅ State parameter
- ✅ Nonce (OIDC)
- ⚠️ PKCE recommended

**PingOne Configuration:**
- Token endpoint auth method: `client_secret_basic` or `private_key_jwt`
- PKCE: Recommended
- Refresh tokens: Yes

### Enterprise SSO
**Should Use:**
- ✅ Authorization Code Flow
- ✅ Prompt=none for silent auth
- ✅ ID token hint for session hints
- ✅ ACR values (if configured)
- ✅ Max age (if needed)

**PingOne Configuration:**
- SSO enabled
- Session policies configured
- Multiple auth methods if using ACR

---

## Spec Compliance Summary

| Category | Compliance | Notes |
|----------|------------|-------|
| **OAuth 2.0 Core (RFC 6749)** | ✅ Full | All required features |
| **PKCE (RFC 7636)** | ✅ Full | S256 + plain |
| **OIDC Core 1.0** | ✅ Full | All required features |
| **OIDC Discovery** | ✅ Full | Well-known endpoint |
| **Token Revocation (RFC 7009)** | ✅ Full | Revocation endpoint |
| **Token Introspection (RFC 7662)** | ✅ Full | Introspection endpoint |
| **JWT (RFC 7519)** | ✅ Full | Token format |
| **Resource Indicators (RFC 8707)** | ❌ No | Not implemented |
| **PAR (RFC 9126)** | ⚠️ Limited | Enterprise feature |
| **JARM** | ❌ No | Not implemented |
| **DPoP (RFC 9449)** | ❌ No | Not implemented |

---

## Missing Features (vs. Full Spec)

### Not Supported by PingOne:
1. **Resource Indicators (RFC 8707)** - Multiple resource servers
2. **JARM** - JWT-secured authorization responses
3. **DPoP** - Sender-constrained tokens
4. **Token Binding** - Cryptographic binding
5. **Request Object** - JAR (JWT-secured requests)
6. **UI Locales** - UI language preference
7. **Claims Locales** - Claim value localization

### Limited Support:
1. **Display Parameter** - UI adaptation
2. **ACR Values** - Requires configuration
3. **Max Age** - May conflict with SSO
4. **Login Hint** - Depends on theme
5. **ID Token Hint** - Limited scenarios
6. **Front/Back-Channel Logout** - Enterprise feature
7. **mTLS** - Enterprise feature
8. **PAR** - Enterprise feature

---

## Updates to Our Implementation

Based on this comprehensive review, our flows correctly:

✅ **Show only PingOne-supported parameters** in real flows
✅ **Hide unsupported parameters** (Resources, Display, UI Locales)
✅ **Provide demo flow** for full spec education
✅ **Document limitations** clearly
✅ **Implement all core features** (PKCE, State, Nonce, etc.)
✅ **Support all client authentication methods**
✅ **Handle errors properly**

**No changes needed** - implementation is correct! 🎉

---

**Document Version:** 2.0  
**Last Updated:** October 2025  
**PingOne API:** Latest  
**OAuth Spec:** RFC 6749, 6750, 7009, 7636, 7662, 8707  
**OIDC Spec:** Core 1.0, Discovery 1.0, Session Management 1.0
