# Callback URL Routing Fix - Implicit Flows V5

**Date:** October 8, 2025  
**Issue:** Token response from PingOne was redirecting from OAuth Implicit V5 to OIDC Implicit V5 flow  
**Status:** ✅ **FIXED**

---

## Problem Description

### Symptoms
When users completed authentication with PingOne:
- OAuth Implicit V5 flow would redirect to OIDC Implicit V5 after receiving tokens
- OIDC Implicit V5 flow would potentially redirect to OAuth Implicit V5
- Users would lose context and end up in the wrong flow

### User Impact
- Confusing user experience with unexpected flow switching
- Loss of flow-specific context and state
- Difficulty testing and debugging specific flow implementations

---

## Root Cause Analysis

### 1. **Missing Route**
```typescript
// ❌ BEFORE: No route for /oidc-implicit-callback
<Route path="/oauth-implicit-callback" element={<ImplicitCallback />} />
// Missing OIDC route!

// ✅ AFTER: Both routes defined
<Route path="/oauth-implicit-callback" element={<ImplicitCallback />} />
<Route path="/oidc-implicit-callback" element={<ImplicitCallback />} />
```

### 2. **Generic Default URLs**
```typescript
// ❌ BEFORE: OIDC using generic callback
redirectUri: 'https://localhost:3000/implicit-callback',

// ✅ AFTER: OIDC using unique callback
redirectUri: 'https://localhost:3000/oidc-implicit-callback',
```

### 3. **Incomplete Callback URL Mapping**
```typescript
// ❌ BEFORE: Missing V5 cases
case 'implicit':
  return `${base}/implicit-callback`;

// ✅ AFTER: Explicit V5 cases
case 'oauth-implicit-v5':
  return `${base}/oauth-implicit-callback`;
case 'oidc-implicit-v5':
  return `${base}/oidc-implicit-callback`;
```

### 4. **Controller Not Using Flow Key**
```typescript
// ❌ BEFORE: Generic fallback
const redirectUri = urlRedirect || getCallbackUrlForFlow('implicit');

// ✅ AFTER: Flow-specific callback
const fallbackFlowType = flowKey || (variant === 'oidc' ? 'oidc-implicit-v5' : 'oauth-implicit-v5');
const redirectUri = urlRedirect || getCallbackUrlForFlow(fallbackFlowType);
```

---

## Solution Implementation

### Files Modified

#### 1. `/src/App.tsx`
**Added missing OIDC Implicit V5 callback route:**
```typescript
<Route path="/oidc-implicit-callback" element={<ImplicitCallback />} />
```

#### 2. `/src/pages/flows/OIDCImplicitFlowV5_Full.tsx`
**Updated default redirect URI:**
```typescript
// Line 295
redirectUri: 'https://localhost:3000/oidc-implicit-callback',
```

#### 3. `/src/utils/callbackUrls.ts`
**Added V5 flow cases to `getCallbackUrlForFlow`:**
```typescript
case 'oauth-implicit-v5':
  return `${base}/oauth-implicit-callback`;
case 'oidc-implicit-v5':
  return `${base}/oidc-implicit-callback`;
```

#### 4. `/src/hooks/useImplicitFlowController.ts`
**Enhanced to use flow key for callback URL determination:**
```typescript
// Updated function signature
const loadInitialCredentials = (variant: FlowVariant, flowKey?: string): StepCredentials => {
  // ...
  const fallbackFlowType = flowKey || (variant === 'oidc' ? 'oidc-implicit-v5' : 'oauth-implicit-v5');
  const redirectUri = urlRedirect || (loaded.redirectUri !== undefined ? loaded.redirectUri : getCallbackUrlForFlow(fallbackFlowType));
  // ...
}

// Updated call to pass flow key
const [credentials, setCredentials] = useState<StepCredentials>(() =>
  loadInitialCredentials(options.defaultFlowVariant ?? 'oidc', flowKey)
);
```

---

## How It Works Now

### OAuth Implicit V5 Flow
1. **Callback URL:** `https://localhost:3000/oauth-implicit-callback`
2. **Session Storage:** `'oauth-implicit-v5-flow-active'` = `'true'`
3. **Return Path:** `/flows/oauth-implicit-v5`
4. **Token Handling:** Tokens preserved in URL fragment

### OIDC Implicit V5 Flow
1. **Callback URL:** `https://localhost:3000/oidc-implicit-callback`
2. **Session Storage:** `'oidc-implicit-v5-flow-active'` = `'true'`
3. **Return Path:** `/flows/oidc-implicit-v5`
4. **Token Handling:** Tokens (including ID token) preserved in URL fragment

### ImplicitCallback Component Logic
```typescript
// Check session storage to determine originating flow
const v5OAuthContext = sessionStorage.getItem('oauth-implicit-v5-flow-active');
const v5OIDCContext = sessionStorage.getItem('oidc-implicit-v5-flow-active');

if (v5OAuthContext || v5OIDCContext) {
  // Determine correct return path
  const targetFlow = v5OIDCContext
    ? '/flows/oidc-implicit-v5'
    : '/flows/oauth-implicit-v5';
  
  // Redirect with tokens in fragment
  const fragment = window.location.hash.substring(1);
  navigate(`${targetFlow}#${fragment}`);
}
```

---

## Testing & Verification

### Test Cases

#### ✅ OAuth Implicit V5
1. Start OAuth Implicit V5 flow
2. Generate authorization URL
3. Authenticate with PingOne
4. **Expected:** Return to `/flows/oauth-implicit-v5` with access token
5. **Result:** ✅ Correct flow maintained

#### ✅ OIDC Implicit V5
1. Start OIDC Implicit V5 flow
2. Generate authorization URL
3. Authenticate with PingOne
4. **Expected:** Return to `/flows/oidc-implicit-v5` with access token and ID token
5. **Result:** ✅ Correct flow maintained

#### ✅ No Cross-Flow Contamination
1. Start in OAuth Implicit V5
2. Complete full flow
3. Navigate to OIDC Implicit V5
4. Complete full flow
5. **Expected:** Each flow maintains its own context
6. **Result:** ✅ No interference between flows

---

## Benefits

### ✅ **User Experience**
- Users stay in their intended flow
- No confusion from unexpected flow switching
- Clear separation between OAuth and OIDC implementations

### ✅ **Developer Experience**
- Easier debugging with isolated flow contexts
- Clear callback URL patterns
- Consistent flow-specific handling

### ✅ **Maintainability**
- Each flow has its own unique callback URL
- Explicit routing for all V5 flows
- Flow key used throughout the chain

### ✅ **Scalability**
- Pattern established for future V5 flows
- Easy to add new flow variants
- Consistent callback URL naming convention

---

## Callback URL Patterns

### Established Convention
```
OAuth Implicit V5:  /oauth-implicit-callback
OIDC Implicit V5:   /oidc-implicit-callback
OAuth Authz V5:     /authz-callback
OIDC Authz V5:      /authz-callback
Hybrid V5:          /hybrid-callback
```

### Flow Key Mapping
```typescript
'oauth-implicit-v5' → '/oauth-implicit-callback'
'oidc-implicit-v5'  → '/oidc-implicit-callback'
'oauth-authorization-code-v5' → '/authz-callback'
```

---

## Related Documentation
- [Main Migration Guide](./COMPREHENSIVE_CREDENTIALS_SERVICE_MIGRATION_GUIDE.md)
- [V5 Flows Synchronization Plan](./V5_FLOWS_SYNCHRONIZATION_PLAN.md)
- [Session Summary 2025-10-08](./SESSION_SUMMARY_2025-10-08.md)

---

## Build Status
✅ **Build Passing:** All changes compiled successfully  
✅ **No Linter Errors:** Code follows project standards  
✅ **Routes Verified:** All callback routes properly configured



