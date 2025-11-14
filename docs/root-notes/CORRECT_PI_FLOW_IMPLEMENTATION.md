# ✅ Correct pi.flow Implementation for Authorization Code Flow

**Date**: October 29, 2025  
**Status**: Clarified - Following RedirectlessFlowV7 Pattern

---

## 🎯 User Clarification

> "With Authorization Code (with or without PKCE), credentials happen before the code is issued, on PingOne's login. The code exchange never includes username/password—only the code + client/PKCE credentials."

**This is 100% correct!** I was misunderstanding the flow.

---

## ✅ Correct Flow (Like RedirectlessFlowV7_Real.tsx)

### Step 1: Initial Authorization Request
**Include username/password in `/as/authorize`**

```javascript
const authRequestBody = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'openid profile email',
    state: stateValue,
    nonce: `nonce-${Date.now()}`,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    response_mode: 'pi.flow',
    username: username,  // ← USER AUTHENTICATES HERE
    password: password   // ← USER AUTHENTICATES HERE
});

const authResponse = await fetch(authEndpoint, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    },
    body: authRequestBody.toString()
});
```

**Response**:
```json
{
  "id": "flowId-here",
  "resumeUrl": "https://auth.pingone.com/.../as/resume?flowId=...",
  "status": "..."
}
```

**Note**: NO cookies needed because username/password were already provided!

---

### Step 2: Call resumeUrl to Get Authorization Code

```javascript
const resumeResponse = await fetch('/api/pingone/resume', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        resumeUrl: authData.resumeUrl,
        flowId: authData.id,
        flowState: stateValue,
        clientId: clientId,
        clientSecret: clientSecret
    })
});
```

**Response**:
```json
{
  "code": "authorization_code_here"
}
```

---

### Step 3: Exchange Code for Tokens
**NO username/password - just code + client credentials + PKCE!**

```javascript
const tokenResponse = await fetch('/api/token-exchange', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        grant_type: 'authorization_code',
        code: authorizationCode,
        code_verifier: codeVerifier,  // ← PKCE
        environment_id: environmentId,
        client_id: clientId,
        client_secret: clientSecret
    })
});
```

**Response**:
```json
{
  "access_token": "...",
  "id_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## ❌ What I Was Doing Wrong

I was trying to use the **Flow API** (`usernamePassword.check` endpoint) which is for:
- Multi-step authentication flows
- When you DON'T include credentials in the initial request
- When you need cookies for session state

But for `pi.flow` with username/password in the initial request:
- ✅ Include username/password in initial `/as/authorize`
- ✅ Call `resumeUrl` to get authorization code  
- ✅ Exchange code for tokens (NO username/password here!)

---

## 📋 Key Points

1. **Username/Password**: Only in initial `/as/authorize` request
2. **Authorization Code**: Obtained by calling `resumeUrl`
3. **Token Exchange**: Uses code + client credentials + PKCE (NO username/password!)
4. **Cookies**: NOT needed when username/password are in initial request
5. **Flow API**: NOT needed for this pattern

---

## 🔧 Fix for PingOneAuthentication.tsx

Replace the current redirectless login logic with the pattern from `RedirectlessFlowV7_Real.tsx`:

1. Send username/password in initial `/as/authorize` (already doing this via backend)
2. Call `/api/pingone/resume` with resumeUrl (NEW - this is what was missing)
3. Exchange code for tokens (already have this logic)

The backend already supports this pattern:
- `/api/pingone/redirectless/authorize` - Step 1 ✅
- `/api/pingone/resume` - Step 2 ✅  
- `/api/token-exchange` - Step 3 ✅

Just need to wire them together correctly in the frontend!

---

## 📖 Working Reference

See `/Users/cmuir/P1Import-apps/oauth-playground/src/pages/flows/RedirectlessFlowV7_Real.tsx`

Lines 430-540 show the complete working implementation.

---

## ✅ No PingOne Configuration Needed

**User was correct**: There's NO "Redirectless mode" setting in PingOne.

Just use `response_mode=pi.flow` and PingOne knows what to do!

The cookies issue was a red herring - cookies are only needed for Flow API multi-step flows, not for this single-step pattern with credentials in the initial request.


