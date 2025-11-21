# Global Worker Token Fix

## Problem
The Application Picker was using a flow-specific worker token (`controller.credentials.workerToken`) instead of the global worker token. This meant:
- Each flow had its own worker token
- Tokens weren't shared across flows
- Users had to generate tokens separately for each flow

## Solution
Changed the Application Picker to use the global worker token from `useWorkerTokenState()` hook.

## Changes Made

### File: `src/pages/flows/OAuthAuthorizationCodeFlowV8.tsx`

**Before:**
```typescript
<PingOneApplicationPickerModal
  workerToken={controller.credentials.workerToken || undefined}
  onWorkerTokenChange={(token) => {
    if (token) {
      controller.setCredentials({
        ...controller.credentials,
        workerToken: token,
      });
    }
  }}
/>
```

**After:**
```typescript
<PingOneApplicationPickerModal
  workerToken={workerToken || undefined}  // Global token from useWorkerTokenState()
  // onWorkerTokenChange removed - global token updates automatically via events
/>
```

## How It Works

1. **Global Token Storage**: Worker token is stored in `localStorage` with key `'worker_token'`
2. **Global Hook**: `useWorkerTokenState()` provides access to the global token
3. **Event-Based Updates**: When a token is generated, a `workerTokenUpdated` event is dispatched
4. **Automatic Sync**: All components using `useWorkerTokenState()` automatically receive updates

## Benefits

✅ **Single Source of Truth**: One worker token for all flows
✅ **Automatic Sharing**: Generate once, use everywhere
✅ **Event-Driven**: Components stay in sync automatically
✅ **Simpler Code**: No need for flow-specific token management

## Testing

1. Generate a worker token in any flow
2. Open Application Picker in the same or different flow
3. Token should be available automatically
4. All flows share the same token

## Related Files

- `src/services/workerTokenUIService.tsx` - Global worker token hook
- `src/components/WorkerTokenModal.tsx` - Token generation modal
- `src/components/PingOneApplicationPickerModal.tsx` - Application picker
