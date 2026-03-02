# V7 Side Menu Services Contracts & Migration Guide

## 📋 Overview
This document provides comprehensive service contracts for all services used by V7 flows in the side menu, ensuring no breaking changes during migration to V9. Also identifies unused services for archival.

---

## 🎯 Services Used by V7 Side Menu Flows

### 1. **ComprehensiveCredentialsService**
**File**: `src/services/comprehensiveCredentialsService.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core service - DO NOT BREAK

#### **Service Contract**
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

export interface StepCredentials {
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

export interface FlowConfig {
  includeRefreshToken?: boolean;
  grantType?: string;
  subjectTokenType?: string;
  requestedTokenType?: string;
  audience?: string;
  resource?: string;
  claims?: string;
  authorizationDetails?: string;
  clientAuthMethod?: ClientAuthMethod;
  tokenEndpointAuthMethod?: string;
}

export interface PKCECodes {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'plain' | 'S256';
}

export interface DiscoveryResult {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  introspectionEndpoint: string;
  revocationEndpoint: string;
  jwksUri: string;
  scopesSupported: string[];
  responseTypesSupported: string[];
  grantTypesSupported: string[];
  tokenEndpointAuthMethodsSupported: string[];
  codeChallengeMethodsSupported: string[];
}
```

#### **Migration Requirements**
- ✅ **Maintain full API compatibility** - All props must remain available
- ✅ **Preserve StepCredentials interface** - Critical for credential management
- ✅ **Keep DiscoveryResult interface** - Essential for OIDC discovery
- ✅ **Maintain FlowConfig interface** - Required for flow configuration
- ⚠️ **Can add new props** - Backward compatible additions allowed
- ❌ **Cannot remove props** - Breaking change
- ❌ **Cannot change prop types** - Breaking change

---

### 2. **CopyButtonService**
**File**: `src/services/copyButtonService.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core service - DO NOT BREAK

#### **Service Contract**
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

export interface CopyButtonService {
  copyToClipboard: (text: string) => Promise<boolean>;
  showCopyFeedback: (message: string, type: 'success' | 'error') => void;
}
```

#### **Migration Requirements**
- ✅ **Maintain copyToClipboard function** - Core functionality
- ✅ **Preserve CopyButtonProps interface** - Used by all flows
- ✅ **Keep showCopyFeedback function** - User feedback mechanism
- ⚠️ **Can add new features** - Backward compatible
- ❌ **Cannot remove existing props** - Breaking change

---

### 3. **CredentialGuardService**
**File**: `src/services/credentialGuardService.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core service - DO NOT BREAK

#### **Service Contract**
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

export interface CredentialGuardService {
  validateCredentials: (credentials: StepCredentials, config?: CredentialGuardConfig) => CredentialValidationResult;
  fixCredentials: (credentials: StepCredentials, config?: CredentialGuardConfig) => StepCredentials;
  checkEnvironmentId: (environmentId: string) => boolean;
  checkClientId: (clientId: string) => boolean;
  checkClientSecret: (clientSecret: string) => boolean;
  checkRedirectUri: (redirectUri: string) => boolean;
  checkScopes: (scopes: string) => boolean;
}
```

#### **Migration Requirements**
- ✅ **Maintain validation functions** - Core security features
- ✅ **Preserve CredentialValidationResult interface** - Used by all flows
- ✅ **Keep CredentialGuardConfig interface** - Configuration options
- ⚠️ **Can add new validation rules** - Backward compatible
- ❌ **Cannot change validation logic** - Security impact

---

### 4. **FlowHeader Service**
**File**: `src/services/flowHeaderService.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core service - DO NOT BREAK

#### **Service Contract**
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

export interface FlowHeaderService {
  createHeader: (props: FlowHeaderProps) => React.ReactElement;
  updateTitle: (title: string) => void;
  updateSubtitle: (subtitle: string) => void;
  showBadge: (text: string, color?: string) => void;
  hideBadge: () => void;
}
```

#### **Migration Requirements**
- ✅ **Maintain FlowHeaderProps interface** - Used by all flows
- ✅ **Preserve all callback functions** - Navigation functionality
- ✅ **Keep styling props** - UI consistency
- ⚠️ **Can add new header features** - Backward compatible
- ❌ **Cannot remove existing props** - Breaking change

---

### 5. **FlowUIService**
**File**: `src/services/flowUIService.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core service - DO NOT BREAK

#### **Service Contract**
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

export interface FlowUITheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
}

export interface FlowUIService {
  getComponents: () => FlowUIComponents;
  getTheme: () => FlowUITheme;
  updateTheme: (theme: Partial<FlowUITheme>) => void;
  registerComponent: (name: string, component: React.ComponentType<any>) => void;
}
```

#### **Migration Requirements**
- ✅ **Maintain all UI components** - Critical for consistency
- ✅ **Preserve theme system** - UI styling
- ✅ **Keep component registry** - Extensibility
- ⚠️ **Can add new components** - Backward compatible
- ❌ **Cannot remove existing components** - Breaking change

---

### 6. **UnifiedTokenDisplayService**
**File**: `src/services/unifiedTokenDisplayService.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core service - DO NOT BREAK

#### **Service Contract**
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

export interface TokenValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  payload?: any;
  header?: any;
  signature?: string;
}

export interface UnifiedTokenDisplayService {
  displayToken: (props: TokenDisplayProps) => React.ReactElement;
  validateToken: (token: string) => TokenValidationResult;
  formatToken: (token: string, format: 'json' | 'jwt' | 'raw') => string;
  copyToken: (token: string) => Promise<boolean>;
}
```

#### **Migration Requirements**
- ✅ **Maintain TokenDisplayProps interface** - Used by all flows
- ✅ **Preserve validation functionality** - Security feature
- ✅ **Keep formatting options** - Display flexibility
- ⚠️ **Can add new formats** - Backward compatible
- ❌ **Cannot change validation logic** - Security impact

---

### 7. **v4ToastManager**
**File**: `src/utils/v4ToastMessages.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core service - DO NOT BREAK

#### **Service Contract**
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

export interface ToastManager {
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showToast: (toast: ToastMessage) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}
```

#### **Migration Requirements**
- ✅ **Maintain all toast methods** - Critical for user feedback
- ✅ **Preserve ToastMessage interface** - Message structure
- ✅ **Keep dismiss functionality** - User control
- ⚠️ **Can add new toast types** - Backward compatible
- ❌ **Cannot change method signatures** - Breaking change

---

### 8. **FlowCompletionService**
**File**: `src/services/flowCompletionService.tsx`
**Used By**: OIDCHybridFlowV7, JWTBearerTokenFlowV7
**Critical**: ✅ Important service - DO NOT BREAK

#### **Service Contract**
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

export interface FlowCompletionService {
  trackStep: (stepName: string, isComplete: boolean) => void;
  getProgress: () => number;
  getResult: () => FlowCompletionResult;
  reset: () => void;
  validateCompletion: () => boolean;
}
```

#### **Migration Requirements**
- ✅ **Maintain tracking functionality** - Progress tracking
- ✅ **Preserve validation logic** - Completion validation
- ✅ **Keep configuration options** - Flexibility
- ⚠️ **Can add new tracking features** - Backward compatible
- ❌ **Cannot change step tracking logic** - Breaking change

---

### 9. **V7SharedService**
**File**: `src/services/v7SharedService.tsx`
**Used By**: OIDCHybridFlowV7
**Critical**: ⚠️ V7-specific - Plan for migration

#### **Service Contract**
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

export interface V7SharedService {
  initializeFlow: (flowName: string, config?: Partial<V7FlowConfig>) => V7FlowConfig;
  validateParameters: (flowName: string, parameters: Record<string, unknown>) => ValidationResult;
  getSecurityHeaders: (flowName: string) => Record<string, string>;
  checkCompliance: (flowName: string) => ComplianceResult;
  handleError: (error: Error, context: string) => void;
}
```

#### **Migration Requirements**
- ⚠️ **V7-specific service** - Plan migration to V9 equivalent
- ✅ **Maintain during transition** - Avoid breaking existing flows
- 🔄 **Create V9 equivalent** - New service with same interface
- 📅 **Phase out after migration** - Archive when no longer needed

---

### 10. **HybridFlowSharedService**
**File**: `src/services/hybridFlowSharedService.tsx`
**Used By**: OIDCHybridFlowV7
**Critical**: ⚠️ Flow-specific - Plan for migration

#### **Service Contract**
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

export interface HybridFlowTokenProcessor {
  processAuthorizationResponse: (response: any) => Promise<TokenResult>;
  validateIDToken: (idToken: string) => Promise<IDTokenValidationResult>;
  extractTokens: (response: any) => TokenSet;
  handleNonceValidation: (nonce: string, idToken: string) => boolean;
}

export interface HybridFlowSharedService {
  createConfig: (overrides?: Partial<HybridFlowConfig>) => HybridFlowConfig;
  getProcessor: () => HybridFlowTokenProcessor;
  validateHybridFlow: (config: HybridFlowConfig) => ValidationResult;
}
```

#### **Migration Requirements**
- ⚠️ **Hybrid flow specific** - Only used by OIDC Hybrid Flow
- ✅ **Maintain during transition** - Critical for hybrid flow functionality
- 🔄 **Migrate to V9** - Create V9 equivalent service
- 📅 **Archive after migration** - When V9 hybrid flow is stable

---

## 🔄 Hooks Used by V7 Side Menu Flows

### 1. **usePageScroll**
**File**: `src/hooks/usePageScroll.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core hook - DO NOT BREAK

#### **Hook Contract**
```typescript
export interface UsePageScrollOptions {
  pageName: string;
  force?: boolean;
  smooth?: boolean;
  offset?: number;
}

export interface UsePageScrollReturn {
  scrollToTop: () => void;
  scrollToElement: (elementId: string) => void;
  isScrolling: boolean;
  currentPosition: number;
}

export function usePageScroll(options: UsePageScrollOptions): UsePageScrollReturn
```

#### **Migration Requirements**
- ✅ **Maintain scroll functionality** - Core UX feature
- ✅ **Preserve options interface** - Configuration flexibility
- ✅ **Keep return interface** - Hook contract
- ⚠️ **Can add new scroll features** - Backward compatible
- ❌ **Cannot change scroll behavior** - UX impact

---

### 2. **useCredentialBackup**
**File**: `src/hooks/useCredentialBackup.tsx`
**Used By**: TokenExchangeFlowV7, OIDCHybridFlowV7, WorkerTokenFlowV7
**Critical**: ✅ Important hook - DO NOT BREAK

#### **Hook Contract**
```typescript
export interface CredentialBackupOptions {
  flowKey: string;
  autoSave?: boolean;
  encrypt?: boolean;
  backupToCloud?: boolean;
}

export interface CredentialBackupReturn {
  saveCredentials: (credentials: StepCredentials) => Promise<boolean>;
  loadCredentials: () => Promise<StepCredentials | null>;
  deleteBackup: () => Promise<boolean>;
  hasBackup: () => boolean;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useCredentialBackup(options: CredentialBackupOptions): CredentialBackupReturn
```

#### **Migration Requirements**
- ✅ **Maintain backup functionality** - Data persistence
- ✅ **Preserve encryption options** - Security
- ✅ **Keep async operations** - Performance
- ⚠️ **Can add new backup features** - Backward compatible
- ❌ **Cannot change backup format** - Data compatibility

---

### 3. **useHybridFlowControllerV7**
**File**: `src/hooks/useHybridFlowControllerV7.tsx`
**Used By**: OIDCHybridFlowV7
**Critical**: ⚠️ V7-specific - Plan for migration

#### **Hook Contract**
```typescript
export interface HybridFlowControllerOptions {
  flowKey: string;
  defaultResponseType?: string;
  enableNonceValidation?: boolean;
  enableIDTokenValidation?: boolean;
}

export interface HybridFlowControllerReturn {
  config: HybridFlowConfig;
  updateConfig: (updates: Partial<HybridFlowConfig>) => void;
  processAuthorizationResponse: (response: any) => Promise<TokenResult>;
  validateFlow: () => ValidationResult;
  reset: () => void;
  isProcessing: boolean;
  error: string | null;
}

export function useHybridFlowControllerV7(options: HybridFlowControllerOptions): HybridFlowControllerReturn
```

#### **Migration Requirements**
- ⚠️ **V7-specific hook** - Only used by V7 hybrid flow
- ✅ **Maintain during transition** - Critical for hybrid flow
- 🔄 **Create V9 equivalent** - New hook with same interface
- 📅 **Archive after migration** - When V9 hybrid flow is ready

---

### 4. **useResourceOwnerPasswordFlowV7**
**File**: `src/hooks/useResourceOwnerPasswordFlowV7.tsx`
**Used By**: OAuthROPCFlowV7
**Critical**: ⚠️ V7-specific - Plan for migration

#### **Hook Contract**
```typescript
export interface ResourceOwnerPasswordFlowOptions {
  flowKey: string;
  enableTokenValidation?: boolean;
  enableUserInfo?: boolean;
}

export interface ResourceOwnerPasswordFlowReturn {
  credentials: StepCredentials;
  updateCredentials: (updates: Partial<StepCredentials>) => void;
  authenticate: (username: string, password: string) => Promise<TokenResult>;
  validateCredentials: () => ValidationResult;
  reset: () => void;
  isAuthenticating: boolean;
  error: string | null;
  token: TokenResult | null;
}

export function useResourceOwnerPasswordFlowV7(options: ResourceOwnerPasswordFlowOptions): ResourceOwnerPasswordFlowReturn
```

#### **Migration Requirements**
- ⚠️ **V7-specific hook** - Only used by V7 ROPC flow
- ✅ **Maintain during transition** - Critical for ROPC flow
- 🔄 **Create V9 equivalent** - New hook with same interface
- 📅 **Archive after migration** - When V9 ROPC flow is ready

---

## 🧩 Components Used by V7 Side Menu Flows

### 1. **StepNavigationButtons**
**File**: `src/components/StepNavigationButtons.tsx`
**Used By**: All 12 V7 flows
**Critical**: ✅ Core component - DO NOT BREAK

#### **Component Contract**
```typescript
export interface StepNavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onReset?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  canReset?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  resetLabel?: string;
  showStepNumbers?: boolean;
  showProgress?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

#### **Migration Requirements**
- ✅ **Maintain navigation functionality** - Core UX
- ✅ **Preserve all props** - Used by all flows
- ✅ **Keep callback functions** - Navigation logic
- ⚠️ **Can add new features** - Backward compatible
- ❌ **Cannot change navigation behavior** - UX impact

---

### 2. **EnhancedApiCallDisplay**
**File**: `src/components/EnhancedApiCallDisplay.tsx`
**Used By**: TokenExchangeFlowV7, PingOnePARFlowV7
**Critical**: ✅ Important component - DO NOT BREAK

#### **Component Contract**
```typescript
export interface EnhancedApiCallDisplayProps {
  apiCall: EnhancedApiCallData;
  showHeaders?: boolean;
  showBody?: boolean;
  showResponse?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onCopy?: (text: string) => void;
  onExecute?: (apiCall: EnhancedApiCallData) => Promise<any>;
}

export interface EnhancedApiCallData {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  executionTime?: number;
  error?: string;
}
```

#### **Migration Requirements**
- ✅ **Maintain display functionality** - API visualization
- ✅ **Preserve data interface** - API call structure
- ✅ **Keep execution features** - Interactive testing
- ⚠️ **Can add new display features** - Backward compatible
- ❌ **Cannot change data format** - Breaking change

---

### 3. **LearningTooltip**
**File**: `src/components/LearningTooltip.tsx`
**Used By**: TokenExchangeFlowV7, PingOnePARFlowV7
**Critical**: ✅ Important component - DO NOT BREAK

#### **Component Contract**
```typescript
export interface LearningTooltipProps {
  content: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}
```

#### **Migration Requirements**
- ✅ **Maintain tooltip functionality** - Educational feature
- ✅ **Preserve positioning options** - UI flexibility
- ✅ **Keep trigger options** - Interaction modes
- ⚠️ **Can add new tooltip features** - Backward compatible
- ❌ **Cannot change tooltip behavior** - UX impact

---

### 4. **WorkerTokenExpiryBannerV8**
**File**: `src/v8/components/WorkerTokenExpiryBannerV8.tsx`
**Used By**: TokenExchangeFlowV7, WorkerTokenFlowV7
**Critical**: ⚠️ V8 component - Plan for migration

#### **Component Contract**
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

#### **Migration Requirements**
- ⚠️ **V8 component used in V7** - Migration dependency
- ✅ **Maintain during transition** - Critical for worker tokens
- 🔄 **Create V9 equivalent** - New component with same interface
- 📅 **Archive after migration** - When V9 worker token flow is ready

---

### 5. **WorkerTokenModalV8**
**File**: `src/v8/components/WorkerTokenModalV8.tsx`
**Used By**: TokenExchangeFlowV7, WorkerTokenFlowV7
**Critical**: ⚠️ V8 component - Plan for migration

#### **Component Contract**
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

#### **Migration Requirements**
- ⚠️ **V8 component used in V7** - Migration dependency
- ✅ **Maintain during transition** - Critical for worker tokens
- 🔄 **Create V9 equivalent** - New component with same interface
- 📅 **Archive after migration** - When V9 worker token flow is ready

---

## 🗄️ Services NOT Used by V7 Side Menu Flows

### **Services Safe to Archive**

#### **V6/V5 Legacy Services**
- `src/services/v5*` - V5 services (archived)
- `src/services/v6*` - V6 services (deprecated)
- `src/services/legacy*` - Legacy services

#### **Unused V7 Services**
- `src/services/v7EducationalContentDataService.tsx` - Not used in side menu flows
- `src/services/v7StepperService.tsx` - Not used in side menu flows
- `src/services/v7FlowTemplateService.tsx` - Template service only
- `src/services/v7m/*` - V7M mock flows (not in main side menu)

#### **Specialized Services**
- `src/services/advancedParametersService.tsx` - Advanced parameters only
- `src/services/flowComparisonService.tsx` - Comparison features only
- `src/services/flowDocumentationService.tsx` - Documentation only
- `src/services/flowMetricsService.tsx` - Metrics and analytics only
- `src/services/flowPerformanceService.tsx` - Performance monitoring only

#### **Development/Testing Services**
- `src/services/mockService.tsx` - Mock data for testing
- `src/services/testService.tsx` - Testing utilities
- `src/services/debugService.tsx` - Debug utilities

#### **Deprecated Services**
- `src/services/old*` - Any services marked as old/deprecated
- `src/services/experimental*` - Experimental features

---

## 🚀 Migration Strategy

### **Phase 1: Service Inventory & Documentation**
- ✅ Document all service contracts (completed)
- ✅ Identify critical vs non-critical services
- ✅ Create migration requirements for each service

### **Phase 2: V9 Service Creation**
- Create V9 equivalents for V7-specific services
- Maintain API compatibility during transition
- Test V9 services with existing V7 flows

### **Phase 3: Gradual Migration**
- Update V7 flows to use V9 services where possible
- Maintain backward compatibility
- Monitor for breaking changes

### **Phase 4: Cleanup & Archival**
- Archive unused services
- Remove V7-specific dependencies
- Clean up legacy code

---

## 📊 Migration Priority Matrix

| Service | Priority | Risk | Effort | Status |
|---------|----------|------|--------|---------|
| ComprehensiveCredentialsService | 🔴 Critical | High | High | ✅ Maintain |
| CopyButtonService | 🔴 Critical | Low | Low | ✅ Maintain |
| CredentialGuardService | 🔴 Critical | Medium | Medium | ✅ Maintain |
| FlowHeader Service | 🔴 Critical | Low | Low | ✅ Maintain |
| FlowUIService | 🔴 Critical | Medium | Medium | ✅ Maintain |
| UnifiedTokenDisplayService | 🔴 Critical | Low | Low | ✅ Maintain |
| v4ToastManager | 🔴 Critical | Low | Low | ✅ Maintain |
| FlowCompletionService | 🟡 Important | Medium | Medium | ✅ Maintain |
| V7SharedService | 🟡 V7-specific | Medium | High | 🔄 Migrate |
| HybridFlowSharedService | 🟡 Flow-specific | Medium | High | 🔄 Migrate |
| usePageScroll | 🔴 Critical | Low | Low | ✅ Maintain |
| useCredentialBackup | 🟡 Important | Medium | Medium | ✅ Maintain |
| useHybridFlowControllerV7 | 🟡 V7-specific | Medium | High | 🔄 Migrate |
| useResourceOwnerPasswordFlowV7 | 🟡 V7-specific | Medium | High | 🔄 Migrate |
| StepNavigationButtons | 🔴 Critical | Low | Low | ✅ Maintain |
| EnhancedApiCallDisplay | 🟡 Important | Low | Medium | ✅ Maintain |
| LearningTooltip | 🟡 Important | Low | Low | ✅ Maintain |
| WorkerTokenExpiryBannerV8 | 🟡 V8 dependency | Medium | Medium | 🔄 Migrate |
| WorkerTokenModalV8 | 🟡 V8 dependency | Medium | Medium | 🔄 Migrate |

---

## 🎯 Key Migration Rules

### ✅ **DO NOT BREAK**
1. **Never remove props or methods** used by V7 flows
2. **Never change prop types or method signatures**
3. **Never change core behavior** of critical services
4. **Always maintain backward compatibility**

### ⚠️ **CAN CHANGE**
1. **Add new props or methods** (backward compatible)
2. **Improve performance** without changing behavior
3. **Add new features** as optional enhancements
4. **Update styling** without affecting functionality

### 🔄 **MIGRATION PATH**
1. **Create V9 equivalents** for V7-specific services
2. **Test thoroughly** with existing V7 flows
3. **Gradually migrate** flows to V9 services
4. **Archive old services** when no longer needed

---

**This comprehensive service contract documentation ensures safe migration from V7 to V9 without breaking any existing functionality while providing a clear path for modernization.**
