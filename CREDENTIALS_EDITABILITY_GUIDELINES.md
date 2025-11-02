# Credentials Editability Guidelines

## Problem Statement
Client credentials fields have become non-editable multiple times (10+ occurrences), causing significant user experience issues. This document establishes guidelines to prevent this from happening again.

## Root Causes Identified
1. **Inconsistent disabled/readOnly prop usage** - Some fields used props while others were hardcoded
2. **useGlobalDefaults logic** - FlowCredentials component disabled all fields when useGlobalDefaults was true
3. **Missing validation** - No checks to ensure fields remain editable
4. **Inconsistent patterns** - Different components used different approaches

## Fixed Components
- ✅ `CredentialsInput.tsx` - Removed disabled/readOnly props, hardcoded to false
- ✅ `FlowCredentials.tsx` - Removed useGlobalDefaults disabled logic
- ✅ `WorkerTokenCredentialsInput.tsx` - Hardcoded disabled to false

## Guidelines for Future Development

### 1. Credential Fields Must Always Be Editable
```typescript
// ✅ CORRECT - Always editable
<Input
  value={value}
  onChange={handleChange}
  disabled={false}
  readOnly={false}
/>

// ❌ WRONG - Using props that can disable fields
<Input
  value={value}
  onChange={handleChange}
  disabled={someCondition}
  readOnly={someCondition}
/>
```

### 2. Never Use Conditional Disabling for Credential Fields
```typescript
// ❌ WRONG - This can make fields non-editable
disabled={useGlobalDefaults}
disabled={isLoading}
disabled={someCondition}

// ✅ CORRECT - Only disable for specific UI states
disabled={!hasValue} // Only for copy buttons
disabled={isSaving} // Only for save buttons
```

### 3. If Fields Must Be Disabled, Use Explicit Intent
```typescript
// ✅ CORRECT - Explicit intent with clear naming
disabled={isReadOnlyMode}
disabled={isViewOnly}
disabled={isLocked}

// ❌ WRONG - Generic conditions
disabled={someCondition}
disabled={useGlobalDefaults}
```

### 4. Add Validation Tests
```typescript
// Add tests to ensure fields remain editable
it('should keep credential fields editable', () => {
  render(<CredentialsComponent />);
  const inputs = screen.getAllByRole('textbox');
  inputs.forEach(input => {
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute('readonly');
  });
});
```

### 5. Component Interface Guidelines
```typescript
// ❌ WRONG - Props that can disable fields
interface CredentialsProps {
  disabled?: boolean;
  readOnly?: boolean;
}

// ✅ CORRECT - Explicit intent props
interface CredentialsProps {
  isReadOnlyMode?: boolean;
  isViewOnly?: boolean;
  isLocked?: boolean;
}
```

## Prevention Checklist
- [ ] All credential input fields have `disabled={false}` and `readOnly={false}`
- [ ] No conditional disabling based on generic conditions
- [ ] Copy buttons only disabled when no value present
- [ ] Save buttons only disabled when saving
- [ ] Tests verify fields remain editable
- [ ] Component interfaces use explicit intent props

## Emergency Fix Pattern
If fields become non-editable again:

1. **Immediate Fix**: Search for `disabled={` and `readOnly={` in credential components
2. **Replace with**: `disabled={false}` and `readOnly={false}`
3. **Test**: Verify all fields are editable
4. **Root Cause**: Identify what condition caused the disabling
5. **Prevention**: Add test to prevent recurrence

## Monitoring
- Regular audits of credential components
- User feedback monitoring for editability issues
- Automated tests for field editability
- Code review checklist inclusion

## Last Updated
2025-01-27 - Initial guidelines created after fixing 10+ occurrences



