# V8U Field Reorder Plan

**Date:** 2024-11-16  
**Status:** 📋 Plan - Ready to Implement  
**Goal:** Match PingOne Console field order exactly

---

## Current Structure

```
1. ⚡ Configuration & Credentials
   - Environment ID
   - Client ID  
   - Client Secret

2. 🔍 OIDC Discovery (Optional)
   - Issuer URL input
   - Discovery button

3. 🔄 Redirect Configuration
   - Redirect URI

4. 🚪 Logout Configuration
   - Post-Logout Redirect URI

5. 🔐 Permissions
   - Scopes

6. ⚙️ Advanced Configuration (Collapsible)
   - PKCE checkbox
   - Response Type
   - Token Endpoint Authentication Method
   - Refresh Token checkbox
   - Login Hint

7. 📋 Additional Options
   - Other options
```

---

## Target Structure (PingOne Order)

```
1. ⚡ General (Collapsible - Default Open)
   - Environment ID
   - Client ID
   - Client Secret

2. 🔍 OIDC Discovery (Optional - Collapsible)
   - Issuer URL input
   - Discovery button
   - App Picker button

3. ⚙️ OIDC Settings (Collapsible - Default Open)
   - Token Endpoint Authentication Method ← MOVE UP
   - Response Type ← MOVE UP
   - Grant Type (read-only, informational)
   - Redirect URIs ← MOVE HERE
   - Post-Logout Redirect URIs (Sign Off URLs) ← MOVE HERE
   - Scopes ← MOVE HERE

4. 🔧 Advanced Options (Collapsible - Default Closed)
   - PKCE checkbox
   - Refresh Token checkbox
   - Login Hint
   - Other advanced options
```

---

## Changes Required

### 1. Rename "Configuration & Credentials" → "General"
- Keep same fields
- Keep collapsible
- Default: Open

### 2. Create New "OIDC Settings" Section
- Move Token Endpoint Authentication Method from Advanced
- Move Response Type from Advanced
- Add Grant Type (read-only, based on flow)
- Move Redirect URI from separate section
- Move Post-Logout Redirect URI from separate section
- Move Scopes from separate section
- Default: Open

### 3. Simplify "Advanced Options"
- Keep PKCE checkbox
- Keep Refresh Token checkbox
- Keep Login Hint
- Remove Token Auth Method (moved to OIDC Settings)
- Remove Response Type (moved to OIDC Settings)
- Default: Closed

### 4. Remove Separate Sections
- Remove standalone "Redirect Configuration" section
- Remove standalone "Logout Configuration" section
- Remove standalone "Permissions" section
- Consolidate all into "OIDC Settings"

---

## Section Colors (Keep Existing)

```css
/* General */
.form-section[data-section="general"] .section-header {
  background: linear-gradient(to right, #fef3c7 0%, #fde68a 100%);
  border-bottom: 1px solid #fcd34d;
  color: #92400e;
}

/* OIDC Discovery */
.form-section[data-section="discovery"] .section-header {
  background: linear-gradient(to right, #dbeafe 0%, #bfdbfe 100%);
  border-bottom: 1px solid #93c5fd;
  color: #1e40af;
}

/* OIDC Settings (NEW) */
.form-section[data-section="oidc-settings"] .section-header {
  background: linear-gradient(to right, #f0fdf4 0%, #dcfce7 100%);
  border-bottom: 1px solid #bbf7d0;
  color: #166534;
}

/* Advanced */
.form-section[data-section="advanced"] .section-header {
  background: linear-gradient(to right, #f5f3ff 0%, #ede9fe 100%);
  border-bottom: 1px solid #ddd6fe;
  color: #5b21b6;
}
```

---

## Implementation Steps

### Step 1: Rename Section
```tsx
// Change from:
<div className="form-section" data-section="credentials">
  <h3>⚡ Configuration & Credentials</h3>

// To:
<div className="form-section" data-section="general">
  <h3>⚡ General</h3>
```

### Step 2: Create OIDC Settings Section
```tsx
<div className="form-section" data-section="oidc-settings">
  <div className="section-header">
    <h3>⚙️ OIDC Settings</h3>
  </div>
  <div className="section-content">
    {/* Token Endpoint Authentication Method */}
    {showClientAuthMethod && (
      <div className="form-group">
        <label>Token Endpoint Authentication Method</label>
        <select...>
        </select>
      </div>
    )}

    {/* Response Type */}
    {flowOptions.responseTypes.length > 0 && (
      <div className="form-group">
        <label>Response Type</label>
        <select...>
        </select>
      </div>
    )}

    {/* Grant Type (read-only) */}
    <div className="form-group">
      <label>Grant Type</label>
      <div style={{ padding: '10px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
        {SpecVersionServiceV8.getFlowLabel(effectiveFlowType)}
      </div>
      <small>Based on selected flow type</small>
    </div>

    {/* Redirect URIs */}
    {flowOptions.requiresRedirectUri && (
      <div className="form-group">
        <label>Redirect URIs <span className="required">*</span></label>
        <input...>
        </input>
      </div>
    )}

    {/* Post-Logout Redirect URIs (Sign Off URLs) */}
    {flowOptions.supportsPostLogoutRedirectUri && (
      <div className="form-group">
        <label>Sign Off URLs (Post-Logout Redirect URIs)</label>
        <input...>
        </input>
      </div>
    )}

    {/* Scopes */}
    {config.includeScopes && (
      <div className="form-group">
        <label>Scopes <span className="required">*</span></label>
        <input...>
        </input>
      </div>
    )}
  </div>
</div>
```

### Step 3: Simplify Advanced Section
```tsx
<div className="form-section" data-section="advanced">
  <div className="section-header" onClick={() => setShowAdvancedSection(!showAdvancedSection)}>
    <h3>🔧 Advanced Options</h3>
  </div>
  {showAdvancedSection && (
    <div className="section-content">
      {/* PKCE checkbox */}
      {/* Refresh Token checkbox */}
      {/* Login Hint */}
      {/* Other advanced options */}
    </div>
  )}
</div>
```

---

## Benefits

1. **Educational** - Matches PingOne Console exactly
2. **Logical Grouping** - Related fields together
3. **Less Scrolling** - Consolidated sections
4. **Cleaner UI** - Fewer section headers
5. **Better UX** - Important fields (OIDC Settings) more prominent

---

## Testing Checklist

After implementation:
- [ ] All fields still save correctly
- [ ] Field visibility rules still work
- [ ] Tooltips still appear
- [ ] Validation still works
- [ ] No console errors
- [ ] Matches PingOne order exactly
- [ ] Collapsible sections work
- [ ] Default open/closed states correct

---

## Status

📋 **Plan Complete** - Ready for implementation  
⏳ **Estimated Time:** 30-45 minutes  
🎯 **Priority:** Medium (improves UX but not critical)

