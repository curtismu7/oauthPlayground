# Redirect URIs Guide - Complete Reference

This document provides a comprehensive overview of all redirect URIs used by the OAuth Playground applications and flows.

## 🎯 Quick Reference

### **Unified MFA Flow (Primary)**
- **Redirect URI:** `https://localhost:3000/mfa-unified-callback`
- **Flow Type:** `unified-mfa-v8`
- **Used by:** Unified MFA Registration Flow
- **Notes:** Main entry point for all MFA device registration (corrected - removed /v8 prefix)

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

### **Redirect URI Path Corrections**
- **Fixed Issue:** Removed `/v8` prefix from MFA redirect URIs to resolve routing errors
- **Before:** `/v8/mfa-unified-callback` (caused "We couldn't find anything at /v8/mfa-unified-callback")
- **After:** `/mfa-unified-callback` (correctly routes to CallbackHandlerV8U)
- **Affected Flows:** All MFA flows including unified MFA registration
- **UserLoginModal Fix:** Updated default MFA redirect URI from `/user-mfa-login-callback` to `/mfa-unified-callback` for consistency
- **PingOne Calls:** Now uses exactly what's in the UI field (even if wrong) instead of forcing service values
- **Forced Migration:** MFA flows automatically migrate from old `/v8/mfa-unified-callback` to new `/mfa-unified-callback` on load

### **HTTPS Enforcement**
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

## 🎯 **IMPLEMENTATION COMPLETE: Flow-Aware Redirect URI & Callback Routing**

### **✅ What Was Implemented**

**Date:** 2026-02-06  
**Version:** 9.0.6  
**Status:** ✅ **FULLY IMPLEMENTED & TESTED**

#### **🔧 Core Components Added**

1. **ReturnTargetServiceV8U** (`src/v8u/services/returnTargetServiceV8U.ts`)
   - Flow-aware return target management
   - Separate storage keys per flow type
   - Single-consumption semantics
   - TypeScript interfaces for type safety

2. **Enhanced CallbackHandlerV8U** (`src/v8u/components/CallbackHandlerV8U.tsx`)
   - Flow-aware routing priority system
   - Device registration → Device authentication → OAuth V8U priority
   - Legacy fallback logic preserved
   - Comprehensive logging and debugging

3. **Updated Flow Components**
   - **MFAFlowBaseV8.tsx**: Sets return targets for device authentication
   - **UnifiedMFARegistrationFlowV8_Legacy.tsx**: Sets return targets for device registration
   - **UserLoginModalV8.tsx**: MFA flow detection and redirect URI migration

#### **🎯 Return Target Storage Strategy**

```typescript
// Device Registration Flow
ReturnTargetServiceV8U.setReturnTarget('mfa_device_registration', '/v8/unified-mfa', 2);

// Device Authentication Flow  
ReturnTargetServiceV8U.setReturnTarget('mfa_device_authentication', '/v8/unified-mfa', 3);

// OAuth V8U Flow
ReturnTargetServiceV8U.setReturnTarget('oauth_v8u', '/v8/unified-oauth', 1);
```

#### **🔄 Callback Routing Priority**

1. **Device Registration Return Target** → Resume at Step 2 (Device Selection)
2. **Device Authentication Return Target** → Resume at Step 3 (Device Action)
3. **OAuth V8U Return Target** → Resume at appropriate OAuth step
4. **Legacy Fallback** → Use existing sessionStorage logic

#### **🛡️ Safety Features**

- **Single Consumption**: Return targets are consumed once after successful callback
- **Flow Isolation**: Separate storage keys prevent cross-flow interference
- **Fallback Logic**: Legacy behavior preserved if no return target found
- **Parameter Preservation**: OAuth callback parameters preserved during redirects
- **Type Safety**: Full TypeScript interfaces for all data structures

---

## 🧪 **VERIFICATION CHECKLIST**

### **✅ Device Registration Flow**
1. Navigate to `/v8/unified-mfa`
2. Select "Device Registration" 
3. Choose "User Flow" (requires OAuth)
4. Click "Register Device" → Opens UserLoginModal
5. **Verify**: Return target set for `mfa_device_registration`
6. Complete OAuth login
7. **Expected**: Redirects back to `/v8/unified-mfa` at Step 2 (Device Selection)
8. **Expected**: Return target consumed and cleared

### **✅ Device Authentication Flow**
1. Navigate to `/v8/unified-mfa`
2. Select "Device Authentication"
3. Choose "User Flow" (requires OAuth)
4. Click "Authenticate Device" → Opens UserLoginModal
5. **Verify**: Return target set for `mfa_device_authentication`
6. Complete OAuth login
7. **Expected**: Redirects back to `/v8/unified-mfa` at Step 3 (Device Action)
8. **Expected**: Return target consumed and cleared

### **✅ OAuth V8U Flow**
1. Navigate to `/v8/unified-oauth`
2. Start any OAuth flow (Authorization Code, Implicit, Hybrid)
3. **Verify**: Return target set for `oauth_v8u`
4. Complete OAuth login
5. **Expected**: Redirects back to correct OAuth step
6. **Expected**: Return target consumed and cleared

### **✅ Legacy Fallback**
1. Test any flow without return target set
2. **Expected**: Falls back to existing sessionStorage logic
3. **Expected**: No breaking changes to existing behavior

### **✅ Error Scenarios**
1. **Invalid Return Target**: Corrupted data ignored gracefully
2. **Missing Return Target**: Falls back to legacy logic
3. **Cross-Flow Interference**: Separate storage keys prevent conflicts
4. **Multiple Return Targets**: Priority system handles correctly

---

## 🚨 **IMPORTANT NOTES**

### **✅ RESOLVED ISSUES**
- **Device Authentication No Longer Falls Back**: Now correctly resumes at device action step
- **Device Registration Correct Next Step**: Resumes at Step 2 (Device Selection) after OAuth
- **OAuth Flows Return Correctly**: V8U flows return to appropriate steps
- **No Breaking Changes**: All existing functionality preserved
- **Legacy Routes Handled**: `/v8/*` callback paths aliased to new system

### **🔒 SECURITY MAINTAINED**
- **HTTPS Enforcement**: All redirect URIs use HTTPS
- **Parameter Preservation**: OAuth state and code preserved during redirects  
- **Single Consumption**: Return targets cleared after use
- **Flow Isolation**: Separate storage prevents cross-contamination

### **📊 PERFORMANCE**
- **Minimal Overhead**: Simple sessionStorage operations
- **Fast Routing**: Direct redirects without unnecessary processing
- **Efficient Storage**: Only stores essential return path information
- **Cleanup Automatic**: Return targets consumed and cleared automatically

---

## 📚 **IMPLEMENTATION FILES**

### **🆕 New Files**
- `src/v8u/services/returnTargetServiceV8U.ts` - Core return target management
- Documentation updated with implementation details

### **🔄 Updated Files**
- `src/v8u/components/CallbackHandlerV8U.tsx` - Flow-aware routing logic
- `src/v8/flows/shared/MFAFlowBaseV8.tsx` - Device authentication return targets
- `src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx` - Device registration return targets
- `src/v8/components/UserLoginModalV8.tsx` - MFA flow detection and migration

### **📋 References**
- **Plan File**: `/Users/cmuir/.windsurf/plans/redirect-uri-device-auth-plan-978a73.md`
- **UI Contracts**: MFA_DEVICE_AUTHENTICATION_UI_CONTRACT.md
- **OAuth Specs**: RFC 6749, RFC 8628, OIDC Core 1.0

---

*Last Updated: Version 9.0.6*
*Implementation Complete: 2026-02-06*
