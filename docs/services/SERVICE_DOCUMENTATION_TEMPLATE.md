# Service Documentation Template

**Purpose:** Template for creating service UI contracts and restore documents

---

## UI Contract Template

```markdown
# {Service Name} UI Contract

**Version:** 1.0.0  
**Last Updated:** {Date}  
**Service:** `{serviceName}ServiceV8`  
**File:** `src/v8/services/{serviceName}ServiceV8.ts`

---

## Overview

Brief description of the service's purpose and responsibilities.

## API Interface

### Methods

#### `methodName(params)`

**Purpose:** What this method does

**Parameters:**
- `param1` (type): Description
- `param2` (type, optional): Description

**Returns:**
- `Promise<ReturnType>`: Description

**Throws:**
- `ErrorType`: When this error occurs

**Example:**
```typescript
const result = await ServiceName.methodName(param1, param2);
```

## Return Types

### `ReturnType`

```typescript
interface ReturnType {
  field1: string;
  field2?: number;
}
```

## Error Handling

### Error Types

1. **ErrorType1**
   - **When:** Description
   - **Message:** Error message format
   - **Recovery:** How to recover

## State Management

### Persistence

- **Storage:** Where data is stored (localStorage, sessionStorage, memory)
- **Key:** Storage key format
- **Lifecycle:** When data is created/updated/deleted

## Dependencies

### Required Services

- `dependencyServiceV8`: Purpose

### Required Modules

- `module-name`: Purpose

## Usage Examples

### Basic Usage

```typescript
import { ServiceName } from '@/v8/services/serviceNameServiceV8';

const result = await ServiceName.methodName(params);
```

### Advanced Usage

```typescript
// Advanced example
```

## Testing Checklist

- [ ] Method handles valid inputs
- [ ] Method handles invalid inputs
- [ ] Method handles errors correctly
- [ ] State persistence works
- [ ] Dependencies are properly injected
```

---

## Restore Document Template

```markdown
# {Service Name} Restore Document

**Version:** 1.0.0  
**Last Updated:** {Date}  
**Service:** `{serviceName}ServiceV8`  
**File:** `src/v8/services/{serviceName}ServiceV8.ts`

---

## Related Documentation

- [{Service Name} UI Contract](./{service-name}-ui-contract.md)

---

## Overview

Implementation details for restoring this service if it breaks or drifts.

---

## File Location

**Service File:**
- `src/v8/services/{serviceName}ServiceV8.ts`

**Related Files:**
- `src/v8/types/{relatedTypes}.ts`
- `src/v8/utils/{relatedUtils}.ts`

---

## Critical Implementation Details

### 1. Core Functionality

**Correct Implementation:**
```typescript
// Code snippet showing correct implementation
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - What not to do
```

### 2. State Management

**Storage Strategy:**
- Where: localStorage/sessionStorage/memory
- Key format: `{key-pattern}`
- Lifecycle: When created/updated/deleted

**Correct Implementation:**
```typescript
// Storage code
```

### 3. Error Handling

**Error Handling Pattern:**
```typescript
// Error handling code
```

---

## Dependencies

### Required Imports

```typescript
import { Dependency1 } from '@/v8/services/dependency1ServiceV8';
import { Dependency2 } from '@/v8/utils/dependency2';
```

### Service Dependencies

- `dependencyServiceV8`: Used for X
- `anotherServiceV8`: Used for Y

---

## Common Issues and Fixes

### Issue 1: {Issue Name}

**Symptom:** What you see when this issue occurs

**Fix:**
```typescript
// Fix code
```

### Issue 2: {Issue Name}

**Symptom:** What you see when this issue occurs

**Fix:**
```typescript
// Fix code
```

---

## Restoration Checklist

When restoring this service:

1. [ ] Verify file location matches documented path
2. [ ] Check all dependencies are imported
3. [ ] Verify storage keys match documented format
4. [ ] Test error handling
5. [ ] Verify state persistence
6. [ ] Check all method signatures match contract
7. [ ] Run tests

---

## Code Snippets for Restoration

### Complete Service Structure

```typescript
// Full service structure template
export class ServiceNameServiceV8 {
  // Methods
}
```

### Critical Methods

```typescript
// Critical method implementations
```

---

## References

- [Related Documentation](../flows/...)
- [Service Dependencies](./...)
```
