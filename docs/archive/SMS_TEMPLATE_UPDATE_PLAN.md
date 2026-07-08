# SMS Template Update Plan

## Goal
Update SMSFlow.tsx to follow a clean, template-based pattern that can be reused for EMAIL, WhatsApp, MOBILE, Voice, and TOTP flows.

## Current State
- SMS flow has working implementation with device registration
- Needs to incorporate the patterns from UnifiedOTPActivationTemplate
- Should use default values: `name: 'SMS'`, `nickname: 'MyKnickName'`

## Template Pattern (from UnifiedMFARegistrationFlow)

### 1. Default Field Values
```typescript
const initialFields: Record<DeviceConfigKey, Record<string, string>> = {
  SMS: { name: 'SMS', nickname: 'MyKnickName' },
  EMAIL: { name: 'EMAIL', nickname: 'MyKnickName' },
  TOTP: { name: 'TOTP', nickname: 'MyKnickName' },
  MOBILE: { name: 'MOBILE', nickname: 'MyKnickName' },
  WHATSAPP: { name: 'WHATSAPP', nickname: 'MyKnickName' },
  FIDO2: { name: 'FIDO2', nickname: 'MyKnickName' },
};
```

### 2. Registration Step Pattern
- Step 0: Device Type Selection
- Step 1: Configuration (phone/email input with default name/nickname)
- Step 2: OTP Activation (using UnifiedOTPActivationTemplate)
- Step 3: Success

### 3. OTP Activation Pattern (UnifiedOTPActivationTemplate)
```typescript
<UnifiedOTPActivationTemplate
  deviceType="SMS"
  deviceDisplayName="SMS OTP"
  instructions="Enter the 6-digit code sent to your mobile phone via SMS"
  onValidateOtp={handleValidateOtp}
  onResendOtp={handleResendOtp}
  isLoading={isLoading}
  otpError={otpError}
  canResend={canResend}
  resendCooldown={resendCooldown}
/>
```

## Changes Needed for SMSFlow.tsx

### 1. Add Default Name/Nickname
- Update device registration to include default `name: 'SMS'` and `nickname: 'MyKnickName'`
- Store user-entered deviceName separately from the default name
- Apply nickname after successful registration

### 2. Standardize Configuration Step (Step 1)
Current fields:
- Phone Number (required)
- Country Code (required)
- Device Name (optional) → Should default to 'SMS'
- Nickname → Should default to 'MyKnickName'

### 3. Use UnifiedOTPActivationTemplate for Step 2
Replace custom OTP input UI with:
```typescript
<UnifiedOTPActivationTemplate
  deviceType="SMS"
  deviceDisplayName="SMS OTP"
  instructions="Enter the 6-digit code sent to +1.5125551234"
  contextText="Didn't receive the code? Check your message app or request a new code."
  onValidateOtp={async (otp) => {
    await MFAService.activateDevice({
      environmentId,
      username,
      deviceId: mfaState.deviceId,
      otp,
    });
  }}
  onResendOtp={async () => {
    await MFAService.sendOTP({
      environmentId,
      username,
      deviceId: mfaState.deviceId,
    });
  }}
  isLoading={isLoading}
  otpError={otpError}
  canResend={canResend}
  resendCooldown={resendCooldown}
/>
```

### 4. Worker Token Integration
- Use `useWorkerToken` hook consistently
- Pass `tokenStatus` to child components
- Remove old `MFATokenManager` references

### 5. Success Page Pattern
```typescript
<MFASuccessPage
  data={buildSuccessPageData({
    deviceType: 'SMS',
    deviceId: mfaState.deviceId,
    phoneNumber: credentials.phoneNumber,
    countryCode: credentials.countryCode,
    environmentId: credentials.environmentId,
    username: credentials.username,
  })}
  onContinue={() => navigateToMfaHubWithCleanup(nav)}
/>
```

## Device-Specific Customizations

### SMS
- Phone number + country code input
- Validation: US/Canada requires 10 digits
- Format: `+1.5125551234`
- OTP instructions: "sent to your phone"

### EMAIL
- Email address input
- Validation: Must have @ and domain
- OTP instructions: "sent to your email"
- Context: "Check your spam folder"

### WHATSAPP
- Phone number + country code input
- Same validation as SMS
- OTP instructions: "sent via WhatsApp"
- Icon: 💬

### MOBILE
- Phone number + country code input
- Push notification activation
- May not require OTP entry (auto-activate)

### TOTP
- No phone/email required
- QR code display for setup
- Instructions: "Scan with authenticator app"
- Manual entry key fallback
- OTP instructions: "from your authenticator app"

## Implementation Order

1. ✅ Add default name/nickname to UnifiedDeviceRegistrationForm
2. ⏭️ Update SMSFlow.tsx to use UnifiedOTPActivationTemplate
3. ⏭️ Extract common patterns into reusable components
4. ⏭️ Apply same pattern to EmailFlow.tsx
5. ⏭️ Apply same pattern to WhatsAppFlow.tsx
6. ⏭️ Apply same pattern to TOTPFlow.tsx
7. ⏭️ Apply same pattern to MobileFlow.tsx

## Benefits

1. **Consistency**: All OTP flows have the same UX
2. **Maintainability**: Fix once, apply to all device types
3. **Testability**: Easier to test with standardized patterns
4. **Extensibility**: Easy to add new device types (Voice, etc.)
5. **Default Values**: All devices get sensible defaults for name/nickname

## Files to Update

- ✅ `src/v8/flows/unified/components/UnifiedDeviceRegistrationForm.tsx` (done)
- ⏭️ `src/v8/flows/types/SMSFlow.tsx`
- ⏭️ `src/v8/flows/types/EmailFlow.tsx`
- ⏭️ `src/v8/flows/types/WhatsAppFlow.tsx`
- ⏭️ `src/v8/flows/types/TOTPFlow.tsx`
- ⏭️ `src/v8/flows/types/MobileFlow.tsx`

## Testing Checklist

- [ ] SMS registration with default name/nickname
- [ ] Email registration with default name/nickname
- [ ] WhatsApp registration with default name/nickname
- [ ] TOTP registration with default name/nickname
- [ ] Mobile registration with default name/nickname
- [ ] OTP validation works for all types
- [ ] Resend OTP works with cooldown
- [ ] Success page shows correct data
- [ ] Worker token validation works
- [ ] Device nickname appears in API responses

## Next Steps

1. Review this plan
2. Update SMSFlow.tsx as the template
3. Test SMS flow end-to-end
4. Apply pattern to other device types
5. Update documentation
