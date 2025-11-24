# Setup Page Updated with Unified Callback URIs

## Change: Updated Configuration/Setup Page

Updated both the redirect URI service and the setup page catalog to show the new `unified-callback` URI for all V8U flows.

## Files Updated

### 1. src/v8/services/redirectUriServiceV8.ts
Updated V8U flows to use `unified-callback`:
- `oauth-authz-v8u` → `unified-callback`
- `implicit-v8u` → `unified-callback`
- `hybrid-v8u` → `unified-callback`

### 2. src/utils/flowRedirectUriMapping.ts
Updated V8U flows in the catalog:
- `oauth-authz-v8u` → `unified-callback`
- `implicit-v8u` → `unified-callback`
- `hybrid-v8u` → `unified-callback`

### 3. src/App.tsx
Added new route:
- `<Route path="/unified-callback" element={<CallbackHandlerV8U />} />`

## What Users See

### In the Configuration/Setup Page (`/configuration`)

The redirect URI catalog now shows:

```
Flow: oauth-authz-v8u
Description: V8U Authorization Code Flow
Redirect URI: http://localhost:3000/unified-callback
Logout URI: http://localhost:3000/callback/logout
Specification: RFC 6749, Section 4.1

Flow: implicit-v8u
Description: V8U Implicit Flow
Redirect URI: http://localhost:3000/unified-callback
Logout URI: http://localhost:3000/callback/logout
Specification: RFC 6749, Section 4.2

Flow: hybrid-v8u
Description: V8U Hybrid Flow
Redirect URI: http://localhost:3000/unified-callback
Logout URI: http://localhost:3000/callback/logout
Specification: OIDC Core 1.0, Section 3.3
```

### In the Credentials Form

When users click "View all redirect URIs in Setup page", they are taken to:
```
/configuration#redirect-uri-catalog-implicit-v8u
```

And they see the unified callback URI for their flow.

## Benefits

### Consistency
- ✅ All V8U flows show the same callback URI
- ✅ Setup page matches actual runtime behavior
- ✅ No confusion about which URI to use

### Accuracy
- ✅ Setup page shows correct URIs
- ✅ Copy button copies the right URI
- ✅ Documentation matches implementation

### User Experience
- ✅ Users can easily find the correct URI
- ✅ One URI to configure for all V8U flows
- ✅ Clear separation from V7/V8 flows

## Before vs After

### Before:
```
oauth-authz-v8u  → http://localhost:3000/authz-callback
implicit-v8u     → http://localhost:3000/implicit-callback  ❌ Wrong!
hybrid-v8u       → http://localhost:3000/hybrid-callback    ❌ Wrong!
```

### After:
```
oauth-authz-v8u  → http://localhost:3000/unified-callback  ✅
implicit-v8u     → http://localhost:3000/unified-callback  ✅
hybrid-v8u       → http://localhost:3000/unified-callback  ✅
```

## PingOne Configuration

Users should now configure their PingOne application with:

### Redirect URIs:
```
http://localhost:3000/unified-callback
```

### Post Logout Redirect URIs:
```
http://localhost:3000/callback/logout
```

## Testing

To verify the setup page is correct:

1. Go to `/configuration`
2. Scroll to "PingOne Redirect & Logout URIs" section
3. Find the V8U flows:
   - `oauth-authz-v8u`
   - `implicit-v8u`
   - `hybrid-v8u`
4. **Verify all show:** `http://localhost:3000/unified-callback`
5. Click the copy button to copy the URI
6. Paste in PingOne application configuration

## Link from Credentials Form

When users are in the Unified V8U flow and click "View all redirect URIs in Setup page":

1. They are taken to `/configuration#redirect-uri-catalog-{flowType}`
2. The page scrolls to their specific flow
3. They see the correct `unified-callback` URI
4. They can copy it directly to PingOne

## Backward Compatibility

### V7 Flows
- ✅ Still show their original callback paths
- ✅ No changes to V7 configuration
- ✅ Continue to work as before

### V8 Flows
- ✅ Still show their original callback paths
- ✅ No changes to V8 configuration
- ✅ Continue to work as before

### V8U Flows
- ✅ Now show `unified-callback`
- ✅ Consistent across all V8U flows
- ✅ Matches actual runtime behavior

## Summary

Updated both the redirect URI service and the setup page catalog to show `unified-callback` for all V8U flows. Users now see the correct URI in the configuration page, can copy it easily, and configure their PingOne applications correctly. The setup page now accurately reflects the actual runtime behavior of the V8U flows.
