# Response Modes Components

This directory contains components for the redesigned Response Mode UI, providing a compact checkbox interface with live URL previews for OAuth/OIDC flows.

## Components

### ResponseModeSelector

The core component that provides a compact checkbox UI for selecting response modes with live URL previews.

#### Props

```typescript
interface ResponseModeSelectorProps {
  flowKey: 'authorization_code' | 'implicit' | 'hybrid' | 'device' | 'client_credentials';
  responseType: 'code' | 'token' | 'id_token' | 'token id_token' | 'code id_token' | 'code token' | 'code token id_token';
  redirectUri: string;
  clientId: string;
  scope?: string;          // e.g., "openid profile email"
  state?: string;          // optional
  nonce?: string;          // for OIDC implicit/hybrid
  extraParams?: Record<string, string>; // PAR/RAR, acr_values, prompt, etc.
  defaultMode?: 'query' | 'fragment' | 'form_post' | 'pi.flow';
  readOnlyFlowContext?: boolean; // when embedded in flows
  className?: string;
}
```

#### Features

- **Compact Design**: Collapsible interface with checkbox selection
- **Live Preview**: Real-time URL and response format examples
- **Compatibility Warnings**: Automatic validation based on response type
- **LocalStorage Persistence**: Remembers user choices per flow
- **Copy to Clipboard**: Easy copying of URLs and responses
- **Accessibility**: Proper ARIA labels and keyboard navigation

### ResponseModeExamples

Provides example presets for the learn page with common configurations.

#### Props

```typescript
interface ResponseModeExamplesProps {
  onSelectExample: (example: ResponseModeExample) => void;
  className?: string;
}
```

## Response Modes

### Query String (`response_mode=query`)
- **Best for**: Traditional web applications with server-side handling
- **Standard**: Yes, for authorization code flows
- **Security**: Parameters visible in server logs

### URL Fragment (`response_mode=fragment`)
- **Best for**: Single Page Applications (SPAs) and client-side applications
- **Standard**: Yes, recommended for token flows
- **Security**: Parameters not sent to server, client-side only

### Form POST (`response_mode=form_post`)
- **Best for**: Applications requiring secure parameter transmission without URL exposure
- **Standard**: Yes, OIDC extension
- **Security**: Parameters sent via POST body, not visible in URLs

### PingOne Flow Object (`response_mode=pi.flow`)
- **Best for**: Embedded authentication, mobile apps, headless applications, IoT devices
- **Standard**: PingOne proprietary
- **Security**: Returns flow object for server-side exchange

## Compatibility Matrix

| Flow Type | Query | Fragment | Form POST | pi.flow |
|-----------|-------|----------|-----------|---------|
| **Authorization Code** | ✅ Standard | ⚠️ Unusual | ✅ Allowed | ✅ PingOne |
| **Implicit** | ❌ Not recommended | ✅ Recommended | ⚠️ Not standard | ⚠️ Server exchange |
| **Hybrid** | ⚠️ Token leakage risk | ✅ Recommended | ✅ Secure | ⚠️ Server exchange |
| **Device Code** | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A |
| **Client Credentials** | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A |

## Usage Examples

### Basic Usage

```tsx
import ResponseModeSelector from './components/response-modes/ResponseModeSelector';

<ResponseModeSelector
  flowKey="authorization_code"
  responseType="code"
  redirectUri="https://myapp.com/callback"
  clientId="my_client_id"
  scope="openid profile email"
  state="random_state_123"
/>
```

### With Custom Parameters

```tsx
<ResponseModeSelector
  flowKey="hybrid"
  responseType="code id_token"
  redirectUri="https://myapp.com/callback"
  clientId="my_client_id"
  scope="openid profile email"
  state="random_state_123"
  nonce="random_nonce_456"
  extraParams={{
    acr_values: "1",
    prompt: "login"
  }}
  defaultMode="fragment"
/>
```

### Read-Only Mode (Embedded in Flows)

```tsx
<ResponseModeSelector
  flowKey="implicit"
  responseType="token id_token"
  redirectUri="https://myapp.com/callback"
  clientId="my_client_id"
  readOnlyFlowContext={true}
/>
```

## Integration

### Per-Flow Wrappers

Use the provided wrapper components for easy integration:

```tsx
import AuthorizationCodeResponseModes from '../features/flows/AuthorizationCode/ResponseModes';
import ImplicitResponseModes from '../features/flows/Implicit/ResponseModes';
import HybridResponseModes from '../features/flows/Hybrid/ResponseModes';
```

### Standalone Learn Page

Access the interactive learn page at `/learn/response-modes` for:
- Educational content about each response mode
- Interactive examples with editable parameters
- Compatibility matrix and best practices
- Copy-to-clipboard functionality

## Styling

The components use the existing Ping Identity design system:
- Consistent colors and typography
- Responsive design
- Dark/light mode support
- Accessibility-compliant contrast ratios

## Telemetry

The component logs selection changes and copy actions:

```typescript
console.log(`[🪪 RESPONSE-MODE] changed to ${mode} for ${flowKey}`);
```

## Testing

Run tests with:

```bash
npm test -- --testPathPattern=response-modes
```

Tests cover:
- Mode selection toggling
- Preview builders for all modes
- Compatibility warnings
- Copy to clipboard functionality
- Accessibility features

## Browser Support

- Modern browsers with ES2020+ support
- Clipboard API for copy functionality
- LocalStorage for preference persistence
- CSS Grid and Flexbox for layout
