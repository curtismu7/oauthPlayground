# MFA WhatsApp Restore Document

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Purpose:** Implementation details for restoring the WhatsApp flow if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when WhatsApp flows break or regress

---

## Related Documentation

- [MFA WhatsApp UI Contract](./MFA_WHATSAPP_UI_CONTRACT.md) - UI behavior contracts
- [MFA WhatsApp UI Documentation](./MFA_WHATSAPP_UI_DOC.md) - Complete UI structure
- [MFA OTP/TOTP Master Document](../MFA_OTP_TOTP_MASTER.md) - OTP flow patterns and API details

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the WhatsApp MFA flow (`WhatsAppFlowV8.tsx` and `WhatsAppOTPConfigurationPageV8.tsx`). WhatsApp MFA is implemented as an SMS-like MFA factor via PingOne MFA with type = "WHATSAPP".

---

## File Locations

**Components:**
- `src/v8/flows/types/WhatsAppFlowV8.tsx` - Main WhatsApp flow component
- `src/v8/flows/types/WhatsAppOTPConfigurationPageV8.tsx` - WhatsApp configuration page
- `src/v8/pages/WhatsAppRegistrationDocsPageV8.tsx` - WhatsApp documentation page

**Controllers:**
- `src/v8/flows/controllers/WhatsAppFlowController.ts` - WhatsApp flow business logic

**Services:**
- `src/v8/services/mfaServiceV8.ts` - MFA API calls
- `src/v8/services/mfaAuthenticationServiceV8.ts` - MFA authentication calls

---

## Critical Implementation Details

### 1. Device Selection Skipping (Registration Flow)

**Contract:** Device selection MUST be skipped during registration flow.

**Correct Implementation:**
```typescript
// In WhatsAppFlowV8.tsx
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

**Contract:** Device name MUST default to "WHATSAPP" when entering Step 2.

**Correct Implementation:**
```typescript
// In WhatsAppFlowV8.tsx
const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);

const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
    const { credentials, setCredentials } = props;
    
    // Reset device name to device type when entering Step 2
    if (step2DeviceNameResetRef.current?.step !== nav.currentStep || 
        step2DeviceNameResetRef.current?.deviceType !== 'WHATSAPP') {
        setCredentials((prev) => ({
            ...prev,
            deviceName: 'WHATSAPP', // ✅ Always reset to device type
        }));
        step2DeviceNameResetRef.current = {
            step: nav.currentStep,
            deviceType: 'WHATSAPP',
        };
    }
    
    // ... rest of registration UI
}, [nav.currentStep, setCredentials]);
```

---

### 3. WhatsApp Not Enabled Check

**Contract:** Must check if WhatsApp is enabled before registration.

**Correct Implementation:**
```typescript
// In WhatsAppFlowV8.tsx
const [showWhatsAppNotEnabledModal, setShowWhatsAppNotEnabledModal] = useState(false);

const handleRegisterDevice = async () => {
    try {
        // Check if WhatsApp is enabled (this check should be done before registration)
        // If not enabled, show modal
        const result = await MFAServiceV8.registerDevice({
            ...credentials,
            type: 'WHATSAPP',
        });
        
        // ... handle success
    } catch (error) {
        // Check if error is related to WhatsApp not being enabled
        if (error.message?.includes('WhatsApp') || error.message?.includes('not enabled')) {
            setShowWhatsAppNotEnabledModal(true);
            return;
        }
        // ... handle other errors
    }
};
```

---

### 4. OTP Input Component Usage

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

### 5. Error Message Normalization

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

**Symptom:** Device name shows previous value instead of "WHATSAPP".

**Fix:**
```typescript
// Reset device name when entering Step 2
if (step2DeviceNameResetRef.current?.step !== nav.currentStep) {
    setCredentials((prev) => ({ ...prev, deviceName: 'WHATSAPP' }));
    step2DeviceNameResetRef.current = { step: nav.currentStep, deviceType: 'WHATSAPP' };
}
```

### Issue 3: WhatsApp Not Enabled Error Not Handled

**Symptom:** Registration fails without clear error message when WhatsApp is not enabled.

**Fix:**
```typescript
// Check for WhatsApp not enabled error and show modal
if (error.message?.includes('WhatsApp') || error.message?.includes('not enabled')) {
    setShowWhatsAppNotEnabledModal(true);
    return;
}
```

---

## Testing Checklist

- [ ] Device selection is skipped during registration flow
- [ ] Device name defaults to "WHATSAPP" when entering Step 2
- [ ] OTP input uses configured length
- [ ] Error messages are user-friendly
- [ ] ACTIVE devices show success page immediately
- [ ] ACTIVATION_REQUIRED devices show OTP input
- [ ] Phone number validation works correctly
- [ ] Country code picker functions properly
- [ ] State preservation works for User Flow
- [ ] WhatsApp not enabled modal displays correctly

---

## Version History

- **v1.0.0** (2026-01-06): Initial WhatsApp restore document

---

## Notes

- **Device Type:** WhatsApp is implemented as an SMS-like MFA factor via PingOne MFA
- **Messages:** All outbound WhatsApp messages are sent by PingOne using its configured sender
- **Device Selection:** Registration and authentication flows are completely separate
- **Device Name:** Always resets to device type on Step 2
- **OTP Input:** Uses `MFAOTPInput` component with configuration
- **Error Handling:** All errors must be normalized
- **WhatsApp Enabled Check:** Must verify WhatsApp is enabled before registration

