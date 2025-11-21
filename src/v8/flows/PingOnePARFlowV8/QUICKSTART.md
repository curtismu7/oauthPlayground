# PAR Flow V8 - Quick Start Guide

## For Developers

### Installation

No installation needed - the flow is already integrated into the application.

### Usage

```typescript
import PingOnePARFlowV8 from './v8/flows/PingOnePARFlowV8';

// In your router
<Route path="/par-flow-v8" element={<PingOnePARFlowV8 />} />
```

### Architecture Overview

```
PingOnePARFlowV8/
├── types/parFlowTypes.ts           # TypeScript interfaces
├── constants/parFlowConstants.ts   # Constants and metadata
├── hooks/
│   ├── usePARFlowState.ts         # State management
│   └── usePAROperations.ts        # API operations
├── PingOnePARFlowV8.tsx           # Main component
├── index.ts                       # Exports
├── README.md                      # Full documentation
└── QUICKSTART.md                  # This file
```

### Key Concepts

#### 1. State Management (usePARFlowState)

```typescript
const state = usePARFlowState();

// Access state
state.flowState.currentStep        // Current step (0-5)
state.flowState.flowVariant        // 'oauth' or 'oidc'
state.flowState.parRequestUri      // PAR request_uri
state.credentials                  // User credentials
state.pkceCodes                    // PKCE parameters
state.tokens                       // OAuth tokens

// Update state
state.setCurrentStep(2);
state.setFlowVariant('oidc');
state.updateCredentials({ clientId: '...' });
state.updatePKCE({ codeVerifier: '...', codeChallenge: '...' });
state.markStepCompleted(1);

// Actions
state.resetFlow();                 // Reset everything
```

#### 2. Operations (usePAROperations)

```typescript
const operations = usePAROperations();

// Generate PKCE
const pkce = await operations.generatePKCE();
// Returns: { codeVerifier, codeChallenge, codeChallengeMethod }

// Push authorization request
const parResponse = await operations.pushAuthorizationRequest(
  credentials,
  pkceCodes,
  { /* additional params */ }
);
// Returns: { request_uri, expires_in }

// Generate authorization URL
const authUrl = operations.generateAuthorizationUrl(
  credentials,
  requestUri
);

// Exchange code for tokens
const tokens = await operations.exchangeCodeForTokens(
  credentials,
  authCode,
  pkceCodes
);
// Returns: { access_token, token_type, expires_in, ... }

// Fetch user info (OIDC only)
const userInfo = await operations.fetchUserInfo(
  credentials,
  accessToken
);
```

### Example: Complete Flow

```typescript
import React from 'react';
import { usePARFlowState } from './hooks/usePARFlowState';
import { usePAROperations } from './hooks/usePAROperations';

export const MyPARFlow = () => {
  const state = usePARFlowState();
  const operations = usePAROperations();

  // Step 1: Generate PKCE
  const handleGeneratePKCE = async () => {
    const pkce = await operations.generatePKCE();
    state.updatePKCE(pkce);
    state.markStepCompleted(1);
  };

  // Step 2: Push authorization request
  const handlePushAuth = async () => {
    const response = await operations.pushAuthorizationRequest(
      state.credentials,
      state.pkceCodes
    );
    state.setPARRequestUri(response.request_uri, response.expires_in);
    state.markStepCompleted(2);
  };

  // Step 3: Authorize
  const handleAuthorize = () => {
    const authUrl = operations.generateAuthorizationUrl(
      state.credentials,
      state.flowState.parRequestUri
    );
    window.location.href = authUrl;
  };

  // Step 4: Exchange tokens
  const handleExchange = async () => {
    const tokens = await operations.exchangeCodeForTokens(
      state.credentials,
      state.flowState.authCode,
      state.pkceCodes
    );
    state.updateTokens(tokens);
    state.markStepCompleted(4);
  };

  return (
    <div>
      <button onClick={handleGeneratePKCE}>Generate PKCE</button>
      <button onClick={handlePushAuth}>Push Auth Request</button>
      <button onClick={handleAuthorize}>Authorize</button>
      <button onClick={handleExchange}>Exchange Tokens</button>
    </div>
  );
};
```

### Customization

#### Add Custom Parameters to PAR Request

```typescript
const parResponse = await operations.pushAuthorizationRequest(
  credentials,
  pkceCodes,
  {
    // Custom parameters
    acr_values: 'urn:pingidentity:policy:mfa',
    prompt: 'consent',
    max_age: '3600',
    ui_locales: 'en',
  }
);
```

#### Handle Errors

```typescript
try {
  const tokens = await operations.exchangeCodeForTokens(
    credentials,
    authCode,
    pkceCodes
  );
  state.updateTokens(tokens);
} catch (error) {
  console.error('Token exchange failed:', error);
  // Show error to user
}
```

#### Custom Styling

```typescript
import styled from 'styled-components';

const CustomButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
`;

// Use in your component
<CustomButton onClick={handleGeneratePKCE}>
  Generate PKCE
</CustomButton>
```

### Testing

#### Test State Management

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { usePARFlowState } from './hooks/usePARFlowState';

test('updates current step', () => {
  const { result } = renderHook(() => usePARFlowState());
  
  act(() => {
    result.current.setCurrentStep(2);
  });
  
  expect(result.current.flowState.currentStep).toBe(2);
});

test('marks step as completed', () => {
  const { result } = renderHook(() => usePARFlowState());
  
  act(() => {
    result.current.markStepCompleted(1);
  });
  
  expect(result.current.isStepCompleted(1)).toBe(true);
});
```

#### Test Operations

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { usePAROperations } from './hooks/usePAROperations';

test('generates PKCE codes', async () => {
  const { result } = renderHook(() => usePAROperations());
  
  let codes;
  await act(async () => {
    codes = await result.current.generatePKCE();
  });
  
  expect(codes.codeVerifier).toHaveLength(43);
  expect(codes.codeChallenge).toBeTruthy();
  expect(codes.codeChallengeMethod).toBe('S256');
});

test('pushes authorization request', async () => {
  const { result } = renderHook(() => usePAROperations());
  
  const credentials = {
    environmentId: 'test-env',
    clientId: 'test-client',
    clientSecret: 'test-secret',
    redirectUri: 'https://localhost:3000/callback',
    scope: 'openid profile',
  };
  
  const pkceCodes = {
    codeVerifier: 'test-verifier',
    codeChallenge: 'test-challenge',
    codeChallengeMethod: 'S256',
  };
  
  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        request_uri: 'urn:ietf:params:oauth:request_uri:test',
        expires_in: 600,
      }),
    })
  );
  
  let response;
  await act(async () => {
    response = await result.current.pushAuthorizationRequest(
      credentials,
      pkceCodes
    );
  });
  
  expect(response.request_uri).toBe('urn:ietf:params:oauth:request_uri:test');
  expect(response.expires_in).toBe(600);
});
```

### Common Patterns

#### Detect Auth Code from URL

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  
  if (code && !state.flowState.authCode) {
    state.setAuthCode(code);
    state.markStepCompleted(3);
    state.setCurrentStep(4);
  }
}, []);
```

#### Auto-advance on Step Completion

```typescript
useEffect(() => {
  if (state.isStepCompleted(state.flowState.currentStep)) {
    // Auto-advance to next step
    const nextStep = state.flowState.currentStep + 1;
    if (nextStep < PAR_FLOW_CONSTANTS.TOTAL_STEPS) {
      state.setCurrentStep(nextStep);
    }
  }
}, [state.flowState.currentStep, state.stepCompletion]);
```

#### Persist State Across Page Reloads

State is automatically persisted to `sessionStorage` by the `usePARFlowState` hook. No additional code needed!

### Debugging

#### Enable Debug Logging

```typescript
// In usePAROperations.ts
const pushAuthorizationRequest = async (...) => {
  console.log('[PAR] Pushing authorization request:', {
    credentials,
    pkceCodes,
    additionalParams,
  });
  
  const response = await fetch('/api/par', { ... });
  
  console.log('[PAR] Response:', await response.json());
  
  return response.json();
};
```

#### Inspect State

```typescript
// Add to your component
useEffect(() => {
  console.log('[PAR State]', {
    currentStep: state.flowState.currentStep,
    variant: state.flowState.flowVariant,
    hasRequestUri: !!state.flowState.parRequestUri,
    hasAuthCode: !!state.flowState.authCode,
    hasTokens: !!state.tokens,
  });
}, [state]);
```

### Performance Tips

1. **Use `useCallback` for handlers**
   ```typescript
   const handleGeneratePKCE = useCallback(async () => {
     const pkce = await operations.generatePKCE();
     state.updatePKCE(pkce);
   }, [operations, state]);
   ```

2. **Memoize expensive computations**
   ```typescript
   const authUrl = useMemo(() => {
     if (!state.flowState.parRequestUri) return null;
     return operations.generateAuthorizationUrl(
       state.credentials,
       state.flowState.parRequestUri
     );
   }, [state.flowState.parRequestUri, state.credentials]);
   ```

3. **Lazy load components**
   ```typescript
   const TokenDisplay = lazy(() => import('./components/TokenDisplay'));
   ```

### Troubleshooting

#### PAR Request Fails

```typescript
// Check credentials
console.log('Credentials:', {
  environmentId: state.credentials.environmentId,
  clientId: state.credentials.clientId,
  hasSecret: !!state.credentials.clientSecret,
});

// Check PKCE
console.log('PKCE:', {
  hasVerifier: !!state.pkceCodes.codeVerifier,
  hasChallenge: !!state.pkceCodes.codeChallenge,
});
```

#### Token Exchange Fails

```typescript
// Verify auth code
console.log('Auth Code:', state.flowState.authCode);

// Verify PKCE verifier
console.log('PKCE Verifier:', state.pkceCodes.codeVerifier);

// Check redirect URI matches
console.log('Redirect URI:', state.credentials.redirectUri);
```

### Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Check [PAR_FLOW_V8_REDESIGN.md](../../../docs/PAR_FLOW_V8_REDESIGN.md) for design decisions
3. Review [PAR_FLOW_VISUAL_COMPARISON.md](../../../docs/PAR_FLOW_VISUAL_COMPARISON.md) for UX improvements
4. Explore the Authorization Code Flow V7.1 for reference patterns

### Support

For questions or issues:
- Check the README.md in this directory
- Review the Authorization Code Flow V7.1 implementation
- Consult the PingOne documentation: https://docs.pingidentity.com

---

**Happy coding!** 🚀
