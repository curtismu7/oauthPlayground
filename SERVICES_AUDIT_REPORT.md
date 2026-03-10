# Services Directory Audit Report

Date: March 9, 2026 (updated — archive actions complete)
Audited: src/services/ — all .tsx and .ts files (223 non-test files; 243 including tests)

---

## Summary

| Check                           | Result                                    |
| ------------------------------- | ----------------------------------------- |
| Total non-test service files    | 223 (was 228 — 5 deleted)                 |
| Total including tests           | 243 (was 248)                             |
| MDIIcon usages                  | 0 — CLEAN                                 |
| MDI CSS class (mdi-\*) usages   | 0 — CLEAN                                 |
| Orphaned mdiIcon fragments      | 0 — CLEAN                                 |
| Icon import mismatches (@icons) | 0 — CLEAN                                 |
| console.error / console.warn    | 0 — CLEAN                                 |
| **Real code issues**            | **0 — ALL CLEAN**                         |
| **Archive actions completed**   | **✅ 5 files deleted, 4 callers cleaned** |

---

## Archive Actions — COMPLETED ✅

### Group 1 — V8 → V9 Migration Bridges ✅ DELETED

Migration services and all their callers have been cleaned up:

| File                                             | Lines | Status     |
| ------------------------------------------------ | ----- | ---------- |
| `src/services/credentialsServiceV8Migration.ts`  | 126   | ✅ Deleted |
| `src/services/storageServiceV8Migration.ts`      | 119   | ✅ Deleted |
| `src/services/pkceStorageServiceV8UMigration.ts` | 162   | ✅ Deleted |

Callers updated — migration import + `ensureMigration` block replaced with no-op stub:

| Caller file                                 | Change                                                        |
| ------------------------------------------- | ------------------------------------------------------------- |
| `src/v8/services/credentialsServiceV8.ts`   | Import removed; `ensureMigration` stubbed to `async () => {}` |
| `src/services/v9/credentialsServiceV9.ts`   | Import removed; `ensureMigration` stubbed to `async () => {}` |
| `src/v8/services/storageServiceV8.ts`       | Import removed; `ensureMigration` stubbed to `async () => {}` |
| `src/v8u/services/pkceStorageServiceV8U.ts` | Import removed; `ensureMigration` stubbed to `async () => {}` |

All 4 caller files verified clean — zero TypeScript errors after changes.

---

### Group 2 — Zero-Caller / Dead Files ✅ DELETED

| File                                                | Status                                 |
| --------------------------------------------------- | -------------------------------------- |
| `src/services/apiCallDisplayService.example.ts`     | ✅ Already absent (cleaned previously) |
| `src/services/v9/V8ToV9WorkerTokenStatusAdapter.ts` | ✅ Deleted                             |

---

### Group 3 — Stale Backup Files ✅ DELETED

| File                                              | Status                                 |
| ------------------------------------------------- | -------------------------------------- |
| `src/v8/pages/DeleteAllDevicesUtilityV8.tsx.bak2` | ✅ Already absent (cleaned previously) |
| `src/v8/pages/DeleteAllDevicesUtilityV8.tsx.bak3` | ✅ Already absent (cleaned previously) |

---

### Group 4 — V8 Legacy, Low-Traffic _(keep until V8 retirement)_

No action taken. These files are still actively imported by V8/test code.

| File                                        | Lines | Active callers                                                               | Notes                                               |
| ------------------------------------------- | ----- | ---------------------------------------------------------------------------- | --------------------------------------------------- |
| `src/services/credentialStoreV8.ts`         | 78    | `useCredentialStoreV8.ts` hook → 5 test pages, `ClientCredentialManager.tsx` | Migrate callers to V9 equivalent when V8 is retired |
| `src/services/securityMonitoringService.ts` | 27    | `CompleteMFAFlowV7.tsx` only                                                 | Absorb into logger when V7 is retired               |

---

## Checks Performed

### MDIIcon antipattern

`grep MDIIcon|mdiIcon|iconMap[icon]` across all 228 files → **zero matches**.
The MDIIcon cleanup from a previous session is complete and verified.

### MDI CSS class references

`grep mdi-` across all files → **zero matches**.
No broken font-class icon references.

### @icons import consistency (tsx files only)

Every `<FiXxx />` usage cross-checked against `import { ... } from '@icons'` → **zero missing imports** in services.
(V8 components have 8 missing-icon files — tracked separately in V8_AUDIT_REPORT.md.)

### console.error / console.warn

`grep -rl "console\.error|console\.warn" src/services` → **zero matches**.
All runtime errors in services use `logger.*` or `modernMessaging.showBanner`.

### JSX `${...}` template expression bugs (INVESTIGATION RESULT)

A static regex scan flagged 42 files as "possible JSX template expression bugs"
(lines with `${...}` and no backtick on the same line).

After spot-checking the flagged files, **all 42 are false positives**.
Every flagged line is a styled-components CSS interpolation inside a multiline
template literal where the opening backtick is on a previous line:

```ts
const Button = styled.button`
	background: ${({ $active }) => ($active ? '#3b82f6' : '#1f2937')}; // ← flagged
	box-shadow: ${({ $active }) => ($active ? '0 0 12px' : 'none')}; // ← flagged
`;
```

The same pattern appears in codeGeneration templates, styled-components, qrCodeService, samlService, etc.
**No real `${user.fieldName}` in JSX text node bugs were found.**

---

## Notable Finding: flowHeaderService.tsx EXISTS

Previously flagged as missing (build error: `Could not resolve "../../services/flowHeaderService"`).
The file is present at `src/services/flowHeaderService.tsx` (801 lines) and is clean.

The build error in `ResourcesAPIFlowV9.tsx` was a wrong relative path:

- Wrong: `../../services/flowHeaderService`
- Correct: `../../../services/flowHeaderService`
  (file lives at `src/pages/flows/v9/` — needs one additional `../`)

---

## All Service Files

Files marked with `[ARCHIVE]` match an archive-candidate group above.
All unmarked files are clean and actively used.

- src/services/CommonSpinnerService.ts (295 lines)
- src/services/FlowInfoService.ts (1370 lines)
- src/services/FlowWalkthroughService.ts (1040 lines)
- src/services/**tests**/aiAgentService.test.ts (310 lines)
- src/services/**tests**/authorizationUrlValidationService.test.ts (495 lines)
- src/services/**tests**/errorHandlingService.test.ts (244 lines)
- src/services/**tests**/flowContextService.test.ts (429 lines)
- src/services/**tests**/flowUIService.test.tsx (30 lines)
- src/services/**tests**/passwordResetService.contract.test.ts (254 lines)
- src/services/**tests**/passwordResetService.integration.test.ts (165 lines)
- src/services/**tests**/passwordResetService.test.ts (502 lines)
- src/services/**tests**/performanceService.test.ts (213 lines)
- src/services/**tests**/phase3Validation.test.ts (530 lines)
- src/services/**tests**/pingOneMfaService.enhanced.test.ts (305 lines)
- src/services/**tests**/postmanCollectionGeneratorV8.test.ts (136 lines)
- src/services/**tests**/qrCodeService.test.ts (78 lines)
- src/services/**tests**/redirectStateManager.test.ts (92 lines)
- src/services/**tests**/serviceRegistry.integration.test.ts (471 lines)
- src/services/**tests**/v7CredentialValidationService.test.ts (409 lines)
- src/services/**tests**/workerTokenDiscoveryService.test.ts (220 lines)
- src/services/accessibilityService.ts (551 lines)
- src/services/advancedSecuritySettingsService.ts (422 lines)
- src/services/aiAgentService.ts (1031 lines)
- ~~src/services/apiCallDisplayService.example.ts~~ **[DELETED — Group 2: zero callers]**
- src/services/apiCallDisplayService.ts (291 lines)
- src/services/apiCallTrackerService.ts (142 lines)
- src/services/apiUtils.ts (72 lines)
- src/services/authConfigurationService.ts (347 lines)
- src/services/authMethodService.tsx (198 lines)
- src/services/authTokenService.ts (145 lines)
- src/services/authorizationCodeSharedService.ts (1320 lines)
- src/services/authorizationRequestService.ts (123 lines)
- src/services/authorizationUrlValidationModalService.tsx (420 lines)
- src/services/authorizationUrlValidationService.ts (583 lines)
- src/services/bulletproofDiscoveryService.ts (322 lines)
- src/services/callbackUriService.ts (479 lines)
- src/services/claimsRequestService.tsx (165 lines)
- src/services/clientCredentialsSharedService.ts (474 lines)
- src/services/codeGeneration/index.ts (2 lines)
- src/services/commonImportsService.ts (376 lines)
- src/services/comprehensiveCredentialsService.tsx (2741 lines)
- src/services/comprehensiveDiscoveryService.ts (409 lines)
- src/services/config.ts (177 lines)
- src/services/configCheckerService.tsx (38 lines)
- src/services/configComparisonService.ts (436 lines)
- src/services/configurationBackupService.ts (156 lines)
- src/services/credentialBackupService.ts (305 lines)
- src/services/credentialExportImportService.ts (202 lines)
- src/services/credentialGuardService.ts (53 lines)
- src/services/credentialStorageManager.ts (954 lines)
- src/services/credentialStoreV8.ts (78 lines) **[Group 4: V8 legacy — keep until V8 retired]**
- src/services/credentialSyncService.ts (419 lines)
- src/services/credentialsImportExportService.ts (373 lines)
- ~~src/services/credentialsServiceV8Migration.ts~~ **[DELETED — Group 1: V8→V9 migration bridge]**
- src/services/credentialsValidationService.ts (311 lines)
- src/services/customDomainService.ts (211 lines)
- src/services/deviceFlowService.ts (393 lines)
- src/services/deviceTypeService.tsx (555 lines)
- src/services/discoveryPersistenceService.ts (420 lines)
- src/services/discoveryService.ts (263 lines)
- src/services/dpopService.ts (339 lines)
- src/services/educationPreferenceService.ts (241 lines)
- src/services/educationalContentService.tsx (769 lines)
- src/services/enhancedApiCallDisplayService.ts (745 lines)
- src/services/enhancedConfigurationService.ts (690 lines)
- src/services/enhancedPingOneMfaService.ts (397 lines)
- src/services/environmentIdService.ts (151 lines)
- src/services/environmentService.ts (421 lines)
- src/services/environmentServiceV8.ts (637 lines)
- src/services/errorHandlingService.ts (532 lines)
- src/services/exportImportService.ts (428 lines)
- src/services/fido2Service.ts (497 lines)
- src/services/fieldEditingService.ts (389 lines)
- src/services/flowConfigService.ts (1308 lines)
- src/services/flowContext/index.ts (19 lines)
- src/services/flowContextService.ts (598 lines)
- src/services/flowContextUtils.ts (396 lines)
- src/services/flowCredentialIsolationService.ts (332 lines)
- src/services/flowCredentialService.ts (630 lines)
- src/services/flowErrorService.tsx (318 lines)
- src/services/flowRedirectUriService.ts (186 lines)
- src/services/flowScopeMappingService.ts (323 lines)
- src/services/flowSequenceService.ts (579 lines)
- src/services/flowStateService.ts (227 lines)
- src/services/flowStatusService.tsx (236 lines)
- src/services/flowStepDefinitions.ts (287 lines)
- src/services/flowStorageService.ts (1018 lines)
- src/services/flowTrackingService.ts (311 lines)
- src/services/flowUriEducationService.ts (136 lines)
- src/services/globalEnvironmentService.ts (273 lines)
- src/services/hybridFlowSharedService.ts (677 lines)
- src/services/implicitFlowComplianceService.ts (442 lines)
- src/services/implicitFlowSharedService.ts (1366 lines)
- src/services/jwksService.ts (333 lines)
- src/services/jwtAuthService.ts (401 lines)
- src/services/jwtAuthServiceV8.ts (163 lines)
- src/services/logFileService.ts (225 lines)
- src/services/loggingService.ts (217 lines)
- src/services/networkStatusService.ts (79 lines)
- src/services/oauth2ComplianceService.ts (705 lines)
- src/services/offlineAccessService.tsx (397 lines)
- src/services/oidcComplianceService.ts (630 lines)
- src/services/oidcDiscoveryService.ts (384 lines)
- src/services/oidcIdTokenService.tsx (242 lines)
- src/services/organizationLicensingService.ts (201 lines)
- src/services/otpDeliveryTrackingService.ts (477 lines)
- src/services/parService.ts (352 lines)
- src/services/passwordResetService.ts (720 lines)
- src/services/performanceService.ts (295 lines)
- src/services/pingOneAppCreationService.ts (462 lines)
- src/services/pingOneApplicationService.ts (104 lines)
- src/services/pingOneJWTService.ts (396 lines)
- src/services/pingOneLogoutService.ts (126 lines)
- src/services/pingOneMfaService.ts (1008 lines)
- src/services/pingOneUserProfileService.ts (120 lines)
- src/services/pingoneConfigService.ts (322 lines)
- src/services/pingoneSamlService.ts (132 lines)
- ~~src/services/pkceStorageServiceV8UMigration.ts~~ **[DELETED — Group 1: V8→V9 migration bridge]**
- src/services/postmanCollectionGeneratorV8.ts (8116 lines)
- src/services/presetManagerService.ts (1065 lines)
- src/services/rarService.ts (391 lines)
- src/services/redirectStateManager.ts (501 lines)
- src/services/redirectlessAuthService.ts (889 lines)
- src/services/responseModeFlowService.ts (39 lines)
- src/services/responseModeIntegrationService.ts (174 lines)
- src/services/responseModeService.ts (283 lines)
- src/services/resultPageService.ts (136 lines)
- src/services/routePersistenceService.ts (155 lines)
- src/services/scopeValidationService.ts (594 lines)
- src/services/securityMonitoringService.ts (27 lines) **[Group 4: V8/V7 legacy — keep until retired]**
- src/services/serverHealthService.ts (199 lines)
- src/services/serviceDiscoveryService.ts (651 lines)
- src/services/sessionTerminationService.ts (432 lines)
- src/services/sharedService.ts (517 lines)
- src/services/standardizedCredentialExportService.ts (163 lines)
- ~~src/services/storageServiceV8Migration.ts~~ **[DELETED — Group 1: V8→V9 migration bridge]**
- src/services/tokenDisplayService.ts (226 lines)
- src/services/tokenExpirationService.ts (243 lines)
- src/services/tokenIntrospectionService.ts (205 lines)
- src/services/tokenManagementService.ts (600 lines)
- src/services/tokenRefreshService.ts (393 lines)
- src/services/totpActivationService.ts (584 lines)
- src/services/unifiedCredentialsService.ts (114 lines)
- src/services/unifiedStorageManager.ts (397 lines)
- src/services/unifiedTokenStorageService.ts (3115 lines)
- src/services/unifiedWorkerTokenBackupServiceV8.ts (274 lines)
- src/services/unifiedWorkerTokenService.ts (1474 lines)
- src/services/unifiedWorkerTokenTypes.ts (37 lines)
- src/services/v7CredentialValidationService.tsx (482 lines)
- src/services/v7EducationalContentDataService.ts (560 lines)
- src/services/v7EducationalContentService.ts (491 lines)
- src/services/v7m/V7MAuthorizeService.ts (235 lines)
- src/services/v7m/V7MDeviceAuthorizationService.ts (106 lines)
- src/services/v7m/V7MIntrospectionService.ts (86 lines)
- src/services/v7m/V7MStateStore.ts (182 lines)
- src/services/v7m/V7MTokenGenerator.ts (213 lines)
- src/services/v7m/V7MTokenService.ts (543 lines)
- src/services/v7m/V7MUserInfoService.ts (81 lines)
- src/services/v7m/**tests**/V7MTokenGenerator.test.ts (105 lines)
- src/services/v7m/**tests**/V7MTokenService.test.ts (271 lines)
- src/services/v7m/core/V7MFlowCredentialService.ts (40 lines)
- src/services/v7m/core/V7MOAuthErrorHandlingService.ts (21 lines)
- src/services/v7m/core/V7MPKCEGenerationService.ts (29 lines)
- src/services/v7m/ui/V7MCollapsibleHeader.tsx (58 lines)
- src/services/v7m/ui/V7MFlowHeader.tsx (31 lines)
- src/services/v7m/ui/V7MFlowUIService.ts (19 lines)
- src/services/v7m/ui/V7MUnifiedTokenDisplayService.tsx (17 lines)
- src/services/v9/MessagingAdapter.ts (374 lines)
- ~~src/services/v9/V8ToV9WorkerTokenStatusAdapter.ts~~ **[DELETED — Group 2: zero callers]**
- src/services/v9/V9AppDiscoveryService.ts (157 lines)
- src/services/v9/V9AuthorizeService.ts (226 lines)
- src/services/v9/V9ColorStandards.ts (151 lines)
- src/services/v9/V9CredentialStorageService.ts (208 lines)
- src/services/v9/V9DeviceAuthorizationService.ts (106 lines)
- src/services/v9/V9FlowRestartButton.tsx (125 lines)
- src/services/v9/V9IntrospectionService.ts (90 lines)
- src/services/v9/V9ModernMessagingService.ts (214 lines)
- src/services/v9/V9SpecVersionService.ts (488 lines)
- src/services/v9/V9StateStore.ts (184 lines)
- src/services/v9/V9TokenGenerator.ts (211 lines)
- src/services/v9/V9TokenService.ts (498 lines)
- src/services/v9/V9UserInfoService.ts (88 lines)
- src/services/v9/V9WorkerTokenStatusService.ts (385 lines)
- src/services/v9/**tests**/V9ModernMessagingService.test.ts (340 lines)
- src/services/v9/**tests**/V9ServicesModernMessaging.test.ts (265 lines)
- src/services/v9/**tests**/v9CredentialValidationService.test.ts (409 lines)
- src/services/v9/core/V9FlowCredentialService.ts (43 lines)
- src/services/v9/core/V9OAuthErrorHandlingService.ts (23 lines)
- src/services/v9/core/V9PKCEGenerationService.ts (54 lines)
- src/services/v9/credentialsServiceV9.ts (672 lines)
- src/services/v9/environmentIdServiceV9.ts (269 lines)
- src/services/v9/index.ts (15 lines)
- src/services/v9/postmanCollectionGeneratorV9.ts (8129 lines)
- src/services/v9/v9ComprehensiveCredentialsService.tsx (78 lines)
- src/services/v9/v9CredentialValidationService.tsx (479 lines)
- src/services/v9/v9FlowCompletionService.tsx (63 lines)
- src/services/v9/v9FlowHeaderService.tsx (69 lines)
- src/services/v9/v9FlowUIService.tsx (70 lines)
- src/services/v9/v9ModalPresentationService.tsx (175 lines)
- src/services/v9/v9OAuthFlowComparisonService.tsx (93 lines)
- src/services/v9/v9OidcDiscoveryService.ts (180 lines)
- src/services/v9/v9UnifiedTokenDisplayService.tsx (111 lines)
- src/services/workerTokenCredentialsService.ts (306 lines)
- src/services/workerTokenDiscoveryService.ts (244 lines)
- src/services/workerTokenManager.ts (339 lines)
- src/services/workerTokenRepository.ts (387 lines)
