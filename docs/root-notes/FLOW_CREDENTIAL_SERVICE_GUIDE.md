# Flow Credential Service Guide

## Overview

The **FlowCredentialService** is a unified service for managing credentials across all OAuth/OIDC flows. It provides consistent loading, saving, and synchronization of credentials and flow-specific state.

## Why Use This Service?

- ✅ **Consistent Behavior** - All flows use the same credential management logic
- ✅ **Shared Credentials** - Credentials are shared across flows via `credentialManager`
- ✅ **Flow-Specific State** - Each flow can persist its own configuration and tokens
- ✅ **No Duplication** - Eliminates duplicated code in controllers
- ✅ **Type-Safe** - Full TypeScript support with generics
- ✅ **Automatic Logging** - Built-in logging for debugging

## Architecture

```
┌─────────────────────────────────────────┐
│     FlowCredentialService               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Shared Credentials               │ │
│  │  (credentialManager)              │ │
│  │  - environmentId                  │ │
│  │  - clientId                       │ │
│  │  - clientSecret                   │ │
│  │  - redirectUri                    │ │
│  │  - scope/scopes                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Flow-Specific State              │ │
│  │  (localStorage per flow)          │ │
│  │  - flowConfig                     │ │
│  │  - tokens                         │ │
│  │  - flowVariant                    │ │
│  │  - timestamp                      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## API Reference

### Loading Credentials

#### `loadFlowCredentials<T>(config: FlowCredentialConfig)`

Loads both shared credentials and flow-specific state.

```typescript
import { FlowCredentialService } from '../services/flowCredentialService';

// In your controller's useEffect
useEffect(() => {
  const loadData = async () => {
    const { credentials, flowState, hasSharedCredentials } = 
      await FlowCredentialService.loadFlowCredentials({
        flowKey: 'my-flow-v6',
        defaultCredentials: {
          grantType: 'authorization_code',
          responseType: 'code',
        },
      });

    if (credentials) {
      setCredentials(credentials);
    }
    
    if (flowState?.flowConfig) {
      setFlowConfig(flowState.flowConfig);
    }
  };
  
  loadData();
}, []);
```

**Returns:**
```typescript
{
  credentials: StepCredentials | null;
  flowState: FlowPersistentState<T> | null;
  hasSharedCredentials: boolean;
  hasFlowState: boolean;
}
```

### Saving Credentials

#### `saveFlowCredentials<T>(flowKey, credentials, flowConfig?, additionalState?, options?)`

Saves both shared credentials and flow-specific state.

```typescript
const saveCredentials = useCallback(async () => {
  const success = await FlowCredentialService.saveFlowCredentials(
    'my-flow-v6',           // flowKey
    credentials,            // StepCredentials
    flowConfig,             // Your flow config
    {                       // Additional state
      flowVariant: 'oidc',
      tokens: myTokens,
    },
    { showToast: true }     // Options
  );
  
  if (success) {
    setHasCredentialsSaved(true);
  }
}, [credentials, flowConfig]);
```

**Parameters:**
- `flowKey` - Unique identifier for your flow (e.g., 'client-credentials-v6')
- `credentials` - StepCredentials object
- `flowConfig` - (Optional) Your flow-specific configuration
- `additionalState` - (Optional) Additional state to persist (tokens, variant, etc.)
- `options` - (Optional) `{ showToast?: boolean }` - Show success/error toasts

### Other Methods

#### `validateCredentials(credentials, requireClientSecret?)`

Checks if credentials have required fields:

```typescript
const isValid = FlowCredentialService.validateCredentials(credentials, true);
if (!isValid) {
  console.error('Missing required credentials');
}
```

#### `clearFlowState(flowKey)`

Clears flow-specific state but preserves shared credentials:

```typescript
FlowCredentialService.clearFlowState('my-flow-v6');
```

#### `clearAllFlowData(flowKey)`

Clears both flow state AND shared credentials:

```typescript
await FlowCredentialService.clearAllFlowData('my-flow-v6');
```

## Usage Examples

### Example 1: Basic Controller Integration

```typescript
// src/hooks/useMyFlowController.ts
import { useCallback, useEffect, useState } from 'react';
import { FlowCredentialService } from '../services/flowCredentialService';
import type { StepCredentials } from '../components/steps/CommonSteps';

export const useMyFlowController = () => {
  const persistKey = 'my-flow-v6';
  const [credentials, setCredentials] = useState<StepCredentials | null>(null);
  const [flowConfig, setFlowConfig] = useState<MyFlowConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load on mount
  useEffect(() => {
    const loadData = async () => {
      const { credentials: loadedCreds, flowState } = 
        await FlowCredentialService.loadFlowCredentials<MyFlowConfig>({
          flowKey: persistKey,
          defaultCredentials: {
            grantType: 'authorization_code',
            responseType: 'code',
          },
        });

      if (loadedCreds) setCredentials(loadedCreds);
      if (flowState?.flowConfig) setFlowConfig(flowState.flowConfig);
    };
    
    loadData();
  }, []);

  // Save
  const saveCredentials = useCallback(async () => {
    if (!credentials) return;
    
    setIsSaving(true);
    try {
      await FlowCredentialService.saveFlowCredentials(
        persistKey,
        credentials,
        flowConfig || undefined
      );
    } finally {
      setIsSaving(false);
    }
  }, [credentials, flowConfig]);

  return {
    credentials,
    setCredentials,
    saveCredentials,
    isSaving,
  };
};
```

### Example 2: With Tokens and Variants

```typescript
const saveAll = useCallback(async () => {
  const success = await FlowCredentialService.saveFlowCredentials(
    'oauth-authz-code-v6',
    credentials,
    flowConfig,
    {
      flowVariant: 'oauth',
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        id_token: idToken,
      },
    }
  );
  
  if (success) {
    console.log('Everything saved successfully!');
  }
}, [credentials, flowConfig, accessToken, refreshToken, idToken]);
```

### Example 3: Auto-Save on Change

```typescript
// Save credentials whenever they change
useEffect(() => {
  if (!credentials?.environmentId || !credentials?.clientId) {
    return; // Don't save empty credentials
  }
  
  // Auto-save (without toast)
  FlowCredentialService.saveSharedCredentials(
    persistKey,
    credentials,
    { showToast: false }
  );
}, [credentials]);
```

## Migration Guide

### Migrating Existing Controllers

**Before (Old Way):**
```typescript
// ❌ Duplicated logic in every controller
useEffect(() => {
  const loadCredentials = async () => {
    const savedCreds = credentialManager.getAllCredentials();
    if (savedCreds.environmentId && savedCreds.clientId) {
      setCredentials(savedCreds);
    }
  };
  loadCredentials();
}, []);

const saveCredentials = async () => {
  await credentialManager.saveCredentials(credentials);
  localStorage.setItem(persistKey, JSON.stringify({ credentials, config }));
};
```

**After (New Way):**
```typescript
// ✅ Use the service
useEffect(() => {
  const loadData = async () => {
    const { credentials: loadedCreds } = 
      await FlowCredentialService.loadFlowCredentials({
        flowKey: persistKey,
      });
    if (loadedCreds) setCredentials(loadedCreds);
  };
  loadData();
}, []);

const saveCredentials = async () => {
  await FlowCredentialService.saveFlowCredentials(
    persistKey,
    credentials,
    flowConfig
  );
};
```

### Checklist for Migration

- [ ] Import `FlowCredentialService` instead of `credentialManager`
- [ ] Replace load logic with `loadFlowCredentials()`
- [ ] Replace save logic with `saveFlowCredentials()`
- [ ] Remove duplicated credential management code
- [ ] Test loading on mount
- [ ] Test saving credentials
- [ ] Test cross-flow credential sharing

## Best Practices

### 1. Always Use a Unique Flow Key

```typescript
// ✅ Good - includes version
const persistKey = 'client-credentials-v6';

// ❌ Bad - no version, might conflict
const persistKey = 'client-credentials';
```

### 2. Load Credentials Early

```typescript
// ✅ Good - load in first useEffect
useEffect(() => {
  loadCredentials();
}, []);

// ❌ Bad - loading too late
useEffect(() => {
  if (someCondition) {
    loadCredentials();
  }
}, [someCondition]);
```

### 3. Save Both Credentials and Config Together

```typescript
// ✅ Good - saves everything
await FlowCredentialService.saveFlowCredentials(
  persistKey,
  credentials,
  flowConfig,
  { tokens }
);

// ❌ Bad - only saves credentials, loses config
await FlowCredentialService.saveSharedCredentials(persistKey, credentials);
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good - handles errors
try {
  const { credentials } = await FlowCredentialService.loadFlowCredentials({
    flowKey: persistKey,
  });
  if (credentials) setCredentials(credentials);
} catch (error) {
  console.error('Failed to load:', error);
  // Set defaults or show error
}

// ❌ Bad - no error handling
const { credentials } = await FlowCredentialService.loadFlowCredentials({
  flowKey: persistKey,
});
setCredentials(credentials); // Might be null!
```

## Flows Using This Service

✅ **Client Credentials Flow** (`useClientCredentialsFlowController.ts`)
✅ **Hybrid Flow** (`useHybridFlowController.ts`)

### Coming Soon

- [ ] Authorization Code Flow
- [ ] Implicit Flow
- [ ] Device Authorization Flow
- [ ] Worker Token Flow

## Troubleshooting

### Credentials Not Loading

**Check:**
1. Is the `flowKey` correct and consistent?
2. Are credentials actually saved in localStorage/credentialManager?
3. Is the load function being called in a useEffect?

**Debug:**
```typescript
const { credentials, hasSharedCredentials, hasFlowState } = 
  await FlowCredentialService.loadFlowCredentials({ flowKey });

console.log({
  hasSharedCredentials,
  hasFlowState,
  credentials,
});
```

### Credentials Not Persisting

**Check:**
1. Is `saveFlowCredentials()` being called?
2. Are the credentials valid before saving?
3. Is the save function awaited?

**Debug:**
```typescript
const success = await FlowCredentialService.saveFlowCredentials(
  flowKey,
  credentials,
  flowConfig
);
console.log('Save success:', success);
```

### Credentials Not Shared Across Flows

**This is correct behavior!** Each flow should load from shared credentials but can have its own flow-specific state.

To share credentials:
1. Flow A saves credentials → Goes to `credentialManager`
2. Flow B loads credentials → Reads from `credentialManager`
3. Both flows now have the same base credentials ✅

## Support

For questions or issues, check the service implementation:
- Source: `src/services/flowCredentialService.ts`
- Examples: `src/hooks/useClientCredentialsFlowController.ts`
- Examples: `src/hooks/useHybridFlowController.ts`




