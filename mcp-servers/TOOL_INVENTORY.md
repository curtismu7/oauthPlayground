# MCP Tool Inventory

Complete inventory of all tools provided by MCP servers in the OAuth Playground project. Covers 5 existing servers (with 88+ tools) and 3 planned servers.

**Date:** June 2026  
**Status:** 5 servers active, 3 servers planned

---

## Table of Contents

1. [PingOne MCP Server](#1-pingone-mcp-server) — User authentication, groups, MFA, OAuth
2. [Memory MCP Server](#2-memory-mcp-server) — User preferences and flow history
3. [Filesystem MCP Server](#3-filesystem-mcp-server) — Config and log management
4. [Fetch MCP Server](#4-fetch-mcp-server) — HTTP testing and API validation
5. [OAuth OIDC MCP Server](#5-oauth-oidc-mcp-server) — Provider-agnostic OAuth 2.0/OIDC flow execution
6. [JWT Verifier Server](#6-jwt-verifier-mcp-server-planned) — [PLANNED] Token parsing and validation
7. [OAuth Simulator Server](#7-oauth-simulator-mcp-server-planned) — [PLANNED] OAuth flow simulation
8. [Security Compliance Server](#8-security-compliance-mcp-server-planned) — [PLANNED] Compliance checks

---

## 1. PingOne MCP Server

**Status:** Active  
**Entry Point:** `/Users/curtismuir/Development/oauthPlayground/pingone-mcp-server/src/index.ts`  
**Transport:** Stdio (for local CLI) / WebSocket (for cloud deployment)  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** `PINGONE_ENVIRONMENT_ID`, `PINGONE_REGION`, `PINGONE_ADMIN_CLIENT_ID`, `PINGONE_ADMIN_CLIENT_SECRET`

**Purpose:**  
Comprehensive PingOne Identity Platform integration. Provides tools for user management, authentication, MFA, groups, token operations, OIDC discovery, subscriptions, and training content access. Supports both worker tokens (pre-issued, no scopes) and client credentials (with scopes).

**Key Features:**
- User CRUD (create, read, update, delete, list, search)
- Group management (list, get, create, update, delete, members)
- MFA device registration, challenge, validation, policies
- OAuth token operations (login, refresh, logout/revoke, introspection)
- OIDC discovery and configuration endpoints
- Device auth flow management
- Subscription management
- Redirectless (passwordless) authentication
- User consents, roles, populations
- Licensing and training module

---

### Auth Tools (4 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.auth.login` | Authentication | Authenticate user with username/password credentials | `username`, `password`, `scope`, `environmentId`, `clientId`, `clientSecret` | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `tokenType` |
| `pingone.auth.refresh` | Authentication | Use refresh token to obtain new access token | `refreshToken`, `scope`, `environmentId`, `clientId`, `clientSecret` | `accessToken`, `refreshToken`, `idToken`, `expiresIn` |
| `pingone.auth.logout` | Authentication | Revoke access or refresh token | `token`, `tokenTypeHint` (access_token\|refresh_token), `clientId`, `clientSecret` | `success`, `message` |
| `pingone.auth.userinfo` | Authentication | Retrieve OpenID Connect userinfo for an access token | `accessToken`, `environmentId` | `userInfo` (user claims object), `success` |

**Example Natural Language Prompts:**
- "Log in user john@example.com with password SecurePass123"
- "Refresh my access token using this refresh token"
- "Get the userinfo for this access token to see what claims it contains"
- "Revoke this token to log the user out"

---

### User Tools (13 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone_get_user` | User Management | Get a PingOne user profile by ID | `userId`, `environmentId`, `workerToken` | `user` (full user object), `success` |
| `pingone_list_users` | User Management | List PingOne users with optional SCIM filter | `filter`, `limit`, `nextPageUrl`, `environmentId`, `workerToken` | `users` (array), `count`, `nextPageUrl`, `success` |
| `pingone_get_user_groups` | User Management | Get groups a user is a member of | `userId`, `environmentId`, `workerToken` | `groups` (array of group objects), `success` |
| `pingone_get_user_roles` | User Management | Get role assignments for a user | `userId`, `environmentId`, `workerToken` | `roles` (array of role objects), `success` |
| `pingone_lookup_users` | User Management | Look up users by identifier (UUID or username/email filter) | `identifier`, `environmentId`, `workerToken` | `users`, `matchType` (id\|filter), `user`, `success` |
| `pingone_get_population` | User Management | Get a population by ID | `populationId`, `environmentId`, `workerToken` | `population`, `success` |
| `pingone_list_populations` | User Management | List all populations in environment | `limit`, `nextPageUrl`, `environmentId`, `workerToken` | `populations` (array), `count`, `nextPageUrl`, `success` |
| `pingone_get_user_consents` | User Management | Get consent records for a user | `userId`, `accessToken` or `workerToken`, `limit`, `environmentId` | `consents` (array of consent objects), `success` |
| `pingone_create_user` | User Management (Write) | Create a new PingOne user | `user` (object with username, population.id), `environmentId`, `workerToken` | `user` (created user object), `success` |
| `pingone_update_user` | User Management (Write) | Update user profile (PATCH) — only specified fields changed | `userId`, `updates` (object), `environmentId`, `workerToken` | `user` (updated user object), `success` |
| `pingone_delete_user` | User Management (Write) | Delete a PingOne user (irreversible) | `userId`, `environmentId`, `workerToken` | `success` |
| `pingone_add_user_to_group` | User Management (Write) | Add a user to a group | `userId`, `groupId`, `environmentId`, `workerToken` | `success` |
| `pingone_remove_user_from_group` | User Management (Write) | Remove a user from a group | `userId`, `groupId`, `environmentId`, `workerToken` | `success` |

**Example Natural Language Prompts:**
- "Show me all users in this environment"
- "Get the user profile for user ID abc123"
- "What groups is user alice@example.com a member of?"
- "Create a new user with username testuser in population XYZ"
- "Remove user john from the admin group"

---

### Group Tools (5 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone_list_groups` | Group Management | List all groups in environment | `filter`, `limit`, `nextPageUrl`, `environmentId`, `workerToken` | `groups` (array), `count`, `nextPageUrl`, `success` |
| `pingone_get_group` | Group Management | Get a group by ID | `groupId`, `environmentId`, `workerToken` | `group`, `success` |
| `pingone_create_group` | Group Management (Write) | Create a new group | `group` (object with name), `environmentId`, `workerToken` | `group` (created group object), `success` |
| `pingone_update_group` | Group Management (Write) | Update group (PATCH) — only specified fields changed | `groupId`, `updates` (object), `environmentId`, `workerToken` | `group` (updated group object), `success` |
| `pingone_delete_group` | Group Management (Write) | Delete a group | `groupId`, `environmentId`, `workerToken` | `success` |

**Example Natural Language Prompts:**
- "Show all groups in the environment"
- "Get details for the admin group"
- "Create a new group called development-team"
- "Update the description of group xyz"
- "Delete the finance-approvers group"

---

### MFA Tools (15+ tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.mfa.devices.list` | MFA Management | List MFA devices for a user | `userId`, `workerToken`, `environmentId` | `devices` (array), `success` |
| `pingone.mfa.devices.register` | MFA Management (Write) | Register a new MFA device (SMS, EMAIL, TOTP, VOICE, FIDO2, MOBILE) | `userId`, `type`, `phoneNumber`, `emailAddress`, `nickname`, `workerToken` | `device`, `success` |
| `pingone.mfa.devices.activate` | MFA Management (Write) | Activate a registered MFA device with OTP | `userId`, `deviceId`, `otp`, `workerToken` | `device`, `success` |
| `pingone.mfa.challenge.send` | MFA Management (Write) | Send a challenge to an MFA device | `userId`, `deviceId`, `method` (SMS\|EMAIL\|VOICE), `workerToken` | `challenge`, `success` |
| `pingone.mfa.challenge.validate` | MFA Management (Write) | Validate a challenge response code | `userId`, `challengeId`, `code`, `workerToken` | `challenge`, `success` |
| `pingone.mfa.devices.delete` | MFA Management (Write) | Delete an MFA device | `userId`, `deviceId`, `workerToken` | `success` |
| `pingone.mfa.devices.block` | MFA Management (Write) | Block an MFA device | `userId`, `deviceId`, `workerToken` | `success` |
| `pingone.mfa.devices.unblock` | MFA Management (Write) | Unblock a blocked MFA device | `userId`, `deviceId`, `workerToken` | `success` |
| `pingone.mfa.devices.unlock` | MFA Management (Write) | Unlock a locked MFA device | `userId`, `deviceId`, `workerToken` | `success` |
| `pingone.mfa.devices.nickname` | MFA Management (Write) | Update MFA device nickname | `userId`, `deviceId`, `nickname`, `workerToken` | `device`, `success` |
| `pingone.mfa.devices.order` | MFA Management (Write) | Set MFA device order (priority for challenges) | `userId`, `deviceId`, `order`, `workerToken` | `success` |
| `pingone.mfa.devices.removeOrder` | MFA Management (Write) | Remove MFA device order setting | `userId`, `deviceId`, `workerToken` | `success` |
| `pingone.mfa.bypass.check` | MFA Management | Check if user has MFA bypass enabled | `userId`, `workerToken`, `environmentId` | `bypassEnabled`, `success` |
| `pingone.mfa.bypass.allow` | MFA Management (Write) | Enable MFA bypass for a user | `userId`, `workerToken`, `environmentId` | `success` |
| `pingone.mfa.policies.list` | MFA Policy Management | List device auth policies | `environmentId`, `workerToken` | `policies` (array), `success` |
| `pingone.mfa.policies.get` | MFA Policy Management | Get a device auth policy by ID | `policyId`, `environmentId`, `workerToken` | `policy`, `success` |

**Example Natural Language Prompts:**
- "List all MFA devices for user alice@example.com"
- "Register an SMS device for user bob with phone +14155551234"
- "Send a challenge code to device xyz for user john"
- "Activate this device with OTP code 123456"
- "Block device xyz for user alice to prevent further use"

---

### OIDC Tools (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.oidc.discovery` | OIDC Configuration | Fetch OpenID Connect discovery document (.well-known/openid-configuration) | `environmentId`, `region` | `issuer`, `token_endpoint`, `authorization_endpoint`, `jwks_uri`, `userinfo_endpoint`, etc. |
| `pingone.oidc.jwks` | OIDC Configuration | Fetch OIDC JSON Web Key Set (JWKS) for token validation | `environmentId`, `region` | `keys` (array of public keys), `success` |

**Example Natural Language Prompts:**
- "Get the OIDC discovery document for environment xyz"
- "Fetch the JWKS to validate tokens"
- "What is the PingOne authorization endpoint for this environment?"

---

### Token Tools (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.token.introspect` | Token Operations | Introspect an access token to check validity and claims | `token`, `environmentId`, `clientId`, `clientSecret` | `active`, `scope`, `sub`, `aud`, `exp`, `iat`, `jti`, etc. |
| `pingone.token.decode` | Token Operations | Decode JWT claims without validation (informational) | `token` | `header`, `payload`, `signature` |

**Example Natural Language Prompts:**
- "Is this token valid? Introspect it for me"
- "Decode this JWT so I can see what claims are in it"

---

### Device Auth Tools (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.deviceauth.start` | Device Auth Flow | Initiate a device authorization flow for limited-input devices | `clientId`, `clientSecret`, `environmentId`, `scope` | `device_code`, `user_code`, `verification_uri`, `expires_in` |
| `pingone.deviceauth.poll` | Device Auth Flow | Poll for user completion in device authorization flow | `deviceCode`, `clientId`, `clientSecret`, `environmentId` | `accessToken`, `refreshToken`, `expiresIn`, or `pending` |

**Example Natural Language Prompts:**
- "Initiate a device auth flow for a smart TV"
- "Poll the device code for completion"

---

### Redirectless (Passwordless) Tools (3 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.redirectless.initiate` | Passwordless Auth | Initiate redirectless authentication (code sent to email/SMS) | `identifier`, `type` (email\|sms), `environmentId`, `clientId`, `clientSecret` | `redirectlessId`, `expiresIn`, `success` |
| `pingone.redirectless.verify` | Passwordless Auth (Write) | Verify the code from redirectless flow | `redirectlessId`, `code`, `environmentId`, `clientId`, `clientSecret` | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `success` |
| `pingone.redirectless.getStatus` | Passwordless Auth | Check status of a redirectless authentication request | `redirectlessId`, `environmentId`, `clientId`, `clientSecret` | `status` (pending\|completed\|expired), `success` |

**Example Natural Language Prompts:**
- "Send a passwordless code to user@example.com"
- "Verify this redirectless code for the user"
- "Check if the user has completed the redirectless flow"

---

### Subscription Tools (5 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone_get_subscriptions` | Subscription Management | Get organization subscription details (licenses, active services) | `environmentId`, `workerToken` | `subscriptions` (array), `licenses`, `success` |
| `pingone_list_subscriptions` | Subscription Management | List all subscriptions in organization | `environmentId`, `workerToken` | `subscriptions` (array), `count`, `success` |
| `pingone_create_subscription` | Subscription Management (Write) | Create a new subscription (requires org admin) | `subscription` (object), `environmentId`, `workerToken` | `subscription`, `success` |
| `pingone_update_subscription` | Subscription Management (Write) | Update subscription details | `subscriptionId`, `updates` (object), `environmentId`, `workerToken` | `subscription`, `success` |
| `pingone_delete_subscription` | Subscription Management (Write) | Delete a subscription | `subscriptionId`, `environmentId`, `workerToken` | `success` |

**Example Natural Language Prompts:**
- "Show me all active subscriptions"
- "What services are included in our current license?"

---

### Config & Introspection Tools (3 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone_show_stored_config` | Configuration | Display PingOne credentials currently stored in playground (from ~/.pingone-playground) | None (informational) | `environmentId`, `clientId`, `region`, `storagePath`, `lastLoaded` |
| `pingone_save_config` | Configuration (Write) | Save PingOne credentials to playground storage (~/.pingone-playground/credentials) | `environmentId`, `clientId`, `clientSecret`, `region`, `adminClientId`, `adminClientSecret` | `success`, `storagePath` |
| `pingone_validate_credentials` | Configuration | Test PingOne credentials by fetching environment details | `environmentId`, `clientId`, `clientSecret`, `region` | `valid`, `environmentName`, `region`, `error` (if invalid) |

**Example Natural Language Prompts:**
- "Show me the PingOne credentials I have stored"
- "Save these new PingOne credentials to storage"
- "Validate that my PingOne credentials are working"

---

### Worker Token Tools (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone_get_worker_token` | Token Management | Obtain a worker token using client credentials (for MCP server use) | `clientId`, `clientSecret`, `environmentId`, `region`, `scopes` | `workerToken`, `expiresIn`, `success` |
| `pingone_decode_worker_token` | Token Management | Decode and display worker token claims | `workerToken` | `header`, `payload` (roles, scopes, exp, iat, sub) |

**Example Natural Language Prompts:**
- "Get a fresh worker token for this client"
- "Decode this worker token to see what roles it has"

---

### Training Module (1 tool)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.training.getContent` | Educational | Retrieve training content for OAuth/OIDC flows and PingOne concepts | `topic` (optional: oauth, oidc, mfa, phase7, phase8, consent, redirectless, deviceauth) | `content` (markdown), `references`, `codeExamples` |

**Example Natural Language Prompts:**
- "Show me training content about OAuth 2.0 flows"
- "Explain how OIDC discovery works"

---

### Phase 7 & 8 Tools (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `pingone.phase7.getPolicy` | Phase 7 Hands-on | Get Phase 7 consent policy details | `environmentId`, `workerToken` | `policy` (consent flow configuration) |
| `pingone.phase8.getPolicy` | Phase 8 Hands-on | Get Phase 8 risk policy details | `environmentId`, `workerToken` | `policy` (risk assessment configuration) |

---

**Total PingOne Server Tools: 70+**

---

## 2. Memory MCP Server

**Status:** Active  
**Entry Point:** `/Users/curtismuir/Development/oauthPlayground/memory-mcp-server/src/index.ts`  
**Transport:** Stdio (for local CLI) / WebSocket (for cloud deployment)  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** None (local storage only)

**Purpose:**  
User preference and OAuth flow history management. Enables persistent context across conversations and training sessions. Stores user preferences, common issues encountered, and OAuth flow patterns for analytics and debugging.

---

### Tools (6 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `save-user-preference` | User Settings | Save a user setting or preference | `userId`, `key`, `value` | `success`, `timestamp` |
| `get-user-preference` | User Settings | Retrieve a stored user preference | `userId`, `key` | `value`, `timestamp`, `found` |
| `update-flow-memory` | Flow History | Record insight from an OAuth/OIDC flow (issues, success patterns) | `userId`, `flowType`, `insight`, `tags` (array), `success` | `flowMemoryId`, `timestamp` |
| `search-user-history` | Analytics | Search user's flow history by keyword or tag | `userId`, `query` or `tags`, `limit` | `results` (array of flow records), `count` |
| `get-common-issues` | Analytics | Retrieve common issues encountered across all users (anonymized) | `limit`, `filters` (environment, flowType, tag) | `issues` (array with issue, frequency, resolution), `total` |
| `clear-user-memory` | User Settings (Write) | Clear all stored preferences and history for a user | `userId`, `confirm` (boolean) | `success`, `deletedCount` |

**Example Natural Language Prompts:**
- "Remember that this user prefers client_credentials flow"
- "What issues have been reported most often?"
- "Show me all flows where the user encountered a 403 error"
- "Save that this user is testing MFA redirectless auth"

---

## 3. Filesystem MCP Server

**Status:** Active  
**Entry Point:** `/Users/curtismuir/Development/oauthPlayground/filesystem-mcp-server/src/index.ts`  
**Transport:** Stdio (for local CLI) / WebSocket (for cloud deployment)  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** None (local filesystem access)  
**Sandboxing:** Restricted to `~/.oauth-playground/` and `/tmp/` directories

**Purpose:**  
Secure file operations for configuration management, structured logging, and audit trails. Supports encrypted config storage, searchable logs, temporary file management, and compliance audit logging.

---

### Tools (10 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `save-config` | Config Management | Save configuration to encrypted file (~/.oauth-playground/config/) | `configName`, `data` (object), `encrypt` (boolean, default true) | `success`, `path`, `encrypted` |
| `load-config` | Config Management | Load configuration from file (auto-decrypts if encrypted) | `configName`, `decrypt` (boolean, default true) | `data` (object), `success`, `encrypted` |
| `write-log` | Logging | Write structured log entry | `category` (string), `level` (info\|warn\|error\|debug), `message`, `metadata` (object) | `success`, `logId`, `timestamp` |
| `read-logs` | Logging | Read logs with optional filtering | `category`, `level`, `limit`, `startTime`, `endTime` | `logs` (array), `count`, `total` |
| `search-logs` | Logging | Search logs by keyword or pattern | `query`, `category`, `limit`, `after` (timestamp) | `results` (matching log entries), `count` |
| `create-temp-file` | File Management | Create a temporary file in managed temp directory | `prefix`, `content`, `mimeType` | `success`, `path`, `cleanup_at` |
| `cleanup-temp-files` | File Management (Write) | Remove temporary files older than threshold | `olderThan` (seconds), `prefix` (optional) | `success`, `removedCount`, `freedBytes` |
| `get-audit-log` | Audit & Compliance | Retrieve audit trail for compliance (all writes, deletions, config changes) | `startTime`, `endTime`, `action` (save\|delete\|encrypt), `limit` | `auditEntries` (array), `count` |
| `archive-logs` | Logging (Write) | Archive and compress logs older than threshold | `olderThan` (days), `compress` (boolean) | `success`, `archivePath`, `compressedSize` |
| `validate-integrity` | Audit & Compliance | Verify filesystem integrity (checksums for configs and logs) | `checkType` (config\|logs\|all) | `valid`, `errors` (array), `lastCheck` |

**Example Natural Language Prompts:**
- "Save this PingOne config to encrypted storage"
- "Show me all warnings from the last 24 hours"
- "Search logs for '403' errors"
- "Create a temp file to store this flow trace"
- "What config changes happened in the last week?"

---

## 4. Fetch MCP Server

**Status:** Active  
**Entry Point:** `/Users/curtismuir/Development/oauthPlayground/fetch-mcp-server/src/index.ts`  
**Transport:** Stdio (for local CLI) / WebSocket (for cloud deployment)  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** None (makes arbitrary HTTP requests with validation)  
**Security:** URL validation (blocks internal networks), optional SSL verification, rate limiting

**Purpose:**  
Advanced HTTP testing and OAuth flow validation. Enables direct API endpoint testing, OAuth redirect flow analysis, OIDC .well-known endpoint validation, and request/response analytics.

---

### Tools (9 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `fetch` | HTTP Requests | Make a raw HTTP request to any public URL | `url`, `method` (GET\|POST\|PUT\|PATCH\|DELETE), `headers`, `body`, `timeout` | `status`, `statusText`, `headers`, `body`, `timing` |
| `fetch-and-parse` | HTTP Requests | Fetch and parse JSON/HTML response | `url`, `method`, `headers`, `body`, `parseAs` (json\|html\|text) | `status`, `parsed` (data), `raw`, `parseError` |
| `test-oauth-endpoint` | OAuth Testing | Test OAuth token endpoint availability and response | `tokenEndpoint`, `clientId`, `clientSecret`, `grantType`, `scope` | `accessible`, `supportsGrant`, `responseTime`, `requirements` |
| `test-redirect-flow` | OAuth Testing | Test OAuth authorization redirect flow (follows redirects, extracts params) | `authorizationEndpoint`, `clientId`, `redirectUri`, `scope`, `state` | `redirectChain` (array of URLs), `finalParams`, `errors` |
| `test-well-known-endpoints` | OIDC Testing | Validate OIDC .well-known discovery endpoints | `discoveryUrl` or `environmentId`, `validateEndpoints` (boolean) | `discovery`, `validated` (true/false per endpoint), `missing`, `unreachable` |
| `test-oauth-flow` | OAuth Testing | Comprehensive OAuth flow test (discovery → auth → token) | `discoveryUrl` or `environmentId`, `clientId`, `clientSecret`, `username`, `password` | `flowSteps` (array of step results), `success`, `issues` |
| `get-request-history` | Analytics | Retrieve history of recent fetch requests and responses | `limit`, `filters` (url, method, status) | `requests` (array), `count`, `cacheMisses` |
| `get-fetch-analytics` | Analytics | Fetch statistics (success rate, avg response time, error breakdown) | `timeWindow` (1h\|24h\|7d), `groupBy` (url\|method\|status) | `successRate`, `avgResponseTime`, `errorBreakdown`, `topErrors` |
| `validate-certificate` | Security | Validate SSL/TLS certificate for a domain | `domain` or `url`, `checkExpiry` (boolean) | `valid`, `subject`, `issuer`, `expiresAt`, `daysRemaining`, `errors` |

**Example Natural Language Prompts:**
- "Test if the PingOne token endpoint is working"
- "Follow the OAuth redirect flow and show me what parameters were returned"
- "Validate the OIDC discovery document"
- "Fetch this JSON API and parse the response"
- "Check the SSL certificate for api.example.com"
- "Run a complete OAuth flow test with these credentials"

---

---

## 5. OAuth OIDC MCP Server

**Status:** ✅ Built  
**Entry Point:** `/Users/curtismuir/Development/oauthPlayground/oauth-oidc-mcp-server/src/index.ts`  
**Transport:** Stdio (via `npx tsx`)  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** Optional per-call (`clientId`, `clientSecret`, `authMethod`) or env defaults (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `PINGONE_ENVIRONMENT_ID`, `PINGONE_REGION`, `OAUTH_ISSUER_URL`)

**Purpose:**  
Provider-agnostic OAuth 2.0 / OIDC flow execution (not simulation). Works against any OIDC issuer via discovery, with a PingOne convenience preset. Complements pingone-mcp-server (which handles management APIs) and oauth-simulator (which mocks steps). Focused on real, executable flows: authorization code, password grant, client credentials, RFC 8693 token exchange, device flow, CIBA, DPoP, PAR, and more.

**Key Features:**
- Endpoint resolution: explicit overrides > OIDC discovery > PingOne preset > env defaults
- Authorization code flow with PKCE (RFC 7636)
- RFC 8693 subject/actor token exchange (for delegated access, `act` claim)
- Device authorization (RFC 8628) and CIBA backchannel authentication
- Pushed authorization requests (PAR, RFC 9126)
- DPoP proof generation (RFC 9449)
- Token introspection (RFC 7662) and revocation (RFC 7009)
- OIDC userinfo endpoint
- JWT decode (no verification) and JWT verify (signature validation)

---

### Discovery & Token Utils (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_discover` | Discovery | Resolve all OAuth/OIDC endpoints from issuer, PingOne preset, or explicit overrides | `issuerUrl`, `pingoneEnvironmentId`, `pingoneRegion`, `tokenEndpoint` (override), `authorizationEndpoint` (override) | `issuer`, `tokenEndpoint`, `authorizationEndpoint`, `userinfoEndpoint`, `jwksUri`, `revocationEndpoint`, `introspectionEndpoint` |
| `oauth_decode_jwt` | Token Utils | Decode JWT header and payload without verification (informational) | `token` | `header` (typ, alg, kid), `payload` (all claims), `signature` (encoded) |

**Example Natural Language Prompts:**
- "Discover all endpoints for PingOne environment abc123 in US region"
- "Decode this JWT and show me the header and claims"

---

### Token Verification (1 tool)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_verify_jwt` | Token Utils | Verify JWT signature against JWKS endpoint (or issuer discovery) | `token`, `issuer`, `audience`, `algorithms` (default RS256), `clockSkewSeconds` | `valid`, `payload`, `verificationErrors`, `keyUsed` |

**Example Natural Language Prompts:**
- "Verify this token is signed by PingOne"
- "Check if this JWT is valid and was issued for audience my-app"

---

### Grant Flows (3 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_password_grant` | Grant | Resource Owner Password Credentials (RFC 6749 §4.3) — direct username/password to token | `username`, `password`, `scope`, `audience` (optional), `clientId`, `clientSecret`, `tokenEndpoint` (or discovery) | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `tokenType`, `scope` |
| `oauth_refresh_token` | Grant | Refresh an access token (RFC 6749 §6) | `refreshToken`, `scope`, `clientId`, `clientSecret`, `tokenEndpoint` (or discovery) | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `scope` |
| `oauth_client_credentials` | Grant | Client credentials M2M flow (RFC 6749 §4.4) | `scope`, `audience` (optional), `resource` (optional), `clientId`, `clientSecret`, `tokenEndpoint` (or discovery) | `accessToken`, `expiresIn`, `tokenType`, `scope` |

**Example Natural Language Prompts:**
- "Log in with username=alice password=secret123 using ROPC"
- "Refresh this refresh token to get a new access token"
- "Get an M2M access token with scope 'read write'"

---

### Authorization Code Flow (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_build_authorization_url` | Authorization Code | Build authorization URL with PKCE (RFC 7636) support | `clientId`, `redirectUri`, `scope`, `state` (optional), `codeChallenge` (optional, PKCE), `responseType` (default code), `authorizationEndpoint` (or discovery) | `authorizationUrl`, `codeChallenge`, `codeVerifier`, `state` |
| `oauth_exchange_authorization_code` | Authorization Code | Exchange authorization code for tokens (RFC 6749 §4.1.3) | `code`, `redirectUri`, `clientId`, `clientSecret`, `codeVerifier` (PKCE), `tokenEndpoint` (or discovery) | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `tokenType`, `scope` |

**Example Natural Language Prompts:**
- "Build an authorization URL with PKCE for clientId=myapp"
- "Exchange this authorization code for tokens"

---

### RFC 8693 Token Exchange (1 tool)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_token_exchange` | Token Exchange | RFC 8693 subject/actor token exchange for delegated access (generates `act` claim) | `subjectToken`, `actorToken` (optional), `audience`, `scope` (optional), `resource` (optional), `clientId`, `clientSecret`, `tokenEndpoint` (or discovery) | `accessToken`, `expiresIn`, `issuedTokenType`, `scope`, `actClaim` (if actor provided) |

**Example Natural Language Prompts:**
- "Exchange my user token with an actor token to get a delegated MCP server token"
- "Perform RFC 8693 token exchange with subject and actor tokens"

---

### Device Authorization (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_device_authorization` | Device | Initiate device authorization flow (RFC 8628 §3.1) | `scope`, `clientId`, `tokenEndpoint` (or discovery), `deviceAuthorizationEndpoint` (or discovery) | `deviceCode`, `userCode`, `verificationUri`, `verificationUriComplete` (optional), `expiresIn`, `interval` |
| `oauth_poll_device_token` | Device | Poll for token completion in device flow (RFC 8628 §3.4) | `deviceCode`, `clientId`, `clientSecret`, `tokenEndpoint` (or discovery), `pollInterval` (seconds) | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `tokenType`, or `pending` |

**Example Natural Language Prompts:**
- "Start a device authorization flow for a TV"
- "Poll the device code to see if the user has authorized"

---

### CIBA (Client-Initiated Backchannel Authentication) (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_backchannel_authentication` | CIBA | Initiate CIBA backchannel authentication (out-of-band) | `scope`, `loginHint` (user email), `bindingMessage` (optional), `clientId`, `clientSecret`, `backchannel_authentication_endpoint` (or discovery) | `authReqId`, `expiresIn`, `interval` |
| `oauth_poll_ciba_token` | CIBA | Poll for token completion in CIBA flow | `authReqId`, `clientId`, `clientSecret`, `tokenEndpoint` (or discovery), `pollInterval` (seconds) | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `tokenType`, or `auth_req_insuf_info` |

**Example Natural Language Prompts:**
- "Initiate CIBA backchannel auth for user alice@example.com"
- "Poll the auth request to see if the user approved on their phone"

---

### PAR (Pushed Authorization Request) (1 tool)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_pushed_authorization_request` | PAR | Push authorization parameters to server, get request_uri (RFC 9126) | `redirectUri`, `scope`, `codeChallenge` (PKCE), `clientId`, `clientSecret`, `parEndpoint` (or discovery) | `requestUri`, `expiresIn` |

**Example Natural Language Prompts:**
- "Push this authorization request to get a request_uri for PKCE flow"

---

### DPoP (Demonstration of Proof-of-Possession) (1 tool)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_generate_dpop_proof` | DPoP | Generate DPoP proof JWT for sender-constrained tokens (RFC 9449) | `htm` (GET, POST, etc.), `htu` (target URL), `accessToken` (optional), `nonce` (optional) | `dpopProof` (JWT), `jti`, `createdAt` |

**Example Natural Language Prompts:**
- "Generate a DPoP proof for POST to the token endpoint"

---

### Token Lifecycle (2 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_introspect_token` | Token Lifecycle | Introspect token to check validity (RFC 7662) | `token`, `tokenTypeHint` (access_token, refresh_token, id_token), `clientId`, `clientSecret`, `tokenEndpoint` (or discovery), `introspectionEndpoint` (or discovery) | `active`, `scope`, `sub`, `aud`, `exp`, `iat`, `iss`, `tokenType` |
| `oauth_revoke_token` | Token Lifecycle | Revoke a token (RFC 7009) | `token`, `tokenTypeHint`, `clientId`, `clientSecret`, `tokenEndpoint` (or discovery), `revocationEndpoint` (or discovery) | `success`, `statusCode` |

**Example Natural Language Prompts:**
- "Check if this token is still valid"
- "Revoke this token to log the user out"

---

### OIDC UserInfo (1 tool)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth_userinfo` | OIDC | Fetch OIDC UserInfo claims using access token | `accessToken`, `userinfoEndpoint` (or discovery) | `sub`, `name`, `email`, `email_verified`, `phone_number`, `address`, (all OIDC standard claims) |

**Example Natural Language Prompts:**
- "Fetch the userinfo for this access token"

---

**Total OAuth OIDC Server Tools: 18**

---

## 6. JWT Verifier MCP Server [PLANNED]

**Status:** Planned (specification complete, implementation pending)  
**Entry Point:** (TBD) `jwt-verifier-mcp-server/src/index.ts`  
**Transport:** Stdio / WebSocket  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** None (uses provided JWKS or public endpoints)

**Purpose:**  
JWT token parsing, validation, and analysis. Provides detailed token inspection, signature verification against JWKS endpoints, claim validation, and debugging of token-related issues in OAuth/OIDC flows.

---

### Planned Tools (8 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `jwt.decode` | Token Parsing | Decode JWT without verification (informational) | `token` | `header`, `payload`, `signature`, `parts` |
| `jwt.verify` | Token Validation | Verify JWT signature using JWKS endpoint or provided key | `token`, `jwksUrl` or `publicKey`, `algorithms`, `audience`, `issuer` | `valid`, `payload`, `verificationErrors` |
| `jwt.inspect` | Token Analysis | Detailed inspection: expiry, issuer, audience, roles, scopes | `token` | `summary`, `expiresIn`, `isExpired`, `claims`, `standardClaims` |
| `jwt.validateClaims` | Token Validation | Validate specific claims against expected values | `token`, `expectedClaims` (object with aud, iss, sub, roles, scopes) | `claimsValid`, `mismatches` (array), `details` |
| `jwt.getKeys` | JWKS Management | Fetch and cache JWKS from endpoint | `jwksUrl` | `keys` (array), `keyCount`, `algorithms`, `cached` |
| `jwt.debugToken` | Debugging | Deep inspection with common issues detection (expired, wrong aud, missing scope) | `token`, `expectedAudience`, `expectedScopes` | `issues` (array), `warnings`, `recommendations` |
| `jwt.compareTokens` | Analysis | Compare two JWTs to identify differences in claims | `token1`, `token2` | `differences` (claims), `similarities`, `summary` |
| `jwt.encodeJwt` | Token Creation | Manually encode/create a JWT with specified claims (for testing) | `payload` (object), `header` (object), `secret` or `privateKey`, `algorithm` | `token`, `expiresIn` |

**Example Natural Language Prompts:**
- "Decode this JWT and show me the claims"
- "Verify this token against the PingOne JWKS endpoint"
- "Is this token expired? Show me when it expires"
- "Check if this token has the 'admin' role in the claims"
- "Why is my token being rejected? Debug it for me"

---

## 7. OAuth Simulator MCP Server [PLANNED]

**Status:** Planned (specification complete, implementation pending)  
**Entry Point:** (TBD) `oauth-simulator-mcp-server/src/index.ts`  
**Transport:** Stdio / WebSocket (spawns local HTTP server for callback)  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** None (uses provided client credentials and endpoints)

**Purpose:**  
OAuth and OIDC flow simulation and testing. Allows users to step through OAuth flows programmatically, capture authorization codes, simulate various error conditions, and test edge cases without manual browser interaction.

---

### Planned Tools (12 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `oauth.initAuthorizationFlow` | Flow Control | Start an authorization code flow, open browser callback | `authorizationEndpoint`, `clientId`, `redirectUri`, `scope`, `state`, `responseType`, `codeChallenge` (PKCE) | `authorizationUrl`, `state`, `sessionId`, `callbackServerPort` |
| `oauth.waitForCallback` | Flow Control | Wait for authorization code callback (with timeout) | `sessionId`, `timeout` (seconds) | `authorizationCode`, `state`, `error` (if denied), `receivedAt` |
| `oauth.exchangeCodeForToken` | Flow Control | Exchange authorization code for tokens | `tokenEndpoint`, `clientId`, `clientSecret`, `code`, `redirectUri`, `codeVerifier` (PKCE) | `accessToken`, `refreshToken`, `idToken`, `expiresIn`, `tokenType` |
| `oauth.simulateFlow` | End-to-End | Run complete Authorization Code flow with callback simulation | `discoveryUrl` or `authorizationEndpoint`, `tokenEndpoint`, `clientId`, `clientSecret`, `redirectUri`, `username`, `password`, `scope` | `tokens` (accessToken, idToken, refreshToken), `flowSteps`, `timing`, `issues` |
| `oauth.simulateErrorCase` | Testing | Simulate specific OAuth error conditions (invalid_scope, access_denied, server_error) | `errorType`, `authorizationEndpoint`, `clientId`, `redirectUri`, `scope` | `errorResponse`, `errorUri`, `description`, `recoverySteps` |
| `oauth.simulateRefreshFlow` | Testing | Test token refresh flow | `tokenEndpoint`, `clientId`, `clientSecret`, `refreshToken`, `scope` | `newAccessToken`, `expiresIn`, `success` |
| `oauth.simulateRevokeFlow` | Testing | Test token revocation flow | `tokenRevocationEndpoint`, `clientId`, `clientSecret`, `token`, `tokenTypeHint` | `success`, `responseCode` |
| `oauth.captureAuthorizationRequest` | Debugging | Capture raw authorization request to inspect query parameters | `sessionId` | `method`, `url`, `queryParams` (clientId, scope, redirectUri, state, etc.), `timestamp` |
| `oauth.analyzeResponseTime` | Performance | Test OAuth endpoint response times and performance | `endpoints` (authorizationEndpoint, tokenEndpoint, userinfoEndpoint), `iterations` | `responseTimings`, `avgTime`, `minTime`, `maxTime`, `percentiles` |
| `oauth.simulateDeviceFlow` | Alternative Flows | Simulate device authorization flow (for limited-input devices) | `deviceAuthorizationEndpoint`, `clientId`, `clientSecret`, `scope`, `pollInterval` | `deviceCode`, `userCode`, `verificationUri`, `pollResult`, `accessToken` |
| `oauth.simulatePKCEFlow` | Security Testing | Run Authorization Code with PKCE (for native/mobile apps) | `authorizationEndpoint`, `tokenEndpoint`, `clientId`, `redirectUri`, `scope` | `codeChallenge`, `state`, `authorizationCode`, `accessToken`, `success` |
| `oauth.compareFlows` | Analysis | Compare two OAuth flows to identify differences (timing, scope usage, etc.) | `flow1` (parameters and responses), `flow2` | `differences`, `similarities`, `performanceComparison` |

**Example Natural Language Prompts:**
- "Simulate a complete OAuth authorization code flow for me"
- "Test what happens if the user denies the consent request"
- "Run a PKCE flow simulation"
- "How long does it take to get a token from the token endpoint?"
- "Compare the authorization flow for scope 'read' vs scope 'read write'"

---

## 8. Security Compliance MCP Server [PLANNED]

**Status:** Planned (specification complete, implementation pending)  
**Entry Point:** (TBD) `security-compliance-mcp-server/src/index.ts`  
**Transport:** Stdio / WebSocket  
**Package:** TypeScript 5, CommonJS (compiled to dist/)  
**Credentials Required:** None (passive analysis)

**Purpose:**  
OAuth and OIDC security compliance checking. Validates configurations against best practices (RFC 6749, RFC 6750, OAuth 2.1, OIDC Core), detects security misconfigurations, and provides remediation guidance.

---

### Planned Tools (10 tools)

| Tool Name | Category | Description | Input Params | Output Fields |
|-----------|----------|-------------|--------------|----------------|
| `security.validateOAuthConfig` | Compliance | Validate OAuth configuration against RFC 6749/OAuth 2.1 | `clientId`, `redirectUri`, `tokenEndpoint`, `authorizationEndpoint`, `scopes` | `compliant`, `violations` (array), `recommendations` |
| `security.validateOIDCConfig` | Compliance | Validate OIDC configuration against OIDC Core 1.0 | `discoveryUrl` or `endpoints` (issuer, authorizationEndpoint, tokenEndpoint, userinfoEndpoint, jwksUri), `signAlgorithm` | `compliant`, `violations`, `warnings` |
| `security.checkScopes` | Access Control | Validate scope names and hierarchy for best practices | `scopes` (array or string), `reservedPrefixes` (array, e.g., p1:*, banking:*) | `valid`, `issues` (malformed, reserved, duplicate), `recommendations` |
| `security.validateRedirectUri` | Redirect Safety | Check redirect URIs for common security issues | `redirectUris` (array), `allowLocalhost` (boolean), `allowHttp` (boolean) | `safe`, `issues` (http on prod, wildcard, open redirects), `recommendations` |
| `security.validateJwtSecurity` | Token Security | Validate JWT configuration for security (algorithm, expiry, signature) | `token`, `allowedAlgorithms` (e.g., RS256), `maxExpirySeconds`, `jwksUrl` | `secure`, `issues` (weak algorithm, too long expiry, no signature), `recommendations` |
| `security.scanTokenResponse` | Data Leakage | Check token responses for unintended data exposure (tokens in logs, URLs, etc.) | `tokenEndpointResponse`, `authorizationEndpointResponse` | `dataExposures` (array), `severity` (high/medium/low), `recommendations` |
| `security.validateAuthorizationGrant` | Grant Security | Validate authorization grant type selection | `grantType`, `clientType` (public\|confidential), `useCase`, `environment` (production\|development) | `recommended`, `alternativeGrants`, `securityConsiderations` |
| `security.detectMisconfigurations` | Threat Detection | Scan configuration for common misconfigurations leading to vulnerabilities | `configObject` (OAuth/OIDC config), `environment`, `clientType` | `misconfigurations` (array with issue, severity, cve/rfc reference), `exploitability` |
| `security.generateSecurityReport` | Audit | Generate comprehensive security audit report | `endpoints` (array of OAuth/OIDC endpoints), `configuration` (object), `includeRecommendations` (boolean) | `report` (markdown), `score` (0-100), `criticalIssues`, `recommendations` |
| `security.validateConsent` | Compliance | Check consent flow compliance (GDPR, consent recording, transparency) | `consentConfiguration` (scope-to-description mapping), `auditLog` (user consents granted) | `compliant`, `gaps` (missing descriptions, unlogged consents), `recommendations` |

**Example Natural Language Prompts:**
- "Check if my OAuth configuration is compliant with OAuth 2.1"
- "Validate these redirect URIs for security issues"
- "Is my token expiry time reasonable or too long?"
- "Show me any common security misconfigurations in my setup"
- "Generate a security audit report for this OIDC configuration"
- "Are my scopes following naming best practices?"

---

---

## Integration Guide

### Using Tools from Claude Code / AI Assistants

All MCP servers are registered with the Claude platform and can be invoked by natural language:

```
Example: "Use the PingOne server to list all users"
Claude will resolve to → pingone_list_users tool
```

### Tool Naming Conventions

- **PingOne Server:** `pingone.*` (oidc, auth, mfa) or `pingone_*` (users, groups, subscriptions)
- **Memory Server:** `save-*`, `get-*`, `search-*`, `update-*`, `clear-*`
- **Filesystem Server:** `save-config`, `load-config`, `write-log`, `read-logs`, `search-logs`, `get-audit-log`
- **Fetch Server:** `fetch`, `fetch-and-parse`, `test-*`, `validate-*`, `get-*-analytics`
- **OAuth OIDC Server:** `oauth_*` (discover, decode, verify, password_grant, refresh_token, client_credentials, build_authorization_url, exchange_authorization_code, token_exchange, device_authorization, poll_device_token, backchannel_authentication, poll_ciba_token, pushed_authorization_request, generate_dpop_proof, introspect_token, revoke_token, userinfo)
- **JWT Verifier [PLANNED]:** `jwt.*` (decode, verify, inspect, validate, debug, encode)
- **OAuth Simulator [PLANNED]:** `oauth.*` (initFlow, waitCallback, exchange, simulate, capture, analyze)
- **Security Compliance [PLANNED]:** `security.*` (validate, check, scan, detect, generate, audit)

### Credential Handling

| Server | Credential Source | Storage | Required |
|--------|------------------|---------|----------|
| PingOne | Env vars / ~/.pingone-playground/ | ~/.pingone-playground/credentials/mcp-config.json | Yes (env or storage) |
| Memory | None (local storage) | ~/.oauth-playground/memory/ | No |
| Filesystem | None (filesystem access) | ~/.oauth-playground/, /tmp/ | No |
| Fetch | None (optional basic auth in headers) | (request-scoped) | No |
| OAuth OIDC | Env defaults or per-call | (in-memory, per-flow) | Optional (env vars for convenience) |
| JWT Verifier [PLANNED] | JWKS URLs / public keys | (in-memory cache) | Optional |
| OAuth Simulator [PLANNED] | Client credentials (provided per-flow) | (ephemeral) | Per flow |
| Security Compliance [PLANNED] | None (config analysis) | (request-scoped) | No |

---

## Performance & Limitations

### Response Times

- **PingOne server:** 200-500ms per call (includes PingOne API latency)
- **Memory server:** <10ms (local JSON)
- **Filesystem server:** 10-100ms (disk I/O)
- **Fetch server:** 500ms-5s (depends on target endpoint)
- **OAuth OIDC server:** 50-500ms (endpoint latency varies; discovery caching)
- **JWT Verifier [PLANNED]:** <5ms (local parsing), 100-500ms (JWKS fetch)
- **OAuth Simulator [PLANNED]:** 2-10s per flow (includes browser/callback wait)
- **Security Compliance [PLANNED]:** <100ms (static analysis)

### Concurrency Limits

- PingOne server: 10 concurrent requests (PingOne API rate limiting)
- Memory server: Unlimited (in-memory)
- Filesystem server: 5 concurrent writes (file lock safety)
- Fetch server: 20 concurrent requests (configurable)
- OAuth OIDC server: 50 concurrent requests (no local bottleneck; endpoint-limited)
- All [PLANNED] servers: 100+ concurrent (no external dependencies)

### Data Retention

- **PingOne:** None (pass-through API)
- **Memory:** 30 days (configurable, auto-cleanup)
- **Filesystem:** Until manually deleted (encrypted at rest)
- **Fetch:** Request history for 24 hours (analytics), 7 days (detailed logs)
- **OAuth OIDC:** None (pass-through OAuth; endpoint discovery cached locally up to 1 hour)
- **[PLANNED] Servers:** Per-flow ephemeral or 24-hour cache

---

## Troubleshooting

### Common Issues

1. **PingOne server fails with "credentials not found"**
   - Run `pingone_show_stored_config` to check what's loaded
   - Use `pingone_save_config` to persist credentials
   - Verify `~/.pingone-playground/credentials/mcp-config.json` exists

2. **Fetch server times out**
   - Increase timeout parameter (default 30s)
   - Check if target URL is accessible
   - Use `validate-certificate` to diagnose SSL issues

3. **OAuth OIDC server fails to discover endpoints**
   - Verify `issuerUrl` is a valid OIDC issuer (e.g., `https://auth.pingone.com/env-id/as`)
   - If using PingOne preset: confirm `pingoneEnvironmentId` and `pingoneRegion` match your environment
   - Check network access to the issuer's `.well-known/openid-configuration`

4. **Token exchange returns no `act` claim**
   - Verify both subject and actor tokens are valid (use `oauth_verify_jwt`)
   - Confirm issuer supports RFC 8693 (check discovery for `token_endpoint_auth_methods_supported`)
   - Check resource server / audience configuration for `may_act` delegation rules

5. **JWT verification fails**
   - Ensure JWKS endpoint is accessible
   - Verify token not expired (use `oauth_introspect_token`)
   - Check algorithm matches JWKS keys (use `oauth_decode_jwt`)

6. **OAuth simulator hangs waiting for callback**
   - Confirm redirect URI matches authorization endpoint config
   - Check if local callback server port is available (default 3333-3343)
   - Increase `timeout` parameter

---

## Future Enhancements (Not Yet Planned)

- Database persistence for Memory server (SQLite)
- Redis caching for Fetch server responses
- Advanced threat detection (ML-based anomalies)
- Integration with PingOne Risk engine
- Multi-environment tenancy for Filesystem server
- WebSocket duplex streaming for real-time OAuth flows

---

## Document Info

- **Last Updated:** June 2026
- **Maintained By:** OAuth Playground Project
- **Related Files:**
  - `/mcp-servers/README.md` — setup and development
  - `/pingone-mcp-server/README.md` — PingOne server details
  - `/docs/OIDC_FLOWS.md` — OAuth/OIDC reference
  - `.env.example` — credential setup

---

**End of Inventory**
