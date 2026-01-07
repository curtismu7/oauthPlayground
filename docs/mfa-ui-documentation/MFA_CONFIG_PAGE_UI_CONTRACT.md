# MFA Configuration Page UI Contract

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Status:** ✅ IMPLEMENTED  
**Purpose:** Defines the UI contract for the MFA Configuration Page to prevent drift and ensure consistent behavior

---

## Related Documentation

- [MFA Configuration Page UI Documentation](./MFA_CONFIG_PAGE_UI_DOC.md) - Complete UI structure and components
- [MFA Configuration Page Restore Document](./MFA_CONFIG_PAGE_RESTORE.md) - Implementation details for restoration
- [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) - Worker token configuration contracts

---

## Overview

This document defines the UI contract for the MFA Configuration Page (`MFAConfigurationPageV8.tsx`). This contract ensures consistent behavior, state management, and user experience across all configuration operations.

---

## Scope

**Applies To:**
- ✅ MFA Configuration Page (`/v8/mfa/configure`)
- ✅ Worker Token Settings Section
- ✅ Device Authentication Policy Settings Section
- ✅ PingOne MFA Settings Section
- ✅ OTP Settings Section
- ✅ FIDO2/WebAuthn Settings Section
- ✅ Push Notification Settings Section
- ✅ UI/UX Settings Section
- ✅ Security Settings Section

---

## Page Structure Contract

### 1. Page Layout

**Contract:**
- Page must have orange gradient header (`linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`)
- Title: "MFA Configuration" (28px, white, bold)
- Subtitle: "Manage MFA-specific settings for authentication flows, device management, and user experience" (16px, white, 90% opacity)
- Max width: `1200px`
- Padding: `24px`
- Background: `#f9fafb`
- Padding bottom adjusts based on API display visibility: `paddingBottom: isApiDisplayVisible ? '450px' : '24px'`

**Navigation:**
- Must include `MFANavigationV8` with `currentPage="settings"` and `showBackToMain={true}`
- Back button shown if `returnPath` exists in location state
- Back button text: "Back to {flowLabel}" (e.g., "Back to SMS Device Registration")

**API Display:**
- Must include `SuperSimpleApiDisplayV8` with `flowFilter="mfa"`
- API display visibility affects page padding

---

## Action Buttons Contract

### Top Action Buttons Bar

**Contract:**
- Must be displayed below header
- Flex layout with gap: `12px`
- Wrap enabled for responsive design
- All buttons have consistent styling

**Buttons (in order):**

1. **Save Changes**
   - Icon: `FiCheck`
   - Background: `#10b981` (green) when `hasChanges === true`, `#9ca3af` (gray) when disabled
   - Disabled when: `!hasChanges || isSaving`
   - Text: "Saving..." when `isSaving`, "Save Changes" otherwise
   - Saves local configuration to `localStorage` via `MFAConfigurationServiceV8.saveConfiguration()`

2. **Refresh Worker Token**
   - Icon: `FiRefreshCw`
   - Background: `#1f2937` (dark gray)
   - Disabled when: `isRefreshingToken`
   - Text: "Refreshing Token…" when `isRefreshingToken`, "Refresh Worker Token" otherwise
   - Calls `handleManualWorkerTokenRefresh()`

3. **Reset to Defaults**
   - Icon: `FiRefreshCw`
   - Background: `white`
   - Border: `1px solid #dc2626` (red)
   - Color: `#dc2626` (red)
   - Calls `handleReset()` to reset all settings to defaults

4. **Export**
   - Icon: `FiDownload`
   - Background: `white`
   - Border: `1px solid #3b82f6` (blue)
   - Color: `#3b82f6` (blue)
   - Calls `handleExport()` to download configuration as JSON

5. **Import**
   - Icon: `FiUpload`
   - Background: `white`
   - Border: `1px solid #3b82f6` (blue)
   - Color: `#3b82f6` (blue)
   - Calls `handleImport()` to upload and apply configuration from JSON file

---

## Configuration Sections Contract

### Section Order (Top to Bottom)

1. **Worker Token Settings** (ALWAYS FIRST)
2. **Device Authentication Policy Settings** (if `environmentId` exists)
3. **PingOne MFA Settings** (if `environmentId` exists)
4. **Default Policies**
5. **OTP Settings**
6. **FIDO2/WebAuthn Settings**
7. **Push Notification Settings**
8. **UI/UX Settings**
9. **Security Settings**

### ConfigSection Component Contract

**Contract:**
- Background: `white`
- Border radius: `12px`
- Padding: `24px`
- Box shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Border: `1px solid #e5e7eb`
- Title: `20px`, `fontWeight: 600`, color: `#1f2937`
- Description: `14px`, color: `#6b7280`, margin bottom: `20px`
- Children: Flex column with gap: `20px`

---

## Worker Token Settings Section Contract

**Contract:**
- Must be the FIRST section (appears at top)
- Title: "Worker Token Settings"
- Description: "Configure automatic renewal of worker tokens during MFA flows"

**Settings (in order):**

1. **Auto-Renewal** (Toggle)
   - Path: `config.workerToken.autoRenewal`
   - Default: `true`
   - Description: "Automatically renew worker tokens when they expire or are about to expire"

2. **Renewal Threshold (seconds)** (Number)
   - Path: `config.workerToken.renewalThreshold`
   - Default: `180`
   - Min: `60`
   - Max: `3600`
   - Description: "How many seconds before token expiry to trigger auto-renewal"

3. **Retry Attempts** (Number)
   - Path: `config.workerToken.retryAttempts`
   - Default: `3`
   - Min: `1`
   - Max: `10`
   - Description: "Number of times to retry token renewal if it fails"

4. **Retry Delay (milliseconds)** (Number)
   - Path: `config.workerToken.retryDelay`
   - Default: `1000`
   - Min: `500`
   - Max: `10000`
   - Description: "Base delay between retry attempts (uses exponential backoff)"

5. **Show Token After Generation** (Toggle)
   - Path: `config.workerToken.showTokenAtEnd`
   - Default: `false`
   - Description: "Display the generated worker token at the end of the generation process"

6. **Silent API Token Retrieval** (Toggle)
   - Path: `config.workerToken.silentApiRetrieval`
   - Default: `false`
   - Description: "Automatically fetch worker token via API in the background without showing modals or UI prompts"

**State Management:**
- Changes tracked via `hasChanges` state
- Saved via `handleSave()` → `MFAConfigurationServiceV8.saveConfiguration()`
- Loaded on mount via `MFAConfigurationServiceV8.loadConfiguration()`

---

## Device Authentication Policy Settings Section Contract

**Contract:**
- Only shown if `environmentId` exists
- Title: "Device Authentication Policy Settings"
- Description: "Configure device authentication policies from PingOne. Select a policy from the dropdown to view and edit its settings."

**Policy Selector (MUST BE AT TOP):**

**Contract:**
- Must appear immediately after section title/description, before info box
- Label: "Select Policy" (14px, fontWeight: 600, color: #374151)
- Dropdown:
  - Width: `100%`
  - Padding: `10px 12px`
  - Border: `2px solid #3b82f6` (blue)
  - Border radius: `6px`
  - Font size: `14px`
  - Background: `white`
  - Font weight: `500`
- Options: `{policy.name} {policy.description ? `- ${policy.description}` : ''}`
- Helper text: "Select a policy to view and edit its settings. Changes will be saved to PingOne." (12px, color: #6b7280)

**Info Box:**

**Contract:**
- Background: `#eff6ff`
- Border: `1px solid #bfdbfe`
- Border radius: `8px`
- Padding: `12px`
- Icon: `FiInfo` (16px, color: #3b82f6)
- Title: "About Device Authentication Policies" (14px, fontWeight: 600, color: #1e40af)
- Content: Includes `MFAInfoButtonV8` with `contentKey="device.authentication.policy"`
- Link: "View Device Authentication Policy Data Model →" (opens PingOne API docs)

**Policy Settings (shown when policy selected):**

**Contract:**
- Loading state: "Loading policy details..." (centered, color: #6b7280)
- Empty state: "Select a policy to configure its settings." (centered, color: #6b7280)

**Subsections (in order):**

1. **OTP Failure Cooldown**
   - Background: `#f9fafb`
   - Border: `1px solid #e5e7eb`
   - Border radius: `8px`
   - Padding: `16px`
   - Title: "OTP Failure Cooldown" with `MFAInfoButtonV8` (`contentKey="otp.failure.coolDown.duration"`)
   - Fields:
     - **Cooldown Duration** (Number, 0-30)
     - **Time Unit** (Select: MINUTES | SECONDS)

2. **Method Selection**
   - Background: `#f9fafb`
   - Border: `1px solid #e5e7eb`
   - Border radius: `8px`
   - Padding: `16px`
   - Title: "Method Selection" with `MFAInfoButtonV8` (`contentKey="policy.authentication.deviceSelection"`)
   - Dropdown options:
     - `DEFAULT_TO_FIRST`: "User selected default"
     - `PROMPT_TO_SELECT_DEVICE`: "Prompt user to select"
     - `ALWAYS_DISPLAY_DEVICES`: "Always display devices"

3. **Pairing Settings**
   - Background: `#f9fafb`
   - Border: `1px solid #e5e7eb`
   - Border radius: `8px`
   - Padding: `16px`
   - Title: "Pairing Settings"
   - Toggles:
     - **Pairing Disabled** (`policy.pairingDisabled`)
     - **Prompt for Nickname on Pairing** (`policy.promptForNicknameOnPairing`)
     - **Skip User Lock Verification** (`policy.skipUserLockVerification`)

**Save Policy Button:**

**Contract:**
- Only shown when policy is selected
- Disabled when: `!hasPolicyChanges || isSavingPolicy`
- Background: `#10b981` (green) when enabled, `#9ca3af` (gray) when disabled
- Text: "Saving..." when `isSavingPolicy`, "Save Policy Settings" otherwise
- Calls `handleSavePolicy()` → `MFAServiceV8.updateDeviceAuthenticationPolicy()`
- Must pass `credentials.region` to update function

**State Management:**
- `selectedPolicyId`: Current policy ID
- `selectedPolicy`: Full policy object
- `hasPolicyChanges`: Tracks if policy has been modified
- `isSavingPolicy`: Loading state during save
- Changes reset `hasPolicyChanges` to `false` after successful save

---

## PingOne MFA Settings Section Contract

**Contract:**
- Only shown if `environmentId` exists
- Title: "PingOne MFA Settings"
- Description: "Environment-level MFA settings from PingOne API. These settings apply to all MFA policies in your environment."

**Info Box:**

**Contract:**
- Background: `#eff6ff`
- Border: `1px solid #bfdbfe`
- Border radius: `8px`
- Padding: `12px`
- Icon: `FiInfo` (16px, color: #3b82f6)
- Title: "About PingOne MFA Settings" (14px, fontWeight: 600, color: #1e40af)
- Content: Includes `MFAInfoButtonV8` with `contentKey="mfa.settings"`

**Subsections (in order):**

1. **Pairing Settings**
   - Fields:
     - Max Allowed Devices (1-100)
     - Pairing Key Format (NUMERIC | QR_CODE | ALPHANUMERIC)
     - Pairing Key Length (4-32)
     - Pairing Timeout (Minutes) (1-60)

2. **Lockout Settings**
   - Fields:
     - Failure Count (1-20)
     - Lockout Duration (Seconds) (60-86400)
     - Progressive Lockout (Toggle)

3. **OTP Settings**
   - Fields:
     - OTP Length (4-8)
     - OTP Validity (Seconds) (60-600)

**Save PingOne Settings Button:**

**Contract:**
- Disabled when: `!hasPingOneSettingsChanges || isSavingPingOneSettings`
- Background: `#10b981` (green) when enabled, `#9ca3af` (gray) when disabled
- Text: "Saving..." when `isSavingPingOneSettings`, "Save PingOne Settings" otherwise
- Calls `handleSavePingOneSettings()` → `MFAServiceV8.updateMFASettings()`

**Reset Button:**

**Contract:**
- Background: `white`
- Border: `1px solid #dc2626` (red)
- Color: `#dc2626` (red)
- Calls `handleResetPingOneSettings()` to reload from PingOne

---

## OTP Settings Section Contract

**Contract:**
- Title: "OTP Settings"
- Description: "Configure OTP code handling and validation"

**Settings (in order):**

1. **OTP Code Length** (Select)
   - Path: `config.otpCodeLength`
   - Options: 6, 7, 8, 9, 10 digits
   - Default: `6`

2. **OTP Input Auto-Focus** (Toggle)
   - Path: `config.otpInputAutoFocus`
   - Default: `true`

3. **OTP Input Auto-Submit** (Toggle)
   - Path: `config.otpInputAutoSubmit`
   - Default: `true`

4. **OTP Validation Timeout (seconds)** (Number)
   - Path: `config.otpValidationTimeout`
   - Default: `300`
   - Min: `60`
   - Max: `1800`

5. **OTP Resend Delay (seconds)** (Number)
   - Path: `config.otpResendDelay`
   - Default: `60`
   - Min: `10`
   - Max: `300`

---

## FIDO2/WebAuthn Settings Section Contract

**Contract:**
- Title: "FIDO2/WebAuthn Settings"
- Description: "Configure FIDO2 and WebAuthn authentication settings"

**Settings (in order):**

1. **Preferred Authenticator Type** (Select)
   - Path: `config.fido2.preferredAuthenticatorType`
   - Options: `platform`, `cross-platform`, `both`
   - Default: `both`

2. **User Verification** (Select)
   - Path: `config.fido2.userVerification`
   - Options: `discouraged`, `preferred`, `required`
   - Default: `preferred`

3. **Discoverable Credentials** (Select)
   - Path: `config.fido2.discoverableCredentials`
   - Options: `discouraged`, `preferred`, `required`
   - Default: `preferred`

4. **Relying Party ID Type** (Select)
   - Path: `config.fido2.relyingPartyIdType`
   - Options: `pingone`, `custom`, `other`
   - Default: `pingone`

5. **Relying Party ID** (Text, conditional)
   - Path: `config.fido2.relyingPartyId`
   - Only shown when `relyingPartyIdType !== 'pingone'`

6. **FIDO Device Aggregation** (Toggle)
   - Path: `config.fido2.fidoDeviceAggregation`
   - Default: `false`

7. **Backup Eligibility** (Select)
   - Path: `config.fido2.backupEligibility`
   - Options: `allow`, `disallow`
   - Default: `allow`

8. **Enforce Backup Eligibility During Authentication** (Toggle)
   - Path: `config.fido2.enforceBackupEligibilityDuringAuth`
   - Default: `false`

9. **Attestation Request** (Select)
   - Path: `config.fido2.attestationRequest`
   - Options: `none`, `direct`, `enterprise`
   - Default: `none`

10. **Include Environment Name** (Toggle)
    - Path: `config.fido2.includeEnvironmentName`
    - Default: `false`

11. **Include Organization Name** (Toggle)
    - Path: `config.fido2.includeOrganizationName`
    - Default: `false`

---

## Push Notification Settings Section Contract

**Contract:**
- Title: "Push Notification Settings"
- Description: "Configure push notification handling and polling"

**Settings (in order):**

1. **Push Notification Timeout (seconds)** (Number)
   - Path: `config.pushNotificationTimeout`
   - Default: `120`
   - Min: `30`
   - Max: `600`

2. **Push Polling Interval (seconds)** (Number)
   - Path: `config.pushPollingInterval`
   - Default: `2`
   - Min: `1`
   - Max: `10`

3. **Auto-Start Push Polling** (Toggle)
   - Path: `config.autoStartPushPolling`
   - Default: `true`

4. **Show Push Notification Instructions** (Toggle)
   - Path: `config.showPushNotificationInstructions`
   - Default: `true`

---

## UI/UX Settings Section Contract

**Contract:**
- Title: "UI/UX Settings"
- Description: "Customize the user interface experience"

**Settings (in order):**

1. **Show Device Icons** (Toggle)
   - Path: `config.ui.showDeviceIcons`
   - Default: `true`

2. **Show Device Status Badges** (Toggle)
   - Path: `config.ui.showDeviceStatusBadges`
   - Default: `true`

3. **Modal Animation Duration (milliseconds)** (Number)
   - Path: `config.ui.modalAnimationDuration`
   - Default: `200`
   - Min: `0`
   - Max: `1000`

4. **Show Loading Spinners** (Toggle)
   - Path: `config.ui.showLoadingSpinners`
   - Default: `true`

---

## Security Settings Section Contract

**Contract:**
- Title: "Security Settings"
- Description: "Security-related configuration options"

**Settings (in order):**

1. **Require Username for Authentication** (Toggle)
   - Path: `config.security.requireUsernameForAuthentication`
   - Default: `true`

2. **Allow Usernameless FIDO2** (Toggle)
   - Path: `config.security.allowUsernamelessFido2`
   - Default: `false`

3. **Validate Device IDs** (Toggle)
   - Path: `config.security.validateDeviceIds`
   - Default: `true`

4. **Sanitize Device Names** (Toggle)
   - Path: `config.security.sanitizeDeviceNames`
   - Default: `true`

---

## State Management Contract

### Configuration State

**Contract:**
- Loaded on mount: `MFAConfigurationServiceV8.loadConfiguration()`
- Stored in: `localStorage` (key: `mfa-config-v8`)
- State variable: `config` (type: `MFAConfiguration`)
- Change tracking: `hasChanges` (boolean)
- Save handler: `handleSave()` → `MFAConfigurationServiceV8.saveConfiguration()`

### PingOne Settings State

**Contract:**
- Loaded when: `environmentId` exists AND worker token is valid
- State variable: `pingOneSettings` (type: `MFASettings | null`)
- Change tracking: `hasPingOneSettingsChanges` (boolean)
- Loading state: `isLoadingPingOneSettings` (boolean)
- Save handler: `handleSavePingOneSettings()` → `MFAServiceV8.updateMFASettings()`

### Device Authentication Policy State

**Contract:**
- Policies loaded: `deviceAuthPolicies` (array)
- Selected policy ID: `selectedPolicyId` (string)
- Selected policy: `selectedPolicy` (type: `DeviceAuthenticationPolicy | null`)
- Change tracking: `hasPolicyChanges` (boolean)
- Loading states:
  - `isLoadingPolicies` (boolean) - Loading policy list
  - `isLoadingPolicy` (boolean) - Loading selected policy details
  - `isSavingPolicy` (boolean) - Saving policy changes
- Save handler: `handleSavePolicy()` → `MFAServiceV8.updateDeviceAuthenticationPolicy()`

### Environment State

**Contract:**
- Loaded from: `workerTokenServiceV8.loadCredentials()`
- State variable: `environmentId` (string)
- Used to conditionally show PingOne sections

---

## Error Handling Contract

**Contract:**
- All errors must be displayed via `toastV8.error()`
- Success messages via `toastV8.success()`
- Loading states must disable relevant buttons
- API errors must not crash the page
- Missing worker token must not show errors (silently skip loading)

**Error Messages:**

- "Failed to load PingOne MFA settings. Please ensure you have a valid worker token."
- "Failed to load device authentication policies. Please ensure you have a valid worker token."
- "Failed to load device authentication policy. Please ensure you have a valid worker token."
- "Failed to save PingOne MFA settings."
- "Failed to save device authentication policy."
- "Worker token credentials are missing. Open the worker token modal to save them first."

---

## Validation Contract

**Contract:**
- Number inputs must clamp to min/max values
- Toggle inputs must be boolean
- Select inputs must match allowed options
- Policy changes must validate before save
- Region must be passed to `updateDeviceAuthenticationPolicy()` from credentials

---

## Version History

- **v1.0.0** (2025-01-27): Initial UI contract for MFA Configuration Page

---

## Notes

- **Section Order:** Worker Token Settings MUST be first, Device Authentication Policy Settings second (if environmentId exists)
- **Policy Selector:** MUST be at the top of Device Authentication Policy Settings section, before info box
- **Region Parameter:** `updateDeviceAuthenticationPolicy()` MUST receive `credentials.region` parameter
- **Change Tracking:** All sections must track changes independently (`hasChanges`, `hasPolicyChanges`, `hasPingOneSettingsChanges`)
- **API Display:** Page padding must adjust based on API display visibility
- **DOM Nesting:** `MFAInfoButtonV8` must NOT be nested inside `<p>` tags (use `<div>` instead)

