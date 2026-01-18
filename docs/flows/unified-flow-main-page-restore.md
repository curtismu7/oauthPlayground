# Unified Flow Main Page Restore Document

**Last Updated:** 2026-01-27  
**Version:** 1.0.0  
**Purpose:** Implementation details for restoring the Unified Flow main page if it breaks or drifts  
**Usage:** Use this document to restore correct implementations when the Unified Flow main page breaks or regresses

---

## Related Documentation

- [Unified Flow Main Page UI Contract](./unified-flow-main-page-ui-contract.md) - UI behavior contracts
- [Unified Flow Main Page UI Documentation](./unified-flow-main-page-ui-doc.md) - Complete UI structure

---

## Overview

This document provides implementation details, code snippets, and restoration guidance for the Unified OAuth/OIDC Flow main page (`UnifiedOAuthFlowV8U.tsx`, `SpecVersionSelector.tsx`, `UnifiedFlowSteps.tsx`).

---

## File Locations

**Components:**
- `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` - Main Unified Flow component
- `src/v8u/components/SpecVersionSelector.tsx` - Specification version selector component
- `src/v8u/components/UnifiedFlowSteps.tsx` - Flow steps renderer component

**Services:**
- `src/v8/services/specVersionServiceV8.ts` - Spec version management
- `src/v8/services/specUrlServiceV8.ts` - Spec URL management
- `src/v8/services/unifiedFlowIntegrationServiceV8U.ts` - Unified flow integration
- `src/v8/services/unifiedFlowDocumentationServiceV8U.ts` - Documentation generation

---

## Critical Implementation Details

### 1. Locked Selector Behavior (After Step 0)

**Contract:** Specification version and flow type selectors MUST be locked and disabled after Step 0.

**Correct Implementation:**
```typescript
// In UnifiedOAuthFlowV8U.tsx
const currentStep = useMemo(() => {
  if (urlStep) {
    const stepNum = parseInt(urlStep, 10);
    if (!Number.isNaN(stepNum) && stepNum >= 0) {
      return stepNum;
    }
  }
  return 0;
}, [urlStep]);

// Pass disabled prop to selectors
<SpecVersionSelector
  specVersion={specVersion}
  onChange={handleSpecVersionChange}
  disabled={currentStep > 0}  // Locked after Step 0
/>
<FlowTypeSelector
  specVersion={specVersion}
  flowType={flowType}
  onChange={handleFlowTypeChange}
  disabled={currentStep > 0}  // Locked after Step 0
/>
```

**In SpecVersionSelector.tsx:**
```typescript
export interface SpecVersionSelectorProps {
  specVersion: SpecVersion;
  onChange: (specVersion: SpecVersion) => void;
  disabled?: boolean;  // Required prop
}

export const SpecVersionSelector: React.FC<SpecVersionSelectorProps> = ({
  specVersion,
  onChange,
  disabled = false,
}) => {
  // ... component implementation
  
  // Radio buttons must be disabled when disabled={true}
  <input
    type="radio"
    name="specVersion"
    value={spec}
    checked={isSelected}
    onChange={handleChange}
    disabled={disabled}  // Critical
    style={{
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  />
  
  // Label must show "(Locked - flow in progress)" when disabled
  <label>
    Specification Version
    {disabled && (
      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
        (Locked - flow in progress)
      </span>
    )}
  </label>
};
```

**In FlowTypeSelector.tsx:**
```typescript
export interface FlowTypeSelectorProps {
  specVersion: SpecVersion;
  flowType: FlowType;
  onChange: (flowType: FlowType) => void | Promise<void>;
  disabled?: boolean;  // Required prop
}

export const FlowTypeSelector: React.FC<FlowTypeSelectorProps> = ({
  specVersion,
  flowType,
  onChange,
  disabled = false,
}) => {
  // ... component implementation
  
  // Select must be disabled when disabled={true}
  <select
    id="flowTypeSelect"
    value={effectiveFlowType}
    onChange={handleChange}
    disabled={disabled}  // Critical
    style={{
      color: disabled ? '#9ca3af' : '#374151',
      background: disabled ? '#f3f4f6' : '#ffffff',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    }}
    title={disabled ? 'Flow type cannot be changed after starting the flow. Use "Restart Flow" to change flow type.' : undefined}
  >
    {/* options */}
  </select>
  
  // Label must show "(Locked - flow in progress)" when disabled
  <label>
    Flow Type (Grant type)
    {disabled && (
      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
        (Locked - flow in progress)
      </span>
    )}
  </label>
};
```

**Visual Requirements:**
- When `disabled={true}`:
  - Radio buttons/select must be grayed out (color: `#9ca3af`)
  - Background must be `#f3f4f6` for select
  - Opacity must be 0.6
  - Cursor must be `not-allowed`
  - Label must show "(Locked - flow in progress)"
  - Tooltip must explain how to change (use "Restart Flow")

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Not checking currentStep
<SpecVersionSelector
  specVersion={specVersion}
  onChange={handleSpecVersionChange}
  // Missing disabled prop - selectors can be changed mid-flow
/>

// ❌ WRONG - Not implementing disabled state
export const SpecVersionSelector: React.FC<SpecVersionSelectorProps> = ({
  specVersion,
  onChange,
  // Missing disabled prop
}) => {
  // No disabled handling - selectors remain interactive
};
```

---

### 2. Protocol Terminology

**Contract:** All educational content and UI labels MUST use correct protocol terminology.

**Correct Implementation:**
```typescript
// In SpecVersionSelector.tsx
const SPEC_VERSION_LABELS = {
  'oauth2.0': 'OAuth 2.0',
  'oidc': 'OIDC Core 1.0',
  'oauth2.1': 'OAuth 2.1 / OIDC 2.1',
};

const SPEC_VERSION_DESCRIPTIONS = {
  'oauth2.0': 'OAuth 2.0 Authorization Framework (RFC 6749) - The baseline OAuth framework for authorization',
  'oidc': 'OpenID Connect Core 1.0 - Authentication layer built on top of OAuth 2.0, adding ID tokens, UserInfo endpoint, and openid scope',
  'oauth2.1': 'OAuth 2.1 Authorization Framework (draft) / OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline) - Consolidated OAuth 2.0 specification (still an Internet-Draft, not an RFC yet)',
};

// In educational content (UnifiedFlowSteps.tsx)
const getProtocolName = (specVersion: SpecVersion): string => {
  switch (specVersion) {
    case 'oauth2.0':
      return 'OAuth 2.0 Authorization Framework (RFC 6749)';
    case 'oidc':
      return 'OpenID Connect Core 1.0';
    case 'oauth2.1':
      return 'OAuth 2.1 Authorization Framework (draft)'; // Always mention "draft"
    default:
      return 'OAuth 2.0';
  }
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Using incorrect labels
const SPEC_VERSION_LABELS = {
  'oauth2.0': 'OAuth 2.0',
  'oidc': 'OpenID Connect (OIDC)', // Should be "OIDC Core 1.0"
  'oauth2.1': 'OAuth 2.1', // Should be "OAuth 2.1 / OIDC 2.1"
};

// ❌ WRONG - Not mentioning "draft" for OAuth 2.1
const getProtocolName = (specVersion: SpecVersion): string => {
  switch (specVersion) {
    case 'oauth2.1':
      return 'OAuth 2.1 Authorization Framework'; // Should include "(draft)"
    default:
      return 'OAuth 2.0';
  }
};
```

---

### 2. Spec Version Selector Button Order

**Contract:** Spec version buttons MUST be ordered left to right: OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1.

**Correct Implementation:**
```typescript
// In SpecVersionSelector.tsx
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
  {/* Order: OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1 */}
  <label>
    <input type="radio" checked={specVersion === 'oauth2.0'} onChange={() => setSpecVersion('oauth2.0')} />
    <span>OAuth 2.0</span>
  </label>
  <label>
    <input type="radio" checked={specVersion === 'oidc'} onChange={() => setSpecVersion('oidc')} />
    <span>OIDC Core 1.0</span>
  </label>
  <label>
    <input type="radio" checked={specVersion === 'oauth2.1'} onChange={() => setSpecVersion('oauth2.1')} />
    <span>OAuth 2.1 / OIDC 2.1</span>
  </label>
</div>
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Incorrect order
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
  <label><span>OAuth 2.1</span></label> {/* Should be last */}
  <label><span>OAuth 2.0</span></label>
  <label><span>OIDC</span></label> {/* Should be second, and should be "OIDC Core 1.0" */}
</div>
```

---

### 3. Educational Content Protocol Terminology

**Contract:** All educational content MUST use correct protocol terminology.

**Correct Implementation:**
```typescript
// In UnifiedFlowSteps.tsx
const renderEducationalContent = (specVersion: SpecVersion, flowType: FlowType) => {
  const protocolName = getProtocolName(specVersion);
  
  return (
    <div>
      <h3>About {protocolName}</h3>
      {specVersion === 'oauth2.1' && (
        <p>
          <strong>Note:</strong> OAuth 2.1 is still an Internet-Draft (not an RFC yet). 
          It's safest to refer to it as "OAuth 2.1 (draft)". If someone says "OIDC 2.1," 
          the precise term is: "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)."
        </p>
      )}
      {/* ... rest of educational content */}
    </div>
  );
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Using incorrect terminology
const renderEducationalContent = (specVersion: SpecVersion, flowType: FlowType) => {
  return (
    <div>
      <h3>About {specVersion === 'oauth2.1' ? 'OAuth 2.1' : 'OAuth 2.0'}</h3>
      {/* Missing "(draft)" mention for OAuth 2.1 */}
      {/* Missing clarification for "OIDC 2.1" */}
    </div>
  );
};
```

---

### 4. RFC Anchor Formats

**Contract:** RFC references MUST use correct anchor formats.

**Correct Implementation:**
```typescript
// In specUrlServiceV8.ts
export const SPEC_URLS = {
  OAUTH2_RFC6749: 'https://datatracker.ietf.org/doc/html/rfc6749',
  // ... other URLs
};

// For specific sections:
const getAuthzCodeSection = () => `${SPEC_URLS.OAUTH2_RFC6749}#section-4.1`;
const getImplicitSection = () => `${SPEC_URLS.OAUTH2_RFC6749}#section-4.2`;
const getClientCredentialsSection = () => `${SPEC_URLS.OAUTH2_RFC6749}#section-4.4`;
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Using old RFC URL format
export const SPEC_URLS = {
  OAUTH2_RFC6749: 'https://tools.ietf.org/html/rfc6749', // Should use datatracker.ietf.org
  // ... other URLs
};

// ❌ WRONG - Missing section anchors
const getAuthzCodeSection = () => SPEC_URLS.OAUTH2_RFC6749; // Should include #section-4.1
```

---

### 5. Flow Availability Filtering

**Contract:** Flow availability MUST be filtered based on selected spec version.

**Correct Implementation:**
```typescript
// In UnifiedOAuthFlowV8U.tsx
const getAvailableFlows = (specVersion: SpecVersion): FlowType[] => {
  const allFlows: FlowType[] = ['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'hybrid'];
  
  switch (specVersion) {
    case 'oauth2.0':
      // OAuth 2.0: All flows except Hybrid
      return allFlows.filter(flow => flow !== 'hybrid');
    case 'oidc':
      // OIDC Core 1.0: Authorization Code, Hybrid, Device Code (with openid scope)
      return ['oauth-authz', 'hybrid', 'device-code'];
    case 'oauth2.1':
      // OAuth 2.1: Authorization Code (PKCE only), Client Credentials, Device Code
      // Implicit is deprecated, Hybrid is OIDC-only
      return ['oauth-authz', 'client-credentials', 'device-code'];
    default:
      return allFlows;
  }
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Not filtering flows by spec version
const getAvailableFlows = (specVersion: SpecVersion): FlowType[] => {
  // Returns all flows regardless of spec version
  return ['oauth-authz', 'implicit', 'client-credentials', 'device-code', 'hybrid'];
};
```

---

### 6. OAuth 2.1 PKCE Requirement

**Contract:** OAuth 2.1 Authorization Code flows MUST require PKCE.

**Correct Implementation:**
```typescript
// In UnifiedFlowSteps.tsx
const shouldRequirePKCE = (specVersion: SpecVersion, flowType: FlowType): boolean => {
  if (flowType !== 'oauth-authz') return false;
  
  // OAuth 2.1 requires PKCE for Authorization Code flow
  return specVersion === 'oauth2.1';
};

// In flow variation filtering
const getAvailableAuthzVariations = (specVersion: SpecVersion): UnifiedVariation[] => {
  const allVariations: UnifiedVariation[] = [
    'authz-client-secret-post',
    'authz-client-secret-basic',
    'authz-client-secret-jwt',
    'authz-private-key-jwt',
    'authz-pkce',
    'authz-pkce-par',
    'authz-pi-flow',
  ];
  
  if (specVersion === 'oauth2.1') {
    // OAuth 2.1 only allows PKCE-based variations
    return ['authz-pkce', 'authz-pkce-par'];
  }
  
  return allVariations;
};
```

**Incorrect Implementation (DO NOT DO THIS):**
```typescript
// ❌ WRONG - Not enforcing PKCE requirement for OAuth 2.1
const getAvailableAuthzVariations = (specVersion: SpecVersion): UnifiedVariation[] => {
  // Returns all variations even for OAuth 2.1
  return allVariations; // Should filter to only PKCE variations for OAuth 2.1
};
```

---

## Common Issues and Fixes

### Issue 1: Incorrect Protocol Terminology

**Symptom:** Educational content uses incorrect protocol names (e.g., "OAuth 2.1" instead of "OAuth 2.1 (draft)").

**Fix:**
- Update all educational content to use correct terminology
- Add "(draft)" mention for OAuth 2.1
- Clarify "OIDC 2.1" as "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)"

### Issue 2: Incorrect Button Order

**Symptom:** Spec version buttons are in wrong order.

**Fix:**
- Ensure buttons are ordered: OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1 (left to right)

### Issue 3: Missing RFC Section Anchors

**Symptom:** RFC links don't point to specific sections.

**Fix:**
- Update RFC URLs to use `datatracker.ietf.org` format
- Add specific section anchors (e.g., `#section-4.1` for Authorization Code)

### Issue 4: Flows Not Filtered by Spec Version

**Symptom:** All flows are available regardless of selected spec version.

**Fix:**
- Implement flow filtering based on spec version
- Hide or disable flows not available in selected spec version
- Show explanation why flows are not available

### Issue 5: OAuth 2.1 Not Requiring PKCE

**Symptom:** OAuth 2.1 Authorization Code flows allow non-PKCE variations.

**Fix:**
- Filter Authorization Code variations for OAuth 2.1 to only PKCE-based flows
- Show warning if user tries to use non-PKCE variation with OAuth 2.1

---

## Related Files

- `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` - Main Unified Flow component
- `src/v8u/components/SpecVersionSelector.tsx` - Spec version selector
- `src/v8u/components/UnifiedFlowSteps.tsx` - Flow steps renderer
- `src/v8/services/specVersionServiceV8.ts` - Spec version service
- `src/v8/services/specUrlServiceV8.ts` - Spec URL service
- `src/v8/services/unifiedFlowDocumentationServiceV8U.ts` - Documentation service

---

## Testing Checklist

- [ ] Protocol terminology is correct in all UI labels
- [ ] Protocol terminology is correct in all educational content
- [ ] Spec version buttons are in correct order (OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1)
- [ ] Guidance text box displays correct educational content for selected spec version
- [ ] Flow availability is filtered correctly by spec version
- [ ] OAuth 2.1 only shows PKCE-based Authorization Code flows
- [ ] RFC references use correct anchor formats (`datatracker.ietf.org`)
- [ ] RFC references include specific section anchors
- [ ] OAuth 2.1 mentions "(draft)" status in educational content
- [ ] "OIDC 2.1" is clarified as "OIDC Core 1.0 using Authorization Code + PKCE (OAuth 2.1 / RFC 9700 baseline)"

---

## Version History

- **v1.0.0** (2026-01-27): Initial Unified Flow Main Page restore documentation with protocol terminology implementation details (OAuth 2.0, OIDC Core 1.0, OAuth 2.1 / OIDC 2.1)
