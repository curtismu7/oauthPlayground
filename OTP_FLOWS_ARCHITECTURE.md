# OTP Flows Architecture (SMS, Email, WhatsApp)

## Summary

**All three OTP flows (SMS, Email, WhatsApp) use the same unified architecture:**
- ✅ Same hook: `useUnifiedOTPFlow`
- ✅ Same services: `MFAServiceV8`
- ✅ Same API paths: All use the same PingOne MFA endpoints
- ✅ Same base controller: `MFAFlowController`
- ✅ **Only difference:** The `deviceType` field (`'SMS'`, `'EMAIL'`, or `'WHATSAPP'`)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Flow Components                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ SMSFlowV8    │  │ EmailFlowV8  │  │ WhatsAppFlowV8│        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │
│         └─────────────────┼─────────────────┘                 │
│                           │                                     │
│                           ▼                                     │
│              ┌────────────────────────┐                        │
│              │  useUnifiedOTPFlow     │                        │
│              │  (Shared Hook)         │                        │
│              └────────────┬────────────┘                        │
│                           │                                     │
│                           ▼                                     │
│              ┌────────────────────────┐                        │
│              │ MFAFlowControllerFactory│                       │
│              │ .create({ deviceType }) │                        │
│              └────────────┬────────────┘                        │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                 │
│         │                 │                 │                 │
│         ▼                 ▼                 ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │SMSController │  │EmailController│ │WhatsAppCtrlr │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │                 │
│         └─────────────────┼─────────────────┘                 │
│                           │                                     │
│                           ▼                                     │
│              ┌────────────────────────┐                        │
│              │  MFAFlowController     │                        │
│              │  (Base Class)          │                        │
│              └────────────┬────────────┘                        │
│                           │                                     │
│                           ▼                                     │
│              ┌────────────────────────┐                        │
│              │    MFAServiceV8        │                        │
│              │  (PingOne API Calls)   │                        │
│              └────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Evidence

### 1. All Flows Use `useUnifiedOTPFlow`

**SMS Flow:**
```typescript
// src/v8/flows/types/SMSFlowV8.tsx:582
const flow = useUnifiedOTPFlow({
    deviceType: 'SMS',
    configPageRoute: '/v8/mfa/register/sms',
});
```

**Email Flow:**
```typescript
// src/v8/flows/types/EmailFlowV8.tsx:267
const flow = useUnifiedOTPFlow({
    deviceType: 'EMAIL',
    configPageRoute: '/v8/mfa/register/email',
});
```

**WhatsApp Flow:**
```typescript
// src/v8/flows/types/WhatsAppFlowV8.tsx:529
const flow = useUnifiedOTPFlow({
    deviceType: 'WHATSAPP',
    configPageRoute: '/v8/mfa/register/whatsapp',
});
```

### 2. Hook Creates Controller via Factory

```typescript
// src/v8/flows/shared/useUnifiedOTPFlow.ts:180
const controller = useMemo(() => 
    MFAFlowControllerFactory.create({ deviceType }), 
    [deviceType]
);
```

### 3. Factory Creates Type-Specific Controllers

```typescript
// src/v8/flows/factories/MFAFlowControllerFactory.ts:53-78
static create(config: ControllerFactoryConfig) {
    const { deviceType, callbacks = {} } = config;
    
    switch (deviceType) {
        case 'SMS':
            return new SMSFlowController(callbacks);
        case 'EMAIL':
            return new EmailFlowController(callbacks);
        case 'WHATSAPP':
            return new WhatsAppFlowController(callbacks);
        // ...
    }
}
```

### 4. All Controllers Extend Same Base Class

```typescript
// src/v8/flows/controllers/SMSFlowController.ts:37
export class SMSFlowController extends MFAFlowController {
    constructor(callbacks: FlowControllerCallbacks = {}) {
        super('SMS', callbacks);  // ← Only difference: deviceType
    }
}

// src/v8/flows/controllers/EmailFlowController.ts
export class EmailFlowController extends MFAFlowController {
    constructor(callbacks: FlowControllerCallbacks = {}) {
        super('EMAIL', callbacks);  // ← Only difference: deviceType
    }
}

// src/v8/flows/controllers/WhatsAppFlowController.ts:45
export class WhatsAppFlowController extends MFAFlowController {
    constructor(callbacks: FlowControllerCallbacks = {}) {
        super('WHATSAPP', callbacks);  // ← Only difference: deviceType
    }
}
```

### 5. Base Controller Uses Same Service

```typescript
// src/v8/flows/controllers/MFAFlowController.ts
// All API calls go through MFAServiceV8:

// Register device
const result = await MFAServiceV8.registerDevice(params);
// params.type = 'SMS' | 'EMAIL' | 'WHATSAPP' (the only difference!)

// Send OTP
const { deviceAuthId, otpCheckUrl } = await MFAServiceV8.sendOTP({...});

// Validate OTP
const result = await MFAServiceV8.validateOTP({...});

// Get devices
const devices = await MFAServiceV8.getAllDevices({...});
```

---

## What Makes Each Flow Different?

### 1. Device Type Field
The **only** difference in API calls is the `type` field:
- SMS: `type: 'SMS'`
- Email: `type: 'EMAIL'`
- WhatsApp: `type: 'WHATSAPP'`

### 2. Contact Field
- SMS/WhatsApp: Use `phoneNumber` + `countryCode`
- Email: Use `email`

### 3. UI Labels
- SMS: "Phone Number", "SMS"
- Email: "Email Address", "Email"
- WhatsApp: "Phone Number", "WhatsApp"

### 4. Phone Validation
- SMS/WhatsApp: Use phone validation utilities
- Email: Use email validation

---

## Why Separate Controller Files?

Each controller has minimal type-specific logic:

1. **Filter devices by type:**
   ```typescript
   // SMSFlowController.ts:42
   protected filterDevicesByType(devices) {
       return devices.filter(d => d.type === 'SMS' || d.type === 'MOBILE');
   }
   
   // WhatsAppFlowController.ts:50
   protected filterDevicesByType(devices) {
       return devices.filter(d => d.type === 'WHATSAPP');
   }
   ```

2. **Type-specific validation:**
   - SMS/WhatsApp: Validate phone numbers
   - Email: Validate email addresses

3. **Type-specific registration params:**
   - SMS/WhatsApp: Include `phone` in registration
   - Email: Include `email` in registration

**But all actual API calls go through the same base controller and service!**

---

## Conclusion

✅ **WhatsApp DOES use `useUnifiedOTPFlow`** - it's already unified!

✅ **All three flows use the same services and paths** - only the `deviceType` field differs

✅ **The architecture is already optimal** - no refactoring needed

The separate controller files exist only for:
- Type-specific filtering
- Type-specific validation
- Type-specific parameter building

But the core API calls, state management, and flow logic are **100% shared** through:
- `useUnifiedOTPFlow` hook
- `MFAFlowController` base class
- `MFAServiceV8` service

