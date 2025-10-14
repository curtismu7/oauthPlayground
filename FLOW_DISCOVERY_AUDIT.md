# Flow Discovery & Credentials Audit - All Flows

**Date:** October 11, 2025  
**Scope:** PingOne, Mock, OAuth, and OIDC flows

## Issues Found

### ❌ Client Credentials Flow V6 - Using OLD API

**File:** `src/pages/flows/ClientCredentialsFlowV6.tsx` (line 414-431)

**Issues:**
1. Using deprecated props API (`credentials` object instead of individual field props)
2. **NO discovery handler** - OIDC discovery won't work
3. No `onDiscoveryComplete` prop

**Current Code:**
```typescript
<ComprehensiveCredentialsService
    credentials={controller.credentials}  // OLD API
    onCredentialsChange={handleCredentialsChange}  // OLD API
    onSaveCredentials={controller.saveCredentials}
    collapsed={collapsedSections.credentials}
    onToggleCollapsed={() => toggleSection('credentials')}
    flowType="client-credentials"
    // ... PingOne config
/>
```

**Impact:**
- OIDC discovery doesn't extract environment ID
- Using inconsistent API compared to other V6 flows
- Missing discovery handler

**Status:** ❌ **NEEDS FIX**

---

### ⚠️ RAR Flow V6 - Unused Import

**File:** `src/pages/flows/RARFlowV6.tsx` (line 21)

**Issue:** Imports `ComprehensiveCredentialsService` but never uses it

**Impact:** Minor - just dead code/unused import

**Status:** ⚠️ **CLEANUP NEEDED**

---

### ⚠️ OAuth Implicit Flow V6 - Incomplete Discovery Handler

**File:** `src/pages/flows/OAuthImplicitFlowV6.tsx` (lines 642-645)

**Issue:** Discovery handler just logs and relies on "service" to handle it, but needs verification

**Current Code:**
```typescript
onDiscoveryComplete={(result) => {
    console.log('[OAuth Implicit V5] OIDC Discovery completed:', result);
    // Service already handles environment ID extraction
}}
```

**Status:** ⚠️ **NEEDS VERIFICATION** - Check if environment ID actually gets set

---

### ⚠️ OIDC Implicit Flow V6 Full - Same Issue

**File:** `src/pages/flows/OIDCImplicitFlowV6_Full.tsx`

**Issue:** Same as OAuth Implicit - discovery handler just logs

**Status:** ⚠️ **NEEDS VERIFICATION**

---

## Flows Verified ✅

All other V6 flows using ComprehensiveCredentialsService have proper discovery handlers:

### ✅ OAuth Flows
- **OAuthAuthorizationCodeFlowV6.tsx** - ✅ Proper discovery with environment ID extraction
- **DeviceAuthorizationFlowV6.tsx** - ✅ Proper discovery with environment ID extraction
- **JWTBearerTokenFlowV6.tsx** - ✅ Proper discovery with environment ID extraction (JUST FIXED)

### ✅ OIDC Flows  
- **OIDCAuthorizationCodeFlowV6.tsx** - ✅ Proper discovery with environment ID extraction
- **OIDCDeviceAuthorizationFlowV6.tsx** - ✅ Proper discovery with environment ID extraction
- **OIDCHybridFlowV6.tsx** - ✅ Proper discovery with environment ID extraction

### ✅ PingOne Flows
- **PingOnePARFlowV6.tsx** - ✅ Proper discovery with environment ID extraction
- **PingOnePARFlowV6_New.tsx** - ✅ Proper discovery with environment ID extraction

### ✅ Other V6 Flows
- **RARFlowV6_New.tsx** - ✅ Proper discovery with environment ID extraction
- **WorkerTokenFlowV6.tsx** - ✅ Proper discovery with dedicated handler
- **RedirectlessFlowV6_Real.tsx** - ✅ Uses controller.handleDiscoveryComplete

---

## Flows Without ComprehensiveCredentialsService

These flows use different credential management systems (intentionally):

### V6 Flows
- **OIDCImplicitFlowV6.tsx** - Uses old credential system (V5 style)
- **SAMLBearerAssertionFlowV6.tsx** - Uses specialized SAML credential inputs
- **AdvancedParametersV6.tsx** - Not a flow, just a page

### Mock Flows
- **MockOIDCResourceOwnerPasswordFlow.tsx** - Mock flow, separate system
- **RedirectlessFlowV5_Mock.tsx** - Mock flow, separate system

**Status:** ✅ These are intentional and don't need ComprehensiveCredentialsService

---

## Summary

**Total Flows Audited:** 20+ V6 flows  
**Issues Found:** 3  
- ❌ **Critical:** Client Credentials V6 using OLD API without discovery
- ⚠️ **Minor:** RAR V6 unused import
- ⚠️ **Verification Needed:** 2 Implicit flows (OAuth & OIDC)

**Action Required:**
1. Fix Client Credentials V6 to use new API with discovery handler
2. Remove unused import from RAR V6
3. Verify Implicit flows actually set environment ID from discovery

