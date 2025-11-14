# Worker Token Button Status Fix

## Issue
The worker token button status was inconsistent with the displayed error message:
- Error banner showed "Worker Token EXPIRED"
- Button showed "Worker Token Ready" in gray/neutral color
- Button should be green when ready, red when expired/needs refresh

## Root Cause
The button background color logic was incorrect:
```typescript
// BEFORE (incorrect)
background: hasValidWorkerToken ? '#10b981' : workerTokenMeta.hasToken ? '#f59e0b' : '#10b981'
// This showed green (#10b981) when:
// - Token is valid (correct)
// - No token exists (incorrect - should be red)
```

## Fix Applied

### Button Color Logic
```typescript
// AFTER (correct)
background: hasValidWorkerToken ? '#10b981' : '#ef4444'
// Now shows:
// - Green (#10b981) when token is valid
// - Red (#ef4444) when token is expired OR missing
```

### Button Text
Added visual indicators to make status clearer:
- `✓ Worker Token Ready` - Green button, token is valid
- `⚠ Refresh Worker Token` - Red button, token is expired
- `Get Worker Token` - Red button, no token exists

## Visual States

### Valid Token
- **Button:** Green background (#10b981) with white text
- **Text:** "✓ Worker Token Ready"
- **Banner:** Green with checkmark icon

### Expired Token
- **Button:** Red background (#ef4444) with white text
- **Text:** "⚠ Refresh Worker Token"
- **Banner:** Red with alert icon showing "Worker Token EXPIRED"

### No Token
- **Button:** Red background (#ef4444) with white text
- **Text:** "Get Worker Token"
- **Banner:** Not shown

## Files Modified
- `src/pages/PingOneUserProfile.tsx` - Fixed button color logic and text

## Testing
1. Navigate to `/pingone-user-profile`
2. Verify button states:
   - With valid token: Green button with "✓ Worker Token Ready"
   - With expired token: Red button with "⚠ Refresh Worker Token"
   - With no token: Red button with "Get Worker Token"
3. Verify banner matches button state
