# MFA Mobile UI Documentation

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [MFA Mobile UI Contract](./MFA_MOBILE_UI_CONTRACT.md) - UI behavior contracts
- [MFA Mobile Restore Document](./MFA_MOBILE_RESTORE.md) - Implementation details for restoration
- [MFA Mobile Master Document](../MFA_MOBILE_MASTER.md) - Mobile flow patterns and API details
- [MFA SMS UI Documentation](./MFA_SMS_UI_DOC.md) - SMS UI structure (Mobile uses SMS patterns)

---

## Overview

This document provides a complete reference for the UI structure, components, styling, and layout of Mobile device registration and authentication flows in the MFA system. Mobile is implemented as an OTP device type (SMS-based) and follows SMS flow patterns.

---

## Page Layout

### Mobile Configuration Page

**Location:** `/v8/mfa/register/mobile`  
**Component:** `MobileOTPConfigurationPageV8.tsx`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  MFANavigationV8 (Top Navigation Bar)                   │
├─────────────────────────────────────────────────────────┤
│  Mobile Configuration Header (Blue Gradient)            │
│  - Title: "Mobile Device Registration"                   │
│  - Subtitle: "Configure Mobile MFA settings"             │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │  Worker Token Status Section                    │  │
│  │  - Status indicator (Valid/Expired/Missing)     │  │
│  │  - "Get Worker Token" button if invalid         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Registration Flow Type Selection                │  │
│  │  - Admin Flow (Worker Token)                    │  │
│  │  - User Flow (OAuth Access Token)                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Device Authentication Policy Selector          │  │
│  │  - Policy dropdown                              │  │
│  │  - Policy description                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Action Buttons                                  │  │
│  │  - "Back to Hub" (left)                         │  │
│  │  - "Continue to Device Registration" (right)    │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Mobile Registration Flow

**Location:** `/v8/mfa/register/mobile/device`  
**Component:** `MobileFlowV8.tsx`

**Note:** Mobile uses the SMS flow controller and follows SMS patterns. See [MFA SMS UI Documentation](./MFA_SMS_UI_DOC.md) for detailed UI structure.

### Step 0: Configuration

**UI Elements:**
- Environment ID input
- Username input
- Device Authentication Policy selector
- Token type selector (Worker/User)
- "Start Registration" button

### Step 1: Device Selection

**UI Elements:**
- Device list (if multiple devices available)
- "Register New Device" option
- Device selection buttons

**Note:** Step 1 is skipped during registration flow (when coming from config page).

### Step 2: Device Registration

**UI Elements:**
- Phone number input with country code picker (`CountryCodePickerV8`)
- Device name input (conditional, based on `promptForNicknameOnPairing`)
- "Register Mobile Device" button
- Loading indicator during registration

**Phone Number Input:**
- Uses `CountryCodePickerV8` component
- Validates E.164 format
- Auto-populates from PingOne user profile (if available)

### Step 3: OTP Validation

**UI Elements:**
- OTP input modal (`MFAOTPInput`)
- "Resend Code" button
- "Validate" button
- Error message display

**OTP Input:**
- 6 digits (configurable via `config.otpCodeLength`)
- Auto-focus first input
- Auto-submit when complete (if enabled)
- Clear error display

### Step 4: Success Page

**UI Elements:**
- Success icon and message
- Device information summary
- "View Documentation" button
- "Back to Hub" button

---

## Mobile Authentication Flow

**Location:** `/v8/mfa/auth`  
**Component:** `MFAAuthenticationMainPageV8.tsx`

### Device Selection

**UI Elements:**
- Username input
- Environment ID input
- Device Authentication Policy selector
- Mobile device list
- Device selection buttons

### OTP Validation

**UI Elements:**
- OTP input modal
- "Resend Code" button
- "Validate" button
- Error message display

---

## Helper Components

### CountryCodePickerV8

**Purpose:** Country code selector for phone number input

**Props:**
- `value: string` - Current country code (e.g., "+1")
- `onChange: (code: string) => void` - Change handler

**Styling:**
- Dropdown with country flags and codes
- Full width, standard padding

### MFAOTPInput

**Purpose:** OTP code input component

**Props:**
- `length: number` - Number of digits (default: 6)
- `value: string` - Current OTP value
- `onChange: (value: string) => void` - Change handler
- `autoFocus?: boolean` - Auto-focus first input
- `autoSubmit?: boolean` - Auto-submit when complete
- `error?: string` - Error message to display

**Styling:**
- Individual input fields for each digit
- Spacing between inputs
- Error message below inputs

---

## Styling Conventions

- **Primary Actions:** Green (`#10b981`)
- **Secondary Actions:** Blue (`#3b82f6`)
- **Error Messages:** Red (`#dc2626`)
- **Backgrounds:** Light gray (`#f9fafb`), white (`#ffffff`)
- **Text:** Dark gray (`#1f2937`), medium gray (`#6b7280`)

---

## Version History

- **v1.0.0** (2026-01-06): Initial Mobile UI documentation

---

## Notes

- **Device Type:** Mobile is implemented as an OTP device type (SMS-based)
- **Controller:** Uses `SMSFlowController` for business logic
- **Flow API:** Integrates with PingOne Flow APIs for OAuth
- **OAuth:** Uses SPA OAuth with PKCE for User Flow
- **Device Selection:** Skipped during registration, only shown during authentication
- **Phone Validation:** E.164 format required
- **OTP Input:** Configurable length via `config.otpCodeLength`
- **Error Handling:** All errors normalized to user-friendly messages

