# Simple PingOne API Display

## Overview
A clean, educational API display component that shows only PingOne API calls in an easy-to-read format. Perfect for learning the PingOne API patterns.

## Features

### 1. Filters Only PingOne Calls
- Shows only calls to `pingone.com` and `auth.pingone` domains
- Ignores proxy endpoints and internal calls
- Focuses on the actual PingOne API interactions

### 2. Clean Display Format

Each API call shows:
- **HTTP Method** (GET, POST, DELETE, etc.) with color coding
- **Status Code** (200, 400, etc.) with color coding
  - Green: 2xx success
  - Red: 4xx/5xx errors
  - Orange: 3xx redirects
  - Gray: pending
- **Full URL** with all parameters
- **Request Body** (if present) - formatted JSON
- **Response Body** (if present) - formatted JSON

### 3. Color Coding

**Method Colors:**
- 🔵 GET - Blue
- 🟢 POST - Green
- 🔴 DELETE - Red
- 🟠 PUT/PATCH - Orange

**Status Colors:**
- 🟢 2xx - Green (success)
- 🔴 4xx/5xx - Red (error)
- 🟠 3xx - Orange (redirect)
- ⚪ Pending - Gray

### 4. Simple Controls
- **Clear Button** - Removes all API calls from display
- **Auto-refresh** - Updates every 500ms
- **Fixed Bottom Position** - Always visible, doesn't interfere with flow

## Example Display

```
📡 PingOne API Calls (3)                                    [Clear]

┌─────────────────────────────────────────────────────────────┐
│ POST  200                                                   │
│ https://api.pingone.com/v1/environments/{envId}/users      │
│                                                             │
│ Request Body:                                               │
│ {                                                           │
│   "username": "curtis"                                      │
│ }                                                           │
│                                                             │
│ Response:                                                   │
│ {                                                           │
│   "id": "2a907f77-fdc2-4d3c-9b76-4af220b361a9",           │
│   "username": "curtis"                                      │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ POST  201                                                   │
│ https://api.pingone.com/v1/environments/{envId}/users/     │
│ {userId}/devices                                            │
│                                                             │
│ Request Body:                                               │
│ {                                                           │
│   "type": "SMS",                                            │
│   "phone": "+1.5125201234",                                 │
│   "name": "My iPhone"                                       │
│ }                                                           │
│                                                             │
│ Response:                                                   │
│ {                                                           │
│   "id": "abc123",                                           │
│   "type": "SMS",                                            │
│   "status": "ACTIVE"                                        │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Learning the PingOne API

### Common Patterns You'll See

#### 1. User Lookup
```
GET https://api.pingone.com/v1/environments/{envId}/users?filter=username eq "curtis"
```

#### 2. Register SMS Device
```
POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices
Body: {
  "type": "SMS",
  "phone": "+1.5125201234",
  "name": "My iPhone"
}
```

#### 3. Register TOTP Device
```
POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices
Body: {
  "type": "TOTP",
  "name": "Google Authenticator"
}
```

#### 4. Send OTP
```
POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices/{deviceId}/otp
Body: {}
```

#### 5. Validate OTP
```
POST https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices/{deviceId}/otp/check
Body: {
  "otp": "123456"
}
```

#### 6. Get Device Details
```
GET https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices/{deviceId}
```

#### 7. Delete Device
```
DELETE https://api.pingone.com/v1/environments/{envId}/users/{userId}/devices/{deviceId}
```

## URL Variables vs Body

### When to Use URL Variables
- **Resource Identifiers**: `{envId}`, `{userId}`, `{deviceId}`
- **Query Parameters**: `?filter=username eq "curtis"`
- **Path Parameters**: Part of the resource path

### When to Use Request Body
- **Creating Resources**: POST with resource data
- **Updating Resources**: PUT/PATCH with updated data
- **Actions**: POST to action endpoints (like `/otp`)

### Example: User Lookup
```
GET /users?filter=username eq "curtis"
```
- Uses query parameter (URL variable)
- No request body needed
- Filter is part of the URL

### Example: Register Device
```
POST /users/{userId}/devices
Body: { "type": "SMS", "phone": "+1.5125201234" }
```
- `{userId}` is URL variable (identifies parent resource)
- Device data goes in request body
- Body contains the resource to create

## Tips for Learning

1. **Watch the Pattern**: Notice how PingOne uses RESTful patterns
   - GET for reading
   - POST for creating
   - DELETE for removing

2. **URL Structure**: Resources are nested logically
   - `/environments/{envId}` - Environment level
   - `/users/{userId}` - User level
   - `/devices/{deviceId}` - Device level

3. **Response Codes**:
   - 200 - Success (GET, POST to action)
   - 201 - Created (POST new resource)
   - 204 - No Content (DELETE)
   - 400 - Bad Request (validation error)
   - 401 - Unauthorized (bad token)
   - 404 - Not Found

4. **Headers**: All requests include:
   - `Authorization: Bearer {token}`
   - `Content-Type: application/json`

## Integration

The component is automatically included in MFA Flow V8. It appears at the bottom of the screen and shows all PingOne API calls made during the flow.

---

**Component:** `SimplePingOneApiDisplayV8`
**Location:** `src/v8/components/SimplePingOneApiDisplayV8.tsx`
**Used In:** MFA Flow V8
**Version:** 8.0.0
**Date:** 2024-11-19
