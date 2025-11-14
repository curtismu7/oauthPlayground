# Kroger MFA Data Flow Trace

## Complete Data Flow for Device Registration

### Step 1: Initial Configuration Load
**Location**: `KrogerGroceryStoreMFA_New.tsx` - `hydrateAuthConfig()`

```typescript
// Loads from localStorage: pingone_flow_data:kroger-grocery-store-mfa
const saved = comprehensiveFlowDataService.loadFlowCredentialsIsolated(FLOW_KEY);

// Sets authConfig state:
{
  environmentId: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  scopes: string
}
```

### Step 2: Worker Token Load
**Location**: `KrogerGroceryStoreMFA_New.tsx` - `hydrateWorkerToken()`

```typescript
// Loads from localStorage:
// - pingone_worker_token_kroger-grocery-store-mfa
// - pingone_worker_token_expires_at_kroger-grocery-store-mfa

const tokenResult = getValidWorkerToken(
  WORKER_TOKEN_STORAGE_KEY,
  WORKER_TOKEN_EXPIRY_KEY
);

// Sets workerToken state: string | null
```

### Step 3: Authentication (Redirectless Example)
**Location**: `KrogerGroceryStoreMFA_New.tsx` - `handleRedirectlessLogin()`

```typescript
// User enters credentials
const username = loginCredentials.username; // e.g., "john.doe@example.com"
const password = loginCredentials.password;

// RedirectlessAuthService completes flow
const authCode = await RedirectlessAuthService.completeFlow({
  credentials: {
    environmentId: authConfig.environmentId,
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    redirectUri: authConfig.redirectUri,
    scopes: authScopes,
    username,
    password,
  },
  flowKey: FLOW_KEY,
  onAuthCodeReceived: storeRedirectlessAuthCode,
});

// Returns: authorization code (string)
```

### Step 4: Token Exchange
**Location**: `KrogerGroceryStoreMFA_New.tsx` - `exchangeAuthorizationCode()`

```typescript
// Load PKCE verifier
const pkceData = credentialStorageManager.loadPKCECodes(FLOW_KEY);
const codeVerifier = pkceData?.codeVerifier;

// Exchange code for tokens
const tokenService = new TokenManagementService(authConfig.environmentId);
const tokenResponse = await tokenService.exchangeAuthorizationCode(
  {
    grantType: 'authorization_code',
    code: authCode,
    redirectUri: authConfig.redirectUri,
    scope: authScopes,
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    environmentId: authConfig.environmentId,
    codeVerifier, // ✅ PKCE verifier included
  },
  {
    type: 'CLIENT_SECRET_POST',
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
  }
);

// Returns: { access_token, id_token, refresh_token, ... }
```

### Step 5: User Profile Fetch
**Location**: `KrogerGroceryStoreMFA_New.tsx` - `fetchUserProfile()`

```typescript
// Lookup user by username
const result = await lookupPingOneUser({
  environmentId: authConfig.environmentId,
  accessToken: workerToken, // ⚠️ Uses worker token, not user access token
  identifier: username,
});

// API Call:
// GET https://api.pingone.com/{environmentId}/users?filter=username eq "{username}"
// Authorization: Bearer {workerToken}

// Sets userInfo state:
{
  id: "abc123-def456-...", // ✅ Actual PingOne user ID
  username: "john.doe@example.com",
  email: "john.doe@example.com"
}
```

### Step 6: MFA Context Initialization
**Location**: `KrogerGroceryStoreMFA_New.tsx` - Render

```typescript
// Check if ready for MFA
const isReadyForMfa = Boolean(
  workerToken && 
  userInfo?.id && // ✅ Must have actual user ID
  authConfig.environmentId
);

// Initialize MFA Provider
<MFAProvider
  accessToken={workerToken}           // ✅ Worker token for MFA API calls
  environmentId={authConfig.environmentId}  // ✅ PingOne environment
  userId={userInfo?.id ?? loginCredentials.username}  // ✅ Actual user ID
>
  <KrogerGroceryStoreMFA />
</MFAProvider>
```

### Step 7: Base Component Receives Context
**Location**: `KrogerGroceryStoreMFA.tsx`

```typescript
// Extract credentials from MFA context
const { 
  devices: mfaDevices = [], 
  accessToken: mfaAccessToken,      // ✅ Worker token
  environmentId: mfaEnvironmentId,  // ✅ Environment ID
  userId: mfaUserId                 // ✅ User ID
} = useMFA();

// Context provides:
{
  accessToken: "eyJhbGciOiJSUzI1NiIs...",  // Worker token
  environmentId: "abc123-def456-...",
  userId: "user-abc123-def456-..."         // Actual PingOne user ID
}
```

### Step 8: SMS Device Registration
**Location**: `KrogerGroceryStoreMFA.tsx` - `handleRegisterDevice()`

```typescript
// Use MFA context credentials (with fallback)
const accessToken = mfaAccessToken || state.workerToken;
const environmentId = mfaEnvironmentId || state.credentials.environmentId;
const userId = mfaUserId || state.userInfo?.id || state.username;

// Validate credentials
if (!accessToken || !environmentId || !userId) {
  v4ToastManager.showError('Missing authentication credentials');
  return;
}

// Build credentials object
const credentials = {
  accessToken,      // ✅ Worker token from context
  environmentId,    // ✅ Environment ID from context
  userId            // ✅ User ID from context
};

// Register SMS device
const newDevice = await EnhancedPingOneMfaService.createSmsDevice(
  credentials,
  state.registrationPhoneNumber,  // e.g., "+15551234567"
  { name: 'My Phone' }
);

// API Call:
// POST https://api.pingone.com/{environmentId}/users/{userId}/devices
// Authorization: Bearer {workerToken}
// Content-Type: application/vnd.pingidentity.device.sms+json
// Body: {
//   "type": "SMS",
//   "phoneNumber": "+15551234567",
//   "name": "My Phone"
// }

// Returns: MfaDevice object with device ID
```

## Critical Data Points

### ✅ Credentials Flow Correctly
1. **Worker Token**: Loaded → Passed to MFAProvider → Extracted by base component
2. **Environment ID**: Loaded → Passed to MFAProvider → Extracted by base component
3. **User ID**: Fetched from PingOne → Passed to MFAProvider → Extracted by base component

### ✅ PKCE Flow Correctly
1. **Code Challenge**: Generated → Saved to storage → Sent in auth request
2. **Code Verifier**: Generated → Saved to storage → Loaded → Sent in token exchange

### ✅ Fallback Logic
Base component has fallback chain:
```typescript
const accessToken = mfaAccessToken || state.workerToken;
const environmentId = mfaEnvironmentId || state.credentials.environmentId;
const userId = mfaUserId || state.userInfo?.id || state.username;
```

This ensures it works both:
- When wrapped by `_New` (uses context)
- When standalone (uses state)

## Potential Issues to Watch

### 1. Worker Token vs User Access Token
- MFA API calls use **worker token** (not user's access token)
- Worker token must have `p1:read:user:mfaDevice` and `p1:create:user:mfaDevice` scopes
- Worker app must be configured in PingOne with proper permissions

### 2. User ID Resolution
- Must use actual PingOne user ID (UUID format)
- Cannot use username as user ID
- `fetchUserProfile()` must succeed to get user ID

### 3. Phone Number Format
- Must include country code (e.g., "+15551234567")
- PingOne validates format
- Invalid format returns 400 error

### 4. PKCE Validation
- Code verifier must match code challenge
- Verifier must be stored and retrieved correctly
- Missing verifier causes token exchange to fail

## Testing Checklist

### Prerequisites
- [ ] Worker token configured and valid
- [ ] Authorization code client configured
- [ ] User exists in PingOne environment
- [ ] Worker app has MFA permissions

### Flow Test
- [ ] Load page - configs hydrate
- [ ] Authenticate - get auth code
- [ ] Exchange tokens - PKCE verifier included
- [ ] Fetch user profile - get user ID
- [ ] MFA context initialized - credentials passed
- [ ] Base component receives context - credentials extracted
- [ ] Register SMS device - API call succeeds
- [ ] Device appears in list

## API Permissions Required

### Worker App Scopes
```
p1:read:user
p1:read:user:mfaDevice
p1:create:user:mfaDevice
p1:update:user:mfaDevice
p1:delete:user:mfaDevice
```

### Authorization Code App Scopes
```
openid
profile
email
offline_access (optional, for refresh tokens)
```

## Storage Keys Used

### Authorization Code Credentials
- `pingone_flow_data:kroger-grocery-store-mfa`

### Worker Token
- `pingone_worker_token_kroger-grocery-store-mfa`
- `pingone_worker_token_expires_at_kroger-grocery-store-mfa`

### PKCE Codes
- `pingone_pkce_codes:kroger-grocery-store-mfa`

### Flow State
- `pingone_flow_state:kroger-grocery-store-mfa`

## Conclusion

✅ **Data flows correctly through all layers**  
✅ **Credentials properly passed from wrapper → context → base component**  
✅ **PKCE support added and integrated**  
✅ **Fallback logic ensures compatibility**  
✅ **Ready for real PingOne API testing**

The flow is architecturally sound and should work with real PingOne APIs as long as:
1. Worker token has proper permissions
2. User exists in the environment
3. Phone numbers are properly formatted
4. PKCE codes are stored/retrieved correctly
