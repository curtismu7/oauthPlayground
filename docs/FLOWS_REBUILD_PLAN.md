# Plan: Clean-Core Rebuild of the OAuth/OIDC Teaching Flows

**Decision (locked):** Clean-core rebuild — new flow UI on a shared framework with **real PingOne
calls by default**, **keep** the proven plumbing, **delete** the dead weight.
**Goal:** Flows that teach OAuth 2.0 / 2.1 + OIDC using **real API calls to PingOne SSO**.
**Strategy:** Strangler — new flows live alongside the old, ported one at a time; old deleted only
after its replacement is verified. The existing app keeps working the entire time.
**Status:** Plan (no code yet). Date: June 2026.

---

## 0. Why (the measured basis)

| Signal | Number | Implication |
|--------|--------|-------------|
| Source LOC | ~1.18M across 2,339 files | Too big to "just clean up" |
| Coexisting flow versions | v7, v7m, v8, v8u, v9 | v9 never finished; piggybacks on v8u |
| Dead `/locked` branches | ~324K LOC | Pure deletion candidate |
| Deprecated/legacy-marked files | 863 | Archaeology, not architecture |
| Avg flow-page size | ~1,105 LOC | Mock-locked, logic fused to UI |
| Flows that are MOCK | 27 of 34 | Opposite of the real-PingOne goal |
| Clean reusable services | ~15 | **The engine is worth keeping** |
| Real PingOne endpoints in server.js | ~18 | **Real plumbing already works** |

Conclusion: rebuild the **flow UI layer**; keep the **engine**; delete the **sediment**.

---

## 1. Target architecture

A small shared framework so each flow is ~250 LOC of declarative config, not a 1,100-LOC monolith.

### 1.1 The flow framework (NEW)
```
src/flows2/
  framework/
    useFlowEngine.ts        # step state, validation, restart, persistence (replaces hand-rolled currentStep)
    FlowContainer.tsx       # page shell: header, step rail, nav
    FlowStep.tsx            # one step: title, explanation, inputs, action, result
    FlowResult.tsx          # token/response display (wraps existing TokenInspector)
    types.ts                # FlowDefinition, StepDefinition, FlowMode = 'real' | 'mock'
  flows/
    authorizationCode.flow.tsx      # ~250 LOC: declares steps, binds to a service
    clientCredentials.flow.tsx
    ...
  services/
    (thin adapters over the KEPT shared services — see §3)
```

### 1.2 Logic/UI separation (the core fix)
Every flow calls a **service interface**, never `fetch` inline:
```ts
interface OAuthFlowService<TParams, TResult> {
  run(params: TParams, mode: FlowMode): Promise<TResult>;  // mode picks real PingOne vs mock
}
```
- `mode: 'real'` → calls the **BFF endpoint** (real PingOne, token custody server-side)
- `mode: 'mock'` → calls the existing `/services/v9/mock/*` (kept wholesale)
Swapping real/mock is a prop, not a rewrite. **Default = real.**

### 1.3 OAuth 2.0 vs 2.1 teaching
2.1 is taught as *constraints on 2.0*, not separate flows:
- PKCE mandatory, no implicit, no ROPC, exact redirect match, refresh rotation.
- The framework supports a `spec: '2.0' | '2.1'` toggle per flow that flips defaults (e.g. forces PKCE, hides implicit) and annotates the UI with the 2.1 rule + RFC cite. One flow, two teaching modes.

---

## 2. Backend decision (settle now)

Two real-execution paths exist. Assign by surface, don't let them drift:

| Surface | Backend | Why |
|---------|---------|-----|
| **Teaching UI (browser)** | **server.js BFF endpoints** | Token custody server-side; already wired for real PingOne; CORS/secret handling solved |
| **Agent** | **oauth-oidc-mcp-server** | Agent-driven execution, provider-agnostic, RFC 8693 delegation |

The rebuilt flows use the **BFF endpoints**. The MCP server is the agent's path (per the teaching-agent plan). They share concepts, not code paths.

---

## 3. KEEP — port as-is (the engine)

These are clean and real; the rebuild depends on them.

**Real BFF endpoints (server.js):** `/api/pingone/token`, `/api/pingone/token-exchange`,
`/api/introspect-token`, `/api/userinfo`, `/api/par`, `/api/device-authorization`, `/api/jwks`,
`/api/pingone/oidc-discovery`, `/api/pingone/redirectless/*`, password endpoints.
> Note: server.js is 25,904 LOC. KEEP the endpoints; extract them into route modules during the rebuild (do not rewrite their PingOne logic).

**Shared flow services (clean):** `authorizationCodeSharedService.ts`,
`clientCredentialsSharedService.ts`, `hybridFlowSharedService.ts`, `parService.ts`,
`dpopService.ts`, `jwksService.ts`, `oidcDiscoveryService.ts`.

**Flow controllers (hooks):** `useAuthorizationCodeFlowController.ts`,
`useClientCredentialsFlowController.ts`, `useWorkerTokenFlowController.ts`,
`useTokenIntrospectionFlowController.ts`.

**Token + credential infra:** `unifiedTokenStorageService.ts`, `unifiedTokenDisplayService.tsx`,
`unifiedWorkerTokenService.ts`, `credentialStorageManager.ts`, `environmentIdPersistenceService.ts`,
`regionService.ts`, `utils/jwt.ts`, `utils/oauth.ts`, `TokenInspector.tsx`.

**Mock services (for the mock mode):** `/services/v9/mock/*` — keep wholesale.

---

## 4. REBUILD — on the new framework

The flow **pages** only. Use the current V9 pages as **visual/UX reference** (their step layout,
explanations, colors are good) — re-implement them as declarative `*.flow.tsx` on the framework,
wired to the KEPT services in `real` mode.

---

## 5. DELETE — after replacements are verified

`src/locked/**` (~324K LOC), `src/v7*/**`, the duplicated `postmanCollectionGeneratorV8` copies,
and each old flow page once its v2 replacement passes. Archived/legacy-marked files. Target: remove
~60–70% of the tree.

> Deletion is **gated** per flow: old page deleted only when the new one is verified against real
> PingOne. Nothing is removed blind.

---

## 6. Flow-by-flow port order (real PingOne)

Ordered by teaching value + reuse of kept services. Each = build on framework → wire to BFF (real)
→ verify against a PingOne test env → delete old page.

| # | Flow | Spec | BFF endpoint | Kept service |
|---|------|------|-------------|--------------|
| 1 | Authorization Code + PKCE | 2.0/2.1 | `/api/pingone/token` | `authorizationCodeSharedService` |
| 2 | Client Credentials | 2.0/2.1 | `/api/pingone/token` | `clientCredentialsSharedService` |
| 3 | Token Introspection (7662) | — | `/api/introspect-token` | `useTokenIntrospectionFlowController` |
| 4 | UserInfo (OIDC) | — | `/api/userinfo` | `useAuth` |
| 5 | Token Revocation (7009) | — | revoke endpoint | token infra |
| 6 | Device Authorization (8628) | 2.0 | `/api/device-authorization` | — |
| 7 | PAR (9126) | 2.1 | `/api/par` | `parService` |
| 8 | Token Exchange (8693) | — | `/api/pingone/token-exchange` | (real already) |
| 9 | Refresh + rotation | 2.1 | `/api/pingone/token` | token infra |
| 10 | OIDC Discovery / JWKS | — | `/api/pingone/oidc-discovery`, `/api/jwks` | `oidcDiscoveryService`, `jwksService` |
| 11 | DPoP (9449) | — | (proof + token) | `dpopService` |
| 12 | Redirectless (pi.flow) | — | `/api/pingone/redirectless/*` | controller |
| 13 | Implicit / Hybrid | 2.0 | token | shared services (taught as legacy) |
| 14 | ROPC | 2.0 | `/api/pingone/token` | (taught as anti-pattern) |

Foundational flows (1–2) prove the framework before the long tail.

---

## 7. Phasing

| Phase | Deliverable | Exit criteria |
|-------|-------------|---------------|
| P0 | Framework (`useFlowEngine`, `FlowContainer`, `FlowStep`, `FlowResult`, service interface) | Compiles; one throwaway flow renders |
| P1 | Authorization Code + PKCE (real, 2.0/2.1 toggle) | Real PingOne login→token works end to end |
| P2 | Client Credentials + Introspection + UserInfo + Revocation | 4 flows real, old pages deleted |
| P3 | Device, PAR, Token Exchange, Refresh | real; 2.1 annotations in place |
| P4 | Discovery/JWKS, DPoP, Redirectless | real |
| P5 | Legacy (Implicit/Hybrid/ROPC) as "avoid" lessons | real-or-clearly-legacy |
| P6 | Mass delete `/locked`, v7, dupes; route cleanup in App.tsx | tree shrinks ~60–70%; build green |

Each phase keeps the app shippable (strangler).

---

## 8. Open decisions

1. **Where new flows live** — recommend `src/flows2/` in the same repo (strangler), routes under a
   `/v2/flows/*` prefix until parity, then swap. Alternative: fresh repo (cleaner, loses git history + shared infra).
2. **PingOne test env** — which environment/app powers "real" mode by default? Needs a sandbox env + client with the right grant types enabled (incl. token-exchange, device, PAR).
3. **server.js fate** — extract endpoints into route modules now, or leave the monolith and only call it? (Recommend: extract incrementally as each flow needs its endpoint.)
4. **Design system** — reuse V9's visual language (headers, step rails, colors) as-is, or refresh while we rebuild? (Recommend: reuse as-is; UX is the strong part.)

---

## 9. Relationship to the agent-teaching plan

This rebuild is the **foundation**; `TEACHING_OAUTH_WITH_AGENT.md` sits on top — the guide agent
links to these rebuilt real flows (the SHOW step) and the agent runs the MCP server (the RUN step).
Real flows here make the teaching agent's "run it live" genuinely live.

---

## 10. First step

P0 — build the framework (`useFlowEngine` + `FlowContainer`/`FlowStep`/`FlowResult` + the
`OAuthFlowService` interface) and prove it with **Flow #1 (Authorization Code + PKCE)** wired to the
real BFF token endpoint. That single vertical slice validates the whole architecture before we port
the long tail.
