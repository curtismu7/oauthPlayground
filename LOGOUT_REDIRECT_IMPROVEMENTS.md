# Logout Redirect Back to App - Implementation

## Overview

Improved the PingOne logout flow to automatically redirect users back to the application after logout, providing a seamless user experience.

## Changes Made

### 1. Updated LogoutCallback Component ✅

**File**: `src/components/LogoutCallback.tsx`

#### Auto-Close Popup Windows
When logout opens in a new tab, the callback page now:
- Detects if it's running in a popup window
- Automatically closes the popup after 2 seconds
- Shows a message: "This window will close automatically in 2 seconds..."
- Returns focus to the original application window

```typescript
// Check if this is a popup window (opened from another window)
const isPopup = window.opener && window.opener !== window;

// If this is a popup window, auto-close after 2 seconds
if (isPopup) {
  setTimeout(() => {
    logger.auth('LogoutCallback', 'Auto-closing popup window');
    window.close();
  }, 2000);
}
```

#### Conditional UI
- **Popup mode**: Shows auto-close message, no buttons needed
- **Same-tab mode**: Shows "Return to Login" button for manual navigation

### 2. Updated Logout Handler ✅

**File**: `src/pages/PingOneAuthenticationResult.tsx`

#### Changed Default Behavior
- **Before**: Always opened logout in new tab
- **After**: Uses same-tab by default (seamless redirect back)

```typescript
const handlePingOneLogout = async (openInNewTab = false) => {
  // Use same-tab by default so user is automatically redirected back to the app
  const logoutResult = await pingOneLogoutService.logout({
    environmentId,
    idToken: result.tokens.id_token as string,
    clientId: result.config.clientId as string,
    postLogoutRedirectUri,
    openIn: openInNewTab ? 'new-tab' : 'same-tab', // Default to same-tab
    clearClientStorage: true,
  });
};
```

#### Added Storage Clearing
- Now clears client storage during logout
- Ensures all session data is removed

## User Experience Flow

### Same-Tab Logout (Default) ✅

1. User clicks "PingOne Logout" button
2. Browser navigates to PingOne logout endpoint
3. PingOne terminates the session
4. PingOne redirects to `post_logout_redirect_uri` (e.g., `/p1auth-logout-callback`)
5. LogoutCallback page clears remaining session data
6. User sees "Logout Successful" message
7. User clicks "Return to Login" or navigates elsewhere

**Advantages:**
- ✅ Seamless experience
- ✅ No popup blockers
- ✅ Automatic redirect back to app
- ✅ User stays in same tab

### New-Tab Logout (Optional) ✅

1. User clicks logout (with new-tab option)
2. New tab opens with PingOne logout endpoint
3. PingOne terminates the session
4. PingOne redirects to `post_logout_redirect_uri` in the new tab
5. LogoutCallback page detects it's a popup
6. Shows "This window will close automatically in 2 seconds..."
7. Window auto-closes after 2 seconds
8. User returns to original tab

**Advantages:**
- ✅ Original page stays open
- ✅ Auto-closes popup
- ✅ No manual tab closing needed

## Configuration

### Post-Logout Redirect URI

The redirect URI is automatically configured:

```typescript
const postLogoutRedirectUri = useMemo(
  () => callbackUriService.getCallbackUri('p1authLogoutCallback'),
  []
);
// Returns: https://localhost:3000/p1auth-logout-callback
```

### PingOne Configuration Required

For this to work, the `post_logout_redirect_uri` must be registered in PingOne:

1. Go to PingOne Admin Console
2. Navigate to your Application
3. Add to "Sign Off URLs":
   - `https://localhost:3000/p1auth-logout-callback` (development)
   - `https://your-domain.com/p1auth-logout-callback` (production)

## Logout Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Same-Tab Logout Flow                      │
└─────────────────────────────────────────────────────────────┘

User clicks "Logout"
        │
        ▼
Navigate to PingOne /signoff endpoint
  ?id_token_hint={token}
  &post_logout_redirect_uri={callback}
        │
        ▼
PingOne terminates session
        │
        ▼
Redirect to /p1auth-logout-callback
        │
        ▼
LogoutCallback component
  - Clears session storage
  - Shows success message
  - Offers "Return to Login"
        │
        ▼
User back in app ✅


┌─────────────────────────────────────────────────────────────┐
│                    New-Tab Logout Flow                       │
└─────────────────────────────────────────────────────────────┘

User clicks "Logout" (new-tab)
        │
        ▼
Open new tab with PingOne /signoff
        │
        ├─────────────────┬─────────────────┐
        │                 │                 │
   Original Tab      New Tab Opens    PingOne Session
   (stays open)           │           Terminated
        │                 ▼                 │
        │      Redirect to callback        │
        │                 │                 │
        │                 ▼                 │
        │      LogoutCallback detects      │
        │      it's a popup window         │
        │                 │                 │
        │                 ▼                 │
        │      Shows "Auto-closing..."     │
        │                 │                 │
        │                 ▼                 │
        │      Wait 2 seconds              │
        │                 │                 │
        │                 ▼                 │
        │      window.close()              │
        │                 │                 │
        └─────────────────┴─────────────────┘
                          │
                          ▼
              User back in original tab ✅
```

## Testing Checklist

- [x] Same-tab logout redirects back to app
- [x] New-tab logout auto-closes popup
- [x] Session storage is cleared
- [x] Success message is shown
- [x] Popup blocker is handled
- [x] Return to Login button works
- [x] No TypeScript errors

## Benefits

### For Users:
- ✅ **Seamless experience** - Automatically redirected back to app
- ✅ **No manual tab closing** - Popups close automatically
- ✅ **Clear feedback** - Success messages and status updates
- ✅ **Flexible options** - Can use same-tab or new-tab

### For Developers:
- ✅ **Simple integration** - Just call `handlePingOneLogout()`
- ✅ **Proper cleanup** - Session storage automatically cleared
- ✅ **Good logging** - Easy to debug issues
- ✅ **Standards compliant** - Follows OIDC logout spec

## API Usage

### Basic Logout (Same-Tab)
```typescript
await handlePingOneLogout();
// User will be redirected and come back to app
```

### Logout in New Tab
```typescript
await handlePingOneLogout(true);
// Opens in new tab, auto-closes after logout
```

### Direct Service Usage
```typescript
import pingOneLogoutService from './services/pingOneLogoutService';

// Same-tab logout
await pingOneLogoutService.logout({
  environmentId: 'YOUR_ENV_ID',
  idToken: 'YOUR_ID_TOKEN',
  clientId: 'YOUR_CLIENT_ID',
  postLogoutRedirectUri: 'https://your-app.com/logout-callback',
  openIn: 'same-tab',
  clearClientStorage: true,
});

// New-tab logout
await pingOneLogoutService.logout({
  environmentId: 'YOUR_ENV_ID',
  idToken: 'YOUR_ID_TOKEN',
  clientId: 'YOUR_CLIENT_ID',
  postLogoutRedirectUri: 'https://your-app.com/logout-callback',
  openIn: 'new-tab',
  clearClientStorage: true,
});
```

## Files Modified

1. **src/components/LogoutCallback.tsx**
   - Added popup detection
   - Added auto-close functionality
   - Conditional UI based on popup vs same-tab

2. **src/pages/PingOneAuthenticationResult.tsx**
   - Changed default to same-tab logout
   - Added `openInNewTab` parameter
   - Added storage clearing
   - Improved error messages

## Conclusion

The logout flow now provides a seamless experience where users are automatically redirected back to the application after logout, with proper session cleanup and clear feedback. The popup auto-close feature ensures users don't have to manually close tabs, and the same-tab default provides the smoothest experience.
