# Flows Development Guide

**Date:** March 9, 2026  
**Purpose:** Guide for developers working with OAuth flows  
**Target:** New flow development and modifications

---

## Quick Reference

### Adding a New V9 Flow

1. **Create flow file** in `src/pages/flows/v9/`
2. **Follow naming convention**: `FlowNameFlowV9.tsx`
3. **Use correct import depth**: `../../../services/`
4. **Test with V9 components**
5. **Update routing** if needed

### Modifying Existing Flows

1. **Identify version** (V8 vs V9)
2. **Check import patterns** for consistency
3. **Maintain version isolation**
4. **Test thoroughly**

---

## Flow Development Patterns

### Standard V9 Flow Structure

```typescript
// src/pages/flows/v9/NewFlowV9.tsx
import React, { useState, useEffect } from 'react';

// Services (3 levels up from flows/v9/)
import { someService } from '../../../services/someService';
import { anotherService } from '../../../services/anotherService';

// Components (relative to flows/v9/)
import { SomeComponent } from '../components/SomeComponent';
import { AnotherComponent } from '../../components/AnotherComponent';

// Types
import type { FlowState } from '../types/Flow.types';

export const NewFlowV9: React.FC = () => {
  // Flow state
  const [flowState, setFlowState] = useState<FlowState>({
    // Initial state
  });

  // Flow logic
  useEffect(() => {
    // Initialize flow
  }, []);

  return (
    <div>
      {/* Flow UI */}
    </div>
  );
};

export default NewFlowV9;
```

### Import Patterns by Location

#### From V9 Flows (`src/pages/flows/v9/`)
```typescript
// Services (3 levels up)
import { service } from '../../../services/service';

// V9 Services (3 levels up, then into v9/)
import { v9Service } from '../../../services/v9/v9Service';

// Components (same level or up)
import { Component } from '../components/Component';
import { SharedComponent } from '../../components/SharedComponent';

// Types
import { Type } from '../types/Type';
import { SharedType } from '../../../types/SharedType';
```

#### From V8 Flows (`src/v8/flows/`)
```typescript
// Services (2 levels up)
import { service } from '../../services/service';

// V8 Services (2 levels up, then into v8/)
import { v8Service } from '../../services/v8/v8Service';
```

#### From Top-level Pages (`src/pages/`)
```typescript
// Services (1 level up)
import { service } from '../services/service';

// Components (relative)
import { Component } from '../components/Component';
```

---

## Flow Categories

### OAuth 2.0 Grant Types

| Grant Type | V9 Implementation | Use Case |
|---|---|---|
| Authorization Code | `OAuthAuthorizationCodeFlowV9.tsx` | Web apps, confidential clients |
| Client Credentials | `ClientCredentialsFlowV9.tsx` | Service-to-service, machine-to-machine |
| Device Authorization | `DeviceAuthorizationFlowV9.tsx` | IoT devices, limited input devices |
| Resource Owner Password | `OAuthROPCFlowV9.tsx` | Trusted applications, legacy systems |
| Implicit | `ImplicitFlowV9.tsx` | Legacy SPA (not recommended) |

### OIDC Extensions

| Flow | V9 Implementation | Use Case |
|---|---|---|
| Hybrid | `OIDCHybridFlowV9.tsx` | Web apps needing ID token + authorization code |
| MFA Integration | `MFALoginHintFlowV9.tsx` | Multi-factor authentication |
| JWT Bearer | `JWTBearerTokenFlowV9.tsx` | API authentication with JWTs |

### Advanced Features

| Feature | V9 Implementation | Use Case |
|---|---|---|
| Token Exchange | `TokenExchangeFlowV9.tsx` | Token delegation, impersonation |
| Rich Authorization Requests | `RARFlowV9.tsx` | Fine-grained authorization |
| Pushed Authorization Requests | `PingOnePARFlowV9.tsx` | Enhanced security |
| DPoP | `DPoPAuthorizationCodeFlowV9.tsx` | Proof-of-possession tokens |
| SAML Bearer | `SAMLBearerAssertionFlowV9.tsx` | SAML integration |
| Worker Tokens | `WorkerTokenFlowV9.tsx` | Background processing |

---

## Best Practices

### 1. Naming Conventions

```typescript
// ✅ Good: Descriptive, includes version
export const OAuthAuthorizationCodeFlowV9: React.FC = () => {};

// ✅ Good: Clear purpose
export const MFALoginHintFlowV9: React.FC = () => {};

// ❌ Avoid: Unclear or missing version
export const Flow1: React.FC = () => {};
export const AuthFlow: React.FC = () => {};
```

### 2. Import Organization

```typescript
// 1. React imports
import React, { useState, useEffect, useCallback } from 'react';

// 2. Services (most specific first)
import { v9AuthService } from '../../../services/v9/V9AuthService';
import { tokenService } from '../../../services/tokenService';

// 3. Components
import { AuthButton } from '../components/AuthButton';
import { TokenDisplay } from '../../components/TokenDisplay';

// 4. Types and utilities
import type { AuthState } from '../types/Auth.types';
import { logger } from '../../../utils/logger';
```

### 3. Error Handling

```typescript
const executeFlow = async () => {
  try {
    const result = await authService.executeFlow(params);
    setFlowState({ status: 'success', data: result });
  } catch (error) {
    logger.error('Flow execution failed', error);
    setFlowState({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
```

### 4. State Management

```typescript
interface FlowState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

const [flowState, setFlowState] = useState<FlowState>({
  status: 'idle'
});
```

---

## Testing Flows

### Unit Test Structure

```typescript
// src/pages/flows/v9/__tests__/NewFlowV9.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { NewFlowV9 } from '../NewFlowV9';

describe('NewFlowV9', () => {
  it('should initialize correctly', () => {
    render(<NewFlowV9 />);
    expect(screen.getByText('Flow Title')).toBeInTheDocument();
  });

  it('should handle successful flow execution', async () => {
    render(<NewFlowV9 />);
    
    // Trigger flow
    screen.getByText('Execute Flow').click();
    
    // Verify success state
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

```typescript
// Test with actual services
import { renderHook, act } from '@testing-library/react-hooks';
import { useNewFlow } from '../hooks/useNewFlow';

describe('useNewFlow integration', () => {
  it('should integrate with services correctly', async () => {
    const { result } = renderHook(() => useNewFlow());
    
    await act(async () => {
      await result.current.executeFlow();
    });
    
    expect(result.current.state.status).toBe('success');
  });
});
```

---

## Common Patterns

### 1. Flow Initialization

```typescript
useEffect(() => {
  const initializeFlow = async () => {
    setFlowState({ status: 'loading' });
    
    try {
      const config = await flowService.getConfiguration();
      setFlowState({ 
        status: 'idle', 
        metadata: { config } 
      });
    } catch (error) {
      setFlowState({ 
        status: 'error', 
        error: 'Failed to initialize flow' 
      });
    }
  };

  initializeFlow();
}, []);
```

### 2. Token Handling

```typescript
const handleTokenResponse = async (response: TokenResponse) => {
  try {
    // Validate token
    const validation = await tokenService.validate(response.access_token);
    
    if (validation.valid) {
      // Store token
      await tokenService.store(response);
      setFlowState({ status: 'success', data: response });
    } else {
      setFlowState({ 
        status: 'error', 
        error: 'Invalid token received' 
      });
    }
  } catch (error) {
    setFlowState({ 
      status: 'error', 
      error: 'Token processing failed' 
    });
  }
};
```

### 3. Redirect Handling

```typescript
const handleCallback = useCallback(async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (code && state) {
    try {
      const tokens = await authService.exchangeCodeForTokens(code);
      setFlowState({ status: 'success', data: tokens });
    } catch (error) {
      setFlowState({ 
        status: 'error', 
        error: 'Token exchange failed' 
      });
    }
  }
}, []);
```

---

## Migration Guide (V8 → V9)

### Step 1: Create V9 Version

```typescript
// Copy V8 flow to V9 location
// src/pages/flows/v9/ExistingFlowV9.tsx

// Update imports from V8 to V9 patterns
// Change '../../services/' to '../../../services/'
// Update V8-specific imports to V9 equivalents
```

### Step 2: Update Service Dependencies

```typescript
// V8 pattern
import { v8AuthService } from '../../services/v8AuthService';

// V9 pattern  
import { v9AuthService } from '../../../services/v9/V9AuthService';
```

### Step 3: Test and Validate

1. **Unit tests** - Verify flow logic
2. **Integration tests** - Test with real services
3. **E2E tests** - Full flow execution
4. **Manual testing** - User experience validation

### Step 4: Update Routing

```typescript
// Update navigation to point to V9 version
const routes = [
  {
    path: '/flows/existing-flow',
    component: ExistingFlowV9, // V9 version
  },
];
```

---

## Troubleshooting

### Common Issues

#### Import Errors
```typescript
// ❌ Wrong: Wrong depth from V9 flows
import { service } from '../../services/service';

// ✅ Correct: Right depth from V9 flows
import { service } from '../../../services/service';
```

#### Version Conflicts
```typescript
// ❌ Wrong: V9 flow importing V8 service
import { v8Service } from '../../../services/v8/v8Service';

// ✅ Correct: V9 flow using V9 service
import { v9Service } from '../../../services/v9/V9Service';
```

#### Missing Dependencies
```typescript
// Check if service exists in correct location
// V9 services: src/services/v9/
// Core services: src/services/
// V8 services: src/v8/services/
```

### Debug Tips

1. **Check import paths** - Verify correct directory depth
2. **Verify service availability** - Ensure service exists in target location
3. **Test in isolation** - Test flow without dependencies
4. **Check browser console** - Look for runtime errors
5. **Review network tab** - Check API calls and responses

---

## Performance Considerations

### Lazy Loading
```typescript
// Lazy load heavy flows
const HeavyFlowV9 = React.lazy(() => import('./HeavyFlowV9'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HeavyFlowV9 />
</Suspense>
```

### Code Splitting
```typescript
// Split large flows into components
// Main flow component
export const MainFlowV9: React.FC = () => {
  return (
    <div>
      <FlowConfiguration />
      <FlowExecution />
      <FlowResults />
    </div>
  );
};

// Separate components for better tree-shaking
export const FlowConfiguration: React.FC = () => { /* ... */ };
export const FlowExecution: React.FC = () => { /* ... */ };
export const FlowResults: React.FC = () => { /* ... */ };
```

---

## Security Considerations

### Token Security
```typescript
// Always validate tokens before storing
const validateAndStoreToken = async (token: string) => {
  const validation = await tokenService.validate(token);
  
  if (!validation.valid) {
    throw new Error('Invalid token');
  }
  
  await tokenService.storeSecurely(token);
};
```

### Parameter Validation
```typescript
// Validate all input parameters
const validateFlowParams = (params: FlowParams) => {
  if (!params.clientId || !params.redirectUri) {
    throw new Error('Missing required parameters');
  }
  
  // Validate URI format
  try {
    new URL(params.redirectUri);
  } catch {
    throw new Error('Invalid redirect URI');
  }
};
```

---

## Conclusion

Following these patterns ensures:

✅ **Consistent architecture** across all flows  
✅ **Proper version isolation**  
✅ **Maintainable code** with clear patterns  
✅ **Easy testing** and debugging  
✅ **Security best practices**  

For more details, see the [Flows Structure Guide](./FLOWS_STRUCTURE_GUIDE.md).
