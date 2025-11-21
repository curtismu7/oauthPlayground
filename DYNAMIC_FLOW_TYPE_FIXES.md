# Dynamic Flow Type Fixes

## Issues Found and Fixed

### 1. Hardcoded selectedFlowType (CRITICAL BUG)
**File:** `src/v8u/components/CredentialsFormV8U.tsx`

**Problem:**
```typescript
const selectedFlowType: FlowType = 'oauth-authz';  // Always oauth-authz!
```

This caused ALL flows to behave like authorization code flow, showing PKCE checkbox for implicit flow, etc.

**Fix:**
```typescript
const selectedFlowType: FlowType = flowType as FlowType;  // Use actual flow type
```

### 2. Invalid Default Flow Type
**File:** `src/v8u/components/CredentialsFormV8U.tsx`

**Problem:**
```typescript
const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
  flowType: 'oauth' as const,  // 'oauth' is not a valid FlowType!
  ...
};

const flowType = providedFlowType || config?.flowType || 'oauth';  // Invalid fallback
```

**Fix:**
```typescript
const config = CredentialsServiceV8.getFlowConfig(flowKey) || {
  flowType: 'oauth-authz' as const,  // Valid FlowType
  ...
};

const flowType = providedFlowType || config?.flowType || 'oauth-authz';  // Valid fallback
```

### 3. Wrong Type Cast in UnifiedOAuthFlowV8U
**File:** `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`

**Problem:**
```typescript
<CredentialsFormV8U
  flowKey={flowKey}
  flowType={effectiveFlowType as 'oauth' | 'oidc'}  // Wrong! Casting FlowType to spec version
  ...
/>
```

This was casting a FlowType (`'implicit'`, `'oauth-authz'`, etc.) to a spec version type (`'oauth'` | `'oidc'`).

**Fix:**
```typescript
<CredentialsFormV8U
  flowKey={flowKey}
  flowType={effectiveFlowType}  // Correct! Pass FlowType as-is
  ...
/>
```

### 4. Updated Prop Type Definition
**File:** `src/v8u/components/CredentialsFormV8U.tsx`

**Problem:**
```typescript
export interface CredentialsFormV8UProps {
  flowKey: string;
  flowType?: 'oauth' | 'oidc' | 'client-credentials' | 'device-code' | 'ropc' | 'hybrid' | 'pkce';
  ...
}
```

Mixed spec versions (`'oauth'`, `'oidc'`) with flow types.

**Fix:**
```typescript
export interface CredentialsFormV8UProps {
  flowKey: string;
  flowType?: FlowType;  // Use proper FlowType from SpecVersionServiceV8
  ...
}
```

## Impact

### Before (BROKEN):
- ❌ All flows showed authorization code flow UI
- ❌ Implicit flow showed PKCE checkbox (wrong!)
- ❌ Client credentials flow showed PKCE checkbox (wrong!)
- ❌ Flow-specific features not working correctly
- ❌ Invalid type casts causing confusion

### After (FIXED):
- ✅ Each flow shows correct UI for its type
- ✅ Implicit flow: NO PKCE checkbox
- ✅ Authorization Code flow: PKCE checkbox shown
- ✅ Hybrid flow: PKCE checkbox shown
- ✅ Client Credentials: NO PKCE checkbox
- ✅ ROPC: NO PKCE checkbox
- ✅ Device Code: NO PKCE checkbox
- ✅ All flow-specific features work correctly
- ✅ Proper type safety

## What's Now Dynamic

All these features now correctly adapt based on the flow type prop:

### UI Elements:
- ✅ PKCE checkbox (only for oauth-authz and hybrid)
- ✅ PKCE enforcement info (only for oauth-authz and hybrid)
- ✅ Client secret requirement
- ✅ Redirect URI requirement
- ✅ Response mode education
- ✅ Token endpoint auth method
- ✅ Refresh token support
- ✅ Scope requirements
- ✅ Educational tooltips and messages

### Behavior:
- ✅ Validation rules per flow
- ✅ Field visibility per flow
- ✅ Default values per flow
- ✅ Educational content per flow

## Testing

To verify the fixes work:

### Implicit Flow:
1. Go to Unified V8U → Implicit Flow
2. **Verify:** NO PKCE checkbox shown ✅
3. **Verify:** Response mode shows "fragment (required for security)" ✅
4. **Verify:** Token endpoint auth shows educational note ✅

### Authorization Code Flow:
1. Go to Unified V8U → Authorization Code Flow
2. **Verify:** PKCE checkbox shown ✅
3. **Verify:** Can toggle PKCE on/off ✅
4. **Verify:** Response mode shows "query (default)" ✅

### Client Credentials Flow:
1. Go to Unified V8U → Client Credentials Flow
2. **Verify:** NO PKCE checkbox ✅
3. **Verify:** Client secret required ✅
4. **Verify:** NO redirect URI field ✅

### Hybrid Flow:
1. Go to Unified V8U → Hybrid Flow
2. **Verify:** PKCE checkbox shown ✅
3. **Verify:** Response mode shows "fragment (default for hybrid)" ✅

## Root Cause

The root cause was a hardcoded value from early development:
```typescript
const selectedFlowType: FlowType = 'oauth-authz';  // Line 153
```

This was likely a placeholder during initial development that was never updated to use the actual prop value. This single line caused all flows to behave like authorization code flow.

## Lessons Learned

1. **Always use props, never hardcode:** Even "temporary" hardcoded values can persist
2. **Type safety matters:** The wrong type casts hid the bug
3. **Test all flow types:** The bug only showed up when using non-authz flows
4. **Review defaults carefully:** Default values should be valid for the type

## Files Changed

1. `src/v8u/components/CredentialsFormV8U.tsx`
   - Fixed `selectedFlowType` to use prop
   - Fixed default `flowType` value
   - Updated prop type definition

2. `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`
   - Removed wrong type cast
   - Pass FlowType correctly

## Summary

Fixed critical bug where all flows were showing authorization code flow UI due to hardcoded `selectedFlowType`. Now all flow-specific features (PKCE checkbox, validation, educational content, etc.) correctly adapt based on the actual flow type prop. Each flow now shows the appropriate UI and behaves correctly according to its OAuth/OIDC specification.
