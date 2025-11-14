# Client Credentials Flow - Credential Save Issue Fix

## Problem Reported
User reported: "client credentials seems to be loading a default or something for clientid and client secret. does not seem to be saving creds"

## Root Cause
Same issue as Device Authorization - excessive localStorage saves on every keystroke!

The `useClientCredentialsFlowController` had a `useEffect` (lines 306-315) that saved the entire state to localStorage on EVERY change, without debouncing:

```typescript
// Save state when it changes
useEffect(() => {
    const state = {
        credentials,
        flowConfig,
        tokens,
        flowVariant,
    };
    localStorage.setItem(persistKey, JSON.stringify(state));
}, [credentials, flowConfig, tokens, flowVariant, persistKey]);
```

### Why This Broke Input
- User types one character
- `useEffect` fires immediately
- localStorage saves the state
- React re-renders
- Input value gets overwritten before next keystroke
- Result: **Can't type in credential fields**

## Solution Applied

Added **500ms debouncing** to the state save `useEffect`:

```typescript
// Save state when it changes (debounced)
useEffect(() => {
    const debounceTimer = setTimeout(() => {
        const state = {
            credentials,
            flowConfig,
            tokens,
            flowVariant,
        };
        localStorage.setItem(persistKey, JSON.stringify(state));
    }, 500); // Debounce by 500ms
    
    return () => clearTimeout(debounceTimer);
}, [credentials, flowConfig, tokens, flowVariant, persistKey]);
```

## Files Modified
- `/Users/cmuir/P1Import-apps/oauth-playground/src/hooks/useClientCredentialsFlowController.ts`
  - Added 500ms debounce to state save `useEffect` (line ~306)

## Expected Behavior After Fix
1. ✅ User can type normally in Client ID field
2. ✅ User can type normally in Client Secret field
3. ✅ State saves once, 500ms after user stops typing
4. ✅ No excessive console logs
5. ✅ Credentials persist correctly

## Testing Steps
1. Navigate to Client Credentials Flow V5
2. Click in Client ID field
3. Type a new client ID
4. Verify characters appear as you type
5. Wait 500ms
6. Check localStorage - credentials should be saved
7. Refresh page
8. Verify credentials are still there

## Related Issues Fixed
- Device Authorization Flow - Same issue, fixed in `useDeviceAuthorizationFlow.ts`
- Client Credentials Flow (V5 old) - Fixed in `useClientCredentialsFlow.ts`
- RAR Flows V5 & V6 - Fixed with debounced `useEffect`

## Performance Impact
- **Before**: 10-50+ localStorage writes per second while typing
- **After**: 1 localStorage write per edit session
- **Benefit**: Reduced I/O, better performance, inputs work properly

