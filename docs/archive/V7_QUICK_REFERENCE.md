# V7 Flows Quick Reference

**Fast lookup guide for V7 flow development**

---

## 🚀 Quick Start

### Create a New V7 Flow (5 minutes)

```typescript
// 1. Create file: src/pages/flows/MyFlowV7.tsx
import React from 'react';
import { V7FlowTemplate } from '../../templates/V7FlowTemplate';
import { FlowUIService } from '../../services/flowUIService';

const { Button, InfoBox } = FlowUIService.getFlowUIComponents();

export const MyFlowV7: React.FC = () => {
  const stepMetadata = [
    { title: 'Setup', subtitle: 'Configure', description: 'Setup' },
    { title: 'Execute', subtitle: 'Run', description: 'Execute' },
    { title: 'Results', subtitle: 'View', description: 'Results' }
  ];
  
  return (
    <V7FlowTemplate
      flowName="my-flow-v7"
      flowTitle="My Flow V7"
      flowSubtitle="Brief description"
      stepMetadata={stepMetadata}
      renderStepContent={(step) => <div>Step {step}</div>}
    />
  );
};

export default MyFlowV7;
```

---

## 📚 Flow Names Reference

### OAuth 2.0 Flows
```typescript
'oauth-authorization-code-v7'      // Authorization Code
'oauth-implicit-v7'                // Implicit (deprecated)
'oauth-device-authorization-v7'    // Device Flow
'oauth-client-credentials-v7'      // Client Credentials
'oauth-ropc-v7'                    // Resource Owner Password
'oauth-token-exchange-v7'          // Token Exchange
'oauth-jwt-bearer-token-v7'        // JWT Bearer
```

### OIDC Flows
```typescript
'oidc-authorization-code-v7'       // OIDC Auth Code
'oidc-implicit-v7'                 // OIDC Implicit
'oidc-hybrid-v7'                   // OIDC Hybrid
'oidc-device-authorization-v7'     // OIDC Device
'oidc-ciba-v7'                     // CIBA
```

### PingOne Flows
```typescript
'pingone-par-v7'                   // Pushed Authorization Requests
'pingone-mfa-v7'                   // Multi-Factor Authentication
```

### Advanced Flows
```typescript
'rar-v7'                           // Rich Authorization Requests
'saml-bearer-assertion-v7'         // SAML Bearer Assertion
```

---

## 🎨 UI Components Cheat Sheet

### Import Components
```typescript
import { FlowUIService } from '../../services/flowUIService';

const {
  // Layout
  Container, ContentWrapper, MainCard,
  
  // Headers
  StepHeader, StepHeaderLeft, StepHeaderTitle, StepHeaderSubtitle,
  StepHeaderRight, StepNumber, StepTotal, VersionBadge,
  
  // Content
  StepContentWrapper, CollapsibleSection, InfoBox,
  
  // Actions
  Button, HighlightedActionButton, ActionRow,
  
  // Display
  CodeBlock, GeneratedContentBox, ParameterGrid,
  
  // Sections
  SectionDivider, ResultsSection, ResultsHeading
} = FlowUIService.getFlowUIComponents();
```

### Common Patterns

#### Info Box
```typescript
<InfoBox $variant="success">Success message</InfoBox>
<InfoBox $variant="error">Error message</InfoBox>
<InfoBox $variant="warning">Warning message</InfoBox>
<InfoBox $variant="info">Info message</InfoBox>
```

#### Button
```typescript
<Button onClick={handleClick}>Click Me</Button>
<HighlightedActionButton onClick={handleAction}>
  Primary Action
</HighlightedActionButton>
```

#### Code Block
```typescript
<CodeBlock>
  {JSON.stringify(data, null, 2)}
</CodeBlock>
```

#### Collapsible Section
```typescript
<CollapsibleSection>
  <CollapsibleHeaderButton onClick={() => toggle('section1')}>
    <CollapsibleTitle>Section Title</CollapsibleTitle>
    <CollapsibleContent>
      {/* Content here */}
    </CollapsibleContent>
  </CollapsibleHeaderButton>
</CollapsibleSection>
```

---

## 🔧 V7SharedService API

### Import
```typescript
import { V7SharedService } from '../services/sharedService';
```

### ID Token Validation
```typescript
const validation = await V7SharedService.IDTokenValidation.validateIDToken(
  idToken,           // string
  issuer,            // string
  audience,          // string
  nonce,             // string | undefined
  jwksUri,           // string | undefined
  flowName           // V7FlowName
);

// Returns: { isValid: boolean, errors: string[], claims?: any }
```

### Parameter Validation
```typescript
const validation = V7SharedService.ParameterValidation.validateFlowParameters(
  flowName,          // V7FlowName
  parameters         // Record<string, any>
);

// Returns: { isValid: boolean, errors: string[], warnings: string[] }
```

### Error Handling
```typescript
// OAuth errors
const error = V7SharedService.ErrorHandling.handleOAuthError(
  error,             // any
  context            // { flowName, step, operation, timestamp }
);

// OIDC errors
const error = V7SharedService.ErrorHandling.handleOIDCError(
  error,             // any
  context            // { flowName, step, operation, timestamp }
);

// Scenario errors
const error = V7SharedService.ErrorHandling.createScenarioError(
  scenario,          // string (e.g., 'invalid_request')
  context            // { flowName, step, operation, timestamp }
);

// Returns: { error: string, error_description: string, error_uri?: string }
```

### Security Headers
```typescript
const headers = V7SharedService.SecurityHeaders.getSecurityHeaders(
  flowName           // V7FlowName
);

// Returns: Record<string, string>
```

### Compliance Check
```typescript
const compliance = V7SharedService.SpecificationCompliance.checkFlowCompliance(
  flowName           // V7FlowName
);

// Returns: {
//   isCompliant: boolean,
//   complianceScore: number,
//   missingFeatures: string[],
//   recommendations: string[]
// }
```

---

## 🎯 Common Patterns

### Pattern 1: Basic Flow Setup
```typescript
export const MyFlowV7: React.FC = () => {
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    environmentId: ''
  });
  
  const stepMetadata = [
    { title: 'Setup', subtitle: 'Configure', description: 'Setup credentials' },
    { title: 'Execute', subtitle: 'Run', description: 'Execute flow' },
    { title: 'Results', subtitle: 'View', description: 'View results' }
  ];
  
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: return <SetupStep credentials={credentials} onChange={setCredentials} />;
      case 1: return <ExecuteStep credentials={credentials} />;
      case 2: return <ResultsStep />;
      default: return null;
    }
  };
  
  return (
    <V7FlowTemplate
      flowName="my-flow-v7"
      flowTitle="My Flow V7"
      flowSubtitle="Description"
      stepMetadata={stepMetadata}
      renderStepContent={renderStepContent}
    />
  );
};
```

### Pattern 2: With Validation
```typescript
const handleExecute = async () => {
  // Validate parameters
  const validation = V7SharedService.ParameterValidation.validateFlowParameters(
    'my-flow-v7',
    { client_id: credentials.clientId, /* ... */ }
  );
  
  if (!validation.isValid) {
    v4ToastManager.showError(`Validation failed: ${validation.errors.join(', ')}`);
    return;
  }
  
  try {
    // Execute flow
    const result = await executeFlow();
    v4ToastManager.showSuccess('Flow completed successfully');
  } catch (error) {
    const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(
      error,
      { flowName: 'my-flow-v7', step: 'execute', operation: 'flow_execution', timestamp: Date.now() }
    );
    v4ToastManager.showError(errorResponse.error_description);
  }
};
```

### Pattern 3: With ID Token Validation
```typescript
const handleTokenResponse = async (tokens: any) => {
  if (tokens.id_token) {
    const validation = await V7SharedService.IDTokenValidation.validateIDToken(
      tokens.id_token,
      `https://auth.pingone.com/${credentials.environmentId}/as`,
      credentials.clientId,
      nonce,
      `https://auth.pingone.com/${credentials.environmentId}/as/jwks`,
      'oidc-authorization-code-v7'
    );
    
    if (validation.isValid) {
      v4ToastManager.showSuccess('ID token is valid');
      console.log('Claims:', validation.claims);
    } else {
      v4ToastManager.showError(`ID token validation failed: ${validation.errors.join(', ')}`);
    }
  }
};
```

### Pattern 4: Step Navigation Control
```typescript
const canNavigateNext = (step: number): boolean => {
  switch (step) {
    case 0:
      return Boolean(credentials.clientId && credentials.environmentId);
    case 1:
      return Boolean(authCode);
    case 2:
      return true;
    default:
      return false;
  }
};

<V7FlowTemplate
  // ... other props
  canNavigateNext={canNavigateNext}
/>
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging
```typescript
// V7SharedService logs to console with timestamps
// Look for: [🔧 V7-SHARED] prefix
```

### Check Validation Results
```typescript
const validation = V7SharedService.ParameterValidation.validateFlowParameters(
  flowName,
  parameters
);
console.log('Validation:', validation);
// { isValid: false, errors: ['Missing required parameter: client_id'], warnings: [] }
```

### View Error Statistics
```typescript
const stats = V7SharedService.ErrorHandling.getErrorStatistics();
console.log('Error stats:', stats);
// { totalErrors: 5, errorsByCode: { invalid_request: 3, invalid_grant: 2 } }
```

### Clear Error Log
```typescript
V7SharedService.ErrorHandling.clearErrorLog();
```

---

## 📋 Checklist for New V7 Flow

- [ ] Create flow file in `src/pages/flows/`
- [ ] Add flow name to `V7FlowName` type in `sharedService.ts`
- [ ] Define step metadata (at least 3 steps)
- [ ] Implement `renderStepContent` function
- [ ] Add parameter validation
- [ ] Add error handling
- [ ] Test all steps
- [ ] Add route in routing configuration
- [ ] Register in `comprehensiveFlowDataService.ts`
- [ ] Add documentation comments
- [ ] Test error scenarios
- [ ] Verify compliance features work

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't: Create custom error handling
```typescript
catch (error) {
  alert('Error: ' + error.message);  // DON'T DO THIS
}
```

### ✅ Do: Use V7SharedService
```typescript
catch (error) {
  const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(error, context);
  v4ToastManager.showError(errorResponse.error_description);
}
```

### ❌ Don't: Skip validation
```typescript
const authUrl = buildAuthUrl(params);  // No validation!
```

### ✅ Do: Validate first
```typescript
const validation = V7SharedService.ParameterValidation.validateFlowParameters(flowName, params);
if (!validation.isValid) return;
const authUrl = buildAuthUrl(params);
```

### ❌ Don't: Use custom styled components
```typescript
const MyBox = styled.div`...`;  // Creates inconsistency
```

### ✅ Do: Use FlowUIService
```typescript
const { InfoBox } = FlowUIService.getFlowUIComponents();
<InfoBox $variant="info">...</InfoBox>
```

---

## 🔗 Quick Links

- **Full Documentation**: `docs/V7_FLOWS_DOCUMENTATION.md`
- **Template**: `src/templates/V7FlowTemplate.tsx`
- **Shared Service**: `src/services/sharedService.ts`
- **UI Service**: `src/services/flowUIService.ts`
- **Example Flows**: `src/pages/flows/*V7.tsx`

---

## 💡 Pro Tips

1. **Copy an existing V7 flow** as a starting point
2. **Use TypeScript types** for better IDE support
3. **Test with invalid inputs** to verify error handling
4. **Check console logs** for V7SharedService messages
5. **Follow the template structure** for consistency
6. **Document your flow** with JSDoc comments
7. **Use shared UI components** for consistency
8. **Validate early and often** to catch issues

---

*Quick Reference v7.0.0 - November 2025*
