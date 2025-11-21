# Worker Token Access Fix - OAuth Authorization Code V8

## Problem
User encountered two issues:
1. **401 Unauthorized error** when fetching PingOne applications (expired worker token)
2. **No visible worker token button** - button was hidden in collapsed Configuration section

## Root Cause
- Worker token button was inside the collapsible "Configuration & Setup" section
- When section was collapsed, button was not visible
- No way to refresh expired token from the Application Picker modal

## Solution
Added `onGenerateWorkerToken` callback to `PingOneApplicationPickerModal` that:
1. Closes the Application Picker modal
2. Opens the Worker Token modal
3. Allows user to generate a fresh worker token

## Changes Made

### File: `src/pages/flows/OAuthAuthorizationCodeFlowV8.tsx`

Added the `onGenerateWorkerToken` prop to PingOneApplicationPickerModal:

```typescript
<PingOneApplicationPickerModal
  isOpen={showAppPicker}
  onClose={() => setShowAppPicker(false)}
  workerToken={controller.credentials.workerToken || undefined}
  initialEnvironmentId={controller.credentials.environmentId || ''}
  initialRegion={...}
  onGenerateWorkerToken={() => {
    setShowAppPicker(false);
    setShowWorkerTokenModal(true);
  }}
  onWorkerTokenChange={(token) => {...}}
  onSelect={(app: PingOneApplication, context) => {...}}
/>
```

## User Instructions

When you see "401 Unauthorized" in the Application Picker:

1. **Look for the "Get Worker Token" or "Refresh Token" button** in the error message area
2. **Click it** to open the Worker Token modal
3. **Generate a new worker token**
4. **Try fetching applications again**

Alternatively:
1. **Close the Application Picker modal**
2. **Expand the "Configuration & Setup" section** (if collapsed)
3. **Click the "Get Worker Token" button** at the top right
4. **Generate a new token**
5. **Re-open the Application Picker**

## Technical Notes
- The `PingOneApplicationPickerModal` component already had support for `onGenerateWorkerToken`
- It was just not being passed from the V8 flow
- This fix makes the worker token generation accessible from within the modal when errors occur
