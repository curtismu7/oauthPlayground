# V8 Directory Structure

All V8 code is organized in `src/v8/` to keep it separate from V7 and maintain clear separation of concerns.

## Directory Layout

```
src/v8/
├── components/              # Reusable V8 components
│   ├── __tests__/          # Component tests
│   ├── CredentialsForm.tsx
│   ├── StepActionButtons.tsx
│   ├── StepNavigation.tsx
│   ├── StepProgressBar.tsx
│   └── StepValidationFeedback.tsx
│
├── flows/                   # V8 flow implementations
│   ├── __tests__/          # Flow tests
│   ├── OAuthAuthorizationCodeFlow.tsx
│   └── ImplicitFlow.tsx
│
├── hooks/                   # Custom React hooks for V8
│   ├── __tests__/          # Hook tests
│   └── useStepNavigation.ts
│
├── services/                # Business logic services
│   ├── __tests__/          # Service tests
│   ├── appDiscoveryService.ts
│   ├── configCheckerService.ts
│   ├── credentialsService.ts
│   ├── errorHandler.ts
│   ├── flowResetService.ts
│   ├── implicitFlowIntegrationService.ts
│   ├── oauthIntegrationService.ts
│   ├── storageService.ts
│   └── validationService.ts
│
├── types/                   # TypeScript type definitions
│   └── stepNavigation.ts
│
├── utils/                   # Utility functions
│   └── (utilities go here)
│
├── config/                  # Configuration files
│   ├── constants.ts        # Centralized constants and magic strings
│   └── testCredentials.ts
│
├── README.md               # V8 overview
├── STRUCTURE.md            # This file
└── CODE_STANDARDS.md       # Code quality and standards
```

## Import Paths

All V8 imports use the `@/v8/` alias for consistency:

```typescript
// ✅ CORRECT
import { CredentialsForm } from '@/v8/components/CredentialsForm';
import { CredentialsService } from '@/v8/services/credentialsService';
import { useStepNavigation } from '@/v8/hooks/useStepNavigation';

// ❌ WRONG
import { CredentialsForm } from '../components/CredentialsForm';
import { CredentialsService } from '../services/credentialsService';
```

## Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

```
@/v8/*                  → src/v8/*
@/v8/components/*       → src/v8/components/*
@/v8/services/*         → src/v8/services/*
@/v8/hooks/*            → src/v8/hooks/*
@/v8/flows/*            → src/v8/flows/*
@/v8/types/*            → src/v8/types/*
@/v8/utils/*            → src/v8/utils/*
```

## Component Organization

### Components (`src/v8/components/`)

Reusable UI components used across V8 flows:

- **CredentialsForm.tsx** - Smart credentials input form
- **StepNavigation.tsx** - Step indicator/navigation
- **StepActionButtons.tsx** - Previous/Next/Finish buttons
- **StepValidationFeedback.tsx** - Error/warning display
- **StepProgressBar.tsx** - Progress visualization

### Flows (`src/v8/flows/`)

Complete flow implementations:

- **OAuthAuthorizationCodeFlow.tsx** - Authorization Code flow
- **ImplicitFlow.tsx** - Implicit flow
- (Future: ClientCredentialsFlow.tsx, DeviceCodeFlow.tsx, etc.)

### Hooks (`src/v8/hooks/`)

Custom React hooks:

- **useStepNavigation.ts** - Step navigation state management

### Services (`src/v8/services/`)

Business logic and integrations:

- **credentialsService.ts** - Credentials management (implements ICredentialsService)
- **oauthIntegrationService.ts** - OAuth flow logic (implements IOAuthIntegrationService)
- **implicitFlowIntegrationService.ts** - Implicit flow logic (implements IImplicitFlowIntegrationService)
- **validationService.ts** - Validation rules (implements IValidationService)
- **storageService.ts** - localStorage management (implements IStorageService)
- **appDiscoveryService.ts** - App discovery integration
- **configCheckerService.ts** - Config validation
- **errorHandler.ts** - Error handling (implements IErrorHandlerService)
- **flowResetService.ts** - Flow reset logic (implements IFlowResetService)

### Types (`src/v8/types/`)

TypeScript type definitions:

- **stepNavigation.ts** - Step navigation types
- **services.ts** - Service interfaces for dependency injection and testing

### Config (`src/v8/config/`)

Configuration files:

- **testCredentials.ts** - Test/demo credentials

## Naming Conventions

All V8 code follows strict naming conventions:

### Files
- Components: `ComponentName.tsx`
- Services: `serviceName.ts`
- Hooks: `useHookName.ts`
- Types: `typeName.ts`

### Exports
- Components: `export const ComponentName: React.FC<Props>`
- Services: `export class ServiceName` or `export const serviceName`
- Hooks: `export const useHookName = (...)`

### Module Tags
All logging uses module tags:
```typescript
const MODULE_TAG = '[🎯 MODULE-NAME-V8]';
console.log(`${MODULE_TAG} Message`, { data });
```

## Testing

Tests are colocated in `__tests__/` directories:

```
src/v8/
├── components/
│   ├── __tests__/
│   │   ├── CredentialsForm.test.tsx
│   │   ├── StepNavigation.test.tsx
│   │   └── ...
│   └── ...
├── services/
│   ├── __tests__/
│   │   ├── credentialsService.test.ts
│   │   ├── oauthIntegrationService.test.ts
│   │   └── ...
│   └── ...
└── hooks/
    ├── __tests__/
    │   └── useStepNavigation.test.ts
    └── ...
```

## Adding New Flows

When adding a new flow (e.g., Client Credentials):

1. Create `src/v8/flows/ClientCredentialsFlow.tsx`
2. Import shared components and services
3. Use `CredentialsForm` for credentials step
4. Use `useStepNavigation` for step management
5. Create integration service if needed: `src/v8/services/clientCredentialsIntegrationService.ts`
6. Add tests in `src/v8/flows/__tests__/ClientCredentialsFlow.test.tsx`
7. Update `src/App.tsx` to import and route the new flow

## Adding New Components

When adding a new component:

1. Create `src/v8/components/ComponentName.tsx`
2. Add TypeScript interfaces for props
3. Include module tag for logging
4. Add JSDoc comments
5. Create tests in `src/v8/components/__tests__/ComponentName.test.tsx`
6. Export from component file

## Adding New Services

When adding a new service:

1. Create `src/v8/services/serviceName.ts`
2. Export as class or const
3. Include module tag for logging
4. Add JSDoc comments for all public methods
5. Create tests in `src/v8/services/__tests__/serviceName.test.ts`

## Import Guidelines

### ✅ DO

```typescript
// Import from v8 directory
import { CredentialsForm } from '@/v8/components/CredentialsForm';
import { CredentialsService } from '@/v8/services/credentialsService';

// Import shared utilities (if truly shared)
import { logger } from '@/utils/logger';

// Import React
import React, { useState } from 'react';
```

### ❌ DON'T

```typescript
// Don't use relative paths
import { CredentialsForm } from '../components/CredentialsForm';

// Don't import V8 code from V7
import { SomeV8Component } from '@/v8/components/SomeV8Component';

// Don't mix V7 and V8 in same flow
import { V7Component } from '@/components/V7Component';
```

## Separation from V7

V8 code is completely separate from V7:

- V7 flows: `src/pages/flows/`
- V8 flows: `src/v8/flows/`
- V7 components: `src/components/`
- V8 components: `src/v8/components/`
- V7 services: `src/services/`
- V8 services: `src/v8/services/`

This allows:
- ✅ Running V7 and V8 flows side-by-side
- ✅ Easy rollback if needed
- ✅ Clear code organization
- ✅ No breaking changes to V7
- ✅ Future-proof for V9, V10, etc.

## Documentation

Each directory should have a README explaining its purpose:

- `src/v8/README.md` - V8 overview
- `src/v8/components/README.md` - Component documentation
- `src/v8/services/README.md` - Service documentation
- `src/v8/hooks/README.md` - Hook documentation

---

**Last Updated:** 2024-11-16  
**Version:** 1.0.0
