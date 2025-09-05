# Per-Flow Credentials Configuration

This document describes the per-flow credentials configuration system implemented in version 3.0.0.

## Overview

The per-flow credentials system allows each OAuth flow page to have its own credential configuration that can override global defaults. This provides flexibility for testing different configurations across different flows while maintaining a centralized global configuration.

## Features

### 1. Per-Flow Configuration Blocks
Each flow page now includes a "Flow Credentials" section above the existing configuration that provides:
- **Environment ID**: PingOne environment identifier
- **Region**: Automatically derived or manually selectable
- **Client ID**: Application client identifier
- **Client Secret**: Application secret (masked by default)
- **Token Endpoint Auth Method**: Authentication method for token endpoint
- **Redirect URI**: OAuth redirect URI
- **PKCE Settings**: Enable/disable PKCE with code verifier debugging
- **Additional Scopes**: Comma/space-separated scopes

### 2. Global Defaults Fallback
- If a per-flow field is empty, the system uses the global default from the Configuration page
- Clear source indicators show whether values come from "Flow Override" or "Global Default"
- "Use Global Defaults" toggle disables flow inputs and shows global values as read-only

### 3. Secure Storage
- Configuration stored in localStorage with v2 namespacing (`p1_import_tool.v2`)
- Client secrets are masked by default with secure reveal toggle
- No secrets logged or exposed in network payloads
- Automatic migration from v1 to v2 storage format

### 4. Validation & Testing
- Real-time validation with inline error messages
- Test Connectivity button for each flow type
- Comprehensive error handling with user-friendly messages
- Source map tracking for debugging

## Storage Structure

### Global Configuration
```typescript
// Key: p1_import_tool.v2.config.global
{
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  tokenAuthMethod: 'none' | 'client_secret_basic' | 'client_secret_post' | 'private_key_jwt';
  redirectUri: string;
  scopes: string;
  pkceEnabled: boolean;
  updatedAt: number;
  // ... additional global settings
}
```

### Per-Flow Configuration
```typescript
// Key: p1_import_tool.v2.config.flow.{flowType}
{
  environmentId?: string;
  clientId?: string;
  clientSecret?: string;
  tokenAuthMethod?: TokenAuthMethod;
  redirectUri?: string;
  scopes?: string;
  pkceEnabled?: boolean;
  updatedAt?: number;
}
```

## Supported Flow Types

- `auth_code_pkce` - Authorization Code + PKCE Flow
- `hybrid` - Hybrid Flow
- `client_credentials` - Client Credentials Flow
- `refresh` - Token Refresh Flow
- `introspection` - Token Introspection Flow
- `implicit` - Implicit Grant Flow
- `device_code` - Device Code Flow

## Authentication Methods

### 1. None (`none`)
- No client authentication
- Client ID included in request body
- Used for public clients with PKCE

### 2. Client Secret Basic (`client_secret_basic`)
- Client credentials in Authorization header
- Format: `Basic base64(clientId:clientSecret)`
- Used for confidential clients

### 3. Client Secret Post (`client_secret_post`)
- Client credentials in request body
- `client_id` and `client_secret` as form parameters
- Alternative to Basic authentication

### 4. Private Key JWT (`private_key_jwt`)
- JWT client assertion (not yet implemented)
- Placeholder for future implementation

## Configuration Resolution

The system resolves effective configuration using the following priority:

1. **Flow Override**: Non-empty values from per-flow configuration
2. **Global Default**: Values from global configuration
3. **System Default**: Fallback values if no configuration exists

## Usage Examples

### Setting Up Per-Flow Credentials

1. Navigate to any OAuth flow page (e.g., Authorization Code + PKCE)
2. Scroll to the "Flow Credentials" section
3. Toggle off "Use Global Defaults" if you want to override specific values
4. Fill in the desired configuration fields
5. Click "Save Configuration"
6. Use "Test Connectivity" to verify the configuration

### Using Global Defaults

1. Configure global settings in the Configuration page (under Dashboard)
2. On any flow page, ensure "Use Global Defaults" is toggled on
3. The flow will automatically use global configuration values
4. Source indicators will show "Global Default" for all fields

### Testing Different Configurations

1. Set up different client credentials for different flows
2. Test each flow independently with its specific configuration
3. Compare results across different authentication methods
4. Use the source map to understand which values are being used

## API Reference

### ConfigStore

```typescript
import { configStore } from './utils/configStore';

// Get global configuration
const globalConfig = configStore.getGlobalConfig();

// Set global configuration
configStore.setGlobalConfig(config);

// Get flow-specific configuration
const flowConfig = configStore.getFlowConfig('auth_code_pkce');

// Set flow-specific configuration
configStore.setFlowConfig('auth_code_pkce', config);

// Resolve effective configuration
const { config: effectiveConfig, sourceMap } = configStore.resolveConfig('auth_code_pkce');

// Clear flow configuration
configStore.clearFlowConfig('auth_code_pkce');

// Clear all configurations
configStore.clearAllConfigs();
```

### Token Exchange

```typescript
import { exchangeCodeForTokens, exchangeClientCredentialsForTokens } from './utils/tokenExchange';

// Exchange authorization code for tokens
const tokens = await exchangeCodeForTokens('auth_code_pkce', {
  code: 'auth-code',
  redirect_uri: 'https://localhost:3000/callback',
  code_verifier: 'code-verifier'
});

// Exchange client credentials for tokens
const tokens = await exchangeClientCredentialsForTokens('client_credentials', {
  scope: 'api:read'
});
```

## Security Considerations

1. **Secret Masking**: Client secrets are masked by default and never logged
2. **Storage Security**: Configuration stored in browser localStorage (consider server-side storage for production)
3. **Network Security**: Secrets never exposed in network payloads except when required by OAuth spec
4. **Validation**: Comprehensive validation prevents invalid configurations
5. **Migration**: Secure migration from v1 to v2 storage format

## Troubleshooting

### Common Issues

1. **Configuration Not Saving**: Check validation errors and ensure all required fields are filled
2. **Connectivity Test Failing**: Verify Environment ID and Client ID are correct
3. **Token Exchange Failing**: Check authentication method and client secret configuration
4. **Migration Issues**: Clear browser storage and reconfigure if migration fails

### Debug Information

- Check browser console for `[⚙️ CONFIG]` and `[TOKEN-EXCHANGE]` logs
- Use source indicators to understand which configuration values are being used
- Test connectivity to verify endpoint accessibility
- Check network tab for actual request/response details

## Migration from v1

The system automatically migrates existing v1 configurations to v2 format:

1. On first load, the system checks for v1 configuration
2. If found, it migrates to v2 format with proper namespacing
3. Global configuration is preserved and enhanced
4. Per-flow configurations start empty (use global defaults)

## Future Enhancements

- Private Key JWT authentication implementation
- Server-side configuration storage
- Configuration import/export functionality
- Advanced validation rules
- Configuration templates and presets


