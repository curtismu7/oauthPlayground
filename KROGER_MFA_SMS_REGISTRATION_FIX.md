# Kroger MFA SMS Device Registration Fix

## Issue
SMS device registration was failing in the Kroger MFA flow because the base component (`KrogerGroceryStoreMFA.tsx`) was not receiving user credentials when wrapped by the `KrogerGroceryStoreMFA_New.tsx` component.

## Root Cause
The base component was trying to register devices using credentials from its own state:
```typescript
const credentials = {
    accessToken: state.workerToken,
    environmentId: state.credentials.environmentId,
    userId: state.userInfo?.id || state.username  // ❌ These were null/empty when wrapped
};
```

When the component was wrapped by `_New`, the wrapper handled authentication and passed credentials via the `MFAProvider` context, but the base component wasn't using those credentials for device registration.

## Solution
Updated the MFA context and base component to properly share credentials:

### 1. Enhanced MFA Context (`src/contexts/MFAContext.tsx`)
- Added `accessToken`, `environmentId`, and `userId` to the context interface
- Exposed these values in the context provider so child components can access them

### 2. Updated Base Component (`src/pages/flows/KrogerGroceryStoreMFA.tsx`)
- Modified `useMFA()` hook call to extract credentials:
  ```typescript
  const { 
      devices: mfaDevices = [], 
      accessToken: mfaAccessToken, 
      environmentId: mfaEnvironmentId, 
      userId: mfaUserId 
  } = useMFA();
  ```

- Updated `handleRegisterDevice` to use MFA context credentials with fallback:
  ```typescript
  // Use MFA context credentials if available, otherwise fall back to state
  const accessToken = mfaAccessToken || state.workerToken;
  const environmentId = mfaEnvironmentId || state.credentials.environmentId;
  const userId = mfaUserId || state.userInfo?.id || state.username;
  ```

## Benefits
1. **Works in both modes**: The component now works both standalone and when wrapped by `_New`
2. **Proper credential flow**: Credentials flow from the wrapper through the MFA context to the base component
3. **Better error handling**: Clear error message when credentials are missing
4. **Backward compatible**: Falls back to state-based credentials if context is not available

## Testing
To test the fix:
1. Navigate to `/flows/kroger-grocery-store-mfa`
2. Complete authentication (redirectless or redirect mode)
3. Select "Setup SMS Verification"
4. Enter a phone number (e.g., +15551234567)
5. Click "Register Device"
6. ✅ Device should register successfully without "User not found" errors

## Files Changed
- `src/contexts/MFAContext.tsx` - Added credential exposure
- `src/pages/flows/KrogerGroceryStoreMFA.tsx` - Updated to use context credentials

## Related Documentation
- See `test-kroger-mfa.md` for full testing guide
- See `KROGER_MFA_FLOW_COMPLETE.md` for overall flow documentation
