# Button State Management Implementation

## Overview
This implementation provides a global flow state management system to ensure consistent button behavior across all flows. It prevents race conditions and provides unified loading state management.

## Components

### 1. FlowStateContext (`src/v8/contexts/FlowStateContext.tsx`)
- **Purpose**: Global state management for in-progress actions
- **Features**:
  - Tracks current action state (`isActionInProgress`)
  - Stores action name for debugging
  - Provides `startAction()` and `endAction()` methods

### 2. useActionButton Hook (`src/v8/hooks/useActionButton.ts`)
- **Purpose**: Simplifies button state management in components
- **Features**:
  - Automatic loading state management
  - Global flow state integration
  - Prevents multiple simultaneous actions
  - Error handling

### 3. ActionButtonV8 Component (`src/v8/components/shared/ActionButtonV8.tsx`)
- **Purpose**: Consistent button UI with loading states
- **Features**:
  - Built-in loading spinner
  - Multiple variants (primary, secondary, success, danger, etc.)
  - Disabled state management
  - Accessible design

## Usage

### Basic Example

```tsx
import { PrimaryButton } from '@/v8/components/shared/ActionButtonV8';
import { useActionButton } from '@/v8/hooks/useActionButton';

const MyComponent: React.FC = () => {
  const { isLoading, disabled, executeAction } = useActionButton();

  const handleSubmit = async () => {
    await executeAction(async () => {
      // Your async operation here
      const result = await apiCall();
      return result;
    }, 'Submit Form');
  };

  return (
    <PrimaryButton
      onClick={handleSubmit}
      isLoading={isLoading}
      disabled={disabled}
    >
      Submit
    </PrimaryButton>
  );
};
```

### Multiple Buttons

```tsx
import { PrimaryButton, SecondaryButton } from '@/v8/components/shared/ActionButtonV8';
import { useActionButton } from '@/v8/hooks/useActionButton';

const MyFlow: React.FC = () => {
  const action1 = useActionButton();
  const action2 = useActionButton();

  return (
    <>
      <PrimaryButton
        onClick={() => action1.executeAction(async () => {
          await step1();
        }, 'Step 1')}
        isLoading={action1.isLoading}
        disabled={action1.disabled}
      >
        Execute Step 1
      </PrimaryButton>

      <SecondaryButton
        onClick={() => action2.executeAction(async () => {
          await step2();
        }, 'Step 2')}
        isLoading={action2.isLoading}
        disabled={action2.disabled}
      >
        Execute Step 2
      </SecondaryButton>
    </>
  );
};
```

## Benefits

1. **Prevents Race Conditions**: Only one action can execute at a time
2. **Consistent UX**: All buttons show loading states uniformly
3. **Simplified Code**: No need to manage individual loading states
4. **Better Debugging**: Action names logged for troubleshooting
5. **Accessible**: Built-in ARIA attributes and keyboard support

## Migration Guide

### Before
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleClick = async () => {
  setIsLoading(true);
  try {
    await someAsyncOperation();
  } finally {
    setIsLoading(false);
  }
};

return (
  <button onClick={handleClick} disabled={isLoading}>
    {isLoading ? 'Loading...' : 'Submit'}
  </button>
);
```

### After
```tsx
const { isLoading, disabled, executeAction } = useActionButton();

const handleClick = () => executeAction(
  async () => await someAsyncOperation(),
  'Submit Action'
);

return (
  <PrimaryButton
    onClick={handleClick}
    isLoading={isLoading}
    disabled={disabled}
  >
    Submit
  </PrimaryButton>
);
```

## Button Variants

- **PrimaryButton**: Main actions (blue)
- **SecondaryButton**: Secondary actions (gray)
- **SuccessButton**: Success/completion (green)
- **DangerButton**: Destructive actions (red)
- **WarningButton**: Warning actions (orange)
- **InfoButton**: Informational actions (cyan)
- **PurpleButton**: Special actions (purple)
- **OrangeButton**: Alternative warning (orange)
- **TealButton**: Alternative info (teal)

## Standards

1. **Always use `executeAction`** for async operations
2. **Provide descriptive action names** for debugging
3. **Use appropriate button variants** for visual hierarchy
4. **Test button states** in loading, disabled, and error scenarios
5. **Follow accessibility guidelines** (ARIA labels, keyboard nav)

## Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlowStateProvider } from '@/v8/contexts/FlowStateContext';

test('button shows loading state during action', async () => {
  render(
    <FlowStateProvider>
      <MyComponent />
    </FlowStateProvider>
  );

  const button = screen.getByRole('button', { name: /submit/i });
  fireEvent.click(button);

  expect(button).toHaveAttribute('disabled');
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(button).not.toHaveAttribute('disabled');
  });
});
```
