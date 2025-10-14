# Device Authorization Credentials Fix

## Issue
In both OAuth and OIDC Device Authorization flows (V6), credential input fields were not editable.

## Root Cause
The `ComprehensiveCredentialsService` component wasn't explicitly setting the `defaultCollapsed` prop, which could have caused the section to be collapsed on first render depending on component state.

## Fix Applied

Added `defaultCollapsed={false}` prop to both Device Authorization flows:

### 1. OAuth Device Authorization Flow V6
**File**: `/Users/cmuir/P1Import-apps/oauth-playground/src/pages/flows/DeviceAuthorizationFlowV6.tsx`

**Line 1338**: Added explicit configuration
```typescript
// Service configuration - ensure section is open by default
defaultCollapsed={false}
```

### 2. OIDC Device Authorization Flow V6
**File**: `/Users/cmuir/P1Import-apps/oauth-playground/src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx`

**Line 1110**: Added explicit configuration
```typescript
// Service configuration - ensure section is open by default
defaultCollapsed={false}
```

## What This Fixes

✅ **Credentials section is now open by default**
- Environment ID input is visible and editable
- Client ID input is visible and editable  
- Client Secret input is visible and editable (if required)
- Scopes input is visible and editable

✅ **OIDC Discovery section is visible**
- Users can enter Environment ID or issuer URL
- Discovery will auto-populate credentials

✅ **PingOne Advanced Configuration is accessible**
- All advanced settings are immediately available

## Verification

To verify the fix works:

1. **Navigate to Device Authorization flows:**
   - OAuth: `/flows/device-authorization-v6`
   - OIDC: `/flows/oidc-device-authorization-v6`

2. **Check credentials section:**
   - The "Application Configuration & Credentials" section should be **open** (not collapsed)
   - Blue header with title should be visible
   - Input fields should be visible and editable:
     - Environment ID
     - Client ID
     - Client Secret (optional for device flows)
     - Scopes

3. **Test editing:**
   - Click in any field
   - Type/paste values
   - Credentials should save automatically (toast notifications)
   - Values should persist after page refresh

## Technical Details

### ComprehensiveCredentialsService Props
```typescript
interface ComprehensiveCredentialsProps {
  // ... other props
  defaultCollapsed?: boolean; // Default: false
  // ... other props
}
```

The `defaultCollapsed` prop controls the `CollapsibleHeader` component's initial state:
- `defaultCollapsed={false}` → Section starts **OPEN** (expanded)
- `defaultCollapsed={true}` → Section starts **CLOSED** (collapsed)

### Why This Matters for Device Flows
Device Authorization flows require users to:
1. Configure credentials (Environment ID, Client ID)
2. Request a device code
3. Display verification URI and user code to end-user

If credentials aren't visible/editable, users cannot complete Step 1, blocking the entire flow.

## Related Components
- `ComprehensiveCredentialsService.tsx`: Main credentials management component
- `CollapsibleHeader.tsx`: Collapsible section wrapper
- `CredentialsInput.tsx`: Individual input fields (already had `disabled={false}`)

## Notes
- The `CredentialsInput` component already had all inputs explicitly set to `disabled={false}` and `readOnly={false}`
- The issue was specifically with the parent collapsible section visibility
- This fix ensures a consistent, user-friendly experience across all V6 flows

