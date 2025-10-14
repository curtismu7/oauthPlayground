# Auth Modal Auto-Submit Issue

## Problem Report

User reports: "authz flow modal that is called when redirecting to PingOne (P1) is still autosubmitting."

## Root Cause

The `showAuthRequestModal` UI setting defaults to `false`, which causes the authorization to proceed immediately **without showing the modal**. This appears to the user as "autosubmitting".

### Default Setting
```typescript
// src/contexts/UISettingsContext.tsx (line 31)
const DEFAULT_UI_SETTINGS: UISettings = {
    showAuthRequestModal: false,  // ❌ Modal hidden by default!
    // ... other settings
};
```

### How It Works

When a flow initiates authorization:

1. Flow checks `showAuthRequestModal` setting
2. If `false` (default): **Skip modal, proceed directly**
3. If `true`: Show modal, wait for user click

```typescript
// Example from flows
const shouldShowModal = globalFlowConfig.showAuthRequestModal === true;

if (shouldShowModal) {
    console.log('Showing authorization request modal');
    setShowAuthRequestModal(true);  // Show modal
} else {
    console.log('Skipping authorization modal');
    handleAuthorizationDirect();  // Auto-proceed ❌
}
```

## Solution Options

### Option 1: Change Default to Show Modal (RECOMMENDED)

Make the modal show by default for better UX and transparency.

**Change**:
```typescript
// src/contexts/UISettingsContext.tsx (line 31)
const DEFAULT_UI_SETTINGS: UISettings = {
    showAuthRequestModal: true,  // ✅ Show modal by default
    // ... other settings
};
```

**Pros**:
- Better UX - user sees what's happening
- More transparent - shows OAuth parameters
- User can disable if they want (checkbox in modal)
- Safer - prevents accidental redirects

**Cons**:
- Extra click required
- Slower for experienced users

### Option 2: Respect quickActionsVisibility Setting

Use the `quickActionsVisibility` setting to control auto-proceed behavior.

**Change**:
```typescript
const { settings } = useUISettings();
const shouldShowModal = settings.showAuthRequestModal || !settings.quickActionsVisibility;

if (shouldShowModal) {
    setShowAuthRequestModal(true);
} else {
    handleAuthorizationDirect();
}
```

**Pros**:
- Consistent with other UI behavior settings
- Users already understand quickActionsVisibility
- No need for separate modal setting

**Cons**:
- Overloading quickActionsVisibility meaning
- Less explicit control

### Option 3: Add Separate Auto-Submit Setting

Add a new `autoSubmitAuthRequests` setting.

**Pros**:
- Explicit control
- Clear naming

**Cons**:
- More settings to manage
- Added complexity

## Recommended Fix

**Change default to `true`** (Option 1):

```typescript
// File: src/contexts/UISettingsContext.tsx
const DEFAULT_UI_SETTINGS: UISettings = {
    // Existing settings
    showCredentialsModal: false,
    showSuccessModal: true,
    showAuthRequestModal: true,  // ✅ Changed from false to true
    showFlowDebugConsole: true,
    // ... rest of settings
};
```

This ensures:
- ✅ Modal shows by default
- ✅ User sees OAuth parameters before redirect
- ✅ User can disable with "Don't show again" checkbox
- ✅ Safer, more transparent UX

## Files to Change

1. `src/contexts/UISettingsContext.tsx` (line 31) - Change default to `true`

## Testing

After fix, test:
1. Go to Authorization Code Flow
2. Click "Start OAuth Flow"
3. Should see modal with OAuth parameters ✅
4. Can proceed by clicking "Proceed to PingOne"
5. Can disable modal with checkbox
6. Next time: Should skip modal (user preference respected)

## User Experience

**Before (Current)** ❌:
- Click "Start OAuth Flow"
- Immediately redirected to PingOne
- No chance to review parameters
- Feels like "auto-submit"

**After (Fixed)** ✅:
- Click "Start OAuth Flow"
- Modal appears showing OAuth parameters
- User reviews and clicks "Proceed to PingOne"
- Can opt out with "Don't show again"
- Transparent and controllable

## Related Settings

- `quickActionsVisibility`: Controls visibility of action buttons
- `autoAdvanceSteps`: Controls auto-advancing through flow steps
- `showAuthRequestModal`: Controls authorization modal display (THIS ONE)

## Impact

- **Affected Flows**: All OAuth/OIDC authorization flows that redirect to PingOne
- **User Impact**: Medium - changes default behavior
- **Breaking Change**: No - existing users with saved preferences unaffected
- **New Users**: Better experience with modal shown by default

