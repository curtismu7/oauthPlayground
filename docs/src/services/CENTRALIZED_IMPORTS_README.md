# Centralized Imports Service

## Overview

The `commonImportsService.ts` provides a centralized location for commonly used imports across the OAuth Playground application. This service reduces import errors and improves maintainability by providing a single source of truth for frequently used dependencies.

## Purpose

- **Reduce Import Errors**: By centralizing commonly used imports, we minimize the risk of typos in import statements
- **Improve Maintainability**: Changes to import paths or versions only need to be updated in one place
- **Consistency**: Ensures all components use the same imports consistently
- **Performance**: Reduces bundle size by avoiding duplicate imports (though bundlers typically handle this)

## How to Use

### Basic Usage

Instead of importing from multiple sources:

```typescript
import React, { useState, useEffect } from 'react';
import { FiSettings, FiKey } from 'react-icons/fi';
import { WorkerTokenModal } from '../components/WorkerTokenModal';
import { workerTokenCredentialsService } from '../services/workerTokenCredentialsService';
```

Use the centralized service:

```typescript
import {
  useState,
  useEffect,
  FiSettings,
  FiKey,
  WorkerTokenModal,
  workerTokenCredentialsService
} from '../services/commonImportsService';
```

### Available Imports

#### React Imports
- `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useContext`
- `createContext`, `ReactNode`, `ReactElement`, `FC`, `ComponentType`
- `memo`, `forwardRef`

#### React Router
- `useNavigate`

#### Styling
- `styled` (styled-components)

#### React Icons (Feather Icons - Most Common)
- `FiSettings`, `FiKey`, `FiCheckCircle`, `FiRefreshCw`
- `FiEye`, `FiEyeOff`, `FiInfo`, `FiAlertTriangle`
- `FiExternalLink`, `FiSave`, `FiTrash2`, `FiEdit`
- And many more... (see service file for complete list)

#### Core Services
- `ComprehensiveCredentialsService`
- `workerTokenCredentialsService`, `WorkerTokenCredentials`
- `flowStateService`, `flowConfigService`, `flowCredentialService`
- `oidcDiscoveryService`, `comprehensiveDiscoveryService`, `DiscoveryResult`
- `environmentIdPersistenceService`
- `credentialsValidationService`

#### Common Components
- `WorkerTokenModal`, `WorkerTokenDetectedBanner`
- `CredentialsInput`, `ClientAuthMethodSelector`
- `ComprehensiveDiscoveryInput`, `ConfigCheckerButtons`
- `CollapsibleHeader`, `DraggableModal`

#### Utilities & Types
- `ClientAuthMethod`, `trackedFetch`
- `StepCredentials`, `PingOneApplication`
- `v4ToastManager`, `config`
- `getDefaultScopesForFlow`, `showTokenSuccessMessage`

## Migration Guide

### Step 1: Identify Common Imports
Look at your component/service and identify which imports are available in the centralized service.

### Step 2: Replace Imports
Replace individual imports with imports from `commonImportsService`:

```typescript
// Before
import { FiSettings, FiKey } from 'react-icons/fi';
import { useState, useEffect } from 'react';

// After
import { FiSettings, FiKey, useState, useEffect } from '../services/commonImportsService';
```

### Step 3: Test
Ensure your component still works correctly after the migration.

### Step 4: Remove Unused Imports
Remove any import statements that are no longer needed.

## Examples

### Component Example
```typescript
// src/components/MyComponent.tsx
import React, { useState, useEffect } from 'react';
import { FiSettings, FiKey, FiCheckCircle } from 'react-icons/fi';
import { WorkerTokenModal } from '../components/WorkerTokenModal';
import { workerTokenCredentialsService } from '../services/workerTokenCredentialsService';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Becomes:
import {
  useState,
  useEffect,
  FiSettings,
  FiKey,
  FiCheckCircle,
  WorkerTokenModal,
  workerTokenCredentialsService,
  v4ToastManager
} from '../services/commonImportsService';
```

### Service Example
```typescript
// src/services/MyService.ts
import { useCallback, useMemo } from 'react';
import { FiRefreshCw, FiSave } from 'react-icons/fi';
import styled from 'styled-components';

// Becomes:
import { useCallback, useMemo, FiRefreshCw, FiSave, styled } from './commonImportsService';
```

## Best Practices

1. **Import Only What You Need**: Don't import everything from the service - only import what your component/service actually uses.

2. **Gradual Migration**: Migrate components/services gradually rather than all at once.

3. **Test After Migration**: Always test components after migrating to ensure functionality is preserved.

4. **Update Documentation**: Keep this documentation updated as new imports are added to the service.

5. **Avoid Circular Dependencies**: Be careful not to create circular import dependencies when adding new exports to the service.

## Adding New Imports

When adding new commonly used imports to the service:

1. Add the import to the appropriate section in `commonImportsService.ts`
2. Update this documentation
3. Consider if any existing components should be migrated to use the new centralized import

## Current Status

- ✅ Service created with comprehensive imports
- ✅ WorkerTokenModal migrated as example
- 🔄 Ongoing: Gradual migration of other components/services
- 📝 Documentation created

## Future Enhancements

- Automated migration script
- Import usage analysis tool
- Bundle size impact monitoring
