# Corrected PingOne pi.flow Analysis

**Date**: October 29, 2025  
**Status**: Investigating actual root cause

---

## ❌ Previous Incorrect Assumption

**I WAS WRONG**: There is **NO "Redirectless mode" setting** in PingOne Admin Console.

Simply including `response_mode=pi.flow` in the authorization request is sufficient. PingOne knows what to do.

---

## ✅ What We Know Is Correct

1. **No special PingOne configuration needed** - Just use `response_mode=pi.flow`
2. **We ARE getting a valid response from PingOne** with:
   - `status: "USERNAME_PASSWORD_REQUIRED"`
   - `flowId` in the response
   - `_links.usernamePassword.check.href` with the Flow API endpoint

3. **The issue**: 401 INVALID_TOKEN when calling the Flow API

---

## 🔍 Actual Problem: WHY 401 INVALID_TOKEN?

###Current Observations:

1. **No cookies received**: `"_cookies": []`
2. **401 Error**: `code: "INVALID_TOKEN"`, message: "The authorization token is either missing or invalid"

### Possible Causes:

#### Theory 1: Cookies might not be needed for backend proxy flows?
- **Question**: Are cookies only for browser-based flows?
- **Question**: Is the `flowId` in the URL supposed to be sufficient authentication?

#### Theory 2: Maybe we need to include client credentials in Flow API?
- Currently we're NOT sending `client_id` or `client_secret` to Flow API
- Maybe that's wrong?

#### Theory 3: Maybe we're calling the Flow API incorrectly?
- Wrong endpoint format?
- Missing required parameters?
- Wrong HTTP method?

#### Theory 4: Application configuration issue?
- Maybe the application needs specific grant types?
- Maybe specific scopes are required?

---

## 📋 Current Implementation

### Step 1: Initial Authorization (✅ WORKING)

**Request**:
```http
POST /as/authorize
Content-Type: application/x-www-form-urlencoded

response_type=code
&response_mode=pi.flow
&client_id=bdb78dcc-d530-4144-90c7-c7537a55128a
&scope=openid
&state=pi-flow-{timestamp}
&code_challenge={PKCE_challenge}
&code_challenge_method=S256
```

**Response** (✅ SUCCESS):
```json
{
  "id": "006cbe1c-29bb-4088-9ef2-e257e57b8475",
  "status": "USERNAME_PASSWORD_REQUIRED",
  "resumeUrl": "https://auth.pingone.com/.../as/resume?flowId=...",
  "_links": {
    "usernamePassword.check": {
      "href": "https://auth.pingone.com/.../flows/006cbe1c-29bb-4088-9ef2-e257e57b8475"
    }
  }
}
```

**Note**: No Set-Cookie headers received, but maybe that's normal for backend proxy?

---

### Step 2: Username/Password Check (❌ FAILING)

**Request**:
```http
POST /flows/006cbe1c-29bb-4088-9ef2-e257e57b8475
Content-Type: application/x-www-form-urlencoded

username=curtis7
&password=Wolverine7%26
```

**Response** (❌ 401 UNAUTHORIZED):
```json
{
  "code": "ACCESS_FAILED",
  "details": [
    {
      "code": "INVALID_TOKEN",
      "target": "Authentication Credentials",
      "message": "The authorization token is either missing or invalid, or it has expired."
    }
  ]
}
```

---

## ❓ Questions To Investigate

1. **Should we include `client_id` and `client_secret` in the Flow API request?**
   - Currently: NOT sending them
   - Assumption was: flowId in URL is sufficient
   - Maybe wrong?

2. **Should we include `state` parameter in Flow API?**
   - Currently: NOT sending it
   - Maybe required?

3. **Is the Flow API endpoint format correct?**
   - We're using: `https://auth.pingone.com/{envId}/flows/{flowId}`
   - Should it be: `https://auth.pingone.com/{envId}/flows/{flowId}/usernamePassword.check`?
   
4. **Are cookies actually required for backend proxy flows?**
   - Maybe cookies are only for browser-based pi.flow?
   - Maybe backend flows use different authentication?

5. **Do we need a different type of token?**
   - Worker token?
   - Access token from initial authorize?

---

## 🧪 Next Steps

1. Try including `client_id` and `client_secret` in Flow API body
2. Try using the exact URL from `_links.usernamePassword.check.href`
3. Check if we need to append `.check` or similar to the flow URL
4. Research if backend proxy flows require different authentication
5. Check PingOne application configuration for required settings

---

## 📖 References

- PingOne Response Mode Docs: https://docs.pingidentity.com/pingone/applications/p1_response_mode_values.html
- PingOne Auth API: https://apidocs.pingidentity.com/pingone/auth/v1/api/

**USER FEEDBACK**: "There is no way to turn on redirectless in pingone. Just sending in pi.flow and pingone knows what to do."

✅ **CONFIRMED**: User is correct. No special PingOne configuration needed.


