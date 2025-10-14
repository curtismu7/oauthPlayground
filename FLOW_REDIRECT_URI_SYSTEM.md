# Flow Redirect URI System

## Overview

The Flow Redirect URI System provides a centralized, maintainable way to manage redirect URIs for all OAuth 2.0 and OpenID Connect flows in the application. This system ensures consistency, reduces hardcoded values, and makes it easy to adapt to different deployment environments.

## Architecture

### Core Components

1. **`flowRedirectUriMapping.ts`** - Central mapping table of all flows to their redirect URI patterns
2. **`flowRedirectUriService.ts`** - Service layer providing utility functions for redirect URI management
3. **Integration in shared services** - All flow services now use the centralized system

### Pattern Structure

All redirect URIs follow this pattern:
```
https://localhost:{port}/{callbackPath}
```

Where:
- `{port}` is dynamically determined from `window.location.origin`
- `{callbackPath}` follows the pattern `{flowType}-callback`

## Flow Types and Their Redirect URIs

### OAuth 2.0 Flows
| Flow Type | Redirect URI Pattern | Requires Redirect URI |
|-----------|---------------------|---------------------|
| `oauth-authorization-code-v6` | `/authz-callback` | ✅ Yes |
| `oauth-implicit-v6` | `/oauth-implicit-callback` | ✅ Yes |
| `client-credentials-v6` | N/A | ❌ No |

### OpenID Connect Flows
| Flow Type | Redirect URI Pattern | Requires Redirect URI |
|-----------|---------------------|---------------------|
| `oidc-authorization-code-v6` | `/authz-callback` | ✅ Yes |
| `oidc-implicit-v6` | `/oidc-implicit-callback` | ✅ Yes |
| `oidc-hybrid-v6` | `/hybrid-callback` | ✅ Yes |
| `oidc-device-authorization-v6` | N/A | ❌ No |

### Device Authorization Flows
| Flow Type | Redirect URI Pattern | Requires Redirect URI |
|-----------|---------------------|---------------------|
| `device-authorization-v6` | N/A | ❌ No |

### Mock/Educational Flows
| Flow Type | Redirect URI Pattern | Requires Redirect URI |
|-----------|---------------------|---------------------|
| `jwt-bearer-token-v6` | N/A | ❌ No |
| `saml-bearer-assertion-v6` | N/A | ❌ No |

### PingOne Extensions
| Flow Type | Redirect URI Pattern | Requires Redirect URI |
|-----------|---------------------|---------------------|
| `pingone-par-v6` | `/authz-callback` | ✅ Yes |
| `pingone-par-v6-new` | `/authz-callback` | ✅ Yes |
| `rar-v6` | `/authz-callback` | ✅ Yes |

## Usage Examples

### Basic Usage

```typescript
import { FlowRedirectUriService } from '../services/flowRedirectUriService';

// Get default redirect URI for a flow
const redirectUri = FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v6');
// Returns: "https://localhost:3001/authz-callback" (or current port)

// Check if flow requires redirect URI
const requiresRedirect = FlowRedirectUriService.requiresRedirectUri('client-credentials-v6');
// Returns: false

// Get redirect URI with custom fallback
const customRedirect = FlowRedirectUriService.getRedirectUri(
  'oauth-authorization-code-v6', 
  'https://myapp.com/callback'
);
// Returns: "https://myapp.com/callback" (uses custom value)
```

### In Flow Controllers

```typescript
// Before (hardcoded)
redirectUri: 'https://localhost:3000/authz-callback'

// After (centralized)
redirectUri: FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v6')
```

### In Authorization URL Generation

```typescript
const redirectUri = FlowRedirectUriService.getAuthorizationRedirectUri(
  'oauth-authorization-code-v6',
  credentials,
  baseUrl
);
```

## Benefits

### 1. **Consistency**
- All flows use the same pattern
- No more hardcoded port numbers
- Centralized maintenance

### 2. **Flexibility**
- Automatically adapts to different ports
- Easy to override with custom URIs
- Supports different deployment environments

### 3. **Maintainability**
- Single source of truth for redirect URIs
- Easy to add new flows
- Clear documentation of flow requirements

### 4. **Type Safety**
- TypeScript interfaces ensure correct usage
- Compile-time validation of flow types

## Migration Guide

### Before (Old System)
```typescript
// Hardcoded in multiple places
redirectUri: 'https://localhost:3000/authz-callback'
redirectUri: `${window.location.origin}/authz-callback`
```

### After (New System)
```typescript
// Centralized service
redirectUri: FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v6')
```

## Adding New Flows

To add a new flow to the system:

1. **Add to mapping table** in `flowRedirectUriMapping.ts`:
```typescript
{
  flowType: 'new-flow-v6',
  requiresRedirectUri: true,
  callbackPath: 'new-flow-callback',
  description: 'New OAuth Flow',
  specification: 'RFC XXXX'
}
```

2. **Update service usage** in your flow files:
```typescript
redirectUri: FlowRedirectUriService.getDefaultRedirectUri('new-flow-v6')
```

3. **Test the integration** using the test file.

## Testing

Run the test file to verify the system:
```bash
# The test file demonstrates all functionality
src/utils/flowRedirectUriMapping.test.ts
```

## Troubleshooting

### Common Issues

1. **Port Mismatch**: Ensure the frontend and backend are on the expected ports
2. **Missing Flow Type**: Add new flow types to the mapping table
3. **Incorrect Callback Path**: Verify the callback path matches PingOne configuration

### Debug Information

Use the logging function for debugging:
```typescript
FlowRedirectUriService.logRedirectUriInfo(
  'oauth-authorization-code-v6',
  credentials,
  baseUrl
);
```

## Future Enhancements

1. **Environment-specific URIs**: Support for staging/production URLs
2. **Dynamic Port Detection**: Automatic port discovery
3. **Validation Rules**: Enhanced URI validation
4. **Configuration UI**: Admin interface for managing redirect URIs
