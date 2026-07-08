# V8 Unified Credentials Form Design

## Vision

**One intelligent UI that dynamically adapts to OAuth/OIDC specification version and flow type.**

The form intelligently filters options, hides irrelevant fields, and prevents non-compliant configurations based on the selected spec version (OAuth 2.0, OAuth 2.1, OIDC).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED CREDENTIALS FORM                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Spec Version Selection (Radio Buttons)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ○ OAuth 2.0    ○ OAuth 2.1    ○ OpenID Connect     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Flow Type Selection (Dropdown)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Select Flow Type: [Authorization Code ▼]            │   │
│  │ Available flows based on spec version               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ OIDC Discovery (Optional) ─────────────────────────┐   │
│  │ [Issuer URL or Env ID] [Discover]                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Basic Authentication ──────────────────────────────┐   │
│  │ Environment ID: [________________]                  │   │
│  │ Client ID:      [________________]                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Client Authentication (if applicable) ─────────────┐   │
│  │ Client Secret: [________________]                   │   │
│  │ Auth Method:   [Client Secret Post ▼]              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Redirect Configuration (if applicable) ────────────┐   │
│  │ Redirect URI: [________________]                    │   │
│  │ ☐ Allow Redirect URI Patterns                       │   │
│  │ Post-Logout Redirect URI: [________________]         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Permissions ──────────────────────────────────────┐   │
│  │ Scopes: [openid profile email]                     │   │
│  │ Login Hint: [________________]                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─ Advanced Configuration ───────────────────────────┐   │
│  │ Response Type: [code ▼]                            │   │
│  │ ☐ Use PKCE (if applicable)                         │   │
│  │ ☐ Enable Refresh Token (if applicable)             │   │
│  │ PKCE Enforcement: [Required/Optional/Not Required] │   │
│  │ Issuer URL: [________________]                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  [💾 Save Credentials]                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Spec Version Selection

### Radio Button Options

```
┌─────────────────────────────────────────────────────────┐
│ Specification Version:                                  │
│                                                         │
│ ○ OAuth 2.0                                            │
│   Standard OAuth 2.0 (RFC 6749)                        │
│   Supports: AuthZ Code, Implicit, Client Creds, ROPC   │
│                                                         │
│ ○ OAuth 2.1                                            │
│   Modern OAuth 2.0 (RFC 6749 + Security BCP)           │
│   Supports: AuthZ Code (PKCE required), Client Creds   │
│   Disables: Implicit, ROPC (deprecated)                │
│                                                         │
│ ○ OpenID Connect                                       │
│   Authentication layer on OAuth 2.0 (OpenID Connect)   │
│   Supports: AuthZ Code, Implicit, Hybrid               │
│   Adds: ID Token, UserInfo endpoint                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Spec Version Impact

| Feature | OAuth 2.0 | OAuth 2.1 | OIDC |
|---------|-----------|-----------|------|
| Authorization Code | ✅ | ✅ | ✅ |
| Implicit | ✅ | ❌ (deprecated) | ✅ |
| Client Credentials | ✅ | ✅ | ❌ |
| ROPC | ✅ | ❌ (deprecated) | ❌ |
| Device Code | ✅ | ✅ | ✅ |
| PKCE | Optional | Required | Optional |
| Refresh Token | ✅ | ✅ | ✅ |
| ID Token | ❌ | ❌ | ✅ |
| UserInfo | ❌ | ❌ | ✅ |
| Response Type | code, token | code | code, token, id_token, hybrid |

## Flow Type Selection

### Dynamic Dropdown Based on Spec Version

**OAuth 2.0 Flows**:
- Authorization Code Flow
- Implicit Flow
- Client Credentials Flow
- Resource Owner Password Credentials (ROPC)
- Device Authorization Flow

**OAuth 2.1 Flows**:
- Authorization Code Flow (PKCE required)
- Client Credentials Flow
- Device Authorization Flow

**OpenID Connect Flows**:
- Authorization Code Flow
- Implicit Flow
- Hybrid Flow
- Device Authorization Flow

### Flow Selection UI

```
┌─────────────────────────────────────────────────────────┐
│ Select Flow Type:                                       │
│                                                         │
│ [Authorization Code Flow ▼]                            │
│                                                         │
│ Available flows for OAuth 2.0:                         │
│ • Authorization Code Flow                              │
│ • Implicit Flow                                        │
│ • Client Credentials Flow                              │
│ • Resource Owner Password Credentials                  │
│ • Device Authorization Flow                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Smart Field Visibility

### Authorization Code Flow (OAuth 2.0)

```
✅ Environment ID (required)
✅ Client ID (required)
✅ Client Secret (optional)
✅ Redirect URI (required)
✅ Scopes (required)
✅ Login Hint (optional)
✅ Response Type: code
✅ Auth Method (all options)
✅ PKCE: Optional
✅ Refresh Token: Supported
✅ Redirect URI Patterns: Supported
❌ Post-Logout Redirect URI
❌ ID Token
❌ UserInfo endpoint
```

### Authorization Code Flow (OAuth 2.1)

```
✅ Environment ID (required)
✅ Client ID (required)
✅ Client Secret (optional)
✅ Redirect URI (required)
✅ Scopes (required)
✅ Login Hint (optional)
✅ Response Type: code (locked)
✅ Auth Method (all options)
✅ PKCE: Required (locked, checkbox disabled)
✅ Refresh Token: Supported
✅ Redirect URI Patterns: Supported
❌ Implicit Flow (not available)
❌ ROPC (not available)
❌ Post-Logout Redirect URI
❌ ID Token
```

### Authorization Code Flow (OIDC)

```
✅ Environment ID (required)
✅ Client ID (required)
✅ Client Secret (optional)
✅ Redirect URI (required)
✅ Scopes (required, must include "openid")
✅ Login Hint (optional)
✅ Response Type: code, code id_token
✅ Auth Method (all options)
✅ PKCE: Optional
✅ Refresh Token: Supported
✅ Redirect URI Patterns: Supported
✅ Post-Logout Redirect URI (optional)
✅ ID Token (shown in advanced)
✅ UserInfo endpoint (shown in advanced)
```

### Implicit Flow (OAuth 2.0)

```
✅ Environment ID (required)
✅ Client ID (required)
❌ Client Secret (hidden - public client)
✅ Redirect URI (required)
✅ Scopes (required)
✅ Login Hint (optional)
✅ Response Type: token
✅ Auth Method: None (locked)
❌ PKCE (not applicable)
❌ Refresh Token (not supported)
✅ Redirect URI Patterns: Supported
❌ Post-Logout Redirect URI
```

### Implicit Flow (OAuth 2.1)

```
❌ NOT AVAILABLE (deprecated in OAuth 2.1)
```

### Implicit Flow (OIDC)

```
✅ Environment ID (required)
✅ Client ID (required)
❌ Client Secret (hidden - public client)
✅ Redirect URI (required)
✅ Scopes (required, must include "openid")
✅ Login Hint (optional)
✅ Response Type: token, id_token, token id_token
✅ Auth Method: None (locked)
❌ PKCE (not applicable)
❌ Refresh Token (not supported)
✅ Redirect URI Patterns: Supported
❌ Post-Logout Redirect URI
✅ ID Token (shown in advanced)
```

### Client Credentials Flow

```
✅ Environment ID (required)
✅ Client ID (required)
✅ Client Secret (required)
❌ Redirect URI (hidden - not used)
✅ Scopes (required)
❌ Login Hint (hidden - not interactive)
❌ Response Type (hidden - no authorization endpoint)
✅ Auth Method (all options)
❌ PKCE (not applicable)
❌ Refresh Token (not supported)
❌ Redirect URI Patterns (not applicable)
❌ Post-Logout Redirect URI (hidden)
```

### Device Authorization Flow

```
✅ Environment ID (required)
✅ Client ID (required)
❌ Client Secret (hidden - optional)
❌ Redirect URI (hidden - not used)
✅ Scopes (required)
❌ Login Hint (hidden - not interactive)
❌ Response Type (hidden - no authorization endpoint)
✅ Auth Method: None, Client Secret Basic, Post
❌ PKCE (not applicable)
✅ Refresh Token: Supported
❌ Redirect URI Patterns (not applicable)
❌ Post-Logout Redirect URI (hidden)
✅ Device Path ID (optional)
✅ Device Verification URI (optional)
```

### Hybrid Flow (OIDC only)

```
✅ Environment ID (required)
✅ Client ID (required)
✅ Client Secret (optional)
✅ Redirect URI (required)
✅ Post-Logout Redirect URI (optional)
✅ Scopes (required, must include "openid")
✅ Login Hint (optional)
✅ Response Type: code, id_token, token id_token, code id_token, code token, code token id_token
✅ Auth Method (all options)
✅ PKCE: Optional
✅ Refresh Token: Supported
✅ Redirect URI Patterns: Supported
✅ ID Token (shown in advanced)
✅ UserInfo endpoint (shown in advanced)
```

## Smart Checkboxes

### PKCE Checkbox

**Shown For**:
- Authorization Code Flow (OAuth 2.0) - Optional
- Authorization Code Flow (OIDC) - Optional
- Hybrid Flow (OIDC) - Optional

**Hidden For**:
- Authorization Code Flow (OAuth 2.1) - Always required, checkbox disabled
- Implicit Flow - Not applicable
- Client Credentials - Not applicable
- Device Code - Not applicable
- ROPC - Not applicable

**Behavior**:
- When enabled: Switches to PKCE mode, hides client secret, locks auth method to "None"
- When disabled: Standard mode with client secret support

### Refresh Token Checkbox

**Shown For**:
- Authorization Code Flow (all specs)
- Hybrid Flow (OIDC)
- Device Code Flow (all specs)
- ROPC (OAuth 2.0 only)

**Hidden For**:
- Implicit Flow - Not supported
- Client Credentials - Not supported

**Behavior**:
- When enabled: Shows refresh token duration settings
- When disabled: No refresh token support

### Redirect URI Patterns Checkbox

**Shown For**:
- Authorization Code Flow (all specs)
- Implicit Flow (OAuth 2.0, OIDC)
- Hybrid Flow (OIDC)

**Hidden For**:
- Client Credentials - No redirect URI
- Device Code - No redirect URI
- ROPC - No redirect URI

**Behavior**:
- When enabled: Allows regex patterns in redirect URI
- When disabled: Exact URI matching only

## Compliance Enforcement

### OAuth 2.1 Compliance

When OAuth 2.1 is selected:

```
✅ PKCE: Automatically required for Authorization Code Flow
❌ Implicit Flow: Disabled (deprecated)
❌ ROPC: Disabled (deprecated)
⚠️ Refresh Token: Recommended (but optional)
✅ HTTPS: Enforced for all URIs (no http://localhost allowed)
```

### OIDC Compliance

When OIDC is selected:

```
✅ Scopes: Must include "openid"
✅ Response Type: Must include "id_token" or "code"
✅ ID Token: Always supported
✅ UserInfo: Always supported
✅ Post-Logout Redirect URI: Supported
❌ Client Credentials: Not available (not OIDC)
❌ ROPC: Not available (not OIDC)
```

## Implementation Strategy

### Phase 1: Core Infrastructure
1. Create `SpecVersionService` - Manages spec versions and compliance rules
2. Create `UnifiedFlowOptionsService` - Extends flow options with spec awareness
3. Update `CredentialsForm` - Add spec version radio buttons and flow selector

### Phase 2: Smart Filtering
1. Implement spec-aware field visibility
2. Implement spec-aware option filtering
3. Add compliance validation

### Phase 3: Advanced Features
1. Add OAuth 2.1 compliance enforcement
2. Add OIDC compliance validation
3. Add warning messages for deprecated flows

### Phase 4: Testing & Documentation
1. Unit tests for spec compliance
2. Integration tests for field visibility
3. Comprehensive documentation

## Code Structure

```typescript
// Spec version service
export class SpecVersionService {
  static getAvailableFlows(specVersion: 'oauth2.0' | 'oauth2.1' | 'oidc'): FlowType[]
  static isFlowAvailable(specVersion, flowType): boolean
  static getComplianceRules(specVersion): ComplianceRules
  static validateConfiguration(specVersion, flowType, config): ValidationResult
}

// Unified flow options
export class UnifiedFlowOptionsService {
  static getOptionsForFlow(specVersion, flowType): FlowOptions
  static getFieldVisibility(specVersion, flowType): FieldVisibility
  static getCheckboxAvailability(specVersion, flowType): CheckboxAvailability
}

// Updated credentials form
export const CredentialsForm: React.FC<Props> = ({
  specVersion = 'oauth2.0',
  flowType = 'oauth-authz',
  ...
}) => {
  const [selectedSpec, setSelectedSpec] = useState(specVersion)
  const [selectedFlow, setSelectedFlow] = useState(flowType)
  const availableFlows = SpecVersionService.getAvailableFlows(selectedSpec)
  const flowOptions = UnifiedFlowOptionsService.getOptionsForFlow(selectedSpec, selectedFlow)
  // ...
}
```

## User Experience Flow

### Scenario: SPA Developer

1. **Open Credentials Form**
   - Defaults to OAuth 2.0
   - Authorization Code Flow selected

2. **Select OAuth 2.1**
   - Radio button: OAuth 2.1
   - Implicit Flow disappears from dropdown
   - ROPC disappears from dropdown
   - PKCE checkbox becomes disabled (always required)
   - Toast: "OAuth 2.1 selected - PKCE is required"

3. **Select OpenID Connect**
   - Radio button: OpenID Connect
   - New flows appear: Hybrid Flow
   - Scopes field shows "openid" requirement
   - Post-Logout Redirect URI appears
   - ID Token section appears in advanced

4. **Configure Authorization Code Flow (OIDC)**
   - Environment ID: `12345678-1234-1234-1234-123456789012`
   - Client ID: `abc123def456`
   - Redirect URI: `https://localhost:3000/callback`
   - Scopes: `openid profile email` (openid auto-included)
   - Enable PKCE: Optional checkbox
   - Enable Refresh Token: Optional checkbox
   - Post-Logout Redirect URI: `https://localhost:3000/logout`

5. **Save**
   - Form validates OIDC compliance
   - Saves with spec version metadata
   - Ready to test

## Benefits

✅ **One UI for All Specs**: Single form adapts to OAuth 2.0, 2.1, OIDC  
✅ **Compliance Enforcement**: Prevents non-compliant configurations  
✅ **Smart Defaults**: Sensible defaults based on spec version  
✅ **Clear Guidance**: Disabled options explain why  
✅ **Future-Proof**: Easy to add new specs (OAuth 3.0, etc.)  
✅ **Educational**: Users learn spec differences  
✅ **Flexible**: Supports all major OAuth/OIDC flows  

## Migration Path

### From Current V8 to Unified Form

1. **Keep existing flows** - Don't break current implementations
2. **Add spec selector** - New radio buttons at top
3. **Default to OAuth 2.0** - Backward compatible
4. **Gradual adoption** - Users can opt-in to new flows
5. **Deprecation warnings** - Show for deprecated flows in OAuth 2.1

---

**Version**: 8.0.0 (Design)  
**Last Updated**: 2024-11-16  
**Status**: Design Complete - Ready for Implementation
