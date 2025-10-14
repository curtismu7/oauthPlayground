# OAuth Flow Comparison Service - CollapsibleHeader Migration

**Date:** October 11, 2025  
**Files Updated:**
- `src/services/oauthFlowComparisonService.tsx`
- `src/pages/flows/SAMLBearerAssertionFlowV6.tsx`
- `src/pages/flows/JWTBearerTokenFlowV6.tsx`

## Issue

The `OAuthFlowComparisonService` was defining its own **local styled components** for collapsible functionality instead of using the centralized `CollapsibleHeader` service.

### Problems:
1. **Code Duplication** - Local styled components (CollapsibleHeaderButton, CollapsibleTitle, CollapsibleToggleIcon, CollapsibleContent)
2. **Inconsistent Styling** - White/gray gradient instead of blue gradient
3. **Manual State Management** - Required external state and callbacks
4. **JWT Bearer Missing Comparison** - Flow didn't show the comparison table at all

## Changes Made

### 1. OAuthFlowComparisonService Migration

**Before:**
```typescript
// ❌ Local styled components
const CollapsibleHeaderButton = styled.button`...`
const CollapsibleTitle = styled.span`...`
const CollapsibleToggleIcon = styled.span<{ $collapsed: boolean }>`...`
const CollapsibleContent = styled.div`...`

// ❌ Manual structure with callbacks
static getComparisonTable({ highlightFlow, collapsed, onToggleCollapsed }: Props) {
    return (
        <ComparisonContainer>
            <CollapsibleHeaderButton onClick={onToggleCollapsed} aria-expanded={!collapsed}>
                <CollapsibleTitle>
                    <FiGlobe /> OAuth Flow Comparison...
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsed}>
                    <FiChevronDown />
                </CollapsibleToggleIcon>
            </CollapsibleHeaderButton>
            {!collapsed && (
                <CollapsibleContent>
                    {/* content */}
                </CollapsibleContent>
            )}
        </ComparisonContainer>
    );
}
```

**After:**
```typescript
// ✅ Import centralized service
import { CollapsibleHeader } from './collapsibleHeaderService';

// ✅ Simple, clean API (no callbacks needed)
static getComparisonTable({ highlightFlow, collapsed = false }: Props) {
    return (
        <CollapsibleHeader
            title="OAuth Flow Comparison: Authorization vs JWT Bearer vs SAML Bearer"
            icon={<FiGlobe />}
            defaultCollapsed={collapsed}
            showArrow={true}
        >
            {/* content */}
        </CollapsibleHeader>
    );
}
```

**Benefits:**
- ✅ **Removed 40+ lines of duplicate styled components**
- ✅ **No external state management needed**
- ✅ **No callbacks required** - CollapsibleHeader manages its own state
- ✅ **Consistent blue gradient styling**
- ✅ **White circular arrow icons**

### 2. SAML Bearer Flow Update

**Before:**
```typescript
{OAuthFlowComparisonService.getComparisonTable({
    highlightFlow: 'saml',
    collapsed: collapsedSections.comparison,
    onToggleCollapsed: () => toggleSection('comparison')  // ❌ Callback required
})}
```

**After:**
```typescript
{OAuthFlowComparisonService.getComparisonTable({
    highlightFlow: 'saml',
    collapsed: collapsedSections.comparison  // ✅ No callback needed
})}
```

### 3. JWT Bearer Flow - Added Comparison Table

**Before:**
```typescript
// ❌ No comparison table at all
{/* UI Settings */}
{UISettingsService.getFlowSpecificSettingsPanel('jwt-bearer')}

<MainCard>
    {/* steps */}
</MainCard>
```

**After:**
```typescript
// ✅ Added comparison table with proper dividers
{/* UI Settings */}
{UISettingsService.getFlowSpecificSettingsPanel('jwt-bearer')}

<SectionDivider />

{/* Flow Comparison Table */}
{OAuthFlowComparisonService.getComparisonTable({
    highlightFlow: 'jwt',
    collapsed: false
})}

<SectionDivider />

<MainCard>
    {/* steps */}
</MainCard>
```

## Visual Changes

### Before (Local Components)
- White to light gray gradient header (`#ffffff` → `#f8fafc`)
- Dark text on light background (`#374151`)
- Manual arrow rotation
- Inconsistent with other V6 flows

### After (CollapsibleHeader Service)
- **Blue gradient header** (`#3b82f6` → `#2563eb`)
- **White text** on blue background
- **Blue circular arrow icons** (white color)
- Consistent with all V6 flows

## Summary

**Status:** ✅ **COMPLETE**

### Lines Removed:
- **~40 lines** of duplicate styled components
- **~15 lines** of manual collapsible structure

### Lines Added:
- **1 import** for CollapsibleHeader service
- **~10 lines** for JWT Bearer comparison table

### Files Modified: 3
- OAuthFlowComparisonService.tsx (migrated to service)
- SAMLBearerAssertionFlowV6.tsx (removed callback)
- JWTBearerTokenFlowV6.tsx (added comparison table)

### Linter Errors: 0

### Benefits:
✅ **Consistent Styling** - Blue gradient across all flows  
✅ **Reduced Code** - Removed duplicate components  
✅ **Simpler API** - No callbacks needed  
✅ **Better Maintainability** - Single source of truth  
✅ **JWT Bearer Enhanced** - Now includes comparison table  
✅ **Self-Contained** - CollapsibleHeader manages its own state  

---

**The OAuth Flow Comparison Service now uses the centralized CollapsibleHeader service and appears on both SAML Bearer and JWT Bearer flows with consistent blue styling!** 🎨

