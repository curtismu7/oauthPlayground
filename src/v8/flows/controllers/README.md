# MFA Flow Controllers

## Overview

The MFA Flow Controllers provide a modular, maintainable architecture for MFA device flows. This controller pattern separates business logic from UI components, making it easier to:

- **Update logic in one place** - Changes to device registration, OTP sending, or validation happen in the controller
- **Share common functionality** - Base controller handles common operations
- **Test business logic** - Controllers can be tested independently
- **Add new device types** - Simply extend the base controller

## Architecture

```
MFAFlowController (Base)
├── SMSFlowController
├── EmailFlowController
└── [Future: TOTPFlowController, FIDO2FlowController]
```

## Base Controller (`MFAFlowController`)

The base controller provides common operations:

- `loadExistingDevices()` - Load devices for a user
- `registerDevice()` - Register a new device
- `sendOTP()` - Send OTP to registered device
- `validateOTP()` - Validate OTP code
- `handleOTPSendError()` - Handle OTP send errors
- `handleOTPValidationError()` - Handle OTP validation errors

### Abstract Methods (must be implemented by subclasses)

- `filterDevicesByType()` - Filter devices by type
- `validateCredentials()` - Validate step 0 credentials
- `getDeviceRegistrationParams()` - Get device registration parameters

## Device-Specific Controllers

### SMSFlowController

Handles SMS-specific operations:
- Phone number validation (US/Canada vs international)
- Phone number formatting (E.164 format)
- SMS device filtering

**Usage:**
```typescript
import { SMSFlowController } from '@/v8/flows/controllers';

const controller = new SMSFlowController({
  onDeviceRegistered: (deviceId, status) => {
    console.log('Device registered:', deviceId);
  },
  onOTPSent: () => {
    console.log('OTP sent');
  }
});
```

### EmailFlowController

Handles Email-specific operations:
- Email format validation
- Email device filtering

**Usage:**
```typescript
import { EmailFlowController } from '@/v8/flows/controllers';

const controller = new EmailFlowController({
  onDeviceRegistered: (deviceId, status) => {
    console.log('Device registered:', deviceId);
  }
});
```

## Using with React Hook

The `useMFAFlowController` hook simplifies integration:

```typescript
import { useMFAFlowController } from '@/v8/flows/hooks/useMFAFlowController';
import { SMSFlowController } from '@/v8/flows/controllers';

const MyComponent = () => {
  const controller = useMemo(() => new SMSFlowController(), []);
  
  const {
    deviceSelection,
    setDeviceSelection,
    loadDevices,
    otpState,
    setOtpState,
    sendOTP,
    validationState,
    validateOTP,
    registerDevice,
    nav,
  } = useMFAFlowController({
    controller,
    credentials,
    tokenStatus,
    mfaState,
    setMfaState,
    isLoading,
    setIsLoading,
    currentStep: nav.currentStep,
  });

  // Use the controller methods in your component
  return (
    <button onClick={sendOTP}>Send OTP</button>
  );
};
```

## Direct Controller Usage

You can also use controllers directly without the hook:

```typescript
import { SMSFlowController } from '@/v8/flows/controllers';

const controller = new SMSFlowController();

// Load devices
const devices = await controller.loadExistingDevices(credentials, tokenStatus);

// Register device
const result = await controller.registerDevice(credentials, {
  phone: '+1.5125551234',
  name: 'My Phone',
  nickname: 'My Phone',
});

// Send OTP
await controller.sendOTP(
  credentials,
  deviceId,
  otpState,
  setOtpState,
  nav,
  setIsLoading
);

// Validate OTP
const isValid = await controller.validateOTP(
  credentials,
  deviceId,
  otpCode,
  mfaState,
  setMfaState,
  validationState,
  setValidationState,
  nav,
  setIsLoading
);
```

## Adding a New Device Type

To add a new device type (e.g., TOTP):

1. **Create the controller:**
```typescript
// TOTPFlowController.ts
import { MFAFlowController } from './MFAFlowController';

export class TOTPFlowController extends MFAFlowController {
  constructor(callbacks = {}) {
    super('TOTP', callbacks);
  }

  protected filterDevicesByType(devices) {
    return devices.filter(d => d.type === 'TOTP');
  }

  validateCredentials(credentials, tokenStatus, nav) {
    // TOTP-specific validation
    const errors = [];
    // ... validation logic
    nav.setValidationErrors(errors);
    return errors.length === 0;
  }

  getDeviceRegistrationParams(credentials) {
    return {
      // TOTP-specific params
    };
  }
}
```

2. **Export from index.ts:**
```typescript
export { TOTPFlowController } from './TOTPFlowController';
```

3. **Use in your flow component:**
```typescript
const controller = new TOTPFlowController();
```

## Benefits

1. **Separation of Concerns** - Business logic separated from UI
2. **Reusability** - Controllers can be used in different contexts
3. **Testability** - Easy to unit test controller methods
4. **Maintainability** - Changes in one place affect all flows
5. **Extensibility** - Easy to add new device types
6. **Type Safety** - Full TypeScript support

## Migration Guide

To migrate existing flows to use controllers:

1. Import the appropriate controller
2. Replace inline logic with controller methods
3. Use the `useMFAFlowController` hook for state management
4. Update UI components to use controller methods

See the refactored `SMSFlowV8` and `EmailFlowV8` components for examples.

