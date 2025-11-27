# JWT Client Authentication Implementation

## Overview

The unified flow acts as an OAuth client and generates JWT assertions for authenticating to PingOne's token endpoint using two methods:

1. **Client Secret JWT** (HS256) - Symmetric key authentication
2. **Private Key JWT** (RS256) - Asymmetric key authentication

## JWT Generation Process

### Step 1: Collect Credentials

Based on the authentication method:

#### Client Secret JWT
```typescript
const credentials = {
  clientId: string,
  clientSecret: string, // Required for HS256
  environmentId: string
};
```

#### Private Key JWT
```typescript
const credentials = {
  clientId: string,
  privateKey: string, // Required for RS256 (PKCS#8 format)
  environmentId: string
};
```

### Step 2: Create JWT Claims

The JWT contains these standard claims per RFC 7523:

```typescript
const claims = {
  iss: clientId,        // Issuer = client ID
  sub: clientId,        // Subject = client ID  
  aud: tokenEndpoint,   // Audience = PingOne token endpoint
  iat: now,            // Issued at (current timestamp)
  nbf: now,            // Not before (current timestamp)
  exp: now + 300,      // Expires in 5 minutes
  jti: generateRandomId() // Unique JWT ID
};
```

### Step 3: Sign the JWT

#### Client Secret JWT (HS256)
```typescript
import { SignJWT } from 'jose';

const secretKey = new TextEncoder().encode(clientSecret);
const jwt = await new SignJWT(claims)
  .setProtectedHeader({ alg: 'HS256' })
  .sign(secretKey);
```

#### Private Key JWT (RS256)
```typescript
import { SignJWT, importPKCS8 } from 'jose';

const privateKey = await importPKCS8(privateKey, 'RS256');
const jwt = await new SignJWT(claims)
  .setProtectedHeader({ alg: 'RS256' })
  .sign(privateKey);
```

### Step 4: Send to PingOne

The JWT is sent as a client assertion:

```typescript
const tokenRequest = {
  grant_type: 'client_credentials', // or other grant type
  client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: jwt, // The generated JWT
  // ... other parameters
};
```

## Implementation in Unified Flow

### 1. UI Configuration

The `TokenEndpointAuthMethodDropdownV8` component provides:
- Selection of authentication methods
- Security level indicators
- Appropriate input fields

### 2. Credential Collection

The `CredentialsFormV8U` component collects:
- Client ID (always required)
- Client Secret (for client_secret_jwt)
- Private Key (for private_key_jwt)

### 3. JWT Generation

The `createClientAssertion` function handles:
- JWT claim creation
- Signing with appropriate algorithm
- Error handling

### 4. API Integration

The integration services (e.g., `ClientCredentialsIntegrationServiceV8`) handle:
- Calling the JWT generation function
- Adding assertions to token requests
- Error handling and validation

## Security Considerations

### Client Secret JWT (HS256)
- **Pros**: Simple to implement, no key management overhead
- **Cons**: Shared secret, potential for secret leakage
- **Use Case**: Applications that can securely store client secrets

### Private Key JWT (RS256)
- **Pros**: No shared secrets, highest security, supports key rotation
- **Cons**: Complex key management, requires PKCS#8 format
- **Use Case**: Enterprise applications, high-security scenarios

## JWT Lifetime

- **Expiration**: 5 minutes (configurable)
- **Clock Skew**: Considered in validation
- **Renewal**: Automatic on each token request

## Error Handling

Common errors and solutions:

### Invalid Key Format
```typescript
// Error: Failed to import PKCS8 key
// Solution: Ensure private key is in PKCS#8 PEM format
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----`;
```

### Expired JWT
```typescript
// Error: JWT expired
// Solution: JWT is generated fresh for each request
```

### Invalid Audience
```typescript
// Error: Invalid audience
// Solution: Use correct PingOne token endpoint URL
const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
```

## Example Usage

### Complete Flow Example

```typescript
// 1. User selects authentication method
const authMethod = 'private_key_jwt';

// 2. User enters credentials
const credentials = {
  clientId: 'client-123456',
  privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
  environmentId: 'env-123456'
};

// 3. Generate JWT assertion
const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
const assertion = await createClientAssertion(
  credentials.clientId,
  tokenEndpoint,
  credentials.privateKey,
  'RS256'
);

// 4. Send token request
const tokenResponse = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: assertion,
    scope: 'openid profile'
  })
});
```

## Standards Compliance

The implementation follows these standards:
- **RFC 7523**: JWT Profile for OAuth 2.0 Client Authentication
- **RFC 7515**: JSON Web Signature (JWS)
- **RFC 7519**: JSON Web Token (JWT)
- **OIDC Core 1.0**: Section 9 Client Authentication

## Testing and Validation

### JWT Decoding Example
You can decode the generated JWT at https://jwt.io to verify:

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
{
  "iss": "client-123456",
  "sub": "client-123456", 
  "aud": "https://auth.pingone.com/env-123456/as/token",
  "iat": 1700912345,
  "nbf": 1700912345,
  "exp": 1700912645,
  "jti": "abc123def456"
}
```

### PingOne Validation
PingOne validates:
- JWT signature using registered keys
- Claims (iss, sub, aud, exp, etc.)
- Token endpoint URL matches audience

## Best Practices

1. **Key Storage**: Store private keys securely
2. **Key Rotation**: Implement key rotation for production
3. **Error Logging**: Log JWT generation errors securely
4. **Token Caching**: Cache access tokens appropriately
5. **Monitoring**: Monitor JWT expiration and renewal

## Troubleshooting

### Common Issues

1. **"invalid_client"**: Check JWT signature and claims
2. **"invalid_grant"**: Verify token endpoint URL
3. **"expired_token"**: JWT expired (shouldn't happen with 5min expiry)
4. **"key_not_found"**: For private_key_jwt, ensure key is registered in PingOne

### Debug Steps

1. Decode the JWT to verify claims
2. Check token endpoint URL format
3. Verify client ID matches PingOne application
4. For private_key_jwt, ensure key is uploaded to PingOne
5. Check system clock synchronization
