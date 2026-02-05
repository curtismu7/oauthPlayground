# MFA Hub V8 Files List

## Core Feature File
- `src/locked/mfa-hub-v8/feature/MFAHubV8.tsx` - Main MFA Hub component

## Dependencies (39 files total)

### Components (4 files)
- `dependencies/components/ColorCodedURL.tsx`
- `dependencies/components/EnhancedStepFlowV2.tsx`
- `dependencies/components/steps/CommonSteps.tsx`
- `dependencies/components/worker/WorkerTokenDisplay.tsx`

### Services (12 files)
- `dependencies/services/apiCallTrackerService.ts`
- `dependencies/services/flowContextService.ts`
- `dependencies/services/flowContextUtils.ts`
- `dependencies/services/flowCredentialIsolationService.ts`
- `dependencies/services/flowCredentialService.ts`
- `dependencies/services/flowStorageService.ts`
- `dependencies/services/oidcDiscoveryService.ts`
- `dependencies/services/pingOneLogoutService.ts`
- `dependencies/services/pingoneConfigService.ts`
- `dependencies/services/postmanCollectionGeneratorV8.ts`
- `dependencies/services/redirectStateManager.ts`
- `dependencies/services/sessionTerminationService.ts`

### Utils (13 files)
- `dependencies/utils/callbackUrls.ts`
- `dependencies/utils/clientAuthentication.ts`
- `dependencies/utils/clipboard.ts`
- `dependencies/utils/credentialManager.ts`
- `dependencies/utils/logger.ts`
- `dependencies/utils/oauth.ts`
- `dependencies/utils/protocolUtils.ts`
- `dependencies/utils/scrollManager.ts`
- `dependencies/utils/secureJson.ts`
- `dependencies/utils/storage.ts`
- `dependencies/utils/urlValidation.ts`
- `dependencies/utils/v4ToastMessages.ts`
- `dependencies/utils/workerToken.ts`

### V8 Specific Dependencies (25 files)

#### Components (7 files)
- `dependencies/v8/components/MFADocumentationModalV8.tsx`
- `dependencies/v8/components/MFADocumentationPageV8.tsx`
- `dependencies/v8/components/MFAHeaderV8.tsx`
- `dependencies/v8/components/MFANavigationV8.tsx`
- `dependencies/v8/components/SuperSimpleApiDisplayV8.tsx`
- `dependencies/v8/components/WorkerTokenGaugeV8.tsx`
- `dependencies/v8/components/WorkerTokenModalV8.tsx`

#### Services (7 files)
- `dependencies/v8/services/apiDisplayServiceV8.ts`
- `dependencies/v8/services/credentialsServiceV8.ts`
- `dependencies/v8/services/mfaConfigurationServiceV8.ts`
- `dependencies/v8/services/specVersionServiceV8.ts`
- `dependencies/v8/services/uiNotificationServiceV8.ts`
- `dependencies/v8/services/workerTokenServiceV8.ts`
- `dependencies/v8/services/workerTokenStatusServiceV8.ts`

#### Hooks (1 file)
- `dependencies/v8/hooks/useApiDisplayPadding.ts`

#### Utils (3 files)
- `dependencies/v8/utils/mfaFlowCleanupV8.ts`
- `dependencies/v8/utils/toastNotificationsV8.ts`
- `dependencies/v8/utils/workerTokenModalHelperV8.ts`

#### Flows/Types (1 file)
- `dependencies/v8/flows/shared/MFATypes.ts`

## Key External Dependencies
The MFA Hub also imports from external packages:
- React (lazy, Suspense, useEffect, useState)
- React Icons (FiPackage, FiTrash2)
- React Router (useNavigate)
- Auth Context (useAuth)
- Custom Hooks (usePageScroll)

## Route Integration
- Integrated in `src/App.tsx` at route `/v8/mfa-hub`
- Redirects from `/v8/mfa` to `/v8/mfa-hub`

## Lockdown System
The MFA Hub uses a lockdown system that creates isolated copies of all dependencies in `src/locked/mfa-hub-v8/` to prevent breaking changes when shared services are updated. The lockdown script (`scripts/lockdown/lock-mfa-hub.mjs`) manages this isolation.

**Total: 65+ files** including the main component, all dependencies, and supporting infrastructure.
