# MFA Email Restore Document

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Purpose:** Implementation details for restoring the Email flow if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when Email flows break or regress

---

## Related Documentation

- [MFA Email UI Contract](./MFA_EMAIL_UI_CONTRACT.md) - UI behavior contracts
- [MFA Email UI Documentation](./MFA_EMAIL_UI_DOC.md) - Complete UI structure
- [MFA OTP/TOTP Master Document](../MFA_OTP_TOTP_MASTER.md) - OTP flow patterns and API details

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the Email MFA flow (`EmailFlowV8.tsx` and `EmailOTPConfigurationPageV8.tsx`).

---

## File Locations

**Components:**
- `src/v8/flows/types/EmailFlowV8.tsx` - Main Email flow component
- `src/v8/flows/types/EmailOTPConfigurationPageV8.tsx` - Email configuration page
- `src/v8/pages/EmailRegistrationDocsPageV8.tsx` - Email documentation page

**Controllers:**
- `src/v8/flows/controllers/EmailFlowController.ts` - Email flow business logic

**Services:**
- `src/v8/services/mfaServiceV8.ts` - MFA API calls
- `src/v8/services/mfaAuthenticationServiceV8.ts` - MFA authentication calls

---

## Critical Implementation Details

### 1. Device Selection Skipping (Registration Flow)

**Contract:** Device selection MUST be skipped during registration flow.

**Correct Implementation:**
```typescript
// In EmailFlowV8.tsx
React.useEffect(() => {
    // Skip device loading during registration flow (when coming from config page)
    if (isConfigured) {
        setDeviceSelection({
            existingDevices: [],
            loadingDevices: false,
            selectedExistingDevice: 'new',
            showRegisterForm: true,
        });
        // Skip to registration step immediately
        if (nav.currentStep === 1) {
            nav.goToStep(2);
        }
        return;
    }
    // ... device loading logic for authentication flow
}, [isConfigured, nav.currentStep]);
```

---

### 2. Device Name Default Reset

**Contract:** Device name MUST default to "EMAIL" when entering Step 2.

**Correct Implementation:**
```typescript
// In EmailFlowV8.tsx
const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);

const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
    const { credentials, setCredentials } = props;
    
    // Reset device name to device type when entering Step 2
    if (step2DeviceNameResetRef.current?.step !== nav.currentStep || 
        step2DeviceNameResetRef.current?.deviceType !== 'EMAIL') {
        setCredentials((prev) => ({
            ...prev,
            deviceName: 'EMAIL', // ✅ Always reset to device type
        }));
        step2DeviceNameResetRef.current = {
            step: nav.currentStep,
            deviceType: 'EMAIL',
        };
    }
    
    // ... rest of registration UI
}, [nav.currentStep, setCredentials]);
```

---

### 3. OTP Input Component Usage

**Contract:** Must use `MFAOTPInput` component with proper configuration.

**Correct Implementation:**
```typescript
import { MFAOTPInput } from '../components/MFAOTPInput';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';

const config = MFAConfigurationServiceV8.loadConfiguration();

<MFAOTPInput
    length={config.otpCodeLength || 6}
    value={otpCode}
    onChange={setOtpCode}
    autoFocus={config.otpInputAutoFocus !== false}
    autoSubmit={config.otpInputAutoSubmit !== false}
    error={validationState.lastValidationError || undefined}
/>
```

---

### 4. Error Message Normalization

**Contract:** All error messages MUST be normalized to user-friendly text.

**Correct Implementation:**
```typescript
const normalizeErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') {
        // Normalize common error messages
        if (error.includes('Invalid OTP') || error.includes('invalid')) {
            return 'Invalid OTP code. Please try again.';
        }
        if (error.includes('LIMIT_EXCEEDED') || error.includes('locked')) {
            return 'Too many failed attempts. Please wait before trying again.';
        }
        return error;
    }
    if (error instanceof Error) {
        return normalizeErrorMessage(error.message);
    }
    return 'An error occurred. Please try again.';
};
```

---

### 5. ACTIVE vs ACTIVATION_REQUIRED Handling

**Contract:** Must handle both device statuses correctly.

**Correct Implementation:**
```typescript
// For ACTIVE devices: Show success page immediately
if (mfaState.deviceStatus === 'ACTIVE' && deviceRegisteredActive) {
    return (
        <MFASuccessPageV8
            deviceType="EMAIL"
            flowType="registration"
            successData={buildSuccessPageData(/* ... */)}
        />
    );
}

// For ACTIVATION_REQUIRED devices: Show OTP input
if (mfaState.deviceStatus === 'ACTIVATION_REQUIRED') {
    return (
        <OTPValidationModal
            otpCode={otpCode}
            onOtpChange={setOtpCode}
            onValidate={handleValidateOTP}
            onResend={handleResendCode}
            error={validationState.lastValidationError}
        />
    );
}
```

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

### Issue 2: Device Name Persists from Previous Registration

**Symptom:** Device name shows previous value instead of "EMAIL".

**Fix:**
```typescript
// Reset device name when entering Step 2
if (step2DeviceNameResetRef.current?.step !== nav.currentStep) {
    setCredentials((prev) => ({ ...prev, deviceName: 'EMAIL' }));
    step2DeviceNameResetRef.current = { step: nav.currentStep, deviceType: 'EMAIL' };
}
```

### Issue 3: OTP Input Not Using Config Length

**Symptom:** OTP input always shows 6 digits regardless of configuration.

**Fix:**
```typescript
// Load configuration and use otpCodeLength
const config = MFAConfigurationServiceV8.loadConfiguration();
<MFAOTPInput length={config.otpCodeLength || 6} ... />
```

### Issue 4: Error Messages Not User-Friendly

**Symptom:** Technical error messages shown to users.

**Fix:**
```typescript
// Normalize all error messages
const userFriendlyError = normalizeErrorMessage(error);
toastV8.error(userFriendlyError);
```

---

## Testing Checklist

- [ ] Device selection is skipped during registration flow
- [ ] Device name defaults to "EMAIL" when entering Step 2
- [ ] OTP input uses configured length
- [ ] Error messages are user-friendly
- [ ] ACTIVE devices show success page immediately
- [ ] ACTIVATION_REQUIRED devices show OTP input
- [ ] Email validation works correctly
- [ ] State preservation works for User Flow

---

## Version History

- **v1.0.0** (2026-01-06): Initial Email restore document

---

## Notes

- **Device Selection:** Registration and authentication flows are completely separate
- **Device Name:** Always resets to device type on Step 2
- **OTP Input:** Uses `MFAOTPInput` component with configuration
- **Error Handling:** All errors must be normalized

