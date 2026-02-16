# Potential New Services for Implicit Flows

**Date:** 2025-10-08  
**Status:** 📋 ANALYSIS  

## Currently Duplicated Logic

Based on analysis of both OAuth and OIDC Implicit V5 flows, here are patterns that could be extracted into new services:

---

## 1. 🎯 **Collapsible Sections State Service**

### Current Duplication
**Both flows have identical code** (lines 236-253):

```typescript
const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    overview: true,
    flowDiagram: true,
    authRequestOverview: false, // Expanded by default for Step 2
    authRequestDetails: true,
    responseMode: true,
    tokenResponseOverview: true,
    tokenResponseDetails: true,
    tokenResponse: false, // Expanded by default for Step 2
    introspectionOverview: true,
    introspectionDetails: true,
    apiCallDisplay: true,
    securityOverview: true,
    securityBestPractices: true,
    flowSummary: false, // Expanded by default for flow summary page
    flowComparison: true,
    completionOverview: true,
    completionDetails: true,
});

const toggleSection = useCallback((key: IntroSectionKey) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
}, []);
```

### Proposed Service
**File:** `src/services/collapsibleSectionsService.ts`

```typescript
export class CollapsibleSectionsService {
    // Get default collapsed state for implicit flows
    static getDefaultState() {
        return {
            overview: true,
            flowDiagram: true,
            authRequestOverview: false, // Expanded
            authRequestDetails: true,
            responseMode: true,
            tokenResponseOverview: true,
            tokenResponseDetails: true,
            tokenResponse: false, // Expanded
            introspectionOverview: true,
            introspectionDetails: true,
            apiCallDisplay: true,
            securityOverview: true,
            securityBestPractices: true,
            flowSummary: false, // Expanded
            flowComparison: true,
            completionOverview: true,
            completionDetails: true,
        };
    }

    // Create toggle handler
    static createToggleHandler(
        setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    ) {
        return (key: string) => {
            setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
        };
    }

    // Expand specific sections
    static expandSections(
        sections: string[],
        setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    ) {
        setCollapsedSections((prev) => {
            const updated = { ...prev };
            sections.forEach(section => {
                updated[section] = false;
            });
            return updated;
        });
    }

    // Collapse specific sections
    static collapseSections(
        sections: string[],
        setCollapsedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    ) {
        setCollapsedSections((prev) => {
            const updated = { ...prev };
            sections.forEach(section => {
                updated[section] = true;
            });
            return updated;
        });
    }
}
```

**Usage:**
```typescript
const [collapsedSections, setCollapsedSections] = useState(
    CollapsibleSectionsService.getDefaultState()
);

const toggleSection = CollapsibleSectionsService.createToggleHandler(setCollapsedSections);
```

**Impact:** Both flows use same defaults and toggle logic

---

## 2. 🎯 **Modal State Management Service**

### Current Duplication
**Both flows have identical code** (lines 256-257):

```typescript
const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
const [showRedirectModal, setShowRedirectModal] = useState<boolean>(false);

const handleConfirmRedirect = useCallback(() => {
    setShowRedirectModal(false);
    controller.handleRedirectAuthorization();
}, [controller]);

const handleCancelRedirect = useCallback(() => {
    setShowRedirectModal(false);
}, []);
```

### Proposed Service
**File:** `src/services/flowModalService.ts`

```typescript
export interface ModalHandlers {
    showSuccessModal: boolean;
    showRedirectModal: boolean;
    setShowSuccessModal: (show: boolean) => void;
    setShowRedirectModal: (show: boolean) => void;
    handleConfirmRedirect: () => void;
    handleCancelRedirect: () => void;
}

export class FlowModalService {
    // Create modal state and handlers
    static useModalHandlers(controller: any): ModalHandlers {
        const [showSuccessModal, setShowSuccessModal] = useState(false);
        const [showRedirectModal, setShowRedirectModal] = useState(false);

        const handleConfirmRedirect = useCallback(() => {
            setShowRedirectModal(false);
            controller.handleRedirectAuthorization();
        }, [controller]);

        const handleCancelRedirect = useCallback(() => {
            setShowRedirectModal(false);
        }, []);

        return {
            showSuccessModal,
            showRedirectModal,
            setShowSuccessModal,
            setShowRedirectModal,
            handleConfirmRedirect,
            handleCancelRedirect,
        };
    }
}
```

**Usage:**
```typescript
const modals = FlowModalService.useModalHandlers(controller);
// Use: modals.showSuccessModal, modals.handleConfirmRedirect, etc.
```

**Impact:** Consistent modal behavior across all flows

---

## 3. 🎯 **Token Fragment Processing Service**

### Current Duplication
**Both flows have identical code** (lines 259-268):

```typescript
useEffect(() => {
    const hash = window.location.hash;
    if (hash?.includes('access_token')) {
        controller.setTokensFromFragment(hash);
        setCurrentStep(2); // Go to token response step
        v4ToastManager.showSuccess('Tokens received successfully from authorization server!');
        setShowSuccessModal(true);

        // Clean up URL
        window.location.replaceState({}, '', window.location.pathname);
    }
}, [controller]);
```

### Proposed Service
**File:** Already exists! Add to `ImplicitFlowSharedService`

```typescript
export class ImplicitFlowTokenFragmentProcessor {
    /**
     * Process tokens from URL fragment and update flow state
     */
    static processTokenFragment(
        controller: any,
        setCurrentStep: (step: number) => void,
        setShowSuccessModal: (show: boolean) => void
    ): boolean {
        const hash = window.location.hash;
        if (!hash?.includes('access_token')) {
            return false;
        }

        // Extract tokens
        controller.setTokensFromFragment(hash);
        
        // Navigate to token response step
        setCurrentStep(2);
        
        // Show success feedback
        ImplicitFlowToastManager.showTokensReceived();
        setShowSuccessModal(true);

        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);

        return true;
    }

    /**
     * Create useEffect hook for token processing
     */
    static useTokenFragmentEffect(
        controller: any,
        setCurrentStep: (step: number) => void,
        setShowSuccessModal: (show: boolean) => void
    ) {
        useEffect(() => {
            ImplicitFlowTokenFragmentProcessor.processTokenFragment(
                controller,
                setCurrentStep,
                setShowSuccessModal
            );
        }, [controller]);
    }
}
```

**Usage:**
```typescript
// Instead of writing useEffect manually:
ImplicitFlowSharedService.TokenFragmentProcessor.useTokenFragmentEffect(
    controller,
    setCurrentStep,
    setShowSuccessModal
);
```

**Impact:** Same token processing logic in both flows

---

## 4. 🎯 **Step Restoration Service**

### Current Duplication
**Both flows have identical code** (lines 220-229):

```typescript
const [currentStep, setCurrentStep] = useState(() => {
    // Check for restore_step from token management navigation
    const restoreStep = sessionStorage.getItem('restore_step');
    if (restoreStep) {
        const step = parseInt(restoreStep, 10);
        sessionStorage.removeItem('restore_step'); // Clear after use
        return step;
    }
    return 0;
});
```

### Proposed Service
**File:** Add to `ImplicitFlowSharedService`

```typescript
export class ImplicitFlowStepRestoration {
    /**
     * Get initial step (with restoration from session storage)
     */
    static getInitialStep(): number {
        const restoreStep = sessionStorage.getItem('restore_step');
        if (restoreStep) {
            const step = parseInt(restoreStep, 10);
            sessionStorage.removeItem('restore_step');
            console.log('[StepRestoration] Restoring to step:', step);
            return step;
        }
        return 0;
    }

    /**
     * Store step for restoration later
     */
    static storeStepForRestoration(step: number): void {
        sessionStorage.setItem('restore_step', step.toString());
    }
}
```

**Usage:**
```typescript
const [currentStep, setCurrentStep] = useState(
    ImplicitFlowSharedService.StepRestoration.getInitialStep
);
```

**Impact:** Consistent step restoration behavior

---

## 5. 🎯 **Response Type Enforcement Service**

### Current Duplication
**Both flows have similar but different code** (lines 210-218):

```typescript
// OAuth:
useEffect(() => {
    if (credentials.responseType !== 'token') {
        setCredentials({
            ...credentials,
            responseType: 'token',
        });
    }
}, [credentials, setCredentials]);

// OIDC:
useEffect(() => {
    if (credentials.responseType !== 'id_token token') {
        setCredentials({
            ...credentials,
            responseType: 'id_token token',
        });
    }
}, [credentials, setCredentials]);
```

### Proposed Service
**File:** Add to `ImplicitFlowSharedService`

```typescript
export class ImplicitFlowResponseTypeEnforcer {
    /**
     * Enforce correct response type for flow variant
     */
    static enforceResponseType(
        variant: ImplicitFlowVariant,
        credentials: StepCredentials,
        setCredentials: (creds: StepCredentials) => void
    ): void {
        const expectedType = variant === 'oauth' ? 'token' : 'id_token token';
        
        if (credentials.responseType !== expectedType) {
            setCredentials({
                ...credentials,
                responseType: expectedType,
            });
        }
    }

    /**
     * Create useEffect hook for response type enforcement
     */
    static useResponseTypeEnforcement(
        variant: ImplicitFlowVariant,
        credentials: StepCredentials,
        setCredentials: (creds: StepCredentials) => void
    ) {
        useEffect(() => {
            ImplicitFlowResponseTypeEnforcer.enforceResponseType(
                variant,
                credentials,
                setCredentials
            );
        }, [credentials, setCredentials]);
    }
}
```

**Usage:**
```typescript
// Replace useEffect with:
ImplicitFlowSharedService.ResponseTypeEnforcer.useResponseTypeEnforcement(
    'oauth', // or 'oidc'
    credentials,
    setCredentials
);
```

**Impact:** Guaranteed correct response type per flow

---

## 6. 🎯 **Copy to Clipboard Service**

### Current Duplication
**Both flows likely have similar handleCopy functions**

### Proposed Service
**File:** Enhance existing `CopyButtonService`

```typescript
export class ImplicitFlowCopyService {
    /**
     * Copy text and show toast
     */
    static async copyToClipboard(text: string, label: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(text);
            v4ToastManager.showSuccess(`${label} copied to clipboard!`);
        } catch (error) {
            console.error('[CopyService] Failed to copy:', error);
            v4ToastManager.showError(`Failed to copy ${label}`);
        }
    }

    /**
     * Copy token with specific formatting
     */
    static async copyToken(token: string, tokenType: 'access' | 'id' | 'refresh'): Promise<void> {
        const labels = {
            access: 'Access Token',
            id: 'ID Token',
            refresh: 'Refresh Token'
        };
        await this.copyToClipboard(token, labels[tokenType]);
    }

    /**
     * Copy full token response
     */
    static async copyTokenResponse(tokens: Record<string, unknown>): Promise<void> {
        const formatted = JSON.stringify(tokens, null, 2);
        await this.copyToClipboard(formatted, 'Token Response');
    }
}
```

**Impact:** Consistent copy behavior with toasts

---

## 7. 🎯 **Step Validity Service**

### Current Duplication
**Both flows have similar isStepValid functions** (but with slight differences)

```typescript
const isStepValid = useCallback(
    (stepIndex: number) => {
        switch (stepIndex) {
            case 0: return true;
            case 1: return Boolean(controller.authUrl);
            case 2: return Boolean(controller.tokens);
            case 3: return Boolean(controller.tokens);
            case 4: return true;
            case 5: return true;
            default: return false;
        }
    },
    [controller.authUrl, controller.tokens]
);
```

### Proposed Service
**File:** Add to `ImplicitFlowSharedService`

```typescript
export class ImplicitFlowStepValidityChecker {
    /**
     * Check if a step is valid for implicit flows
     */
    static isStepValid(
        stepIndex: number,
        controller: any
    ): boolean {
        switch (stepIndex) {
            case 0: // Setup
                return true;
            case 1: // Authorization Request
                return Boolean(controller.authUrl);
            case 2: // Token Response
                return Boolean(controller.tokens);
            case 3: // Token Introspection
                return Boolean(controller.tokens);
            case 4: // Security Features
                return true;
            case 5: // Summary
                return true;
            default:
                return false;
        }
    }

    /**
     * Get step requirements message
     */
    static getStepRequirements(stepIndex: number): string[] {
        switch (stepIndex) {
            case 1: return ['Configure credentials and generate authorization URL'];
            case 2: return ['Complete authorization and receive tokens'];
            case 3: return ['Validate and inspect received tokens'];
            case 4: return ['Review security features and best practices'];
            case 5: return ['Review flow completion and next steps'];
            default: return [];
        }
    }
}
```

**Usage:**
```typescript
const isStepValid = useCallback(
    (stepIndex: number) => ImplicitFlowSharedService.StepValidity.isStepValid(stepIndex, controller),
    [controller]
);
```

**Impact:** Same step validity logic in both flows

---

## 8. 🎯 **Token Introspection Handler Service**

### Current Duplication
**Both flows have similar handleIntrospectToken** (lines 368-408 in OAuth)

### Proposed Service
**File:** Enhance existing `TokenIntrospectionService`

```typescript
export class ImplicitFlowIntrospectionHandler {
    /**
     * Create introspection handler for implicit flows
     */
    static createIntrospectionHandler(
        variant: ImplicitFlowVariant,
        credentials: StepCredentials,
        setIntrospectionApiCall: (call: any) => void
    ) {
        return async (token: string) => {
            if (!credentials.environmentId || !credentials.clientId) {
                throw new Error('Missing PingOne credentials');
            }

            const request = {
                token,
                clientId: credentials.clientId,
                tokenTypeHint: 'access_token' as const,
            };

            try {
                const result = await TokenIntrospectionService.introspectToken(
                    request,
                    'implicit',
                    `https://auth.pingone.com/${credentials.environmentId}/as/introspect`
                );

                setIntrospectionApiCall(result.apiCall);
                return result.response;
            } catch (error) {
                const errorApiCall = TokenIntrospectionService.createErrorApiCall(
                    request,
                    'implicit',
                    error instanceof Error ? error.message : 'Unknown error',
                    500,
                    `https://auth.pingone.com/${credentials.environmentId}/as/introspect`
                );
                
                setIntrospectionApiCall(errorApiCall);
                throw error;
            }
        };
    }
}
```

**Impact:** Same introspection logic in both flows

---

## 9. 🎯 **Credentials Sync Service**

### Current Duplication
**Both flows have identical sync logic** (lines 175-181):

```typescript
useEffect(() => {
    if (controller.credentials) {
        console.log('[OAuth/OIDC Implicit V5] Syncing credentials from controller:', controller.credentials);
        setCredentials(controller.credentials);
    }
}, [controller.credentials]);
```

### Proposed Service
**File:** Add to `ImplicitFlowSharedService`

```typescript
export class ImplicitFlowCredentialsSync {
    /**
     * Create credentials sync effect
     */
    static useCredentialsSync(
        variant: ImplicitFlowVariant,
        controller: any,
        setCredentials: (creds: StepCredentials) => void
    ) {
        useEffect(() => {
            if (controller.credentials) {
                console.log(`[${variant.toUpperCase()} Implicit V5] Syncing credentials from controller:`, controller.credentials);
                setCredentials(controller.credentials);
            }
        }, [controller.credentials]);
    }
}
```

**Usage:**
```typescript
ImplicitFlowSharedService.CredentialsSync.useCredentialsSync(
    'oauth',
    controller,
    setCredentials
);
```

**Impact:** Same sync behavior in both flows

---

## 10. 🎯 **Response Mode Management Service**

### Current Duplication
**Both flows have similar response mode setup** (lines 183-200):

```typescript
const responseModeIntegration = useResponseModeIntegration({
    flowKey: 'implicit',
    credentials: credentials,
    setCredentials: setCredentials,
    logPrefix: '[🔐 OAUTH-IMPLICIT]', // or '[🔐 OIDC-IMPLICIT]'
});

const { responseMode, setResponseMode: setResponseModeInternal } = responseModeIntegration;

const setResponseMode = useCallback((mode: string) => {
    console.log('[OAuth Implicit V5] Response mode changing to:', mode);
    setResponseModeInternal(mode);
    const updated = { ...controller.credentials, responseMode: mode };
    controller.setCredentials(updated);
    setCredentials(updated);
}, [setResponseModeInternal, controller, setCredentials]);
```

### Proposed Service
**File:** Add to `ImplicitFlowSharedService`

```typescript
export class ImplicitFlowResponseModeManager {
    /**
     * Setup response mode integration with proper credential sync
     */
    static useResponseModeSetup(
        variant: ImplicitFlowVariant,
        credentials: StepCredentials,
        setCredentials: (creds: StepCredentials) => void,
        controller: any
    ) {
        const responseModeIntegration = useResponseModeIntegration({
            flowKey: 'implicit',
            credentials,
            setCredentials,
            logPrefix: `[🔐 ${variant.toUpperCase()}-IMPLICIT]`,
        });

        const { setResponseMode: setResponseModeInternal } = responseModeIntegration;

        const setResponseMode = useCallback((mode: string) => {
            console.log(`[${variant.toUpperCase()} Implicit V5] Response mode changing to:`, mode);
            setResponseModeInternal(mode);
            const updated = { ...controller.credentials, responseMode: mode };
            controller.setCredentials(updated);
            setCredentials(updated);
        }, [setResponseModeInternal, controller, setCredentials]);

        return { ...responseModeIntegration, setResponseMode };
    }
}
```

**Impact:** Consistent response mode handling

---

## Priority Ranking

### High Priority (Immediate Value)
1. **✅ Collapsible Sections Service** - Eliminates 20+ lines of duplicate code
2. **✅ Token Fragment Processing** - Critical for both flows, identical logic
3. **✅ Modal State Management** - Consistent modal UX

### Medium Priority (Nice to Have)
4. **Step Restoration Service** - Small but reusable
5. **Response Type Enforcement** - Safety feature
6. **Credentials Sync** - Simple consolidation

### Low Priority (Already Abstracted)
7. Step Validity - Already pretty simple
8. Token Introspection - Already uses service
9. Copy to Clipboard - CopyButtonService exists
10. Response Mode - Already uses service

---

## Recommended Implementation Order

### Phase 1 (Today)
1. Add **Token Fragment Processing** to `ImplicitFlowSharedService`
2. Add **Step Restoration** to `ImplicitFlowSharedService`
3. Add **Collapsible Sections** methods to `ImplicitFlowSharedService`

### Phase 2 (Next)
4. Create **FlowModalService** (reusable across ALL flows)
5. Add **Response Type Enforcement** to `ImplicitFlowSharedService`
6. Add **Credentials Sync** to `ImplicitFlowSharedService`

---

## Estimated Impact

### Code Reduction
- **Collapsible Sections:** ~15 lines per flow = 30 lines
- **Token Fragment Processing:** ~12 lines per flow = 24 lines
- **Modal Management:** ~10 lines per flow = 20 lines
- **Step Restoration:** ~8 lines per flow = 16 lines
- **Response Type Enforcement:** ~8 lines per flow = 16 lines
- **Credentials Sync:** ~6 lines per flow = 12 lines

**Total Potential Reduction:** ~118 additional lines

### Maintenance Benefits
- **1 service update** affects both flows
- **Consistent behavior** guaranteed
- **Easier testing** of shared logic
- **Clear separation** of concerns

---

## Service Hierarchy Proposal

```
ImplicitFlowSharedService
├── SessionStorage (existing)
├── Toast (existing)
├── Validation (existing)
├── Navigation (existing)
├── Defaults (existing)
├── TokenManagement (existing)
├── CredentialsHandlers (existing)
├── Authorization (existing)
├── TokenFragmentProcessor (NEW)
├── StepRestoration (NEW)
├── CollapsibleSections (NEW)
├── ResponseTypeEnforcer (NEW)
├── CredentialsSync (NEW)
└── ModalManagement (NEW - or separate FlowModalService)
```

---

## Would You Like Me To:

1. ✅ **Implement Phase 1 services** (Token Fragment, Step Restoration, Collapsible Sections)
2. ✅ **Update both flows** to use these new services
3. ✅ **Create comprehensive documentation**

This would further reduce duplicate code and ensure even tighter synchronization!

---

**Ready to proceed?** Say "yes" and I'll implement these high-priority services now!

