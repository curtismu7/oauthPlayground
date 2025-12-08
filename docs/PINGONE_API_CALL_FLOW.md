# PingOne MFA API Call Flow - Where Calls Are Created

## Complete Flow: From UI Button to PingOne API

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "Register Device" BUTTON                        │
│    Location: SMSFlowV8.tsx:2188                                 │
│    <button onClick={handleRegisterDevice}>                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. handleRegisterDevice() FUNCTION                              │
│    Location: SMSFlowV8.tsx:1064                                 │
│    - Validates credentials                                       │
│    - Determines device status (ACTIVE/ACTIVATION_REQUIRED)      │
│    - Calls: correctController.registerDevice()                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. MFAFlowController.registerDevice()                           │
│    Location: MFAFlowController.ts:96                            │
│    - Builds RegisterDeviceParams                                │
│    - Calls: MFAServiceV8.registerDevice(params)                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. MFAServiceV8.registerDevice()                                │
│    Location: mfaServiceV8.ts:434                                │
│    - Looks up user by username                                  │
│    - Gets token (worker or user)                                │
│    - Builds devicePayload with status field                     │
│    - Builds requestBody for backend proxy                       │
│    - Tracks API call: POST /api/pingone/mfa/register-device     │
│    - Calls: pingOneFetch('/api/pingone/mfa/register-device')    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND PROXY ENDPOINT                                        │
│    Location: server.js:7711                                     │
│    POST /api/pingone/mfa/register-device                        │
│    - Receives requestBody from frontend                         │
│    - Extracts: environmentId, userId, type, status, etc.        │
│    - Builds devicePayload for PingOne                            │
│    - Constructs actual PingOne URL                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. ⭐ ACTUAL PINGONE API CALL CREATED HERE ⭐                    │
│    Location: server.js:7840                                      │
│                                                                  │
│    const deviceEndpoint =                                       │
│      `https://api.pingone.com/v1/environments/                   │
│       ${environmentId}/users/${userId}/devices`;                  │
│                                                                  │
│    const response = await global.fetch(deviceEndpoint, {        │
│      method: 'POST',                                             │
│      headers: {                                                  │
│        'Content-Type': 'application/json',                       │
│        Authorization: `Bearer ${accessToken}`,                   │
│      },                                                           │
│      body: JSON.stringify(devicePayload),  ← STATUS FIELD HERE   │
│    });                                                            │
│                                                                  │
│    devicePayload contains:                                      │
│    {                                                             │
│      type: "SMS",                                                │
│      phone: { number: "+1.5125201234" },                        │
│      nickname: "My SMS Device",                                 │
│      status: "ACTIVE" or "ACTIVATION_REQUIRED",  ← KEY FIELD    │
│      policy: { id: "policy-id" }                                │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. PINGONE API RESPONSE                                          │
│    Location: server.js:7902                                     │
│    - Receives deviceData from PingOne                           │
│    - Wraps response with _metadata containing:                  │
│      * actualPingOneUrl                                          │
│      * actualPingOnePayload (the JSON body sent)                │
│      * actualPingOneResponse                                     │
│    - Returns to frontend                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. FRONTEND RECEIVES RESPONSE                                    │
│    Location: mfaServiceV8.ts:609                                │
│    - Extracts _metadata                                          │
│    - Tracks actual PingOne API call in API Call Tracker          │
│    - Removes _metadata before processing                        │
│    - Returns device registration result                          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Locations

### Where the Actual PingOne API Call is Created

**File:** `server.js`  
**Line:** 7840  
**Function:** `app.post('/api/pingone/mfa/register-device', ...)`

```javascript
// Line 7809: Construct the actual PingOne API endpoint
const deviceEndpoint = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`;

// Line 7840: ⭐ THIS IS WHERE THE ACTUAL PINGONE API CALL IS MADE ⭐
const response = await global.fetch(deviceEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify(devicePayload),  // ← Contains status field here
});
```

### Where the Status Field is Set

**Frontend Service:** `src/v8/services/mfaServiceV8.ts`
- **Line 480-488:** Sets status in `devicePayload`
- **Line 531:** Includes status in `requestBody.status` sent to backend

**Backend:** `server.js`
- **Line 7787-7792:** Sets status in `devicePayload.status` (the JSON body sent to PingOne)
- **Line 7846:** `JSON.stringify(devicePayload)` - This is what gets sent to PingOne

## Status Field Flow

```
1. User selects status in UI (SMSFlowV8.tsx:1149)
   ↓ deviceStatus = 'ACTIVE' or 'ACTIVATION_REQUIRED'

2. Passed to controller (SMSFlowV8.tsx:1171)
   ↓ getDeviceRegistrationParams(credentials, deviceStatus)

3. Controller sets in params (SMSFlowController.ts:93)
   ↓ params.status = deviceStatus

4. Service sets in devicePayload (mfaServiceV8.ts:480-488)
   ↓ devicePayload.status = params.status || default

5. Service includes in requestBody (mfaServiceV8.ts:531)
   ↓ requestBody.status = devicePayload.status

6. Backend receives status (server.js:7713)
   ↓ const { status } = req.body

7. Backend sets in devicePayload (server.js:7787-7792)
   ↓ devicePayload.status = status || default

8. ⭐ Backend sends to PingOne (server.js:7846)
   ↓ body: JSON.stringify(devicePayload)
   ↓ This JSON includes: { ..., "status": "ACTIVE" or "ACTIVATION_REQUIRED" }
```

## How to See the Actual PingOne API Call

### Method 1: API Display Component
The `SuperSimpleApiDisplayV8` component (shown in the UI) will now display:
1. **Proxy Call:** `POST /api/pingone/mfa/register-device`
2. **Actual PingOne Call:** `POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices`

### Method 2: Browser Console
Check the console logs:
- **Frontend:** Look for `[📱 MFA-SERVICE-V8] 📊 REGISTRATION PAYLOAD DEBUG:`
- **Backend:** Look for `[MFA Register Device] Sending payload to PingOne:`

### Method 3: Network Tab
In browser DevTools → Network tab:
- Filter for `pingone.com`
- Look for the POST request to `/v1/environments/.../devices`
- Check the Request Payload to see the JSON body with status field

## Debugging Status Field Issues

If the status field is not being set correctly, check:

1. **Frontend Service (mfaServiceV8.ts:480-488):**
   ```typescript
   if (params.status) {
     devicePayload.status = params.status;
   } else if (params.tokenType === 'worker') {
     devicePayload.status = 'ACTIVE';
   } else {
     devicePayload.status = 'ACTIVATION_REQUIRED';
   }
   ```

2. **Backend (server.js:7787-7792):**
   ```javascript
   if (status) {
     devicePayload.status = status;
   } else if (tokenType === 'worker') {
     devicePayload.status = 'ACTIVE';
   }
   ```

3. **Check the actual JSON sent to PingOne (server.js:7846):**
   ```javascript
   body: JSON.stringify(devicePayload)
   // Should include: { "type": "SMS", "status": "ACTIVE", ... }
   ```

## Summary

**The actual PingOne API call is created in the backend at `server.js:7840`** using `global.fetch()` to call:
```
POST https://api.pingone.com/v1/environments/{environmentId}/users/{userId}/devices
```

The JSON body (`devicePayload`) is built in the backend starting at line 7749 and includes the `status` field that was set based on:
- User's selection in the UI (Admin Flow: ACTIVE or ACTIVATION_REQUIRED)
- Flow type (User Flow: always ACTIVATION_REQUIRED)
- Token type (Worker token can set either, User token can only set ACTIVATION_REQUIRED)

The status field should always be present in the JSON body sent to PingOne for educational purposes, even when it's ACTIVE (PingOne's default).

