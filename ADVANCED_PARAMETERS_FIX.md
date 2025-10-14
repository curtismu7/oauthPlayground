# Advanced Parameters Page - Header Fix

**Date:** October 11, 2025  
**Issue:** "Configure Advanced Parameters" page showing NO header and behaving weird  
**File:** `src/pages/flows/AdvancedParametersV6.tsx`

## 🐛 The Bug

**Line 211:** Wrong prop name used for FlowHeader component

```typescript
// ❌ WRONG CODE:
<flowHeaderService.FlowHeader
    flowId={`${actualFlowType}-advanced-parameters` as any}
    config={{  // ← WRONG PROP NAME!
        flowType: isOIDCFlow ? 'oidc' : 'oauth',
        title: `${getFlowTitle()} - Advanced Parameters`,
        subtitle: "Configure advanced OAuth 2.0 and OpenID Connect parameters"
    }}
/>
```

## ✅ The Fix

Changed `config` to `customConfig` to match the component's interface:

```typescript
// ✅ CORRECT CODE:
<flowHeaderService.FlowHeader
    flowId={`${actualFlowType}-advanced-parameters` as any}
    customConfig={{  // ← CORRECT PROP NAME!
        flowType: isOIDCFlow ? 'oidc' : 'oauth',
        title: `${getFlowTitle()} - Advanced Parameters`,
        subtitle: "Configure advanced OAuth 2.0 and OpenID Connect parameters"
    }}
/>
```

## 📋 FlowHeader Interface

The FlowHeader component expects these props:

```typescript
export interface FlowHeaderProps {
	flowId?: string;
	flowType?: string;
	customConfig?: Partial<FlowHeaderConfig>;  // ← It's customConfig!
}
```

## 🎯 Why This Caused The Issue

1. ❌ Using `config` as a prop name (doesn't exist in FlowHeaderProps)
2. ❌ FlowHeader received `undefined` for customConfig
3. ❌ Fallback logic in FlowHeader failed
4. ❌ Component returned `null` (no header rendered)
5. ❌ Result: NO HEADER on the page

## ✅ After Fix

- ✅ Header will display correctly with title and subtitle
- ✅ Proper color coding (blue for OAuth, green for OIDC)
- ✅ All sections will work as expected

---

**Status:** ✅ **FIXED**  
**File Modified:** `src/pages/flows/AdvancedParametersV6.tsx`  
**Change:** Line 211: `config={{` → `customConfig={{`

