# V8 Flow Options - Smart Filtering Guide

## Overview

The V8 credentials form implements **smart, flow-aware field and option filtering** - just like PingOne. This means:

✅ Only relevant fields are shown for each flow  
✅ Redirect URI hidden for flows that don't use it  
✅ Client Secret hidden for public clients  
✅ Post-Logout Redirect URI only shown for OIDC flows  
✅ Login Hint only shown for interactive flows  
✅ Only valid options are shown for each field  
✅ Invalid options are disabled (greyed out)  
✅ Sensible defaults are pre-selected  
✅ PKCE enforcement is displayed  
✅ User can't select invalid combinations  

## How It Works

The `FlowOptionsServiceV8` determines which options are valid for each flow type:

```typescript
const flowOptions = FlowOptionsServiceV8.getOptionsForFlow('oauth-authz-v8');
// Returns: {
//   responseTypes: ['code'],
//   authMethods: ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'],
//   pkceEnforcement: 'OPTIONAL',
//   supportsRefreshToken: true,
//   supportsJWKS: true,
//   requiresRedirectUri: true,
//   ...
// }
```

## Flow-Specific Options

### Authorization Code Flow (`oauth-authz-v8`)
**Shown Fields**: Environment ID, Client ID, Client Secret, Redirect URI, Scopes, Login Hint, Response Type, Auth Method, PKCE, Issuer URL
- **Response Types**: `code` only
- **Auth Methods**: Client Secret Basic, Post, JWT, Private Key JWT
- **PKCE**: Optional
- **Refresh Token**: Supported
- **Redirect URI**: Required ✅
- **Client Secret**: Optional (but recommended)
- **Login Hint**: Supported ✅
- **Post-Logout Redirect URI**: Hidden ❌

### Implicit Flow (`implicit-flow-v8`)
**Shown Fields**: Environment ID, Client ID, Redirect URI, Scopes, Login Hint, Response Type, Auth Method, Issuer URL
- **Response Types**: `token`, `id_token`, `token id_token`
- **Auth Methods**: None only (public client)
- **PKCE**: Not required
- **Refresh Token**: Not supported
- **Redirect URI**: Required ✅
- **Client Secret**: Hidden ❌ (public client)
- **Login Hint**: Supported ✅
- **Post-Logout Redirect URI**: Hidden ❌

### Hybrid Flow (`hybrid-v8`)
**Shown Fields**: Environment ID, Client ID, Client Secret, Redirect URI, Post-Logout Redirect URI, Scopes, Login Hint, Response Type, Auth Method, PKCE, Issuer URL
- **Response Types**: `code`, `id_token`, `token id_token`, `code id_token`, `code token`, `code token id_token`
- **Auth Methods**: Client Secret Basic, Post, JWT, Private Key JWT
- **PKCE**: Optional
- **Refresh Token**: Supported
- **Redirect URI**: Required ✅
- **Client Secret**: Optional (but recommended)
- **Login Hint**: Supported ✅
- **Post-Logout Redirect URI**: Supported ✅

### Client Credentials Flow (`client-credentials-v8`)
**Shown Fields**: Environment ID, Client ID, Client Secret, Scopes, Token Endpoint Auth Method, Issuer URL
- **Response Types**: None (no authorization endpoint)
- **Auth Methods**: Client Secret Basic, Post, JWT, Private Key JWT
- **PKCE**: Not required
- **Refresh Token**: Not supported
- **Redirect URI**: Hidden ❌ (not used)
- **Client Secret**: Required ✅
- **Login Hint**: Hidden ❌
- **Post-Logout Redirect URI**: Hidden ❌

### Device Authorization Flow (`device-code-v8`)
**Shown Fields**: Environment ID, Client ID, Scopes, Token Endpoint Auth Method, Issuer URL
- **Response Types**: None (no authorization endpoint)
- **Auth Methods**: None, Client Secret Basic, Post
- **PKCE**: Not required
- **Refresh Token**: Supported
- **Redirect URI**: Hidden ❌ (not used)
- **Client Secret**: Hidden ❌ (optional)
- **Login Hint**: Hidden ❌
- **Post-Logout Redirect URI**: Hidden ❌

### PKCE Flow (`pkce-v8`)
**Shown Fields**: Environment ID, Client ID, Redirect URI, Scopes, Login Hint, Response Type (code), Auth Method (none), PKCE (required), Issuer URL
- **Response Types**: `code` only
- **Auth Methods**: None (public client)
- **PKCE**: Required ✅
- **Refresh Token**: Supported
- **Redirect URI**: Required ✅
- **Client Secret**: Hidden ❌ (public client)
- **Login Hint**: Supported ✅
- **Post-Logout Redirect URI**: Hidden ❌

### Resource Owner Password Credentials (`ropc-v8`)
**Shown Fields**: Environment ID, Client ID, Client Secret, Scopes, Token Endpoint Auth Method, Issuer URL
- **Response Types**: None (direct token endpoint)
- **Auth Methods**: Client Secret Basic, Post
- **PKCE**: Not required
- **Refresh Token**: Supported
- **Redirect URI**: Hidden ❌ (not used)
- **Client Secret**: Required ✅
- **Login Hint**: Hidden ❌
- **Post-Logout Redirect URI**: Hidden ❌

## Smart Filtering in Action

### Response Type Selector
```typescript
// Only shows valid response types for the flow
{flowOptions.responseTypes.length > 0 && (
  <select>
    {flowOptions.responseTypes.map((type) => (
      <option key={type} value={type}>
        {FlowOptionsServiceV8.getResponseTypeLabel(type)}
      </option>
    ))}
  </select>
)}
```

### Auth Method Selector
```typescript
// Shows all methods but disables invalid ones
<select>
  {FlowOptionsServiceV8.getAllAuthMethods().map((method) => {
    const isAvailable = flowOptions.authMethods.includes(method);
    return (
      <option disabled={!isAvailable}>
        {FlowOptionsServiceV8.getAuthMethodLabel(method)}
        {!isAvailable ? ' (not available for this flow)' : ''}
      </option>
    );
  })}
</select>
```

### PKCE Enforcement Display
```typescript
// Shows PKCE enforcement level
{flowOptions.responseTypes.length > 0 && (
  <div>
    <strong>{FlowOptionsServiceV8.getPKCELabel(flowOptions.pkceEnforcement)}</strong>
    <small>
      {flowOptions.pkceEnforcement === 'REQUIRED' && 'PKCE is required for this flow'}
      {flowOptions.pkceEnforcement === 'OPTIONAL' && 'PKCE is optional but recommended'}
      {flowOptions.pkceEnforcement === 'NOT_REQUIRED' && 'PKCE is not used for this flow'}
    </small>
  </div>
)}
```

## Usage Examples

### Check if Option is Available
```typescript
const isAvailable = FlowOptionsServiceV8.isAuthMethodAvailable(
  'oauth-authz-v8',
  'client_secret_basic'
);
// Returns: true

const isAvailable = FlowOptionsServiceV8.isAuthMethodAvailable(
  'implicit-flow-v8',
  'client_secret_basic'
);
// Returns: false (implicit flows use 'none' only)
```

### Get Default Values
```typescript
const options = FlowOptionsServiceV8.getOptionsForFlow('oauth-authz-v8');
console.log(options.defaultResponseType);    // 'code'
console.log(options.defaultAuthMethod);      // 'client_secret_post'
```

### Get Human-Readable Labels
```typescript
FlowOptionsServiceV8.getAuthMethodLabel('client_secret_basic');
// Returns: 'Client Secret Basic'

FlowOptionsServiceV8.getResponseTypeLabel('code token id_token');
// Returns: 'Code token id_token'

FlowOptionsServiceV8.getPKCELabel('REQUIRED');
// Returns: 'Required'
```

## Benefits

1. **User-Friendly**: Users only see valid options
2. **Error Prevention**: Can't select invalid combinations
3. **Clear Guidance**: Disabled options show why they're not available
4. **Consistent**: Matches PingOne's behavior
5. **Maintainable**: All flow logic in one place
6. **Extensible**: Easy to add new flows

## Adding a New Flow

To add a new flow type, just add a case to `getOptionsForFlow()`:

```typescript
// Device Authorization Flow
if (normalized.includes('device')) {
  return {
    responseTypes: [],
    authMethods: ['none', 'client_secret_basic', 'client_secret_post'],
    pkceEnforcement: 'NOT_REQUIRED',
    supportsRefreshToken: true,
    supportsJWKS: false,
    requiresRedirectUri: false,
    requiresClientSecret: false,
    supportsLoginHint: false,
    supportsPostLogoutRedirectUri: false,
    defaultResponseType: 'code',
    defaultAuthMethod: 'none'
  };
}
```

## Testing

Test that options are correctly filtered:

```typescript
// Test Authorization Code Flow
const authzOptions = FlowOptionsServiceV8.getOptionsForFlow('oauth-authz-v8');
expect(authzOptions.responseTypes).toEqual(['code']);
expect(authzOptions.authMethods).toContain('client_secret_basic');
expect(authzOptions.authMethods).not.toContain('none');

// Test Implicit Flow
const implicitOptions = FlowOptionsServiceV8.getOptionsForFlow('implicit-flow-v8');
expect(implicitOptions.responseTypes).toContain('token');
expect(implicitOptions.authMethods).toEqual(['none']);

// Test Client Credentials
const ccOptions = FlowOptionsServiceV8.getOptionsForFlow('client-credentials-v8');
expect(ccOptions.responseTypes).toEqual([]);
expect(ccOptions.requiresClientSecret).toBe(true);
```

## Example Behavior

### Authorization Code Flow (Default)
- **Shown Fields**: Environment ID, Client ID, Client Secret, Redirect URI, Scopes, Login Hint, Response Type (code), Auth Method (all options), Issuer URL
- **PKCE Checkbox**: Available to toggle to PKCE mode
- **Auth Methods**: Client Secret Basic, Post, JWT, Private Key JWT

### Authorization Code Flow with PKCE (When Checkbox Enabled)
- **Shown Fields**: Environment ID, Client ID, Redirect URI, Scopes, Login Hint, Response Type (code), Auth Method (None only), Issuer URL
- **Hidden Fields**: Client Secret (public client)
- **PKCE**: Locked to "Required"
- **Auth Methods**: None only (public client)

### Implicit Flow
- **Shown Fields**: Environment ID, Client ID, Redirect URI, Scopes, Login Hint, Response Type (token/id_token), Auth Method (None only), Issuer URL
- **Hidden Fields**: Client Secret (public client)
- **Auth Methods**: None only

### Client Credentials Flow
- **Shown Fields**: Environment ID, Client ID, Client Secret, Scopes, Auth Method (all options), Issuer URL
- **Hidden Fields**: Redirect URI, Response Type, Login Hint, Post-Logout Redirect URI
- **Auth Methods**: Client Secret Basic, Post, JWT, Private Key JWT

### Device Code Flow
- **Shown Fields**: Environment ID, Client ID, Scopes, Auth Method (None/Basic/Post), Issuer URL
- **Hidden Fields**: Redirect URI, Client Secret, Response Type, Login Hint, Post-Logout Redirect URI
- **Auth Methods**: None, Client Secret Basic, Post

### Hybrid Flow
- **Shown Fields**: Environment ID, Client ID, Client Secret, Redirect URI, Post-Logout Redirect URI, Scopes, Login Hint, Response Type (all), Auth Method (all), Issuer URL
- **Auth Methods**: Client Secret Basic, Post, JWT, Private Key JWT

## Future Enhancements

Potential additions:
- Grant type selection (with smart filtering)
- JWKS configuration options
- Refresh token duration settings
- Redirect URI pattern matching
- Signoff URI management
- Request parameter signature requirements
- Device authorization specific options

---

**Version**: 8.0.0  
**Last Updated**: 2024-11-16  
**Status**: Complete
