# OAuth Authorization Code V5 - Service Migration Plan

**Date:** 2025-10-08  
**Template:** Implicit Flow Service Architecture  
**Status:** 📋 PLANNING  

## Overview

Migrate OAuth Authorization Code V5 and OIDC Authorization Code V5 to use a shared service architecture, following the proven pattern from the Implicit flows.

---

## Current State Analysis

### OAuth Authorization Code V5
- **File:** `src/pages/flows/OAuthAuthorizationCodeFlowV5.tsx`
- **Lines:** 2,843
- **Flow Type:** Authorization Code with PKCE
- **Status:** Not service-based (lots of inline logic)

### OIDC Authorization Code V5
- **File:** `src/pages/flows/OIDCAuthorizationCodeFlowV5_New.tsx`
- **Lines:** 2,683
- **Flow Type:** Authorization Code with PKCE + ID Token
- **Status:** Not service-based (duplicate logic with OAuth)

### Estimated Duplicate Code
- **State management:** ~50 lines × 2 = 100 lines
- **useEffect hooks:** ~60 lines × 2 = 120 lines
- **Handlers:** ~200 lines × 2 = 400 lines
- **Validation:** ~40 lines × 2 = 80 lines
- **Navigation:** ~30 lines × 2 = 60 lines
- **Total Estimated Duplication:** ~760 lines

---

## Service Architecture Plan

### Create: AuthorizationCodeSharedService

**File:** `src/services/authorizationCodeSharedService.ts`

**Pattern:** Mirror the `ImplicitFlowSharedService` structure

**Service Modules (14 total):**

1. **SessionStorageManager**
   - Set active flow flags (`oauth-authz-v5-flow-active` / `oidc-authz-v5-flow-active`)
   - Save/load PingOne app config
   - Clear conflicting flags

2. **AuthzFlowToastManager**
   - Success/error toasts for all operations
   - PKCE generation success
   - Auth code received
   - Token exchange success
   - Credentials saved
   - Validation errors

3. **AuthzFlowValidationManager**
   - Validate step 0 → step 1 (credentials required)
   - Validate step 1 → step 2 (PKCE required)
   - Validate step 2 → step 3 (auth URL required)
   - Validate step 3 → step 4 (auth code required)
   - Check required fields by step

4. **AuthzFlowNavigationManager**
   - Handle next with validation
   - Check can navigate next
   - Auto-advance on auth code receive

5. **AuthzFlowDefaults**
   - getOAuthDefaults() - OAuth-specific defaults
   - getOIDCDefaults() - OIDC-specific defaults
   - getDefaultAppConfig(variant)
   - getDefaultCollapsedSections()

6. **AuthzFlowTokenManagement**
   - navigateToTokenManagement() with flow context
   - Store navigation state

7. **AuthzFlowCredentialsHandlers**
   - createEnvironmentIdHandler()
   - createClientIdHandler()
   - createClientSecretHandler()
   - createRedirectUriHandler()
   - createScopesHandler()
   - createSaveHandler()
   - createDiscoveryHandler()
   - createPingOneConfigHandler()

8. **AuthzFlowPKCEManager**
   - generatePKCE() - Generate code verifier and challenge
   - validatePKCE() - Check PKCE parameters present
   - showPKCEGenerated() toast

9. **AuthzFlowAuthorizationManager**
   - generateAuthUrl() - Build authorization URL with PKCE
   - openAuthUrl() - Validate and open URL
   - Set session storage flags

10. **AuthzFlowCodeProcessor**
    - processAuthorizationCode() - Handle code from callback
    - Auto-advance to token exchange step
    - Store code in state

11. **AuthzFlowTokenExchangeManager**
    - exchangeCodeForTokens() - POST to token endpoint
    - Create API call data for display
    - Handle success/error

12. **AuthzFlowStepRestoration**
    - getInitialStep() - Restore from sessionStorage
    - storeStepForRestoration()
    - scrollToTopOnStepChange()

13. **AuthzFlowCollapsibleSectionsManager**
    - getDefaultState() - Default collapsed state
    - createToggleHandler()
    - expandSections() / collapseSections()

14. **AuthzFlowResponseTypeEnforcer**
    - OAuth: response_type = 'code'
    - OIDC: response_type = 'code' (same, but different ID token handling)

---

## Migration Steps

### Phase 1: Create Service (Week 1, Day 1)

#### Step 1.1: Create Service File
- [ ] Create `src/services/authorizationCodeSharedService.ts`
- [ ] Copy structure from `implicitFlowSharedService.ts`
- [ ] Adapt for authorization code flow specifics

#### Step 1.2: Implement Core Modules
- [ ] SessionStorageManager
- [ ] AuthzFlowToastManager
- [ ] AuthzFlowValidationManager
- [ ] AuthzFlowDefaults

**Estimated Time:** 2-3 hours

### Phase 2: Add Flow-Specific Modules (Week 1, Day 1-2)

#### Step 2.1: PKCE Management
- [ ] AuthzFlowPKCEManager class
- [ ] generatePKCE() method
- [ ] validatePKCE() method
- [ ] Toast notifications for PKCE

#### Step 2.2: Authorization & Code Processing
- [ ] AuthzFlowAuthorizationManager
- [ ] AuthzFlowCodeProcessor
- [ ] Session storage flag management

#### Step 2.3: Token Exchange
- [ ] AuthzFlowTokenExchangeManager
- [ ] POST to /as/token endpoint
- [ ] Handle response
- [ ] API call display integration

**Estimated Time:** 3-4 hours

### Phase 3: Add Utility Modules (Week 1, Day 2)

#### Step 3.1: Navigation & State
- [ ] AuthzFlowNavigationManager
- [ ] AuthzFlowStepRestoration
- [ ] AuthzFlowCollapsibleSectionsManager

#### Step 3.2: Integration Helpers
- [ ] AuthzFlowCredentialsHandlers (all 8 handlers)
- [ ] AuthzFlowTokenManagement
- [ ] AuthzFlowResponseTypeEnforcer

**Estimated Time:** 2-3 hours

### Phase 4: Create Config Files (Week 1, Day 2)

- [ ] Create `src/pages/flows/config/OAuthAuthzCodeFlow.config.ts`
- [ ] Create `src/pages/flows/config/OIDCAuthzCodeFlow.config.ts`
- [ ] Define step configs with 1-based numbering
- [ ] Define IntroSectionKey types
- [ ] Define default app configs

**Estimated Time:** 1 hour

### Phase 5: Integrate into OAuth Flow (Week 1, Day 3)

#### Step 5.1: Update Imports
- [ ] Add `import AuthorizationCodeSharedService from '../../services/authorizationCodeSharedService'`
- [ ] Import config from config file
- [ ] Remove duplicate utility functions

#### Step 5.2: Replace State Management
- [ ] Replace useState declarations with service defaults
- [ ] Replace useEffect hooks with service methods
- [ ] Replace toggle handler with service method

#### Step 5.3: Replace Handlers
- [ ] savePingOneConfig → service
- [ ] handleGeneratePKCE → service
- [ ] handleGenerateAuthUrl → service
- [ ] handleTokenExchange → service
- [ ] navigateToTokenManagement → service
- [ ] All credential handlers → service

#### Step 5.4: Replace Validation
- [ ] validatedHandleNext → service
- [ ] Step validation checks → service
- [ ] Required field checking → service

**Estimated Time:** 4-5 hours

### Phase 6: Integrate into OIDC Flow (Week 1, Day 3-4)

- [ ] Same steps as Phase 5, but use variant='oidc'
- [ ] Update OIDC-specific content
- [ ] Ensure ID token handling preserved
- [ ] Test OIDC-specific features

**Estimated Time:** 4-5 hours

### Phase 7: Testing & Validation (Week 1, Day 4-5)

#### Step 7.1: Unit Tests
- [ ] Test service methods independently
- [ ] Test validation logic
- [ ] Test PKCE generation
- [ ] Test token exchange

#### Step 7.2: Integration Tests
- [ ] OAuth flow end-to-end
- [ ] OIDC flow end-to-end
- [ ] Flow switching
- [ ] Callback handling

#### Step 7.3: User Acceptance
- [ ] Manual testing all steps
- [ ] Verify toasts appear correctly
- [ ] Verify validation prevents bad navigation
- [ ] Verify synchronization between flows

**Estimated Time:** 3-4 hours

### Phase 8: Documentation & Cleanup (Week 1, Day 5)

- [ ] Create AUTHZ_CODE_SERVICE_ARCHITECTURE.md
- [ ] Create OAUTH_VS_OIDC_AUTHZ_DIFFERENCES.md
- [ ] Update migration status to 'complete'
- [ ] Create troubleshooting guide
- [ ] Remove unused code
- [ ] Clean up imports

**Estimated Time:** 2 hours

**Total Estimated Time:** ~25-30 hours (1 week)

---

## Service Structure Template

```typescript
// src/services/authorizationCodeSharedService.ts

import { useCallback, useState } from 'react';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { validateForStep } from './credentialsValidationService';
import type { PingOneApplicationState } from '../components/PingOneApplicationConfig';
import type { StepCredentials } from '../components/steps/CommonSteps';

export type AuthzFlowVariant = 'oauth' | 'oidc';

// 1. Session Storage Manager
export class AuthzSessionStorageManager {
    static setActiveFlow(variant: AuthzFlowVariant): void {
        if (variant === 'oauth') {
            sessionStorage.removeItem('oidc-authz-v5-flow-active');
            sessionStorage.setItem('oauth-authz-v5-flow-active', 'true');
        } else {
            sessionStorage.removeItem('oauth-authz-v5-flow-active');
            sessionStorage.setItem('oidc-authz-v5-flow-active', 'true');
        }
    }
    // ... more methods
}

// 2. Toast Manager
export class AuthzFlowToastManager {
    static showPKCEGenerated(): void {
        v4ToastManager.showSuccess('PKCE parameters generated successfully!');
    }
    
    static showAuthCodeReceived(): void {
        v4ToastManager.showSuccess('Authorization code received!');
    }
    
    static showTokenExchangeSuccess(): void {
        v4ToastManager.showSuccess('Tokens exchanged successfully!');
    }
    // ... more toast methods
}

// 3. PKCE Manager (Authorization Code Specific!)
export class AuthzFlowPKCEManager {
    static async generatePKCE(controller: any): Promise<boolean> {
        try {
            await controller.generatePkceCodes();
            AuthzFlowToastManager.showPKCEGenerated();
            return true;
        } catch (error) {
            v4ToastManager.showError('Failed to generate PKCE parameters');
            return false;
        }
    }
    
    static validatePKCE(controller: any): boolean {
        if (!controller.pkce?.codeVerifier || !controller.pkce?.codeChallenge) {
            v4ToastManager.showError('PKCE parameters required. Generate them first.');
            return false;
        }
        return true;
    }
}

// 4. Authorization Manager
export class AuthzFlowAuthorizationManager {
    static async generateAuthUrl(
        variant: AuthzFlowVariant,
        credentials: StepCredentials,
        controller: any
    ): Promise<boolean> {
        // Validate credentials
        if (!credentials.clientId || !credentials.environmentId) {
            v4ToastManager.showError('Missing required credentials');
            return false;
        }
        
        // Validate PKCE
        if (!AuthzFlowPKCEManager.validatePKCE(controller)) {
            return false;
        }
        
        try {
            // Set session flag
            AuthzSessionStorageManager.setActiveFlow(variant);
            
            // Generate URL
            await controller.generateAuthorizationUrl();
            
            v4ToastManager.showSuccess('Authorization URL generated successfully!');
            return true;
        } catch (error) {
            v4ToastManager.showError('Failed to generate authorization URL');
            return false;
        }
    }
}

// 5. Code Processor
export class AuthzFlowCodeProcessor {
    static processAuthorizationCode(
        code: string,
        state: string,
        setAuthCode: (code: string) => void,
        setCurrentStep: (step: number) => void
    ): void {
        setAuthCode(code);
        setCurrentStep(4); // Advance to token exchange step
        AuthzFlowToastManager.showAuthCodeReceived();
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
    }
}

// 6. Token Exchange Manager
export class AuthzFlowTokenExchangeManager {
    static async exchangeCodeForTokens(
        variant: AuthzFlowVariant,
        credentials: StepCredentials,
        authCode: string,
        pkce: { codeVerifier: string },
        setTokens: (tokens: any) => void,
        setTokenExchangeApiCall: (call: any) => void
    ): Promise<boolean> {
        // Build token request
        const tokenRequest = {
            code: authCode,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret || undefined,
            redirectUri: credentials.redirectUri,
            codeVerifier: pkce.codeVerifier,
        };
        
        try {
            // Call token endpoint
            const response = await fetch(
                `https://auth.pingone.com/${credentials.environmentId}/as/token`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams(tokenRequest as any),
                }
            );
            
            const tokens = await response.json();
            setTokens(tokens);
            
            // Create API call data for display
            const apiCall = EnhancedApiCallDisplayService.createApiCallData(
                'POST',
                `https://auth.pingone.com/${credentials.environmentId}/as/token`,
                tokenRequest,
                {},
                tokens,
                response.status,
                variant === 'oauth' ? 'OAuth 2.0' : 'OIDC'
            );
            setTokenExchangeApiCall(apiCall);
            
            AuthzFlowToastManager.showTokenExchangeSuccess();
            return true;
        } catch (error) {
            v4ToastManager.showError('Token exchange failed');
            return false;
        }
    }
}

// ... 8 more managers following the pattern

// Main Export
export const AuthorizationCodeSharedService = {
    SessionStorage: AuthzSessionStorageManager,
    Toast: AuthzFlowToastManager,
    Validation: AuthzFlowValidationManager,
    Navigation: AuthzFlowNavigationManager,
    Defaults: AuthzFlowDefaults,
    TokenManagement: AuthzFlowTokenManagement,
    CredentialsHandlers: AuthzFlowCredentialsHandlers,
    PKCE: AuthzFlowPKCEManager,
    Authorization: AuthzFlowAuthorizationManager,
    CodeProcessor: AuthzFlowCodeProcessor,
    TokenExchange: AuthzFlowTokenExchangeManager,
    StepRestoration: AuthzFlowStepRestoration,
    CollapsibleSections: AuthzFlowCollapsibleSectionsManager,
    ResponseTypeEnforcer: AuthzFlowResponseTypeEnforcer,
};

export default AuthorizationCodeSharedService;
```

---

## Key Differences from Implicit Flow

### 1. **PKCE Management** (New for Auth Code)
Implicit flows don't use PKCE, but Authorization Code does:

```typescript
// Auth Code specific:
const handleGeneratePKCE = useCallback(async () => {
    await AuthorizationCodeSharedService.PKCE.generatePKCE(controller);
}, [controller]);
```

### 2. **Authorization Code Processing** (Different from Token Fragment)
Implicit gets tokens in URL fragment, Auth Code gets authorization code:

```typescript
// Implicit: processTokenFragment() - tokens in hash
// Auth Code: processAuthorizationCode() - code in query params
```

### 3. **Token Exchange Step** (New for Auth Code)
Implicit doesn't exchange, Auth Code does:

```typescript
const handleTokenExchange = useCallback(async () => {
    await AuthorizationCodeSharedService.TokenExchange.exchangeCodeForTokens(
        variant,
        credentials,
        authCode,
        controller.pkce,
        setTokens,
        setTokenExchangeApiCall
    );
}, [variant, credentials, authCode, controller.pkce]);
```

### 4. **More Steps** (7-8 steps vs 6 steps)
- Step 0: Introduction
- Step 1: PKCE Generation ← New step
- Step 2: Authorization Request
- Step 3: Authorization Response ← New step (code received)
- Step 4: Token Exchange ← New step
- Step 5: Token Introspection
- Step 6: Security Features
- Step 7: Completion

### 5. **Client Secret** (Required for confidential clients)
Implicit = public client (no secret), Auth Code = can be confidential:

```typescript
// Auth Code might need client secret validation
if (credentials.clientAuthMethod === 'client_secret_post' && !credentials.clientSecret) {
    // Error
}
```

---

## Config Files Structure

### OAuth Authorization Code Config
**File:** `src/pages/flows/config/OAuthAuthzCodeFlow.config.ts`

```typescript
export const FLOW_TYPE = 'authorization-code';

export const STEP_CONFIGS = [
    { title: 'Step 1: Introduction & Setup', subtitle: 'Understand OAuth Authorization Code' },
    { title: 'Step 2: PKCE Generation', subtitle: 'Generate secure verifier and challenge' },
    { title: 'Step 3: Authorization Request', subtitle: 'Build authorization URL' },
    { title: 'Step 4: Authorization Response', subtitle: 'Receive authorization code' },
    { title: 'Step 5: Token Exchange', subtitle: 'Exchange code for tokens' },
    { title: 'Step 6: Token Introspection', subtitle: 'Validate tokens' },
    { title: 'Step 7: Security Features', subtitle: 'Advanced security' },
    { title: 'Step 8: Flow Summary', subtitle: 'Complete overview' },
];

export type IntroSectionKey =
    | 'overview'
    | 'flowDiagram'
    | 'credentials'
    | 'pkceOverview'
    | 'pkceDetails'
    | 'authRequestOverview'
    | 'authRequestDetails'
    | 'authResponseOverview'
    | 'authResponseDetails'
    | 'tokenExchangeOverview'
    | 'tokenExchangeDetails'
    | 'introspectionOverview'
    | 'introspectionDetails'
    | 'securityOverview'
    | 'securityDetails'
    | 'completionOverview'
    | 'completionDetails'
    | 'flowSummary';

export const DEFAULT_APP_CONFIG: PingOneApplicationState = {
    clientAuthMethod: 'client_secret_post',
    pkceEnforcement: 'REQUIRED',
    responseTypeCode: true,
    responseTypeToken: false,
    responseTypeIdToken: false, // OAuth doesn't return ID token
    grantTypeAuthorizationCode: true,
    // ... rest of config
};
```

### OIDC Authorization Code Config
Similar, but:
```typescript
responseTypeIdToken: true, // OIDC returns ID token
scope: 'openid profile email', // Default scope
```

---

## Validation Requirements

### Step 0 → Step 1 (Introduction → PKCE)
**Required Fields:**
- Environment ID ✅
- Client ID ✅
- Redirect URI ✅
- Client Secret (if confidential client) ⚠️

### Step 1 → Step 2 (PKCE → Authorization Request)
**Required:**
- PKCE code verifier ✅
- PKCE code challenge ✅

### Step 2 → Step 3 (Authorization Request → Response)
**Required:**
- Authorization URL generated ✅

### Step 3 → Step 4 (Response → Token Exchange)
**Required:**
- Authorization code received ✅

### Step 4 → Step 5 (Token Exchange → Introspection)
**Required:**
- Tokens received ✅

---

## Integration Pattern

### Before (Duplicate Code):
```typescript
// OAuth file (200 lines):
const handleGeneratePKCE = async () => {
    if (!credentials.clientId) { /* error */ }
    await controller.generatePkceCodes();
    v4ToastManager.showSuccess('PKCE generated!');
};

// OIDC file (200 lines) - SAME CODE:
const handleGeneratePKCE = async () => {
    if (!credentials.clientId) { /* error */ }
    await controller.generatePkceCodes();
    v4ToastManager.showSuccess('PKCE generated!');
};
```

### After (Service-Based):
```typescript
// OAuth file (1 line):
const handleGeneratePKCE = () => AuthorizationCodeSharedService.PKCE.generatePKCE(controller);

// OIDC file (1 line):
const handleGeneratePKCE = () => AuthorizationCodeSharedService.PKCE.generatePKCE(controller);

// Service (10 lines) - SHARED:
static async generatePKCE(controller: any): Promise<boolean> {
    if (!controller.credentials?.clientId) {
        v4ToastManager.showError('Configure credentials first');
        return false;
    }
    await controller.generatePkceCodes();
    v4ToastManager.showSuccess('PKCE generated!');
    return true;
}
```

---

## Migration Checklist

### Service Creation
- [ ] AuthorizationCodeSharedService created
- [ ] All 14 modules implemented
- [ ] Exported in main object
- [ ] No linting errors

### Config Files
- [ ] OAuthAuthzCodeFlow.config.ts created
- [ ] OIDCAuthzCodeFlow.config.ts created
- [ ] Step configs with 1-based numbering
- [ ] Type definitions complete

### OAuth Flow Integration
- [ ] Import service
- [ ] Replace state with service defaults
- [ ] Replace effects with service methods
- [ ] Replace handlers with service calls
- [ ] Replace validation with service
- [ ] Test all functionality

### OIDC Flow Integration
- [ ] Import service
- [ ] Replace state with service defaults
- [ ] Replace effects with service methods
- [ ] Replace handlers with service calls
- [ ] Replace validation with service
- [ ] Test all functionality

### Testing
- [ ] Can't navigate without credentials
- [ ] Can't generate URL without PKCE
- [ ] Authorization code processing works
- [ ] Token exchange succeeds
- [ ] Both flows show same toasts
- [ ] Session flags prevent cross-flow issues

### Documentation
- [ ] Service architecture documented
- [ ] OAuth vs OIDC differences documented
- [ ] Migration guide created
- [ ] Troubleshooting guide created

### Deployment
- [ ] Update migration status to 'complete'
- [ ] Both flows show green checkmarks
- [ ] Production deployment
- [ ] User announcement

---

## Expected Code Reduction

### OAuth Authorization Code V5
**Current:** 2,843 lines  
**After:** ~2,200 lines (service-based)  
**Reduction:** ~643 lines (~23%)

### OIDC Authorization Code V5
**Current:** 2,683 lines  
**After:** ~2,100 lines (service-based)  
**Reduction:** ~583 lines (~22%)

### Shared Service
**New File:** ~900 lines (shared between both)

**Net Result:**
- **Eliminated:** ~1,226 lines of duplicate code
- **Added:** ~900 lines of shared service
- **Net Savings:** ~326 lines
- **Maintainability:** Massively improved (update 1 place instead of 2)

---

## Risk Assessment

### Low Risk ✅
- Pattern proven with implicit flows
- Service architecture tested and working
- No new concepts, just apply existing pattern

### Medium Risk ⚠️
- Authorization Code flows are more complex (token exchange)
- More steps to coordinate
- More validation rules

### Mitigation Strategies
- Start with service creation (no flow changes)
- Test each service module independently
- Integrate OAuth first, then OIDC
- Keep backup of original files
- Incremental testing at each phase

---

## Success Criteria

### Must Have ✅
- [ ] Both flows use AuthorizationCodeSharedService
- [ ] All duplicate logic extracted to service
- [ ] Validation prevents blank field navigation
- [ ] Toast notifications consistent
- [ ] Session storage flags work correctly
- [ ] Both flows marked complete (green checkmarks)

### Nice to Have 🌟
- [ ] Additional code reduction beyond estimate
- [ ] Reusable for other authorization code flows
- [ ] Performance improvements
- [ ] Better error messages

---

## Timeline

### Week 1
- **Day 1:** Phase 1-2 (Create service, core modules)
- **Day 2:** Phase 3-4 (Utility modules, config files)
- **Day 3:** Phase 5 (OAuth integration)
- **Day 4:** Phase 6 (OIDC integration)
- **Day 5:** Phase 7-8 (Testing, documentation)

**Total:** 5 days (assuming ~5-6 hours per day)

---

## Comparison to Implicit Flow Migration

### Implicit Flow Migration
- **Time:** 1 day (completed today)
- **Services:** 14 modules
- **Code Reduction:** ~450 lines
- **Complexity:** Low (simpler flow)

### Authorization Code Migration (Estimated)
- **Time:** 5 days
- **Services:** 14 modules (same structure, different logic)
- **Code Reduction:** ~1,226 lines
- **Complexity:** Medium (token exchange, more steps)

---

## Recommendation

### Option 1: Full Migration (Recommended)
- **Pros:** Complete service architecture, maximum code reduction, perfect sync
- **Cons:** Takes 5 days
- **When:** When you have dedicated time for quality work

### Option 2: Incremental Migration
- **Pros:** Lower risk, can pause between phases
- **Cons:** Temporary inconsistency, takes longer overall
- **When:** Need to balance with other priorities

### Option 3: Pilot First (My Recommendation)
- **Pros:** Test pattern on OAuth first, learn lessons, apply to OIDC
- **Cons:** OIDC stays unsynced temporarily
- **When:** Want to validate approach before full commitment

**My Recommendation:** **Option 3 - Pilot OAuth first**

1. Week 1: Create service + migrate OAuth Authorization Code V5
2. Week 2: Apply learnings to OIDC Authorization Code V5
3. Total: 2 weeks with breathing room

---

## Next Steps

### Ready to Start?

1. **Say "create the service"** - I'll create `AuthorizationCodeSharedService`
2. **Say "migrate OAuth authz"** - I'll integrate service into OAuth flow
3. **Say "migrate OIDC authz"** - I'll integrate service into OIDC flow
4. **Say "do it all"** - I'll do complete end-to-end migration

**Want me to proceed?** 🚀

---

**Estimated Value:**
- **Code Reduction:** ~1,226 lines
- **Maintenance Savings:** Update 1 service instead of 2 flows
- **Quality Improvement:** Guaranteed synchronization
- **Future Reusability:** Pattern for all remaining V5 flows

**Ready when you are!**

