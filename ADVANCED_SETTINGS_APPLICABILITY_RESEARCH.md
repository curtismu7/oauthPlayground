# Advanced Settings Section Applicability Research

## 🔬 What's in "PingOne Security & Advanced Settings"?

Based on `PingOneApplicationConfig.tsx`, this section contains:

### Security & Authentication
- **Client Authentication Method** (client_secret_post, client_secret_basic, private_key_jwt, etc.)
- **PKCE Enforcement** (OPTIONAL, REQUIRED, S256_REQUIRED)
- **JWKS Configuration** (JWKS URL, inline JWKS)
- **Request Parameter Signature** (unsigned vs signed requests)

### Authorization Configuration
- **Response Types** (code, token, id_token combinations)
- **Grant Types** (authorization_code, implicit, etc.)
- **PAR (Pushed Authorization Requests)** - RFC 9126

### Advanced Features
- **Refresh Token Replay Protection**
- **OIDC Session Management**
- **CORS Origins**
- **Initiate Login URI**
- **Sign-off URLs**

---

## 📊 Flow-by-Flow Analysis

### ✅ **SHOULD SHOW** Advanced Settings

These flows use the **Authorization Endpoint** and have authorization requests:

| Flow | Has Authz Request | Has Token Endpoint | PKCE | PAR | Client Auth | Verdict |
|------|-------------------|-------------------|------|-----|-------------|---------|
| **OAuth Authorization Code** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | **SHOW** ✅ |
| **OIDC Authorization Code** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | **SHOW** ✅ |
| **Hybrid Flow** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | **SHOW** ✅ |
| **PAR Flow (dedicated)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **PRIMARY** | ✅ Yes | **SHOW** ✅ |
| **OAuth Implicit** | ✅ Yes | ❌ No | ⚠️ Optional | ✅ Possible | ❌ No | **SHOW** ⚠️ |
| **OIDC Implicit** | ✅ Yes | ❌ No | ⚠️ Optional | ✅ Possible | ❌ No | **SHOW** ⚠️ |

**Reasoning:**
- All have browser-based authorization requests to PingOne
- PKCE, response types, and PAR are directly relevant
- Even Implicit flows can benefit from response type configuration

---

### ❌ **SHOULD HIDE** Advanced Settings

These flows use **Token Endpoint ONLY** (no authorization request):

| Flow | Has Authz Request | Has Token Endpoint | PKCE | PAR | Client Auth | Verdict |
|------|-------------------|-------------------|------|-----|-------------|---------|
| **Client Credentials** | ❌ No | ✅ Yes | ❌ N/A | ❌ N/A | ✅ Yes* | **HIDE** ❌ |
| **Resource Owner Password** | ❌ No | ✅ Yes | ❌ N/A | ❌ N/A | ✅ Yes* | **HIDE** ❌ |
| **JWT Bearer** | ❌ No | ✅ Yes | ❌ N/A | ❌ N/A | ✅ JWT | **HIDE** ❌ |
| **SAML Bearer** | ❌ No | ✅ Yes | ❌ N/A | ❌ N/A | ✅ SAML | **HIDE** ❌ |
| **Device Authorization** | ⚠️ Special | ✅ Yes | ❌ No | ❌ No | ✅ Yes | **HIDE** ❌ |

**Reasoning:**
- No authorization request = no PKCE, no PAR, no response types
- Client auth is already configured in main credentials section
- Device flow uses device_authorization_endpoint (not authorization_endpoint)
- *Client auth methods are already shown in `ComprehensiveCredentialsService` main section

---

### 🤔 **SPECIAL CASES**

#### **Redirectless Flow (pi.flow)**
- **Has Authz Request?** ✅ Yes - POST to `/authorize` with `response_mode=pi.flow`
- **PAR Applicable?** ✅ Yes - still uses authorization endpoint, PAR can push params via API
- **Verdict:** **SHOW** - authorization flow using authz endpoint, PAR beneficial

---

## 🎯 Final Decision Matrix

### Enable `showAdvancedConfig={true}` for:
1. ✅ **OAuth Authorization Code** (`OAuthAuthorizationCodeFlowV6.tsx`)
2. ✅ **OIDC Authorization Code** (`OIDCAuthorizationCodeFlowV6.tsx`)
3. ✅ **OIDC Hybrid** (`OIDCHybridFlowV6.tsx`) - *Uses authorization endpoint, supports PAR/PKCE*
4. ✅ **PAR Flow (Old)** (`PingOnePARFlowV6.tsx`)
5. ✅ **PAR Flow (New)** (`PingOnePARFlowV6_New.tsx`)
6. ✅ **Redirectless Flow** (`RedirectlessFlowV6_Real.tsx`) - *Uses authorization endpoint*
7. ⚠️ **OAuth Implicit** (`OAuthImplicitFlowV6.tsx`) - *Optional, show with caveat*
8. ⚠️ **OIDC Implicit** (`OIDCImplicitFlowV6_Full.tsx`) - *Optional, show with caveat*

### Keep `showAdvancedConfig={false}` for:
1. ❌ **Client Credentials** (`ClientCredentialsFlowV6.tsx`)
2. ❌ **Device Authorization** (`DeviceAuthorizationFlowV6.tsx`, `OIDCDeviceAuthorizationFlowV6.tsx`)
3. ❌ **JWT Bearer** (`JWTBearerTokenFlowV6.tsx`)
4. ❌ **SAML Bearer** (`SAMLBearerAssertionFlowV6.tsx`)
5. ❌ **Redirectless** (`RedirectlessFlowV6_Real.tsx`)
6. ❌ **Resource Owner Password** (if we have one)
7. ❌ **Worker Token** (`WorkerTokenFlowV6.tsx`)

---

## 📚 Supporting RFC/Spec References

### PAR (RFC 9126) - Pushed Authorization Requests
**Compatible with:**
- ✅ Authorization Code Flow
- ✅ OIDC Authorization Code Flow
- ✅ OIDC Hybrid Flow
- ⚠️ Implicit Flow (less common, but technically possible)

**NOT compatible with:**
- ❌ Client Credentials (no authorization request)
- ❌ Device Authorization (uses device_authorization_endpoint)
- ❌ Direct token grants (ROPC, JWT Bearer, SAML Bearer)

**PingOne Status:** ⚠️ Limited (Enterprise feature)

### PKCE (RFC 7636) - Proof Key for Code Exchange
**Required for:**
- ✅ Public clients (SPAs, mobile apps)
- ✅ Authorization Code Flow
- ✅ OIDC Hybrid Flow

**NOT applicable to:**
- ❌ Flows without authorization codes
- ❌ Client Credentials
- ❌ Implicit (no code exchange)
- ❌ Direct token grants

### Response Types
**Relevant to:**
- ✅ Authorization Code (`code`)
- ✅ Implicit (`token`, `id_token`)
- ✅ Hybrid (`code token`, `code id_token`, `code token id_token`)

**NOT relevant to:**
- ❌ Token endpoint-only flows

---

## 🔧 Implementation Plan

### Phase 1: Re-enable for Core Authorization Flows
```typescript
// OAuth Authorization Code
showAdvancedConfig={true} // PAR, PKCE, Response Types applicable

// OIDC Authorization Code
showAdvancedConfig={true} // PAR, PKCE, Response Types applicable

// Hybrid Flow
showAdvancedConfig={true} // PAR, PKCE, Response Types applicable
```

### Phase 2: Re-enable for PAR-Specific Flows
```typescript
// PAR flows (obviously need it)
showAdvancedConfig={true} // Primary feature
```

### Phase 3: Evaluate Implicit Flows
```typescript
// Implicit flows - show with educational note about deprecation
showAdvancedConfig={true} // Response types config useful, but flow deprecated
```

### Keep Hidden: Direct Token Flows
```typescript
// Client Credentials, Device Auth, JWT/SAML Bearer, etc.
showAdvancedConfig={false} // No authorization request = not applicable
```

---

## 💡 User Experience Notes

### Why Show for Authorization Flows?
1. **PAR Configuration:** Users can enable Pushed Authorization Requests
2. **PKCE Enforcement:** Critical security setting for public clients
3. **Response Type Control:** Configure what the authz endpoint returns
4. **Client Auth Methods:** Token endpoint authentication configuration
5. **CORS Settings:** Necessary for browser-based flows

### Why Hide for Direct Token Flows?
1. **No Authorization Request:** Settings like PAR, PKCE, response types are irrelevant
2. **Client Auth Already Shown:** Main credentials section covers token endpoint auth
3. **Reduce Confusion:** Don't show settings that can't be used
4. **Cleaner UX:** Only relevant options visible

---

## ✅ Conclusion

**Show Advanced Settings for: Authorization Flows** (flows that redirect to PingOne's authorization endpoint)

**Hide Advanced Settings for: Token-Only Flows** (flows that only use the token endpoint)

This ensures users see PAR, PKCE enforcement, response types, and other authorization-related settings **only where they're applicable**.

---

**Date:** October 2025  
**Research Source:** RFC 9126 (PAR), RFC 7636 (PKCE), PingOne docs, OAuth 2.0 spec  
**Decision:** Selective enablement based on flow architecture

