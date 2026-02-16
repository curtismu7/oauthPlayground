# CRITICAL: MFA Callback Routes - DO NOT REMOVE

## ⚠️ WARNING: These routes are ESSENTIAL for MFA user flows. Removing them will break user authentication in MFA flows.

## Required Routes in `src/App.tsx`

Both of these routes MUST exist in the `<Routes>` section:

```tsx
{/* CRITICAL: MFA user login callback route - DO NOT REMOVE - Used by MFA flows for user authentication */}
<Route path="/user-login-callback" element={<CallbackHandlerV8U />} />
{/* CRITICAL: MFA-specific user login callback route - DO NOT REMOVE - Used by MFA flows for user authentication */}
<Route path="/user-mfa-login-callback" element={<CallbackHandlerV8U />} />
```

## Why Two Routes?

1. **`/user-login-callback`**: Generic user login callback used across the application
2. **`/user-mfa-login-callback`**: MFA-specific callback route that provides explicit routing for MFA flows

Both routes are handled by `CallbackHandlerV8U.tsx` which checks for both paths.

## What Happens If These Routes Are Missing?

- Users will see "App Not Found" modal when returning from PingOne authentication
- MFA user flows will be completely broken
- Users cannot complete device registration or authentication flows that require user tokens

## Handler Implementation

The `CallbackHandlerV8U.tsx` component checks for both routes:

```tsx
const isUserLoginCallback = currentPath === '/user-login-callback' || 
    currentPath.includes('user-login-callback') ||
    currentPath === '/user-mfa-login-callback' ||
    currentPath.includes('user-mfa-login-callback');
```

## Protection Measures

1. **Explicit Comments**: Both routes have CRITICAL comments warning against removal
2. **Documentation**: This file serves as a reference
3. **Handler Logic**: The callback handler explicitly checks for both routes

## Testing

To verify these routes work:
1. Navigate to any MFA registration flow (SMS, Email, WhatsApp)
2. Select "User Flow"
3. Click "Register Device" (this will trigger PingOne login)
4. Complete PingOne authentication
5. You should be redirected back to the MFA flow, NOT see "App Not Found"

## Last Updated

2025-01-XX - Routes added and documented to prevent regressions
