# Password Check API Fix

## Issue
The password check endpoint was returning a 400 Bad Request error with "INVALID_DATA" message.

## Root Cause
The backend was sending the wrong field name to PingOne API:
- **Incorrect**: `currentPassword` 
- **Correct**: `password`

## Fix Applied
Updated `server.js` line 2693 to use the correct field name:

```javascript
// Before:
body: JSON.stringify({
  currentPassword: password,
}),

// After:
body: JSON.stringify({
  password: password,
}),
```

## PingOne API Specification
According to PingOne API documentation, the password check operation expects:
- **Content-Type**: `application/vnd.pingidentity.password.check+json`
- **Body**: `{ "password": "string" }`

Note: This is different from the password change operation which uses `currentPassword` and `newPassword`.

## Testing
After the fix:
1. Backend server restarted successfully
2. The password check endpoint should now accept the correct field name
3. Test by using the Check Password tab in the Password Reset flow

## Related Files
- `server.js` (line 2666-2740) - Backend endpoint
- `src/services/passwordResetService.ts` (line 308-365) - Frontend service
- `src/components/password-reset/tabs/CheckPasswordTab.tsx` - UI component
