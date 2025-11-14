# Device Authorization 401 Error - Unsupported Authentication Method

## Error
```
POST https://auth.pingone.com/.../as/device_authorization 401 (Unauthorized)
Request denied: Unsupported authentication method
```

## Root Cause
Your PingOne application is not configured with the correct **Token Endpoint Authentication Method** for Device Authorization flows.

## Fix in PingOne Admin Console

### Step 1: Find Your Application
1. Log in to **PingOne Admin Console**
2. Go to **Connections** → **Applications**
3. Find the application you're using for Device Authorization
   - Environment ID: `b9817c16-9910-4415-b67e-4ac687da74d9`
   - Client ID: (the one you entered in the flow)

### Step 2: Configure Authentication Method
1. Click on the application to open settings
2. Go to the **Configuration** tab
3. Scroll to **Token Endpoint Authentication Method** section
4. Select one of the following:

   **Option 1: None (Public Client)** ✅ **RECOMMENDED for Device Flows**
   - Best for device authorization flows
   - No client secret required
   - Most secure for public clients

   **Option 2: client_secret_post**
   - Client secret sent in POST body
   - Requires client secret in your application

   **Option 3: client_secret_basic**
   - Client secret sent in Authorization header
   - Requires client secret in your application

### Step 3: Enable Grant Types
While in the application settings, also verify:

1. **Grant Types** section:
   - ✅ **Device Authorization** (urn:ietf:params:oauth:grant-type:device_code)

2. **Response Types** section:
   - ✅ **Token** (for OAuth)

### Step 4: Save and Test
1. Click **Save** at the bottom
2. Wait 30-60 seconds for changes to propagate
3. Go back to the Device Authorization Flow
4. Click "Reset Flow" to clear any cached state
5. Try "Request Device Code" again

## Verification Checklist

Your PingOne application should have:

```
✅ Application Type: OIDC Web App or Native App
✅ Grant Types: Device Authorization (urn:ietf:params:oauth:grant-type:device_code)
✅ Token Endpoint Auth Method: None (recommended) or client_secret_post
✅ Response Types: Token
```

## If Still Getting 401

### Check Client ID
Make sure the Client ID in the flow matches your PingOne application:

**In Browser Console (F12):**
```javascript
// Check what client ID is being used
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
console.log("Client ID being used:", creds.clientId);
```

### Check Environment ID
Verify the Environment ID is correct:
- Expected: `b9817c16-9910-4415-b67e-4ac687da74d9`
- Actual: (check in your flow credentials)

### Backend Logs
Check your backend server logs (`node server.js` terminal) for more details on the request being sent to PingOne.

## Common Mistakes

❌ **Wrong**: Using an application configured for "Worker" apps
✅ **Correct**: Using an application configured for "OIDC Web App" or "Native App"

❌ **Wrong**: Token Endpoint Auth Method set to "client_secret_basic" without providing client secret
✅ **Correct**: Token Endpoint Auth Method set to "None" for public clients

❌ **Wrong**: Missing "Device Authorization" grant type
✅ **Correct**: Device Authorization grant type enabled

## Why "None" is Recommended

Device Authorization flows are designed for **public clients** (devices that can't securely store secrets):
- Smart TVs
- IoT devices  
- CLI tools
- Gaming consoles

These devices **cannot** securely store a client secret, so they use:
- **Public client flow** (no secret)
- **PKCE** (Proof Key for Code Exchange) for security
- **User verification** on a secondary device

## After Fixing

Once configured correctly, you should see:
1. ✅ Device code request succeeds (200 OK)
2. ✅ Response includes `device_code`, `user_code`, `verification_uri`
3. ✅ QR code and verification instructions display
4. ✅ Polling begins automatically

## Need More Help?

If still having issues, verify:
1. Correct Environment ID
2. Correct Client ID
3. Application is enabled in PingOne
4. Application has Device Authorization grant type
5. Token Endpoint Auth Method is set to "None" or matches your configuration

