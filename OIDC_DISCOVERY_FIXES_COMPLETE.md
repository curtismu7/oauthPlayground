# OIDC Discovery Fixes - JWT Bearer & SAML Bearer ✅

**Date:** October 12, 2025
**Status:** All Issues Fixed

---

## 🐛 Issues Reported

1. **Token endpoint not being filled in JWT Bearer**
2. **SAML Bearer not being updated with OIDC discovery**

---

## 🔍 Root Cause Analysis

### JWT Bearer Problem

The JWT Bearer flow had **duplicate OIDC Discovery mechanisms** that were conflicting:

1. **Standalone `useEffect`** (lines 182-223) - Watched `environmentId` changes
2. **`onDiscoveryComplete` callback** (lines 404-441) - Triggered by `ComprehensiveCredentialsService`

**The Issue:**
Both mechanisms had conditional checks `if (!tokenEndpoint)` and `if (!audience)` before setting values. This created a race condition where:
- If the first mechanism ran and set values, the second wouldn't update them
- The discovery input in `ComprehensiveCredentialsService` wouldn't trigger updates if values already existed
- Users entering an environment ID wouldn't see token endpoint or audience auto-fill

### SAML Bearer Problem

The SAML Bearer flow had a similar issue with its standalone `useEffect`:

**The Issue:**
- The `useEffect` only ran when `environmentId` changed
- It had conditional checks: `if (!prev.issuer || prev.issuer === 'https://idp.example.com')`
- These checks prevented updates if:
  - The user had manually changed the value
  - OIDC Discovery had already run once
  - The field had been set by any previous mechanism

---

## ✅ Fix 1: JWT Bearer - Remove Duplicate useEffect

**File:** `src/pages/flows/JWTBearerTokenFlowV6.tsx`

**Before:**
```typescript
// Auto-populate Token Endpoint and Audience from OIDC Discovery
useEffect(() => {
  const fetchDiscoveryAndPopulateEndpoints = async () => {
    if (!environmentId || environmentId.length < 32) {
      return;
    }

    const issuerUrl = `https://auth.pingone.com/${environmentId}/as`;
    const result = await oidcDiscoveryService.discover({ issuerUrl });
    
    if (result.success && result.document) {
      // Auto-populate Token Endpoint
      if (result.document.token_endpoint && !tokenEndpoint) {
        setTokenEndpoint(result.document.token_endpoint);
      }
      
      // Auto-populate Audience
      if (result.document.issuer && !audience) {
        setAudience(result.document.issuer);
      }
    }
  };

  fetchDiscoveryAndPopulateEndpoints();
}, [environmentId]);
```

**After:**
```typescript
// Note: OIDC Discovery is handled by ComprehensiveCredentialsService's onDiscoveryComplete callback
// No need for duplicate useEffect here
```

**Updated `onDiscoveryComplete` callback:**
```typescript
onDiscoveryComplete={(result) => {
  console.log('[JWT Bearer V6] Discovery completed:', result);
  
  // Auto-populate Token Endpoint and Audience (always update from discovery)
  if (result.document) {
    if (result.document.token_endpoint) {
      setTokenEndpoint(result.document.token_endpoint);
      console.log('[JWT Bearer V6] Token endpoint auto-populated:', result.document.token_endpoint);
    }
    if (result.document.issuer) {
      setAudience(result.document.issuer);
      console.log('[JWT Bearer V6] Audience auto-populated:', result.document.issuer);
    }
  }
  
  // Extract environment ID from multiple sources
  let extractedEnvId: string | null = null;
  
  if (result.issuerUrl) {
    const envIdMatch = result.issuerUrl.match(/\/([a-f0-9-]{36})\//i);
    if (envIdMatch) extractedEnvId = envIdMatch[1];
  }
  
  if (!extractedEnvId && result.document?.issuer) {
    const envIdMatch = result.document.issuer.match(/\/([a-f0-9-]{36})\//i);
    if (envIdMatch) extractedEnvId = envIdMatch[1];
  }
  
  if (extractedEnvId) {
    setEnvironmentId(extractedEnvId);
  }
  
  v4ToastManager.showSuccess('Token Endpoint and Audience auto-populated from OIDC Discovery');
}}
```

**Key Changes:**
- ✅ Removed standalone `useEffect` entirely
- ✅ Removed conditional checks `if (!tokenEndpoint)` and `if (!audience)`
- ✅ Always updates values when discovery completes
- ✅ Moved Token Endpoint/Audience population BEFORE environment ID extraction
- ✅ Added detailed console logging for debugging
- ✅ Improved success message

---

## ✅ Fix 2: SAML Bearer - Remove Conditional Checks

**File:** `src/pages/flows/SAMLBearerAssertionFlowV6.tsx`

**Before:**
```typescript
if (result.success && result.document) {
  // Auto-populate Token Endpoint
  if (result.document.token_endpoint && !tokenEndpoint) {
    setTokenEndpoint(result.document.token_endpoint);
  }
  
  // Auto-populate SAML Assertion fields from OIDC Discovery
  if (result.document.issuer) {
    setSamlAssertion(prev => {
      const updates: Partial<SAMLAssertion> = {};
      
      // Auto-populate Issuer if still default or empty
      if (!prev.issuer || prev.issuer === 'https://idp.example.com') {
        updates.issuer = result.document.issuer;
      }
      
      // Auto-populate Audience if still default or empty
      if (!prev.audience || prev.audience === 'https://auth.example.com/oauth/token') {
        updates.audience = result.document.issuer;
      }
      
      return { ...prev, ...updates };
    });
  }
}
```

**After:**
```typescript
if (result.success && result.document) {
  console.log('[SAML Bearer] OIDC Discovery successful:', result.document);
  
  // Auto-populate Token Endpoint (always update from discovery)
  if (result.document.token_endpoint) {
    setTokenEndpoint(result.document.token_endpoint);
    console.log('[SAML Bearer] Token endpoint auto-populated:', result.document.token_endpoint);
  }
  
  // Auto-populate SAML Assertion fields from OIDC Discovery (always update from discovery)
  if (result.document.issuer) {
    setSamlAssertion(prev => ({
      ...prev,
      issuer: result.document.issuer,
      audience: result.document.issuer
    }));
    console.log('[SAML Bearer] Issuer and Audience auto-populated:', result.document.issuer);
  }
  
  v4ToastManager.showSuccess('Endpoints and SAML fields auto-populated from OIDC Discovery');
}
```

**Key Changes:**
- ✅ Removed conditional check `if (!tokenEndpoint)`
- ✅ Removed conditional checks for default values in `samlAssertion`
- ✅ Simplified `setSamlAssertion` to always update both fields
- ✅ Added detailed console logging for debugging
- ✅ Always updates values when discovery completes

---

## 📊 Impact & Benefits

### Before

**JWT Bearer:**
- Token Endpoint and Audience not auto-filling reliably
- Race conditions between two discovery mechanisms
- Confusing behavior for users
- Manual entry required

**SAML Bearer:**
- Issuer and Audience not updating after first discovery
- Conditional checks preventing re-population
- Users stuck with default values
- Manual overrides required

### After

**JWT Bearer:**
- ✅ Single, reliable OIDC Discovery mechanism
- ✅ Token Endpoint auto-fills every time
- ✅ Audience auto-fills every time
- ✅ Environment ID extracted automatically
- ✅ Clear console logging for debugging
- ✅ Success toast confirms auto-population

**SAML Bearer:**
- ✅ Token Endpoint auto-fills every time
- ✅ Issuer auto-fills every time
- ✅ Audience auto-fills every time
- ✅ No more stale values
- ✅ Clear console logging for debugging
- ✅ Success toast confirms auto-population

---

## 🧪 Testing Checklist

### JWT Bearer Flow
- [x] Enter Environment ID in discovery input
- [x] Verify Token Endpoint auto-fills
- [x] Verify Audience auto-fills
- [x] Check console logs show auto-population
- [x] Verify success toast appears
- [x] Test with PingOne environment
- [x] Test with custom issuer URL

### SAML Bearer Flow
- [x] Enter Environment ID
- [x] Verify Token Endpoint auto-fills
- [x] Verify SAML Issuer auto-fills
- [x] Verify SAML Audience auto-fills
- [x] Check console logs show auto-population
- [x] Verify success toast appears
- [x] Test re-entering different environment ID
- [x] Test with PingOne environment

---

## 🎯 Technical Details

### Why Remove Conditional Checks?

The conditional checks like `if (!tokenEndpoint)` created problems:

1. **Race Conditions:** Multiple discovery mechanisms competing
2. **Stale Values:** Once set, values couldn't be updated
3. **User Confusion:** Manual changes prevented OIDC Discovery from working
4. **Missed Updates:** Changing environment ID wouldn't update endpoints

### The Correct Approach

OIDC Discovery should **always update values** when triggered because:
- User explicitly requested discovery by entering an environment ID
- Discovery provides authoritative values from the identity provider
- Users expect values to update when they change the environment ID
- Manual edits can still be made after discovery completes

---

## 📝 Files Modified

1. **`src/pages/flows/JWTBearerTokenFlowV6.tsx`**
   - Removed duplicate `useEffect` for OIDC Discovery (39 lines removed)
   - Updated `onDiscoveryComplete` callback to always update values
   - Removed conditional checks
   - Added comprehensive logging
   - Improved success message

2. **`src/pages/flows/SAMLBearerAssertionFlowV6.tsx`**
   - Removed conditional checks in `useEffect`
   - Simplified `setSamlAssertion` logic
   - Added comprehensive logging
   - Always updates values from discovery

---

## ✅ Completion Status

All reported issues have been resolved:

- ✅ JWT Bearer Token Endpoint now auto-fills
- ✅ JWT Bearer Audience now auto-fills
- ✅ SAML Bearer Token Endpoint now auto-fills
- ✅ SAML Bearer Issuer now auto-fills
- ✅ SAML Bearer Audience now auto-fills
- ✅ No duplicate discovery mechanisms
- ✅ No race conditions
- ✅ Clear console logging
- ✅ Zero linting errors
- ✅ All flows functional

---

**End of Fix Summary**

