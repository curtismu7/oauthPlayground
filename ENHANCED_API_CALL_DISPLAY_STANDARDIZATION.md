# Enhanced API Call Display Standardization - IN PROGRESS

## Overview
Refactoring `EnhancedApiCallDisplay` component to use the standardized `CollapsibleHeader` service with proper color coding and icons across all OAuth/OIDC flows.

## ✅ Completed

### 1. Refactored EnhancedApiCallDisplay Component
**File:** `src/components/EnhancedApiCallDisplay.tsx`

#### Changes Made:
1. **Added imports:**
   - `FiSend`, `FiPackage`, `FiTerminal` icons
   - `CollapsibleHeader` service

2. **Replaced custom collapsible sections with standardized CollapsibleHeader:**

   - **Request Details** → 🔵 Blue theme + `FiSend` icon
     - Headers, query params, request body
     - Theme: `'blue'` (execution/action)
   
   - **Authorization URL (Highlighted)** → 💙 Highlight theme + `FiExternalLink` icon
     - URL with parameter highlighting
     - Theme: `'highlight'` (results/data)
   
   - **cURL Command** → 🔵 Blue theme + `FiTerminal` icon
     - Copy, Open URL, View Code Examples buttons
     - Theme: `'blue'` (execution/action)
   
   - **Response** → 💙 Highlight theme + `FiPackage` icon
     - HTTP status, response data
     - Theme: `'highlight'` (results)
   
   - **Educational Notes** → 🟡 Yellow theme + `FiInfo` icon
     - Flow-specific educational content
     - Theme: `'yellow'` (educational)

3. **Benefits:**
   - ✅ Consistent visual hierarchy across all flows
   - ✅ Color-coded sections for better UX
   - ✅ Standardized expand/collapse behavior
   - ✅ Professional gradients and hover states
   - ✅ Reduced code duplication

## 🔄 In Progress

### 2. Integration in OAuth Authorization Code Flow V6
**File:** `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx`

**Status:** ✅ Already integrated (3 instances)
- Token Exchange API call display (Step 4)
- Token Introspection API call display (Step 5)
- UserInfo Request API call display (Step 5)

### 3. Integration in OIDC Authorization Code Flow V6
**File:** `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`

**Status:** 🔄 Partially integrated
- ✅ Token Introspection API call display (Step 6)
- ❌ Missing: Token Exchange API call display (Step 4)
- ❌ Missing: UserInfo Request API call display

**TODO:**
- Add `tokenExchangeApiCall` state tracking
- Add `userInfoApiCall` state tracking
- Display API calls in Step 4 after token exchange
- Display UserInfo API call after fetch

### 4. Integration in OAuth Implicit Flow V6
**File:** `src/pages/flows/OAuthImplicitFlowV6.tsx`

**Status:** ❌ Not integrated
**TODO:**
- Add `introspectionApiCall` state tracking
- Display API call after token introspection

### 5. Integration in OIDC Implicit Flow V6
**File:** `src/pages/flows/OIDCImplicitFlowV6_Full.tsx`

**Status:** ❌ Not integrated
**TODO:**
- Add `introspectionApiCall` state tracking
- Add `userInfoApiCall` state tracking
- Display API calls after respective operations

## Color Coding Reference

| Section Type | Theme | Color | Icon | Usage |
|--------------|-------|-------|------|-------|
| Request Details | `'blue'` | 🔵 Blue | `FiSend` | Request headers, body, params |
| cURL Command | `'blue'` | 🔵 Blue | `FiTerminal` | Command-line equivalent |
| Authorization URL | `'highlight'` | 💙 Highlight | `FiExternalLink` | Highlighted URL with params |
| Response | `'highlight'` | 💙 Highlight | `FiPackage` | API response data |
| Educational Notes | `'yellow'` | 🟡 Yellow | `FiInfo` | Learning content |

## Implementation Pattern

```typescript
// 1. Add state for API call tracking
const [tokenExchangeApiCall, setTokenExchangeApiCall] = useState<EnhancedApiCallData | null>(null);

// 2. Capture API call data during operation
const apiCallData: EnhancedApiCallData = {
    method: 'POST',
    url: tokenEndpoint,
    headers: { /* ... */ },
    body: { /* ... */ },
    response: {
        status: response.status,
        statusText: response.statusText,
        data: result
    },
    flowType: 'authorization-code',
    stepName: 'Exchange Authorization Code for Tokens',
    description: 'Exchange authorization code for access token and refresh token'
};
setTokenExchangeApiCall(apiCallData);

// 3. Display in UI
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

## Files Modified
1. ✅ `src/components/EnhancedApiCallDisplay.tsx` - Refactored with CollapsibleHeader
2. ✅ `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` - Already integrated
3. 🔄 `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` - Needs token exchange tracking
4. ⏳ `src/pages/flows/OAuthImplicitFlowV6.tsx` - Pending
5. ⏳ `src/pages/flows/OIDCImplicitFlowV6_Full.tsx` - Pending

## Testing Checklist
- [ ] OAuth Authz - Request Details section (blue, FiSend icon)
- [ ] OAuth Authz - cURL Command section (blue, FiTerminal icon)
- [ ] OAuth Authz - Response section (highlight, FiPackage icon)
- [ ] OIDC Authz - Same sections as OAuth
- [ ] OAuth Implicit - Introspection API call display
- [ ] OIDC Implicit - Introspection + UserInfo API call display
- [ ] All sections properly collapsible
- [ ] All sections use correct colors/icons
- [ ] URL highlighting works in Authorization URL section

---
**Date:** October 13, 2025
**Status:** 🔄 IN PROGRESS (40% complete)
**Component:** EnhancedApiCallDisplay
**Service:** CollapsibleHeader integration
