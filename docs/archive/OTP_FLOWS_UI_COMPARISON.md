# OTP Flows UI Comparison: SMS, Email, WhatsApp, and Voice

## Executive Summary

This document provides a comprehensive comparison of the UI flows for SMS, Email, WhatsApp, and Voice MFA device registration. These flows share a common structure and pattern, with device-specific differences in input fields, API parameters, and content.

**Key Finding:** SMS, Email, and WhatsApp flows are **fully implemented** with identical 5-step structures. Voice is **integrated into the SMS flow** as a device type option (not a separate flow), using the SMS controller but sending `type: "VOICE"` to the API.

---

## Overview Table

| Flow Type | Implementation Status | Step Count | Step Labels | Device Registration Field | API Device Type | Implementation Approach |
|-----------|----------------------|------------|-------------|---------------------------|-----------------|------------------------|
| **SMS** | ✅ Fully Implemented | 5 steps (0-4) | `['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']` | Phone Number (with country code picker) | `SMS` | Dedicated flow component |
| **Email** | ✅ Fully Implemented | 5 steps (0-4) | `['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']` | Email Address (auto-filled from PingOne if available) | `EMAIL` | Dedicated flow component |
| **WhatsApp** | ✅ Fully Implemented | 5 steps (0-4) | `['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']` | Phone Number (with country code picker) | `WHATSAPP` | Dedicated flow component |
| **Voice** | ✅ Integrated in SMS Flow | 5 steps (0-4) | `['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']` | Phone Number (with country code picker) | `VOICE` | Option within SMS flow dropdown |

---

## Step-by-Step Structure Comparison

All four OTP flows (SMS, Email, WhatsApp, Voice) follow the **exact same step structure**. Voice is implemented as an option within the SMS flow, sharing the same 5-step structure and UI patterns:

### Step 0: Configuration Page
**Common Features:**
- Environment ID input
- Username input
- Device Authentication Policy selection
- Registration Flow Type selection (Admin vs User)
- Token management (Worker Token for Admin Flow, User Token for User Flow)
- Admin Flow: Device Status selection (ACTIVE or ACTIVATION_REQUIRED)
- User Flow: Always ACTIVATION_REQUIRED

**Differences:**
- None - all three flows use the same configuration UI pattern

---

### Step 1: Device Selection
**Common Features:**
- Inline content (not a modal)
- Lists existing devices of the selected type
- "Register New Device" button
- Device selection for existing devices
- Skipped during registration flow when coming from configuration page

**Differences:**
- **SMS/WhatsApp/Voice:** Displays phone number and status for each device
- **Email:** Displays email address and status for each device
- **Component:** All use `MFADeviceSelector` with device-type-specific `renderDeviceInfo` prop

---

### Step 2: Device Registration Modal
**Common Features:**
- Modal overlay (fixed position, draggable, centered)
- Uses `useDraggableModal` hook
- Modal header with PingIdentity logo, title "Register MFA Device", subtitle
- Close button (X) in header
- Username display (read-only, gray background box)
- Device Name field
- Worker Token Status indicator
- API Display Toggle checkbox
- Cancel button (left) and Register button (right, primary)
- Backdrop click does NOT close modal (requires explicit close)

**Differences:**

| Feature | SMS | Voice | Email | WhatsApp |
|---------|-----|-------|-------|----------|
| **Input Field** | Phone Number with country code picker (47 countries) | Phone Number with country code picker (47 countries) | Email Address (with email icon, auto-filled from PingOne if available) | Phone Number with country code picker (47 countries) |
| **Preview Box** | Phone Number Preview (yellow background, shows formatted phone number) | Phone Number Preview (yellow background, shows formatted phone number) | Email Preview (yellow background, shown if email is auto-filled) | Phone Number Preview (yellow background, shows formatted phone number) |
| **Field Icon** | None | None | `FiMail` icon (20px, gray) | None |
| **Auto-population** | Yes (fetches from PingOne user profile via `phoneAutoPopulationServiceV8.fetchPhoneFromPingOne()`) | Yes (fetches from PingOne user profile via `phoneAutoPopulationServiceV8.fetchPhoneFromPingOne()`) | Yes (fetches from PingOne user profile via `MFAServiceV8.lookupUserByUsername()`) | Yes (fetches from PingOne user profile via `phoneAutoPopulationServiceV8.fetchPhoneFromPingOne()`) |
| **Register Button Text** | "Register SMS Device" | "Register Voice Device" | "Register Email Device" | "Register WhatsApp Device" |
| **API Parameter** | `phone: "+1234567890"` (string) | `phone: "+1234567890"` (string) | `email: "user@example.com"` (string) | `phone: "+1234567890"` (string) |
| **Controller Used** | `SMSFlowController` | `SMSFlowController` (type overridden to `VOICE` in API call) | `EmailFlowController` | `WhatsAppFlowController` |

---

### Step 3: Send OTP Code
**Common Features:**
- Inline content (not a modal)
- Can be skipped for ACTIVATION_REQUIRED devices (OTP sent automatically by PingOne during registration)
- "Send OTP Code" button
- "Resend OTP Code" button (after initial send)
- Device ID and contact (phone/email) display
- Success message after OTP is sent
- Error handling for send failures

**Differences:**
- **Content/Labels:** References "phone number" (SMS/Voice) vs "email address" (Email) vs "WhatsApp phone number" (WhatsApp) vs "voice call" (Voice)
- **API Endpoint:** Same endpoint, but device-specific (uses device ID from Step 2)

---

### Step 4: Validate OTP OR Success Page (Conditional)
**Common Features:**
- Conditional rendering based on device status:
  - **If ACTIVE:** Shows Success Page immediately (full page component)
  - **If ACTIVATION_REQUIRED:** Shows OTP Validation Modal
- OTP Validation Modal:
  - Modal overlay (fixed position, draggable, centered)
  - Uses `useDraggableModal` hook
  - Modal header with PingIdentity logo, title "Validate OTP Code", subtitle
  - Close button (X) in header
  - OTP input field (6 digits)
  - "Validate OTP" button
  - "Resend OTP" button (if needed)
  - Error display for invalid OTP attempts
- Success Page (after validation):
  - Success message
  - Device details (ID, contact info, nickname, status)
  - "Start Again" button (returns to MFA Hub)
  - API calls display (collapsible)
  - Documentation button

**Differences:**
- **Modal Subtitle:**
  - SMS: "Enter the code sent to your phone"
  - Voice: "Enter the verification code from your voice call"
  - Email: "Enter the code sent to your email"
  - WhatsApp: "Enter the code sent to your WhatsApp"
- **Device Info Display:**
  - SMS/Voice/WhatsApp: Shows "Phone Number" (Voice shows "Phone Number (Voice Call):")
  - Email: Shows "Email Address"
- **Success Page Content:** Device contact info differs (phone vs email)

---

## Detailed Feature Comparison

### 1. Input Fields and Data Collection

#### SMS Flow
- **Primary Field:** Phone Number
  - Format: E.164 (e.g., `+1234567890`)
  - Country code picker with 47 countries
  - Real-time validation and formatting
  - Preview box shows formatted number
- **Secondary Field:** Device Name (optional, defaults to "SMS")
- **Auto-population:** Fetches phone from PingOne user profile if available (looks for MOBILE or MAIN phone number)

#### Email Flow
- **Primary Field:** Email Address
  - Standard email format validation
  - Email icon (`FiMail`) displayed next to input
  - **Auto-population:** Fetches email from PingOne user profile if available
  - Preview box shown when email is auto-filled
- **Secondary Field:** Device Name (optional, defaults to "EMAIL")
- **Unique Feature:** Email auto-population from PingOne user data via `MFAServiceV8.lookupUserByUsername()`

#### WhatsApp Flow
- **Primary Field:** Phone Number
  - Format: E.164 (e.g., `+1234567890`)
  - Country code picker with 47 countries
  - Real-time validation and formatting
  - Preview box shows formatted number
- **Secondary Field:** Device Name (optional, defaults to "WHATSAPP")
- **Auto-population:** Fetches phone from PingOne user profile if available (looks for MOBILE or MAIN phone number)
- **Note:** Uses same phone validation logic and auto-population service as SMS

#### Voice Flow (Integrated in SMS Flow)
- **Primary Field:** Phone Number (same as SMS/WhatsApp)
  - Format: E.164 (e.g., `+1234567890`)
  - Country code picker with 47 countries
  - Real-time validation and formatting
  - Preview box shows formatted number
- **Secondary Field:** Device Name (optional, defaults to "VOICE")
- **Auto-population:** Fetches phone from PingOne user profile if available (looks for MOBILE or MAIN phone number, same as SMS)
- **Implementation:** Uses SMS controller and phone validation logic
- **API Type Override:** Uses `SMSFlowController` but overrides `type: "VOICE"` in API call
- **Unique Feature:** Option in SMS flow dropdown (not a separate route/flow)

---

### 2. Modal Structure

All three implemented flows use **identical modal structures** for:
- Device Registration (Step 2)
- OTP Validation (Step 4)

**Modal Specifications:**
- **Overlay:** Fixed position, full viewport, semi-transparent backdrop (`rgba(0, 0, 0, 0.5)`)
- **Container:** White background, `16px` border radius, `550px` max width, `90%` responsive width
- **Header:** Linear gradient background (`135deg, #10b981 0%, #059669 100%` - green theme)
- **Draggable:** Yes, via `useDraggableModal` hook
- **Backdrop Behavior:** Does NOT close on click (requires explicit close action)

---

### 3. API Integration

#### Device Registration API
**Endpoint:** `POST /v1/environments/{envId}/users/{userId}/devices`

**Request Body Differences:**

| Flow | `type` | Contact Field | Format | Controller |
|------|--------|---------------|--------|------------|
| SMS | `"SMS"` | `phone` | String: `"+1234567890"` | `SMSFlowController` |
| Voice | `"VOICE"` | `phone` | String: `"+1234567890"` | `SMSFlowController` (type overridden) |
| Email | `"EMAIL"` | `email` | String: `"user@example.com"` | `EmailFlowController` |
| WhatsApp | `"WHATSAPP"` | `phone` | String: `"+1234567890"` | `WhatsAppFlowController` |

**Common Fields:**
- `nickname` (device name)
- `status` (`ACTIVE` or `ACTIVATION_REQUIRED`)
- `policy.id` (device authentication policy ID)

---

### 4. Step Labels and Navigation

**All flows use identical step labels:**
```typescript
['Configure', 'Select Device', 'Register Device', 'Send OTP', 'Validate']
```

**Step Mapping:**
- Step 0: Configure
- Step 1: Select Device
- Step 2: Register Device (Modal)
- Step 3: Send OTP (can be skipped for ACTIVATION_REQUIRED)
- Step 4: Validate (Modal) OR Success Page

**Navigation Behavior:**
- All flows support auto-advance from device registration to Step 4 (OTP Validation or Success)
- All flows support auto-advance from OTP validation success to Success Page
- All flows include "Next Step" buttons in footer as fallback for manual progression

---

### 5. State Management

All three flows use the **same shared hook**: `useUnifiedOTPFlow`

**Common State:**
- `deviceSelection` (existing devices, loading state, selected device)
- `otpState` (OTP sent status, send error, retry count)
- `validationState` (validation attempts, last error)
- `showModal` (device registration modal visibility)
- `showValidationModal` (OTP validation modal visibility)
- `registrationFlowType` ('admin' | 'user')
- `adminDeviceStatus` ('ACTIVE' | 'ACTIVATION_REQUIRED')
- `deviceRegisteredActive` (device registration result)

**Flow-Specific Differences:**
- `deviceType`: `'SMS'` | `'VOICE'` | `'EMAIL'` | `'WHATSAPP'`
- Contact field in credentials: `phoneNumber` (SMS/Voice/WhatsApp) vs `email` (Email)
- **Note:** Voice shares SMS flow component but maintains separate `deviceType` identity

---

### 6. User Flow vs Admin Flow

All three flows support both **Admin Flow** and **User Flow** with identical behavior:

**Admin Flow:**
- Uses Worker Token (Client Credentials Grant)
- Can set device status to `ACTIVE` or `ACTIVATION_REQUIRED`
- No OAuth authentication required

**User Flow:**
- Uses User Token (Authorization Code Flow with PingOne)
- Always sets device status to `ACTIVATION_REQUIRED` (security requirement)
- Requires OAuth authentication via `UserLoginModalV8`
- Uses `'oauth_completed'` placeholder for user token
- Falls back to worker token for device registration API calls

---

## Key Differences Summary

### 1. **Input Fields**
- **SMS/Voice/WhatsApp:** Phone number with country code picker
- **Email:** Email address with auto-population from PingOne

### 2. **Auto-Population**
- **Email:** ✅ Yes (fetches from PingOne user profile via `MFAServiceV8.lookupUserByUsername()`)
- **SMS/Voice/WhatsApp:** ✅ Yes (fetches phone from PingOne user profile via `phoneAutoPopulationServiceV8.fetchPhoneFromPingOne()`, looks for MOBILE or MAIN phone number)

### 3. **API Device Type**
- **SMS:** `type: "SMS"`
- **Voice:** `type: "VOICE"` (overridden in API call when Voice is selected)
- **Email:** `type: "EMAIL"`
- **WhatsApp:** `type: "WHATSAPP"`

### 4. **API Contact Field**
- **SMS/Voice/WhatsApp:** `phone` (string)
- **Email:** `email` (string)

### 5. **Implementation Approach**
- **SMS/Email/WhatsApp:** Dedicated flow components with separate routes
- **Voice:** Integrated as option in SMS flow dropdown (shares SMS controller, overrides type)

### 6. **Modal Content Differences**
- **Button Text:** "Register SMS Device" vs "Register Voice Device" vs "Register Email Device" vs "Register WhatsApp Device"
- **OTP Validation Subtitle:** 
  - SMS: "Enter the code sent to your phone"
  - Voice: "Enter the verification code from your voice call"
  - Email: "Enter the code sent to your email"
  - WhatsApp: "Enter the code sent to your WhatsApp"
- **Preview Box:** Shows formatted phone (SMS/Voice/WhatsApp) vs email address (Email)

---

## Implementation Status

### ✅ Fully Implemented
- **SMS Flow:** Complete with all 5 steps, modals, validation, error handling, phone auto-population
- **Voice Flow:** Integrated in SMS flow with full functionality (uses SMS controller, type overridden to `VOICE`, phone auto-population)
- **Email Flow:** Complete with all 5 steps, modals, validation, error handling, email auto-population
- **WhatsApp Flow:** Complete with all 5 steps, modals, validation, error handling, phone auto-population

### Implementation Details

**Voice Flow Implementation:**
- ✅ Integrated as device type option in SMS flow dropdown (Step 2 registration modal)
- ✅ Uses `SMSFlowController` for phone validation and device registration logic
- ✅ Overrides `type: "VOICE"` in API call when Voice is selected (line 987 in `SMSFlowV8.tsx`)
- ✅ All UI labels and messages updated to reference "Voice" appropriately
- ✅ OTP validation subtitle: "Enter the verification code from your voice call"
- ✅ Button text: "Register Voice Device"
- ✅ Phone number field and validation identical to SMS
- ⚠️ **Not a separate route:** Voice is accessed via SMS flow route with Voice option selected
- ⚠️ **No dedicated controller:** Uses SMS controller with type override

**Key Implementation Code:**
```typescript
// In SMSFlowV8.tsx, handleRegisterDevice function:
// For VOICE, use SMS controller (both use phone numbers)
const controllerTypeForVoice = actualDeviceType === 'VOICE' ? 'SMS' : actualDeviceType;
const correctController = MFAFlowControllerFactory.create({ deviceType: controllerTypeForVoice });

// Override type to 'VOICE' in API call
if (actualDeviceType === 'VOICE') {
    deviceParams.type = 'VOICE' as DeviceType;
}
```

---

## Code References

### Implementation Files
- **SMS:** `src/v8/flows/types/SMSFlowV8.tsx`
- **Voice:** Integrated in `src/v8/flows/types/SMSFlowV8.tsx` (device type option in dropdown)
- **Email:** `src/v8/flows/types/EmailFlowV8.tsx`
- **WhatsApp:** `src/v8/flows/types/WhatsAppFlowV8.tsx`

### Shared Components
- `src/v8/flows/shared/MFAFlowBaseV8.tsx` - Base flow component
- `src/v8/flows/shared/useUnifiedOTPFlow.ts` - Shared state management hook
- `src/v8/flows/components/MFADeviceSelector.tsx` - Device selection UI
- `src/v8/hooks/useDraggableModal.ts` - Draggable modal hook
- `src/v8/flows/shared/MFAConfigurationStepV8.tsx` - Configuration step UI

### Services
- `src/v8/services/phoneAutoPopulationServiceV8.ts` - Phone auto-population service (used by SMS, Voice, WhatsApp flows)
- `src/v8/services/mfaServiceV8.ts` - MFA service with user lookup (used by Email flow for email auto-population)

### Documentation
- **SMS:** `docs/SMS_REGISTER_FLOW_ANALYSIS.md`
- **Email:** `docs/EMAIL_REGISTRATION_UI_FLOW.md`
- **WhatsApp:** `docs/WHATSAPP_REGISTRATION_UI_FLOW.md`
- **General:** `docs/MFA_STATE_PRESERVATION_UI_CONTRACT.md`

---

## Recommendations

1. **For Consistency:**
   - ✅ Auto-population for SMS/Voice/WhatsApp phone numbers implemented (fetches from PingOne user profile)
   - Standardize all modal titles and subtitles to use a shared component with device type parameter
   - Consider extracting Voice into a separate flow component if it needs different behavior in the future

2. **For Voice Flow (Future Enhancement):**
   - If Voice needs to diverge from SMS behavior, consider creating a dedicated `VoiceFlowV8.tsx` component
   - Would require: cloning SMS flow, updating route, factory registration, and creating `VoiceFlowController`
   - Current implementation (integrated in SMS) is optimal if behavior remains identical

3. **For Documentation:**
   - Voice-specific documentation can reference SMS flow docs with Voice-specific notes
   - Consider adding a note in SMS flow docs about Voice option availability

---

## Version History

- **v1.2.0** (2025-01-31): Added phone auto-population for SMS, Voice, and WhatsApp flows
  - Created `phoneAutoPopulationServiceV8.ts` service for consistent phone auto-population
  - Updated SMS, Voice, and WhatsApp flows to auto-populate phone numbers from PingOne user profile
  - Updated backend to include `phoneNumbers` in user lookup response
  - Updated documentation to reflect phone auto-population across all phone-based OTP flows

- **v1.1.0** (2025-01-30): Updated with Voice implementation details
  - Documented Voice as integrated option in SMS flow
  - Added Voice to all comparison tables
  - Updated implementation status and code references
  - Documented type override mechanism

- **v1.0.0** (2025-01-30): Initial comparison document created
  - Analyzed SMS, Email, WhatsApp flows
  - Documented Voice flow status (not implemented at that time)
  - Identified key differences and similarities

---

## Notes

- All four OTP flows (SMS, Voice, Email, WhatsApp) share **99% identical code structure**
- Main differences are:
  1. Input field type (phone vs email)
  2. API parameter name (`phone` vs `email`)
  3. Device type constant (`'SMS'` vs `'VOICE'` vs `'EMAIL'` vs `'WHATSAPP'`)
  4. Content/labels referencing the device type
  5. Auto-population: Email uses `MFAServiceV8.lookupUserByUsername()`, phone-based flows use `phoneAutoPopulationServiceV8.fetchPhoneFromPingOne()`
  6. Implementation approach (dedicated flows vs integrated option)
- The flows are so similar that they could potentially be further unified into a single parameterized component
- **Voice Implementation:** Voice is integrated as an option in the SMS flow dropdown rather than a separate flow. This is optimal since Voice behavior is identical to SMS (phone input, validation, OTP delivery via voice call). The only difference is the `type: "VOICE"` parameter sent to the API, which is overridden in the device registration call.
- **Type Override Pattern:** Voice demonstrates an interesting pattern where the UI/controller logic is shared (SMS controller), but the API type is explicitly set to `VOICE`. This avoids code duplication while maintaining proper API semantics.

