# MFA Mobile Restore Document

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Purpose:** Implementation details for restoring the Mobile flow if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when Mobile flows break or regress

---

## Related Documentation

- [MFA Mobile UI Contract](./MFA_MOBILE_UI_CONTRACT.md) - UI behavior contracts
- [MFA Mobile UI Documentation](./MFA_MOBILE_UI_DOC.md) - Complete UI structure
- [MFA Mobile Master Document](../MFA_MOBILE_MASTER.md) - Mobile flow patterns and API details
- [MFA SMS Restore Document](./MFA_SMS_RESTORE.md) - SMS restore details (Mobile uses SMS controller)

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the Mobile MFA flow (`MobileFlowV8.tsx` and `MobileOTPConfigurationPageV8.tsx`). Mobile is implemented as an OTP device type (SMS-based) and uses the SMS flow controller.

---

## File Locations

**Components:**
- `src/v8/flows/types/MobileFlowV8.tsx` - Main Mobile flow component
- `src/v8/flows/types/MobileOTPConfigurationPageV8.tsx` - Mobile configuration page
- `src/v8/pages/MobileRegistrationDocsPageV8.tsx` - Mobile documentation page

**Controllers:**
- `src/v8/flows/controllers/SMSFlowController.ts` - Mobile uses SMS controller

**Services:**
- `src/v8/services/mfaServiceV8.ts` - MFA API calls
- `src/v8/services/mfaAuthenticationServiceV8.ts` - MFA authentication calls

---

## Postman Collection Downloads

### Overview

The MFA documentation page provides a **Postman Collection** download feature that generates a complete Postman collection JSON file with all API calls from the Mobile device registration/authentication flow.

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
    -   Collection: `pingone-mfa-mobile-{flowType}-{date}-collection.json`
    -   Environment: `pingone-mfa-mobile-{flowType}-{date}-environment.json`

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

1. User completes Mobile device registration/authentication flow
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

### 1. Device Type Configuration

**Contract:** Mobile MUST use device type `'MOBILE'` but use SMS controller.

**Correct Implementation:**
```typescript
// In MobileFlowV8.tsx
const deviceType: DeviceType = 'MOBILE';

// In MFAFlowControllerFactory.ts
case 'MOBILE':
    return new SMSFlowController(callbacks); // Uses SMS controller
```

---

### 2. Device Selection Skipping (Registration Flow)

**Contract:** Device selection MUST be skipped during registration flow.

**Correct Implementation:**
```typescript
// In MobileFlowV8.tsx (same as SMS)
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

### 3. Device Name Default Reset

**Contract:** Device name MUST default to "MOBILE" when entering Step 2.

**Correct Implementation:**
```typescript
// In MobileFlowV8.tsx
const step2DeviceNameResetRef = React.useRef<{ step: number; deviceType: string } | null>(null);

const renderStep2Register = useCallback((props: MFAFlowBaseRenderProps) => {
    const { credentials, setCredentials } = props;
    
    // Reset device name to device type when entering Step 2
    if (step2DeviceNameResetRef.current?.step !== nav.currentStep || 
        step2DeviceNameResetRef.current?.deviceType !== 'MOBILE') {
        setCredentials((prev) => ({
            ...prev,
            deviceName: 'MOBILE', // ✅ Always reset to device type
        }));
        step2DeviceNameResetRef.current = {
            step: nav.currentStep,
            deviceType: 'MOBILE',
        };
    }
    
    // ... rest of registration UI
}, [nav.currentStep, setCredentials]);
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

**Symptom:** Device name shows previous value instead of "MOBILE".

**Fix:**
```typescript
// Reset device name when entering Step 2
if (step2DeviceNameResetRef.current?.step !== nav.currentStep) {
    setCredentials((prev) => ({ ...prev, deviceName: 'MOBILE' }));
    step2DeviceNameResetRef.current = { step: nav.currentStep, deviceType: 'MOBILE' };
}
```

### Issue 3: Wrong Controller Used

**Symptom:** Mobile flow doesn't work correctly.

**Fix:**
```typescript
// Ensure Mobile uses SMS controller in factory
case 'MOBILE':
    return new SMSFlowController(callbacks);
```

---

## Testing Checklist

- [ ] Device selection is skipped during registration flow
- [ ] Device name defaults to "MOBILE" when entering Step 2
- [ ] OTP input uses configured length
- [ ] Error messages are user-friendly
- [ ] ACTIVE devices show success page immediately
- [ ] ACTIVATION_REQUIRED devices show OTP input
- [ ] Phone number validation works correctly
- [ ] Country code picker functions properly
- [ ] State preservation works for User Flow
- [ ] Mobile uses SMS controller correctly

---

## Version History

- **v1.0.0** (2026-01-06): Initial Mobile restore document

---

## Notes

- **Device Type:** Mobile is implemented as an OTP device type (SMS-based)
- **Controller:** Uses `SMSFlowController` for business logic
- **Device Selection:** Registration and authentication flows are completely separate
- **Device Name:** Always resets to device type on Step 2
- **OTP Input:** Uses `MFAOTPInput` component with configuration
- **Error Handling:** All errors must be normalized

