# KIRO AI Implementation Prompt – V8 Unified Credentials UI

You are **KIRO**, an AI coding assistant working in the repo:

`/Users/cmuir/P1Import-apps/oauth-playground`

Your task is to **implement and wire up the V8 Unified Credentials UI** exactly as specified in the roadmap that follows in this document.

Treat everything after this prompt block as your **single source of truth** for:

- File names and paths  
- Service, hook, and component names  
- Props, types, and enums  
- Feature behavior, edge-cases, and guardrails  
- Phase-by-phase priorities and sequencing  

Do **not** delete or regress existing functionality in other flows. When in doubt, prefer **backwards‑compatible changes** and add new code or adapters instead of changing shared services in a breaking way.

## High-level goals

Implement a **unified, spec-aware credentials form and related UI** that:

1. Works across all relevant OAuth 2.0, OAuth 2.1, and OIDC flows described in the roadmap.  
2. Drives options from central V8 services (for example: spec/flow configuration services) rather than hard‑coding logic inside components.  
3. Enforces spec-compliant behavior (especially OAuth 2.1) while still allowing the user to **see and learn** about deprecated patterns with clear warnings instead of silent failures.  
4. Preserves and enhances the **education experience**: labels, helper text, tooltips, warnings, and examples should all reinforce *why* a field is shown, hidden, required, disabled, or rejected.

## Implementation instructions

Follow the roadmap **in order**, by phase:

1. **Phase 1 – Core infrastructure**  
   - Create or complete all services described in the roadmap (for example, spec/flow configuration services and unified options services).  
   - Ensure these services expose:
     - Spec-aware flow availability  
     - Compliance rules (PKCE requirements, HTTPS requirements, allowed flows, etc.)  
     - Field and checkbox visibility/availability  
     - Validation helpers for configurations per spec and flow  
   - Use strong TypeScript typing for all spec/flow enums and configuration objects.

2. **Phase 2 – Smart filtering UI**  
   - Implement spec version selection state and UI exactly as described (radio buttons or equivalent).  
   - Implement flow selection that is driven entirely by the spec rules (for example, no Implicit/ROPC under OAuth 2.1 if the roadmap specifies that).  
   - Use the unified options services to drive:
     - Which fields appear  
     - Which checkboxes appear  
     - Which options are disabled, required, or hidden  
   - Avoid duplicating spec logic inside React components; pull all rules from services.

3. **Phase 3 – Advanced behavior and compliance**  
   - Enforce OAuth 2.1 rules programmatically as described:
     - PKCE required where specified  
     - Implicit / ROPC disabled where specified  
     - HTTPS requirements enforced (with any localhost exceptions the roadmap allows)  
   - Implement warning and deprecation messaging:
     - Use the app’s existing patterns for alerts/toasts where possible.  
     - Messages must explain *why* something is disabled or discouraged (for example, “Implicit Flow is deprecated in OAuth 2.1”).  
   - Ensure the UI clearly reflects spec state (for example, disabled controls with clear helper text).

4. **Phase 4 – Testing and documentation**  
   - Create or update the test files listed in the roadmap and ensure coverage for:
     - Spec version availability  
     - Flow availability per spec  
     - Field and checkbox visibility per spec/flow  
     - Compliance and configuration validation  
   - Follow the existing Jest + React Testing Library patterns used by V6/V8 test files.  
   - If the roadmap references additional docs (for example, OAuth 2.1 migration or OIDC configuration guides), align implementation and UI behavior with those assumptions.

## Coding style and guardrails

- Follow the existing project’s patterns for:
  - Folder structure under `src/...`  
  - Service and hook naming conventions  
  - Logging, error handling, and user messaging  
- Prefer **composition over duplication**:
  - Where a V6 service is compatible, wrap or extend it instead of re‑implementing logic, unless the roadmap explicitly requires a new V8 service.  
- Do **not** remove flows, UI elements, or educational content unless this roadmap explicitly marks them as deprecated and replaced.  
- Ensure any new options added to the credentials UI are fully wired to:
  - The underlying flow configuration / API calls  
  - Any token display / logging / history UI the roadmap expects  

## How to use this document

1. Read the entire roadmap below this prompt block.  
2. Implement the code in small, reviewable steps that match the phases described.  
3. After each major step:
   - Run tests and add any missing coverage.  
   - Manually verify that existing V6/V8 flows still function.  
4. When all phases are complete, the unified UI should:
   - Adapt correctly to OAuth 2.0, OAuth 2.1, and OIDC differences  
   - Provide a clear, educational, and secure configuration experience  
   - Be easy to extend in the future (new flows, new spec versions, more options)

Do **not** modify this prompt block during implementation. If behavior needs to change, update the roadmap sections below and keep this prompt as the stable high‑level contract for KIRO.

---

# V8 Unified Credentials Form - Implementation Roadmap

## Overview

This roadmap outlines the implementation of the unified credentials form that intelligently adapts to OAuth 2.0, OAuth 2.1, and OpenID Connect specifications.

## Phase 1: Core Infrastructure (Week 1)

### 1.1 Create Spec Version Service

**File**: `src/v8/services/specVersionServiceV8.ts`

```typescript
export type SpecVersion = 'oauth2.0' | 'oauth2.1' | 'oidc';
export type FlowType = 'oauth-authz' | 'implicit' | 'client-credentials' | 'ropc' | 'device-code' | 'hybrid';

export interface ComplianceRules {
  requirePKCE: boolean;
  requireHTTPS: boolean;
  allowImplicit: boolean;
  allowROPC: boolean;
  requireOpenIDScope: boolean;
  supportedFlows: FlowType[];
}

export class SpecVersionServiceV8 {
  static getAvailableFlows(specVersion: SpecVersion): FlowType[]
  static isFlowAvailable(specVersion: SpecVersion, flowType: FlowType): boolean
  static getComplianceRules(specVersion: SpecVersion): ComplianceRules
  static validateConfiguration(specVersion: SpecVersion, flowType: FlowType, config: any): ValidationResult
  static getSpecDescription(specVersion: SpecVersion): string
}
```

**Responsibilities**:
- Define available flows per spec version
- Enforce compliance rules
- Validate configurations
- Provide spec descriptions

### 1.2 Extend Flow Options Service

**File**: `src/v8/services/unifiedFlowOptionsServiceV8.ts`

```typescript
export class UnifiedFlowOptionsServiceV8 {
  static getOptionsForFlow(specVersion: SpecVersion, flowType: FlowType): FlowOptions
  static getFieldVisibility(specVersion: SpecVersion, flowType: FlowType): FieldVisibility
  static getCheckboxAvailability(specVersion: SpecVersion, flowType: FlowType): CheckboxAvailability
  static getComplianceWarnings(specVersion: SpecVersion, flowType: FlowType): string[]
}
```

**Responsibilities**:
- Extend existing flow options with spec awareness
- Determine field visibility per spec/flow combination
- Determine checkbox availability
- Generate compliance warnings

### 1.3 Update Credentials Form Component

**File**: `src/v8/components/CredentialsFormV8.tsx`

**Changes**:
- Add spec version radio buttons at top
- Add flow type selector dropdown
- Update field visibility logic
- Update checkbox availability logic
- Add compliance validation

## Phase 2: Smart Filtering (Week 2)

### 2.1 Implement Spec Version Selection

```typescript
const [specVersion, setSpecVersion] = useState<SpecVersion>('oauth2.0');

// Render radio buttons
<div className="spec-selector">
  <label>
    <input type="radio" value="oauth2.0" checked={specVersion === 'oauth2.0'} onChange={...} />
    OAuth 2.0
  </label>
  <label>
    <input type="radio" value="oauth2.1" checked={specVersion === 'oauth2.1'} onChange={...} />
    OAuth 2.1
  </label>
  <label>
    <input type="radio" value="oidc" checked={specVersion === 'oidc'} onChange={...} />
    OpenID Connect
  </label>
</div>
```

### 2.2 Implement Flow Type Selection

```typescript
const [flowType, setFlowType] = useState<FlowType>('oauth-authz');
const availableFlows = SpecVersionServiceV8.getAvailableFlows(specVersion);

// Render dropdown with available flows only
<select value={flowType} onChange={(e) => setFlowType(e.target.value as FlowType)}>
  {availableFlows.map(flow => (
    <option key={flow} value={flow}>{getFlowLabel(flow)}</option>
  ))}
</select>
```

### 2.3 Implement Smart Field Visibility

```typescript
const fieldVisibility = UnifiedFlowOptionsServiceV8.getFieldVisibility(specVersion, flowType);

// Conditionally render fields
{fieldVisibility.showClientSecret && <ClientSecretField />}
{fieldVisibility.showRedirectUri && <RedirectUriField />}
{fieldVisibility.showPostLogoutRedirectUri && <PostLogoutRedirectUriField />}
{fieldVisibility.showIdToken && <IdTokenField />}
```

### 2.4 Implement Smart Checkbox Availability

```typescript
const checkboxAvailability = UnifiedFlowOptionsServiceV8.getCheckboxAvailability(specVersion, flowType);

// Conditionally render checkboxes
{checkboxAvailability.showPKCE && <PKCECheckbox disabled={checkboxAvailability.pkceRequired} />}
{checkboxAvailability.showRefreshToken && <RefreshTokenCheckbox />}
{checkboxAvailability.showRedirectUriPatterns && <RedirectUriPatternsCheckbox />}
```

## Phase 3: Advanced Features (Week 3)

### 3.1 OAuth 2.1 Compliance Enforcement

**Features**:
- Automatically require PKCE for Authorization Code Flow
- Disable Implicit Flow
- Disable ROPC
- Enforce HTTPS for all URIs (except localhost)
- Show deprecation warnings

**Implementation**:
```typescript
if (specVersion === 'oauth2.1') {
  // PKCE always required
  if (flowType === 'oauth-authz') {
    pkceCheckbox.disabled = true;
    pkceCheckbox.checked = true;
  }
  
  // Implicit and ROPC not available
  availableFlows = availableFlows.filter(f => f !== 'implicit' && f !== 'ropc');
  
  // Enforce HTTPS
  if (!redirectUri.startsWith('https://') && !redirectUri.startsWith('http://localhost')) {
    showError('OAuth 2.1 requires HTTPS for all URIs');
  }
}
```

### 3.2 OIDC Compliance Validation

**Features**:
- Require "openid" scope
- Validate response type includes "id_token" or "code"
- Show ID Token and UserInfo fields
- Validate post-logout redirect URI

**Implementation**:
```typescript
if (specVersion === 'oidc') {
  // Require openid scope
  if (!scopes.includes('openid')) {
    scopes = 'openid ' + scopes;
  }
  
  // Validate response type
  const validResponseTypes = ['code', 'id_token', 'token id_token', 'code id_token', ...];
  if (!validResponseTypes.includes(responseType)) {
    showError('OIDC requires response type to include id_token or code');
  }
  
  // Show OIDC-specific fields
  showIdTokenField = true;
  showUserInfoField = true;
  showPostLogoutRedirectUri = true;
}
```

### 3.3 Compliance Warnings

**Features**:
- Show warnings for deprecated flows
- Show warnings for non-recommended configurations
- Show warnings for security issues

**Implementation**:
```typescript
const warnings = SpecVersionServiceV8.getComplianceWarnings(specVersion, flowType);
warnings.forEach(warning => {
  showWarningToast(warning);
});

// Example warnings:
// "Implicit Flow is deprecated in OAuth 2.1"
// "ROPC is not recommended - use Authorization Code Flow instead"
// "Client Secret should not be used in browser-based applications"
```

## Phase 4: Testing & Documentation (Week 4)

### 4.1 Unit Tests

**Test Files**:
- `src/v8/services/__tests__/specVersionServiceV8.test.ts`
- `src/v8/services/__tests__/unifiedFlowOptionsServiceV8.test.ts`
- `src/v8/components/__tests__/CredentialsFormV8.test.tsx`

**Test Coverage**:
- Spec version availability
- Flow availability per spec
- Field visibility per spec/flow
- Checkbox availability per spec/flow
- Compliance validation
- Configuration validation

### 4.2 Integration Tests

**Test Scenarios**:
1. Switch from OAuth 2.0 to OAuth 2.1
   - Implicit Flow disappears
   - ROPC disappears
   - PKCE becomes required
   - HTTPS enforced

2. Switch from OAuth 2.0 to OIDC
   - Hybrid Flow appears
   - "openid" scope required
   - ID Token field appears
   - Post-Logout Redirect URI appears

3. Configure Authorization Code Flow (OIDC)
   - All OIDC fields visible
   - PKCE optional
   - Refresh Token optional
   - Post-Logout Redirect URI optional

### 4.3 Documentation

**Documents to Create**:
- `V8_UNIFIED_CREDENTIALS_DESIGN.md` ✅ (already created)
- `V8_UNIFIED_IMPLEMENTATION_ROADMAP.md` ✅ (this document)
- `V8_SPEC_VERSION_GUIDE.md` - User guide for spec versions
- `V8_OAUTH2.1_MIGRATION_GUIDE.md` - Migration guide for OAuth 2.1
- `V8_OIDC_CONFIGURATION_GUIDE.md` - OIDC configuration guide

## Implementation Details

### Spec Version Service Implementation

```typescript
// src/v8/services/specVersionServiceV8.ts

const SPEC_CONFIGS: Record<SpecVersion, SpecConfig> = {
  'oauth2.0': {
    name: 'OAuth 2.0',
    description: 'Standard OAuth 2.0 (RFC 6749)',
    supportedFlows: ['oauth-authz', 'implicit', 'client-credentials', 'ropc', 'device-code'],
    complianceRules: {
      requirePKCE: false,
      requireHTTPS: false,
      allowImplicit: true,
      allowROPC: true,
      requireOpenIDScope: false,
    }
  },
  'oauth2.1': {
    name: 'OAuth 2.1',
    description: 'Modern OAuth 2.0 (RFC 6749 + Security BCP)',
    supportedFlows: ['oauth-authz', 'client-credentials', 'device-code'],
    complianceRules: {
      requirePKCE: true,
      requireHTTPS: true,
      allowImplicit: false,
      allowROPC: false,
      requireOpenIDScope: false,
    }
  },
  'oidc': {
    name: 'OpenID Connect',
    description: 'Authentication layer on OAuth 2.0',
    supportedFlows: ['oauth-authz', 'implicit', 'hybrid', 'device-code'],
    complianceRules: {
      requirePKCE: false,
      requireHTTPS: false,
      allowImplicit: true,
      allowROPC: false,
      requireOpenIDScope: true,
    }
  }
};

export class SpecVersionServiceV8 {
  static getAvailableFlows(specVersion: SpecVersion): FlowType[] {
    return SPEC_CONFIGS[specVersion].supportedFlows;
  }

  static isFlowAvailable(specVersion: SpecVersion, flowType: FlowType): boolean {
    return this.getAvailableFlows(specVersion).includes(flowType);
  }

  static getComplianceRules(specVersion: SpecVersion): ComplianceRules {
    return SPEC_CONFIGS[specVersion].complianceRules;
  }

  static validateConfiguration(specVersion: SpecVersion, flowType: FlowType, config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check flow is available
    if (!this.isFlowAvailable(specVersion, flowType)) {
      errors.push(`${flowType} is not available in ${specVersion}`);
    }

    // Check compliance rules
    const rules = this.getComplianceRules(specVersion);
    
    if (rules.requirePKCE && !config.usePKCE) {
      errors.push(`${specVersion} requires PKCE`);
    }

    if (rules.requireHTTPS && config.redirectUri && !config.redirectUri.startsWith('https://')) {
      if (!config.redirectUri.startsWith('http://localhost')) {
        errors.push(`${specVersion} requires HTTPS for redirect URIs`);
      }
    }

    if (rules.requireOpenIDScope && !config.scopes?.includes('openid')) {
      errors.push(`${specVersion} requires "openid" scope`);
    }

    return { errors, warnings };
  }
}
```

### Unified Flow Options Service Implementation

```typescript
// src/v8/services/unifiedFlowOptionsServiceV8.ts

export class UnifiedFlowOptionsServiceV8 {
  static getOptionsForFlow(specVersion: SpecVersion, flowType: FlowType): FlowOptions {
    // Get base flow options
    const baseOptions = FlowOptionsServiceV8.getOptionsForFlow(flowType);

    // Apply spec-specific modifications
    if (specVersion === 'oauth2.1') {
      if (flowType === 'oauth-authz') {
        baseOptions.pkceEnforcement = 'REQUIRED';
      }
    }

    if (specVersion === 'oidc') {
      baseOptions.supportsIdToken = true;
      baseOptions.supportsUserInfo = true;
      baseOptions.supportsPostLogoutRedirectUri = true;
    }

    return baseOptions;
  }

  static getFieldVisibility(specVersion: SpecVersion, flowType: FlowType): FieldVisibility {
    const visibility: FieldVisibility = {
      showEnvironmentId: true,
      showClientId: true,
      showClientSecret: true,
      showRedirectUri: true,
      showPostLogoutRedirectUri: false,
      showScopes: true,
      showLoginHint: true,
      showResponseType: true,
      showAuthMethod: true,
      showIdToken: false,
      showUserInfo: false,
    };

    // Apply flow-specific visibility
    const flowOptions = FlowOptionsServiceV8.getOptionsForFlow(flowType);
    visibility.showClientSecret = !flowOptions.requiresClientSecret === false;
    visibility.showRedirectUri = flowOptions.requiresRedirectUri;
    visibility.showResponseType = flowOptions.responseTypes.length > 0;

    // Apply spec-specific visibility
    if (specVersion === 'oidc') {
      visibility.showPostLogoutRedirectUri = true;
      visibility.showIdToken = true;
      visibility.showUserInfo = true;
    }

    return visibility;
  }

  static getCheckboxAvailability(specVersion: SpecVersion, flowType: FlowType): CheckboxAvailability {
    const availability: CheckboxAvailability = {
      showPKCE: false,
      pkceRequired: false,
      showRefreshToken: false,
      showRedirectUriPatterns: false,
    };

    const flowOptions = FlowOptionsServiceV8.getOptionsForFlow(flowType);

    // PKCE checkbox
    if (flowType === 'oauth-authz' || flowType === 'hybrid') {
      availability.showPKCE = true;
      if (specVersion === 'oauth2.1') {
        availability.pkceRequired = true;
      }
    }

    // Refresh Token checkbox
    if (flowOptions.supportsRefreshToken) {
      availability.showRefreshToken = true;
    }

    // Redirect URI Patterns checkbox
    if (flowOptions.requiresRedirectUri) {
      availability.showRedirectUriPatterns = true;
    }

    return availability;
  }
}
```

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | Week 1 | Spec Version Service, Unified Flow Options Service, Updated Form Component |
| Phase 2 | Week 2 | Spec Selection UI, Flow Selection UI, Smart Field Visibility, Smart Checkboxes |
| Phase 3 | Week 3 | OAuth 2.1 Compliance, OIDC Compliance, Compliance Warnings |
| Phase 4 | Week 4 | Unit Tests, Integration Tests, Documentation |

## Success Criteria

✅ One unified form for all specs  
✅ Spec version selection with radio buttons  
✅ Dynamic flow type dropdown  
✅ Smart field visibility  
✅ Smart checkbox availability  
✅ OAuth 2.1 compliance enforcement  
✅ OIDC compliance validation  
✅ Comprehensive test coverage  
✅ Complete documentation  
✅ Zero breaking changes to existing flows  

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking existing flows | Keep backward compatibility, default to OAuth 2.0 |
| Complex state management | Use clear separation of concerns, comprehensive tests |
| User confusion | Clear UI labels, helpful descriptions, compliance warnings |
| Performance issues | Memoize expensive computations, lazy load advanced options |

---

**Version**: 8.0.0 (Roadmap)  
**Last Updated**: 2024-11-16  
**Status**: Ready for Implementation
