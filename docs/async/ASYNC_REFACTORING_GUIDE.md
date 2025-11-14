# Async Pattern Refactoring Guide

## Overview

This guide provides step-by-step instructions for refactoring the async patterns identified in Phase 2 audit.

## Files to Refactor (Optional)

Based on Phase 2 audit, these files have async patterns that could be refactored:

1. TokenInspector.tsx (Line 109) - useEffect async
2. Callback.tsx (Line 93) - useEffect async
3. HybridCallback.tsx (Line 132) - useEffect async
4. Configuration_original.tsx (Line 365) - useEffect async
5. Dashboard.backup.tsx (Line 349) - useEffect async

**Note:** All patterns are currently safe and working. Refactoring is optional for code quality improvement.

## Refactoring Patterns

### Pattern 1: useEffect with Async (Current)

**Before:**
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      const data = await fetchData();
      setData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  void loadData();
}, [dependency]);
```

**After (Option A - Custom Hook):**
```typescript
import { useAsyncEffect } from '../hooks/useAsyncEffect';

useAsyncEffect(async () => {
  const data = await fetchData();
  setData(data);
}, [dependency], (error) => {
  console.error('Error:', error);
});
```

**After (Option B - With Loading State):**
```typescript
import { useAsyncEffectWithState } from '../hooks/useAsyncEffect';

const { loading, error } = useAsyncEffectWithState(async () => {
  const data = await fetchData();
  setData(data);
}, [dependency]);
```

### Pattern 2: Async onClick (Current - Already Good)

**Current (Keep as is):**
```typescript
onClick={async () => {
  try {
    await operation();
  } catch (error) {
    console.error('Error:', error);
  }
}}
```

**Alternative (Extract to function):**
```typescript
const handleClick = async () => {
  try {
    await operation();
  } catch (error) {
    console.error('Error:', error);
  }
};

// In JSX
onClick={handleClick}
```

### Pattern 3: Void Async Calls (Current - Already Good)

**Current (Keep as is):**
```typescript
const runAsync = async () => {
  try {
    await operation();
  } catch (error) {
    console.error('Error:', error);
  }
};

void runAsync();
```

## Step-by-Step Refactoring

### Example: TokenInspector.tsx

**Step 1: Import the custom hook**
```typescript
import { useAsyncEffect } from '../hooks/useAsyncEffect';
```

**Step 2: Find the useEffect with async**
```typescript
// OLD
useEffect(() => {
  const loadTokens = async () => {
    try {
      const tokens = await tokenService.getTokens();
      setTokens(tokens);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  };
  
  void loadTokens();
}, []);
```

**Step 3: Replace with useAsyncEffect**
```typescript
// NEW
useAsyncEffect(async () => {
  const tokens = await tokenService.getTokens();
  setTokens(tokens);
}, [], (error) => {
  console.error('Failed to load tokens:', error);
});
```

**Step 4: Test the changes**
```bash
npm run type-check
npm run lint
npm run test
```

## Benefits of Refactoring

### 1. Cleaner Code
- Less boilerplate
- More readable
- Consistent patterns

### 2. Better Error Handling
- Centralized error handling
- Consistent error logging
- Easier to test

### 3. Automatic Cleanup
- Prevents memory leaks
- Handles component unmount
- Cancels pending operations

### 4. Type Safety
- Better TypeScript support
- Catches errors at compile time
- Improved IDE autocomplete

## Testing Refactored Code

### Unit Tests

```typescript
import { renderHook } from '@testing-library/react';
import { useAsyncEffect } from '../hooks/useAsyncEffect';

it('should handle async operation', async () => {
  const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });
  
  renderHook(() => 
    useAsyncEffect(async () => {
      await mockFetch();
    }, [])
  );
  
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
it('should load data on mount', async () => {
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Migration Checklist

For each file being refactored:

- [ ] Backup the original file
- [ ] Import useAsyncEffect hook
- [ ] Replace useEffect pattern
- [ ] Update error handling
- [ ] Run type check
- [ ] Run linter
- [ ] Run tests
- [ ] Manual testing
- [ ] Code review
- [ ] Commit changes

## Rollback Plan

If issues occur after refactoring:

1. **Immediate Rollback**
   ```bash
   git revert <commit-hash>
   ```

2. **Partial Rollback**
   - Revert specific file
   - Keep other changes
   - Fix issues incrementally

3. **Testing**
   - Run full test suite
   - Manual testing
   - Verify no regressions

## Priority Order

Refactor in this order (if doing all):

1. **Low Risk** (Start here)
   - Configuration_original.tsx (backup file)
   - Dashboard.backup.tsx (backup file)

2. **Medium Risk**
   - TokenInspector.tsx (utility page)
   - Callback.tsx (callback handler)

3. **Higher Risk** (Do last)
   - HybridCallback.tsx (critical flow)

## When NOT to Refactor

Don't refactor if:

- ❌ Code is working and rarely changes
- ❌ Pattern is already clear and simple
- ❌ No tests exist for the component
- ❌ Close to a release deadline
- ❌ Component is deprecated

## Conclusion

Refactoring is **optional** based on Phase 2 audit results. All current patterns are safe and working correctly. Refactor only if:

- Improving code maintainability
- Adding new features to the file
- Standardizing patterns across codebase
- Team agrees on the approach

**Recommendation:** Start with backup files (Configuration_original.tsx, Dashboard.backup.tsx) as they are lower risk.
