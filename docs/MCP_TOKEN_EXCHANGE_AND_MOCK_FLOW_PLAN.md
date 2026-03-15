# MCP Token Exchange & Mock Agent Flow — Implementation Plan

**Version:** 1.0  
**Last Updated:** 2026-03-15  
**Status:** Partial — Phase 1 ✅, Phase 3 ✅; Phase 2 & 4 pending

---

## 1. Overview

This document plans two related features:

1. **"Token exchange" command in AI Assistant** — Use PingOne Token Exchange to obtain a token with broader scope via:
   - Username/password popup → Authorization Code flow (`response_mode=pi.flow`) → PingOne Token Exchange for a new token with additional scopes.

2. **Mock Agent + MCP + Token Exchange flow** — Educational flow showing how an Agent uses MCP, tokens, and Token Exchange per the [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25).

---

## 2. MCP Spec: Token, Storage & Compliance

### 2.1 MCP Spec and Tokens

Per the MCP spec:

- **Hosts** — LLM applications that initiate connections.
- **Clients** — Connectors within the host application.
- **Servers** — Services that provide context and capabilities (tools, resources, prompts).

MCP itself does not define token storage or authentication for LLM↔MCP communication. Tokens in our context are:

- **Worker token** — Client credentials → PingOne `/as/token` for Management API (p1:* scopes).
- **User token** — Auth Code flow → PingOne Token Exchange to obtain tokens with broader scope (e.g. `openid`, `profile`, `p1:read:user`).
- **Token Exchange (RFC 8693)** — Exchange a subject token for a new token with different audience/scope.

### 2.2 Current Compliance

| Area | Status | Notes |
|------|--------|-------|
| Worker token storage | ✅ | Modal, localStorage, IndexedDB, backend SQLite/JSON |
| User token from pi.flow | ✅ | OAuthLoginPanel, AIAssistantSidePanel (response_mode=pi.flow) |
| Token Exchange API | ✅ | `POST /api/token-exchange` supports `grant_type=urn:ietf:params:oauth:grant-type:token-exchange` |
| MCP tool `pingone_token_exchange` | ✅ | pingone-mcp-server exposes it; backend `/api/mcp/query` mirrors semantics |
| User consent before tool use | ✅ | MCP spec requires explicit consent; our Agent shows results after user query |

---

## 3. "Token Exchange" Command in AI Assistant

### 3.1 User Flow

1. User types **"Token exchange"** (or similar) in the AI Assistant.
2. AI Assistant recognizes the command and shows a **Token Exchange** modal/panel.
3. Modal includes:
   - **Step 1:** Username + password fields (or "Use existing session" if user already has an access token).
   - **Step 2:** Trigger Authorization Code flow with `response_mode=pi.flow` (embedded login, no redirect).
   - **Step 3:** On success, call PingOne Token Exchange with:
     - `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`
     - `subject_token` = access token from Step 2
     - `subject_token_type=urn:ietf:params:oauth:token-type:access_token`
     - `requested_token_type` (optional)
     - `scope` = requested additional scopes (e.g. `p1:read:user` for Management API)
   - **Step 4:** Store the new token and display success (truncated token, expiry).

### 3.2 Technical Approach

| Component | Implementation |
|-----------|----------------|
| Command recognition | Add `isTokenExchangeQuery()` in `mcpQueryService.ts`; match "token exchange", "do token exchange" |
| Modal/UI | New `TokenExchangePanel` or extend `AIAssistantSidePanel` with a "Token Exchange" tab |
| Auth Code (pi.flow) | Reuse `PingOneLoginService.initializeEmbeddedLogin` (response_mode=pi.flow) or `/api/pingone/redirectless/*` |
| Token Exchange call | `POST /api/token-exchange` with `grant_type=urn:ietf:params:oauth:grant-type:token-exchange` |
| Token storage | Store in `unifiedWorkerTokenService` or dedicated user-token storage keyed by environmentId |
| AI Assistant wiring | In `AIAssistant.tsx` (and AIAssistant app), when `isTokenExchangeQuery(query)` → show Token Exchange panel |

### 3.3 Backend

- **Current:** `/api/token-exchange` already supports token-exchange grant.
- **Optional:** New endpoint `/api/ai-assistant/token-exchange` that:
  - Accepts `environmentId`, `clientId`, `clientSecret`, `subjectToken`, `requestedScope`
  - Calls PingOne `/as/token` with token-exchange grant
  - Returns new token set.

### 3.4 Files to Create/Modify

| File | Action |
|------|--------|
| `src/services/mcpQueryService.ts` | Add `isTokenExchangeQuery`, handle in main handler |
| `src/components/TokenExchangePanel.tsx` (new) | Username/password → pi.flow → token exchange UI |
| `AIAssistant/src/components/TokenExchangePanel.tsx` (new) | Same for standalone AIAssistant |
| `src/components/AIAssistant.tsx` | Route "Token exchange" to TokenExchangePanel |
| `AIAssistant/src/components/AIAssistant.tsx` | Same |
| `src/config/aiAssistantConfig.ts` | Add "Token exchange" to quick commands |
| `server.js` | Verify token-exchange supports subject_token from pi.flow token |

---

## 4. Mock Agent + MCP + Token Exchange Flow

### 4.1 Goal

Educational flow demonstrating:

- **Simulated Agent** — Sends natural-language requests.
- **Simulated MCP Server** — Exposes mock tools (list users, get token, token exchange).
- **Simulated Token Exchange** — Mock PingOne Token Exchange that accepts a subject token and returns a "new" token with more scope.

### 4.2 Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ Simulated Agent │────▶│ Simulated MCP    │────▶│ Simulated Token      │
│ (React UI)      │     │ Server (in-memory)│     │ Exchange (mock API)  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
         │                          │                         │
         │  "List users"             │  tools/list             │
         │  "Token exchange"        │  tools/call             │  subject_token
         │                          │                         │  → new token
         ▼                          ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Mock MCP Agent Flow Page                              │
│  Step 1: Agent sends "Get initial token" → MCP tool → mock token        │
│  Step 2: Agent sends "Token exchange" → MCP tool → mock exchange        │
│  Step 3: Agent sends "List users" with new token → mock user list        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Mock Components

| Component | Behavior |
|-----------|----------|
| **Simulated Agent** | UI with pre-defined "queries" (buttons): "Get initial token", "Token exchange", "List users". Sends JSON-RPC-style requests to Simulated MCP Server. |
| **Simulated MCP Server** | In-browser or minimal backend. Implements `initialize`, `tools/list`, `tools/call`. Tools: `mock_get_token`, `mock_token_exchange`, `mock_list_users`. |
| **Simulated Token Exchange** | Returns mock tokens: `mock_token_exchange(subject_token, requested_scope)` → `{ access_token: "mock_...", scope: "..." }`. |

### 4.4 Implementation Options

**Option A: All in browser (educational)**
- Simulated MCP server as a class/object that responds to `tools/call` with mock data.
- No real network calls; everything in memory.

**Option B: Backend mock endpoints**
- `POST /api/mock/mcp/tools/call` — Accepts tool name + args, returns mock result.
- `POST /api/mock/token-exchange` — Mock token exchange.

**Option C: Use existing pingone-mcp-server in "mock" mode**
- Configure with mock PingOne client that returns canned data.
- More realistic but requires env/config.

### 4.5 Recommended: Option A (in-browser)

- New page: `/flows/mock-mcp-agent-flow` or `/docs/mock-mcp-agent-flow`
- React component:
  - Step-by-step wizard: "Send Get Token" → "Send Token Exchange" → "Send List Users"
  - Each step shows: Agent request (JSON), MCP Server response (JSON), Token Exchange response (if applicable).
- No backend changes; purely educational.

### 4.6 Files to Create

| File | Purpose |
|------|---------|
| `src/pages/MockMcpAgentFlowPage.tsx` | Main page with simulated Agent + MCP + Token Exchange |
| `src/services/mockMcpAgentService.ts` | In-memory simulated MCP server with mock tools |
| `docs/MOCK_MCP_AGENT_FLOW.md` | User-facing doc explaining the flow |
| Route + sidebar | Add to App.tsx and sidebar config |

### 4.7 User education: Secure AI Agent Authentication (required)

The Mock MCP Agent Flow page **must** include a prominent section (e.g. collapsible sidebar, info panel, or intro card) that teaches users about proper token storage, exchange, and secure AI agent authentication. Include:

**Token storage**
- **Never** store tokens in plain text in client code, logs, or URLs.
- **Worker tokens**: Use short-lived tokens; store client credentials in secure storage only (e.g. `mcp-config.json` in a protected path, or env vars). Obtain the worker token on demand when possible; avoid long-lived storage in localStorage for sensitive deployments.
- **User tokens**: After Authorization Code or Token Exchange, store in `sessionStorage` (cleared on tab close) for session-scoped use; avoid `localStorage` for long-lived access tokens when possible. Clear tokens on logout.
- **Most secure**: Backend-only token storage; client receives only authenticated status or short-lived session tokens.

**Token Exchange (RFC 8693)**
- Exchange a **subject token** (e.g. from Auth Code) for a new token with different scope or audience.
- Do **not** pass raw tokens in URLs, query params, or logs.
- Use Token Exchange when the Agent needs broader scope (e.g. Management API) than the initial user token provides.

**MCP spec: User consent**
- Hosts **must** obtain explicit user consent before invoking tools (MCP spec Security and Trust).
- The Agent should not call tools without the user initiating the query or approving the action.
- Display what the tool will do before execution when possible.

**Implementation requirement**: The Mock flow UI shall display this guidance (or a link to `docs/MOCK_MCP_AGENT_FLOW.md`) so users understand how to build secure AI agent authentication in their own apps.

---

## 5. Documentation Updates

### 5.1 Updated / Created Docs

| Doc | Update |
|-----|--------|
| `src/pages/docs/MCPDocumentation.tsx` | ✅ Added JSON-RPC 2.0, Hosts/Clients/Servers from spec |
| `docs/MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md` | ✅ This document |
| `docs/SESSION_AND_TOKEN_VERIFICATION.md` | Add Token Exchange command flow, pi.flow → token exchange |
| `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` | Add entries for MCP doc update, plan document |
| `mcp-spec.md` | Add reference to Token Exchange, Mock Flow plan |

---

## 6. Verification Checklist

- [x] MCP Documentation page shows JSON-RPC 2.0, Hosts, Clients, Servers
- [ ] `POST /api/token-exchange` with token-exchange grant works with subject_token from pi.flow
- [ ] Token Exchange command: plan approved; implementation tracked
- [x] Mock Agent flow: plan approved; implementation tracked ✅ Done (Phase 3)
- [x] All referenced docs updated

---

## 7. Next Steps

1. **Phase 1 (immediate):** MCP doc update — ✅ Done.
2. **Phase 2:** Implement Token Exchange command in AI Assistant (TokenExchangePanel, mcpQueryService changes).
3. **Phase 3:** Implement Mock MCP Agent Flow page (MockMcpAgentFlowPage, mockMcpAgentService). — ✅ Done.
4. **Phase 4:** Update SESSION_AND_TOKEN_VERIFICATION, regression plan, and run full regression.
