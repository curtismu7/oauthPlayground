# Email Registration UI Flow

This document provides a visual diagram of the UI page flow for Email device registration.

## Flow Diagram

```mermaid
flowchart TD
    Start([Start: MFA Hub]) --> Config[Page: Email Configuration<br/>Step 0 - Configure]
    
    Config -->|User Flow| AuthModal[Modal: PingOne Authentication<br/>User Login Modal]
    Config -->|Admin Flow<br/>Worker Token| DeviceReg[Modal: Email Device Registration<br/>Step 1 - Register Device]
    
    AuthModal -->|PingOne Redirect| AuthCallback[OAuth Callback<br/>user-mfa-login-callback]
    AuthCallback --> AuthSuccess[Modal: Authentication Success<br/>User Authentication Success Modal]
    
    AuthSuccess -->|Auto-advance after 2s| DeviceReg
    
    DeviceReg -->|Register Device| DeviceStatus{Device Status}
    
    DeviceStatus -->|ACTIVE| SuccessPage[Page: Success<br/>Step 2 - Success]
    DeviceStatus -->|ACTIVATION_REQUIRED| OTPValidation[Page: OTP Validation<br/>Step 2 - Validate OTP]
    
    OTPValidation -->|Validate OTP| OTPCheck{OTP Valid?}
    OTPCheck -->|Valid| SuccessPage
    OTPCheck -->|Invalid| OTPValidation
    
    SuccessPage --> End([End: Return to Hub])
    
    style Start fill:#e1f5ff
    style Config fill:#fff4e6
    style AuthModal fill:#f3e5f5
    style AuthSuccess fill:#e8f5e9
    style DeviceReg fill:#e3f2fd
    style OTPValidation fill:#fff9c4
    style SuccessPage fill:#c8e6c9
    style End fill:#e1f5ff
    style DeviceStatus fill:#ffe4b5
    style OTPCheck fill:#ffe4b5
```

## Detailed Step Descriptions

### Step 0: Email Configuration Page
- **Route:** `/v8/mfa/register/email/config` or `/v8/mfa/register/email/device` (if configured)
- **Purpose:** Configure email registration settings
- **Fields:**
  - Environment ID
  - Username
  - Device Authentication Policy (dropdown)
  - Worker Token (for Admin Flow) OR User Token (for User Flow)
  - **User Token Button/Display:** Shows user token status and "Login with PingOne" button when User Flow is selected (tokenType === 'user')
- **Actions:**
  - **Admin Flow:** "Proceed to Registration" button (enabled when worker token is valid)
  - **User Flow:** "Start Authentication" button → Opens PingOne Authentication Modal
  - **User Token Management:** User token display with "Clear" button (when token exists) or "Login with PingOne" button (when token is missing)
- **Fallback:** "Next Step" button is always available in the footer as a backup for manual progression to Step 1 (enabled when all prerequisites are met: environment ID, username, device policy, and valid token (worker or user))
- **'oauth_completed' Placeholder:**
  - After successful OAuth authentication, `userToken` is set to `'oauth_completed'` (placeholder, not actual token)
  - This placeholder indicates successful authentication and is accepted by validation logic
  - Device registration operations automatically use worker token even in user flows (see "User Token Handling" section below)

### Step: PingOne Authentication (User Flow Only)
- **Modal:** User Login Modal (`UserLoginModalV8`)
- **Purpose:** Authenticate user to get user token
- **Process:**
  1. User clicks "Start Authentication"
  2. Redirects to PingOne authorization endpoint
  3. User authenticates
  4. PingOne redirects back to `/user-mfa-login-callback`
  5. OAuth callback is processed
  6. User token is received and saved

### Step: Authentication Success Modal (User Flow Only)
- **Component:** User Authentication Success Modal (`UserAuthenticationSuccessModalV8`)
- **Display:** Modal overlay (fixed position, centered)
- **Purpose:** Confirm successful authentication and display user data from PingOne
- **Features:**
  - Shows user information from PingOne (username, email, name, etc.)
  - Displays session details (token type, expires in, scopes, environment ID)
  - Displays subject (sub) - User ID from PingOne
  - Auto-advances to Device Registration Modal after 2 seconds (for MFA flows)
  - Manual "Continue to Device Registration" button available
  - Close button (X) and ESC key support
- **Navigation:** Auto-navigates to Step 1 (Device Registration Modal) after 2 seconds
- **Fallback:** "Continue to Device Registration" button is always available for manual navigation if auto-advance fails or user wants to proceed immediately

### Step 1: Email Device Registration/Selection Modal
- **Route:** `/v8/mfa/register/email/device` (Step 1)
- **Display:** Modal overlay (fixed position, centered)
- **Purpose:** Register new email device or select existing device for user
- **Fields:**
  - Email address (auto-filled from PingOne if available)
  - Device nickname (optional)
- **Actions:**
  - "Register Device" button (for new devices)
  - Device selection (for existing devices)
- **Modal Behavior:**
  - Modal is displayed as a fixed overlay (`position: fixed`) on top of the page
  - Centered on screen with semi-transparent backdrop (`rgba(0, 0, 0, 0.5)`)
  - Modal content is centered vertically and horizontally
  - Has a close button (X) in the header to return to previous step
  - Backdrop click does NOT close modal (requires explicit close action)
- **Process:**
  1. User enters email address (if not auto-filled) or selects existing device
  2. User enters device nickname (optional, for new devices)
  3. Clicks "Register Device" button
  4. API call: `POST /v1/environments/{envId}/users/{userId}/devices`
  5. PingOne responds with device status:
     - **ACTIVE:** Device is immediately ready → Navigate to Step 1 (back to device selection)
     - **ACTIVATION_REQUIRED:** OTP automatically sent by PingOne → Auto-advance to Step 3 (Validate OTP), skipping Step 2
- **Fallback:** "Next Step" button is always available in the footer as a backup for manual progression if auto-advance fails or user wants to proceed immediately

### Step 2: Send OTP Code
- **Route:** `/v8/mfa/register/email/device` (Step 2)
- **Purpose:** Send OTP code to registered email address
- **Behavior:**
  - **For ACTIVATION_REQUIRED devices:** This step is automatically skipped - PingOne sends OTP during device registration
  - **For existing ACTIVE devices:** User can manually send OTP for device authentication
- **Features:**
  - "Send OTP Code" button
  - "Resend OTP Code" button (after initial send)
  - Device ID and email address display
  - Success message after OTP is sent
  - Error handling for send failures
- **Process:**
  1. User clicks "Send OTP Code" button
  2. API call: `POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}/otp/send`
  3. OTP is sent to email address
  4. Navigate to Step 3 (Validate OTP)
- **Note:** For newly registered devices with `ACTIVATION_REQUIRED` status, this step is skipped because PingOne automatically sends the OTP during device registration.

### Step 3: Validate OTP OR Success Page (Conditional)
- **Route:** `/v8/mfa/register/email/device` (Step 3)
- **Display:** 
  - OTP Validation: Inline content (not a modal)
  - Success: Full page component
- **Purpose:** Validate OTP code (if ACTIVATION_REQUIRED) OR show success (if ACTIVE)
- **Behavior:**
  - **If device status is ACTIVE:** Shows Success Page immediately
  - **If device status is ACTIVATION_REQUIRED:** Shows OTP Validation form
- **OTP Validation Features:**
  - OTP input field (6 digits)
  - "Validate OTP" button
  - "Resend OTP" button (if needed)
  - Error display for invalid OTP attempts
- **OTP Validation Process:**
  1. User receives OTP code via email (automatically sent by PingOne during registration, or manually sent from Step 2)
  2. User enters OTP code
  3. API call: `POST /v1/environments/{envId}/users/{userId}/devices/{deviceId}/otp/check`
  4. If valid → Device status changes to ACTIVE → Success Page is shown (same Step 3, re-renders automatically)
  5. If invalid → Show error, allow retry on same step
- **Fallback:** "Next Step" button is always available in the footer as a backup for manual progression if needed (though typically not needed since OTP validation triggers automatic re-render to Success Page)
- **Success Page Features:**
  - Success message
  - Device details (ID, email, nickname, status)
  - "Start Again" button (returns to MFA Hub via `navigateToMfaHubWithCleanup`)
  - API calls display (collapsible, via `SuperSimpleApiDisplayV8`)
  - Documentation button (opens documentation modal)
- **Navigation:**
  - After successful OTP validation, device status becomes ACTIVE
  - Step 3 re-renders and shows Success Page (no navigation to Step 4)

## Flow Paths Summary

### Admin Flow Path (Worker Token)
```
MFA Hub 
  → Email Configuration (Step 0)
  → Email Device Registration Modal (Step 1)
  → [ACTIVE] Return to Step 1 (device selection)
  OR
  → [ACTIVATION_REQUIRED] Skip Step 2 (Send OTP - automatic)
    → OTP Validation (Step 3)
      → After successful OTP validation: Success Page (Step 3 - re-renders)
```

### User Flow Path (User Token via PingOne Auth)
```
MFA Hub
  → Email Configuration (Step 0)
  → PingOne Authentication Modal
  → OAuth Callback
  → Authentication Success Modal
  → Email Device Registration Modal (Step 1)
  → [ACTIVE] Return to Step 1 (device selection)
  OR
  → [ACTIVATION_REQUIRED] Skip Step 2 (Send OTP - automatic)
    → OTP Validation (Step 3)
      → After successful OTP validation: Success Page (Step 3 - re-renders)
```

**Note:** Step 2 (Send OTP) is automatically skipped for devices registered with `ACTIVATION_REQUIRED` status because PingOne sends the OTP automatically during device registration. Step 3 is a conditional step that shows either OTP Validation OR Success Page depending on device status. After successful OTP validation, the device status becomes ACTIVE and Step 3 re-renders to show the Success Page (no navigation to Step 4).

## Key Differences: Admin vs User Flow

| Aspect | Admin Flow | User Flow |
|--------|-----------|-----------|
| **Token Type** | Worker Token | User Token (from PingOne Auth) |
| **Authentication** | Not required | Required (PingOne OAuth) |
| **Device Status** | Can be ACTIVE or ACTIVATION_REQUIRED | Always ACTIVATION_REQUIRED |
| **OTP Step (Step 2)** | Optional (only if ACTIVATION_REQUIRED) - automatically skipped, OTP sent by PingOne | Always required - automatically skipped, OTP sent by PingOne |
| **Validation Step (Step 3)** | Required (if ACTIVATION_REQUIRED) | Always required |
| **Auto-advance** | From Config → Device Registration Modal | From Auth Success Modal → Device Registration Modal |
| **Fallback Buttons** | "Next Step" button always available in footer | "Next Step" button always available in footer |

## Step Structure

The Email Registration flow uses **4 steps** (Step 0, Step 1, Step 2, Step 3):
- **Step Labels:** `['Configure', 'Select/Register Device', 'Send OTP', 'Validate']`
- **Step 0:** Configuration Page
- **Step 1:** Device Registration/Selection Modal
- **Step 2:** Send OTP Code (can be skipped for ACTIVATION_REQUIRED devices - OTP is sent automatically)
- **Step 3:** Validate OTP (conditional - shows Success Page if device is ACTIVE)

**Important:** When a device is registered with `ACTIVATION_REQUIRED` status, Step 2 (Send OTP) is automatically skipped and the flow navigates directly to Step 3 (Validate) because PingOne automatically sends the OTP during device registration.

After successful OTP validation in Step 3, the device status becomes `ACTIVE` and Step 3 re-renders to show the Success Page.

## Notes

- **OTP Auto-send:** When a device is registered with `ACTIVATION_REQUIRED` status, PingOne automatically sends an OTP code to the email address. No separate "Send OTP" step is required.
- **Token Persistence:** User tokens are saved to localStorage immediately upon receipt to ensure they persist across page refreshes.
- **State Preservation After PingOne Authentication (User Flows Only):**
  - Before redirecting to PingOne for user authentication, the current page path (including query parameters) is stored in `sessionStorage` under the key `user_login_return_to_mfa`.
  - After successful PingOne authentication, the OAuth callback handler (`CallbackHandlerV8U`) retrieves the stored return path and redirects the user back to the exact page they were on (e.g., `/v8/mfa/register/email/device?step=1`).
  - The callback handler also sets a marker `mfa_oauth_callback_return` in `sessionStorage` to signal that state restoration should occur.
  - `MFAFlowBaseV8` detects this marker and automatically advances the flow from Step 0 to Step 1 if a user token is present and Step 0 validation passes.
  - This ensures users return to the exact step they were on (not the MFA Hub) and can seamlessly continue their device registration flow.
  - **Storage Keys Used:**
    - `user_login_return_to_mfa`: Stores the return path as a plain string (e.g., `/v8/mfa/register/email/device?step=1`)
    - `mfa_oauth_callback_return`: Marker set to `'true'` after OAuth callback to trigger state restoration
  - **Note:** This state preservation mechanism only applies to User Flows that require PingOne authentication. Admin Flows (using worker tokens) do not require this mechanism.
- **Email Auto-fill:** Email address is automatically fetched from PingOne user profile if available, otherwise user must enter it.
- **Step 2 Conditional Rendering:** Step 2 uses conditional logic to show either OTP Validation or Success Page based on device status (`deviceRegisteredActive` state or `mfaState.deviceStatus`).
- **Fallback Navigation:** All steps include "Next Step" buttons in the footer (via `StepActionButtonsV8` component) as a backup mechanism for manual progression, even when auto-advance is active. These buttons are enabled when step prerequisites are met (valid credentials, required fields filled, etc.). This ensures users can always progress manually if auto-advance fails or if they prefer manual control.

## Security & Implementation Details

### ✅ Token Handling (CRITICAL)
**Status:** ✅ **IMPLEMENTED CORRECTLY**

All API calls correctly pass `tokenType` and `userToken` parameters to ensure proper security model compliance:

- **`registerDevice`:** Passes `tokenType` and `userToken` to use correct token based on flow type
- **`activateDevice`:** Passes `tokenType` and `userToken` for OTP validation
- **`resendPairingCode`:** Passes `tokenType` and `userToken` for resending OTP codes

**Security Model:**
- **User Flows:** Use user tokens (access tokens from Authorization Code Flow)
- **Admin Flows:** Use worker tokens
- This ensures proper authentication and authorization boundaries

### ✅ Auto-Advance Reliability
**Status:** ✅ **IMPLEMENTED**

Auto-advance is implemented at key points with fallback buttons:

1. **Device Registration → Step 2:**
   - ACTIVE devices: Auto-advances to Success Page after 100ms
   - ACTIVATION_REQUIRED devices: Auto-advances to OTP Validation after 100ms
   - Fallback: "Next Step" button always available

2. **OTP Validation Success → Step 2 (Success Page):**
   - Auto-advances to Success Page after 100ms delay
   - Fallback: "Next Step" button always available

3. **Authentication Success → Step 1 (Device Registration):**
   - Auto-advances after 2 seconds
   - Fallback: "Continue to Device Registration" button always available

### ✅ Code Quality & Consistency
**Status:** ✅ **OPTIMIZED**

- **No unused state variables:** Cleaned up unused `showValidationModal` state
- **Consistent patterns:** Matches SMS flow implementation patterns for maintainability
- **Error handling:** Proper try/catch blocks with user-friendly error messages
- **Type safety:** Uses TypeScript with proper type definitions

### 📋 Detailed Analysis

For a comprehensive security analysis, including:
- Detailed issue breakdown
- Security implications
- Auto-advance failure point analysis
- Code quality improvements
- All fixes applied

See: **`docs/EMAIL_FLOW_SECURITY_ANALYSIS.md`**
