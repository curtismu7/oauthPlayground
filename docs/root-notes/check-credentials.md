# 🔍 Checking 401 Unauthorized Error

## What's Happening
PingOne is rejecting your client credentials with an `INVALID_TOKEN` error. This means the client ID or client secret being sent doesn't match what's configured in PingOne.

## Step 1: Check Browser Console Logs

Look for these diagnostic logs in your browser console (should be right above the 401 error):

```
🔍 [Pre-Send Diagnostic] Full credential analysis: {
  configState: {
    clientId: "bdb78dcc...",
    clientIdLength: 36,
    clientSecretLength: 64,        <-- Check this!
    hasClientSecret: true/false,   <-- Should be true!
    tokenEndpointAuthMethod: "...",
    pkceEnforcement: "..."
  },
  toSend: { ... },
  comparison: {
    clientIdMatch: true/false,
    clientSecretMatch: true/false,
    usingDefaultClientId: false,   <-- Should be false!
    usingDefaultClientSecret: false <-- Should be false!
  }
}
```

**KEY CHECKS:**
- ✅ `clientSecretLength` should be 64
- ✅ `hasClientSecret` should be `true`
- ✅ `usingDefaultClientSecret` should be `false`
- ✅ `clientIdMatch` should be `true`
- ✅ `clientSecretMatch` should be `true`

## Step 2: Verify Credentials Match PingOne

### In Browser Console:
```javascript
const flowKey = 'pingone-authentication';
const stored = window.comprehensiveFlowDataService?.loadFlowCredentialsIsolated?.(flowKey);
console.log('Stored Client ID:', stored?.clientId);
console.log('Stored Client Secret (first 8 chars):', stored?.clientSecret?.substring(0, 8));
console.log('Stored Client Secret Length:', stored?.clientSecret?.length);
```

### In PingOne Admin Console:
1. Go to **Applications** → [Your App] → **Configuration**
2. Check:
   - **Client ID** - Copy it
   - **Client Secret** - Reveal and copy it
   - **Application Type** - Should be **Worker** for Flow API
   - **Token Endpoint Authentication** - Should match what you selected

## Step 3: Re-enter Credentials

If they don't match:

1. **Clear everything:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Fill in the form** on the PingOne Authentication page with:
   - Environment ID (from PingOne)
   - Client ID (from PingOne - copy/paste, don't type)
   - Client Secret (from PingOne - copy/paste, don't type)
   - Token Endpoint Auth Method (should match PingOne app)

3. **Refresh the page** to verify they're saved:
   ```javascript
   const flowKey = 'pingone-authentication';
   const creds = comprehensiveFlowDataService.loadFlowCredentialsIsolated(flowKey);
   console.log('After refresh:', {
     hasClientId: !!creds.clientId,
     hasClientSecret: !!creds.clientSecret,
     clientSecretLength: creds.clientSecret?.length
   });
   ```

## Step 4: Verify PingOne Application Type

For the **Flow API** (`/flows/check-username-password`), you need a **WORKER application**, not a Web app.

### Check in PingOne:
1. Applications → [Your App] → **Configuration**
2. **Application Type** should be **Worker**
3. **Grant Types** should include `client_credentials`
4. **Token Endpoint Authentication Method** should be:
   - `client_secret_basic` (most common)
   - OR `client_secret_post`

If it's a **Web App** or **Single Page App**, create a new **Worker app** for this flow.

## Step 5: Check Application Permissions

Worker apps need permissions to call the Flow API:

1. PingOne Admin Console → **Applications** → [Your Worker App]
2. Go to **Resources** or **API Access** tab
3. Ensure it has access to:
   - **PingOne API**
   - **PingOne Platform API** (if required)
4. Check **Scopes** include necessary permissions

## Common Issues

### Issue 1: Using Web App Credentials
**Problem:** You're using credentials from a Web App instead of a Worker app.
**Solution:** Create a Worker app in PingOne for Flow API access.

### Issue 2: Client Secret Not Saved
**Problem:** The UI shows dots, but the actual value is empty.
**Solution:** Re-enter the client secret and verify it's saved.

### Issue 3: Wrong Authentication Method
**Problem:** PingOne expects `client_secret_basic` but you selected `client_secret_post`.
**Solution:** Match the method in the dropdown to PingOne configuration.

### Issue 4: Application Disabled
**Problem:** The application is disabled in PingOne.
**Solution:** Enable it in PingOne Admin Console.

## Test with cURL

To verify credentials work outside the app:

```bash
# Replace with your actual values
CLIENT_ID="your-client-id"
CLIENT_SECRET="your-client-secret"
ENV_ID="your-environment-id"

# Test Basic Auth (most common)
curl -X POST "https://api.pingone.com/v1/environments/$ENV_ID/users?limit=1" \
  -H "Authorization: Basic $(echo -n "$CLIENT_ID:$CLIENT_SECRET" | base64)" \
  -H "Content-Type: application/json"
```

If this returns 401, the credentials are wrong in PingOne.
If this returns 200 or data, the credentials work but there's an app issue.

## Next Steps

Send me:
1. **Console log output** from "Pre-Send Diagnostic"
2. **Application Type** from PingOne (Worker, Web, SPA, Native?)
3. **Token Endpoint Auth Method** from PingOne Admin Console
4. **Result of credential check** (from Step 2 above)

This will help me pinpoint exactly why PingOne is rejecting the credentials!
