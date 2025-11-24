# Credentials Form V8U - Highlight Empty Required Fields

## Feature Summary

Added visual highlighting (red border + shake animation) for empty required fields after using the app picker to fill in Client ID.

## Problem

When users use the app picker to auto-fill the Client ID, they might not notice that Client Secret still needs to be entered manually. The empty required field wasn't visually prominent.

## Solution

After app picker selection:
1. Enable highlighting mode
2. Show red border on empty required fields (like Client Secret)
3. Add shake animation to draw attention
4. Display warning message below the field
5. Clear highlighting once user starts typing

## Changes Made

### 1. Added State for Highlighting

```typescript
const [highlightEmptyFields, setHighlightEmptyFields] = useState(false);
```

### 2. Enable Highlighting After App Selection

```typescript
const handleAppSelected = useCallback((app: DiscoveredApp) => {
  console.log(`${MODULE_TAG} App selected`, { appId: app.id, appName: app.name });
  setHasDiscoveredApps(true);
  setHighlightEmptyFields(true); // Enable highlighting for empty required fields
  // ... rest of the code
}, [credentials, onChange, flowKey]);
```

### 3. Added Red Border Styling to Client Secret Field

```typescript
<input
  type={showClientSecret ? 'text' : 'password'}
  placeholder="••••••••••••••••"
  value={credentials.clientSecret || ''}
  onChange={(e) => {
    handleChange('clientSecret', e.target.value);
    // Clear highlighting once user starts typing
    if (e.target.value && highlightEmptyFields) {
      setHighlightEmptyFields(false);
    }
  }}
  aria-label="Client Secret"
  style={{ 
    paddingRight: '40px',
    ...(highlightEmptyFields && !credentials.clientSecret && flowOptions.requiresClientSecret ? {
      border: '2px solid #ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
      animation: 'shake 0.5s'
    } : {})
  }}
/>
```

### 4. Added Warning Message

```typescript
{highlightEmptyFields && !credentials.clientSecret && flowOptions.requiresClientSecret ? (
  <small style={{ color: '#ef4444', fontWeight: 600 }}>
    ⚠️ Client Secret is required - please enter it to continue
  </small>
) : (
  <small>Keep this secure - never expose in client-side code</small>
)}
```

### 5. Added Shake Animation

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
```

## Visual Behavior

### Before App Picker
- All fields have normal styling
- No highlighting

### After App Picker Selection
1. **Client ID** gets filled automatically
2. **Client Secret** (if empty and required):
   - Gets red border (2px solid #ef4444)
   - Gets red shadow glow
   - Shakes for 0.5 seconds to draw attention
   - Shows warning message: "⚠️ Client Secret is required - please enter it to continue"

### After User Starts Typing
- Red border disappears
- Warning message changes back to normal helper text
- Highlighting mode disabled

## Conditions for Highlighting

The field is highlighted when ALL of these are true:
1. `highlightEmptyFields === true` (enabled after app picker)
2. `!credentials.clientSecret` (field is empty)
3. `flowOptions.requiresClientSecret` (field is required for this flow)

## User Experience Flow

```
1. User clicks "Discover Apps" button
   ↓
2. User selects an app from the list
   ↓
3. Client ID auto-fills
   ↓
4. Client Secret field shakes with red border
   ↓
5. User sees warning: "⚠️ Client Secret is required"
   ↓
6. User starts typing in Client Secret
   ↓
7. Red border disappears, normal styling returns
```

## Styling Details

### Red Border
- **Color**: #ef4444 (Tailwind red-500)
- **Width**: 2px solid
- **Shadow**: 0 0 0 3px rgba(239, 68, 68, 0.1) (red glow)

### Shake Animation
- **Duration**: 0.5 seconds
- **Movement**: ±4px horizontal
- **Timing**: 5 shakes total

### Warning Message
- **Color**: #ef4444 (red)
- **Font Weight**: 600 (semi-bold)
- **Icon**: ⚠️ warning emoji

## Extensibility

This pattern can be easily extended to other required fields:

```typescript
// For any required field:
style={{ 
  ...(highlightEmptyFields && !credentials.fieldName && fieldIsRequired ? {
    border: '2px solid #ef4444',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    animation: 'shake 0.5s'
  } : {})
}}
```

## Future Enhancements

Potential improvements:
- Highlight multiple empty required fields simultaneously
- Add a summary banner showing all missing required fields
- Pulse animation instead of shake for less aggressive feedback
- Configurable highlight color/style
- Accessibility improvements (ARIA announcements)

## Files Modified

- `src/v8u/components/CredentialsFormV8U.tsx`
  - Added `highlightEmptyFields` state
  - Updated `handleAppSelected` to enable highlighting
  - Added conditional styling to Client Secret input
  - Added warning message display
  - Added shake animation keyframes

## Testing Checklist

- [x] Red border appears on empty Client Secret after app picker
- [x] Shake animation plays once
- [x] Warning message displays
- [x] Highlighting clears when user types
- [x] Normal helper text returns after typing
- [x] Works with show/hide password toggle
- [x] Only highlights when field is required
- [x] Doesn't highlight if field already has value

---

**Impact**: Users immediately see which required fields still need attention after using the app picker.
