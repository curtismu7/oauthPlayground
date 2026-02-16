# P1MFA Feature Structure

**Version:** 1.0.0  
**Date:** 2025-01-15  
**Status:** ✅ Reorganized

This document describes the reorganized feature-based structure for P1MFA components.

---

## New Structure

```
src/
├── features/
│   └── mfa/
│       ├── EnrollSms.tsx          # SMS device enrollment
│       ├── EnrollFido2.tsx       # FIDO2 device enrollment
│       ├── AuthSms.tsx            # SMS authentication
│       ├── AuthFido2.tsx          # FIDO2 authentication
│       ├── webauthn.ts            # WebAuthn base64url + ArrayBuffer helpers
│       └── index.ts               # Feature exports
├── samples/
│   └── p1mfa/                     # Sample apps (still available)
│       ├── fido2/
│       ├── sms/
│       └── shared/
└── sdk/
    └── p1mfa/                     # SDK (unchanged)
```

---

## Feature Components

### EnrollSms.tsx
**Purpose:** SMS device enrollment component

**Props:**
- `sdk: P1MFASDK` - Initialized SDK instance
- `userId: string` - User ID
- `onDeviceRegistered?: () => void` - Callback when device is registered

**Features:**
- Phone number input
- Device registration
- OTP sending
- Device activation
- Debug panel integration
- State machine tracking

### EnrollFido2.tsx
**Purpose:** FIDO2 device enrollment component

**Props:**
- `sdk: P1MFASDK` - Initialized SDK instance
- `userId: string` - User ID
- `policyId: string` - Device authentication policy ID
- `onDeviceRegistered?: () => void` - Callback when device is registered

**Features:**
- Device registration
- WebAuthn credential creation
- Device activation
- Debug panel integration
- State machine tracking
- WebAuthn credential JSON copy button

### AuthSms.tsx
**Purpose:** SMS authentication component

**Props:**
- `sdk: P1MFASDK` - Initialized SDK instance
- `userId: string` - User ID
- `policyId: string` - Device authentication policy ID
- `deviceId?: string` - Optional device ID

**Features:**
- Authentication initialization
- OTP input and verification
- Debug panel integration
- State machine tracking

### AuthFido2.tsx
**Purpose:** FIDO2 authentication component

**Props:**
- `sdk: P1MFASDK` - Initialized SDK instance
- `userId: string` - User ID
- `policyId: string` - Device authentication policy ID
- `deviceId?: string` - Optional device ID

**Features:**
- Authentication initialization
- WebAuthn assertion
- Debug panel integration
- State machine tracking
- WebAuthn assertion JSON copy button

### webauthn.ts
**Purpose:** WebAuthn utility functions

**Exports:**
- `arrayBufferToBase64Url()` - Convert ArrayBuffer to base64url
- `base64UrlToArrayBuffer()` - Convert base64url to ArrayBuffer
- `numberArrayToUint8Array()` - Convert number array to Uint8Array
- `uint8ArrayToNumberArray()` - Convert Uint8Array to number array
- `credentialToJson()` - Convert PublicKeyCredential to JSON
- `jsonToCreationOptions()` - Convert JSON to creation options
- `jsonToRequestOptions()` - Convert JSON to request options
- `getRpId()` - Get RP ID from current origin
- `getRpName()` - Get RP name from current origin

---

## Usage Examples

### SMS Enrollment
```tsx
import { EnrollSms } from '@/features/mfa';

<EnrollSms
  sdk={sdk}
  userId="user-123"
  onDeviceRegistered={() => {
    console.log('Device registered!');
  }}
/>
```

### FIDO2 Enrollment
```tsx
import { EnrollFido2 } from '@/features/mfa';

<EnrollFido2
  sdk={sdk}
  userId="user-123"
  policyId="policy-123"
  onDeviceRegistered={() => {
    console.log('Device registered!');
  }}
/>
```

### SMS Authentication
```tsx
import { AuthSms } from '@/features/mfa';

<AuthSms
  sdk={sdk}
  userId="user-123"
  policyId="policy-123"
  deviceId="device-123" // Optional
/>
```

### FIDO2 Authentication
```tsx
import { AuthFido2 } from '@/features/mfa';

<AuthFido2
  sdk={sdk}
  userId="user-123"
  policyId="policy-123"
  deviceId="device-123" // Optional
/>
```

---

## Backend Service Structure

The backend endpoints are organized in `server.js` under:

```
/api/pingone/mfa/
├── register-device          # POST - Create device
├── activate-device          # POST - Activate device
├── activate-fido2-device     # POST - Activate FIDO2 device
├── send-otp                 # POST - Send OTP
├── validate-otp             # POST - Validate OTP
├── initialize-device-authentication  # POST - Start auth
├── complete                 # POST - Complete auth
└── get-all-devices          # POST - List devices
```

**Note:** For a separate backend service structure (as shown in the plan), these endpoints would be organized in:

```
services/
└── mfa-sample-api/
    └── src/
        ├── routes/
        │   ├── enrollSms.ts
        │   ├── enrollFido2.ts
        │   ├── authSms.ts
        │   └── authFido2.ts
        └── pingone/
            ├── token.ts          # Service token management
            ├── mfaDevices.ts     # Device wrappers
            └── mfaAuth.ts        # Auth wrappers
```

---

## Migration from Samples

The feature components in `src/features/mfa/` are standalone and can be used independently of the sample apps. The sample apps in `src/samples/p1mfa/` still exist and can be used for reference or testing.

**Benefits of Feature Structure:**
- ✅ Cleaner organization
- ✅ Reusable components
- ✅ Better separation of concerns
- ✅ Easier to integrate into other parts of the app
- ✅ Matches modern React feature-based architecture

---

## State Machine Status Values

### Enrollment Flow
- `IDLE` - Initial state
- `DEVICE_CREATION_PENDING` - Device being created
- `OTP_SEND_PENDING` - OTP being sent (SMS only)
- `WEBAUTHN_REGISTRATION_REQUIRED` - WebAuthn credential needed (FIDO2 only)
- `DEVICE_ACTIVATION_PENDING` - Device being activated
- `DEVICE_ACTIVE` - Device enrolled and active
- `ERROR` - Error state

### Authentication Flow
- `IDLE` - Initial state
- `AUTH_INITIALIZED` - Authentication initialized
- `OTP_SEND_PENDING` - OTP being sent (SMS only)
- `WEBAUTHN_ASSERTION_REQUIRED` - WebAuthn assertion needed (FIDO2 only)
- `AUTH_COMPLETING` - Authentication being completed
- `AUTH_SUCCESS` - Authentication successful
- `ERROR` - Error state

---

## Next Steps

1. **Backend Service Separation** (Optional)
   - Extract MFA endpoints to separate service
   - Create `services/mfa-sample-api/` structure
   - Implement token management and PingOne wrappers

2. **Integration**
   - Use feature components in main app flows
   - Replace sample app usage with feature components
   - Update routing to use feature components

3. **Testing**
   - Unit tests for feature components
   - Integration tests for complete flows
   - E2E tests for user journeys

---

**Last Updated:** 2025-01-15  
**Version:** 1.0.0
