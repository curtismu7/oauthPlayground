# Redirect URIs Guide - Complete Reference

This document provides a comprehensive overview of all redirect URIs used by the OAuth Playground applications and flows.

## 🎯 Quick Reference

### **Unified MFA Flow (Primary)**
- **Redirect URI:** `https://localhost:3000/mfa-unified-callback`
- **Flow Type:** `unified-mfa-v8`
- **Used by:** Unified MFA Registration Flow
- **Notes:** Main entry point for all MFA device registration

---

## 📋 Complete Redirect URI Mapping

### **OAuth 2.0 Authorization Code Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `oauth-authorization-code-v6` | `https://localhost:3000/authz-callback` | OAuth 2.0 Authorization Code Flow with PKCE | RFC 6749, Section 4.1 |
| `oauth-authorization-code-v5` | `https://localhost:3000/authz-callback` | OAuth 2.0 Authorization Code Flow with PKCE (V5) | RFC 6749, Section 4.1 |
| `authorization-code-v3` | `https://localhost:3000/authz-callback` | Authorization Code Flow (V3) | RFC 6749, Section 4.1 |

### **OpenID Connect Authorization Code Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `oidc-authorization-code-v6` | `https://localhost:3000/authz-callback` | OpenID Connect Authorization Code Flow | OIDC Core 1.0, Section 3.1.2 |
| `oidc-authorization-code-v5` | `https://localhost:3000/authz-callback` | OpenID Connect Authorization Code Flow (V5) | OIDC Core 1.0, Section 3.1.2 |

### **OAuth 2.0 Implicit Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `oauth-implicit-v6` | `https://localhost:3000/oauth-implicit-callback` | OAuth 2.0 Implicit Grant Flow | RFC 6749, Section 4.2 |
| `oauth-implicit-v5` | `https://localhost:3000/oauth-implicit-callback` | OAuth 2.0 Implicit Grant Flow (V5) | RFC 6749, Section 4.2 |
| `implicit-v3` | `https://localhost:3000/implicit-callback` | Implicit Flow (V3) | RFC 6749, Section 4.2 |

### **OpenID Connect Implicit Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `oidc-implicit-v6` | `https://localhost:3000/oidc-implicit-callback` | OpenID Connect Implicit Flow | OIDC Core 1.0, Section 3.2.2 |
| `oidc-implicit-v5` | `https://localhost:3000/oidc-implicit-callback` | OpenID Connect Implicit Flow (V5) | OIDC Core 1.0, Section 3.2.2 |

### **OpenID Connect Hybrid Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `oidc-hybrid-v6` | `https://localhost:3000/hybrid-callback` | OpenID Connect Hybrid Flow | OIDC Core 1.0, Section 3.3 |
| `oidc-hybrid-v5` | `https://localhost:3000/hybrid-callback` | OpenID Connect Hybrid Flow (V5) | OIDC Core 1.0, Section 3.3 |
| `hybrid-v3` | `https://localhost:3000/hybrid-callback` | Hybrid Flow (V3) | OIDC Core 1.0, Section 3.3 |

### **Unified Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `implicit-v7` | `https://localhost:3000/implicit-callback` | Unified OAuth/OIDC Implicit Flow V7 | RFC 6744, Section 4.2 / OIDC Core 1.0, Section 3.2.2 |

### **V8U Unified Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `oauth-authz-v8u` | `https://localhost:3000/unified-callback` | V8U Authorization Code Flow | RFC 6749, Section 4.1 |
| `implicit-v8u` | `https://localhost:3000/unified-callback` | V8U Implicit Flow | RFC 6749, Section 4.2 |
| `hybrid-v8u` | `https://localhost:3000/unified-callback` | V8U Hybrid Flow | OIDC Core 1.0, Section 3.3 |

### **MFA Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `unified-mfa-v8` | `https://localhost:3000/mfa-unified-callback` | **V8 Unified MFA Registration Flow** | PingOne MFA API |
| `mfa-hub-v8` | `https://localhost:3000/mfa-hub-callback` | V8 MFA Hub Flow | PingOne MFA API |

### **Device Authorization Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `device-authorization-v6` | `https://localhost:3000/device-callback` | OAuth 2.0 Device Authorization Grant | RFC 8628, Section 3.4 |
| `oidc-device-authorization-v6` | `https://localhost:3000/device-callback` | OpenID Connect Device Authorization Grant | OIDC Device Flow 1.0 |
| `device-code-v8u` | `https://localhost:3000/device-code-status` | V8U Device Code Flow | RFC 8628 |

### **PingOne-Specific Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `pingone-par-v6` | `https://localhost:3000/authz-callback` | PingOne Pushed Authorization Requests | RFC 9126 (PAR) |
| `pingone-par-v6-new` | `https://localhost:3000/authz-callback` | PingOne Pushed Authorization Requests (New) | RFC 9126 (PAR) |
| `rar-v6` | `https://localhost:3000/authz-callback` | Rich Authorization Requests | RFC 9396 (RAR) |

### **Client Credentials & Worker Token Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `client-credentials-v6` | `N/A` | OAuth 2.0 Client Credentials Grant | RFC 6749, Section 4.4 |
| `client-credentials` | `https://localhost:3000/client-credentials-callback` | OAuth 2.0 Client Credentials Grant | RFC 6749, Section 4.4 |
| `client-credentials-v8u` | `https://localhost:3000/client-credentials-callback` | V8U Client Credentials Flow | RFC 6749, Section 4.4 |
| `worker-token` | `https://localhost:3000/worker-token-callback` | PingOne Worker Token (Management API) | PingOne Management API |

### **User Login Callbacks**

| Flow Type | Redirect URI | Description | Notes |
|-----------|-------------|-------------|-------|
| User Login | `https://localhost:3000/user-login-callback` | Generic user login callback | Used by MFA flows |
| User MFA Login | `https://localhost:3000/user-mfa-login-callback` | MFA-specific user login callback | Used by MFA flows |

### **Legacy Callback Routes (Backward Compatibility)**

| Flow Type | Redirect URI | Description | Status |
|-----------|-------------|-------------|--------|
| Legacy Unified MFA | `https://localhost:3000/v8/unified-mfa-callback` | Legacy unified MFA callback | **Deprecated** |
| Legacy MFA Unified | `https://localhost:3000/v8/mfa-unified-callback` | Legacy MFA unified callback | **Removed** |

---

## 🔧 How Redirect URIs Are Generated

### **Base URL Construction**
```typescript
const baseUrl = window.location.origin; // https://localhost:3000
const callbackPath = 'mfa-unified-callback';
const redirectUri = `${baseUrl}/${callbackPath}`;
```

### **HTTPS Enforcement**
All redirect URIs are automatically converted to HTTPS for security:
```typescript
const protocol = window.location.hostname === 'localhost' ? 'https' : 'https';
```

### **Flow-Specific Services**
- **MFA Flows:** `MFARedirectUriServiceV8.getRedirectUri()`
- **OAuth Flows:** `generateRedirectUriForFlow()`
- **Callback Service:** `CallbackUriService.getCallbackUri()`

---

## 🚨 Important Notes

### **HTTPS Requirement**
- **All redirect URIs must use HTTPS**
- **HTTP is automatically converted to HTTPS**
- **Required for PingOne security policies**

### **Unified MFA Flow**
- **Primary redirect URI:** `https://localhost:3000/mfa-unified-callback`
- **Route:** `/v8/unified-mfa` (main entry point)
- **Callback handling:** Automatically redirects back to `/v8/unified-mfa`

### **Legacy Routes**
- **Removed:** `/v8/mfa-unified-callback` (consolidated)
- **Kept:** `/v8/unified-mfa-callback` (backward compatibility)

### **PingOne Configuration**
When configuring PingOne applications, use the **full HTTPS redirect URI**:
```
https://localhost:3000/mfa-unified-callback
```

---

## 🛠️ Troubleshooting

### **Common Issues**

1. **Wrong Redirect URI in PingOne**
   - Ensure exact match: `https://localhost:3000/mfa-unified-callback`
   - No trailing slashes unless specified
   - Must use HTTPS

2. **Callback Not Working**
   - Check if redirect URI matches exactly
   - Verify HTTPS enforcement
   - Check browser console for errors

3. **Stuck on Callback Page**
   - Verify callback handler is processing the path
   - Check for routing conflicts
   - Ensure proper flow detection

### **Debug Information**

Use the **User Login Modal Debug Section** to see:
- Full authorization URL with all parameters
- Request headers and body
- Exact redirect URI being used

---

## 📚 References

- **RFC 6749:** OAuth 2.0 Authorization Framework
- **OIDC Core 1.0:** OpenID Connect Core
- **RFC 8628:** OAuth 2.0 Device Authorization Grant
- **RFC 9126:** OAuth 2.0 Pushed Authorization Requests
- **RFC 9396:** OAuth 2.0 Rich Authorization Requests
- **PingOne MFA API:** PingOne Multi-Factor Authentication

---

*Last Updated: Version 9.3.0*
*Generated: 2026-02-06*
