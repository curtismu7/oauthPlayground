# Response Mode Integration Guide

This guide shows how to integrate the ResponseModeSelector into existing OAuth/OIDC flows.

## Quick Integration Steps

### 1. Add Response Mode State

Add response mode state to your flow component:

```typescript
import { ResponseMode } from '../../services/responseModeService';

const [responseMode, setResponseMode] = useState<ResponseMode>('fragment');
```

### 2. Update CredentialsInput

Update your CredentialsInput component to include response mode selection:

```typescript
<CredentialsInput
  environmentId={environmentId}
  clientId={clientId}
  clientSecret={clientSecret}
  scopes={scopes}
  responseMode={responseMode}
  flowKey="authorization_code" // or "implicit", "hybrid", etc.
  responseType="code" // or "token", "id_token", etc.
  onEnvironmentIdChange={setEnvironmentId}
  onClientIdChange={setClientId}
  onClientSecretChange={setClientSecret}
  onScopesChange={setScopes}
  onResponseModeChange={setResponseMode}
  onCopy={handleCopy}
  showResponseModeSelector={true} // Enable the response mode selector
  // ... other props
/>
```

### 3. Update URL Generation

Make sure your flow hook uses the response mode when generating URLs:

```typescript
// In your flow hook (e.g., useAuthorizationCodeFlow.ts)
const generateAuthorizationUrl = useCallback(() => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    scope: scopes,
    state: state,
    response_mode: responseMode, // Include the selected response mode
    // ... other params
  });
  
  return `${baseUrl}?${params.toString()}`;
}, [clientId, redirectUri, responseType, scopes, state, responseMode]);
```

### 4. Pass Response Mode to Flow Hook

When setting credentials, include the response mode:

```typescript
flowHook.setCredentials({
  environmentId,
  clientId,
  clientSecret,
  scopes,
  responseType,
  responseMode, // Include response mode
});
```

## Flow-Specific Examples

### Authorization Code Flow

```typescript
// Default to 'query' for authorization code flows
const [responseMode, setResponseMode] = useState<ResponseMode>('query');

<CredentialsInput
  // ... other props
  flowKey="authorization_code"
  responseType="code"
  responseMode={responseMode}
  onResponseModeChange={setResponseMode}
  showResponseModeSelector={true}
/>
```

### Implicit Flow

```typescript
// Default to 'fragment' for implicit flows
const [responseMode, setResponseMode] = useState<ResponseMode>('fragment');

<CredentialsInput
  // ... other props
  flowKey="implicit"
  responseType="token id_token"
  responseMode={responseMode}
  onResponseModeChange={setResponseMode}
  showResponseModeSelector={true}
/>
```

### Hybrid Flow

```typescript
// Default to 'fragment' for hybrid flows
const [responseMode, setResponseMode] = useState<ResponseMode>('fragment');

<CredentialsInput
  // ... other props
  flowKey="hybrid"
  responseType="code id_token"
  responseMode={responseMode}
  onResponseModeChange={setResponseMode}
  showResponseModeSelector={true}
/>
```

## Features Included

✅ **Compact Design**: Integrated into CredentialsInput, no separate component needed  
✅ **Live Preview**: Real-time URL and response format examples  
✅ **Compatibility Warnings**: Automatic validation based on response type  
✅ **LocalStorage Persistence**: Remembers user choices per flow  
✅ **Copy to Clipboard**: Easy copying of URLs and responses  
✅ **Accessibility**: Proper ARIA labels and keyboard navigation  

## Response Modes Available

- **Query String** (`query`) - Traditional server-side apps
- **URL Fragment** (`fragment`) - SPAs (recommended for tokens)
- **Form POST** (`form_post`) - Secure parameter transmission
- **PingOne Flow Object** (`pi.flow`) - Embedded auth without redirects

## Testing

After integration, test that:
1. Response mode selection updates the preview
2. Selected mode is used in generated URLs
3. Compatibility warnings appear correctly
4. User preferences are saved and restored
5. Copy functionality works for URLs and responses
