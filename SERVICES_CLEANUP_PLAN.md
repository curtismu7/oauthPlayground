# Services Cleanup Action Plan

**Date:** March 9, 2026  
**Based on:** SERVICES_AUDIT_REPORT.md  
**Scope:** Clean up ~165 service files, ~88,367 lines of code  
**Priority:** Security, stability, then maintainability

---

## Phase 1: Immediate Security & Stability Fixes (High Priority)

### 1.1 Memory Leak Fix - Critical
- **File:** `src/services/otpDeliveryTrackingService.ts:435`
- **Issue:** Uncleared `setInterval` causing memory leaks
- **Action:** Add guard + `stopCleanupScheduler()` method
- **Risk:** Low (isolated fix)

### 1.2 Security TODO - High Priority
- **File:** `src/services/credentialStorageManager.ts:57`
- **Issue:** `encryptSecrets: false` - secrets stored in plaintext
- **Action:** Implement client-side encryption for OAuth `client_secret`
- **Risk:** Medium (requires careful testing)

---

## Phase 2: Dead Code Removal (No Migration Risk)

### 2.1 Zero-Importer Services (Archive/Delete)
- `src/services/configCheckerService.tsx` (38 lines)
- `src/services/performanceService.ts` (301 lines) 
- `src/services/unifiedCredentialsService.ts` (114 lines)
- `src/services/v7EducationalContentDataService.ts` (560 lines)
- `src/services/configurationManagerCLI.js` (move to scripts/)
- `src/services/configurationManagerDemo.js` (delete)
- `src/services/serviceDiscoveryCLI.js` (move to scripts/)
- `src/services/apiCallDisplayService.example.ts` (98 lines)

### 2.2 Cleanup Files
- `src/services/flowHeaderService.tsx.bak2` (delete backup file)

---

## Phase 3: Service Consolidation (Low Risk)

### 3.1 Discovery Services Consolidation
- **Target:** Consolidate 5 overlapping discovery services
- **Canonical:** `oidcDiscoveryService.ts` (26 importers)
- **Actions:**
  - Make `discoveryService.ts` a thin re-export from `oidcDiscoveryService.ts`
  - Inline `workerTokenDiscoveryService.ts` into `workerTokenManager.ts` (1 importer)
  - Keep `comprehensiveDiscoveryService.ts` (multi-provider)
  - Keep `bulletproofDiscoveryService.ts` (retry wrapper)

### 3.2 Credential Export/Import Consolidation
- **Target:** Consolidate 4 parallel services
- **Canonical:** `credentialsImportExportService.ts` (V9, better typed)
- **Actions:**
  - Delete `standardizedCredentialExportService.ts` (pure wrapper)
  - Migrate callers from `credentialExportImportService.ts` to V9 version
  - Keep `exportImportService.ts` (different scope - app-wide config)

### 3.3 PKCE Services Consolidation
- **Target:** `pkceGenerationService.tsx` → `pkceService.tsx`
- **Action:** Inline generation functions (1 importer only)

---

## Phase 4: Environment Services Migration (Medium Risk)

### 4.1 Environment ID Services
- **Canonical:** `environmentIdService.ts` (V9, dual-storage)
- **Deprecated:** `globalEnvironmentService.ts` (localStorage only)
- **Action:** Migrate callers from `globalEnvironmentService.ts` to `environmentIdService.ts`

---

## Phase 5: Standardization Improvements

### 5.1 File Naming
- Rename PascalCase services to camelCase:
  - `FlowInfoService.ts` → `flowInfoService.ts`
  - `FlowWalkthroughService.ts` → `flowWalkthroughService.ts`
  - `CommonSpinnerService.ts` → `commonSpinnerService.ts`

### 5.2 Export Pattern Standardization
- **Standard:** `export const fooService = new FooService()` for stateful services
- **Action:** Document pattern, apply to new services (no breaking changes)

### 5.3 File Extensions
- Convert `.tsx` services with no JSX to `.ts`:
  - `pkceGenerationService.tsx` → `.ts`
  - `pkceService.tsx` → `.ts` (if no JSX returned)

---

## Phase 6: V8 Migration Planning (Long-term)

### 6.1 V8 Migration Services
- **Status:** Still active at startup for localStorage → unified storage migration
- **Action:** Add startup check - skip loading if no V8 localStorage exists
- **Future:** Plan deletion once V9 adoption confirmed complete

### 6.2 Worker Token Consolidation
- **Current:** 7 fragmented files for single flow
- **Target:** Reduce to 3 files (types, service, repository)
- **Action:** Inline small services, consolidate responsibilities

---

## Implementation Order

1. **Phase 1.1** - Memory leak fix (critical, isolated)
2. **Phase 2** - Dead code removal (no risk)
3. **Phase 3.1** - Discovery consolidation (low risk)
4. **Phase 3.2** - Credential export consolidation (low risk)
5. **Phase 3.3** - PKCE consolidation (low risk)
6. **Phase 4** - Environment migration (medium risk)
7. **Phase 5** - Standardization (low risk)
8. **Phase 1.2** - Security encryption (medium risk, requires testing)
9. **Phase 6** - V8 planning (long-term)

---

## Success Metrics

- **Files reduced:** ~8-12 files removed
- **Lines reduced:** ~2,000-3,000 lines eliminated
- **Memory leaks:** 0 uncleared intervals
- **Security:** Client-side encryption implemented
- **Build status:** Must pass clean (currently ✅)
- **Test coverage:** Maintain existing coverage

---

## Risk Assessment

- **Low risk:** Phases 2, 3, 5 (isolated changes)
- **Medium risk:** Phase 4 (caller migration), Phase 1.2 (encryption)
- **High risk:** None identified
- **Rollback plan:** Git commits per phase for easy rollback

---

## Next Steps

1. Create backup branch
2. Implement Phase 1.1 (memory leak fix)
3. Execute Phase 2 (dead code removal)
4. Proceed with consolidation phases
5. Test thoroughly after each phase
6. Update documentation

*Build verification required after each phase*
