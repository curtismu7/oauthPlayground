# V5 Flow Header Standardization Guide

## Overview

This document outlines the standardized header system for all V5 OAuth and OIDC flows using the `flowHeaderService`.

## Service Location

```
src/services/flowHeaderService.tsx
```

## Usage

### Basic Usage

```tsx
import { FlowHeader } from '../../services/flowHeaderService';

// In your flow component
<FlowHeader flowId="oauth-authorization-code-v5" />
```

### Custom Configuration

```tsx
<FlowHeader 
  flowId="oauth-authorization-code-v5" 
  customConfig={{
    subtitle: "Custom subtitle for this specific implementation"
  }}
/>
```

## Supported Flow IDs

### OAuth 2.0 V5 Flows
- `oauth-authorization-code-v5`
- `oauth-implicit-v5` 
- `client-credentials-v5`
- `device-authorization-v5`

### OIDC V5 Flows
- `oidc-authorization-code-v5`
- `oidc-implicit-v5`
- `oidc-client-credentials-v5`
- `hybrid-v5`
- `oidc-device-authorization-v5`

### PingOne Token Flows
- `worker-token-v5`
- `pingone-par-v5`
- `redirectless-flow-v5`

## Header Styling

Each flow type has its own color scheme:

- **OAuth 2.0**: Blue gradient (`#3b82f6` to `#1d4ed8`)
- **OIDC**: Green gradient (`#10b981` to `#047857`) 
- **PingOne**: Orange gradient (`#f59e0b` to `#d97706`)

## Migration Steps

To migrate existing V5 flows to use the standardized headers:

1. **Import the service**:
   ```tsx
   import { FlowHeader } from '../../services/flowHeaderService';
   ```

2. **Replace existing header JSX**:
   ```tsx
   // Replace this:
   <Header>
     <Badge>🔑 Client Credentials Flow V5</Badge>
     <MainTitle>Client Credentials Flow</MainTitle>
     <Subtitle>Description...</Subtitle>
   </Header>

   // With this:
   <FlowHeader flowId="client-credentials-v5" />
   ```

3. **Remove old header styled components** (if no longer used):
   - `Header`
   - `Badge` 
   - `MainTitle`
   - `Subtitle`

## Files to Update

### High Priority (V5 Flows)
- [ ] `src/pages/flows/OAuthAuthorizationCodeFlowV5.tsx` ✅
- [ ] `src/pages/flows/ClientCredentialsFlowV5.tsx` ✅
- [ ] `src/pages/flows/OIDCAuthorizationCodeFlowV5.tsx`
- [ ] `src/pages/flows/OIDCClientCredentialsFlowV5.tsx`
- [ ] `src/pages/flows/OIDCImplicitFlowV5.tsx`
- [ ] `src/pages/flows/OAuthImplicitFlowV5.tsx`
- [ ] `src/pages/flows/DeviceAuthorizationFlowV5.tsx`
- [ ] `src/pages/flows/OIDCDeviceAuthorizationFlowV5.tsx`
- [ ] `src/pages/flows/OIDCHybridFlowV5.tsx`
- [ ] `src/pages/flows/WorkerTokenFlowV5.tsx`
- [ ] `src/pages/flows/PingOnePARFlowV5.tsx`
- [ ] `src/pages/flows/RedirectlessFlowV5.tsx`

### Medium Priority (PingOne Specific)
- [ ] Other PingOne-specific flows

## Benefits

1. **Consistency**: All V5 flows have identical header styling and structure
2. **Maintainability**: Single source of truth for flow metadata
3. **Branding**: Consistent color coding by flow type
4. **Accessibility**: Standardized semantic structure
5. **Responsive**: Built-in mobile responsiveness

## Configuration Schema

```tsx
interface FlowHeaderConfig {
  flowType: 'oauth' | 'oidc' | 'pingone';
  title: string;
  subtitle: string;
  icon?: string;
  version?: string;
}
```

## Adding New Flows

To add a new V5 flow:

1. Add configuration to `FLOW_CONFIGS` in `flowHeaderService.tsx`
2. Use the appropriate `flowType` for color coding
3. Follow naming conventions: `{protocol}-{flow-name}-v5`

Example:
```tsx
'oauth-new-flow-v5': {
  flowType: 'oauth',
  title: 'OAuth 2.0 New Flow (V5)',
  subtitle: 'Description of the new flow...',
  icon: '🆕',
  version: 'V5',
}
```