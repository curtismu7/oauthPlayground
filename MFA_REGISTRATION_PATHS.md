# MFA Registration Flow Paths

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MFA HUB (/v8/mfa-hub)                               │
│                    (User selects registration type)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌───────────────────┐  ┌──────────────┐  ┌──────────────────┐
        │   SMS / Email     │  │  TOTP/FIDO2  │  │    WhatsApp      │
        │  (Single Route)   │  │ (Two Routes)  │  │  (Two Routes)    │
        └───────────────────┘  └──────────────┘  └──────────────────┘
                    │               │               │
                    ▼               ▼               ▼
```

## 1. SMS Registration Flow (Single Route)

```
/v8/mfa/register/sms
        │
        ├─► SMSFlowV8 Component
        │
        ├─► Step 0: Configure Credentials
        │   └─► (If accessed directly, shows config)
        │
        ├─► Step 1: Device Selection
        │   ├─► Load existing devices
        │   └─► OR Select "Register New Device"
        │
        ├─► Step 2: Register Device
        │   └─► Enter phone number & device name
        │
        ├─► Step 3: Send OTP (if needed)
        │
        └─► Step 4: Validate OTP
            └─► Success!
```

**Note:** SMS uses the same route for both configuration and device registration. The component handles both flows internally.

---

## 2. Email Registration Flow (Single Route)

```
/v8/mfa/register/email
        │
        ├─► EmailFlowV8 Component
        │
        ├─► Step 0: Configure Credentials
        │   └─► (If accessed directly, shows config)
        │
        ├─► Step 1: Device Selection
        │   ├─► Load existing devices
        │   └─► OR Select "Register New Device"
        │
        ├─► Step 2: Register Device
        │   └─► Enter email & device name
        │
        ├─► Step 3: Send OTP (if needed)
        │
        └─► Step 4: Validate OTP
            └─► Success!
```

**Note:** Email uses the same route for both configuration and device registration. The component handles both flows internally.

---

## 3. TOTP Registration Flow (Two Routes)

```
┌─────────────────────────────────────────────────────────────────┐
│  Route 1: /v8/mfa/register/totp                                  │
│  Component: TOTPConfigurationPageV8                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Configuration Steps:                                      │  │
│  │  1. Enter Environment ID                                   │  │
│  │  2. Enter Username                                          │  │
│  │  3. Select Device Authentication Policy                    │  │
│  │  4. Select Token Type (Worker/User)                        │  │
│  │  5. Click "Proceed to Registration"                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            │ navigate with state:                │
│                            │ { configured: true, ... }           │
│                            ▼                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Route 2: /v8/mfa/register/totp/device                          │
│  Component: TOTPFlowV8                                           │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Registration Steps:                                       │  │
│  │  Step 0: Configure (SKIPPED if isConfigured=true)         │  │
│  │  Step 1: Device Selection (SKIPPED if isConfigured=true) │  │
│  │  Step 2: Register Device                                  │  │
│  │    └─► Generate/Display QR Code                          │  │
│  │    └─► User scans with authenticator app                  │  │
│  │  Step 3: Validate TOTP Code                               │  │
│  │  Step 4: Success!                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ⚠️  If accessed directly without state:                         │
│     └─► Redirects to /v8/mfa/register/totp                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. FIDO2 Registration Flow (Two Routes)

```
┌─────────────────────────────────────────────────────────────────┐
│  Route 1: /v8/mfa/register/fido2                                 │
│  Component: FIDO2ConfigurationPageV8                             │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Configuration Steps:                                      │  │
│  │  1. Enter Environment ID                                   │  │
│  │  2. Enter Username                                          │  │
│  │  3. Select Device Authentication Policy                    │  │
│  │  4. Select Token Type (Worker/User)                        │  │
│  │  5. Click "Proceed to Registration"                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            │ navigate with state:                │
│                            │ { configured: true, ... }           │
│                            ▼                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Route 2: /v8/mfa/register/fido2/device                         │
│  Component: FIDO2FlowV8                                          │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Registration Steps:                                       │  │
│  │  Step 0: Configure (SKIPPED if isConfigured=true)         │  │
│  │  Step 1: Device Selection (SKIPPED if isConfigured=true) │  │
│  │  Step 2: Register Device                                  │  │
│  │    └─► WebAuthn API creates credential                     │  │
│  │    └─► User authenticates with security key/platform      │  │
│  │  Step 3: Success!                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ⚠️  If accessed directly without state:                         │
│     └─► Redirects to /v8/mfa/register/fido2                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. WhatsApp Registration Flow (Two Routes) ⭐ RECENTLY FIXED

```
┌─────────────────────────────────────────────────────────────────┐
│  Route 1: /v8/mfa/register/whatsapp                             │
│  Component: WhatsAppOTPConfigurationPageV8                      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Configuration Steps:                                      │  │
│  │  1. Enter Environment ID                                   │  │
│  │  2. Enter Username                                          │  │
│  │  3. Select Device Authentication Policy                    │  │
│  │  4. Select Token Type (Worker/User)                        │  │
│  │  5. Select Registration Flow Type (Admin/User)             │  │
│  │  6. Select Device Status (if Admin Flow)                   │  │
│  │  7. Click "Proceed to Registration"                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                      │
│                            │ navigate with state:                │
│                            │ { configured: true, ... }           │
│                            ▼                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Route 2: /v8/mfa/register/whatsapp/device                       │
│  Component: WhatsAppFlowV8                                       │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Registration Steps:                                       │  │
│  │  Step 0: Configure (SKIPPED if isConfigured=true)         │  │
│  │  Step 1: Device Selection                                  │  │
│  │    ├─► If isConfigured=true: SKIP device loading          │  │
│  │    └─► Auto-show registration form                        │  │
│  │  Step 2: Register Device                                  │  │
│  │    └─► Enter phone number & device name                   │  │
│  │  Step 3: Send OTP (if ACTIVATION_REQUIRED)               │  │
│  │    └─► OTP sent automatically by PingOne                  │  │
│  │  Step 4: Validate OTP                                     │  │
│  │    └─► Enter OTP code received via WhatsApp              │  │
│  │  Step 5: Success!                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ⚠️  If accessed directly without state:                         │
│     └─► Redirects to /v8/mfa/register/whatsapp                  │
│                                                                   │
│  ✅ FIXED: Now properly redirects to config page instead of    │
│     trying to load devices when accessed directly                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Route Comparison Table

| Factor Type | Config Route | Device Route | Notes |
|------------|--------------|--------------|-------|
| **SMS** | `/v8/mfa/register/sms` | Same route | Single component handles both |
| **Email** | `/v8/mfa/register/email` | Same route | Single component handles both |
| **TOTP** | `/v8/mfa/register/totp` | `/v8/mfa/register/totp/device` | Separate routes |
| **FIDO2** | `/v8/mfa/register/fido2` | `/v8/mfa/register/fido2/device` | Separate routes |
| **WhatsApp** | `/v8/mfa/register/whatsapp` | `/v8/mfa/register/whatsapp/device` | Separate routes ✅ Fixed |

---

## Navigation State Flow

When navigating from Config Page → Device Route:

```javascript
navigate('/v8/mfa/register/{type}/device', {
  replace: false,
  state: {
    configured: true,                    // ⭐ Key flag
    deviceAuthenticationPolicyId: '...',
    environmentId: '...',
    username: '...',
    tokenType: 'worker' | 'user',
    userToken: '...',                     // If tokenType === 'user'
    registrationFlowType: 'admin' | 'user', // WhatsApp only
    adminDeviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED', // WhatsApp only
  }
});
```

The `configured: true` flag tells the device flow to:
- ✅ Skip Step 0 (configuration)
- ✅ Skip device loading in Step 1 (for registration flows)
- ✅ Auto-show registration form
- ✅ Jump directly to registration step

---

## Direct Access Protection

**For Two-Route Flows (TOTP, FIDO2, WhatsApp):**

If user accesses device route directly (e.g., `/v8/mfa/register/whatsapp/device`) without proper state:
- ❌ **Before Fix:** Would try to load devices (incorrect behavior)
- ✅ **After Fix:** Redirects to config page (`/v8/mfa/register/whatsapp`)

**For Single-Route Flows (SMS, Email):**

If user accesses route directly without credentials:
- Shows Step 0 (configuration) in the same component
- No redirect needed (same route handles both)

---

## Summary

1. **SMS/Email**: Single route, component handles both config and device registration
2. **TOTP/FIDO2/WhatsApp**: Two routes, separate config page and device flow
3. **WhatsApp**: Recently fixed to properly redirect to config page when device route accessed directly
4. **Navigation State**: Uses `configured: true` flag to skip configuration steps when coming from config page

