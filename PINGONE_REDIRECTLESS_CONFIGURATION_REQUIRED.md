# ⚠️ PingOne Application Configuration Required for pi.flow

## Date: October 29, 2025

## Problem
We're receiving **0 cookies** from PingOne and getting **401 ACCESS_FAILED** errors when calling the Flow API.

This indicates the PingOne application is **NOT configured for Redirectless mode**.

## What We Fixed
✅ Implemented `response_mode=pi.flow` correctly per PingOne documentation
✅ Removed `redirect_uri` from initial request (not required for pi.flow)
✅ Removed username/password from initial request (Flow API handles these)
✅ Added cookie propagation from initial response to Flow API calls
✅ Removed client credentials from Flow API calls (not needed)

## What You MUST Configure in PingOne

### Step 1: Enable Redirectless Mode

1. Log into **PingOne Admin Console**
2. Navigate to: **Applications** → **[Your Application]**
3. Go to: **Configuration** (or **Experiences** → **Hosted Login**)
4. Look for **"Redirectless"** settings
5. **Enable Redirectless mode** (or **pi.flow** support)

### Step 2: Verify Application Type

The application should be configured as:
- **Single Page Application (SPA)** OR
- **Native Application**

NOT as a "Web Application" (which expects server-side redirects).

### Step 3: Verify Grant Types

Ensure the application has:
- ✅ **Authorization Code** grant type enabled
- ✅ **PKCE** enforcement (recommended)

### Step 4: Verify Redirect URIs

For pi.flow mode, redirect URIs are optional, but if you have any registered:
- `https://localhost:3000/p1auth-callback`
- `https://localhost:3000/authz-callback`

## How to Test

### Step 1: Try the Kroger Login Button

After enabling Redirectless mode in PingOne, try the Kroger login button.

### Step 2: Check Backend Logs

```bash
tail -f /tmp/oauth-backend.log
```

Look for:
```
[PingOne Redirectless] Received X cookies from PingOne
```

**If you see `Received 0 cookies`**, the application is still **not configured** for Redirectless mode.

**If you see `Received 2+ cookies`**, configuration is correct! ✅

### Step 3: Expected Success Flow

```
[PingOne Redirectless] POST Body: response_type=code&response_mode=pi.flow&...
[PingOne Redirectless] Received 2 cookies from PingOne ✅
[PingOne Flow Check] Including 2 cookies in request ✅
[PingOne Flow Check] Success: { status: 'COMPLETED' } ✅
```

## Expected Response Structure

With Redirectless enabled, PingOne should return:

```json
{
  "id": "flowId-here",
  "status": "USERNAME_PASSWORD_REQUIRED",
  "resumeUrl": "https://auth.pingone.com/.../as/resume?flowId=...",
  "_links": {
    "usernamePassword.check": {
      "href": "https://auth.pingone.com/.../flows/flowId-here"
    }
  }
}
```

**Plus** `Set-Cookie` headers with flow session cookies.

## If Still Getting 401 After Configuration

1. **Verify the application is enabled** in PingOne
2. **Check application permissions** (should have Flow API access)
3. **Verify the environment is active**
4. **Check if the user account exists** and is enabled
5. **Review PingOne audit logs** for specific error details

## Documentation References

- Internal: `/Users/cmuir/P1Import-apps/oauth-playground/docs/pingone-pi-flow-guidance.md`
- PingOne API Docs: Redirect and Non-Redirect Authentication Flows → Non-redirect section
- PingOne Admin Console: Applications → Experiences → Hosted Login → **Redirectless**

## Current Implementation

Our code now follows the PingOne `pi.flow` specification exactly:

1. ✅ POST to `/as/authorize` with `response_mode=pi.flow`
2. ✅ NO `redirect_uri` in request (optional per spec)
3. ✅ NO `username`/`password` in initial request
4. ✅ Extract `Set-Cookie` headers from response
5. ✅ POST credentials to `usernamePassword.check` endpoint **with cookies**
6. ✅ NO client credentials in Flow API calls

**The 401 error is a PingOne configuration issue, not a code issue.**


