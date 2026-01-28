# Opaque Refresh Tokens Support

## Overview

Added support for PingOne's Opaque Refresh Tokens feature to the Unified OAuth Flow (V8U). This allows users to choose between JWT-based refresh tokens (default) and opaque refresh tokens for enhanced security.

## What are Opaque Refresh Tokens?

**JWT Refresh Tokens (Default):**
- Refresh tokens are JSON Web Tokens (JWTs) containing claims
- Can be validated locally without calling the authorization server
- Token contents can be inspected by decoding the JWT
- Standard OAuth 2.0 approach

**Opaque Refresh Tokens (More Secure):**
- Refresh tokens are opaque references (random strings)
- Must be validated by the authorization server via token introspection
- Token contents cannot be inspected or decoded
- Enhanced security as token data is not exposed
- Recommended for production environments

## Implementation

### New Component

**`RefreshTokenTypeDropdownV8`** (`src/v8/components/RefreshTokenTypeDropdownV8.tsx`)
- Dropdown component for selecting refresh token type
- Options: JWT (Default) or Opaque (More Secure)
- Educational tooltips explaining each option
- Automatically disabled when refresh tokens are not enabled
- Consistent styling with other V8 dropdowns

### Updated Interfaces

**`UnifiedFlowCredentials`** (`src/v8u/services/unifiedFlowIntegrationV8U.ts`)
```typescript
interface UnifiedFlowCredentials {
  // ... existing fields
  enableRefreshToken?: boolean;
  refreshTokenType?: 'JWT' | 'OPAQUE'; // NEW: Refresh token type
}
```

### Updated Components

1. **CredentialsFormV8U** (`src/v8u/components/CredentialsFormV8U.tsx`)
   - Added `refreshTokenType` state
   - Added `RefreshTokenTypeDropdownV8` component
   - Dropdown appears below "Enable Refresh Token" checkbox
   - Only visible when refresh tokens are enabled
   - Persists selection to localStorage

2. **UnifiedOAuthFlowV8U** (`src/v8u/flows/UnifiedOAuthFlowV8U.tsx`)
   - Loads `refreshTokenType` from flow-specific storage
   - Persists `refreshTokenType` with other credentials

3. **credentialReloadServiceV8U** (`src/v8u/services/credentialReloadServiceV8U.ts`)
   - Handles `refreshTokenType` during credential reload
   - Validates value is either 'JWT' or 'OPAQUE'

## Usage

### In the UI

1. Navigate to any OAuth flow in the Unified Flow (V8U)
2. In the credentials form, enable "Enable Refresh Token" checkbox
3. The "Refresh Token Type" dropdown will appear below
4. Select either:
   - **JWT (Default)** - Traditional JWT-based refresh tokens
   - **Opaque (More Secure)** - Opaque reference tokens
5. The selection is automatically saved and persisted

### In Code

```typescript
const credentials: UnifiedFlowCredentials = {
  environmentId: 'your-env-id',
  clientId: 'your-client-id',
  enableRefreshToken: true,
  refreshTokenType: 'OPAQUE', // or 'JWT'
  // ... other fields
};
```

## PingOne Configuration

To use opaque refresh tokens, the PingOne application must be configured to support them:

1. Go to PingOne Admin Console
2. Navigate to Applications → Your Application
3. Edit the application settings
4. In the Token Settings section, configure refresh token type
5. Save the application

**Note:** The actual API parameter name for PingOne may vary. Consult the [PingOne documentation](https://docs.pingidentity.com/pingone/applications/) for the exact configuration steps.

## Benefits

1. **Enhanced Security**: Opaque tokens cannot be decoded or inspected
2. **Reduced Token Size**: Opaque tokens are shorter than JWTs
3. **Centralized Control**: Token validation happens server-side
4. **Revocation**: Easier to revoke opaque tokens
5. **Compliance**: Better for regulatory requirements

## Default Behavior

- Default value: `JWT` (maintains backward compatibility)
- Only applies when `enableRefreshToken` is `true`
- Automatically persisted to localStorage
- Reloaded when returning to the flow

## Testing

1. Enable refresh tokens in any V8U flow
2. Select "Opaque (More Secure)" from the dropdown
3. Complete the OAuth flow
4. Verify the refresh token in the token response
5. Refresh the page and verify the selection persists

## Related Files

- `src/v8/components/RefreshTokenTypeDropdownV8.tsx` - New dropdown component
- `src/v8u/components/CredentialsFormV8U.tsx` - Updated credentials form
- `src/v8u/services/unifiedFlowIntegrationV8U.ts` - Updated interface
- `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` - Updated flow
- `src/v8u/services/credentialReloadServiceV8U.ts` - Updated reload service

## Future Enhancements

1. Add visual indicator in token display showing token type
2. Add token introspection support for opaque tokens
3. Add educational content explaining the differences
4. Add metrics/analytics for token type usage

## References

- [PingOne Applications Documentation](https://docs.pingidentity.com/pingone/applications/)
- [OAuth 2.0 Token Introspection (RFC 7662)](https://tools.ietf.org/html/rfc7662)
- [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
