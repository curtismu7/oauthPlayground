# Education Collapse Feature - Implementation Plan

## Problem Analysis

The current implementation is NOT working because:

1. **Styled-components don't re-evaluate**: The `display: ${() => ...}` in styled-components is evaluated once at component definition, not reactively
2. **Polling doesn't help**: Even with polling to trigger re-renders, the styled-component CSS doesn't change
3. **Wrong approach**: We're trying to use CSS to hide content instead of conditional rendering

## Correct Approach

### Three Modes Behavior:

1. **FULL Mode** (default)
   - Show ONE master collapsible section containing ALL educational content
   - User can expand/collapse the entire education section as one unit
   - All individual sections are visible inside when expanded

2. **COMPACT Mode**
   - Show MULTIPLE individual collapsible sections
   - Each educational topic is its own collapsible section
   - User can expand/collapse each section independently
   - Sections start collapsed by default

3. **HIDDEN Mode**
   - Show NOTHING - all educational content completely hidden
   - No sections, no toggles, no content at all

## Implementation Strategy

### For UnifiedFlowSteps.tsx:

1. **Remove the styled-component approach** - it doesn't work reactively
2. **Add state to track education mode** with proper polling
3. **Conditionally render based on mode**:
   ```tsx
   const educationMode = EducationPreferenceService.getEducationMode();
   
   // Hidden mode - render nothing
   if (educationMode === 'hidden') {
     return null; // or just don't render the sections
   }
   
   // Full mode - wrap all sections in one master collapsible
   if (educationMode === 'full') {
     return (
       <MasterCollapsible title="Educational Content">
         <Section1 />
         <Section2 />
         <Section3 />
       </MasterCollapsible>
     );
   }
   
   // Compact mode - individual collapsibles
   return (
     <>
       <IndividualCollapsible title="Section 1"><Section1 /></IndividualCollapsible>
       <IndividualCollapsible title="Section 2"><Section2 /></IndividualCollapsible>
       <IndividualCollapsible title="Section 3"><Section3 /></IndividualCollapsible>
     </>
   );
   ```

### For Pages Using MasterEducationSection:

The `MasterEducationSection` component already handles this correctly:
- **Full mode**: Shows master collapsible with all sections inside
- **Compact mode**: Shows individual compact sections
- **Hidden mode**: Returns `null`

These pages should work correctly already:
- ✅ UnifiedOAuthFlowV8U.tsx
- ✅ ImplicitFlowV7.tsx
- ✅ ClientCredentialsFlowV7_Complete.tsx
- ✅ UnifiedMFARegistrationFlowV8_Legacy.tsx
- ✅ MFAAuthenticationMainPageV8.tsx

## Fix Required

### UnifiedFlowSteps.tsx needs complete refactor:

1. **Remove** the `display: ${() => ...}` from CollapsibleSection styled component
2. **Add** proper state management for education mode with polling
3. **Wrap** all educational CollapsibleSection components in conditional rendering based on mode
4. **Create** a master wrapper for Full mode that contains all sections
5. **Ensure** each section is individually collapsible in Compact mode

## Testing Checklist

After implementation, test each mode on each page:

### UnifiedFlowSteps (https://localhost:3000/v8u/unified/oauth-authz/0):
- [ ] **Hidden**: No educational content visible at all
- [ ] **Compact**: Individual collapsible sections for each topic
- [ ] **Full**: One master collapsible containing all educational content

### Other Pages:
- [ ] UnifiedOAuthFlowV8U (https://localhost:3000/v8u/unified)
- [ ] ImplicitFlowV7 (https://localhost:3000/flows/implicit-v7)
- [ ] ClientCredentialsFlowV7 (https://localhost:3000/flows/client-credentials-v7)
- [ ] UnifiedMFARegistrationFlowV8 (https://localhost:3000/v8/unified-mfa)
- [ ] MFAAuthenticationMainPageV8 (https://localhost:3000/v8/mfa-authentication)

## Next Steps

1. Fix UnifiedFlowSteps.tsx with proper conditional rendering
2. Test all modes on all pages
3. Apply same pattern to remaining V7 flows
4. Document the correct pattern for future flows
