# Collapsible Sections - Step-Based Behavior

**Implementation Date:** October 12, 2025  
**Status:** ✅ Complete

## Overview

All flows now have intelligent collapsible section behavior based on the current step:

- **Step 0 (Credentials Setup)**: All sections **expanded** for easy configuration
- **Step 1+ (After credentials saved)**: All sections **collapsed** to reduce clutter

## Implementation

### Logic

Added a helper variable in each flow:

```typescript
// After credentials are saved (Step 1+), collapse all sections by default
const shouldCollapseAll = currentStep > 0;
```

Then applied to all `CollapsibleHeader` components:

```typescript
<CollapsibleHeader
  title="Section Title"
  icon={<FiIcon />}
  defaultCollapsed={shouldCollapseAll}  // ← Dynamic based on step
>
```

### Updated Flows

| Flow | Sections | Status |
|------|----------|--------|
| `OAuthAuthorizationCodeFlowV6.tsx` | 11 | ✅ Complete |
| `OIDCAuthorizationCodeFlowV6.tsx` | 11 | ✅ Complete |
| `ClientCredentialsFlowV6.tsx` | 7 | ✅ Complete |
| `DeviceAuthorizationFlowV6.tsx` | 7 | ✅ Complete |
| `OIDCDeviceAuthorizationFlowV6.tsx` | 7 | ✅ Complete |
| `OIDCHybridFlowV6.tsx` | - | ✅ Ready (no CollapsibleHeaders yet) |
| `PingOnePARFlowV6_New.tsx` | 8 | ✅ Complete |
| `RARFlowV6_New.tsx` | 9 | ✅ Complete |

**Total:** 60+ sections updated across 8 flows

## User Experience Benefits

### Before
- Mix of expanded/collapsed sections at all steps
- Inconsistent behavior across flows
- Information overload after credentials saved

### After
- **Step 0**: All sections expanded → Easy initial setup and exploration
- **Step 1+**: All sections collapsed → Clean, focused view on current task
- Consistent behavior across all flows
- Users can still manually expand any section they need

## Technical Details

### Step Detection

Each flow tracks the current step via state:

```typescript
const [currentStep, setCurrentStep] = useState(initialStep);
```

### Behavior Rules

| Step | Condition | Collapse State | Reasoning |
|------|-----------|----------------|-----------|
| 0 | `currentStep === 0` | `shouldCollapseAll = false` | User needs to see all config options |
| 1+ | `currentStep > 0` | `shouldCollapseAll = true` | Focus on current step, reduce noise |

### Examples

**Step 0 - Credentials Setup:**
```typescript
shouldCollapseAll = false
→ Overview section: EXPANDED ✓
→ Credentials section: EXPANDED ✓
→ Advanced Parameters: EXPANDED ✓
```

**Step 1 - Generate Authorization URL:**
```typescript
shouldCollapseAll = true
→ Overview section: COLLAPSED ✗
→ Credentials section: COLLAPSED ✗
→ Advanced Parameters: COLLAPSED ✗
```

Users can still click any section to expand it when needed.

## Files Modified

### Core Authorization Flows
- `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx`
- `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx`

### Client Flows
- `src/pages/flows/ClientCredentialsFlowV6.tsx`

### Device Flows
- `src/pages/flows/DeviceAuthorizationFlowV6.tsx`
- `src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx`

### Hybrid Flow
- `src/pages/flows/OIDCHybridFlowV6.tsx`

### PingOne Flows
- `src/pages/flows/PingOnePARFlowV6_New.tsx`
- `src/pages/flows/RARFlowV6_New.tsx`

## Testing

✅ **Linter:** All files pass with no errors  
✅ **Build:** All flows compile successfully  
✅ **Logic:** Step-based behavior works as expected

### Test Scenarios

1. **First Visit (Step 0)**
   - Load any flow
   - Verify all sections are expanded
   - Enter credentials and save
   
2. **After Saving (Step 1+)**
   - Navigate to Step 1
   - Verify all sections are now collapsed
   - Manually expand a section → should work
   
3. **Refresh on Step 1+**
   - Refresh page while on Step 2+
   - Verify sections remain collapsed
   
4. **Back to Step 0**
   - Navigate back to credentials step
   - Sections should expand again (if step restoration allows)

## Future Enhancements

### Optional Improvements
1. **Section-Specific Rules**: Keep certain critical sections always expanded
2. **User Preferences**: Remember which sections user manually toggled
3. **Smart Expansion**: Auto-expand section related to current step
4. **Animation**: Smooth collapse/expand when step changes

### Example: Section-Specific Rules
```typescript
const getSectionCollapsedState = (sectionKey: string) => {
  // Always keep error/warning sections expanded
  if (sectionKey === 'errors' || sectionKey === 'warnings') {
    return false;
  }
  // Default step-based behavior
  return shouldCollapseAll;
};
```

## Related Documentation

- `COLLAPSIBLE_HEADER_MIGRATION_STATUS.md` - Original migration details
- `src/services/collapsibleHeaderService.tsx` - CollapsibleHeader implementation
- `MIGRATION_COMPLETE_SUMMARY.md` - Full migration summary

---

**Status:** ✅ Fully implemented and tested across all major flows

