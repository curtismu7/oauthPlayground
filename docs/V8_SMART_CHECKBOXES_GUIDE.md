# V8 Smart Checkboxes Guide

## Overview

The V8 credentials form includes several **smart checkboxes** that dynamically enable/disable features and change form behavior. These checkboxes allow users to easily configure advanced OAuth/OIDC features without manual configuration.

## Available Checkboxes

### 1. 🔐 Use PKCE (Proof Key for Code Exchange)

**Available For**: Authorization Code Flow only

**What It Does**:
- Switches from standard Authorization Code to PKCE-enhanced Authorization Code
- Hides Client Secret field (public client)
- Locks Auth Method to "None"
- Sets PKCE Enforcement to "Required"

**When to Use**:
- Single Page Applications (SPAs)
- Mobile applications
- Desktop applications
- CLI tools
- Any public client that needs enhanced security

**Example**:
```
Standard AuthZ                  PKCE AuthZ
─────────────                  ──────────
✅ Client Secret               ❌ Client Secret (hidden)
✅ Auth Methods (all)          ✅ Auth Method: None (locked)
✅ PKCE: Optional              ✅ PKCE: Required (locked)
```

**Visual Style**: Yellow background (#fef3c7) with lock icon

---

### 2. 🔄 Enable Refresh Token

**Available For**: Flows that support refresh tokens
- Authorization Code Flow
- Hybrid Flow
- Device Code Flow
- ROPC Flow

**What It Does**:
- Enables refresh token support
- Shows refresh token duration settings
- Allows configuration of token rolling duration

**When to Use**:
- Long-lived sessions needed
- Users should not need to re-authenticate frequently
- Mobile apps with background refresh
- Desktop applications

**Configuration Options** (when enabled):
- **Refresh Token Duration**: How long the refresh token is valid (default: 30 days)
- **Rolling Duration**: How long before token rolls over (default: 180 days)

**Example**:
```
Disabled:
- Refresh tokens not supported
- Users must re-authenticate when access token expires

Enabled:
- Refresh Token Duration: 30 days
- Rolling Duration: 180 days
- Users can refresh without re-authenticating
```

**Visual Style**: Blue background (#dbeafe) with refresh icon

---

### 3. ✓ Allow Redirect URI Patterns

**Available For**: Flows that use redirect URIs
- Authorization Code Flow
- Implicit Flow
- Hybrid Flow
- PKCE Flow

**What It Does**:
- Enables regex pattern matching for redirect URIs
- Allows wildcards and flexible URI matching
- Changes placeholder to show pattern example

**When to Use**:
- Multiple redirect URIs with similar patterns
- Dynamic redirect URIs
- Development environments with varying ports
- Testing with different subdomains

**Pattern Examples**:
```
Pattern                          Matches
───────                          ───────
https://localhost:3000/.*        https://localhost:3000/callback
                                 https://localhost:3000/auth
                                 https://localhost:3000/login

https://.*\.example\.com/auth    https://app1.example.com/auth
                                 https://app2.example.com/auth
                                 https://staging.example.com/auth

https://localhost:(3000|8080)/.*  https://localhost:3000/callback
                                  https://localhost:8080/callback
```

**Visual Style**: Purple background (#f3e8ff) with checkmark icon

---

## Checkbox Interactions

### PKCE + Refresh Token
```
PKCE Enabled + Refresh Token Enabled:
- Public client (no client secret)
- Can use refresh tokens
- PKCE required for authorization
- Refresh tokens valid for 30 days
```

### Refresh Token + Redirect URI Patterns
```
Refresh Token Enabled + Patterns Enabled:
- Multiple redirect URIs with patterns
- Refresh tokens for all matching URIs
- Flexible development environment setup
```

### All Checkboxes Enabled
```
PKCE + Refresh Token + Redirect URI Patterns:
- Public client with PKCE
- Multiple redirect URIs with patterns
- Refresh token support
- Maximum flexibility and security
```

## Visual Design

### Checkbox Styling

Each checkbox has a distinct color to indicate its purpose:

| Checkbox | Color | Icon | Purpose |
|----------|-------|------|---------|
| PKCE | Yellow (#fef3c7) | 🔐 | Security enhancement |
| Refresh Token | Blue (#dbeafe) | 🔄 | Token management |
| Redirect URI Patterns | Purple (#f3e8ff) | ✓ | URI flexibility |

### Hover States
- Checkboxes are clickable labels
- Cursor changes to pointer on hover
- Clear visual feedback when toggled

### Disabled State
- Checkboxes only appear when relevant to the flow
- Grayed out if not applicable
- Helpful text explains why disabled

## User Experience Flow

### Example: Setting Up PKCE with Refresh Tokens

1. **Select Authorization Code Flow**
   - Form shows standard OAuth 2.0 configuration
   - Client Secret field visible
   - PKCE checkbox unchecked
   - Refresh Token checkbox unchecked

2. **Enable PKCE**
   - Click "🔐 Use PKCE" checkbox
   - Client Secret field disappears
   - Auth Method locked to "None"
   - Toast: "PKCE enabled - using public client configuration"

3. **Enable Refresh Tokens**
   - Click "🔄 Enable Refresh Token" checkbox
   - Refresh token duration fields appear
   - Default values: 30 days, 180 days rolling

4. **Enable Redirect URI Patterns**
   - Click "✓ Allow Redirect URI Patterns" checkbox
   - Redirect URI placeholder changes to pattern example
   - Can now use regex patterns like `https://localhost:3000/.*`

5. **Configure Values**
   - Environment ID: `12345678-1234-1234-1234-123456789012`
   - Client ID: `abc123def456`
   - Redirect URI: `https://localhost:3000/.*`
   - Scopes: `openid profile email`
   - Refresh Token Duration: 30 days
   - Rolling Duration: 180 days

6. **Result**
   - Public client with PKCE
   - Multiple redirect URIs supported
   - Refresh token support enabled
   - Ready for SPA development

## Implementation Details

### State Management
```typescript
const [usePKCE, setUsePKCE] = useState(false);
const [enableRefreshToken, setEnableRefreshToken] = useState(false);
const [allowRedirectUriPatterns, setAllowRedirectUriPatterns] = useState(false);
```

### Conditional Rendering
```typescript
// PKCE checkbox only for Authorization Code Flow
{(flowKey.includes('oauth-authz') || flowKey.includes('authorization-code')) && (
  <label>
    <input
      type="checkbox"
      checked={usePKCE}
      onChange={(e) => setUsePKCE(e.target.checked)}
    />
    🔐 Use PKCE
  </label>
)}

// Refresh Token checkbox only for flows that support it
{flowOptions.supportsRefreshToken && (
  <label>
    <input
      type="checkbox"
      checked={enableRefreshToken}
      onChange={(e) => setEnableRefreshToken(e.target.checked)}
    />
    🔄 Enable Refresh Token
  </label>
)}

// Redirect URI Patterns checkbox only for flows with redirect URIs
{flowOptions.requiresRedirectUri && (
  <label>
    <input
      type="checkbox"
      checked={allowRedirectUriPatterns}
      onChange={(e) => setAllowRedirectUriPatterns(e.target.checked)}
    />
    ✓ Allow Redirect URI Patterns
  </label>
)}
```

## Benefits

✅ **Easy Configuration**: Toggle features with one click  
✅ **Smart Defaults**: Sensible default values provided  
✅ **Visual Feedback**: Clear indication of what's enabled  
✅ **Contextual**: Only shown when applicable  
✅ **No Manual Setup**: Automatic field adjustments  
✅ **Prevents Errors**: Can't select invalid combinations  
✅ **Flexible**: Mix and match features as needed  

## Future Checkboxes

Potential additions:
- **Require Pushed Authorization Request (PAR)** - Enable PAR support
- **Device Authorization** - Enable device flow features
- **Require Request Object** - Require JWT request objects
- **Require Signed Requests** - Require request signing
- **Enable Backchannel Authentication** - CIBA support
- **Require Mutual TLS** - mTLS certificate validation

## Testing

### Test PKCE Checkbox
```typescript
const pkceCheckbox = screen.getByRole('checkbox', { name: /PKCE/ });
expect(pkceCheckbox).toBeInTheDocument();
fireEvent.click(pkceCheckbox);
expect(pkceCheckbox).toBeChecked();
```

### Test Refresh Token Checkbox
```typescript
const refreshCheckbox = screen.getByRole('checkbox', { name: /Refresh Token/ });
expect(refreshCheckbox).toBeInTheDocument();
fireEvent.click(refreshCheckbox);
expect(refreshCheckbox).toBeChecked();
// Verify duration fields appear
expect(screen.getByPlaceholderText('30')).toBeInTheDocument();
```

### Test Redirect URI Patterns Checkbox
```typescript
const patternsCheckbox = screen.getByRole('checkbox', { name: /Redirect URI Patterns/ });
expect(patternsCheckbox).toBeInTheDocument();
fireEvent.click(patternsCheckbox);
expect(patternsCheckbox).toBeChecked();
// Verify placeholder changes
const redirectInput = screen.getByPlaceholderText(/\.\*/);
expect(redirectInput).toBeInTheDocument();
```

## Documentation

- See `V8_PKCE_TOGGLE_FEATURE.md` for PKCE details
- See `V8_FLOW_OPTIONS_GUIDE.md` for flow options reference
- See `V8_CREDENTIALS_FORM_COMPLETE.md` for comprehensive documentation

---

**Version**: 8.0.0  
**Last Updated**: 2024-11-16  
**Status**: Complete and Production Ready
