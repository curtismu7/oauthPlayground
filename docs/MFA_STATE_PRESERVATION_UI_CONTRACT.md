# MFA Flow State Preservation UI Contract

**Last Updated:** 2025-12-30  
**Version:** 7.8.0  
**Status:** ✅ IMPLEMENTED

---

## Overview

This document defines the UI contract for state preservation during PingOne authentication redirects in MFA user registration flows. This mechanism ensures users can seamlessly resume their device registration flow after completing OAuth authentication.

---

## Scope

**Applies To:**
- ✅ SMS User Registration Flow
- ✅ Email User Registration Flow
- ✅ WhatsApp User Registration Flow
- ❌ Admin Flows (worker token flows do not require PingOne authentication)
- ❌ TOTP and FIDO2 Flows (these flows do not require PingOne authentication for user flows)

---

## User Experience Requirements

### Before PingOne Authentication Redirect

1. **User is on an MFA flow page** (e.g., `/v8/mfa/register/email/device`)
2. **User clicks "Start Authentication"** to begin PingOne OAuth flow
3. **Current page path is stored** before redirect occurs

### During PingOne Authentication

1. **User is redirected** to PingOne authorization endpoint
2. **User authenticates** with PingOne credentials
3. **PingOne redirects back** to `/user-mfa-login-callback` with OAuth callback parameters

### After PingOne Authentication Redirect

1. **OAuth callback handler processes** the authorization code and exchanges it for tokens
2. **User is redirected back** to the exact page they were on before authentication (e.g., `/v8/mfa/register/email/device?step=1`)
3. **Flow state is restored** and auto-advancement occurs if appropriate
4. **User continues seamlessly** from where they left off

**Critical Requirement:** Users must return to the **exact step/page they were on**, NOT the MFA Hub.

---

## Technical Implementation

### Storage Keys

The following `sessionStorage` keys are used for state preservation:

#### `user_login_return_to_mfa`
- **Type:** String (plain text, not JSON)
- **Stored By:** `UserLoginModalV8` component
- **Value:** Full path including query parameters (e.g., `/v8/mfa/register/email/device?step=1`)
- **When:** Before redirecting to PingOne authorization endpoint
- **Cleaned Up:** By `CallbackHandlerV8U` after redirect

**Example:**
```typescript
sessionStorage.setItem('user_login_return_to_mfa', '/v8/mfa/register/email/device?step=1');
```

#### `mfa_oauth_callback_return`
- **Type:** String (literal `'true'`)
- **Stored By:** `CallbackHandlerV8U` component
- **Value:** `'true'`
- **When:** After OAuth callback is processed, before redirecting back to MFA flow
- **Purpose:** Signals to `MFAFlowBaseV8` that state restoration should occur
- **Cleaned Up:** By `MFAFlowBaseV8` after state restoration

**Example:**
```typescript
sessionStorage.setItem('mfa_oauth_callback_return', 'true');
```

---

## Flow Sequence

### 1. Pre-Authentication (UserLoginModalV8)

**Location:** `src/v8/components/UserLoginModalV8.tsx`

**When:** User clicks "Start Authentication" button and the current path starts with `/v8/mfa`

**Action:**
```typescript
if (currentPath.startsWith('/v8/mfa')) {
  const fullPath = `${currentPath}${currentSearch}`; // Includes query params
  sessionStorage.setItem('user_login_return_to_mfa', fullPath);
  // Redirect to PingOne authorization endpoint
}
```

**Requirements:**
- Must store the full path including query parameters
- Path must start with `/v8/mfa` (validation)
- Must store as plain string (not JSON)

---

### 2. OAuth Callback Processing (CallbackHandlerV8U)

**Location:** `src/v8u/components/CallbackHandlerV8U.tsx`

**When:** OAuth callback is received at `/user-mfa-login-callback`

**Action:**
```typescript
const returnToMfaFlow = sessionStorage.getItem('user_login_return_to_mfa');
if (returnToMfaFlow) {
  // Validate path
  if (!mfaPath.startsWith('/v8/mfa')) {
    throw new Error('Invalid return path');
  }
  
  // Set marker for state restoration
  sessionStorage.setItem('mfa_oauth_callback_return', 'true');
  
  // Preserve callback parameters in URL
  const callbackParams = new URLSearchParams(window.location.search);
  const redirectUrl = callbackParams.toString()
    ? `${mfaPath}?${callbackParams.toString()}`
    : mfaPath;
  
  // Clean up return path
  sessionStorage.removeItem('user_login_return_to_mfa');
  
  // Redirect
  window.location.replace(redirectUrl);
}
```

**Requirements:**
- Must validate that return path starts with `/v8/mfa`
- Must preserve OAuth callback parameters (`code`, `state`, etc.) in the redirect URL
- Must set `mfa_oauth_callback_return` marker before redirect
- Must clean up `user_login_return_to_mfa` after use
- Must use `window.location.replace()` for reliable redirect (not `navigate()`)

---

### 3. State Restoration (MFAFlowBaseV8)

**Location:** `src/v8/flows/shared/MFAFlowBaseV8.tsx`

**When:** Component detects `mfa_oauth_callback_return` marker and user token is present

**Action:**
```typescript
const isOAuthCallbackReturn = sessionStorage.getItem('mfa_oauth_callback_return') === 'true';

if (isOAuthCallbackReturn && credentials.userToken?.trim() && nav.currentStep === 0) {
  // Clean up marker
  sessionStorage.removeItem('mfa_oauth_callback_return');
  
  // Validate step 0 and auto-advance if valid
  setTimeout(() => {
    if (validateStep0(credentials, tokenStatus, nav)) {
      nav.goToNext();
    }
  }, 500);
}
```

**Requirements:**
- Must check for `mfa_oauth_callback_return` marker
- Must verify user token is present
- Must validate current step before auto-advancing
- Must clean up `mfa_oauth_callback_return` marker after use
- Must use `setTimeout` to defer state updates (avoid React render-phase warnings)

---

## User Token Handling and 'oauth_completed' Placeholder

### Overview

When OAuth authentication succeeds in user flows, the application stores a placeholder value `'oauth_completed'` in `credentials.userToken` to indicate successful authentication. This placeholder is used instead of the actual user access token because:

1. **The actual user token is not needed** - The application only needs to confirm that OAuth authentication was successful
2. **Device registration requires worker token** - All device registration API calls use worker tokens regardless of flow type (user or admin)
3. **Simplified token management** - Avoids storing and managing user access tokens that aren't used

### Implementation Details

**Location:** `src/v8/services/mfaServiceV8.ts`

#### Token Retrieval Logic

The `MFAServiceV8.getToken()` method handles token selection:

```typescript
static async getToken(credentials?: { tokenType?: 'worker' | 'user'; userToken?: string }): Promise<string> {
  const tokenType = credentials?.tokenType || 'worker';
  
  if (tokenType === 'user') {
    const userToken = credentials?.userToken?.trim();
    if (!userToken || userToken === 'oauth_completed') {
      // For user flows with 'oauth_completed' placeholder, use worker token
      // The placeholder indicates successful user authentication, but device
      // registration requires a worker token with proper API permissions
      return await MFAServiceV8.getWorkerToken();
    }
    // If a real user token is provided, use it
    return userToken;
  }
  
  // Default to worker token
  return await MFAServiceV8.getWorkerToken();
}
```

#### Scope Validation

Scope validation is skipped when `userToken === 'oauth_completed'`:

```typescript
// Validate user token has required scope for device registration
// Skip validation if userToken is 'oauth_completed' placeholder (we'll use worker token instead)
if (paramsWithToken.tokenType === 'user' && paramsWithToken.userToken && paramsWithToken.userToken !== 'oauth_completed') {
  const tokenScopes = MFAServiceV8.getTokenScopes(paramsWithToken.userToken);
  if (!tokenScopes.includes('p1:create:device')) {
    throw new Error('User token is missing required scope...');
  }
}
```

### Token Flow Behavior

| Flow Type | tokenType | userToken Value | Token Used for Device Registration | Scope Validation |
|-----------|-----------|-----------------|------------------------------------|------------------|
| Admin Flow | `'worker'` | (not used) | Worker Token | N/A |
| User Flow (OAuth Completed) | `'user'` | `'oauth_completed'` | **Worker Token** | Skipped |
| User Flow (Real Token) | `'user'` | `<actual JWT token>` | User Token | Validated |

### Key Points

1. **All device registration operations use worker tokens** - Even in user flows, device registration requires a worker token with proper API permissions (`p1:create:device` scope)

2. **The 'oauth_completed' placeholder**:
   - Stored in `credentials.userToken` after successful OAuth authentication
   - Indicates successful user authentication without storing the actual token
   - Accepted by validation logic (`!!credentials.userToken?.trim()` returns `true`)
   - Triggers fallback to worker token in `MFAServiceV8.getToken()`

3. **Benefits**:
   - Avoids misleading "missing scope" errors
   - Simplifies token management
   - Ensures proper API permissions for device registration
   - Maintains user flow semantics (tokenType remains 'user')

### Applies To All OTP Flows

This behavior applies to all MFA OTP flows that use user authentication:
- ✅ SMS User Registration Flow
- ✅ Email User Registration Flow
- ✅ WhatsApp User Registration Flow
- ✅ TOTP User Registration Flow (if OAuth is implemented)
- ✅ FIDO2 User Registration Flow (if OAuth is implemented)

All flows use the shared `MFAServiceV8.getToken()` method, so they automatically benefit from this behavior.

---

## Route Requirements

### OAuth Callback Route

**Route:** `/user-mfa-login-callback`

**Component:** `CallbackHandlerV8U`

**Location:** `src/App.tsx`

**Critical:** This route must exist and be properly configured. If this route is missing, users will see an "App Not Found" modal after PingOne authentication.

---

## Validation Rules

### Return Path Validation

The return path stored in `user_login_return_to_mfa` must:
1. Start with `/v8/mfa` (enforced by `CallbackHandlerV8U`)
2. Be a valid MFA flow route (e.g., `/v8/mfa/register/email/device`)
3. Include query parameters if they were present (e.g., `?step=1`)

**Invalid paths will throw an error and redirect to MFA Hub as fallback.**

---

## Error Handling

### Missing Return Path

**Scenario:** OAuth callback is received but `user_login_return_to_mfa` is not found

**Behavior:** 
- User remains on `/user-mfa-login-callback` or is redirected to MFA Hub
- No state restoration occurs
- User must manually navigate back to the flow

### Invalid Return Path

**Scenario:** Return path does not start with `/v8/mfa`

**Behavior:**
- Error is logged
- User is redirected to MFA Hub as fallback
- No state restoration occurs

### State Restoration Failure

**Scenario:** Marker is present but validation fails or token is missing

**Behavior:**
- User remains on current step (typically Step 0)
- Marker is cleaned up
- User can manually proceed using "Next Step" button

---

## Testing Checklist

- [x] Return path is stored before PingOne redirect
- [x] Return path includes query parameters
- [x] OAuth callback redirects to correct page
- [x] Callback parameters are preserved in redirect URL
- [x] State restoration marker is set correctly
- [x] Flow auto-advances after state restoration
- [x] Invalid return paths are handled gracefully
- [x] Missing return paths are handled gracefully
- [x] Users return to exact step (not MFA Hub)

---

## Related Documentation

- `docs/EMAIL_REGISTRATION_UI_FLOW.md` - Email flow documentation with state preservation details
- `docs/SMS_REGISTER_FLOW_ANALYSIS.md` - SMS flow analysis with state preservation details
- `docs/MFA_CALLBACK_ROUTES_CRITICAL.md` - Critical documentation for OAuth callback routes

---

## Implementation Files

**Components:**
- `src/v8/components/UserLoginModalV8.tsx` - Stores return path before redirect
- `src/v8u/components/CallbackHandlerV8U.tsx` - Processes OAuth callback and redirects
- `src/v8/flows/shared/MFAFlowBaseV8.tsx` - Detects marker and restores state

**Routes:**
- `src/App.tsx` - Defines `/user-mfa-login-callback` route

---

## Version History

- **v7.8.0** (2025-12-30): Added documentation for 'oauth_completed' placeholder behavior and worker token fallback for device registration
- **v7.7.2** (2025-02-05): Documented state preservation mechanism after implementation
- **v7.7.1**: Initial implementation of state preservation for user flows

---

## Notes

- State preservation uses `sessionStorage` (not `localStorage`) because it should only persist for the current browser session
- Return paths are stored as plain strings (not JSON) for simplicity and reliability
- The marker-based approach (`mfa_oauth_callback_return`) is used to signal state restoration without relying on URL parameters that might conflict with OAuth callback parameters
- **Important:** The `'oauth_completed'` placeholder in `userToken` is intentional and triggers worker token usage for device registration operations. This prevents misleading "missing scope" errors while ensuring proper API permissions.

