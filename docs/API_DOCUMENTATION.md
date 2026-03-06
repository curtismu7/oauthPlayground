# API Documentation Guide

## Overview

The OAuth Playground provides comprehensive API documentation and interactive testing capabilities for OAuth 2.0 and OpenID Connect flows using PingOne.

## 🚀 Available API Endpoints

### Authentication Endpoints

#### Authorization Code Flow
```typescript
// GET /pingone-auth/{environmentId}/as/authorize
// Parameters: response_type=code, client_id, redirect_uri, scope, state
const authUrl = `https://auth.pingone.com/${environmentId}/as/authorize?${queryParams}`;
```

#### Token Exchange
```typescript
// POST /api/token-exchange
// Content-Type: application/x-www-form-urlencoded
const tokenRequest = {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
  subject_token: 'access_token_or_refresh_token',
  subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
  requested_token_type: 'urn:ietf:params:oauth:token-type:refresh_token',
  scope: 'openid profile email'
};
```

#### Token Introspection
```typescript
// POST /api/introspect-token
const introspectRequest = {
  token: 'access_token_to_validate',
  token_type_hint: 'access_token'
};
```

### User Information Endpoints

#### UserInfo Endpoint
```typescript
// GET /pingone-api/{environmentId}/as/userinfo
// Headers: Authorization: Bearer {access_token}
const userInfo = await fetch(`https://api.pingone.com/${environmentId}/as/userinfo`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### JWKS Discovery

#### JWKS Endpoint
```typescript
// GET /pingone-api/{environmentId}/as/jwks
const jwks = await fetch(`https://api.pingone.com/${environmentId}/as/jwks`);
```

## 🧪 Interactive API Testing

### Token Exchange Flow Testing

The playground provides a complete RFC 8693 compliant token exchange interface:

```typescript
interface TokenExchangeRequest {
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange';
  subject_token: string;
  subject_token_type: 'access_token' | 'refresh_token' | 'id_token' | 'saml1' | 'saml2' | 'jwt';
  requested_token_type: 'access_token' | 'refresh_token' | 'id_token' | 'saml2' | 'jwt';
  scope?: string;
  resource?: string;
  audience?: string;
  actor_token?: string;
  actor_token_type?: string;
}
```

### Validation Services

#### Credential Validation
```typescript
import { ValidationServiceV8 } from './src/v8/services/validationServiceV8';

const result = ValidationServiceV8.validateCredentials(credentials, 'oidc');
if (!result.valid) {
  console.error('Validation errors:', result.errors);
  console.warn('Validation warnings:', result.warnings);
}
```

#### UUID Validation
```typescript
const uuidResult = ValidationServiceV8.validateUUID(environmentId, 'Environment ID');
if (!uuidResult.valid) {
  console.error('Invalid UUID format:', uuidResult.errors);
}
```

#### URL Validation
```typescript
const urlResult = ValidationServiceV8.validateUrl(redirectUri, 'redirect');
if (!urlResult.valid) {
  console.error('Invalid redirect URI:', urlResult.errors);
}
```

## 📊 Performance Monitoring

### Core Web Vitals Tracking

The playground includes real-time performance monitoring:

```typescript
import { performanceService } from './src/services/performanceService';

// Get current metrics
const metrics = performanceService.getMetrics();
console.log('FCP:', metrics.firstContentfulPaint);
console.log('LCP:', metrics.largestContentfulPaint);
console.log('FID:', metrics.firstInputDelay);
console.log('CLS:', metrics.cumulativeLayoutShift);

// Get performance grade
const grade = performanceService.getPerformanceGrade(); // A-F

// Get slowest chunks
const slowChunks = performanceService.getSlowestChunks(3);
```

### Bundle Analysis

```typescript
// Monitor chunk loading performance
const chunkLoads = performanceService.getChunkLoads();
const avgLoadTime = performanceService.getAverageChunkLoadTime();
```

## 🔧 Configuration Options

### Environment Variables

```bash
# PingOne Configuration
PINGONE_ENVIRONMENT_ID=your-environment-id
PINGONE_CLIENT_ID=your-client-id
PINGONE_CLIENT_SECRET=your-client-secret
PINGONE_REDIRECT_URI=https://localhost:3000/callback

# Application Configuration
VITE_APP_VERSION=9.15.2
PINGONE_APP_TITLE="OAuth Playground"
PINGONE_APP_DESCRIPTION="Interactive OAuth 2.0 & OpenID Connect Playground"
```

### Flow Configuration

Each OAuth flow can be configured with specific parameters:

```typescript
interface FlowConfig {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  responseType: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}
```

## 🧪 Testing Utilities

### Mock Services

The playground includes comprehensive mock services for testing:

```typescript
// Mock token service
import { tokenServiceV8 } from './src/v8/services/tokenServiceV8';

// Mock validation service
import { ValidationServiceV8 } from './src/v8/services/validationServiceV8';

// Mock API responses
const mockTokenResponse = {
  access_token: 'mock-access-token',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'openid profile email'
};
```

### Test Data Generators

```typescript
// Generate test credentials
const testCredentials = {
  environmentId: '123e4567-e89b-12d3-a456-426614174000',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'https://localhost:3000/callback',
  scopes: 'openid profile email'
};

// Generate test tokens
const testTokens = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  token_type: 'Bearer',
  expires_in: 3600
};
```

## 📚 Flow-Specific Documentation

### Authorization Code Flow (PKCE)

1. **Authorization Request**: Generate authorization URL with PKCE parameters
2. **Authorization Response**: Handle callback with authorization code
3. **Token Exchange**: Exchange code for access and refresh tokens
4. **Token Validation**: Validate received tokens

### Implicit Flow

1. **Authorization Request**: Generate authorization URL with response_type=token
2. **Token Response**: Handle tokens in URL fragment
3. **Token Validation**: Validate received tokens

### Resource Owner Password Credentials

1. **Token Request**: Direct token exchange with credentials
2. **Token Response**: Receive access and refresh tokens
3. **Token Validation**: Validate received tokens

### Client Credentials Flow

1. **Token Request**: Exchange client credentials for access token
2. **Token Response**: Receive access token
3. **API Access**: Use token for service-to-service calls

### Device Authorization Flow

1. **Device Code Request**: Request device code and user code
2. **User Authorization**: User authorizes on separate device
3. **Token Request**: Poll for token completion
4. **Token Validation**: Validate received tokens

## 🔐 Security Considerations

### Token Storage

```typescript
// Secure token storage
import { unifiedTokenStorageService } from './src/services/unifiedTokenStorageService';

// Store tokens securely
await unifiedTokenStorageService.storeTokens(tokens);

// Retrieve tokens
const storedTokens = await unifiedTokenStorageService.getTokens();

// Clear tokens
await unifiedTokenStorageService.clearTokens();
```

### CSRF Protection

```typescript
// Generate and validate state parameter
const state = generateRandomState();
localStorage.setItem('oauth_state', state);

// Validate state in callback
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('CSRF detected: State mismatch');
}
```

### PKCE Implementation

```typescript
// Generate PKCE parameters
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

// Store code verifier for token exchange
localStorage.setItem('pkce_code_verifier', codeVerifier);
```

## 📈 Performance Optimization

### Lazy Loading

Components are loaded on-demand for optimal performance:

```typescript
// Lazy loaded components with loading states
const AIAgentOverview = lazy(() => import('./pages/AIAgentOverview'));

// Usage with Suspense
<Suspense fallback={<LoadingFallback message="Loading AI Agent Overview..." />}>
  <AIAgentOverview />
</Suspense>
```

### Bundle Splitting

The application uses strategic code splitting:

- **Vendor chunks**: React, styled-components, and other libraries
- **Feature chunks**: OAuth flows, AI pages, documentation
- **Component chunks**: UI components grouped by functionality

### Caching Strategy

```typescript
// Service worker caching for API responses
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

## 🛠️ Development Tools

### Performance Monitoring

```typescript
// Enable performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceService.logPerformanceSummary();
}
```

### Debug Mode

```typescript
// Enable debug mode for detailed logging
const DEBUG_MODE = process.env.PINGONE_FEATURE_DEBUG_MODE === 'true';

if (DEBUG_MODE) {
  console.log('Debug mode enabled');
  // Additional debug logging
}
```

### Error Tracking

```typescript
// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to error tracking service
});
```

## 📖 Additional Resources

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [RFC 8693 - Token Exchange](https://tools.ietf.org/html/rfc8693)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)

## 🤝 Contributing

When contributing to the API documentation:

1. Ensure all examples are tested and working
2. Follow TypeScript best practices
3. Include error handling examples
4. Add performance considerations
5. Update relevant test cases

## 📞 Support

For API-related questions and support:

- Check the [Issues](https://github.com/curtismu7/oauthPlayground/issues) page
- Review the [Discussions](https://github.com/curtismu7/oauthPlayground/discussions) for community help
- Consult the PingOne [API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
