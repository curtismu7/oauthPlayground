# Critical Fix: Credential Loading Priority

**Date:** October 11, 2025  
**Issue:** All flows consistently loading wrong credentials on refresh  
**Root Cause:** FlowCredentialService prioritizing shared credentials over flow-specific credentials

## Problem

### User Report:
> "make sure that all flows are pulling the right credentials from storage. There is no override, it is consistently wrong on refresh"

### Root Cause:

In `src/services/flowCredentialService.ts` (lines 201-214), the `loadFlowCredentials` function was:

1. Loading **shared credentials** (same across all flows) FIRST
2. Loading **flow-specific credentials** SECOND
3. **Always prioritizing shared credentials** over flow-specific credentials

**Before (WRONG):**
```typescript
// Load from credentialManager (shared across flows) - PRIMARY SOURCE
const sharedCredentials = await loadSharedCredentials(flowKey, defaultCredentials);

// Load flow-specific state from localStorage
const flowState = loadFlowState<T>(flowKey);

// Merge: shared credentials take precedence over flow-specific state
let finalCredentials: StepCredentials | null = null;

if (sharedCredentials) {
    finalCredentials = sharedCredentials;  // ❌ ALWAYS uses shared credentials
} else if (flowState?.credentials) {
    finalCredentials = flowState.credentials;
}
```

**Impact:**
- User saves credentials for Flow A (saved to shared + flow-specific storage)
- User navigates to Flow B
- Flow B loads credentials... gets Flow A's credentials! ❌
- User saves different credentials for Flow B
- User refreshes Flow A... gets Flow B's credentials! ❌

**All flows were overriding each other's credentials because shared credentials had priority.**

## Solution

**Invert the priority:**
1. **Flow-specific credentials** take precedence (PRIMARY SOURCE)
2. **Shared credentials** only used as fallback (SECONDARY SOURCE)

**After (CORRECT):**
```typescript
// Load flow-specific state from localStorage - PRIMARY SOURCE
const flowState = loadFlowState<T>(flowKey);

// Load from credentialManager (shared across flows) - FALLBACK ONLY
const sharedCredentials = await loadSharedCredentials(flowKey, defaultCredentials);

// Priority: flow-specific credentials take precedence over shared credentials
// This ensures each flow maintains its own credentials on refresh
let finalCredentials: StepCredentials | null = null;

if (flowState?.credentials && (flowState.credentials.environmentId || flowState.credentials.clientId)) {
    // ✅ Use flow-specific credentials if they exist and have data
    finalCredentials = flowState.credentials;
    console.log(`[FlowCredentialService:${flowKey}] Using flow-specific credentials from localStorage`);
} else if (sharedCredentials) {
    // ✅ Fall back to shared credentials only if no flow-specific credentials exist
    finalCredentials = sharedCredentials;
    console.log(`[FlowCredentialService:${flowKey}] Using shared credentials (no flow-specific credentials found)`);
}
```

## Benefits

✅ **Each flow maintains its own credentials** on refresh  
✅ **Flow A credentials don't override Flow B credentials**  
✅ **Backward compatible** - shared credentials still work as fallback  
✅ **Explicit logging** - shows which source is being used  

## Affected Flows

**All flows using FlowCredentialService.loadFlowCredentials:**

### ✅ Fixed:
- Authorization Code Flow V6 (OAuth & OIDC)
- Client Credentials Flow V6
- Implicit Flow V6
- Worker Token Flow V6
- Hybrid Flow V6
- RAR Flow V6
- PingOne PAR Flow V6

### Testing Required:
1. Save credentials for Authorization Code Flow
2. Navigate to Client Credentials Flow
3. Save different credentials
4. **Refresh Authorization Code Flow**
5. **Verify:** Authorization Code Flow has its OWN credentials ✅
6. **Verify:** Client Credentials Flow has its OWN credentials ✅

## Expected Behavior Now

### Before Fix:
1. Save credentials in Flow A (Client ID: A-123)
2. Save credentials in Flow B (Client ID: B-456)
3. Refresh Flow A
4. ❌ Flow A shows Client ID: B-456 (WRONG!)

### After Fix:
1. Save credentials in Flow A (Client ID: A-123)
2. Save credentials in Flow B (Client ID: B-456)
3. Refresh Flow A
4. ✅ Flow A shows Client ID: A-123 (CORRECT!)
5. Refresh Flow B
6. ✅ Flow B shows Client ID: B-456 (CORRECT!)

## Technical Details

**Storage Structure:**

1. **Flow-Specific Storage** (localStorage):
   - Key: `flowKey` (e.g., `"oauth-authorization-code-v6"`)
   - Contains: `{ credentials, flowConfig, tokens, flowVariant, timestamp }`
   - **Unique per flow** ✅

2. **Shared Storage** (credentialManager):
   - Keys: `pingone_config`, `pingone_permanent_credentials`, etc.
   - Contains: Generic credentials used across flows
   - **Same for all flows** ⚠️

**Priority Now:**
1. Check flow-specific storage FIRST
2. Only use shared storage if flow-specific doesn't exist
3. Log which source is used for debugging

---

**Status:** ✅ **FIXED**  
**Linter Errors:** 0  
**Impact:** Critical - affects all V6 flows  
**Testing:** Required - verify each flow maintains its own credentials on refresh

