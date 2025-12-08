# PingOne API Call Logging

## Overview

All actual PingOne API calls made from the backend server are now comprehensively logged with full request and response details for debugging purposes.

## Where Logs Are Written

### Separate Log File for PingOne API Calls

All PingOne API calls are written to a **dedicated log file** to keep the main server log clean:

- **Location:** `logs/pingone-api.log` (relative to the server.js file)
- **Format:** Timestamped log entries with full request/response details
- **Persistence:** Logs persist across server restarts
- **Console Output:** PingOne API calls are **NOT** written to console to reduce noise
- **Auto-Creation:** The file is automatically created when the first PingOne API call is made

The log file paths are displayed when the server starts:
```
📝 Server logs: /path/to/oauth-playground/logs/server.log
📝 PingOne API logs: /path/to/oauth-playground/logs/pingone-api.log
```

**Note:** If the file doesn't exist yet, it will be created automatically on the first PingOne API call. You can also create it manually:
```bash
touch logs/pingone-api.log
```

### Benefits of Separate Log File

- **Cleaner Server Log:** Main `server.log` is no longer cluttered with verbose API call details
- **Easy Debugging:** All PingOne API interactions in one dedicated file
- **Better Performance:** Reduced I/O to main log file
- **Focused Analysis:** Can analyze API calls independently from other server logs

## Log Format

Each PingOne API call generates a comprehensive log entry with the following structure:

```
═══════════════════════════════════════════════════════════════
🌐 [PINGONE API CALL] Operation Name
═══════════════════════════════════════════════════════════════
📍 URL: https://api.pingone.com/v1/environments/{envId}/...
🔧 METHOD: POST
📋 REQUEST HEADERS: {
  "Content-Type": "application/json",
  "Authorization": "Bearer abc123...xyz789"
}
📦 REQUEST BODY (JSON): {
  "type": "SMS",
  "status": "ACTIVE",
  "phone": { "number": "+1.5125201234" },
  ...
}
📦 REQUEST BODY (Raw): {"type":"SMS","status":"ACTIVE",...}
📊 REQUEST METADATA: {
  "environmentId": "...",
  "userId": "...",
  "deviceType": "SMS",
  ...
}
───────────────────────────────────────────────────────────────
📥 [PINGONE API RESPONSE] Operation Name
═══════════════════════════════════════════════════════════════
📊 STATUS: 200 OK
⏱️  DURATION: 234ms
📋 RESPONSE HEADERS: {
  "content-type": "application/json",
  "x-request-id": "...",
  ...
}
📦 RESPONSE BODY (JSON): {
  "id": "device-id",
  "type": "SMS",
  "status": "ACTIVE",
  ...
}
📦 RESPONSE BODY (Raw): {"id":"device-id","type":"SMS",...}
═══════════════════════════════════════════════════════════════
```

## Logged Endpoints

The following MFA endpoints now have comprehensive logging:

1. **Register MFA Device** (`POST /api/pingone/mfa/register-device`)
   - Logs: URL, method, headers, request body (with status field), response

2. **Activate MFA Device** (`POST /api/pingone/mfa/activate-device`)
   - Logs: Activation endpoint, OTP in request body, response

3. **Lookup User** (`POST /api/pingone/mfa/lookup-user`)
   - Logs: User lookup query, response with user data

4. **Send OTP** (`POST /api/pingone/mfa/send-otp`)
   - Logs: OTP endpoint, response

5. **Validate OTP** (`POST /api/pingone/mfa/validate-otp`)
   - Logs: Validation endpoint, OTP in request body, validation result

## Security Features

- **Token Truncation:** Authorization tokens in headers are automatically truncated for security
  - Format: `Bearer abc123...xyz789` (first 20 chars + last 10 chars)
  - Full tokens are never logged in plain text

## Implementation Details

### Logging Utility Function

The logging is implemented via a reusable utility function:

**Location:** `server.js` (line ~354)

**Function:** `logPingOneApiCall(operationName, url, method, headers, body, response, responseData, duration, metadata)`

### Usage Pattern

All PingOne API calls follow this pattern:

```javascript
const startTime = Date.now();
const response = await global.fetch(endpoint, {
  method: 'POST',
  headers: requestHeaders,
  body: JSON.stringify(requestBody),
});
const duration = Date.now() - startTime;

// Clone response for logging
const responseClone = response.clone();
let responseData;
try {
  const responseText = await responseClone.text();
  responseData = JSON.parse(responseText);
} catch {
  responseData = { raw: responseText };
}

// Log the call
logPingOneApiCall(
  'Operation Name',
  endpoint,
  'POST',
  requestHeaders,
  requestBody,
  response,
  responseData,
  duration,
  { /* metadata */ }
);
```

## Viewing Logs

### During Development

1. **PingOne API Log File:** Open `logs/pingone-api.log` in your editor or use:
   ```bash
   tail -f logs/pingone-api.log
   ```

2. **Server Log File:** For general server logs, use:
   ```bash
   tail -f logs/server.log
   ```

### Searching Logs

To find specific PingOne API calls in the dedicated log file:

```bash
# Find all PingOne API calls
grep "PINGONE API CALL" logs/pingone-api.log

# Find specific operation
grep "Register MFA Device" logs/pingone-api.log

# Find by timestamp
grep "2025-01-15" logs/pingone-api.log

# Find failed requests (status codes >= 400)
grep "STATUS: [45]" logs/pingone-api.log

# Find slow requests (duration > 1000ms)
grep "DURATION: [0-9][0-9][0-9][0-9]" logs/pingone-api.log
```

## Example Log Entry

Here's a real example of what you'll see in the logs:

```
[2025-01-15T10:30:45.123Z] [LOG] ═══════════════════════════════════════════════════════════════
[2025-01-15T10:30:45.123Z] [LOG] 🌐 [PINGONE API CALL] Register MFA Device
[2025-01-15T10:30:45.123Z] [LOG] ═══════════════════════════════════════════════════════════════
[2025-01-15T10:30:45.123Z] [LOG] 📍 URL: https://api.pingone.com/v1/environments/env-123/users/user-456/devices
[2025-01-15T10:30:45.123Z] [LOG] 🔧 METHOD: POST
[2025-01-15T10:30:45.123Z] [LOG] 📋 REQUEST HEADERS: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIs...xyz789"
}
[2025-01-15T10:30:45.123Z] [LOG] 📦 REQUEST BODY (JSON): {
  "type": "SMS",
  "phone": {
    "number": "+1.5125201234"
  },
  "nickname": "My SMS Device",
  "status": "ACTIVE"
}
...
[2025-01-15T10:30:45.456Z] [LOG] 📥 [PINGONE API RESPONSE] Register MFA Device
[2025-01-15T10:30:45.456Z] [LOG] 📊 STATUS: 200 OK
[2025-01-15T10:30:45.456Z] [LOG] ⏱️  DURATION: 333ms
[2025-01-15T10:30:45.456Z] [LOG] 📦 RESPONSE BODY (JSON): {
  "id": "device-789",
  "type": "SMS",
  "status": "ACTIVE",
  ...
}
```

## Benefits

1. **Full Visibility:** See exactly what is sent to PingOne and what comes back
2. **Debugging:** Easily identify issues with request format, status fields, or responses
3. **Educational:** Understand the complete API interaction flow
4. **Troubleshooting:** Quickly find failed requests and their error details
5. **Performance:** Track request duration for optimization

## Notes

- Logs are written asynchronously to avoid blocking the server
- Large responses may result in large log entries
- Log files can grow over time - consider log rotation for production
- All console.log, console.error, and console.warn calls are automatically written to the log file

