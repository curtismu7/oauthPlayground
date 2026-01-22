# Production Group UI Contract

## Overview

This document defines the UI contract and design specifications for all flows in the **Production Group** section. It ensures consistency, accessibility, and user experience standards across all production-ready flows.

## 📋 Table of Contents

- [Design Principles](#design-principles)
- [Common UI Components](#common-ui-components)
- [Layout Specifications](#layout-specifications)
- [Color Scheme](#color-scheme)
- [Typography](#typography)
- [Responsive Design](#responsive-design)
- [Accessibility Requirements](#accessibility-requirements)
- [Error Handling](#error-handling)
- [Loading States](#loading-states)
- [Form Validation](#form-validation)

---

## 🎨 Design Principles

### 1. Consistency
- **Unified Design Language**: Consistent components across all flows
- **Predictable Interactions**: Users can anticipate behavior
- **Visual Hierarchy**: Clear information architecture
- **Brand Alignment**: Follow PingOne brand guidelines

### 2. Accessibility
- **WCAG 2.1 AA Compliance**: Meet accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels
- **Color Contrast**: Minimum 4.5:1 contrast ratios

### 3. Performance
- **Fast Loading**: Optimized for quick interactions
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Mobile First**: Responsive design for all devices
- **Efficient Animations**: Smooth 60fps animations

### 4. Security
- **Secure Data Handling**: Proper input sanitization
- **Token Protection**: Secure token storage and transmission
- **Error Prevention**: Validation before submission
- **Audit Trail**: Comprehensive logging

---

## 🧩 Common UI Components

### Header Components
```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'new' | 'experimental' | 'mock' | 'utility';
  };
  actions?: React.ReactNode;
}
```

#### Specifications
- **Height**: 64px fixed height
- **Background**: Linear gradient from `#1e40af` to `#3730a3`
- **Text Color**: White (`#ffffff`)
- **Padding**: 0 24px
- **Border Radius**: 0 (full width)

### Form Components
```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  type: 'text' | 'password' | 'email' | 'select' | 'textarea';
}
```

#### Specifications
- **Label Size**: 14px, font weight 600
- **Label Color**: `#374151`
- **Input Height**: 40px
- **Border**: 1px solid `#d1d5db`
- **Focus Border**: 2px solid `#3b82f6`
- **Error Border**: 2px solid `#ef4444`
- **Background**: `#ffffff`

### Button Components
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
```

#### Specifications
- **Primary**: Background `#3b82f6`, text `#ffffff`
- **Secondary**: Background `#f3f4f6`, text `#374151`
- **Danger**: Background `#ef4444`, text `#ffffff`
- **Ghost**: Background transparent, text `#3b82f6`
- **Border Radius**: 6px
- **Font Weight**: 500

---

## 📐 Layout Specifications

### Container Structure
```typescript
interface LayoutProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  padding?: string;
  center?: boolean;
}
```

#### Standard Layout
- **Max Width**: 1200px (xl)
- **Padding**: 24px
- **Margin**: 0 auto
- **Background**: `#f9fafb`

### Card Components
```typescript
interface CardProps {
  elevated?: boolean;
  bordered?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}
```

#### Specifications
- **Background**: `#ffffff`
- **Border**: 1px solid `#e5e7eb`
- **Border Radius**: 8px
- **Box Shadow**: `0 1px 3px 0 rgba(0, 0, 0, 0.1)`
- **Padding**: 24px (default)

### Grid Layout
```typescript
interface GridProps {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg';
}
```

#### Responsive Grid
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns
- **Large**: 4 columns

---

## 🎨 Color Scheme

### Primary Colors
```css
:root {
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
}
```

### Semantic Colors
```css
:root {
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### Usage Guidelines
- **Primary Actions**: Use `--primary-500`
- **Secondary Actions**: Use `--gray-500`
- **Success States**: Use `--success`
- **Error States**: Use `--error`
- **Warnings**: Use `--warning`

---

## 🔤 Typography

### Font Scale
```css
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
```

### Font Weights
```css
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Typography Hierarchy
- **H1**: `--text-3xl`, `--font-bold`, `--gray-900`
- **H2**: `--text-2xl`, `--font-semibold`, `--gray-800`
- **H3**: `--text-xl`, `--font-semibold`, `--gray-700`
- **H4**: `--text-lg`, `--font-medium`, `--gray-600`
- **Body**: `--text-base`, `--font-normal`, `--gray-700`
- **Small**: `--text-sm`, `--font-normal`, `--gray-600`

---

## 📱 Responsive Design

### Breakpoints
```css
:root {
  --breakpoint-sm: 640px;   /* Small tablets */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Small desktops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large desktops */
}
```

### Mobile First Approach
- **Base Styles**: Mobile-first CSS
- **Progressive Enhancement**: Add complexity for larger screens
- **Touch Targets**: Minimum 44px touch targets
- **Readable Text**: Minimum 16px font size

### Responsive Patterns
- **Stacking**: Mobile: vertical, Desktop: horizontal
- **Navigation**: Mobile: hamburger, Desktop: inline
- **Cards**: Mobile: full width, Desktop: grid
- **Forms**: Mobile: stacked, Desktop: inline

---

## ♿ Accessibility Requirements

### ARIA Labels
```typescript
interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}
```

### Keyboard Navigation
- **Tab Order**: Logical tab sequence
- **Focus Indicators**: Visible focus states
- **Skip Links**: Skip to main content
- **Keyboard Shortcuts**: Common shortcuts available

### Screen Reader Support
- **Alternative Text**: Meaningful alt text
- **Heading Structure**: Proper heading hierarchy
- **Form Labels**: Associated with inputs
- **Error Messages**: Linked to form fields

### Color Contrast
- **Normal Text**: 4.5:1 minimum contrast
- **Large Text**: 3:1 minimum contrast
- **Interactive Elements**: Enhanced contrast
- **Error States**: High contrast indicators

---

## ⚠️ Error Handling

### Error Display
```typescript
interface ErrorDisplayProps {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  dismissible?: boolean;
  actions?: React.ReactNode[];
}
```

### Error States
- **Validation Errors**: Red border and text
- **Network Errors**: Error banner with retry option
- **System Errors**: Full-page error with details
- **Warning States**: Yellow border and icon

### Error Recovery
- **Retry Mechanisms**: Automatic retry for transient errors
- **User Guidance**: Clear instructions for resolution
- **Fallback Options**: Alternative paths when possible
- **Error Logging**: Comprehensive error tracking

---

## ⏳ Loading States

### Loading Indicators
```typescript
interface LoadingProps {
  type: 'spinner' | 'skeleton' | 'progress';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
}
```

### Loading Patterns
- **Spinners**: For short operations (< 3 seconds)
- **Skeletons**: For content loading
- **Progress Bars**: For multi-step processes
- **Overlay Loading**: For blocking operations

### Loading Messages
- **Specific Messages**: Describe what's loading
- **Time Estimates**: Provide duration estimates
- **Progress Indicators**: Show completion status
- **Cancellation Options**: Allow cancellation when possible

---

## ✅ Form Validation

### Validation States
```typescript
interface ValidationState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}
```

### Validation Timing
- **On Blur**: Validate when user leaves field
- **On Change**: Real-time validation for immediate feedback
- **On Submit**: Validate entire form before submission
- **Debounced**: Delay validation for typing fields

### Error Display
- **Inline Errors**: Show below each field
- **Summary Errors**: Show at form top
- **Field Highlighting**: Red border for invalid fields
- **Helper Text**: Contextual help messages

---

## 🎯 Flow-Specific Requirements

### Unified OAuth & OIDC Flow
- **Flow Selector**: Clear flow type selection
- **PKCE Toggle**: Automatic PKCE for public clients
- **Security Scorecard**: Real-time security feedback
- **Token Display**: Secure token information display

### SPIFFE/SPIRE Mock Flow
- **Mock Indicators**: Clear mock flow identification
- **Educational Content**: Learning materials included
- **Step-by-Step**: Clear progression indicators
- **Real-World Examples**: Production implementation notes

### PingOne MFA Flow
- **Method Selection**: Clear MFA method choice
- **Device Management**: Device registration interface
- **One-Time Devices**: Temporary device handling
- **Multi-Method Support**: Seamless method switching

### Utility Flows
- **Confirmation Dialogs**: Multiple confirmation steps
- **Filter Options**: Granular filtering controls
- **Bulk Operations**: Batch operation support
- **Audit Trail**: Operation history tracking

---

## 📚 Implementation Guidelines

### Component Library
- **Styled Components**: Use styled-components for styling
- **Design Tokens**: Centralized design variables
- **Component Props**: Consistent prop interfaces
- **Theme Support**: Dark/light theme capability

### Code Standards
- **TypeScript**: Full type safety
- **ESLint**: Consistent code formatting
- **Prettier**: Automated code formatting
- **Testing**: Component unit tests

### Performance Optimization
- **Code Splitting**: Lazy load components
- **Memoization**: Optimize re-renders
- **Bundle Optimization**: Minimize bundle size
- **Image Optimization**: Optimize image loading

---

## 📝 Version Information

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-22  
**Status:** Active for Production Group flows

### Version History
- **v1.0.0**: Initial UI contract for Production Group
- **v0.9.0**: Beta testing feedback incorporation
- **v0.8.0**: Alpha release with core components

---

*This UI contract ensures consistency and quality across all Production Group flows. For specific implementation details, refer to individual component documentation and design specifications.*
