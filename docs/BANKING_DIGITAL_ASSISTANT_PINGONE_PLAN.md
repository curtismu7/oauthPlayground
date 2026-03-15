# Banking Digital Assistant — PingOne (Not AIC) Implementation Plan

**Reference:** [se-ai-demo-banking-digital-assistant](https://github.com/dennis-andrade_pingcorp/se-ai-demo-banking-digital-assistant)  
**Local reference code (this repo):** `se-ai-demo-banking-digital-assistant-main/` — full copy of the demo for implementation reference.  
**Goal:** Implement the same UI and user-facing behavior as the reference demo, but use **PingOne** (platform) for identity and APIs instead of **PingOne Advanced Identity Cloud (AIC)**.  
**Constraint:** Endpoints and identity provider change; UI and what the assistant does should not change.

**Version:** 1.0  
**Last Updated:** 2026-03-15

---

## 0. Reference Codebase (se-ai-demo-banking-digital-assistant-main)

| Path | Description |
|------|-------------|
| `banking_api_server/` | Core banking API backend (Node/Express). OAuth in `config/oauth.js`, `config/oauthUser.js`; routes: admin, users, accounts, transactions. Currently uses P1AIC (see `P1AIC_SETUP.md`). |
| `banking_api_ui/` | Banking admin UI (React). Login, chat widget; OAuth integration. |
| `banking_mcp_server/` | MCP server (TypeScript). Auth with PingOne AIC; tools for balance, transfers, transaction history; dual-token (agent + user). Key: `src/auth/`, `src/tools/`, `src/server/`. |
| `langchain_agent/` | AI agent backend (Python/FastAPI) and frontend; talks to Banking MCP Server. |
| `lending_api_server/`, `lending_api_ui/` | Lending services. |
| `postman-collections/` | Postman collections and envs for Banking API. |

When implementing the PingOne (platform) version, swap AIC endpoints and config in these services for PingOne auth URLs, worker token, and user Auth Code flow as in [Section 2](#2-endpoint-and-flow-mapping-aic--pingone).

---

## 1. Reference Demo Behavior (Target UX)

Based on Ping Identity’s [Identity for AI](https://developer.pingidentity.com/identity-for-ai/tutorials/idai-authorizing-agents-aic.html) and banking digital assistant patterns, the reference demo typically provides:

| Area | Behavior to preserve |
|------|-----------------------|
| **UI** | Chat-style digital assistant; user asks questions and requests actions in natural language. |
| **Autonomous actions** | Agent can call “non-sensitive” tools without user approval (e.g. get product info, list options, get latest prices). |
| **On-behalf-of actions** | For user-specific or sensitive actions (e.g. view balance, place order, view transactions), the agent requests user approval (HITL) before calling the backend. |
| **Identity** | User signs in; agent acts with delegated authority (no credential sharing with the agent). |
| **Banking context** | Flows and copy reflect banking: accounts, balances, transactions, transfers, support. |

We keep this UX; only the underlying identity and API endpoints switch from AIC to PingOne.

---

## 2. Endpoint and Flow Mapping: AIC → PingOne

### 2.1 Identity and token endpoints

| Purpose | PingOne AIC (reference) | PingOne (platform) — use instead |
|--------|--------------------------|----------------------------------|
| **Discovery** | AIC OIDC discovery URL | `https://auth.pingone.{region}/{envId}/as/.well-known/openid-configuration` |
| **Token (client credentials)** | AIC token endpoint | `https://auth.pingone.{region}/{envId}/as/token` — `grant_type=client_credentials` with Worker app credentials |
| **User sign-in (Auth Code)** | AIC authorize + token | Same pattern: `https://auth.pingone.{region}/{envId}/as/authorize` and `/as/token` with Auth Code + PKCE |
| **Token exchange (on-behalf-of)** | AIC token exchange / CIBA | PingOne Token Exchange: `POST /as/token` with `grant_type=urn:ietf:params:oauth:grant-type:token-exchange` (RFC 8693) |
| **Userinfo** | AIC userinfo | `https://auth.pingone.{region}/{envId}/as/userinfo` (standard OIDC) |

**Notes:**

- Worker app (client credentials) → same pattern as current oauth-playground worker token (Management API and/or custom “agent” scopes).
- User login → existing Auth Code + PKCE flows in the app; no UI change.
- Token exchange → already in use; see [MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md](./MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md) and `/api/token-exchange`.

### 2.2 “Agent” and “user” tokens

| Concept | AIC | PingOne implementation |
|--------|-----|-------------------------|
| **Agent backend / autonomous** | Client credentials (service identity) | PingOne **Worker application** → `client_credentials` → access token for Management API and/or custom API (e.g. “banking” backend). |
| **User-delegated (sensitive actions)** | CIBA / token exchange after user approval | User logs in (Auth Code) → access token → **Token Exchange** to get a new token with scopes for “banking” API; agent uses this token only after HITL. |

No CIBA on PingOne platform; HITL is implemented in the app (e.g. “Approve this action?” modal), then the app uses the user’s token (or token-exchange result) to call the backend.

### 2.3 Backend / banking APIs

| AIC assumption | PingOne-based approach |
|----------------|-------------------------|
| Backend APIs protected by AIC-issued tokens | Backend APIs protected by **PingOne-issued** access tokens (same OAuth/OIDC validation). |
| Scopes for “read balance”, “place order”, etc. | Define **custom scopes** (e.g. in PingOne application) and optional **resource** (e.g. “banking-api”); validate in your API. |
| Step-up / sensitive action | Use PingOne **step-up authentication** or in-app HITL (re-auth or approval) then call API with user token. |

So: keep the same “banking” API surface (balance, transactions, transfer, etc.); only the issuer and token validation switch to PingOne.

---

## 3. What Stays the Same (UI and behavior)

- **Chat UI:** Same layout, message list, input, and “available commands” or suggestions.
- **Conversation flow:** User asks; assistant answers; for sensitive actions, assistant asks for approval then proceeds.
- **Copy and flows:** Banking wording (accounts, balance, transfer, support, etc.).
- **Tool categories:**  
  - **Autonomous:** e.g. “What can you do?”, “Product info”, “Latest rates” → no approval.  
  - **On-behalf-of:** e.g. “Show my balance”, “Last 5 transactions”, “Transfer $X” → approval then execute.
- **No credential sharing:** User never types password into the assistant; sign-in via normal login page/popup.

---

## 4. What Changes (implementation only)

- **Identity provider:** Configure PingOne (platform) environment, applications, and scopes instead of AIC.
- **Token URLs:** Use PingOne auth domain and `/as/token`, `/as/authorize`, `/as/userinfo` as above.
- **Worker token:** Obtain via PingOne Worker app (client_credentials); store and use as today for “agent” or Management API calls.
- **User token:** Obtain via existing Auth Code + PKCE; optional Token Exchange for a token with “banking” scopes.
- **Backend:** Validate PingOne-issued JWTs (same `iss`, `aud`, scopes); optionally integrate step-up if required.
- **HITL:** Implement approval UI in the app (modal/confirm step) before calling sensitive APIs; no CIBA, same UX.

---

## 5. Implementation Phases

### Phase 1: Configuration and discovery (PingOne only)

- [ ] Document PingOne environment setup: one Worker app (client credentials), one (or more) user-facing app (Auth Code + PKCE).
- [ ] Document custom scopes (e.g. `banking:read`, `banking:transfer`) and optional API resource.
- [ ] Use existing OIDC discovery in the app; ensure it points to PingOne auth URLs (no AIC URLs).
- [ ] Reuse existing worker token flow (modal, storage) for the “agent” token.
- **Deliverable:** Single source of config (env or config file) for PingOne base URLs, env ID, client IDs; no AIC references.

### Phase 2: Autonomous vs on-behalf-of in the assistant

- [ ] Define which assistant “tools” or intents are **autonomous** (no approval) vs **on-behalf-of** (approval required).
- [ ] For autonomous: use Worker token (or a dedicated “agent” client_credentials token) to call backend or Management API.
- [ ] For on-behalf-of: require a user token (from Auth Code or Token Exchange); show HITL (e.g. “Approve: Show balance?”) before calling backend.
- [ ] Reuse existing AI Assistant + MCP wiring; add or tag tools as “sensitive” and gate them behind approval.
- **Deliverable:** Same chat UI; backend calls use either Worker token or user token depending on action type.

### Phase 3: User login and token exchange (PingOne)

- [ ] Ensure login uses PingOne authorize/token only (no AIC).
- [ ] After login, optionally call PingOne Token Exchange to get a token with `banking:*` (or similar) scopes for backend.
- [ ] Store user token (or exchanged token) for the session; pass to assistant/backend for on-behalf-of calls.
- **Deliverable:** User signs in once; assistant can perform approved sensitive actions using PingOne-issued token.

### Phase 4: Banking backend (or mock) and scopes

- [ ] Implement or connect a small “banking” API (balance, transactions, transfer) that validates **PingOne** access tokens.
- [ ] Enforce scopes (e.g. `banking:read` for balance/transactions, `banking:transfer` for transfer).
- [ ] Optional: integrate PingOne step-up for high-risk actions (e.g. transfer above threshold).
- **Deliverable:** Same API contract as in the reference demo; only issuer is PingOne.

### Phase 5: UI copy and flows (no functional change)

- [ ] Replace any AIC-specific strings (e.g. “PingOne AIC”, “AIC dashboard”) with “PingOne” or product name.
- [ ] Keep all banking flows and approval prompts; ensure error messages reference PingOne where relevant.
- **Deliverable:** UI and behavior match reference; only branding and endpoint references differ.

---

## 6. File and component areas (oauth-playground)

| Area | Role |
|------|------|
| **AIAssistant** | Chat UI, prompt chips, send; trigger HITL for sensitive commands; pass user or worker token to backend/MCP. |
| **Worker token / credentials** | Already PingOne; keep as-is for autonomous agent calls. |
| **Login / Auth Code** | Use existing PingOne Auth Code + PKCE; ensure no AIC URLs. |
| **Token exchange** | Existing `/api/token-exchange` and PingOne Token Exchange; use for “banking” scoped token if needed. |
| **server.js (or backend)** | Add or adapt routes for “banking” API; validate PingOne JWTs and scopes. |
| **MCP / tools** | Tag tools as autonomous vs on-behalf-of; on-behalf-of tools require user token and HITL. |
| **Config / env** | Single place for PingOne auth URL, env ID, Worker app, user app; remove AIC. |

---

## 7. Success criteria

- [ ] User can open the assistant and perform the same banking-style actions as in the reference demo (autonomous + on-behalf-of).
- [ ] All tokens (worker and user) are issued by **PingOne** (platform), not AIC.
- [ ] Discovery, authorize, token, userinfo, and token exchange use PingOne endpoints only.
- [ ] UI and wording match the reference; only configuration and backend integration use PingOne instead of AIC.

---

## 8. References

- [Authorize an AI Agent to Perform Tasks on Your Behalf | Identity for AI](https://developer.pingidentity.com/identity-for-ai/tutorials/idai-authorizing-agents-aic.html) — reference pattern (AIC).
- [Worker applications | PingOne Platform APIs](https://developer.pingidentity.com/pingone-api/foundations/authentication-concepts/authorization-and-authentication-by-application-type/worker-applications.html).
- [Token (client_credentials) | PingOne Platform APIs](https://developer.pingidentity.com/pingone-api/auth/openid-connect-oauth-2/token-client_credentials-client-secret-post.html).
- [MCP Token Exchange & Mock Flow Plan](./MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md) — Token Exchange and agent flows in this app.
