# Collapsible Sections Guide

## Overview

This guide documents the collapsible sections implementation across both Unified OAuth/OIDC flows and MFA flows, providing users with better control over their interface experience.

## 🎯 Design Principles

### Enhanced Visibility
- **48px toggle icons** with prominent blue borders for maximum visibility
- **Gradient backgrounds** and shadow effects for professional appearance
- **Smooth animations** with hover and active states
- **Consistent styling** across all components

### User Experience
- **Intuitive interactions** - large click targets and clear visual feedback
- **Progressive disclosure** - show/hide content to reduce cognitive load
- **Persistent state** - sections remember their collapse state during the session
- **Accessibility** - proper ARIA attributes and keyboard navigation

## 📋 Unified OAuth/OIDC Flows

### Step 0 (Configuration Page) - All Sections Collapsible

#### ✅ FlowGuidanceSystem
- **Location**: `src/v8u/components/FlowGuidanceSystem.tsx`
- **Purpose**: Help users choose the right OAuth flow
- **Features**: 
  - Use case selection cards
  - Personalized recommendations
  - Educational guidance
- **Toggle**: 48px blue chevron icon with gradient background

#### ✅ SecurityScorecard  
- **Location**: `src/v8u/components/SecurityScorecard.tsx`
- **Purpose**: Visual security compliance feedback
- **Features**:
  - Security scoring (A-F grades)
  - Compliance checks by category
  - Recommendations for improvement
- **Toggle**: 48px blue chevron icon with gradient background

#### ✅ AdvancedOAuthFeatures
- **Location**: `src/v8u/components/AdvancedOAuthFeatures.tsx`
- **Purpose**: Advanced OAuth 2.1 and OIDC features
- **Features**:
  - PAR (Pushed Authorization Request)
  - JAR (JWT Authorization Request)
  - MTLS (Mutual TLS) support
- **Toggle**: 48px blue chevron icon with gradient background

### Step 1+ (Execution Steps) - Focused Interface

#### ✅ Educational Sections Only
- **Spec Compliance Notice** (OAuth 2.0/2.1)
- **OIDC Token Set** (OIDC flows)
- **Redirectless Mode Warning** (when applicable)
- **All other sections hidden** to maintain focus on flow execution

## 🔐 MFA Flows

### MFA Hub Page - All Sections Collapsible

#### ✅ MFA Features Section
- **Location**: `src/v8/flows/MFAHubV8.tsx`
- **Purpose**: Main navigation to MFA features
- **Features**:
  - Device Registration
  - Device Management  
  - MFA Reporting
  - Settings
- **Toggle**: 48px blue chevron icon with gradient background

#### ✅ About PingOne MFA Section
- **Location**: `src/v8/flows/MFAHubV8.tsx`
- **Purpose**: Educational information about MFA capabilities
- **Features**:
  - Security overview
  - Flexibility information
  - Analytics insights
  - Performance highlights
- **Toggle**: 48px blue chevron icon with gradient background

### MFA Documentation Page - Already Collapsible

#### ✅ API Documentation Sections
- **Location**: `src/v8/components/MFADocumentationPageV8.tsx`
- **Purpose**: Detailed API call documentation
- **Features**:
  - MFA Flow API calls
  - Pre-flight validation calls
  - Real-time API tracking
  - Download capabilities
- **Toggle**: 20px chevron icons (smaller for dense content)

## 🎨 Technical Implementation

### Collapsible Component Structure

```typescript
// Styled Components
const CollapsibleSection = styled.div`
  margin-bottom: 1.5rem;
  background-color: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.5rem 1.75rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
  border: 3px solid transparent;
  border-radius: 1rem;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 700;
  color: #14532d;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);

  &:hover {
    background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
    border-color: #86efac;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(34, 197, 94, 0.2);
  }
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 3px solid #3b82f6;
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
  transition: all 0.3s ease;
  cursor: pointer;
  color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);

  &:hover {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #2563eb;
    color: #2563eb;
    transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)')};
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  }

  svg {
    width: 24px;
    height: 24px;
    stroke-width: 3px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
`;
```

### State Management Pattern

```typescript
// Component state
const [isCollapsed, setIsCollapsed] = useState(false);

// Toggle handler
const toggleSection = () => {
  setIsCollapsed(!isCollapsed);
};

// Render pattern
<CollapsibleSection>
  <CollapsibleHeaderButton
    onClick={toggleSection}
    aria-expanded={!isCollapsed}
  >
    <CollapsibleTitle>
      <Icon />
      Section Title
    </CollapsibleTitle>
    <CollapsibleToggleIcon $collapsed={isCollapsed}>
      <FiChevronDown />
    </CollapsibleToggleIcon>
  </CollapsibleHeaderButton>
  {!isCollapsed && (
    <CollapsibleContent>
      {/* Section content */}
    </CollapsibleContent>
  )}
</CollapsibleSection>
```

## 📱 Responsive Design

### Mobile Considerations
- **Touch-friendly**: 48px minimum touch targets
- **Clear visual hierarchy**: Prominent headers and icons
- **Smooth animations**: 60fps transitions
- **Proper spacing**: Adequate padding for mobile screens

### Desktop Enhancements
- **Hover effects**: Scale and shadow transformations
- **Keyboard navigation**: Tab index and Enter key support
- **Screen reader support**: ARIA labels and descriptions
- **High contrast**: Strong color differentiation

## 🚀 Benefits Achieved

### User Experience
- ✅ **Reduced cognitive load** - Users can focus on relevant content
- ✅ **Better organization** - Related content grouped in collapsible sections
- ✅ **Progressive disclosure** - Advanced features hidden by default
- ✅ **Visual consistency** - Same interaction patterns across all flows

### Performance
- ✅ **Faster initial rendering** - Content loaded on-demand
- ✅ **Reduced DOM complexity** - Fewer elements rendered initially
- ✅ **Smooth interactions** - Hardware-accelerated animations
- ✅ **Memory efficiency** - Conditional rendering reduces memory usage

### Accessibility
- ✅ **WCAG compliance** - Proper ARIA attributes
- ✅ **Keyboard navigation** - Full keyboard support
- ✅ **Screen reader support** - Semantic HTML structure
- ✅ **High contrast** - Strong visual indicators

## 🔧 Maintenance Guidelines

### Adding New Collapsible Sections

1. **Import styled components**:
   ```typescript
   import { CollapsibleSection, CollapsibleHeaderButton, CollapsibleTitle, CollapsibleToggleIcon, CollapsibleContent } from './collapsible-components';
   ```

2. **Add state management**:
   ```typescript
   const [sectionCollapsed, setSectionCollapsed] = useState(false);
   ```

3. **Implement collapsible wrapper**:
   ```typescript
   <CollapsibleSection>
     <CollapsibleHeaderButton onClick={() => setSectionCollapsed(!sectionCollapsed)}>
       <CollapsibleTitle>
         <YourIcon />
         Section Title
       </CollapsibleTitle>
       <CollapsibleToggleIcon $collapsed={sectionCollapsed}>
         <FiChevronDown />
       </CollapsibleToggleIcon>
     </CollapsibleHeaderButton>
     {!sectionCollapsed && (
       <CollapsibleContent>
         {/* Your content */}
       </CollapsibleContent>
     )}
   </CollapsibleSection>
   ```

### Style Customization
- **Colors**: Modify gradient colors in styled components
- **Sizes**: Adjust icon dimensions (48px standard, 20px for dense content)
- **Animations**: Update transition durations and easing functions
- **Typography**: Customize font weights and sizes in CollapsibleTitle

## 📊 Testing Checklist

### Visual Testing
- [ ] Toggle icons are clearly visible (48px size)
- [ ] Hover effects work smoothly
- [ ] Collapse/expand animations are fluid
- [ ] Color contrast meets WCAG standards

### Functional Testing
- [ ] Click to collapse/expand works
- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Screen reader announces state changes
- [ ] Mobile touch interactions work

### Cross-Browser Testing
- [ ] Chrome/Chromium browsers
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📞 Support

For questions or issues with collapsible sections:
1. Check this documentation first
2. Review component implementations in the source files
3. Test across different browsers and devices
4. Contact the development team for complex issues

*Last updated: January 23, 2026*
