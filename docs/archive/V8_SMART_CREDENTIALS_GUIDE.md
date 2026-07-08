# V8 Smart Credentials System

## Overview

The V8 Smart Credentials System automatically handles field visibility, provides intelligent defaults, and integrates with app discovery to minimize user input and prevent configuration errors.

## Key Features

### 1. Flow-Aware Field Visibility

Fields are automatically shown/hidden based on flow type:

| Field | AuthZ | Implicit | Client Creds | Device Code | ROPC | Hybrid | PKCE |
|-------|-------|----------|--------------|-------------|------|--------|------|
| Environment ID | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Client ID | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Client Secret | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Redirect URI | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Logout URI | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Scopes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 2. Smart Defaults

Each flow has pre-configured defaults to minimize typing:

```typescript
// Authorization Code Flow
{
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/callback'
}

// Implicit Flow
{
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/implicit-callback'
}

// Client Credentials Flow
{
  defaultScopes: 'api:read api:write'
  // No redirect URI needed
}

// Device Code Flow
{
  defaultScopes: 'openid profile email'
  // No redirect URI needed
}

// Hybrid Flow
{
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/callback',
  defaultLogoutUri: 'http://localhost:3000/logout'
}
```

### 3. App Discovery Integration

Automatically pulls values from app configuration:

```typescript
// Load with app discovery
const creds = CredentialsService.loadWithAppDiscovery('oauth-authz-v8', appConfig);

// Result:
// - clientId: from app config
// - redirectUri: first registered URI from app
// - logoutUri: first registered logout URI from app
// - scopes: available scopes from app
```

### 4. URI Change Detection

Automatically detects when URIs don't match app config:

```typescript
// Check if redirect URI needs app update
const needsUpdate = CredentialsService.needsRedirectUriUpdate(
  'oauth-authz-v8',
  'http://localhost:3000/new-callback',
  ['http://localhost:3000/callback']  // registered URIs
);
// Returns: true (needs app update)

// UI shows warning:
// ⚠️ Not registered in app - update app config
```

### 5. Helpful Field Hints

Each field shows context-specific help text:

```
Environment ID
Your PingOne environment identifier

Client ID
Public identifier for your application

Client Secret
Keep this secure - never expose in client-side code

Redirect URI
Where users return after authentication
⚠️ Not registered in app - update app config

Logout URI
Where users go after logout

Scopes
Space-separated list of requested permissions
```

## Usage

### Basic Setup (Automatic)

```typescript
import CredentialsForm from '@/v8/components/CredentialsForm';
import { CredentialsService } from '@/v8/services/credentialsService';

// Load smart defaults
const [credentials, setCredentials] = useState(() => {
  return CredentialsService.loadCredentials('oauth-authz-v8', {
    flowKey: 'oauth-authz-v8',
    flowType: 'oauth',
    includeClientSecret: true,
    includeRedirectUri: true,
    includeLogoutUri: false,
    includeScopes: true,
    defaultScopes: 'openid profile email',
    defaultRedirectUri: 'http://localhost:3000/callback'
  });
});

// Render - fields automatically shown/hidden
<CredentialsForm
  flowKey="oauth-authz-v8"
  credentials={credentials}
  onChange={setCredentials}
  title="OAuth 2.0 Configure App & Environment"
  subtitle="API Authorization with Access token only"
/>
```

### With App Discovery

```typescript
// Fetch app config from PingOne
const appConfig = await fetchAppConfig(environmentId, clientId, workerToken);

// Load credentials with app values
const [credentials, setCredentials] = useState(() => {
  return CredentialsService.loadWithAppDiscovery('oauth-authz-v8', appConfig);
});

// Render with app config
<CredentialsForm
  flowKey="oauth-authz-v8"
  credentials={credentials}
  onChange={setCredentials}
  appConfig={appConfig}
  onRedirectUriChange={(needsUpdate) => {
    if (needsUpdate) {
      showWarning('Redirect URI not registered in app');
    }
  }}
/>
```

### Using Smart Defaults

```typescript
// Get pre-configured defaults for a flow
const defaults = CredentialsService.getSmartDefaults('oauth-authz-v8');
// Returns:
// {
//   environmentId: '',
//   clientId: '',
//   clientSecret: '',
//   redirectUri: 'http://localhost:3000/callback',
//   scopes: 'openid profile email'
// }

// Reset to defaults
setCredentials(CredentialsService.getSmartDefaults('oauth-authz-v8'));
```

## Service API

### `getSmartDefaults(flowKey)`

Get pre-configured defaults for a flow type.

```typescript
const defaults = CredentialsService.getSmartDefaults('oauth-authz-v8');
```

**Returns:** Credentials object with smart defaults

---

### `getFlowConfig(flowKey)`

Get the configuration for a flow type.

```typescript
const config = CredentialsService.getFlowConfig('oauth-authz-v8');
// {
//   flowKey: 'oauth-authz-v8',
//   flowType: 'oauth',
//   includeClientSecret: true,
//   includeRedirectUri: true,
//   includeLogoutUri: false,
//   includeScopes: true,
//   defaultScopes: 'openid profile email',
//   defaultRedirectUri: 'http://localhost:3000/callback'
// }
```

**Returns:** CredentialsConfig or undefined

---

### `loadWithAppDiscovery(flowKey, appConfig)`

Load credentials with values from app configuration.

```typescript
const creds = CredentialsService.loadWithAppDiscovery('oauth-authz-v8', {
  clientId: 'app-client-id',
  redirectUris: ['http://localhost:3000/callback', 'https://example.com/callback'],
  logoutUris: ['http://localhost:3000/logout'],
  scopes: ['openid', 'profile', 'email']
});
```

**Returns:** Credentials with app-discovered values

---

### `needsRedirectUriUpdate(flowKey, currentUri, appUris)`

Check if redirect URI needs to be updated in app.

```typescript
const needsUpdate = CredentialsService.needsRedirectUriUpdate(
  'oauth-authz-v8',
  'http://localhost:3000/new-callback',
  ['http://localhost:3000/callback']
);
// Returns: true
```

**Returns:** boolean

---

### `needsLogoutUriUpdate(flowKey, currentUri, appUris)`

Check if logout URI needs to be updated in app.

```typescript
const needsUpdate = CredentialsService.needsLogoutUriUpdate(
  'hybrid-v8',
  'http://localhost:3000/new-logout',
  ['http://localhost:3000/logout']
);
// Returns: true
```

**Returns:** boolean

---

### `loadCredentials(flowKey, config)`

Load credentials from storage or return defaults.

```typescript
const creds = CredentialsService.loadCredentials('oauth-authz-v8', config);
```

**Returns:** Credentials

---

### `saveCredentials(flowKey, credentials)`

Save credentials to localStorage.

```typescript
CredentialsService.saveCredentials('oauth-authz-v8', credentials);
```

---

### `clearCredentials(flowKey)`

Clear credentials from storage.

```typescript
CredentialsService.clearCredentials('oauth-authz-v8');
```

---

### `validateCredentials(credentials, config)`

Validate credentials with flow-specific rules.

```typescript
const result = CredentialsService.validateCredentials(credentials, config);
// {
//   errors: ['Environment ID is required'],
//   warnings: ['Client Secret is recommended for this flow']
// }
```

**Returns:** { errors: string[], warnings: string[] }

---

## Component Props

### CredentialsForm

```typescript
interface CredentialsFormV8Props {
  flowKey: string;                    // Required: 'oauth-authz-v8', 'implicit-flow-v8', etc.
  credentials: Credentials;           // Required: Current credentials
  onChange: (creds: Credentials) => void;  // Required: Change handler
  appConfig?: {                       // Optional: App configuration
    clientId?: string;
    redirectUris?: string[];
    logoutUris?: string[];
    scopes?: string[];
  };
  title?: string;                     // Optional: Form title
  subtitle?: string;                  // Optional: Form subtitle
  onRedirectUriChange?: (needsUpdate: boolean) => void;  // Optional: Redirect URI change callback
  onLogoutUriChange?: (needsUpdate: boolean) => void;    // Optional: Logout URI change callback
}
```

## Flow Configurations

### Authorization Code Flow

```typescript
{
  flowKey: 'oauth-authz-v8',
  flowType: 'oauth',
  includeClientSecret: true,
  includeRedirectUri: true,
  includeLogoutUri: false,
  includeScopes: true,
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/callback'
}
```

### Implicit Flow

```typescript
{
  flowKey: 'implicit-flow-v8',
  flowType: 'oidc',
  includeClientSecret: false,
  includeRedirectUri: true,
  includeLogoutUri: false,
  includeScopes: true,
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/implicit-callback'
}
```

### Client Credentials Flow

```typescript
{
  flowKey: 'client-credentials-v8',
  flowType: 'oauth',
  includeClientSecret: true,
  includeRedirectUri: false,
  includeLogoutUri: false,
  includeScopes: true,
  defaultScopes: 'api:read api:write'
}
```

### Device Code Flow

```typescript
{
  flowKey: 'device-code-v8',
  flowType: 'oauth',
  includeClientSecret: false,
  includeRedirectUri: false,
  includeLogoutUri: false,
  includeScopes: true,
  defaultScopes: 'openid profile email'
}
```

### ROPC Flow

```typescript
{
  flowKey: 'ropc-v8',
  flowType: 'ropc',
  includeClientSecret: true,
  includeRedirectUri: false,
  includeLogoutUri: false,
  includeScopes: true,
  defaultScopes: 'openid profile email'
}
```

### Hybrid Flow

```typescript
{
  flowKey: 'hybrid-v8',
  flowType: 'hybrid',
  includeClientSecret: true,
  includeRedirectUri: true,
  includeLogoutUri: true,
  includeScopes: true,
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/callback',
  defaultLogoutUri: 'http://localhost:3000/logout'
}
```

### PKCE Flow

```typescript
{
  flowKey: 'pkce-v8',
  flowType: 'pkce',
  includeClientSecret: false,
  includeRedirectUri: true,
  includeLogoutUri: false,
  includeScopes: true,
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/callback'
}
```

## Examples

### Example 1: Authorization Code Flow with App Discovery

```typescript
export const OAuthAuthorizationCodeFlow: React.FC = () => {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [credentials, setCredentials] = useState(() => {
    if (appConfig) {
      return CredentialsService.loadWithAppDiscovery('oauth-authz-v8', appConfig);
    }
    return CredentialsService.getSmartDefaults('oauth-authz-v8');
  });

  const handleRedirectUriChange = (needsUpdate: boolean) => {
    if (needsUpdate) {
      showWarning('Redirect URI not registered in app. Update app configuration.');
    }
  };

  return (
    <CredentialsForm
      flowKey="oauth-authz-v8"
      credentials={credentials}
      onChange={setCredentials}
      appConfig={appConfig}
      onRedirectUriChange={handleRedirectUriChange}
      title="OAuth 2.0 Configure App & Environment"
      subtitle="API Authorization with Access token only"
    />
  );
};
```

### Example 2: Client Credentials Flow (No Redirect URI)

```typescript
export const ClientCredentialsFlow: React.FC = () => {
  const [credentials, setCredentials] = useState(() => {
    return CredentialsService.getSmartDefaults('client-credentials-v8');
  });

  return (
    <CredentialsForm
      flowKey="client-credentials-v8"
      credentials={credentials}
      onChange={setCredentials}
      title="Client Credentials Flow"
      subtitle="Machine-to-machine authentication"
    />
  );
};
```

### Example 3: Hybrid Flow with Logout URI

```typescript
export const HybridFlow: React.FC = () => {
  const [credentials, setCredentials] = useState(() => {
    return CredentialsService.getSmartDefaults('hybrid-v8');
  });

  const handleLogoutUriChange = (needsUpdate: boolean) => {
    if (needsUpdate) {
      showWarning('Logout URI not registered in app. Update app configuration.');
    }
  };

  return (
    <CredentialsForm
      flowKey="hybrid-v8"
      credentials={credentials}
      onChange={setCredentials}
      onLogoutUriChange={handleLogoutUriChange}
      title="Hybrid Flow"
      subtitle="Combined authentication and authorization"
    />
  );
};
```

## Benefits

✅ **Minimal User Input** - Smart defaults reduce typing
✅ **Flow-Aware** - Only shows relevant fields
✅ **App Integration** - Pulls values from app config
✅ **Error Prevention** - Detects URI mismatches
✅ **Helpful Hints** - Context-specific guidance
✅ **Consistent** - Same UX across all flows
✅ **Type Safe** - Full TypeScript support
✅ **Maintainable** - Centralized configuration

## Logging

All operations use module tag `[💾 CREDENTIALS-SERVICE-V8]`:

```
[💾 CREDENTIALS-SERVICE-V8] Getting smart defaults
[💾 CREDENTIALS-SERVICE-V8] Loading credentials with app discovery
[💾 CREDENTIALS-SERVICE-V8] Redirect URI needs app update
[💾 CREDENTIALS-SERVICE-V8] Logout URI needs app update
```

---

**Status:** Complete for Authorization Code and Implicit flows  
**Last Updated:** 2024-11-16  
**Version:** 2.0.0 (Smart Credentials)
