# OIDC Discovery Service Integration Guide

## Overview

The OIDC Discovery service automates the process of discovering OpenID Connect endpoints from an issuer URL, eliminating the need for users to manually enter environment IDs and endpoint URLs. This guide shows you how to integrate it into your OAuth/OIDC flow configurations.

## Current Implementation Status

### ✅ **Flows with OIDC Discovery Integration**
- `OAuthAuthorizationCodeFlowV5.tsx`
- `OIDCHybridFlowV5.tsx`

### ❌ **Flows Missing OIDC Discovery Integration**
- `OIDCAuthorizationCodeFlowV5_New.tsx`
- `OIDCAuthorizationCodeFlowV5.tsx`
- `OIDCImplicitFlowV5_Full.tsx`
- `OIDCImplicitFlowV5.tsx`
- `OAuthImplicitFlowV5.tsx`
- `ClientCredentialsFlowV5.tsx`
- `DeviceAuthorizationFlowV5.tsx`
- `OIDCDeviceAuthorizationFlowV5.tsx`
- `RedirectlessFlowV5_Real.tsx`
- `JWTBearerTokenFlowV5.tsx`
- `OAuthResourceOwnerPasswordFlowV5.tsx`
- `OIDCResourceOwnerPasswordFlowV5.tsx`
- `PingOneMFAFlowV5.tsx`
- `PingOnePARFlowV5.tsx`
- `RARFlowV5.tsx`
- `WorkerTokenFlowV5.tsx`

## Step-by-Step Integration Guide

### 1. **Import Required Components**

Add these imports to your flow component:

```typescript
import OIDCDiscoveryInput from '../../components/OIDCDiscoveryInput';
import { oidcDiscoveryService } from '../../services/oidcDiscoveryService';
```

### 2. **Add OIDC Discovery to Your Configuration Section**

Place the `OIDCDiscoveryInput` component in your credentials/configuration section, typically before the `CredentialsInput` component:

```typescript
<CollapsibleSection>
  <CollapsibleHeaderButton
    onClick={() => toggleSection('credentials')}
    aria-expanded={!collapsedSections.credentials}
  >
    <CollapsibleTitle>
      <FiSettings /> Application Configuration & Credentials
    </CollapsibleTitle>
    <CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
      <FiChevronDown />
    </CollapsibleToggleIcon>
  </CollapsibleHeaderButton>
  {!collapsedSections.credentials && (
    <CollapsibleContent>
      {/* OIDC Discovery Input */}
      <OIDCDiscoveryInput
        onDiscoveryComplete={async (result) => {
          if (result.success && result.document) {
            console.log('[Flow Name] OIDC Discovery completed successfully');
            
            // Auto-populate environment ID if it's a PingOne issuer
            const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
            if (envId) {
              // Update your environment ID field
              handleFieldChange('environmentId', envId);
              // OR if using state directly:
              // setEnvironmentId(envId);
            }
            
            // Set default redirect URI if not already set
            if (!credentials.redirectUri) {
              handleFieldChange('redirectUri', 'http://localhost:3000/callback');
              // OR if using state directly:
              // setRedirectUri('http://localhost:3000/callback');
            }
            
            // Optional: Auto-populate other fields from discovery document
            if (result.document.scopes_supported) {
              // Update available scopes
              console.log('Available scopes:', result.document.scopes_supported);
            }
          }
        }}
        showSuggestions={true}
        autoDiscover={false}
      />
      
      <SectionDivider />
      
      {/* Your existing CredentialsInput component */}
      <CredentialsInput
        environmentId={environmentId}
        clientId={clientId}
        clientSecret={clientSecret}
        scopes={scopes}
        onEnvironmentIdChange={setEnvironmentId}
        onClientIdChange={setClientId}
        onClientSecretChange={setClientSecret}
        onScopesChange={setScopes}
        onCopy={handleCopy}
        showRedirectUri={false}
        showLoginHint={false}
      />
    </CollapsibleContent>
  )}
</CollapsibleSection>
```

### 3. **Customize the Discovery Handler**

The `onDiscoveryComplete` callback is where you handle the discovery results. Here are common patterns:

#### **Basic Implementation (Most Flows)**
```typescript
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    // Extract environment ID for PingOne URLs
    const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
    if (envId) {
      handleFieldChange('environmentId', envId);
    }
    
    // Set default redirect URI
    if (!credentials.redirectUri) {
      handleFieldChange('redirectUri', 'http://localhost:3000/callback');
    }
  }
}}
```

#### **Advanced Implementation (With Full Discovery)**
```typescript
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    const doc = result.document;
    
    // Auto-populate environment ID
    const envId = oidcDiscoveryService.extractEnvironmentId(doc.issuer);
    if (envId) {
      handleFieldChange('environmentId', envId);
    }
    
    // Set default redirect URI
    if (!credentials.redirectUri) {
      handleFieldChange('redirectUri', 'http://localhost:3000/callback');
    }
    
    // Update available scopes based on discovery
    if (doc.scopes_supported) {
      const availableScopes = doc.scopes_supported.filter(scope => 
        ['openid', 'profile', 'email', 'address', 'phone'].includes(scope)
      );
      console.log('Available OIDC scopes:', availableScopes);
    }
    
    // Check for specific endpoints
    if (doc.device_authorization_endpoint) {
      console.log('Device authorization supported');
    }
    
    if (doc.pushed_authorization_request_endpoint) {
      console.log('PAR supported');
    }
  } else {
    console.error('Discovery failed:', result.error);
  }
}}
```

#### **OIDC-Specific Implementation**
For OIDC flows, you might want to auto-populate OIDC-specific scopes:

```typescript
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
    if (envId) {
      handleFieldChange('environmentId', envId);
    }
    
    // Auto-set OIDC scopes if not already configured
    if (!credentials.scopes || !credentials.scopes.includes('openid')) {
      const defaultOIDCScopes = 'openid profile email';
      handleFieldChange('scopes', defaultOIDCScopes);
    }
    
    if (!credentials.redirectUri) {
      handleFieldChange('redirectUri', 'http://localhost:3000/callback');
    }
  }
}}
```

### 4. **Component Props Reference**

#### **OIDCDiscoveryInput Props**
```typescript
interface OIDCDiscoveryInputProps {
  onDiscoveryComplete?: (result: DiscoveryResult) => void;  // Required
  onCredentialsGenerated?: (credentials: any) => void;      // Optional
  initialIssuerUrl?: string;                                // Optional
  className?: string;                                       // Optional
  disabled?: boolean;                                       // Optional
  showSuggestions?: boolean;                                // Optional (default: true)
  autoDiscover?: boolean;                                   // Optional (default: false)
}
```

#### **DiscoveryResult Interface**
```typescript
interface DiscoveryResult {
  success: boolean;
  document?: OIDCDiscoveryDocument;  // The discovered configuration
  issuerUrl?: string;                // The issuer URL used
  error?: string;                    // Error message if failed
  cached?: boolean;                  // Whether result was from cache
}
```

### 5. **Service Methods Reference**

#### **oidcDiscoveryService Methods**
```typescript
// Discover endpoints from issuer URL
const result = await oidcDiscoveryService.discover({ 
  issuerUrl: 'https://auth.pingone.com/your-env-id' 
});

// Extract environment ID from PingOne issuer URL
const envId = oidcDiscoveryService.extractEnvironmentId(issuerUrl);

// Convert discovery document to credentials format
const credentials = oidcDiscoveryService.documentToCredentials(
  discoveryDocument,
  clientId,
  clientSecret,
  redirectUri
);

// Check if issuer is a PingOne URL
const isPingOne = oidcDiscoveryService.isPingOneIssuer(issuerUrl);

// Get suggested issuer URLs by region
const suggestions = oidcDiscoveryService.getSuggestedIssuers();
```

### 6. **Integration Examples by Flow Type**

#### **Authorization Code Flows**
```typescript
// OAuthAuthorizationCodeFlowV5.tsx - Already implemented
// OIDCAuthorizationCodeFlowV5.tsx - Needs implementation
```

#### **Implicit Flows**
```typescript
// OAuthImplicitFlowV5.tsx - Needs implementation
// OIDCImplicitFlowV5.tsx - Needs implementation
```

#### **Client Credentials Flow**
```typescript
// ClientCredentialsFlowV5.tsx - Needs implementation
// Note: Client Credentials flow typically doesn't need redirect URIs
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
    if (envId) {
      handleFieldChange('environmentId', envId);
    }
    // No redirect URI needed for client credentials
  }
}}
```

#### **Device Authorization Flow**
```typescript
// DeviceAuthorizationFlowV5.tsx - Needs implementation
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
    if (envId) {
      handleFieldChange('environmentId', envId);
    }
    
    // Check if device authorization endpoint is available
    if (!result.document.device_authorization_endpoint) {
      console.warn('Device authorization endpoint not found in discovery document');
    }
  }
}}
```

### 7. **Best Practices**

#### **Error Handling**
```typescript
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    // Handle successful discovery
    const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
    if (envId) {
      handleFieldChange('environmentId', envId);
    }
  } else {
    // Handle discovery failure
    console.error('OIDC Discovery failed:', result.error);
    // Optionally show user-friendly error message
    v4ToastManager.showError(`Discovery failed: ${result.error}`);
  }
}}
```

#### **Caching Considerations**
```typescript
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    // Discovery results are automatically cached for 1 hour
    if (result.cached) {
      console.log('Using cached discovery results');
    }
    
    // Your discovery handling logic here
  }
}}
```

#### **Validation**
```typescript
onDiscoveryComplete={async (result) => {
  if (result.success && result.document) {
    const doc = result.document;
    
    // Validate required endpoints for your flow
    const requiredEndpoints = ['authorization_endpoint', 'token_endpoint'];
    const missingEndpoints = requiredEndpoints.filter(
      endpoint => !doc[endpoint]
    );
    
    if (missingEndpoints.length > 0) {
      console.error('Missing required endpoints:', missingEndpoints);
      return;
    }
    
    // Continue with discovery handling
  }
}}
```

### 8. **Testing Your Integration**

#### **Test with Different Issuer URLs**
```typescript
// PingOne US
https://auth.pingone.com/your-environment-id

// PingOne EU
https://auth.pingone.eu/your-environment-id

// Custom OIDC provider
https://your-oidc-provider.com/issuer
```

#### **Verify Auto-Population**
1. Enter a PingOne issuer URL
2. Click "Discover"
3. Verify that environment ID is auto-populated
4. Verify that redirect URI is set (if applicable)
5. Check console for discovery results

### 9. **Common Issues and Solutions**

#### **Issue: Environment ID not extracted**
```typescript
// Solution: Ensure issuer URL format is correct
// Correct: https://auth.pingone.com/your-env-id
// Incorrect: https://auth.pingone.com/your-env-id/
```

#### **Issue: Discovery fails with CORS**
```typescript
// Solution: The service handles CORS through backend proxy
// No additional configuration needed
```

#### **Issue: Custom scopes not available**
```typescript
// Solution: Check discovery document for supported scopes
if (result.document.scopes_supported) {
  console.log('Supported scopes:', result.document.scopes_supported);
}
```

## Implementation Checklist

For each flow that needs OIDC Discovery integration:

- [ ] Add imports for `OIDCDiscoveryInput` and `oidcDiscoveryService`
- [ ] Add `OIDCDiscoveryInput` component to credentials section
- [ ] Implement `onDiscoveryComplete` handler
- [ ] Auto-populate environment ID from PingOne URLs
- [ ] Set default redirect URI (if applicable)
- [ ] Test with different issuer URLs
- [ ] Verify error handling
- [ ] Check console for discovery results
- [ ] Update flow documentation

## Benefits of Integration

1. **Simplified Configuration**: Users only need to enter an issuer URL
2. **Automatic Endpoint Discovery**: No need to manually enter endpoint URLs
3. **Environment ID Extraction**: Automatic extraction from PingOne URLs
4. **Error Reduction**: Less chance of configuration errors
5. **Standards Compliance**: Follows RFC 8414 OIDC Discovery specification
6. **Caching**: Automatic caching for better performance
7. **Validation**: Built-in endpoint validation

This integration significantly improves the user experience by automating the most error-prone part of OAuth/OIDC configuration.
