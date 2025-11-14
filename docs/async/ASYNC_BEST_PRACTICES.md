# Async/Await Best Practices

## Overview

This document outlines best practices for handling async operations in the OAuth Playground codebase, based on lessons learned from the Configuration.tsx incident.

## The Problem

A missing closing brace in an async onClick handler caused an infinite reload loop:

```typescript
// ❌ BAD - Missing closing brace
onContinue={async () => {
  const tokenData = await credentialStorageManager.loadWorkerToken();
  if (tokenData && tokenData.environmentId === credentials.environmentId) {
    setWorkerToken(tokenData.accessToken);
    }  // Extra brace
  }    // Missing brace for async function
  setShowWorkerTokenModal(false);
}}
```

## Best Practices

### 1. Async Event Handlers

**✅ GOOD - Proper structure with error handling:**

```typescript
onClick={async () => {
  try {
    const result = await someAsyncOperation();
    handleSuccess(result);
  } catch (error) {
    console.error('Operation failed:', error);
    showErrorMessage(error);
  }
}}
```

**Key Points:**
- Always use try-catch blocks
- Handle errors explicitly
- Verify brace closure
- Keep handlers simple

**❌ BAD - No error handling:**

```typescript
onClick={async () => {
  const result = await someAsyncOperation(); // What if this fails?
  handleSuccess(result);
}}
```

### 2. Async in useEffect

**✅ GOOD - Using custom hook:**

```typescript
import { useAsyncEffect } from '../hooks/useAsyncEffect';

function MyComponent() {
  useAsyncEffect(async () => {
    const data = await fetchData();
    setData(data);
  }, [dependency], (error) => {
    console.error('Failed to fetch data:', error);
    showErrorToast(error.message);
  });
}
```

**✅ GOOD - Traditional pattern with cleanup:**

```typescript
useEffect(() => {
  let cancelled = false;

  const fetchData = async () => {
    try {
      const data = await fetchSomething();
      if (!cancelled) {
        setData(data);
      }
    } catch (error) {
      if (!cancelled) {
        console.error('Error:', error);
      }
    }
  };

  void fetchData();

  return () => {
    cancelled = true;
  };
}, [dependency]);
```

**❌ BAD - Async function directly in useEffect:**

```typescript
useEffect(async () => {
  // ❌ This is not allowed!
  const data = await fetchData();
  setData(data);
}, []);
```

### 3. Void Async Calls

**✅ GOOD - Intentional fire-and-forget with error handling:**

```typescript
const runAsync = async () => {
  try {
    await operation();
  } catch (error) {
    console.error('Operation failed:', error);
    // Handle error appropriately
  }
};

void runAsync();
```

**✅ GOOD - With .catch():**

```typescript
someAsyncOperation()
  .catch((error) => {
    console.error('Operation failed:', error);
  });
```

**❌ BAD - Unhandled promise:**

```typescript
someAsyncOperation(); // ❌ Promise not handled
```

### 4. Modal Callbacks

**✅ GOOD - Async callback with error handling:**

```typescript
<Modal
  onContinue={async () => {
    try {
      setLoading(true);
      await saveData();
      closeModal();
    } catch (error) {
      console.error('Save failed:', error);
      showError(error);
    } finally {
      setLoading(false);
    }
  }}
/>
```

**Key Points:**
- Use try-catch-finally
- Manage loading states
- Handle errors gracefully
- Close modal appropriately

### 5. Complex Async Logic

**✅ GOOD - Extract to separate function:**

```typescript
const handleComplexOperation = async () => {
  try {
    const step1 = await firstOperation();
    const step2 = await secondOperation(step1);
    const step3 = await thirdOperation(step2);
    return step3;
  } catch (error) {
    console.error('Complex operation failed:', error);
    throw error;
  }
};

// In component
onClick={async () => {
  try {
    const result = await handleComplexOperation();
    handleSuccess(result);
  } catch (error) {
    handleError(error);
  }
}}
```

**✅ GOOD - Use custom hook:**

```typescript
function useComplexOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await complexOperation();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
```

## Custom Hooks

### useAsyncEffect

For async operations in useEffect:

```typescript
import { useAsyncEffect } from '../hooks/useAsyncEffect';

useAsyncEffect(async () => {
  const data = await fetchData();
  setData(data);
}, [dependency], (error) => {
  console.error('Error:', error);
});
```

### useAsyncEffectWithState

For async operations with loading/error state:

```typescript
import { useAsyncEffectWithState } from '../hooks/useAsyncEffect';

const { loading, error } = useAsyncEffectWithState(async () => {
  const data = await fetchData();
  setData(data);
}, [dependency]);

if (loading) return <Spinner />;
if (error) return <Error message={error.message} />;
```

## Common Patterns

### Pattern 1: Data Fetching

```typescript
useAsyncEffect(async () => {
  const data = await api.fetchData(id);
  setData(data);
}, [id], (error) => {
  console.error('Failed to fetch data:', error);
  v4ToastManager.showError('Failed to load data');
});
```

### Pattern 2: Form Submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    setSubmitting(true);
    await api.submitForm(formData);
    v4ToastManager.showSuccess('Form submitted successfully');
    navigate('/success');
  } catch (error) {
    console.error('Form submission failed:', error);
    v4ToastManager.showError('Failed to submit form');
  } finally {
    setSubmitting(false);
  }
};
```

### Pattern 3: Polling

```typescript
useEffect(() => {
  let cancelled = false;
  let timeoutId: NodeJS.Timeout;

  const poll = async () => {
    if (cancelled) return;

    try {
      const status = await checkStatus();
      if (!cancelled) {
        setStatus(status);
        if (!status.complete) {
          timeoutId = setTimeout(poll, 5000);
        }
      }
    } catch (error) {
      if (!cancelled) {
        console.error('Polling failed:', error);
      }
    }
  };

  void poll();

  return () => {
    cancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}, []);
```

## Checklist

Before committing async code, verify:

- [ ] All async functions have error handling (try-catch or .catch())
- [ ] All opening braces have matching closing braces
- [ ] useEffect with async has cleanup function
- [ ] Loading states are managed
- [ ] Errors are logged and displayed to users
- [ ] No unhandled promise rejections
- [ ] Complex logic is extracted to separate functions
- [ ] Tests cover async error cases

## Tools

### Pre-commit Hooks
Automatically check for async issues:
```bash
npm run lint:eslint
```

### Audit Script
Scan for async patterns:
```bash
npm run audit:async
```

### Type Checking
Verify TypeScript types:
```bash
npm run type-check
```

## Resources

- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [React: useEffect with async](https://react.dev/reference/react/useEffect#fetching-data-with-effects)
- [TypeScript: Async/Await](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-7.html#asyncawait)

## Related

- [SYNTAX_ERROR_PREVENTION_PLAN.md](../SYNTAX_ERROR_PREVENTION_PLAN.md)
- [PHASE2_AUDIT_REPORT.md](../PHASE2_AUDIT_REPORT.md)
- [useAsyncEffect Hook](../src/hooks/useAsyncEffect.ts)
