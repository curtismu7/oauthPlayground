# PingOne UI Bootstrap Migration Plan
## Overview
This document outlines the comprehensive migration strategy to update all apps already upgraded to PingOne UI to use Bootstrap classes, since PingOne UI is based on Bootstrap.

## Current State Analysis
- **PingOne UI Apps**: 64+ files with `.PingUI.tsx` suffix
- **Current Styling**: Mix of custom CSS, styled-components, and some Bootstrap classes
- **Target**: Full Bootstrap class implementation for consistency
- **Bootstrap Version**: Bootstrap 5.x (latest stable)

## Migration Strategy

### Phase 1: Bootstrap Foundation Setup ✅ COMPLETED
- [x] Install Bootstrap dependencies
- [x] Create Bootstrap CSS overrides for PingOne design system
- [x] Set up Bootstrap utility classes integration
- [x] Create PingOne Bootstrap component library

### Phase 2: Core Component Migration (Priority: HIGH) 🔄 IN PROGRESS
**Target**: Replace custom styled-components with Bootstrap classes in core components

#### 2.1 Button Components 🔄 IN PROGRESS
**Files Identified**:
- `src/components/WorkerTokenButton.tsx` - Mixed styling
- `src/v8/components/StepActionButtonsV8.tsx` - 21 button classes
- `src/apps/mfa/components/MFANavigationV8.tsx` - 17 button classes
- `src/v8u/components/UnifiedFlowSteps.tsx` - 22 button classes

**Migration Priority Order**:
1. **WorkerTokenButton** - CRITICAL (used across all apps)
2. **StepActionButtonsV8** - HIGH (flow navigation)
3. **MFANavigationV8** - HIGH (MFA navigation)
4. **UnifiedFlowSteps** - HIGH (unified flows)

**Bootstrap Button Migration Patterns**:

```typescript
// BEFORE: Custom styled button
<button
  style={{
    background: 'var(--ping-blue-primary, #2563EB)',
    color: 'white',
    border: '1px solid var(--ping-blue-primary, #2563EB)',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.5rem',
    fontWeight: '500'
  }}
>
  Continue
</button>

// AFTER: Bootstrap classes with PingOne overrides
<button className="btn btn-primary border-white ping-btn">
  Continue
</button>
```

#### 2.2 Form Components (Priority: HIGH)
**Files Identified**:
- `src/v8u/components/CredentialsFormV8U.tsx` - 13 form classes
- `src/v8/components/CredentialsFormV8.tsx` - 4 form classes
- `src/pages/Configuration.PingUI.tsx` - 10 form classes
- `src/pages/ApplicationGenerator.PingUI.tsx` - 10 form classes

**Bootstrap Form Migration Patterns**:

```typescript
// BEFORE: Custom form styling
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1.5rem'
}}>
  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
    Client ID
  </label>
  <input
    type="text"
    style={{
      width: '100%',
      padding: '0.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem'
    }}
  />
</div>

// AFTER: Bootstrap form classes
<div className="mb-4">
  <label htmlFor="clientId" className="form-label">
    Client ID
  </label>
  <input
    type="text"
    id="clientId"
    className="form-control"
  />
</div>
```

#### 2.3 Modal Components (Priority: HIGH)
**Files Identified**:
- `src/apps/mfa/components/MFASettingsModalV8.tsx` - 7 modal classes
- `src/v8/components/WorkerTokenModalV8.tsx` - 3 modal classes
- Various modal components across MFA flows

**Bootstrap Modal Migration Patterns**:

```typescript
// BEFORE: Custom modal
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  <div style={{
    background: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    maxWidth: '500px',
    width: '90%'
  }}>
    <h2>Modal Title</h2>
    <p>Modal content</p>
  </div>
</div>

// AFTER: Bootstrap modal
<div className="modal show" style={{ display: 'block' }}>
  <div className="modal-dialog">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">Modal Title</h5>
      </div>
      <div className="modal-body">
        <p>Modal content</p>
      </div>
    </div>
  </div>
</div>
```

### Phase 3: Layout Components Migration (Priority: MEDIUM)
**Target**: Replace custom layout with Bootstrap grid system

#### 3.1 Grid and Layout
**Files Identified**:
- `src/pages/Dashboard.PingUI.tsx` - Custom grid layouts
- `src/pages/Configuration.PingUI.tsx` - Tab-based layouts
- `src/apps/mfa/flows/MFAConfigurationPageV8.PingUI.tsx` - Form layouts

**Bootstrap Grid Migration Patterns**:

```typescript
// BEFORE: Custom grid
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '1rem',
  marginBottom: '2rem'
}}>
  <div>Card 1</div>
  <div>Card 2</div>
</div>

// AFTER: Bootstrap grid
<div className="row g-3 mb-4">
  <div className="col-md-6">
    <div className="card">Card 1</div>
  </div>
  <div className="col-md-6">
    <div className="card">Card 2</div>
  </div>
</div>
```

#### 3.2 Card Components
**Files Identified**:
- Dashboard cards
- Configuration sections
- MFA flow cards

**Bootstrap Card Migration Patterns**:

```typescript
// BEFORE: Custom card
<div style={{
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  padding: '1rem',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
}}>
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// AFTER: Bootstrap card
<div className="card">
  <div className="card-body">
    <h5 className="card-title">Card Title</h5>
    <p className="card-text">Card content</p>
  </div>
</div>
```

### Phase 4: Navigation and Header Components (Priority: MEDIUM)
**Target**: Replace custom navigation with Bootstrap components

#### 4.1 Navigation Components
**Files Identified**:
- `src/apps/mfa/components/MFANavigationV8.tsx` - Custom navigation
- `src/v8u/components/UnifiedNavigationV8U.tsx` - Unified navigation
- Various header components

**Bootstrap Navigation Migration Patterns**:

```typescript
// BEFORE: Custom navigation
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem',
  borderBottom: '1px solid #e5e7eb'
}}>
  <div>Logo</div>
  <nav>
    <a href="#" style={{ marginRight: '1rem' }}>Home</a>
    <a href="#" style={{ marginRight: '1rem' }}>About</a>
  </nav>
</div>

// AFTER: Bootstrap navbar
<nav className="navbar navbar-expand-lg navbar-light bg-light">
  <div className="container-fluid">
    <a className="navbar-brand" href="#">Logo</a>
    <button className="navbar-toggler" type="button">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse">
      <ul className="navbar-nav me-auto">
        <li className="nav-item">
          <a className="nav-link" href="#">Home</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#">About</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
```

### Phase 5: Utility and Helper Classes (Priority: LOW)
**Target**: Replace custom utility styles with Bootstrap utilities

#### 5.1 Spacing and Sizing
**Files Identified**: All PingUI files with custom spacing

**Bootstrap Utility Migration Patterns**:

```typescript
// BEFORE: Custom spacing
<div style={{ margin: '1rem 0', padding: '0.5rem' }}>
  Content
</div>

// AFTER: Bootstrap utilities
<div className="my-3 p-2">
  Content
</div>
```

#### 5.2 Display and Positioning
**Files Identified**: All PingUI files with custom display styles

**Bootstrap Display Migration Patterns**:

```typescript
// BEFORE: Custom display
<div style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh'
}}>
  Content
</div>

// AFTER: Bootstrap utilities
<div className="d-flex justify-content-center align-items-center vh-100">
  Content
</div>
```

## Implementation Plan

### Step 1: Bootstrap Setup
```bash
# Install Bootstrap and dependencies
npm install bootstrap @popperjs/core

# Create PingOne Bootstrap overrides
mkdir -p src/styles/bootstrap
touch src/styles/bootstrap/pingone-bootstrap.css
```

### Step 2: Create PingOne Bootstrap Theme
```css
/* src/styles/bootstrap/pingone-bootstrap.css */
:root {
  --ping-blue-primary: #2563EB;
  --ping-blue-hover: #1D4ED8;
  --ping-blue-active: #1E40AF;
  --ping-success: #059669;
  --ping-warning: #D97706;
  --ping-danger: #DC2626;
  --ping-gray: #6B7280;
}

/* Bootstrap variable overrides */
.btn-primary {
  --bs-btn-bg: var(--ping-blue-primary);
  --bs-btn-border-color: var(--ping-blue-primary);
  --bs-btn-hover-bg: var(--ping-blue-hover);
  --bs-btn-hover-border-color: var(--ping-blue-hover);
  --bs-btn-active-bg: var(--ping-blue-active);
  --bs-btn-active-border-color: var(--ping-blue-active);
}

.btn-primary.border-white {
  --bs-btn-border-color: #FFFFFF;
}

.btn-success {
  --bs-btn-bg: var(--ping-success);
  --bs-btn-border-color: var(--ping-success);
}

.btn-warning {
  --bs-btn-bg: var(--ping-warning);
  --bs-btn-border-color: var(--ping-warning);
}

.btn-danger {
  --bs-btn-bg: var(--ping-danger);
  --bs-btn-border-color: var(--ping-danger);
}
```

### Step 3: Migration Templates

#### Button Component Template
```typescript
// templates/bootstrap-button.tsx
interface BootstrapButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  whiteBorder?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

const BootstrapButton: React.FC<BootstrapButtonProps> = ({
  variant = 'primary',
  size = 'md',
  whiteBorder = false,
  children,
  onClick,
  disabled = false
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    whiteBorder ? 'border-white' : '',
    'ping-btn'
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
```

#### Form Component Template
```typescript
// templates/bootstrap-form.tsx
interface BootstrapFormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

const BootstrapFormField: React.FC<BootstrapFormFieldProps> = ({
  label,
  type = 'text',
  id,
  value,
  onChange,
  placeholder,
  required = false,
  error
}) => {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        id={id}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {error && (
        <div className="invalid-feedback">
          {error}
        </div>
      )}
    </div>
  );
};
```

## Migration Checklist

### Components to Update
- [ ] **Button Components** (Priority: HIGH)
  - [ ] WorkerTokenButton
  - [ ] StepActionButtonsV8
  - [ ] MFANavigationV8
  - [ ] UnifiedFlowSteps
  - [ ] All other button usages

- [ ] **Form Components** (Priority: HIGH)
  - [ ] CredentialsFormV8U
  - [ ] CredentialsFormV8
  - [ ] Configuration forms
  - [ ] ApplicationGenerator forms

- [ ] **Modal Components** (Priority: HIGH)
  - [ ] MFASettingsModalV8
  - [ ] WorkerTokenModalV8
  - [ ] All modal components

- [ ] **Layout Components** (Priority: MEDIUM)
  - [ ] Dashboard layouts
  - [ ] Configuration layouts
  - [ ] MFA flow layouts

- [ ] **Navigation Components** (Priority: MEDIUM)
  - [ ] MFANavigationV8
  - [ ] UnifiedNavigationV8U
  - [ ] Header components

- [ ] **Utility Components** (Priority: LOW)
  - [ ] Spacing utilities
  - [ ] Display utilities
  - [ ] Positioning utilities

### Files to Review
- [ ] **Pages** (24 files)
  - [ ] About.PingUI.tsx
  - [ ] Analytics.PingUI.tsx
  - [ ] ApiStatusPageV9.PingUI.tsx
  - [ ] ApplicationGenerator.PingUI.tsx
  - [ ] AutoDiscover.PingUI.tsx
  - [ ] Configuration.PingUI.tsx
  - [ ] Dashboard.PingUI.tsx
  - [ ] DeviceManagement.PingUI.tsx
  - [ ] DeviceManagementV9.PingUI.tsx
  - [ ] Documentation.PingUI.tsx
  - [ ] EnvironmentManagementPageV8.PingUI.tsx
  - [ ] Login.PingUI.tsx
  - [ ] OAuthFlows.PingUI.tsx
  - [ ] PingAIResources.PingUI.tsx
  - [ ] PingOneIdentityMetrics.PingUI.tsx
  - [ ] PingOneUserProfile.PingUI.tsx
  - [ ] PostmanCollectionGenerator.PingUI.tsx
  - [ ] UltimateTokenDisplayDemo.PingUI.tsx
  - [ ] WorkerTokenTester.PingUI.tsx
  - [ ] TokenExchangeFlowV9.PingUI.tsx
  - [ ] TokenIntrospectionFlow.PingUI.tsx
  - [ ] ProtectPortalApp.PingUI.tsx
  - [ ] SDKExamplesHome.PingUI.tsx
  - [ ] HelioMartPasswordReset.PingUI.tsx

- [ ] **App Components** (40+ files)
  - [ ] All MFA app components
  - [ ] All OAuth app components
  - [ ] All Protect app components
  - [ ] All Flow components

### Testing Requirements
- [ ] **Visual Regression**: All components maintain visual appearance
- [ ] **Functionality**: All interactions work correctly
- [ ] **Responsive Design**: Mobile compatibility preserved
- [ ] **Accessibility**: ARIA attributes and keyboard navigation
- [ ] **Performance**: No performance degradation

## Success Metrics

### Design Consistency
- ✅ All PingOne UI apps use Bootstrap classes
- ✅ Consistent spacing, typography, and colors
- ✅ Responsive design across all breakpoints
- ✅ Professional appearance maintained

### Developer Experience
- ✅ Easier maintenance with Bootstrap utilities
- ✅ Faster development with pre-built components
- ✅ Better documentation and community support
- ✅ Consistent code patterns across apps

### User Experience
- ✅ Familiar Bootstrap interaction patterns
- ✅ Improved accessibility
- ✅ Better mobile experience
- ✅ Consistent UI across all applications

## Implementation Timeline

### Week 1: Foundation
- Install Bootstrap and dependencies
- Create PingOne Bootstrap theme
- Set up migration templates

### Week 2-3: Core Components
- Migrate button components
- Migrate form components
- Migrate modal components

### Week 4: Layout and Navigation
- Migrate layout components
- Migrate navigation components
- Update page layouts

### Week 5: Polish and Testing
- Migrate utility components
- Comprehensive testing
- Documentation updates

---

**Status**: 📋 **PLANNING COMPLETE** - Ready for implementation phase

This plan provides a comprehensive approach to migrating all PingOne UI apps to use Bootstrap classes, ensuring consistency, maintainability, and improved developer experience while preserving the existing PingOne design system aesthetics.
