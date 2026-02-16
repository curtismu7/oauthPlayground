# V7 Migration Guide

**Upgrading flows from previous versions to V7 architecture**

---

## Overview

This guide helps you migrate existing OAuth/OIDC flows to the V7 architecture. V7 provides significant improvements in consistency, maintainability, and specification compliance.

---

## Why Migrate to V7?

### Benefits

✅ **80% Less Boilerplate** - Standardized template eliminates repetitive code  
✅ **Built-in Compliance** - Automatic parameter validation and error handling  
✅ **Consistent UX** - Unified UI components across all flows  
✅ **Better Maintainability** - Single source of truth for common functionality  
✅ **Type Safety** - Full TypeScript support with proper types  
✅ **Educational Value** - Self-documenting structure with clear patterns  

### What's New in V7

| Feature | Pre-V7 | V7 |
|---------|--------|-----|
| **Template** | Custom per flow | Unified V7FlowTemplate |
| **UI Components** | Mixed/custom | FlowUIService (shared) |
| **Validation** | Manual checks | V7SharedService.ParameterValidation |
| **Error Handling** | Flow-specific | V7SharedService.ErrorHandling |
| **ID Token Validation** | Manual/inconsistent | V7SharedService.IDTokenValidation |
| **Security Headers** | Not standardized | V7SharedService.SecurityHeaders |
| **Compliance Checking** | None | Built-in compliance scoring |
| **Documentation** | Scattered | Comprehensive and consistent |

---

## Migration Checklist

### Pre-Migration

- [ ] Read V7 documentation
- [ ] Review quick reference
- [ ] Study existing V7 flows as examples
- [ ] Identify flow to migrate
- [ ] Back up existing flow file

### During Migration

- [ ] Create new V7 flow file
- [ ] Add flow name to V7FlowName type
- [ ] Implement step metadata
- [ ] Convert UI to FlowUIService components
- [ ] Add parameter validation
- [ ] Add error handling
- [ ] Test all steps

### Post-Migration

- [ ] Update routing
- [ ] Update flow registry
- [ ] Test error scenarios
- [ ] Verify compliance features
- [ ] Update documentation
- [ ] Archive old flow file

---

## Step-by-Step Migration

### Step 1: Analyze Existing Flow

Before migrating, understand your current flow:

```typescript
// Example: Pre-V7 flow structure
export const MyOldFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [credentials, setCredentials] = useState({...});
  const [tokens, setTokens] = useState(null);
  
  // Custom state management
  // Custom error handling
  // Custom UI components
  
  return (
    <CustomContainer>
      {/* Custom implementation */}
    </CustomContainer>
  );
};
```

**Identify:**
- Number of steps
- State variables needed
- API calls made
- Error handling patterns
- UI components used

### Step 2: Create V7 Flow File

Create a new file with V7 suffix:

```bash
# Old file
src/pages/flows/MyFlow.tsx

# New V7 file
src/pages/flows/MyFlowV7.tsx
```

### Step 3: Add Flow Name Type

In `src/services/sharedService.ts`:

```typescript
export type V7FlowName =
  | 'existing-flows...'
  | 'my-flow-v7';  // Add your flow
```

### Step 4: Set Up Basic Structure

```typescript
// src/pages/flows/MyFlowV7.tsx
import React, { useState } from 'react';
import { V7FlowTemplate } from '../../templates/V7FlowTemplate';
import { FlowUIService } from '../../services/flowUIService';
import { V7SharedService } from '../../services/sharedService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const { Button, InfoBox, CodeBlock, ActionRow } = FlowUIService.getFlowUIComponents();

export const MyFlowV7: React.FC = () => {
  // State from old flow
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    environmentId: ''
  });
  const [tokens, setTokens] = useState(null);
  
  // Step metadata
  const stepMetadata = [
    { 
      title: 'Setup', 
      subtitle: 'Configure Credentials',
      description: 'Setup your OAuth credentials'
    },
    { 
      title: 'Execute', 
      subtitle: 'Run Flow',
      description: 'Execute the OAuth flow'
    },
    { 
      title: 'Results', 
      subtitle: 'View Tokens',
      description: 'View and inspect tokens'
    }
  ];
  
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderSetupStep();
      case 1:
        return renderExecuteStep();
      case 2:
        return renderResultsStep();
      default:
        return null;
    }
  };
  
  return (
    <V7FlowTemplate
      flowName="my-flow-v7"
      flowTitle="My Flow V7"
      flowSubtitle="OAuth 2.0 My Flow Implementation"
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

export default MyFlowV7;
```

### Step 5: Migrate Step Content

Convert each step to use V7 components:

#### Before (Pre-V7):
```typescript
const renderSetupStep = () => (
  <div className="setup-container">
    <div className="info-box">
      <h3>Setup Instructions</h3>
      <p>Configure your credentials</p>
    </div>
    <input 
      value={credentials.clientId}
      onChange={(e) => setCredentials({...credentials, clientId: e.target.value})}
    />
    <button onClick={handleSave}>Save</button>
  </div>
);
```

#### After (V7):
```typescript
const renderSetupStep = () => (
  <div>
    <InfoBox $variant="info">
      <h3>Setup Instructions</h3>
      <p>Configure your credentials</p>
    </InfoBox>
    
    <FormField>
      <Label>Client ID</Label>
      <Input
        value={credentials.clientId}
        onChange={(e) => setCredentials({...credentials, clientId: e.target.value})}
        placeholder="Enter client ID"
      />
    </FormField>
    
    <ActionRow>
      <Button onClick={handleSave}>Save Credentials</Button>
    </ActionRow>
  </div>
);
```

### Step 6: Add Validation

Replace manual validation with V7SharedService:

#### Before (Pre-V7):
```typescript
const handleExecute = async () => {
  if (!credentials.clientId) {
    alert('Client ID is required');
    return;
  }
  
  try {
    const result = await executeFlow();
    setTokens(result);
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
```

#### After (V7):
```typescript
const handleExecute = async () => {
  // Validate parameters
  const validation = V7SharedService.ParameterValidation.validateFlowParameters(
    'my-flow-v7',
    {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'authorization_code'
    }
  );
  
  if (!validation.isValid) {
    v4ToastManager.showError(`Validation failed: ${validation.errors.join(', ')}`);
    return;
  }
  
  try {
    const result = await executeFlow();
    setTokens(result);
    v4ToastManager.showSuccess('Flow completed successfully');
  } catch (error) {
    const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(
      error,
      {
        flowName: 'my-flow-v7',
        step: 'execute',
        operation: 'token_exchange',
        timestamp: Date.now()
      }
    );
    v4ToastManager.showError(errorResponse.error_description);
  }
};
```

### Step 7: Add ID Token Validation (OIDC flows)

If your flow returns ID tokens:

```typescript
const handleTokenResponse = async (tokens: any) => {
  setTokens(tokens);
  
  if (tokens.id_token) {
    const validation = await V7SharedService.IDTokenValidation.validateIDToken(
      tokens.id_token,
      `https://auth.pingone.com/${credentials.environmentId}/as`,
      credentials.clientId,
      nonce,
      `https://auth.pingone.com/${credentials.environmentId}/as/jwks`,
      'my-flow-v7'
    );
    
    if (validation.isValid) {
      v4ToastManager.showSuccess('ID token validated successfully');
      console.log('ID token claims:', validation.claims);
    } else {
      v4ToastManager.showError(`ID token validation failed: ${validation.errors.join(', ')}`);
    }
  }
};
```

### Step 8: Update Routing

Update your routing configuration:

```typescript
// In your router file
import MyFlowV7 from './pages/flows/MyFlowV7';

// Add route
<Route path="/flows/my-flow-v7" element={<MyFlowV7 />} />
```

### Step 9: Register Flow

Add to flow registry (e.g., `comprehensiveFlowDataService.ts`):

```typescript
{
  id: 'my-flow-v7',
  name: 'My Flow V7',
  category: 'oauth',
  path: '/flows/my-flow-v7',
  description: 'OAuth 2.0 My Flow with V7 architecture',
  specification: 'RFC XXXX',
  version: 'v7',
  tags: ['oauth', 'v7']
}
```

---

## Common Migration Patterns

### Pattern 1: Converting Custom Styled Components

#### Before:
```typescript
const CustomBox = styled.div`
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
`;

<CustomBox>
  <h3>Success!</h3>
  <p>Operation completed</p>
</CustomBox>
```

#### After:
```typescript
const { InfoBox } = FlowUIService.getFlowUIComponents();

<InfoBox $variant="success">
  <h3>Success!</h3>
  <p>Operation completed</p>
</InfoBox>
```

### Pattern 2: Converting Error Handling

#### Before:
```typescript
try {
  await apiCall();
} catch (error) {
  console.error('Error:', error);
  setError(error.message);
  showToast('Error occurred');
}
```

#### After:
```typescript
try {
  await apiCall();
} catch (error) {
  const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(
    error,
    { flowName: 'my-flow-v7', step: 'api_call', operation: 'execute', timestamp: Date.now() }
  );
  v4ToastManager.showError(errorResponse.error_description);
}
```

### Pattern 3: Converting State Management

#### Before:
```typescript
const [step, setStep] = useState(0);
const [completed, setCompleted] = useState<number[]>([]);

const handleNext = () => {
  setCompleted([...completed, step]);
  setStep(step + 1);
};
```

#### After:
```typescript
// V7FlowTemplate handles step navigation automatically
// Just provide canNavigateNext if needed

const canNavigateNext = (step: number): boolean => {
  switch (step) {
    case 0:
      return Boolean(credentials.clientId);
    case 1:
      return Boolean(authCode);
    default:
      return true;
  }
};

<V7FlowTemplate
  // ... other props
  canNavigateNext={canNavigateNext}
/>
```

---

## Migration Examples

### Example 1: Simple OAuth Flow

#### Before (Pre-V7):
```typescript
export const SimpleOAuthFlow: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [tokens, setTokens] = useState(null);
  
  const handleGetToken = async () => {
    try {
      const response = await fetch('/token', {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId })
      });
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  return (
    <div>
      <input value={clientId} onChange={(e) => setClientId(e.target.value)} />
      <button onClick={handleGetToken}>Get Token</button>
      {tokens && <pre>{JSON.stringify(tokens, null, 2)}</pre>}
    </div>
  );
};
```

#### After (V7):
```typescript
export const SimpleOAuthFlowV7: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [tokens, setTokens] = useState(null);
  
  const { Button, InfoBox, CodeBlock } = FlowUIService.getFlowUIComponents();
  
  const handleGetToken = async () => {
    const validation = V7SharedService.ParameterValidation.validateFlowParameters(
      'simple-oauth-v7',
      { client_id: clientId }
    );
    
    if (!validation.isValid) {
      v4ToastManager.showError(validation.errors.join(', '));
      return;
    }
    
    try {
      const response = await fetch('/token', {
        method: 'POST',
        body: JSON.stringify({ client_id: clientId })
      });
      const data = await response.json();
      setTokens(data);
      v4ToastManager.showSuccess('Token retrieved successfully');
    } catch (error) {
      const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(
        error,
        { flowName: 'simple-oauth-v7', step: 'token', operation: 'get_token', timestamp: Date.now() }
      );
      v4ToastManager.showError(errorResponse.error_description);
    }
  };
  
  const stepMetadata = [
    { title: 'Setup', subtitle: 'Configure', description: 'Enter client ID' },
    { title: 'Results', subtitle: 'View Token', description: 'View access token' }
  ];
  
  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <div>
          <InfoBox $variant="info">
            <p>Enter your client ID to get an access token</p>
          </InfoBox>
          <FormField>
            <Label>Client ID</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
          </FormField>
          <ActionRow>
            <Button onClick={handleGetToken}>Get Token</Button>
          </ActionRow>
        </div>
      );
    }
    
    return (
      <div>
        {tokens && (
          <>
            <InfoBox $variant="success">
              <p>Token retrieved successfully!</p>
            </InfoBox>
            <CodeBlock>{JSON.stringify(tokens, null, 2)}</CodeBlock>
          </>
        )}
      </div>
    );
  };
  
  return (
    <V7FlowTemplate
      flowName="simple-oauth-v7"
      flowTitle="Simple OAuth Flow V7"
      flowSubtitle="Basic token retrieval"
      stepMetadata={stepMetadata}
      renderStepContent={renderStepContent}
    />
  );
};
```

---

## Troubleshooting Migration Issues

### Issue: Type errors with V7FlowName

**Problem:**
```typescript
Type '"my-flow-v7"' is not assignable to type 'V7FlowName'
```

**Solution:**
Add your flow name to the V7FlowName type in `sharedService.ts`:
```typescript
export type V7FlowName = 
  | 'existing-flows...'
  | 'my-flow-v7';
```

### Issue: UI components not styled correctly

**Problem:** Components look different from other V7 flows

**Solution:** Use FlowUIService components instead of custom styled components:
```typescript
const { InfoBox, Button, CodeBlock } = FlowUIService.getFlowUIComponents();
```

### Issue: Validation not working

**Problem:** Parameters pass validation but shouldn't

**Solution:** Check parameter names match OAuth/OIDC spec exactly:
```typescript
// Wrong
{ clientId: 'xxx' }

// Correct
{ client_id: 'xxx' }
```

### Issue: Error handling not showing proper messages

**Problem:** Generic error messages instead of specific ones

**Solution:** Use V7SharedService.ErrorHandling with proper context:
```typescript
const errorResponse = V7SharedService.ErrorHandling.handleOAuthError(
  error,
  {
    flowName: 'my-flow-v7',
    step: 'token_exchange',
    operation: 'exchange_code',
    timestamp: Date.now()
  }
);
```

---

## Testing Your Migration

### Checklist

- [ ] All steps render correctly
- [ ] Navigation works (next/previous)
- [ ] Parameter validation catches invalid inputs
- [ ] Error handling shows proper messages
- [ ] ID token validation works (OIDC flows)
- [ ] Compliance status displays
- [ ] Reset functionality works
- [ ] UI matches other V7 flows
- [ ] No console errors
- [ ] TypeScript compiles without errors

### Test Scenarios

1. **Happy Path**: Complete flow with valid inputs
2. **Invalid Inputs**: Try invalid parameters
3. **Network Errors**: Test with network disconnected
4. **Missing Required Fields**: Leave required fields empty
5. **Navigation**: Test back/forward navigation
6. **Reset**: Test reset functionality

---

## Performance Considerations

V7 flows are generally more performant due to:

- Shared component instances
- Optimized re-renders
- Efficient state management
- Lazy loading of validation services

No special performance optimization needed for most flows.

---

## Rollback Plan

If migration causes issues:

1. Keep old flow file as backup
2. Update routing to point back to old flow
3. Document issues encountered
4. Fix issues in V7 version
5. Re-test and re-deploy

---

## Getting Help

- Review existing V7 flows for examples
- Check V7 documentation
- Ask in team chat
- Create issue with migration questions

---

## Summary

V7 migration provides significant benefits with minimal effort. The standardized template and shared services reduce code by 80% while improving consistency and compliance.

**Key Steps:**
1. Create new V7 file
2. Add flow name type
3. Convert to V7FlowTemplate
4. Use FlowUIService components
5. Add V7SharedService validation and error handling
6. Test thoroughly
7. Update routing and registry

**Time Estimate:** 2-4 hours per flow depending on complexity

---

*V7 Migration Guide v7.0.0 - November 2025*
