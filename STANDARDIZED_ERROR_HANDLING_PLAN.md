# Standardized Error Handling Plan

**Goal:** Create a unified, consistent error handling system across all OAuth/OIDC flows with V5 stepper integration and "Start Over" functionality.

**Status:** Planning Phase - Ready for Implementation

---

## 📋 Current State Analysis

### Existing Error Handling Locations

1. **Callback Pages**
   - `src/components/callbacks/AuthzCallback.tsx` ✅ (Recently fixed with stepper + start over)
   - `src/components/callbacks/ImplicitCallback.tsx`
   - `src/components/callbacks/OAuthV3Callback.tsx`
   - `src/pages/AuthorizationCallback.tsx`
   - `src/pages/callbacks/HybridCallbackV3.tsx`

2. **Flow Pages** (Inline Error Handling)
   - All V6 flows in `src/pages/flows/*V6.tsx` (12+ files)
   - V5 flows in `src/pages/flows/*V5.tsx`
   - V3 flows in `src/pages/flows/*V3.tsx`

3. **Error Display Components**
   - `src/components/OAuthErrorHelper.tsx` (Existing helper with suggestions)
   - Various inline error displays in flow pages

### Pain Points

- ❌ Inconsistent error messaging across flows
- ❌ No V5 stepper on error pages (except AuthzCallback)
- ❌ No "Start Over" button in most error states
- ❌ Duplicate error handling code in each flow
- ❌ Different error formats (some use toast, some use inline, some use modals)
- ❌ Hard to maintain - changes require updating multiple files
- ❌ Users get stuck when errors occur

---

## 🎯 Solution Design

### 1. Create Centralized Error Service

**File:** `src/services/flowErrorService.tsx`

**Responsibilities:**
- Display consistent error UI across all flows
- Show V5 stepper with current step highlighted
- Provide "Start Over" button that navigates to correct flow
- Support different error types (authorization, token exchange, validation, network, etc.)
- Integrate with existing `OAuthErrorHelper` component
- Support both inline errors (within flow) and full-page errors (callback pages)

**API Design:**
```typescript
interface FlowErrorConfig {
  // Flow context
  flowType: 'authorization-code' | 'implicit' | 'device-authorization' | 'client-credentials' | ...;
  flowKey: string; // e.g., 'oauth-authorization-code-v6'
  currentStep: number;
  
  // Error details
  error: string;
  errorDescription?: string;
  errorCode?: string;
  correlationId?: string;
  
  // Display options
  displayMode: 'inline' | 'fullpage';
  showStepper: boolean;
  showStartOver: boolean;
  showRetry: boolean;
  
  // Actions
  onStartOver?: () => void;
  onRetry?: () => void;
  onGoToConfig?: () => void;
  
  // Additional context
  metadata?: Record<string, any>;
}

// Service API
class FlowErrorService {
  // Main method - returns JSX
  static renderError(config: FlowErrorConfig): JSX.Element;
  
  // Helper to get flow path from flowKey
  static getFlowPath(flowKey: string): string;
  
  // Helper to clear error state
  static clearErrorState(flowKey: string): void;
  
  // Helper to get step definitions for different flows
  static getFlowSteps(flowType: string): FlowStep[];
  
  // Helper to categorize errors
  static categorizeError(error: string): ErrorCategory;
}

// Error categories for better UX
enum ErrorCategory {
  CONFIGURATION = 'configuration',    // Missing/invalid credentials
  AUTHORIZATION = 'authorization',    // OAuth authorization errors
  TOKEN_EXCHANGE = 'token_exchange',  // Token exchange failures
  NETWORK = 'network',                // Network/timeout errors
  VALIDATION = 'validation',          // Input validation errors
  EXPIRED = 'expired',                // Expired codes/tokens
  PERMISSION = 'permission',          // Permission/scope errors
  UNKNOWN = 'unknown'
}
```

### 2. Error UI Components

**2.1 Full-Page Error Component**
- Used in callback pages
- Shows V5 stepper at top
- Large error card in center
- Start Over button
- Retry button (if applicable)

**2.2 Inline Error Component**
- Used within flow pages (between steps)
- Compact error display
- Small stepper indicator
- Actions inline with error

**2.3 Error Toast Component**
- For non-critical errors
- Auto-dismissing
- Minimal UI impact

### 3. Step Definitions Service

**File:** `src/services/flowStepDefinitions.ts`

Central repository of step definitions for all flows:

```typescript
export const FLOW_STEP_DEFINITIONS = {
  'authorization-code': [
    { number: 0, title: 'Setup', description: 'Configure credentials' },
    { number: 1, title: 'PKCE', description: 'Generate PKCE codes' },
    { number: 2, title: 'Authorization', description: 'Get authorization code' },
    { number: 3, title: 'Callback', description: 'Process redirect' },
    { number: 4, title: 'Exchange', description: 'Exchange code for tokens' },
    { number: 5, title: 'Validate', description: 'Validate tokens' },
  ],
  'implicit': [
    { number: 0, title: 'Setup', description: 'Configure credentials' },
    { number: 1, title: 'Authorization', description: 'Get tokens directly' },
    { number: 2, title: 'Callback', description: 'Process redirect' },
    { number: 3, title: 'Validate', description: 'Validate tokens' },
  ],
  // ... more flows
};
```

### 4. Error Message Templates

**File:** `src/constants/errorMessages.ts`

Standardized error messages with suggestions:

```typescript
export const ERROR_MESSAGES = {
  // Configuration Errors
  'invalid_client': {
    title: 'Invalid Client Credentials',
    message: 'There is an issue with your client ID or client secret.',
    suggestions: [
      'Verify your Client ID and Client Secret in PingOne Admin',
      'Check that the application is enabled',
      'Ensure you\'re using the correct environment ID'
    ],
    icon: 'FiAlertTriangle',
    category: ErrorCategory.CONFIGURATION
  },
  
  'redirect_uri_mismatch': {
    title: 'Redirect URI Mismatch',
    message: 'The redirect URI in your request does not match the configured URI.',
    suggestions: [
      'Check redirect URI matches exactly in PingOne Admin',
      'Ensure no trailing slashes unless configured',
      'Verify protocol (http vs https)'
    ],
    icon: 'FiLink',
    category: ErrorCategory.CONFIGURATION
  },
  
  'authorization_code_expired': {
    title: 'Authorization Code Expired',
    message: 'This authorization code has already been used or has expired.',
    suggestions: [
      'Authorization codes are single-use only',
      'Start the authorization flow again',
      'Check for clock skew between client and server'
    ],
    icon: 'FiClock',
    category: ErrorCategory.EXPIRED
  },
  
  // ... more error templates
};
```

---

## 📝 Implementation Plan

### Phase 1: Core Service Creation (2-3 hours)

**1.1 Create FlowErrorService** ✅ Ready to implement
- [ ] Create `src/services/flowErrorService.tsx`
- [ ] Define `FlowErrorConfig` interface
- [ ] Implement `renderError()` method
- [ ] Implement `getFlowPath()` helper
- [ ] Implement `clearErrorState()` helper
- [ ] Add unit tests

**1.2 Create Step Definitions Service** ✅ Ready to implement
- [ ] Create `src/services/flowStepDefinitions.ts`
- [ ] Define step definitions for all flows
- [ ] Export helper functions for step lookup
- [ ] Add TypeScript types

**1.3 Create Error Message Templates** ✅ Ready to implement
- [ ] Create `src/constants/errorMessages.ts`
- [ ] Define 20+ common error templates
- [ ] Include icons, titles, messages, and suggestions
- [ ] Categorize errors by type

**1.4 Create Error UI Components** ✅ Ready to implement
- [ ] Create `src/components/FlowErrorDisplay.tsx` (full-page)
- [ ] Create `src/components/InlineFlowError.tsx` (inline)
- [ ] Style components with consistent design
- [ ] Add animations for better UX

### Phase 2: Callback Page Integration (1-2 hours)

**2.1 Migrate AuthzCallback** ✅ Already done (use as template)
- [x] Already uses V5 stepper
- [x] Already has Start Over button
- [x] Use as reference for others

**2.2 Update ImplicitCallback**
- [ ] Replace error display with `FlowErrorService`
- [ ] Add V5 stepper for implicit flow
- [ ] Add Start Over button
- [ ] Test all error scenarios

**2.3 Update Other Callbacks**
- [ ] Update `OAuthV3Callback.tsx`
- [ ] Update `HybridCallbackV3.tsx`
- [ ] Update `AuthorizationCallback.tsx`

### Phase 3: V6 Flow Integration (4-6 hours)

**3.1 Authorization Code Flows**
- [ ] `OAuthAuthorizationCodeFlowV6.tsx`
- [ ] `OIDCAuthorizationCodeFlowV6.tsx`
- [ ] Replace inline error handling with service
- [ ] Add error boundaries around critical sections
- [ ] Test token exchange errors
- [ ] Test validation errors

**3.2 Implicit Flows**
- [ ] `OAuthImplicitFlowV6.tsx`
- [ ] `OIDCImplicitFlowV6_Full.tsx`
- [ ] `OIDCImplicitFlowV6_IDTokenOnly.tsx`

**3.3 Other V6 Flows**
- [ ] `DeviceAuthorizationFlowV6.tsx`
- [ ] `OIDCDeviceAuthorizationFlowV6.tsx`
- [ ] `ClientCredentialsFlowV6.tsx`
- [ ] `ResourceOwnerPasswordFlowV6.tsx`
- [ ] `JWTBearerTokenFlowV6.tsx`
- [ ] `SAMLBearerAssertionFlowV6.tsx`
- [ ] `PingOnePARFlowV6_New.tsx`
- [ ] `RARFlowV6_New.tsx`
- [ ] `RedirectlessFlowV6_Real.tsx`
- [ ] `OIDCHybridFlowV6.tsx`

### Phase 4: V5 Flow Integration (2-3 hours)

- [ ] Migrate all V5 flows to use new error service
- [ ] Ensure backward compatibility
- [ ] Test extensively

### Phase 5: Error Boundary Implementation (1-2 hours)

**5.1 Create Flow Error Boundary**
- [ ] Create `src/components/FlowErrorBoundary.tsx`
- [ ] Catch React errors in flows
- [ ] Display using `FlowErrorService`
- [ ] Log errors to console/monitoring

**5.2 Wrap All Flows**
- [ ] Wrap each flow component with `FlowErrorBoundary`
- [ ] Pass flow context to boundary

### Phase 6: Testing & Polish (2-3 hours)

**6.1 Test Error Scenarios**
- [ ] Invalid credentials
- [ ] Expired authorization codes
- [ ] Network timeouts
- [ ] Missing required fields
- [ ] Invalid redirect URIs
- [ ] Token exchange failures
- [ ] Validation errors

**6.2 Test Navigation**
- [ ] Start Over button works from all flows
- [ ] Retry button works where applicable
- [ ] Error state clears correctly
- [ ] No duplicate error displays

**6.3 Visual Polish**
- [ ] Consistent styling across all errors
- [ ] Smooth animations
- [ ] Responsive on mobile
- [ ] Accessibility (ARIA labels, keyboard navigation)

### Phase 7: Documentation (1 hour)

- [ ] Update error handling documentation
- [ ] Create developer guide for using `FlowErrorService`
- [ ] Add JSDoc comments
- [ ] Create examples

---

## 🔧 Technical Details

### Service Usage Examples

**Example 1: Full-Page Error (Callback Pages)**
```typescript
import { FlowErrorService } from '../../services/flowErrorService';

const AuthzCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const flowKey = sessionStorage.getItem('active_oauth_flow') || '';
  
  if (error) {
    return FlowErrorService.renderError({
      flowType: 'authorization-code',
      flowKey,
      currentStep: 3,
      error: error,
      errorDescription: 'Authorization callback failed',
      displayMode: 'fullpage',
      showStepper: true,
      showStartOver: true,
      showRetry: true,
      onRetry: () => window.location.reload(),
    });
  }
  
  // ... normal flow
};
```

**Example 2: Inline Error (Flow Pages)**
```typescript
import { FlowErrorService } from '../../services/flowErrorService';

const OAuthAuthorizationCodeFlowV6 = () => {
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  return (
    <>
      {/* ... other content */}
      
      {tokenError && (
        FlowErrorService.renderError({
          flowType: 'authorization-code',
          flowKey: 'oauth-authorization-code-v6',
          currentStep: 4,
          error: tokenError,
          displayMode: 'inline',
          showStepper: false,
          showStartOver: true,
          showRetry: true,
          onStartOver: handleStartOver,
          onRetry: handleRetryTokenExchange,
        })
      )}
      
      {/* ... other content */}
    </>
  );
};
```

**Example 3: With Error Boundary**
```typescript
import { FlowErrorBoundary } from '../../components/FlowErrorBoundary';

const App = () => {
  return (
    <FlowErrorBoundary flowKey="oauth-authorization-code-v6" flowType="authorization-code">
      <OAuthAuthorizationCodeFlowV6 />
    </FlowErrorBoundary>
  );
};
```

### Migration Pattern

For each flow, follow this pattern:

1. **Identify error states**
   - Search for `setError`, `useState.*error`, `catch.*error`
   - Find inline error displays
   - Find error modals/alerts

2. **Replace with service**
   ```typescript
   // OLD
   {error && <div className="error">{error}</div>}
   
   // NEW
   {error && FlowErrorService.renderError({
     flowType: 'authorization-code',
     flowKey: flowKey,
     currentStep: currentStep,
     error: error,
     displayMode: 'inline',
     showStartOver: true,
   })}
   ```

3. **Test error scenarios**
   - Trigger each error path
   - Verify Start Over works
   - Verify stepper shows correct step

### File Structure After Implementation

```
src/
├── services/
│   ├── flowErrorService.tsx          ✨ NEW - Main error service
│   ├── flowStepDefinitions.ts        ✨ NEW - Step definitions
│   └── ...existing services
├── components/
│   ├── FlowErrorDisplay.tsx          ✨ NEW - Full-page error
│   ├── InlineFlowError.tsx           ✨ NEW - Inline error
│   ├── FlowErrorBoundary.tsx         ✨ NEW - Error boundary
│   ├── OAuthErrorHelper.tsx          ✅ EXISTING - Reuse for suggestions
│   └── ...existing components
├── constants/
│   ├── errorMessages.ts              ✨ NEW - Error templates
│   └── ...existing constants
├── pages/flows/
│   ├── *V6.tsx                       🔄 UPDATE - Use new service
│   ├── *V5.tsx                       🔄 UPDATE - Use new service
│   └── *V3.tsx                       🔄 UPDATE - Use new service
└── components/callbacks/
    ├── AuthzCallback.tsx             ✅ DONE - Already migrated
    ├── ImplicitCallback.tsx          🔄 UPDATE - Use new service
    └── ...other callbacks            🔄 UPDATE - Use new service
```

---

## ✅ Success Criteria

After implementation, the system should:

1. ✅ **Consistency** - All errors display in the same format across all flows
2. ✅ **Navigation** - Users can always "Start Over" from error states
3. ✅ **Context** - V5 stepper shows where error occurred
4. ✅ **Guidance** - Error messages include helpful suggestions
5. ✅ **Maintainability** - Error handling code is centralized and DRY
6. ✅ **Accessibility** - Error displays are keyboard-navigable and screen-reader friendly
7. ✅ **Testing** - All error scenarios are tested
8. ✅ **Documentation** - Developers know how to use the error service

---

## 🚀 Execution Strategy

### Option A: Big Bang (Not Recommended)
- Implement all phases at once
- High risk
- Hard to test incrementally
- Could break multiple flows

### Option B: Incremental (Recommended) ⭐
1. **Week 1:** Implement core service (Phase 1)
2. **Week 2:** Migrate callback pages (Phase 2)
3. **Week 3-4:** Migrate V6 flows in batches (Phase 3)
   - Batch 1: Authorization Code flows (2 flows)
   - Batch 2: Implicit flows (3 flows)
   - Batch 3: Other flows (10 flows)
4. **Week 5:** Migrate V5 flows (Phase 4)
5. **Week 6:** Add error boundaries, test, polish (Phases 5-7)

### Option C: Critical Path First
1. Implement service + callback pages only
2. Gradually migrate flows as they're touched for other reasons
3. Lower priority flows can wait

---

## 📊 Estimated Effort

- **Phase 1 (Core Service):** 2-3 hours
- **Phase 2 (Callbacks):** 1-2 hours
- **Phase 3 (V6 Flows):** 4-6 hours
- **Phase 4 (V5 Flows):** 2-3 hours
- **Phase 5 (Error Boundaries):** 1-2 hours
- **Phase 6 (Testing):** 2-3 hours
- **Phase 7 (Documentation):** 1 hour

**Total: 13-20 hours** (2-3 days of focused work)

---

## 🎯 Quick Start Checklist

When ready to implement:

- [ ] Read this entire plan
- [ ] Decide on execution strategy (incremental recommended)
- [ ] Create a new branch: `feature/standardized-error-handling`
- [ ] Start with Phase 1 (core service creation)
- [ ] Test each phase before moving to next
- [ ] Create PR for review after each major phase
- [ ] Update this document as you go

---

## 📝 Notes

- The `AuthzCallback` component we just fixed serves as a template for the full-page error display
- The `OAuthErrorHelper` component is already good - we'll integrate it into the new service
- Consider adding error tracking/logging to the service for debugging
- Could add error recovery suggestions based on error type
- Could add "Copy Error Details" button for support tickets

---

**Last Updated:** October 13, 2025
**Status:** 📋 Planning Complete - Ready for Implementation
**Priority:** 🔥 High - Improves user experience significantly

