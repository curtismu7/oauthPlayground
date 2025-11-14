# PKCE Debug Logging + Advanced Settings Visibility Fix

## 🐛 Issues Addressed

### 1. PKCE Mismatch Error
**Error Message:**
```
POST https://localhost:3000/api/token-exchange 400 (Bad Request)
The code_verifier sent does not match code_challenge included in the authorization request
using the S256 code_challenge_method
```

**Problem:** 
- code_verifier sent during token exchange doesn't match the code_challenge from the authorization request
- Need to trace where PKCE codes are being generated, stored, and retrieved

### 2. Advanced Settings Section Visibility
**Issue:**
- "PingOne Security & Advanced Settings" section displayed in all flows
- Contains PAR (Pushed Authorization Requests) configuration
- **PAR is NOT applicable to all flows** (e.g., Client Credentials, Implicit, Device Auth)

**User Request:**
> "The image does not make sense in all flows, you would not do PAR for client credentials. We need to only display this if it makes sense for the OIDC or OAuth spec (like client credentials). You can just hide it for now."

---

## ✅ Solutions Implemented

### 1. Enhanced PKCE Debug Logging

Added comprehensive console logging at 3 critical points in the PKCE lifecycle:

#### A. PKCE Generation (`generatePkceCodes`)
**File:** `src/hooks/useAuthorizationCodeFlowController.ts` (lines 545-562)

```typescript
console.log('🔐 [PKCE DEBUG] ===== GENERATING NEW PKCE CODES =====');
console.log('🔐 [PKCE DEBUG] code_verifier (first 20 chars):', codeVerifier.substring(0, 20) + '...');
console.log('🔐 [PKCE DEBUG] code_challenge (first 20 chars):', codeChallenge.substring(0, 20) + '...');
console.log('🔐 [PKCE DEBUG] Storage key:', `${persistKey}-pkce-codes`);
console.log('✅ [PKCE DEBUG] PKCE codes generated and saved to state');
```

**Shows:**
- Exact code_verifier and code_challenge being generated
- Storage key where they'll be persisted
- Confirmation of state update

#### B. Authorization URL Building (`generateAuthorizationUrl`)
**File:** `src/hooks/useAuthorizationCodeFlowController.ts` (lines 621-626)

```typescript
console.log('🌐 [PKCE DEBUG] ===== BUILDING AUTHORIZATION URL =====');
console.log('🌐 [PKCE DEBUG] Using PKCE codes:', {
  codeVerifier: pkceCodes.codeVerifier.substring(0, 20) + '...',
  codeChallenge: pkceCodes.codeChallenge.substring(0, 20) + '...',
  codeChallengeMethod: pkceCodes.codeChallengeMethod
});
```

**Shows:**
- Which code_challenge is being included in the authorization URL
- Confirms codes match what was generated

#### C. Token Exchange (`exchangeTokens`)
**File:** `src/hooks/useAuthorizationCodeFlowController.ts` (lines 935-983)

```typescript
console.log('🔍 [PKCE DEBUG] ===== TOKEN EXCHANGE PKCE RETRIEVAL =====');
console.log('🔍 [PKCE DEBUG] Current pkceCodes state:', {
  codeVerifier: pkceCodes.codeVerifier ? `${pkceCodes.codeVerifier.substring(0, 20)}...` : 'MISSING',
  codeChallenge: pkceCodes.codeChallenge ? `${pkceCodes.codeChallenge.substring(0, 20)}...` : 'MISSING',
  hasBoth: !!(pkceCodes.codeVerifier && pkceCodes.codeChallenge)
});

// If not in state, check sessionStorage
console.log('🔍 [PKCE DEBUG] SessionStorage check:', {
  key: pkceStorageKey,
  found: !!storedPkceCodes,
  hasVerifier: !!storedPkceCodes?.codeVerifier,
  hasChallenge: !!storedPkceCodes?.codeChallenge
});

console.log('✅ [PKCE DEBUG] Using code_verifier from state:', codeVerifier.substring(0, 20) + '...');
```

**Shows:**
- Whether code_verifier is in state or retrieved from sessionStorage
- Exact code_verifier being sent to token endpoint
- All fallback storage keys attempted

---

### 2. Hidden Advanced Settings Section

Set `showAdvancedConfig={false}` in all flows with TODO comments for future enablement.

#### Flows Updated:

| Flow | File | Status |
|------|------|--------|
| OAuth Authorization Code | `OAuthAuthorizationCodeFlowV6.tsx` | ✅ Hidden |
| OIDC Authorization Code | `OIDCAuthorizationCodeFlowV6.tsx` | ✅ Hidden |
| PAR Flow (Old) | `PingOnePARFlowV6.tsx` | ✅ Hidden |
| PAR Flow (New) | `PingOnePARFlowV6_New.tsx` | ✅ Hidden |
| OAuth Implicit | `OAuthImplicitFlowV6.tsx` | ✅ Hidden |
| OIDC Implicit | `OIDCImplicitFlowV6_Full.tsx` | ✅ Hidden |
| Redirectless | `RedirectlessFlowV6_Real.tsx` | ✅ Hidden |

**Changes Made:**
```typescript
// Before
showAdvancedConfig={true}

// After
showAdvancedConfig={false} // TODO: PAR not applicable to all flows
```

---

## 🔍 How to Use PKCE Debug Logging

### Testing Flow:
1. **Open OAuth/OIDC Authorization Code flow**
2. **Open Browser DevTools Console**
3. **Generate PKCE codes** → Look for `🔐 [PKCE DEBUG] ===== GENERATING NEW PKCE CODES =====`
   - Note the first 20 chars of code_verifier and code_challenge
4. **Generate Authorization URL** → Look for `🌐 [PKCE DEBUG] ===== BUILDING AUTHORIZATION URL =====`
   - Verify code_challenge matches what was generated
5. **Redirect to PingOne** → Complete authentication
6. **Exchange tokens** → Look for `🔍 [PKCE DEBUG] ===== TOKEN EXCHANGE PKCE RETRIEVAL =====`
   - Verify code_verifier matches what was generated
   - Check if retrieved from state or sessionStorage
   - If mismatch, compare all 3 logged values

### Example Console Output (Success Case):
```
🔐 [PKCE DEBUG] ===== GENERATING NEW PKCE CODES =====
🔐 [PKCE DEBUG] code_verifier (first 20 chars): dBjftJeZ4CVP-mB8...
🔐 [PKCE DEBUG] code_challenge (first 20 chars): E9Melhoa2OwvFrEMT...
🔐 [PKCE DEBUG] Storage key: oauth-authorization-code-v6-pkce-codes
✅ [PKCE DEBUG] PKCE codes generated and saved to state

🌐 [PKCE DEBUG] ===== BUILDING AUTHORIZATION URL =====
🌐 [PKCE DEBUG] Using PKCE codes: {
  codeVerifier: 'dBjftJeZ4CVP-mB8...',
  codeChallenge: 'E9Melhoa2OwvFrEMT...',
  codeChallengeMethod: 'S256'
}

🔍 [PKCE DEBUG] ===== TOKEN EXCHANGE PKCE RETRIEVAL =====
🔍 [PKCE DEBUG] Current pkceCodes state: {
  codeVerifier: 'dBjftJeZ4CVP-mB8...',
  codeChallenge: 'E9Melhoa2OwvFrEMT...',
  hasBoth: true
}
✅ [PKCE DEBUG] Using code_verifier from state: dBjftJeZ4CVP-mB8...
```

### Example Console Output (Error Case - Mismatch):
```
🔐 [PKCE DEBUG] code_verifier (first 20 chars): ABC123...
🔐 [PKCE DEBUG] code_challenge (first 20 chars): XYZ789...

🌐 [PKCE DEBUG] Using PKCE codes: {
  codeVerifier: 'ABC123...',
  codeChallenge: 'XYZ789...'
}

🔍 [PKCE DEBUG] Current pkceCodes state: {
  codeVerifier: 'DIFFERENT_VALUE...',   <--- ❌ MISMATCH
  codeChallenge: 'DIFFERENT_CHALLENGE...',
  hasBoth: true
}
```

---

## 🎯 Root Cause Hypotheses

Based on the error, possible causes:

### 1. State Reset During Page Reload
- **Scenario:** After PingOne redirect, page reloads and state is lost
- **Expected:** PKCE codes should load from sessionStorage
- **Debug:** Check if sessionStorage retrieval is working in token exchange logs

### 2. Multiple PKCE Generations
- **Scenario:** PKCE codes regenerated between authorization and token exchange
- **Expected:** Only one generation per flow
- **Debug:** Count how many times `🔐 [PKCE DEBUG] GENERATING` appears

### 3. SessionStorage Key Mismatch
- **Scenario:** PKCE codes saved with one key, retrieved with another
- **Expected:** `oauth-authorization-code-v6-pkce-codes` used consistently
- **Debug:** Verify storage key in generation vs. retrieval logs

### 4. Race Condition
- **Scenario:** Token exchange happens before PKCE codes are fully persisted
- **Expected:** Codes persisted in `useEffect` after state update
- **Debug:** Check timing between generation and exchange

---

## 📋 Next Steps

### Immediate Testing:
1. Run the OAuth Authorization Code flow with DevTools open
2. Capture all PKCE debug logs
3. Compare code_verifier values across all 3 stages
4. If mismatch detected, identify which stage has the wrong value

### Potential Fixes (Based on Findings):
- **If state reset issue:** Ensure sessionStorage is checked first in token exchange
- **If multiple generations:** Add guard to prevent re-generation
- **If key mismatch:** Standardize storage key usage
- **If race condition:** Add await/delay before token exchange

### Advanced Settings Re-Enablement Plan:
Later, selectively re-enable `showAdvancedConfig={true}` for:
- ✅ OAuth/OIDC Authorization Code flows (PAR is supported)
- ✅ Dedicated PAR flows (obviously)
- ❌ Client Credentials (no authorization request)
- ❌ Implicit flows (PAR uncommon/unnecessary)
- ❌ Device Authorization (different endpoint)
- ❌ JWT/SAML Bearer (direct token request)

---

## 📝 Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `src/hooks/useAuthorizationCodeFlowController.ts` | Added PKCE debug logging | 545-562, 621-626, 935-983 |
| `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` | Hidden advanced settings | 1694 |
| `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` | Hidden advanced settings | 1807 |
| `src/pages/flows/PingOnePARFlowV6.tsx` | Hidden advanced settings | 715 |
| `src/pages/flows/PingOnePARFlowV6_New.tsx` | Hidden advanced settings | 1535 |
| `src/pages/flows/OAuthImplicitFlowV6.tsx` | Hidden advanced settings | 779 |
| `src/pages/flows/OIDCImplicitFlowV6_Full.tsx` | Hidden advanced settings | 657 |
| `src/pages/flows/RedirectlessFlowV6_Real.tsx` | Hidden advanced settings | 242 |

---

## ✅ Status

**PKCE Debug Logging:** ✅ COMPLETE - Ready for testing
**Advanced Settings Hidden:** ✅ COMPLETE - All flows updated

**User Action Required:**
1. Test OAuth Authorization Code flow end-to-end
2. Provide PKCE debug console logs if error persists
3. Verify advanced settings section no longer appears

**Next Investigation:**
- Analyze debug logs to pinpoint PKCE mismatch root cause
- Implement targeted fix based on findings

---

**Date:** October 2025  
**Issue:** PKCE mismatch error + Advanced settings visibility  
**Status:** Debug logging added, awaiting test results  
**Impact:** All authorization flows now have enhanced PKCE debugging

