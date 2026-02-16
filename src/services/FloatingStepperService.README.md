# FloatingStepperService

A reusable floating stepper service for multi-step flows that can be used across different applications.

## Features

- **Draggable Positioning**: Users can drag the stepper anywhere on the screen
- **Step Indicators**: Visual dots showing progress through steps
- **Responsive Design**: Adapts to mobile and desktop screens
- **Compact Mode**: Toggle between full and compact views
- **Theme Support**: Light and dark themes
- **Variant Support**: OAuth, OIDC, MFA, and default variants
- **Glass Morphism**: Modern frosted glass effect
- **Z-index Management**: Proper layering above other content

## Usage

### Basic Usage

```tsx
import { FloatingStepper, FloatingStepperService } from '../services/FloatingStepperService';

const steps = [
  { id: 'step1', title: 'Configuration', description: 'Configure your credentials' },
  { id: 'step2', title: 'Authorization', description: 'Authorize the application' },
  { id: 'step3', title: 'Token Exchange', description: 'Exchange code for tokens' },
];

<FloatingStepper
  steps={steps}
  currentStep={currentStep}
  onStepChange={setStep}
  onPrevious={handlePrevious}
  onNext={handleNext}
  onComplete={handleComplete}
/>
```

### OAuth Flow Configuration

```tsx
const config = FloatingStepperService.getOAuthConfig(steps);

<FloatingStepper
  {...config}
  currentStep={currentStep}
  onStepChange={setStep}
  onPrevious={handlePrevious}
  onNext={handleNext}
/>
```

### MFA Flow Configuration

```tsx
const config = FloatingStepperService.getMFAConfig(steps);

<FloatingStepper
  {...config}
  currentStep={currentStep}
  onStepChange={setStep}
  onPrevious={handlePrevious}
  onNext={handleNext}
/>
```

### Compact Configuration

```tsx
const config = FloatingStepperService.getCompactConfig(steps);

<FloatingStepper
  {...config}
  currentStep={currentStep}
  onStepChange={setStep}
  onPrevious={handlePrevious}
  onNext={handleNext}
/>
```

## Props

### FloatingStepperProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `FloatingStepperStep[]` | Required | Array of step objects |
| `currentStep` | `number` | Required | Current step index |
| `onStepChange` | `(stepIndex: number) => void` | Optional | Called when step changes |
| `onPrevious` | `() => void` | Optional | Called for previous navigation |
| `onNext` | `() => void` | Optional | Called for next navigation |
| `onReset` | `() => void` | Optional | Called for reset action |
| `onComplete` | `() => void` | Optional | Called on completion |
| `showStepIndicator` | `boolean` | `true` | Show step indicators |
| `showStepNumbers` | `boolean` | `false` | Show step numbers |
| `compact` | `boolean` | `false` | Compact mode |
| `draggable` | `boolean` | `true` | Enable dragging |
| `position` | `{x: number, y: number}` | `{20, 20}` | Initial position |
| `variant` | `'default' | 'oauth' | 'oidc' | 'mfa'` | `'default'` | Visual variant |
| `theme` | `'light' | 'dark'` | `'light'` | Color theme |

### FloatingStepperStep

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique step identifier |
| `title` | `string` | Step title |
| `description` | `string` | Step description |
| `completed` | `boolean` | Whether step is completed |
| `current` | `boolean` | Whether step is current |

## Service Methods

### FloatingStepperService.getOAuthConfig(steps)
Returns a configuration optimized for OAuth flows.

### FloatingStepperService.getMFAConfig(steps)
Returns a configuration optimized for MFA flows.

### FloatingStepperService.getOIDCConfig(steps)
Returns a configuration optimized for OIDC flows.

### FloatingStepperService.getCompactConfig(steps)
Returns a compact configuration.

### FloatingStepperService.getDefaultPosition()
Returns a default position based on screen size (bottom-right corner).

## Styling

The stepper uses styled-components with the following key styled components:

- `FloatingStepperContainer`: Main container with glass morphism effect
- `StepIndicator`: Step progress indicators
- `StepDot`: Individual step dots
- `NavigationButtons`: Navigation controls
- `NavButton`: Individual navigation buttons

## Examples

### OAuth Authorization Code Flow

```tsx
const oauthSteps = [
  { id: 'config', title: 'Configuration', description: 'Configure OAuth settings' },
  { id: 'auth', title: 'Authorization', description: 'Get authorization code' },
  { id: 'token', title: 'Token Exchange', description: 'Exchange code for tokens' },
  { id: 'introspection', title: 'Introspection', description: 'Validate tokens' },
  { id: 'completion', title: 'Completion', description: 'Flow completed' },
];

<FloatingStepper
  {...FloatingStepperService.getOAuthConfig(oauthSteps)}
  currentStep={currentStep}
  onStepChange={setStep}
  onPrevious={handlePrevious}
  onNext={handleNext}
  onComplete={handleComplete}
/>
```

### MFA Registration Flow

```tsx
const mfaSteps = [
  { id: 'device-selection', title: 'Device Selection', description: 'Choose MFA device' },
  { id: 'registration', title: 'Registration', description: 'Register device' },
  { id: 'verification', title: 'Verification', description: 'Verify device' },
  { id: 'completion', title: 'Completion', description: 'Setup complete' },
];

<FloatingStepper
  {...FloatingStepperService.getMFAConfig(mfaSteps)}
  currentStep={currentStep}
  onStepChange={setStep}
  onPrevious={handlePrevious}
  onNext={handleNext}
/>
```

## Integration with Existing Flows

To integrate with existing flows:

1. **Replace existing stepper components** with FloatingStepper
2. **Map existing step data** to FloatingStepperStep format
3. **Wire up navigation callbacks** to existing flow logic
4. **Configure positioning** for optimal user experience

### Migration Example

```tsx
// Before (existing stepper)
<StepNavigationButtons
  currentStep={currentStep}
  totalSteps={steps.length}
  onPrevious={handlePrev}
  onNext={handleNext}
  canNavigateNext={canNavigateNext}
/>

// After (FloatingStepper)
<FloatingStepper
  steps={steps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    completed: index < currentStep,
    current: index === currentStep,
  }))}
  currentStep={currentStep}
  onStepChange={setStep}
  onPrevious={handlePrev}
  onNext={handleNext}
  {...FloatingStepperService.getOAuthConfig(steps)}
/>
```

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Touch devices (dragging works with touch events)
- Responsive design adapts to screen size

## Performance

- Uses React hooks for optimal performance
- Efficient event handling with proper cleanup
- Minimal re-renders with useCallback and useMemo
- Lightweight styled-components

## Accessibility

- Keyboard navigation support
- ARIA labels on navigation buttons
- High contrast colors for visibility
- Focus management for drag operations
