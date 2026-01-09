# MFA Documentation Page Master Document

**Last Updated:** 2026-01-06 14:30:00  
**Version:** 1.0.0  
**Purpose:** Comprehensive reference for the MFA Flow Documentation Page (`MFADocumentationPageV8.tsx`)  
**Usage:** Use this document to restore correct implementations when the documentation page breaks or drifts

---

## Related Documentation

- [MFA Documentation Modal Master Document](./MFA_DOCUMENTATION_MODAL_MASTER.md) - Documentation modal reference
- [MFA API Reference](./MFA_API_REFERENCE.md) - Complete API endpoint documentation

---

## Overview

This document provides a comprehensive reference for the MFA Flow Documentation Page component (`MFADocumentationPageV8.tsx`). This page displays API documentation for MFA device registration and authentication flows, allowing users to view, expand/collapse, and download documentation as Markdown or PDF.

---

## File Location

**Component:** `src/v8/components/MFADocumentationPageV8.tsx`

---

## Component Structure

### Props Interface

```typescript
interface MFADocumentationPageV8Props {
  deviceType: DeviceType;
  flowType: 'registration' | 'authentication';
  credentials?: {
    environmentId?: string;
    username?: string;
    deviceAuthenticationPolicyId?: string;
  };
  currentStep?: number;
  totalSteps?: number;
  // Flow-specific props
  registrationFlowType?: 'admin' | 'user';
  adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
  tokenType?: 'worker' | 'user';
  flowSpecificData?: {
    environmentId?: string;
    userId?: string;
    deviceId?: string;
    policyId?: string;
    deviceStatus?: string;
    username?: string;
    clientId?: string;
    phone?: string;
    email?: string;
    deviceName?: string;
  };
}
```

---

## Critical Functions

### 1. getApiCalls

**Purpose:** Generate API call documentation based on device type and flow type

**Signature:**
```typescript
export const getApiCalls = (
  deviceType: DeviceType,
  flowType: 'registration' | 'authentication',
  flowSpecificData?: {
    registrationFlowType?: 'admin' | 'user';
    adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
    tokenType?: 'worker' | 'user';
    environmentId?: string;
    userId?: string;
    deviceId?: string;
    policyId?: string;
    deviceStatus?: string;
    username?: string;
    clientId?: string;
    phone?: string;
    email?: string;
    deviceName?: string;
  }
): ApiCall[]
```

**Critical Implementation Details:**

#### Registration Flow

**Device Request Body Construction (CRITICAL):**

**For FIDO2 Devices:**
```typescript
// ✅ CORRECT: FIDO2 device request body
const deviceRequestBody: Record<string, unknown> = {
  type: 'FIDO2',
  rp: {
    id: '{rpId}',
    name: '{rpName}',
  },
  policy: {
    id: valueMap.deviceAuthenticationPolicyId || '{deviceAuthenticationPolicyId}',
  },
  // NOTE: FIDO2 does NOT include: status, name, nickname, notification
};

// ❌ WRONG: Do NOT include these for FIDO2
// deviceRequestBody.status = 'ACTIVATION_REQUIRED'; // WRONG
// deviceRequestBody.name = 'My Device'; // WRONG
// deviceRequestBody.nickname = 'My Device'; // WRONG
// deviceRequestBody.notification = {...}; // WRONG
```

**For OTP Devices (SMS/Email/WhatsApp/TOTP):**
```typescript
// ✅ CORRECT: OTP device request body
const deviceRequestBody: Record<string, unknown> = {
  type: deviceType, // 'SMS', 'EMAIL', 'WHATSAPP', 'TOTP'
  status: deviceStatus, // 'ACTIVE' or 'ACTIVATION_REQUIRED'
  policy: {
    id: valueMap.deviceAuthenticationPolicyId || '{deviceAuthenticationPolicyId}',
  },
};

// Add device-specific fields
if (deviceType === 'SMS' || deviceType === 'WHATSAPP' || deviceType === 'VOICE') {
  deviceRequestBody.phone = valueMap.phone || '+1.5125201234';
} else if (deviceType === 'EMAIL') {
  deviceRequestBody.email = valueMap.email || 'user@example.com';
}

// Add notification object ONLY when status is ACTIVATION_REQUIRED
if (deviceStatus === 'ACTIVATION_REQUIRED') {
  deviceRequestBody.notification = {
    message: '',
    variant: '',
  };
}

// ❌ WRONG: Do NOT include these for OTP devices
// deviceRequestBody.name = 'My Device'; // WRONG - not valid in device creation
// deviceRequestBody.nickname = 'My Device'; // WRONG - not valid in device creation
```

**Device Status Priority (CRITICAL):**

**Contract:** Device status in request body must prioritize `flowSpecificData.deviceStatus` over `adminDeviceStatus`.

**Correct Implementation:**
```typescript
// Priority: flowSpecificData.deviceStatus > adminDeviceStatus > default
const deviceStatus =
  flowSpecificData?.deviceStatus ||
  (registrationFlowType === 'user' ? 'ACTIVATION_REQUIRED' : adminDeviceStatus || 'ACTIVE');
```

**Why:** The actual status sent to PingOne (from `flowSpecificData`) should be reflected in documentation, not the configured status.

**User Flow Steps:**

**Contract:** User flow must include Authorization Code Flow steps before device registration.

**Steps (in order):**
1. Build Authorization URL (with PKCE)
2. Exchange Authorization Code for Tokens
3. Register Device (using user token)
4. Activate Device (OTP validation, if ACTIVATION_REQUIRED)

**Admin Flow Steps:**

**Steps (in order):**
1. Get Worker Token (Client Credentials Grant)
2. Register Device (using worker token)
3. Activate Device (OTP validation, if ACTIVATION_REQUIRED)

**FIDO2 Special Handling:**

**Contract:** FIDO2 devices always require WebAuthn activation, regardless of initial status.

**Implementation:**
```typescript
// FIDO2 activation (WebAuthn-based, not OTP-based)
// FIDO2 always requires WebAuthn activation, regardless of initial device status
if (deviceType === 'FIDO2') {
  calls.push({
    step: `${activationStepNumber}. Activate FIDO2 Device (WebAuthn Registration)`,
    method: 'POST',
    endpoint: `${baseUrl}/devices/${deviceId}/activate/fido2`,
    requestBody: {
      attestationObject: '{attestationObject}',
      clientDataJSON: '{clientDataJSON}',
      credentialId: '{credentialId}',
      origin: '{origin}',
    },
    notes: [
      'Content-Type: application/vnd.pingidentity.device.activate.fido2+json',
      'FIDO2 devices always require WebAuthn activation, regardless of initial status',
    ],
  });
}
```

#### Authentication Flow

**Steps (in order):**
1. Get Worker Token (Client Credentials Grant)
2. Initialize Device Authentication
3. Select Device (if DEVICE_SELECTION_REQUIRED, FIDO2 only)
4. Validate OTP or Check Assertion
5. Complete Authentication (optional)

**Device Selection:**

**Contract:** Device selection step only shown for FIDO2 when multiple devices are available.

**Implementation:**
```typescript
if (deviceType === 'FIDO2') {
  calls.push({
    step: '3. Select Device for Authentication (if multiple devices)',
    method: 'POST',
    endpoint: `${selectDevicePath} (from _links.device.select.href)`,
    requestBody: {
      selectedDevice: {
        id: valueMap.deviceId || '{deviceId}',
      },
    },
    notes: [
      'Content-Type: application/vnd.pingidentity.device.select+json',
      'Only required if Initialize Device Authentication returned DEVICE_SELECTION_REQUIRED status',
    ],
  });
}
```

---

### 2. generateMarkdown

**Purpose:** Convert API calls array to Markdown format

**Signature:**
```typescript
export const generateMarkdown = (
  deviceType: DeviceType,
  flowType: 'registration' | 'authentication',
  apiCalls: ApiCall[],
  registrationFlowType?: 'admin' | 'user',
  adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED'
): string
```

**Output Format:**
- Title: "Ping Identity - {DeviceName} MFA {Registration|Authentication} Flow"
- Generated date
- Overview section
- API Reference links
- Flow Type explanation (if registrationFlowType provided)
- API Calls section (one per call)
- UI Requirements section
- References section

**Markdown Structure:**
```markdown
# Ping Identity - {DeviceName} MFA {FlowType} Flow

**Generated:** {Date}

## Overview
...

## API Reference
- **Registration API:** [Link]
- **Activation API:** [Link]

## Flow Type: {Admin|User} Flow
...

## API Calls

### {Step Number}. {Step Name}
**{METHOD}** `{endpoint}`
{description}

**Notes:**
- {note 1}
- {note 2}

**Request Body:**
```json
{requestBody}
```

**Response:**
```json
{responseBody}
```

---

## UI Requirements
...

## References
...
```

---

### 3. downloadAsMarkdown

**Purpose:** Download markdown content as .md file

**Signature:**
```typescript
export const downloadAsMarkdown = (content: string, filename: string): void
```

**Implementation:**
```typescript
const blob = new Blob([content], { type: 'text/markdown' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = filename;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

---

### 4. markdownToHtml

**Purpose:** Convert markdown to HTML for PDF generation

**Signature:**
```typescript
const markdownToHtml = (markdown: string): string
```

**Features:**
- Handles code blocks (```json, ```bash, etc.)
- Converts headers (#, ##, ###)
- Converts lists (-, *)
- Converts links ([text](url))
- Converts inline code (`code`)
- Preserves JSON formatting

---

### 5. downloadAsPDF

**Purpose:** Download markdown content as PDF

**Signature:**
```typescript
export const downloadAsPDF = (markdown: string, title: string): void
```

**Implementation:**
- Converts markdown to HTML via `markdownToHtml()`
- Creates print window with HTML content
- Uses browser print-to-PDF functionality
- Includes Ping Identity branding

---

## UI Structure

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Navigation Bar (MFANavigationV8)                       │
│  - Current Page: "documentation"                        │
│  - Show Back to Main: true                              │
└─────────────────────────────────────────────────────────┘
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Step Indicator (if currentStep/totalSteps)     │  │
│  │  - Green badge: "{currentStep + 1} / {totalSteps}" │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Header                                          │  │
│  │  - Ping Identity Logo + Title                    │  │
│  │  - Device Name + Flow Type                       │  │
│  │  - Subtitle: "Complete API documentation..."     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Data Model Documentation Link                   │  │
│  │  - Blue info box                                 │  │
│  │  - Link to PingOne API docs                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Action Buttons                                  │  │
│  │  - Back to Hub (green)                          │  │
│  │  - Download as Markdown (blue)                   │  │
│  │  - Download as PDF (red)                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Flow Rules Section                              │  │
│  │  - Admin Flow rules                              │  │
│  │  - User Flow rules                               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  API Calls Section                               │  │
│  │  - Collapsible cards (one per API call)         │  │
│  │  - Expand/collapse functionality                │  │
│  │  - Request/Response bodies                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  UI Requirements Section                         │  │
│  │  - Yellow background                             │  │
│  │  - OTP Validation Modal requirements            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  API References Section                          │  │
│  │  - Green background                             │  │
│  │  - Links to PingOne API docs                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Bottom Navigation                               │  │
│  │  - Back to Hub button                           │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Critical UI Elements

### 1. Step Indicator

**Contract:**
- Only shown if `currentStep` and `totalSteps` props are provided
- Green badge with step number
- Format: "{currentStep + 1} / {totalSteps}"

**Styling:**
- Background: `#10b981` (green)
- Border radius: `8px`
- Padding: `8px 12px`
- Font size: `18px` (step number), `14px` (total)
- Position: Top right of page

---

### 2. Header

**Contract:**
- Ping Identity logo: `FiBook` icon (32px, red: #E31837)
- Title: "Ping Identity" (28px, bold)
- Subtitle: "{DeviceName} MFA {Registration|Authentication} Flow" (22px, semibold)
- Description: "Complete API documentation with examples and rules" (14px, gray)

**Styling:**
- Centered alignment
- Margin bottom: `32px`

---

### 3. Data Model Documentation Link

**Contract:**
- Blue info box (`#eff6ff` background)
- Icon: `FiInfo` (18px, blue)
- Title: "Complete Data Model Reference"
- Link: Opens PingOne API docs for device registration data model
- Text: "View {DeviceName} Device Registration Data Model →"

**Styling:**
- Background: `#eff6ff`
- Border: `1px solid #bfdbfe`
- Border radius: `8px`
- Padding: `16px`
- Margin bottom: `24px`

---

### 4. Action Buttons

**Contract:**
- Four buttons in horizontal row
- Centered alignment
- Wrap enabled for responsive design

**Buttons:**

1. **Back to Hub**
   - Icon: `FiHome`
   - Background: `#10b981` (green)
   - Navigates to `/v8/mfa-hub`

2. **Download as Markdown**
   - Icon: `FiFileText`
   - Background: `#3b82f6` (blue)
   - Calls `handleDownloadMarkdown()`

3. **Download as PDF**
   - Icon: `FiDownload`
   - Background: `#ef4444` (red)
   - Calls `handleDownloadPDF()`

4. **Download Postman Collection**
   - Icon: `FiPackage`
   - Background: `#8b5cf6` (purple)
   - Calls `handleDownloadPostman()`
   - Generates Postman collection JSON file with format: `{{authPath}}/{{envID}}/path`
   - Includes variables: `authPath`, `envID`, `workerToken`, `username`
   - Reference: [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)

**Styling:**
- Padding: `12px 24px`
- Border radius: `8px`
- Font size: `15px`
- Font weight: `600`
- Box shadow: `0 2px 8px rgba(color, 0.3)`
- Gap: `12px`

---

### 5. Flow Rules Section

**Contract:**
- Gray background (`#f9fafb`)
- Border: `1px solid #e5e7eb`
- Border radius: `12px`
- Padding: `24px`
- Margin bottom: `32px`

**Content:**
- Title: "Flow Rules" (18px, semibold)
- Two subsections:
  - **Admin Flow:** Token type, status options, use case
  - **User Flow:** Token type, status options, use case, authentication requirement

**Styling:**
- Title icon: `FiInfo` (20px, blue)
- Subsection titles: `15px`, semibold
- Lists: `14px`, gray text, padding left: `20px`
- Code blocks: `#e5e7eb` background, `2px 6px` padding

---

### 6. API Calls Section

**Contract:**
- Collapsible cards (one per API call)
- Expand/collapse functionality
- Chevron icon (up when expanded, down when collapsed)

**Card Structure:**
```
┌─────────────────────────────────────────────────┐
│  [Expand/Collapse Button]                      │
│  - Step name (16px, semibold)                  │
│  - Method + Endpoint (18px, bold)              │
│  - Chevron icon (right side)                   │
└─────────────────────────────────────────────────┘
│  [Expanded Content] (when expanded)            │
│  - Description (14px)                          │
│  - Important Notes (blue box)                  │
│  - Request Body (JSON, orange border)          │
│  - Response (JSON, gray border)                │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Border: `1px solid #e5e7eb`
- Border radius: `8px`
- Button background: `#f3f4f6` when expanded, `white` when collapsed
- Request body: Orange border (`4px solid #f97316`), `#f9fafb` background
- Response: Gray border (`1px solid #e5e7eb`), `#f9fafb` background
- JSON: `14px` font, `16px` padding, white background

**Important Notes Box:**
- Background: `#eff6ff`
- Border: `1px solid #93c5fd`
- Border radius: `6px`
- Padding: `12px`
- Title: "Important Notes:" (12px, semibold, blue)
- List: `13px`, blue text, padding left: `20px`

---

### 7. UI Requirements Section

**Contract:**
- Yellow background (`#fffbeb`)
- Border: `1px solid #fcd34d`
- Border radius: `12px`
- Padding: `24px`
- Margin bottom: `32px`

**Content:**
- Title: "UI Requirements" (18px, semibold, brown)
- OTP Validation Modal subsection (if registration flow):
  - When: Device status is `ACTIVATION_REQUIRED`
  - Requires: User must enter OTP code
  - Action: Calls device activation API

---

### 8. API References Section

**Contract:**
- Green background (`#f0fdf4`)
- Border: `1px solid #6ee7b7`
- Border radius: `12px`
- Padding: `24px`

**Content:**
- Title: "API References" (18px, semibold, green)
- Icon: `FiBook` (20px, green)
- Links:
  - Device Registration API
  - Device Activation API
  - PingOne MFA API Documentation

**Link Styling:**
- Color: `#059669` (green)
- Text decoration: underline on hover
- Font size: `14px`

---

## DEVICE_DOCS Constant

**Purpose:** Maps device types to API documentation URLs and display names

**Structure:**
```typescript
export const DEVICE_DOCS: Record<
  DeviceType,
  {
    registrationApiDocs: string;
    activationApiDocs: string;
    deviceName: string;
  }
> = {
  SMS: {
    registrationApiDocs: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms',
    activationApiDocs: 'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device',
    deviceName: 'SMS',
  },
  // ... other device types
};
```

**Device Types:**
- SMS
- EMAIL
- WHATSAPP
- TOTP
- FIDO2
- MOBILE
- VOICE
- OATH_TOKEN

---

## Critical Implementation Details

### 1. Device Request Body Construction

**FIDO2 Devices:**
```typescript
// ✅ CORRECT
const deviceRequestBody = {
  type: 'FIDO2',
  rp: { id: '{rpId}', name: '{rpName}' },
  policy: { id: '{policyId}' },
};

// ❌ WRONG - Do NOT include:
// - status
// - name
// - nickname
// - notification
```

**OTP Devices:**
```typescript
// ✅ CORRECT
const deviceRequestBody = {
  type: 'SMS', // or EMAIL, WHATSAPP, TOTP
  status: 'ACTIVATION_REQUIRED', // or 'ACTIVE'
  phone: '+1.5125201234', // for SMS/WHATSAPP
  email: 'user@example.com', // for EMAIL
  policy: { id: '{policyId}' },
  notification: { message: '', variant: '' }, // ONLY if ACTIVATION_REQUIRED
};

// ❌ WRONG - Do NOT include:
// - name
// - nickname
```

### 2. Device Status Priority

**Contract:** `flowSpecificData.deviceStatus` takes priority over `adminDeviceStatus`.

**Implementation:**
```typescript
const deviceStatus =
  flowSpecificData?.deviceStatus ||
  (registrationFlowType === 'user' ? 'ACTIVATION_REQUIRED' : adminDeviceStatus || 'ACTIVE');
```

**Why:** Documentation should reflect the actual status sent to PingOne, not the configured status.

### 3. Notification Object

**Contract:** Notification object only included when `deviceStatus === 'ACTIVATION_REQUIRED'`.

**Implementation:**
```typescript
if (deviceStatus === 'ACTIVATION_REQUIRED') {
  deviceRequestBody.notification = {
    message: '',
    variant: '',
  };
}
```

**Why:** Per PingOne API docs, notification is only applicable when status is ACTIVATION_REQUIRED.

### 4. All Fields for Educational Completeness

**Contract:** Request body must include ALL possible fields (even with defaults) for educational purposes.

**Implementation:**
```typescript
// Always include notification object for educational completeness when status is ACTIVATION_REQUIRED
// This shows users the complete data model structure, even with empty values
if (deviceStatus === 'ACTIVATION_REQUIRED') {
  deviceRequestBody.notification = {
    message: '',
    variant: '',
  };
}
```

**Why:** Users should see the complete data model structure, not just required fields.

---

## Common Issues and Fixes

### Issue 1: FIDO2 Request Body Includes Invalid Fields

**Symptom:** Documentation shows `status`, `name`, or `nickname` in FIDO2 request body

**Fix:**
```typescript
// Remove invalid fields for FIDO2
if (deviceType === 'FIDO2') {
  const deviceRequestBody = {
    type: 'FIDO2',
    rp: { id: '{rpId}', name: '{rpName}' },
    policy: { id: '{policyId}' },
  };
  // Do NOT include: status, name, nickname, notification
}
```

### Issue 2: Device Status Not Reflecting Actual API Call

**Symptom:** Documentation shows configured status instead of actual status sent to PingOne

**Fix:**
```typescript
// Prioritize flowSpecificData.deviceStatus
const deviceStatus =
  flowSpecificData?.deviceStatus ||
  (registrationFlowType === 'user' ? 'ACTIVATION_REQUIRED' : adminDeviceStatus || 'ACTIVE');
```

### Issue 3: Missing Fields in Request Body

**Symptom:** Documentation doesn't show all possible fields (e.g., notification object)

**Fix:**
```typescript
// Always include all fields for educational completeness
if (deviceStatus === 'ACTIVATION_REQUIRED') {
  deviceRequestBody.notification = {
    message: '',
    variant: '',
  };
}
```

### Issue 4: User Flow Missing Authorization Steps

**Symptom:** User flow documentation doesn't show Authorization Code Flow steps

**Fix:**
```typescript
if (registrationFlowType === 'user') {
  // Step 1: Build Authorization URL
  calls.push({
    step: '1. Build Authorization URL',
    method: 'GET',
    endpoint: `${authEndpoint}?${authUrlParams.toString()}`,
    // ...
  });
  
  // Step 2: Exchange Authorization Code for Tokens
  calls.push({
    step: '2. Exchange Authorization Code for Tokens',
    method: 'POST',
    endpoint: tokenEndpoint,
    // ...
  });
  
  // Step 3: Register Device (using user token)
  // ...
}
```

---

## Testing Checklist

- [ ] FIDO2 request body does NOT include status, name, nickname, notification
- [ ] OTP device request body includes status, phone/email, policy, notification (if ACTIVATION_REQUIRED)
- [ ] Device status prioritizes flowSpecificData.deviceStatus
- [ ] User flow includes Authorization Code Flow steps
- [ ] Admin flow includes Worker Token step
- [ ] FIDO2 activation step always included (regardless of initial status)
- [ ] OTP activation step only included when ACTIVATION_REQUIRED
- [ ] All fields included in request body (even defaults)
- [ ] Markdown download works
- [ ] PDF download works
- [ ] Expand/collapse functionality works
- [ ] Links to PingOne API docs work

---

## Version History

- **v1.0.0** (2025-01-27): Initial master document for MFA Documentation Page

---

## Notes

- **FIDO2 vs OTP:** FIDO2 and OTP devices have different request body structures. FIDO2 does NOT include status, name, nickname, or notification.
- **Device Status Priority:** `flowSpecificData.deviceStatus` takes priority over `adminDeviceStatus` to reflect actual API calls.
- **Educational Completeness:** All possible fields should be included in request body examples, even with default/empty values.
- **User Flow:** Must include Authorization Code Flow steps before device registration.
- **FIDO2 Activation:** Always required, regardless of initial device status.

