# JWT Bearer & Worker Token Fixes

**Date:** October 11, 2025  
**Scope:** JWT Bearer Token Flow V6 and Worker Token Flow V6

## Issues Fixed

### 1. JWT Bearer Token Flow V6 - OIDC Discovery Not Working ✅ FIXED

**File:** `src/pages/flows/JWTBearerTokenFlowV6.tsx`

**Issues:**
1. Missing `environmentId` state variable
2. No `onDiscoveryComplete` handler
3. No `onEnvironmentIdChange` handler
4. Environment ID hardcoded to empty string

**Impact:**
- OIDC discovery couldn't extract and set environment ID
- Environment ID field not editable

**Fixes Applied:**

#### Added Environment ID State (line 135)
```typescript
const [environmentId, setEnvironmentId] = useState('');
```

#### Added Discovery Handler (lines 340-350)
```typescript
onDiscoveryComplete={(result) => {
    console.log('[JWT Bearer V6] Discovery completed:', result);
    // Extract environment ID from issuer URL if available
    if (result.issuerUrl) {
        const envIdMatch = result.issuerUrl.match(/\/([a-f0-9-]{36})\//i);
        if (envIdMatch && envIdMatch[1]) {
            setEnvironmentId(envIdMatch[1]);
            v4ToastManager.showSuccess('Environment ID extracted from discovery');
        }
    }
}}
```

#### Added Change Handlers (lines 360-363)
```typescript
// Change handlers
onEnvironmentIdChange={setEnvironmentId}
onClientIdChange={setClientId}
onScopesChange={setScopes}
```

#### Enhanced Display Configuration
```typescript
// Discovery props
discoveryPlaceholder="Enter Environment ID, issuer URL, or OIDC provider..."
showProviderInfo={true}

// Field visibility
requireClientSecret={false}
showRedirectUri={false}
showPostLogoutRedirectUri={false}
showLoginHint={false}

// Display config
title="JWT Bearer Configuration"
subtitle="Configure environment, client ID, and scopes"
defaultCollapsed={false}
```

---

### 2. Worker Token Flow V6 - Dead Code Cleanup ✅ FIXED

**File:** `src/pages/flows/WorkerTokenFlowV6.tsx` (lines 488-502)

**Issue:** 
Reference to `controller.tokenRequestData` property that doesn't exist in the controller

**Impact:**
- Dead code that never executes (conditional always false)
- Clutters the codebase
- Could cause confusion for developers

**Fix:**
Removed the entire dead code block:

**Before:**
```typescript
{controller.tokenRequestData && (
    <CollapsibleHeader
        title="Token Request Details"
        subtitle="View the HTTP request sent to PingOne's token endpoint"
        icon={<FiServer size={20} />}
        defaultCollapsed={true}
    >
        {EnhancedApiCallDisplayService.showApiCall(
            controller.tokenRequestData,
            'token-request',
            true,
            true
        )}
    </CollapsibleHeader>
)}
```

**After:**
```typescript
// Removed - tokenRequestData doesn't exist in controller
```

---

## Testing Checklist

### JWT Bearer Token Flow V6
- [ ] OIDC discovery extracts environment ID from issuer URL
- [ ] Environment ID field is editable
- [ ] Client ID field is editable
- [ ] Scopes field is editable
- [ ] Discovery success message appears
- [ ] All fields save and load correctly

### Worker Token Flow V6
- [ ] Flow still works correctly without dead code
- [ ] Token request completes successfully
- [ ] No console errors

---

## Summary

**Total Issues Fixed:** 2  
**Files Modified:** 2  
**Lines Added:** ~40  
**Lines Removed:** ~15  
**Linter Errors:** 0  

Both flows now follow the same patterns as other V6 flows with proper OIDC discovery and editable credential fields.

