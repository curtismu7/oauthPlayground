# SWE-15 Unified MFA Development Guide

## 🎯 Purpose
This guide provides Software Engineering Best Practices (SWE-15) for working with the Unified MFA implementation to maintain code quality, avoid breaking changes, and ensure consistency.

## 🔍 Before Making Changes

### 1. Reference the Inventory
```bash
# Always check the inventory first
cat UNIFIED_MFA_INVENTORY.md | grep -A 10 "### Services"
cat UNIFIED_MFA_INVENTORY.md | grep -A 5 "####.*Flow"
```

### 2. Understand the Architecture
- **5-Step Framework**: Don't modify the base step structure
- **Service Layer**: Use existing services before creating new ones
- **Component Hierarchy**: Understand parent-child relationships
- **Data Flow**: Know how data moves through the system

### 3. Check Dependencies
```bash
# Find what imports a component
grep -r "import.*UnifiedMFARegistrationFlowV8_Legacy" src/v8/
grep -r "import.*UnifiedDeviceRegistrationForm" src/v8/
```

## 🛡️ SWE-15 Best Practices

### **1. Single Responsibility Principle**
- Each component/service has one clear purpose
- Don't mix UI logic with business logic
- Keep functions focused and testable

### **2. Open/Closed Principle**
- Extend functionality without modifying existing code
- Use composition over inheritance
- Add new device types without changing base framework

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
- Use dependency injection for services
- Make components testable

## 📝 Code Standards

### **File Naming**
```
✅ Good: UnifiedDeviceRegistrationForm.tsx
✅ Good: mfaServiceV8.ts
✅ Good: useMFAPolicies.ts
❌ Bad: unifiedDeviceForm.tsx
❌ Bad: service.ts
❌ Bad: hooks.ts
```

### **Component Structure**
```typescript
// ✅ Good: Clear props interface
interface UnifiedDeviceRegistrationFormProps {
  onSubmit: (deviceType: DeviceConfigKey, fields: Record<string, string>, flowType: FlowType) => void;
  onCancel: () => void;
  tokenStatus: TokenStatusInfo;
  username?: string;
}

// ✅ Good: Clear component documentation
/**
 * Unified device registration form for all MFA device types
 * Supports admin and user flows with proper validation
 */
export const UnifiedDeviceRegistrationForm: React.FC<UnifiedDeviceRegistrationFormProps> = ({
  onSubmit,
  onCancel,
  tokenStatus,
  username,
}) => {
  // Implementation
};
```

### **Service Pattern**
```typescript
// ✅ Good: Service class with static methods
export class MFAServiceV8 {
  static async registerDevice(params: RegisterDeviceParams): Promise<DeviceRegistrationResult> {
    // Implementation
  }
  
  static async lookupUserByUsername(environmentId: string, username: string): Promise<User> {
    // Implementation
  }
}
```

## 🔄 Change Management

### **Before Changes**
1. **Read the inventory** - Understand the component's role
2. **Search for usages** - `grep -r "ComponentName" src/`
3. **Check tests** - Look for existing test files
4. **Review interfaces** - Understand prop contracts

### **During Development**
1. **Follow patterns** - Match existing code style
2. **Use services** - Don't duplicate functionality
3. **Maintain contracts** - Keep interfaces stable
4. **Add logging** - Use consistent log format

### **After Changes**
1. **Update inventory** - Add new files/components
2. **Run tests** - Ensure no regressions
3. **Check flows** - Test affected device types
4. **Document changes** - Update relevant sections

## 🧪 Testing Guidelines

### **Unit Tests**
```typescript
// ✅ Test service methods
describe('MFAServiceV8', () => {
  it('should register SMS device', async () => {
    const result = await MFAServiceV8.registerDevice({
      environmentId: 'test-env',
      username: 'test@example.com',
      type: 'SMS',
      phone: '+1234567890'
    });
    expect(result.status).toBe('ACTIVE');
  });
});
```

### **Integration Tests**
- Test complete device flows
- Verify API integration
- Test error handling
- Validate state management

### **Regression Tests**
- Test existing functionality after changes
- Verify all device types still work
- Check edge cases and error scenarios

## 🚨 Common Pitfalls to Avoid

### **❌ Don't Do This**
- Modify the 5-step framework (MFAFlowBaseV8)
- Break existing prop interfaces
- Remove functionality without deprecation
- Hard-code values that should be configurable
- Mix concerns (UI + business logic)
- Skip error handling

### **✅ Do This Instead**
- Extend existing components
- Use composition for new features
- Add new services for new functionality
- Keep interfaces backward compatible
- Follow existing patterns
- Handle errors gracefully

## 🔧 Development Workflow

### **1. Analysis Phase**
```bash
# 1. Read inventory
cat UNIFIED_MFA_INVENTORY.md

# 2. Find related files
find src/v8 -name "*MFA*" | grep -i "component\|service\|hook"

# 3. Check dependencies
grep -r "import.*ComponentName" src/v8/
```

### **2. Implementation Phase**
```bash
# 1. Create/modify file
# 2. Follow existing patterns
# 3. Add proper logging
# 4. Handle errors
```

### **3. Verification Phase**
```bash
# 1. Run tests
npm test -- --testPathPattern=".*MFA.*"

# 2. Check linting
npm run lint

# 3. Test affected flows
# Manual testing of device types
```

### **4. Documentation Phase**
```bash
# 1. Update inventory
# 2. Add new files to structure
# 3. Document new functionality
# 4. Update change log
```

## 📋 Quick Reference Commands

### **Search Commands**
```bash
# Find all MFA files
find src/v8 -name "*MFA*" -type f

# Search for specific device type
grep -r "SMS\|EMAIL\|TOTP\|FIDO2" src/v8/flows/unified/

# Find service usage
grep -r "MFAServiceV8\|useMFAPolicies\|useMFADevices" src/v8/

# Check imports
grep -r "from.*UnifiedMFA" src/v8/
```

### **Validation Commands**
```bash
# Check TypeScript
npx tsc --noEmit

# Run tests
npm test

# Check linting
npm run lint

# Build verification
npm run build
```

## 🎯 Decision Framework

### **Before Adding New Code**
1. **Does it exist?** - Check existing services/components
2. **Can it be extended?** - Modify existing instead of creating new
3. **Is it breaking?** - Will it change existing behavior?
4. **Is it testable?** - Can we verify it works?

### **When Creating New Components**
1. **Follow naming conventions**
2. **Use existing patterns**
3. **Add proper TypeScript types**
4. **Include comprehensive logging**
5. **Write tests**

### **When Modifying Existing Code**
1. **Understand the current behavior**
2. **Check all usages**
3. **Maintain backward compatibility**
4. **Add deprecation warnings if needed**
5. **Update documentation**

## 📞 Getting Help

### **Reference the Inventory First**
- Always check `UNIFIED_MFA_INVENTORY.md` before making changes
- Use it to understand the architecture and dependencies
- Update it when you make changes

### **Ask Questions**
- "What component should I use for this?"
- "Is there an existing service for this functionality?"
- "Will this change break existing flows?"

### **Review Process**
- Have another developer review changes
- Check against SWE-15 principles
- Ensure inventory is updated

## 🔄 Continuous Improvement

### **Regular Reviews**
- Quarterly review of the inventory
- Update with new patterns and best practices
- Remove outdated information

### **Knowledge Sharing**
- Document lessons learned
- Share new patterns with team
- Keep the inventory current

This guide ensures we maintain high-quality, maintainable code while following SWE-15 best practices for the Unified MFA implementation.
