# Manual Password API Testing Guide

## Prerequisites
1. Backend server running on `https://localhost:3000`
2. Valid PingOne environment with a worker app that has proper roles
3. A test user ID in your environment

## Test Status from Server Logs

The backend server is running and showing successful operations:
- ✅ Recovery code sent successfully
- ✅ Server version 2.0 with password check fix applied

## How to Test Each API

### 1. Test via UI (Recommended)

The easiest way to test all APIs is through the Password Reset UI:

1. Navigate to `https://localhost:3000` in your browser
2. Go to the **Password Reset** section
3. Enter your environment credentials (Environment ID, Worker Token)
4. Test each tab:
   - **Check Password** - Verify a user's password ✅ (FIXED)
   - **Send Recovery Code** - Send password reset email/SMS
   - **Recover Password** - Reset with recovery code
   - **Force Change** - Require password change on next login
   - **Unlock** - Unlock a locked account
   - **Set Password** - Admin set new password
   - **Read State** - View password status

### 2. Test via Browser DevTools

Open the browser console and watch for:
- ✅ Success messages (green)
- ❌ Error messages (red)
- 📊 API responses in the Network tab

### 3. Test via Server Logs

Watch the backend logs in real-time:
```bash
tail -f backend.log
```

Look for:
- `[🔐 PASSWORD]` prefixed messages
- Status codes (200 = success, 400 = validation error, 401 = auth error)
- PingOne API responses

## Expected Behaviors

### Check Password API (Recently Fixed)
**Before Fix:**
```
❌ POST /api/pingone/password/check 400 (Bad Request)
Error: INVALID_DATA - validation errors
```

**After Fix:**
```
✅ POST /api/pingone/password/check 200 (OK)
Response: { success: true, valid: true/false, message: "..." }
```

### All Password APIs

| Endpoint | Method | Expected Success | Expected Failure |
|----------|--------|------------------|------------------|
| `/api/pingone/password/state` | GET | 200 + password state | 404 if user not found |
| `/api/pingone/password/send-recovery-code` | POST | 200 + success message | 400 if invalid params |
| `/api/pingone/password/recover` | POST | 200 + success | 400 if invalid code |
| `/api/pingone/password/check` | POST | 200 + valid true/false | 400 if missing params |
| `/api/pingone/password/force-change` | POST | 200 + success | 400 if invalid params |
| `/api/pingone/password/unlock` | POST | 200 + success | 400 if not locked |
| `/api/pingone/password/set` | PUT | 200 + success | 400 if policy violation |
| `/api/pingone/password/admin-set` | PUT | 200 + success | 400 if policy violation |
| `/api/pingone/password/set-value` | PUT | 200 + success | 400 if policy violation |

## Common Issues

### 1. Worker Token Issues
**Symptom:** 401 Unauthorized
**Solution:** Ensure your worker app has these roles:
- `Identity Data Admin` or
- `Environment Admin`

### 2. Invalid User ID
**Symptom:** 404 Not Found
**Solution:** Use the User Lookup feature to find a valid user ID

### 3. Password Policy Violations
**Symptom:** 400 Bad Request with policy details
**Solution:** Use a stronger password that meets policy requirements

### 4. Account Locked
**Symptom:** Operations fail with "account locked" message
**Solution:** Use the Unlock Password API first

## Quick Test Checklist

- [ ] Check Password - Verify correct password returns `valid: true`
- [ ] Check Password - Verify incorrect password returns `valid: false`
- [ ] Send Recovery Code - Email/SMS sent successfully
- [ ] Force Password Change - User flagged for password change
- [ ] Unlock Password - Locked account unlocked
- [ ] Set Password - New password set successfully
- [ ] Read Password State - Status information retrieved

## Verification

After testing, verify in PingOne console:
1. Go to **Users** in your environment
2. Find the test user
3. Check the **Password** tab for:
   - Last password change date
   - Force change flag
   - Lock status
   - Failed attempts

## Recent Fix Applied

✅ **Password Check API Fix** (Applied: Now)
- Changed request body field from `currentPassword` to `password`
- Now correctly validates passwords against PingOne API
- Returns proper `valid: true/false` response

## Server Status

Current server status from logs:
```
[🔐 PASSWORD] ========================================
[🔐 PASSWORD] 🔥 SERVER VERSION: 2.0 - NO BODY FIX 🔥
[🔐 PASSWORD] ========================================
[🔐 PASSWORD] ✅ Recovery code sent successfully
```

Server is running and processing requests successfully!
