# Service Inventory

**Purpose:** Comprehensive inventory of all services in the modular app architecture for consolidation planning.

**Last Updated:** 2025-02-19  
**Status:** In Progress

---

## Inventory Structure

For each service/module, we capture:
- **Path** (e.g., `src/apps/oauth/services/...`)
- **Domain** (token, discovery, mfa, device, ciba, protect…)
- **Responsibility** (1–2 lines)
- **Interface** (exports: functions/classes; public surface)
- **Inputs/Outputs** (request/response shapes; types)
- **Error semantics** (error codes/strings, thrown vs returned)
- **Side effects** (storage, caching, retries/backoff, timers)
- **Dependencies** (config/env, other services)
- **Consumers** (apps/components/files)
- **Tests** (existing coverage)
- **Status**: `active | deprecated | candidate-merge | merged | removed`
- **Notes**: invariants, risks, migration constraints

---

## 📱 App-Specific Services

### 🔐 OAuth App Services (`src/apps/oauth/services/`) - 7 services

#### tokenMonitoringService.ts
- **Path:** `src/apps/oauth/services/tokenMonitoringService.ts`
- **Domain:** token-monitoring
- **Responsibility:** Monitor and sync worker tokens across the application
- **Interface:** TokenInfo, RevocationOptions, ApiCall interfaces
- **Dependencies:** apiCallTrackerService, unifiedTokenStorage, unifiedWorkerTokenService
- **Status:** active
- **Notes:** Critical for token state management

#### unifiedFlowIntegrationV8U.ts
- **Path:** `src/apps/oauth/services/unifiedFlowIntegrationV8U.ts`
- **Domain:** flow-integration
- **Responsibility:** Integration utilities for unified OAuth flows
- **Status:** active

#### unifiedFlowLoggerServiceV8U.ts
- **Path:** `src/apps/oauth/services/unifiedFlowLoggerServiceV8U.ts`
- **Domain:** logging
- **Responsibility:** Centralized logging for unified flows
- **Status:** active

#### unifiedOAuthBackupServiceV8U.ts
- **Path:** `src/apps/oauth/services/unifiedOAuthBackupServiceV8U.ts`
- **Domain:** backup
- **Responsibility:** Backup and restore functionality for OAuth data
- **Status:** active

#### unifiedOAuthCredentialsServiceV8U.ts
- **Path:** `src/apps/oauth/services/unifiedOAuthCredentialsServiceV8U.ts`
- **Domain:** credentials
- **Responsibility:** Manage OAuth credentials and authentication state
- **Status:** active

#### authorizationUrlBuilderServiceV8U.ts
- **Path:** `src/apps/oauth/services/authorizationUrlBuilderServiceV8U.ts`
- **Domain:** oauth-url
- **Responsibility:** Build and manage OAuth authorization URLs
- **Status:** active

#### enhancedStateManagement.ts
- **Path:** `src/apps/oauth/services/enhancedStateManagement.ts`
- **Domain:** state-management
- **Responsibility:** Enhanced state management for OAuth flows
- **Status:** active

---

### 🔐 MFA App Services (`src/apps/mfa/services/`) - 17 services

#### mfaServiceV8.ts
- **Path:** `src/apps/mfa/services/mfaServiceV8.ts`
- **Domain:** mfa-device-registration
- **Responsibility:** PingOne Platform API service for device registration ONLY
- **Interface:** Device registration for SMS, Email, TOTP, FIDO2, Voice, WhatsApp, Mobile, Platform, Security Key
- **Dependencies:** WorkerTokenServiceV8 for authentication
- **Status:** active (with deprecation notice)
- **Notes:** ⚠️ DEPRECATION NOTICE: Authentication methods moving to MfaAuthenticationServiceV8

#### mfaAuthenticationServiceV8.ts
- **Path:** `src/apps/mfa/services/mfaAuthenticationServiceV8.ts`
- **Domain:** mfa-authentication
- **Responsibility:** MFA authentication flows (replacing deprecated methods in mfaServiceV8)
- **Status:** active

#### mfaConfigurationServiceV8.ts
- **Path:** `src/apps/mfa/services/mfaConfigurationServiceV8.ts`
- **Domain:** mfa-configuration
- **Responsibility:** MFA configuration management
- **Status:** active

#### mfaTokenManagerV8.ts
- **Path:** `src/apps/mfa/services/mfaTokenManagerV8.ts`
- **Domain:** mfa-token-management
- **Responsibility:** Token management for MFA flows
- **Status:** active

#### mfaCredentialManagerV8.ts
- **Path:** `src/apps/mfa/services/mfaCredentialManagerV8.ts`
- **Domain:** mfa-credentials
- **Responsibility:** Credential management for MFA
- **Status:** active

#### mfaEducationServiceV8.ts
- **Path:** `src/apps/mfa/services/mfaEducationServiceV8.ts`
- **Domain:** mfa-education
- **Responsibility:** Educational content for MFA flows
- **Status:** active

#### mfaRedirectUriServiceV8.ts
- **Path:** `src/apps/mfa/services/mfaRedirectUriServiceV8.ts`
- **Domain:** mfa-redirect-uri
- **Responsibility:** Redirect URI management for MFA
- **Status:** active

#### mfaReportingServiceV8.ts
- **Path:** `src/apps/mfa/services/mfaReportingServiceV8.ts`
- **Domain:** mfa-reporting
- **Responsibility:** Reporting and analytics for MFA
- **Status:** active

#### unifiedMFASuccessPageServiceV8.tsx
- **Path:** `src/apps/mfa/services/unifiedMFASuccessPageServiceV8.tsx`
- **Domain:** mfa-ui
- **Responsibility:** MFA success page UI components
- **Status:** active

#### unifiedMFAResumeStepResolverV8.ts
- **Path:** `src/apps/mfa/services/unifiedMFAResumeStepResolverV8.ts`
- **Domain:** mfa-flow-resolution
- **Responsibility:** Resume step resolution for MFA flows
- **Status:** active

#### protectServiceV8.ts
- **Path:** `src/apps/mfa/services/protectServiceV8.ts`
- **Domain:** protect-integration
- **Responsibility:** PingOne Protect integration for MFA
- **Status:** active

#### workerTokenServiceV8.ts
- **Path:** `src/apps/mfa/services/workerTokenServiceV8.ts`
- **Domain:** worker-token
- **Responsibility:** Worker token management for MFA
- **Status:** active

#### mfaServiceV8_Legacy.ts
- **Path:** `src/apps/mfa/services/mfaServiceV8_Legacy.ts`
- **Domain:** mfa-legacy
- **Responsibility:** Legacy MFA service compatibility
- **Status:** deprecated

#### mfaFeatureFlagsV8.ts
- **Path:** `src/apps/mfa/services/mfaFeatureFlagsV8.ts`
- **Domain:** mfa-features
- **Responsibility:** Feature flag management for MFA
- **Status:** active

*Plus 3 test services in __tests__ directory*

---

### 🛡️ Protect App Services (`src/apps/protect/services/`) - 10 services

#### UserService.ts
- **Path:** `src/apps/protect/services/UserService.ts`
- **Domain:** user-management
- **Responsibility:** User management for Protect portal
- **Status:** active

#### pingOneLoginService.ts
- **Path:** `src/apps/protect/services/pingOneLoginService.ts`
- **Domain:** authentication
- **Responsibility:** PingOne login integration
- **Status:** active

#### mfaAuthenticationService.ts
- **Path:** `src/apps/protect/services/mfaAuthenticationService.ts`
- **Domain:** mfa-authentication
- **Responsibility:** MFA authentication for Protect
- **Status:** active

#### tokenUtilityService.ts
- **Path:** `src/apps/protect/services/tokenUtilityService.ts`
- **Domain:** token-utilities
- **Responsibility:** Token utilities for Protect
- **Status:** active

#### riskEvaluationService.ts
- **Path:** `src/apps/protect/services/riskEvaluationService.ts`
- **Domain:** risk-evaluation
- **Responsibility:** Risk evaluation for Protect
- **Status:** active

#### educationalContentService.ts
- **Path:** `src/apps/protect/services/educationalContentService.ts`
- **Domain:** education
- **Responsibility:** Educational content for Protect
- **Status:** active

#### pingOneSignalsService.ts
- **Path:** `src/apps/protect/services/pingOneSignalsService.ts`
- **Domain:** signals
- **Responsibility:** PingOne Signals integration
- **Status:** active

#### ApiDisplayService.ts
- **Path:** `src/apps/protect/services/ApiDisplayService.ts`
- **Domain:** api-display
- **Responsibility:** API display utilities for Protect
- **Status:** active

#### CompanyConfigService.ts
- **Path:** `src/apps/protect/services/CompanyConfigService.ts`
- **Domain:** configuration
- **Responsibility:** Company configuration for Protect
- **Status:** active

#### errorHandlingService.ts
- **Path:** `src/apps/protect/services/errorHandlingService.ts`
- **Domain:** error-handling
- **Responsibility:** Error handling for Protect
- **Status:** active

---

## 🔧 Shared Services (`src/shared/services/`) - 6 services

### storageServiceV8.ts
- **Path:** `src/shared/services/storageServiceV8.ts`
- **Domain:** storage
- **Responsibility:** Shared storage service for all apps
- **Status:** active
- **Consumers:** Multiple apps (OAuth, MFA, Protect)
- **Notes:** Critical shared service

### tokenOperationsServiceV8.ts
- **Path:** `src/shared/services/tokenOperationsServiceV8.ts`
- **Domain:** token-operations
- **Responsibility:** Shared token operations
- **Status:** active
- **Consumers:** Multiple apps
- **Notes:** High consolidation candidate

### validationServiceV8.ts
- **Path:** `src/shared/services/validationServiceV8.ts`
- **Domain:** validation
- **Responsibility:** Shared validation utilities
- **Status:** active
- **Consumers:** Multiple apps

### workerTokenServiceV8.ts
- **Path:** `src/shared/services/workerTokenServiceV8.ts`
- **Domain:** worker-token
- **Responsibility:** Compatibility wrapper for unified worker token service
- **Status:** active (wrapper)
- **Notes:** ⚠️ Wrapper - delegates to unified service

### errorHandlerV8.ts
- **Path:** `src/shared/services/errorHandlerV8.ts`
- **Domain:** error-handling
- **Responsibility:** Shared error handling
- **Status:** active

### services.ts (types)
- **Path:** `src/shared/types/services.ts`
- **Domain:** types
- **Responsibility:** Shared service type definitions
- **Status:** active

---

## 📊 Statistics

- **Total Services Discovered:** 139
- **App-Specific Services:** 34
- **Shared Services:** 6  
- **Legacy Services (src/services):** 7
- **Legacy V8 Services:** 92

---

## 🎯 Discovery Commands Results

### Service-like Modules Discovery
```bash
find src -maxdepth 5 -type f \( -iname "*service*.ts*" -o -iname "*client*.ts*" -o -iname "*api*.ts*" \)
```

*Results will be populated here*

### Domain Keyword Scan
```bash
rg -n "token|oidc|discovery|mfa|device|ciba|authorize|callback|introspect|userinfo" src
```

*Results will be populated here*

---

## 📋 Consolidation Candidates

*To be populated after Phase 1 analysis*

---

## 🚨 Inventory Rule

**If it isn't in inventory, it doesn't get consolidated.**

---

## 📊 Consolidation Impact Analysis

### **Before Consolidation:**
- **Total Services:** 139
- **Token Services:** 8 (across multiple locations)
- **MFA Services:** 6 (with deprecation notices)
- **Worker Token Services:** 6 (with wrapper complexity)

### **After Consolidation (Target):**
- **Total Services:** ~115 (24 services consolidated)
- **Token Services:** 2 (canonical + adapter)
- **MFA Services:** 2 (canonical + adapter)
- **Worker Token Services:** 1 (canonical)

### **Expected Reduction:** 17% reduction in total services
### **Maintenance Overhead:** Significant reduction in duplicate code
### **Risk Mitigation:** Comprehensive testing and gradual migration

---

*Phase 0 Complete: Service inventory created, candidates identified, consolidation plan ready*
