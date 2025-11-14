# Save Button Service - Complete Guide

## Overview

The Save Button Service provides a centralized, reusable save button component with:
- ✅ **Green styling** (consistent across all flows)
- ✅ **"Saved!" feedback** (shows for 10 seconds)
- ✅ **Flow-specific storage** (isolated credentials per flow)
- ✅ **Worker token management** (centralized access)
- ✅ **Error handling** (toast notifications)
- ✅ **TypeScript support** (fully typed)

## File Created

**Location:** `src/services/saveButtonService.tsx`

## Components & Services

### 1. SaveButton Component

Reusable save button with automatic state management.

```typescript
<SaveButton
  flowType="your-flow-type"
  credentials={credentials}
  additionalData={optionalData}
  onSave={customSaveHandler}
  disabled={false}
/>
```

**Props:**
- `flowType` (required): Unique identifier for the flow
- `credentials` (required): StepCredentials object to save
- `additionalData` (optional): Additional data to save (e.g., PingOne config)
- `onSave` (optional): Custom save handler
- `disabled` (optional): Disable the button
- `style` (optional): Custom styles
- `className` (optional): Custom CSS class

**Behavior:**
- Shows "Save Configuration" by default
- Shows "Saving..." while saving
- Shows "Saved!" with checkmark for 10 seconds after save
- Green color (#10b981)
- Hover effects and animations

### 2. useSaveButton Hook

Hook for programmatic save functionality.

```typescript
const { save, load, clear, isSaving, saved } = useSaveButton('your-flow-type');

// Save credentials
await save(credentials, additionalData);

// Load credentials
const loaded = load();

// Clear credentials
clear();
```

**Returns:**
- `save(credentials, additionalData)`: Save function
- `load()`: Load credentials for this flow
- `clear()`: Clear credentials for this flow
- `isSaving`: Boolean indicating save in progress
- `saved`: Boolean indicating recently saved (10 seconds)

### 3. FlowStorageService

Service for flow-specific credential storage.

```typescript
// Save credentials
FlowStorageService.saveCredentials('flow-type', credentials);

// Load credentials
const creds = FlowStorageService.loadCredentials('flow-type');

// Clear credentials
FlowStorageService.clearCredentials('flow-type');

// Get all flow keys
const keys = FlowStorageService.getAllFlowKeys();
```

**Storage Keys:**
- Pattern: `flow_credentials_{flowType}`
- Example: `flow_credentials_oauth-authorization-code-v7`

**Features:**
- Saves to flow-specific key (isolation)
- Saves to global credentialManager (backward compatibility)
- Automatic fallback to global credentials

### 4. WorkerTokenService

Centralized worker token management.

```typescript
// Save token
WorkerTokenService.saveToken(token, environmentId, expiresAt);

// Load token
const token = WorkerTokenService.loadToken(environmentId);

// Check if valid token exists
const hasToken = WorkerTokenService.hasValidToken(environmentId);

// Clear token
WorkerTokenService.clearToken();

// Get expiration time
const expiresAt = WorkerTokenService.getExpiresAt();
```

**Features:**
- Centralized storage (accessible anywhere)
- Environment ID validation
- Expiration checking
- Automatic cleanup of expired tokens

## Usage Examples

### Example 1: Basic Save Button

```typescript
import { SaveButton } from '../services/saveButtonService';

const MyFlow: React.FC = () => {
  const [credentials, setCredentials] = useState<StepCredentials>({
    environmentId: '',
    clientId: '',
    // ... other fields
  });

  return (
    <SaveButton
      flowType="my-flow-v7"
      credentials={credentials}
    />
  );
};
```

### Example 2: Save Button with Additional Data

```typescript
import { SaveButton } from '../services/saveButtonService';

const MyFlow: React.FC = () => {
  const [credentials, setCredentials] = useState<StepCredentials>({...});
  const [config, setConfig] = useState({
    pkceEnforcement: 'REQUIRED',
    // ... other config
  });

  return (
    <SaveButton
      flowType="my-flow-v7"
      credentials={credentials}
      additionalData={config}
      onSave={async () => {
        // Custom save logic
        console.log('Saving...');
      }}
    />
  );
};
```

### Example 3: Using the Hook

```typescript
import { useSaveButton } from '../services/saveButtonService';

const MyFlow: React.FC = () => {
  const [credentials, setCredentials] = useState<StepCredentials>({...});
  const { save, load, isSaving, saved } = useSaveButton('my-flow-v7');

  // Load on mount
  useEffect(() => {
    const loaded = load();
    if (loaded) {
      setCredentials(loaded);
    }
  }, [load]);

  // Save manually
  const handleSave = async () => {
    await save(credentials);
  };

  return (
    <div>
      <button onClick={handleSave} disabled={isSaving}>
        {saved ? 'Saved!' : 'Save'}
      </button>
    </div>
  );
};
```

### Example 4: Worker Token Management

```typescript
import { WorkerTokenService } from '../services/saveButtonService';

const MyComponent: React.FC = () => {
  const [workerToken, setWorkerToken] = useState('');

  // Load token on mount
  useEffect(() => {
    const token = WorkerTokenService.loadToken(environmentId);
    if (token) {
      setWorkerToken(token);
    }
  }, [environmentId]);

  // Save token
  const handleSaveToken = (token: string) => {
    WorkerTokenService.saveToken(token, environmentId, Date.now() + 3600000);
    setWorkerToken(token);
  };

  // Check if token exists
  const hasToken = WorkerTokenService.hasValidToken(environmentId);

  return (
    <div>
      {hasToken ? 'Token available' : 'No token'}
    </div>
  );
};
```

### Example 5: Flow-Specific Storage

```typescript
import { FlowStorageService } from '../services/saveButtonService';

// Save credentials for specific flow
FlowStorageService.saveCredentials('oauth-authz-code-v7', {
  environmentId: 'abc-123',
  clientId: 'client-123',
  // ... other fields
});

// Load credentials for specific flow
const creds = FlowStorageService.loadCredentials('oauth-authz-code-v7');

// Get all flow keys
const allKeys = FlowStorageService.getAllFlowKeys();
console.log('Flows with saved credentials:', allKeys);
// Output: ['flow_credentials_oauth-authz-code-v7', 'flow_credentials_device-v7', ...]
```

## Flow Types

Each flow should have a unique `flowType` identifier:

| Flow | Flow Type |
|------|-----------|
| Configuration Page | `configuration` |
| OAuth Authorization Code V7 | `oauth-authorization-code-v7` |
| OIDC Authorization Code V7 | `oidc-authorization-code-v7` |
| OIDC Hybrid V7 | `oidc-hybrid-v7` |
| Device Authorization V7 | `device-authorization-v7` |
| Client Credentials V7 | `client-credentials-v7` |
| Implicit OAuth V7 | `implicit-oauth-v7` |
| Implicit OIDC V7 | `implicit-oidc-v7` |
| CIBA V7 | `ciba-v7` |
| PAR V7 | `par-v7` |
| RAR V7 | `rar-v7` |
| Worker Token V7 | `worker-token-v7` |
| JWT Bearer V7 | `jwt-bearer-v7` |
| SAML Bearer V7 | `saml-bearer-v7` |
| ROPC V7 | `ropc-v7` |
| Token Exchange V7 | `token-exchange-v7` |
| DPoP V7 | `dpop-v7` |

## Storage Structure

### Credentials Storage

```
localStorage:
  ├── flow_credentials_configuration
  ├── flow_credentials_oauth-authorization-code-v7
  ├── flow_credentials_device-authorization-v7
  ├── ... (one per flow)
  └── pingone_permanent_credentials (global, backward compat)
```

### Additional Data Storage

```
localStorage:
  ├── flow_additional_configuration
  ├── flow_additional_oauth-authorization-code-v7
  └── ... (one per flow)
```

### Worker Token Storage

```
localStorage:
  ├── worker_token (token value)
  ├── worker_token_env (environment ID)
  └── worker_token_expires_at (expiration timestamp)
```

## Migration Guide

### Migrating Existing Save Buttons

**Before:**
```typescript
<button
  onClick={async () => {
    try {
      credentialManager.saveCredentials(credentials);
      v4ToastManager.showSuccess('Saved!');
    } catch (error) {
      v4ToastManager.showError('Failed');
    }
  }}
  style={{ background: '#2563eb' }}
>
  <FiSave /> Save
</button>
```

**After:**
```typescript
<SaveButton
  flowType="your-flow-type"
  credentials={credentials}
/>
```

### Migrating Worker Token Logic

**Before:**
```typescript
const [workerToken, setWorkerToken] = useState('');

useEffect(() => {
  const token = localStorage.getItem('worker_token');
  const env = localStorage.getItem('worker_token_env');
  if (token && env === environmentId) {
    setWorkerToken(token);
  }
}, [environmentId]);
```

**After:**
```typescript
const [workerToken, setWorkerToken] = useState('');

useEffect(() => {
  const token = WorkerTokenService.loadToken(environmentId);
  if (token) {
    setWorkerToken(token);
  }
}, [environmentId]);
```

## Styling

### Button States

**Default (Not Saved):**
- Background: #10b981 (green)
- Border: #10b981
- Icon: FiSave
- Text: "Save Configuration"

**Saving:**
- Background: #10b981 (green)
- Opacity: 0.6
- Disabled: true
- Text: "Saving..."

**Saved (10 seconds):**
- Background: #10b981 (green)
- Border: #059669 (darker green)
- Icon: FiCheck (scaled 1.2x)
- Text: "Saved!"

**Hover:**
- Background: #059669 (darker green)
- Transform: translateY(-1px)
- Box Shadow: 0 4px 12px rgba(16, 185, 129, 0.3)

### Custom Styling

```typescript
<SaveButton
  flowType="my-flow"
  credentials={credentials}
  style={{
    minWidth: '200px',
    fontSize: '1rem',
  }}
  className="my-custom-class"
/>
```

## Benefits

### 1. Consistency ✅
- All save buttons look and behave the same
- Green color across all flows
- Same feedback mechanism

### 2. Isolation ✅
- Each flow has its own storage
- No credential conflicts
- Easy to debug

### 3. Centralization ✅
- Worker token accessible anywhere
- Single source of truth
- Easy to maintain

### 4. User Experience ✅
- Clear visual feedback
- "Saved!" confirmation
- Error handling with toasts

### 5. Developer Experience ✅
- Simple API
- TypeScript support
- Reusable component

## Testing

### Test Save Functionality
```typescript
// 1. Render component
<SaveButton flowType="test-flow" credentials={testCreds} />

// 2. Click save button
// 3. Verify "Saving..." appears
// 4. Verify "Saved!" appears after save
// 5. Verify "Saved!" disappears after 10 seconds
// 6. Verify credentials in localStorage
const saved = localStorage.getItem('flow_credentials_test-flow');
expect(JSON.parse(saved)).toEqual(testCreds);
```

### Test Worker Token
```typescript
// 1. Save token
WorkerTokenService.saveToken('test-token', 'env-123', Date.now() + 3600000);

// 2. Load token
const token = WorkerTokenService.loadToken('env-123');
expect(token).toBe('test-token');

// 3. Check validity
const hasToken = WorkerTokenService.hasValidToken('env-123');
expect(hasToken).toBe(true);

// 4. Clear token
WorkerTokenService.clearToken();
const cleared = WorkerTokenService.loadToken('env-123');
expect(cleared).toBeNull();
```

## Troubleshooting

### Button Not Showing "Saved!"
- Check if save completed successfully
- Check browser console for errors
- Verify credentials object is valid

### Credentials Not Saving
- Check localStorage is not full
- Verify browser allows localStorage
- Check flowType is correct

### Worker Token Not Loading
- Verify environment ID matches
- Check token hasn't expired
- Verify token was saved correctly

### Multiple Flows Conflicting
- Ensure each flow has unique flowType
- Check storage keys are different
- Verify isolation is working

## Next Steps

### Phase 1: Configuration Page ✅ COMPLETE
- [x] Create SaveButton service
- [x] Create FlowStorageService
- [x] Create WorkerTokenService
- [x] Update Configuration page
- [x] Test and validate

### Phase 2: Apply to Other Flows 📋 NEXT
- [ ] OAuth Authorization Code V7
- [ ] OIDC Hybrid V7
- [ ] Device Authorization V7
- [ ] Client Credentials V7
- [ ] All other flows

### Phase 3: Enhance Service 📋 PLANNED
- [ ] Add auto-save option
- [ ] Add unsaved changes indicator
- [ ] Add save confirmation dialog
- [ ] Add export/import functionality

## Summary

✅ **SaveButton component** - Reusable, green, with "Saved!" feedback
✅ **useSaveButton hook** - Programmatic save functionality
✅ **FlowStorageService** - Flow-specific credential storage
✅ **WorkerTokenService** - Centralized worker token management
✅ **TypeScript support** - Fully typed
✅ **Documentation** - Complete usage guide

The Save Button Service provides a consistent, reliable way to save credentials across all flows with proper isolation and centralized worker token management.
