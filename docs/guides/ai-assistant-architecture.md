# AIAssistant — Developer Architecture Guide

> **Purpose:** Comprehensive reference for reviewing, debugging, and extending the AIAssistant chat component. Covers dual-app structure, query dispatch, token management, MCP backend, Groq streaming, and all registered predicates.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dual-App Architecture](#2-dual-app-architecture)
3. [Component State & Storage](#3-component-state--storage)
4. [Query Dispatch — handleSend](#4-query-dispatch--handlesend)
5. [All Predicate Functions](#5-all-predicate-functions)
6. [LOCAL_PATTERNS — MCP Tool Routing](#6-local_patterns--mcp-tool-routing)
7. [Token Management](#7-token-management)
8. [MCP Backend Endpoints](#8-mcp-backend-endpoints)
9. [Groq Streaming Path](#9-groq-streaming-path)
10. [Brave Web Search Path](#10-brave-web-search-path)
11. [User Login via pi.flow](#11-user-login-via-piflow)
12. [Prompt Categories & Quick Questions](#12-prompt-categories--quick-questions)
13. [Session & Persistence Strategy](#13-session--persistence-strategy)
14. [Known Divergences — SidePanel vs Standalone](#14-known-divergences--sidepanel-vs-standalone)
15. [Update Checklist](#15-update-checklist)

---

## 1. Overview

The AIAssistant is a chat-based interface that routes natural-language queries to one of three destinations:

```
User query
    │
    ├─► Built-in handlers (client-side, instant)
    │       Token inspection, education, panel-open, etc.
    │
    ├─► /api/mcp/query  (backend → PingOne Management API)
    │       All live PingOne operations
    │
    └─► /api/groq/chat/stream  (backend → Groq LLM)
            General OAuth/OIDC Q&A, fallback
            + optional /api/mcp/web-search (Brave)
```

**Key design principle:** The backend classifies every MCP query independently using `classifyMcpIntent()` — the frontend `predictMcpTool()` mirrors it purely for optimistic UI display (shows the tool name while the network call is in flight).

---

## 2. Dual-App Architecture

There are **two physical copies** of the AIAssistant component and its services:

| Location                                     | Used by                                                        | Entry point               |
| -------------------------------------------- | -------------------------------------------------------------- | ------------------------- |
| `AIAssistant/src/components/AIAssistant.tsx` | Standalone page (`https://api.pingdemo.com:3000/ai-assistant`) | `AIAssistant/src/App.tsx` |
| `src/components/AIAssistantSidePanel.tsx`    | Embedded in main app header                                    | `src/App.tsx`             |

Both copies share the same **backend** (`server.js`) and have near-identical logic, but are **separate files** — a change to one does not propagate to the other automatically.

**Service copies:**

| Service file                   | Standalone path             | SidePanel path  |
| ------------------------------ | --------------------------- | --------------- |
| `mcpQueryService.ts`           | `AIAssistant/src/services/` | `src/services/` |
| `unifiedWorkerTokenService.ts` | `AIAssistant/src/services/` | `src/services/` |
| `aiAgentService.ts`            | `AIAssistant/src/services/` | `src/services/` |
| `groqService.ts`               | `AIAssistant/src/services/` | `src/services/` |

> **When editing predicates or MCP patterns**, update **both** `mcpQueryService.ts` copies.

---

## 3. Component State & Storage

### Key Constants (`AIAssistant.tsx`)

```typescript
const LS_MESSAGES_KEY = 'ai-assistant-messages'; // localStorage — chat history
const LS_TOGGLES_KEY = 'ai-assistant-toggles'; // localStorage — toggle states
const LS_USER_TOKEN_KEY = 'ai-assistant-user-token'; // localStorage — user JWT

const MESSAGE_TTL_MS = 30 * 60 * 1000; // 30-minute chat history TTL
const ADMIN_TOKEN_BUFFER_MS = 60_000; // proactive refresh 60s before admin token expiry
```

### React State Variables

| State                | Type                 | Purpose                                                          |
| -------------------- | -------------------- | ---------------------------------------------------------------- |
| `isOpen`             | bool                 | Chat panel visible                                               |
| `isExpanded`         | bool                 | Expanded (full-height) mode                                      |
| `isCollapsed`        | bool                 | Header-only collapsed mode                                       |
| `includeApiDocs`     | bool                 | Toggle: include API docs in Groq context                         |
| `includeSpecs`       | bool                 | Toggle: include OAuth/OIDC specs                                 |
| `includeWorkflows`   | bool                 | Toggle: include flow descriptions                                |
| `includeUserGuide`   | bool                 | Toggle: include user guide content                               |
| `includeWeb`         | bool (default: true) | Toggle: enable Brave web search                                  |
| `includeLive`        | bool (default: true) | Toggle: enable live PingOne MCP calls                            |
| `messages`           | array                | Chat messages (30-min TTL, from localStorage)                    |
| `input`              | string               | Current input field value                                        |
| `isTyping`           | bool                 | Shows typing indicator                                           |
| `adminToken`         | string               | Admin token from ROPC login                                      |
| `adminTokenExpiry`   | number               | Unix ms expiry for admin token                                   |
| `adminEnvironmentId` | string               | EnvId associated with admin token                                |
| `useAdminLogin`      | bool                 | When true, use admin token instead of worker token for MCP calls |
| `userAccessToken`    | string               | User OAuth access token (from pi.flow login)                     |
| `idToken`            | string               | User ID token (from pi.flow login)                               |
| `showUserTokenLogin` | bool                 | Show user login panel                                            |
| `showUserInfoLogin`  | bool                 | Show userinfo login panel                                        |
| `apiCallHistory`     | array                | Last 20 MCP call records (from sessionStorage)                   |
| `groqAvailable`      | bool                 | Backend has GROQ_API_KEY configured                              |
| `braveAvailable`     | bool                 | Backend has Brave Search API key                                 |
| `showPromptsGuide`   | bool                 | Prompt reference panel visible                                   |

### groqHistoryRef

`groqHistoryRef.current` is a **ref** (not state) holding up to 20 messages for multi-turn Groq context. It persists across renders without triggering re-renders.

```typescript
groqHistoryRef.current = groqHistoryRef.current.slice(-20);
```

---

## 4. Query Dispatch — `handleSend`

The `handleSend` function evaluates the user query through a priority-ordered sequence of predicate checks. **First match wins.**

```
handleSend(query)
    │
    ├─ 1.  isAdminLoginQuery       → open login panel (useAdminLogin=true)
    ├─ 2.  isUserLoginQuery        → open user-token login panel
    ├─ 3.  isShowMyTokenQuery      → decode userAccessToken (client-side JWT decode, no network)
    ├─ 4.  isShowIdTokenQuery      → decode idToken (client-side)
    ├─ 5.  isShowWorkerTokenQuery  → decode worker/admin token (client-side)
    ├─ 6.  isDecodeTokenQuery      → decode pasted JWT token (client-side)
    ├─ 7.  isShowApiCallsQuery     → show last 5 from apiCallHistory (client-side)
    ├─ 8.  isLastToolQuery         → show last 1 from apiCallHistory + howItWorks (client-side)
    ├─ 9.  isClearTokensQuery      → clear userAccessToken + idToken from state/localStorage
    ├─ 10. isAgentEducationQuery   → built-in answer (no network)
    ├─ 11. isMcpExplainQuery       → built-in answer (no network)
    ├─ 12. isMcpRolesQuery         → built-in answer (no network)
    ├─ 13. isThisAgentExplainQuery → built-in answer (no network)
    ├─ 14. isMcpToolExplainQuery   → built-in answer (no network)
    ├─ 15. isJsonRpcExplainQuery   → built-in answer (no network)
    ├─ 16. isGroqExplainQuery      → built-in answer (no network)
    ├─ 17. isMcpQuery && !includeLive
    │         → "turn on Live toggle" nudge (no network)
    ├─ 18. isIntrospectUserTokenQuery && includeLive && !userAccessToken
    │         → open user-token login panel
    ├─ 19. isUserInfoQuery && includeLive && !userAccessToken
    │         → open userinfo login panel
    ├─ 20. isWorkerTokenQuery
    │    || isHelpQuery
    │    || isListToolsQuery
    │    || (includeLive && isMcpQuery)
    │         → callMcpQuery()  →  POST /api/mcp/query
    │
    └─ 21. default
              → callGroqStream()  →  POST /api/groq/chat/stream
              + (if includeWeb or isWebSearchQuery) callMcpWebSearch()
```

### MCP result handling (step 20)

After `callMcpQuery()` returns, the result is stored in `apiCallHistory` (max 20, in sessionStorage):

```typescript
interface ApiCallRecord {
	id: string; // crypto.randomUUID()
	query: string; // original user query
	mcpTool: string | null; // e.g. "pingone_list_users"
	apiCall: { method: string; path: string } | null;
	howItWorks: string | null; // educational explanation
	data: unknown; // raw PingOne API response
	timestamp: Date;
}
```

---

## 5. All Predicate Functions

All defined in `mcpQueryService.ts`. Each returns `boolean`.

### Token & Panel Predicates

| Function                     | Trigger phrase examples                                        |
| ---------------------------- | -------------------------------------------------------------- |
| `isAdminLoginQuery`          | "admin login", "login as admin"                                |
| `isUserLoginQuery`           | "user login", "login as user", "get user token"                |
| `isShowMyTokenQuery`         | "show my token", "what's my access token"                      |
| `isShowIdTokenQuery`         | "show id token", "id token claims", "decode my id token"       |
| `isShowWorkerTokenQuery`     | "show worker token", "view admin token"                        |
| `isDecodeTokenQuery`         | "decode token eyJ…", any message containing a full JWT         |
| `isShowApiCallsQuery`        | "show api calls", "api call history", "recent api calls"       |
| `isLastToolQuery`            | "last mcp tool", "what was the last call", "inspect last call" |
| `isClearTokensQuery`         | "clear tokens", "forget my tokens"                             |
| `isIntrospectUserTokenQuery` | "introspect user token"                                        |
| `isUserInfoQuery`            | delegates to `predictMcpTool === 'pingone_userinfo'`           |
| `isWorkerTokenQuery`         | delegates to `predictMcpTool === 'pingone_get_worker_token'`   |
| `isHelpQuery`                | delegates to `predictMcpTool === 'ai_assistant_help'`          |
| `isListToolsQuery`           | delegates to `predictMcpTool === 'mcp_list_tools'`             |
| `isMcpQuery`                 | `predictMcpTool(query) !== null`                               |

### Education Predicates (built-in answers, no network)

| Function                  | Trigger phrase examples                                |
| ------------------------- | ------------------------------------------------------ |
| `isAgentEducationQuery`   | "what is an agent", "explain ai agent"                 |
| `isMcpExplainQuery`       | "what is MCP", "explain model context protocol"        |
| `isMcpRolesQuery`         | "mcp host client server", "explain three roles of mcp" |
| `isThisAgentExplainQuery` | "how does this agent work", "show agent architecture"  |
| `isMcpToolExplainQuery`   | "what is a tool call", "how do tool calls work"        |
| `isJsonRpcExplainQuery`   | "what is JSON-RPC", "explain json-rpc 2.0"             |
| `isGroqExplainQuery`      | "what is groq", "what llm does this use", "llama 70b"  |

### Web Search Predicate

| Function           | Trigger phrase examples                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `isWebSearchQuery` | "find the RFC for PKCE", "latest OIDC spec", "show me the documentation" |

When `isWebSearchQuery` returns true, Brave web search is triggered alongside (or instead of) Groq, even if the `includeWeb` toggle is off.

---

## 6. LOCAL_PATTERNS — MCP Tool Routing

`predictMcpTool(query)` iterates `LOCAL_PATTERNS` in order and returns the first match's `tool` string. **Order matters** — more specific patterns must come before broad ones.

```typescript
const LOCAL_PATTERNS: Array<{ pattern: RegExp; tool: string }> = [
```

| Priority | Regex (simplified)                                                    | MCP Tool string                     |
| -------- | --------------------------------------------------------------------- | ----------------------------------- |
| 1        | `admin login \| login as admin`                                       | `admin_login`                       |
| 2        | `worker.?token \| client.?credentials \| access.?token \| get.?token` | `pingone_get_worker_token`          |
| 3        | `list mcp tools \| list tools \| available tools \| mcp tools`        | `mcp_list_tools`                    |
| 4        | `^help$ \| what can you do \| how do i use \| how can.*help`          | `ai_assistant_help`                 |
| 5        | `list.*app \| show.*app \| all.*app`                                  | `pingone.applications.list`         |
| 6        | `app.*secret \| client secret \| show.*secret`                        | `pingone_get_application_secret`    |
| 7        | `rotate.*secret \| regenerate.*secret`                                | `pingone_rotate_application_secret` |
| 8        | `creat.*app \| add.*app \| new.*app \| register.*app`                 | `pingone_create_application`        |
| 9        | `delet.*app \| remov.*app`                                            | `pingone_delete_application`        |
| 10       | `get app \| find app \| app details`                                  | `pingone_get_application`           |
| 11       | `show org licenses \| org licenses \| licens \| capacity`             | `pingone_get_organization_licenses` |
| 12       | `list.*user \| show.*users \| all.*user`                              | `pingone_list_users`                |
| 13       | `creat.*user \| new.*user \| register.*user`                          | `pingone_create_user`               |
| 14       | `delet.*user \| remov.*user`                                          | `pingone_delete_user`               |
| 15       | `userinfo \| get userinfo \| user info \| user profile claim`         | `pingone_userinfo`                  |
| 16       | `get user \| find user \| look up user \| show user`                  | `pingone_get_user`                  |
| 17       | `user.*groups? \| groups?.*for.*user \| user.*member`                 | `pingone_get_user_groups`           |
| 18       | `add.*user.*group \| put.*user.*group \| assign.*user.*group`         | `pingone_add_user_to_group`         |
| 19       | `remov.*user.*group \| tak.*user.*out.*group`                         | `pingone_remove_user_from_group`    |
| 20       | `list.*group \| show.*groups \| all.*group`                           | `pingone_list_groups`               |
| 21       | `get group \| find group \| show group named`                         | `pingone_get_group`                 |
| 22       | `creat.*group \| add.*group \| new.*group`                            | `pingone_create_group`              |
| 23       | `delet.*group \| remov.*group`                                        | `pingone_delete_group`              |
| 24       | `list.*pop \| show.*pop \| all.*pop`                                  | `pingone_list_populations`          |
| 25       | `mfa.*device \| list.*device \| authenticat.*device`                  | `pingone.mfa.devices.list`          |
| 26       | `mfa.*polic \| polic.*mfa \| list.*mfa`                               | `pingone.mfa.policy.list`           |
| 27       | `list.*subscri \| show.*subscri \| webhooks?`                         | `pingone_list_subscriptions`        |
| 28       | `creat.*subscri \| add.*subscri \| register.*webhook`                 | `pingone_create_subscription`       |
| 29       | `delet.*subscri \| remov.*subscri \| delete.*webhook`                 | `pingone_delete_subscription`       |
| 30       | `risk.*eval \| eval.*risk \| risk.*score`                             | `pingone_risk_evaluation`           |
| 31       | `oidc \| openid \| discovery \| .well-known \| issuer`                | `pingone_oidc_config`               |
| 32       | `introspect \| inspect.*token \| token.*info \| validate.*token`      | `pingone_introspect_token`          |

> **Note:** Patterns 3 and 4 (list tools, help) are duplicated at the bottom of the array as a safety net for some edge-case queries.

---

## 7. Token Management

### Three Token Types

| Token            | Holder                                           | Source                                                        | Used for                                                  |
| ---------------- | ------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------- |
| **Worker token** | Backend in-memory cache (`_mcpTokenCache`)       | Client Credentials flow via PingOne `/as/token`               | All Management API calls from `/api/mcp/query`            |
| **Admin token**  | Component state `adminToken`                     | ROPC via `/api/mcp/user-token-via-login` (admin mode)         | Optional override for MCP calls when `useAdminLogin=true` |
| **User token**   | Component state `userAccessToken` + localStorage | pi.flow (Authorization Code + `response_type=token id_token`) | `isIntrospectUserTokenQuery`, `isUserInfoQuery`           |

### Worker Token Resolution in `/api/mcp/query`

Priority order when resolving bearer token for PingOne API calls:

```
1. req.body.workerToken     (passed from frontend when useAdminLogin=true)
2. process.env.PINGONE_WORKER_TOKEN
3. _mcpTokenCache (if not expired)
```

### Admin Token Refresh

When `useAdminLogin=true` and `adminTokenExpiry - Date.now() < ADMIN_TOKEN_BUFFER_MS (60s)`, the component auto-refreshes the admin token by re-triggering `callUserTokenViaLogin`.

### User Token Lifecycle

```
User types "user login"
    → isUserLoginQuery → setShowUserTokenLogin(true)
         UserLoginContent handles:
             1. POST /api/pingone/redirectless/authorize  → flowId
             2. POST /api/pingone/flows/check-username-password  → success
             3. POST /api/pingone/resume  → { access_token, id_token }
                (response_type=token id_token, pi.flow — tokens returned directly)
         → setUserAccessToken(access_token)
         → setIdToken(id_token)
         → localStorage[LS_USER_TOKEN_KEY] = { access_token, id_token, expiry }
```

---

## 8. MCP Backend Endpoints

All defined in `server.js`.

### `POST /api/mcp/query`

**The primary endpoint.** Handles all PingOne live operations.

**Request body:**

```json
{
	"query": "string (required)",
	"workerToken": "string (optional — overrides cached token)",
	"environmentId": "string (optional — overrides env var)",
	"region": "string (optional — us/eu/ca/ap)",
	"userAccessToken": "string (optional — for userinfo intent)"
}
```

**Response: `McpQueryResult`**

```json
{
	"success": true,
	"answer": "Found 3 applications in environment abc-123.",
	"mcpTool": "pingone.applications.list",
	"apiCall": { "method": "GET", "path": "/environments/{envId}/applications" },
	"howItWorks": "One-paragraph educational explanation...",
	"data": [
		/* raw PingOne API response */
	],
	"credentialsRequired": false
}
```

**Intent dispatch order inside the handler:**

1. `list_tools` — reads `MCP_TOOL_NAMES_FILE`, no credentials needed
2. `help` — built-in text, no credentials needed
3. `worker_token` — fetches token via client credentials, caches in `_mcpTokenCache`
4. `userinfo` — requires `userAccessToken` in body (not worker token)
5. `oidc_discovery` — no token needed, fetches `.well-known/openid-configuration`
6. **All other intents** — require `envId` + `token`; dispatch to `mcpCallPingOne()`

**Live operations dispatched (after credential check):**

| Intent ID                | PingOne API call                                                 |
| ------------------------ | ---------------------------------------------------------------- |
| `list_applications`      | `GET /applications?limit=100` + client-side filter               |
| `list_users`             | `GET /users?limit=N&filter=...` (SCIM)                           |
| `get_user`               | `GET /users/{uuid}` or SCIM filter                               |
| `get_user_groups`        | `GET /users/{uuid}/memberOfGroups`                               |
| `list_groups`            | `GET /groups?limit=N&filter=...`                                 |
| `get_group`              | `GET /groups/{uuid}` or SCIM name filter                         |
| `list_populations`       | `GET /populations?limit=N`                                       |
| `get_application`        | `GET /applications?limit=50` + client-side name filter           |
| `get_application_secret` | `GET /applications/{uuid}/secret`                                |
| `list_mfa_policies`      | `GET /deviceAuthenticationPolicies`                              |
| `list_mfa_devices`       | `GET /users/{uuid}/devices`                                      |
| `list_subscriptions`     | `GET /subscriptions`                                             |
| `org_licenses`           | `GET /organizations/{orgId}/licenses` (via `mcpCallOrgLicenses`) |
| `create_user`            | First `GET /populations?limit=10`, then `POST /users`            |
| `delete_user`            | SCIM lookup if no UUID, then `DELETE /users/{uuid}`              |
| `create_group`           | `POST /groups`                                                   |
| `delete_group`           | SCIM lookup if no UUID, then `DELETE /groups/{uuid}`             |
| `add_user_to_group`      | UUID or name lookup, then `POST /users/{userId}/memberOfGroups`  |
| `remove_user_from_group` | `DELETE /users/{userId}/memberOfGroups/{groupId}`                |
| `introspect_token`       | `POST /as/introspect`                                            |
| `rotate_secret`          | `POST /applications/{uuid}/secret`                               |
| `risk_evaluation`        | `POST /riskEvaluations`                                          |

---

### `POST /api/mcp/web-search`

Brave Search proxy.

**Request:** `{ "query": "search string" }`

**Flow:**

1. Reads Brave API key via `GET /api/api-key/brave-search`
2. Calls `https://api.search.brave.com/res/v1/web/search?q=...&count=5`
3. Returns top 5 results as `{ title, content, url }[]`

**Response:** Standard `McpQueryResult` with `mcpTool: "brave_web_search"`.

---

### `POST /api/mcp/userinfo-via-login`

Runs a complete pi.flow Authorization Code login then calls OIDC UserInfo.

**Request:**

```json
{
	"environmentId": "...",
	"clientId": "...",
	"clientSecret": "...",
	"username": "user@example.com",
	"password": "...",
	"region": "us"
}
```

**5-step internal flow:**

1. `POST /api/pingone/redirectless/authorize` → flowId + sessionId + resumeUrl
2. `POST /api/pingone/flows/check-username-password` → validates credentials
3. `POST /api/pingone/resume` → authorization code
4. `POST https://auth.pingone.com/{envId}/as/token` → access_token
5. `userInfoViaMcpServer({ environmentId, accessToken, region })` → OIDC claims

> **⚠️ Note:** This endpoint still uses the PKCE + auth code path (4-step code exchange), unlike the UIAssistant's `UserLoginContent` which uses `response_type=token id_token` with pi.flow for direct token return. If you change the flow type, update this endpoint too.

---

### `POST /api/mcp/user-token-via-login`

Same 4-step PKCE + code exchange flow as `userinfo-via-login`, but returns only the tokens:

**Response:**

```json
{
	"success": true,
	"access_token": "...",
	"id_token": "...",
	"expires_in": 3600,
	"token_type": "Bearer"
}
```

---

### MCP Server Management Endpoints

These endpoints control the separate MCP stdio server process:

| Endpoint                           | Purpose                        |
| ---------------------------------- | ------------------------------ |
| `POST /api/mcp/server/build`       | Build the MCP server bundle    |
| `POST /api/mcp/server/start`       | Start the MCP server process   |
| `POST /api/mcp/server/stop`        | Stop the MCP server process    |
| `POST /api/mcp/server/credentials` | Push credentials to MCP server |
| `POST /api/mcp/server/add-tool`    | Register a new dynamic tool    |

---

## 9. Groq Streaming Path

When no predicate matches (default branch in `handleSend`), the query goes to Groq.

### Service: `groqService.ts`

```typescript
// Non-streaming (fallback)
callGroq(userMessage, history, opts?)
  → POST /api/groq/chat
  → Returns { content, model, usage, notConfigured?, error? }

// Streaming (primary)
callGroqStream(userMessage, history, onToken, onDone, onError, opts?)
  → POST /api/groq/chat/stream
  → SSE: data: {"token": "..."} ... data: [DONE]
  → Falls back to callGroq() if streaming not supported
```

**History management:** `groqHistoryRef.current` holds up to 20 `{role, content}` pairs. On each Groq call, the new user message is appended after the call, and the array is trimmed to 20.

**`includeLive` option:** When `includeLive=true`, the backend injects a system prompt that acknowledges live PingOne data is available. When false, it adds a nudge to turn on the Live toggle.

### Fallback chain

```
callGroqStream()
    │
    ├─ HTTP 503 → onError("groq_not_configured")
    │                 → aiAgentService.getAnswer(query) (local KB)
    │
    ├─ HTTP error / no body → callGroq() (non-streaming)
    │
    └─ Stream → onToken callbacks → onDone

aiAgentService.getAnswer(query)
    → Searches local capability index (flows, features, docs, specs, workflows)
    → Scores by keyword match → returns top hits
    → Last-resort: generic OAuth/OIDC education text
```

### Post-Groq web search

After Groq finishes, if `includeWeb=true` OR `isWebSearchQuery(query)` returns true:

```typescript
callMcpWebSearch(query) → POST /api/mcp/web-search
```

Results are appended below the Groq response as a "Web Results" section.

---

## 10. Brave Web Search Path

The web search is a **supplemental** data source, not a primary answer path.

**When triggered:**

- Always: `includeWeb` toggle is on AND Groq has been called
- Always: `isWebSearchQuery(query)` returns true (regardless of `includeWeb` toggle)

**`isWebSearchQuery` matching patterns:**

```typescript
/\bspec(?:ification)?s?\b/i
/\brfc\s*\d*/i
/\bstandard(?:s)?\b/i
/\bdraft\b/i
/\bdocumentation?\b/i
/\bdocs?\b/i
/\bsearch\s+(?:for|the)\b/i
/\blatest\s+version\b/i
/\bfind\s+(?:the\s+)?(?:article|page|link|resource|example|tutorial)\b/i
/\bshow\s+me\s+(?:the\s+)?(?:spec|rfc|standard|doc|link|page|article)\b/i
/\bwhere\s+(?:can\s+i|to)\s+(?:find|read|get|see)\b/i
/\blink\s+to\b/i
/\bhow\s+does.*work.*?\b(?:spec|standard|rfc|protocol)\b/i
```

---

## 11. User Login via pi.flow

The `UserLoginContent` subcomponent (inside AIAssistantSidePanel.tsx) handles both modes:

### Standard User Login

```
POST /api/pingone/redirectless/authorize
  body: { environmentId, clientId (authz client), clientSecret, nonce, response_type="token id_token", region }
  → { id: flowId, _sessionId, resumeUrl }

POST /api/pingone/flows/check-username-password
  body: { flowUrl, username, password, sessionId, clientId, clientSecret }
  → 200 OK (no body)

POST /api/pingone/resume
  body: { resumeUrl, flowId, clientId, clientSecret, flowState, sessionId }
  → { access_token, id_token, expires_in, scope }  ← tokens directly, no code exchange
```

**Client IDs used:**

- **Authz client** (`authzClientId` from credentials): preferred — used when no override is set in the UI
- **Fallback to worker client** (`clientId` from credentials): used when authzClientId is not configured

Warning banner is shown in the UI when no `authzClientId` is configured.

### Admin Login Mode

Same flow but `useAdminLogin=true` is set. The resulting `access_token` is stored as `adminToken` (not `userAccessToken`). Admin token is then passed as `workerToken` in `callMcpQuery()` calls.

---

## 12. Prompt Categories & Quick Questions

The prompt guide panel shows **11 categories**:

| Category           | Representative Prompts                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔑 Auth            | Get worker token, Admin login, User login, List MCP tools                                                                                                                       |
| 📱 Applications    | Show all apps, Find app named X, Create app, Delete app, Get app secret, Rotate secret                                                                                          |
| 👤 Users           | List all users, Find user john@acme.com, Create user, Delete user                                                                                                               |
| 👥 Groups          | List groups, Find group named Admins, Create group, Delete group, What groups is user X in?, Add/Remove user from group                                                         |
| 🏘️ Populations     | List populations                                                                                                                                                                |
| 🔐 MFA             | List MFA policies, List MFA devices for user X                                                                                                                                  |
| 📡 Webhooks        | List subscriptions, Delete subscription X                                                                                                                                       |
| ℹ️ Info            | Show org licenses, Get OIDC discovery, Introspect token, Introspect user token, Get userinfo, Evaluate risk                                                                     |
| 🔍 Token Inspector | Show my token, Show id token, Show worker token, Decode token, Show api calls, Last MCP tool, Inspect last call, Clear tokens                                                   |
| 🤖 Agent & MCP     | What is an agent?, What is MCP?, Explain host/client/server, How does this agent work?, Show agent architecture, What is a tool call?, What is JSON-RPC?, How does Groq fit in? |
| ❓ Help            | What can I do in chat?, What is PKCE?, OAuth vs OIDC difference                                                                                                                 |

### Quick Questions (empty state chips)

```
List MCP tools | Get worker token | Admin login | Show all apps | List all users |
List groups | List populations | List MFA policies | List subscriptions |
Show org licenses | Get OIDC discovery document | Last MCP tool |
What is MCP? | How does this agent work? | What can I do in chat? |
What is PKCE? | What's the difference between OAuth and OIDC?
```

---

## 13. Session & Persistence Strategy

| Data                                 | Storage                             | TTL                            | Key                       |
| ------------------------------------ | ----------------------------------- | ------------------------------ | ------------------------- |
| Chat messages                        | `localStorage`                      | 30 min (enforced on load)      | `ai-assistant-messages`   |
| Toggle states (includeApiDocs, etc.) | `localStorage`                      | Permanent                      | `ai-assistant-toggles`    |
| User access token + id token         | `localStorage`                      | Token expiry or explicit clear | `ai-assistant-user-token` |
| API call history (last 20)           | `sessionStorage`                    | Session only                   | `ai-assistant-api-calls`  |
| Groq conversation history            | Component ref (`groqHistoryRef`)    | Component lifetime             | N/A                       |
| Worker token                         | Server in-memory (`_mcpTokenCache`) | 60s before JWT expiry          | N/A                       |
| Admin token                          | Component state                     | Token expiry − 60s             | N/A                       |

---

## 14. Known Divergences — SidePanel vs Standalone

| Concern               | SidePanel (`AIAssistantSidePanel.tsx`)                            | Standalone (`AIAssistant.tsx`)                         |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| **User login flow**   | Uses `authzClientId` (preferred) with pi.flow direct token return | Same pattern — check if authz client logic was ported  |
| **Service file path** | `src/services/mcpQueryService.ts`                                 | `AIAssistant/src/services/mcpQueryService.ts`          |
| **Backend URL**       | Relative (same origin)                                            | Relative (same origin, proxied via Vite)               |
| **Entry point**       | Rendered via `<AIAssistantSidePanel />` in main App               | `AIAssistant/src/App.tsx` → `<AIAssistant fullPage />` |
| **OAuthLoginPanel**   | Not present — uses inline `UserLoginContent`                      | Has separate `OAuthLoginPanel.tsx` component           |

### Items to check when making changes

1. `mcpQueryService.ts` predicates or `LOCAL_PATTERNS` — **update both copies**
2. New intent in `handleSend` — **update both components**
3. `UnifiedWorkerTokenCredentials` interface changed — **update both service copies**

---

## 15. Update Checklist

When adding a **new PingOne operation** to the assistant:

- [ ] Add regex pattern to `LOCAL_PATTERNS` in **both** `mcpQueryService.ts` copies
- [ ] Add corresponding `intent` entry in `MCP_INTENTS` array in `server.js` (or `classifyMcpIntent`)
- [ ] Add dispatch branch in `handleSend` if it needs special pre/post handling
- [ ] Add live API call handler inside `/api/mcp/query` in `server.js`
- [ ] Add prompt to the relevant `promptCategories` entry in **both** components
- [ ] Add to `quickQuestions` if it's a common starting point

When adding a **new education/info predicate**:

- [ ] Add predicate function to **both** `mcpQueryService.ts` copies (export it)
- [ ] Import the new function in **both** component files
- [ ] Add dispatch branch in `handleSend` before the default Groq fallback
- [ ] Add example prompt to the `🤖 Agent & MCP` or `❓ Help` category

When adding a **new backend endpoint**:

- [ ] Add route to `server.js`
- [ ] Add corresponding client function to **both** `mcpQueryService.ts` copies (if called from frontend)

---

_Last updated: based on commit `8ab317efa` — "feat(user-login): pi.flow with token id_token, authz client, token-exchange endpoint"_
