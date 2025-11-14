# Kroger Redirectless Flow - Issues & Fixes Needed

## 🔍 Comparison Analysis

After comparing the Kroger redirectless implementation with the working PingOneAuthentication code, here are the critical issues:

---

## ❌ Issue 1: Missing Redirectless Flow Initiation

### Problem
The Kroger wrapper doesn't actually **initiate** the redirectless flow. It only handles the **resume** part.

### What's Missing
The Kroger app needs to call the `/api/pingone/redirectless/authorize` endpoint to start the flow, but it's not doing that.

### Current Code (Kroger)
```typescript
// Kroger only handles resume, not initiation
const handlePendingResume = async () => {
  const authCode = await RedirectlessAuthService.handlePendingResume({...});
  return authCode;
};
```

### Working Code (PingOneAuthentication)
```typescript
// Step 1: Start the authorization flow
const authorizeResponse = await fetch('/api/pingone/redirectless/authorize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    environmentId,
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    codeChallenge,
    codeChallengeMethod: 'S256',
    state,
  }),
});

const flowData = await authorizeResponse.json();
// Then handle the flow response...
```

---

## ❌ Issue 2: No Username/Password Authentication Step

### Problem
The Kroger app collects username/password but never sends them to PingOne for authentication.

### What's Missing
After starting the flow, you need to POST the credentials to the resume endpoint.

### Working Code (PingOneAuthentication)
```typescript
// Step 2: Authenticate with username/password
const authenticateResponse = await fetch('/api/pingone/resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    flowId,
    resumeUrl,
    username: credentials.username,
    password: credentials.password,
    _sessionId: activeSessionId, // Critical!
  }),
});
```

---

## ❌ Issue 3: Missing Session Management

### Problem
The Kroger app doesn't track the `_sessionId` which is required for the redirectless flow.

### What's Missing
PingOne returns a `_sessionId` in the first response, which must be included in all subsequent requests.

### Working Code (PingOneAuthentication)
```typescript
// Extract session ID from Step 1
const sessionIdFromStep1 = flowData._sessionId;
activeSessionId = sessionIdFromStep1 ?? activeSessionId;

// Use it in Step 2
body: JSON.stringify({
  flowId,
  resumeUrl,
  username,
  password,
  _sessionId: activeSessionId, // Must include this!
})
```

---

## ❌ Issue 4: Missing PKCE Generation

### Problem
The Kroger app doesn't generate PKCE codes for the redirectless flow.

### What's Missing
You need to generate `code_verifier` and `code_challenge` before starting the flow.

### Working Code (PingOneAuthentication)
```typescript
// Generate PKCE codes
const { generateCodeVerifier, generateCodeChallenge } = await import('../utils/oauth');
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

// Store code_verifier for token exchange
sessionStorage.setItem('code_verifier', codeVerifier);

// Send code_challenge in Step 1
body: JSON.stringify({
  // ...
  codeChallenge,
  codeChallengeMethod: 'S256',
})
```

---

## ❌ Issue 5: Missing Flow State Machine

### Problem
The Kroger app doesn't handle the multi-step flow state machine.

### What's Missing
The redirectless flow has multiple states:
1. `USERNAME_PASSWORD_REQUIRED` - Need to send credentials
2. `MFA_REQUIRED` - Need to handle MFA
3. `COMPLETED` - Extract authorization code

### Working Code (PingOneAuthentication)
```typescript
// Check flow status and handle accordingly
if (flowStatus === 'USERNAME_PASSWORD_REQUIRED') {
  // Send credentials
  await authenticateWithCredentials();
} else if (flowStatus === 'MFA_REQUIRED') {
  // Handle MFA
  await handleMfaChallenge();
} else if (flowStatus === 'COMPLETED') {
  // Extract code
  const code = flowData.authorizeResponse?.code;
}
```

---

## ✅ What Needs to Be Fixed in Kroger App

### Fix 1: Add Flow Initiation in KrogerLoginPopup

**File**: `src/components/KrogerLoginPopup.tsx`

The `handleSubmit` function should:
1. Generate PKCE codes
2. Call `/api/pingone/redirectless/authorize` to start the flow
3. Store the `flowId`, `resumeUrl`, and `_sessionId`
4. Send username/password to `/api/pingone/resume`
5. Handle the response and extract the authorization code

### Fix 2: Use RedirectlessAuthService Properly

**File**: `src/pages/flows/KrogerGroceryStoreMFAWrapper.tsx`

Instead of just calling `handlePendingResume`, the wrapper should:
1. Call `RedirectlessAuthService.startAuthorization()` when user logs in
2. Call `RedirectlessAuthService.handleSignOnPageRequired()` to send credentials
3. Call `RedirectlessAuthService.handlePendingResume()` to get the code
4. Or use `RedirectlessAuthService.completeFlow()` to do all steps

### Fix 3: Add Session ID Tracking

Both files need to:
1. Extract `_sessionId` from the first response
2. Include it in all subsequent requests
3. Store it in sessionStorage for persistence

### Fix 4: Add PKCE Code Generation

Before starting the flow:
```typescript
import { generateCodeVerifier, generateCodeChallenge } from '../utils/oauth';

const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

sessionStorage.setItem('code_verifier', codeVerifier);
sessionStorage.setItem(`${FLOW_KEY}_code_verifier`, codeVerifier);
```

---

## 📋 Implementation Checklist

### In KrogerLoginPopup.tsx

- [ ] Import `RedirectlessAuthService`
- [ ] Generate PKCE codes before starting flow
- [ ] Call `RedirectlessAuthService.completeFlow()` with username/password
- [ ] Handle the returned authorization code
- [ ] Store code in sessionStorage for wrapper to pick up

### In KrogerGroceryStoreMFAWrapper.tsx

- [ ] Check for authorization code from redirectless flow
- [ ] If code exists, call `handleCallback()` to exchange for tokens
- [ ] Remove the incomplete `handlePendingResume` logic
- [ ] Use the working `RedirectlessAuthService` methods

### In RedirectlessAuthService.ts (Already Exists!)

The service already has all the methods needed:
- ✅ `startAuthorization()` - Starts the flow
- ✅ `handleSignOnPageRequired()` - Sends credentials
- ✅ `handlePendingResume()` - Resumes and gets code
- ✅ `completeFlow()` - Does all steps in one call

---

## 🎯 Recommended Approach

### Option 1: Use RedirectlessAuthService.completeFlow() (Easiest)

In `KrogerLoginPopup.tsx`:

```typescript
import { RedirectlessAuthService } from '../services/redirectlessAuthService';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/oauth';

const handleSubmit = async () => {
  try {
    // Generate PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem('code_verifier', codeVerifier);
    
    // Complete the entire redirectless flow
    const authCode = await RedirectlessAuthService.completeFlow({
      credentials: {
        environmentId: config.environmentId,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri,
        scopes: 'openid profile email',
        username: username.trim(),
        password: password.trim(),
        codeChallenge,
        codeChallengeMethod: 'S256',
      },
      flowKey: 'kroger-grocery-store-mfa',
      onAuthCodeReceived: (code, state) => {
        sessionStorage.setItem('kroger-grocery-store-mfa_auth_code', code);
        sessionStorage.setItem('kroger-grocery-store-mfa_state', state);
      },
    });
    
    if (authCode) {
      // Success! Close popup and let wrapper handle token exchange
      onLogin({ username: username.trim(), password });
    }
  } catch (error) {
    // Handle error
    setError(error.message);
  }
};
```

### Option 2: Manual Step-by-Step (More Control)

If you need more control over each step, use the individual methods:

```typescript
// Step 1: Start flow
const flowResponse = await RedirectlessAuthService.startAuthorization({...});

// Step 2: Send credentials
await RedirectlessAuthService.handleSignOnPageRequired(flowResponse, {...});

// Step 3: Resume and get code
const authCode = await RedirectlessAuthService.handlePendingResume({...});
```

---

## 🔧 Quick Fix Summary

1. **In KrogerLoginPopup.tsx**:
   - Add PKCE generation
   - Call `RedirectlessAuthService.completeFlow()` with username/password
   - Store the returned auth code in sessionStorage

2. **In KrogerGroceryStoreMFAWrapper.tsx**:
   - The existing code that checks for auth code and calls `handleCallback()` should work
   - Just make sure the code is being stored correctly by the popup

3. **Test**:
   - Enter username/password in Kroger popup
   - Click Sign In
   - Should see redirectless flow complete
   - Should see token exchange succeed
   - Should see MFA options appear

---

## 📚 Reference

### Working Example
See `src/pages/PingOneAuthentication.tsx` lines 1150-1500 for the complete working implementation.

### Service Documentation
See `src/services/redirectlessAuthService.ts` for the service methods and their parameters.

### Flow Diagram
```
User enters credentials in Kroger popup
    ↓
Generate PKCE codes
    ↓
Call RedirectlessAuthService.completeFlow()
    ├─ Step 1: POST /api/pingone/redirectless/authorize
    │   └─ Returns: flowId, resumeUrl, _sessionId
    ├─ Step 2: POST /api/pingone/resume (with credentials)
    │   └─ Returns: updated flow status
    ├─ Step 3: POST /api/pingone/resume (final)
    │   └─ Returns: authorization code
    └─ Store code in sessionStorage
    ↓
Wrapper detects code in sessionStorage
    ↓
Wrapper calls handleCallback() to exchange code for tokens
    ↓
Tokens stored, user authenticated
    ↓
MFA flow can begin
```

---

## ⚠️ Critical Notes

1. **Session ID is Required**: The `_sessionId` from Step 1 must be included in all subsequent requests
2. **PKCE is Required**: Generate and store `code_verifier` before starting the flow
3. **Client Secret is Required**: The redirectless flow requires client_secret for authentication
4. **Credentials Must Match**: The credentials used in the flow must match what's configured in PingOne
5. **Backend Must Handle Cookies**: The backend API must manage PingOne session cookies server-side

---

## 🎯 Next Steps

1. Update `KrogerLoginPopup.tsx` to use `RedirectlessAuthService.completeFlow()`
2. Test the flow end-to-end
3. Check browser console for detailed logs
4. Verify token exchange succeeds
5. Verify MFA options appear after authentication
