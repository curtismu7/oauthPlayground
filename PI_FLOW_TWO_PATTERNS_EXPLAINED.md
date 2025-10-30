# PingOne pi.flow - Two Valid Patterns Explained

**Date**: October 29, 2025  
**Status**: ✅ Pattern B Now Implemented

---

## 🎯 Key Discovery from DaVinci Document

The DaVinci document revealed that PingOne `pi.flow` returns session tokens **IN THE JSON RESPONSE**, not as `Set-Cookie` headers:

```json
{
  "interactionId": "03c4417b-dc08-4508-bb8f-373f1fe22b73",
  "interactionToken": "c621dd5a0b40aeb304b502580e51baa2b5c8a501..."
}
```

These must be sent as cookies in subsequent requests:
```
Cookie: interactionId=...; interactionToken=...
```

---

## 📊 Two Valid Patterns for pi.flow

### 🔵 Pattern A: Flow API / DaVinci (Multi-Step)

**Use Case**: Complex flows with multiple steps (MFA, progressive profiling, DaVinci orchestration)

**Flow**:
```
1. POST /as/authorize (NO credentials)
   → Returns: { interactionId, interactionToken, _links }

2. Set cookies: interactionId + interactionToken

3. POST /flows/{flowId} or /davinci/... (WITH credentials)
   → Continue through flow steps

4. GET /as/resume?flowId={flowId}
   → Returns: authorization code

5. POST /as/token (code + client creds)
   → Returns: tokens
```

**Characteristics**:
- ✅ Supports multi-step authentication
- ✅ Allows custom UI for each step
- ✅ Works with DaVinci orchestration
- ⚠️ Requires extracting interactionId/interactionToken from JSON
- ⚠️ Requires manually setting cookies for subsequent requests
- ⚠️ More complex implementation

---

### 🟢 Pattern B: Direct Auth (Single-Step) ← **WE USE THIS**

**Use Case**: Simple username/password authentication

**Flow**:
```
1. POST /as/authorize (WITH credentials)
   → Returns: { resumeUrl }

2. Call resumeUrl
   → Returns: authorization code

3. POST /as/token (code + client creds)
   → Returns: tokens
```

**Characteristics**:
- ✅ Simple 3-step process
- ✅ No cookies needed
- ✅ Works through backend proxy
- ✅ No manual cookie management
- ✅ Matches RedirectlessFlowV7_Real.tsx
- ❌ Single-step only (no MFA or progressive auth)

---

## ✅ What We Implemented

### Backend Changes (`server.js`)

**Before** (Pattern A attempt):
```javascript
// NOTE: For pi.flow mode, do NOT send username/password in initial request
// REMOVED: username/password from initial request
// if (username) authParams.set('username', username);
// if (password) authParams.set('password', password);
```

**After** (Pattern B):
```javascript
// PATTERN B: Include username/password in initial request for single-step auth
if (username) authParams.set('username', username);
if (password) authParams.set('password', password);
```

### Frontend (`PingOneAuthentication.tsx`)

Updated `runRedirectlessLogin` to:
1. Send credentials in initial `/api/pingone/redirectless/authorize`
2. Call `/api/pingone/resume` with the returned `resumeUrl`
3. Navigate to result page with tokens

---

## 🔍 Why Pattern A Was Failing

1. **Backend wasn't sending credentials** in initial request
2. **PingOne returned flow object** with `USERNAME_PASSWORD_REQUIRED`
3. **No cookies were returned** (because Pattern B doesn't use Set-Cookie headers)
4. **Flow API call failed with 401** because:
   - Pattern A needs `interactionId`/`interactionToken` from JSON
   - We were looking for `Set-Cookie` headers (wrong!)
   - We were calling Flow API without proper session tokens

---

## 📋 Pattern Comparison

| Feature | Pattern A (Flow API) | Pattern B (Direct Auth) |
|---------|---------------------|------------------------|
| **Username/Password** | Sent to Flow API (step 2) | Sent in initial request (step 1) |
| **Session Mechanism** | `interactionId` + `interactionToken` | None needed |
| **Cookies** | Manual (from JSON → Cookie header) | None |
| **Multi-Step Support** | ✅ Yes | ❌ No |
| **DaVinci Support** | ✅ Yes | ❌ No |
| **Simplicity** | Complex | Simple |
| **Backend Proxy Friendly** | ⚠️ Harder | ✅ Easy |

---

## 🎯 Key Insights

1. **Pattern B is correct for simple username/password flows**
   - This is what `RedirectlessFlowV7_Real.tsx` uses
   - This is what the user wanted

2. **No PingOne configuration needed**
   - No "Redirectless mode" setting exists
   - Just use `response_mode=pi.flow`

3. **Cookies are pattern-specific**
   - Pattern A: `interactionId`/`interactionToken` in JSON response
   - Pattern B: No cookies needed
   - Set-Cookie headers: Only for browser-based flows

4. **Two approaches, two use cases**
   - Pattern A: Complex orchestration (DaVinci, MFA)
   - Pattern B: Simple authentication (username/password)

---

## ✅ Current Status

- ✅ Backend updated to use Pattern B
- ✅ Frontend updated to call `resumeUrl`
- ✅ Username/password sent in initial request
- ✅ Following RedirectlessFlowV7 pattern
- ✅ No cookie management needed

---

## 📖 References

- **DaVinci Document**: `/Users/cmuir/P1Import-apps/oauth-playground/HOW+TO_+Ping+-+Using+Davinci+with+pi.flow+for+non-web+flows.doc`
- **Working Implementation**: `/Users/cmuir/P1Import-apps/oauth-playground/src/pages/flows/RedirectlessFlowV7_Real.tsx`
- **PingOne API Docs**: https://apidocs.pingidentity.com/pingone/auth/v1/api/#redirect-and-non-redirect-authentication-flows
- **Internal Docs**: `/Users/cmuir/P1Import-apps/oauth-playground/docs/pingone-pi-flow-guidance.md`

---

## 🚀 Next Steps

Try the HEB login button now! It should:

1. ✅ Send credentials in initial request
2. ✅ Get back `resumeUrl` (no 401 error!)
3. ✅ Call resume endpoint
4. ✅ Get authorization code
5. ✅ Exchange for tokens
6. ✅ Success!

**The 401 INVALID_TOKEN error should be gone because we're now using Pattern B correctly.**


