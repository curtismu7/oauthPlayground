# Unified & MFA Services Audit

_Last updated: 2026-01-25_

## 1. Scope & Entry Points
- **Unified flow roots**: `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` (page controller), `src/v8u/components/UnifiedFlowSteps.tsx` (step engine). Mounted through `/v8u/unified/...` routes in `src/App.tsx`.
- **MFA flow roots (V8)**: `MFAAuthenticationMainPageV8`, `MFAHubV8`, `MFAConfigurationPageV8`, `MFADeviceManagementFlowV8`, `MFADeviceOrderingFlowV8`, `MFAReportingFlowV8`, plus modality flows (SMS/Email/FIDO2/etc.) registered under `/v8/mfa*` routes. All are in `src/v8/flows/**` and orchestrate real PingOne MFA APIs.

Unified & MFA logic only depend on services reachable from those entrypoints; everything else is out of scope unless referenced transitively.

## 2. Service Inventory
| Service Module | Key Exports | Responsibility | Side Effects | Unified Usage | MFA Usage |
| --- | --- | --- | --- | --- | --- |
| `@/v8/services/configCheckerServiceV8` | `ConfigCheckerServiceV8` | Fetch PingOne app config, compare PKCE / scopes | Network + analytics logging | ✅ `UnifiedOAuthFlowV8U` | ❌ |
| `@/v8/services/credentialsServiceV8` | `loadCredentials`, `saveCredentials` | Flow credential persistence | localStorage/IndexedDB | ✅ | ✅ |
| `@/v8/services/sharedCredentialsServiceV8` | `extractSharedCredentials`, `saveSharedCredentials` | Shared env/client secrets | Storage | ✅ | ❌ |
| `@/v8/services/environmentIdServiceV8` | getters/setters | Environment ID storage | Storage | ✅ | ✅ (ordering/reporting) |
| `@/v8/services/specVersionServiceV8`, `specUrlServiceV8`, `flowOptionsServiceV8`, `unifiedFlowOptionsServiceV8` | enums/helpers | Flow/spec metadata | Pure | ✅ | ❌ |
| `@/services/unifiedWorkerTokenServiceV2`, `@/v8/services/workerTokenServiceV8`, `workerTokenStatusServiceV8` | worker token APIs | PingOne worker token lifecycle | Storage + network + global events | ✅ | ✅ |
| `@/services/apiCallTrackerService` | `trackApiCall`, `updateApiCallResponse` | Telemetry for API calls | Storage/logging | ✅ (Config checker, Unified steps) | ✅ (MFA reporting/order flows) |
| `@/services/pkceService`, `@/v8u/services/pkceStorageServiceV8U` | PKCE helpers | Generate/store verifier/challenge | session/local storage | ✅ | ❌ |
| Flow integration services (`clientCredentialsIntegrationServiceV8`, `deviceCodeIntegrationServiceV8`, `implicitFlowIntegrationServiceV8`, `hybridFlowIntegrationServiceV8`, `tokenOperationsServiceV8`, `tokenDisplayServiceV8`, `oauthIntegrationServiceV8`) | various functions | Build auth URLs, call token endpoints, display tokens | Network | ✅ | ❌ |
| `@/v8/services/appDiscoveryServiceV8`, `OidcDiscoveryServiceV8`, `RedirectUriServiceV8`, `ResponseTypeServiceV8`, `TokenEndpointAuthMethodServiceV8`, `TooltipContentServiceV8`, `UnifiedFlowOptionsServiceV8` | helpers | Credentials form data sources | Some network (discovery) | ✅ | ❌ |
| `@/v8/services/mfaConfigurationServiceV8`, `mfaServiceV8`, `mfaAuthenticationServiceV8`, `mfaReportingServiceV8`, `webAuthnAuthenticationServiceV8` | multiple classes | PingOne MFA config/auth/reporting | Network | ❌ | ✅ |
| `@/services/pingOneLogoutService` | `pingOneLogoutService` | PingOne logout endpoint | Network | ❌ | ✅ |
| `../services/flowSettingsServiceV8U`, `../services/unifiedFlowIntegrationV8U`, `../services/credentialReloadServiceV8U`, `../services/enhancedStateManagement`, `../services/tokenMonitoringService` | local services | Unified-only settings, dashboards | Storage/network depending | ✅ | ❌ |
| `@/services/postmanCollectionGeneratorV8` | Postman helpers | Generate Postman collections | File download | ✅ | ✅ |

>  _Dynamic imports (e.g., inside `UnifiedFlowSteps` around worker token helpers) are treated as USED until audited; flag them for manual verification before removal._

## 3. Reachability Classification
- **USED**: all services directly imported in Unified/MFA entrypoints (table above).
- **TRANSITIVE**: services reached through dynamic imports or callbacks (e.g., `apiCallTrackerService` inside config checker, worker token modal helpers). Marked for manual verification whenever deleting.
- **UNUSED**: any service not referenced (or only referenced by V7/V8 legacy flows) can be removed once confirmed via `rg`.

## 4. Duplication Map
| Canonical Candidate | Overlap | Notes |
| --- | --- | --- |
| `workerTokenServiceV8` | vs `unifiedWorkerTokenServiceV2` | Two implementations of the same PingOne worker-token workflow. Plan: migrate Unified to the v8 version and remove V2 after parity tests (REQUIRES APPROVAL).
| `CredentialsServiceV8` + `SharedCredentialsServiceV8` + `credentialReloadServiceV8U` | Storage responsibilities duplicated | Combine into a single `CredentialsRepository` that handles flow + shared data. Need data migration plan.
| Flow integration services | multiple files (client credentials/device/implicit/hybrid) with repeated HTTP logic | Introduce `AuthorizationService` + `TokenService` as shared HTTP core; keep thin flow-specific wrappers for any polymorphic needs.
| PKCE helpers | `pkceService`, `pkceStorageServiceV8U`, ad-hoc generation in components | Extract `PkceManager` that encapsulates both generation and storage cleanup.
| MFA flows worker token usage | repeated imports of worker token status/service in each flow | Could wrap PingOne calls in a unified `MFAApiClient` that injects the worker token automatically.

## 5. Suggested Target Architecture
```
[HttpClient]
   ├─ [CredentialsRepository] (flow + shared storage)
   ├─ [WorkerTokenService]
   ├─ [SpecMetadataService]
   ├─ [DiscoveryService]
   ├─ [AuthorizationService] (state/nonce/PKCE + auth URLs)
   ├─ [TokenService] (exchange/refresh/revoke/introspection)
   ├─ [MFAServiceSuite] (configuration/auth/reporting)
   └─ [Storage adapters] (localStorage/sessionStorage)
```
- Unified Flow depends on CredentialsRepository, SpecMetadataService, AuthorizationService, TokenService, WorkerTokenService, DiscoveryService.
- MFA flows depend on CredentialsRepository, WorkerTokenService, MFAServiceSuite, TokenService (for verify/lookup).

## 6. Refactor Plan (High-Level)
1. **Shared HttpClient & Storage Abstractions**
   - Create `services/httpClient.ts` + `services/storageRepository.ts`.
   - Migrate ConfigChecker + MFA services to use them; add unit tests for timeout/error mapping.
2. **Unify Worker Token Services** _(REQUIRES APPROVAL before touching prod APIs)_
   - Define `WorkerTokenService` interface implemented by current v8 service.
   - Update Unified + MFA entrypoints to import via new index; remove V2 once verified.
3. **Consolidate Credential Storage**
   - Extend `CredentialsServiceV8` to handle shared creds + reload behavior; drop `SharedCredentialsServiceV8` & `credentialReloadServiceV8U` post-migration.
4. **PKCE Manager Extraction**
   - Replace direct `pkceService`/session calls with `PkceManager`; ensures consistent cleanup when restarting flows.
5. **Flow Integration Merge**
   - Introduce `AuthorizationFlowService` built on Authorization/Token services; migrate `UnifiedFlowSteps` to new API before deleting duplicate integration files.
6. **MFA API Wrapper**
   - Create `MFAApiClient` that centralizes worker token injection + telemetry; update MFA flows accordingly.

Each step should ship as an isolated PR with manual regression on Unified + MFA flows.

## 7. Test & Verification Plan
- **Automated**
  - HttpClient tests (timeouts, error mapping).
  - CredentialsRepository tests for backward-compatible storage keys.
  - WorkerTokenService adapter tests (mock PingOne responses).
  - PKCE manager tests for storage + restart cleanup.
  - MFAApiClient tests covering configuration/auth/report endpoints.
- **Manual**
  - Unified Flow smoke on `/v8u/unified/oauth-authz/0`: verify credentials persistence, worker token status, Postman export, flow steps.
  - MFA Hub `/v8/mfa-hub`: run at least one registration (e.g., SMS) to confirm PingOne API calls succeed.
  - Worker token modal opening + refresh.
  - Lint, typecheck, and targeted e2e tests if available.
- **Definition of Done**
  - No UI changes.
  - Unified + MFA flows behave identically (verified manually).
  - All replaced services deleted or aliased with deprecated warnings removed.
  - New tests passing in CI.

## 8. Optional UI Ideas (Not Implemented)
1. Unified credentials card badge showing worker-token validity (purely informational).
2. MFA hub progress chips indicating enrollment stage.

---
**PingOne Safety Reminder**: PingOne + PingOne MFA API paths already function in production; do **not** change network behavior without explicit approval and regression tests.
