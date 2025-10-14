# Advanced Parameters - Token Verification Guide

## How to Verify Parameters Are Working

### Test 1: Audience Parameter
**Setup:**
1. Go to Advanced OAuth Parameters
2. Set `Audience` to: `https://api.pingone.com`
3. Click "Save Advanced Parameters"
4. Go to OAuth Authorization Code flow
5. Generate Authorization URL
6. Check URL includes: `?audience=https://api.pingone.com`
7. Complete the flow and get tokens

**Verify:**
- Decode the **access token** (use UnifiedTokenDisplayService "Decode" button)
- Look for `aud` claim:
  ```json
  {
    "aud": "https://api.pingone.com"
  }
  ```

**Expected Result:** ✅ `aud` claim should match your audience value

---

### Test 2: Resource Parameters (RFC 8707)
**Setup:**
1. Go to Advanced OAuth Parameters
2. Add resources:
   - `https://api1.example.com`
   - `https://api2.example.com`
3. Click "Save Advanced Parameters"
4. Generate Authorization URL
5. Check URL includes: `?resource=https://api1.example.com&resource=https://api2.example.com`
6. Complete the flow and get tokens

**Verify:**
- Decode the **access token**
- Look for `aud` claim (may be array):
  ```json
  {
    "aud": ["https://api1.example.com", "https://api2.example.com"]
  }
  ```
- OR check `scope` claim for resource-specific scopes

**Expected Result:** ⚠️ May or may not work - depends on PingOne support for RFC 8707

---

### Test 3: Prompt Parameter (Auth Flow Behavior)
**Setup:**
1. Go to Advanced OAuth Parameters
2. Set `Prompt` to: `login` and `consent`
3. Click "Save Advanced Parameters"
4. Generate Authorization URL
5. Check URL includes: `?prompt=login consent`

**Observe:**
- When you redirect to PingOne:
  - **`login`** = Forces you to re-authenticate even if already logged in
  - **`consent`** = Shows consent screen even if you already consented

**Verify:**
- Prompt parameter **DOES NOT appear in token**
- It only affects the authentication experience

**Expected Result:** ✅ You should see different auth behavior (re-login, consent screen)

---

### Test 4: OIDC Claims Request
**Setup:**
1. Go to Advanced OIDC Parameters (OIDC flow)
2. Use Claims Request Builder to add:
   - `email` (essential)
   - `name` (voluntary)
   - `phone_number` (voluntary)
3. Click "Save Advanced Parameters"
4. Generate Authorization URL
5. Check URL includes: `?claims={"id_token":{"email":{"essential":true}...}}`
6. Complete the flow and get tokens

**Verify:**
- Decode the **ID token**
- Look for requested claims:
  ```json
  {
    "sub": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "phone_number": "+1234567890"
  }
  ```

**Expected Result:** ✅ Requested claims should appear in ID token (if user has them)

---

### Test 5: OIDC Display Parameter
**Setup:**
1. Go to Advanced OIDC Parameters
2. Set `Display` to: `popup`
3. Click "Save Advanced Parameters"
4. Generate Authorization URL
5. Check URL includes: `?display=popup`

**Observe:**
- When you redirect to PingOne:
  - Authorization page may render differently (optimized for popup)

**Verify:**
- Display parameter **DOES NOT appear in token**
- It only affects the UI presentation

**Expected Result:** ⚠️ May be ignored by PingOne - visual change is subtle or none

---

## What to Check in Console

When you generate the authorization URL, you should see:

```javascript
[OAuth AuthZ V6] Loading saved advanced parameters: {
  audience: "https://api.pingone.com",
  resources: ["https://api1.example.com", "https://api2.example.com"],
  promptValues: ["login", "consent"]
}

[OAuth AuthZ V6] Updating flow config with advanced parameters: {...}

🔧 [useAuthorizationCodeFlowController] Added audience parameter: https://api.pingone.com
🔧 [useAuthorizationCodeFlowController] Added resource parameters: ["https://api1.example.com", "https://api2.example.com"]
🔧 [useAuthorizationCodeFlowController] Added prompt parameter: login consent

🔧 [useAuthorizationCodeFlowController] ===== FINAL AUTHORIZATION URL =====
🔧 [useAuthorizationCodeFlowController] Generated URL: https://auth.pingone.com/.../authorize?...&audience=...&resource=...&prompt=...
```

---

## Common Issues

### Issue 1: Parameters in URL but Not in Token
**Cause:** PingOne doesn't support the parameter or requires specific configuration

**Solution:**
- Check PingOne application configuration
- Verify the parameter is supported by your PingOne environment
- Some parameters require specific application settings

### Issue 2: Audience Always Shows Client ID
**Cause:** PingOne may default `aud` to client_id if audience parameter is not supported

**Solution:**
- This is expected behavior for some OAuth servers
- The `audience` parameter is an extension, not core OAuth 2.0

### Issue 3: Resources Parameter Ignored
**Cause:** RFC 8707 is a newer spec, may not be enabled in PingOne

**Solution:**
- Check PingOne documentation for RFC 8707 support
- May need to enable "Resource Indicators" in PingOne settings
- Not all PingOne plans support this feature

### Issue 4: Claims Request Partially Honored
**Cause:** User doesn't have the requested claims, or claims require consent

**Solution:**
- Check UserInfo endpoint for additional claims
- Verify user profile has the requested attributes
- Some claims may require explicit user consent

---

## Quick Verification Checklist

After saving advanced parameters and completing a flow:

- [ ] Check authorization URL in console - params present?
- [ ] Decode access token - `aud` claim matches audience?
- [ ] Decode ID token (OIDC) - requested claims present?
- [ ] Check prompt behavior - did you see consent/login screens?
- [ ] Look at console logs - no errors about parameters?

---

## PingOne-Specific Notes

### Audience Parameter:
- ✅ Generally supported
- May need to configure "Allowed Audiences" in PingOne application settings

### Resource Parameters:
- ⚠️ Check if your PingOne plan supports RFC 8707
- May require "Resource Server" configuration in PingOne

### Claims Request:
- ✅ Core OIDC feature, should work
- Claims must exist in user profile
- Some claims may require specific scopes

### Prompt Parameter:
- ✅ Should work
- `login` forces re-authentication
- `consent` shows consent screen
- `none` fails if user not already authenticated

### Display Parameter:
- ⚠️ May be ignored
- PingOne may not adjust UI based on display parameter

---

## Summary

| Parameter | In Token? | Where to Check | PingOne Support |
|-----------|-----------|----------------|-----------------|
| **Audience** | ✅ Yes | `aud` claim in access token | ✅ Good |
| **Resources** | ✅ Yes | `aud` claim (array) or scope | ⚠️ Varies |
| **Prompt** | ❌ No | Auth flow behavior | ✅ Good |
| **Display** | ❌ No | UI presentation | ⚠️ Limited |
| **Claims** | ✅ Yes | ID token / UserInfo | ✅ Good |

**Key Takeaway:**
- Parameters are being **sent correctly** ✅
- Whether they **appear in tokens** depends on **PingOne's support** ⚠️
- Check console logs and decode tokens to verify
