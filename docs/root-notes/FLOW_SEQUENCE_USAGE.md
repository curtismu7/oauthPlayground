# Flow Sequence Service - Usage Guide

## Overview
The Flow Sequence Service provides reusable flow sequence data and a React component for displaying OAuth/OIDC flow steps consistently across all flows.

## Files Created
1. **`src/services/flowSequenceService.ts`** - Service with flow sequence data
2. **`src/components/FlowSequenceDisplay.tsx`** - Reusable React component

## Usage in Flow Components

### Simple Usage
```tsx
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';

// In your flow component's render:
<FlowSequenceDisplay flowType="device-authorization" />
```

### Example: Device Authorization Flow
```tsx
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';

const DeviceAuthorizationFlowV5 = () => {
  return (
    <CollapsibleSection>
      <CollapsibleHeaderButton onClick={() => toggleSection('howItWorks')}>
        <CollapsibleTitle>
          <FiZap /> How It Works
        </CollapsibleTitle>
      </CollapsibleHeaderButton>
      {!collapsedSections.howItWorks && (
        <CollapsibleContent>
          <FlowSequenceDisplay flowType="device-authorization" />
        </CollapsibleContent>
      )}
    </CollapsibleSection>
  );
};
```

## Supported Flow Types
- `device-authorization`
- `authorization-code`
- `implicit`
- `client-credentials`
- `resource-owner-password`
- `ciba`
- `redirectless`
- `hybrid`
- `jwt-bearer`
- `worker-token`

## Features
✅ **Consistent styling** - All flows use the same beautiful gradient design
✅ **Numbered steps** - Clear step-by-step progression
✅ **Technical details** - Optional code snippets for API calls
✅ **Example displays** - Real-world examples for user-facing content
✅ **Key benefits** - Highlights advantages of each flow
✅ **Fully typed** - TypeScript support with proper types

## Customization
To add a new flow or modify existing sequences, edit:
- `src/services/flowSequenceService.ts`

The component will automatically pick up the changes!

## Benefits
1. **DRY Principle** - Define flow sequences once, use everywhere
2. **Consistency** - Same look and feel across all flows
3. **Maintainability** - Update flow sequences in one place
4. **Reusability** - Easy to add to any flow component
5. **Type Safety** - Full TypeScript support

## Migration Guide
To replace existing flow sequence sections:

### Before:
```tsx
<FlowDiagram>
  <FlowStep>
    <FlowStepNumber>1</FlowStepNumber>
    <FlowStepContent>Step description...</FlowStepContent>
  </FlowStep>
  // ... more steps
</FlowDiagram>
```

### After:
```tsx
<FlowSequenceDisplay flowType="your-flow-type" />
```

That's it! Much simpler and consistent! 🎉
