# phase2_claude_spec_prompt.md
## Phase 2 Prompt — Claude (2×) (Spec Pass — Do Once)

You are Claude (2×). Be concise (~2 pages Markdown). No code. No repo scan. Use ONLY the Phase 1 output pasted below.

INPUT — Phase 1 findings (paste A–H here):
```
A) mfa-hub export inventory
Main Component:

MFAHubV8 → feature/MFAHubV8.tsx → Central hub with worker token management
Key Services:

workerTokenServiceV8 → dependencies/v8/services/workerTokenServiceV8.ts → Worker token storage (localStorage + IndexedDB)
CredentialsServiceV8 → dependencies/v8/services/credentialsServiceV8.ts → MFA credential isolation
MFAConfigurationServiceV8 → dependencies/v8/services/mfaConfigurationServiceV8.ts → Settings persistence
Navigation:

MFANavigationV8 → dependencies/v8/components/MFANavigationV8.tsx → Route navigation with cleanup
navigateToMfaHubWithCleanup → dependencies/v8/utils/mfaFlowCleanupV8.ts → Hub navigation helper
HTTP Layer:

requestClientCredentialsToken → dependencies/utils/workerToken.ts → PingOne token requests
applyClientAuthentication → dependencies/utils/clientAuthentication.ts → Auth method handling
B) proxy/env/auth wiring
Backend URL via getBackendUrl() in protocolUtils.ts → production: https://oauth-playground.vercel.app, dev: Vite proxy
Environment config from window globals in pingoneConfigService.ts → builds PingOne endpoints
Token auth via applyClientAuthentication() → supports client_secret_post, client_secret_basic, JWT
Worker token management in workerTokenServiceV8.ts → IndexedDB + localStorage persistence
Region support in token endpoints → https://auth.pingone.com/${environmentId}/as/token
C) storage/services inventory
IndexedDB:

workerTokenServiceV8.ts → oauth_playground_v8 DB, worker_tokens store → backup persistence
localStorage:

storage.ts → pingone_playground_ namespace → OAuth tokens, user info, config
workerTokenServiceV8.ts → v8:worker_token key → fast synchronous cache
Token Storage:

workerTokenServiceV8.ts → Worker tokens + credentials with expiration
oauthStorage in storage.ts → OAuth flow tokens (access, refresh, ID)
UI/Config:

MFAConfigurationServiceV8.ts → MFA settings, worker token preferences
CredentialsServiceV8.ts → Per-flow credential isolation
D) logging interception point
File: dependencies/utils/workerToken.ts → Function: requestClientCredentialsToken()

Why this covers everything:

All PingOne Platform API calls require worker tokens
Function wraps fetch() with comprehensive logging
Handles all auth methods (basic, post, JWT)
Called by all MFA services before API calls
Located in shared utils, imported globally
E) server.log integration + verification
Integration Path:

Client logging via logger.ts with exportLogs() JSON serialization
Analytics server integration referenced in workerTokenServiceV8.ts with safeAnalyticsFetch() calls
Need to add POST endpoint for client log shipping
Verification:

bash
grep "runId" server.log | tail -10
F) route-change call sites
MFANavigationV8.tsx:

navigate('/v8/mfa-device-management') (Line 108)
navigate('/v8/mfa-device-ordering') (Line 120)
navigate('/v8/mfa-reporting') (Line 132)
navigate('/v8/mfa-config') (Line 144)
navigateToMfaHubWithCleanup(navigate) (Lines 93, 185)
MFAHubV8.tsx:

navigate(feature.path) (Lines 803, 821)
G) smoke-test plan
Load MFA Hub → Verify worker token gauge status
Get Worker Token → Trigger modal, fetch token, store in IndexedDB
Navigate to Device Management → Should call Platform API with worker token
Register SMS Device → Send OTP via Platform API
Verify OTP → Validate via Platform API
Check API Logs → Verify requestClientCredentialsToken() captures all calls
H) runId threading recommendation
Generate: In workerTokenServiceV8.ts during saveCredentials() Thread through: Add runId parameter to safeAnalyticsFetch() calls Storage: Add runId field to IndexedDB worker_tokens store Propagation: Include in logger.ts entry metadata and HTTP request context
```

Goal:
Produce the final, foolproof Unified MFA spec that:
- stays on ONE stable route (no step routes; no navigate/push/replace for steps)
- reuses mfa-hub (no parallel API clients)
- journals EVERYTHING (Platform + MFA + OIDC/AuthZ + Token Service + proxy) + client events
- persists journals (IndexedDB primary + SQLite backstop)
- ships logs to backend `server.log` with runId and verifiable grep

Deliverable (Markdown):
1) Route map (single route) + route-lock behavior
2) Canonical state machine: states/invariants/events/transition table
3) Persistence model: keys `{envId,userId,runId}` + transactionId; retention; resume rules
4) Journaling schema: ApiCallRecord + ClientEventRecord; “cannot forget” enforcement
5) server.log shipping semantics: batching/idempotency/backpressure/verification
6) Screen contracts: Main/Config, Registration tabs, Auth steps, API Docs, Success (Next rules + recovery)
7) Test matrix + Definition of Done
8) Top 5 failure modes + mitigations
9) Next 5 implementation tasks (1–3 files each)

Output cap: ~120–180 lines. Ask “continue?” if longer.
