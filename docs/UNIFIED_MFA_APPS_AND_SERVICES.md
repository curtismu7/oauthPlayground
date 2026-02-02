# Unified MFA — Apps & Services

This document lists the main Unified MFA app and the related apps, services, components, and utilities used across the repository. Use these canonical names/paths when referring to parts of the Unified MFA feature.

| Name | Type | File(s) | Short description |
|---|---|---|---|
| Unified MFA Registration Flow | Main App / Page (UI) | src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx | Main unified MFA registration page and entrypoint for the unified flow. Mounted at `/v8/mfa-unified`. |
| Unified Flow Components | UI Components | src/v8/flows/unified/components/* | Sub-components used by the unified flow (Activation, Configuration, DeviceSelection, Registration, Success, DeviceRegistrationForm, DeviceSelectionModal, etc.). |
| MFA Service (MFAServiceV8) | Service (API wrapper) | src/v8/services/mfaServiceV8.ts | Handles MFA-related API calls (register device, list users, device ops). Communicates with backend `/api/pingone/mfa/*` endpoints. |
| Unified MFA Success Page | Component / Service | src/v8/services/unifiedMFASuccessPageServiceV8.tsx | Success page renderer and helper used by multiple flows. |
| Device Flow Configs | Config | src/v8/config/deviceFlowConfigs.ts<br>src/v8/config/deviceFlowConfigTypes.ts | Device-specific config and types used to drive the single unified flow for SMS, EMAIL, TOTP, MOBILE, WHATSAPP, FIDO2. |
| MFA Flow Controller | Controller | src/v8/flows/controllers/MFAFlowController.ts | Shared flow controller/logic for MFA operations across the app. |
| MFACredentialContext | React Context | src/v8/contexts/MFACredentialContext.tsx | Provides credential state used during flow (temporary credentials, persistence). |
| GlobalMFAContext | React Context | src/v8/contexts/GlobalMFAContext.tsx | Global state shared across unified MFA components. |
| Worker Token UI & Modal | UI / Helper | src/v8/components/WorkerTokenModalV8.tsx<br>src/v8/utils/workerTokenModalHelperV8.ts | UI for managing/generating worker tokens and helper that orchestrates silent vs interactive retrieval. |
| Token Gateway (tokenGatewayV8) | Service (auth) | src/v8/services/auth/tokenGatewayV8.ts | Canonical token acquisition gateway. Supports silent vs interactive, `forceRefresh`, retries, timeouts. |
| Worker Token Services (status/cache) | Services | src/v8/services/workerTokenStatusServiceV8.ts<br>src/v8/services/workerTokenCacheServiceV8.ts<br>src/v8/services/workerTokenServiceV8.ts | Services that track token status, cache token data, and provide token utilities used by unified flows. |
| Unified Worker Token Service(s) | Service / Storage | src/services/unifiedWorkerTokenService.ts<br>src/services/unifiedWorkerTokenServiceV2.ts | Centralized worker-token credentials + persistence used across UI and v8 code. |
| Worker Token UI Service | Service (UI helper) | src/v8/services/workerTokenUIServiceV8.tsx | Provides UI state and handlers for the Get Worker Token button and related controls. |
| Worker Token Repository | Service | src/services/workerTokenRepository.ts | Persistence helper (save/load token data) used by unified worker token services. |
| PingOne Fetch (API helper) | Utility | src/utils/pingOneFetch.ts | Shared fetch wrapper with retries and integration with connectivity monitoring. Used by many v8 services to call backend/PingOne. |
| Backend Connectivity Monitoring | Service + Component | src/v8/services/backendConnectivityServiceV8.ts<br>src/v8/components/BackendDownModalV8.tsx | Detects backend connectivity issues, suppresses console spam, and displays a global modal instructing how to restart servers. |
| Searchable Dropdown (helper) | Component | src/v8/components/SearchableDropdownV8.tsx | Lightweight searchable dropdown used by the unified flow for the user lookup list. (recently added) |
| MFA Configuration Service | Service | src/v8/services/mfaConfigurationServiceV8.ts | Loads/saves MFA flow configuration (worker token settings, showTokenAtEnd, silentApiRetrieval). |
| Feature Flags (MFA) | Service | src/v8/services/mfaFeatureFlagsV8.ts | Feature flag gate for device types and unified flow features. |
| Global Environment & Credentials | Services | src/v8/services/globalEnvironmentService.ts<br>src/v8/services/credentialsServiceV8.ts | Environment ID, credential persistence and helpers used by unified flows. |
| Preflight Validation | Service | src/v8/services/preFlightValidationServiceV8.ts | Validates OAuth/configuration when generating worker tokens (used in WorkerTokenModal). |
| Toast Notifications | Utility | src/v8/utils/toastNotificationsV8.ts | Central toast helper used to show success/warning/error messages in the unified flow. |
| Server-side proxy endpoints | Backend (local dev server) | server.js (root) — relevant endpoints: `/api/pingone/mfa/list-users`, `/api/credentials/save`, `/api/pingone/mfa/device-authentication-policies` | Local server routes used by the UI to proxy requests to PingOne APIs and to provide list-users results. Note: some filtering logic is implemented server-side (e.g. user lookup). |


## Notes & pointers
- The canonical UI entrypoint is `UnifiedMFARegistrationFlowV8` (mounted at `/v8/mfa-unified`). Use that name when referring to the main app.
- Token acquisition is centralized through `tokenGatewayV8` and unified worker token services; the UI should always delegate to those services rather than fetching tokens directly.
- `mfaServiceV8` is the primary client-side service for PingOne MFA operations — include it when referring to backend interactions for MFA devices and user lookup.
- Backend-side helpers (server.js) implement server-proxied SCIM queries and include additional filtering — watch both client and server when debugging user search results.

If you'd like, I can:
- Add this file to README or link from the Unified MFA flow code comments
- Generate a reverse-dependency map showing which files import which of the above services
- Produce a shorter cheat-sheet (names only) for quick reference

Which next step would you like?