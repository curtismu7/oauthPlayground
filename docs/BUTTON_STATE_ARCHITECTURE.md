# Button State Management Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           App.tsx                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              FlowStateProvider (NEW)                     │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Global State:                                     │  │  │
│  │  │  - isActionInProgress: boolean                     │  │  │
│  │  │  - currentAction: string | null                    │  │  │
│  │  │                                                      │  │  │
│  │  │  Methods:                                           │  │  │
│  │  │  - startAction(name: string)                       │  │  │
│  │  │  - endAction()                                     │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │         ↓ Context provided to all children               │  │
│  │                                                            │  │
│  │  ┌─────────────────┬──────────────────┬─────────────────┐  │
│  │  │                 │                  │                 │  │
│  │  │   V8 Flow 1     │   V8 Flow 2      │   V8 Flow N     │  │
│  │  │                 │                  │                 │  │
│  │  └─────────────────┴──────────────────┴─────────────────┘  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Individual Flow Component                    │
│                                                                 │
│  Import:                                                        │
│  import { useActionButton } from '@/v8/hooks/useActionButton';  │
│  import { PrimaryButton } from '@/v8/components/shared/...';    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  const step1 = useActionButton();  // Hook 1              │ │
│  │  const step2 = useActionButton();  // Hook 2              │ │
│  │  const reset = useActionButton();  // Hook 3              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                      ↓                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Each hook provides:                                      │ │
│  │  - isLoading: boolean  (this button's state)             │ │
│  │  - disabled: boolean   (any button active?)              │ │
│  │  - executeAction(fn, name)                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                      ↓                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  <PrimaryButton                                           │ │
│  │    onClick={() => step1.executeAction(                   │ │
│  │      async () => { await apiCall(); },                   │ │
│  │      'Generate URL'                                      │ │
│  │    )}                                                     │ │
│  │    isLoading={step1.isLoading}                          │ │
│  │    disabled={step1.disabled}                            │ │
│  │  >                                                        │ │
│  │    Generate Authorization URL                            │ │
│  │  </PrimaryButton>                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Execution Flow Diagram                       │
│                                                                 │
│  User Clicks Button                                             │
│         ↓                                                       │
│  executeAction() called                                         │
│         ↓                                                       │
│  ┌──────────────────────────────────────┐                      │
│  │  1. Check: isActionInProgress?       │                      │
│  │     YES → Return null (block)        │                      │
│  │     NO  → Continue                   │                      │
│  └──────────────────────────────────────┘                      │
│         ↓                                                       │
│  ┌──────────────────────────────────────┐                      │
│  │  2. Set Local: isLoading = true      │                      │
│  │  3. Set Global: startAction(name)    │                      │
│  │     → isActionInProgress = true      │                      │
│  │     → currentAction = name           │                      │
│  └──────────────────────────────────────┘                      │
│         ↓                                                       │
│  ┌──────────────────────────────────────┐                      │
│  │  4. Execute async function           │                      │
│  │     - Show spinner on this button    │                      │
│  │     - Disable all other buttons      │                      │
│  └──────────────────────────────────────┘                      │
│         ↓                                                       │
│  ┌──────────────────────────────────────┐                      │
│  │  5. Finally:                          │                      │
│  │     - Set Local: isLoading = false   │                      │
│  │     - Set Global: endAction()        │                      │
│  │       → isActionInProgress = false   │                      │
│  │       → currentAction = null         │                      │
│  └──────────────────────────────────────┘                      │
│         ↓                                                       │
│  All buttons re-enabled                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    State Coordination                           │
│                                                                 │
│  Button 1 Active:                                               │
│  ┌──────────────┬─────────────┬──────────────┐                 │
│  │ Button 1     │ Button 2    │ Button 3     │                 │
│  │ isLoading:✅ │ disabled:✅  │ disabled:✅   │                 │
│  │ [Spinner]    │ [Grayed]    │ [Grayed]     │                 │
│  └──────────────┴─────────────┴──────────────┘                 │
│                                                                 │
│  Global State:                                                  │
│  isActionInProgress: true                                       │
│  currentAction: "Generate URL"                                  │
│                                                                 │
│  Console: "[FlowState] Starting action: Generate URL"           │
│                                                                 │
│  ────────────────────────────────────────                       │
│                                                                 │
│  No Button Active:                                              │
│  ┌──────────────┬─────────────┬──────────────┐                 │
│  │ Button 1     │ Button 2    │ Button 3     │                 │
│  │ enabled:✅   │ enabled:✅   │ enabled:✅    │                 │
│  │ [Ready]      │ [Ready]     │ [Ready]      │                 │
│  └──────────────┴─────────────┴──────────────┘                 │
│                                                                 │
│  Global State:                                                  │
│  isActionInProgress: false                                      │
│  currentAction: null                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Component Tree                               │
│                                                                 │
│  App.tsx                                                        │
│    └─ FlowStateProvider                                         │
│        ├─ OAuthAuthorizationCodeFlowV8                          │
│        │   ├─ useActionButton() × 3                            │
│        │   └─ PrimaryButton × 3                                │
│        ├─ MFAAuthenticationMainPageV8                           │
│        │   ├─ useActionButton() × 5                            │
│        │   └─ PrimaryButton × 5                                │
│        └─ ImplicitFlowV8                                        │
│            ├─ useActionButton() × 2                            │
│            └─ PrimaryButton × 2                                │
│                                                                 │
│  All flows share the same global state ✨                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Data Flow Summary                            │
│                                                                 │
│  Component Layer:     PrimaryButton                             │
│         ↕                                                       │
│  Hook Layer:         useActionButton()                          │
│         ↕                                                       │
│  Context Layer:      FlowStateContext                           │
│         ↕                                                       │
│  Provider Layer:     FlowStateProvider                          │
│         ↕                                                       │
│  App Layer:          App.tsx                                    │
│                                                                 │
│  ┌────────────────────────────────────────┐                    │
│  │  Benefits:                             │                    │
│  │  ✅ Centralized state                  │                    │
│  │  ✅ Automatic coordination             │                    │
│  │  ✅ Consistent UX                      │                    │
│  │  ✅ Easy debugging                     │                    │
│  │  ✅ Type-safe                          │                    │
│  │  ✅ Testable                           │                    │
│  └────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. **Single Source of Truth**
The `FlowStateContext` maintains one global boolean (`isActionInProgress`) that all buttons respect.

### 2. **Graceful Degradation**
If a component doesn't use the new pattern, it still works. The new pattern is additive, not breaking.

### 3. **Local + Global State**
Each button has its own loading state (spinner) but respects global state (disabled).

### 4. **Race Condition Prevention**
```
Time →
Button 1: [Click] ─────[Loading...]─────[Done]
Button 2:         [❌ Blocked]
Button 3:         [❌ Blocked]
```

### 5. **Debugging Made Easy**
Console output shows exactly which action is running:
```
[FlowState] Starting action: Generate Authorization URL
[FlowState] Ending action: Generate Authorization URL
```

## Migration Example

### Before (15 lines)
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const result = await apiCall();
    if (!result.success) {
      setError('Failed');
      return;
    }
    handleSuccess(result);
  } catch (error) {
    handleError(error);
  } finally {
    setIsLoading(false);
  }
};
```

### After (6 lines)
```tsx
const submit = useActionButton();

const handleSubmit = () => submit.executeAction(
  async () => {
    const result = await apiCall();
    if (!result.success) throw new Error('Failed');
    handleSuccess(result);
  },
  'Submit Form'
);
```

**60% code reduction** with better error handling! ✨
