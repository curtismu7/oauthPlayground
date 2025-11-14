# ComprehensiveCredentialsService Usage Standards

## 🚨 CRITICAL: This document MUST be followed to prevent breaking changes

### ✅ CORRECT Usage Pattern (Unified API)

```tsx
<ComprehensiveCredentialsService
  // REQUIRED: Unified credentials API
  credentials={credentials}
  onCredentialsChange={(updatedCredentials) => {
    setCredentials(updatedCredentials);
    controller.setCredentials(updatedCredentials);
  }}
  
  // OPTIONAL: Discovery
  onDiscoveryComplete={(result) => {
    // Handle discovery results
  }}
  
  // OPTIONAL: Save handlers
  onSave={handleSave}
  onSaveCredentials={handleSaveCredentials}
  
  // OPTIONAL: Field visibility
  showRedirectUri={true}
  showPostLogoutRedirectUri={true}
  showLoginHint={true}
  
  // OPTIONAL: Flow configuration
  flowType="implicit-oauth-v7"
  requireClientSecret={false}
  showConfigChecker={true}
/>
```

### ❌ FORBIDDEN Usage Pattern (Mixed API)

```tsx
// NEVER DO THIS - Causes circular dependencies and input field issues
<ComprehensiveCredentialsService
  // ❌ DON'T: Mix unified API with individual props
  credentials={credentials}
  onCredentialsChange={handleChange}
  
  // ❌ DON'T: Use individual props when using unified API
  environmentId={credentials.environmentId}
  clientId={credentials.clientId}
  onEnvironmentIdChange={handleEnvChange}
  onClientIdChange={handleClientChange}
/>
```

### 🔧 Root Cause Analysis

The character deletion/repetition issue was caused by:

1. **Circular Dependencies**: `applyCredentialUpdates` had `resolvedCredentials` in its dependency array
2. **Mixed API Usage**: Flows using both unified `credentials` prop AND individual props
3. **Function Recreation**: `useCallback` dependencies caused function recreation on every credential change
4. **Input Focus Loss**: Function recreation caused input fields to lose focus and repeat characters

### 🛡️ Protection Mechanisms

#### 1. Code Review Checklist

Before any changes to `ComprehensiveCredentialsService`:

- [ ] Does the change maintain the unified API pattern?
- [ ] Are there any new dependencies in `useCallback` that could cause circular updates?
- [ ] Does the change preserve input field stability?
- [ ] Are all flows using the correct pattern?

#### 2. Automated Testing

```typescript
// Test for proper usage patterns
describe('ComprehensiveCredentialsService Usage', () => {
  it('should not use mixed API patterns', () => {
    // Test that flows don't use both unified and individual APIs
  });
  
  it('should maintain input field stability', () => {
    // Test that typing in fields doesn't cause character repetition
  });
  
  it('should not have circular dependencies', () => {
    // Test that useCallback dependencies don't cause infinite loops
  });
});
```

#### 3. Flow-Specific Standards

##### Implicit Flow V7
```tsx
// ✅ CORRECT
<ComprehensiveCredentialsService
  credentials={credentials}
  onCredentialsChange={(updated) => {
    setCredentials(updated);
    controller.setCredentials(updated);
  }}
  flowType={`implicit-${selectedVariant}-v7`}
  requireClientSecret={false}
  showRedirectUri={true}
  showPostLogoutRedirectUri={true}
  showLoginHint={true}
/>
```

##### OAuth Authorization Code Flow V7
```tsx
// ✅ CORRECT
<ComprehensiveCredentialsService
  credentials={controller.credentials}
  onCredentialsChange={(updated) => {
    controller.setCredentials(updated);
  }}
  flowType="authorization-code-v7"
  requireClientSecret={true}
  showRedirectUri={true}
  showPostLogoutRedirectUri={true}
  showLoginHint={true}
/>
```

##### CIBA Flow V7
```tsx
// ✅ CORRECT
<ComprehensiveCredentialsService
  credentials={formData}
  onCredentialsChange={(updated) => {
    setFormData(prev => ({ ...prev, ...updated }));
  }}
  flowType="ciba-v7"
  requireClientSecret={true}
/>
```

### 🚨 Emergency Recovery

If input field issues occur again:

1. **Check `applyCredentialUpdates` dependencies** - Remove `resolvedCredentials` if present
2. **Verify unified API usage** - Ensure flows use ONLY `credentials` + `onCredentialsChange`
3. **Remove individual props** - Don't mix individual props with unified API
4. **Test input stability** - Verify typing doesn't cause character repetition

### 📋 Migration Checklist

For existing flows using individual props:

- [ ] Remove all individual credential props (`environmentId`, `clientId`, etc.)
- [ ] Remove all individual change handlers (`onEnvironmentIdChange`, etc.)
- [ ] Add unified `credentials` prop
- [ ] Add unified `onCredentialsChange` handler
- [ ] Test input field stability
- [ ] Verify credential persistence

### 🔍 Debugging Guide

If issues persist:

1. **Check Console**: Look for circular dependency warnings
2. **Inspect Dependencies**: Verify `useCallback` dependencies are minimal
3. **Test Input Fields**: Type in each field to verify stability
4. **Check Patterns**: Ensure flows follow the unified API pattern

---

**⚠️ WARNING**: Any deviation from these standards will cause input field instability and character repetition issues. This document must be updated if new patterns are discovered.
