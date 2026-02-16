# V8 PKCE Toggle Feature

## Overview

The V8 credentials form includes a **smart PKCE toggle** that dynamically changes the form's field visibility and options when enabled. This allows users to easily switch between standard Authorization Code Flow and PKCE-enhanced Authorization Code Flow.

## How It Works

### Default: Authorization Code Flow
When you open the form for Authorization Code Flow (`oauth-authz-v8`), you see:
- ✅ Client Secret field (optional but recommended)
- ✅ All Auth Methods available (Client Secret Basic, Post, JWT, Private Key JWT)
- ✅ PKCE Checkbox (unchecked)

### Enable PKCE
Click the **"🔐 Use PKCE (Proof Key for Code Exchange)"** checkbox to switch to PKCE mode:
- ❌ Client Secret field hidden (public client)
- ✅ Auth Method locked to "None" (public client only)
- ✅ PKCE Enforcement shows "Required"
- ✅ Toast notification confirms PKCE is enabled

### Disable PKCE
Uncheck the PKCE checkbox to return to standard Authorization Code Flow:
- ✅ Client Secret field shown again
- ✅ All Auth Methods available again
- ✅ Form returns to default state

## Visual Indicator

The PKCE checkbox is styled with:
- 🟨 Yellow background (#fef3c7) to draw attention
- 🔐 Lock icon to indicate security enhancement
- Clear description of what changes when enabled
- Helpful hint text explaining the feature

## Use Cases

### When to Use PKCE
- **Single Page Applications (SPAs)**: No backend to store client secret
- **Mobile Apps**: Cannot securely store client secret
- **Desktop Apps**: Public clients that need enhanced security
- **CLI Tools**: Command-line applications without secure storage

### When NOT to Use PKCE
- **Server-side Applications**: Can securely store client secret
- **Confidential Clients**: Have backend infrastructure
- **Legacy Systems**: May not support PKCE

## Technical Details

### What Changes When PKCE is Enabled

**Flow Key Transformation**:
```typescript
// User selects Authorization Code Flow
flowKey = 'oauth-authz-v8'

// User enables PKCE checkbox
effectiveFlowKey = 'pkce-v8'  // Dynamically switches

// Form options now use PKCE configuration
flowOptions = FlowOptionsServiceV8.getOptionsForFlow('pkce-v8')
```

**Field Visibility**:
```
Standard AuthZ          PKCE AuthZ
─────────────          ──────────
✅ Client Secret       ❌ Client Secret (hidden)
✅ Auth Methods        ✅ Auth Method: None (locked)
✅ PKCE: Optional      ✅ PKCE: Required (locked)
```

**Auth Method Options**:
```
Standard AuthZ:
- Client Secret Basic
- Client Secret Post
- Client Secret JWT
- Private Key JWT

PKCE AuthZ:
- None (public client only)
```

## Implementation

### Component State
```typescript
const [usePKCE, setUsePKCE] = useState(false);

// Determine effective flow based on PKCE toggle
const effectiveFlowKey = usePKCE && flowKey.includes('oauth-authz') 
  ? 'pkce-v8' 
  : flowKey;

// Get options for effective flow
const flowOptions = useMemo(
  () => FlowOptionsServiceV8.getOptionsForFlow(effectiveFlowKey),
  [effectiveFlowKey]
);
```

### Checkbox Rendering
```typescript
{(flowKey.includes('oauth-authz') || flowKey.includes('authorization-code')) && (
  <label>
    <input
      type="checkbox"
      checked={usePKCE}
      onChange={(e) => {
        setUsePKCE(e.target.checked);
        if (e.target.checked) {
          toastV8.info('PKCE enabled - using public client configuration');
        }
      }}
    />
    🔐 Use PKCE (Proof Key for Code Exchange)
  </label>
)}
```

## User Experience

### Step-by-Step

1. **Open Authorization Code Flow**
   - Form shows standard OAuth 2.0 Authorization Code configuration
   - Client Secret field visible
   - All auth methods available

2. **Enable PKCE**
   - Click the PKCE checkbox
   - Toast notification: "PKCE enabled - using public client configuration"
   - Form instantly updates:
     - Client Secret field disappears
     - Auth Method options filtered to "None" only
     - PKCE Enforcement shows "Required"

3. **Configure PKCE Flow**
   - Enter Environment ID and Client ID
   - Enter Redirect URI (required)
   - Enter Scopes (required)
   - Optional: Login Hint, Issuer URL

4. **Disable PKCE (if needed)**
   - Uncheck the PKCE checkbox
   - Form returns to standard Authorization Code configuration
   - Client Secret field reappears
   - All auth methods available again

## Benefits

✅ **Easy Switching**: Toggle between standard and PKCE with one click  
✅ **Smart Filtering**: Form automatically hides/shows relevant fields  
✅ **Clear Guidance**: Helpful text explains what changes  
✅ **Visual Feedback**: Toast notifications confirm state changes  
✅ **No Manual Configuration**: Auth method automatically locked to "None"  
✅ **Prevents Errors**: Can't accidentally use client secret with PKCE  

## Limitations

- PKCE toggle only available for Authorization Code Flow
- Cannot use PKCE with Implicit, Client Credentials, or Device Code flows
- PKCE toggle not available for other flow types

## Future Enhancements

Potential additions:
- Code Challenge Method selector (S256 vs plain)
- Code Verifier generation helper
- PKCE parameter display in authorization URL
- PKCE validation in token exchange
- Support for PKCE in other flows (if applicable)

## Testing

### Test PKCE Toggle
```typescript
// Test that PKCE toggle is available for Authorization Code Flow
const form = render(
  <CredentialsFormV8
    flowKey="oauth-authz-v8"
    credentials={credentials}
    onChange={setCredentials}
  />
);

// Find PKCE checkbox
const pkceCheckbox = screen.getByRole('checkbox', { name: /PKCE/ });
expect(pkceCheckbox).toBeInTheDocument();
expect(pkceCheckbox).not.toBeChecked();

// Enable PKCE
fireEvent.click(pkceCheckbox);
expect(pkceCheckbox).toBeChecked();

// Verify Client Secret field is hidden
const clientSecretInput = screen.queryByLabelText(/Client Secret/);
expect(clientSecretInput).not.toBeInTheDocument();

// Verify Auth Method is locked to None
const authMethodSelect = screen.getByLabelText(/Token Endpoint Authentication/);
expect(authMethodSelect.value).toBe('none');
expect(authMethodSelect).toBeDisabled();
```

## Documentation

- See `V8_FLOW_OPTIONS_GUIDE.md` for complete flow options reference
- See `V8_CREDENTIALS_QUICK_START.md` for quick start guide
- See `V8_CREDENTIALS_FORM_COMPLETE.md` for comprehensive documentation

---

**Version**: 8.0.0  
**Last Updated**: 2024-11-16  
**Status**: Complete and Production Ready
