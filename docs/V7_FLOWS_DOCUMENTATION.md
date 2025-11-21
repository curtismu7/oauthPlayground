# V7 Flows Documentation

**Complete Guide to V7 OAuth/OIDC Flow Architecture**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [V7 Architecture](#v7-architecture)
3. [Available V7 Flows](#available-v7-flows)
4. [V7 Flow Template](#v7-flow-template)
5. [Shared Services](#shared-services)
6. [Implementation Guide](#implementation-guide)
7. [Compliance Features](#compliance-features)
8. [Best Practices](#best-practices)

---

## Overview

### What are V7 Flows?

V7 Flows represent the **seventh generation** of OAuth/OIDC flow implementations in this application, featuring:

- **Unified Architecture** - Standardized template for all flows
- **Specification Compliance** - Built-in OAuth 2.0 and OIDC validation
- **Shared Services** - Centralized error handling, validation, and security
- **Enhanced UX** - Consistent UI components and user experience
- **Educational Focus** - Clear documentation and learning tooltips

### Key Improvements Over Previous Versions

| Feature | Pre-V7 | V7 |
|---------|--------|-----|
| **Architecture** | Inconsistent patterns | Unified template |
| **Error Handling** | Flow-specific | Centralized service |
| **Validation** | Manual checks | Automated compliance |
| **UI Components** | Mixed styles | Shared UI service |
| **Documentation** | Scattered | Comprehensive |
| **Maintainability** | Difficult | Streamlined |

---

## V7 Architecture

### Core Components

```
V7 Flow Architecture
├── V7FlowTemplate.tsx          # Base template for all V7 flows
├── Services/
│   ├── sharedService.ts        # Main V7 shared service
│   ├── flowUIService.ts        # Shared UI components
│   ├── flowHeaderService.ts    # Flow headers
│   ├── flowCredentialService.ts # Credential management
│   └── [flow]SharedService.ts  # Flow-specific services
├── Utils/
│   ├── idTokenValidation.ts    # OIDC ID token validation
│   ├── parameterValidation.ts  # Parameter validation
│   ├── securityHeaders.ts      # Security headers
│   └── standardizedErrorHandling.ts # Error handling
└── Flows/
    ├── AuthorizationCodeFlowV7.tsx
    ├── ImplicitFlowV7.tsx
    ├── CIBAFlowV7.tsx
    └── [other V7 flows]
```

### Design Principles

1. **Separation of Concerns** - Business logic in services, UI in components
2. **Reusability** - Shared services and components across all flows
3. **Consistency** - Standardized patterns and interfaces
4. **Compliance** - Built-in specification validation
5. **Extensibility** - Easy to add new flows and features

---

## Available V7 Flows

### OAuth 2.0 Flows

#### 1. Authorization Code Flow V7
**File**: `AuthorizationCodeFlowV7.tsx`  
**Flow Name**: `oauth-authorization-code-v7`  
**Specification**: RFC 6749 Section 4.1

**Features**:
- PKCE support (RFC 7636)
- State parameter validation
- Authorization code exchange
- Token refresh capability

**Use Cases**:
- Web applications with backend
- Mobile applications
- Single-page applications (with PKCE)

---

#### 2. Implicit Flow V7
**File**: `ImplicitFlowV7.tsx`  
**Flow Name**: `oauth-implicit-v7` / `oidc-implicit-v7`  
**Specification**: RFC 6749 Section 4.2

**Features**:
- Unified OAuth/OIDC implementation
- Variant selector (OAuth vs OIDC)
- Fragment parsing
- ID token validation (OIDC mode)

**Use Cases**:
- Legacy browser-based applications
- Educational demonstrations
- **Note**: Deprecated in OAuth 2.1, use Authorization Code + PKCE instead

---

#### 3. Client Credentials Flow V7
**File**: `ClientCredentialsFlowV7.tsx`  
**Flow Name**: `oauth-client-credentials-v7`  
**Specification**: RFC 6749 Section 4.4

**Features**:
- Machine-to-machine authentication
- Multiple client authentication methods
- Scope-based access control

**Use Cases**:
- Backend services
- API integrations
- Microservices communication

---

#### 4. Device Authorization Flow V7
**File**: `DeviceAuthorizationFlowV7.tsx`  
**Flow Name**: `oauth-device-authorization-v7`  
**Specification**: RFC 8628

**Features**:
- User code generation
- Device code polling
- QR code display
- Interval-based polling

**Use Cases**:
- Smart TVs
- IoT devices
- CLI applications
- Devices with limited input

---

#### 5. Resource Owner Password Credentials (ROPC) Flow V7
**File**: `OAuthROPCFlowV7.tsx`  
**Flow Name**: `oauth-ropc-v7`  
**Specification**: RFC 6749 Section 4.3

**Features**:
- Direct credential exchange
- Legacy system support

**Use Cases**:
- Trusted first-party applications
- Migration scenarios
- **Note**: Not recommended for new applications

---

#### 6. Token Exchange Flow V7
**File**: `TokenExchangeFlowV7.tsx`  
**Flow Name**: `oauth-token-exchange-v7`  
**Specification**: RFC 8693

**Features**:
- Token-to-token exchange
- Impersonation support
- Delegation scenarios

**Use Cases**:
- Microservices token propagation
- Service-to-service delegation
- Token type conversion

---

#### 7. JWT Bearer Token Flow V7
**File**: `JWTBearerTokenFlowV7.tsx`  
**Flow Name**: `oauth-jwt-bearer-token-v7`  
**Specification**: RFC 7523

**Features**:
- JWT assertion-based authentication
- Self-signed JWT support
- Service account authentication

**Use Cases**:
- Service accounts
- Server-to-server authentication
- Google Cloud Platform integration

---

### OpenID Connect Flows

#### 8. OIDC Authorization Code Flow V7
**File**: `OIDCAuthorizationCodeFlowV7.tsx` (or unified with OAuth)  
**Flow Name**: `oidc-authorization-code-v7`  
**Specification**: OIDC Core 1.0 Section 3.1

**Features**:
- ID token validation
- UserInfo endpoint integration
- Nonce validation
- Claims processing

**Use Cases**:
- User authentication
- Single sign-on (SSO)
- Identity federation

---

#### 9. OIDC Hybrid Flow V7
**File**: `OIDCHybridFlowV7.tsx`  
**Flow Name**: `oidc-hybrid-v7`  
**Specification**: OIDC Core 1.0 Section 3.3

**Features**:
- Combined front-channel and back-channel
- Multiple response types
- Flexible token delivery

**Use Cases**:
- Complex authentication scenarios
- Applications needing immediate access + secure tokens

---

#### 10. CIBA Flow V7
**File**: `CIBAFlowV7.tsx`  
**Flow Name**: `oidc-ciba-v7`  
**Specification**: OIDC CIBA Core 1.0

**Features**:
- Backchannel authentication
- Push/Poll/Ping modes
- Out-of-band user authentication
- Real-time status updates

**Use Cases**:
- Mobile authentication
- Transaction approval
- Decoupled authentication flows

---

### PingOne-Specific Flows

#### 11. PingOne PAR Flow V7
**File**: `PingOnePARFlowV7.tsx`  
**Flow Name**: `pingone-par-v7`  
**Specification**: RFC 9126 (PAR)

**Features**:
- Pushed Authorization Requests
- Enhanced security
- Large request support

**Use Cases**:
- High-security applications
- Complex authorization requests
- PingOne integrations

---

#### 12. PingOne MFA Flow V7
**File**: `PingOneMFAWorkflowLibraryV7.tsx`  
**Flow Name**: `pingone-mfa-v7`  
**Specification**: PingOne MFA API

**Features**:
- Multi-factor authentication
- Multiple MFA methods
- Device management
- Risk-based authentication

**Use Cases**:
- Enhanced security
- Compliance requirements
- PingOne MFA integration

---

### Advanced Flows

#### 13. Rich Authorization Requests (RAR) Flow V7
**File**: `RARFlowV7.tsx`  
**Flow Name**: `rar-v7`  
**Specification**: RFC 9396

**Features**:
- Fine-grained authorization
- Structured authorization details
- Complex permission requests

**Use Cases**:
- Banking applications
- Healthcare systems
- Fine-grained access control

---

#### 14. SAML Bearer Assertion Flow V7
**File**: `SAMLBearerAssertionFlowV7.tsx`  
**Flow Name**: `saml-bearer-assertion-v7`  
**Specification**: RFC 7522

**Features**:
- SAML-to-OAuth bridge
- Enterprise SSO integration
- Legacy system integration

**Use Cases**:
- Enterprise applications
- SAML-based SSO systems
- Identity federation

---

## V7 Flow Template

### Template Structure

The `V7FlowTemplate.tsx` provides a standardized structure for all V7 flows:

```typescript
import { V7FlowTemplate } from '../templates/V7FlowTemplate';

export const MyFlowV7: React.FC = () => {
  return (
    <V7FlowTemplate
      flowName="my-flow-v7"
      flowTitle="My Flow V7"
      flowSubtitle="Description of the flow"
      stepMetadata={[
        { title: 'Step 1', subtitle: 'Setup', description: 'Configure credentials' },
        { title: 'Step 2', subtitle: 'Execute', description: 'Run the flow' },
        { title: 'Step 3', subtitle: 'Results', description: 'View results' }
      ]}
      renderStepContent={(step) => {
        switch (step) {
          case 0: return <SetupStep />;
          case 1: return <ExecuteStep />;
          case 2: return <ResultsStep />;
          default: return null;
        }
      }}
      complianceFeatures={{
        enableIDTokenValidation: true,
        enableParameterValidation: true,
        enableErrorHandling: true,
        enableSecurityHeaders: true
      }}
    />
  );
};
```

### Template Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `flowName` | `V7FlowName` | Yes | Unique flow identifier |
| `flowTitle` | `string` | Yes | Display title |
| `flowSubtitle` | `string` | Yes | Brief description |
| `stepMetadata` | `Array` | Yes | Step configuration |
| `renderStepContent` | `Function` | Yes | Step content renderer |
| `onStepChange` | `Function` | No | Step change callback |
| `onReset` | `Function` | No | Reset callback |
| `onStartOver` | `Function` | No | Start over callback |
| `canNavigateNext` | `Function` | No | Navigation guard |
| `complianceFeatures` | `Object` | No | Feature toggles |

---

## Shared Services

### V7SharedService (sharedService.ts)

The main service providing compliance features:

```typescript
import { V7SharedService } from '../services/sharedService';

// ID Token Validation
const validation = await V7SharedService.IDTokenValidation.validateIDToken(
  idToken,
  expectedIssuer,
  expectedAudience,
  expectedNonce,
  jwksUri,
  flowName
);

// Parameter Validation
const paramValidation = V7SharedService.ParameterValidation.validateFlowParameters(
  flowName,
  parameters
);

// Error Handling
const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(
  error,
  { flowName, step: 'token_exchange', operation: 'exchange' }
);

// Security Headers
const headers = V7SharedService.SecurityHeaders.getSecurityHeaders(flowName);

// Compliance Check
const compliance = V7SharedService.SpecificationCompliance.checkFlowCompliance(flowName);
```

### Flow-Specific Shared Services

Each complex flow has its own shared service:

- **ImplicitFlowSharedService** - Implicit flow utilities
- **CibaFlowSharedService** - CIBA flow management
- **DeviceFlowSharedService** - Device flow helpers

---

## Implementation Guide

### Creating a New V7 Flow

#### Step 1: Define Flow Configuration

```typescript
// In sharedService.ts, add your flow name
export type V7FlowName = 
  | 'existing-flows...'
  | 'my-new-flow-v7';  // Add your flow
```

#### Step 2: Create Flow File

```typescript
// src/pages/flows/MyNewFlowV7.tsx
import React, { useState } from 'react';
import { V7FlowTemplate } from '../../templates/V7FlowTemplate';
import { FlowUIService } from '../../services/flowUIService';

const { Button, InfoBox, CodeBlock } = FlowUIService.getFlowUIComponents();

export const MyNewFlowV7: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const stepMetadata = [
    { title: 'Setup', subtitle: 'Configure', description: 'Setup credentials' },
    { title: 'Execute', subtitle: 'Run Flow', description: 'Execute the flow' },
    { title: 'Results', subtitle: 'View Results', description: 'See the results' }
  ];
  
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div>
            <InfoBox $variant="info">
              <h3>Setup Instructions</h3>
              <p>Configure your credentials here</p>
            </InfoBox>
            {/* Your setup UI */}
          </div>
        );
      case 1:
        return (
          <div>
            {/* Your execution UI */}
          </div>
        );
      case 2:
        return (
          <div>
            {/* Your results UI */}
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <V7FlowTemplate
      flowName="my-new-flow-v7"
      flowTitle="My New Flow V7"
      flowSubtitle="Description of what this flow does"
      stepMetadata={stepMetadata}
      renderStepContent={renderStepContent}
      onStepChange={setCurrentStep}
      complianceFeatures={{
        enableIDTokenValidation: true,
        enableParameterValidation: true,
        enableErrorHandling: true,
        enableSecurityHeaders: true
      }}
    />
  );
};

export default MyNewFlowV7;
```

#### Step 3: Add Route

```typescript
// In your routing configuration
import MyNewFlowV7 from './pages/flows/MyNewFlowV7';

<Route path="/flows/my-new-flow-v7" element={<MyNewFlowV7 />} />
```

#### Step 4: Register Flow

```typescript
// In comprehensiveFlowDataService.ts or similar
{
  id: 'my-new-flow-v7',
  name: 'My New Flow V7',
  category: 'oauth',
  path: '/flows/my-new-flow-v7',
  description: 'Description of the flow',
  specification: 'RFC XXXX',
  version: 'v7'
}
```

---

## Compliance Features

### ID Token Validation

Automatic OIDC ID token validation:

```typescript
const validation = await V7SharedService.IDTokenValidation.validateIDToken(
  idToken,
  'https://auth.pingone.com/your-env-id/as',  // issuer
  'your-client-id',                            // audience
  'nonce-value',                               // nonce (optional)
  'https://auth.pingone.com/your-env-id/as/jwks', // JWKS URI
  'oidc-authorization-code-v7'                 // flow name
);

if (validation.isValid) {
  console.log('ID token is valid!', validation.claims);
} else {
  console.error('Validation failed:', validation.errors);
}
```

### Parameter Validation

Validates flow parameters against specifications:

```typescript
const validation = V7SharedService.ParameterValidation.validateFlowParameters(
  'oauth-authorization-code-v7',
  {
    client_id: 'abc123',
    redirect_uri: 'https://app.example.com/callback',
    response_type: 'code',
    scope: 'openid profile email',
    state: 'random-state-value',
    code_challenge: 'challenge-value',
    code_challenge_method: 'S256'
  }
);

if (!validation.isValid) {
  console.error('Invalid parameters:', validation.errors);
}
```

### Error Handling

Standardized OAuth/OIDC error responses:

```typescript
try {
  // Your flow logic
} catch (error) {
  const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(
    error,
    {
      flowName: 'oauth-authorization-code-v7',
      step: 'token_exchange',
      operation: 'exchange_code',
      timestamp: Date.now()
    }
  );
  
  // errorResponse follows RFC 6749 format:
  // {
  //   error: 'invalid_grant',
  //   error_description: 'The authorization code is invalid',
  //   error_uri: 'https://tools.ietf.org/html/rfc6749#section-5.2'
  // }
}
```

### Security Headers

Get recommended security headers:

```typescript
const headers = V7SharedService.SecurityHeaders.getSecurityHeaders(
  'oauth-authorization-code-v7'
);

// Returns headers like:
// {
//   'X-Content-Type-Options': 'nosniff',
//   'X-Frame-Options': 'DENY',
//   'Content-Security-Policy': "default-src 'self'",
//   'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
// }
```

---

## Best Practices

### 1. Use Shared Services

✅ **DO**:
```typescript
import { V7SharedService } from '../services/sharedService';
const validation = V7SharedService.ParameterValidation.validateFlowParameters(...);
```

❌ **DON'T**:
```typescript
// Don't implement your own validation
if (!params.client_id) {
  throw new Error('Missing client_id');
}
```

### 2. Follow Template Structure

✅ **DO**: Use V7FlowTemplate for consistency
```typescript
<V7FlowTemplate
  flowName="my-flow-v7"
  // ... other props
/>
```

❌ **DON'T**: Create custom flow structures
```typescript
// Don't create one-off flow structures
<div className="my-custom-flow">
  {/* custom implementation */}
</div>
```

### 3. Use FlowUIService Components

✅ **DO**: Use shared UI components
```typescript
const { Button, InfoBox, CodeBlock } = FlowUIService.getFlowUIComponents();
<InfoBox $variant="success">Success!</InfoBox>
```

❌ **DON'T**: Create custom styled components
```typescript
const MyCustomBox = styled.div`
  // custom styles
`;
```

### 4. Handle Errors Properly

✅ **DO**: Use standardized error handling
```typescript
try {
  await executeFlow();
} catch (error) {
  const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(error, context);
  v4ToastManager.showError(errorResponse.error_description);
}
```

❌ **DON'T**: Use generic error handling
```typescript
try {
  await executeFlow();
} catch (error) {
  alert('Something went wrong');
}
```

### 5. Validate All Inputs

✅ **DO**: Validate parameters before use
```typescript
const validation = V7SharedService.ParameterValidation.validateFlowParameters(
  flowName,
  parameters
);
if (!validation.isValid) {
  // Handle validation errors
  return;
}
```

❌ **DON'T**: Skip validation
```typescript
// Don't assume inputs are valid
const authUrl = buildAuthUrl(params); // No validation!
```

### 6. Document Your Flow

✅ **DO**: Add comprehensive documentation
```typescript
/**
 * My New Flow V7
 * 
 * Implements RFC XXXX - Flow Name
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * 
 * Use Cases:
 * - Use case 1
 * - Use case 2
 */
```

### 7. Test Thoroughly

✅ **DO**: Test all scenarios
- Happy path
- Error cases
- Edge cases
- Validation failures
- Network errors

### 8. Use TypeScript Types

✅ **DO**: Leverage TypeScript
```typescript
import type { V7FlowName } from '../services/sharedService';

const flowName: V7FlowName = 'oauth-authorization-code-v7';
```

---

## Migration Guide

### Upgrading from Pre-V7 to V7

#### Before (Pre-V7):
```typescript
export const MyFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  
  // Custom state management
  // Custom error handling
  // Custom UI components
  // Inconsistent patterns
  
  return (
    <div>
      {/* Custom implementation */}
    </div>
  );
};
```

#### After (V7):
```typescript
export const MyFlowV7: React.FC = () => {
  return (
    <V7FlowTemplate
      flowName="my-flow-v7"
      flowTitle="My Flow V7"
      flowSubtitle="Description"
      stepMetadata={stepMetadata}
      renderStepContent={renderStepContent}
      complianceFeatures={{
        enableIDTokenValidation: true,
        enableParameterValidation: true,
        enableErrorHandling: true,
        enableSecurityHeaders: true
      }}
    />
  );
};
```

### Benefits of Migration

1. **Reduced Code** - 60-80% less boilerplate
2. **Consistency** - Standardized UI and behavior
3. **Compliance** - Built-in validation and error handling
4. **Maintainability** - Easier to update and fix
5. **Documentation** - Self-documenting structure

---

## Troubleshooting

### Common Issues

#### Issue: Flow not appearing in navigation
**Solution**: Ensure flow is registered in `comprehensiveFlowDataService.ts`

#### Issue: Validation errors
**Solution**: Check parameter names match specification exactly

#### Issue: ID token validation fails
**Solution**: Verify issuer, audience, and JWKS URI are correct

#### Issue: Styling inconsistencies
**Solution**: Use FlowUIService components instead of custom styles

---

## Resources

### Specifications

- **OAuth 2.0**: [RFC 6749](https://tools.ietf.org/html/rfc6749)
- **OAuth 2.1**: [Draft](https://oauth.net/2.1/)
- **OIDC Core**: [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- **PKCE**: [RFC 7636](https://tools.ietf.org/html/rfc7636)
- **Device Flow**: [RFC 8628](https://tools.ietf.org/html/rfc8628)
- **Token Exchange**: [RFC 8693](https://tools.ietf.org/html/rfc8693)
- **JWT Bearer**: [RFC 7523](https://tools.ietf.org/html/rfc7523)
- **CIBA**: [OIDC CIBA Core 1.0](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html)
- **PAR**: [RFC 9126](https://tools.ietf.org/html/rfc9126)
- **RAR**: [RFC 9396](https://tools.ietf.org/html/rfc9396)

### Internal Documentation

- `OAUTH_FLOW_STANDARDIZATION_GUIDE.md` - General flow standardization
- `PROJECT_STRUCTURE_OVERVIEW.md` - Project structure
- Flow-specific README files in each flow directory

---

## Summary

V7 Flows provide a **unified, compliant, and maintainable** architecture for OAuth/OIDC implementations. By following the V7 template and using shared services, you can:

- ✅ Build flows faster
- ✅ Ensure specification compliance
- ✅ Maintain consistency
- ✅ Reduce bugs
- ✅ Improve user experience

**All new flows should use the V7 architecture.**

---

*Last Updated: November 2025*  
*Version: 7.0.0*
