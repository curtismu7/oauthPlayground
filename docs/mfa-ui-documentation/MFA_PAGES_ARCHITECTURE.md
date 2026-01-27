# MFA Pages Architecture & Navigation

**Last Updated:** 2026-01-27 08:20:00  
**Version:** 1.0.0  
**Purpose:** Complete architecture documentation showing all MFA pages and their relationships

---

## Overview

This document provides a comprehensive view of all MFA pages in the V8 application, their relationships, navigation flows, and purposes.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MFA HUB (Entry Point)                              │
│                         /v8/mfa-hub (MFAAuthenticationMainPageV8)              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Control Panel (Environment ID, Region, Device Auth Policy)        │   │
│  │ • Worker Token Status Display                                        │   │
│  │ • Worker Token Settings (Silent API Retrieval, Show Token)          │   │
│  │ • Get Worker Token Button                                            │   │
│  │ • Username-based authentication                                      │   │
│  │ • Username-less FIDO2 authentication                                 │   │
│  │ • Device selection and challenge handling                             │   │
│  │ • Postman collection downloads                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Collapsible: MFA Features                                            │   │
│  │ ├─ Device Registration                                               │   │
│  │ ├─ Device Management                                                 │   │
│  │ ├─ MFA Reporting                                                     │   │
│  │ └─ Settings                                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Collapsible: About PingOne MFA                                       │   │
│  │ • Educational content                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ REGISTRATION │  │  MANAGEMENT  │  │   SETTINGS   │
        └──────────────┘  └──────────────┘  └──────────────┘
                │               │               │
                │               │               │
    ┌───────────┴───────────┐   │               │
    │                       │   │               │
    ▼                       ▼   ▼               ▼
┌─────────┐           ┌─────────────────┐  ┌─────────────────┐
│   SMS   │           │ Device Mgmt     │  │ MFA Config Page │
│         │           │ /mfa-device-    │  │ /mfa-config     │
└─────────┘           │  management     │  └─────────────────┘
    │                 └─────────────────┘          │
    ├─ Config                                       │
    │  /register/sms                               │
    │                                               │
    ├─ Device Flow                                 ├─ Worker Token
    │  /register/sms/device                        │  Settings
    │                                               │
    └─ Docs                                        ├─ Device Auth
       /register/sms/docs                          │  Policies
                                                    │
┌─────────┐                                        ├─ PingOne MFA
│  EMAIL  │                                        │  Settings
│         │                                        │
└─────────┘                                        ├─ OTP Settings
    │                                               │
    ├─ Config                                      ├─ FIDO2 Settings
    │  /register/email                             │
    │                                               ├─ Push Settings
    ├─ Device Flow                                 │
    │  /register/email/device                      ├─ UI/UX Settings
    │                                               │
    └─ Docs                                        └─ Security
       /register/email/docs                           Settings

┌─────────┐
│ WHATSAPP│
│         │
└─────────┘
    │
    ├─ Config
    │  /register/whatsapp
    │
    ├─ Device Flow
    │  /register/whatsapp/device
    │
    └─ Docs
       /register/whatsapp/docs

┌─────────┐
│  TOTP   │
│         │
└─────────┘
    │
    ├─ Config
    │  /register/totp
    │
    └─ Device Flow
       /register/totp/device

┌─────────┐
│ FIDO2   │
│         │
└─────────┘
    │
    ├─ Config
    │  /register/fido2
    │
    ├─ Device Flow
    │  /register/fido2/device
    │
    └─ Docs
       /register/fido2/docs

┌─────────┐
│ MOBILE  │
│         │
└─────────┘
    │
    ├─ Config
    │  /register/mobile
    │
    ├─ Device Flow
    │  /register/mobile/device
    │
    └─ Docs
       /register/mobile/docs

┌─────────────────┐
│ MFA REPORTING   │
│ /mfa-reporting  │
└─────────────────┘
    │
    ├─ User Auth Reports
    ├─ Device Auth Reports
    ├─ FIDO2 Reports
    └─ Usage Analytics

┌─────────────────┐
│ DEVICE ORDERING │
│ /mfa-device-    │
│  ordering       │
└─────────────────┘

┌─────────────────────┐
│ SUCCESS PAGE        │
│ /mfa/authentication │
│ /success            │
└─────────────────────┘
```

---

## Page Inventory

### 1. Hub & Main Pages

#### MFA Hub (Authentication Main Page)
- **Route:** `/v8/mfa-hub`
- **File:** `src/v8/flows/MFAAuthenticationMainPageV8.tsx`
- **Component:** `MFAAuthenticationMainPageV8`
- **Purpose:** Unified MFA Authentication Main Page - Central hub for MFA authentication and management
- **Key Features:**
  - Control Panel (Environment ID, Region, Device Auth Policy)
  - Worker Token Status Display
  - Worker Token Settings (Silent API Retrieval, Show Token checkboxes)
  - Get Worker Token Button
  - Username-based authentication
  - Username-less FIDO2 authentication
  - Device selection and challenge handling
  - Postman collection downloads
- **Navigation To:**
  - Device Registration flows
  - Device Management
  - MFA Reporting
  - MFA Settings

**Note:** `MFAHubV8.tsx` exists but is **not currently used** by the `/v8/mfa-hub` route. The route renders `MFAAuthenticationMainPageV8` instead.

---

### 2. Device Registration Pages

Each device type has up to three pages:
1. **Configuration Page** - Setup credentials and settings
2. **Device Flow Page** - Actual device registration flow
3. **Documentation Page** - API documentation and guides

#### SMS Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/sms`
- **File:** `src/v8/flows/types/SMSOTPConfigurationPageV8.tsx`
- **Component:** `SMSOTPConfigurationPageV8`
- **Purpose:** Configure SMS device registration settings
- **Uses:** `MFAConfigurationStepV8V2` component
- **Key Sections:**
  - Worker Token Section (collapsible)
  - User Token Section (collapsible)
  - Environment ID
  - Region
  - Custom Domain
  - Device Authentication Policy
  - Username

**Device Flow**
- **Route:** `/v8/mfa/register/sms/device`
- **File:** `src/v8/flows/types/SMSFlowV8.tsx`
- **Component:** `SMSFlowV8`
- **Purpose:** SMS device registration flow
- **Steps:**
  1. Configuration
  2. Device Registration
  3. OTP Validation
  4. Success

**Documentation**
- **Route:** `/v8/mfa/register/sms/docs`
- **File:** `src/v8/pages/SMSRegistrationDocsPageV8.tsx`
- **Component:** `SMSRegistrationDocsPageV8`
- **Purpose:** API documentation for SMS registration

#### Email Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/email`
- **File:** `src/v8/flows/types/EmailOTPConfigurationPageV8.tsx`
- **Component:** `EmailOTPConfigurationPageV8`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/email/device`
- **File:** `src/v8/flows/types/EmailFlowV8.tsx`
- **Component:** `EmailFlowV8`

**Documentation**
- **Route:** `/v8/mfa/register/email/docs`
- **File:** `src/v8/pages/EmailRegistrationDocsPageV8.tsx`
- **Component:** `EmailRegistrationDocsPageV8`

#### WhatsApp Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/whatsapp`
- **File:** `src/v8/flows/types/WhatsAppOTPConfigurationPageV8.tsx`
- **Component:** `WhatsAppOTPConfigurationPageV8`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/whatsapp/device`
- **File:** `src/v8/flows/types/WhatsAppFlowV8.tsx`
- **Component:** `WhatsAppFlowV8`

**Documentation**
- **Route:** `/v8/mfa/register/whatsapp/docs`
- **File:** `src/v8/pages/WhatsAppRegistrationDocsPageV8.tsx`
- **Component:** `WhatsAppRegistrationDocsPageV8`

#### TOTP Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/totp`
- **File:** `src/v8/flows/types/TOTPConfigurationPageV8.tsx`
- **Component:** `TOTPConfigurationPageV8`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/totp/device`
- **File:** `src/v8/flows/types/TOTPFlowV8.tsx`
- **Component:** `TOTPFlowV8`
- **Steps:**
  1. Configuration
  2. QR Code Display
  3. OTP Validation
  4. Success

#### FIDO2 Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/fido2`
- **File:** `src/v8/flows/types/FIDO2ConfigurationPageV8.tsx`
- **Component:** `FIDO2ConfigurationPageV8`

**Device Flow**
- **Route:** `/v8/mfa/register/fido2/device`
- **File:** `src/v8/flows/types/FIDO2FlowV8.tsx`
- **Component:** `FIDO2FlowV8`
- **Steps:**
  1. Configuration
  2. WebAuthn Registration
  3. Success

**Documentation**
- **Route:** `/v8/mfa/register/fido2/docs`
- **File:** `src/v8/pages/FIDO2RegistrationDocsPageV8.tsx`
- **Component:** `FIDO2RegistrationDocsPageV8`

#### Mobile Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/mobile`
- **File:** `src/v8/flows/types/MobileOTPConfigurationPageV8.tsx`
- **Component:** `MobileOTPConfigurationPageV8`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/mobile/device`
- **File:** `src/v8/flows/types/MobileFlowV8.tsx`
- **Component:** `MobileFlowV8`

**Documentation**
- **Route:** `/v8/mfa/register/mobile/docs`
- **File:** `src/v8/pages/MobileRegistrationDocsPageV8.tsx`
- **Component:** `MobileRegistrationDocsPageV8`

---

### 3. Management Pages

#### Device Management
- **Route:** `/v8/mfa-device-management`
- **File:** `src/v8/flows/MFADeviceManagementFlowV8.tsx`
- **Component:** `MFADeviceManagementFlowV8`
- **Purpose:** Manage user MFA devices
- **Features:**
  - View all devices
  - Rename devices
  - Block/Unblock devices
  - Delete devices
  - Device status tracking

#### Device Ordering
- **Route:** `/v8/mfa-device-ordering`
- **File:** `src/v8/flows/MFADeviceOrderingFlowV8.tsx`
- **Component:** `MFADeviceOrderingFlowV8`
- **Purpose:** Order and prioritize MFA devices

---

### 4. Reporting Pages

#### MFA Reporting
- **Route:** `/v8/mfa-reporting`
- **File:** `src/v8/flows/MFAReportingFlowV8.tsx`
- **Component:** `MFAReportingFlowV8`
- **Purpose:** View MFA usage reports and analytics
- **Features:**
  - User authentication reports
  - Device authentication reports
  - FIDO2 device reports
  - Usage analytics
  - Export reports

---

### 5. Settings Pages

#### MFA Configuration Page
- **Route:** `/v8/mfa-config`
- **File:** `src/v8/flows/MFAConfigurationPageV8.tsx`
- **Component:** `MFAConfigurationPageV8`
- **Purpose:** Configure MFA policies and settings
- **Sections (in order):**
  1. Worker Token Settings (ALWAYS FIRST)
  2. Device Authentication Policy Settings (if environmentId exists)
  3. PingOne MFA Settings (if environmentId exists)
  4. Default Policies
  5. OTP Settings
  6. FIDO2/WebAuthn Settings
  7. Push Notification Settings
  8. UI/UX Settings
  9. Security Settings

---

### 6. Success & Utility Pages

#### Authentication Success Page
- **Route:** `/v8/mfa/authentication/success`
- **File:** `src/v8/pages/MFAAuthenticationSuccessPage.tsx`
- **Component:** `MFAAuthenticationSuccessPage`
- **Purpose:** Display success message after MFA authentication

#### Device Authentication Details
- **Route:** `/v8/mfa/device-authentication-details`
- **File:** `src/v8/pages/DeviceAuthenticationDetailsV8.tsx`
- **Component:** `DeviceAuthenticationDetailsV8`
- **Purpose:** Display detailed device authentication information

#### MFA Device Create Demo
- **Route:** `/v8/mfa/create-device`
- **File:** `src/v8/pages/MFADeviceCreateDemoV8.tsx`
- **Component:** `MFADeviceCreateDemoV8`
- **Purpose:** Demo page for creating MFA devices

---

## Shared Components

### MFAConfigurationStepV8V2
- **File:** `src/v8/flows/shared/MFAConfigurationStepV8-V2.tsx`
- **Purpose:** Shared configuration step component used across all device registration flows
- **Used By:**
  - SMS Configuration Page
  - Email Configuration Page
  - WhatsApp Configuration Page
  - TOTP Configuration Page
  - Mobile Configuration Page
- **Features:**
  - Collapsible Worker Token Section
  - Collapsible User Token Section
  - Environment ID input
  - Region selector
  - Custom Domain input
  - Device Authentication Policy selector
  - Username input

### MFAFlowBaseV8
- **File:** `src/v8/flows/shared/MFAFlowBaseV8.tsx`
- **Purpose:** Base component for MFA flows with common functionality
- **Used By:** All device registration flows

---

## Navigation Flow Patterns

### Pattern 1: Device Registration Flow
```
MFA Hub
  → Device Type Selection (e.g., SMS)
    → Configuration Page (/v8/mfa/register/sms)
      → Device Flow (/v8/mfa/register/sms/device)
        → Success Page (/v8/mfa/authentication/success)
```

### Pattern 2: Documentation Access
```
MFA Hub
  → Device Type Selection
    → Configuration Page
      → Documentation Page (/v8/mfa/register/{type}/docs)
```

### Pattern 3: Settings Management
```
MFA Hub
  → Settings
    → MFA Configuration Page (/v8/mfa-config)
      → Edit Settings
      → Save Configuration
```

### Pattern 4: Device Management
```
MFA Hub
  → Device Management (/v8/mfa-device-management)
    → View Devices
    → Manage Device (Rename/Block/Delete)
```

---

## Route Aliases & Redirects

### Voice → SMS
- `/v8/mfa/register/voice` → `/v8/mfa/register/sms`
- `/v8/mfa/register/voice/device` → `/v8/mfa/register/sms/device`
- **Reason:** Voice uses the same phone-based flow as SMS

### Platform/Security Key → FIDO2
- `/v8/mfa/register/platform` → `/v8/mfa/register/fido2`
- `/v8/mfa/register/platform/device` → `/v8/mfa/register/fido2/device`
- `/v8/mfa/register/security_key` → `/v8/mfa/register/fido2`
- `/v8/mfa/register/security_key/device` → `/v8/mfa/register/fido2/device`
- **Reason:** Platform and Security Key use the same FIDO2 flow

### MFA Root → Hub
- `/v8/mfa` → `/v8/mfa-hub`
- **Reason:** Main entry point redirects to hub

---

## Component Relationships

### Worker Token Management
```
MFAAuthenticationMainPageV8
  ├─ WorkerTokenStatusDisplayV8 (displays status)
  ├─ Get Worker Token Button (triggers modal)
  └─ WorkerTokenModalV8 (lazy loaded)

MFAConfigurationStepV8V2
  ├─ Collapsible Worker Token Section
  │   ├─ WorkerTokenStatusDisplayV8
  │   ├─ Silent API Retrieval checkbox
  │   └─ Show Token at End checkbox
  └─ Collapsible User Token Section
      ├─ Login with PingOne button
      ├─ User Token Status Display
      └─ Clear Token button
```

### Configuration Flow
```
{DeviceType}OTPConfigurationPageV8
  ├─ MFANavigationV8
  ├─ SuperSimpleApiDisplayV8
  ├─ MFAConfigurationStepV8V2
  │   ├─ Worker Token Section
  │   ├─ User Token Section
  │   ├─ Environment ID
  │   ├─ Region
  │   ├─ Custom Domain
  │   ├─ Device Authentication Policy
  │   └─ Username
  └─ Start Registration Button
      → Navigates to Device Flow
```

---

## Key Contracts & Rules

### 1. Configuration Page Structure
- **MUST** use `MFAConfigurationStepV8V2` component
- **MUST** include Worker Token Section (collapsible)
- **MUST** include User Token Section (collapsible)
- **MUST** include all credential fields (Environment ID, Region, Custom Domain, Device Auth Policy, Username)

### 2. MFA Hub Structure
- **MUST** display Worker Token Status
- **MUST** include "Get Worker Token" button in Settings section
- **MUST** have collapsible MFA Features section
- **MUST** have collapsible About PingOne MFA section

### 3. Navigation Rules
- All device registration flows start from MFA Hub
- Configuration pages always come before device flows
- Success page is shared across all flows
- Documentation pages are optional per device type

### 4. Token Management
- Worker tokens managed at Hub level and in configuration pages
- User tokens managed in configuration pages only
- Token status displayed via `WorkerTokenStatusDisplayV8` component

---

## File Organization

```
src/v8/
├── flows/
│   ├── MFAAuthenticationMainPageV8.tsx    (Hub)
│   ├── MFAConfigurationPageV8.tsx        (Settings)
│   ├── MFADeviceManagementFlowV8.tsx     (Management)
│   ├── MFAReportingFlowV8.tsx            (Reporting)
│   ├── types/
│   │   ├── SMSFlowV8.tsx                 (Device flows)
│   │   ├── EmailFlowV8.tsx
│   │   ├── WhatsAppFlowV8.tsx
│   │   ├── TOTPFlowV8.tsx
│   │   ├── FIDO2FlowV8.tsx
│   │   ├── MobileFlowV8.tsx
│   │   ├── SMSOTPConfigurationPageV8.tsx     (Config pages)
│   │   ├── EmailOTPConfigurationPageV8.tsx
│   │   ├── WhatsAppOTPConfigurationPageV8.tsx
│   │   ├── TOTPConfigurationPageV8.tsx
│   │   ├── FIDO2ConfigurationPageV8.tsx
│   │   └── MobileOTPConfigurationPageV8.tsx
│   └── shared/
│       ├── MFAConfigurationStepV8-V2.tsx   (Shared config component)
│       └── MFAFlowBaseV8.tsx               (Base flow component)
├── components/
│   ├── WorkerTokenStatusDisplayV8.tsx
│   ├── WorkerTokenModalV8.tsx
│   ├── UserLoginModalV8.tsx
│   └── MFANavigationV8.tsx
└── pages/
    ├── SMSRegistrationDocsPageV8.tsx       (Documentation pages)
    ├── EmailRegistrationDocsPageV8.tsx
    ├── WhatsAppRegistrationDocsPageV8.tsx
    ├── FIDO2RegistrationDocsPageV8.tsx
    ├── MobileRegistrationDocsPageV8.tsx
    └── MFAAuthenticationSuccessPage.tsx
```

---

## Related Documentation

- [MFA Configuration Page UI Contract](./MFA_CONFIG_PAGE_UI_CONTRACT.md)
- [MFA Configuration Page UI Documentation](./MFA_CONFIG_PAGE_UI_DOC.md)
- [MFA Configuration Page Restore](./MFA_CONFIG_PAGE_RESTORE.md)
- [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md)
- [MFA State Preservation UI Contract](./MFA_STATE_PRESERVATION_UI_CONTRACT.md)

---

## Version History

- **v1.0.0** (2026-01-27): Initial MFA pages architecture documentation

---
