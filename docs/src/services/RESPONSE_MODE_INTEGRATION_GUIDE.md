# Response Mode Integration Guide

This guide explains how to integrate response mode selection into OAuth/OIDC flows using the centralized `ResponseModeIntegrationService`.

## Quick Start

### 1. Import the Service

```typescript
import { useResponseModeIntegration } from '../services/responseModeIntegrationService';
```

### 2. Add Response Mode Integration

```typescript
// In your flow component
const responseModeIntegration = useResponseModeIntegration({
  flowKey: 'your-flow-key', // e.g., 'oidc-authorization-code'
  credentials: {
    // Your existing credentials object
    environmentId,
    clientId,
    clientSecret,
    scopes,
    responseType,
  },
  setCredentials: (creds) => {
    // Update your individual state variables
    if (creds.environmentId) setEnvironmentId(creds.environmentId);
    if (creds.clientId) setClientId(creds.clientId);
    if (creds.clientSecret) setClientSecret(creds.clientSecret);
    if (creds.scopes) setScopes(creds.scopes);
    if (creds.responseType) setResponseType(creds.responseType);
    if (creds.responseMode) {
      // Update your flow's credentials with the new response mode
      yourFlow.setCredentials(convertToYourFlowCredentials(creds));
    }
  },
  logPrefix: '[🔀 YOUR-FLOW]', // Optional: custom log prefix
});

const { responseMode, setResponseMode } = responseModeIntegration;
```

### 3. Add ResponseModeSelector to Your UI

```typescript
<ResponseModeSelector
  flowKey="your-flow-key"
  responseType={responseType}
  redirectUri={`${window.location.origin}/your-callback`}
  clientId={clientId}
  scope={scopes}
  state="random_state_123"
  nonce="random_nonce_456"
  defaultMode={responseMode}
  readOnlyFlowContext={false}
  onModeChange={setResponseMode}
/>
```

### 4. Update URL Generation

In your URL generation logic, use the helper function:

```typescript
import { addResponseModeToUrlParams } from '../services/responseModeIntegrationService';

// In your URL generation function
const params = new URLSearchParams({
  response_type: responseType,
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: scopes,
  state,
});

// Add response_mode parameter
addResponseModeToUrlParams(params, responseMode);

const url = `${baseUrl}?${params.toString()}`;
```

## Advanced Usage

### Using the HOC Wrapper

For even simpler integration, use the `ResponseModeIntegrationWrapper`:

```typescript
import ResponseModeIntegrationWrapper from '../components/ResponseModeIntegrationWrapper';

// Wrap your flow content
<ResponseModeIntegrationWrapper
  flowKey="your-flow-key"
  responseType={responseType}
  redirectUri={`${window.location.origin}/your-callback`}
  clientId={clientId}
  scope={scopes}
  credentials={credentials}
  setCredentials={setCredentials}
  onAuthUrlClear={() => yourFlow.clearAuthUrl()}
>
  {/* Your existing flow content */}
</ResponseModeIntegrationWrapper>
```

### Custom Response Mode Handling

If you need custom response mode handling:

```typescript
const {
  responseMode,
  setResponseMode,
  responseModeChanged,
  setResponseModeChanged,
  updateCredentialsWithResponseMode,
  clearAuthUrl,
} = useResponseModeIntegration({
  flowKey: 'your-flow-key',
  credentials,
  setCredentials,
});

// Custom handling
const handleResponseModeChange = (mode) => {
  setResponseMode(mode);
  setResponseModeChanged(true);
  
  // Your custom logic here
  yourFlow.clearAuthUrl();
  // ... other custom actions
};
```

## Supported Flow Types

The service automatically determines default response modes for:

- `authorization-code` / `oidc-authorization-code` → `query`
- `implicit` / `oidc-implicit` → `fragment`
- `hybrid` / `oidc-hybrid` → `fragment`
- `redirectless` → `pi.flow`

## Benefits

1. **Centralized Logic**: All response mode handling in one place
2. **Consistent Behavior**: Same behavior across all flows
3. **Easy Integration**: Minimal code changes required
4. **Automatic Updates**: Credentials update automatically when response mode changes
5. **Logging**: Built-in logging for debugging
6. **Type Safety**: Full TypeScript support

## Migration from Manual Implementation

If you have existing manual response mode handling:

1. Remove your manual `useState` for response mode
2. Remove your manual `useEffect` for response mode changes
3. Replace with the service integration
4. Update your URL generation to use `addResponseModeToUrlParams`

## Example: Complete Integration

```typescript
// Before (manual implementation)
const [responseMode, setResponseMode] = useState('fragment');
const [responseModeChanged, setResponseModeChanged] = useState(false);

useEffect(() => {
  if (responseModeChanged && credentials) {
    // Manual credential update logic
  }
}, [responseModeChanged, credentials]);

// After (service integration)
const { responseMode, setResponseMode } = useResponseModeIntegration({
  flowKey: 'your-flow-key',
  credentials,
  setCredentials,
});
// That's it! Everything else is handled automatically.
```
