# V7 to V9 Migration Mapping - Side Menu Apps

## 📋 Overview
This document provides a complete mapping of V7 flows accessible in the side menu that need to be upgraded to V9, including their services, dependencies, and migration requirements.

---

## 🎯 V7 Flows in Side Menu

### 1. **JWT Bearer Token Flow V7**
**Route**: `/flows/jwt-bearer-token-v7`
**File**: `src/pages/flows/JWTBearerTokenFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `comprehensiveFlowDataService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowCompletionService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `ModalPresentationService`
  - `OAuthFlowComparisonService`
  - `oidcDiscoveryService`
  - `UnifiedTokenDisplayService`

- **Hooks**:
  - `useAutoEnvironmentId`
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`
  - `CollapsibleHeader`

#### **V9 Target**: `JWTBearerTokenFlowV9.tsx` ✅ **Already Exists**

---

### 2. **Token Exchange Flow V7**
**Route**: `/flows/token-exchange-v7`
**File**: `src/pages/flows/TokenExchangeFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`
  - `useCredentialBackup`

- **Components**:
  - `StepNavigationButtons`
  - `EnhancedApiCallDisplay`
  - `LearningTooltip`
  - `WorkerTokenExpiryBannerV8`
  - `WorkerTokenModalV8`

#### **V9 Target**: `TokenExchangeFlowV9.tsx` ✅ **Already Exists**

---

### 3. **SAML Bearer Assertion Flow V7**
**Route**: `/flows/saml-bearer-assertion-v7`
**File**: `src/pages/flows/SAMLBearerAssertionFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`
  - `CollapsibleSection`

#### **V9 Target**: `SAMLBearerAssertionFlowV9.tsx` ✅ **Already Exists**

---

### 4. **Worker Token Flow V7**
**Route**: `/flows/worker-token-v7`
**File**: `src/pages/flows/WorkerTokenFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`
  - `useCredentialBackup`

- **Components**:
  - `StepNavigationButtons`
  - `WorkerTokenExpiryBannerV8`
  - `WorkerTokenModalV8`

#### **V9 Target**: `WorkerTokenFlowV9.tsx` ✅ **Already Exists**

---

### 5. **OIDC Hybrid Flow V7**
**Route**: `/flows/oidc-hybrid-v7`
**File**: `src/pages/flows/OIDCHybridFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowCompletionService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `V7SharedService`
  - `HybridFlowSharedService`

- **Hooks**:
  - `useHybridFlowControllerV7`
  - `usePageScroll`
  - `useCredentialBackup`

- **Components**:
  - `StepNavigationButtons`
  - `TokenIntrospect`

#### **V9 Target**: `OIDCHybridFlowV9.tsx` ✅ **Already Exists**

---

### 6. **PingOne PAR Flow V7**
**Route**: `/flows/pingone-par-v7`
**File**: `src/pages/flows/PingOnePARFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`
  - `useCredentialBackup`

- **Components**:
  - `StepNavigationButtons`
  - `EnhancedApiCallDisplay`
  - `LearningTooltip`

#### **V9 Target**: `PingOnePARFlowV9.tsx` ✅ **Already Exists**

---

### 7. **OAuth Resource Owner Password Flow V7**
**Route**: `/flows/oauth-ropc-v7`
**File**: `src/pages/flows/OAuthROPCFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `useResourceOwnerPasswordFlowV7`
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`

#### **V9 Target**: `OAuthROPCFlowV9.tsx` ✅ **Already Exists**

---

### 8. **RAR Flow V7**
**Route**: `/flows/rar-v7`
**File**: `src/pages/flows/RARFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`
  - `CollapsibleSection`

#### **V9 Target**: `RARFlowV9.tsx` ✅ **Already Exists**

---

### 9. **PAR Flow V7**
**Route**: `/flows/par-v7`
**File**: `src/pages/flows/PARFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`

#### **V9 Target**: `PARFlowV9.tsx` ✅ **Already Exists**

---

### 10. **PingOne Complete MFA Flow V7**
**Route**: `/flows/pingone-complete-mfa-v7`
**File**: `src/pages/flows/PingOneCompleteMFAFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`

#### **V9 Target**: `PingOneCompleteMFAFlowV9.tsx` ✅ **Already Exists**

---

### 11. **PingOne MFA Workflow Library V7**
**Route**: `/flows/pingone-mfa-workflow-library-v7`
**File**: `src/pages/flows/PingOneMFAWorkflowLibraryV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`

#### **V9 Target**: `PingOneMFAWorkflowLibraryV9.tsx` ✅ **Already Exists**

---

### 12. **MFA Login Hint Flow V7**
**Route**: `/flows/mfa-login-hint-v7`
**File**: `src/pages/flows/MFALoginHintFlowV7.tsx`

#### **Services & Dependencies**:
- **Core Services**:
  - `ComprehensiveCredentialsService`
  - `CopyButtonService`
  - `CredentialGuardService`
  - `FlowHeader` (service)
  - `FlowUIService`
  - `UnifiedTokenDisplayService`
  - `v4ToastManager`

- **Hooks**:
  - `usePageScroll`

- **Components**:
  - `StepNavigationButtons`

#### **V9 Target**: `MFALoginHintFlowV9.tsx` ✅ **Already Exists**

---

## 🔄 Migration Status Summary

### ✅ **Already Migrated (V9 Available)**
All 12 V7 flows in the side menu already have corresponding V9 implementations:

| V7 Flow | V9 Equivalent | Status |
|---------|---------------|---------|
| JWTBearerTokenFlowV7 | JWTBearerTokenFlowV9 | ✅ Complete |
| TokenExchangeFlowV7 | TokenExchangeFlowV9 | ✅ Complete |
| SAMLBearerAssertionFlowV7 | SAMLBearerAssertionFlowV9 | ✅ Complete |
| WorkerTokenFlowV7 | WorkerTokenFlowV9 | ✅ Complete |
| OIDCHybridFlowV7 | OIDCHybridFlowV9 | ✅ Complete |
| PingOnePARFlowV7 | PingOnePARFlowV9 | ✅ Complete |
| OAuthROPCFlowV7 | OAuthROPCFlowV9 | ✅ Complete |
| RARFlowV7 | RARFlowV9 | ✅ Complete |
| PARFlowV7 | PARFlowV9 | ✅ Complete |
| PingOneCompleteMFAFlowV7 | PingOneCompleteMFAFlowV9 | ✅ Complete |
| PingOneMFAWorkflowLibraryV7 | PingOneMFAWorkflowLibraryV9 | ✅ Complete |
| MFALoginHintFlowV7 | MFALoginHintFlowV9 | ✅ Complete |

---

## 🎯 **Migration Strategy**

### **Phase 1: Route Updates**
- Update App.tsx routes to point to V9 implementations
- Maintain backward compatibility with redirects

### **Phase 2: Service Migration**
- Migrate shared services to V9 architecture
- Update service dependencies in V9 flows

### **Phase 3: Component Updates**
- Replace V7-specific components with V9 equivalents
- Update UI components to use V9 design system

### **Phase 4: Testing & Validation**
- Comprehensive testing of all V9 flows
- Performance optimization and cleanup

---

## 📊 **Service Dependencies Analysis**

### **Core Services Used by All V7 Flows**:
1. `ComprehensiveCredentialsService` - Credential management
2. `CopyButtonService` - Copy functionality
3. `CredentialGuardService` - Security validation
4. `FlowHeader` (service) - Header management
5. `FlowUIService` - UI components
6. `UnifiedTokenDisplayService` - Token display
7. `v4ToastManager` - Notifications

### **V7-Specific Services**:
1. `V7SharedService` - V7 compliance features
2. `HybridFlowSharedService` - Hybrid flow logic

### **Common Hooks**:
1. `usePageScroll` - Scroll management
2. `useCredentialBackup` - Credential backup

---

## 🚀 **Next Steps**

1. **Audit V9 implementations** to ensure feature parity
2. **Update routing configuration** to use V9 flows
3. **Migrate shared services** to V9 architecture
4. **Update documentation** and user guides
5. **Performance testing** and optimization

---

**Note**: All V7 flows in the side menu already have V9 equivalents. The migration effort should focus on ensuring feature parity, updating routes, and migrating shared services to the V9 architecture.
