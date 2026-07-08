# MFA FIDO2 UI Documentation

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.1.0  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document defines the UI structure, components, and user experience for FIDO2 (WebAuthn) device registration and authentication flows in the MFA system.

---

## Scope

**Applies To:**
- ✅ FIDO2 Device Registration Flow (Admin)
- ✅ FIDO2 Device Registration Flow (User)
- ✅ FIDO2 Device Authentication Flow
- ✅ FIDO2 Configuration Page

---

## UI Components

### 1. FIDO2 Configuration Page

**Location:** `/v8/mfa/configure/fido2`  
**Component:** `FIDO2ConfigurationPage.tsx`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  FIDO2 Configuration Header (Blue background)          │
│  - Title: "FIDO2 Configuration"                       │
│  - Subtitle: "Configure FIDO2/WebAuthn settings"      │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Worker Token Status Section                    │  │
│  │  - Status indicator (Valid/Expired/Missing)     │  │
│  │  - "Get Worker Token" button if invalid         │  │
│  │  - Respects "Silent API Token Retrieval"        │  │
│  │    and "Show Token After Generation" settings    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  FIDO2 Configuration Settings                   │  │
│  │  - Attestation: "none" | "direct" | "indirect" │  │
│  │  - Authenticator Attachment: "platform" | ...  │  │
│  │  - User Verification: "required" | "preferred"│  │
│  │  - Resident Key: "required" | "preferred"      │  │
│  │  - Timeout: 60000 (milliseconds)               │  │
│  │  - Challenge Length: 32 (bytes)                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Relying Party (RP) Configuration                │  │
│  │  - RP ID: Text input                            │  │
│  │  - RP Name: Text input                          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Action Buttons                                  │  │
│  │  - "Back to Hub" (left)                         │  │
│  │  - "Proceed to Registration" (right, primary)  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### Configuration Options

**Attestation:**
- Options: `"none"`, `"direct"`, `"indirect"`
- Default: `"none"`
- Description: Controls attestation statement format

**Authenticator Attachment:**
- Options: `"platform"`, `"cross-platform"`, `null` (any)
- Default: `null`
- Description: Restricts authenticator type

**User Verification Requirement:**
- Options: `"required"`, `"preferred"`, `"discouraged"`
- Default: `"preferred"`
- Description: Controls user verification requirement

**Resident Key:**
- Options: `"required"`, `"preferred"`, `"discouraged"`
- Default: `"preferred"`
- Description: Controls discoverable credentials

**Timeout:**
- Type: Number (milliseconds)
- Default: `60000`
- Range: `10000` - `300000`
- Description: WebAuthn operation timeout

**Challenge Length:**
- Type: Number (bytes)
- Default: `32`
- Range: `16` - `64`
- Description: Challenge byte length

---

### 2. FIDO2 Registration Flow

**Location:** `/v8/mfa/register/fido2`  
**Component:** `FIDO2Flow.tsx`

#### Step 0: Configuration

**UI Elements:**
- Environment ID input
- Username input
- Device Authentication Policy selector
- Token Type selector (Worker/User)
- "Start Registration" button

**Validation:**
- Environment ID required
- Username required
- Policy ID required
- Token must be valid

#### Step 1: Device Selection

**UI Elements:**
- Device type selector (if multiple types available)
- "Register FIDO2 Device" button
- Device limit warning (if applicable)

**Special Handling:**
- Checks for existing FIDO2 devices
- Shows `FIDODeviceExistsModal` if device exists
- Only one FIDO2 device allowed per user

#### Step 2: Device Registration

**UI Elements:**
- Device name input (defaults to "FIDO2")
- Relying Party (RP) ID display
- Relying Party (RP) Name display
- "Register FIDO2 Device" button
- Progress indicator during WebAuthn operation

**WebAuthn Flow:**
1. User clicks "Register FIDO2 Device"
2. System calls PingOne API to create device
3. Receives `publicKeyCredentialCreationOptions` (JSON string)
4. Parses and converts byte arrays to `Uint8Array`
5. Calls `navigator.credentials.create()`
6. Receives `PublicKeyCredential` from browser
7. Extracts attestation response
8. Activates device with PingOne

**Progress Indicator:**
- Shows during WebAuthn operation
- Blue background with pulsing animation
- Message: "Waiting for WebAuthn Authentication..."
- Lock icon (🔐) with pulse animation

**Auto-Advance:**
- Automatically advances to Step 3 after successful registration
- Shows success toast notification

#### Step 3: Device Activation

**UI Elements:**
- Success message
- Device details display
- "Continue" button

**Activation Process:**
- Device is activated during registration (Step 2)
- Step 3 confirms activation success
- Auto-advances to success page

#### Step 4: Success Page

**UI Elements:**
- Success icon and message
- Device information summary
- "View Documentation" button
- "Back to Hub" button

---

### 3. FIDO2 Authentication Flow

**Location:** `/v8/mfa/authenticate`  
**Component:** `MFAAuthenticationMainPage.tsx`

#### Device Selection

**UI Elements:**
- Username input
- Environment ID input
- Device Authentication Policy selector
- "Start Authentication" button
- Device list (if multiple devices)

**Device List:**
- Shows all available FIDO2 devices
- Device nickname display
- "Select Device" button for each device

#### FIDO2 Assertion

**UI Elements:**
- Progress indicator during WebAuthn
- "Authenticate with FIDO2" button
- Error message display (if authentication fails)

**WebAuthn Flow:**
1. User selects FIDO2 device
2. System initializes device authentication
3. Receives `publicKeyCredentialRequestOptions` from PingOne
4. Parses and converts byte arrays to `Uint8Array`
5. Calls `navigator.credentials.get()`
6. Receives `PublicKeyCredential` from browser
7. Extracts assertion response
8. Checks assertion with PingOne

**Progress Indicator:**
- Shows during WebAuthn operation
- Blue background with pulsing animation
- Message: "Waiting for WebAuthn Authentication..."
- Lock icon (🔐) with pulse animation

#### Success/Error Handling

**Success:**
- Shows success message
- Displays access token (if returned)
- "Continue" button to proceed

**Error:**
- Shows error message
- User-friendly error descriptions
- "Try Again" button

---

### 4. FIDO2 Error Modals

#### FIDO Device Exists Modal

**Component:** `FIDODeviceExistsModal.tsx`

**Trigger:**
- User attempts to register FIDO2 device
- System detects existing FIDO2 device

**UI Elements:**
- Modal overlay (semi-transparent backdrop)
- Modal container (white background, rounded corners)
- Title: "FIDO2 Device Already Registered"
- Message explaining limitation
- "Back to Device Selection" button
- "Back to MFA Hub" button

**Behavior:**
- Prevents duplicate FIDO2 registration
- Guides user to select different device type
- Closes modal and returns to Step 1

---

## UI Styling

### Color Scheme

**Primary Colors:**
- Blue: `#3b82f6` (FIDO2 theme)
- Green: `#10b981` (Success)
- Red: `#ef4444` (Error)
- Yellow: `#f59e0b` (Warning)

**Background Colors:**
- Page Header: Blue gradient (`135deg, #3b82f6 0%, #2563eb 100%`)
- Success: Light green (`#d1fae5`)
- Error: Light red (`#fee2e2`)
- Warning: Light yellow (`#fef3c7`)

### Typography

**Headers:**
- H1: `24px`, `font-weight: 700`
- H2: `20px`, `font-weight: 600`
- H3: `18px`, `font-weight: 600`

**Body:**
- Default: `14px`, `font-weight: 400`
- Small: `12px`, `font-weight: 400`

### Spacing

**Padding:**
- Page: `24px`
- Sections: `16px`
- Inputs: `12px 16px`

**Margins:**
- Between sections: `24px`
- Between elements: `12px`

---

## User Experience Flow

### Registration Flow

1. **Configuration Page** → User configures FIDO2 settings
2. **Step 0** → User enters credentials and selects policy
3. **Step 1** → System checks for existing devices, user selects device type
4. **Step 2** → User clicks "Register FIDO2 Device", WebAuthn prompt appears
5. **Step 3** → Device activation confirmed
6. **Success Page** → Registration complete

**Total Steps:** 5 (0-4)  
**User Actions:** 3 clicks (Start Registration, Register Device, Continue)

### Authentication Flow

1. **Device Selection** → User enters username, selects device
2. **WebAuthn Prompt** → Browser shows WebAuthn authentication
3. **Success** → Authentication complete, access token returned

**Total Steps:** 2  
**User Actions:** 2 clicks (Start Authentication, Authenticate)

---

## Accessibility

### ARIA Labels

- All buttons have descriptive `aria-label` attributes
- Form inputs have associated `label` elements
- Error messages are announced to screen readers

### Keyboard Navigation

- Tab order follows visual flow
- Enter key submits forms
- Escape key closes modals
- Focus management for dynamic content

### Screen Reader Support

- Semantic HTML elements
- ARIA roles and properties
- Live regions for dynamic updates
- Descriptive error messages

---

## Responsive Design

### Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

### Mobile Adaptations

- Stacked layout for forms
- Full-width buttons
- Reduced padding
- Larger touch targets (min 44px)

---

## Lockdown and Regression Protection

### FIDO2 UI Lockdown

**Purpose:** Protect critical FIDO2 UI components from accidental modification or regression.

**Locked UI Files:**
- `src/v8/flows/types/FIDO2Flow.tsx` - Main registration flow UI
- `src/v8/flows/types/FIDO2ConfigurationPage.tsx` - Configuration page UI
- `src/v8/flows/MFAAuthenticationMainPage.tsx` - Authentication page UI (FIDO2 sections)
- `src/v8/components/FIDODeviceExistsModal.tsx` - Error modal UI

**Verification:**
```bash
npm run verify:fido2-lockdown
```

**Restoring UI from Regression:**
If FIDO2 UI breaks, restore from snapshots:
1. Run `npm run verify:fido2-lockdown` to see what changed
2. Choose option 1 in the restart script to restore from snapshots
3. Or manually copy UI files from `src/v8/lockdown/fido2/snapshot/`

**See Also:**
- `docs/MFA_FIDO2_MASTER.md` - Complete lockdown documentation
- `src/v8/lockdown/fido2/manifest.json` - Lockdown manifest

---

## Success Page

**Location:** Step 3 of FIDO2 registration flow  
**Component:** `MFASuccessPage` (wraps `UnifiedMFASuccessPage`)

### Required UI Elements

1. **Success Header**
   - Green gradient background
   - Celebration emoji (🎉)
   - "Registration Successful!" title
   - Success message

2. **Device Information Card**
   - Device ID
   - Device Type: "FIDO2 (Security Key / Passkey)"
   - Device Status: "ACTIVE"
   - Device Nickname (if set)

3. **Action Buttons** (Bottom of page)
   - **"View Documentation"** button (orange/yellow, with 📚 icon)
     - **MUST be visible** for all FIDO2 registration flows
     - Navigates to `/v8/mfa/register/fido2/docs`
     - Passes flow data via `location.state`
   - **"Back to MFA Hub"** button (gray, with 🏠 icon)
   - **"Go to Authentication"** button (blue, for registration flows)

### Documentation Button Implementation

**Condition:** Button is shown when:
- `flowType === 'registration'`
- `deviceType === 'FIDO2'`
- Device has documentation (FIDO2 is in the documentation list)

**Implementation Note:** The FIDO2 flow ensures `deviceType` is set to `'FIDO2'` when building success page data to ensure the documentation button appears.

---

## Related Documentation

- [MFA FIDO2 UI Contract](./MFA_FIDO2_UI_CONTRACT.md) - UI Contract for FIDO2 flows
- [MFA FIDO2 Master Document](./MFA_FIDO2_MASTER.md) - Comprehensive FIDO2 master document
- [MFA Worker Token UI Contract](./MFA_WORKER_TOKEN_UI_CONTRACT.md) - Worker token configuration and modal behavior contracts
- `docs/MFA_API_REFERENCE.md` - API reference for FIDO2 endpoints
- `docs/MFA_STATE_PRESERVATION_UI_CONTRACT.md` - State preservation contract

---

## Implementation Files

**Components:**
- `src/v8/flows/types/FIDO2Flow.tsx` - Main FIDO2 registration flow
- `src/v8/flows/FIDO2ConfigurationPage.tsx` - Configuration page
- `src/v8/components/FIDODeviceExistsModal.tsx` - Error modal
- `src/v8/flows/MFAAuthenticationMainPage.tsx` - Authentication page

**Services:**
- `src/v8/services/mfaService.ts` - FIDO2 device registration
- `src/v8/services/mfaAuthenticationService.ts` - FIDO2 authentication
- `src/v8/flows/controllers/FIDO2FlowController.ts` - FIDO2 flow controller

---

## Version History

- **v1.1.0** (2025-01-27): 
  - Added Success Page section with documentation button implementation
  - Added Back to Hub button styling (green color)
  - Added dynamic padding for API display overlay
  - Updated deviceType preservation documentation

- **v1.0.0** (2025-01-XX): Initial FIDO2 UI documentation

