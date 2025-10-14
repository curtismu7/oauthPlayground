# JWT Bearer Flow - CollapsibleHeader Check

**Date:** October 11, 2025  
**File:** `src/pages/flows/JWTBearerTokenFlowV6.tsx`

## Finding

JWT Bearer Token Flow V6 is **USING FlowUIService**, not defining local components, but also **NOT using the centralized CollapsibleHeader service**.

## Current Implementation

### Import Pattern
```typescript
// Get shared UI components from FlowUIService
import { FlowUIService } from '../../services/flowUIService';
const {
    Container,
    ContentWrapper,
    MainCard,
    StepContentWrapper,
    CollapsibleSection,
    CollapsibleHeaderButton,
    CollapsibleTitle,
    CollapsibleToggleIcon,
    CollapsibleContent,
    InfoBox,
    InfoTitle,
    InfoText,
    // ... more components
} = FlowUIService.getFlowUIComponents();
```

### Usage Pattern
```typescript
<CollapsibleSection>
    <CollapsibleHeaderButton
        onClick={() => toggleSection('overview')}
        aria-expanded={!collapsedSections.overview}
    >
        <CollapsibleTitle>
            <FiInfo /> JWT Bearer Flow Overview
        </CollapsibleTitle>
        <CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
            <FiChevronDown />
        </CollapsibleToggleIcon>
    </CollapsibleHeaderButton>
    {!collapsedSections.overview && (
        <CollapsibleContent>
            {/* content */}
        </CollapsibleContent>
    )}
</CollapsibleSection>
```

## Comparison to CollapsibleHeader Service

### FlowUIService Pattern (Current)
- ❌ Manual structure with 5 components
- ❌ Requires manual state management
- ❌ Manual conditional rendering
- ❌ More verbose
- ⚠️ Styling may differ from CollapsibleHeader service

### CollapsibleHeader Service Pattern (Target)
- ✅ Single component with props
- ✅ Built-in state management
- ✅ Automatic rendering
- ✅ Concise and clean
- ✅ Consistent blue gradient styling

## Sections Using FlowUIService Collapsible

1. **JWT Bearer Flow Overview** (Step 0)
2. **Token Endpoint Configuration** (Step 0)
3. **JWT Claims & Signature Builder** (Step 1)
4. **Generated JWT** (Step 1)
5. **Token Request** (Step 2)
6. **Token Response** (Step 3)

## Analysis

**Status:** ⚠️ **NEEDS MIGRATION**

**Reason:** While JWT Bearer is not defining local components (good), it's using FlowUIService instead of the dedicated CollapsibleHeader service.

### Issues:
1. **Inconsistent Service Usage** - Other V6 flows use CollapsibleHeader service
2. **More Verbose** - Requires 5 separate component references
3. **Manual State** - Must manually manage collapse state and rendering
4. **Potentially Different Styling** - FlowUIService may have different theming

### Benefits of Migration:
1. ✅ **Consistency** - Same service as other V6 flows
2. ✅ **Simplicity** - Single component instead of 5
3. ✅ **Cleaner Code** - Automatic state and rendering
4. ✅ **Guaranteed Blue Theme** - Consistent styling

## Recommendation

**Should migrate JWT Bearer to CollapsibleHeader service** to match:
- SAMLBearerAssertionFlowV6 (JUST FIXED)
- Other V6 flows using CollapsibleHeader service

This would ensure:
- Consistent styling across all V6 flows
- Simpler, more maintainable code
- Centralized collapsible section logic

## Next Steps

If user approves, migrate JWT Bearer V6 from FlowUIService collapsibles to CollapsibleHeader service, following the same pattern used for SAML Bearer.

