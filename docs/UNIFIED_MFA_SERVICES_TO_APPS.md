# Unified MFA — Services → Apps Mapping

This file lists core services used by the Unified MFA feature and the apps/components that consume them. Use this for quick reference and to keep terminology consistent.

| Service | Apps / Components that use it |
|---|---|
| `UnifiedMFARegistrationFlowV8` (entrypoint) | `UnifiedConfigurationStep`, `UnifiedDeviceSelectionStep`, `UnifiedRegistrationStep`, `UnifiedSuccessStep`, `SearchableDropdownV8`, MFACredentialContext, GlobalMFAContext |
| `mfaServiceV8` | `UnifiedMFARegistrationFlowV8`, `UnifiedConfigurationStep`, server proxy endpoints (`/api/pingone/mfa/*`), other MFA flows |
| `tokenGatewayV8` | `WorkerTokenModalV8`, `workerTokenUIServiceV8`, `workerTokenModalHelperV8`, any code requesting worker tokens (silent or interactive) |
| `unifiedWorkerTokenService` / `unifiedWorkerTokenServiceV2` | `WorkerTokenModalV8`, `workerTokenRepository`, `workerTokenBackupService`, `workerTokenCacheServiceV8`, `workerTokenUIServiceV8` |
| `WorkerTokenStatusServiceV8` | `WorkerTokenModalV8`, `workerTokenUIServiceV8`, `workerTokenCacheServiceV8`, token health checks across MFA flows |
| `workerTokenCacheServiceV8` | `WorkerTokenModalV8` (preflight validation), `tokenGatewayV8` helpers |
| `workerTokenRepository` | Persistence helpers used by `unifiedWorkerTokenService` and backup tools |
| `MFAConfigurationServiceV8` | `workerTokenModalHelperV8`, `WorkerTokenModalV8`, UI checkboxes (silent retrieval / show token at end) |
| `pingOneFetch` | `mfaServiceV8`, many v8 services making backend calls — integrates with connectivity monitoring and retry logic |
| `backendConnectivityServiceV8` | `pingOneFetch`, `mfaServiceV8` (direct fetch calls), `BackendDownModalV8`, `App.tsx` (global modal) |
| `BackendDownModalV8` | Rendered globally in `App.tsx`, triggered by `backendConnectivityServiceV8` |
| `MFAFlowController` | Shared flow orchestration used by multiple flows including unified flow controllers |
| `MFACredentialContext` | `UnifiedMFARegistrationFlowV8` and its subcomponents (credential state during flow) |
| `GlobalMFAContext` | `UnifiedMFARegistrationFlowV8` and cross-component state sharing |
| `preFlightValidationServiceV8` | `WorkerTokenModalV8` (validates credentials before token generation) |
| `unifiedMFASuccessPageServiceV8` | `UnifiedSuccessStep`, other legacy success pages that map to unified success component |
| `SearchableDropdownV8` | `UnifiedMFARegistrationFlowV8` (user lookup dropdown) |
| `toastV8` (notifications) | Many UI components including `WorkerTokenModalV8`, `UnifiedMFARegistrationFlowV8`, services that surface messages to users |
| Server proxy endpoints (local dev `server.js`) | UI pages call `/api/pingone/mfa/list-users`, `/api/credentials/save`, `/api/pingone/mfa/device-authentication-policies` — used by `mfaServiceV8` and other client services |

---

Notes:
- Many services are singletons referenced across multiple UI components. When updating behavior, check both the service file and the primary consumers listed above.
- For token flows, `tokenGatewayV8` is the canonical entrypoint — prefer it over ad-hoc token requests.

Files created:
- `docs/UNIFIED_MFA_SERVICES_TO_APPS.md` (this file)
- `docs/UNIFIED_MFA_SERVICES_TO_APPS.csv` (Excel-friendly CSV)
