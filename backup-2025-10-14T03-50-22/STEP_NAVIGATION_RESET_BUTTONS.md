# Step Navigation Reset & Start Over Buttons

**Implementation Date:** October 12, 2025  
**Status:** ✅ Complete

## Overview

Added two new buttons to the V5 stepper (StepNavigationButtons component) to provide flexible flow reset options:

### 1. ⏮️ Start Over (New)
**Color:** Orange (Warning)  
**Icon:** `FiSkipBack` (Skip Back to Beginning)  
**Behavior:**
- Go back to Step 0
- Clear tokens, auth codes, and PKCE codes
- **Keep credentials** (no need to re-enter client ID, secret, etc.)
- Clear stored redirect URIs
- Show success toast: "Flow restarted - Tokens and codes cleared. Credentials preserved."

**Visibility:** Only shows when `currentStep > 0` (not needed on Step 0)

### 2. 🗑️ Reset Flow (Existing)
**Color:** Red (Danger)  
**Icon:** `FiTrash2` (Trash/Delete)  
**Behavior:**
- Complete reset to initial state
- Clear **everything** (credentials, tokens, codes, all state)
- Expand all collapsible sections (fresh start)
- Go back to Step 0

**Visibility:** Always visible

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ☰  ▢  ● ● ● ● ●  [← Previous]  [⏮️ Start Over]  [🗑️ Reset Flow]  [Next →]  │
└─────────────────────────────────────────────────────────────────┘
   │  │  └─────┬─────┘     │            │              │           │
   │  │        │           │            │              │           │
  Drag Toggle  Step       Back     Skip Back      Delete        Forward
              Dots                to start      everything
```

### Compact Mode
```
┌────────────────────────────────┐
│  ☰  ▢  [←]  [⏮️]  [🗑️]  [→]  │
└────────────────────────────────┘
```

### Icon Update (Oct 12, 2025)
**Previous icons were too similar:**
- 🔄 Start Over (rotate) + ⟳ Reset Flow (refresh) → confusing

**New icons are clearly distinct:**
- ⏮️ Start Over (skip back) → rewind to beginning
- 🗑️ Reset Flow (trash) → delete everything

---

## Implementation Details

### StepNavigationButtons Component

**New Props:**
```typescript
export interface StepNavigationButtonsProps {
  // ... existing props
  onStartOver?: () => void; // Optional: smart reset with credentials preserved
  // ... rest of props
}
```

**New Button Variant:**
```typescript
$variant?: 'primary' | 'success' | 'outline' | 'danger' | 'warning'
```

**Warning Variant Styling:**
```typescript
background-color: #f59e0b;  // Orange
box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
&:hover:not(:disabled) {
  background-color: #d97706;
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
  transform: translateY(-1px);
}
```

### Flow Implementation Example

**OAuth Authorization Code V6:**

```typescript
// Start Over: go back to step 0, clear tokens/codes but keep credentials
const handleStartOver = useCallback(() => {
  // Clear tokens, auth code, and PKCE codes in session storage
  const flowKey = 'oauth-authorization-code-v6';
  sessionStorage.removeItem(`${flowKey}-tokens`);
  sessionStorage.removeItem(`${flowKey}-authCode`);
  sessionStorage.removeItem(`${flowKey}-pkce`);
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('restore_step');
  
  // Clear stored redirect URI
  sessionStorage.removeItem(`redirect_uri_${flowKey}`);
  
  // Clear any step results (but keep credentials)
  controller.clearStepResults();
  
  // Go back to step 0
  setCurrentStep(0);
  
  console.log('🔄 Starting over: cleared tokens/codes, keeping credentials');
  v4ToastManager.showSuccess('Flow restarted', {
    description: 'Tokens and codes cleared. Credentials preserved.',
  });
}, [controller]);

// Usage in StepNavigationButtons
<StepNavigationButtons
  currentStep={currentStep}
  totalSteps={STEP_METADATA.length}
  onPrevious={handlePrev}
  onReset={handleResetFlow}
  onStartOver={handleStartOver}  // ✅ NEW
  onNext={handleNextClick}
  canNavigateNext={canNavigateNext()}
  isFirstStep={currentStep === 0}
/>
```

---

## User Experience

### Scenario 1: Testing with Different Parameters

**Before:**
1. User completes flow through Step 4
2. Wants to try different scopes
3. Clicks "Reset Flow"
4. ❌ Has to re-enter all credentials (client ID, secret, redirect URI, etc.)

**After:**
1. User completes flow through Step 4
2. Wants to try different scopes
3. Clicks "Start Over"
4. ✅ Back to Step 0, credentials still there, ready to go

### Scenario 2: Complete Fresh Start

**User wants to test a different client or environment:**
1. Clicks "Reset Flow"
2. ✅ Everything cleared, all sections expanded
3. Enter new credentials and start fresh

---

## Button Comparison

| Feature | Start Over | Reset Flow |
|---------|-----------|------------|
| **Go to Step 0** | ✅ Yes | ✅ Yes |
| **Clear Tokens** | ✅ Yes | ✅ Yes |
| **Clear Auth Codes** | ✅ Yes | ✅ Yes |
| **Clear PKCE Codes** | ✅ Yes | ✅ Yes |
| **Clear Credentials** | ❌ No | ✅ Yes |
| **Expand Sections** | ❌ No | ✅ Yes |
| **Show When** | Step 1+ | Always |
| **Color** | 🟠 Orange | 🔴 Red |
| **Use Case** | Retry with same client | Fresh start |

---

## Session Storage Keys Cleared

### Start Over Clears:
```typescript
// Flow-specific keys
`${flowKey}-tokens`
`${flowKey}-authCode`
`${flowKey}-pkce`
`redirect_uri_${flowKey}`

// Global keys
'oauth_state'
'restore_step'
```

### Reset Flow Clears:
- All of the above
- Plus: Credentials, flow config, all persistent state

---

## Files Modified

### Core Components
- ✅ `src/components/StepNavigationButtons.tsx`
  - Added `onStartOver` prop
  - Added "warning" button variant (orange)
  - Updated icons: `FiSkipBack` (Start Over) + `FiTrash2` (Reset Flow)
  - Added conditional rendering for Start Over button

### Flows Updated with Start Over Button
- ✅ `OAuthAuthorizationCodeFlowV6.tsx`
- ✅ `OIDCAuthorizationCodeFlowV6.tsx`
- ✅ `PingOnePARFlowV6_New.tsx`
- ✅ `RARFlowV6_New.tsx`

### Future Flows to Update (Optional)
- ⏳ `ClientCredentialsFlowV6.tsx` (single-step, less benefit)
- ⏳ `DeviceAuthorizationFlowV6.tsx`
- ⏳ `OIDCDeviceAuthorizationFlowV6.tsx`
- ⏳ `OIDCHybridFlowV6.tsx`

---

## Testing Checklist

### Start Over Button

**Visibility:**
- ✅ Hidden on Step 0 (credentials page)
- ✅ Visible on Step 1+
- ✅ Shows icon only in compact mode
- ✅ Shows "Start Over" text in normal mode

**Functionality:**
- ✅ Clears access token from session storage
- ✅ Clears refresh token from session storage
- ✅ Clears authorization code
- ✅ Clears PKCE codes (verifier & challenge)
- ✅ Clears stored redirect URI
- ✅ Clears OAuth state
- ✅ Returns to Step 0
- ✅ Credentials remain intact
- ✅ Shows success toast message

**User Experience:**
- ✅ Orange/warning color indicates caution
- ✅ Tooltip explains what the button does
- ✅ No confirmation dialog (fast workflow)
- ✅ Works in both compact and expanded modes

### Reset Flow Button

**Existing functionality:**
- ✅ Still works as before
- ✅ Clears everything including credentials
- ✅ Red color indicates destructive action
- ✅ Always visible
- ✅ Tooltip explains complete reset

---

## Future Enhancements

### Optional Improvements

1. **Confirmation Dialog for Reset Flow**
   ```typescript
   const handleResetFlow = () => {
     if (confirm('This will clear all credentials and start fresh. Continue?')) {
       controller.resetFlow();
       setCurrentStep(0);
     }
   };
   ```

2. **Auto-Start After Start Over**
   - Option to automatically regenerate PKCE codes after Start Over
   - Jump directly to Step 1 (Generate Authorization URL)

3. **Remember Last Configuration**
   - Store scope and other non-sensitive config in localStorage
   - Auto-populate after Start Over

4. **Undo Start Over**
   - Temporarily cache cleared tokens for 5 seconds
   - Show "Undo" toast action

---

## Related Documentation

- `COLLAPSIBLE_SECTIONS_STEP_BASED_BEHAVIOR.md` - Step-based UI collapsing
- `COLLAPSIBLE_HEADER_MIGRATION_STATUS.md` - CollapsibleHeader migration
- `src/components/StepNavigationButtons.tsx` - Component implementation

---

**Status:** ✅ Fully implemented and tested in OAuth Authorization Code V6 flow  
**Next Steps:** Roll out to remaining flows (OIDC, Device, PAR, RAR, etc.)

