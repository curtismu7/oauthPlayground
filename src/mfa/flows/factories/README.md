# MFA Flow Factory Pattern

## Architecture Overview

The MFA flow uses a **hybrid Router + Factory + Controller** pattern:

```
┌─────────────────┐
│   Router        │  MFAFlowV8.tsx - Routes to device type
│  (UI Routing)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Factory       │  MFAFlowComponentFactory - Creates React components
│  (Component)    │  MFAFlowControllerFactory - Creates controllers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │  MFAFlowController - Business logic
│  (Business)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service       │  MFAServiceV8 - API calls
│  (Data)         │
└─────────────────┘
```

## Components

### 1. Router (`MFAFlowV8.tsx`)
- **Purpose**: UI-level routing to device-specific components
- **Responsibility**: Determine which device flow to show
- **Pattern**: Simple switch/router component

### 2. Component Factory (`MFAFlowComponentFactory`)
- **Purpose**: Create React components dynamically
- **Benefits**:
  - Lazy loading for code splitting
  - Centralized component registration
  - Easy to add new device types
- **Usage**:
```typescript
const Component = MFAFlowComponentFactory.create('SMS');
return <Component />;
```

### 3. Controller Factory (`MFAFlowControllerFactory`)
- **Purpose**: Create controller instances
- **Benefits**:
  - Dependency injection
  - Consistent controller creation
  - Easy testing
- **Usage**:
```typescript
const controller = MFAFlowControllerFactory.create({
  deviceType: 'SMS',
  callbacks: { onDeviceRegistered: (id) => console.log(id) }
});
```

### 4. Controllers (`MFAFlowController`, `SMSFlowController`, etc.)
- **Purpose**: Business logic layer
- **Benefits**:
  - Separated from UI
  - Reusable across contexts
  - Testable independently

## Why This Architecture?

### Router Pattern
✅ **Pros:**
- Simple, clear routing logic
- Easy to understand flow
- React-friendly

❌ **Cons:**
- Can become large with many routes
- Hard to test routing logic

### Factory Pattern
✅ **Pros:**
- Centralized creation logic
- Easy to add new types
- Supports lazy loading
- Dependency injection

❌ **Cons:**
- Additional abstraction layer
- Slightly more complex

### Controller Pattern
✅ **Pros:**
- Separates business logic from UI
- Reusable across contexts
- Easy to test
- Single responsibility

❌ **Cons:**
- Additional layer
- Need to pass state around

## Hybrid Approach Benefits

1. **Router** handles UI routing (simple, React-friendly)
2. **Factory** handles instantiation (flexible, maintainable)
3. **Controller** handles business logic (testable, reusable)

This gives us:
- ✅ Simple routing (Router)
- ✅ Flexible creation (Factory)
- ✅ Clean business logic (Controller)
- ✅ Easy to extend (all patterns)

## Adding a New Device Type

1. **Create Controller:**
```typescript
// TOTPFlowController.ts
export class TOTPFlowController extends MFAFlowController {
  // ... implementation
}
```

2. **Register in Controller Factory:**
```typescript
// MFAFlowControllerFactory.ts
case 'TOTP':
  return new TOTPFlowController(callbacks);
```

3. **Create Component:**
```typescript
// TOTPFlowV8.tsx
export const TOTPFlowV8: React.FC = () => {
  const controller = useMemo(() => 
    MFAFlowControllerFactory.create({ deviceType: 'TOTP' }), []
  );
  // ... use controller
};
```

4. **Register in Component Factory:**
```typescript
// MFAFlowComponentFactory.ts
MFAFlowComponentFactory.register('TOTP', TOTPFlowV8);
```

5. **Router automatically picks it up** (no changes needed!)

## Comparison: Controller vs Router/Factory

| Aspect | Controller Only | Router/Factory Only | Hybrid (Current) |
|--------|----------------|---------------------|------------------|
| **UI Routing** | ❌ Manual | ✅ Automatic | ✅ Automatic |
| **Business Logic** | ✅ Separated | ❌ In components | ✅ Separated |
| **Component Creation** | ❌ Manual | ✅ Factory | ✅ Factory |
| **Testability** | ✅ High | ⚠️ Medium | ✅ High |
| **Maintainability** | ✅ High | ✅ High | ✅✅ Highest |
| **Extensibility** | ✅ Easy | ✅ Easy | ✅✅ Easiest |
| **Code Reuse** | ✅ High | ⚠️ Medium | ✅✅ Highest |

## Recommendation

**Use the Hybrid Approach** (Router + Factory + Controller):
- Best of all worlds
- Matches existing codebase patterns
- Most maintainable and extensible
- Follows separation of concerns

