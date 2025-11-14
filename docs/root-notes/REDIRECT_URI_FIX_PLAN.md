# Redirect URI Mismatch - Root Cause & Fix

**Date:** October 11, 2025  
**Issue:** "Invalid Redirect URI" error despite correct configuration  
**Priority:** 🔴 CRITICAL - Blocking all authorization flows

---

## 🐛 The Problem

### Current Behavior:
1. User configures `redirectUri` in credentials
2. Authorization URL is generated using `credentials.redirectUri`
3. Token exchange uses `credentials.redirectUri` again
4. **BUT:** If credentials change between steps, or URL has different encoding/format, mismatch occurs

###Example Mismatch:
```
Authorization Request: redirect_uri=https://localhost:3000/authz-callback
Token Exchange:        redirect_uri=https://localhost:3000/authz-callback/  ← trailing slash!
Result: ❌ Invalid Redirect URI error
```

---

## ✅ The Solution: Extract from Generated URL

**Principle:** "Use whatever the UI says. It's right in the generated URL, why not use that?"

### New Approach:
1. **Generate Authorization URL** → Store the EXACT `redirect_uri` parameter used
2. **Token Exchange** → Use the STORED `redirect_uri` (not credentials)
3. **Guarantee:** Both requests use identical value

### Implementation:
```typescript
// Step 1: When generating auth URL, store the redirect_uri
const authUrl = generateAuthUrl();
const parsedUrl = new URL(authUrl);
const actualRedirectUri = parsedUrl.searchParams.get('redirect_uri');
sessionStorage.setItem('auth_redirect_uri', actualRedirectUri); // Store it!

// Step 2: When exchanging tokens, use stored value
const storedRedirectUri = sessionStorage.getItem('auth_redirect_uri');
const requestBody = {
  grant_type: 'authorization_code',
  code: authCode,
  redirect_uri: storedRedirectUri, // ✅ Guaranteed match!
  // ... other params
};
```

---

## 🔧 Files to Fix

### High Priority (Authorization Flows):
1. **useAuthorizationCodeFlowController.ts** ← OAuth/OIDC Auth Code
2. **useHybridFlowController.ts** ← Hybrid flow
3. **useImplicitFlowController.ts** ← Implicit flow (callback validation)

### Medium Priority (Other Flows):
4. **useDeviceAuthorizationFlow.ts** ← Device flow
5. **useWorkerTokenFlow.ts** ← Worker token flow
6. **useJWTBearerFlow.ts** ← JWT Bearer flow

### Helper Functions:
7. **Create utility:** `src/utils/redirectUriHelpers.ts`
   - `storeRedirectUriFromAuthUrl(authUrl, flowKey)`
   - `getStoredRedirectUri(flowKey)`
   - `clearRedirectUri(flowKey)`

---

## 📝 Implementation Details

### Utility Helper:
```typescript
// src/utils/redirectUriHelpers.ts
export function storeRedirectUriFromAuthUrl(authUrl: string, flowKey: string): string | null {
  try {
    const url = new URL(authUrl);
    const redirectUri = url.searchParams.get('redirect_uri');
    
    if (redirectUri) {
      const storageKey = `${flowKey}_actual_redirect_uri`;
      sessionStorage.setItem(storageKey, redirectUri);
      console.log(`🔐 [RedirectURI] Stored from auth URL: ${redirectUri}`);
      return redirectUri;
    }
    return null;
  } catch (error) {
    console.error('Failed to extract redirect_uri from auth URL:', error);
    return null;
  }
}

export function getStoredRedirectUri(flowKey: string, fallback?: string): string {
  const storageKey = `${flowKey}_actual_redirect_uri`;
  const stored = sessionStorage.getItem(storageKey);
  
  if (stored) {
    console.log(`🔐 [RedirectURI] Retrieved stored: ${stored}`);
    return stored;
  }
  
  console.warn(`⚠️ [RedirectURI] No stored value, using fallback: ${fallback}`);
  return fallback || '';
}

export function clearRedirectUri(flowKey: string): void {
  const storageKey = `${flowKey}_actual_redirect_uri`;
  sessionStorage.removeItem(storageKey);
  console.log(`🗑️ [RedirectURI] Cleared for ${flowKey}`);
}
```

### Authorization Code Flow Fix:
```typescript
// In generateAuthorizationUrl():
const authUrl = `${authEndpoint}?${params.toString()}`;
setAuthUrl(authUrl);

// ✅ NEW: Store the exact redirect_uri from the URL
storeRedirectUriFromAuthUrl(authUrl, flowKey);

// In exchangeAuthorizationCode():
// ✅ OLD: redirect_uri: credentials.redirectUri.trim(),
// ✅ NEW: redirect_uri: getStoredRedirectUri(flowKey, credentials.redirectUri),
```

---

## 🧪 Testing Checklist

For each flow:
- [ ] Generate authorization URL
- [ ] Verify redirect_uri is stored
- [ ] Complete authorization
- [ ] Verify token exchange uses stored redirect_uri
- [ ] Test with trailing slash variations
- [ ] Test with different protocols (http/https)
- [ ] Test with ports (localhost:3000)
- [ ] Test with encoded characters

---

## 🎯 Success Criteria

1. **Zero redirect_uri mismatch errors** across all flows
2. **Token exchange** always uses exact same value as authorization request
3. **Consistent behavior** regardless of:
   - Manual credential updates
   - URL encoding differences
   - Trailing slashes
   - Protocol changes

---

## ⚡ Quick Fix Priority Order

1. **useAuthorizationCodeFlowController.ts** (OAuth & OIDC Auth Code) ← FIRST
2. **useHybridFlowController.ts** (Hybrid flow)
3. **useImplicitFlowController.ts** (Implicit flow)
4. Create utility helpers
5. Apply to remaining flows

---

**Let's fix this now! 🚀**

