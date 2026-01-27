# UI Contract: Step Navigator Components

## 📋 **CONTRACT OVERVIEW**

This document defines the UI contract for step navigator components in the OAuth Playground V8U architecture. It ensures consistent behavior, appearance, and accessibility across all flows.

## 🎯 **DESIGN PRINCIPLES**

### **1. Always Visible Navigation**
- Step navigator buttons MUST always be visible regardless of content state
- Navigation should never be conditionally hidden based on compliance errors
- Content can be blocked, but navigation must remain accessible

### **2. Consistent User Experience**
- Same button styles, labels, and behavior across all flows
- Predictable navigation patterns and interactions
- Clear visual feedback for disabled/active states

### **3. Accessibility First**
- Full keyboard navigation support
- Screen reader compatibility
- High contrast and clear visual indicators
- Proper ARIA labels and roles

### **4. Responsive Design**
- Works on all screen sizes and devices
- Touch-friendly button sizes and spacing
- Adaptive layouts for mobile and desktop

## 🎨 **VISUAL SPECIFICATIONS**

### **Button Styles**
```css
.step-navigation-buttons-v8u .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 2.5rem;
  min-width: 4rem;
}

.step-navigation-buttons-v8u .btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.step-navigation-buttons-v8u .btn:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
  border-color: #e5e7eb;
}
```

### **Button Variants**

#### **Previous Button**
- **Color**: Gray theme (#374151)
- **Icon**: Left arrow (←)
- **Label**: "Previous"
- **Position**: Left side

#### **Next Button**
- **Color**: Green theme (#10b981)
- **Icon**: Right arrow (→)
- **Label**: "Next"
- **Position**: Right side

#### **Restart Button**
- **Color**: Red theme (#ef4444)
- **Icon**: Refresh (🔄)
- **Label**: "Restart Flow"
- **Position**: Right side, before Next button

### **Container Layout**
```css
.step-navigation-buttons-v8u {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  margin-top: auto;
  gap: 0.5rem;
}
```

### **Step Indicator**
```css
.step-indicator {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
}
```

## 🔧 **COMPONENT CONTRACTS**

### **StepNavigationButtonsV8U Component**

#### **Required Props**
```typescript
interface StepNavigationButtonsV8UProps {
  // Navigation state
  totalSteps?: number;           // Total number of steps in flow
  currentStep?: number;          // Current step index (0-based)
  onStepChange?: (step: number) => void;  // Navigation callback
  onFlowReset?: () => void;      // Reset flow callback
  
  // Control props
  disabled?: boolean;            // Disable all navigation
  showPrevious?: boolean;        // Show/hide previous button
  showNext?: boolean;            // Show/hide next button
  showRestart?: boolean;         // Show/hide restart button
  showStepIndicator?: boolean;   // Show/hide step indicator
  
  // Customization
  previousLabel?: string;        // Custom previous button label
  nextLabel?: string;            // Custom next button label
  restartLabel?: string;         // Custom restart button label
  previousIcon?: React.ReactNode; // Custom previous icon
  nextIcon?: React.ReactNode;     // Custom next icon
  restartIcon?: React.ReactNode;  // Custom restart icon
  
  // Styling
  containerStyle?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  indicatorStyle?: React.CSSProperties;
  className?: string;
}
```

#### **Default Behavior**
- **Previous**: Disabled on first step, enabled otherwise
- **Next**: Disabled on last step, enabled otherwise
- **Restart**: Always enabled unless explicitly disabled
- **Step Indicator**: Shows "Step X of Y" format

#### **Accessibility Requirements**
- All buttons must have `title` attributes
- Proper `tabindex` management
- `aria-disabled` for disabled states
- `aria-label` for screen readers

### **UnifiedFlowSteps Component**

#### **Block Content Pattern**
```typescript
interface UnifiedFlowStepsProps {
  // ... existing props
  blockContent?: boolean;  // Controls content visibility
}
```

#### **Behavior Contract**
- When `blockContent=true`: Main content hidden, navigation visible
- When `blockContent=false`: Both content and navigation visible
- Navigation buttons ALWAYS visible regardless of `blockContent`

## 🎯 **USAGE PATTERNS**

### **Standard Flow Integration**
```typescript
<UnifiedFlowSteps
  specVersion={specVersion}
  flowType={flowType}
  credentials={credentials}
  onCredentialsChange={handleCredentialsChange}
  blockContent={complianceErrors.length > 0}
  onFlowReset={handleFlowReset}
/>
```

### **Custom Navigation Component**
```typescript
<StepNavigationButtonsV8U
  totalSteps={totalSteps}
  currentStep={currentStep}
  onStepChange={navigateToStep}
  onFlowReset={resetFlow}
  disabled={isBlocked}
  showRestart={true}
  nextLabel="Continue →"
  previousLabel="← Back"
/>
```

### **Minimal Navigation**
```typescript
<StepNavigationButtonsV8U
  totalSteps={3}
  currentStep={step}
  onStepChange={setStep}
  showRestart={false}
  showStepIndicator={false}
/>
```

## 🔄 **STATE MANAGEMENT**

### **Service Integration**
```typescript
// Use the centralized service for consistent state
const navigator = useStepNavigator({
  totalSteps: 5,
  initialStep: 0,
  onStepChange: (step) => console.log('Navigated to:', step),
  onFlowReset: () => console.log('Flow reset')
});
```

### **State Validation**
```typescript
// Always validate navigation state
const validation = navigator.validateNavigationState();
if (!validation.isValid) {
  console.error('Navigation state invalid:', validation.errors);
}
```

## 🎨 **THEMING AND CUSTOMIZATION**

### **CSS Custom Properties**
```css
.step-navigation-buttons-v8u {
  --nav-bg-color: #f8fafc;
  --nav-border-color: #e2e8f0;
  --nav-text-color: #374151;
  --nav-disabled-color: #9ca3af;
  --nav-primary-color: #10b981;
  --nav-danger-color: #ef4444;
  --nav-border-radius: 0.375rem;
  --nav-spacing: 0.5rem;
}
```

### **Dark Mode Support**
```css
.step-navigation-buttons-v8u[data-theme="dark"] {
  --nav-bg-color: #1f2937;
  --nav-border-color: #374151;
  --nav-text-color: #f9fafb;
  --nav-disabled-color: #6b7280;
}
```

## 📱 **RESPONSIVE BEHAVIOR**

### **Mobile (< 768px)**
- Stack buttons vertically
- Larger touch targets (44px minimum)
- Simplified labels
- Full-width buttons

### **Tablet (768px - 1024px)**
- Horizontal layout
- Medium-sized buttons
- Full labels visible

### **Desktop (> 1024px)**
- Optimal spacing and sizing
- Hover states and transitions
- Full feature set

## 🧪 **TESTING REQUIREMENTS**

### **Unit Tests**
- Navigation method functionality
- State validation logic
- Prop handling and defaults
- Accessibility attributes

### **Integration Tests**
- Component rendering with different props
- Navigation callbacks execution
- State synchronization
- Error handling

### **Accessibility Tests**
- Keyboard navigation flow
- Screen reader compatibility
- Color contrast validation
- Focus management

### **Visual Tests**
- Button states (normal, hover, disabled, active)
- Layout across screen sizes
- Theme variations
- Cross-browser compatibility

## 📋 **COMPLIANCE CHECKLIST**

### **Before Implementation**
- [ ] Review design specifications
- [ ] Validate accessibility requirements
- [ ] Check cross-browser compatibility
- [ ] Verify responsive behavior

### **During Implementation**
- [ ] Follow component contract exactly
- [ ] Implement proper error handling
- [ ] Add comprehensive logging
- [ ] Include performance optimizations

### **After Implementation**
- [ ] Test all navigation scenarios
- [ ] Validate accessibility compliance
- [ ] Check visual consistency
- [ ] Verify performance impact

## 🚀 **EVOLUTION GUIDELINES**

### **Backward Compatibility**
- Never remove existing props without deprecation
- Maintain default behavior for existing implementations
- Provide migration guides for breaking changes

### **Feature Extensions**
- Add new props as optional with sensible defaults
- Extend service functionality without breaking existing API
- Maintain consistent naming conventions

### **Performance Optimization**
- Lazy load navigation components when possible
- Optimize re-render cycles with proper memoization
- Monitor bundle size impact

---

**Contract Version**: 1.0.0  
**Last Updated**: 2026-01-25  
**Next Review**: 2026-04-25  
**Maintainers**: OAuth Playground Team
