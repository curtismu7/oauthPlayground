# V8 Credentials Form - Quick Start Guide

## What's New

The V8 credentials form now includes **all V7 functionality** plus:

✅ **OIDC Discovery** - Auto-populate from issuer URL  
✅ **Advanced Configuration** - Response type, auth methods, issuer URL  
✅ **Enhanced Validation** - Field-level error messages  
✅ **Smart Defaults** - Flow-aware defaults for all fields  
✅ **Collapsible Sections** - Organized, clean UI  
✅ **Full V7 Parity** - All V7 fields and features  

## Basic Usage

```typescript
import { CredentialsFormV8 } from '@/v8/components/CredentialsFormV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

const [credentials, setCredentials] = useState(() =>
  CredentialsServiceV8.getSmartDefaults('oauth-authz-v8')
);

<CredentialsFormV8
  flowKey="oauth-authz-v8"
  credentials={credentials}
  onChange={setCredentials}
/>
```

## Key Features

### 1. OIDC Discovery
Users can enter an issuer URL or PingOne environment ID to auto-populate configuration:

```
Input: https://auth.example.com
       or
       12345678-1234-1234-1234-123456789012

Result: Automatically discovers and fills:
- Issuer URL
- Authorization endpoint
- Token endpoint
- Supported scopes
- Supported response types
```

### 2. All Credential Fields
- Environment ID (required)
- Client ID (required)
- Client Secret (optional)
- Redirect URI (flow-dependent)
- Post-Logout Redirect URI (optional)
- Scopes (flow-dependent)
- Login Hint (optional)
- Response Type (advanced) - code, token, id_token, code token, code id_token, token id_token, code token id_token
- Token Endpoint Authentication Method (advanced)
- Issuer URL (advanced)

### 3. Flow-Specific Behavior
Automatically adjusts fields based on flow type:

```typescript
// Authorization Code Flow (response_type: code)
<CredentialsFormV8
  flowKey="oauth-authz-v8"
  flowType="oauth"
  // Shows: All fields
  // Default response_type: code
/>

// Implicit Flow (response_type: token)
<CredentialsFormV8
  flowKey="implicit-flow-v8"
  flowType="oidc"
  // Shows: No client secret
  // Default response_type: token
/>

// Client Credentials (no response_type)
<CredentialsFormV8
  flowKey="client-credentials-v8"
  flowType="client-credentials"
  // Shows: No redirect URI
  // No response_type needed
/>
```

### 4. Validation
Automatic validation with clear error messages:

```typescript
const result = CredentialsServiceV8.validateCredentials(credentials, 'oauth');

if (result.errors.length > 0) {
  result.errors.forEach(err => {
    console.log(`${err.field}: ${err.message}`);
  });
}
```

### 5. Storage
Credentials automatically save to localStorage:

```typescript
// Save
CredentialsServiceV8.saveCredentials('oauth-authz-v8', credentials);

// Load
const saved = CredentialsServiceV8.loadCredentials('oauth-authz-v8', config);

// Clear
CredentialsServiceV8.clearCredentials('oauth-authz-v8');
```

## Common Tasks

### Get Smart Defaults
```typescript
const defaults = CredentialsServiceV8.getSmartDefaults('oauth-authz-v8');
// Returns: { environmentId: '', clientId: '', redirectUri: 'http://localhost:3000/callback', scopes: 'openid profile email', ... }
```

### Discover OIDC Configuration
```typescript
const result = await OidcDiscoveryServiceV8.discoverFromInput('https://auth.example.com');
if (result.success) {
  console.log('Discovered:', result.data);
}
```

### Validate Credentials
```typescript
const result = CredentialsServiceV8.validateCredentials(credentials, 'oauth');
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
```

### Check if Credentials are Saved
```typescript
const hasSaved = CredentialsServiceV8.hasStoredCredentials('oauth-authz-v8');
```

### Export/Import Credentials
```typescript
// Export
const json = CredentialsServiceV8.exportCredentials(credentials);

// Import
const imported = CredentialsServiceV8.importCredentials(json);
```

## UI Sections

The form is organized into collapsible sections:

1. **OIDC Discovery** (Optional)
   - Enter issuer URL or environment ID
   - Click "Discover" to auto-populate

2. **Basic Authentication** (Always visible)
   - Environment ID
   - Client ID

3. **Client Authentication** (If needed)
   - Client Secret

4. **Redirect Configuration** (If needed)
   - Redirect URI
   - Logout URI

5. **Permissions** (If needed)
   - Scopes

6. **Advanced Configuration** (Collapsible)
   - Response Type
   - Client Auth Method
   - Issuer URL

7. **Additional Options** (Collapsible)
   - Post-Logout Redirect URI
   - Login Hint

## Error Handling

All errors are displayed as toast notifications:

```typescript
// Success
toastV8.success('Credentials saved!');

// Error
toastV8.error('Invalid redirect URI');

// Info
toastV8.info('Discovering configuration...');
```

## Props Reference

```typescript
interface CredentialsFormV8Props {
  // Required
  flowKey: string;                    // e.g., 'oauth-authz-v8'
  credentials: Credentials;           // Current credentials
  onChange: (creds: any) => void;    // Update handler

  // Optional
  flowType?: string;                  // 'oauth', 'oidc', etc.
  appConfig?: AppConfig;              // App configuration
  title?: string;                     // Form title
  subtitle?: string;                  // Form subtitle
  showRedirectUri?: boolean;           // Show redirect URI field
  showPostLogoutRedirectUri?: boolean; // Show post-logout redirect
  showLoginHint?: boolean;             // Show login hint field
  showClientAuthMethod?: boolean;      // Show auth method selector
  showAdvanced?: boolean;              // Show advanced section
  onRedirectUriChange?: (needs) => void;
  onLogoutUriChange?: (needs) => void;
  onDiscoveryComplete?: (result) => void;
}
```

## Flow Keys

Supported flow keys:
- `oauth-authz-v8` - OAuth 2.0 Authorization Code
- `implicit-flow-v8` - OIDC Implicit Flow
- `client-credentials-v8` - Client Credentials
- `device-code-v8` - Device Authorization
- `ropc-v8` - Resource Owner Password Credentials
- `hybrid-v8` - OIDC Hybrid Flow
- `pkce-v8` - PKCE Authorization Code

## Troubleshooting

### Discovery Not Working
- Check issuer URL is HTTPS (or localhost)
- Verify CORS is enabled on the OIDC provider
- Check browser console for network errors

### Validation Errors
- Environment ID must be a valid UUID
- Redirect URI must be a valid URL
- OIDC flows require "openid" scope

### Credentials Not Saving
- Check localStorage is enabled
- Check browser console for storage errors
- Verify flow key is correct

## Next Steps

1. **Integrate into your flow**: Use the component in your flow
2. **Handle discovery**: Listen to `onDiscoveryComplete` callback
3. **Validate before use**: Call `validateCredentials()` before making requests
4. **Handle errors**: Catch and display validation errors

## Examples

### Complete Flow Integration
```typescript
export const MyOAuthFlow = () => {
  const [credentials, setCredentials] = useState(() =>
    CredentialsServiceV8.getSmartDefaults('oauth-authz-v8')
  );

  const handleDiscovery = (result) => {
    console.log('Discovered configuration:', result);
  };

  const handleGenerateUrl = () => {
    const validation = CredentialsServiceV8.validateCredentials(credentials, 'oauth');
    if (validation.errors.length > 0) {
      toastV8.error('Please fix validation errors');
      return;
    }
    // Generate authorization URL...
  };

  return (
    <>
      <CredentialsFormV8
        flowKey="oauth-authz-v8"
        flowType="oauth"
        credentials={credentials}
        onChange={setCredentials}
        onDiscoveryComplete={handleDiscovery}
      />
      <button onClick={handleGenerateUrl}>Generate Authorization URL</button>
    </>
  );
};
```

---

**Version**: 8.0.0  
**Last Updated**: 2024-11-16
