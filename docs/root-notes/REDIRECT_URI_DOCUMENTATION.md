# Redirect URI Documentation

## Overview

This document provides comprehensive information about redirect URIs used in the OAuth 2.0 and OpenID Connect flows in this application.

## Redirect URI Patterns

All redirect URIs follow this standardized pattern:
```
https://localhost:{port}/{callbackPath}
```

Where:
- `{port}` is dynamically determined from the current frontend port
- `{callbackPath}` follows the pattern `{flowType}-callback`

## Flow-Specific Redirect URIs

### OAuth 2.0 Flows

| Flow Type | Redirect URI Pattern | Full Example (Port 3001) | Purpose |
|-----------|---------------------|---------------------------|---------|
| `oauth-authorization-code-v6` | `/authz-callback` | `https://localhost:3001/authz-callback` | Authorization code exchange |
| `oauth-implicit-v6` | `/oauth-implicit-callback` | `https://localhost:3001/oauth-implicit-callback` | Implicit grant response |

### OpenID Connect Flows

| Flow Type | Redirect URI Pattern | Full Example (Port 3001) | Purpose |
|-----------|---------------------|---------------------------|---------|
| `oidc-authorization-code-v6` | `/authz-callback` | `https://localhost:3001/authz-callback` | Authorization code + ID token |
| `oidc-implicit-v6` | `/oidc-implicit-callback` | `https://localhost:3001/oidc-implicit-callback` | ID token response |
| `oidc-hybrid-v6` | `/hybrid-callback` | `https://localhost:3001/hybrid-callback` | Hybrid flow response |

### Device Authorization Flows

| Flow Type | Redirect URI Required | Notes |
|-----------|----------------------|-------|
| `device-authorization-v6` | ❌ No | Device flows don't use redirect URIs |
| `oidc-device-authorization-v6` | ❌ No | Device flows don't use redirect URIs |

### Client Credentials Flow

| Flow Type | Redirect URI Required | Notes |
|-----------|----------------------|-------|
| `client-credentials-v6` | ❌ No | Machine-to-machine, no user interaction |

### Mock/Educational Flows

| Flow Type | Redirect URI Required | Notes |
|-----------|----------------------|-------|
| `jwt-bearer-token-v6` | ❌ No | Mock implementation for education |
| `saml-bearer-assertion-v6` | ❌ No | Mock implementation for education |

### PingOne Extensions

| Flow Type | Redirect URI Pattern | Full Example (Port 3001) | Purpose |
|-----------|---------------------|---------------------------|---------|
| `pingone-par-v6` | `/authz-callback` | `https://localhost:3001/authz-callback` | Pushed Authorization Requests |
| `pingone-par-v6-new` | `/authz-callback` | `https://localhost:3001/authz-callback` | PAR with enhanced features |
| `rar-v6` | `/authz-callback` | `https://localhost:3001/authz-callback` | Rich Authorization Requests |

## Dynamic Port Adaptation

The application automatically adapts to different ports:

### Port 3000
```
https://localhost:3000/authz-callback
https://localhost:3000/oauth-implicit-callback
https://localhost:3000/oidc-implicit-callback
https://localhost:3000/hybrid-callback
```

### Port 3001
```
https://localhost:3001/authz-callback
https://localhost:3001/oauth-implicit-callback
https://localhost:3001/oidc-implicit-callback
https://localhost:3001/hybrid-callback
```

### Port 3002
```
https://localhost:3002/authz-callback
https://localhost:3002/oauth-implicit-callback
https://localhost:3002/oidc-implicit-callback
https://localhost:3002/hybrid-callback
```

## PingOne Configuration

### Required PingOne App Settings

For each redirect URI to work, it must be registered in your PingOne application configuration:

1. **Login to PingOne Admin Console**
2. **Navigate to Applications**
3. **Select your OAuth/OIDC application**
4. **Go to Configuration tab**
5. **Add Redirect URIs section**

### Redirect URI Registration

Add these URIs to your PingOne application (adjust port as needed):

```
https://localhost:3001/authz-callback
https://localhost:3001/oauth-implicit-callback
https://localhost:3001/oidc-implicit-callback
https://localhost:3001/hybrid-callback
https://localhost:3001/logout-callback
```

### Wildcard Support

PingOne supports wildcard patterns for development:

```
https://localhost:*/authz-callback
https://localhost:*/oauth-implicit-callback
https://localhost:*/oidc-implicit-callback
https://localhost:*/hybrid-callback
```

## Common Redirect URI Errors

### "Invalid Redirect URI" Error

**Cause**: The redirect URI in the authorization request doesn't match what's registered in PingOne.

**Solutions**:
1. **Check PingOne Configuration**: Ensure the exact URI is registered
2. **Verify Port**: Make sure the port matches your frontend
3. **Check Protocol**: Ensure HTTPS is used
4. **Case Sensitivity**: URIs are case-sensitive

### Port Mismatch Issues

**Problem**: Frontend runs on port 3001, but authorization request uses port 3000.

**Solution**: The application now automatically detects the current port using `window.location.origin`.

### Multiple Redirect URI Support

**Best Practice**: Register all possible redirect URIs in PingOne:

```
https://localhost:3000/authz-callback
https://localhost:3001/authz-callback
https://localhost:3002/authz-callback
```

## Security Considerations

### HTTPS Requirement

- **Production**: Always use HTTPS redirect URIs
- **Development**: HTTPS recommended, HTTP allowed for localhost
- **PingOne**: Requires HTTPS for production environments

### Domain Validation

- **Localhost**: Safe for development
- **Custom Domains**: Must be registered and validated in PingOne
- **Wildcards**: Use carefully, only for development

### State Parameter

Always include a `state` parameter in authorization requests to prevent CSRF attacks:

```
https://auth.pingone.com/{env-id}/as/authorize?
  response_type=code&
  client_id={client-id}&
  redirect_uri=https://localhost:3001/authz-callback&
  state={random-state-value}&
  scope=openid profile email
```

## Testing Redirect URIs

### Manual Testing

1. **Start the application** on your desired port
2. **Navigate to a flow** (e.g., OAuth Authorization Code)
3. **Configure credentials** and generate authorization URL
4. **Verify the redirect URI** in the generated URL
5. **Test the flow** by clicking "Redirect to PingOne"

### Automated Testing

The application includes built-in validation:

```typescript
// Check if redirect URI is valid for the flow
const isValid = FlowRedirectUriService.validateRedirectUri(
  'oauth-authorization-code-v6',
  'https://localhost:3001/authz-callback'
);
```

## Troubleshooting Guide

### Step 1: Verify Current Port
```javascript
console.log('Current origin:', window.location.origin);
// Should output: https://localhost:3001 (or your current port)
```

### Step 2: Check Flow Configuration
```javascript
// Get the expected redirect URI for a flow
const redirectUri = FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v6');
console.log('Expected redirect URI:', redirectUri);
```

### Step 3: Validate PingOne Registration
1. Check PingOne Admin Console
2. Verify the exact URI is registered
3. Ensure no extra spaces or characters

### Step 4: Test Authorization URL
1. Generate authorization URL in the application
2. Copy the `redirect_uri` parameter
3. Compare with PingOne configuration

## Best Practices

### 1. Use Centralized Service
Always use `FlowRedirectUriService` instead of hardcoded URIs:

```typescript
// ✅ Good
const redirectUri = FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v6');

// ❌ Bad
const redirectUri = 'https://localhost:3000/authz-callback';
```

### 2. Register Multiple Ports
For development flexibility, register multiple ports in PingOne:

```
https://localhost:3000/authz-callback
https://localhost:3001/authz-callback
https://localhost:3002/authz-callback
```

### 3. Use HTTPS in Production
Always use HTTPS redirect URIs in production environments.

### 4. Include State Parameter
Always include a random `state` parameter for security.

### 5. Test All Flows
Test each flow type to ensure redirect URIs work correctly.

## API Reference

### FlowRedirectUriService Methods

```typescript
// Get default redirect URI for a flow
FlowRedirectUriService.getDefaultRedirectUri('oauth-authorization-code-v6')

// Check if flow requires redirect URI
FlowRedirectUriService.requiresRedirectUri('client-credentials-v6')

// Get redirect URI with custom fallback
FlowRedirectUriService.getRedirectUri('oauth-authorization-code-v6', customUri)

// Validate redirect URI
FlowRedirectUriService.validateRedirectUri('oauth-authorization-code-v6', uri)
```

## Related Documentation

- [Flow Redirect URI System](./FLOW_REDIRECT_URI_SYSTEM.md)
- [Comprehensive Credentials Service Update](./COMPREHENSIVE_CREDENTIALS_SERVICE_UPDATE.md)
- [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-4.1)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [PingOne Documentation](https://docs.pingidentity.com/)
