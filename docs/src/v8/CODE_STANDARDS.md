# V8 Code Standards

**Version:** 1.0.0  
**Last Updated:** 2024-11-16  
**Status:** Active

Professional code standards for V8 development. All code must follow these standards for consistency, maintainability, and quality.

---

## 1. File Organization

### File Structure
```
src/v8/
├── components/
│   ├── __tests__/
│   │   └── ComponentName.test.tsx
│   └── ComponentName.tsx
├── services/
│   ├── __tests__/
│   │   └── serviceName.test.ts
│   └── serviceName.ts
├── hooks/
│   ├── __tests__/
│   │   └── useHookName.test.ts
│   └── useHookName.ts
├── flows/
│   ├── __tests__/
│   │   └── FlowName.test.tsx
│   └── FlowName.tsx
├── types/
│   └── typeName.ts
├── config/
│   └── constants.ts
└── utils/
    └── utilityName.ts
```

### File Naming
- **Components:** `ComponentName.tsx` (PascalCase + V8 suffix)
- **Services:** `serviceName.ts` (camelCase + V8 suffix)
- **Hooks:** `useHookName.ts` (camelCase + V8 suffix)
- **Types:** `typeName.ts` (camelCase)
- **Tests:** `*.test.ts` or `*.test.tsx`

---

## 2. TypeScript Standards

### Type Definitions

**✅ DO:**
```typescript
// Use proper interfaces
interface Credentials {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
}

// Use union types for specific values
type FlowType = 'oauth' | 'oidc' | 'client-credentials';

// Use readonly for constants
const FLOW_KEYS = {
  OAUTH: 'oauth-authz-v8'
} as const;
```

**❌ DON'T:**
```typescript
// Avoid any type
const credentials: any = {};

// Avoid generic object type
const config: object = {};

// Avoid implicit any
function process(data) { }
```

### Strict Mode
All files must pass TypeScript strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

---

## 3. Error Handling

### Try-Catch Blocks

**✅ DO:**
```typescript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  ErrorHandler.handleError(error, { operation: 'someAsyncOperation' });
  throw new Error(`Failed to complete operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

**❌ DON'T:**
```typescript
// Missing error handling
const result = await someAsyncOperation();
return result;

// Generic catch
try {
  // ...
} catch (e) {
  console.log('Error');
}
```

### Error Messages

**✅ DO:**
```typescript
throw new Error('Invalid environment ID: must be a valid UUID');
throw new Error('Failed to generate authorization URL: network timeout');
```

**❌ DON'T:**
```typescript
throw new Error('Error');
throw new Error('Failed');
throw 'Something went wrong';
```

---

## 4. Logging Standards

### Module Tags

All logging must use module tags for easy filtering:

```typescript
const MODULE_TAG = '[🔐 OAUTH-AUTHZ-CODE-V8]';

// Use appropriate log levels
console.log(`${MODULE_TAG} Operation started`, { data });
console.warn(`${MODULE_TAG} Warning message`, { data });
console.error(`${MODULE_TAG} Error occurred`, { error });
```

### Logging Levels

- **console.log()** - Info level (normal operations)
- **console.warn()** - Warning level (potential issues)
- **console.error()** - Error level (failures)

### Context Information

Always include relevant context:

```typescript
console.log(`${MODULE_TAG} Credentials loaded`, {
  flowKey: 'oauth-authz-v8',
  hasClientSecret: !!credentials.clientSecret,
  timestamp: new Date().toISOString()
});
```

---

## 5. Documentation Standards

### JSDoc Comments

All public functions and classes must have JSDoc:

```typescript
/**
 * Generate authorization URL for OAuth flow
 * @param credentials - User credentials
 * @returns Authorization URL with state and code challenge
 * @throws {Error} If credentials are invalid
 * @example
 * const result = generateAuthorizationUrl(credentials);
 * @see {@link parseCallbackUrl} for parsing the callback
 */
export function generateAuthorizationUrl(credentials: Credentials): AuthorizationUrlResult {
  // implementation
}
```

### File Headers

All files must have a header comment:

```typescript
/**
 * @file serviceName.ts
 * @module v8/services
 * @description Brief description of what this service does
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Detailed description of functionality, features, and usage.
 *
 * @example
 * import { ServiceName } from '@/v8/services/serviceName';
 * const result = ServiceName.doSomething();
 */
```

### Component Documentation

```typescript
/**
 * @file ComponentName.tsx
 * @module v8/components
 * @description Brief description
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - Feature 1
 * - Feature 2
 *
 * @example
 * <ComponentName
 *   prop1="value"
 *   prop2={value}
 * />
 */
```

---

## 6. Constants Management

### Use Constants File

**✅ DO:**
```typescript
// In src/v8/config/constants.ts
export const FLOW_KEYS = {
  OAUTH_AUTHZ: 'oauth-authz-v8',
  IMPLICIT: 'implicit-flow-v8'
} as const;

// In component
import { FLOW_KEYS } from '@/v8/config/constants';
const flowKey = FLOW_KEYS.OAUTH_AUTHZ;
```

**❌ DON'T:**
```typescript
// Magic strings scattered in code
const flowKey = 'oauth-authz-v8';
const redirectUri = 'http://localhost:3000/callback';
```

---

## 7. Service Design

### Service Interfaces

All services must implement interfaces:

```typescript
import type { ICredentialsService } from '@/v8/types/services';

export class CredentialsService implements ICredentialsService {
  // implementation
}
```

### Static vs Instance Methods

- Use **static methods** for stateless utilities
- Use **instance methods** for stateful services
- Prefer static methods for services

```typescript
// ✅ Stateless service
export class UtilityService {
  static formatToken(token: string): string { }
  static validateToken(token: string): boolean { }
}

// ✅ Stateful service (if needed)
export class CacheService {
  private cache = new Map();
  
  get(key: string) { }
  set(key: string, value: any) { }
}
```

---

## 8. Component Design

### Props Interface

Always define props interface:

```typescript
export interface ComponentNameV8Props {
  /** Required prop description */
  requiredProp: string;
  
  /** Optional prop description */
  optionalProp?: string;
  
  /** Callback description */
  onAction?: (data: any) => void;
}

export const ComponentName: React.FC<ComponentNameV8Props> = ({
  requiredProp,
  optionalProp,
  onAction
}) => {
  // implementation
};
```

### Memoization

Use React.memo and useCallback for performance:

```typescript
export const ComponentName = React.memo<ComponentNameV8Props>(({
  requiredProp,
  onAction
}) => {
  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);

  return <button onClick={handleClick}>{requiredProp}</button>;
});
```

---

## 9. Testing Standards

### Test File Location

Tests are colocated in `__tests__/` directories:

```
src/v8/
├── components/
│   ├── __tests__/
│   │   └── ComponentName.test.tsx
│   └── ComponentName.tsx
```

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    it('should render with required props', () => {
      // test
    });
  });

  describe('interactions', () => {
    it('should call onAction when clicked', () => {
      // test
    });
  });

  describe('edge cases', () => {
    it('should handle undefined props', () => {
      // test
    });
  });
});
```

### Mocking Services

Use interfaces for easy mocking:

```typescript
const mockService: ICredentialsService = {
  getSmartDefaults: jest.fn().mockReturnValue({}),
  loadCredentials: jest.fn().mockReturnValue({})
};
```

---

## 10. Import Standards

### Import Order

```typescript
// 1. React and external libraries
import React, { useState, useCallback } from 'react';
import type { FC } from 'react';

// 2. V8 components
import { ComponentName } from '@/v8/components/ComponentName';

// 3. V8 services
import { ServiceName } from '@/v8/services/serviceName';

// 4. V8 types
import type { SomeType } from '@/v8/types/services';

// 5. V8 config
import { CONSTANTS } from '@/v8/config/constants';

// 6. Styles
import './ComponentName.css';
```

### Path Aliases

Always use path aliases:

```typescript
// ✅ CORRECT
import { CredentialsForm } from '@/v8/components/CredentialsForm';

// ❌ WRONG
import { CredentialsForm } from '../components/CredentialsForm';
```

---

## 11. Code Style

### Naming Conventions

```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// Variables: camelCase
const userName = 'John';
const isValid = true;

// Functions: camelCase
function generateToken() { }
const validateCredentials = () => { };

// Classes: PascalCase
class CredentialsService { }

// Interfaces: IPascalCase
interface ICredentialsService { }

// Types: PascalCase
type FlowType = 'oauth' | 'oidc';
```

### Line Length

Keep lines under 100 characters:

```typescript
// ✅ GOOD
const result = await generateAuthorizationUrl(
  credentials,
  { includeNonce: true }
);

// ❌ BAD
const result = await generateAuthorizationUrl(credentials, { includeNonce: true, includeState: true, includePkce: true });
```

---

## 12. Performance

### Memoization

Use memoization for expensive operations:

```typescript
const config = useMemo(
  () => CredentialsService.getFlowConfig(flowKey),
  [flowKey]
);

const handleChange = useCallback(
  (field: string, value: string) => {
    // ...
  },
  [flowKey, credentials]
);
```

### Lazy Loading

Lazy load components when appropriate:

```typescript
const ClientCredentialsFlow = lazy(
  () => import('@/v8/flows/ClientCredentialsFlow')
);
```

---

## 13. Security

### Sensitive Data

Never log sensitive data:

```typescript
// ❌ WRONG
console.log('Credentials:', credentials);

// ✅ CORRECT
console.log('Credentials loaded', {
  hasClientSecret: !!credentials.clientSecret,
  environmentId: credentials.environmentId
});
```

### Input Validation

Always validate user input:

```typescript
if (!credentials.environmentId?.trim()) {
  throw new Error('Environment ID is required');
}

if (!REGEX.ENVIRONMENT_ID.test(credentials.environmentId)) {
  throw new Error('Invalid environment ID format');
}
```

---

## 14. Accessibility

### ARIA Labels

All interactive elements must have ARIA labels:

```typescript
<input
  type="text"
  placeholder="Enter value"
  aria-label="Environment ID input"
/>

<button
  onClick={handleClick}
  aria-label="Generate authorization URL"
>
  Generate
</button>
```

### Semantic HTML

Use semantic HTML elements:

```typescript
// ✅ CORRECT
<button onClick={handleClick}>Click me</button>
<label htmlFor="input">Label</label>
<input id="input" />

// ❌ WRONG
<div onClick={handleClick}>Click me</div>
<span>Label</span>
<div id="input" />
```

---

## 15. Code Review Checklist

Before submitting code for review:

- [ ] All TypeScript strict mode checks pass
- [ ] All functions have JSDoc comments
- [ ] All errors are handled with try-catch
- [ ] All logging uses module tags
- [ ] No magic strings (use constants)
- [ ] All props have interfaces
- [ ] All services implement interfaces
- [ ] Tests are included
- [ ] No console.log in production code
- [ ] No `any` types
- [ ] Accessibility standards met
- [ ] Performance optimizations applied
- [ ] Security best practices followed

---

## 16. Common Patterns

### Error Handling Pattern

```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  ErrorHandler.handleError(error, { operation: 'operationName' });
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

### Service Method Pattern

```typescript
/**
 * Description of what this does
 * @param param - Parameter description
 * @returns Return value description
 * @throws {Error} Error conditions
 * @example
 * const result = Service.method(param);
 */
static method(param: string): ReturnType {
  console.log(`${MODULE_TAG} Method called`, { param });
  
  try {
    // implementation
    return result;
  } catch (error) {
    ErrorHandler.handleError(error, { method: 'method', param });
    throw error;
  }
}
```

### Component Pattern

```typescript
export interface ComponentNameV8Props {
  prop1: string;
  prop2?: number;
  onAction?: () => void;
}

export const ComponentName: React.FC<ComponentNameV8Props> = React.memo(({
  prop1,
  prop2,
  onAction
}) => {
  const handleClick = useCallback(() => {
    onAction?.();
  }, [onAction]);

  return (
    <div>
      <button onClick={handleClick}>{prop1}</button>
    </div>
  );
});

ComponentName.displayName = 'ComponentName';
```

---

## Enforcement

### Pre-commit Checks

```bash
npm run lint:v8
npm run type-check:v8
npm run test:v8
```

### Code Review

All code must be reviewed by at least one other developer before merging.

---

**Last Updated:** 2024-11-16  
**Version:** 1.0.0  
**Status:** Active
