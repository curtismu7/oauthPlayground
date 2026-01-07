# MFA Email UI Documentation

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [MFA Email UI Contract](./MFA_EMAIL_UI_CONTRACT.md) - UI behavior contracts
- [MFA Email Restore Document](./MFA_EMAIL_RESTORE.md) - Implementation details for restoration
- [MFA OTP/TOTP Master Document](../MFA_OTP_TOTP_MASTER.md) - OTP flow patterns

---

## Overview

This document provides a complete reference for the UI structure, components, styling, and layout of Email device registration and authentication flows in the MFA system.

---

## Page Layout

### Email Configuration Page

**Location:** `/v8/mfa/register/email`  
**Component:** `EmailOTPConfigurationPageV8.tsx`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  MFANavigationV8 (Top Navigation Bar)                   │
├─────────────────────────────────────────────────────────┤
│  Email Configuration Header (Blue Gradient)            │
│  - Title: "Email Device Registration"                    │
│  - Subtitle: "Configure Email MFA settings"              │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │  Worker Token Status Section                    │  │
│  │  - Status indicator (Valid/Expired/Missing)     │  │
│  │  - "Get Worker Token" button if invalid         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Registration Flow Type Selection                │  │
│  │  - Admin Flow (Worker Token)                     │  │
│  │  - User Flow (OAuth Access Token)                 │  │
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

## Email Registration Flow

**Location:** `/v8/mfa/register/email/device`  
**Component:** `EmailFlowV8.tsx`

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
- Email address input
- Device name input (conditional, based on `promptForNicknameOnPairing`)
- "Register Email Device" button
- Loading indicator during registration

**Email Input:**
- Standard email input field
- Validates email format
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

## Email Authentication Flow

**Location:** `/v8/mfa/auth`  
**Component:** `MFAAuthenticationMainPageV8.tsx`

### Device Selection

**UI Elements:**
- Username input
- Environment ID input
- Device Authentication Policy selector
- Email device list
- Device selection buttons

### OTP Validation

**UI Elements:**
- OTP input modal
- "Resend Code" button
- "Validate" button
- Error message display

---

## Helper Components

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

- **v1.0.0** (2026-01-06): Initial Email UI documentation

---

## Notes

- **Device Selection:** Skipped during registration, only shown during authentication
- **Email Validation:** Standard email format required
- **OTP Input:** Configurable length via `config.otpCodeLength`
- **Error Handling:** All errors normalized to user-friendly messages

