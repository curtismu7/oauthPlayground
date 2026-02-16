# SWE-15 Protect Portal Development Guide

**Last Updated**: February 11, 2026  
**Version**: 1.0.0  
**Purpose**: SWE-15 compliance guide for Protect Portal development

---

## 🎯 SWE-15 Principles for Protect Portal

### 1. Single Responsibility Principle
- **Component Focus**: Each Protect Portal component should have a single, well-defined responsibility
- **Service Separation**: Clear separation between authentication, risk evaluation, and UI components
- **Theme Management**: Theme switching should be handled by a dedicated theme provider

### 2. Open/Closed Principle  
- **Theme Extension**: Allow addition of new company themes without modifying existing components
- **Flow Configuration**: Behavior modification through configuration, not code changes
- **Component Composition**: Build complex pages from simple, reusable components

### 3. Liskov Substitution Principle
- **Theme Interface**: All company themes should follow the same interface contract
- **Component Consistency**: Hero components should be substitutable across different companies
- **Flow Compatibility**: All authentication flows should follow the same patterns

### 4. Interface Segregation Principle
- **Focused Props**: Components should only receive props they actually use
- **Theme-Specific**: Separate interfaces for different theme requirements
- **Minimal Dependencies**: Components should depend only on interfaces they use

### 5. Dependency Inversion Principle
- **Theme Abstraction**: Components should depend on theme abstractions, not concrete implementations
- **Service Injection**: Authentication and risk services should be injected, not hard-coded
- **Configuration Injection**: All configuration should be injected from external sources

---

## 🔍 Before Making Changes

### 1. Reference the Inventory
```bash
# Always check the inventory first
cat PROTECT_PORTAL_INVENTORY.md | grep -A 10 "### Issues"
cat PROTECT_PORTAL_INVENTORY.md | grep -A 5 "####.*Issue"
```

### 2. Understand the Architecture
- **Portal Flow**: Understand the complete portal flow from home to success
- **Theme System**: Know how theme switching and company branding works
- **Component Hierarchy**: Understand parent-child relationships in portal components
- **Data Flow**: Know how data moves through authentication and risk evaluation

### 3. Check Dependencies
```bash
# Find what imports a component
grep -r "import.*ProtectPortalApp" src/pages/protect-portal/
grep -r "import.*CompanyHeader" src/pages/protect-portal/
```

---

## 🛡️ SWE-15 Best Practices

### **1. Single Responsibility Principle**
- Each component/service has one clear purpose
- Don't mix UI logic with business logic
- Keep functions focused and testable

### **2. Open/Closed Principle**
- Extend functionality without modifying existing code
- Use composition over inheritance
- Add new company themes without changing base framework

### **3. Liskov Substitution**
- New components should work as drop-in replacements
- Maintain interface contracts
- Don't break expected behavior

### **4. Interface Segregation**
- Keep interfaces focused and minimal
- Don't force clients to depend on unused methods
- Use specific props for specific needs

### **5. Dependency Inversion**
- Depend on abstractions, not concretions
- Inject dependencies rather than creating them internally
- Use configuration to drive behavior

---

## 🎯 Key Components

### **Portal Application**
- **ProtectPortalApp**: Main application component managing state and flow
- **ProtectPortalWrapper**: Configuration wrapper for real credentials
- **PortalPageLayout**: Consistent layout wrapper for portal pages

### **Authentication Components**
- **CustomLoginForm**: Embedded PingOne login implementation
- **CompanySelector**: Company selection and theme switching
- **MFAAuthenticationFlow**: Multi-factor authentication integration

### **Company Themes**
- **AmericanAirlinesHero**: American Airlines branded experience
- **SouthwestAirlinesHero**: Southwest Airlines branded experience  
- **FedExAirlinesHero**: FedEx branded experience

### **Risk & Success**
- **RiskEvaluationDisplay**: Risk assessment results and visualization
- **PortalSuccess**: Success page with token display and options
- **PortalStats**: Statistics and analytics dashboard

---

## 🔧 Development Guidelines

### **Theme Development**
1. **Follow Theme Interface**: All themes must implement the BrandTheme interface
2. **Use Theme Provider**: Access theme through useBrandTheme hook
3. **Responsive Design**: Ensure themes work across all device sizes
4. **Brand Consistency**: Match real company branding and user experience

### **Authentication Flow**
1. **Embedded Login**: Use PingOne embedded login for seamless experience
2. **Error Handling**: Provide clear error messages and recovery options
3. **Loading States**: Show appropriate loading indicators during authentication
4. **Risk Integration**: Integrate risk evaluation seamlessly into flow

### **Component Development**
1. **Props Interface**: Define clear TypeScript interfaces for all props
2. **Error Boundaries**: Wrap components in error boundaries for graceful failure
3. **Accessibility**: Include proper ARIA labels and keyboard navigation
4. **Performance**: Use React.memo and useMemo for optimization

---

## 🚨 Common Pitfalls to Avoid

### **Theme Issues**
- **Don't hard-code colors**: Always use theme variables
- **Don't skip responsive design**: Test on all screen sizes
- **Don't ignore brand guidelines**: Follow actual company branding
- **Don't mix concerns**: Keep theme logic separate from business logic

### **Authentication Issues**
- **Don't store credentials**: Never store passwords or secrets in frontend
- **Don't ignore errors**: Handle all authentication errors gracefully
- **Don't skip validation**: Validate all user inputs
- **Don't break flow**: Maintain smooth progression through authentication steps

### **Component Issues**
- **Don't create monoliths**: Break large components into smaller ones
- **Don't ignore TypeScript**: Use proper typing for all props and state
- **Don't forget accessibility**: Include ARIA labels and keyboard support
- **Don't skip testing**: Write tests for critical functionality

---

## 📋 Quality Checklist

### **Before Committing**
- [ ] All TypeScript errors resolved
- [ ] All linting issues fixed
- [ ] Components follow SWE-15 principles
- [ ] Themes are responsive and accessible
- [ ] Authentication flow works end-to-end
- [ ] Error handling is comprehensive
- [ ] No console errors or warnings

### **Before Release**
- [ ] All company themes tested
- [ ] Risk evaluation integration verified
- [ ] Mobile responsiveness confirmed
- [ ] Accessibility audit passed
- [ ] Performance optimization completed
- [ ] Security review completed
- [ ] Documentation updated

---

## 🔍 Prevention Commands

```bash
# Check for SWE-15 compliance issues
echo "=== Checking Protect Portal SWE-15 Compliance ==="

# 1. Check for component responsibility violations
grep -rn "console\.log" src/pages/protect-portal/ --include="*.tsx" --include="*.ts" | wc -l

# 2. Check for theme usage violations
grep -rn "#[0-9A-Fa-f]{6}" src/pages/protect-portal/ --include="*.tsx" --include="*.ts"

# 3. Check for authentication security issues
grep -rn "password\|secret\|token" src/pages/protect-portal/ --include="*.tsx" --include="*.ts" | grep -v "workerToken\|userToken"

# 4. Check for accessibility issues
grep -rn "onClick.*div" src/pages/protect-portal/ --include="*.tsx" --include="*.ts"

# 5. Check for TypeScript issues
npx tsc --noEmit src/pages/protect-portal/ --skipLibCheck

echo "🎯 PROTECT PORTAL SWE-15 COMPLIANCE CHECKS COMPLETE"
```

---

## 📚 Additional Resources

### **Documentation**
- [PROTECT_PORTAL_INVENTORY.md](./PROTECT_PORTAL_INVENTORY.md) - Complete issue tracking and prevention
- [PingOne Protect Documentation](https://docs.pingidentity.com/pingone/protect/v1/api/) - API reference
- [React Accessibility Guide](https://reactjs.org/docs/accessibility.html) - ARIA and keyboard navigation

### **Tools & Utilities**
- **Theme Validator**: Ensures themes follow brand guidelines
- **Flow Tester**: Tests complete authentication flows
- **Performance Monitor**: Tracks component rendering performance
- **Accessibility Auditor**: Validates WCAG compliance

---

**Remember**: Always reference the PROTECT_PORTAL_INVENTORY.md before making changes to avoid introducing regressions and to understand where issues commonly arise.
