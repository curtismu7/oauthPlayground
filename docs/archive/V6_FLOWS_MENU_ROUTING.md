# V6 Flows - Menu Routing and Status

## ✅ Currently Active V6 Flows

### **Authorization Code Flows (AuthZ Flows)**

| Flow Name | Route | Component File | Menu Label | Status |
|-----------|-------|---------------|------------|--------|
| **OAuth Authorization Code** | `/flows/oauth-authorization-code-v5` | `OAuthAuthorizationCodeFlowV5.tsx` | "Authorization Code (V6) ✅" | ✅ Active, V6 Services |
| **OIDC Authorization Code** | `/flows/oidc-authorization-code-v5` | `OIDCAuthorizationCodeFlowV5.tsx` (uses `OIDCAuthorizationCodeFlowV5_New`) | "Authorization Code (V6) ✅" | ✅ Active, V6 Services |

### **Advanced Authorization Flows (AuthZ Flows)**

| Flow Name | Route | Component File | Menu Label | Status |
|-----------|-------|---------------|------------|--------|
| **PAR (Pushed Authorization Requests)** | `/flows/pingone-par-v6` | `PingOnePARFlowV6_New.tsx` | "PAR (V6) ✅" | ✅ Active, V6 Services |
| **RAR (Rich Authorization Requests)** | `/flows/rar-v6` | `RARFlowV6_New.tsx` | "RAR (V6) ✅" | ✅ Active, V6 Services |
| **Redirectless Flow (Real)** | `/flows/redirectless-v6-real` | `RedirectlessFlowV6_Real.tsx` | "Redirectless (V6) ✅" | ✅ Active, V6 Services |

### **Implicit Flows**

| Flow Name | Route | Component File | Menu Label | Status |
|-----------|-------|---------------|------------|--------|
| **OAuth Implicit** | `/flows/oauth-implicit-v5` | `OAuthImplicitFlowV5.tsx` | "Implicit Flow (V5)" | ✅ Active, V5 Services |
| **OIDC Implicit** | `/flows/oidc-implicit-v5` | `OIDCImplicitFlowV5.tsx` | "Implicit Flow (V5)" | ✅ Active, V5 Services |

---

## 📋 Complete V6 Flows List

### **1. OAuth Authorization Code V6**
- **Route**: `/flows/oauth-authorization-code-v5`
- **Component**: `OAuthAuthorizationCodeFlowV5.tsx`
- **Menu Section**: OAuth 2.0 Flows
- **Features**:
  - ✅ V6 Service Architecture (`AuthorizationCodeSharedService`)
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
  - ✅ OAuth-specific education (Authorization only, no ID tokens)
  - ✅ PKCE validation with session storage
  - ✅ 8-step flow

### **2. OIDC Authorization Code V6**
- **Route**: `/flows/oidc-authorization-code-v5`
- **Component**: `OIDCAuthorizationCodeFlowV5_New.tsx` (imported as `OIDCAuthorizationCodeFlowV5`)
- **Menu Section**: OpenID Connect Flows
- **Features**:
  - ✅ V6 Service Architecture (`AuthorizationCodeSharedService`)
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
  - ✅ OIDC-specific education (Authentication + Authorization, ID tokens)
  - ✅ PKCE validation with session storage
  - ✅ 8-step flow with ID token and UserInfo

### **3. PAR (Pushed Authorization Requests) V6**
- **Route**: `/flows/pingone-par-v6`
- **Component**: `PingOnePARFlowV6_New.tsx`
- **Menu Section**: PingOne Features
- **Features**:
  - ✅ V6 Service Architecture (`AuthorizationCodeSharedService`)
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
  - ✅ PAR-specific education (Enhanced security via back-channel)
  - ✅ PAR configuration support
  - ✅ 8-step flow with PAR endpoint

### **4. RAR (Rich Authorization Requests) V6**
- **Route**: `/flows/rar-v6`
- **Component**: `RARFlowV6_New.tsx`
- **Menu Section**: Experimental Features
- **Features**:
  - ✅ V6 Service Architecture (`AuthorizationCodeSharedService`)
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
  - ✅ RAR-specific education (Fine-grained authorization)
  - ✅ JSON authorization_details support
  - ✅ 8-step flow with structured permissions

### **5. Redirectless Flow V6 (Real)**
- **Route**: `/flows/redirectless-v6-real`
- **Component**: `RedirectlessFlowV6_Real.tsx`
- **Menu Section**: PingOne Features
- **Features**:
  - ✅ V6 Service Architecture (`AuthorizationCodeSharedService`)
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
  - ✅ Redirectless-specific education (`response_mode=pi.flow`)
  - ✅ API-driven authentication without browser redirects
  - ✅ 8-step flow with `pi.flow` mode

---

## 🎯 Menu Configuration Status

### Current Sidebar Menu Structure:

```
├── 🏠 Dashboard
├── 📚 OAuth 2.0 Flows
│   ├── 🔐 Authorization Code (V6) ✅ → /flows/oauth-authorization-code-v5
│   └── 💡 Implicit Flow (V5) → /flows/oauth-implicit-v5
├── 🔑 OpenID Connect Flows
│   ├── 🔐 Authorization Code (V6) ✅ → /flows/oidc-authorization-code-v5
│   └── 💡 Implicit Flow (V5) → /flows/oidc-implicit-v5
├── 🚀 PingOne Features
│   ├── 🔐 PAR (V6) ✅ → /flows/pingone-par-v6
│   └── 📱 Redirectless (V6) ✅ → /flows/redirectless-v6-real
├── 🧪 Experimental Features
│   └── 👁️ RAR (V6) ✅ → /flows/rar-v6
└── 📖 Legacy Flows
    └── 📱 Redirectless Flow V5 (Educational) → /flows/redirectless-flow-mock
```

---

## ✅ Routing Verification

All V6 flows are properly routed in `App.tsx`:

```typescript
// OAuth/OIDC Authorization Code Flows
<Route path="/flows/oauth-authorization-code-v5" element={<OAuthAuthorizationCodeFlowV5 />} />
<Route path="/flows/oidc-authorization-code-v5" element={<OIDCAuthorizationCodeFlowV5 />} />

// Advanced Authorization Flows
<Route path="/flows/pingone-par-v6" element={<PingOnePARFlowV6 />} />
<Route path="/flows/pingone-par-v5" element={<PingOnePARFlowV6 />} /> {/* V5 redirect to V6 */}

<Route path="/flows/rar-v6" element={<RARFlowV6 />} />
<Route path="/flows/rar-v5" element={<RARFlowV6 />} /> {/* V5 redirect to V6 */}

<Route path="/flows/redirectless-v6-real" element={<RedirectlessFlowV6Real />} />
<Route path="/flows/redirectless-flow-v5" element={<RedirectlessFlowV6Real />} /> {/* V5 redirect to V6 */}
```

---

## 🔧 Import Status - All Fixed ✅

All V6 flows have been verified and fixed for common import errors:

- ✅ **`FlowConfigurationRequirements`** - All use default import
- ✅ **`ComprehensiveCredentialsService`** - All use default import
- ✅ **Toast System** - All use `v4ToastManager` (no `react-toastify`)
- ✅ **Collapsible Components** - All define locally or use correct service imports
- ✅ **No Linter Errors** - All flows pass linting

---

## 🎨 V6 Service Architecture Features

All V6 flows use the following shared services:

1. **`AuthorizationCodeSharedService`** - Core flow logic
   - Step restoration
   - Collapsible sections management
   - PKCE generation
   - Authorization URL generation
   - Token management navigation
   - Response type enforcement
   - Credentials synchronization

2. **`ComprehensiveCredentialsService`** - Unified credentials UI
   - Discovery input
   - Credentials input (Client ID, Secret, Redirect URI)
   - PingOne Application Config (all advanced settings)

3. **`ConfigurationSummaryService`** - Configuration summary card
   - Collapsible summary of all settings
   - JSON export/import
   - Copy functionality for each field

4. **`v4ToastManager`** - Toast notifications
   - Success/error/warning messages
   - Consistent UX across all flows

---

## 📝 Notes

- **V5 Routes with V6 Implementation**: OAuth and OIDC Authorization Code flows use V5 routes (`-v5`) but have V6 service architecture. This is intentional to maintain backward compatibility.
- **V5 to V6 Redirects**: PAR, RAR, and Redirectless flows have explicit V5 → V6 route redirects in `App.tsx`.
- **Menu Labels**: All V6 flows display "V6" in the menu with a green checkmark (✅).
- **AuthZ Flows Tag**: All authorization code-based flows (OAuth AuthZ, OIDC AuthZ, PAR, RAR, Redirectless) are tagged as "authz flows" via `AuthZFlowsService`.

---

## 🧪 Testing V6 Flows

To test each V6 flow:

1. Navigate to the sidebar menu
2. Click on any flow labeled with "(V6) ✅"
3. Verify the page loads without errors
4. Check browser console for any import/runtime errors
5. Test the flow functionality (PKCE, Auth URL, Token Exchange)

All V6 flows should load and function correctly with the latest fixes applied.

