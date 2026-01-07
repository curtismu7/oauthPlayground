# MFA SMS UI Documentation

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [MFA SMS UI Contract](./MFA_SMS_UI_CONTRACT.md) - UI behavior contracts
- [MFA SMS Restore Document](./MFA_SMS_RESTORE.md) - Implementation details for restoration
- [MFA OTP/TOTP Master Document](../MFA_OTP_TOTP_MASTER.md) - OTP flow patterns

---

## Overview

This document provides a complete reference for the UI structure, components, styling, and layout of SMS device registration and authentication flows in the MFA system.

---

## Page Layout

### SMS Configuration Page

**Location:** `/v8/mfa/register/sms`  
**Component:** `SMSOTPConfigurationPageV8.tsx`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  MFANavigationV8 (Top Navigation Bar)                   │
├─────────────────────────────────────────────────────────┤
│  SMS Configuration Header (Blue Gradient)               │
│  - Title: "SMS Device Registration"                    │
│  - Subtitle: "Configure SMS MFA settings"              │
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

## SMS Registration Flow

**Location:** `/v8/mfa/register/sms/device`  
**Component:** `SMSFlowV8.tsx`

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
- "Register SMS Device" button
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

## SMS Authentication Flow

**Location:** `/v8/mfa/auth`  
**Component:** `MFAAuthenticationMainPageV8.tsx`

### Device Selection

**UI Elements:**
- Username input
- Environment ID input
- Device Authentication Policy selector
- SMS device list
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

- **v1.0.0** (2026-01-06): Initial SMS UI documentation

---

## Notes

- **Device Selection:** Skipped during registration, only shown during authentication
- **Phone Validation:** E.164 format required
- **OTP Input:** Configurable length via `config.otpCodeLength`
- **Error Handling:** All errors normalized to user-friendly messages

