# JWKS Migration Guide

This guide helps you migrate existing JWKS implementations to use the new reusable utilities.

## Overview

The JWKS functionality has been extracted into reusable utilities located in `src/utils/`. This migration guide shows how to update existing flows to use these utilities while maintaining backward compatibility.

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { discoveryService } from '../services/discoveryService';
import { jwksService } from '../services/jwksService';
```

**After:**
```typescript
import { validateJWT, discoverJWKS, createJWKSSet } from '../utils/jwks';
import { verifyJWTSignature } from '../utils/jwtValidation';
import { discoverOIDCConfiguration } from '../utils/oidcDiscovery';
import { JWKSCache } from '../utils/jwksCache';
```

### Step 2: Replace JWT Verification

#### Simple JWT Verification

**Before:**
```typescript
// Old approach in implicitFlowSecurity.ts
const JWKS = createRemoteJWKSet(new URL(config.jwks_uri));
const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: [expectedIssuerBase, expectedIssuerWithAs],
  audience: options.clientId,
  clockTolerance: 300
});
```

**After:**
```typescript
// New approach using extracted utilities
const result = await validateJWT(idToken, {
  jwksUri: config.jwks_uri
}, {
  issuer: [expectedIssuerBase, expectedIssuerWithAs],
  audience: options.clientId,
  clockTolerance: 300
});

if (!result.valid) {
  throw new Error(result.error);
}

const payload = result.payload;
```

#### Flow-Specific JWT Verification

**Before:**
```typescript
// Old approach with manual claim validation
const { payload } = await jwtVerify(idToken, JWKS, verifyOptions);

// Manual validation
const validationErrors: string[] = [];
if (!payload.sub) {
  validationErrors.push('Missing sub claim');
}
if (nonce && payload.nonce !== nonce) {
  validationErrors.push('Nonce validation failed');
}
```

**After:**
```typescript
// New approach with flow-specific validation
const result = await verifyJWTSignature(idToken, {
  jwksUri: config.jwks_uri
}, {
  flowType: 'implicit',
  issuer: expectedIssuer,
  audience: clientId,
  nonce: expectedNonce,
  requiredClaims: ['sub', 'iss', 'aud', 'exp', 'iat'],
  customValidators: [
    createClaimPresenceValidator('auth_time')
  ]
});

if (!result.valid) {
  const errors = [
    ...(result.flowValidation?.errors || []),
    ...(result.claimValidation?.missingClaims || []),
    ...(result.scopeValidation?.missingScopes || [])
  ];
  throw new Error(errors.join('; '));
}
```

### Step 3: Replace Discovery Logic

**Before:**
```typescript
// Old approach
const discoveryResult = await discoveryService.discoverConfiguration(environmentId);
if (!discoveryResult.success || !discoveryResult.configuration) {
  throw new Error('Failed to discover OpenID configuration');
}
const config = discoveryResult.configuration;
```

**After:**
```typescript
// New approach
const discovery = await discoverOIDCConfiguration({
  environmentId,
  useBackendProxy: true,
  enableFallback: true
});

if (!discovery.success || !discovery.configuration) {
  throw new Error('Failed to discover OIDC configuration');
}

const config = discovery.configuration;
```

### Step 4: Add Caching (Optional but Recommended)

**Before:**
```typescript
// Old approach - no caching or manual caching
const jwks = await fetch(jwksUri);
```

**After:**
```typescript
// New approach with automatic caching
const cache = new JWKSCache({ defaultTtl: 5 * 60 * 1000 });

// Check cache first
let cached = await cache.getJWKS(`jwks-${environmentId}`);
if (!cached) {
  // Fetch and cache
  const discovery = await discoverOIDCConfiguration({ environmentId });
  if (discovery.success && discovery.configuration) {
    const jwks = await fetchJWKS(discovery.configuration.jwks_uri);
    await cache.setJWKS(`jwks-${environmentId}`, jwks, discovery.configuration.jwks_uri);
    cached = await cache.getJWKS(`jwks-${environmentId}`);
  }
}
```

## Flow-Specific Migrations

### Implicit Flow Security (`src/utils/implicitFlowSecurity.ts`)

**Current Implementation:**
```typescript
export async function validateIdToken(
  idToken: string,
  options: ImplicitFlowSecurityOptions
): Promise<TokenValidationResult> {
  // Manual discovery
  const discoveryResult = await discoveryService.discoverConfiguration(options.environmentId);
  
  // Manual JWKS creation
  const JWKS = createRemoteJWKSet(new URL(config.jwks_uri));
  
  // Manual JWT verification
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: [expectedIssuerBase, expectedIssuerWithAs],
    audience: options.clientId,
    clockTolerance: 300
  });
  
  // Manual claim validation
  const validationErrors: string[] = [];
  // ... extensive manual validation
}
```

**Migrated Implementation:**
```typescript
import { verifyJWTSignature } from '../utils/jwtValidation';
import { discoverOIDCConfiguration } from '../utils/oidcDiscovery';

export async function validateIdToken(
  idToken: string,
  options: ImplicitFlowSecurityOptions
): Promise<TokenValidationResult> {
  try {
    // Use new discovery utility
    const discovery = await discoverOIDCConfiguration({
      environmentId: options.environmentId,
      useBackendProxy: true,
      enableFallback: true
    });

    if (!discovery.success || !discovery.configuration) {
      return { success: false, error: 'Failed to discover OIDC configuration' };
    }

    // Use new validation utility with flow-specific rules
    const result = await verifyJWTSignature(idToken, {
      jwksUri: discovery.configuration.jwks_uri
    }, {
      flowType: 'implicit',
      issuer: discovery.configuration.issuer,
      audience: options.clientId,
      nonce: options.expectedNonce,
      requiredClaims: ['sub', 'iss', 'aud', 'exp', 'iat'],
      customValidators: [
        createClaimPresenceValidator('auth_time'),
        createClaimValidator('azp', options.clientId)
      ]
    });

    if (!result.valid) {
      const errors = [
        ...(result.flowValidation?.errors || []),
        ...(result.claimValidation?.missingClaims || [])
      ];
      return { success: false, error: errors.join('; ') };
    }

    return {
      success: true,
      payload: result.payload,
      validatedClaims: result.claims
    };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### OAuth Utils (`src/utils/oauth.ts`)

**Current Implementation:**
```typescript
export const validateIdToken = async (
  idToken: string,
  clientId: string,
  issuer: string,
  nonce?: string,
  maxAge?: number,
  accessToken?: string
): Promise<IdTokenPayload> => {
  // Manual JWKS creation
  const JWKS = getJWKS(issuer);
  
  // Manual JWT verification
  const { payload, protectedHeader } = await jwtVerify(idToken, JWKS, verifyOptions);
  
  // Manual OIDC compliance validation
  // ... extensive manual validation
};
```

**Migrated Implementation:**
```typescript
import { verifyJWTSignature } from '../utils/jwtValidation';
import { buildJWKSUri } from '../utils/jwks';

export const validateIdToken = async (
  idToken: string,
  clientId: string,
  issuer: string,
  nonce?: string,
  maxAge?: number,
  accessToken?: string
): Promise<IdTokenPayload> => {
  try {
    // Use new validation utility
    const result = await verifyJWTSignature(idToken, {
      jwksUri: buildJWKSUri(issuer)
    }, {
      flowType: 'authorization_code',
      issuer: issuer,
      audience: clientId,
      nonce: nonce,
      maxAge: maxAge,
      accessToken: accessToken,
      requiredClaims: ['sub', 'iss', 'aud', 'exp', 'iat'],
      customValidators: [
        createClaimPresenceValidator('auth_time'),
        createClaimValidator('azp', clientId)
      ]
    });

    if (!result.valid) {
      const errors = [
        ...(result.flowValidation?.errors || []),
        ...(result.claimValidation?.missingClaims || [])
      ];
      throw new Error(errors.join('; '));
    }

    return result.payload as IdTokenPayload;

  } catch (error) {
    throw new Error(`ID token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
```

### JWKS Service (`src/services/jwksService.ts`)

**Current Implementation:**
```typescript
class JWKSService {
  async fetchJWKS(environmentId: string): Promise<JWKSResponse> {
    // Manual backend proxy logic
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://oauth-playground.vercel.app' 
      : 'http://localhost:3001';
    
    const jwksUri = `${backendUrl}/api/jwks?environment_id=${environmentId}`;
    
    // Manual caching logic
    const cached = this.getCachedJWKS(environmentId);
    if (cached) {
      return cached;
    }
    
    // Manual fetch and cache
    const response = await fetch(jwksUri, { /* ... */ });
    const jwks: JWKS = await response.json();
    
    this.cacheJWKS(environmentId, jwksResponse);
    return jwksResponse;
  }
}
```

**Migrated Implementation:**
```typescript
import { discoverOIDCConfiguration } from '../utils/oidcDiscovery';
import { JWKSCache } from '../utils/jwksCache';
import { validateJWKSStructure } from '../utils/jwks';

class JWKSService {
  private cache = new JWKSCache({ defaultTtl: 5 * 60 * 1000 });

  async fetchJWKS(environmentId: string): Promise<JWKSResponse> {
    try {
      // Use new discovery utility
      const discovery = await discoverOIDCConfiguration({
        environmentId,
        useBackendProxy: true,
        enableFallback: true
      });

      if (!discovery.success || !discovery.configuration) {
        throw new Error('Failed to discover OIDC configuration');
      }

      // Use new caching utility
      const cacheKey = `jwks-${environmentId}`;
      let cached = await this.cache.getJWKS(cacheKey);
      
      if (!cached) {
        // Fetch JWKS using backend proxy
        const jwksUri = `${getBackendUrl()}/api/jwks?environment_id=${environmentId}`;
        const response = await fetch(jwksUri, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
        }

        const jwks: JWKS = await response.json();
        
        // Validate JWKS structure
        const validation = validateJWKSStructure(jwks);
        if (!validation.valid) {
          throw new Error(`Invalid JWKS: ${validation.errors.join(', ')}`);
        }

        // Cache the JWKS
        await this.cache.setJWKS(cacheKey, jwks, jwksUri);
        cached = await this.cache.getJWKS(cacheKey);
      }

      if (!cached) {
        throw new Error('Failed to get JWKS from cache');
      }

      return {
        jwks: cached.data,
        jwks_uri: cached.jwksUri,
        issuer: discovery.configuration.issuer,
        lastUpdated: new Date(cached.timestamp)
      };

    } catch (error) {
      logger.error('JWKSService', 'Failed to fetch JWKS', error);
      throw error;
    }
  }
}
```

## Backward Compatibility

The new utilities are designed to be backward compatible. Existing code will continue to work, but you can gradually migrate to the new utilities for better maintainability and consistency.

### Wrapper Functions for Backward Compatibility

If you need to maintain backward compatibility, you can create wrapper functions:

```typescript
// Backward compatibility wrapper
export async function validateIdTokenLegacy(
  idToken: string,
  options: ImplicitFlowSecurityOptions
): Promise<TokenValidationResult> {
  // Use new utilities internally
  const result = await verifyJWTSignature(idToken, {
    jwksUri: await getJWKSUri(options.environmentId)
  }, {
    flowType: 'implicit',
    issuer: await getIssuer(options.environmentId),
    audience: options.clientId,
    nonce: options.expectedNonce
  });

  // Convert to legacy format
  return {
    success: result.valid,
    error: result.valid ? undefined : result.error,
    payload: result.payload,
    validatedClaims: result.claims
  };
}
```

## Testing Migration

Update your tests to use the new utilities:

**Before:**
```typescript
// Old test approach
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
  createRemoteJWKSet: vi.fn()
}));
```

**After:**
```typescript
// New test approach
vi.mock('../utils/jwks', () => ({
  validateJWT: vi.fn(),
  createJWKSSet: vi.fn()
}));

vi.mock('../utils/jwtValidation', () => ({
  verifyJWTSignature: vi.fn()
}));
```

## Benefits of Migration

1. **Consistency**: All flows use the same JWKS validation logic
2. **Maintainability**: Centralized JWKS functionality
3. **Performance**: Built-in caching and optimization
4. **Reliability**: Comprehensive error handling and fallback support
5. **Testability**: Well-tested utilities with comprehensive test coverage
6. **Extensibility**: Easy to add new flow types and validation rules

## Migration Checklist

- [ ] Update imports to use new utilities
- [ ] Replace `jwtVerify` calls with `validateJWT` or `verifyJWTSignature`
- [ ] Replace manual discovery with `discoverOIDCConfiguration`
- [ ] Add caching using `JWKSCache` or `LocalStorageJWKSCache`
- [ ] Update tests to mock new utilities
- [ ] Remove old manual validation logic
- [ ] Test all flows to ensure functionality is preserved
- [ ] Update documentation to reflect new implementation

## Support

If you encounter issues during migration, refer to:

1. **API Documentation**: `docs/JWKS_API_DOCUMENTATION.md`
2. **Test Examples**: `src/utils/__tests__/`
3. **Integration Examples**: See the documentation for complete examples

The new utilities are designed to be more robust and easier to use than the previous manual implementations.
