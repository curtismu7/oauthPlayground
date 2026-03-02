# Critical Runtime Issues Tracking

## Issue Summary
This document tracks critical runtime errors that have been identified and fixed to prevent recurrence during migrations and development.

---

## 1. WorkerTokenModalV8 Validation Error

### **Error Description**
```
WorkerTokenModalV8.tsx:368 [🔑 WORKER-TOKEN-MODAL-V8] Pre-flight validation error: Error: Please fill in all required fields
    at generateSpinner.executeWithSpinner.onSuccess (WorkerTokenModalV8.tsx:201:12)
```

### **Root Cause**
The validation logic in `WorkerTokenModalV8.tsx` was throwing an error when required fields (environmentId, clientId, clientSecret) were empty, but this was causing unhandled promise rejections.

### **Location**
- **File**: `src/v8/components/WorkerTokenModalV8.tsx`
- **Line**: 197-201
- **Function**: `handleGenerate`

### **Fix Applied**
```typescript
// Before (causing unhandled rejection):
if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
    toastV8.error('Please fill in all required fields');
    throw new Error('Please fill in all required fields'); // This throws in async context
}

// After (proper error handling):
if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
    toastV8.error('Please fill in all required fields');
    return; // Early return instead of throwing
}
```

### **Migration Guide Reference**
- **Check**: Ensure all async form validations use early returns instead of throwing errors
- **Verify**: Toast notifications are shown for validation feedback
- **Test**: Form submission with empty fields should not crash the component

---

## 2. PingOneUserProfile Hooks Order Violation

### **Error Description**
```
Warning: React has detected a change in the order of Hooks called by PingOneUserProfile. This will lead to bugs and errors if not fixed.
```

### **Root Cause**
The component has too many hooks (50+ useState calls) and the order is changing between renders due to conditional logic or early returns.

### **Location**
- **File**: `src/pages/PingOneUserProfile.tsx`
- **Lines**: 621-720 (hook declarations)
- **Issue**: Hook order changes between renders

### **Symptoms**
- React hooks order warning
- `Cannot read properties of undefined (reading 'length')` in `areHookInputsEqual`
- Component crashes and re-renders infinitely

### **Fix Strategy**
1. **Consolidate State**: Combine related useState hooks into a single state object
2. **Move Conditional Logic**: Ensure all hooks are called before any conditional returns
3. **useReducer**: Consider using useReducer for complex state management

### **Migration Guide Reference**
- **Check**: All components must have consistent hook order on every render
- **Verify**: No hooks are called inside conditions, loops, or after early returns
- **Test**: Component renders consistently without hook order warnings
- **Pattern**: Limit to < 20 hooks per component, consolidate related state

---

## 3. DeviceAuthorizationFlowV9 Null Reference Error

### **Error Description**
```
DeviceAuthorizationFlowV9.tsx:1250 Uncaught TypeError: Cannot read properties of null (reading 'clientId')
```

### **Root Cause**
The code was accessing `deviceFlow.credentials.clientId` without checking if `deviceFlow.credentials` was null.

### **Location**
- **File**: `src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx`
- **Lines**: 1222-1226, 1250-1254
- **Issue**: Missing null checks on credentials object

### **Fix Applied**
```typescript
// Before (causing error):
hasClientId: !!deviceFlow.credentials.clientId,
deviceFlow.credentials.clientId,

// After (safe access):
hasClientId: !!deviceFlow.credentials?.clientId,
deviceFlow.credentials?.clientId,
```

### **Migration Guide Reference**
- **Check**: All object property access uses optional chaining when object might be null
- **Verify**: Null checks are present before accessing nested properties
- **Test**: Component handles null/undefined state gracefully

---

## 4. CIBAFlowV9 Import Error

### **Error Description**
```
CIBAFlowV9.tsx:259 Uncaught ReferenceError: useCibaFlowV8Enhanced is not defined
```

### **Root Cause**
The `useCibaFlowV8Enhanced` hook was being used but not imported in the component.

### **Location**
- **File**: `src/pages/flows/CIBAFlowV9.tsx`
- **Line**: 259
- **Missing Import**: `useCibaFlowV8Enhanced`

### **Fix Applied**
```typescript
// Added missing import:
import { useCibaFlowV8Enhanced } from '@/v8/hooks/useCibaFlowV8Enhanced';
```

### **Migration Guide Reference**
- **Check**: All used hooks and functions are properly imported
- **Verify**: No undefined references in component code
- **Test**: Component loads without reference errors

---

## 5. useImplicitFlowController Infinite Loop

### **Error Description**
```
Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

### **Root Cause**
The useEffect dependency array included the entire `credentials` object, causing infinite re-renders when credentials changed.

### **Location**
- **File**: `src/hooks/useImplicitFlowController.ts`
- **Lines**: 820-828, 848-866
- **Issue**: Circular dependency in useEffect and useMemo

### **Fix Applied**
```typescript
// Before (causing infinite loop):
useEffect(() => {
    // ... logic that depends on credentials
}, [credentials]); // credentials object changes every render

// After (specific dependencies):
useEffect(() => {
    // ... same logic
}, [
    credentials.environmentId,
    credentials.clientId,
    credentials.clientSecret,
    // ... specific properties only
]);
```

### **Migration Guide Reference**
- **Check**: useEffect dependencies use specific properties, not entire objects
- **Verify**: No circular dependencies between hooks
- **Test**: Component doesn't trigger infinite re-renders

---

## Prevention Checklist for Migrations

### **Before Migration**
- [ ] Check for undefined imports/references
- [ ] Verify hook order consistency
- [ ] Add null checks for object property access
- [ ] Review useEffect dependencies for circular references
- [ ] Ensure proper error handling in async functions

### **During Migration**
- [ ] Test component loading with empty/null state
- [ ] Verify form validation doesn't throw unhandled errors
- [ ] Check React DevTools for hook order warnings
- [ ] Monitor console for runtime errors
- [ ] Test edge cases (missing data, network errors)

### **After Migration**
- [ ] Run full application test suite
- [ ] Check browser console for warnings/errors
- [ ] Verify all components load without crashing
- [ ] Test user interactions don't cause errors
- [ ] Update this tracking document with any new issues found

---

## Common Patterns to Avoid

### **1. Unsafe Object Access**
```typescript
// ❌ Unsafe
const clientId = credentials.clientId;

// ✅ Safe
const clientId = credentials?.clientId;
```

### **2. Throwing in Async Handlers**
```typescript
// ❌ Unsafe
const handleSubmit = async () => {
    if (!isValid) {
        throw new Error('Invalid'); // Unhandled rejection
    }
};

// ✅ Safe
const handleSubmit = async () => {
    if (!isValid) {
        showError('Invalid');
        return; // Early return
    }
};
```

### **3. Hook Order Issues**
```typescript
// ❌ Unsafe
if (condition) {
    const [state, setState] = useState(); // Conditional hook
}

// ✅ Safe
const [state, setState] = useState();
if (condition) {
    // Use state here
}
```

### **4. Circular Dependencies**
```typescript
// ❌ Unsafe
const memoizedValue = useMemo(() => compute(credentials), [credentials]);
useEffect(() => {
    setCredentials(updateCredentials(memoizedValue));
}, [memoizedValue]); // Circular

// ✅ Safe
const memoizedValue = useMemo(() => compute(credentials), [
    credentials.id, // Specific dependencies
    credentials.name,
]);
useEffect(() => {
    setCredentials(updateCredentials(memoizedValue));
}, [memoizedValue]);
```

---

---

## 6. Unclosed JSX Container Tags in Flow Files *(March 2, 2026 — FIXED)*

### **Error Description**
```
error TS17008: JSX element 'FlowContainer' has no corresponding closing tag.
error TS1381: Unexpected token. Did you mean `{'}'}` or `&rbrace;`?
error TS1005: '</' expected.
```
Affected 4 files — 13 TypeScript errors total blocking `tsc --noEmit`.

### **Root Cause**
`<WorkerTokenModalV8 />` was pasted **outside** the return's JSX tree — placed after `</FormContainer>` but before the outer container-closing tag. The outer `</FlowContainer>` (or `</div>`) and the `);` / `};` closes were either missing or never written.

### **Locations Fixed**
| File | Missing tag | Commit |
|------|------------|--------|
| `src/pages/flows/TokenIntrospectionFlow.tsx` | `</FlowContainer>` before `);` | `9276d70` |
| `src/pages/flows/TokenManagementFlow.tsx` | `</FlowContainer>` before `);` | `9276d70` |
| `src/pages/flows/TokenRevocationFlow.tsx` | `</FlowContainer>` before `);` | `9276d70` |
| `src/pages/WorkerTokenTester.tsx` | `</div>`, `);`, `};` — component fully unclosed | `9276d70` |

### **Fix Pattern**
```tsx
// ❌ Before — WorkerTokenModalV8 placed outside the return tree:
			</FormContainer>
                        <WorkerTokenModalV8 ... />
	);
};

// ✅ After — modal inside container, container properly closed:
			</FormContainer>
			<WorkerTokenModalV8 ... />
		</FlowContainer>
	);
};
```

### **Prevention**
- Always ensure `<WorkerTokenModalV8 />` is placed as the **last child inside** the outer container, not after `</FormContainer>`.
- `tsc --noEmit` catches this immediately — run it before every commit.
- Use a scaffold script to generate the component shell so the closing structure is never missing.

---

## 7. React Hook Dependency Errors in V9 Flow Files *(March 2, 2026 — FIXED)*

### **Error Description**
```
useCallback hook does not specify its dependency on exchangeParams.requestedTokenType.
useEffect hook specifies more dependencies than necessary: currentStep.
```

### **Root Cause**
1. `performTokenExchange` used `exchangeParams.requestedTokenType` in its body but the dep array only listed `exchangeParams.audience`.
2. A `useEffect(() => { window.scrollTo(...) }, [currentStep])` triggered scroll on step change, but `currentStep` is a value used only to trigger the effect — linter flagged it correctly as an unnecessary trigger dep when the real fix is to inline the scroll into the navigation handlers.

### **Location Fixed**
- **File**: `src/pages/flows/v9/TokenExchangeFlowV9.tsx`
- **Commit**: `f6f451d`

### **Fix Pattern**
```tsx
// ❌ Before — missing dep + useEffect trigger pattern:
const performTokenExchange = useCallback(async () => {
    // uses exchangeParams.requestedTokenType
}, [exchangeParams.audience, selectedScopes]); // missing dep!

React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, [currentStep]); // useEffect just to trigger on nav

// ✅ After — complete dep array + inline scroll in handlers:
const performTokenExchange = useCallback(async () => {
    // uses exchangeParams.requestedTokenType
}, [exchangeParams.audience, exchangeParams.requestedTokenType, selectedScopes]);

const goToNextStep = useCallback(() => {
    if (currentStep < STEP_METADATA.length - 1) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // inline
    }
}, [currentStep]);
```

### **Prevention**
- When a `useCallback`/`useMemo` accesses a nested property (`object.property`), add **that specific property** to deps, not just the parent object.
- Prefer inlining side effects (scroll, focus) into event handlers over `useEffect` triggers when they logically belong to the action.
- `biome check` or ESLint `react-hooks/exhaustive-deps` catches both patterns — run before every commit.

---

## Version Information
- **Document Created**: March 2, 2026
- **Last Updated**: March 2, 2026 *(Issues 6–7 added)*
- **App Version**: 9.12.10
- **Status**: Active Tracking

## Related Files
- `src/v8/components/WorkerTokenModalV8.tsx`
- `src/pages/PingOneUserProfile.tsx`
- `src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx`
- `src/pages/flows/CIBAFlowV9.tsx`
- `src/hooks/useImplicitFlowController.ts`
- `src/pages/flows/TokenIntrospectionFlow.tsx`
- `src/pages/flows/TokenManagementFlow.tsx`
- `src/pages/flows/TokenRevocationFlow.tsx`
- `src/pages/WorkerTokenTester.tsx`
- `src/pages/flows/v9/TokenExchangeFlowV9.tsx`
