# JWKS API Documentation

This document provides comprehensive documentation for the extracted JWKS (JSON Web Key Set) utilities that can be reused across all authentication flows in the OAuth Playground.

## Overview

The JWKS utilities have been extracted into reusable modules that provide:

- **JWT signature verification** using remote JWKS endpoints
- **JWKS discovery and caching** for optimal performance
- **OIDC configuration discovery** with fallback support
- **Comprehensive JWT validation** with flow-specific rules
- **Flexible caching strategies** (in-memory and localStorage)

## Core Modules

### 1. `src/utils/jwks.ts` - Core JWKS Functionality

The main module providing essential JWKS operations.

#### Key Interfaces

```typescript
interface JWKSConfig {
  jwksUri: string;
  cacheTimeout?: number;
  cacheTolerance?: number;
  requestTimeout?: number;
  backendProxyUrl?: string;
}

interface TokenValidationOptions {
  issuer?: string | string[];
  audience?: string | string[];
  clockTolerance?: number;
  algorithms?: string[];
  nonce?: string;
  maxAge?: number;
  accessToken?: string;
}

interface ValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  header?: any;
  error?: string;
  claims?: Record<string, any>;
}
```

#### Main Functions

##### `discoverJWKS(discoveryEndpoint: string): Promise<string>`

Discovers the JWKS endpoint from an OIDC discovery document.

```typescript
import { discoverJWKS } from '../utils/jwks';

const jwksUri = await discoverJWKS('https://auth.pingone.com/test/as/.well-known/openid_configuration');
console.log(jwksUri); // https://auth.pingone.com/test/as/jwks
```

##### `validateJWT(token: string, config: JWKSConfig, options?: TokenValidationOptions): Promise<ValidationResult>`

Validates a JWT token using JWKS signature verification.

```typescript
import { validateJWT } from '../utils/jwks';

const result = await validateJWT(token, {
  jwksUri: 'https://auth.pingone.com/test/as/jwks'
}, {
  issuer: 'https://auth.pingone.com/test/as',
  audience: 'my-client-id',
  clockTolerance: 300,
  nonce: 'expected-nonce'
});

if (result.valid) {
  console.log('Token is valid:', result.payload);
} else {
  console.error('Token validation failed:', result.error);
}
```

##### `decodeJWTHeader(token: string): any`

Decodes JWT header without verification.

```typescript
import { decodeJWTHeader } from '../utils/jwks';

const header = decodeJWTHeader(token);
console.log('Algorithm:', header.alg);
console.log('Key ID:', header.kid);
```

##### `decodeJWTPayload(token: string): JWTPayload`

Decodes JWT payload without verification.

```typescript
import { decodeJWTPayload } from '../utils/jwks';

const payload = decodeJWTPayload(token);
console.log('Issuer:', payload.iss);
console.log('Subject:', payload.sub);
console.log('Expires:', new Date(payload.exp * 1000));
```

##### `validateJWKSStructure(jwks: any): { valid: boolean; errors: string[] }`

Validates JWKS structure according to RFC 7517.

```typescript
import { validateJWKSStructure } from '../utils/jwks';

const validation = validateJWKSStructure(jwks);
if (!validation.valid) {
  console.error('JWKS validation errors:', validation.errors);
}
```

### 2. `src/utils/jwtValidation.ts` - Extended JWT Validation

Provides flow-specific JWT validation with custom validators.

#### Key Interfaces

```typescript
interface ExtendedValidationOptions extends TokenValidationOptions {
  flowType?: 'authorization_code' | 'implicit' | 'hybrid' | 'client_credentials' | 'device_code';
  requiredClaims?: string[];
  requiredScopes?: string[];
  customValidators?: Array<(payload: JWTPayload) => string | null>;
}

interface ExtendedValidationResult extends ValidationResult {
  flowValidation?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  claimValidation?: {
    valid: boolean;
    missingClaims: string[];
    invalidClaims: string[];
  };
  scopeValidation?: {
    valid: boolean;
    missingScopes: string[];
    availableScopes: string[];
  };
}
```

#### Main Functions

##### `verifyJWTSignature(token: string, config: JWKSConfig, options: ExtendedValidationOptions): Promise<ExtendedValidationResult>`

Performs comprehensive JWT validation with flow-specific rules.

```typescript
import { verifyJWTSignature } from '../utils/jwtValidation';

const result = await verifyJWTSignature(token, {
  jwksUri: 'https://auth.pingone.com/test/as/jwks'
}, {
  flowType: 'authorization_code',
  issuer: 'https://auth.pingone.com/test/as',
  audience: 'my-client-id',
  requiredClaims: ['sub', 'iss', 'aud', 'exp'],
  requiredScopes: ['openid', 'profile'],
  customValidators: [
    createClaimValidator('acr', 'urn:mace:incommon:iap:silver'),
    createClaimPresenceValidator('auth_time')
  ]
});

if (result.valid) {
  console.log('Token is valid for authorization code flow');
  console.log('Available scopes:', result.scopeValidation?.availableScopes);
} else {
  console.error('Validation failed:', result.flowValidation?.errors);
}
```

##### Custom Validator Functions

```typescript
import {
  createClaimValidator,
  createClaimPresenceValidator,
  createClaimTypeValidator,
  createNumericRangeValidator,
  createStringPatternValidator
} from '../utils/jwtValidation';

// Validate specific claim value
const issuerValidator = createClaimValidator('iss', 'https://auth.pingone.com/test/as');

// Validate claim presence
const subValidator = createClaimPresenceValidator('sub');

// Validate claim type
const expValidator = createClaimTypeValidator('exp', 'number');

// Validate numeric range
const iatValidator = createNumericRangeValidator('iat', 1000000000, 2000000000);

// Validate string pattern
const issValidator = createStringPatternValidator('iss', /^https:\/\/auth\.pingone\.com/);
```

### 3. `src/utils/jwksCache.ts` - Caching Layer

Provides flexible caching strategies for JWKS data.

#### Key Classes

##### `JWKSCache` - In-Memory Cache

```typescript
import { JWKSCache } from '../utils/jwksCache';

const cache = new JWKSCache({
  defaultTtl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  cleanupInterval: 60 * 1000, // 1 minute
  enableStats: true
});

// Set JWKS data
await cache.setJWKS('env-123', jwks, 'https://auth.pingone.com/env-123/as/jwks');

// Get JWKS data
const cached = await cache.getJWKS('env-123');
if (cached) {
  console.log('Cached JWKS:', cached.data);
  console.log('Key statistics:', cached.keyStats);
}

// Get cache statistics
const stats = cache.getStats();
console.log('Cache hit rate:', stats.hitRate);
console.log('Cache size:', stats.size);
```

##### `LocalStorageJWKSCache` - Browser Storage Cache

```typescript
import { LocalStorageJWKSCache } from '../utils/jwksCache';

const cache = new LocalStorageJWKSCache('jwks_cache_', 5 * 60 * 1000);

// Set JWKS data
await cache.set('env-123', jwks, 'https://auth.pingone.com/env-123/as/jwks');

// Get JWKS data
const cached = await cache.get('env-123');
```

### 4. `src/utils/oidcDiscovery.ts` - OIDC Discovery

Handles OIDC configuration discovery with fallback support.

#### Key Interfaces

```typescript
interface DiscoveryOptions {
  environmentId: string;
  region?: string;
  useBackendProxy?: boolean;
  backendProxyUrl?: string;
  timeout?: number;
  enableFallback?: boolean;
}

interface DiscoveryResult {
  success: boolean;
  configuration?: OIDCConfiguration;
  error?: string;
  environmentId?: string;
  region?: string;
  fallback?: boolean;
}
```

#### Main Functions

##### `discoverOIDCConfiguration(options: DiscoveryOptions): Promise<DiscoveryResult>`

Discovers OIDC configuration with automatic fallback.

```typescript
import { discoverOIDCConfiguration } from '../utils/oidcDiscovery';

const result = await discoverOIDCConfiguration({
  environmentId: '12345678-1234-1234-1234-123456789abc',
  region: 'us',
  useBackendProxy: true,
  enableFallback: true
});

if (result.success) {
  console.log('Discovery successful:', result.configuration);
  console.log('JWKS URI:', result.configuration?.jwks_uri);
  console.log('Using fallback:', result.fallback);
} else {
  console.error('Discovery failed:', result.error);
}
```

##### `fetchWithRetry(url: string, options?: RequestInit & { timeout?: number; retries?: number }): Promise<Response>`

Fetches with automatic retry and exponential backoff.

```typescript
import { fetchWithRetry } from '../utils/oidcDiscovery';

const response = await fetchWithRetry('https://auth.pingone.com/test/as/.well-known/openid_configuration', {
  timeout: 10000,
  retries: 3
});
```

## Integration Examples

### Example 1: Basic JWT Validation

```typescript
import { validateJWT } from '../utils/jwks';
import { discoverOIDCConfiguration } from '../utils/oidcDiscovery';

async function validateToken(token: string, environmentId: string, clientId: string) {
  // Discover OIDC configuration
  const discovery = await discoverOIDCConfiguration({
    environmentId,
    useBackendProxy: true,
    enableFallback: true
  });

  if (!discovery.success || !discovery.configuration) {
    throw new Error('Failed to discover OIDC configuration');
  }

  // Validate JWT
  const result = await validateJWT(token, {
    jwksUri: discovery.configuration.jwks_uri
  }, {
    issuer: discovery.configuration.issuer,
    audience: clientId,
    clockTolerance: 300
  });

  return result;
}
```

### Example 2: Flow-Specific Validation

```typescript
import { verifyJWTSignature } from '../utils/jwtValidation';
import { createClaimValidator, createClaimPresenceValidator } from '../utils/jwtValidation';

async function validateIdTokenForImplicitFlow(
  idToken: string, 
  environmentId: string, 
  clientId: string,
  expectedNonce: string
) {
  const discovery = await discoverOIDCConfiguration({ environmentId });
  
  if (!discovery.success || !discovery.configuration) {
    throw new Error('Discovery failed');
  }

  const result = await verifyJWTSignature(idToken, {
    jwksUri: discovery.configuration.jwks_uri
  }, {
    flowType: 'implicit',
    issuer: discovery.configuration.issuer,
    audience: clientId,
    nonce: expectedNonce,
    requiredClaims: ['sub', 'iss', 'aud', 'exp', 'iat', 'nonce'],
    customValidators: [
      createClaimPresenceValidator('auth_time'),
      createClaimValidator('azp', clientId) // Authorized party
    ]
  });

  return result;
}
```

### Example 3: Cached JWKS Validation

```typescript
import { JWKSCache } from '../utils/jwksCache';
import { validateJWT } from '../utils/jwks';

const cache = new JWKSCache({ defaultTtl: 5 * 60 * 1000 });

async function validateTokenWithCache(token: string, environmentId: string) {
  const cacheKey = `jwks-${environmentId}`;
  
  // Try to get from cache first
  let cached = await cache.getJWKS(cacheKey);
  
  if (!cached) {
    // Fetch and cache JWKS
    const discovery = await discoverOIDCConfiguration({ environmentId });
    if (discovery.success && discovery.configuration) {
      // In a real implementation, you would fetch the actual JWKS here
      const jwks = await fetchJWKS(discovery.configuration.jwks_uri);
      await cache.setJWKS(cacheKey, jwks, discovery.configuration.jwks_uri);
      cached = await cache.getJWKS(cacheKey);
    }
  }

  if (!cached) {
    throw new Error('Failed to get JWKS');
  }

  // Validate token using cached JWKS
  const result = await validateJWT(token, {
    jwksUri: cached.jwksUri
  });

  return result;
}
```

### Example 4: Custom Validator for Business Logic

```typescript
import { verifyJWTSignature } from '../utils/jwtValidation';

async function validateTokenForSpecificUseCase(token: string, config: JWKSConfig) {
  // Custom validator for business logic
  const businessValidator = (payload: JWTPayload) => {
    // Check if user has required role
    if (!payload.roles || !Array.isArray(payload.roles)) {
      return 'Missing roles claim';
    }
    
    if (!payload.roles.includes('admin') && !payload.roles.includes('user')) {
      return 'User does not have required role';
    }
    
    // Check if user is in allowed organization
    if (payload.org_id !== 'allowed-org-123') {
      return 'User not in allowed organization';
    }
    
    return null; // Valid
  };

  const result = await verifyJWTSignature(token, config, {
    flowType: 'authorization_code',
    requiredClaims: ['sub', 'iss', 'aud', 'exp', 'roles', 'org_id'],
    customValidators: [businessValidator]
  });

  return result;
}
```

## Error Handling

All functions provide comprehensive error handling with detailed error messages:

```typescript
try {
  const result = await validateJWT(token, config, options);
  
  if (!result.valid) {
    console.error('Validation failed:', result.error);
    // Handle validation failure
  }
} catch (error) {
  console.error('Unexpected error:', error);
  // Handle unexpected errors
}
```

## Performance Considerations

1. **Caching**: Use `JWKSCache` or `LocalStorageJWKSCache` to avoid repeated JWKS fetches
2. **Backend Proxy**: Use backend proxy for CORS handling in production
3. **Fallback Configuration**: Enable fallback for better reliability
4. **Retry Logic**: Built-in retry with exponential backoff for network resilience

## Testing

Comprehensive test suites are provided for all modules:

```bash
# Run JWKS tests
npm test src/utils/__tests__/jwks.test.ts

# Run JWT validation tests
npm test src/utils/__tests__/jwtValidation.test.ts

# Run cache tests
npm test src/utils/__tests__/jwksCache.test.ts

# Run discovery tests
npm test src/utils/__tests__/oidcDiscovery.test.ts
```

## Migration Guide

To migrate existing JWKS code to use the new utilities:

1. **Replace direct jose usage** with `validateJWT` or `verifyJWTSignature`
2. **Replace manual JWKS fetching** with `discoverOIDCConfiguration`
3. **Add caching** using `JWKSCache` or `LocalStorageJWKSCache`
4. **Use flow-specific validation** with `verifyJWTSignature` and `flowType`

## Future Enhancements

The extracted utilities are designed to be extensible:

- **Additional flow types** can be added to `ExtendedValidationOptions`
- **Custom cache backends** can be implemented by extending the cache interfaces
- **Additional validation rules** can be added through custom validators
- **Performance optimizations** can be added without breaking the API

This modular approach ensures that JWKS functionality can be easily reused across all authentication flows while maintaining consistency and reliability.

