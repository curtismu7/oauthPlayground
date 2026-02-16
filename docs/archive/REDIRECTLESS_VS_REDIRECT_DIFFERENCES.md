# Redirectless vs Redirect Mode - Code Differences

This document explains the key differences between **redirectless** and **redirect** authentication modes in the OAuth Playground codebase.

## Overview

**Redirect Mode (Standard OAuth):**
- User is redirected to PingOne's login page
- PingOne redirects back to your callback URL with authorization code/tokens
- Browser handles the redirect flow
- Uses URL query parameters or fragments for response

**Redirectless Mode (`response_mode=pi.flow`):**
- No browser redirects - all communication via API calls
- PingOne returns JSON responses directly
- Application handles authentication in the background
- Uses POST requests to Flow API endpoints

---

## 1. Authorization URL Generation

### Redirect Mode
**Location:** `src/v8u/services/unifiedFlowIntegrationV8U.ts`

```typescript
// Standard redirect mode - just generates a URL
const params = new URLSearchParams({
    client_id: credentials.clientId,
    response_type: 'code',
    redirect_uri: credentials.redirectUri,
    scope: credentials.scopes || 'openid profile email',
    state: prefixedState,
    // NO response_mode parameter (uses default redirect)
});
```

**What happens:**
1. Generates authorization URL (e.g., `https://auth.pingone.com/.../as/authorize?client_id=...`)
2. User clicks URL → browser redirects to PingOne
3. User authenticates on PingOne's login page
4. PingOne redirects back to callback URL with `?code=AUTHORIZATION_CODE&state=...`

### Redirectless Mode
**Location:** `src/v8u/services/unifiedFlowIntegrationV8U.ts` and `src/v8u/components/UnifiedFlowSteps.tsx`

```typescript
// Redirectless mode - adds response_mode=pi.flow to URL
const params = new URLSearchParams({
    client_id: credentials.clientId,
    response_type: 'code',
    redirect_uri: credentials.redirectUri,
    scope: credentials.scopes || 'openid profile email',
    state: prefixedState,
    response_mode: 'pi.flow',  // ← KEY DIFFERENCE
});
```

**What happens:**
1. Still generates authorization URL (but with `response_mode=pi.flow`)
2. **BUT** - Instead of opening the URL, makes POST request to `/api/pingone/redirectless/authorize`
3. PingOne returns JSON flow object with status `USERNAME_PASSWORD_REQUIRED`
4. Shows login modal (no redirect to PingOne UI)
5. User enters credentials in your app's modal
6. Sends credentials to PingOne Flow API

**Key Code:** `src/v8u/components/UnifiedFlowSteps.tsx:2174-2245`

```typescript
if (credentials.useRedirectless) {
    // POST request instead of redirect
    const authorizeResponse = await fetch('/api/pingone/redirectless/authorize', {
        method: 'POST',
        body: JSON.stringify(authorizeRequestBody),
    });
    
    const flowData = await authorizeResponse.json();
    // PingOne returns: { id: 'flow-id', status: 'USERNAME_PASSWORD_REQUIRED' }
    
    if (flowStatus === 'USERNAME_PASSWORD_REQUIRED') {
        // Show login modal (not PingOne's login page)
        setShowRedirectlessModal(true);
    }
}
```

---

## 2. Authentication Flow

### Redirect Mode

**Steps:**
1. Generate authorization URL
2. User clicks "Authenticate on PingOne" button
3. Browser redirects to PingOne login page
4. User enters username/password on **PingOne's page**
5. PingOne redirects back to callback URL: `https://localhost:3000/unified-callback?code=...`
6. `CallbackHandlerV8U` component parses the callback URL
7. Extracts authorization code from query parameters

**Key Code:** `src/v8u/components/CallbackHandlerV8U.tsx`

```typescript
// Parse redirect callback URL
const code = searchParams.get('code');
const state = searchParams.get('state');

// Store in sessionStorage for flow to retrieve
sessionStorage.setItem('v8u_callback_data', JSON.stringify({
    code,
    state,
    fullUrl: window.location.href,
}));

// Redirect back to flow
navigate(`/v8u/unified/${flowType}/${step}`);
```

### Redirectless Mode

**Steps:**
1. Generate authorization URL (with `response_mode=pi.flow`)
2. **POST** to `/api/pingone/redirectless/authorize` (no redirect)
3. PingOne returns flow object: `{ id: 'flow-id', status: 'USERNAME_PASSWORD_REQUIRED' }`
4. **Show login modal** in your app (not PingOne's page)
5. User enters username/password in **your modal**
6. **POST** credentials to `/api/pingone/flows/check-username-password`
7. PingOne returns: `{ status: 'READY_TO_RESUME', resumeUrl: '...' }`
8. **POST** to resume URL to get authorization code
9. Exchange code for tokens

**Key Code:** `src/v8u/components/UnifiedFlowSteps.tsx:2081-2090`

```typescript
// Submit credentials via API (not redirect)
const credentialsResponse = await fetch('/api/pingone/flows/check-username-password', {
    method: 'POST',
    body: JSON.stringify({
        flowUrl: flowApiUrl,
        username,
        password,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
    }),
});

const credentialsData = await credentialsResponse.json();
// Returns: { status: 'READY_TO_RESUME', resumeUrl: '...' }
```

---

## 3. Response Parsing

### Redirect Mode

**Location:** `src/v8u/components/UnifiedFlowSteps.tsx:1146-1374`

```typescript
// Parse callback URL from browser redirect
useEffect(() => {
    const callbackDataStr = sessionStorage.getItem('v8u_callback_data');
    const callbackData = JSON.parse(callbackDataStr);
    
    // Parse authorization code from callback URL
    const parsed = UnifiedFlowIntegrationV8U.parseCallbackUrl(
        callbackData.fullUrl,  // URL from browser redirect
        flowState.state || ''
    );
    
    // Extract code from URL query string: ?code=AUTHORIZATION_CODE
    setFlowState(prev => ({
        ...prev,
        authorizationCode: parsed.code,  // From URL
    }));
}, []);
```

**What it does:**
- Reads callback URL from `window.location.href` or sessionStorage
- Parses query parameters: `?code=ABC123&state=XYZ`
- Extracts authorization code from URL

### Redirectless Mode

**Location:** `src/v8u/components/UnifiedFlowSteps.tsx:1900-1969`

```typescript
// Resume flow via API call (not URL parsing)
const resumeResponse = await fetch('/api/pingone/resume', {
    method: 'POST',
    body: JSON.stringify({
        resumeUrl,
        flowId,
        codeVerifier: codeVerifier,
    }),
});

const resumeData = await resumeResponse.json();
// PingOne returns JSON: { code: 'AUTHORIZATION_CODE' }

const authCode = resumeData.code;  // From JSON response (not URL)

setFlowState(prev => ({
    ...prev,
    authorizationCode: authCode,  // From API response
}));
```

**What it does:**
- Makes POST request to resume URL
- Receives JSON response: `{ code: "AUTHORIZATION_CODE" }`
- Extracts authorization code from JSON (not URL)

---

## 4. UI Differences

### Redirect Mode
- Shows authorization URL
- "Authenticate on PingOne" button → opens PingOne login page
- User authenticates on **PingOne's UI**
- Redirects back to callback handler
- Parses callback URL

**Visual Flow:**
```
Your App → [Generate URL] → [Click Button] → PingOne Login Page → [Enter Credentials] → Callback URL
```

### Redirectless Mode
- Shows authorization URL (but doesn't use it for redirect)
- Makes POST request when generating URL
- Shows **your app's login modal** (`RedirectlessLoginModal`)
- User authenticates in **your modal** (stays in your app)
- No redirects - all API calls

**Visual Flow:**
```
Your App → [Generate URL] → [POST Request] → [Show Modal] → [Enter Credentials in Modal] → [POST to Resume] → [Get Code]
```

**Key Code:** `src/v8u/components/UnifiedFlowSteps.tsx:6631-6644`

```typescript
{/* Redirectless Login Modal */}
<RedirectlessLoginModal
    isOpen={showRedirectlessModal}
    onClose={() => setShowRedirectlessModal(false)}
    onLogin={handleSubmitRedirectlessCredentials}  // Your handler
    title="PingOne Redirectless Authentication"
/>
```

---

## 5. Code Location Summary

### Redirect Mode
- **URL Generation:** `src/v8u/services/unifiedFlowIntegrationV8U.ts:280-334`
- **Callback Parsing:** `src/v8u/components/UnifiedFlowSteps.tsx:1146-1374`
- **Callback Handler:** `src/v8u/components/CallbackHandlerV8U.tsx`
- **Token Exchange:** Normal token endpoint call

### Redirectless Mode
- **URL Generation:** `src/v8u/services/unifiedFlowIntegrationV8U.ts:329-333` (adds `response_mode=pi.flow`)
- **Authorization Request:** `src/v8u/components/UnifiedFlowSteps.tsx:2174-2245` (POST instead of redirect)
- **Credentials Submission:** `src/v8u/components/UnifiedFlowSteps.tsx:2081-2090` (POST to Flow API)
- **Flow Resume:** `src/v8u/components/UnifiedFlowSteps.tsx:1892-1969` (POST to resume URL)
- **Login Modal:** `src/v8u/components/UnifiedFlowSteps.tsx:6631-6644` (`RedirectlessLoginModal`)
- **Token Exchange:** Normal token endpoint call (same as redirect)

---

## 6. Key Configuration

**Redirect Mode:**
- `useRedirectless: false` or undefined
- No `response_mode` parameter (uses default)
- Authorization URL is opened in browser

**Redirectless Mode:**
- `useRedirectless: true` (saved in credentials)
- `response_mode=pi.flow` in authorization URL
- Authorization URL is used for POST request, not browser redirect

**Key Code:** `src/v8u/components/CredentialsFormV8U.tsx:2036-2051`

```typescript
<input
    type="checkbox"
    checked={useRedirectless}
    onChange={(e) => {
        handleChange('useRedirectless', e.target.checked);
    }}
/>
```

---

## Summary

| Aspect | Redirect Mode | Redirectless Mode |
|--------|--------------|-------------------|
| **Authorization URL** | Generated, opened in browser | Generated, but used for POST request |
| **Login UI** | PingOne's login page | Your app's modal |
| **Response Format** | URL query parameters (`?code=...`) | JSON API responses |
| **Parsing** | Parse callback URL | Parse JSON response |
| **User Flow** | Redirects between apps | Stays in your app |
| **Code Location** | Callback handler component | UnifiedFlowSteps component |
| **Request Method** | GET (browser redirect) | POST (API calls) |
| **Response Mode** | Default (redirect) | `pi.flow` |

The main difference is: **Redirect mode uses browser redirects**, while **Redirectless mode uses API calls with JSON responses**.

