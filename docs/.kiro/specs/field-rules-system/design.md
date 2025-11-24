# Design Document

## Overview

The Field Rules System is a centralized service-based architecture that enforces OAuth 2.0 and OIDC specification compliance by controlling field visibility, editability, and validation in the OAuth Playground application. The system provides educational explanations for all field restrictions, helping developers understand why certain fields are required, optional, or hidden for specific flow types.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Flow Components                          │
│  (AuthorizationCodeFlowV7, ImplicitFlowV7, etc.)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         ComprehensiveCredentialsService                      │
│  - Consumes field rules                                      │
│  - Passes rules to CredentialsInput                         │
│  - Enforces OIDC scope requirements                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              fieldRulesService.ts                            │
│  - Central source of truth for all field rules              │
│  - Maps flow types to field configurations                  │
│  - Provides RFC references                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              CredentialsInput Component                      │
│  - Renders fields based on rules                            │
│  - Shows/hides fields                                       │
│  - Applies read-only styling                                │
│  - Displays explanations                                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Flow Component** (e.g., `ClientCredentialsFlowV7`) specifies `flowType` prop
2. **ComprehensiveCredentialsService** queries `fieldRulesService` with flowType and isOIDC flag
3. **fieldRulesService** returns field rules object with visibility, editability, and validation rules
4. **ComprehensiveCredentialsService** passes rules to `CredentialsInput` component
5. **CredentialsInput** renders UI based on rules, showing explanations for restrictions

## Components and Interfaces

### 1. Field Rules Service (`src/services/fieldRulesService.ts`)

The central service that defines all field rules for every flow type.

#### Core Interfaces

```typescript
/**
 * Rule for a single credential field
 */
interface FieldRule {
  // Visibility and editability
  visible: boolean;           // Should the field be shown?
  editable: boolean;          // Can the user edit it?
  required: boolean;          // Is it required for the flow?
  
  // Validation
  validValues?: string[];     // Allowed values (for dropdowns)
  enforcedValue?: string;     // Fixed value (for read-only fields)
  
  // Educational content
  explanation?: string;       // Why is this field restricted?
  specReference?: string;     // RFC section reference
}

/**
 * Complete set of field rules for a flow
 */
interface FlowFieldRules {
  environmentId: FieldRule;
  clientId: FieldRule;
  clientSecret: FieldRule;
  redirectUri: FieldRule;
  scope: FieldRule;
  responseType: FieldRule;
  loginHint: FieldRule;
  postLogoutRedirectUri: FieldRule;
  clientAuthMethod: FieldRule;
}

/**
 * Main service interface
 */
interface FieldRulesService {
  /**
   * Get field rules for a specific flow type
   * @param flowType - The flow identifier (e.g., 'authorization-code-v7')
   * @param isOIDC - Whether this is an OIDC flow variant
   * @param isMock - Whether this is a mock/demo flow
   * @returns Complete field rules for the flow
   */
  getFieldRules(flowType: string, isOIDC: boolean, isMock?: boolean): FlowFieldRules;
  
  /**
   * Get valid response types for a flow
   * @param flowType - The flow identifier
   * @param isOIDC - Whether this is an OIDC flow variant
   * @returns Array of valid response types
   */
  getValidResponseTypes(flowType: string, isOIDC: boolean): string[];
  
  /**
   * Check if a field should be visible
   * @param flowType - The flow identifier
   * @param fieldName - Name of the field
   * @param isOIDC - Whether this is an OIDC flow variant
   * @returns true if field should be visible
   */
  isFieldVisible(flowType: string, fieldName: keyof FlowFieldRules, isOIDC: boolean): boolean;
  
  /**
   * Detect if a flow type is a mock flow
   * @param flowType - The flow identifier
   * @returns true if this is a mock flow
   */
  isMockFlow(flowType: string): boolean;
}
```

#### Flow Type Mapping

The service will support all V7 flows currently in the application:

**OAuth 2.0 Flows:**
- `authorization-code-v7` - Authorization Code Flow
- `implicit-v7` - Implicit Flow
- `client-credentials-v7` - Client Credentials Flow
- `device-authorization-v7` - Device Authorization Flow
- `ropc-v7` - Resource Owner Password Credentials
- `worker-token-v7` - Worker Token (Client Credentials variant)

**OIDC Flows:**
- `oidc-authorization-code-v7` - OIDC Authorization Code
- `oidc-implicit-v7` - OIDC Implicit
- `oidc-hybrid-v7` - OIDC Hybrid
- `ciba-v7` - Client Initiated Backchannel Authentication

**Advanced Flows:**
- `par-v7` - Pushed Authorization Request
- `rar-v7` - Rich Authorization Request
- `jwt-bearer-v7` - JWT Bearer Token
- `saml-bearer-v7` - SAML Bearer Assertion
- `token-exchange-v7` - Token Exchange
- `dpop-v7` - Demonstrating Proof of Possession

**Mock Flows:**
- `authorization-code-v7-mock` - Mock Authorization Code Flow
- `device-authorization-mock` - Mock Device Flow
- `pingone-mfa-mock` - Mock PingOne MFA Flow
- `redirectless-mock` - Mock Redirectless Flow
- Any flow with `-mock` suffix or `Mock` in the name

**Mock Flow Behavior:**
Mock flows use simulated credentials and don't require real PingOne configuration. Field rules for mock flows will:
- Mark credential fields as optional (not required)
- Provide placeholder/example values
- Show educational notes explaining the mock behavior
- Allow users to experiment without valid credentials

### 2. Enhanced CredentialsInput Component

#### New Props

```typescript
interface CredentialsInputProps {
  // ... existing props ...
  
  // New field rules props
  fieldRules?: FlowFieldRules;           // Rules from fieldRulesService
  showFieldExplanations?: boolean;       // Show why fields are hidden/locked
}
```

#### New Sub-Components

**ReadOnlyField Component:**
```typescript
interface ReadOnlyFieldProps {
  label: string;
  value: string;
  explanation: string;
  specReference?: string;
  icon?: React.ReactNode;
}

// Renders a field with lock icon and explanation
const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ ... }) => {
  return (
    <FormField>
      <FormLabel>
        <FiLock size={14} />
        {label}
      </FormLabel>
      <ReadOnlyInput value={value} />
      <ExplanationText>
        {explanation}
        {specReference && (
          <SpecLink href={specReference} target="_blank">
            View Specification →
          </SpecLink>
        )}
      </ExplanationText>
    </FormField>
  );
};
```

**HiddenFieldExplanation Component:**
```typescript
interface HiddenFieldExplanationProps {
  fieldName: string;
  reason: string;
  specReference?: string;
}

// Shows why a field is not applicable
const HiddenFieldExplanation: React.FC<HiddenFieldExplanationProps> = ({ ... }) => {
  return (
    <InfoPanel>
      <InfoIcon><FiInfo /></InfoIcon>
      <InfoContent>
        <strong>{fieldName}</strong> is not used in this flow.
        <br />
        {reason}
        {specReference && (
          <SpecLink href={specReference}>Learn more →</SpecLink>
        )}
      </InfoContent>
    </InfoPanel>
  );
};
```

### 3. ComprehensiveCredentialsService Integration

The service will be enhanced to consume and apply field rules:

```typescript
const ComprehensiveCredentialsService: React.FC<ComprehensiveCredentialsProps> = ({
  flowType,
  isOIDC,
  // ... other props
}) => {
  // Get field rules for this flow
  const fieldRules = useMemo(() => {
    if (!flowType) return null;
    return fieldRulesService.getFieldRules(flowType, isOIDC ?? false);
  }, [flowType, isOIDC]);
  
  // Enforce OIDC scope requirements
  useEffect(() => {
    if (isOIDC && fieldRules?.scope.enforcedValue) {
      const currentScopes = credentials?.scope || '';
      if (!currentScopes.includes('openid')) {
        // Auto-add openid scope
        const newScopes = currentScopes ? `openid ${currentScopes}` : 'openid';
        onCredentialsChange?.({
          ...credentials,
          scope: newScopes
        });
      }
    }
  }, [isOIDC, fieldRules, credentials]);
  
  return (
    <CredentialsInput
      {...props}
      fieldRules={fieldRules}
      showFieldExplanations={true}
    />
  );
};
```

## Data Models

### Field Rule Examples

**Authorization Code Flow (OAuth):**
```typescript
{
  environmentId: {
    visible: true,
    editable: true,
    required: true,
    explanation: "PingOne Environment ID where your application is configured"
  },
  clientId: {
    visible: true,
    editable: true,
    required: true,
    explanation: "OAuth 2.0 Client Identifier"
  },
  clientSecret: {
    visible: true,
    editable: true,
    required: true,
    explanation: "Client Secret for confidential clients",
    specReference: "RFC 6749 Section 2.3.1"
  },
  redirectUri: {
    visible: true,
    editable: true,
    required: true,
    explanation: "URI where authorization server redirects after authentication",
    specReference: "RFC 6749 Section 3.1.2"
  },
  scope: {
    visible: true,
    editable: true,
    required: false,
    explanation: "Space-separated list of access scopes"
  },
  responseType: {
    visible: true,
    editable: false,
    required: true,
    enforcedValue: "code",
    validValues: ["code"],
    explanation: "Fixed to 'code' for Authorization Code Flow",
    specReference: "RFC 6749 Section 4.1.1"
  },
  loginHint: {
    visible: true,
    editable: true,
    required: false,
    explanation: "Optional hint about user identifier"
  },
  postLogoutRedirectUri: {
    visible: false,
    editable: false,
    required: false,
    explanation: "Not applicable to OAuth 2.0 flows (OIDC only)"
  },
  clientAuthMethod: {
    visible: true,
    editable: true,
    required: true,
    validValues: ["client_secret_basic", "client_secret_post", "client_secret_jwt", "private_key_jwt"],
    explanation: "Method for authenticating the client at token endpoint"
  }
}
```

**Client Credentials Flow:**
```typescript
{
  environmentId: {
    visible: true,
    editable: true,
    required: true
  },
  clientId: {
    visible: true,
    editable: true,
    required: true
  },
  clientSecret: {
    visible: true,
    editable: true,
    required: true
  },
  redirectUri: {
    visible: false,
    editable: false,
    required: false,
    explanation: "Client Credentials is a machine-to-machine flow that doesn't use browser redirects",
    specReference: "RFC 6749 Section 4.4"
  },
  scope: {
    visible: true,
    editable: true,
    required: false
  },
  responseType: {
    visible: false,
    editable: false,
    required: false,
    explanation: "Client Credentials flow uses direct token endpoint access, no authorization endpoint",
    specReference: "RFC 6749 Section 4.4"
  },
  loginHint: {
    visible: false,
    editable: false,
    required: false,
    explanation: "No user authentication in machine-to-machine flows"
  },
  postLogoutRedirectUri: {
    visible: false,
    editable: false,
    required: false
  },
  clientAuthMethod: {
    visible: true,
    editable: true,
    required: true,
    validValues: ["client_secret_basic", "client_secret_post", "client_secret_jwt", "private_key_jwt"]
  }
}
```

**OIDC Authorization Code Flow:**
```typescript
{
  // ... same as OAuth Authorization Code, plus:
  scope: {
    visible: true,
    editable: true,
    required: true,
    enforcedValue: "openid", // Must include openid
    explanation: "Must include 'openid' scope for OIDC flows",
    specReference: "OIDC Core Section 3.1.2.1"
  },
  postLogoutRedirectUri: {
    visible: true,
    editable: true,
    required: false,
    explanation: "URI where user is redirected after logout",
    specReference: "OIDC Session Management Section 5"
  },
  responseType: {
    visible: true,
    editable: true,
    required: true,
    validValues: ["code", "code id_token"],
    explanation: "OIDC allows code or code with ID token",
    specReference: "OIDC Core Section 3.1.2.1"
  }
}
```

**Mock Flow (any flow with -mock suffix):**
```typescript
{
  environmentId: {
    visible: true,
    editable: true,
    required: false, // Not required for mock flows
    explanation: "Optional for mock flows - uses simulated environment"
  },
  clientId: {
    visible: true,
    editable: true,
    required: false, // Not required for mock flows
    explanation: "Optional for mock flows - uses demo credentials"
  },
  clientSecret: {
    visible: true,
    editable: true,
    required: false, // Not required for mock flows
    explanation: "Optional for mock flows - uses demo credentials"
  },
  redirectUri: {
    visible: true,
    editable: true,
    required: false,
    explanation: "Mock flows use simulated redirects"
  },
  scope: {
    visible: true,
    editable: true,
    required: false,
    explanation: "Optional for mock flows - defaults provided"
  },
  // ... other fields follow same pattern: visible but not required
}
```

## Error Handling

### Validation Errors

The system will provide clear, actionable error messages:

```typescript
interface FieldValidationError {
  field: keyof FlowFieldRules;
  message: string;
  suggestion: string;
  specReference?: string;
}

// Example errors:
{
  field: "scope",
  message: "OIDC flows require 'openid' scope",
  suggestion: "Add 'openid' to your scopes list",
  specReference: "OIDC Core Section 3.1.2.1"
}

{
  field: "redirectUri",
  message: "Redirect URI is required for Authorization Code Flow",
  suggestion: "Enter a valid redirect URI that matches your PingOne application configuration",
  specReference: "RFC 6749 Section 3.1.2"
}
```

### Error Display

Errors will be shown inline with the field and in a summary panel:

```typescript
<FormField>
  <FormLabel>Scopes</FormLabel>
  <FormInput hasError={true} />
  <ErrorMessage>
    <FiAlertCircle />
    OIDC flows require 'openid' scope
    <ErrorAction onClick={autoFix}>Auto-fix</ErrorAction>
  </ErrorMessage>
</FormField>
```

## Testing Strategy

### Unit Tests

**Field Rules Service Tests:**
```typescript
describe('fieldRulesService', () => {
  describe('getFieldRules', () => {
    it('should return correct rules for Authorization Code Flow', () => {
      const rules = fieldRulesService.getFieldRules('authorization-code-v7', false);
      expect(rules.redirectUri.visible).toBe(true);
      expect(rules.redirectUri.required).toBe(true);
      expect(rules.responseType.editable).toBe(false);
      expect(rules.responseType.enforcedValue).toBe('code');
    });
    
    it('should hide redirect URI for Client Credentials Flow', () => {
      const rules = fieldRulesService.getFieldRules('client-credentials-v7', false);
      expect(rules.redirectUri.visible).toBe(false);
      expect(rules.redirectUri.explanation).toContain('machine-to-machine');
    });
    
    it('should enforce openid scope for OIDC flows', () => {
      const rules = fieldRulesService.getFieldRules('authorization-code-v7', true);
      expect(rules.scope.enforcedValue).toBe('openid');
      expect(rules.scope.explanation).toContain('OIDC');
    });
  });
  
  describe('getValidResponseTypes', () => {
    it('should return only "code" for OAuth Authorization Code', () => {
      const types = fieldRulesService.getValidResponseTypes('authorization-code-v7', false);
      expect(types).toEqual(['code']);
    });
    
    it('should return code and code id_token for OIDC Authorization Code', () => {
      const types = fieldRulesService.getValidResponseTypes('authorization-code-v7', true);
      expect(types).toEqual(['code', 'code id_token']);
    });
    
    it('should return empty array for Client Credentials', () => {
      const types = fieldRulesService.getValidResponseTypes('client-credentials-v7', false);
      expect(types).toEqual([]);
    });
  });
});
```

**Component Tests:**
```typescript
describe('CredentialsInput with Field Rules', () => {
  it('should hide redirect URI when rule says not visible', () => {
    const rules = {
      redirectUri: { visible: false, editable: false, required: false }
    };
    render(<CredentialsInput fieldRules={rules} />);
    expect(screen.queryByLabelText(/redirect uri/i)).not.toBeInTheDocument();
  });
  
  it('should show read-only field with lock icon', () => {
    const rules = {
      responseType: {
        visible: true,
        editable: false,
        required: true,
        enforcedValue: 'code',
        explanation: 'Fixed by specification'
      }
    };
    render(<CredentialsInput fieldRules={rules} />);
    expect(screen.getByLabelText(/response type/i)).toHaveAttribute('readonly');
    expect(screen.getByText(/fixed by specification/i)).toBeInTheDocument();
  });
  
  it('should show explanation for hidden field', () => {
    const rules = {
      redirectUri: {
        visible: false,
        explanation: 'Not used in machine-to-machine flows'
      }
    };
    render(<CredentialsInput fieldRules={rules} showFieldExplanations={true} />);
    expect(screen.getByText(/not used in machine-to-machine/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

**End-to-End Flow Tests:**
```typescript
describe('Field Rules Integration', () => {
  it('should apply correct rules for Client Credentials Flow', async () => {
    render(<ClientCredentialsFlowV7 />);
    
    // Should show client credentials
    expect(screen.getByLabelText(/client id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client secret/i)).toBeInTheDocument();
    
    // Should NOT show redirect URI
    expect(screen.queryByLabelText(/redirect uri/i)).not.toBeInTheDocument();
    
    // Should show explanation
    expect(screen.getByText(/machine-to-machine/i)).toBeInTheDocument();
  });
  
  it('should enforce openid scope for OIDC flows', async () => {
    render(<OIDCAuthorizationCodeFlowV7 />);
    
    const scopeInput = screen.getByLabelText(/scopes/i);
    
    // Try to remove openid
    fireEvent.change(scopeInput, { target: { value: 'profile email' } });
    fireEvent.blur(scopeInput);
    
    // Should auto-restore openid
    await waitFor(() => {
      expect(scopeInput).toHaveValue('openid profile email');
    });
    
    // Should show warning
    expect(screen.getByText(/openid.*required/i)).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

For each flow type:
- [ ] Verify correct fields are visible
- [ ] Verify correct fields are editable
- [ ] Verify read-only fields show lock icon
- [ ] Verify explanations are clear and accurate
- [ ] Verify spec references link to correct sections
- [ ] Verify OIDC scope enforcement works
- [ ] Verify response type restrictions work
- [ ] Verify hidden field explanations appear

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Create `fieldRulesService.ts` with core interfaces
- Implement rules for 5 core flows:
  - Authorization Code (OAuth & OIDC)
  - Client Credentials
  - Implicit (OAuth & OIDC)
- Write unit tests for field rules service
- Document service API

### Phase 2: UI Components (Week 2)
- Create `ReadOnlyField` component
- Create `HiddenFieldExplanation` component
- Update `CredentialsInput` to consume field rules
- Add visual styling for read-only fields
- Add tooltips for all fields

### Phase 3: Integration (Week 3)
- Integrate field rules into `ComprehensiveCredentialsService`
- Implement OIDC scope enforcement
- Implement response type validation
- Add remaining flow rules (Device, Hybrid, CIBA, etc.)
- Implement mock flow detection and rules
- Write integration tests

### Phase 4: Polish & Testing (Week 4)
- Complete all flow type rules
- Add comprehensive tooltips
- Perform manual testing of all flows
- Fix any discovered issues
- Update documentation
- Create user guide for field rules

## Security Considerations

1. **Client Secret Visibility**: Field rules do not affect the existing client secret masking - that remains controlled by the show/hide toggle
2. **Validation**: All field rules are enforced client-side for UX, but server-side validation remains the source of truth
3. **Spec Compliance**: All rules are based on official RFCs to ensure security best practices are followed
4. **Educational Focus**: Explanations help developers understand security implications of each field

## Performance Considerations

1. **Memoization**: Field rules are computed once per flow type and memoized
2. **Lazy Loading**: Rules are only loaded for the active flow
3. **Bundle Size**: Service adds ~5KB to bundle (minimal impact)
4. **Render Performance**: Field visibility changes don't trigger full re-renders

## Accessibility

1. **Screen Readers**: Read-only fields announce their locked state
2. **Keyboard Navigation**: All interactive elements remain keyboard accessible
3. **Focus Management**: Focus is maintained when fields become read-only
4. **ARIA Labels**: Proper ARIA labels for all field states
5. **Color Contrast**: Read-only styling maintains WCAG AA contrast ratios

## Future Enhancements

1. **Dynamic Rules**: Support for rules that change based on other field values
2. **Custom Flows**: Allow users to define custom flow types with their own rules
3. **Rule Validation**: Tool to validate field rules against actual OAuth provider configurations
4. **Interactive Tutorial**: Guided tour showing how field rules work
5. **Rule Export**: Export field rules as JSON for documentation purposes
