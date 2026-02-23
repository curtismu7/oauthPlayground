# Header Standardization Plan
## Unified Blue Header System with Collapsible Functionality

### 🎯 **Design Goals**
- **Consistent Blue Headers**: All headers use the same blue color
- **Uniform Size**: Standardized header dimensions and typography
- **Collapsible Functionality**: All sections can expand/collapse with icons
- **White Text**: Headers and descriptions use white text
- **Icon Integration**: Visual icons for each section type

---

## 🎨 **Design System Specification**

### **Header Color Palette**
```css
/* Primary Blue Header Colors */
--header-bg-primary: #2563EB;          /* Main header background */
--header-bg-hover: #1D4ED8;           /* Hover state */
--header-bg-active: #1E40AF;          /* Active/expanded state */
--header-text-primary: #FFFFFF;        /* Header title text */
--header-text-secondary: #F3F4F6;      /* Description text */
--header-border: #1E40AF;              /* Header border */
--header-icon: #FFFFFF;                /* Icon color */
```

### **Typography System**
```css
/* Header Typography */
--header-title-size: 1.125rem;         /* 18px */
--header-title-weight: 600;            /* Semibold */
--header-title-line-height: 1.5;
--header-desc-size: 0.875rem;          /* 14px */
--header-desc-weight: 400;              /* Normal */
--header-desc-line-height: 1.4;
--header-spacing: 1rem;                 /* 16px */
```

### **Dimensions & Spacing**
```css
/* Header Dimensions */
--header-height: 3.5rem;               /* 56px */
--header-padding-x: 1.25rem;           /* 20px */
--header-padding-y: 0.875rem;          /* 14px */
--header-border-radius: 0.5rem;       /* 8px */
--header-margin-bottom: 1rem;          /* 16px */
--icon-size: 1.25rem;                   /* 20px */
--icon-margin: 0.75rem;                /* 12px */
```

---

## 🧩 **Component Architecture**

### **1. Base Header Component**
```typescript
interface StandardHeaderProps {
  title: string;
  description?: string;
  icon?: string; // MDI icon name
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  badge?: {
    text: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  };
}

const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  description,
  icon,
  isCollapsible = true,
  isCollapsed = false,
  onToggle,
  variant = 'primary',
  badge,
}) => {
  return (
    <div 
      className={`standard-header standard-header--${variant}`}
      onClick={isCollapsible ? onToggle : undefined}
    >
      <div className="standard-header__content">
        {icon && (
          <div className="standard-header__icon">
            <span className={`mdi mdi-${icon}`}></span>
          </div>
        )}
        
        <div className="standard-header__text">
          <h3 className="standard-header__title">{title}</h3>
          {description && (
            <p className="standard-header__description">{description}</p>
          )}
        </div>
        
        {badge && (
          <div className={`standard-header__badge standard-header__badge--${badge.variant}`}>
            {badge.text}
          </div>
        )}
        
        {isCollapsible && (
          <div className={`standard-header__toggle ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            <span className="mdi mdi-chevron-down"></span>
          </div>
        )}
      </div>
    </div>
  );
};
```

### **2. CSS Implementation**
```css
/* Base Header Styles */
.standard-header {
  background: var(--header-bg-primary);
  border: 1px solid var(--header-border);
  border-radius: var(--header-border-radius);
  min-height: var(--header-height);
  padding: var(--header-padding-y) var(--header-padding-x);
  margin-bottom: var(--header-margin-bottom);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.standard-header:hover {
  background: var(--header-bg-hover);
  border-color: var(--header-bg-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.standard-header:active {
  background: var(--header-bg-active);
  transform: translateY(0);
}

/* Header Content Layout */
.standard-header__content {
  display: flex;
  align-items: center;
  gap: var(--icon-margin);
  width: 100%;
}

/* Icon Styles */
.standard-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-size);
  height: var(--icon-size);
  color: var(--header-icon);
  flex-shrink: 0;
}

/* Text Styles */
.standard-header__text {
  flex: 1;
  min-width: 0;
}

.standard-header__title {
  font-size: var(--header-title-size);
  font-weight: var(--header-title-weight);
  line-height: var(--header-title-line-height);
  color: var(--header-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.standard-header__description {
  font-size: var(--header-desc-size);
  font-weight: var(--header-desc-weight);
  line-height: var(--header-desc-line-height);
  color: var(--header-text-secondary);
  margin: 0.25rem 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Badge Styles */
.standard-header__badge {
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  flex-shrink: 0;
}

.standard-header__badge--default {
  background: rgba(255, 255, 255, 0.2);
  color: var(--header-text-primary);
}

.standard-header__badge--primary {
  background: rgba(59, 130, 246, 0.3);
  color: #DBEAFE;
}

.standard-header__badge--success {
  background: rgba(34, 197, 94, 0.3);
  color: #D1FAE5;
}

.standard-header__badge--warning {
  background: rgba(245, 158, 11, 0.3);
  color: #FEF3C7;
}

.standard-header__badge--danger {
  background: rgba(239, 68, 68, 0.3);
  color: #FEE2E2;
}

/* Toggle Icon Styles */
.standard-header__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-size);
  height: var(--icon-size);
  color: var(--header-icon);
  transition: transform 0.2s ease-in-out;
  flex-shrink: 0;
}

.standard-header__toggle.expanded {
  transform: rotate(180deg);
}

.standard-header__toggle.collapsed {
  transform: rotate(0deg);
}

/* Header Variants */
.standard-header--secondary {
  background: #1E40AF;
  border-color: #1E3A8A;
}

.standard-header--secondary:hover {
  background: #1E3A8A;
  border-color: #1E3A8A;
}

.standard-header--accent {
  background: #0891B2;
  border-color: #0E7490;
}

.standard-header--accent:hover {
  background: #0E7490;
  border-color: #0C4A6E;
}
```

---

## 📋 **Component Mapping & Migration Plan**

### **Phase 1: Identify Current Headers**

#### **Dashboard Headers**
```typescript
// Current Dashboard Headers to Standardize
- "Quick Access" → StandardHeader with icon="rocket-launch"
- "API Endpoints" → StandardHeader with icon="api"
- "Recent Activity" → StandardHeader with icon="history"
- "System Status" → StandardHeader with icon="server"
```

#### **Flow Page Headers**
```typescript
// Flow Page Headers
- "Configuration" → StandardHeader with icon="cog"
- "Authentication" → StandardHeader with icon="shield-account"
- "Token Management" → StandardHeader with icon="key"
- "Debug Information" → StandardHeader with icon="bug"
```

#### **Modal Headers**
```typescript
// Modal Headers
- "Worker Token" → StandardHeader with icon="key-variant"
- "Configuration" → StandardHeader with icon="cog"
- "Error Details" → StandardHeader with icon="alert-circle"
```

### **Phase 2: Create Standard Header Component**

#### **File Structure**
```
src/
├── components/
│   ├── common/
│   │   ├── StandardHeader.tsx          # Main component
│   │   ├── StandardHeader.styles.ts     # CSS styles
│   │   └── StandardHeader.types.ts     # TypeScript types
│   └── ui/
│       ├── HeaderSection.tsx           # Wrapper component
│       └── CollapsibleSection.tsx      # Collapsible wrapper
```

#### **Component Dependencies**
```typescript
// Dependencies
import React from 'react';
import styled from 'styled-components';
import { MDIIcon } from './MDIIcon';

// Types
export interface StandardHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  badge?: BadgeProps;
  children?: React.ReactNode;
}

export interface BadgeProps {
  text: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}
```

### **Phase 3: Implementation Strategy**

#### **Step 1: Create Base Component**
```typescript
// src/components/common/StandardHeader.tsx
import React from 'react';
import { MDIIcon } from '../ui/MDIIcon';
import { HeaderContainer, HeaderContent, HeaderText, HeaderTitle, HeaderDescription, HeaderBadge, HeaderToggle } from './StandardHeader.styles';

export const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  description,
  icon,
  isCollapsible = true,
  isCollapsed = false,
  onToggle,
  variant = 'primary',
  badge,
  children,
}) => {
  return (
    <>
      <HeaderContainer
        className={`standard-header standard-header--${variant}`}
        onClick={isCollapsible ? onToggle : undefined}
        $isCollapsible={isCollapsible}
      >
        <HeaderContent>
          {icon && (
            <MDIIcon
              icon={icon}
              size={20}
              className="standard-header__icon"
            />
          )}
          
          <HeaderText>
            <HeaderTitle>{title}</HeaderTitle>
            {description && (
              <HeaderDescription>{description}</HeaderDescription>
            )}
          </HeaderText>
          
          {badge && (
            <HeaderBadge $variant={badge.variant || 'default'}>
              {badge.text}
            </HeaderBadge>
          )}
          
          {isCollapsible && (
            <HeaderToggle $isExpanded={!isCollapsed}>
              <MDIIcon icon="chevron-down" size={20} />
            </HeaderToggle>
          )}
        </HeaderContent>
      </HeaderContainer>
      
      {children && !isCollapsed && (
        <div className="standard-header__content">
          {children}
        </div>
      )}
    </>
  );
};
```

#### **Step 2: Create Styled Components**
```typescript
// src/components/common/StandardHeader.styles.ts
import styled from 'styled-components';

export const HeaderContainer = styled.div<{ $isCollapsible?: boolean }>`
  background: #2563EB;
  border: 1px solid #1E40AF;
  border-radius: 0.5rem;
  min-height: 3.5rem;
  padding: 0.875rem 1.25rem;
  margin-bottom: 1rem;
  cursor: ${props => props.$isCollapsible ? 'pointer' : 'default'};
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #1D4ED8;
    border-color: #1D4ED8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
  }

  &:active {
    background: #1E40AF;
    transform: translateY(0);
  }
`;

export const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
`;

export const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

export const HeaderTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.5;
  color: #FFFFFF;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const HeaderDescription = styled.p`
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.4;
  color: #F3F4F6;
  margin: 0.25rem 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const HeaderBadge = styled.span<{ $variant: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  flex-shrink: 0;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: rgba(59, 130, 246, 0.3);
          color: #DBEAFE;
        `;
      case 'success':
        return `
          background: rgba(34, 197, 94, 0.3);
          color: #D1FAE5;
        `;
      case 'warning':
        return `
          background: rgba(245, 158, 11, 0.3);
          color: #FEF3C7;
        `;
      case 'danger':
        return `
          background: rgba(239, 68, 68, 0.3);
          color: #FEE2E2;
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        `;
    }
  }}
`;

export const HeaderToggle = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  color: #FFFFFF;
  transition: transform 0.2s ease-in-out;
  flex-shrink: 0;
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`;
```

### **Phase 4: Migration Implementation**

#### **Dashboard Migration**
```typescript
// Before (Current Dashboard.PingUI.tsx)
<CollapsibleHeader
  title="Quick Access"
  collapsed={collapsedSections.quickAccess}
  onToggle={() => toggleSection('quickAccess')}
  icon={<MDIIcon icon="rocket-launch" size={20} />}
>

// After (Standardized)
<StandardHeader
  title="Quick Access"
  description="Access frequently used OAuth flows and tools"
  icon="rocket-launch"
  isCollapsible={true}
  isCollapsed={collapsedSections.quickAccess}
  onToggle={() => toggleSection('quickAccess')}
>
  {/* Content */}
</StandardHeader>
```

#### **Flow Page Migration**
```typescript
// Before (Current Flow Pages)
<CollapsibleHeader
  title="Configuration"
  collapsed={collapsed}
  onToggle={onToggle}
  icon={<FiSettings />}
>

// After (Standardized)
<StandardHeader
  title="Configuration"
  description="Configure OAuth flow parameters and settings"
  icon="cog"
  isCollapsible={true}
  isCollapsed={collapsed}
  onToggle={onToggle}
  badge={{ text: "Required", variant: "warning" }}
>
  {/* Content */}
</StandardHeader>
```

#### **Modal Migration**
```typescript
// Before (Current Modals)
<div className="modal-header">
  <h2>Worker Token</h2>
  <button onClick={onClose}>
    <FiX />
  </button>
</div>

// After (Standardized)
<StandardHeader
  title="Worker Token"
  description="Manage and monitor worker token status"
  icon="key-variant"
  isCollapsible={false}
  badge={{ text: "Active", variant: "success" }}
/>
```

---

## 🚀 **Implementation Timeline**

### **Week 1: Foundation**
- [ ] Create StandardHeader component
- [ ] Implement CSS styles
- [ ] Set up TypeScript types
- [ ] Create MDI icon integration

### **Week 2: Dashboard Migration**
- [ ] Update Dashboard.PingUI.tsx headers
- [ ] Replace CollapsibleHeader with StandardHeader
- [ ] Add descriptions to all sections
- [ ] Test collapsible functionality

### **Week 3: Flow Page Migration**
- [ ] Update all flow page headers
- [ ] Replace existing header components
- [ ] Add appropriate icons and descriptions
- [ ] Implement badge system

### **Week 4: Modal & Component Migration**
- [ ] Update modal headers
- [ ] Replace service component headers
- [ ] Add comprehensive testing
- [ ] Final polish and optimization

---

## 📊 **Components to Update**

### **High Priority**
- [ ] `Dashboard.PingUI.tsx` - Main dashboard headers
- [ ] `CollapsibleHeader.tsx` - Replace with StandardHeader
- [ ] `FlowHeader.tsx` - Flow page headers
- [ ] Modal components - Worker token, configuration modals

### **Medium Priority**
- [ ] Service components - Authentication, configuration services
- [ ] Form components - Multi-step forms
- [ ] Settings pages - Environment, feature settings

### **Low Priority**
- [ ] Legacy components - V7/V8 components
- [ ] Documentation pages - Static content headers
- [ ] Utility components - Helper components

---

## 🎯 **Success Metrics**

### **Visual Consistency**
- ✅ All headers use consistent blue color
- ✅ Uniform typography and spacing
- ✅ Consistent icon usage
- ✅ Professional appearance

### **Functional Consistency**
- ✅ All collapsible sections work identically
- ✅ Consistent hover and active states
- ✅ Uniform badge system
- ✅ Smooth animations and transitions

### **Developer Experience**
- ✅ Single component to maintain
- ✅ Easy to implement new headers
- ✅ Type-safe props interface
- ✅ Comprehensive documentation

---

## 📋 **Testing Requirements**

### **Visual Testing**
- [ ] Color consistency across all headers
- [ ] Typography rendering in different browsers
- [ ] Icon alignment and sizing
- [ ] Badge positioning and styling

### **Functional Testing**
- [ ] Collapsible functionality works correctly
- [ ] Click handlers trigger properly
- [ ] State management for collapsed/expanded
- [ ] Keyboard navigation support

### **Responsive Testing**
- [ ] Headers adapt to different screen sizes
- [ ] Text truncation works properly
- [ ] Icon scaling on mobile devices
- [ ] Touch targets are appropriately sized

### **Accessibility Testing**
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast compliance
- [ ] ARIA labels and roles

---

## 📈 **Benefits Achieved**

### **Design Consistency**
- **Unified Look**: All headers follow the same design system
- **Professional Appearance**: Enterprise-ready visual design
- **Brand Consistency**: PingOne branding throughout
- **Visual Hierarchy**: Clear information architecture

### **User Experience**
- **Intuitive Navigation**: Clear section organization
- **Visual Feedback**: Consistent hover and active states
- **Information Architecture**: Descriptions provide context
- **Accessibility**: WCAG compliant design

### **Developer Experience**
- **Maintainability**: Single component for all headers
- **Reusability**: Easy to implement new headers
- **Type Safety**: Comprehensive TypeScript support
- **Documentation**: Clear usage guidelines

---

**Status**: 📋 **PLANNING COMPLETE** - Ready for implementation phase

This comprehensive plan provides a complete roadmap for standardizing all headers with consistent blue styling, white text, collapsible functionality, and icon integration. The implementation will create a unified, professional appearance across the entire application.
