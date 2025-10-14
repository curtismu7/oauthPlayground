# OIDC Post-Logout Redirect URI - Fix Status

## ✅ **COMPLETED FIXES**

### 1. **OIDC Implicit Flow V6 (Full) - FIXED** ✅
**File:** `src/pages/flows/OIDCImplicitFlowV6_Full.tsx`
- ✅ Added `onPostLogoutRedirectUriChange` handler (line 622-627)
- ✅ Added default `postLogoutRedirectUri: 'https://localhost:3000/implicit-logout-callback'` to controller
- ✅ Post-Logout Redirect URI field is now **editable**
- ✅ Credentials are saved properly (including redirectUri and postLogoutRedirectUri)

**Controller:** `src/hooks/useImplicitFlowController.ts`
- ✅ Added default value (line 102)

### 2. **OIDC Device Authorization Flow V6 - FIXED** ✅
**File:** `src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx`
- ✅ Added `loginHint` prop (line 999)
- ✅ Added `postLogoutRedirectUri` prop (line 1000)
- ✅ Added `onLoginHintChange` handler (line 1035-1040)
- ✅ Added `onPostLogoutRedirectUriChange` handler (line 1041-1047)

**Controller:** `src/hooks/useDeviceAuthorizationFlow.ts`
- ✅ Updated `DeviceAuthCredentials` interface to include `loginHint` and `postLogoutRedirectUri` (lines 40-41)

---

## ⚠️ **REMAINING WORK**

### 3. **OIDC Authorization Code Flow V6 - NEEDS FIX** ❌
**File:** `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`
**Status:** This flow imports `ComprehensiveCredentialsService` but doesn't seem to use it directly
**Required:**
1. Check if flow is using credentials component correctly
2. Add `postLogoutRedirectUri` prop and handler
3. Add default: `'https://localhost:3000/oidc-logout-callback'`

**Controller:** `src/hooks/useAuthorizationCodeFlowController.ts`
- Currently NO default `postLogoutRedirectUri`
- Needs to add default value

### 4. **OIDC Hybrid Flow V6 - NEEDS FIX** ❌
**File:** `src/pages/flows/OIDCHybridFlowV6.tsx`
**Status:** Uses `ComprehensiveCredentialsService` (2 references found)
**Required:**
1. Add `postLogoutRedirectUri` prop to credentials component
2. Add `onPostLogoutRedirectUriChange` handler
3. Add default: `'https://localhost:3000/hybrid-logout-callback'`

**Controller:** `src/hooks/useHybridFlowController.ts`
- Uses inline default `'https://localhost:3000/hybrid-callback'` for redirectUri
- Needs to add `postLogoutRedirectUri` default

### 5. **OIDC Implicit Flow V6 (Old Version) - NEEDS CHECK** ⚠️
**File:** `src/pages/flows/OIDCImplicitFlowV6.tsx`
**Status:** Doesn't use `ComprehensiveCredentialsService`
**Action:** Check if this is deprecated or needs updating

---

## 📋 **DEFAULT POST-LOGOUT REDIRECT URIs**

Per user requirement: `https://localhost:3000/{flow-type}-logout-callback`

| Flow | Default Post-Logout Redirect URI | Status |
|------|----------------------------------|--------|
| OIDC Implicit | `https://localhost:3000/implicit-logout-callback` | ✅ DONE |
| OIDC Device | (Device flows don't use redirect URIs) | ✅ N/A |
| OIDC Authorization Code | `https://localhost:3000/oidc-logout-callback` | ❌ TODO |
| OIDC Hybrid | `https://localhost:3000/hybrid-logout-callback` | ❌ TODO |

---

## 🔍 **VERIFICATION CHECKLIST**

### For Each Fixed Flow, Verify:
- [ ] Post-Logout Redirect URI field is **visible** in credentials section
- [ ] Post-Logout Redirect URI field is **editable**
- [ ] Default value is pre-populated
- [ ] Changes are saved when "Save Configuration" button is clicked
- [ ] Changes persist across page refreshes
- [ ] Logout button redirects to correct endpoint

---

## 🛠️ **HOW TO COMPLETE REMAINING FIXES**

### Pattern to Follow (Based on Working Examples):

#### 1. **In the Flow Component** (e.g., `OIDCAuthorizationCodeFlowV6.tsx`):

```typescript
// Add to credentials props
postLogoutRedirectUri={controller.credentials?.postLogoutRedirectUri || ''}

// Add handler after other credential handlers
onPostLogoutRedirectUriChange={(value) => {
    const updated = { ...controller.credentials, postLogoutRedirectUri: value };
    controller.setCredentials(updated);
    setCredentials(updated);
    console.log('[OIDC AuthCode V6] Post-Logout Redirect URI updated:', value);
}}
```

#### 2. **In the Controller** (e.g., `useAuthorizationCodeFlowController.ts`):

```typescript
// Add to default credentials function
const createEmptyCredentials = (): StepCredentials => ({
    // ... existing fields
    postLogoutRedirectUri: 'https://localhost:3000/oidc-logout-callback',
    // ... rest of fields
});
```

---

## 🔗 **RELATED FILES**

### Core Interfaces:
- `src/components/steps/CommonSteps.tsx` - `StepCredentials` interface (includes `postLogoutRedirectUri` on line 236)

### Credentials Service:
- `src/services/comprehensiveCredentialsService.tsx` - Already supports `postLogoutRedirectUri` prop and `onPostLogoutRedirectUriChange` handler

---

## 📝 **NOTES**

1. **`StepCredentials` Interface:** Already includes `postLogoutRedirectUri?: string` - no changes needed
2. **`ComprehensiveCredentialsService`:** Already supports both the prop and handler - no changes needed
3. **Credential Saving:** Controllers use `saveCredentials()` which persists all fields including `postLogoutRedirectUri`
4. **Device Flow:** Uses custom `DeviceAuthCredentials` interface (now updated to include the field)

---

## 🎯 **PRIORITY**

1. **HIGH:** Fix OIDC Authorization Code V6 (most commonly used flow)
2. **MEDIUM:** Fix OIDC Hybrid V6
3. **LOW:** Verify/update OIDC Implicit V6 (old version) if still in use
4. **TEST:** Verify logout redirect logic works correctly in all flows

---

**Last Updated:** 2025-10-12
**Status:** 2/4 OIDC flows fixed, 2 remaining

