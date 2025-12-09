# Plan: Fix Passkey Verify-Authentication Endpoint & NO_USABLE_DEVICES Error Handling

## Problem Analysis

### Current Issues:
1. **Backend verify-authentication endpoint** doesn't properly follow PingOne's device authentication flow:
   - It tries to verify WebAuthn assertion directly without selecting the device first
   - It doesn't find the FIDO2 device that matches the credentialId
   - It doesn't handle device selection step

2. **NO_USABLE_DEVICES errors** are not handled gracefully:
   - No parsing of unavailableDevices from error responses
   - No user-friendly modal to explain device failures
   - Users don't know which devices are locked/unavailable

## Solution Plan

### Phase 1: Fix Backend Verify-Authentication Endpoint

**Current Flow (Incorrect):**
1. Initialize device authentication
2. Try to verify WebAuthn assertion directly ❌

**Correct Flow:**
1. Initialize device authentication
2. Get list of available devices from response
3. Find FIDO2 device that matches credentialId (or use device from response)
4. Select device for authentication (if needed)
5. Verify WebAuthn assertion with PingOne
6. Complete authentication

**Implementation:**
- Update `/api/auth/passkey/verify-authentication` endpoint
- After initializing device auth, check if device selection is needed
- Find FIDO2 device by matching credentialId or use device from auth response
- Select device if status is `DEVICE_SELECTION_REQUIRED`
- Then verify assertion using the correct endpoint

### Phase 2: Add NO_USABLE_DEVICES Error Handling

**Backend Changes:**
- Parse error responses for `NO_USABLE_DEVICES` error code
- Extract `unavailableDevices` array from error response
- Return structured error with device information

**Frontend Changes:**
- Create `DeviceFailureModalV8` component
- Display:
  - Error message (user-friendly)
  - List of unavailable devices with IDs
  - Reason for unavailability (locked, daily limit exceeded, etc.)
  - Actions: "Unlock Device", "Try Another Device", "Cancel"

**Integration Points:**
- `passkeyServiceV8.ts` - Handle errors from verify-authentication
- `mfaAuthenticationServiceV8.ts` - Handle errors from all MFA operations
- `MFAAuthenticationMainPageV8.tsx` - Show modal when errors occur
- All MFA flow controllers - Propagate errors to UI

### Phase 3: Error Response Structure

**Backend Error Response Format:**
```json
{
  "error": "NO_USABLE_DEVICES",
  "message": "Couldn't find authenticating device for user: {{userID}}",
  "unavailableDevices": [
    {
      "id": "edccc773-6f31-4d28-a8e1-0f427d9a9df8",
      "type": "SMS",
      "status": "LOCKED",
      "reason": "Too many invalid OTP retries"
    }
  ],
  "status": "FAILED"
}
```

## Implementation Steps

1. ✅ Review current verify-authentication endpoint
2. ⏳ Fix verify-authentication to follow proper PingOne flow
3. ⏳ Add error parsing for NO_USABLE_DEVICES in backend
4. ⏳ Create DeviceFailureModalV8 component
5. ⏳ Integrate error handling into passkey service
6. ⏳ Integrate error handling into MFA authentication service
7. ⏳ Add modal display logic to MFAAuthenticationMainPageV8
8. ⏳ Test with locked devices and daily limit scenarios

