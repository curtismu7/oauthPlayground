# Device Authorization Flow Implementation Guide

## Overview

This document outlines the implementation of the Device Authorization Grant (RFC 8628) in the OAuth Playground, specifically focusing on proper OAuth 2.0 vs OpenID Connect (OIDC) variant handling with PingOne's specific requirements.

## Table of Contents

1. [RFC 8628 Compliance](#rfc-8628-compliance)
2. [PingOne-Specific Requirements](#pingone-specific-requirements)
3. [OAuth vs OIDC Variants](#oauth-vs-oidc-variants)
4. [Implementation Details](#implementation-details)
5. [Scope Management](#scope-management)
6. [Token Response Handling](#token-response-handling)
7. [Educational Content](#educational-content)
8. [Testing Guidelines](#testing-guidelines)

## RFC 8628 Compliance

The Device Authorization Grant (RFC 8628) enables OAuth clients on input-constrained devices to obtain user authorization without a browser. This is perfect for:

- Smart TVs
- IoT devices
- CLI tools
- Gaming consoles
- Devices without browsers

### Standard Flow

1. **Device requests device code** - Device calls the device authorization endpoint
2. **User authorization** - User visits verification URI and enters user code
3. **Token retrieval** - Device polls token endpoint until authorization is complete

## PingOne-Specific Requirements

**Important**: PingOne has a specific requirement that **all flows must include the `openid` scope**, even for pure OAuth 2.0 flows. This is a PingOne-specific requirement that overrides standard RFC 8628 compliance.

### PingOne Requirements

- ✅ **All flows require `openid` scope** (including OAuth 2.0)
- ✅ **Consistent scopes for both variants**: `openid profile email`
- ✅ **OIDC-specific parameters** when OIDC variant is selected
- ✅ **Proper token response validation**

## OAuth vs OIDC Variants

### OAuth 2.0 Device Flow

**Purpose**: API authorization with user identity information

**Scopes**: `openid profile email`
- `openid`: Required by PingOne (non-standard requirement)
- `profile`: User profile information
- `email`: User email address

**Parameters**: Basic device authorization parameters
- `client_id`
- `scope`
- `client_secret` (if confidential client)

**Response**: 
- `access_token`: For API access
- `refresh_token`: For token renewal
- **No ID token** (OAuth 2.0 only)

### OIDC Device Flow

**Purpose**: User authentication + API authorization

**Scopes**: `openid profile email`
- `openid`: Required by OIDC specification
- `profile`: User profile information  
- `email`: User email address

**Parameters**: OIDC-specific parameters added
- All OAuth 2.0 parameters
- `nonce`: Generated for OIDC security
- `response_type`: Set to `code`
- `claims`: OIDC claims for user identity

**Response**:
- `access_token`: For API access
- `refresh_token`: For token renewal
- `id_token`: For user identity (OIDC-specific)

## Implementation Details

### File Structure

```
src/
├── pages/flows/DeviceAuthorizationFlowV7.tsx    # Main component
├── hooks/useDeviceAuthorizationFlow.ts          # Flow logic hook
└── services/deviceFlowService.ts                # Service layer
```

### Key Components

#### 1. Variant Selection

```typescript
const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>('oidc');

const handleVariantChange = useCallback((variant: 'oauth' | 'oidc') => {
    setSelectedVariant(variant);
    
    // Consistent scopes for both variants
    const updatedScopes = 'openid profile email';
    
    ensureCredentials({
        ...currentCredentials,
        scopes: updatedScopes
    });
}, [deviceFlow.credentials, ensureCredentials]);
```

#### 2. Device Authorization Request

```typescript
const params = new URLSearchParams({
    client_id: credentials.clientId,
    scope: credentials.scopes || 'openid profile email',
});

// Add OIDC-specific parameters if OIDC variant is selected
if (credentials.scopes && credentials.scopes.includes('openid')) {
    params.append('nonce', crypto.randomUUID());
    params.append('response_type', 'code');
    
    const oidcClaims = {
        id_token: {
            sub: { essential: true },
            email: { essential: true },
            email_verified: { essential: true },
            name: { essential: true }
        }
    };
    params.append('claims', JSON.stringify(oidcClaims));
}
```

#### 3. Token Response Validation

```typescript
// Validate response based on requested scopes (OAuth vs OIDC)
const isOIDCFlow = credentials.scopes && credentials.scopes.includes('openid');
if (isOIDCFlow && !data.id_token) {
    console.warn('OIDC flow requested but no ID token received');
} else if (!isOIDCFlow && data.id_token) {
    console.warn('OAuth 2.0 flow but ID token received (unexpected)');
}
```

## Scope Management

### Automatic Scope Enforcement

The implementation automatically ensures that all required scopes are present:

```typescript
onScopesChange={(newScopes) => {
    let finalScopes = newScopes;
    
    // Ensure consistent scopes for both OAuth 2.0 and OIDC variants
    if (!newScopes.includes('openid')) {
        finalScopes = `openid ${newScopes}`.trim();
        v4ToastManager.showInfo('Added "openid" scope (required by PingOne for all flows)');
    }
    if (!newScopes.includes('profile')) {
        finalScopes = `${finalScopes} profile`.trim();
        v4ToastManager.showInfo('Added "profile" scope');
    }
    if (!newScopes.includes('email')) {
        finalScopes = `${finalScopes} email`.trim();
        v4ToastManager.showInfo('Added "email" scope');
    }
    
    ensureCredentials({ scopes: finalScopes });
}}
```

### Scope Differences

| Variant | Scopes | Purpose |
|---------|--------|---------|
| OAuth 2.0 | `openid profile email` | API authorization + user info |
| OIDC | `openid profile email` | User authentication + API authorization |

## Token Response Handling

### OAuth 2.0 Response

```json
{
    "access_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "eyJ...",
    "scope": "openid profile email"
}
```

### OIDC Response

```json
{
    "access_token": "eyJ...",
    "token_type": "Bearer", 
    "expires_in": 3600,
    "refresh_token": "eyJ...",
    "id_token": "eyJ...",
    "scope": "openid profile email"
}
```

### Response Validation

The implementation validates that the response matches the expected variant:

- **OAuth 2.0**: Expects only `access_token` and `refresh_token`
- **OIDC**: Expects `access_token`, `refresh_token`, and `id_token`
- **Warnings**: Logs warnings for unexpected token types

## Educational Content

### User Interface

The implementation includes comprehensive educational content explaining:

1. **RFC 8628 Specification**: What the Device Authorization Grant is
2. **OAuth vs OIDC**: Differences between the two variants
3. **PingOne Requirements**: Specific requirements for PingOne implementation
4. **Flow Sequence**: Step-by-step explanation of the process
5. **Token Types**: What each token is used for

### Key Educational Points

- **Consistent Scopes**: Both variants use `openid profile email`
- **PingOne Requirement**: `openid` scope required for all flows
- **OIDC Parameters**: Additional parameters when OIDC variant selected
- **Token Differences**: OIDC includes ID token for user identity

## Testing Guidelines

### Test Scenarios

1. **OAuth 2.0 Variant**
   - Verify `openid profile email` scopes are used
   - Confirm only `access_token` and `refresh_token` received
   - Test API calls with access token

2. **OIDC Variant**
   - Verify `openid profile email` scopes are used
   - Confirm `access_token`, `refresh_token`, and `id_token` received
   - Test ID token validation and user info

3. **Scope Management**
   - Test automatic scope addition
   - Verify scope validation warnings
   - Test manual scope modification

4. **Error Handling**
   - Test invalid credentials
   - Test network errors
   - Test timeout scenarios

### Validation Checklist

- [ ] Both variants use consistent scopes
- [ ] OIDC variant includes additional parameters
- [ ] Token responses are properly validated
- [ ] Educational content is accurate
- [ ] Error handling works correctly
- [ ] Scope management functions properly

## Conclusion

The Device Authorization Flow implementation provides:

✅ **RFC 8628 Compliance**: Follows the Device Authorization Grant specification  
✅ **PingOne Compatibility**: Meets PingOne's specific requirements  
✅ **Consistent Scopes**: Uses `openid profile email` for both variants  
✅ **Proper Validation**: Validates token responses based on variant  
✅ **Educational Content**: Comprehensive user guidance  
✅ **Error Handling**: Robust error handling and user feedback  

This implementation ensures that users can properly test both OAuth 2.0 and OIDC device authorization flows while understanding the differences and requirements of each variant.



