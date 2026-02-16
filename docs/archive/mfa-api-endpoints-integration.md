# MFA API Endpoints Integration

**Date:** 2024-11-24  
**Status:** In Progress  
**Version:** 8.0.0

## Overview

This document describes the integration of PingOne MFA API endpoints into the MFA Flow V8, including device activation and pairing code resend functionality.

---

## API Endpoints

### 1. Activate MFA User Device (TOTP)

**Endpoint:** `POST /environments/{environmentId}/users/{userId}/devices/{deviceId}`  
**API Reference:** https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device-oath-token

**Purpose:** Activate a TOTP (Time-based One-Time Password) device after registration.

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

**Service Method:**
```typescript
static async activateTOTPDevice(params: SendOTPParams): Promise<Record<string, unknown>>
```

**Parameters:**
- `environmentId` - PingOne environment ID
- `username` - User's username (used to lookup user ID)
- `deviceId` - Device ID to activate

**Implementation Status:** ✅ Complete
- Service method added to `mfaServiceV8.ts`
- Auto-activation after TOTP device registration
- Manual activation button available in UI (Step 1)
- Full API call tracking and error handling

---

### 2. Resend Pairing Code

**Endpoint:** `POST /environments/{environmentId}/users/{userId}/devices/{deviceId}/otp`  
**API Reference:** https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-resend-pairing-code

**Purpose:** Resend the pairing code for SMS or EMAIL devices when the user doesn't receive the initial code.

**Service Method:**
```typescript
static async resendPairingCode(params: SendOTPParams): Promise<void>
```

**Parameters:**
- `environmentId` - PingOne environment ID
- `username` - User's username (used to lookup user ID)
- `deviceId` - Device ID to resend code for

**Implementation Status:** ✅ Service Complete, 🔄 UI Integration Pending
- Service method added to `mfaServiceV8.ts`
- Backend proxy endpoint exists at `/api/pingone/mfa/resend-pairing-code`
- UI button needs to be added to Step 2 (OTP validation)

---

### 3. Activate MFA User Device (General)

**Endpoint:** `POST /environments/{environmentId}/users/{userId}/devices/{deviceId}`  
**API Reference:** https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device

**Purpose:** Activate any MFA device (SMS, EMAIL, TOTP, FIDO2) by setting its status to ACTIVE.

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

**Implementation Status:** 🔄 Pending
- Same endpoint as TOTP activation but can be used for all device types
- Consider adding a generic `activateDevice()` method
- UI consideration: Should we ask user if they want to validate OTP or just activate?

**Design Decision Needed:**
- **Option A:** Auto-activate all devices after registration (current TOTP behavior)
- **Option B:** Require OTP validation before activation (more secure)
- **Option C:** Let user choose: "Skip validation and activate" vs "Validate with OTP"

---

## Current Implementation

### Service Layer (`src/v8/services/mfaServiceV8.ts`)

#### Activate TOTP Device
```typescript
/**
 * Activate TOTP device (OATH Token)
 * POST /environments/{environmentId}/users/{userId}/devices/{deviceId}
 * @param params - Device activation parameters
 */
static async activateTOTPDevice(params: SendOTPParams): Promise<Record<string, unknown>> {
  // 1. Lookup user by username
  // 2. Get worker token
  // 3. POST to device endpoint with { status: 'ACTIVE' }
  // 4. Track API call
  // 5. Return device data
}
```

#### Resend Pairing Code
```typescript
/**
 * Resend pairing code (for SMS/EMAIL devices)
 * POST /environments/{environmentId}/users/{userId}/devices/{deviceId}/otp
 * @param params - Device parameters
 */
static async resendPairingCode(params: SendOTPParams): Promise<void> {
  // 1. Lookup user by username
  // 2. Get worker token
  // 3. POST to backend proxy endpoint
  // 4. Track API call
  // 5. Handle response
}
```

### Backend Proxy (`server.js`)

```javascript
// Resend Pairing Code endpoint
app.post('/api/pingone/mfa/resend-pairing-code', async (req, res) => {
  const { environmentId, userId, deviceId, workerToken } = req.body;
  
  // POST to PingOne API
  const response = await fetch(
    `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}/otp`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Return response
});
```

---

## UI Integration Plan

### Step 1: Device Registration

**Current:**
- TOTP devices are auto-activated after registration
- Success toast shows "🔐 TOTP device activated!"
- If activation fails, warning toast shows "Device registered but activation failed"

**Enhancement:**
- ✅ Auto-activation working
- ✅ Error handling in place
- ✅ Non-critical failure handling (doesn't break flow)

### Step 2: OTP Validation

**Current:**
- User enters 6-digit OTP code
- "Validate OTP" button submits code
- No way to resend code if not received

**Needed:**
- Add "Resend Pairing Code" button for SMS/EMAIL devices
- Button should be disabled during loading
- Show success toast when code is resent
- Only show for SMS/EMAIL (not TOTP or FIDO2)
- Hide in test mode

**Proposed UI:**
```tsx
{/* Resend Pairing Code button for SMS/EMAIL */}
{(credentials.deviceType === 'SMS' || credentials.deviceType === 'EMAIL') && !testMode && (
  <div style={{ marginBottom: '16px' }}>
    <button
      type="button"
      className="btn btn-secondary"
      disabled={isLoading}
      onClick={async () => {
        await MFAServiceV8.resendPairingCode({
          environmentId: credentials.environmentId,
          username: credentials.username,
          deviceId: mfaState.deviceId,
        });
        toastV8.success(`📨 Code resent to your ${deviceType}!`);
      }}
    >
      📨 Resend Pairing Code
    </button>
    <small>Didn't receive the code? Click to resend</small>
  </div>
)}
```

---

## Design Decisions

### Question: Validation vs. Activation

**Context:** The new endpoint allows activating devices without OTP validation.

**Options:**

#### Option A: Always Validate (Current Behavior)
- **Pro:** More secure - ensures user has access to device
- **Pro:** Consistent with current flow
- **Con:** Extra step for user
- **Use Case:** Production environments, security-critical applications

#### Option B: Skip Validation (Auto-Activate)
- **Pro:** Faster user experience
- **Pro:** Fewer steps
- **Con:** Less secure - doesn't verify device ownership
- **Use Case:** Development, testing, trusted environments

#### Option C: User Choice
- **Pro:** Flexibility for different use cases
- **Pro:** Educational - shows both flows
- **Con:** More complex UI
- **Implementation:** Add checkbox "Skip validation and activate immediately"

**Recommendation:** **Option A (Always Validate)** for production, with Option C available via a setting or test mode flag.

---

## Testing Checklist

### TOTP Activation
- [x] Service method works
- [x] Auto-activation after registration
- [x] Error handling for activation failure
- [x] API call tracking
- [ ] Manual activation button (if needed)

### Resend Pairing Code
- [x] Service method works
- [x] Backend proxy endpoint works
- [ ] UI button in Step 2
- [ ] Button only shows for SMS/EMAIL
- [ ] Button hidden in test mode
- [ ] Success/error toasts
- [ ] Loading state handling

### General Device Activation
- [ ] Design decision made (validate vs. activate)
- [ ] Service method implemented
- [ ] UI integration
- [ ] Works for all device types (SMS, EMAIL, TOTP, FIDO2)

---

## API Call Tracking

Both endpoints include full API call tracking:

```typescript
const callId = apiCallTrackerService.trackApiCall({
  method: 'POST',
  url: endpoint,
  headers: { /* redacted */ },
  body: requestBody,
  step: 'Activate TOTP Device' // or 'Resend Pairing Code'
});

// ... make request ...

apiCallTrackerService.updateApiCallResponse(
  callId,
  {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    data: responseData,
  },
  Date.now() - startTime
);
```

This ensures all API calls are visible in the SuperSimpleApiDisplayV8 component.

---

## Error Handling

### TOTP Activation Errors
- Network errors
- Invalid device ID
- Device already active
- Insufficient permissions

**Handling:** Non-critical - log warning, show toast, continue flow

### Resend Pairing Code Errors
- Network errors
- Invalid device ID
- Device not found
- Rate limiting

**Handling:** Show error toast, allow retry

---

## Security Considerations

1. **Token Redaction:** Worker tokens are redacted in logs and API tracking
2. **User Lookup:** Username is used to lookup user ID (not exposed in URL)
3. **Validation:** OTP validation still required even if device is activated
4. **Rate Limiting:** Backend should implement rate limiting for resend endpoint

---

## Future Enhancements

1. **Rate Limiting UI:** Show countdown timer after resending code
2. **Bulk Activation:** Activate multiple devices at once
3. **Device Status Indicators:** Show active/inactive status in device list
4. **Activation History:** Track when devices were activated
5. **Admin Override:** Allow admins to activate devices without validation

---

## Files Modified

### Service Layer
- ✅ `src/v8/services/mfaServiceV8.ts` - Added `activateTOTPDevice()` and `resendPairingCode()`

### Backend
- ✅ `server.js` - Resend pairing code proxy endpoint exists

### UI Layer
- 🔄 `src/v8/flows/MFAFlowV8.tsx` - Need to add resend button in Step 2

---

## References

- [PingOne MFA API Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/)
- [Activate MFA User Device (OATH Token)](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device-oath-token)
- [Resend Pairing Code](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-resend-pairing-code)
- [Activate MFA User Device (General)](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device)

---

**Last Updated:** 2024-11-24  
**Status:** Service layer complete, UI integration in progress
