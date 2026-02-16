# Redirect URIs Guide - V8+ Current Reference

This document provides a comprehensive overview of all redirect URIs used by the OAuth Playground V8+ applications and flows.

## 🎯 Quick Reference

### **Unified MFA Flow (V8 Primary)**
- **Redirect URI:** `https://localhost:3000/v8/unified-mfa-callback`
- **Flow Type:** `unified-mfa-v8`
- **Used by:** Unified MFA Registration Flow
- **Notes:** Main entry point for all MFA device registration

### **V8U Unified OAuth Flow (V8+ Unified)**
- **Redirect URI:** `https://localhost:3000/unified-callback`
- **Flow Types:** `oauth-authz-v8u`, `implicit-v8u`, `hybrid-v8u`
- **Used by:** V8U Unified OAuth flows
- **Notes:** Unified callback for all V8U OAuth flows

---

## 📋 V8+ Redirect URI Mapping

### **V8 Unified MFA Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `unified-mfa-v8` | `https://localhost:3000/v8/unified-mfa-callback` | **V8 Unified MFA Registration Flow** | PingOne MFA API |
| `mfa-hub-v8` | `https://localhost:3000/mfa-hub-callback` | V8 MFA Hub Flow | PingOne MFA API |

### **V8U Unified OAuth Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `oauth-authz-v8u` | `https://localhost:3000/unified-callback` | V8U Authorization Code Flow | RFC 6749, Section 4.1 |
| `implicit-v8u` | `https://localhost:3000/unified-callback` | V8U Implicit Flow | RFC 6749, Section 4.2 |
| `hybrid-v8u` | `https://localhost:3000/unified-callback` | V8U Hybrid Flow | OIDC Core 1.0, Section 3.3 |

### **V8+ Device Authorization Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `device-code-v8u` | `https://localhost:3000/device-code-status` | V8U Device Code Flow | RFC 8628 |

### **V8+ Client Credentials & Worker Token Flows**

| Flow Type | Redirect URI | Description | Specification |
|-----------|-------------|-------------|--------------|
| `client-credentials-v8u` | `https://localhost:3000/client-credentials-callback` | V8U Client Credentials Flow | RFC 6749, Section 4.4 |
| `worker-token` | `https://localhost:3000/worker-token-callback` | PingOne Worker Token (Management API) | PingOne Management API |

### **User Login Callbacks (V8+)**

| Flow Type | Redirect URI | Description | Notes |
|-----------|-------------|-------------|-------|
| User Login | `https://localhost:3000/user-login-callback` | Generic user login callback | Used by MFA flows |
| User MFA Login | `https://localhost:3000/user-mfa-login-callback` | MFA-specific user login callback | Used by MFA flows |

### **Legacy Callback Routes (Backward Compatibility)**

| Flow Type | Redirect URI | Description | Status |
|-----------|-------------|-------------|--------|
| Legacy Unified MFA | `https://localhost:3000/mfa-unified-callback` | Legacy unified MFA callback | **Deprecated** - Use `/v8/unified-mfa-callback` |
| Legacy MFA Unified | `https://localhost:3000/v8/mfa-unified-callback` | Legacy MFA unified callback | **Removed** |

---

## 🔧 V8+ Redirect URI Generation

### **Base URL Construction**
```typescript
const baseUrl = window.location.origin; // https://localhost:3000
const callbackPath = 'v8/unified-mfa-callback'; // V8 MFA
const redirectUri = `${baseUrl}/${callbackPath}`;
```

### **HTTPS Enforcement**
All redirect URIs are automatically converted to HTTPS for security:
```typescript
const protocol = window.location.hostname === 'localhost' ? 'https' : 'https';
```

### **V8+ Flow-Specific Services**
- **MFA Flows:** `MFARedirectUriServiceV8.getRedirectUri('unified-mfa-v8')`
- **V8U OAuth Flows:** `generateRedirectUriForFlow('oauth-authz-v8u')`
- **Callback Service:** `CallbackHandlerV8U` handles all V8+ callbacks

---

## 🚨 V8+ Important Notes

### **Current V8+ Redirect URI Standards**
- **V8 Unified MFA:** `/v8/unified-mfa-callback` (primary)
- **V8U Unified OAuth:** `/unified-callback` (unified V8U flows)
- **Legacy Migration:** Automatic migration from old paths to new V8+ paths

### **HTTPS Enforcement**
- **All redirect URIs must use HTTPS**
- **HTTP is automatically converted to HTTPS**
- **Required for PingOne security policies**

### **V8 Unified MFA Flow**
- **Primary redirect URI:** `https://localhost:3000/v8/unified-mfa-callback`
- **Route:** `/v8/unified-mfa` (main entry point)
- **Callback handling:** Automatically redirects back to `/v8/unified-mfa`

### **V8U Unified OAuth Flow**
- **Primary redirect URI:** `https://localhost:3000/unified-callback`
- **Routes:** `/v8/unified-oauth` (main entry point)
- **Callback handling:** Returns to appropriate V8U OAuth step

### **PingOne Configuration**
When configuring PingOne applications for V8+, use the **full HTTPS redirect URI**:
```
# For V8 Unified MFA
https://localhost:3000/v8/unified-mfa-callback

# For V8U Unified OAuth
https://localhost:3000/unified-callback
```

---

## 🛠️ V8+ Troubleshooting

### **Common V8+ Issues**

1. **Wrong Redirect URI in PingOne**
   - V8 MFA: Ensure `https://localhost:3000/v8/unified-mfa-callback`
   - V8U OAuth: Ensure `https://localhost:3000/unified-callback`
   - No trailing slashes unless specified
   - Must use HTTPS

2. **V8+ Callback Not Working**
   - Check if redirect URI matches V8+ patterns exactly
   - Verify HTTPS enforcement
   - Check browser console for V8+ specific errors

3. **Stuck on V8+ Callback Page**
   - Verify CallbackHandlerV8U is processing the V8+ path
   - Check for V8+ routing conflicts
   - Ensure proper V8+ flow detection

### **V8+ Debug Information**

Use the **User Login Modal Debug Section** to see:
- Full V8+ authorization URL with all parameters
- V8+ request headers and body
- Exact V8+ redirect URI being used

---

## 📚 V8+ References

- **RFC 6749:** OAuth 2.0 Authorization Framework
- **OIDC Core 1.0:** OpenID Connect Core
- **RFC 8628:** OAuth 2.0 Device Authorization Grant
- **PingOne MFA API:** PingOne Multi-Factor Authentication
- **V8+ Architecture:** Unified V8 and V8U flow implementations

---

## 🎯 **V8+ IMPLEMENTATION STATUS**

### **✅ Current V8+ Implementation**

**Version:** 9.0.4+  
**Status:** ✅ **FULLY IMPLEMENTED & CURRENT**

#### **🔧 Core V8+ Components**

1. **V8 Unified MFA Service** (`src/v8/services/mfaRedirectUriServiceV8.ts`)
   - V8-specific redirect URI management
   - Flow-aware V8 redirect URI generation
   - V8 MFA flow detection and handling

2. **V8U Unified Flow Service** (`src/utils/flowRedirectUriMapping.ts`)
   - V8U unified redirect URI mapping
   - Single callback for all V8U OAuth flows
   - TypeScript interfaces for V8+ type safety

3. **Enhanced CallbackHandlerV8U** (`src/v8u/components/CallbackHandlerV8U.tsx`)
   - V8+ flow-aware routing priority system
   - V8 and V8U callback handling
   - Legacy V8+ fallback logic preserved

#### **🎯 V8+ Redirect URI Strategy**

```typescript
// V8 Unified MFA Flow
MFARedirectUriServiceV8.getRedirectUri('unified-mfa-v8')
// Returns: https://localhost:3000/v8/unified-mfa-callback

// V8U Unified OAuth Flow
generateRedirectUriForFlow('oauth-authz-v8u')
// Returns: https://localhost:3000/unified-callback
```

#### **🔄 V8+ Callback Routing Priority**

1. **V8 Unified MFA Callback** → `/v8/unified-mfa-callback`
2. **V8U Unified OAuth Callback** → `/unified-callback`
3. **Legacy V8+ Fallback** → Use existing V8+ logic
4. **User Login Callbacks** → Handle MFA-specific user authentication

#### **🛡️ V8+ Safety Features**

- **V8+ Flow Isolation**: Separate storage keys prevent cross-flow interference
- **V8+ Parameter Preservation**: OAuth callback parameters preserved during redirects
- **V8+ Type Safety**: Full TypeScript interfaces for all V8+ data structures
- **V8+ Legacy Support**: Backward compatibility maintained for V7 migration

---

## 🧪 **V8+ VERIFICATION CHECKLIST**

### **✅ V8 Unified MFA Flow**
1. Navigate to `/v8/unified-mfa`
2. Select "Device Registration" 
3. Choose "User Flow" (requires OAuth)
4. Click "Register Device" → Opens UserLoginModal
5. **Verify**: V8 redirect URI is `https://localhost:3000/v8/unified-mfa-callback`
6. Complete OAuth login
7. **Expected**: Redirects back to `/v8/unified-mfa` at Step 2 (Device Selection)

### **✅ V8U Unified OAuth Flow**
1. Navigate to `/v8/unified-oauth`
2. Start any OAuth flow (Authorization Code, Implicit, Hybrid)
3. **Verify**: V8U redirect URI is `https://localhost:3000/unified-callback`
4. Complete OAuth login
5. **Expected**: Redirects back to correct V8U OAuth step

### **✅ Legacy V8+ Fallback**
1. Test any V8+ flow with legacy redirect URI
2. **Expected**: Automatic migration to V8+ patterns
3. **Expected**: No breaking changes to existing V8+ behavior

---

## 🚨 **V8+ IMPLEMENTATION NOTES**

### **✅ V8+ RESOLVED ISSUES**
- **V8 Unified MFA Correct URI**: Uses `/v8/unified-mfa-callback` (not `/mfa-unified-callback`)
- **V8U Unified OAuth**: Single `/unified-callback` for all V8U flows
- **V8+ Flow Detection**: Proper V8 vs V8U flow identification
- **No Breaking Changes**: All V7+ functionality preserved in V8+
- **V8+ Legacy Routes**: `/v8/*` callback paths handled by new V8+ system

### **🔒 V8+ SECURITY MAINTAINED**
- **HTTPS Enforcement**: All V8+ redirect URIs use HTTPS
- **V8+ Parameter Preservation**: OAuth state and code preserved during redirects  
- **V8+ Flow Isolation**: Separate storage prevents cross-contamination
- **V8+ Single Consumption**: Return targets cleared after use

### **📊 V8+ PERFORMANCE**
- **Minimal Overhead**: Simple V8+ sessionStorage operations
- **Fast Routing**: Direct V8+ redirects without unnecessary processing
- **Efficient Storage**: Only stores essential V8+ return path information
- **Cleanup Automatic**: V8+ return targets consumed and cleared automatically

---

## 📚 **V8+ IMPLEMENTATION FILES**

### **🔄 Current V8+ Files**
- `src/v8/services/mfaRedirectUriServiceV8.ts` - V8 MFA redirect URI service
- `src/utils/flowRedirectUriMapping.ts` - V8+ flow redirect URI mapping
- `src/v8u/components/CallbackHandlerV8U.tsx` - V8+ callback handler
- `src/v8/flows/shared/MFAFlowBaseV8.tsx` - V8 MFA flow base
- `src/v8/components/UserLoginModalV8.tsx` - V8 user login modal

### **📋 V8+ References**
- **V8+ Architecture**: Unified V8 and V8U flow implementations
- **OAuth Specs**: RFC 6749, RFC 8628, OIDC Core 1.0
- **PingOne MFA**: Current V8+ MFA integration

---

*Last Updated: Version 9.0.4+*
*V8+ Implementation: Current and Active*
