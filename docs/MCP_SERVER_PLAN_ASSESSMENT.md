# MCP Server Development Plan — Assessment & Recommendations

**Date**: March 2026  
**Reference**: [MCP_SERVER_DEVELOPMENT_PLAN.md](../MCP_SERVER_DEVELOPMENT_PLAN.md)  
**Status**: Assessment complete. Phases A–C, **Phase 5**, **Phase 6**, **Phase 7**, **Phase 8**, **Phase 9**, and **AI Assistant + MCP** implemented; MFA expansion is next.

This doc assesses the plan against the live **`pingone-mcp-server/`** and recommends next steps. The **plan doc** ([MCP_SERVER_DEVELOPMENT_PLAN.md](../MCP_SERVER_DEVELOPMENT_PLAN.md)) is the single source of truth for phase descriptions and tool catalog.

---

## Current state vs plan

### What we already have

| Plan item | Current implementation |
|-----------|------------------------|
| **MCP server** | ✅ `pingone-mcp-server/` — stdio transport, credentials from storage |
| **Auth** | ✅ Auth tools: login, refresh, revoke, userinfo (`actions/auth.ts`) |
| **MFA** | ✅ MFA tools in `actions/mfa.ts` (multiple tools) |
| **Worker token** | ✅ Worker tools in `actions/worker.ts` |
| **Redirectless** | ✅ Redirectless tools in `actions/redirectless.ts` |
| **Credentials** | ✅ Storage-backed: `mcp-config.json` + `credentialLoader.ts` |
| **Training / resources** | ✅ Training module + lesson/practice prompts; `pingone://applications` resource |
| **Worker token alias** | ✅ `pingone_get_worker_token` (same as `pingone.workerToken.issue`) |
| **Errors** | ✅ `mcpErrors.ts` — standardized tool errors |
| **User tools** | ✅ `pingone_get_user`, `pingone_list_users`, `pingone_get_user_groups`, `pingone_get_user_roles`, `pingone_lookup_users` |
| **Directory tools** | ✅ `pingone_get_population`, `pingone_list_populations` |
| **Application tools** | ✅ `pingone.applications.list`, `pingone_get_application`, `pingone_get_application_resources` |
| **OIDC tools** | ✅ `pingone_oidc_config` (no auth), `pingone_oidc_discovery` (no auth) |
| **Password / Risk / Token / Flow** | ✅ `pingone_password_state`, `pingone_password_send_recovery_code`, `pingone_risk_evaluation`, `pingone_token_exchange`, `pingone_userinfo`, `pingone_check_username_password` |
| **OAuth tools** | ✅ `pingone_introspect_token`, `pingone_device_authorization` |
| **User consents** | ✅ `pingone_get_user_consents` (`actions/users.ts` + `services/pingoneUserClient.ts`) |
| **Subscriptions** | ✅ `pingone_list_subscriptions`, `pingone_get_subscription`, `pingone_create_subscription`, `pingone_update_subscription`, `pingone_delete_subscription` (`actions/subscriptions.ts`, `services/pingoneSubscriptionsClient.ts`) |
| **Licensing** | ✅ `pingone_get_organization_licenses` (`actions/phase8.ts`, `services/pingoneLicensingClient.ts`) |
| **User CRUD** | ✅ `pingone_create_user`, `pingone_update_user`, `pingone_delete_user`, `pingone_add_user_to_group`, `pingone_remove_user_from_group` (`services/pingoneUserClient.ts`, `actions/users.ts`) |
| **App CRUD + secrets** | ✅ `pingone_create_application`, `pingone_update_application`, `pingone_delete_application`, `pingone_get_application_secret`, `pingone_rotate_application_secret` (`services/pingoneManagementClient.ts`, `actions/worker.ts`) |
| **Group management** | ✅ `pingone_list_groups`, `pingone_get_group`, `pingone_create_group`, `pingone_update_group`, `pingone_delete_group` (`services/pingoneGroupClient.ts`, `actions/groups.ts`) |

### Remaining gaps (next: MFA expansion)

- ~~**AI Assistant + MCP**: Wire chatbot so answers include results and education (tool name, API, how it works).~~ ✅ Done — `/api/mcp/query` backend route, `mcpQueryService.ts` frontend service, `AIAssistant.tsx` wired with Live (MCP) toggle, `McpResultCard` in message bubbles, 3 MCP quick questions added.
- **MFA expansion (incremental)**: FIDO2 policies, OATH tokens, bypass, OTP validate — add as needed.
- **Deferred**: Streaming / audit logs (Phase 3).


---

## What not to do (for now)

- **No placeholders in MCP tools**: MCP tools must only perform real API calls. Do not return simulated or fake data (e.g. random risk scores). If a real PingOne API is not integrated, return a clear NOT_IMPLEMENTED or error. Mock flows and app UI may use mocks; the MCP server must not.
- **New repo / “mcp-pingone-server”**: The plan’s separate `mcp-pingone-server/` structure would duplicate our existing `pingone-mcp-server/`. Prefer **extending** the current server.
- **40 tools in one go**: Plan’s full catalog (40 tools, 4 weeks) is a long-range target. Prioritize **user**, **application**, and **OAuth/device + introspect** tools first.
- **Streaming / SSE**: Plan’s “Phase 3” streaming (audit logs, events) is advanced. Skip until core tools and error handling are solid.
- **Separate “PingOneAPIService” in app**: The plan’s service layer is a good pattern inside the MCP server; the **app** already has `server.js` and services. No need to re-architect the app for MCP.

---

## Recommended implementation order

### Phase A — Quick wins (1–2 days) ✅ **IMPLEMENTED**

1. **Standardized MCP errors** ✅  
   - **Files**: `pingone-mcp-server/src/services/mcpErrors.ts` — `ERROR_CODES`, `toMcpErrorPayload()`, `buildToolErrorResult()`.  
   - New tools (introspect, device auth) use it; existing tools can adopt for consistency.

2. **Token introspect tool** ✅  
   - **Tool**: `pingone_introspect_token` (token, optional environmentId, optional tokenTypeHint).  
   - **Files**: `pingone-mcp-server/src/services/pingoneIntrospectClient.ts`, `pingone-mcp-server/src/actions/introspect.ts`.  
   - Calls PingOne `/as/introspect` with credentials from storage/env.

3. **Device authorization tool** ✅  
   - **Tool**: `pingone_device_authorization` (optional environmentId, clientId, clientSecret, scope).  
   - **Files**: `pingone-mcp-server/src/services/pingoneDeviceAuthClient.ts`, `pingone-mcp-server/src/actions/deviceAuth.ts`.  
   - Calls PingOne `/as/device_authorization` with credentials from storage/env.

### Phase B — User & application tools (3–5 days) ✅ **IMPLEMENTED**

4. **User tools** ✅  
   - **Tool**: `pingone_get_user` (userId, optional environmentId, workerToken, clientId, clientSecret, region) — get user profile.  
   - **Tool**: `pingone_list_users` (optional environmentId, filter, limit, workerToken, clientId, clientSecret, region) — list users with optional SCIM filter.  
   - **Files**: `pingone-mcp-server/src/services/pingoneUserClient.ts`, `pingone-mcp-server/src/actions/users.ts`.  
   - Uses worker token (or client credentials from storage/env) with scope including `p1:read:user`.

5. **Application tools** ✅  
   - **Existing**: `pingone.applications.list` (environmentId, workerToken, clientId, clientSecret, limit, etc.) — already in `actions/worker.ts`.  
   - **Tool**: `pingone_get_application` (appId, optional environmentId, workerToken, clientId, clientSecret, region) — get single application by ID.  
   - **Files**: `pingone-mcp-server/src/services/pingoneManagementClient.ts` (getApplication), `pingone-mcp-server/src/actions/worker.ts` (tool registration).

### Phase 5 — User & directory tools (from server.js) ✅ **IMPLEMENTED**

6. **User groups, roles, lookup, populations** ✅  
   - **Tools**: `pingone_get_user_groups`, `pingone_get_user_roles`, `pingone_lookup_users`, `pingone_get_population`, `pingone_list_populations`.  
   - **Files**: `pingone-mcp-server/src/services/pingoneUserClient.ts` (getUserGroups, getUserRoles, lookupUsers, getPopulation, listPopulations), `pingone-mcp-server/src/actions/users.ts`.  
   - Uses worker token or client credentials; `lookupUsers` does UUID→direct GET or SCIM filter on username/email.

### Phase 6 — OIDC & application config tools ✅ **IMPLEMENTED**

7. **OIDC config, discovery, application resources** ✅  
   - **Tools**: `pingone_oidc_config` (environmentId, optional region — no auth), `pingone_oidc_discovery` (issuerUrl — no auth), `pingone_get_application_resources` (appId, worker token or client credentials).  
   - **Files**: `pingone-mcp-server/src/services/pingoneOidcClient.ts`, `pingone-mcp-server/src/actions/oidc.ts`, `pingone-mcp-server/src/services/pingoneManagementClient.ts` (getApplicationResources), `pingone-mcp-server/src/actions/worker.ts` (pingone_get_application_resources).  
   - OIDC tools usable without credentials for learning and config checks.

### Phase 7 — Password, risk, token & flow tools ✅ **IMPLEMENTED**

8. **Password, risk, token exchange, userinfo, flow check** ✅  
   - **Tools**: `pingone_password_state`, `pingone_password_send_recovery_code`, `pingone_risk_evaluation`, `pingone_token_exchange`, `pingone_userinfo`, `pingone_check_username_password`.  
   - **Files**: `pingone-mcp-server/src/services/pingonePasswordClient.ts`, `pingone-mcp-server/src/services/pingoneRiskClient.ts`, `pingone-mcp-server/src/services/pingoneTokenClient.ts`, `pingone-mcp-server/src/services/pingoneFlowClient.ts`, `pingone-mcp-server/src/actions/phase7.ts`.  
   - Password/recovery use worker token; risk tool returns NOT_IMPLEMENTED (no real API); token exchange POSTs to /as/token; userinfo accepts endpoint or environmentId; flow check POSTs to flow URL with credentials.

### Phase 9 — User CRUD, Application CRUD + Secrets, Group management ✅ **IMPLEMENTED**

9. **User CRUD + group membership** ✅  
   - **Tools**: `pingone_create_user`, `pingone_update_user`, `pingone_delete_user`, `pingone_add_user_to_group`, `pingone_remove_user_from_group`.  
   - **Files**: `services/pingoneUserClient.ts` (5 new functions), `actions/users.ts` (5 new tools).  
   - Create requires `username` + `population.id`; update is PATCH; delete is irreversible.  

10. **Application CRUD + secrets** ✅  
    - **Tools**: `pingone_create_application`, `pingone_update_application`, `pingone_delete_application`, `pingone_get_application_secret`, `pingone_rotate_application_secret`.  
    - **Files**: `services/pingoneManagementClient.ts` (5 new exported functions + helper), `actions/worker.ts` (5 new tools).  
    - Create requires `name` + `type`; secret rotation POSTs to `/applications/{appId}/secret`.  

11. **Group management** ✅  
    - **Tools**: `pingone_list_groups`, `pingone_get_group`, `pingone_create_group`, `pingone_update_group`, `pingone_delete_group`.  
    - **Files**: `services/pingoneGroupClient.ts` (new file), `actions/groups.ts` (new file), `index.ts` (registered).  
    - All tools accept worker token or auto-issue via client credentials; region-aware URLs.

---

### Phase C — Align with plan doc (ongoing) ✅ **IMPLEMENTED**

6. **Update MCP_SERVER_DEVELOPMENT_PLAN.md** ✅  
   - **Done:** “Current implementation” section that points to `pingone-mcp-server/` and lists implemented vs planned tools.  
   - Optionally add a “Next: Phase A/B” section so the plan stays the single source of truth.

7. **Optional: resource providers** ✅  
   - **Done:** `pingone://applications` resource in `pingone-mcp-server/src/services/pingoneResources.ts`; when read, returns applications list (credentials from storage/env).

---

## Suggested additional MCP tools (from server.js)

The following are **server.js** PingOne endpoints that do not yet have a corresponding MCP tool. Prioritized by learning value and reuse (user/app flows, OIDC, read-only where possible).

### High priority (user & directory)

| Suggested tool | server.js endpoint | Purpose |
|----------------|--------------------|--------|
| `pingone_get_user_groups` | `GET /api/pingone/user/:userId/groups` | Get groups for a user (worker token). |
| `pingone_get_user_roles` | `GET /api/pingone/user/:userId/roles` | Get roles for a user. |
| `pingone_lookup_users` | `POST /api/pingone/users/lookup` | Look up users by identifier (email/username) — complements `pingone_list_users` (filter). |
| `pingone_get_population` | `GET /api/pingone/population/:populationId` | Get population by ID (worker token). |
| `pingone_list_populations` | (add if needed) | List populations in environment — often needed with user tools. |

### High priority (OIDC & config)

| Suggested tool | server.js endpoint | Purpose |
|----------------|--------------------|--------|
| `pingone_oidc_config` | `GET /api/pingone/oidc-config` | Fetch OIDC discovery document (`.well-known/openid_configuration`) — no auth; good for learning and config checks. |
| `pingone_oidc_discovery` | `POST /api/pingone/oidc-discovery` | Discovery with custom URL/params if needed. |
| `pingone_get_application_resources` | `GET /api/pingone/applications/:appId/resources` | Get resource (scopes) configuration for an application. |

### Medium priority (password & risk)

| Suggested tool | server.js endpoint | Purpose |
|----------------|--------------------|--------|
| `pingone_password_state` | `GET /api/pingone/password/state` | Get password state for a user (recovery, force-change, etc.). |
| `pingone_password_send_recovery_code` | `POST /api/pingone/password/send-recovery-code` | Send password recovery code (admin or self-service). |
| `pingone_risk_evaluation` | `POST /api/pingone/risk-evaluations` | Run risk evaluation (e.g. for step-up). |

### Medium priority (token & flows)

| Suggested tool | server.js endpoint | Purpose |
|----------------|--------------------|--------|
| `pingone_token_exchange` | `POST /api/pingone/token` | Exchange auth code (or other grant) for tokens — complements auth tools. |
| `pingone_check_username_password` | `POST /api/pingone/flows/check-username-password` | Validate username/password in a flow context. |
| `pingone_userinfo` | `POST /api/pingone/userinfo` | Call UserInfo with token — overlap with `pingone.auth.userinfo`; align or document difference. |

### Lower priority (MFA expansion, subscriptions, licensing)

- **MFA:** server.js has many more MFA endpoints (device-authentication-policies, OATH tokens, FIDO2 policies, reports, bypass, OTP validate, etc.). Add MCP tools incrementally (e.g. `pingone_mfa_device_policies_list`, `pingone_mfa_oath_tokens`, `pingone_mfa_fido2_policies`) as needed for learning or automation.
- **Subscriptions:** `GET/POST/PUT/DELETE /api/pingone/subscriptions` — webhook/event subscriptions; add if the app or AI needs to manage them.
- **Licensing:** `POST /api/pingone/organization-licensing`, `POST /api/pingone/all-licenses` — add only if required for admin scenarios.
- **User consents:** `GET /api/pingone/user/:userId/consents` — useful for consent and compliance learning.

### Implementation notes

- Prefer **worker token** (or client credentials from storage) for Management API reads; use **access token** only when the API requires a user context (e.g. some password/risk endpoints).
- Reuse existing patterns: new client in `pingone-mcp-server/src/services/`, tool in `src/actions/`, `buildToolErrorResult` for errors, credentials from `credentialLoader` / env.
- For **AI Assistant + MCP** learning: each new tool should be easy to describe (tool name, HTTP method + path, 1–2 sentence “how it works”) so the chatbot can return results + education.

---

## AI Assistant (chatbot) + MCP integration — learning goal

**Objective:** Have the in-app **AI Assistant** (chatbot) use the PingOne MCP server to answer PingOne-related questions, so users can **learn about MCP and chat** in one place.

**User experience:** For prompts like *"Get all Applications"*, *"List my PingOne users"*, or *"Introspect this token"*, the assistant should return:

1. **Results** — The actual data (e.g. list of applications, users, or token introspection payload).
2. **Educational context** — So the user can learn:
   - **Which MCP tool** was used (e.g. `pingone.applications.list`, `pingone_list_users`, `pingone_introspect_token`).
   - **What API** was called under the hood (e.g. PingOne Management API `GET /environments/{envId}/applications`, `GET .../users`, `/as/introspect`).
   - **How it fits together** — MCP tool → backend/MCP server → PingOne API; credentials from storage/env; optional 1–2 sentence “how this works” for the flow.

**Requirements (to add when implementing):**

- **Only the results** are not enough — include the API call and education info so the user can learn.
- Prefer surfacing: tool name, HTTP method + path (or equivalent), and a short “What happened” / “How this works” blurb in the chat response.
- Keeps the chatbot as both a **query interface** and an **MCP + PingOne learning tool**.

**Implementation direction:** Either (a) have the app’s AI Assistant backend proxy or invoke the MCP server (or same tools via app backend) and format responses with result + education block, or (b) drive the Assistant via an AI that can call MCP tools and instruct it to always include the tool name and a brief educational summary in its reply. Document the chosen approach in this section when implemented.

---

## Summary

- **Done**: Phases A–C, 5–9 (errors, introspect, device auth, user/application tools, plan alignment, applications resource; worker token alias; MFA expansion; subscriptions; licensing; User CRUD; Application CRUD + secrets; Group management). 15 new write-capable tools added in Phase 9.
- **Do not**: Create a second MCP server repo or implement all 40 tools before validating the first batch.
- **Keep the plan**: Use [MCP_SERVER_DEVELOPMENT_PLAN.md](../MCP_SERVER_DEVELOPMENT_PLAN.md) as the roadmap and update it with a "Current implementation" and "Next steps" so it stays accurate.

**Next**: (1) **MFA expansion** — FIDO2 policies, OATH tokens (incremental). (2) Deferred: streaming, audit logs.

**AI Assistant + MCP** ✅ — Implemented: `/api/mcp/query` route in `server.js` (7 intent classifiers: list_applications, list_users, list_groups, list_populations, oidc_discovery, introspect_token, worker_token); `src/services/mcpQueryService.ts` for client-side invocation; `AIAssistant.tsx` updated with Live (MCP) toggle, `McpResultCard` displaying tool name + API method/path + explanation + live data count.
