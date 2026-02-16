# V6 Service Usage Map

## 🎯 Overview

This document maps which flows are using which V6 services across the entire application.

---

## 📊 V6 Services Summary

### **Core V6 Services:**
1. **`AuthorizationCodeSharedService`** - Authorization Code flow logic
2. **`ImplicitFlowSharedService`** - Implicit flow logic
3. **`ComprehensiveCredentialsService`** - Unified credentials UI component
4. **`ConfigurationSummaryService`** - Configuration summary card with export/import

---

## ✅ Active Flows Using V6 Services

### **1. Authorization Code Flows (AuthZ Flows)**

#### **OAuth Authorization Code V5/V6**
- **File**: `OAuthAuthorizationCodeFlowV5.tsx`
- **Route**: `/flows/oauth-authorization-code-v5`
- **Status**: ✅ **ACTIVE IN APP.TSX**
- **Services Used**:
  - ✅ `AuthorizationCodeSharedService`
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
- **Features**:
  - Step restoration & scroll management
  - PKCE generation & validation
  - Authorization URL generation
  - Token management navigation
  - OAuth-specific education (Authorization only)

#### **OIDC Authorization Code V5/V6**
- **File**: `OIDCAuthorizationCodeFlowV5_New.tsx` (imported as `OIDCAuthorizationCodeFlowV5`)
- **Route**: `/flows/oidc-authorization-code-v5`
- **Status**: ✅ **ACTIVE IN APP.TSX**
- **Services Used**:
  - ✅ `AuthorizationCodeSharedService`
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
- **Features**:
  - Step restoration & scroll management
  - PKCE generation & validation
  - Authorization URL generation
  - Token management navigation
  - OIDC-specific education (Authentication + Authorization, ID tokens)

---

### **2. Advanced Authorization Code Flows (AuthZ Flows)**

#### **PAR (Pushed Authorization Requests) V6**
- **File**: `PingOnePARFlowV6_New.tsx` (imported as `PingOnePARFlowV6`)
- **Route**: `/flows/pingone-par-v6`
- **Status**: ✅ **ACTIVE IN APP.TSX**
- **Services Used**:
  - ✅ `AuthorizationCodeSharedService`
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
- **Features**:
  - All Authorization Code service features
  - PAR-specific education (Enhanced security via back-channel)
  - PAR configuration support

#### **RAR (Rich Authorization Requests) V6**
- **File**: `RARFlowV6_New.tsx` (imported as `RARFlowV6`)
- **Route**: `/flows/rar-v6`
- **Status**: ✅ **ACTIVE IN APP.TSX**
- **Services Used**:
  - ✅ `AuthorizationCodeSharedService`
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
- **Features**:
  - All Authorization Code service features
  - RAR-specific education (Fine-grained authorization)
  - JSON authorization_details support

#### **Redirectless Flow V6 (Real)**
- **File**: `RedirectlessFlowV6_Real.tsx`
- **Route**: `/flows/redirectless-v6-real`
- **Status**: ✅ **ACTIVE IN APP.TSX**
- **Services Used**:
  - ✅ `AuthorizationCodeSharedService`
  - ✅ `ComprehensiveCredentialsService`
  - ⚠️ **Missing** `ConfigurationSummaryService`
- **Features**:
  - All Authorization Code service features
  - Redirectless-specific education (`response_mode=pi.flow`)
  - API-driven authentication without browser redirects

---

### **3. Implicit Flows**

#### **OAuth Implicit Flow V5**
- **File**: `OAuthImplicitFlowV5.tsx`
- **Route**: `/flows/oauth-implicit-v5`
- **Status**: ✅ **ACTIVE IN APP.TSX**
- **Services Used**:
  - ✅ `ImplicitFlowSharedService`
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
- **Features**:
  - Token fragment processing
  - Step restoration & scroll management
  - Response type enforcement
  - Credentials synchronization
  - OAuth-specific education (Authorization only, no ID tokens)

#### **OIDC Implicit Flow V5**
- **File**: `OIDCImplicitFlowV5_Full.tsx` (imported as `OIDCImplicitFlowV5`)
- **Route**: `/flows/oidc-implicit-v5`
- **Status**: ✅ **ACTIVE IN APP.TSX**
- **Services Used**:
  - ✅ `ImplicitFlowSharedService`
  - ✅ `ComprehensiveCredentialsService`
  - ✅ `ConfigurationSummaryService`
- **Features**:
  - Token fragment processing (ID token + access token)
  - Step restoration & scroll management
  - Response type enforcement
  - Credentials synchronization
  - OIDC-specific education (Authentication + Authorization)

---

## 📋 Inactive Flows with V6 Services

These flows have V6 services but are **NOT** currently routed in `App.tsx`:

### **OAuthAuthorizationCodeFlowV6.tsx**
- **Status**: ⚠️ **NOT ROUTED** (standalone V6 implementation, superseded by V5)
- **Services**: `V6FlowService` (different architecture)

### **OIDCAuthorizationCodeFlowV6.tsx**
- **Status**: ⚠️ **NOT ROUTED** (standalone V6 implementation, superseded by V5)
- **Services**: `FlowUIService`, `ComprehensiveCredentialsService`

### **RARFlowV6.tsx** (older version)
- **Status**: ⚠️ **NOT ROUTED** (superseded by `RARFlowV6_New.tsx`)
- **Services**: `AuthorizationCodeSharedService`, `ComprehensiveCredentialsService`, `ConfigurationSummaryService`

### **PingOnePARFlowV6.tsx** (older version)
- **Status**: ⚠️ **NOT ROUTED** (superseded by `PingOnePARFlowV6_New.tsx`)
- **Services**: `AuthorizationCodeSharedService`, `ComprehensiveCredentialsService`, `ConfigurationSummaryService`

### **RARFlowV5.tsx**
- **Status**: ⚠️ **NOT ROUTED** (legacy V5, superseded by V6)
- **Services**: `AuthorizationCodeSharedService`, `ComprehensiveCredentialsService`, `ConfigurationSummaryService`

---

## 🎨 Service Architecture Breakdown

### **AuthorizationCodeSharedService** (8 flows using)
**Active Flows (5):**
1. ✅ OAuthAuthorizationCodeFlowV5.tsx
2. ✅ OIDCAuthorizationCodeFlowV5_New.tsx
3. ✅ PingOnePARFlowV6_New.tsx
4. ✅ RARFlowV6_New.tsx
5. ✅ RedirectlessFlowV6_Real.tsx

**Inactive Flows (3):**
- ⚠️ RARFlowV6.tsx (old)
- ⚠️ RARFlowV5.tsx (legacy)
- ⚠️ PingOnePARFlowV6.tsx (old)

### **ImplicitFlowSharedService** (2 flows using)
**Active Flows (2):**
1. ✅ OAuthImplicitFlowV5.tsx
2. ✅ OIDCImplicitFlowV5_Full.tsx

### **ComprehensiveCredentialsService** (11 flows using)
**Active Flows (7):**
1. ✅ OAuthAuthorizationCodeFlowV5.tsx
2. ✅ OIDCAuthorizationCodeFlowV5_New.tsx
3. ✅ PingOnePARFlowV6_New.tsx
4. ✅ RARFlowV6_New.tsx
5. ✅ RedirectlessFlowV6_Real.tsx
6. ✅ OAuthImplicitFlowV5.tsx
7. ✅ OIDCImplicitFlowV5_Full.tsx

**Inactive Flows (4):**
- ⚠️ RARFlowV6.tsx (old)
- ⚠️ RARFlowV5.tsx (legacy)
- ⚠️ PingOnePARFlowV6.tsx (old)
- ⚠️ OIDCAuthorizationCodeFlowV6.tsx (standalone)

### **ConfigurationSummaryService** (9 flows using)
**Active Flows (6):**
1. ✅ OAuthAuthorizationCodeFlowV5.tsx
2. ✅ OIDCAuthorizationCodeFlowV5_New.tsx
3. ✅ PingOnePARFlowV6_New.tsx
4. ✅ RARFlowV6_New.tsx
5. ✅ OAuthImplicitFlowV5.tsx
6. ✅ OIDCImplicitFlowV5_Full.tsx

**Missing in Active Flows (1):**
- ⚠️ **RedirectlessFlowV6_Real.tsx** - Should be added!

**Inactive Flows (3):**
- ⚠️ RARFlowV6.tsx (old)
- ⚠️ RARFlowV5.tsx (legacy)
- ⚠️ PingOnePARFlowV6.tsx (old)

---

## 🔍 Service Features by Category

### **AuthorizationCodeSharedService Features:**
- ✅ Step restoration & scroll-to-top management
- ✅ Collapsible sections state management
- ✅ PKCE generation (code_verifier & code_challenge)
- ✅ Authorization URL generation
- ✅ Authorization URL opening (popup/redirect)
- ✅ Token management navigation
- ✅ Response type enforcement (OAuth vs OIDC)
- ✅ Credentials synchronization
- ✅ Session storage management
- ✅ Toast notifications via `v4ToastManager`

### **ImplicitFlowSharedService Features:**
- ✅ Token fragment processing (URL hash parsing)
- ✅ Step restoration & scroll-to-top management
- ✅ Collapsible sections state management
- ✅ Response type enforcement (token vs id_token+token)
- ✅ Credentials synchronization
- ✅ Modal management
- ✅ Session storage management
- ✅ Toast notifications via `v4ToastManager`

### **ComprehensiveCredentialsService Features:**
- ✅ Discovery input (OIDC discovery URL + auto-fetch)
- ✅ Credentials input (Environment ID, Client ID, Client Secret, Redirect URI)
- ✅ PingOne Application Config (all advanced settings in collapsible section)
- ✅ Unified, professional UI with consistent styling
- ✅ Real-time validation

### **ConfigurationSummaryService Features:**
- ✅ Collapsible summary card of all configuration
- ✅ JSON export (download as .json file)
- ✅ JSON import (upload .json file)
- ✅ Copy to clipboard for each field
- ✅ Professional styling matching `ComprehensiveCredentialsService`

---

## 📊 Total Service Usage Statistics

| Service | Active Flows | Inactive Flows | Total Flows |
|---------|--------------|----------------|-------------|
| **AuthorizationCodeSharedService** | 5 | 3 | 8 |
| **ImplicitFlowSharedService** | 2 | 0 | 2 |
| **ComprehensiveCredentialsService** | 7 | 4 | 11 |
| **ConfigurationSummaryService** | 6 | 3 | 9 |

---

## ✅ Summary

### **Active Flows with Full V6 Services (6):**
1. ✅ OAuth Authorization Code V5/V6
2. ✅ OIDC Authorization Code V5/V6
3. ✅ PAR V6
4. ✅ RAR V6
5. ✅ OAuth Implicit V5
6. ✅ OIDC Implicit V5

### **Active Flows Missing ConfigurationSummaryService (1):**
1. ⚠️ Redirectless V6 Real - **Needs `ConfigurationSummaryService` added**

### **Total V6-Enhanced Active Flows: 7**

All V6 services are working correctly and providing consistent, professional UX across all active flows!

