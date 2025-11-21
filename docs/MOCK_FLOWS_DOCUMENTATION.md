# Mock Flows Documentation

**Educational simulations and testing flows for OAuth/OIDC learning**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What are Mock Flows?](#what-are-mock-flows)
3. [Available Mock Flows](#available-mock-flows)
4. [Mock Flow Architecture](#mock-flow-architecture)
5. [Use Cases](#use-cases)
6. [Implementation Guide](#implementation-guide)
7. [Best Practices](#best-practices)
8. [Differences from Real Flows](#differences-from-real-flows)

---

## Overview

Mock Flows are **educational simulations** of OAuth/OIDC flows that don't require actual authorization server connections. They're designed for:

- **Learning** - Understanding flow mechanics without setup
- **Testing** - Validating UI and logic without backend
- **Demonstrations** - Showing flows when servers are unavailable
- **Development** - Building features before backend is ready

---

## What are Mock Flows?

### Definition

Mock Flows simulate OAuth/OIDC authentication and authorization flows using:
- **Simulated API responses** - No real network calls
- **Generated mock tokens** - JWT-like structures for learning
- **Delayed responses** - Realistic timing simulation
- **Educational annotations** - Clear indicators of mock behavior

### Key Characteristics

| Aspect | Mock Flows | Real Flows |
|--------|------------|------------|
| **Network Calls** | Simulated | Actual HTTP requests |
| **Tokens** | Generated locally | Issued by auth server |
| **Validation** | Educational only | Cryptographic verification |
| **Setup Required** | None - Pre-filled defaults | Credentials needed |
| **Credentials** | Mock defaults provided | User must configure |
| **Purpose** | Learning/Testing | Production use |

---

## Available Mock Flows

### 1. Mock OIDC Resource Owner Password Flow
**File**: `MockOIDCResourceOwnerPasswordFlow.tsx`

**Purpose**: Educational demonstration of deprecated ROPC flow

**Features**:
- Simulates direct credential exchange
- Generates mock ID tokens
- Shows why flow is deprecated
- Demonstrates OIDC extensions
- Includes security warnings

**Use Cases**:
- Learning about deprecated flows
- Understanding security risks
- Comparing with modern flows
- Educational presentations

**Default Credentials** (Pre-filled):
```typescript
const mockCredentials = {
  clientId: 'mock-client-id-12345',
  clientSecret: 'mock-client-secret-67890',
  environmentId: 'mock-environment-id',
  username: 'mock.user@example.com',
  password: 'MockPassword123!',
  redirectUri: 'https://localhost:3000/callback'
};
```

**Mock Behavior**:
```typescript
// Simulates token request
const mockTokenResponse = {
  access_token: "mock_access_token_" + Date.now(),
  id_token: "mock_id_token_" + Date.now(),
  token_type: "Bearer",
  expires_in: 3600,
  _mock: true,  // Indicator
  _note: "Educational simulation only"
};
```

---

### 2. OAuth Authorization Code Flow V7 Condensed Mock
**File**: `OAuthAuthorizationCodeFlowV7_Condensed_Mock.tsx`

**Purpose**: Streamlined mock of authorization code flow

**Features**:
- 4-section condensed structure
- Variant selector (OAuth vs OIDC)
- Quick info cards
- Comparison tables
- Simplified educational content

**Use Cases**:
- Quick demonstrations
- Mobile-friendly learning
- Reduced cognitive load
- Fast prototyping

**Structure**:
```
1. Quick Start & Overview (Always Expanded)
   - Variant selector
   - Key differences
   - Use cases

2. Configuration & Setup (Collapsible)
   - All configuration in one place
   - Advanced parameters
   - Requirements

3. Flow Execution (Interactive)
   - Step-by-step with inline API calls
   - All request/response sections

4. Results & Analysis (Auto-expands)
   - Token display
   - Security notes
   - Next steps
```

---

### 3. V7 Condensed Mock
**File**: `V7CondensedMock.tsx`

**Purpose**: Prototype for condensed V7 flow structure

**Features**:
- Demonstrates 4-section approach
- Shows benefits of condensation
- Compares with current structure
- Educational about flow organization

**Use Cases**:
- Flow structure planning
- UI/UX improvements
- Documentation of approach
- Team discussions

---

### 4. Test Mock
**File**: `TestMock.tsx`

**Purpose**: Simple routing test page

**Features**:
- Minimal implementation
- Routing verification
- Development testing

**Use Cases**:
- Verifying routing works
- Quick development tests
- Placeholder during development

---

### 5. SAML Bearer Assertion Flow V7 (Mock Mode)
**File**: `SAMLBearerAssertionFlowV7.tsx`

**Purpose**: Educational SAML-to-OAuth simulation

**Features**:
- Generates mock SAML assertions
- Simulates token exchange
- Creates realistic JWT tokens
- Includes SAML attributes in tokens
- Educational annotations

**Default Credentials** (Pre-filled):
```typescript
const mockCredentials = {
  environmentId: 'mock-environment-id',
  clientId: 'mock-saml-bearer-client',
  tokenEndpoint: 'https://auth.mock.pingone.com/mock-environment/as/token',
  identityProvider: 'Mock Identity Provider Co.'
};
```

**Mock Behavior**:
```typescript
// Generates mock SAML assertion
const mockSAML = SAMLAssertionService.generateSAMLAssertion({
  issuer: 'https://idp.mock.pingone.com/mock-environment',
  subject: 'mock.user@example.com',
  audience: 'https://auth.mock.pingone.com/mock-environment/as/token',
  attributes: {
    email: 'mock.user@example.com',
    given_name: 'Mock',
    family_name: 'User',
    role: 'API Administrator'
  }
});

// Simulates token exchange
const mockAccessToken = generateMockJWT({
  sub: 'mock.user@example.com',
  saml_attributes: samlAttributes,
  _mock: true
});
```

**Use Cases**:
- Learning SAML-OAuth integration
- Understanding assertion structure
- Testing without SAML IdP
- Educational demonstrations

---

### 6. Device Flow (Mock Mode)
**File**: `DeviceFlow.tsx`

**Purpose**: Device authorization with mock fallback

**Features**:
- Real flow with mock credentials
- Simulated token storage
- Mock token generation
- Educational device code display

**Default Credentials** (Pre-filled):
```typescript
const mockCredentials = {
  clientId: 'mock_device_client_id_demo_12345',
  clientSecret: 'mock_device_client_secret_demo_67890',
  environmentId: 'b9817c16-9910-4415-b67e-4ac687da74d9',
  scope: 'openid profile email'
};
```

**Mock Behavior**:
```typescript
const mockTokens = {
  access_token: `mock_access_token_${Date.now()}`,
  id_token: `mock_id_token_${Date.now()}`,
  token_type: 'Bearer',
  expires_in: 3600
};

// Store using standardized method
storeOAuthTokens(mockTokens, 'device', 'Device Flow');
```

---

## Mock Flow Architecture

### Component Structure

```
Mock Flow
├── Educational Warnings
│   └── Clear indicators this is mock
├── Simulated Configuration
│   └── Pre-filled mock credentials
├── Mock API Calls
│   ├── Simulated delays
│   ├── Generated responses
│   └── Realistic timing
├── Mock Token Generation
│   ├── JWT-like structure
│   ├── Realistic claims
│   └── Mock signatures
└── Educational Annotations
    ├── Why it's mock
    ├── What's different
    └── Learning points
```

### Mock Token Structure

```typescript
// Mock JWT Access Token
{
  // Header
  alg: 'RS256',
  typ: 'JWT',
  kid: 'mock-key-id'
}
{
  // Payload
  iss: 'https://auth.mock.pingone.com',
  sub: 'mock-user-id',
  aud: 'mock-client-id',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  scope: 'openid profile email',
  _mock: true,  // Mock indicator
  _note: 'Educational simulation only'
}
{
  // Signature (mock)
  mock_signature_base64url
}
```

### Simulation Patterns

#### Pattern 1: Network Delay Simulation
```typescript
const simulateNetworkCall = async () => {
  setIsLoading(true);
  try {
    // Simulate realistic network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock response
    const mockResponse = generateMockResponse();
    
    return mockResponse;
  } finally {
    setIsLoading(false);
  }
};
```

#### Pattern 2: Mock Token Generation
```typescript
const generateMockToken = (type: 'access' | 'id') => {
  const header = btoa(JSON.stringify({
    alg: 'RS256',
    typ: 'JWT',
    kid: `mock-${type}-key`
  }));
  
  const payload = btoa(JSON.stringify({
    sub: 'mock-user-id',
    iss: 'https://auth.mock.pingone.com',
    aud: 'mock-client-id',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    _mock: true
  }));
  
  const signature = 'mock_sig_' + Math.random().toString(36).substr(2, 43);
  
  return `${header}.${payload}.${signature}`;
};
```

#### Pattern 3: Educational Warnings
```typescript
<InfoBox type="warning">
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <strong>⚠️ This is a Mock Implementation</strong>
    <span>
      This flow simulates the behavior for educational purposes. 
      No real authentication occurs.
    </span>
  </div>
</InfoBox>
```

---

## Use Cases

### 1. Learning & Education

**Scenario**: New developer learning OAuth flows

**Benefits**:
- No setup required
- Immediate feedback
- Safe experimentation
- Clear educational content

**Example**:
```typescript
// Student can immediately see flow without credentials
<MockOIDCResourceOwnerPasswordFlow />
// Shows complete flow with educational annotations
```

### 2. Development & Testing

**Scenario**: Building UI before backend is ready

**Benefits**:
- Parallel development
- UI testing without backend
- Rapid prototyping
- Consistent test data

**Example**:
```typescript
// Developer can build token display UI
const mockTokens = generateMockTokens();
<TokenDisplay tokens={mockTokens} />
```

### 3. Demonstrations & Presentations

**Scenario**: Showing flows in presentations

**Benefits**:
- No network dependency
- Consistent behavior
- Fast execution
- No credential exposure

**Example**:
```typescript
// Demo flows work offline
<SAMLBearerAssertionFlowV7 mockMode={true} />
```

### 4. Documentation & Examples

**Scenario**: Creating flow documentation

**Benefits**:
- Self-contained examples
- Reproducible results
- Clear flow visualization
- No external dependencies

---

## Implementation Guide

### Creating a New Mock Flow

#### Step 1: Create Mock Flow File

```typescript
// src/pages/flows/MyMockFlow.tsx
import React, { useState } from 'react';
import { InfoBox } from '../../components/steps/CommonSteps';

// IMPORTANT: Pre-fill with mock credentials
const DEFAULT_MOCK_CREDENTIALS = {
  clientId: 'mock-client-id-12345',
  clientSecret: 'mock-client-secret-67890',
  environmentId: 'mock-environment-id',
  redirectUri: 'https://localhost:3000/callback',
  scope: 'openid profile email'
};

export const MyMockFlow: React.FC = () => {
  // Initialize with default mock credentials
  const [credentials, setCredentials] = useState(DEFAULT_MOCK_CREDENTIALS);
  const [tokens, setTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleMockExecution = async () => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock tokens
    const mockTokens = {
      access_token: generateMockToken('access'),
      id_token: generateMockToken('id'),
      token_type: 'Bearer',
      expires_in: 3600,
      _mock: true,
      _note: 'Educational simulation only'
    };
    
    setTokens(mockTokens);
    setIsLoading(false);
  };
  
  return (
    <div>
      <InfoBox type="warning">
        <strong>⚠️ Mock Implementation</strong>
        <p>This is an educational simulation.</p>
      </InfoBox>
      
      <button onClick={handleMockExecution} disabled={isLoading}>
        {isLoading ? 'Simulating...' : 'Execute Mock Flow'}
      </button>
      
      {tokens && (
        <div>
          <h3>Mock Tokens Generated</h3>
          <pre>{JSON.stringify(tokens, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

#### Step 2: Add Mock Indicators

```typescript
// Always indicate mock behavior
const MockBadge = styled.span`
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
`;

<MockBadge>🎓 MOCK FLOW</MockBadge>
```

#### Step 3: Generate Realistic Mock Data

```typescript
const generateMockUserInfo = () => ({
  sub: 'mock-user-' + Math.random().toString(36).substr(2, 9),
  email: 'mock.user@example.com',
  given_name: 'Mock',
  family_name: 'User',
  name: 'Mock User',
  picture: 'https://via.placeholder.com/150',
  _mock: true
});
```

#### Step 4: Add Educational Content

```typescript
<CollapsibleSection title="Why This is Mock">
  <ul>
    <li>No real authentication server connection</li>
    <li>Tokens are generated locally</li>
    <li>No cryptographic validation</li>
    <li>For educational purposes only</li>
  </ul>
</CollapsibleSection>
```

---

## Best Practices

### 1. Pre-fill Default Credentials

✅ **DO**: Always provide default mock credentials
```typescript
// Pre-fill credentials so users can immediately try the flow
const DEFAULT_MOCK_CREDENTIALS = {
  clientId: 'mock-client-id-12345',
  clientSecret: 'mock-client-secret-67890',
  environmentId: 'mock-environment-id',
  redirectUri: 'https://localhost:3000/callback'
};

const [credentials, setCredentials] = useState(DEFAULT_MOCK_CREDENTIALS);
```

❌ **DON'T**: Require users to enter credentials
```typescript
// Don't start with empty credentials in mock flows
const [credentials, setC

### 2. Realistic Simulation

✅ **DO**: Simulate realistic timing and behavior
```typescript
// Simulate network delay
await new Promise(resolve => setTimeout(resolve, 2000));

// Generate realistic-looking tokens
const token = generateRealisticJWT();
```

❌ **DON'T**: Instant responses or unrealistic data
```typescript
// Don't return immediately
const tokens = { access_token: 'abc123' };  // Too simple!
```

### 3. Educational Value

✅ **DO**: Include learning content
```typescript
<CollapsibleSection title="How This Flow Works">
  <p>Step 1: Client sends credentials...</p>
  <p>Step 2: Server validates...</p>
  <p>Step 3: Tokens are issued...</p>
</CollapsibleSection>
```

❌ **DON'T**: Just simulate without teaching
```typescript
// Don't skip educational content
<button onClick={doMock}>Run</button>  // No learning!
```

### 4. Mock Data Markers

✅ **DO**: Mark all mock data clearly
```typescript
const mockResponse = {
  access_token: "...",
  _mock: true,
  _note: "Educational simulation only",
  _generated_at: new Date().toISOString()
};
```

❌ **DON'T**: Make mock data indistinguishable from real
```typescript
// Don't omit mock indicators
const response = {
  access_token: "..."  // Looks real!
};
```

### 5. Consistent Patterns

✅ **DO**: Follow established mock patterns
```typescript
// Use consistent mock generation
const mockToken = MockTokenService.generateToken({
  type: 'access',
  claims: { sub: 'mock-user' }
});
```

❌ **DON'T**: Create one-off mock implementations
```typescript
// Don't reinvent mock generation each time
const token = 'random_' + Math.random();  // Inconsistent!
```

---

## Differences from Real Flows

### Network Behavior

| Aspect | Mock | Real |
|--------|------|------|
| **HTTP Calls** | Simulated | Actual requests |
| **Latency** | Fixed delay | Variable network |
| **Errors** | Scripted | Real failures |
| **CORS** | Not applicable | Must handle |

### Token Validation

| Aspect | Mock | Real |
|--------|------|------|
| **Signature** | Mock string | Cryptographic |
| **Verification** | Educational only | JWKS validation |
| **Expiration** | Simulated | Enforced |
| **Revocation** | Not checked | Server-side |

### Security

| Aspect | Mock | Real |
|--------|------|------|
| **Credentials** | Pre-filled | User-provided |
| **PKCE** | Simulated | Cryptographic |
| **State** | Generated | Validated |
| **Nonce** | Generated | Validated |

### Data Persistence

| Aspect | Mock | Real |
|--------|------|------|
| **Token Storage** | Optional | Required |
| **Session** | Simulated | Server-managed |
| **Refresh** | Simulated | Real tokens |

---

## Mock Flow Checklist

### Before Creating Mock Flow

- [ ] Determine educational purpose
- [ ] Identify what to simulate
- [ ] Plan mock data structure
- [ ] Design educational content
- [ ] Consider realistic timing

### During Implementation

- [ ] Add prominent mock indicators
- [ ] Simulate realistic delays
- [ ] Generate realistic mock data
- [ ] Include educational annotations
- [ ] Mark all mock data with `_mock: true`
- [ ] Add "why it's mock" explanations

### After Implementation

- [ ] Test mock behavior
- [ ] Verify educational value
- [ ] Check mock indicators are clear
- [ ] Ensure no confusion with real flows
- [ ] Document mock limitations

---

## Common Mock Patterns

### Pattern: Simulated OAuth Flow

```typescript
const simulateOAuthFlow = async () => {
  // Step 1: Simulate authorization
  await simulateDelay(1000);
  const authCode = 'mock_code_' + generateRandomString();
  
  // Step 2: Simulate token exchange
  await simulateDelay(2000);
  const tokens = {
    access_token: generateMockToken('access'),
    refresh_token: generateMockToken('refresh'),
    token_type: 'Bearer',
    expires_in: 3600,
    _mock: true
  };
  
  return tokens;
};
```

### Pattern: Mock OIDC Flow

```typescript
const simulateOIDCFlow = async () => {
  // OAuth flow
  const tokens = await simulateOAuthFlow();
  
  // Add OIDC extensions
  tokens.id_token = generateMockIDToken({
    sub: 'mock-user-id',
    email: 'mock@example.com',
    name: 'Mock User'
  });
  
  // Simulate UserInfo
  await simulateDelay(1000);
  const userInfo = {
    sub: 'mock-user-id',
    email: 'mock@example.com',
    name: 'Mock User',
    _mock: true
  };
  
  return { tokens, userInfo };
};
```

### Pattern: Mock Error Simulation

```typescript
const simulateError = async (errorType: string) => {
  await simulateDelay(1000);
  
  const mockErrors = {
    invalid_grant: {
      error: 'invalid_grant',
      error_description: 'The authorization code is invalid or expired',
      _mock: true
    },
    invalid_client: {
      error: 'invalid_client',
      error_description: 'Client authentication failed',
      _mock: true
    }
  };
  
  throw mockErrors[errorType] || mockErrors.invalid_grant;
};
```

---

## Testing Mock Flows

### Manual Testing

1. **Visual Indicators**: Verify mock badges/warnings visible
2. **Timing**: Check delays feel realistic
3. **Data**: Inspect generated mock tokens
4. **Education**: Review learning content
5. **Errors**: Test error scenarios

### Automated Testing

```typescript
describe('Mock Flow', () => {
  it('should indicate mock behavior', () => {
    render(<MockFlow />);
    expect(screen.getByText(/mock implementation/i)).toBeInTheDocument();
  });
  
  it('should generate mock tokens', async () => {
    const tokens = await generateMockTokens();
    expect(tokens._mock).toBe(true);
    expect(tokens.access_token).toMatch(/^mock_/);
  });
  
  it('should simulate realistic delay', async () => {
    const start = Date.now();
    await simulateNetworkCall();
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThan(1500);
  });
});
```

---

## Migration from Mock to Real

### When to Migrate

- Moving from learning to production
- Backend services are ready
- Real credentials available
- Need actual authentication

### Migration Steps

1. **Replace mock calls** with real API calls
2. **Remove mock indicators** and warnings
3. **Add real validation** (JWKS, signatures)
4. **Implement error handling** for real failures
5. **Add credential management** for real secrets
6. **Test with real auth server**

### Example Migration

#### Before (Mock):
```typescript
const handleAuth = async () => {
  await simulateDelay(2000);
  const mockTokens = generateMockTokens();
  setTokens(mockTokens);
};
```

#### After (Real):
```typescript
const handleAuth = async () => {
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    
    if (!response.ok) {
      throw new Error('Token request failed');
    }
    
    const tokens = await response.json();
    setTokens(tokens);
  } catch (error) {
    handleError(error);
  }
};
```

---

## Resources

### Mock Flow Examples
- `MockOIDCResourceOwnerPasswordFlow.tsx` - Complete mock OIDC flow
- `SAMLBearerAssertionFlowV7.tsx` - Mock SAML integration
- `OAuthAuthorizationCodeFlowV7_Condensed_Mock.tsx` - Condensed structure

### Related Documentation
- [V7 Flows Documentation](V7_FLOWS_DOCUMENTATION.md) - Real flow implementation
- [OAuth Flow Standardization Guide](../src/pages/flows/OAUTH_FLOW_STANDARDIZATION_GUIDE.md)

---

## Summary

Mock Flows provide valuable educational and development tools by:

- ✅ Enabling learning without setup
- ✅ Supporting development without backend
- ✅ Facilitating demonstrations
- ✅ Providing consistent test data
- ✅ Reducing external dependencies

**Key Principle**: Always clearly indicate mock behavior and provide educational value.

---

*Mock Flows Documentation v1.0.0 - November 2025*
