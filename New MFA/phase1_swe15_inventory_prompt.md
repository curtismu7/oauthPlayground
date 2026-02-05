# phase1_swe15_inventory_prompt.md
## Phase 1 Prompt — SWE‑1.5 (FREE) (Inventory + Prove Working)

You are SWE‑1.5. Use the instructions in **swe_phase1_inventory.md** as the source of truth for Phase 1 outputs (A–H).

CRITICAL: FILE ALLOWLIST — only open these files. Do not search the repo. If something is missing, propose exactly ONE additional file to open and why.

Repo root:
/Users/cmuir/P1Import-apps/oauth-playground

Allowed files (MFA Hub V8):
- src/locked/mfa-hub-v8/feature/MFAHubV8.tsx
- dependencies/components/ColorCodedURL.tsx
- dependencies/components/EnhancedStepFlowV2.tsx
- dependencies/components/steps/CommonSteps.tsx
- dependencies/components/worker/WorkerTokenDisplay.tsx
- dependencies/services/apiCallTrackerService.ts
- dependencies/services/flowContextService.ts
- dependencies/services/flowContextUtils.ts
- dependencies/services/flowCredentialIsolationService.ts
- dependencies/services/flowCredentialService.ts
- dependencies/services/flowStorageService.ts
- dependencies/services/oidcDiscoveryService.ts
- dependencies/services/pingOneLogoutService.ts
- dependencies/services/pingoneConfigService.ts
- dependencies/services/postmanCollectionGeneratorV8.ts
- dependencies/services/redirectStateManager.ts
- dependencies/services/sessionTerminationService.ts
- dependencies/utils/callbackUrls.ts
- dependencies/utils/clientAuthentication.ts
- dependencies/utils/clipboard.ts
- dependencies/utils/credentialManager.ts
- dependencies/utils/logger.ts
- dependencies/utils/oauth.ts
- dependencies/utils/protocolUtils.ts
- dependencies/utils/scrollManager.ts
- dependencies/utils/secureJson.ts
- dependencies/utils/storage.ts
- dependencies/utils/urlValidation.ts
- dependencies/utils/v4ToastMessages.ts
- dependencies/utils/workerToken.ts
- dependencies/v8/components/MFADocumentationModalV8.tsx
- dependencies/v8/components/MFADocumentationPageV8.tsx
- dependencies/v8/components/MFAHeaderV8.tsx
- dependencies/v8/components/MFANavigationV8.tsx
- dependencies/v8/components/SuperSimpleApiDisplayV8.tsx
- dependencies/v8/components/WorkerTokenGaugeV8.tsx
- dependencies/v8/components/WorkerTokenModalV8.tsx
- dependencies/v8/services/apiDisplayServiceV8.ts
- dependencies/v8/services/credentialsServiceV8.ts
- dependencies/v8/services/mfaConfigurationServiceV8.ts
- dependencies/v8/services/specVersionServiceV8.ts
- dependencies/v8/services/uiNotificationServiceV8.ts
- dependencies/v8/services/workerTokenServiceV8.ts
- dependencies/v8/services/workerTokenStatusServiceV8.ts
- dependencies/v8/hooks/useApiDisplayPadding.ts
- dependencies/v8/utils/mfaFlowCleanupV8.ts
- dependencies/v8/utils/toastNotificationsV8.ts
- dependencies/v8/utils/workerTokenModalHelperV8.ts
- dependencies/v8/flows/shared/MFATypes.ts

Task:
Execute Phase 1 from swe_phase1_inventory.md and produce outputs **A–H**.
Focus on:
- best single interception point to log ALL PingOne calls (Platform + MFA + OIDC/AuthZ + Token Service + proxy)
- server.log integration path + verification (`grep runId server.log`)
- route-change call sites (navigate/push/replace)
- smoke-test plan that proves mfa-hub works end-to-end before copying

Output rules:
- ≤120 lines
- bullets/tables only
- no full file dumps
- stop after A–H
