# Flow Completion Service Integration Guide

This guide explains how to integrate the Flow Completion Service into any OAuth/OIDC flow to provide a standardized completion page.

## Overview

The Flow Completion Service provides a beautiful, standardized completion page that includes:
- Success confirmation with flow-specific messaging
- Summary of completed steps with checkmarks
- Next steps guidance for production implementation
- "Start New Flow" button for easy flow restart

## Quick Integration

### 1. Import the Service

```typescript
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
```

### 2. Add New Step to Flow

Add a new step to your flow's step metadata:

```typescript
const STEP_METADATA = [
  // ... existing steps
  { title: 'Step X: Flow Summary', subtitle: 'Comprehensive completion overview' },
] as const;
```

### 3. Add Section Key

Add the new section to your section key type:

```typescript
type SectionKey = 
  | 'existingSection1'
  | 'existingSection2'
  // ... other sections
  | 'flowSummary';
```

### 4. Add to Collapsed Sections

Add the new section to your collapsed sections state:

```typescript
const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
  // ... existing sections
  flowSummary: false, // New Flow Completion Service step
});
```

### 5. Add to Step Renderer

Add the new case to your step renderer:

```typescript
const renderStepContent = () => {
  switch (currentStep) {
    // ... existing cases
    case X: // Your new step number
      return renderFlowSummary();
    default:
      return null;
  }
};
```

### 6. Create Render Function

Add the render function for the Flow Summary:

```typescript
const renderFlowSummary = () => {
  const completionConfig = {
    ...FlowCompletionConfigs.yourFlowType, // Use appropriate config
    onStartNewFlow: () => {
      yourFlow.reset(); // Your flow's reset function
      setCurrentStep(0);
    },
    showUserInfo: Boolean(userInfo), // Optional: if you have user info
    showIntrospection: Boolean(introspectionResult), // Optional: if you have introspection
    userInfo, // Optional: pass user info if available
    introspectionResult // Optional: pass introspection result if available
  };

  return (
    <FlowCompletionService
      config={completionConfig}
      collapsed={collapsedSections.flowSummary}
      onToggleCollapsed={() => toggleSection('flowSummary')}
    />
  );
};
```

### 7. Update Step Validation

Add the new step to your step validation:

```typescript
const isStepValid = useCallback((stepIndex: number): boolean => {
  switch (stepIndex) {
    // ... existing cases
    case X: // Your new step number
      return true; // Flow Summary is always valid
    default:
      return false;
  }
}, [/* your dependencies */]);
```

## Available Flow Configurations

The service includes predefined configurations for common flows:

- `FlowCompletionConfigs.authorizationCode` - OAuth 2.0 Authorization Code Flow
- `FlowCompletionConfigs.implicit` - OAuth 2.0 Implicit Flow  
- `FlowCompletionConfigs.deviceAuthorization` - OAuth 2.0 Device Authorization Flow
- `FlowCompletionConfigs.clientCredentials` - OAuth 2.0 Client Credentials Flow
- `FlowCompletionConfigs.hybrid` - OpenID Connect Hybrid Flow

## Custom Configuration

You can also create custom configurations:

```typescript
const customConfig = {
  flowName: 'Your Custom Flow',
  flowDescription: 'You\'ve successfully completed your custom flow...',
  completedSteps: [
    { completed: true, description: 'Step 1 completed' },
    { completed: true, description: 'Step 2 completed' },
    // ... more steps
  ],
  nextSteps: [
    'Custom next step 1',
    'Custom next step 2',
    // ... more next steps
  ],
  onStartNewFlow: () => {
    // Your reset logic
  },
  showUserInfo: false, // Optional
  showIntrospection: false, // Optional
  userInfo: undefined, // Optional
  introspectionResult: undefined // Optional
};
```

## Features

- **Collapsible Design**: Users can expand/collapse the completion details
- **Success Confirmation**: Clear visual confirmation of flow completion
- **Step Summary**: Shows all completed steps with checkmarks
- **Next Steps**: Provides guidance for production implementation
- **Flow Restart**: Easy way to start the flow over
- **Conditional Content**: Shows user info and introspection results if available
- **Consistent Styling**: Matches the design system of other flow components

## Example Integration

See the OIDC Hybrid Flow (`src/pages/flows/OIDCHybridFlowV5.tsx`) and Device Authorization Flow (`src/pages/flows/OIDCDeviceAuthorizationFlowV5.tsx`) for complete integration examples.
