# V7, V8, V9 Services Contracts & Migration Guide

## 📋 Overview
This document provides comprehensive service contracts for all services used by V7, V8, and V9 flows, ensuring no breaking changes during migration. Also identifies unused services for archival.

---

## 🎯 Version-Specific Service Architecture

### **V7 Services (Legacy - Side Menu)**
- **Status**: Active in side menu, need migration to V9
- **Count**: 19 core services + 4 V7-specific services
- **Priority**: High (currently in use)

### **V8 Services (Transitional)**
- **Status**: Transitional architecture, some used by V7 flows
- **Count**: 25+ services in locked and active directories
- **Priority**: Medium (migration dependencies)

### **V9 Services (Target)**
- **Status**: Modern architecture, target for migration
- **Count**: 15+ core services
- **Priority**: High (final destination)

---

## 🔄 V7 Side Menu Services (Current)

### **🔴 Critical V7 Services (DO NOT BREAK)**

#### 1. **ComprehensiveCredentialsService**
**File**: `src/services/comprehensiveCredentialsService.tsx`
**Used By**: All 12 V7 flows
**V9 Equivalent**: `V9CredentialService` + `V9CredentialValidationService`

```typescript
export interface ComprehensiveCredentialsProps {
  // Flow identification
  flowType?: string;
  isOIDC?: boolean;

  // Unified credentials API (preferred)
  credentials?: StepCredentials;
  onCredentialsChange?: (updated: StepCredentials) => void;
  onSaveCredentials?: () => void | Promise<void>;
  flowConfig?: FlowConfig;
  onFlowConfigChange?: (config: FlowConfig) => void;
  pkceCodes?: PKCECodes;
  onGeneratePkce?: () => void | Promise<void>;
  onClearPkce?: () => void;
  onSetPkceCodes?: (codes: PKCECodes) => void;

  // Discovery props
  onDiscoveryComplete?: (result: DiscoveryResult) => void;
  initialDiscoveryInput?: string;
  discoveryPlaceholder?: string;
  showProviderInfo?: boolean;

  // Credentials props
  environmentId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string;
  defaultScopes?: string;
  loginHint?: string;
  postLogoutRedirectUri?: string;
  clientAuthMethod?: ClientAuthMethod;
  responseType?: 'code' | 'token' | 'id_token' | 'token id_token' | 'code id_token' | 'code token' | 'code token id_token';
  allowedAuthMethods?: ClientAuthMethod[];
  
  // Change handlers
  onEnvironmentIdChange?: (newEnvId: string) => void;
  onClientIdChange?: (newClientId: string) => void;
  onClientSecretChange?: (newSecret: string) => void;
  onRedirectUriChange?: (newUri: string) => void;
  onScopesChange?: (newScopes: string) => void;
  onLoginHintChange?: (newLoginHint: string) => void;
  onPostLogoutRedirectUriChange?: (newUri: string) => void;
  onClientAuthMethodChange?: (method: ClientAuthMethod) => void;
  onResponseTypeChange?: (responseType: string) => void;

  // UI props
  showEnvironmentId?: boolean;
  showClientId?: boolean;
  showClientSecret?: boolean;
  showRedirectUri?: boolean;
  showScopes?: boolean;
  showLoginHint?: boolean;
  showPostLogoutRedirectUri?: boolean;
  showClientAuthMethod?: boolean;
  showResponseType?: boolean;
  showDiscovery?: boolean;
  showPKCE?: boolean;
  showWorkerToken?: boolean;
  showConfigChecker?: boolean;
  showPingOneAppPicker?: boolean;
  showJwksKeySource?: boolean;
  showEnvironmentIdPersistence?: boolean;

  // Validation
  validateEnvironmentId?: boolean;
  validateClientId?: boolean;
  validateClientSecret?: boolean;
  validateRedirectUri?: boolean;
  validateScopes?: boolean;
  validateLoginHint?: boolean;
  validatePostLogoutRedirectUri?: boolean;

  // Styling
  className?: string;
  style?: React.CSSProperties;
}
```

#### 2. **CopyButtonService**
**File**: `src/services/copyButtonService.tsx`
**Used By**: All 12 V7 flows
**V9 Equivalent**: Enhanced copy functionality in V9 components

```typescript
export interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  showCopyIcon?: boolean;
  showSuccessFeedback?: boolean;
  successMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
```

#### 3. **CredentialGuardService**
**File**: `src/services/credentialGuardService.tsx`
**Used By**: All 12 V7 flows
**V9 Equivalent**: `V9CredentialValidationService`

```typescript
export interface CredentialGuardConfig {
  validateEnvironmentId?: boolean;
  validateClientId?: boolean;
  validateClientSecret?: boolean;
  validateRedirectUri?: boolean;
  validateScopes?: boolean;
  showValidationErrors?: boolean;
  autoFixCredentials?: boolean;
}

export interface CredentialValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedCredentials?: StepCredentials;
}
```

#### 4. **FlowHeader Service**
**File**: `src/services/flowHeaderService.tsx`
**Used By**: All 12 V7 flows
**V9 Equivalent**: V9 FlowHeader components

```typescript
export interface FlowHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  version?: string;
  badge?: string;
  badgeColor?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showResetButton?: boolean;
  onResetClick?: () => void;
  showConfigButton?: boolean;
  onConfigClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
```

#### 5. **FlowUIService**
**File**: `src/services/flowUIService.tsx`
**Used By**: All 12 V7 flows
**V9 Equivalent**: V9 UI component system

```typescript
export interface FlowUIComponents {
  Button: React.ComponentType<any>;
  Input: React.ComponentType<any>;
  Select: React.ComponentType<any>;
  Textarea: React.ComponentType<any>;
  Checkbox: React.ComponentType<any>;
  Radio: React.ComponentType<any>;
  Label: React.ComponentType<any>;
  HelperText: React.ComponentType<any>;
  ErrorMessage: React.ComponentType<any>;
  SuccessMessage: React.ComponentType<any>;
  LoadingSpinner: React.ComponentType<any>;
  CollapsibleSection: React.ComponentType<any>;
  CodeBlock: React.ComponentType<any>;
  CopyButton: React.ComponentType<any>;
  TokenDisplay: React.ComponentType<any>;
  CredentialDisplay: React.ComponentType<any>;
}
```

#### 6. **UnifiedTokenDisplayService**
**File**: `src/services/unifiedTokenDisplayService.tsx`
**Used By**: All 12 V7 flows
**V9 Equivalent**: V9 TokenDisplay components

```typescript
export interface TokenDisplayProps {
  token: string;
  label?: string;
  showCopyButton?: boolean;
  showEyeToggle?: boolean;
  showValidation?: boolean;
  format?: 'json' | 'jwt' | 'raw';
  className?: string;
  style?: React.CSSProperties;
  onCopy?: () => void;
  onValidate?: (result: TokenValidationResult) => void;
}
```

#### 7. **v4ToastManager**
**File**: `src/utils/v4ToastMessages.tsx`
**Used By**: All 12 V7 flows
**V9 Equivalent**: V9 notification system

```typescript
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### **🟡 Important V7 Services**

#### 8. **FlowCompletionService**
**File**: `src/services/flowCompletionService.tsx`
**Used By**: OIDCHybridFlowV7, JWTBearerTokenFlowV7
**V9 Equivalent**: V9 flow progress tracking

```typescript
export interface FlowCompletionConfig {
  showProgress?: boolean;
  showSteps?: boolean;
  allowSkip?: boolean;
  validateOnComplete?: boolean;
  resetOnComplete?: boolean;
}

export interface FlowCompletionResult {
  isComplete: boolean;
  completedSteps: string[];
  remainingSteps: string[];
  errors: string[];
  warnings: string[];
  canProceed: boolean;
}
```

### **🔄 V7-Specific Services (Plan Migration)**

#### 9. **V7SharedService**
**File**: `src/services/v7SharedService.tsx`
**Used By**: OIDCHybridFlowV7
**V9 Equivalent**: `V9SharedService` (to be created)

```typescript
export interface V7FlowConfig {
  compliance: {
    enabled: boolean;
    level: 'basic' | 'standard' | 'strict';
    rules: string[];
  };
  validation: {
    enabled: boolean;
    strict: boolean;
    rules: string[];
  };
  errorHandling: {
    enabled: boolean;
    retryAttempts: number;
    fallbackMode: string;
  };
  security: {
    enabled: boolean;
    headers: Record<string, string>;
    checks: string[];
  };
}
```

#### 10. **HybridFlowSharedService**
**File**: `src/services/hybridFlowSharedService.tsx`
**Used By**: OIDCHybridFlowV7
**V9 Equivalent**: `V9HybridFlowService`

```typescript
export interface HybridFlowConfig {
  responseType: string;
  responseMode?: string;
  nonce?: string;
  maxAge?: number;
  prompts?: string[];
  claims?: Record<string, unknown>;
  authorizationDetails?: any[];
}
```

---

## 🔄 V8 Services (Transitional)

### **🟡 V8 Core Services**

#### 1. **WorkerTokenModalV8**
**File**: `src/v8/components/WorkerTokenModalV8.tsx`
**Used By**: TokenExchangeFlowV7, WorkerTokenFlowV7
**V9 Equivalent**: `V9WorkerTokenModal`

```typescript
export interface WorkerTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (token: string) => void;
  initialToken?: string;
  showValidation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

#### 2. **WorkerTokenExpiryBannerV8**
**File**: `src/v8/components/WorkerTokenExpiryBannerV8.tsx`
**Used By**: TokenExchangeFlowV7, WorkerTokenFlowV7
**V9 Equivalent**: `V9WorkerTokenExpiryBanner`

```typescript
export interface WorkerTokenExpiryBannerProps {
  token: string;
  expiryTime: number;
  onRefresh?: () => void;
  onDismiss?: () => void;
  showRefresh?: boolean;
  showDismiss?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

#### 3. **useCredentialStoreV8**
**File**: `src/hooks/useCredentialStoreV8.ts`
**Used By**: Various V8 flows
**V9 Equivalent**: `V9CredentialService`

```typescript
export interface CredentialStoreV8 {
  credentials: StepCredentials;
  updateCredentials: (updates: Partial<StepCredentials>) => void;
  saveCredentials: () => Promise<boolean>;
  loadCredentials: () => Promise<StepCredentials | null>;
  clearCredentials: () => void;
  isValid: boolean;
}
```

#### 4. **TokenDisplayV8**
**File**: `src/components/TokenDisplayV8.tsx`
**Used By**: V8 flows
**V9 Equivalent**: V9 TokenDisplay system

```typescript
export interface TokenDisplayV8Props {
  token: string;
  label?: string;
  showCopyButton?: boolean;
  showEyeToggle?: boolean;
  showValidation?: boolean;
  format?: 'json' | 'jwt' | 'raw';
  className?: string;
  style?: React.CSSProperties;
}
```

#### 5. **JWTConfigV8**
**File**: `src/components/JWTConfigV8.tsx`
**Used By**: V8 flows
**V9 Equivalent**: V9 JWT configuration

```typescript
export interface JWTConfigV8Props {
  token: string;
  onConfigChange?: (config: JWTConfig) => void;
  showValidation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

### **🔒 V8 Locked Services (Migration Dependencies)**

#### **Email V8 Services**
- `MFADocumentationModalV8.tsx`
- `MFAInfoButtonV8.tsx`
- `UserLoginModalV8.tsx`
- `WorkerTokenModalV8.tsx`
- `WorkerTokenRequestModalV8.tsx`

#### **Device Code V8 Services**
- `credentialsServiceV8.ts`
- `environmentIdServiceV8.ts`
- `sharedCredentialsServiceV8.ts`
- `deviceCodeIntegrationServiceV8.ts`

---

## 🎯 V9 Services (Target Architecture)

### **🔴 V9 Core Services**

#### 1. **V9TokenService**
**File**: `src/services/v9/V9TokenService.ts`
**Purpose**: Token endpoint simulator for V9 educational flows

```typescript
export type V9AuthorizationCodeGrantRequest = {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
  client_id: string;
  code_verifier?: string;
  authorization?: string;
  client_secret?: string;
  issuer?: string;
  environmentId?: string;
  scope?: string;
  userEmail?: string;
  userId?: string;
  includeIdToken?: boolean;
  expectedClientSecret?: string;
  ttls?: Partial<V9TokenTtls>;
};

export type V9RefreshTokenGrantRequest = {
  grant_type: 'refresh_token';
  refresh_token: string;
  client_id: string;
  authorization?: string;
  client_secret?: string;
  expectedClientSecret?: string;
  issuer?: string;
  environmentId?: string;
  scope?: string;
  userEmail?: string;
  userId?: string;
  includeIdToken?: boolean;
  ttls?: Partial<V9TokenTtls>;
};

export type V9DeviceCodeGrantRequest = {
  grant_type: 'urn:ietf:params:oauth:grant-type:device_code';
  device_code: string;
  client_id: string;
  authorization?: string;
  client_secret?: string;
  expectedClientSecret?: string;
  issuer?: string;
  environmentId?: string;
  scope?: string;
  userEmail?: string;
  userId?: string;
  includeIdToken?: boolean;
  ttls?: Partial<V9TokenTtls>;
};
```

#### 2. **V9StateStore**
**File**: `src/services/v9/V9StateStore.ts`
**Purpose**: Ephemeral in-memory + sessionStorage-backed store for V9 mock flows

```typescript
export type V9AuthorizationCodeRecord = {
  code: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  userEmail?: string;
  userId?: string;
  createdAt: number; // epoch seconds
  expiresAt: number; // epoch seconds
  consumed: boolean;
};

export type V9TokenRecord = {
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  scope: string;
  subject: string;
  issuedAt: number;
  expiresAt: number;
};

export type V9DeviceCodeRecord = {
  deviceCode: string;
  userCode: string;
  clientId: string;
  scope: string;
  userEmail?: string;
  userId?: string;
  createdAt: number; // epoch seconds
  expiresAt: number; // epoch seconds
  approved: boolean;
  interval: number; // polling interval in seconds
};
```

#### 3. **V9TokenGenerator**
**File**: `src/services/v9/V9TokenGenerator.ts`
**Purpose**: Token generation for V9 flows

```typescript
export interface V9TokenSeed {
  environmentId?: string;
  clientId?: string;
  userId?: string;
  userEmail?: string;
  scope?: string;
  issuer?: string;
  audience?: string;
  claims?: Record<string, unknown>;
}

export interface V9TokenTtls {
  accessToken: number; // seconds
  refreshToken?: number; // seconds
  idToken?: number; // seconds
  deviceCode?: number; // seconds
  userCode?: number; // seconds
  authorizationCode?: number; // seconds
}
```

#### 4. **V9CredentialService**
**File**: `src/services/v9/credentialsServiceV9.ts`
**Purpose**: Credential management for V9 flows

```typescript
export interface V9Credentials {
  environmentId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string;
  loginHint?: string;
  postLogoutRedirectUri?: string;
  clientAuthMethod?: ClientAuthMethod;
  responseType?: string;
  tokenEndpoint?: string;
  authorizationEndpoint?: string;
  userinfoEndpoint?: string;
  introspectionEndpoint?: string;
  revocationEndpoint?: string;
  jwksUri?: string;
  issuer?: string;
  region?: string;
  apiVersion?: string;
  workerToken?: string;
  pkceCodeVerifier?: string;
  pkceCodeChallenge?: string;
  pkceCodeChallengeMethod?: string;
}
```

#### 5. **V9CredentialValidationService**
**File**: `src/services/v9/v9CredentialValidationService.tsx`
**Purpose**: Credential validation for V9 flows

```typescript
export interface V9ValidationConfig {
  validateEnvironmentId?: boolean;
  validateClientId?: boolean;
  validateClientSecret?: boolean;
  validateRedirectUri?: boolean;
  validateScopes?: boolean;
  showValidationErrors?: boolean;
  autoFixCredentials?: boolean;
  strictMode?: boolean;
}

export interface V9ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  fixedCredentials?: V9Credentials;
  score: number; // 0-100 validation score
}
```

#### 6. **V9WorkerTokenStatusService**
**File**: `src/services/v9/V9WorkerTokenStatusService.ts`
**Purpose**: Worker token management for V9 flows

```typescript
export interface V9WorkerTokenStatus {
  token: string;
  expiresAt: number;
  isValid: boolean;
  permissions: string[];
  environmentId: string;
  lastValidated: number;
}

export interface V9WorkerTokenConfig {
  autoRefresh?: boolean;
  refreshThreshold?: number; // seconds before expiry
  validationInterval?: number; // seconds
  showExpiryWarning?: boolean;
}
```

#### 7. **V9AuthorizeService**
**File**: `src/services/v9/V9AuthorizeService.ts`
**Purpose**: Authorization endpoint simulation for V9 flows

```typescript
export interface V9AuthorizeRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  nonce?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256' | 'plain';
  prompt?: string;
  max_age?: number;
  ui_locales?: string;
  claims_locales?: string;
  id_token_hint?: string;
  login_hint?: string;
  acr_values?: string;
}

export interface V9AuthorizeResponse {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}
```

#### 8. **V9IntrospectionService**
**File**: `src/services/v9/V9IntrospectionService.ts`
**Purpose**: Token introspection for V9 flows

```typescript
export interface V9IntrospectionRequest {
  token: string;
  token_type_hint?: 'access_token' | 'refresh_token';
  client_id?: string;
  client_secret?: string;
  authorization?: string;
}

export interface V9IntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string[];
  iss?: string;
  jti?: string;
}
```

#### 9. **V9UserInfoService**
**File**: `src/services/v9/V9UserInfoService.ts`
**Purpose**: User info endpoint for V9 flows

```typescript
export interface V9UserInfoRequest {
  access_token: string;
  schema?: string;
}

export interface V9UserInfoResponse {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: {
    formatted?: string;
    street_address?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  updated_at?: number;
}
```

#### 10. **V9DeviceAuthorizationService**
**File**: `src/services/v9/V9DeviceAuthorizationService.ts`
**Purpose**: Device authorization for V9 flows

```typescript
export interface V9DeviceAuthorizationRequest {
  client_id: string;
  scope?: string;
  client_secret?: string;
  authorization?: string;
  expectedClientSecret?: string;
  issuer?: string;
  environmentId?: string;
  userEmail?: string;
  userId?: string;
  ttls?: Partial<V9TokenTtls>;
}

export interface V9DeviceAuthorizationResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}
```

### **🟡 V9 Supporting Services**

#### 11. **V9SpecVersionService**
**File**: `src/services/v9/V9SpecVersionService.ts`
**Purpose**: Specification version management for V9 flows

```typescript
export interface V9SpecVersion {
  name: string;
  version: string;
  url?: string;
  description?: string;
  features: string[];
  compliance: {
    level: 'basic' | 'standard' | 'strict';
    rules: string[];
  };
}
```

#### 12. **V9OAuthErrorHandlingService**
**File**: `src/services/v9/core/V9OAuthErrorHandlingService.ts`
**Purpose**: OAuth error handling for V9 flows

```typescript
export interface V9OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
  state?: string;
  hint?: string;
}

export interface V9ErrorHandler {
  handleError: (error: V9OAuthError) => void;
  getErrorMessage: (error: string) => string;
  getErrorDescription: (error: string) => string;
  shouldRetry: (error: string) => boolean;
}
```

#### 13. **V9PKCEGenerationService**
**File**: `src/services/v9/core/V9PKCEGenerationService.ts`
**Purpose**: PKCE generation for V9 flows

```typescript
export interface V9PKCECodes {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'plain' | 'S256';
}

export interface V9PKCEConfig {
  codeVerifierLength?: number;
  codeChallengeMethod?: 'plain' | 'S256';
  encoding?: 'base64url' | 'hex';
}
```

#### 14. **V9FlowCredentialService**
**File**: `src/services/v9/core/V9FlowCredentialService.ts`
**Purpose**: Flow-specific credential management for V9

```typescript
export interface V9FlowCredentials {
  flowKey: string;
  credentials: V9Credentials;
  lastUpdated: number;
  isValid: boolean;
  validationErrors: string[];
}

export interface V9FlowCredentialStore {
  getCredentials: (flowKey: string) => V9FlowCredentials | null;
  setCredentials: (flowKey: string, credentials: V9Credentials) => void;
  validateCredentials: (flowKey: string) => V9ValidationResult;
  clearCredentials: (flowKey: string) => void;
}
```

#### 15. **V8ToV9WorkerTokenStatusAdapter**
**File**: `src/services/v9/V8ToV9WorkerTokenStatusAdapter.ts`
**Purpose**: Adapter for V8 to V9 worker token migration

```typescript
export interface V8ToV9AdapterConfig {
  migrateExistingTokens?: boolean;
  preserveExpiryTimes?: boolean;
  updateStorageFormat?: boolean;
  validateOnMigration?: boolean;
}

export interface V8ToV9MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
  warnings: string[];
}
```

---

## 🔄 Hooks Across Versions

### **V7 Hooks**
1. **usePageScroll** - Scroll management (maintain)
2. **useCredentialBackup** - Data persistence (migrate to V9)
3. **useHybridFlowControllerV7** - V7 hybrid flow (replace with V9)
4. **useResourceOwnerPasswordFlowV7** - V7 ROPC (replace with V9)

### **V8 Hooks**
1. **useStepNavigationV8** - Step navigation (migrate to V9)
2. **useCredentialStoreV8** - Credential store (replace with V9)

### **V9 Hooks**
1. **useHybridFlowControllerV9** - Modern hybrid flow controller
2. **V9 credential hooks** - Modern credential management

---

## 🧩 Components Across Versions

### **V7 Components**
1. **StepNavigationButtons** - Navigation (maintain)
2. **EnhancedApiCallDisplay** - API display (enhance in V9)
3. **LearningTooltip** - Educational (maintain)
4. **V8 components** - Migration dependencies

### **V8 Components**
1. **WorkerTokenModalV8** - Worker token modal (replace with V9)
2. **WorkerTokenExpiryBannerV8** - Expiry banner (replace with V9)
3. **TokenDisplayV8** - Token display (replace with V9)
4. **JWTConfigV8** - JWT config (replace with V9)

### **V9 Components**
1. **Modern token displays** - Enhanced token visualization
2. **V9 flow components** - Modern flow architecture
3. **V9 UI components** - Consistent design system

---

## 🗄️ Services Safe to Archive

### **V6/V5 Legacy Services**
- All `src/services/v5*` - V5 services (archived)
- All `src/services/v6*` - V6 services (deprecated)
- All `src/services/legacy*` - Legacy services

### **Unused V7 Services**
- `src/services/v7EducationalContentDataService.tsx` - Not used in side menu
- `src/services/v7StepperService.tsx` - Not used in side menu
- `src/services/v7FlowTemplateService.tsx` - Template only
- `src/services/v7m/*` - V7M mock flows

### **V8 Locked Services (After Migration)**
- `src/locked/email-v8/*` - Email V8 services
- `src/locked/device-code-v8/*` - Device code V8 services
- V8 components replaced by V9 equivalents

### **Development/Testing Services**
- `src/services/mockService.tsx` - Mock data
- `src/services/testService.tsx` - Testing utilities
- `src/services/debugService.tsx` - Debug utilities

---

## 🚀 Migration Strategy

### **Phase 1: V9 Service Completion**
- ✅ Complete V9 service implementations
- ✅ Ensure V9 services have full feature parity
- ✅ Test V9 services thoroughly

### **Phase 2: V7 → V9 Migration**
- 🔄 Update V7 flows to use V9 services
- 🔄 Maintain backward compatibility during transition
- 🔄 Update service contracts gradually

### **Phase 3: V8 → V9 Migration**
- 🔄 Replace V8 components with V9 equivalents
- 🔄 Migrate V8 locked services to V9
- 🔄 Update V8 hooks to V9

### **Phase 4: Cleanup**
- 🗄️ Archive unused V7 services
- 🗄️ Archive V8 services after migration
- 🗄️ Clean up legacy code

---

## 📊 Migration Priority Matrix

| Service | Version | Priority | Risk | Effort | Status |
|---------|---------|----------|------|--------|---------|
| ComprehensiveCredentialsService | V7 | 🔴 Critical | High | High | 🔄 Migrate to V9 |
| V9CredentialService | V9 | 🔴 Critical | Low | Medium | ✅ Target |
| V9TokenService | V9 | 🔴 Critical | Low | Medium | ✅ Target |
| V9StateStore | V9 | 🔴 Critical | Low | Medium | ✅ Target |
| WorkerTokenModalV8 | V8 | 🟡 Medium | Medium | Medium | 🔄 Replace with V9 |
| V7SharedService | V7 | 🟡 V7-specific | Medium | High | 🔄 Create V9 equivalent |
| V8ToV9WorkerTokenStatusAdapter | V9 | 🟡 Migration | Low | Low | ✅ Migration tool |
| V9CredentialValidationService | V9 | 🔴 Critical | Low | Medium | ✅ Target |
| V9AuthorizeService | V9 | 🔴 Critical | Low | Medium | ✅ Target |
| V9IntrospectionService | V9 | 🔴 Critical | Low | Medium | ✅ Target |
| V9UserInfoService | V9 | 🔴 Critical | Low | Medium | ✅ Target |
| V9DeviceAuthorizationService | V9 | 🔴 Critical | Low | Medium | ✅ Target |

---

## 🎯 Key Migration Rules

### ✅ **DO NOT BREAK**
1. **Never remove props or methods** used by active flows
2. **Never change prop types or method signatures**
3. **Never change core behavior** of critical services
4. **Always maintain backward compatibility** during transition

### ⚠️ **CAN CHANGE**
1. **Add new props or methods** (backward compatible)
2. **Improve performance** without changing behavior
3. **Add new features** as optional enhancements
4. **Update styling** without affecting functionality

### 🔄 **MIGRATION PATH**
1. **Complete V9 services** before migration
2. **Test V9 services** with existing flows
3. **Gradually migrate** V7 → V9
4. **Replace V8 dependencies** with V9
5. **Archive old services** when safe

---

## 📈 Migration Timeline

### **Week 1-2: V9 Service Completion**
- Complete remaining V9 service implementations
- Add missing features to V9 services
- Comprehensive testing of V9 services

### **Week 3-4: V7 → V9 Migration**
- Update V7 flows to use V9 services
- Maintain backward compatibility
- Update service contracts

### **Week 5-6: V8 → V9 Migration**
- Replace V8 components with V9
- Migrate V8 locked services
- Update V8 hooks to V9

### **Week 7-8: Cleanup & Documentation**
- Archive unused services
- Update documentation
- Final testing and validation

---

**This comprehensive service contracts documentation covers V7, V8, and V9 services, providing a complete roadmap for safe migration across all versions while maintaining functionality and ensuring no breaking changes.**
