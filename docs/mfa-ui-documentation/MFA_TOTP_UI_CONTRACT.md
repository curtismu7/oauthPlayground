# MFA TOTP UI Contract

## Related Documentation

- [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) - Detailed worker token configuration and modal behavior contracts
- [MFA TOTP UI Documentation](./MFA_TOTP_UI_DOC.md) - TOTP UI structure and components
- [MFA TOTP Restore Document](./MFA_TOTP_RESTORE.md) - Implementation details for restoration
- [MFA TOTP Master Document](../MFA_TOTP_MASTER.md) - TOTP flow patterns and API details

---

**Last Updated:** 2026-01-06 18:15:00  
**Version:** 1.3.0  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document defines the UI contract for TOTP (Time-based One-Time Password) device registration and authentication flows. This contract ensures consistent behavior, error handling, and user experience across all TOTP-related UI components.

---

## Scope

**Applies To:**
- ✅ TOTP Device Registration Flow (Admin)
- ✅ TOTP Device Registration Flow (User)
- ✅ TOTP Device Authentication Flow
- ✅ TOTP Configuration Page
- ✅ TOTP Error Handling

---

## UI Component Contracts

### 1. TOTP Configuration Page

**Component:** `TOTPConfigurationPageV8.tsx`  
**Route:** `/v8/mfa/register/totp`

#### Required UI Elements

1. **Worker Token Status Section**
   - Must display token status (Valid/Expired/Missing)
   - Must show "Get Worker Token" button if token is invalid
   - Must prevent proceeding if token is invalid (for Admin flow)
   - Must respect "Silent API Token Retrieval" and "Show Token After Generation" settings
   - See [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) for detailed worker token configuration contracts

2. **Registration Flow Type Selection**
   - Must display "Admin Flow" vs "User Flow" selection
   - Admin Flow: Uses worker token, can set device status (ACTIVE/ACTIVATION_REQUIRED)
   - User Flow: Uses OAuth access token, always creates ACTIVATION_REQUIRED devices
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

### 2. TOTP Registration Flow

**Component:** `TOTPFlowV8.tsx`  
**Route:** `/v8/mfa/register/totp/device`

#### Step 0: Configuration

**Contract:**
- Must display environment ID input
- Must display username input
- Must display device authentication policy selector
- Must display token type selector (Worker/User)
- Must validate all inputs before allowing progression
- Must show "Start Registration" button

**State:**
- Credentials stored in `credentials` state
- Token status checked via `WorkerTokenStatusServiceV8`
- Policies loaded from `MFAServiceV8.listDeviceAuthenticationPolicies()`

#### Step 1: Device Selection

**Contract:**
- During registration flow (from config page), device selection is **completely skipped**
- Device selection is ONLY shown during authentication flows
- If `isConfigured === true`, automatically navigate to Step 2

**Critical:** Registration and authentication flows are completely separate. Device selection must NEVER appear during registration.

#### Step 2: Device Registration

**Contract:**
- Must display device name input (optional, shown if `promptForNicknameOnPairing` is enabled)
- Must default device name to "TOTP Device - {username}" if not provided
- Must show "Register TOTP Device" button
- Must handle device registration errors gracefully
- Must create device with `status: "ACTIVATION_REQUIRED"` to receive secret and QR code

**Device Registration Contract:**
- Must call `MFAServiceV8.registerDevice()` with `type: "TOTP"`
- Must include `status: "ACTIVATION_REQUIRED"` in request (for User flow or when admin selects ACTIVATION_REQUIRED)
- Must extract `secret` and `keyUri` from response
- Must store secret and QR code URI in state
- Must track secret expiration (30 minutes from device creation)

#### Step 3: QR Code Display and Activation

**Contract:**
- Must ALWAYS display QR code modal (regardless of device status)
- Must display QR code using `keyUri` from device registration response
- Must display TOTP secret (with copy button)
- Must show "What is this?" button with education content
- Must handle secret expiration (30 minutes)
- Must show "Activate Device with OTP" button ONLY if device status is `ACTIVATION_REQUIRED`
- Must open separate activation modal when activation button is clicked
- Must auto-advance to success page if device is `ACTIVE`

**QR Code Display Contract:**
- Must use `QRCodeSVG` component from `qrcode.react`
- Must render QR code from `keyUri` (otpauth://totp/... format)
- Must display secret in Base32 format
- Must provide copy button for secret
- Must show expiration warning if secret is expired
- Must display "Activate Device with OTP" button (green, centered) if `deviceStatus === 'ACTIVATION_REQUIRED'`
- Button must open separate activation modal (`setShowActivationModal(true)`)

**Activation Modal Contract:**
- Must be a separate modal (not embedded in QR code modal)
- Must open when "Activate Device with OTP" button is clicked
- Must display modal header with green gradient background
- Must display title: "Activate TOTP Device"
- Must display subtitle: "Enter the 6-digit code from your authenticator app"
- Must include close button (X) in header
- Must display OTP input using `MFAOTPInput` component
- Must respect `config.otpCodeLength` setting
- Must display error messages below OTP input if activation fails
- Must show info tip about opening authenticator app
- Must have sticky footer with "Cancel" and "Activate Device" buttons
- "Activate Device" button must be disabled until OTP length matches `otpLength`
- Must validate OTP and activate device via `MFAServiceV8.activateTOTPDevice()`
- Must handle activation errors gracefully
- Must close modal after successful activation
- Must close QR modal after successful activation
- Must show success page when `deviceStatus === 'ACTIVE' && !showQrModal && !showActivationModal`

**Stuck Device Warning Contract:**
- Must display warning section when `deviceStatus === 'ACTIVATION_REQUIRED'` AND `deviceId` exists
- Must explain that device is stuck and needs to be removed
- Must provide "Delete Device" button to delete current device and continue registration flow
- Must provide "Delete All Devices" button to navigate to delete-all-devices page
- Must show loading spinner during device deletion
- After successful deletion, must clear device state and navigate to Step 2 to register new device (NOT return to hub)
- Must reset auto-registration trigger and QR code state to allow new device registration
- Must display error toast if deletion fails
- Must pre-fill delete-all-devices page with environmentId, username, deviceType: 'TOTP', deviceStatus: 'ACTIVATION_REQUIRED'

**Navigation Contract:**
- Must prevent navigation from Step 3 to Step 4 during registration
- Must stay on Step 3 (QR code page) until user manually proceeds
- "Next step" button must navigate to OTP validation page (not success page)
- Closing QR modal (X button or ESC) must navigate back appropriately (hub for registration, Step 2 for authentication)
- Closing activation modal (X button or Cancel) must close modal and clear OTP input/errors
- **After successful OTP activation:**
    - Must set `userClosedQrModalRef.current = true` to prevent QR modal from auto-reopening
    - Must close activation modal (`setShowActivationModal(false)`)
    - Must close QR modal (`setShowQrModal(false)`)
    - Must clear activation OTP state (`setActivationOtp('')` and `setActivationError(null)`)
    - Must show success page when `deviceStatus === 'ACTIVE' && !showQrModal && !showActivationModal`
    - QR modal auto-open logic must check `deviceStatus !== 'ACTIVE'` before reopening

#### Step 4: OTP Validation (Authentication)

**Contract:**
- Must display OTP input modal
- Must use `MFAOTPInput` component
- Must validate OTP code
- Must handle validation errors gracefully
- Must show success message on successful validation

**Note:** Step 4 is primarily for authentication flows. During registration, Step 3 is the final step before success page.

#### Step 5: Success Page

**Contract:**
- Must display success icon and message
- Must display device information summary
- Must show "View Documentation" button
- Must show "Back to Hub" button

---

### 3. TOTP Authentication Flow

**Component:** `MFAAuthenticationMainPageV8.tsx`  
**Route:** `/v8/mfa/auth`

#### Device Selection

**Contract:**
- Must display username input
- Must display environment ID input
- Must display device authentication policy selector
- Must load and display available TOTP devices
- Must allow user to select specific device

**Device List Contract:**
- Must show all available TOTP devices
- Must display device nickname
- Must show device status
- Must show "Select Device" button for each device

#### OTP Validation

**Contract:**
- Must show OTP input modal after device selection
- Must display OTP input field
- Must handle validation errors gracefully
- Must show success message on successful authentication

---

## Error Handling Contract

### Error Types

1. **Invalid OTP**
   - Must display error message in OTP validation modal
   - Must allow user to retry
   - Must track validation attempts

2. **Secret Expired**
   - Must display expiration modal (`TOTPExpiredModalV8`)
   - Must allow user to delete device and recreate
   - Must prevent QR code display if expired

3. **Device Registration Failed**
   - Must display user-friendly error message
   - Must allow user to retry registration
   - Must not show technical error details

4. **Policy Validation Error**
   - Must display error: "policy must contain either 'id' or 'type'. valid 'type'=[DEFAULT]"
   - Must ensure policy object contains only `id` (not `type`) when ID is provided

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

### QR Code Display Modal

**Contract:**
- Must be closable by user
- Must display QR code prominently
- Must display TOTP secret with copy button
- Must show "What is this?" button with education content
- Must show "Activate Device with OTP" button (if ACTIVATION_REQUIRED) - opens separate activation modal
- Must have scrollable body and sticky footer
- Must NOT contain embedded OTP input (OTP input is in separate modal)

### Activation OTP Modal

**Contract:**
- Must be a separate modal (not embedded in QR code modal)
- Must be closable by user (X button or Cancel button)
- Must display OTP input prominently
- Must show error messages clearly
- Must have scrollable body and sticky footer
- Must close automatically after successful activation

### OTP Validation Modal

**Contract:**
- Must be closable by user
- Must not auto-reopen unexpectedly
- Must have scrollable body and sticky footer
- Must display OTP input with proper spacing
- Must show error messages clearly
- Must have "Validate" button

---

## Version History

- **v1.3.0** (2026-01-06): Separated OTP activation into its own modal (not embedded in QR modal)
- **v1.2.0** (2026-01-06): Added stuck device warning section with delete buttons
- **v1.1.0** (2026-01-06): Added navigation fixes and success page display
- **v1.0.0** (2026-01-06): Initial TOTP UI contract

---

## Notes

- **Device Selection:** Completely skipped during registration, only shown during authentication
- **QR Code:** Always displayed on Step 3, regardless of device status
- **Secret Expiration:** 30 minutes from device creation
- **Activation OTP:** Separate modal opened via button in QR modal (only if device status is ACTIVATION_REQUIRED)
- **Policy Format:** Must contain only `id` (not `type`) when ID is provided
- **Stuck Device Warning:** Appears when device is in ACTIVATION_REQUIRED status, provides delete options to recover
- **Success Page:** Shows after activation when both QR modal and activation modal are closed and device status is ACTIVE

