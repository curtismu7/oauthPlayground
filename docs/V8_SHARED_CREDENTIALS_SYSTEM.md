# V8 Shared Credentials System

## Overview

A centralized credentials management system for all V8 flows, eliminating code duplication and ensuring consistent credential handling across Authorization Code, Implicit, Client Credentials, Device Code, and future flows.

## Architecture

### Components

**CredentialsFormV8** (`src/v8/components/CredentialsFormV8.tsx`)
- Reusable form component for all flows
- Configurable fields (client secret, redirect URI, scopes)
- Consistent styling and validation feedback
- Supports all flow types

### Services

**CredentialsServiceV8** (`src/v8/services/credentialsServiceV8.ts`)
- Centralized credential management
- Storage/retrieval from localStorage
- Validation with flow-specific rules
- Import/export functionality

## Usage

### Basic Setup

```typescript
import CredentialsFormV8 from '@/v8/components/CredentialsFormV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

// Load credentials
const [credentials, setCredentials] = useState(() => {
  return CredentialsServiceV8.loadCredentials('my-flow-v8', {
    flowKey: 'my-flow-v8',
    flowType: 'oauth',
    includeClientSecret: true,
    includeRedirectUri: true,
    includeScopes: true,
    defaultScopes: 'openid profile email',
    defaultRedirectUri: 'http://localhost:3000/callback'
  });
});

// Save credentials
useEffect(() => {
  CredentialsServiceV8.saveCredentials('my-flow-v8', credentials);
}, [credentials]);

// Render form
<CredentialsFormV8
  credentials={credentials}
  onChange={setCredentials}
  flowType="oauth"
  includeClientSecret={true}
  includeRedirectUri={true}
  includeScopes={true}
  title="Configure Your App"
  subtitle="Enter your OAuth credentials"
/>
```

## Flow-Specific Configurations

### Authorization Code Flow V8

```typescript
{
  flowKey: 'oauth-authz-v8',
  flowType: 'oauth',
  includeClientSecret: true,      // Required for server-side apps
  includeRedirectUri: true,       // Required for callback
  includeScopes: true,            // Required for permissions
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/callback'
}
```

### Implicit Flow V8

```typescript
{
  flowKey: 'implicit-flow-v8',
  flowType: 'oidc',
  includeClientSecret: false,     // Not used in implicit flow
  includeRedirectUri: true,       // Required for callback
  includeScopes: true,            // Required for permissions
  defaultScopes: 'openid profile email',
  defaultRedirectUri: 'http://localhost:3000/implicit-callback'
}
```

### Client Credentials Flow V8 (Planned)

```typescript
{
  flowKey: 'client-credentials-v8',
  flowType: 'oauth',
  includeClientSecret: true,      // Required for authentication
  includeRedirectUri: false,      // Not used in client credentials
  includeScopes: true,            // Required for permissions
  defaultScopes: 'api:read api:write',
  defaultRedirectUri: undefined
}
```

### Device Code Flow V8 (Planned)

```typescript
{
  flowKey: 'device-code-v8',
  flowType: 'oauth',
  includeClientSecret: false,     // Optional for public clients
  includeRedirectUri: false,      // Not used in device flow
  includeScopes: true,            // Required for permissions
  defaultScopes: 'openid profile email',
  defaultRedirectUri: undefined
}
```

## Service API

### CredentialsServiceV8

#### `loadCredentials(flowKey, config)`
Load credentials from storage or return defaults.

```typescript
const creds = CredentialsServiceV8.loadCredentials('oauth-authz-v8', config);
```

#### `saveCredentials(flowKey, credentials)`
Save credentials to localStorage.

```typescript
CredentialsServiceV8.saveCredentials('oauth-authz-v8', credentials);
```

#### `getDefaultCredentials(flowKey, config)`
Get default credentials without loading from storage.

```typescript
const defaults = CredentialsServiceV8.getDefaultCredentials('oauth-authz-v8', config);
```

#### `clearCredentials(flowKey)`
Clear credentials from storage.

```typescript
CredentialsServiceV8.clearCredentials('oauth-authz-v8');
```

#### `validateCredentials(credentials, config)`
Validate credentials with flow-specific rules.

```typescript
const result = CredentialsServiceV8.validateCredentials(credentials, config);
if (result.errors.length > 0) {
  console.error('Validation failed:', result.errors);
}
```

#### `exportCredentials(credentials)`
Export credentials as JSON string.

```typescript
const json = CredentialsServiceV8.exportCredentials(credentials);
```

#### `importCredentials(json)`
Import credentials from JSON string.

```typescript
const creds = CredentialsServiceV8.importCredentials(jsonString);
```

#### `hasStoredCredentials(flowKey)`
Check if credentials exist in storage.

```typescript
if (CredentialsServiceV8.hasStoredCredentials('oauth-authz-v8')) {
  // Load existing credentials
}
```

## Validation Rules

### Always Required
- Environment ID (must be valid UUID)
- Client ID

### Conditionally Required
- Client Secret (if `includeClientSecret: true`)
- Redirect URI (if `includeRedirectUri: true`)
- Scopes (if `includeScopes: true`)

### Flow-Specific Rules
- **OIDC flows**: Must include "openid" scope
- **Redirect URI**: Must be valid URL format
- **Environment ID**: Must be valid UUID format

### Warnings
- Client Secret recommended but not required (if `includeClientSecret: true`)
- Invalid UUID format for Environment ID
- Invalid URL format for Redirect URI

## Storage

Credentials are stored in localStorage with keys prefixed by `v8_credentials_`:

```
v8_credentials_oauth-authz-v8
v8_credentials_implicit-flow-v8
v8_credentials_client-credentials-v8
v8_credentials_device-code-v8
```

Each key stores a JSON object with the credentials.

## Logging

All operations use module tag `[💾 CREDENTIALS-SERVICE-V8]`:

```
[💾 CREDENTIALS-SERVICE-V8] Loading credentials from storage
[💾 CREDENTIALS-SERVICE-V8] Credentials loaded from storage
[💾 CREDENTIALS-SERVICE-V8] Saving credentials to storage
[💾 CREDENTIALS-SERVICE-V8] Credentials saved successfully
[💾 CREDENTIALS-SERVICE-V8] Validating credentials
[💾 CREDENTIALS-SERVICE-V8] Validation complete
```

## Benefits

✅ **DRY Principle** - Single source of truth for credentials UI and logic
✅ **Consistency** - All flows use same component and validation rules
✅ **Reusability** - Easy to add new flows with minimal code
✅ **Maintainability** - Changes to credentials handling apply to all flows
✅ **Type Safety** - Full TypeScript support with interfaces
✅ **Flexibility** - Configurable for different flow requirements
✅ **Persistence** - Automatic localStorage management
✅ **Validation** - Built-in validation with helpful error messages

## Migration Guide

### For Existing V8 Flows

1. Import the new component and service
2. Replace inline credentials form with `CredentialsFormV8`
3. Replace `StorageServiceV8.getCredentials()` with `CredentialsServiceV8.loadCredentials()`
4. Replace `StorageServiceV8.saveCredentials()` with `CredentialsServiceV8.saveCredentials()`
5. Update reset logic to use `CredentialsServiceV8.getDefaultCredentials()`

### For New V8 Flows

1. Create flow component (e.g., `ClientCredentialsFlowV8.tsx`)
2. Import `CredentialsFormV8` and `CredentialsServiceV8`
3. Define flow-specific configuration
4. Use `loadCredentials()` in state initialization
5. Use `CredentialsFormV8` in render step 0
6. Use `saveCredentials()` in useEffect

## Examples

### Authorization Code Flow V8

```typescript
const [credentials, setCredentials] = useState(() => {
  return CredentialsServiceV8.loadCredentials('oauth-authz-v8', {
    flowKey: 'oauth-authz-v8',
    flowType: 'oauth',
    includeClientSecret: true,
    includeRedirectUri: true,
    includeScopes: true,
    defaultScopes: 'openid profile email',
    defaultRedirectUri: 'http://localhost:3000/callback'
  });
});

useEffect(() => {
  CredentialsServiceV8.saveCredentials('oauth-authz-v8', credentials);
}, [credentials]);

const renderStep0 = () => (
  <CredentialsFormV8
    credentials={credentials}
    onChange={setCredentials}
    flowType="oauth"
    includeClientSecret={true}
    includeRedirectUri={true}
    includeScopes={true}
    title="OAuth 2.0 Configure App & Environment"
    subtitle="API Authorization with Access token only"
  />
);
```

### Implicit Flow V8

```typescript
const [credentials, setCredentials] = useState(() => {
  return CredentialsServiceV8.loadCredentials('implicit-flow-v8', {
    flowKey: 'implicit-flow-v8',
    flowType: 'oidc',
    includeClientSecret: false,
    includeRedirectUri: true,
    includeScopes: true,
    defaultScopes: 'openid profile email',
    defaultRedirectUri: 'http://localhost:3000/implicit-callback'
  });
});

useEffect(() => {
  CredentialsServiceV8.saveCredentials('implicit-flow-v8', credentials);
}, [credentials]);

const renderStep0 = () => (
  <CredentialsFormV8
    credentials={credentials}
    onChange={setCredentials}
    flowType="oidc"
    includeClientSecret={false}
    includeRedirectUri={true}
    includeScopes={true}
    title="OAuth 2.0 Configure App & Environment"
    subtitle="ID token + Access token - Authentication + Authorization"
  />
);
```

## Files

- `src/v8/components/CredentialsFormV8.tsx` - Reusable form component
- `src/v8/services/credentialsServiceV8.ts` - Credentials management service
- `src/v8/flows/OAuthAuthorizationCodeFlowV8.tsx` - Updated to use shared system
- `src/v8/flows/ImplicitFlowV8.tsx` - Updated to use shared system

## Next Steps

1. ✅ Create shared credentials component and service
2. ✅ Update Authorization Code Flow V8
3. ✅ Update Implicit Flow V8
4. ⏳ Create Client Credentials Flow V8
5. ⏳ Create Device Code Flow V8
6. ⏳ Create ROPC Flow V8
7. ⏳ Create other flows using same pattern

---

**Status:** Complete for Authorization Code and Implicit flows  
**Last Updated:** 2024-11-16  
**Version:** 1.0.0
