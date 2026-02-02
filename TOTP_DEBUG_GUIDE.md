# TOTP QR Code Debug Guide

## Current Status
The TOTP flow has been updated to use the unified registration flow. Debug logging has been added to track the QR code data through the system.

## Debug Logs to Check

Open your browser's Developer Console (F12 or Cmd+Opt+I) and look for these logs:

### 1. When Registration Step Loads
```
🔍 [REG-STEP DEBUG] Full config: { deviceType: "TOTP", ... }
🔍 [REG-STEP DEBUG] Component mounted/updated: { deviceType: "TOTP", tokenValid: true, ... }
🔍 [REG-UI DEBUG] Rendering path: { deviceType: "TOTP", hasCustomComponent: false, willUseDynamicForm: true }
```
**What this means**: The registration step is loading correctly and should use DynamicFormRenderer (like SMS/Email)

### 2. When You Click "Next Step" Button
```
🔍 [REG DEBUG] handleRegisterDevice called: { deviceType: "TOTP", fields: {...}, tokenIsValid: true }
🔍 [REG DEBUG] Validation passed, proceeding with registration
[🔄 UNIFIED-REG] Calling controller.registerDevice
[🔄 UNIFIED-REG] Device registered successfully: {...}
```
**What this means**: The registration API call is being made

### 3. After Registration Completes
```
🔍 [TOTP DEBUG] Registration result: {
  deviceId: "xxx",
  qrCode: "data:image/png;base64,...",  ← Should have QR code data
  qrCodeUrl: "data:image/png;base64,...",  ← Should have QR code URL
  secret: "JBSWY3DPEHPK3PXP",  ← Should have TOTP secret
  totpSecret: "JBSWY3DPEHPK3PXP"  ← Should have TOTP secret
}
🔍 [TOTP DEBUG] Updated mfaState: {
  qrCodeUrl: "data:image/png;base64,...",  ← Should be populated
  totpSecret: "JBSWY3DPEHPK3PXP",  ← Should be populated
  showQr: true  ← Should be true
}
```
**What this means**: The API returned QR data and it's being stored in mfaState

### 4. When Activation Step Loads
```
🔍 [TOTP DEBUG] Activation step rendering: {
  qrCodeUrl: "data:image/png;base64,...",  ← Should still be here
  totpSecret: "JBSWY3DPEHPK3PXP",  ← Should still be here
  hasQrData: true  ← Should be true
}
```
**What this means**: The activation step has the QR data and should display it

## Common Issues

### Issue 1: No Registration Logs
**Symptom**: You don't see "handleRegisterDevice called" log
**Solution**: Check if the "Next Step" button is disabled. Look for token warning at bottom of page.

### Issue 2: Validation Failed
**Symptom**: See "Validation failed, errors:" log
**Solution**: Make sure you filled in the device name field

### Issue 3: Registration Result Has No QR Data
**Symptom**: Registration result shows `qrCode: undefined, secret: undefined`
**Solution**: API issue - check:
- Environment ID is set correctly
- Worker token is valid
- MFA policy allows TOTP devices
- Check Network tab in DevTools for the registration API call

### Issue 4: mfaState Not Updated
**Symptom**: Registration result has QR data but mfaState is empty
**Solution**: State management issue - check React DevTools to see mfaState value

### Issue 5: QR Data Lost in Activation
**Symptom**: mfaState was populated after registration but empty in activation
**Solution**: State is not being passed between steps - check MFAFlowBaseV8 props

## Manual Testing Steps

1. **Go to**: `https://localhost:3000/v8/mfa-unified`
2. **Open DevTools Console** (F12 or Cmd+Opt+I)
3. **Select TOTP** from device type list
4. **Enter device name** (e.g., "My Authenticator")
5. **Click "Next Step"** button
6. **Watch console logs** - copy and share what you see
7. **Look for QR code** on the activation page

## Expected Flow

```
Step 0: Configuration
  ↓
Step 1: Registration
  → User enters device name
  → Clicks "Next Step"
  → API call: POST /environments/{envId}/users/{userId}/mfa/totp/devices
  → API returns: { deviceId, qrCode, secret, status }
  → mfaState updated with QR data
  ↓
Step 2: Activation (QR Code Display)
  → Shows QR code image from mfaState.qrCodeUrl
  → Shows manual entry secret from mfaState.totpSecret
  → User scans QR code
  → User enters 6-digit OTP
  → Clicks "Validate OTP"
  ↓
Step 3: Documentation
  ↓
Step 4: Success
```

## Files Modified

1. **DeviceComponentRegistry.tsx**: Set `TOTP: null` to use DynamicFormRenderer
2. **UnifiedRegistrationStep.tsx**: Added debug logs throughout registration
3. **UnifiedActivationStep.tsx**: Added QR display and debug logs
4. **UnifiedDeviceRegistrationForm.tsx**: Removed TOTP from placeholder block

## What to Share

Please share the console output from steps 1-6 above. Look specifically for:
- ❌ Any red error messages
- ⚠️ Any validation failures
- 🔍 The debug logs showing registration result and mfaState
- Any warnings about missing token or environment ID
