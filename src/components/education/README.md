# Education Components

This directory contains components for managing educational content display modes in OAuth flows.

## Components

### EducationModeToggle
A three-state toggle component for switching between education display modes:
- **Full**: Show all educational content with detailed explanations
- **Compact**: Show one-liner summaries that can be expanded
- **Hidden**: Show minimal content with expand options

#### Usage
```tsx
<EducationModeToggle variant="buttons" showDescription={true} />
<EducationModeToggle variant="dropdown" showDescription={false} />
```

### MasterEducationSection
A consolidated section that contains all educational content for a flow. Replaces multiple individual collapsible sections with a single master section.

#### Usage
```tsx
<MasterEducationSection 
  sections={V7EducationalContentService.getMasterEducationContent('oauth-authorization-code-v7').sections}
/>
```

## Services

### EducationPreferenceService
Manages user preferences for education display modes with localStorage persistence.

#### Methods
- `getEducationMode()`: Get current education mode
- `setEducationMode(mode)`: Set education mode
- `toggleMode()`: Toggle to next mode in sequence
- `isFullMode()`, `isCompactMode()`, `isHiddenMode()`: Check current mode
- `getModeLabel()`, `getModeDescription()`: Get human-readable descriptions

### V7EducationalContentService
Extended with methods for consolidated master education content:
- `getMasterEducationContent(flowName)`: Get consolidated content for a flow
- `getAllMasterEducationContent()`: Get content for all flows

## Implementation Status

✅ **Completed:**
- EducationPreferenceService with localStorage persistence
- MasterEducationSection component with three display modes
- EducationModeToggle component (buttons and dropdown variants)
- Integration with V7EducationalContentDataService
- Implementation in OAuthAuthorizationCodeFlowV7 (representative flow)

🔄 **Next Steps:**
- Test the implementation in the browser
- Roll out to remaining OAuth flows
- Add to main pages (Dashboard, Configuration, Documentation)
- Update V8 unified flows

## Features

- **Persistent Storage**: User preferences saved in localStorage
- **Three Display Modes**: Full, Compact, Hidden
- **Smooth Transitions**: Animated expand/collapse
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **TypeScript**: Full type safety
- **Styling**: Consistent with existing design system

## Benefits

- **Reduced Clutter**: Advanced users can hide detailed educational content
- **Progressive Disclosure**: New users get full education, experienced users get summaries
- **Persistent Preference**: Users don't need to set preference repeatedly
- **Simplified Architecture**: Single master section instead of multiple individual sections
- **Better UX**: Cleaner interface for experienced developers
