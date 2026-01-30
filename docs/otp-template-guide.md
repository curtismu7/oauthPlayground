# OTP Template Guide - Reusable OTP Activation for All Device Types

## Overview

The `UnifiedOTPActivationTemplate` is a comprehensive, reusable component designed to handle OTP (One-Time Password) activation for all device types in the PingOne MFA system. This template ensures consistent user experience and behavior across SMS, Email, WhatsApp, Voice, and TOTP flows.

## 🎯 Purpose

- **Consistency**: Same UX/UX across all OTP-based device types
- **Reusability**: Single component handles multiple device types
- **Maintainability**: Changes to OTP flow only need to be made in one place
- **Accessibility**: Full keyboard navigation and screen reader support
- **User Experience**: Modern, intuitive interface with clear feedback

## 📱 Supported Device Types

| Device Type | Icon | Color | Instructions | Context |
|-------------|------|-------|--------------|---------|
| **SMS** | 📱 | Blue | Enter the 6-digit code sent to your mobile phone via SMS | Codes expire after 10 minutes. Check your signal if you don't receive the code. |
| **Email** | 📧 | Green | Enter the 6-digit code sent to your email address | Check your spam folder if you don't see the email in your inbox. |
| **WhatsApp** | 💬 | Success | Enter the 6-digit code sent via WhatsApp | Make sure WhatsApp is installed and you have internet connectivity. |
| **Voice** | 📞 | Warning | Enter the 6-digit code from the voice call | Listen carefully and have a pen ready. The code will be read twice. |
| **TOTP** | 🔐 | Info | Enter the current 6-digit code from your authenticator app | Codes refresh every 30 seconds. Wait for a new code if time is running out. |

## 🔧 Technical Implementation

### Component Structure

```typescript
interface UnifiedOTPActivationTemplateProps {
  deviceType: OTPDeviceType;           // SMS, EMAIL, WHATSAPP, VOICE, TOTP
  deviceDisplayName: string;          // "SMS OTP", "Email OTP", etc.
  instructions: string;                // Custom instructions
  contextText?: string;               // Additional help text
  onValidateOtp: (otp: string) => Promise<void>;  // Validation callback
  onResendOtp: () => Promise<void>;   // Resend callback
  isLoading: boolean;                 // Loading state
  otpError: string | null;            // Current error
  canResend: boolean;                 // Resend availability
  resendCooldown: number;             // Cooldown seconds
  otp: string;                        // Current OTP value
  onOtpChange: (value: string) => void; // OTP change handler
  validationAttempts: number;         // Current attempts
  maxAttempts?: number;               // Max allowed attempts (default: 3)
}
```

### Device-Specific Configurations

Each device type has its own configuration in `DEVICE_CONFIGS`:

```typescript
const DEVICE_CONFIGS = {
  SMS: {
    icon: '📱',
    color: colors.primary,
    instructions: 'Enter the 6-digit code sent to your mobile phone via SMS',
    contextText: 'Codes expire after 10 minutes. Check your signal if you don\'t receive the code.',
    resendText: 'Resend SMS',
  },
  // ... other device types
};
```

## 🚀 Usage Examples

### Basic Usage (SMS)

```typescript
<UnifiedOTPActivationTemplate
  deviceType="SMS"
  deviceDisplayName="SMS OTP"
  instructions="Enter the 6-digit code sent to your mobile phone via SMS"
  onValidateOtp={async (otp) => {
    await MFAServiceV8.activateDevice({
      environmentId: credentials.environmentId,
      username: credentials.username,
      deviceId: mfaState.deviceId,
      otp: otp,
    });
  }}
  onResendOtp={async () => {
    await MFAServiceV8.sendOTP({
      environmentId: credentials.environmentId,
      username: credentials.username,
      deviceId: mfaState.deviceId,
    });
  }}
  isLoading={isLoading}
  otpError={otpError}
  canResend={canResend}
  resendCooldown={resendCooldown}
  otp={otp}
  onOtpChange={setOtp}
  validationAttempts={validationAttempts}
/>
```

### Custom Instructions (Email)

```typescript
<UnifiedOTPActivationTemplate
  deviceType="EMAIL"
  deviceDisplayName="Email OTP"
  instructions="Enter the 6-digit code sent to your email address"
  contextText="Check your spam folder if you don't see the email in your inbox."
  onValidateOtp={handleEmailValidation}
  onResendOtp={handleEmailResend}
  // ... other props
/>
```

### TOTP with Custom Context

```typescript
<UnifiedOTPActivationTemplate
  deviceType="TOTP"
  deviceDisplayName="Authenticator App (TOTP)"
  instructions="Enter the current 6-digit code from your authenticator app"
  contextText="Codes refresh every 30 seconds. Wait for a new code if time is running out."
  onValidateOtp={handleTOTPValidation}
  // Note: TOTP doesn't use resend, so onResendOtp can be a no-op
  onResendOtp={async () => {
    // For TOTP, this might show QR code again
    setShowQRCode(true);
  }}
  // ... other props
/>
```

## 🔄 Integration with Activation Step

The template is integrated into `UnifiedActivationStep.tsx`:

```typescript
// SMS, Email, WhatsApp, TOTP: Use the unified OTP template
if (config.requiresOTP) {
  return (
    <UnifiedOTPActivationTemplate
      deviceType={config.deviceType}
      deviceDisplayName={config.displayName}
      instructions={getInstructionsForDevice(config)}
      contextText={getContextForDevice(config)}
      onValidateOtp={async (otpCode) => {
        await handleValidateOtp();
      }}
      onResendOtp={async () => {
        await handleResendOtp();
      }}
      // ... pass through all state and handlers
    />
  );
}
```

## 🎨 UI Features

### Input Field
- **6-digit limit**: Automatically restricts to 6 characters
- **Numeric only**: Only allows digits (0-9)
- **Paste support**: Users can paste codes
- **Visual feedback**: Border color changes on focus/error
- **Accessibility**: Proper ARIA labels and descriptions

### Validation
- **Real-time validation**: Immediate feedback on input
- **Error display**: Clear error messages with icons
- **Attempt tracking**: Shows remaining attempts
- **Max attempts**: Prevents infinite retries (default: 3)

### Resend Functionality
- **Cooldown timer**: 60-second countdown between resends
- **Device-specific text**: "Resend SMS", "Resend Email", etc.
- **Disabled state**: Properly disabled during cooldown
- **Success feedback**: Toast notification on successful resend

### Help Section
- **Device-specific tips**: Relevant help for each device type
- **Troubleshooting**: Common issues and solutions
- **Accessibility**: Semantic HTML structure

## 🔐 Security Features

### Input Sanitization
```typescript
const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  // Only allow digits and limit to 6 characters
  const sanitized = value.replace(/\D/g, '').slice(0, 6);
  onOtpChange(sanitized);
}, [onOtpChange]);
```

### Attempt Limiting
```typescript
if (validationAttempts >= maxAttempts) {
  toastV8.error('Maximum attempts reached. Please start over.');
  return;
}
```

### Cooldown Protection
```typescript
// Prevents spamming resend requests
if (!canResend || isLoading) return;
```

## 🧩 Extending for New Device Types

To add a new OTP device type:

### 1. Update Device Type Enum
```typescript
export type OTPDeviceType = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'VOICE' | 'TOTP' | 'NEW_DEVICE';
```

### 2. Add Device Configuration
```typescript
const DEVICE_CONFIGS = {
  // ... existing configs
  NEW_DEVICE: {
    icon: '🆕',
    color: colors.info,
    instructions: 'Enter the 6-digit code from your new device',
    contextText: 'Specific instructions for the new device type',
    resendText: 'Resend to New Device',
  },
};
```

### 3. Update Activation Step
```typescript
// Add context for new device in UnifiedActivationStep.tsx
contextText={
  config.deviceType === 'NEW_DEVICE'
    ? 'Specific instructions for the new device type'
    : // ... existing contexts
}
```

## 📋 Testing Checklist

### Functional Testing
- [ ] OTP input accepts only digits (0-9)
- [ ] OTP input limits to 6 characters
- [ ] Paste functionality works
- [ ] Submit button disabled when OTP < 6 digits
- [ ] Submit button disabled during loading
- [ ] Error messages display correctly
- [ ] Success feedback works
- [ ] Resend button respects cooldown
- [ ] Attempt limiting works
- [ ] Keyboard navigation works

### Device-Specific Testing
- [ ] SMS: Correct instructions and context
- [ ] Email: Correct instructions and context
- [ ] WhatsApp: Correct instructions and context
- [ ] Voice: Correct instructions and context
- [ ] TOTP: Correct instructions and context

### Accessibility Testing
- [ ] Screen reader reads labels correctly
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] ARIA attributes are correct
- [ ] Focus management works
- [ ] Error announcements work

### Visual Testing
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible
- [ ] Loading states clear
- [ ] Error states clear

## 🔄 Migration from Old OTP UI

The old OTP UI has been completely replaced by the template. Key changes:

### Before (Old Implementation)
```typescript
// Custom OTP input for each device type
<div className="otp-input-container">
  <input
    id="otp-input"
    type="text"
    value={otp}
    onChange={(e) => handleOtpChange(e.target.value)}
    // ... lots of custom styling and logic
  />
  {/* Custom error handling */}
  {/* Custom resend button */}
</div>
```

### After (Template Implementation)
```typescript
// Single template handles all OTP devices
<UnifiedOTPActivationTemplate
  deviceType={config.deviceType}
  deviceDisplayName={config.displayName}
  instructions={getInstructionsForDevice(config)}
  onValidateOtp={handleValidateOtp}
  onResendOtp={handleResendOtp}
  // ... pass through state
/>
```

## 🎯 Benefits

### For Developers
- **Single Source of Truth**: All OTP logic in one component
- **Type Safety**: Full TypeScript support
- **Easy Testing**: One component to test instead of multiple
- **Consistent API**: Same props for all device types

### For Users
- **Consistent Experience**: Same interface across all devices
- **Better UX**: Modern, accessible design
- **Clear Feedback**: Helpful error messages and instructions
- **Device-Specific Help**: Relevant tips for each device type

### For Maintenance
- **Easy Updates**: Changes apply to all device types
- **Reduced Bugs**: Less code duplication
- **Better Testing**: Comprehensive test coverage
- **Documentation**: Clear usage examples

## 🔮 Future Enhancements

### Planned Features
- **Biometric OTP**: Face/fingerprint verification
- **QR Code Display**: For TOTP pairing
- **Voice Input**: Speech-to-text OTP entry
- **Auto-Detect**: Automatic SMS code detection
- **Multi-Language**: Internationalization support

### Extension Points
- **Custom Themes**: Configurable color schemes
- **Custom Validators**: Device-specific validation rules
- **Custom Handlers**: Pluggable validation/resend logic
- **Custom UI**: Overridable components

## 📞 Support

For questions or issues with the OTP template:

1. **Documentation**: Check this guide first
2. **Code Examples**: See `UnifiedActivationStep.tsx` for usage
3. **Testing**: Run the test suite for OTP flows
4. **Issues**: Create GitHub issue with device type and error details

---

*Last Updated: v9.2.4*
*Author: Curtis Muir*
*Review Status: Ready for Production*
