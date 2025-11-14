# 🔐 Flow-Specific Environment Configuration

## 📋 **Complete Flow Environment Variables**

This document contains all flow-specific environment variables to ensure complete credential isolation between flows.

### **Instructions:**
1. Copy the relevant environment variables to your `.env` file
2. Replace the placeholder values with your actual PingOne credentials
3. Each flow will use its own dedicated environment variables

---

## 🔧 **Environment Variables by Flow**

### **1. PAR Flow V7**
```bash
# PAR Flow V7 - Pushed Authorization Requests
VITE_PAR_ENVIRONMENT_ID=your-environment-id
VITE_PAR_CLIENT_ID=your-client-id
VITE_PAR_CLIENT_SECRET=your-client-secret
VITE_PAR_REDIRECT_URI=https://localhost:3000/par-callback
VITE_PAR_API_URL=https://auth.pingone.com
```

### **2. OAuth Authorization Code Flow V7**
```bash
# OAuth Authorization Code Flow V7 - Standard OAuth 2.0
VITE_AUTHZ_V7_ENVIRONMENT_ID=your-environment-id
VITE_AUTHZ_V7_CLIENT_ID=your-client-id
VITE_AUTHZ_V7_CLIENT_SECRET=your-client-secret
VITE_AUTHZ_V7_REDIRECT_URI=https://localhost:3000/authz-callback
VITE_AUTHZ_V7_API_URL=https://auth.pingone.com
```

### **3. OAuth Authorization Code Flow V7_1**
```bash
# OAuth Authorization Code Flow V7_1 - Enhanced OAuth 2.0
VITE_AUTHZ_V7_1_ENVIRONMENT_ID=your-environment-id
VITE_AUTHZ_V7_1_CLIENT_ID=your-client-id
VITE_AUTHZ_V7_1_CLIENT_SECRET=your-client-secret
VITE_AUTHZ_V7_1_REDIRECT_URI=https://localhost:3000/authz-v7-1-callback
VITE_AUTHZ_V7_1_API_URL=https://auth.pingone.com
```


### **4. OIDC Hybrid Flow V7**
```bash
# OIDC Hybrid Flow V7 - OpenID Connect Hybrid
VITE_HYBRID_V7_ENVIRONMENT_ID=your-environment-id
VITE_HYBRID_V7_CLIENT_ID=your-client-id
VITE_HYBRID_V7_CLIENT_SECRET=your-client-secret
VITE_HYBRID_V7_REDIRECT_URI=https://localhost:3000/hybrid-callback
VITE_HYBRID_V7_API_URL=https://auth.pingone.com
```

### **5. Implicit Flow V7**
```bash
# Implicit Flow V7 - OAuth 2.0 Implicit Grant
VITE_IMPLICIT_V7_ENVIRONMENT_ID=your-environment-id
VITE_IMPLICIT_V7_CLIENT_ID=your-client-id
VITE_IMPLICIT_V7_CLIENT_SECRET=your-client-secret
VITE_IMPLICIT_V7_REDIRECT_URI=https://localhost:3000/implicit-callback
VITE_IMPLICIT_V7_API_URL=https://auth.pingone.com
```

### **6. Device Authorization Flow V7**
```bash
# Device Authorization Flow V7 - OAuth 2.0 Device Authorization Grant
VITE_DEVICE_V7_ENVIRONMENT_ID=your-environment-id
VITE_DEVICE_V7_CLIENT_ID=your-client-id
VITE_DEVICE_V7_CLIENT_SECRET=your-client-secret
VITE_DEVICE_V7_REDIRECT_URI=https://localhost:3000/device-callback
VITE_DEVICE_V7_API_URL=https://auth.pingone.com
```

### **7. Client Credentials Flow V7**
```bash
# Client Credentials Flow V7 - OAuth 2.0 Client Credentials Grant
VITE_CLIENT_CREDS_V7_ENVIRONMENT_ID=your-environment-id
VITE_CLIENT_CREDS_V7_CLIENT_ID=your-client-id
VITE_CLIENT_CREDS_V7_CLIENT_SECRET=your-client-secret
VITE_CLIENT_CREDS_V7_REDIRECT_URI=https://localhost:3000/client-creds-callback
VITE_CLIENT_CREDS_V7_API_URL=https://auth.pingone.com
```

### **8. CIBA Flow V7**
```bash
# CIBA Flow V7 - OpenID Connect CIBA
VITE_CIBA_V7_ENVIRONMENT_ID=your-environment-id
VITE_CIBA_V7_CLIENT_ID=your-client-id
VITE_CIBA_V7_CLIENT_SECRET=your-client-secret
VITE_CIBA_V7_REDIRECT_URI=https://localhost:3000/ciba-callback
VITE_CIBA_V7_API_URL=https://auth.pingone.com
```

### **9. Worker Token Flow V7**
```bash
# Worker Token Flow V7 - PingOne Worker Token
VITE_WORKER_V7_ENVIRONMENT_ID=your-environment-id
VITE_WORKER_V7_CLIENT_ID=your-client-id
VITE_WORKER_V7_CLIENT_SECRET=your-client-secret
VITE_WORKER_V7_REDIRECT_URI=https://localhost:3000/worker-callback
VITE_WORKER_V7_API_URL=https://auth.pingone.com
```

### **10. PingOne Complete MFA Flow V7**
```bash
# PingOne Complete MFA Flow V7 - Multi-Factor Authentication
VITE_MFA_V7_ENVIRONMENT_ID=your-environment-id
VITE_MFA_V7_CLIENT_ID=your-client-id
VITE_MFA_V7_CLIENT_SECRET=your-client-secret
VITE_MFA_V7_REDIRECT_URI=https://localhost:3000/mfa-callback
VITE_MFA_V7_API_URL=https://auth.pingone.com
```

### **11. RAR Flow V7**
```bash
# RAR Flow V7 - Rich Authorization Requests
VITE_RAR_V7_ENVIRONMENT_ID=your-environment-id
VITE_RAR_V7_CLIENT_ID=your-client-id
VITE_RAR_V7_CLIENT_SECRET=your-client-secret
VITE_RAR_V7_REDIRECT_URI=https://localhost:3000/rar-callback
VITE_RAR_V7_API_URL=https://auth.pingone.com
```

### **12. JWT Bearer Token Flow V7**
```bash
# JWT Bearer Token Flow V7 - JWT Bearer Token Grant
VITE_JWT_BEARER_V7_ENVIRONMENT_ID=your-environment-id
VITE_JWT_BEARER_V7_CLIENT_ID=your-client-id
VITE_JWT_BEARER_V7_CLIENT_SECRET=your-client-secret
VITE_JWT_BEARER_V7_REDIRECT_URI=https://localhost:3000/jwt-bearer-callback
VITE_JWT_BEARER_V7_API_URL=https://auth.pingone.com
```

### **13. SAML Bearer Assertion Flow V7**
```bash
# SAML Bearer Assertion Flow V7 - SAML Bearer Assertion Grant
VITE_SAML_BEARER_V7_ENVIRONMENT_ID=your-environment-id
VITE_SAML_BEARER_V7_CLIENT_ID=your-client-id
VITE_SAML_BEARER_V7_CLIENT_SECRET=your-client-secret
VITE_SAML_BEARER_V7_REDIRECT_URI=https://localhost:3000/saml-bearer-callback
VITE_SAML_BEARER_V7_API_URL=https://auth.pingone.com
```

### **14. Redirectless Flow V7**
```bash
# Redirectless Flow V7 - Direct Authentication
VITE_REDIRECTLESS_V7_ENVIRONMENT_ID=your-environment-id
VITE_REDIRECTLESS_V7_CLIENT_ID=your-client-id
VITE_REDIRECTLESS_V7_CLIENT_SECRET=your-client-secret
VITE_REDIRECTLESS_V7_REDIRECT_URI=https://localhost:3000/redirectless-callback
VITE_REDIRECTLESS_V7_API_URL=https://auth.pingone.com
```

### **15. OAuth ROPC Flow V7**
```bash
# OAuth ROPC Flow V7 - Resource Owner Password Credentials
VITE_ROPC_V7_ENVIRONMENT_ID=your-environment-id
VITE_ROPC_V7_CLIENT_ID=your-client-id
VITE_ROPC_V7_CLIENT_SECRET=your-client-secret
VITE_ROPC_V7_REDIRECT_URI=https://localhost:3000/ropc-callback
VITE_ROPC_V7_API_URL=https://auth.pingone.com
```

### **16. Token Exchange Flow V7**
```bash
# Token Exchange Flow V7 - Token Exchange
VITE_TOKEN_EXCHANGE_V7_ENVIRONMENT_ID=your-environment-id
VITE_TOKEN_EXCHANGE_V7_CLIENT_ID=your-client-id
VITE_TOKEN_EXCHANGE_V7_CLIENT_SECRET=your-client-secret
VITE_TOKEN_EXCHANGE_V7_REDIRECT_URI=https://localhost:3000/token-exchange-callback
VITE_TOKEN_EXCHANGE_V7_API_URL=https://auth.pingone.com
```

---

## 🎯 **Benefits of Flow-Specific Environment Variables**

### **1. Complete Isolation**
- Each flow has its own dedicated credentials
- No cross-flow credential contamination
- Independent flow operation

### **2. Enhanced Security**
- Flow-specific credentials prevent unauthorized access
- Isolated storage prevents data leakage
- Separate redirect URIs prevent callback conflicts

### **3. Improved Maintainability**
- Clear separation of concerns
- Easy to debug flow-specific issues
- Simplified credential management

### **4. Better User Experience**
- No credential conflicts between flows
- Independent flow state preservation
- Seamless flow switching

---

## 🚀 **Implementation Steps**

### **Step 1: Add Flow-Specific Variables**
Add the environment variables for the flows you want to use to your `.env` file.

### **Step 2: Update Flow Credential Loading**
Each flow should use the `flowCredentialLoader` utility:

```typescript
import { loadFlowCredentials } from '../utils/flowCredentialLoader';

const credentials = loadFlowCredentials({
  flowKey: 'pingone-par-flow-v7',
  fallbackToShared: false // Use only flow-specific credentials
});
```

### **Step 3: Test Flow Isolation**
1. Test each flow independently
2. Verify no credential conflicts
3. Test credential persistence and loading

---

## 📊 **Flow Environment Variable Summary**

| Flow Type | Environment Prefix | Flow Key | Redirect URI |
|-----------|-------------------|----------|--------------|
| PAR Flow V7 | `VITE_PAR_*` | `pingone-par-flow-v7` | `/par-callback` |
| Auth Code V7 | `VITE_AUTHZ_V7_*` | `oauth-authorization-code-v7` | `/authz-callback` |
| Auth Code V7_1 | `VITE_AUTHZ_V7_1_*` | `oauth-authorization-code-v7-1` | `/authz-v7-1-callback` |
| Hybrid V7 | `VITE_HYBRID_V7_*` | `oidc-hybrid-flow-v7` | `/hybrid-callback` |
| Implicit V7 | `VITE_IMPLICIT_V7_*` | `implicit-flow-v7` | `/implicit-callback` |
| Device V7 | `VITE_DEVICE_V7_*` | `device-authorization-v7` | `/device-callback` |
| Client Creds V7 | `VITE_CLIENT_CREDS_V7_*` | `client-credentials-v7` | `/client-creds-callback` |
| CIBA V7 | `VITE_CIBA_V7_*` | `ciba-v7` | `/ciba-callback` |
| Worker V7 | `VITE_WORKER_V7_*` | `worker-token-v7` | `/worker-callback` |
| MFA V7 | `VITE_MFA_V7_*` | `pingone-complete-mfa-v7` | `/mfa-callback` |
| RAR V7 | `VITE_RAR_V7_*` | `rar-v7` | `/rar-callback` |
| JWT Bearer V7 | `VITE_JWT_BEARER_V7_*` | `jwt-bearer-v7` | `/jwt-bearer-callback` |
| SAML Bearer V7 | `VITE_SAML_BEARER_V7_*` | `saml-bearer-v7` | `/saml-bearer-callback` |
| Redirectless V7 | `VITE_REDIRECTLESS_V7_*` | `redirectless-v7` | `/redirectless-callback` |
| ROPC V7 | `VITE_ROPC_V7_*` | `ropc-v7` | `/ropc-callback` |
| Token Exchange V7 | `VITE_TOKEN_EXCHANGE_V7_*` | `token-exchange-v7` | `/token-exchange-callback` |

---

## ✅ **Result**

With flow-specific environment variables, each flow operates completely independently with its own credentials, storage, and configuration. This eliminates all credential conflicts and ensures optimal security and maintainability.
