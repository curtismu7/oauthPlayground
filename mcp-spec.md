# MCP Server Specification Evaluation

**Document**: Evaluation of `pingone-mcp-server` against the Model Context Protocol specification  
**Spec reference**: [Model Context Protocol 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) (latest)  
**Spec source repo**: [modelcontextprotocol/modelcontextprotocol](https://github.com/modelcontextprotocol/modelcontextprotocol)  
**Date**: March 2026  
**Server**: `pingone-mcp-server/` (PingOne identity APIs via MCP)

---

## Executive summary

The **pingone-mcp-server** implements the Model Context Protocol and conforms to the core requirements of the MCP specification. It uses the official `@modelcontextprotocol/sdk`, exposes tools and resources via JSON-RPC 2.0 over stdio, and follows the expected patterns for tool definitions, error reporting, and resource access. Optional features listChanged, cancellation, and pagination are supported or documented.

| Area              | Status | Notes                                                                 |
|-------------------|--------|-----------------------------------------------------------------------|
| Base protocol     | ✅     | JSON-RPC 2.0, stdio transport, capability negotiation via SDK         |
| Tools             | ✅     | 70+ tools with name, description, inputSchema; tools/call, tools/list |
| Resources         | ✅     | `pingone://applications` resource; list/read supported                 |
| listChanged       | ✅     | tools and resources listChanged capabilities; debounced notifications |
| Cancellation      | ✅     | AbortSignal passed to API clients (user tools); SDK integration ready  |
| Pagination        | ⚠️     | tools/list returns all (~70); cursor pagination optional per spec      |
| Prompts           | ⚠️     | Training prompts exist; spec prompts feature not formally declared    |
| Error handling    | ✅     | Protocol errors + tool execution errors with `isError` pattern        |
| Security          | ✅     | Worker token fully backend-only; PKCE for user login; SCIM escaping applied |
| OAuth for MCP     | ⚠️     | MCP spec 2025-11-25 defines OAuth 2.0 auth for servers; not yet evaluated |

---

## 1. Base protocol

### 1.1 Architecture

**Spec**: MCP uses JSON-RPC 2.0 messages between servers, clients, and hosts. Servers provide context and capabilities; clients connect within host applications. See [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25).

**Evaluation**:
- ✅ Server uses `@modelcontextprotocol/sdk` (`McpServer`, `StdioServerTransport`).
- ✅ Stdio transport matches MCP’s common deployment model (e.g. MCP Inspector).
- ✅ Server name and version: `pingone-mcp-server` / `0.1.0` (`index.ts`).

### 1.2 Transport and lifecycle

**Spec**: Stateful connections; server runs until shutdown.

**Evaluation**:
- ✅ `server.connect(transport)` establishes the connection.
- ✅ `process.on('SIGINT')` closes the server cleanly.
- ✅ Runs as a long-lived stdio process, suitable for Inspector and other MCP clients.

---

## 2. Tools

### 2.1 Capability declaration

**Spec**: Servers that support tools MUST declare the `tools` capability. Optional `listChanged` indicates whether the server notifies when the tool list changes.

**Evaluation**:
- ✅ SDK handles capability negotiation; tools are registered via `server.registerTool()`.
- ✅ `listChanged` is configured via capabilities and `debouncedNotificationMethods`; tools and resources emit list_changed when registered.

### 2.2 Tool definition

**Spec**: Each tool has:
- `name`: Unique identifier
- `description`: Human-readable description
- `inputSchema`: JSON Schema (or equivalent) for parameters

**Evaluation**:
- ✅ Tools use unique, stable names (e.g. `pingone_get_user`, `pingone_list_users`).
- ✅ Descriptions are present and describe behavior and auth (worker token, client credentials).
- ✅ Input schemas are defined with Zod and used for validation before calling PingOne APIs.

Example from `actions/users.ts`:

```typescript
server.registerTool(
  'pingone_get_user',
  {
    description: 'Get a PingOne user profile by ID. Uses worker token or client credentials from storage/env.',
    inputSchema: getUserInputShape,
    outputSchema: getUserOutputShape,
  },
  async (args) => { ... }
);
```

### 2.3 Tool invocation (tools/call)

**Spec**: Clients send `tools/call` with `name` and `arguments`. Servers return `content` (array of items) and optionally `isError`.

**Evaluation**:
- ✅ Handlers return `{ content: [{ type: 'text', text: string }], structuredContent?: ... }`.
- ✅ On failure, `buildToolErrorResult()` returns structured error content with `success: false`.
- ✅ SDK maps this to the MCP response format, including `isError` where appropriate.

### 2.4 Error handling

**Spec**: Two error types:
1. Protocol errors (JSON-RPC) for invalid args, unknown tools, server errors.
2. Tool execution errors in the result with `isError: true` for business logic / API failures.

**Evaluation**:
- ✅ Protocol-level issues (e.g. validation) are handled by Zod and SDK.
- ✅ Tool errors use `buildToolErrorResult()` in `services/mcpErrors.ts`, producing consistent content and `structuredContent`.
- ✅ Error payloads include `code` and `message`.

### 2.5 Security (tools)

**Spec**: Servers MUST sanitize outputs, rate limit, enforce access control, and validate inputs.

**Evaluation**:
- ✅ Zod schemas validate all tool inputs in the `pingone-mcp-server` stdio server.
- ✅ Credentials for the MCP stdio server come from `credentialLoader` (file/env), not from tool params.
- ✅ Outputs are JSON or plain text; no arbitrary HTML or scripts.
- ✅ SCIM filter values built from natural-language queries are escaped with `_scimEscape()` before sending to PingOne (prevents `"` / `\` injection in filter strings).
- ⚠️ The `/api/mcp/query` relay endpoint (separate from the stdio MCP server) accepts an optional `workerToken` in the POST body. This is intentional — it allows the AI Assistant's admin-login flow to forward a user-supplied token. See [Section 9](#9-backend-relay-pattern-and-token-security) for the full token security model.
- ⚠️ No explicit rate limiting in the server; host / network may provide limits.

---

## 3. Resources

### 3.1 Capability

**Spec**: Servers that support resources MUST declare the `resources` capability. Optional `subscribe` and `listChanged` for change notifications.

**Evaluation**:
- ✅ `registerPingOneResources()` registers `pingone://applications` via `server.resource()`.
- ✅ SDK handles capability negotiation for resources.

### 3.2 Resource definition

**Spec**: Resources have `uri`, optional `name`, `description`, `mimeType`.

**Evaluation**:
- ✅ Uses custom scheme `pingone://applications`.
- ✅ Title and description provided.
- ✅ Read returns `contents` with `uri`, `type: 'text'`, and `text`.

### 3.3 Resource read

**Spec**: Clients use `resources/read` with `uri`; server returns `contents`.

**Evaluation**:
- ✅ Dynamic content is fetched from PingOne API when the resource is read.
- ✅ Errors are returned as JSON in the text content, not as protocol errors (acceptable for this use case).

---

## 4. Prompts

### 4.1 Spec

**Spec**: Servers may offer prompts (templated messages/workflows). Clients use `prompts/list` and `prompts/get`.

**Evaluation**:
- ✅ Training module (`registerTrainingModule`) provides lesson and practice prompts.
- ⚠️ Documentation does not clearly map these to the spec `prompts` feature; behavior is consistent with “templated prompts” if exposed via the SDK.

---

## 5. Utilities and other features

### 5.1 Logging

**Spec**: MCP defines logging utilities.

**Evaluation**:
- ✅ `Logger` in `services/logger.js` is used for tool and resource activity.
- ✅ Logs go to `logs/mcp-server.log` when run via `run.sh`.

### 5.2 Cancellation and progress

**Spec**: Optional cancellation and progress tracking.

**Evaluation**:
- ✅ Cancellation: Tool handlers accept `(args, extra)`; when the SDK provides `extra.signal` (AbortSignal), it is passed to PingOne API calls (e.g. axios) so in-flight requests can be aborted on `notifications/cancelled`.

### 5.3 Pagination

**Spec**: `tools/list` and `resources/list` support optional pagination via `cursor` and `nextCursor`.

**Evaluation**:
- ✅ Pagination: tools/list returns all tools in one response (~70 tools); spec makes pagination optional. SDK does not support cursor in its default handlers; current usage is acceptable. Future: custom handlers could add cursor-based slicing if needed.

---

## 6. Security and trust

### 6.1 User consent

**Spec**: Implementors should provide clear UIs for authorizing activities; users must retain control and explicitly consent.

**Evaluation**:
- ✅ Credentials are provided by the user (Worker Token modal, `mcp-config.json`).
- ✅ Tools execute only after the host (e.g. AI Assistant) has been given access; the host can enforce confirmation.

### 6.2 Data privacy

**Spec**: User data should be protected; hosts must not transmit resource data without consent.

**Evaluation**:
- ✅ Worker-token credentials (clientId, clientSecret) stored server-side in `~/.pingone-playground/credentials/mcp-config.json` (local) and in process env. Never exposed to the frontend.
- ✅ The worker `access_token` is cached in server memory (`_mcpTokenCache`) and is **never returned to the frontend**. Only metadata (expiresIn, scope, tokenType) is sent to the UI.
- ✅ Tool calls use env/storage credentials for management-API calls; no client_credentials leakage via tool params.
- ⚠️ User (end-user) access tokens and ID tokens obtained via the **PKCE + redirectless login** flow (`/api/mcp/user-token-via-login`) are returned to the frontend **by design**. This is required for the playground's educational purpose: users can view, decode, and introspect their own tokens. Both the access token and ID token are stored in `localStorage` under `ai-assistant-user-token` so they persist across page refreshes. This is an explicit, intentional trade-off for the playground's educational use case — **never do this in production**.
- ✅ Host application controls when and how MCP is used.

### 6.3 Tool safety

**Spec**: Tools are arbitrary code execution; users should understand behavior; hosts should obtain consent before invocation.

**Evaluation**:
- ✅ Tools perform defined PingOne API operations; no arbitrary code execution.
- ✅ Descriptions describe what each tool does.
- ✅ Host (AI Assistant, Inspector) can show tool name and params before execution.

---

## 7. Conformance checklist

| Requirement                                        | Status |
|----------------------------------------------------|--------|
| JSON-RPC 2.0 message format                        | ✅     |
| Server identifies with name and version            | ✅     |
| Tools capability declared                          | ✅     |
| Tools have name, description, inputSchema          | ✅     |
| tools/list returns tool definitions                | ✅     |
| tools/call invokes tools with validated args       | ✅     |
| Tool results use content array                     | ✅     |
| Tool errors reported (content + isError/structured)| ✅     |
| Resources capability declared                      | ✅     |
| resources/list returns resource metadata           | ✅     |
| resources/read returns contents                    | ✅     |
| Input validation on all tools                      | ✅     |
| No credential leakage via tool params             | ✅     |
| Graceful shutdown on SIGINT                        | ✅     |

---

## 8. Gaps and recommendations

### 8.1 Gaps (non-blocking)

1. **listChanged notifications** – ✅ Implemented. Capabilities advertise `tools.listChanged` and `resources.listChanged`; debouncing coalesces rapid notifications.
2. **Pagination** – tools/list returns all tools at once; acceptable for ~70 tools; SDK limitation for cursor-based pagination.
3. **Resource subscriptions** – `resources/subscribe` not implemented; applications resource is read-on-demand.
4. **Cancellation** – ✅ Implemented. Tool handlers pass `extra?.signal` to API clients (axios); when client sends `notifications/cancelled`, in-flight requests abort.
5. **Prompts feature** – Training prompts exist; formal declaration and alignment with spec prompts could be clarified.
6. **OAuth 2.0 for MCP servers (2025-11-25)** – The MCP spec 2025-11-25 defines an [OAuth 2.0 authorization framework](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) for MCP servers used in multi-tenant contexts. The `pingone-mcp-server` currently uses stdio (not HTTP SSE), so this section is not applicable unless the server is later exposed as an HTTP MCP endpoint. Track for future HTTP transport migration.
7. **Rate limiting** – No per-tool or per-session rate limiting. Acceptable for local playground; add before any public deployment.

### 8.2 Recommendations

1. **Document SDK version** – Pin `@modelcontextprotocol/sdk` and note compatibility in README.
2. **Rate limiting** – Add optional per-tool or per-session rate limiting for production.
3. **Structured output** – `structuredContent` is used; consider documenting it as a stable contract for AI clients.
4. **Spec alignment** – If adopting HTTP transport (e.g. for remote MCP access), implement the MCP OAuth 2.0 authorization framework from spec 2025-11-25 with PingOne as the authorization server.
5. **Automated validation** – Run `npm run mcp:validate` (or `pnpm vitest run tests/backend/mcp-spec-validation.test.js`) to verify the server responds to initialize and tools/list per MCP spec. Validates tool structure (name, description, inputSchema).

---

## 9. Backend relay pattern and token security

The `pingone-mcp-server` (stdio) and the `/api/mcp/query` backend relay endpoint are two distinct components. The spec evaluation above covers the **stdio MCP server**. This section documents the security model of the **relay endpoint**, which is what the AI Assistant uses.

### 9.1 Architecture

```
Browser (AI Assistant)
    │  POST /api/mcp/query { query, workerToken?, environmentId?, tokenToIntrospect? }
    ▼
server.js  (/api/mcp/query handler)
    │  Uses backend-stored clientId + clientSecret (mcp-config.json / env)
    │  Uses server-side worker token cache (_mcpTokenCache)
    ▼
PingOne Management API / Auth API
```

### 9.2 Token security by flow

| Token type | Where obtained | Sent to frontend? | Persisted? | Notes |
|---|---|---|---|---|
| Worker token (`access_token`) | Backend — `client_credentials` grant using stored `clientSecret` | **No** — only metadata (expiresIn, scope, tokenType) | Server memory only (`_mcpTokenCache`) | Fully backend-side. Client cannot obtain the raw access_token. |
| Admin token (user logs in via Admin Login panel) | Backend — PKCE + PingOne redirectless flow via `/api/mcp/user-token-via-login` | **Yes** — returned to frontend for display/introspection | React state + `localStorage` (`ai-assistant-user-token`) | **Educational only** — playground intentionally exposes token for learning. |
| ID token (`id_token`) | Same flow as admin/user token — included in the authorization code exchange response | **Yes** — returned alongside `access_token` | React state + `localStorage` (`ai-assistant-user-token`) | **Educational only** — allows users to decode and inspect OIDC identity claims. Never store ID tokens in localStorage in production. |
| User token introspection | **Frontend sends stored token** back to `/api/mcp/query` as `tokenToIntrospect` | N/A — backend uses it to call PingOne introspect; raw introspect result returned | Never stored server-side | Backend uses its own `clientId`/`clientSecret` (from mcp-config.json) for the introspection call. |

### 9.3 PKCE + redirectless flow for admin/user login

The admin/user login panels in the AI Assistant (`/api/mcp/user-token-via-login`, `/api/mcp/userinfo-via-login`) use **Authorization Code + PKCE** combined with PingOne's redirectless (pi.flow) API:

1. Backend generates `codeVerifier` / `codeChallenge` (PKCE S256).
2. Backend initiates PingOne redirectless authorize (pi.flow).
3. Backend submits username/password to the PingOne flow API endpoint.
4. Backend receives the authorization code via the resume endpoint.
5. Backend exchanges the code for tokens using PKCE (no `client_secret` in the PKCE exchange itself when the app is public, or with `client_secret` for confidential apps).

This is **not** ROPC (Resource Owner Password Credentials). PKCE is used, preventing authorization code injection attacks.

### 9.4 SCIM filter injection mitigation

All SCIM filter values derived from natural-language queries are passed through `_scimEscape()` before embedding in filter strings:

```javascript
function _scimEscape(val) {
    return String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
// Usage:
path: `/groups?filter=name eq "${_scimEscape(name)}"`
```

Extraction functions (`_extractEmail`, `_extractUsernamePrefix`, `_extractGroupNameFilter`) use restrictive regex character classes that already exclude `"` and `\`. `_extractName` uses `\S+` which can match these characters, so `_scimEscape` is applied at the call site.

### 9.5 CORS

The local Express server restricts CORS to known origins (localhost + `api.pingdemo.com`) with `credentials: true`.

The Vercel serverless proxy (`api/pingone/[...path].js`) uses an explicit `ALLOWED_ORIGINS` allowlist; CORS headers including `Access-Control-Allow-Credentials` are only sent for requests from listed origins.

---

### 9.6 Educational Token Inspector commands

This feature set is the heart of the playground's educational mission. All commands work **client-side** with no backend call (except `Introspect token` / `Introspect user token` which still hit the PingOne introspect endpoint).

| Command | What it does | Backend? |
|---|---|---|
| `Show my token` | Displays the stored user access token + decoded JWT header + claims | ❌ Client-side decode (`atob`) |
| `Show id token` | Displays the stored ID token + decoded JWT header + claims | ❌ Client-side decode (`atob`) |
| `Show worker token` | Displays the current worker or admin token + decoded claims | ❌ Client-side decode (`atob`) |
| `Decode token <jwt>` | Decodes any pasted JWT (header + payload, no sig verification) | ❌ Client-side decode (`atob`) |
| `Show api calls` | Displays the last 5 MCP API calls with method, path, and full JSON response | ❌ In-memory `apiCallHistory` state |
| `Clear tokens` | Clears user access token, ID token, and admin token from state + localStorage | ❌ localStorage.removeItem |
| `Introspect token` | Calls PingOne `/as/introspect` with worker/admin token | ✅ `/api/mcp/query` |
| `Introspect user token` | Calls PingOne `/as/introspect` with the stored user access token | ✅ `/api/mcp/query` |

**JWT decode implementation** (`decodeJwtPayload` / `decodeJwtHeader` in `mcpQueryService.ts`):
```typescript
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch { return null; }
}
```

> ⚠️ No signature verification is performed. This is intentional — the purpose is educational claim inspection, not security validation.

**Token localStorage schema** (`ai-assistant-user-token`):
```json
{
  "access_token": "eyJhbGci...",
  "id_token": "eyJhbGci...",
  "stored_at": 1710000000000
}
```

**API call history** is tracked in `apiCallHistory` React state (max 20 entries). Each record contains `{ id, query, mcpTool, apiCall: { method, path }, data, timestamp }`. The history resets on page refresh (not persisted to localStorage).

---

## 10. Conclusion

The **pingone-mcp-server** conforms to the MCP specification for the features it implements. It correctly uses JSON-RPC 2.0, exposes tools and resources via the official SDK, validates inputs, and reports errors in line with the spec. Security practices around credentials and tool semantics are appropriate. Optional features such as list-changed notifications, pagination, and cancellation are not implemented but are not required for core compliance.

**Conformance verdict**: **Compliant** for base protocol, tools, and resources. Optional capabilities are documented as gaps.
