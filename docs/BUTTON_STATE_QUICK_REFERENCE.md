# Quick Reference: Button State Management

## Import
```tsx
import { useActionButton } from '@/v8/hooks/useActionButton';
import { PrimaryButton, SecondaryButton } from '@/v8/components/shared/ActionButtonV8';
```

## Setup
```tsx
const myAction = useActionButton();
```

## Use in Button
```tsx
<PrimaryButton
  onClick={() => myAction.executeAction(
    async () => {
      // Your async code here
      await apiCall();
    },
    'Action Name' // For debugging/logging
  )}
  isLoading={myAction.isLoading}
  disabled={myAction.disabled}
>
  Button Text
</PrimaryButton>
```

## Multiple Buttons
```tsx
const action1 = useActionButton();
const action2 = useActionButton();
const resetAction = useActionButton();

// Use action1, action2, resetAction separately
```

## Button Variants
- `PrimaryButton` - Main actions (blue)
- `SecondaryButton` - Secondary actions (gray)
- `SuccessButton` - Success/complete (green)
- `DangerButton` - Destructive (red)
- `WarningButton` - Warning (orange)
- `InfoButton` - Info (cyan)

## Error Handling
```tsx
onClick={() => myAction.executeAction(
  async () => {
    const result = await apiCall();
    if (!result.success) {
      setErrors(['API call failed']);
      return;
    }
    // Handle success
  },
  'API Call'
)}
```

## Tips
- ✅ One `useActionButton()` per button with async action
- ✅ Provide descriptive action names
- ✅ Error handling inside the async function
- ❌ Don't wrap in try/catch (handled by hook)
- ❌ Don't manually manage loading state
