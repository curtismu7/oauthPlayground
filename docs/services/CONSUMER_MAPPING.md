# Service Consumer Mapping

**Purpose:** Detailed consumer mapping for high-priority service consolidation candidates.

**Last Updated:** 2025-02-19  
**Status:** Phase 1 In Progress

---

## 🎯 High-Priority Candidates Consumer Analysis

### 1. Token Services Consolidation

#### unifiedWorkerTokenService (Canonical Candidate)
**Location:** `src/services/unifiedWorkerTokenService.ts` (Legacy - but most comprehensive)

**Consumers:** 25+ files across multiple apps
- **OAuth App:** 4 files
  - `src/apps/oauth/services/enhancedStateManagement.ts`
  - `src/apps/oauth/services/tokenMonitoringService.ts`
  - `src/apps/oauth/flows/UnifiedOAuthFlowV8U.tsx`
- **MFA App:** 1 file
  - `src/apps/mfa/services/workerTokenServiceV8.ts` (wrapper)
- **Shared Services:** 1 file
  - `src/shared/services/workerTokenServiceV8.ts` (wrapper)
- **Legacy V8:** 15+ files
- **Components:** 5+ files
- **Pages:** 5+ files

**Risk Level:** HIGH (affects all apps)
**Migration Complexity:** HIGH (many consumers)
**Recommended Strategy:** Strategy A (Canonical + Adapter)

#### tokenMonitoringService (OAuth App)
**Location:** `src/apps/oauth/services/tokenMonitoringService.ts`

**Consumers:** 7 files
- **OAuth App:** 2 files
  - `src/apps/oauth/services/enhancedStateManagement.ts`
  - `src/apps/oauth/pages/TokenMonitoringPage.tsx`
- **Legacy V8U:** 5 files
  - `src/v8u/services/enhancedStateManagement.ts`
  - `src/v8u/pages/TokenMonitoringPage.tsx`
  - `src/v8u/pages/TokenApiDocumentationPage.tsx`
  - `src/v8u/pages/EnhancedStateManagementPage.tsx`
  - `src/v8u/components/TokenMonitoringDashboard.tsx`
- **Legacy V8:** 1 file
  - `src/v8/flows/OAuthAuthorizationCodeFlowV8.tsx`

**Risk Level:** MEDIUM (OAuth app + legacy consumers)
**Migration Complexity:** MEDIUM
**Recommended Strategy:** Strategy A (Canonical + Adapter)

#### unifiedTokenStorageService (Legacy)
**Location:** `src/services/unifiedTokenStorageService.ts`

**Consumers:** 1 file
- **OAuth App:** 1 file
  - `src/apps/oauth/services/tokenMonitoringService.ts`

**Risk Level:** LOW (single consumer)
**Migration Complexity:** LOW
**Recommended Strategy:** Strategy B (Promote winner)

---

### 2. MFA Services Consolidation

#### mfaServiceV8 (MFA App - With Deprecation Notice)
**Location:** `src/apps/mfa/services/mfaServiceV8.ts`

**Consumers:** 12 files (all in MFA app)
- **Components:** 3 files
  - `src/apps/mfa/components/MFADeviceManagerV8.tsx`
  - `src/apps/mfa/components/MFADeviceRegistrationV8.tsx`
  - `src/apps/mfa/components/MFASettingsModalV8.tsx`
- **Flows:** 7 files
  - `src/apps/mfa/flows/MFAAuthenticationMainPageV8.tsx`
  - `src/apps/mfa/flows/MFAConfigurationPageV8.tsx`
  - `src/apps/mfa/flows/types/EmailFlowV8.tsx`
  - `src/apps/mfa/flows/types/FIDO2ConfigurationPageV8.tsx`
  - `src/apps/mfa/flows/types/MobileOTPConfigurationPageV8.tsx`
  - `src/apps/mfa/flows/types/SMSFlowV8.tsx`
  - `src/apps/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx`
- **Pages:** 2 files
  - `src/apps/mfa/pages/MFADeviceCreateDemoV8.tsx`
  - `src/apps/mfa/pages/MFAOneTimeDevicesV8.tsx`

**Risk Level:** MEDIUM (MFA app only, but many consumers)
**Migration Complexity:** MEDIUM
**Recommended Strategy:** Strategy A (Canonical + Adapter)
**Notes:** ⚠️ Has deprecation notice - authentication methods moving to mfaAuthenticationServiceV8

#### mfaAuthenticationServiceV8 (MFA App - Successor)
**Location:** `src/apps/mfa/services/mfaAuthenticationServiceV8.ts`

**Consumers:** 2 files (both in MFA app)
- `src/apps/mfa/flows/MFAAuthenticationMainPageV8.tsx`
- `src/apps/mfa/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx`

**Risk Level:** LOW (few consumers, app-specific)
**Migration Complexity:** LOW
**Recommended Strategy:** Strategy B (Promote winner)

---

### 3. Worker Token Services Consolidation

#### Current State Analysis
**Canonical Service:** `src/services/unifiedWorkerTokenService.ts` (most comprehensive)

**Wrapper Services:**
- `src/apps/mfa/services/workerTokenServiceV8.ts` (MFA app wrapper)
- `src/shared/services/workerTokenServiceV8.ts` (Shared wrapper)

**Direct Consumers:** 25+ files (see unifiedWorkerTokenService analysis above)

**Risk Level:** HIGH (affects all apps)
**Migration Complexity:** HIGH (but clear winner exists)
**Recommended Strategy:** Strategy B (Promote winner - unifiedWorkerTokenService)

---

## 📊 Consumer Impact Summary

### By App:

#### OAuth App
- **Token Services:** 4 direct consumers
- **Worker Token Services:** 4 direct consumers
- **Total Impact:** HIGH (critical functionality)

#### MFA App
- **Token Services:** 1 direct consumer (wrapper)
- **MFA Services:** 14 direct consumers
- **Worker Token Services:** 1 direct consumer (wrapper)
- **Total Impact:** HIGH (device registration depends on MFA services)

#### Protect App
- **Token Services:** 0 direct consumers
- **MFA Services:** 0 direct consumers (has own mfaAuthenticationService)
- **Worker Token Services:** 0 direct consumers
- **Total Impact:** LOW (independent services)

#### Unified App
- **Token Services:** 0 direct consumers
- **MFA Services:** 0 direct consumers
- **Worker Token Services:** 0 direct consumers
- **Total Impact:** LOW (minimal service usage)

#### Flows App
- **Token Services:** 0 direct consumers
- **MFA Services:** 0 direct consumers
- **Worker Token Services:** 0 direct consumers
- **Total Impact:** LOW (flow management only)

---

## 🎯 Consolidation Strategy Recommendations

### Phase 1.1: Worker Token Services (Week 1)
**Why:** Clear winner exists, wrapper pattern already in place
- **Action:** Promote `unifiedWorkerTokenService` as canonical
- **Migration:** Update wrappers to delegate to canonical
- **Risk:** HIGH but manageable with existing wrapper pattern

### Phase 1.2: MFA Services (Week 1)
**Why:** Clear deprecation path, app-specific scope
- **Action:** Promote `mfaAuthenticationServiceV8` as canonical
- **Migration:** Update consumers to use new service
- **Risk:** MEDIUM (app-specific, controlled scope)

### Phase 1.3: Token Services (Week 2)
**Why:** Most complex, requires careful coordination
- **Action:** Create canonical token service
- **Migration:** Use adapter pattern for gradual transition
- **Risk:** HIGH (affects OAuth app significantly)

---

## 🚨 Stop-Ship Rules

### Before Any Consolidation:
1. **Consumer Mapping Complete:** ✅ Done
2. **Risk Assessment Complete:** ✅ Done
3. **Rollback Plan Ready:** ⏳ Pending
4. **Contract Tests Ready:** ⏳ Pending
5. **Cross-App Testing Plan:** ⏳ Pending

### Migration Requirements:
1. **One service at a time:** No parallel consolidations
2. **Gradual migration:** 1-2 consumers per PR
3. **Full testing:** Build + lint + functional tests
4. **Rollback ready:** <5 minute rollback capability

---

## 📋 Next Steps

1. **Phase 2:** Choose consolidation strategy for worker token services
2. **Phase 3:** Create contract tests for canonical services
3. **Phase 4:** Begin gradual consumer migration
4. **Phase 5:** Remove deprecated services

---

*Phase 1 Complete: Consumer mapping finished, strategies identified, ready for Phase 2*
