# MFA Worker Token UI Contract

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 8.1.0  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document defines the UI contract for worker token management and configuration settings in the MFA system. This contract ensures consistent behavior, error handling, and user experience across all worker token-related UI components.

---

## Scope

**Applies To:**
- ✅ Worker Token Modal (`WorkerTokenModalV8`)
- ✅ MFA Configuration Page (`MFAConfigurationPageV8`)
- ✅ All MFA flows that use worker tokens
- ✅ Worker Token Helper Functions (`workerTokenModalHelperV8`)

---

## UI Component Contracts

### 1. Worker Token Modal

**Component:** `WorkerTokenModalV8.tsx`  
**Location:** Used across all MFA flows

#### Standard Mode (Full Modal)

**Required UI Elements:**
1. **Header Section**
   - Title: "Worker Token Credentials"
   - Close button (×)

2. **Current Token Display** (if token exists and `showTokenAtEnd` is enabled)
   - Green background section (#d1fae5)
   - Token display with copy/decode buttons
   - "Hide Token" button

3. **Info Box**
   - Blue background (#dbeafe)
   - "What is a Worker Token?" explanation
   - Requirements and token validity information
   - Auto-renewal status display

4. **How to Get Credentials Section**
   - Green background (#f0fdf4)
   - Step-by-step instructions

5. **Credential Form**
   - Environment ID input (required)
   - Client ID input (required)
   - Client Secret input (required, with show/hide toggle)
   - Scopes textarea (required)
   - Region dropdown (US, EU, AP, CA)
   - Custom Domain input (optional)
   - Token Endpoint Authentication dropdown

6. **Save Credentials Checkbox**
   - Checkbox to save credentials for reuse

7. **Action Buttons**
   - Export/Import buttons
   - Cancel button
   - Generate Token button

#### Token-Only Mode

**Activation Conditions:**
- `showTokenOnly={true}` prop is passed
- Both `silentApiRetrieval` and `showTokenAtEnd` settings are ON
- Token exists or was just retrieved silently

**Required UI Elements:**
1. **Token Display Section**
   - Green background (#d1fae5)
   - Title: "✅ Worker Token"
   - Token display with copy/decode buttons
   - "Close" button (full width)

**Hidden Elements:**
- ❌ Info Box
- ❌ How to Get Credentials section
- ❌ Credential form
- ❌ Save Credentials checkbox
- ❌ Export/Import buttons
- ❌ Generate Token button

#### State Management

- Token is automatically loaded when modal opens in token-only mode
- Token display is shown immediately if token exists
- Modal respects `showTokenAtEnd` configuration setting

---

### 2. MFA Configuration Page

**Component:** `MFAConfigurationPageV8.tsx`  
**Route:** `/v8/mfa-config`

#### Worker Token Settings Section

**Required UI Elements:**

1. **Silent API Token Retrieval Toggle**
   - **Type:** Toggle switch
   - **Setting Key:** `config.workerToken.silentApiRetrieval`
   - **Default:** `false`
   - **Label:** "Silent API Token Retrieval"
   - **Description:** "Automatically fetch worker token using stored credentials without showing modals"

2. **Show Token After Generation Toggle**
   - **Type:** Toggle switch
   - **Setting Key:** `config.workerToken.showTokenAtEnd`
   - **Default:** `false`
   - **Label:** "Show Token After Generation"
   - **Description:** "Display the worker token after generating or retrieving it"

#### Settings Interaction Contract

**Both Settings ON:**
- Token is fetched silently using stored credentials
- Modal opens in token-only mode (shows only token display)
- No credential input screens shown
- User can copy/decode token and close modal

**Silent ON, Show OFF:**
- Token is fetched silently using stored credentials
- No modal shown (completely silent)
- Token available for API calls in background

**Silent OFF, Show ON:**
- Full worker token modal shown with credential form
- After generation, token is displayed for viewing/copying
- Standard modal flow with all screens

**Both Settings OFF:**
- Full worker token modal shown with credential form
- Modal closes immediately after generation
- Token is not displayed (only stored)

#### State Management

- Settings must be saved to `localStorage` via `MFAConfigurationServiceV8`
- Settings must be loaded on page mount
- Changes must be persisted immediately
- Settings must be respected by all worker token modal invocations

---

### 3. Worker Token Helper Function

**Component:** `workerTokenModalHelperV8.ts`  
**Function:** `handleShowWorkerTokenModal()`

#### Contract Requirements

1. **Token Status Check**
   - Must check current token status using `WorkerTokenStatusServiceV8.checkWorkerTokenStatus()`
   - Must handle all status types: `valid`, `expiring-soon`, `expired`, `missing`

2. **Configuration Check**
   - Must load configuration using `MFAConfigurationServiceV8.loadConfiguration()`
   - Must respect both `silentApiRetrieval` and `showTokenAtEnd` settings

3. **Silent Retrieval Logic**
   - If `silentApiRetrieval` is ON and token is missing/expired:
     - Attempt silent token retrieval using `attemptSilentTokenRetrieval()`
     - If successful and `showTokenAtEnd` is ON:
       - Set modal visibility to `true`
       - Modal will display in token-only mode
     - If successful and `showTokenAtEnd` is OFF:
       - Do not show modal (silent retrieval complete)

4. **Modal Display Logic**
   - If token is valid and `showTokenAtEnd` is ON:
     - Show modal (will display token)
   - If token is valid and `showTokenAtEnd` is OFF:
     - Do not show modal
   - If token is missing/expired and `silentApiRetrieval` is OFF:
     - Show full modal with credential form

5. **Token Status Update**
   - Must call `setTokenStatus()` callback if provided after token retrieval
   - Must update status with latest token state

---

## Error Handling Contracts

### Invalid Token

**Scenario:** Token is corrupted or invalid format

**Contract:**
- System must detect invalid token format (not a valid JWT)
- Must show error message: "Invalid worker token format"
- Must prompt user to generate new token
- Must clear invalid token from storage

### Silent Retrieval Failure

**Scenario:** Silent token retrieval fails (invalid credentials, network error, etc.)

**Contract:**
- Must fall back to showing full modal with credential form
- Must not show error to user (silent failure)
- Must allow user to enter credentials manually
- Must respect `showTokenAtEnd` setting after manual generation

### Missing Credentials

**Scenario:** User attempts silent retrieval but no credentials are stored

**Contract:**
- Must detect missing credentials
- Must show full modal with credential form
- Must not attempt silent retrieval
- Must allow user to enter and save credentials

---

## Accessibility Contracts

### Keyboard Navigation

- All buttons must be keyboard accessible
- Modal must be focusable and trap focus
- Tab order must be logical
- Escape key must close modal

### Screen Reader Support

- All form fields must have proper labels
- Status messages must be announced
- Button states must be communicated
- Token display must be readable

### Visual Feedback

- Color-coded status indicators
- Clear visual hierarchy
- Loading states during token generation
- Success/error toast notifications

---

## Testing Contracts

### Test Scenarios

1. **Both Settings ON - Token Exists**
   - Verify token-only mode displays
   - Verify credential form is hidden
   - Verify token can be copied

2. **Both Settings ON - Token Missing**
   - Verify silent retrieval is attempted
   - Verify token-only mode displays after successful retrieval
   - Verify full modal displays if silent retrieval fails

3. **Silent ON, Show OFF**
   - Verify no modal is shown
   - Verify token is retrieved silently
   - Verify token is available for API calls

4. **Silent OFF, Show ON**
   - Verify full modal displays
   - Verify token is shown after generation
   - Verify all form fields are present

5. **Both Settings OFF**
   - Verify full modal displays
   - Verify modal closes after generation
   - Verify token is not displayed

---

## Implementation Notes

### Component Props

```typescript
interface WorkerTokenModalV8Props {
  isOpen: boolean;
  onClose: () => void;
  onTokenGenerated?: (token: string) => void;
  environmentId?: string;
  showTokenOnly?: boolean; // New in v8.1.0
}
```

### Helper Function Signature

```typescript
export async function handleShowWorkerTokenModal(
  setShowModal: (show: boolean) => void,
  setTokenStatus?: (status: ReturnType<typeof WorkerTokenStatusServiceV8.checkWorkerTokenStatus>) => void
): Promise<void>
```

### Configuration Structure

```typescript
interface MFAConfiguration {
  workerToken: {
    silentApiRetrieval: boolean;
    showTokenAtEnd: boolean;
    autoRenewal: boolean;
    renewalThreshold: number;
  };
}
```

---

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 8.1.0  
**Status:** ✅ IMPLEMENTED

