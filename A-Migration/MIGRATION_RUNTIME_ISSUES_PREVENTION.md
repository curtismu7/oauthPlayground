# Migration Guide: Critical Runtime Issues Prevention

## Overview
This guide documents critical runtime issues that have been identified and fixed during development to prevent recurrence during migrations.

---

## 🚨 Critical Issues to Check Before Migration

### 1. **Null Reference Errors**
**Pattern**: `Cannot read properties of null (reading 'property')`

**Checklist**:
- [ ] All object property access uses optional chaining (`?.`)
- [ ] Null checks before accessing nested properties
- [ ] Safe defaults for potentially null values

**Example Fix**:
```typescript
// ❌ Unsafe
const clientId = credentials.clientId;

// ✅ Safe
const clientId = credentials?.clientId;
```

### 2. **Import/Reference Errors**
**Pattern**: `Uncaught ReferenceError: X is not defined`

**Checklist**:
- [ ] All used hooks/functions are properly imported
- [ ] No undefined references in component code
- [ ] Import paths are correct and exist

**Example Fix**:
```typescript
// ❌ Missing import
useCibaFlowV8Enhanced(); // ReferenceError

// ✅ Proper import
import { useCibaFlowV8Enhanced } from '@/v8/hooks/useCibaFlowV8Enhanced';
useCibaFlowV8Enhanced();
```

### 3. **React Hooks Order Violations**
**Pattern**: `React has detected a change in the order of Hooks called`

**Checklist**:
- [ ] All hooks are called before any conditional returns
- [ ] No hooks inside conditions, loops, or after early returns
- [ ] Consistent hook order on every render
- [ ] Limit to < 20 hooks per component

**Example Fix**:
```typescript
// ❌ Conditional hook
if (condition) {
    const [state, setState] = useState();
}

// ✅ Safe
const [state, setState] = useState();
if (condition) {
    // Use state here
}
```

### 4. **Infinite Re-render Loops**
**Pattern**: `Maximum update depth exceeded` in useEffect/useMemo

**Checklist**:
- [ ] useEffect dependencies use specific properties, not entire objects
- [ ] No circular dependencies between hooks
- [ ] Stable dependency arrays

**Example Fix**:
```typescript
// ❌ Circular dependency
const memoizedValue = useMemo(() => compute(credentials), [credentials]);
useEffect(() => {
    setCredentials(updateCredentials(memoizedValue));
}, [memoizedValue]);

// ✅ Specific dependencies
const memoizedValue = useMemo(() => compute(credentials), [
    credentials.id,
    credentials.name,
]);
```

### 5. **Async Error Handling**
**Pattern**: Unhandled promise rejections in async handlers

**Checklist**:
- [ ] Async form validation uses early returns instead of throwing
- [ ] Proper error boundaries for async operations
- [ ] User feedback for validation errors

**Example Fix**:
```typescript
// ❌ Unsafe throwing
const handleSubmit = async () => {
    if (!isValid) {
        throw new Error('Invalid'); // Unhandled rejection
    }
};

// ✅ Safe early return
const handleSubmit = async () => {
    if (!isValid) {
        showError('Invalid');
        return; // Early return
    }
};
```

---

## 🔍 Pre-Migration Testing Checklist

### **Component Loading Tests**
- [ ] Component loads with empty/null state
- [ ] No console errors on initial render
- [ ] No React hook order warnings
- [ ] Component renders consistently

### **Form Validation Tests**
- [ ] Empty form submission doesn't crash
- [ ] Validation errors show user-friendly messages
- [ ] No unhandled promise rejections
- [ ] Form state resets properly

### **Data Fetching Tests**
- [ ] Handles network errors gracefully
- [ ] Shows loading states correctly
- [ ] Handles null/undefined API responses
- [ ] Error boundaries catch async errors

### **State Management Tests**
- [ ] State updates don't cause infinite loops
- [ ] useEffect dependencies are stable
- [ ] useMemo/useCallback have correct dependencies
- [ ] Component unmounts cleanly

---

## 🛠️ Common Migration Patterns

### **Safe Object Access Pattern**
```typescript
// Always use optional chaining for potentially null objects
const clientId = credentials?.clientId || '';
const userName = userProfile?.name || 'Unknown User';
const isActive = status?.value === 'active';
```

### **Stable Dependencies Pattern**
```typescript
// Use specific properties in dependency arrays
useEffect(() => {
    // Effect logic
}, [
    credentials.id,        // ✅ Specific
    credentials.name,      // ✅ Specific
    // credentials,         // ❌ Entire object
]);
```

### **Error Handling Pattern**
```typescript
// Safe async error handling
const handleAsync = async () => {
    try {
        if (!validateInputs()) {
            showError('Please fill required fields');
            return; // Early return, don't throw
        }
        
        const result = await apiCall();
        setSuccess(result);
    } catch (error) {
        setError(error.message);
    }
};
```

### **Hook Order Pattern**
```typescript
// All hooks first, no conditions
const Component = () => {
    // ✅ All hooks at top
    const [state, setState] = useState();
    const { data } = useHook();
    const memoized = useMemo(() => compute(), [dependency]);
    
    // ✅ Conditional logic after hooks
    if (condition) {
        return <div />;
    }
    
    return <div>{state}</div>;
};
```

---

## 📋 Migration Verification

### **Console Check**
- [ ] No errors in browser console
- [ ] No React warnings
- [ ] No unhandled promise rejections
- [ ] Clean component mount/unmount

### **React DevTools Check**
- [ ] Component renders without hook order warnings
- [ ] Props and state update correctly
- [ ] No memory leaks on unmount
- [ ] Stable component identity

### **Network Check**
- [ ] API calls handle errors gracefully
- [ ] Loading states show correctly
- [ ] Retry logic works if needed
- [ ] No hanging requests

---

## 🚨 Known Issues to Watch For

### **Device Authorization Flow V9**
- ✅ Fixed: Null reference error in credentials access
- ✅ Pattern: Use optional chaining for deviceFlow.credentials

### **CIBA Flow V9**
- ✅ Fixed: Missing import for useCibaFlowV8Enhanced
- ✅ Pattern: Verify all imports are present

### **Worker Token Modal V8**
- ✅ Fixed: Validation error throwing in async context
- ✅ Pattern: Use early returns instead of throwing in validation

### **PingOne User Profile**
- ⚠️ Warning: Too many useState hooks causing order issues
- 🔄 Pattern: Consolidate related state into objects

---

## 📚 Reference Documents

- **Critical Runtime Issues Tracking**: `A-Migration/CRITICAL_RUNTIME_ISSUES_TRACKING.md`
- **Zero Tolerance Clean Code Policy**: `A-Migration/ZERO_TOLERANCE_CLEAN_CODE_POLICY.md`
- **Migration Best Practices**: `A-Migration/MIGRATION_BEST_PRACTICES.md`

---

## 🔄 Review Process

1. **Before Migration**: Review this checklist
2. **During Migration**: Apply patterns consistently
3. **After Migration**: Run verification tests
4. **Update Docs**: Add any new issues found

---

**Version**: 9.12.10  
**Last Updated**: March 2, 2026  
**Status**: Active Prevention Guide
