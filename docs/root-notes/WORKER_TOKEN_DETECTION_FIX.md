# Worker Token Detection Fix

## Problem
Apps were not detecting existing worker tokens because they were checking only one specific storage key (`worker_token`), but worker tokens can be stored under multiple different keys depending on which flow generated them.

## Storage Keys Used
- `worker_token` - Legacy/generic key
- `pingone_worker_token` - Alternative generic key  
- `pingone_worker_token_worker-token-v7` - Worker Token V7 flow
- `pingone_worker_token_kroger-grocery-store-mfa` - Kroger MFA flow
- `pingone_worker_token_<flow-key>` - Any flow-specific key

## Solution
Created a centralized utility function that checks all possible storage locations:

### New Utility: `src/utils/workerTokenDetection.ts`

```typescript
// Check for any worker token
const token = getAnyWorkerToken();

// Check if any worker token exists
if (hasWorkerToken()) {
  // Show features that require worker token
}

// Get all worker token keys (for debugging)
const allKeys = getAllWorkerTokenKeys();
```

## Updated Components

### ✅ AuthorizationCodeConfigModal
- Now uses `getAnyWorkerToken()` instead of checking single key
- App picker will appear if ANY worker token exists
- Works with tokens from any flow

### 🔄 Next Steps
Other components that should use this utility:
- Kroger MFA flow
- Other credential modals
- Dashboard/status indicators
- Any component that checks for worker tokens

## Benefits

✅ **Consistent Detection** - All apps check for tokens the same way
✅ **Flow Agnostic** - Works regardless of which flow generated the token
✅ **Future Proof** - Automatically finds new flow-specific keys
✅ **Centralized Logic** - Easy to update if storage strategy changes
✅ **Better UX** - Features requiring worker tokens now work reliably

## Usage Example

```typescript
import { getAnyWorkerToken, hasWorkerToken } from '../utils/workerTokenDetection';

// In a component
const MyComponent = () => {
  const workerToken = getAnyWorkerToken();
  
  if (!workerToken) {
    return <div>Please generate a worker token first</div>;
  }
  
  return <div>Worker token available! {workerToken.substring(0, 20)}...</div>;
};

// For conditional rendering
{hasWorkerToken() && (
  <CompactApplicationPicker
    environmentId={envId}
    workerToken={getAnyWorkerToken()!}
    onSelectApp={handleSelect}
  />
)}
```

## Testing

To test, generate a worker token from any flow:
1. Worker Token V7 flow
2. Kroger MFA flow  
3. Any other flow that generates worker tokens

Then open the Authorization Code Config Modal - the app picker should appear regardless of which flow generated the token.

---

**Status**: ✅ Implemented and working
**Date**: 2025-11-13
