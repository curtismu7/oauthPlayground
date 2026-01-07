# MFA Mobile UI Contract

## Related Documentation

- [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) - Detailed worker token configuration and modal behavior contracts
- [MFA Mobile UI Documentation](./MFA_MOBILE_UI_DOC.md) - Mobile UI structure and components
- [MFA Mobile Restore Document](./MFA_MOBILE_RESTORE.md) - Implementation details for restoration
- [MFA Mobile Master Document](../MFA_MOBILE_MASTER.md) - Mobile flow patterns and API details
- [MFA OTP/TOTP Master Document](../MFA_OTP_TOTP_MASTER.md) - OTP flow patterns (SMS/Email/WhatsApp)

---

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document defines the UI contract for Mobile device registration and authentication flows. Mobile is implemented as an OTP device type (SMS-based) with Flow API integration and SPA OAuth with PKCE. This contract ensures consistent behavior, error handling, and user experience across all Mobile-related UI components.

---

## Scope

**Applies To:**
- ✅ Mobile Device Registration Flow (Admin)
- ✅ Mobile Device Registration Flow (User)
- ✅ Mobile Device Authentication Flow
- ✅ Mobile Configuration Page
- ✅ Mobile Error Handling

---

## UI Component Contracts

### 1. Mobile Configuration Page

**Component:** `MobileOTPConfigurationPageV8.tsx`  
**Route:** `/v8/mfa/register/mobile`

#### Required UI Elements

1. **Worker Token Status Section**
   - Must display token status (Valid/Expired/Missing)
   - Must show "Get Worker Token" button if token is invalid
   - Must prevent proceeding if token is invalid (for Admin flow)
   - Must respect "Silent API Token Retrieval" and "Show Token After Generation" settings
   - See [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) for detailed worker token configuration contracts

2. **Registration Flow Type Selection**
   - Must display "Admin Flow" vs "User Flow" selection
   - Admin Flow: Uses worker token
   - User Flow: Uses OAuth access token (SPA OAuth with PKCE)
   - Selection must sync with token type dropdown

3. **Device Authentication Policy Selector**
   - Must load policies from PingOne
   - Must display policy name and description
   - Must allow policy selection
   - Must validate policy selection before proceeding

4. **Action Buttons**
   - "Back to Hub" button (left)
   - "Continue to Device Registration" button (right, primary)

#### State Management

- Configuration must be saved to `localStorage` via `CredentialsServiceV8`
- Configuration must be loaded on page mount
- Changes must be persisted immediately

#### Validation Rules

- Environment ID must be non-empty
- Username must be non-empty
- Device Authentication Policy must be selected
- Worker Token must be valid (for Admin flow)
- User Token must be present (for User flow)

---

### 2. Mobile Registration Flow

**Component:** `MobileFlowV8.tsx`  
**Route:** `/v8/mfa/register/mobile/device`

**Note:** Mobile uses the SMS flow controller (`SMSFlowController`) and follows SMS patterns. See [MFA SMS UI Contract](./MFA_SMS_UI_CONTRACT.md) for detailed flow contracts.

#### Step 0: Configuration

**Contract:**
- Must display environment ID input
- Must display username input
- Must display device authentication policy selector
- Must display token type selector (Worker/User)
- Must validate all inputs before allowing progression
- Must show "Start Registration" button

#### Step 1: Device Selection

**Contract:**
- During registration flow (from config page), device selection is **skipped**
- Device selection is only shown during authentication flows
- If `isConfigured === true`, automatically navigate to Step 2

#### Step 2: Device Registration

**Contract:**
- Must display phone number input with country code picker
- Must display device name input (optional, shown if `promptForNicknameOnPairing` is enabled)
- Must validate phone number format (E.164)
- Must default device name to "MOBILE" when entering Step 2
- Must show "Register Mobile Device" button
- Must handle device registration errors gracefully

#### Step 3: OTP Sent / Validation

**Contract:**
- Must display OTP input field (6 digits, auto-focus, auto-submit if enabled)
- Must show "Resend Code" button
- Must display validation errors clearly
- Must handle `ACTIVE` vs `ACTIVATION_REQUIRED` device statuses
- For `ACTIVE` devices: Show success page immediately
- For `ACTIVATION_REQUIRED` devices: Show OTP input modal

#### Step 4: Success Page

**Contract:**
- Must display success icon and message
- Must display device information summary
- Must show "View Documentation" button
- Must show "Back to Hub" button

---

### 3. Mobile Authentication Flow

**Component:** `MFAAuthenticationMainPageV8.tsx`  
**Route:** `/v8/mfa/auth`

#### Device Selection

**Contract:**
- Must display username input
- Must display environment ID input
- Must display device authentication policy selector
- Must load and display available Mobile devices
- Must allow user to select specific device

#### OTP Validation

**Contract:**
- Must show OTP input modal after device selection
- Must send OTP to selected device
- Must display OTP input field
- Must handle validation errors gracefully
- Must show success message on successful authentication

---

## Error Handling Contract

### Error Types

1. **LIMIT_EXCEEDED**
   - Must display `MFACooldownModalV8` with cooldown duration
   - Must show toast notification
   - Must prevent further attempts during cooldown

2. **Invalid OTP**
   - Must display error message in OTP validation modal
   - Must allow user to retry
   - Must track validation attempts

3. **Device Registration Failed**
   - Must display user-friendly error message
   - Must allow user to retry registration
   - Must not show technical error details

4. **Network Errors**
   - Must display generic error message
   - Must allow user to retry
   - Must not crash the application

---

## State Preservation Contract

**Applies To:** User Flow (OAuth authentication)

**Contract:**
- Must preserve current step/page before OAuth redirect
- Must restore state after OAuth callback
- Must use `sessionStorage` keys: `user_login_return_to_mfa`, `mfa_oauth_callback_return`
- See [MFA State Preservation UI Contract](./MFA_STATE_PRESERVATION_UI_CONTRACT.md) for details

---

## Modal Contracts

### OTP Validation Modal

**Contract:**
- Must be closable by user
- Must not auto-reopen unexpectedly
- Must have scrollable body and sticky footer
- Must display OTP input with proper spacing
- Must show error messages clearly
- Must have "Resend Code" button
- Must have "Validate" button

### Device Registration Modal

**Contract:**
- Must display phone number input with country code picker
- Must conditionally show device name input based on `promptForNicknameOnPairing`
- Must validate inputs before submission
- Must show loading state during registration
- Must handle errors gracefully

---

## Version History

- **v1.0.0** (2026-01-06): Initial Mobile UI contract

---

## Notes

- **Device Type:** Mobile is implemented as an OTP device type (SMS-based)
- **Controller:** Uses `SMSFlowController` for business logic
- **Flow API:** Integrates with PingOne Flow APIs for OAuth
- **OAuth:** Uses SPA OAuth with PKCE for User Flow
- **Device Selection:** Skipped during registration flow, only shown during authentication
- **Device Name:** Always defaults to "MOBILE" when entering Step 2
- **OTP Input:** Uses `MFAOTPInput` component with configurable length
- **Error Messages:** Must be normalized to user-friendly text
- **State Preservation:** Required for User Flow OAuth integration

