# Field Rules System

## Overview

The Field Rules System provides specification-compliant field visibility, editability, and validation for OAuth 2.0 and OIDC flows in the OAuth Playground application.

## Status

✅ **Implemented** - Version 1.0.0 (November 2024)

## Documentation

- **Requirements**: `docs/features/field-rules-requirements.md` - User stories and acceptance criteria
- **Design**: `docs/architecture/field-rules-design.md` - Architecture and component design
- **Tasks**: `docs/features/field-rules-tasks.md` - Implementation tasks (all completed)
- **Summary**: This document

## Implementation

### Core Service
- **File**: `src/services/fieldRulesService.ts`
- **Purpose**: Central service that determines field visibility, editability, and validation rules
- **Flows Supported**: 10+ OAuth/OIDC flows including Authorization Code, Implicit, Client Credentials, Device, Hybrid, CIBA, ROPC, JWT Bearer, SAML Bearer, and Mock flows

### UI Components
- **ReadOnlyField** (`src/components/ReadOnlyField.tsx`) - Displays locked fields with explanations
- **HiddenFieldExplanation** (`src/components/HiddenFieldExplanation.tsx`) - Shows why fields are hidden
- **FieldTooltip** (`src/components/FieldTooltip.tsx`) - Provides hover tooltips with spec references

### Integration Points
- **CredentialsInput** (`src/components/CredentialsInput.tsx`) - Updated to consume field rules
- **ComprehensiveCredentialsService** (`src/services/comprehensiveCredentialsService.tsx`) - Computes and passes field rules

## Key Features

✅ Specification-compliant field visibility and editability
✅ Educational explanations for all restrictions
✅ RFC/spec references for each rule
✅ Support for all major OAuth 2.0 and OIDC flows
✅ Mock flow detection and handling
✅ Accessible components with ARIA labels
✅ Tooltips with 300ms hover delay

## Examples

### Client Credentials Flow
- **Redirect URI**: Hidden (machine-to-machine flow doesn't use browser redirects)
- **Response Type**: Hidden (uses direct token endpoint access)
- **Explanation**: "Client Credentials is a machine-to-machine flow that doesn't use browser redirects" with link to RFC 6749 Section 4.4

### OIDC Authorization Code Flow
- **Scope**: Must include "openid" (enforced by spec)
- **Response Type**: Can be "code" or "code id_token"
- **Post-Logout Redirect URI**: Visible (OIDC session management)

### Mock Flows
- **All Fields**: Optional (allows experimentation without valid credentials)
- **Explanation**: Educational notes about mock behavior

## Usage

The field rules are automatically applied based on the `flowType` prop passed to `ComprehensiveCredentialsService`:

```typescript
<ComprehensiveCredentialsService
  flowType="client-credentials-v7"
  isOIDC={false}
  // ... other props
/>
```

The service will:
1. Detect the flow type
2. Query `fieldRulesService.getFieldRules(flowType, isOIDC)`
3. Pass rules to `CredentialsInput`
4. Render fields with appropriate visibility, editability, and explanations

## Adding New Flows

To add rules for a new flow type:

1. Open `src/services/fieldRulesService.ts`
2. Create a new function like `getYourFlowRules(): FlowFieldRules`
3. Define rules for each field with explanations and spec references
4. Add flow detection logic in `getFieldRules()` function
5. Test the flow to verify correct field behavior

## References

- **RFC 6749**: OAuth 2.0 Authorization Framework
- **OpenID Connect Core 1.0**: OIDC Specification
- **RFC 8628**: OAuth 2.0 Device Authorization Grant
- **RFC 9436**: CIBA (Client Initiated Backchannel Authentication)
- **RFC 7523**: JWT Bearer Token Profile
- **RFC 7522**: SAML Bearer Assertion Profile

## Related Documentation

- [Comprehensive Credentials Service Review](../COMPREHENSIVE_CREDENTIALS_SERVICE_REVIEW.md)
- [OAuth/OIDC Training](../guides/oauth-oidc-training.md)
- [Flow Comparison Tool](../features/flow-comparison-tool.md)

## Archive

Previous planning documents have been moved to `docs/archive/`:
- `FIELD_RULES_IMPLEMENTATION_PLAN.md` (superseded by spec)
- `OAUTH_OIDC_FIELD_RULES_SPECIFICATION.md` (superseded by spec)
