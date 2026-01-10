# MFA TOTP Restore Document

**Last Updated:** 2026-01-27  
**Version:** 1.3.0  
**Purpose:** Implementation details for restoring the TOTP flow if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when TOTP flows break or regress

---

## Related Documentation

- [MFA TOTP UI Contract](./MFA_TOTP_UI_CONTRACT.md) - UI behavior contracts
- [MFA TOTP UI Documentation](./MFA_TOTP_UI_DOC.md) - Complete UI structure
- [MFA TOTP Master Document](../MFA_TOTP_MASTER.md) - TOTP flow patterns and API details

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the TOTP MFA flow (`TOTPFlowV8.tsx` and `TOTPConfigurationPageV8.tsx`).

---

## File Locations

**Components:**
- `src/v8/flows/types/TOTPFlowV8.tsx` - Main TOTP flow component
- `src/v8/flows/types/TOTPConfigurationPageV8.tsx` - TOTP configuration page
- `src/v8/pages/TOTPRegistrationDocsPageV8.tsx` - TOTP documentation page

**Controllers:**
- `src/v8/flows/controllers/TOTPFlowController.ts` - TOTP flow business logic

**Services:**
- `src/v8/services/mfaServiceV8.ts` - MFA API calls
- `src/v8/services/mfaAuthenticationServiceV8.ts` - MFA authentication calls

---

## Postman Collection Downloads

### Overview

The MFA documentation page provides a **Postman Collection** download feature that generates a complete Postman collection JSON file with all API calls from the TOTP device registration/authentication flow.

### Collection Format

The generated Postman collection follows the [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template) format:

- **URL Format**: `{{authPath}}/{{envID}}/deviceAuthentications`, `{{authPath}}/{{envID}}/deviceAuthentications/{id}/otp/check`
- **Variables**: Pre-configured with values from credentials
- **Headers**: Automatically set (Content-Type, Authorization)
- **Request Bodies**: Pre-filled with example data

### Variables Included

| Variable | Value | Type | Source |
|----------|-------|------|--------|
| `authPath` | `https://auth.pingone.com` | `string` | Default (includes protocol) |
| `envID` | Environment ID | `string` | From credentials |
| `workerToken` | Empty | `string` | User fills in |
| `username` | Username | `string` | From credentials |

### Storage

**Postman collections are NOT persisted** - they are generated on-demand when the user clicks "Download Postman Collection" on the documentation page.

### Generation Process

1. **Source**: API calls from the MFA flow documentation
2. **Conversion**: Endpoints converted to Postman format: `{{authPath}}/{{envID}}/path`
3. **Variables**: Extracted from current credentials
4. **Collection Generation**: Postman collection JSON file created with all API requests
5. **Environment Generation**: Postman environment JSON file created with all variables pre-filled
6. **Download**: Both files downloaded:
    -   Collection: `pingone-mfa-totp-{flowType}-{date}-collection.json`
    -   Environment: `pingone-mfa-totp-{flowType}-{date}-environment.json`

### Environment Variables

The generated environment file includes all variables with pre-filled values from credentials:

-   `authPath`: `https://auth.pingone.com` (default, includes protocol)
-   `envID`: Pre-filled from `environmentId` in credentials
-   `username`: Pre-filled from `username` in credentials
-   `workerToken`: Empty (user fills in)
-   `userId`: Empty (filled after user lookup)
-   `deviceId`: Empty (filled after device registration)
-   `deviceAuthenticationPolicyId`: Pre-filled from credentials
-   `deviceAuthenticationId`: Empty (filled after authentication initialization)
-   `otp_code`: Empty (user fills in)

### Usage

1. User completes TOTP device registration/authentication flow
2. User navigates to documentation page
3. User clicks "Download Postman Collection" button
4. Two JSON files are generated and downloaded:
    -   Collection file with all API requests
    -   Environment file with all variables
5. User imports both files into Postman:
    -   Import collection file → All API requests available
    -   Import environment file → All variables pre-configured
6. User selects the imported environment from Postman's environment dropdown
7. User updates environment variables with actual values if needed
8. User can test API calls directly in Postman (variables automatically substituted)

**Reference**: [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)

---

## Critical Implementation Details

### 1. OATH TOTP (RFC 6238) Educational Section

**Contract:** TOTP Configuration Page MUST include educational section about OATH TOTP (RFC 6238).

**Correct Implementation:**
```typescript
// In TOTPConfigurationPageV8.tsx, after Shared Configuration Step
import { FiBook } from 'react-icons/fi';

{/* Education Section */}
<div
    style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    }}
>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <FiBook size={24} color="#3b82f6" />
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
            About OATH TOTP (RFC 6238)
        </h2>
    </div>
    <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
        <p style={{ margin: '0 0 12px 0' }}>
            <strong>OATH TOTP (Time-based One-Time Password, RFC 6238)</strong> is an open standard for generating time-based authentication codes using authenticator apps like Google Authenticator, Authy, or Microsoft Authenticator.
        </p>
        <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
            <li><strong>Phishing-resistant:</strong> Codes are generated locally on your device, making them immune to SMS interception attacks</li>
            <li><strong>Offline-capable:</strong> Doesn't rely on network connectivity - codes are generated using time-based algorithms</li>
            <li><strong>Time-based:</strong> Each 6-digit code is valid for 30 seconds, automatically rotating for enhanced security</li>
            <li><strong>Industry standard:</strong> Based on RFC 6238, ensuring compatibility across different authenticator apps</li>
            <li><strong>Secure storage:</strong> Secret keys are stored securely in your authenticator app and never transmitted</li>
            <li><strong>Easy setup:</strong> Simple QR code scan or manual secret key entry to get started</li>
        </ul>
        <p style={{ margin: '0 0 12px 0' }}>
            <strong>How it works:</strong> After registering your TOTP device, you'll receive a QR code containing your secret key. Scan this QR code with an authenticator app to set up OATH TOTP (RFC 6238). The app will then generate time-based codes that you enter when authenticating.
        </p>
        <p style={{ margin: 0, padding: '12px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
            <strong>📚 Learn more:</strong> OATH TOTP (RFC 6238) is part of the Initiative for Open Authentication (OATH) framework, providing a standardized approach to two-factor authentication. The standard ensures codes are generated using HMAC-SHA1 algorithm with time-based intervals, making it highly secure and widely compatible.
        </p>
    </div>
</div>
```

**Critical Points:**
- **MUST** use terminology "OATH TOTP (RFC 6238)" for educational content
- **MUST** import `FiBook` icon from `react-icons/fi`
- **MUST** include all security benefits listed above
- **MUST** explain how it works with QR code scanning
- **MUST** include "Learn more" note about OATH framework
- **MUST** be placed after Shared Configuration Step, before Action Buttons
- **MUST** match styling of other education sections (white background, 24px padding, 8px border radius)

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Missing educational section
// ❌ WRONG - Using "TOTP" instead of "OATH TOTP (RFC 6238)" in educational content
// ❌ WRONG - Missing security benefits list
// ❌ WRONG - Missing OATH framework information
```

---

### 2. Device Selection Skipping (Registration Flow)

**Contract:** Device selection MUST be completely skipped during registration flow.

**Correct Implementation:**
```typescript
// In TOTPFlowV8.tsx
React.useEffect(() => {
    // Skip device loading during registration flow (when coming from config page)
    if (isConfigured) {
        // For registration flow, skip device selection entirely
        // Navigation to Step 2 is handled in useEffect above
        if (nav.currentStep === 1) {
            nav.goToStep(2);
        }
        return;
    }
    // ... device loading logic for authentication flow
}, [isConfigured, nav.currentStep]);

// In renderStep1WithSelection
if (isConfiguredValue) {
    // For registration flow, skip device selection entirely
    return null;
}
```

---

### 3. QR Code Always Displayed

**Contract:** QR code MUST always be displayed on Step 3, regardless of device status.

**Correct Implementation:**
```typescript
// In TOTPFlowV8.tsx
const renderStep3QrCode = useCallback(() => {
    // Always show QR code modal, regardless of device status
    if (!qrCodeUrl && !totpSecret) {
        // Handle expired secret
        return <TOTPExpiredModalV8 ... />;
    }
    
    return (
        <Modal>
            <QRCodeSVG value={qrCodeUrl} size={256} />
            <SecretDisplay secret={totpSecret} />
            {/* Only show activation OTP if ACTIVATION_REQUIRED */}
            {mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && (
                <MFAOTPInput ... />
            )}
        </Modal>
    );
}, [qrCodeUrl, totpSecret, mfaState.deviceStatus]);
```

---

### 4. Policy Format (Critical)

**Contract:** Policy object MUST contain only `id` (not `type`) when ID is provided.

**Correct Implementation:**
```typescript
// ✅ CORRECT - Policy with ID only
const policy = credentials.deviceAuthenticationPolicyId
    ? { id: credentials.deviceAuthenticationPolicyId }
    : { type: 'DEFAULT' };

// ❌ WRONG - Do not include both id and type
const policy = {
    id: credentials.deviceAuthenticationPolicyId,
    type: 'DEFAULT' // WRONG - causes validation error
};
```

---

### 5. Secret Expiration Handling

**Contract:** Must track secret expiration (30 minutes from device creation).

**Correct Implementation:**
```typescript
// Track secret expiration
const [secretReceivedAt, setSecretReceivedAt] = useState<number | null>(null);
const SECRET_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes

const isSecretExpired = useMemo(() => {
    if (!secretReceivedAt) return false;
    return Date.now() - secretReceivedAt > SECRET_EXPIRATION_MS;
}, [secretReceivedAt]);

// Check expiration before displaying QR code
if (isSecretExpired) {
    return <TOTPExpiredModalV8 ... />;
}
```

---

### 6. Navigation Prevention (Step 3)

**Contract:** Must prevent navigation from Step 3 to Step 4 during registration.

**Correct Implementation:**
```typescript
// In MFAFlowBaseV8.tsx onNext handler
if (nav.currentStep === 3 && deviceType === 'TOTP') {
    const isConfigured = (location.state as { configured?: boolean })?.configured === true;
    if (isConfigured) {
        console.log(`${MODULE_TAG} TOTP registration flow on Step 3. Preventing navigation to Step 4.`);
        // Do nothing, stay on Step 3 (QR code page)
        return;
    }
}
nav.goToNext();
```

### 7. Stuck Device Warning Section

**Contract:** Must display warning section when device is stuck in ACTIVATION_REQUIRED status.

**Correct Implementation:**
```typescript
// In renderStep3QrCode, add stuck device warning section
{mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && mfaState.deviceId && (
  <div
    style={{
      marginTop: '20px',
      padding: '16px',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
    }}
  >
    {/* Warning content */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
      <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
          Device Stuck in Activation Required
        </p>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#7f1d1d', lineHeight: '1.5' }}>
          This device is stuck in "ACTIVATION_REQUIRED" status and needs to be removed before you can start over. 
          Delete this device to return to the hub and register a new one.
        </p>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#991b1b', fontStyle: 'italic' }}>
          💡 <strong>Tip:</strong> If you need to delete multiple devices, use the "Delete All Devices" button below.
        </p>
      </div>
    </div>
    {/* Delete buttons */}
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={async () => {
          if (!mfaState.deviceId || !credentials.username || !credentials.environmentId) {
            toastV8.error('Missing device information. Cannot delete device.');
            return;
          }

          const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
          const confirmed = await uiNotificationServiceV8.confirm({
            title: 'Delete Device',
            message: 'Are you sure you want to delete this device? You can then register a new device.',
            confirmText: 'Delete Device',
            cancelText: 'Cancel',
            severity: 'danger',
          });

          if (!confirmed) return;

          setIsLoading(true);
          try {
            await MFAServiceV8.deleteDevice({
              environmentId: credentials.environmentId,
              username: credentials.username,
              deviceId: mfaState.deviceId,
            });

            toastV8.success('Device deleted successfully. You can now register a new device.');
            
            // Clear device state to allow new registration
            setMfaState((prev) => ({
              ...prev,
              deviceId: '',
              deviceStatus: '',
              totpSecret: '',
              qrCodeUrl: '',
              createdAt: undefined,
            }));
            
            // Reset auto-registration trigger so new device can be registered
            autoRegistrationTriggeredRef.current = false;
            
            // Clear QR code state variables
            setQrCodeUrl('');
            setTotpSecret('');
            
            // Reset modal close flag so QR modal can open again for new device
            userClosedQrModalRef.current = false;
            
            // Close QR modal and navigate to Step 2 to register a new device
            setShowQrModal(false);
            nav.goToStep(2);
          } catch (error) {
            console.error(`${MODULE_TAG} Failed to delete device:`, error);
            toastV8.error(
              `Failed to delete device: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
        style={{
          flex: 1,
          minWidth: '140px',
          padding: '10px 16px',
          background: isLoading ? '#d1d5db' : '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? (
          <>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            Deleting...
          </>
        ) : (
          <>🗑️ Delete Device</>
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          navigate('/v8/delete-all-devices', {
            state: {
              environmentId: credentials.environmentId,
              username: credentials.username,
              deviceType: 'TOTP',
              deviceStatus: 'ACTIVATION_REQUIRED',
            },
          });
        }}
        style={{
          flex: 1,
          minWidth: '140px',
          padding: '10px 16px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        🗑️ Delete All Devices
      </button>
    </div>
    <style>
      {`@keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
      }`}
    </style>
  </div>
)}
```

**Critical Notes:**
- Warning section only appears when `deviceStatus === 'ACTIVATION_REQUIRED'` AND `deviceId` exists AND `!currentQrCodeUrl && !currentTotpSecret`
- After device deletion, warning automatically disappears since `deviceId` is cleared from state
- Delete Device button uses `MFAServiceV8.deleteDevice()` with confirmation modal
- Delete All Devices button navigates to `/v8/delete-all-devices` with pre-filled state
- DeleteAllDevicesUtilityV8 page must read from `location.state` to pre-populate filters

---

## Common Issues and Fixes

### Issue 1: Device Selection Shown During Registration

**Symptom:** Device selection appears when coming from configuration page.

**Fix:**
```typescript
// Ensure isConfigured check is in place
if (isConfigured && nav.currentStep === 1) {
    nav.goToStep(2);
    return null;
}
```

### Issue 2: QR Code Not Displayed

**Symptom:** QR code modal doesn't appear on Step 3.

**Fix:**
```typescript
// Ensure QR code is always shown
if (nav.currentStep === 3) {
    setShowQrModal(true);
}
```

### Issue 3: Policy Validation Error

**Symptom:** "policy must contain either 'id' or 'type'. valid 'type'=[DEFAULT]"

**Fix:**
```typescript
// Use only id OR type, not both
const policy = credentials.deviceAuthenticationPolicyId
    ? { id: credentials.deviceAuthenticationPolicyId }
    : { type: 'DEFAULT' };
```

### Issue 4: Secret Expired

**Symptom:** QR code doesn't display, secret expired.

**Fix:**
```typescript
// Check expiration and show expired modal
if (isSecretExpired) {
    return <TOTPExpiredModalV8 ... />;
}
```

### Issue 5: Device Stuck in ACTIVATION_REQUIRED

**Symptom:** Device is stuck in ACTIVATION_REQUIRED status without QR code/secret, user cannot proceed.

**Fix:**
```typescript
// Add stuck device warning section in renderStep3QrCode
// Only show when device exists AND QR data is missing
{mfaState.deviceStatus === 'ACTIVATION_REQUIRED' && 
 mfaState.deviceId && 
 !currentQrCodeUrl && 
 !currentTotpSecret && (
  // Warning section with delete buttons (see implementation above)
)}
// After deletion, deviceId is cleared, so warning automatically disappears
```

### Issue 6: QR Modal Reopens After Successful OTP Activation

**Symptom:** After successfully activating device with OTP, QR modal reopens instead of showing success page.

**Fix:**
```typescript
// In handleActivateDevice, after successful activation:
// 1. Set userClosedQrModalRef to prevent auto-reopening
userClosedQrModalRef.current = true;

// 2. Update auto-open logic to check device status
if (nav.currentStep === 3 && !showQrModal && mfaState.deviceStatus !== 'ACTIVE') {
  // Only auto-open if device is not ACTIVE
  if ((!isConfigured || mfaState.deviceId) && !userClosedQrModalRef.current) {
    // Auto-open logic
  }
}
// Success page will render when deviceStatus === 'ACTIVE' && !showQrModal
```

---

## Testing Checklist

- [ ] Device selection is completely skipped during registration flow
- [ ] QR code is always displayed on Step 3
- [ ] Secret expiration is tracked correctly
- [ ] Policy format uses only `id` OR `type`, not both
- [ ] Activation OTP only shown if ACTIVATION_REQUIRED
- [ ] Navigation from Step 3 is prevented during registration
- [ ] Secret copy button works correctly
- [ ] "What is this?" button shows education content
- [ ] Stuck device warning appears when deviceStatus === 'ACTIVATION_REQUIRED' AND deviceId exists AND QR code/secret are missing
- [ ] Stuck device warning automatically disappears after device deletion (deviceId is cleared)
- [ ] Delete Device button deletes device, clears state, and navigates to Step 2 to continue registration (does NOT return to hub)
- [ ] Delete All Devices button navigates to delete-all-devices page with pre-filled state
- [ ] DeleteAllDevicesUtilityV8 page reads from location.state to pre-populate filters
- [ ] After successful OTP activation, QR modal does NOT reopen (userClosedQrModalRef is set to true)
- [ ] After successful OTP activation, success page is shown (deviceStatus === 'ACTIVE' && !showQrModal)
- [ ] QR modal auto-open logic checks deviceStatus !== 'ACTIVE' before reopening

---

## Version History

- **v1.3.0** (2026-01-27): Added OATH TOTP (RFC 6238) educational section implementation details with protocol terminology, security benefits, and OATH framework information
- **v1.2.0** (2026-01-06): Fixed stuck device warning condition (only show when QR data missing), fixed QR modal reopening after activation
- **v1.1.0** (2026-01-06): Added stuck device warning section restoration guidance
- **v1.0.0** (2026-01-06): Initial TOTP restore document

---

## Notes

- **Device Selection:** Completely skipped during registration, only shown during authentication
- **QR Code:** Always displayed on Step 3, regardless of device status
- **Secret Expiration:** 30 minutes from device creation
- **Policy Format:** Must contain only `id` (not `type`) when ID is provided
- **Navigation:** Step 3 "Next step" button navigates to OTP validation page
- **Stuck Device Warning:** Automatically appears when device is in ACTIVATION_REQUIRED status AND QR code/secret are missing, provides recovery options. Automatically disappears after device deletion.
- **Post-Activation Navigation:** After successful OTP activation, QR modal is prevented from reopening (userClosedQrModalRef = true), success page is shown instead

