# Unified MFA — Services → Apps Mapping

This file lists core services used by the Unified MFA feature and the apps/components that consume them. Use this for quick reference and to keep terminology consistent.

| Service | Apps / Components that use it |
|---|---|
| `UnifiedMFARegistrationFlow` (entrypoint) | `UnifiedConfigurationStep`, `UnifiedDeviceSelectionStep`, `UnifiedRegistrationStep`, `UnifiedSuccessStep`, `SearchableDropdown`, MFACredentialContext, GlobalMFAContext |
| `mfaService` | `UnifiedMFARegistrationFlow`, `UnifiedConfigurationStep`, server proxy endpoints (`/api/pingone/mfa/*`), other MFA flows |
| `tokenGateway` | `WorkerTokenModal`, `workerTokenUIService`, `workerTokenModalHelper`, any code requesting worker tokens (silent or interactive) |
| `unifiedWorkerTokenService` / `unifiedWorkerTokenServiceV2` | `WorkerTokenModal`, `workerTokenRepository`, `workerTokenBackupService`, `workerTokenCacheService`, `workerTokenUIService` |
| `WorkerTokenStatusService` | `WorkerTokenModal`, `workerTokenUIService`, `workerTokenCacheService`, token health checks across MFA flows |
| `workerTokenCacheService` | `WorkerTokenModal` (preflight validation), `tokenGateway` helpers |
| `workerTokenRepository` | Persistence helpers used by `unifiedWorkerTokenService` and backup tools |
| `MFAConfigurationService` | `workerTokenModalHelper`, `WorkerTokenModal`, UI checkboxes (silent retrieval / show token at end) |
| `pingOneFetch` | `mfaService`, many v8 services making backend calls — integrates with connectivity monitoring and retry logic |
| `backendConnectivityService` | `pingOneFetch`, `mfaService` (direct fetch calls), `BackendDownModal`, `App.tsx` (global modal) |
| `BackendDownModal` | Rendered globally in `App.tsx`, triggered by `backendConnectivityService` |
| `MFAFlowController` | Shared flow orchestration used by multiple flows including unified flow controllers |
| `MFACredentialContext` | `UnifiedMFARegistrationFlow` and its subcomponents (credential state during flow) |
| `GlobalMFAContext` | `UnifiedMFARegistrationFlow` and cross-component state sharing |
| `preFlightValidationService` | `WorkerTokenModal` (validates credentials before token generation) |
| `unifiedMFASuccessPageService` | `UnifiedSuccessStep`, other legacy success pages that map to unified success component |
| `SearchableDropdown` | `UnifiedMFARegistrationFlow` (user lookup dropdown) |
| `toast` (notifications) | Many UI components including `WorkerTokenModal`, `UnifiedMFARegistrationFlow`, services that surface messages to users |
| Server proxy endpoints (local dev `server.js`) | UI pages call `/api/pingone/mfa/list-users`, `/api/credentials/save`, `/api/pingone/mfa/device-authentication-policies` — used by `mfaService` and other client services |

---

Notes:
- Many services are singletons referenced across multiple UI components. When updating behavior, check both the service file and the primary consumers listed above.
- For token flows, `tokenGateway` is the canonical entrypoint — prefer it over ad-hoc token requests.

Files created:
- `docs/UNIFIED_MFA_SERVICES_TO_APPS.md` (this file)
- `docs/UNIFIED_MFA_SERVICES_TO_APPS.csv` (Excel-friendly CSV)
