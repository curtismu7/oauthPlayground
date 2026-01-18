# P1MFA SDK - Suggested Repository Structure

This document outlines a suggested repository structure for the P1MFA SDK that is **drop-in friendly** - meaning it can be easily integrated into other projects as a standalone package.

## Repository Structure

```
p1mfa-sdk/
├── src/
│   ├── index.ts                    # Main SDK entry point
│   ├── P1MFASDK.ts                 # Core SDK class
│   ├── types.ts                    # TypeScript type definitions
│   ├── errors.ts                   # Custom error classes
│   ├── fido2.ts                    # FIDO2 helper methods
│   ├── sms.ts                      # SMS helper methods
│   └── utils/
│       ├── phoneValidation.ts      # Phone number validation utilities
│       └── webauthnHelpers.ts      # WebAuthn utility functions
├── samples/                        # Sample applications (optional)
│   ├── fido2/
│   │   ├── FIDO2SampleApp.tsx
│   │   ├── RegistrationFlow.tsx
│   │   └── AuthenticationFlow.tsx
│   ├── sms/
│   │   ├── SMSSampleApp.tsx
│   │   ├── RegistrationFlow.tsx
│   │   └── AuthenticationFlow.tsx
│   └── shared/
│       ├── CredentialsForm.tsx
│       ├── DeviceList.tsx
│       └── StatusDisplay.tsx
├── dist/                           # Built output (for npm package)
├── tests/                          # Unit and integration tests
│   ├── unit/
│   │   ├── P1MFASDK.test.ts
│   │   ├── fido2.test.ts
│   │   └── sms.test.ts
│   └── integration/
│       ├── fido2.integration.test.ts
│       └── sms.integration.test.ts
├── docs/                           # Documentation
│   ├── API.md                      # API reference
│   ├── GETTING_STARTED.md          # Quick start guide
│   ├── FIDO2_GUIDE.md              # FIDO2-specific guide
│   ├── SMS_GUIDE.md                # SMS-specific guide
│   └── EXAMPLES.md                 # Code examples
├── package.json                    # npm package configuration
├── tsconfig.json                   # TypeScript configuration
├── .npmignore                      # Files to exclude from npm package
├── LICENSE                         # License file
└── README.md                       # Main README
```

## Package.json Structure

```json
{
  "name": "@pingidentity/p1mfa-sdk",
  "version": "1.0.0",
  "description": "PingOne MFA SDK - Simplified wrapper for FIDO2 and SMS MFA operations",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "module": "dist/index.esm.js",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc && tsc --module esnext --outDir dist/esm",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "pingone",
    "mfa",
    "fido2",
    "webauthn",
    "sms",
    "authentication",
    "sdk"
  ],
  "peerDependencies": {
    "react": ">=16.8.0"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Drop-in Integration Points

### 1. Standalone SDK (No Framework Dependencies)

For projects that don't use React, the core SDK can be used directly:

```typescript
// Install: npm install @pingidentity/p1mfa-sdk
import { P1MFASDK, FIDO2Helper, SMSHelper } from '@pingidentity/p1mfa-sdk';

const sdk = new P1MFASDK();
await sdk.initialize({
  environmentId: 'env-123',
  clientId: 'client-123',
  clientSecret: 'secret-123'
});

// Use SDK methods
const device = await FIDO2Helper.registerFIDO2Device(sdk, {
  userId: 'user-123',
  type: 'FIDO2',
  policy: 'policy-123'
});
```

### 2. React Components (Optional)

For React projects, sample components can be imported:

```typescript
// Install: npm install @pingidentity/p1mfa-sdk @pingidentity/p1mfa-sdk-react
import { FIDO2SampleApp } from '@pingidentity/p1mfa-sdk-react';

function MyApp() {
  return <FIDO2SampleApp />;
}
```

### 3. Framework-Agnostic Core

The SDK core has **zero framework dependencies**, making it usable in:
- React
- Vue
- Angular
- Vanilla JavaScript
- Node.js
- Any TypeScript/JavaScript project

## Build Output Structure

```
dist/
├── index.js              # CommonJS build
├── index.d.ts            # TypeScript definitions
├── index.esm.js          # ES Module build
└── types/                # Type definitions
    ├── index.d.ts
    ├── P1MFASDK.d.ts
    ├── types.d.ts
    └── ...
```

## Integration Examples

### Example 1: Vanilla JavaScript

```html
<script type="module">
  import { P1MFASDK } from '@pingidentity/p1mfa-sdk/dist/index.esm.js';
  
  const sdk = new P1MFASDK();
  await sdk.initialize({ /* config */ });
</script>
```

### Example 2: Node.js

```javascript
const { P1MFASDK } = require('@pingidentity/p1mfa-sdk');

const sdk = new P1MFASDK();
await sdk.initialize({ /* config */ });
```

### Example 3: TypeScript Project

```typescript
import { P1MFASDK, type P1MFAConfig } from '@pingidentity/p1mfa-sdk';

const config: P1MFAConfig = {
  environmentId: 'env-123',
  clientId: 'client-123',
  clientSecret: 'secret-123'
};

const sdk = new P1MFASDK();
await sdk.initialize(config);
```

## Dependencies Strategy

### Core SDK (Zero Dependencies)
- No external dependencies
- Uses browser/Node.js native APIs
- Minimal bundle size

### Optional React Components
- Separate package: `@pingidentity/p1mfa-sdk-react`
- Peer dependency on React
- Only includes UI components

## File Organization Principles

1. **Core SDK** (`src/`): Framework-agnostic, zero dependencies
2. **Samples** (`samples/`): Framework-specific examples (React, Vue, etc.)
3. **Utils** (`src/utils/`): Shared utilities used by core SDK
4. **Types** (`src/types.ts`): All TypeScript definitions in one place
5. **Errors** (`src/errors.ts`): Centralized error handling

## Export Strategy

### Main Entry Point (`src/index.ts`)

```typescript
// Core SDK
export { P1MFASDK } from './P1MFASDK';
export { FIDO2Helper } from './fido2';
export { SMSHelper } from './sms';

// Types
export * from './types';

// Errors
export * from './errors';
```

### React Components Entry Point (`src/react/index.ts`)

```typescript
// React components (optional, separate package)
export { FIDO2SampleApp } from '../../samples/fido2/FIDO2SampleApp';
export { SMSSampleApp } from '../../samples/sms/SMSSampleApp';
export { CredentialsForm } from '../../samples/shared/CredentialsForm';
export { DeviceList } from '../../samples/shared/DeviceList';
export { StatusDisplay } from '../../samples/shared/StatusDisplay';
```

## Testing Structure

```
tests/
├── unit/                    # Unit tests (mocked dependencies)
│   ├── P1MFASDK.test.ts
│   ├── fido2.test.ts
│   └── sms.test.ts
├── integration/             # Integration tests (real API calls)
│   ├── fido2.integration.test.ts
│   └── sms.integration.test.ts
└── fixtures/                # Test data and mocks
    ├── mockResponses.ts
    └── testCredentials.ts
```

## Documentation Structure

```
docs/
├── README.md                # Main documentation
├── GETTING_STARTED.md       # Quick start guide
├── API.md                   # Complete API reference
├── FIDO2_GUIDE.md           # FIDO2-specific documentation
├── SMS_GUIDE.md             # SMS-specific documentation
├── EXAMPLES.md              # Code examples
├── TROUBLESHOOTING.md       # Common issues and solutions
└── MIGRATION.md             # Migration guide from other SDKs
```

## Benefits of This Structure

1. **Drop-in Friendly**: Core SDK has zero dependencies
2. **Framework Agnostic**: Works with any JavaScript/TypeScript project
3. **Modular**: Can use just the core SDK or include React components
4. **Type-Safe**: Full TypeScript support with exported types
5. **Well-Documented**: Comprehensive docs and examples
6. **Tested**: Unit and integration tests included
7. **Tree-Shakeable**: ES modules allow tree-shaking for smaller bundles

## Publishing Strategy

1. **Core Package**: `@pingidentity/p1mfa-sdk` (framework-agnostic)
2. **React Package**: `@pingidentity/p1mfa-sdk-react` (optional React components)
3. **Scoped Packages**: Use `@pingidentity/` scope for official packages

## Versioning

- Follow Semantic Versioning (SemVer)
- Major: Breaking API changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

## License

MIT License - allows easy integration into any project
