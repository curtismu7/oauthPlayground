# Credential Validation Guide

This guide explains how to implement credential validation in OAuth flows to prevent users from advancing to step 1+ without filling in required credentials.

## Overview

The credential validation system prevents users from navigating to page 2 (step 1) unless they have filled in the required credentials. When they try to advance without credentials, a modal appears showing what fields are missing and redirects them back to fill in the credentials.

## Components

### 1. `useCredentialGuard` Hook

A hook that provides credential validation with modal display.

```typescript
import { useCredentialGuard } from '../hooks/useCredentialGuard';

const { checkCredentialsAndProceed, CredentialGuardModal } = useCredentialGuard({
  requiredFields: ['environmentId', 'clientId', 'clientSecret'],
  fieldLabels: {
    environmentId: 'Environment ID',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
  },
  flowName: 'OAuth Authorization Code Flow',
});

// In your navigation handler
const handleNext = () => {
  checkCredentialsAndProceed(credentials, () => {
    // This only runs if credentials are valid
    setCurrentStep(currentStep + 1);
  });
};

// In your JSX
return (
  <>
    {/* Your flow content */}
    <CredentialGuardModal />
  </>
);
```

### 2. `useStepNavigationWithCredentials` Hook

A comprehensive hook that handles step navigation with automatic credential validation.

```typescript
import { useStepNavigationWithCredentials } from '../hooks/useStepNavigationWithCredentials';

const {
  canNavigateNext,
  canNavigatePrevious,
  handleNext,
  handlePrevious,
  handleReset,
  CredentialGuardModal,
} = useStepNavigationWithCredentials({
  credentials,
  currentStep,
  totalSteps,
  onStepChange: setCurrentStep,
  validateStep: (step) => step === 0 || hasValidData(step),
  requiredFields: ['environmentId', 'clientId'],
  fieldLabels: {
    environmentId: 'Environment ID',
    clientId: 'Client ID',
  },
  flowName: 'OAuth Flow',
});
```

### 3. `StepNavigationWithCredentials` Component

A drop-in replacement for `StepNavigationButtons` that includes credential validation.

```typescript
import { StepNavigationWithCredentials } from '../components/StepNavigationWithCredentials';

<StepNavigationWithCredentials
  credentials={credentials}
  currentStep={currentStep}
  totalSteps={totalSteps}
  onStepChange={setCurrentStep}
  validateStep={validateStep}
  requiredFields={['environmentId', 'clientId', 'clientSecret']}
  fieldLabels={{
    environmentId: 'Environment ID',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
  }}
  flowName="OAuth Authorization Code Flow"
  onStartOver={handleStartOver}
/>
```

### 4. `FlowWithCredentialGuard` Wrapper

A wrapper component that adds credential validation to any existing flow.

```typescript
import { FlowWithCredentialGuard } from '../components/FlowWithCredentialGuard';

<FlowWithCredentialGuard
  credentials={credentials}
  currentStep={currentStep}
  totalSteps={totalSteps}
  onStepChange={setCurrentStep}
  validateStep={validateStep}
  requiredFields={['environmentId', 'clientId']}
  fieldLabels={{
    environmentId: 'Environment ID',
    clientId: 'Client ID',
  }}
  flowName="OAuth Flow"
>
  {/* Your existing flow content */}
  <YourFlowContent />
</FlowWithCredentialGuard>
```

## Implementation Examples

### Example 1: Adding to Existing Flow

```typescript
// Before
const handleNext = () => {
  if (currentStep < totalSteps - 1) {
    setCurrentStep(currentStep + 1);
  }
};

// After
const { checkCredentialsAndProceed, CredentialGuardModal } = useCredentialGuard({
  requiredFields: ['environmentId', 'clientId'],
  fieldLabels: {
    environmentId: 'Environment ID',
    clientId: 'Client ID',
  },
  flowName: 'OAuth Flow',
});

const handleNext = () => {
  if (currentStep === 0) {
    // Validate credentials before advancing from step 0
    checkCredentialsAndProceed(credentials, () => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      }
    });
  } else {
    // Normal navigation for other steps
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  }
};

// Add modal to JSX
return (
  <>
    {/* Your flow content */}
    <CredentialGuardModal />
  </>
);
```

### Example 2: Using the Wrapper Component

```typescript
// Wrap your existing flow
<FlowWithCredentialGuard
  credentials={credentials}
  currentStep={currentStep}
  totalSteps={totalSteps}
  onStepChange={setCurrentStep}
  requiredFields={['environmentId', 'clientId', 'clientSecret']}
  fieldLabels={{
    environmentId: 'Environment ID',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
  }}
  flowName="OAuth Authorization Code Flow"
>
  <YourExistingFlowContent />
</FlowWithCredentialGuard>
```

## Required Fields by Flow Type

### OAuth Authorization Code
- `environmentId` (Environment ID)
- `clientId` (Client ID)
- `clientSecret` (Client Secret)
- `redirectUri` (Redirect URI)

### OAuth Implicit Flow
- `environmentId` (Environment ID)
- `clientId` (Client ID)
- `redirectUri` (Redirect URI)

### Client Credentials Flow
- `environmentId` (Environment ID)
- `clientId` (Client ID)
- `clientSecret` (Client Secret)

### Device Authorization Flow
- `environmentId` (Environment ID)
- `clientId` (Client ID)

## Modal Behavior

When users try to advance from step 0 without required credentials:

1. **Modal appears** with title "Credentials Required"
2. **Lists missing fields** in a bulleted list
3. **Shows helpful message** explaining what's needed
4. **"Back to Credentials" button** closes modal and returns to step 0
5. **Prevents navigation** until all required fields are filled

## Best Practices

1. **Always validate on step 0 → step 1 transition**
2. **Use descriptive field labels** for better user experience
3. **Include flow name** in validation for context
4. **Test with empty credentials** to ensure modal appears
5. **Test with partial credentials** to ensure specific fields are highlighted

## Migration Guide

To add credential validation to existing flows:

1. **Import the hook or component** you want to use
2. **Add credential validation** to your navigation handler
3. **Include the modal** in your JSX
4. **Test the flow** to ensure validation works correctly

The system is designed to be non-breaking - existing flows will continue to work, and you can add validation incrementally.
