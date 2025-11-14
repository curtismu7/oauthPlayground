🧠 AI Prompt — Implement PingOne Worker Token using existing V3 patterns (code-aware)
Goal: Implement (or finish hardening) the PingOne Worker Token flow so it is visually and behaviorally identical to our V3 flows—without duplicating logic. Reuse existing components, hooks, and utils from this repo (see file paths below). Ship with full logging, validation, and tests.

Note: Worker Token flow is designed for machine-to-machine authentication using client credentials. It's used for server-to-server API calls, background jobs, and service authentication without user interaction.


0) Guardrails & Parity

Visual/UX parity with V3 flows:

Reuse styled-components theme + shared components (stepper, buttons, toasts, status bar).
Match copy tone, tooltips, and step order.
Add client credentials configuration UI and token introspection.


Reuse > duplicate:

Prefer extracting shared bits into src/utils/* over cloning.


Unified logging:

Use src/utils/logger.ts with module tags + emojis.


Config resolution order:

.env → settings.json → localStorage via src/services/config + src/utils/credentialManager.


Hardening: strict validation, graceful errors, secure credential storage, token caching with expiry.


1) Files to (Re)use & Where to Plug In

Context / Session

src/contexts/NewAuthContext.tsx (token presence, session, helpers)


Flow Pages & Components

Start/Flow page: src/pages/flows/WorkerTokenFlow.tsx (create new)
Configuration page: src/components/worker/WorkerCredentials.tsx (create new)
Token display: src/components/worker/WorkerTokenDisplay.tsx (create new)


UI Kit

src/components/StepByStepFlow.tsx (stepper)
src/components/TokenDisplay.tsx, src/components/ColorCodedURL.tsx, src/components/ConfigurationButton.tsx, src/components/PageTitle.tsx
src/components/SecureInput.tsx (create new for client secret input)


Config & Discovery

src/services/config (central config)
src/services/discoveryService.ts (OIDC metadata, token_endpoint)
src/config/pingone.ts (PingOne env helpers, worker app discovery)


Flow Utilities (reusable)

src/utils/oauth.ts (jose helpers, randoms, etc.)
src/utils/workerToken.ts (create new for worker flow specific logic)
src/utils/clientCredentials.ts (create new for credential management)
src/utils/tokenStorage.ts + src/utils/storage.ts (consistent token storage)
src/utils/tokenHistory.ts, src/utils/tokenLifecycle.ts (status/expiry)
src/utils/flowConfiguration.ts, src/utils/flowConfigDefaults.ts (step metadata)
src/utils/secureJson.ts, src/utils/urlValidation.ts
src/utils/logger.ts (🔍 required)
src/utils/apiClient.ts (create new for PingOne Management API calls)


Types

src/types/* (oauth/auth/storage/errors)
src/types/workerToken.ts (create new for worker flow types)




2) Routes & Navigation

Ensure routes exist and are registered:

Start: /flows/worker-token → WorkerTokenFlow.tsx
Configuration: /worker/config → worker configuration component (can be embedded in main flow)


No callback URL needed (direct token exchange)


3) Functional Spec
3.1 Worker Application Discovery & Configuration (WorkerTokenFlow.tsx)

Required inputs (validate like V3):

client_id, client_secret, PingOne environment_id


Auto-discovery options:

PingOne Environment: Use environment_id to auto-discover token_endpoint
Custom OIDC: Allow manual token_endpoint configuration


Worker app validation:

Verify client credentials format
Check PingOne environment accessibility
Validate required scopes/permissions


Use StepByStepFlow with identical CTA/buttons/spinner behavior as V3 pages.
Log examples (use logger):

[🔧 WORKER] Configuring client credentials env=${envId}
[🌐 WORKER] Discovered token_endpoint=${endpoint}



3.2 Client Credentials Configuration (WorkerCredentials.tsx)

Secure credential input form:

Client ID: Plain text input with validation
Client Secret: Secure input (masked) with show/hide toggle
Environment ID: PingOne environment selector/input
Scopes: Multi-select for available scopes (default to common ones)


Credential validation:

Format validation (UUID for client_id, base64 for secrets)
Real-time feedback on input validity
Test connection button to verify credentials


Security considerations:

Never log or persist client secrets in plain text
Use secure storage utilities
Clear sensitive data on component unmount


Auto-fill from environment:

Support .env variables (PINGONE_CLIENT_ID, PINGONE_CLIENT_SECRET)
Merge with manual configuration



3.3 Token Request & Exchange (workerToken.ts)

Client Credentials Grant flow:

POST to token_endpoint
Body: grant_type=client_credentials, client_id, client_secret, scope
Headers: Content-Type: application/x-www-form-urlencoded
Optional: client_assertion for JWT-based client auth


Handle response:

Success: access_token, token_type, expires_in, scope
Error: Standard OAuth error responses (invalid_client, invalid_scope, etc.)


Token caching:

Cache valid tokens until near expiry (e.g., 80% of lifetime)
Automatic refresh before expiry
Cache key based on client_id + scope combination


Store tokens via src/utils/tokenStorage.ts:

Keep absolute expiry timestamp
No refresh token (use client credentials for renewal)



3.4 PingOne Management API Integration

Worker App Discovery:

Use credentials to fetch worker app details from PingOne Management API
Display app name, description, enabled status
Show granted scopes and permissions


Environment Information:

Fetch and display environment details
Show region, license info, enabled services


API Testing:

Built-in API explorer using worker token
Common endpoints: users, groups, applications, policies
Response inspection and error handling



3.5 Token Validation & Introspection

Token introspection:

Call PingOne token introspection endpoint
Display active status, expiry, scopes, client info


JWT decoding (if token is JWT format):

Decode header and payload
Show issuer, audience, expiration claims
Verify signature if JWKS available


Scope validation:

Compare requested vs granted scopes
Highlight any scope restrictions or denials



3.6 Post-Auth UX

Token status panel (same as V3):

Use TokenDisplay + decode modal, expiry countdown
Show client info, granted scopes, environment details
API testing interface with common PingOne endpoints


Management API Explorer:

Pre-built queries for common operations
Custom API call interface
Response formatting and error display


Status bar: show env ID, region, client app name (keep parity with V3).


4) Security & Hardening

Client secret protection:

Never log client secrets in plain text
Use secure storage with encryption at rest
Clear secrets from memory after use
Support for client assertion (JWT) authentication


Token security:

Validate token format and signature
Implement token caching with secure storage
Automatic token refresh before expiry
Clear expired tokens from cache


Environment validation:

Verify PingOne environment accessibility
Validate SSL/TLS for all API calls
Check client permissions before operations


API call security:

Rate limiting for Management API calls
Request/response logging (without sensitive data)
Error handling for unauthorized operations


HTTPS enforcement: All endpoints must use HTTPS in production
Credential rotation: Support for updating client secrets without flow restart


5) Code Reuse (concrete refactors)
Create or extend small, shared helpers (in src/utils/):

workerToken.ts:

requestClientCredentialsToken(endpoint: string, clientId: string, clientSecret: string, scopes: string[])
introspectToken(introspectionEndpoint: string, token: string, clientCredentials: ClientCredentials)
validateWorkerCredentials(clientId: string, clientSecret: string)


clientCredentials.ts:

secureStore(credentials: ClientCredentials) (encrypt and store)
secureRetrieve(clientId: string) (decrypt and retrieve)
validateCredentialFormat(clientId: string, clientSecret: string)


apiClient.ts:

createPingOneClient(token: string, environmentId: string)
discoverWorkerApp(client: PingOneClient, clientId: string)
testApiAccess(client: PingOneClient, scopes: string[])


tokenCache.ts:

getCachedToken(cacheKey: string)
setCachedToken(cacheKey: string, token: TokenResponse, ttl: number)
shouldRefreshToken(token: CachedToken)


Extend tokenStorage.put/get/clear(flowKey='worker-token')


Rule of thumb: If any new code would be ≥70% identical to an existing V3 utility, extract and inject differences via params.


6) Telemetry & Logging
All major stages emit logs via logger:

Credential config: [🔧 WORKER] configuring client_id=${clientId} env=${envId}
Token request: [🎯 WORKER] requesting token scopes=${scopes.join(',')}
Token success: [✅ TOKEN] received expires=${exp}s scopes=${grantedScopes}
Token cached: [💾 CACHE] stored token key=${cacheKey} ttl=${ttl}s
API discovery: [🔍 DISCOVERY] found worker app name=${appName} status=${status}
API test: [🧪 API-TEST] endpoint=${endpoint} status=${response.status}
Token refresh: [🔄 REFRESH] auto-refreshed token near expiry
Errors: [⛔ WORKER-ERROR] type=${errorType} msg=${err.message}

Keep entries emoji'd, timestamped, module-tagged, non-blocking.
Never log client secrets or sensitive credential data.

7) Config Additions
Add configuration block (respect .env → settings.json → localStorage) via services/config:
json{
  "pingone": {
    "workerToken": {
      "defaultScopes": ["p1:read:user", "p1:read:userGroup"],
      "tokenCacheTtlPercent": 0.8,
      "introspectionEnabled": true,
      "managementApiEnabled": true,
      "autoDiscovery": true
    }
  }
}
Environment variables support:
bashPINGONE_CLIENT_ID=your-client-id
PINGONE_CLIENT_SECRET=your-client-secret  
PINGONE_ENVIRONMENT_ID=your-env-id
PINGONE_REGION=NA|EU|CA|AP

8) Dependencies
May need to add:

JWT handling library (ensure jose is available)
Encryption utilities for secure credential storage
PingOne Management API client or HTTP client for API calls


9) Test Plan

Unit

requestClientCredentialsToken builds correct POST request
validateCredentialFormat handles various client ID/secret formats
tokenCache respects TTL and expiry logic
secureStore/secureRetrieve properly encrypt/decrypt credentials


Integration

Mock token endpoint: verify client credentials exchange
Mock Management API: test worker app discovery and API calls
Negatives: invalid credentials, expired tokens, insufficient scopes, network errors


E2E

/flows/worker-token → credential config → token receipt → API testing → dashboard happy path
Credential validation, token caching, automatic refresh
Management API integration and error handling


Security

Verify client secrets are never logged or stored in plain text
Test credential encryption/decryption cycles
Validate token cache security and cleanup


Accessibility

Focus order for credential inputs, secure input accessibility
Screen reader support for token status and API responses
Keyboard navigation consistent with V3




10) UX Considerations

Developer-focused: Clear technical information and debugging tools
Credential security: Visual indicators for secure vs insecure credential handling
Token lifecycle: Clear indication of token status, expiry, and refresh timing
API exploration: Intuitive interface for testing Management API endpoints
Error recovery: Clear instructions for credential issues, token failures, API errors
Performance: Fast token caching and minimal unnecessary API calls
Documentation: In-app help for PingOne concepts and common use cases


11) Acceptance Criteria

 Exact styling/copy parity with V3 step pages/components
 No duplicated business logic; shared utils added to src/utils/*
 Secure client credential storage and handling (never log secrets)
 Token caching with automatic refresh before expiry
 PingOne Management API integration for app discovery
 Token introspection and JWT decoding capabilities
 Built-in API explorer for testing worker token access
 Environment variable support for credential configuration
 Tokens stored via tokenStorage with visible Status Bar + decode modal
 Proper error handling for all OAuth and API error scenarios
 Unit + integration + E2E green; coverage ≥ V3 baseline
 Security audit passed for credential handling and storage
 Developer-friendly UX with clear technical information


Do all of the above using only the existing patterns in this repo—NewAuthContext, StepByStepFlow, tokenStorage, discoveryService, and logger—so the Worker Token flow "feels" like Auth v3 and stays maintainable. The flow should excel at machine-to-machine scenarios while providing developers with powerful tools for PingOne Management API exploration and testing.