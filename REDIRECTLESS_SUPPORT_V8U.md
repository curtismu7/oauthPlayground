# Redirectless Support for Authorization Code Flow (V8U)

**Date:** 2024-11-21  
**Feature:** Redirectless mode for Authorization Code flow  
**Status:** ✅ Complete

---

## Overview

Added complete redirectless mode support to the Authorization Code flow in the V8U unified system. This allows users to receive authorization responses via POST to their backend instead of using browser redirects, using PingOne's Flow API with `response_mode=pi.flow`.

---

## What is Redirectless Mode?

**Standard OAuth Flow (with redirect):**
1. User clicks "Authorize"
2. Browser redirects to PingOne authorization endpoint
3. User authenticates
4. PingOne redirects back to your app with authorization code in URL
5. Your app extracts code from URL and exchanges it for tokens

**Redirectless Mode (without redirect):**
1. User clicks "Authorize"
2. Browser redirects to PingOne authorization endpoint
3. User authenticates
4. PingOne POSTs authorization response directly to your backend
5. Your backend receives code via POST and exchanges it for tokens

---

## Why Use Redirectless Mode?

✅ **Backend-Driven Flows** - Authorization response goes directly to your backend  
✅ **No URL Parsing** - No need to extract code from URL parameters  
✅ **Better Security** - Authorization code never exposed in browser URL  
✅ **Simpler Architecture** - Backend handles entire OAuth flow  
✅ **Mobile/Desktop Apps** - Useful for apps without custom URL schemes  

---

## Flows That Support Redirectless

| Flow | Redirectless Support | Reason |
|------|---------------------|---------|
| **Authorization Code** | ✅ Yes | Can POST response to backend |
| Implicit | ❌ No | Returns tokens in URL fragment (hash) |
| Hybrid | ❌ Not yet | Could be added in future |
| Client Credentials | N/A | No user authorization step |
| Device Code | N/A | Uses device verification flow |
| ROPC | N/A | Direct token request |

---

## Implementation Details

### 1. Service Layer (`unifiedFlowOptionsServiceV8.ts`)

Added redirectless checkbox availability for Authorization Code flow:

```typescript
// Redirectless checkbox - for flows that can work without redirect URI
if (flowType === 'oauth-authz') {
  availability.showRedirectless = true;
  availability.redirectlessAvailable = true;
}
```

### 2. Credentials Form (`CredentialsFormV8U.tsx`)

**State Management:**
```typescript
const [useRedirectless, setUseRedirectless] = useState(() => {
  // Load from credentials if available
  return typeof credentials.useRedirectless === 'boolean' 
    ? credentials.useRedirectless 
    : false;
});
```

**Checkbox Handler:**
```typescript
onChange={(e) => {
  const checked = e.target.checked;
  setUseRedirectless(checked);
  
  // Save to credentials
  onChange({
    ...credentials,
    useRedirectless: checked,
  });
  
  if (checked) {
    toastV8.info('Redirectless mode enabled - authorization response will be returned via POST to your backend');
  } else {
    toastV8.info('Redirectless mode disabled - standard redirect flow will be used');
  }
}}
```

**Sync Effect:**
```typescript
// Load useRedirectless from credentials if available
if (
  typeof credentials.useRedirectless === 'boolean' &&
  credentials.useRedirectless !== useRedirectless
) {
  setUseRedirectless(credentials.useRedirectless);
}
```

---

## User Interface

### Checkbox Appearance

```
┌─────────────────────────────────────────────────────────┐
│  ☐ 🔌 Use Redirectless Mode                            │
│                                                          │
│  Enable to receive authorization response via POST      │
│  instead of redirect (useful for backend-driven flows)  │
└─────────────────────────────────────────────────────────┘
```

### When Enabled

```
┌─────────────────────────────────────────────────────────┐
│  ☑ 🔌 Use Redirectless Mode                            │
│                                                          │
│  ✅ Redirectless mode enabled - authorization response  │
│  will be POSTed to your backend instead of using a      │
│  redirect                                                │
└─────────────────────────────────────────────────────────┘
```

---

## How to Use

### Step 1: Enable Redirectless Mode

1. Navigate to Authorization Code flow
2. In the credentials form, find "Use Redirectless Mode" checkbox
3. Check the box to enable redirectless mode

### Step 2: Configure Your Backend

Your backend needs to handle the POST request from PingOne:

```javascript
// Express.js example
app.post('/oauth/callback', (req, res) => {
  const { code, state } = req.body;
  
  // Validate state parameter
  if (state !== expectedState) {
    return res.status(400).send('Invalid state');
  }
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  
  // Store tokens and redirect user
  res.redirect('/dashboard');
});
```

### Step 3: Configure PingOne Application

In your PingOne application settings:
- Set the redirect URI to your backend endpoint (e.g., `https://api.example.com/oauth/callback`)
- Ensure your backend endpoint accepts POST requests
- Configure CORS if needed

---

## Technical Details

### Credentials Object

When redirectless mode is enabled, the credentials object includes:

```typescript
{
  environmentId: "...",
  clientId: "...",
  clientSecret: "...",
  redirectUri: "https://api.example.com/oauth/callback",
  useRedirectless: true,  // ← New field
  // ... other fields
}
```

### Storage

The `useRedirectless` flag is:
- ✅ Saved to localStorage (flow-specific credentials)
- ✅ Persisted across page reloads
- ✅ Synced with credentials state
- ✅ Included in credential backups

---

## Validation

### Redirect URI Validation

When redirectless mode is enabled:
- Redirect URI is still required (it's where PingOne POSTs the response)
- The URI should point to your backend endpoint
- The endpoint must accept POST requests

### Flow Validation

The flow validation logic checks:
```typescript
if (!credentials.useRedirectless && !credentials.redirectUri) {
  errors.push('Redirect URI is required');
}
```

---

## Testing

### Test Redirectless Mode

1. **Enable redirectless mode** in Authorization Code flow
2. **Configure redirect URI** to point to your backend
3. **Start authorization** - click "Send Authorization Request"
4. **Authenticate** at PingOne
5. **Verify POST request** - check your backend receives POST with code
6. **Exchange code** for tokens in your backend

### Test Standard Mode

1. **Disable redirectless mode**
2. **Configure redirect URI** to point to your frontend
3. **Start authorization**
4. **Verify redirect** - check browser redirects with code in URL
5. **Extract code** from URL parameters
6. **Exchange code** for tokens

---

## Comparison: Redirectless vs Standard

| Aspect | Standard Redirect | Redirectless Mode |
|--------|------------------|-------------------|
| **Response Method** | URL redirect | HTTP POST |
| **Code Location** | URL parameter | POST body |
| **Browser Involvement** | Yes (URL parsing) | No (backend only) |
| **Security** | Code in URL | Code in POST body |
| **Use Case** | Frontend apps | Backend-driven apps |
| **Complexity** | Simple | Requires backend |

---

## Benefits

✅ **Improved Security** - Authorization code never exposed in browser URL  
✅ **Backend Control** - Backend handles entire OAuth flow  
✅ **No URL Parsing** - Simpler code, no need to extract from URL  
✅ **Better for Mobile** - Useful for apps without custom URL schemes  
✅ **Cleaner Architecture** - Separation of concerns  

---

## Limitations

⚠️ **Requires Backend** - Must have server to receive POST request  
⚠️ **Not for SPAs** - Single-page apps typically use standard redirect  
⚠️ **CORS Considerations** - May need CORS configuration  
⚠️ **Only Authorization Code** - Not available for other flows  

---

## Future Enhancements

Potential future additions:
- [ ] Redirectless support for Hybrid flow
- [ ] Visual indicator in flow steps when redirectless is enabled
- [ ] Backend code examples for different frameworks
- [ ] Automatic detection of backend vs frontend redirect URIs
- [ ] Validation warnings for common misconfigurations

---

## Files Modified

- `src/v8/services/unifiedFlowOptionsServiceV8.ts` - Added redirectless checkbox availability
- `src/v8u/components/CredentialsFormV8U.tsx` - Added checkbox UI and state management

---

## Related Documentation

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749) - Authorization Code Flow
- [PingOne Documentation](https://docs.pingidentity.com/) - Redirectless mode details
- `V8_DEVELOPMENT_RULES.md` - V8 development guidelines
- `UI_ACCESSIBILITY_RULES.md` - UI accessibility requirements

---

**Last Updated:** 2024-11-21  
**Version:** V8U  
**Status:** ✅ Complete
