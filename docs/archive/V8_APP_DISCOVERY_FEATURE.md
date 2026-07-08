# V8 App Discovery Feature

**Date:** 2024-11-16  
**Status:** ✅ Complete with 20 tests passing

---

## 🎯 Overview

The App Discovery feature is an **optional enhancement** that provides a seamless way to:
1. Manage worker tokens (store, retrieve, refresh)
2. Auto-discover all PingOne applications in an environment
3. Auto-fill form fields when an app is selected
4. Provide a clean dropdown UI for app selection

**Default Behavior:** Manual configuration (user enters credentials)  
**Optional:** App discovery (user provides worker token)

---

## 🎨 User Experience Flow

### Default: Manual Configuration
```
┌─────────────────────────────────────────┐
│ Step 0: Configure Credentials           │
│                                         │
│ Environment ID: [________________]     │
│ Client ID:      [________________]     │
│ Redirect URI:   [________________]     │
│ Scopes:         [________________]     │
│                                         │
│ [🔍 Use App Discovery (optional)]      │
│                                         │
│ [Next Step ▶]                          │
└─────────────────────────────────────────┘
```

### Optional: Enable App Discovery
```
User clicks "Use App Discovery":
┌─────────────────────────────────────────┐
│ 🔑 Worker Token                         │
│                                         │
│ [Paste worker token here...]           │
│                                         │
│ [🔍 Discover Apps]                     │
│                                         │
│ Status: ✓ Stored (expires in 23h)      │
│ [🔄 Refresh] [🗑️ Clear]               │
└─────────────────────────────────────────┘
```

### App Discovery: Select App
```
┌─────────────────────────────────────────┐
│ 📱 Select Application                   │
│                                         │
│ [▼ Choose an app...                  ] │
│   • Alpha App (WEB_APP)                │
│   • Beta App (SINGLE_PAGE_APP)         │
│   • Gamma App (NATIVE_APP)             │
│                                         │
│ ⏳ Discovering apps...                 │
└─────────────────────────────────────────┘
```

### App Discovery: Auto-Fill
```
When user selects an app:
┌─────────────────────────────────────────┐
│ Environment ID: [12345678-1234-...] ✓  │
│ Client ID:      [app-123_________] ✓  │
│ Redirect URI:   [http://localhost...] ✓│
│ Grant Type:     [authorization_code] ✓ │
│ Response Type:  [code____________] ✓  │
│ Scopes:         [openid profile...] ✓  │
│ PKCE:           [✓ Required_______] ✓  │
│ Auth Method:    [client_secret_post] ✓ │
│                                         │
│ ✅ All fields auto-filled!             │
│ [Back to Manual] [Next Step ▶]         │
└─────────────────────────────────────────┘
```

---

## 💻 AppDiscoveryService API

### getWorkerToken()
**Get or prompt for worker token**

```typescript
const token = await AppDiscoveryService.getWorkerToken();

// If token is stored and valid, returns it
// If not stored or expired, prompts user
// Stores token for 24 hours
```

**Behavior:**
1. Checks localStorage for stored token
2. If valid, returns it
3. If expired or missing, prompts user
4. Stores new token for 24 hours

---

### storeWorkerToken(token)
**Store worker token securely**

```typescript
AppDiscoveryService.storeWorkerToken('worker-token-xyz');

// Stores with:
// - Token value
// - Storage timestamp
// - Expiry time (24 hours from now)
```

---

### getStoredWorkerToken()
**Get stored token if valid**

```typescript
const token = AppDiscoveryService.getStoredWorkerToken();

// Returns token if:
// - Exists in localStorage
// - Not expired
// Returns null if:
// - Not found
// - Expired
```

---

### clearWorkerToken()
**Clear stored worker token**

```typescript
AppDiscoveryService.clearWorkerToken();

// Removes token from localStorage
// User will be prompted for new token on next use
```

---

### discoverApplications(environmentId, workerToken)
**Discover all apps in environment**

```typescript
const apps = await AppDiscoveryService.discoverApplications(
  '12345678-1234-1234-1234-123456789012',
  'worker-token-xyz'
);

// Returns array of DiscoveredApplication objects
// Fetches from PingOne API
// Handles errors gracefully
```

**Returns:**
```typescript
[
  {
    id: 'app-123',
    name: 'My Application',
    type: 'WEB_APP',
    enabled: true,
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    redirectUris: ['http://localhost:3000/callback'],
    tokenEndpointAuthMethod: 'client_secret_post',
    pkceRequired: true,
    accessTokenDuration: 3600,
    refreshTokenDuration: 604800,
    tokenFormat: 'JWT'
  },
  // ... more apps
]
```

---

### getAppConfig(app)
**Get configuration for auto-fill**

```typescript
const config = AppDiscoveryService.getAppConfig(app);

// Returns:
{
  clientId: 'app-123',
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['openid', 'profile', 'email'],
  grantType: 'authorization_code',
  responseType: 'code',
  tokenEndpointAuthMethod: 'client_secret_post',
  usePkce: true,
  accessTokenDuration: 3600,
  refreshTokenDuration: 604800,
  tokenFormat: 'JWT'
}
```

---

### formatForDropdown(apps)
**Format apps for dropdown UI**

```typescript
const options = AppDiscoveryService.formatForDropdown(apps);

// Returns:
[
  {
    value: 'app-123',
    label: 'Alpha App',
    description: 'WEB_APP • authorization_code, refresh_token'
  },
  {
    value: 'app-456',
    label: 'Beta App',
    description: 'SINGLE_PAGE_APP • authorization_code'
  }
]

// Features:
// - Filters disabled apps
// - Sorts alphabetically by name
// - Includes app type and grant types
```

---

### getApplicationById(apps, appId)
**Find app by ID**

```typescript
const app = AppDiscoveryService.getApplicationById(apps, 'app-123');

// Returns DiscoveredApplication or null
```

---

### getWorkerTokenExpiryInfo()
**Get token expiry information**

```typescript
const expiryInfo = AppDiscoveryService.getWorkerTokenExpiryInfo();

// Returns:
{
  expiresAt: 1731234567890,      // Timestamp
  expiresIn: 82800000,            // Milliseconds
  expiresInHours: 23,             // Hours
  isExpired: false
}

// Returns null if no token stored
```

---

### refreshWorkerToken()
**Refresh worker token**

```typescript
const newToken = await AppDiscoveryService.refreshWorkerToken();

// Clears old token
// Prompts user for new token
// Stores new token
```

---

## 🧪 Test Coverage

**20 tests passing:**
- ✅ Store and retrieve worker token
- ✅ Return null for non-existent token
- ✅ Clear worker token
- ✅ Validate worker token format
- ✅ Get worker token expiry info
- ✅ Detect expired token
- ✅ Get app config for auto-fill
- ✅ Use first grant type if authorization_code not available
- ✅ Use first response type if code not available
- ✅ Use first redirect URI
- ✅ Set PKCE based on app requirements
- ✅ Format applications for dropdown
- ✅ Filter disabled applications
- ✅ Sort applications by name
- ✅ Find application by ID
- ✅ Return null for non-existent application
- ✅ Calculate correct expiry hours
- ✅ Return null for non-existent token expiry
- ✅ Handle different app types
- ✅ Provide default values for missing fields

---

## 🔐 Security

### Worker Token Storage
- Stored in localStorage with expiry
- Expires after 24 hours
- User can manually clear
- Validated before use

### API Access
- Uses HTTPS only
- Bearer token authentication
- No sensitive data exposed
- Graceful error handling

### Data Protection
- Only fetches app configuration
- No user data accessed
- No credentials stored
- Token can be refreshed anytime

---

## 📊 Integration Flow

```
User Opens Flow
    ↓
Check for stored worker token
    ↓
If missing/expired → Prompt user
    ↓
Store token (24h expiry)
    ↓
Discover all apps
    ↓
Format for dropdown
    ↓
User selects app
    ↓
Get app config
    ↓
Auto-fill all fields
    ↓
User ready to proceed
```

---

## 🎯 Use Cases

### 1. First Time Setup
**Scenario:** User opens flow for first time

**Action:**
1. Prompted for worker token
2. Token stored for 24 hours
3. Apps auto-discovered
4. Dropdown populated

---

### 2. Returning User
**Scenario:** User returns within 24 hours

**Action:**
1. Stored token retrieved
2. Apps auto-discovered
3. Dropdown populated
4. No prompt needed

---

### 3. Token Expired
**Scenario:** User returns after 24 hours

**Action:**
1. Stored token detected as expired
2. User prompted for new token
3. New token stored
4. Apps auto-discovered

---

### 4. Multiple Applications
**Scenario:** User has multiple apps in environment

**Action:**
1. All apps discovered
2. Sorted alphabetically
3. User selects from dropdown
4. Fields auto-filled with app config

---

## 📝 Module Tag

All app discovery operations logged with:
```
[🔎 APP-DISCOVERY-V8]
```

Example logs:
```
[🔎 APP-DISCOVERY-V8] Getting worker token
[🔎 APP-DISCOVERY-V8] Using stored worker token
[🔎 APP-DISCOVERY-V8] Worker token stored { expiresIn: '24 hours' }
[🔎 APP-DISCOVERY-V8] Discovering applications { environmentId: '...' }
[🔎 APP-DISCOVERY-V8] Applications discovered { count: 5, apps: [...] }
[🔎 APP-DISCOVERY-V8] Getting app config { appId: 'app-123', appName: 'My App' }
[🔎 APP-DISCOVERY-V8] App config prepared { clientId: 'app-123', grantType: 'authorization_code' }
```

---

**Status:** ✅ Complete and tested  
**Module Tag:** `[🔎 APP-DISCOVERY-V8]`  
**Tests:** 20/20 passing
