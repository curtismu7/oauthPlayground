# MFA TOTP UI Documentation

**Last Updated:** 2026-01-06 20:30:00  
**Version:** 1.4.0  
**Status:** ✅ IMPLEMENTED

---

## Related Documentation

- [MFA TOTP UI Contract](./MFA_TOTP_UI_CONTRACT.md) - UI behavior contracts
- [MFA TOTP Restore Document](./MFA_TOTP_RESTORE.md) - Implementation details for restoration
- [MFA TOTP Master Document](../MFA_TOTP_MASTER.md) - TOTP flow patterns and API details

---

## Overview

This document provides a complete reference for the UI structure, components, styling, and layout of TOTP device registration and authentication flows in the MFA system.

---

## Page Layout

### TOTP Configuration Page

**Location:** `/v8/mfa/register/totp`  
**Component:** `TOTPConfigurationPageV8.tsx`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  MFANavigationV8 (Top Navigation Bar)                   │
├─────────────────────────────────────────────────────────┤
│  TOTP Configuration Header (Blue Gradient)            │
│  - Title: "TOTP Device Registration"                      │
│  - Subtitle: "Configure TOTP MFA settings"              │
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

## TOTP Registration Flow

**Location:** `/v8/mfa/register/totp/device`  
**Component:** `TOTPFlowV8.tsx`

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

**Note:** Step 1 is completely skipped during registration flow (when coming from config page).

### Step 2: Device Registration

**UI Elements:**
- Device name input (conditional, based on `promptForNicknameOnPairing`)
- "Register TOTP Device" button
- Loading indicator during registration

**Modal Layout:**
- Header: Green gradient background
- Max width: 550px
- Title: "Register TOTP Device"
- Subtitle: "Add a new authenticator app device"
- Body padding: `16px 20px`

### Step 3: QR Code Display and Activation

**UI Elements:**
- QR code display (using `QRCodeSVG` from `qrcode.react`)
- TOTP secret display (Base32 format)
- Copy secret button
- "What is this?" button with education content
- "Activate Device with OTP" button (if `ACTIVATION_REQUIRED`) - opens separate activation modal
- "Close" button in footer

**QR Code Modal:**
- Always displayed on Step 3
- Scrollable body
- Sticky footer
- QR code size: 180x180 pixels (reduced from 256x256)
- Secret displayed below QR code
- Copy button for secret
- Max width: 500px
- Max height: 85vh
- Overlay alignment: flex-start with 5vh padding

**Activation Modal (Separate):**
- Opens when "Activate Device with OTP" button is clicked
- Header: Green gradient background (`linear-gradient(135deg, #10b981 0%, #059669 100%)`)
- Title: "Activate TOTP Device"
- Subtitle: "Enter the 6-digit code from your authenticator app"
- Close button (X) in header top-right
- OTP input using `MFAOTPInput` component
- Configurable length via `config.otpCodeLength` (default: 6)
- Error message display below OTP input (red background, red border) - shown when activation fails
- Info tip box (blue background) with instructions
- Sticky footer with "Cancel" and "Activate Device →" buttons
- "Activate Device" button disabled until OTP length matches `otpLength`
- Max width: 500px
- Max height: 85vh
- Scrollable body
- **On Success:**
  - Activation modal closes
  - QR modal closes (if still open)
  - Navigates to Step 4 explicitly (`nav.goToStep(4)`)
  - Success page is shown automatically (device status becomes ACTIVE)
  - Success toast displayed: "TOTP device activated successfully!"
  - QR modal prevented from reopening (`userClosedQrModalRef.current = true`)
- **On Error:**
  - Modal stays open (does NOT close)
  - Error message displayed in red error box below OTP input
  - Error messages are normalized (e.g., "Invalid OTP code. Please try again.")
  - OTP input is cleared automatically so user can enter new code
  - Error toast displayed: "Activation failed: [error message]"
  - User can correct and retry without closing modal

**Stuck Device Warning Section:**
- Displayed when `deviceStatus === 'ACTIVATION_REQUIRED'` AND `deviceId` exists
- Warning box with red background (`#fef2f2`) and red border (`#fecaca`)
- Warning icon (⚠️) and heading: "Device Stuck in Activation Required"
- Explanation text explaining device is stuck and needs to be removed
- Tip about using "Delete All Devices" for multiple devices
- Two action buttons:
  - **Delete Device** (red, `#dc2626`): Deletes current device, shows loading spinner, navigates to hub on success
  - **Delete All Devices** (orange, `#f59e0b`): Navigates to `/v8/delete-all-devices` page with pre-filled filters
- Buttons displayed side-by-side with flex layout
- Loading spinner animation for delete button during deletion

### Step 4: OTP Validation (Authentication)

**UI Elements:**
- OTP input modal
- "Validate" button
- Error message display

**Note:** Step 4 is primarily for authentication flows.

### Step 5: Success Page

**UI Elements:**
- Success icon and message
- Device information summary
- "View Documentation" button
- "Back to Hub" button

---

## TOTP Authentication Flow

**Location:** `/v8/mfa/auth`  
**Component:** `MFAAuthenticationMainPageV8.tsx`

### Device Selection

**UI Elements:**
- Username input
- Environment ID input
- Device Authentication Policy selector
- TOTP device list
- Device selection buttons

### OTP Validation

**UI Elements:**
- OTP input modal
- "Validate" button
- Error message display

---

## Helper Components

### QRCodeSVG

**Purpose:** QR code rendering component

**Props:**
- `value: string` - QR code data (otpauth://totp/... URI)
- `size?: number` - QR code size in pixels (default: 256)
- `level?: string` - Error correction level

**Usage:**
```typescript
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG
    value={qrCodeUrl}
    size={256}
    level="M"
/>
```

### MFAOTPInput

**Purpose:** OTP code input component

**Props:**
- `length: number` - Number of digits (default: 6)
- `value: string` - Current OTP value
- `onChange: (value: string) => void` - Change handler
- `autoFocus?: boolean` - Auto-focus first input
- `autoSubmit?: boolean` - Auto-submit when complete
- `error?: string` - Error message to display

---

## Styling Conventions

- **Primary Actions:** Green (`#10b981`)
- **Secondary Actions:** Blue (`#3b82f6`)
- **Error Messages:** Red (`#dc2626`)
- **Backgrounds:** Light gray (`#f9fafb`), white (`#ffffff`)
- **Text:** Dark gray (`#1f2937`), medium gray (`#6b7280`)
- **QR Code:** White background, black foreground

---

## Version History

- **v1.4.0** (2026-01-06): Updated activation modal behavior - navigates to Step 4 on success, stays open on error with cleared OTP input
- **v1.3.0** (2026-01-06): Separated OTP activation into its own modal with detailed UI documentation
- **v1.2.0** (2026-01-06): Added stuck device warning section UI documentation
- **v1.1.0** (2026-01-06): Added navigation and success page UI documentation
- **v1.0.0** (2026-01-06): Initial TOTP UI documentation

---

## Notes

- **Device Selection:** Completely skipped during registration, only shown during authentication
- **QR Code:** Always displayed on Step 3, regardless of device status
- **Secret Expiration:** 30 minutes from device creation
- **Activation OTP:** Separate modal (not embedded in QR modal) opened via button when device status is ACTIVATION_REQUIRED
- **Navigation:** Step 3 "Close" button closes QR modal and navigates back appropriately
- **Stuck Device Warning:** Appears automatically when device is in ACTIVATION_REQUIRED status, provides recovery options
- **Success Page:** Shows after successful activation when both QR modal and activation modal are closed

