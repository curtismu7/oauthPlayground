# UI Contract Update - Version 9.0.0

**Date**: 2026-01-25  
**Version**: 9.0.0  
**Type**: Phase 1-2 Integration & Phase 2 OIDC Core Services

---

## Overview

This document defines the UI contracts for all components modified during the Phase 1-2 integration. These contracts ensure backward compatibility and define expected behavior with feature flags.

---

## Contract Definitions

### 1. UnifiedFlowSteps.tsx

**Component Type**: Flow Orchestration Component  
**Location**: `/src/locked/unified-flow-v8u/feature/v8u/components/UnifiedFlowSteps.tsx`

#### Input Contract

```typescript
interface UnifiedFlowStepsProps {
  // Standard props (unchanged)
  flowType: 'oauth' | 'oidc';
  credentials: UnifiedFlowCredentials;
  onStepComplete: (step: string) => void;
  // ... other existing props
}
```

#### Output Contract

```typescript
interface UnifiedFlowStepsOutput {
  // Credential operations
  saveCredentials: (credentials: UnifiedFlowCredentials) => void;
  loadCredentials: (flowKey: string) => UnifiedFlowCredentials | null;
  
  // Behavior guarantee
  credentialPersistence: 'guaranteed'; // Works with both old and new services
  backwardCompatibility: true;
}
```

#### Behavioral Contract

**With `USE_NEW_CREDENTIALS_REPO` = false**:
- Uses `CredentialsServiceV8` for all operations
- Credentials stored in localStorage with old format
- Scopes as string

**With `USE_NEW_CREDENTIALS_REPO` = true**:
- Uses `CredentialsRepository` for all operations
- Credentials stored in localStorage with new format
- Scopes as string[] (converted to/from string as needed)
- Can read credentials saved by old service

**Guaranteed Behaviors**:
- ✅ Credentials persist across page reloads
- ✅ No data loss when toggling feature flag
- ✅ No visual changes to UI
- ✅ Same user workflows

---

### 2. CredentialsFormV8U.tsx

**Component Type**: Form Component  
**Location**: `/src/locked/unified-flow-v8u/feature/v8u/components/CredentialsFormV8U.tsx`

#### Input Contract

```typescript
interface CredentialsFormProps {
  initialCredentials?: UnifiedFlowCredentials;
  onSubmit: (credentials: UnifiedFlowCredentials) => void;
  flowKey: string;
  // ... other existing props
}
```

#### Output Contract

```typescript
interface CredentialsFormOutput {
  // Form submission
  onSubmit: (credentials: UnifiedFlowCredentials) => void;
  
  // Validation
  isValid: boolean;
  errors: Record<string, string>;
  
  // Persistence
  autoSave: boolean; // Credentials saved on change
}
```

#### Behavioral Contract

**With `USE_NEW_CREDENTIALS_REPO` = false**:
- Form saves via `CredentialsServiceV8.saveCredentials()`
- Loads via `CredentialsServiceV8.loadCredentials()`

**With `USE_NEW_CREDENTIALS_REPO` = true**:
- Form saves via `CredentialsRepository.setFlowCredentials()`
- Loads via `CredentialsRepository.getFlowCredentials()`
- Scopes converted from string to string[]

**Guaranteed Behaviors**:
- ✅ Form validation unchanged
- ✅ All form fields render identically
- ✅ Submit button behavior unchanged
- ✅ Error messages unchanged
- ✅ No visual differences

---

### 3. UnifiedOAuthFlowV8U.tsx

**Component Type**: Flow Entry Point  
**Location**: `/src/locked/unified-flow-v8u/feature/v8u/flows/UnifiedOAuthFlowV8U.tsx`

#### Input Contract

```typescript
interface UnifiedOAuthFlowProps {
  flowKey: string;
  config: FlowConfiguration;
  // ... other existing props
}
```

#### Output Contract

```typescript
interface UnifiedOAuthFlowOutput {
  // Credential operations
  initialLoad: () => UnifiedFlowCredentials | null;
  asyncLoad: () => Promise<UnifiedFlowCredentials | null>;
  mfaLoad: () => MFACredentials | null;
  
  // Postman generation
  generatePostmanCollection: () => PostmanCollection;
}
```

#### Behavioral Contract

**With `USE_NEW_CREDENTIALS_REPO` = false**:
- Initial load: `CredentialsServiceV8.loadCredentials()`
- Async load: `CredentialsServiceV8.loadCredentialsWithBackup()`
- MFA load: `CredentialsServiceV8.loadCredentials('mfa-v8')`

**With `USE_NEW_CREDENTIALS_REPO` = true**:
- Initial load: `CredentialsRepository.getFlowCredentials()`
- Async load: `CredentialsRepository.getFlowCredentials()` (no async backup)
- MFA load: `CredentialsRepository.getFlowCredentials('mfa-v8')`
- Scopes type conversion handled automatically

**Guaranteed Behaviors**:
- ✅ Flow initialization unchanged
- ✅ Authorization URL generation unchanged
- ✅ Token exchange unchanged
- ✅ Postman collection generation works
- ✅ No visual differences

---

### 4. MFAAuthenticationMainPageV8.tsx

**Component Type**: MFA Flow Page  
**Location**: `/src/v8/flows/MFAAuthenticationMainPageV8.tsx`

#### Input Contract

```typescript
interface MFAAuthenticationProps {
  environmentId?: string;
  username?: string;
  // ... other existing props
}
```

#### Output Contract

```typescript
interface MFAAuthenticationOutput {
  // Credential operations
  loadCredentials: () => MFACredentials | null;
  saveCredentials: (credentials: Partial<MFACredentials>) => void;
  
  // Policy management
  savePolicy: (policyId: string) => void;
  
  // User management
  saveUsername: (username: string) => void;
  saveEnvironmentId: (envId: string) => void;
}
```

#### Behavioral Contract

**With `USE_NEW_CREDENTIALS_REPO` = false**:
- All operations use `CredentialsServiceV8`
- Flow key: 'mfa-v8'

**With `USE_NEW_CREDENTIALS_REPO` = true**:
- All operations use `CredentialsRepository`
- Flow key: 'mfa-v8'
- Null checks with `|| {}` fallback

**Guaranteed Behaviors**:
- ✅ MFA flow completes successfully
- ✅ Policy selection persists
- ✅ Username persists
- ✅ Environment ID persists
- ✅ Postman collection generation works
- ✅ No visual differences

---

### 5. useAuthActions.ts

**Component Type**: React Hook  
**Location**: `/src/hooks/useAuthActions.ts`

#### Input Contract

```typescript
interface UseAuthActionsInput {
  config?: AuthConfig;
  redirectAfterLogin?: string;
}
```

#### Output Contract

```typescript
interface UseAuthActionsOutput {
  login: (config?: AuthConfig) => Promise<LoginResult>;
  logout: () => void;
  
  // Security parameters (internal)
  generateState: () => string; // 32-byte cryptographic
  generateNonce: () => string; // 32-byte cryptographic
  generatePKCE: () => Promise<PKCECodes>; // RFC 7636 compliant
}
```

#### Behavioral Contract

**With `USE_NEW_OIDC_CORE` = false**:
- State: `Math.random().toString(36).substring(2, 15)` (13 chars)
- Nonce: `Math.random().toString(36).substring(2, 15)` (13 chars)
- PKCE: Manual concatenation (60 chars)

**With `USE_NEW_OIDC_CORE` = true**:
- State: `StateManager.generate()` (32 bytes, cryptographic)
- Nonce: `NonceManager.generate()` (32 bytes, cryptographic)
- PKCE: `PkceManager.generateAsync()` (RFC 7636, S256)

**Guaranteed Behaviors**:
- ✅ Login flow completes successfully
- ✅ Authorization URLs generated correctly
- ✅ CSRF protection works
- ✅ Replay attack protection works
- ✅ No visual differences
- ✅ Enhanced security (invisible to users)

---

### 6. NewAuthContext.tsx

**Component Type**: React Context Provider  
**Location**: `/src/contexts/NewAuthContext.tsx`

#### Input Contract

```typescript
interface AuthContextProviderProps {
  children: React.ReactNode;
}
```

#### Output Contract

```typescript
interface AuthContextValue {
  // Auth state
  isAuthenticated: boolean;
  user: UserInfo | null;
  tokens: OAuthTokens | null;
  
  // Auth actions
  login: (config?: AuthConfig) => Promise<LoginResult>;
  logout: () => void;
  
  // Security (internal)
  state: string; // CSRF protection
  nonce: string; // Replay protection
  pkce: PKCECodes; // Code interception protection
}
```

#### Behavioral Contract

**With `USE_NEW_OIDC_CORE` = false**:
- Uses manual random generation
- Flow key: N/A (uses global sessionStorage keys)

**With `USE_NEW_OIDC_CORE` = true**:
- Uses Phase 2 OIDC core services
- Flow key: 'new-auth-context'
- Enhanced cryptographic security

**Guaranteed Behaviors**:
- ✅ Context provides same interface
- ✅ All auth flows work correctly
- ✅ Token management unchanged
- ✅ User info retrieval unchanged
- ✅ No visual differences

---

### 7. V8 Integration Services

**Services**:
- oauthIntegrationServiceV8.ts
- hybridFlowIntegrationServiceV8.ts
- implicitFlowIntegrationServiceV8.ts

#### Input Contract

```typescript
interface IntegrationServiceInput {
  credentials: OAuthCredentials;
  pkceCodes?: PKCECodes;
  appConfig?: AppConfig;
}
```

#### Output Contract

```typescript
interface IntegrationServiceOutput {
  // Authorization URL generation
  generateAuthorizationUrl: (credentials, pkce?, config?) => Promise<AuthUrlParams>;
  
  // PKCE generation
  generatePKCECodes: () => Promise<PKCECodes>;
  
  // Security parameters
  state: string; // CSRF protection
  nonce?: string; // For OIDC flows
}
```

#### Behavioral Contract

**With `USE_NEW_OIDC_CORE` = false**:
- State: `generateRandomString(32)` (weak)
- Nonce: `generateRandomString(32)` (weak)
- PKCE: `generateRandomString(128)` (weak)

**With `USE_NEW_OIDC_CORE` = true**:
- State: `StateManager.generate()` (cryptographic)
- Nonce: `NonceManager.generate()` (cryptographic)
- PKCE: `PkceManager.generateAsync()` (RFC 7636)

**Guaranteed Behaviors**:
- ✅ Authorization URLs generated correctly
- ✅ Token exchange works
- ✅ All flow types supported
- ✅ Enhanced security
- ✅ No breaking changes

---

## Cross-Component Contracts

### Credential Data Format

**Old Format (CredentialsServiceV8)**:
```typescript
interface OldCredentials {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  scopes: string; // Space-separated string
  redirectUri?: string;
  // ... other fields
}
```

**New Format (CredentialsRepository)**:
```typescript
interface NewCredentials {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[]; // Array of strings
  redirectUri?: string;
  // ... other fields
}
```

**Conversion Contract**:
- String → Array: `scopes.split(' ').filter(Boolean)`
- Array → String: `scopes.join(' ')`
- Both services can read each other's data with conversion

---

### Feature Flag Contracts

#### USE_NEW_CREDENTIALS_REPO

**Contract**:
```typescript
interface CredentialsRepoFlagContract {
  // When disabled (default)
  disabled: {
    service: 'CredentialsServiceV8';
    storage: 'localStorage';
    format: 'old';
    scopesType: 'string';
  };
  
  // When enabled
  enabled: {
    service: 'CredentialsRepository';
    storage: 'localStorage';
    format: 'new';
    scopesType: 'string[]';
    canReadOldFormat: true;
  };
  
  // Guarantees
  guarantees: {
    noDataLoss: true;
    backwardCompatible: true;
    forwardCompatible: true;
    noVisualChanges: true;
  };
}
```

#### USE_NEW_OIDC_CORE

**Contract**:
```typescript
interface OidcCoreFlagContract {
  // When disabled (default)
  disabled: {
    state: 'Math.random() (13 chars)';
    nonce: 'Math.random() (13 chars)';
    pkce: 'manual (60 chars)';
    security: 'basic';
  };
  
  // When enabled
  enabled: {
    state: 'crypto.getRandomValues (32 bytes)';
    nonce: 'crypto.getRandomValues (32 bytes)';
    pkce: 'RFC 7636 S256 (43-128 chars)';
    security: 'enhanced';
  };
  
  // Guarantees
  guarantees: {
    flowsComplete: true;
    backwardCompatible: true;
    enhancedSecurity: true;
    noVisualChanges: true;
  };
}
```

---

## Testing Contracts

### Unit Test Contracts

**Each modified component must**:
- ✅ Have tests for flag ON behavior
- ✅ Have tests for flag OFF behavior
- ✅ Have tests for flag toggle scenarios
- ✅ Verify no data loss
- ✅ Verify backward compatibility

### Integration Test Contracts

**Each flow must**:
- ✅ Complete successfully with flag ON
- ✅ Complete successfully with flag OFF
- ✅ Handle flag toggle mid-flow
- ✅ Persist data correctly
- ✅ Generate correct authorization URLs

### E2E Test Contracts

**Each user journey must**:
- ✅ Work identically with flag ON/OFF
- ✅ No visual differences
- ✅ Same number of steps
- ✅ Same success criteria
- ✅ Same error handling

---

## Breaking Change Policy

**Contract**: NO BREAKING CHANGES ALLOWED

**Enforcement**:
1. All changes behind feature flags
2. Feature flags default to disabled
3. Old behavior preserved when disabled
4. New behavior opt-in when enabled
5. Gradual rollout supported
6. Instant rollback available

**Violation Response**:
- Immediate rollback via feature flag
- Fix and re-deploy
- Update contracts
- Re-test thoroughly

---

## Version Compatibility Matrix

| Component | v8.x.x | v9.0.0 (flag OFF) | v9.0.0 (flag ON) |
|-----------|--------|-------------------|------------------|
| UnifiedFlowSteps | ✅ | ✅ | ✅ |
| CredentialsFormV8U | ✅ | ✅ | ✅ |
| UnifiedOAuthFlowV8U | ✅ | ✅ | ✅ |
| MFAAuthenticationMainPageV8 | ✅ | ✅ | ✅ |
| useAuthActions | ✅ | ✅ | ✅ |
| NewAuthContext | ✅ | ✅ | ✅ |
| V8 Services | ✅ | ✅ | ✅ |

**Legend**:
- ✅ = Fully compatible, no breaking changes
- All components maintain backward compatibility

---

## Support & Maintenance

**Contract Violations**:
- Report via GitHub issues
- Include flag status
- Include component name
- Include expected vs actual behavior

**Contract Updates**:
- Require version bump
- Require documentation update
- Require approval
- Require testing

---

**Status**: ✅ All UI contracts defined  
**Version**: 9.0.0  
**Last Updated**: 2026-01-25
