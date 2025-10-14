# Fix: Unsupported Response Type - Implicit Flow

## Error
```
unsupported_response_type
Request failed: Unsupported response type: token
```

## Root Cause
Your PingOne application with client ID `4a275422-e580-4be6-84f2-3a624a849cbb` does **NOT** have the Implicit grant type enabled.

## Fix in PingOne Admin Console

### Step 1: Find Your Application
1. Log in to **PingOne Admin Console**
2. Go to **Connections** → **Applications**
3. Find the application with client ID: `4a275422-e580-4be6-84f2-3a624a849cbb`

### Step 2: Enable Implicit Grant Type
1. Click on the application to open settings
2. Go to the **Configuration** tab
3. Scroll to **Grant Types** section
4. ✅ **Enable "Implicit"** grant type

### Step 3: Configure Response Types
While in the application settings:

1. Find the **Response Types** section
2. Enable these response types:
   - ✅ **Token** (for OAuth 2.0 implicit flow)
   - ✅ **ID Token** (for OIDC implicit flow)
   - ✅ **ID Token Token** (for combined OIDC implicit flow)

### Step 4: Configure Redirect URIs
Make sure the **Redirect URIs** section includes:
```
https://localhost:3000/implicit-callback
```

⚠️ **Important**: 
- No trailing slash
- Must be HTTPS
- Must be exact match (including port)

### Step 5: Save Changes
Click **Save** at the bottom of the page.

## Configuration Checklist

Your PingOne application should have:

```
✅ Grant Types:
   ✅ Implicit

✅ Response Types:
   ✅ Token
   ✅ ID Token
   ✅ ID Token Token

✅ Redirect URIs:
   ✅ https://localhost:3000/implicit-callback

✅ Client Authentication:
   ✅ None (Implicit flow is public, no client secret)
```

## After Configuring in PingOne

1. Wait 30-60 seconds for changes to propagate
2. Go back to your Implicit Flow page
3. Click "Reset Flow" to clear any cached state
4. Try the flow again

## If Still Getting Error

Run this diagnostic in browser console to verify your request:

```javascript
// Check what response_type is being requested
const url = window.location.href;
console.log("Current URL:", url);

// Check your credentials
const creds = JSON.parse(localStorage.getItem('pingone_permanent_credentials') || '{}');
console.log("Client ID:", creds.clientId);
console.log("Expected: 4a275422-e580-4be6-84f2-3a624a849cbb");
console.log("Match:", creds.clientId === '4a275422-e580-4be6-84f2-3a624a849cbb' ? '✅' : '❌');
```

## Common PingOne Configuration Issues

### Issue 1: Wrong Application Type
If you created the application as:
- ❌ "Worker" → Won't support Implicit
- ❌ "Non-Interactive" → Won't support Implicit
- ✅ "OIDC Web App" or "Single Page App" → Supports Implicit

### Issue 2: Token Endpoint Authentication
For Implicit flow, set:
- **Token Endpoint Authentication Method**: None (or N/A)

### Issue 3: Multiple Environments
Make sure you're configuring the application in the **correct PingOne environment** that matches your Environment ID.

## Next Steps

1. ✅ Enable Implicit grant type in PingOne
2. ✅ Enable Token and ID Token response types
3. ✅ Add redirect URI: `https://localhost:3000/implicit-callback`
4. ✅ Save changes in PingOne
5. ✅ Wait 30-60 seconds
6. ✅ Try Implicit Flow again

## Need Help?

Check the PingOne application type:
- Should be: **OIDC Web App** or **Single Page App**
- Should NOT be: Worker, Non-Interactive, or Native

The Implicit grant type is **only available** for web/browser-based applications.

