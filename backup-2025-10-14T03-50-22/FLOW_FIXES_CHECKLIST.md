# Flow Fixes Checklist - Cross-Flow Verification

## Critical Fixes to Verify Across All Flows

This checklist contains all fixes that have been implemented and need to be verified across OAuth, OIDC, and other authorization flows.

---

## 1. ✅ Old Tokens Display Fix

**Issue:** Tokens from previous sessions showing before current exchange

**Fix Required:**
```typescript
// ❌ WRONG - Always shows tokens:
{UnifiedTokenDisplayService.showTokens(controller.tokens, ...)}

// ✅ CORRECT - Only show after exchange:
{tokenExchangeApiCall && controller.tokens && UnifiedTokenDisplayService.showTokens(controller.tokens, ...)}
```

**Condition:** Only display tokens if `tokenExchangeApiCall` is set (meaning exchange happened in current session)

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ✅ FIXED (Line 2436-2445)
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` ✅ FIXED (Line 2580-2589)
- [ ] `src/pages/flows/OAuthImplicitFlowV6.tsx`
- [ ] `src/pages/flows/OIDCImplicitFlowV6.tsx`
- [ ] `src/pages/flows/ClientCredentialsFlowV6.tsx`
- [ ] `src/pages/flows/DeviceAuthorizationFlowV6.tsx`
- [ ] `src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx`
- [ ] Any other flows that display tokens

---

## 2. ⚠️ Claims Parameter - Save & Load

**Issue:** Claims not being saved to storage or loaded on mount

**Applies To:** OIDC flows ONLY (OAuth 2.0 does not support claims parameter)

### Save Fix Required:
```typescript
// ❌ WRONG - Claims not saved:
FlowStorageService.AdvancedParameters.set('flow-id', {
  audience,
  resources,
  promptValues,
  // claimsRequest missing!
});

// ✅ CORRECT - Claims included:
FlowStorageService.AdvancedParameters.set('flow-id', {
  audience,
  resources,
  promptValues,
  claimsRequest  // ✅ Added
});
```

### Load Fix Required:
```typescript
// ❌ WRONG - Claims not loaded:
const saved = FlowStorageService.AdvancedParameters.get('flow-id');
if (saved) {
  setAudience(saved.audience || '');
  setResources(saved.resources || []);
  setPromptValues(saved.promptValues || []);
  // setClaimsRequest missing!
}

// ✅ CORRECT - Claims loaded:
const saved = FlowStorageService.AdvancedParameters.get('flow-id');
if (saved) {
  setAudience(saved.audience || '');
  setResources(saved.resources || []);
  setPromptValues(saved.promptValues || []);
  setClaimsRequest(saved.claimsRequest || null);  // ✅ Added
}
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ⚠️ HAS CLAIMS UI BUT NOT SAVING/LOADING
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` ✅ Should have save/load
- [ ] `src/pages/flows/OIDCImplicitFlowV6.tsx`
- [ ] `src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx`

**Note:** OAuth flows should NOT have ClaimsRequestBuilder at all!

---

## 3. ⚠️ OAuth Flows Should NOT Have Claims

**Issue:** OAuth 2.0 spec does NOT support `claims` parameter (OIDC-only feature)

**Fix Required:** Remove ClaimsRequestBuilder from OAuth flows

```typescript
// ❌ WRONG - OAuth with claims:
<ClaimsRequestBuilder
  value={claimsRequest}
  onChange={setClaimsRequest}
/>

// ✅ CORRECT - No claims in OAuth:
// (Remove the component entirely)
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ❌ HAS CLAIMS (should be removed!)
- [ ] `src/pages/flows/OAuthImplicitFlowV6.tsx` ❌ Might have claims?
- [ ] `src/pages/flows/OAuthDeviceAuthorizationFlowV6.tsx` ❌ Might have claims?

**Expected:**
- OAuth flows = NO ClaimsRequestBuilder
- OIDC flows = YES ClaimsRequestBuilder

---

## 4. ✅ Controller Dependency in useEffect

**Issue:** Missing `controller` in dependency array causes stale flowConfig

**Fix Required:**
```typescript
// ❌ WRONG - Missing controller:
useEffect(() => {
  controller.setFlowConfig({...});
}, [audience, promptValues, claimsRequest]);

// ✅ CORRECT - Controller included:
useEffect(() => {
  controller.setFlowConfig({...});
}, [audience, promptValues, claimsRequest, controller]);  // ✅ Added controller
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ✅ FIXED (Line 728)
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` ✅ FIXED (Line 795)
- [ ] All other flows with advanced parameters

---

## 5. ✅ URL Regeneration After Save

**Issue:** Authorization URL not regenerating after saving parameters

**Fix Required:**
```typescript
const handleSaveAdvancedParams = useCallback(async () => {
  // 1. Save to storage
  FlowStorageService.AdvancedParameters.set('flow-id', {...});
  
  // 2. ✅ Update controller flowConfig IMMEDIATELY
  controller.setFlowConfig({
    ...controller.flowConfig,
    audience,
    prompt: promptValues.join(' '),
    customClaims: claimsRequest || {}  // OIDC only
  });
  
  // 3. ✅ Small delay for state propagation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 4. ✅ Regenerate URL
  await AuthorizationCodeSharedService.Authorization.generateAuthUrl(...);
  
  // 5. ✅ Log the URL
  console.log('🌐 URL:', controller.authUrl);
}, [audience, promptValues, claimsRequest, controller]);
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ✅ Should have this
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` ✅ Should have this
- [ ] All other flows with advanced parameters

---

## 6. ✅ Resources Removed from UI

**Issue:** Resources shown in UI despite PingOne not supporting RFC 8707

**Fix Required:** Remove `ResourceParameterInput` component from all PingOne flows

```typescript
// ❌ WRONG - Resources in UI:
<ResourceParameterInput
  value={resources}
  onChange={setResources}
/>

// ✅ CORRECT - Removed:
// (Component removed entirely)
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ✅ FIXED (removed)
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` ✅ FIXED (removed)
- [ ] All other authorization flows

**Note:** Resources kept in mock/demo flows only

---

## 7. ✅ Token Introspection - Client Secret Check

**Issue:** Introspection not checking for required client secret

**Fix Required:**
```typescript
// ❌ WRONG - Missing client secret check:
if (!credentials.environmentId || !credentials.clientId) {
  throw new Error('Missing credentials');
}

// ✅ CORRECT - Client secret required:
if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
  throw new Error('Client secret required for token introspection');
}
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx`
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`
- [ ] All flows with token introspection

---

## 8. 🔧 Token Introspection - Add Delay

**Issue:** Introspection happening too fast (PingOne might need time to register token)

**Fix Required:**
```typescript
const handleIntrospectToken = useCallback(async (token: string) => {
  // ✅ Wait 500ms for PingOne to register token
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // ... rest of introspection logic
}, [controller.credentials]);
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx`
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`
- [ ] All flows with token introspection

---

## 9. ⚠️ Drag-and-Drop for Claims

**Issue:** Drag-and-drop not working for claim names in ClaimsRequestBuilder

**Component to Check:** `src/components/ClaimsRequestBuilder.tsx`

**Requirements:**
1. ✅ Common claims grid with draggable items
2. ✅ `draggable="true"` on claim items
3. ✅ `onDragStart` handler setting `dataTransfer`
4. ✅ `onDragOver` handler on input fields (prevent default)
5. ✅ `onDrop` handler on input fields to accept claim names

**Expected Behavior:**
- User can drag claim names from the "Common Claims" list
- Drop them into the "Claim Name" input field
- Claim name auto-populates the field

**Files Using ClaimsRequestBuilder:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ❌ Should NOT have this (OAuth doesn't support claims)
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` ✅ Should work
- [ ] `src/pages/flows/OIDCImplicitFlowV6.tsx`
- [ ] `src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx`

---

## 10. ✅ Advanced Parameters State Variables

**Issue:** Missing state variables for advanced parameters

**Required State Variables:**
```typescript
// Core parameters (all flows with advanced params):
const [audience, setAudience] = useState<string>('');
const [promptValues, setPromptValues] = useState<string[]>([]);
const [isSavedAdvancedParams, setIsSavedAdvancedParams] = useState(false);

// OIDC-only parameters:
const [claimsRequest, setClaimsRequest] = useState<ClaimsRequestStructure | null>(null);
const [displayMode, setDisplayMode] = useState<DisplayMode>('page');

// Not used in PingOne flows (demo/mock only):
const [resources, setResources] = useState<string[]>([]);
```

**Files to Check:**
- [ ] All flows with advanced parameters

---

## 11. ✅ Advanced Parameters Imports

**Issue:** Missing imports for advanced parameter components

**Required Imports:**
```typescript
// All flows with advanced params:
import { FlowStorageService } from '../../services/flowStorageService';
import AudienceParameterInput from '../../components/AudienceParameterInput';
import EnhancedPromptSelector from '../../components/EnhancedPromptSelector';

// OIDC flows only:
import ClaimsRequestBuilder, { ClaimsRequestStructure } from '../../components/ClaimsRequestBuilder';
import DisplayParameterSelector, { DisplayMode } from '../../components/DisplayParameterSelector';

// Mock/demo flows only:
import ResourceParameterInput from '../../components/ResourceParameterInput';
```

**Files to Check:**
- [ ] All flows with advanced parameters

---

## 12. ✅ Enhanced API Call Display

**Issue:** Token exchange, introspection, and userinfo API calls not displayed

**Fix Required:**
```typescript
// State for API call tracking:
const [tokenExchangeApiCall, setTokenExchangeApiCall] = useState<EnhancedApiCallData | null>(null);
const [introspectionApiCall, setIntrospectionApiCall] = useState<IntrospectionApiCallData | null>(null);
const [userInfoApiCall, setUserInfoApiCall] = useState<EnhancedApiCallData | null>(null);

// Display API calls:
{tokenExchangeApiCall && (
  <EnhancedApiCallDisplay
    apiCall={tokenExchangeApiCall}
    options={{
      showEducationalNotes: true,
      showFlowContext: true,
      urlHighlightRules: EnhancedApiCallDisplayService.getDefaultHighlightRules('authorization-code')
    }}
  />
)}
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` ✅ Has this
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` ✅ Has this
- [ ] All other flows with token operations

---

## 13. ✅ Authentication Modal Integration

**Issue:** Missing authentication modal before redirecting to PingOne

**Fix Required:**
```typescript
import { AuthenticationModalService } from '../../services/authenticationModalService';

const handleRedirectToPingOne = () => {
  AuthenticationModalService.showModal({
    authorizationUrl: controller.authUrl,
    flowName: 'OAuth Authorization Code Flow',
    onContinue: async () => {
      await controller.handleRedirectAuthorization();
    },
    onCancel: () => {
      console.log('User cancelled');
    },
    redirectMode: 'redirect'
  });
};
```

**Files to Check:**
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx`
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`
- [ ] All flows with PingOne redirect

---

## Summary Table

| Fix | OAuth Authz | OIDC Authz | Priority |
|-----|------------|-----------|----------|
| Old tokens display | ✅ | ✅ | HIGH |
| Claims save/load | ❌ N/A | ⚠️ Check | HIGH |
| Remove claims from OAuth | ❌ Has claims! | N/A | HIGH |
| Controller in deps | ✅ | ✅ | HIGH |
| URL regeneration | ✅ | ✅ | HIGH |
| Resources removed | ✅ | ✅ | MEDIUM |
| Token introspection secret | ⚠️ Check | ⚠️ Check | HIGH |
| Introspection delay | ⚠️ Check | ⚠️ Check | MEDIUM |
| Drag-and-drop claims | ❌ Should remove | ⚠️ Check | MEDIUM |
| API call display | ✅ | ✅ | LOW |
| Auth modal | ⚠️ Check | ⚠️ Check | MEDIUM |

---

## Immediate Actions Required

### 1. OAuth Authorization Code Flow
- [ ] **REMOVE ClaimsRequestBuilder** (OAuth doesn't support claims)
- [ ] Remove `claimsRequest` state variable
- [ ] Remove claims from save/load logic
- [ ] Verify drag-and-drop removed with claims removal

### 2. OIDC Authorization Code Flow
- [ ] **ADD claims to save logic** (Line 739-743)
- [ ] **ADD claims to load logic** (Line 705-711)
- [ ] Verify drag-and-drop works in ClaimsRequestBuilder
- [ ] Test claims appear in authorization URL

### 3. All Flows with Token Introspection
- [ ] Add client secret validation
- [ ] Add 500ms delay before introspection

### 4. Verify Across All Other Flows
- [ ] Check each flow against this checklist
- [ ] Document status in table above
- [ ] Fix any missing implementations

---

## Testing Instructions

For each flow, verify:

1. **Old Tokens:** Navigate to token exchange step before exchanging - no tokens show
2. **Claims (OIDC only):** Add claims, save, refresh page - claims still configured
3. **Drag-and-Drop (OIDC only):** Drag claim from list to input field - populates
4. **URL Regeneration:** Save parameters, check console - new URL generated
5. **Introspection:** Exchange tokens, introspect - shows "active: true"

---

**Created:** October 2025  
**Purpose:** Cross-flow verification of all critical fixes  
**Status:** Documentation complete, implementation verification needed
