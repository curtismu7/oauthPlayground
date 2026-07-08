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
│                         /v8/mfa-hub (MFAAuthenticationMainPage)              │
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
- **File:** `src/v8/flows/MFAAuthenticationMainPage.tsx`
- **Component:** `MFAAuthenticationMainPage`
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

**Note:** `MFAHub.tsx` exists but is **not currently used** by the `/v8/mfa-hub` route. The route renders `MFAAuthenticationMainPage` instead.

---

### 2. Device Registration Pages

Each device type has up to three pages:
1. **Configuration Page** - Setup credentials and settings
2. **Device Flow Page** - Actual device registration flow
3. **Documentation Page** - API documentation and guides

#### SMS Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/sms`
- **File:** `src/v8/flows/types/SMSOTPConfigurationPage.tsx`
- **Component:** `SMSOTPConfigurationPage`
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
- **File:** `src/v8/flows/types/SMSFlow.tsx`
- **Component:** `SMSFlow`
- **Purpose:** SMS device registration flow
- **Steps:**
  1. Configuration
  2. Device Registration
  3. OTP Validation
  4. Success

**Documentation**
- **Route:** `/v8/mfa/register/sms/docs`
- **File:** `src/v8/pages/SMSRegistrationDocsPage.tsx`
- **Component:** `SMSRegistrationDocsPage`
- **Purpose:** API documentation for SMS registration

#### Email Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/email`
- **File:** `src/v8/flows/types/EmailOTPConfigurationPage.tsx`
- **Component:** `EmailOTPConfigurationPage`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/email/device`
- **File:** `src/v8/flows/types/EmailFlow.tsx`
- **Component:** `EmailFlow`

**Documentation**
- **Route:** `/v8/mfa/register/email/docs`
- **File:** `src/v8/pages/EmailRegistrationDocsPage.tsx`
- **Component:** `EmailRegistrationDocsPage`

#### WhatsApp Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/whatsapp`
- **File:** `src/v8/flows/types/WhatsAppOTPConfigurationPage.tsx`
- **Component:** `WhatsAppOTPConfigurationPage`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/whatsapp/device`
- **File:** `src/v8/flows/types/WhatsAppFlow.tsx`
- **Component:** `WhatsAppFlow`

**Documentation**
- **Route:** `/v8/mfa/register/whatsapp/docs`
- **File:** `src/v8/pages/WhatsAppRegistrationDocsPage.tsx`
- **Component:** `WhatsAppRegistrationDocsPage`

#### TOTP Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/totp`
- **File:** `src/v8/flows/types/TOTPConfigurationPage.tsx`
- **Component:** `TOTPConfigurationPage`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/totp/device`
- **File:** `src/v8/flows/types/TOTPFlow.tsx`
- **Component:** `TOTPFlow`
- **Steps:**
  1. Configuration
  2. QR Code Display
  3. OTP Validation
  4. Success

#### FIDO2 Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/fido2`
- **File:** `src/v8/flows/types/FIDO2ConfigurationPage.tsx`
- **Component:** `FIDO2ConfigurationPage`

**Device Flow**
- **Route:** `/v8/mfa/register/fido2/device`
- **File:** `src/v8/flows/types/FIDO2Flow.tsx`
- **Component:** `FIDO2Flow`
- **Steps:**
  1. Configuration
  2. WebAuthn Registration
  3. Success

**Documentation**
- **Route:** `/v8/mfa/register/fido2/docs`
- **File:** `src/v8/pages/FIDO2RegistrationDocsPage.tsx`
- **Component:** `FIDO2RegistrationDocsPage`

#### Mobile Device Registration

**Configuration Page**
- **Route:** `/v8/mfa/register/mobile`
- **File:** `src/v8/flows/types/MobileOTPConfigurationPage.tsx`
- **Component:** `MobileOTPConfigurationPage`
- **Uses:** `MFAConfigurationStepV8V2` component

**Device Flow**
- **Route:** `/v8/mfa/register/mobile/device`
- **File:** `src/v8/flows/types/MobileFlow.tsx`
- **Component:** `MobileFlow`

**Documentation**
- **Route:** `/v8/mfa/register/mobile/docs`
- **File:** `src/v8/pages/MobileRegistrationDocsPage.tsx`
- **Component:** `MobileRegistrationDocsPage`

---

### 3. Management Pages

#### Device Management
- **Route:** `/v8/mfa-device-management`
- **File:** `src/v8/flows/MFADeviceManagementFlow.tsx`
- **Component:** `MFADeviceManagementFlow`
- **Purpose:** Manage user MFA devices
- **Features:**
  - View all devices
  - Rename devices
  - Block/Unblock devices
  - Delete devices
  - Device status tracking

#### Device Ordering
- **Route:** `/v8/mfa-device-ordering`
- **File:** `src/v8/flows/MFADeviceOrderingFlow.tsx`
- **Component:** `MFADeviceOrderingFlow`
- **Purpose:** Order and prioritize MFA devices

---

### 4. Reporting Pages

#### MFA Reporting
- **Route:** `/v8/mfa-reporting`
- **File:** `src/v8/flows/MFAReportingFlow.tsx`
- **Component:** `MFAReportingFlow`
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
- **File:** `src/v8/flows/MFAConfigurationPage.tsx`
- **Component:** `MFAConfigurationPage`
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
- **File:** `src/v8/pages/DeviceAuthenticationDetails.tsx`
- **Component:** `DeviceAuthenticationDetails`
- **Purpose:** Display detailed device authentication information

#### MFA Device Create Demo
- **Route:** `/v8/mfa/create-device`
- **File:** `src/v8/pages/MFADeviceCreateDemo.tsx`
- **Component:** `MFADeviceCreateDemo`
- **Purpose:** Demo page for creating MFA devices

---

## Shared Components

### MFAConfigurationStepV8V2
- **File:** `src/v8/flows/shared/MFAConfigurationStep-V2.tsx`
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

### MFAFlowBase
- **File:** `src/v8/flows/shared/MFAFlowBase.tsx`
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
MFAAuthenticationMainPage
  ├─ WorkerTokenStatusDisplay (displays status)
  ├─ Get Worker Token Button (triggers modal)
  └─ WorkerTokenModal (lazy loaded)

MFAConfigurationStepV8V2
  ├─ Collapsible Worker Token Section
  │   ├─ WorkerTokenStatusDisplay
  │   ├─ Silent API Retrieval checkbox
  │   └─ Show Token at End checkbox
  └─ Collapsible User Token Section
      ├─ Login with PingOne button
      ├─ User Token Status Display
      └─ Clear Token button
```

### Configuration Flow
```
{DeviceType}OTPConfigurationPage
  ├─ MFANavigation
  ├─ SuperSimpleApiDisplay
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
- Token status displayed via `WorkerTokenStatusDisplay` component

---

## File Organization

```
src/v8/
├── flows/
│   ├── MFAAuthenticationMainPage.tsx    (Hub)
│   ├── MFAConfigurationPage.tsx        (Settings)
│   ├── MFADeviceManagementFlow.tsx     (Management)
│   ├── MFAReportingFlow.tsx            (Reporting)
│   ├── types/
│   │   ├── SMSFlow.tsx                 (Device flows)
│   │   ├── EmailFlow.tsx
│   │   ├── WhatsAppFlow.tsx
│   │   ├── TOTPFlow.tsx
│   │   ├── FIDO2Flow.tsx
│   │   ├── MobileFlow.tsx
│   │   ├── SMSOTPConfigurationPage.tsx     (Config pages)
│   │   ├── EmailOTPConfigurationPage.tsx
│   │   ├── WhatsAppOTPConfigurationPage.tsx
│   │   ├── TOTPConfigurationPage.tsx
│   │   ├── FIDO2ConfigurationPage.tsx
│   │   └── MobileOTPConfigurationPage.tsx
│   └── shared/
│       ├── MFAConfigurationStep-V2.tsx   (Shared config component)
│       └── MFAFlowBase.tsx               (Base flow component)
├── components/
│   ├── WorkerTokenStatusDisplay.tsx
│   ├── WorkerTokenModal.tsx
│   ├── UserLoginModal.tsx
│   └── MFANavigation.tsx
└── pages/
    ├── SMSRegistrationDocsPage.tsx       (Documentation pages)
    ├── EmailRegistrationDocsPage.tsx
    ├── WhatsAppRegistrationDocsPage.tsx
    ├── FIDO2RegistrationDocsPage.tsx
    ├── MobileRegistrationDocsPage.tsx
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
