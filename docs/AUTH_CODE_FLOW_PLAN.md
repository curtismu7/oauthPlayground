# Plan: Authorization Code (+ PKCE) Flow — mock + real, clean UI

**Goal:** A correct Authorization Code + PKCE flow that runs **both mock (offline) and real
(against PingOne)**, with a **clean, simplified UI**.
**Key insight:** the three asks (check mock, check real, cleaner UI) converge on **one move** —
build Authorization Code on the **flows2** framework, where `mode: 'real' | 'mock'` is a prop and the
UI is already ~6× leaner. We do NOT incrementally clean the 1,268-LOC legacy monolith; we replace it
under the strangler (`/v2/flows/*`) and delete it at parity.
**Status:** Plan (no code yet). Date: June 2026.

---

## 0. Current state (from audit)

| Piece | Where | State |
|-------|-------|-------|
| **Mock** auth-code flow | `src/pages/flows/v9/V7MOAuthAuthCodeV9.tsx` (**1,268 LOC**) | Works. One file serves OAuth+OIDC via `oidc` prop. 3 steps, fully mock (`V9Mock*`). Monolithic: logic fused to JSX, 48 inline styles, copy-pasted step blocks, 5 explanation boxes. |
| **Real** token exchange | `server.js` `/api/pingone/token` (grant_type=authorization_code) | Works — proxies to PingOne, supports `code_verifier`, both client-auth methods. |
| **Real** controller/logic | `useAuthorizationCodeFlowController.ts`, `authorizationCodeSharedService.ts` (clean static managers), PKCE in `utils/oauth.ts` (WebCrypto S256) | Clean, reusable logic — but coupled to the V5/V8u UI. |
| **Callback** | `/authz-callback` → `CallbackHandlerV8U`, `/callback` → `Callback` | V8u-specific; sessionStorage contract. |
| **flows2** framework | `src/flows2/` (`useFlowEngine`, `FlowContainer/Step/Result`, `OAuthFlowService`) | Clean. Client Credentials flow is the reference (~200 LOC). **PingOne User app already has `https://localhost:3000/authz-callback` + `/callback` registered** (added this session). |

**Conclusion:** real auth-code already works through the BFF; flows2 already gives the clean UI. We
assemble them.

---

## 1. The one hard part: the redirect callback — DECIDED: full redirect (Option A)

Client Credentials had no redirect. Authorization Code does — the browser leaves to PingOne and comes
back with `?code=...&state=...`. flows2 has no callback handling yet.

**Decision: full-redirect callback UX** (the realistic round-trip), with a **clean flows2 callback
receiver** — NOT the V8u-coupled `CallbackHandlerV8U`.

### Callback UX flow (real mode)
```
Step 3 (Authorize):
  flow stashes context in sessionStorage under a flow-scoped key, e.g.
    flows2:authz:<runId> = { codeVerifier, state, nonce?, returnTo: '/v2/flows/authorization-code',
                             step: 'exchange', mode, credentials(sans secret) }
  then window.location.assign(authorizationUrl)   // leaves to PingOne /as/authorize

PingOne authenticates + consents, redirects to:
    https://localhost:3000/authz-callback?code=...&state=...

/authz-callback  ->  flows2 receiver (useAuthCallback + a thin <Flows2Callback> route):
  1. read code+state from the query string
  2. look up the stashed context by matching state (CSRF check: state must equal the stashed value)
  3. on mismatch/auth error -> show the error, offer "restart"
  4. on success -> navigate back to returnTo with the code handed off in sessionStorage
     (flows2:authz:<runId>.code = code), land on the 'exchange' step

Step 5 (Exchange):
  flow reads code + codeVerifier from the stashed context, calls authorizationCodeService.exchangeCode,
  clears the stash. PKCE code_verifier proves possession; state already validated.
```

- New: `src/flows2/framework/useAuthCallback.ts` (read/validate/handoff) + a `<Flows2Callback>`
  component wired to the **existing** `/authz-callback` route (already registered in PingOne) — we add
  a flows2-aware branch, or register `/v2/flows/callback` and add it to the app's redirect URIs.
- **Mock mode skips the redirect entirely:** Step 3 calls the mock `authorizeIssueCode` and advances
  straight to Step 4 with a synthesized code — no navigation, no PingOne.
- Reuses `state`/`nonce` generation + CSRF validation already present in the legacy controller logic
  (extracted into the service, not the controller).

---

## 2. What to build

**New (flows2):**
- `src/flows2/services/authorizationCodeService.ts` — `OAuthFlowService`. Two operations:
  `buildAuthorizationUrl(params, mode)` and `exchangeCode(params, mode)`.
  - real: build `/as/authorize` URL (client_id, redirect_uri, scope, state, nonce?, code_challenge,
    S256, response_type=code); exchange via `/api/pingone/token` (grant_type=authorization_code, code,
    code_verifier, client_auth_method=client_secret_post per the registered app).
  - mock: **DECIDED — reuse the legacy `V9Mock*` services** (`V9MockAuthorizeService.authorizeIssueCode`,
    `V9MockTokenService.tokenExchangeAuthorizationCode`, `V9MockStateStore`, `generateV9MockTokens`).
    They already implement a correct, complete mock — including **real PKCE S256 verification** and the
    code→token→userinfo→introspect chain — so we don't re-implement it. **Containment rule:** ONLY
    `authorizationCodeService.ts` imports `V9Mock*`; the flow component and the rest of flows2 stay
    decoupled (they see only `OAuthFlowService`/`TokenResult`). When the legacy services are eventually
    retired, this one service file is the single swap point.
- `src/flows2/flows/authorizationCode.flow.tsx` — declarative steps on `useFlowEngine`:
  `Configure → Generate PKCE → Authorize (redirect) → Callback (code) → Exchange → Use tokens`.
  `spec: '2.0' | '2.1'` toggle (2.1 forces PKCE, hides plain). `oidc` toggle (adds nonce + id_token).
- `src/flows2/framework/useAuthCallback.ts` + `/v2/flows/callback` route — receive code/state,
  validate state, hand back to the flow.

**Reuse (no rewrite):**
- PKCE: `generateCodeVerifier` / `generateCodeChallenge` (`utils/oauth.ts`).
- Token exchange: `/api/pingone/token` BFF.
- Pure validation logic: extract the useful bits of `AuthzFlow*Manager`
  (`authorizationCodeSharedService.ts`) into the service — drop the controller coupling.

---

## 3. The cleaner UI — extract the shared pieces flows2 is missing

The auth-code flow is the forcing function to add the **reusable** primitives the audit called for,
so EVERY future flow gets them (not a one-off cleanup of the monolith):

| New flows2 primitive | Replaces (legacy) | Win |
|----------------------|-------------------|-----|
| `FieldGroup` (label+input+hint) | ~140 LOC of repeated field markup | one input style |
| `ResultCard` (code/token/userinfo/introspect) | 5 hand-rolled result blocks | one result style |
| `CodeBlock` / `JsonView` (copy button) | ad-hoc `#f1f5f9` boxes + `ColoredJsonDisplay` | one code style |
| `ExplanationPanel` (progressive disclosure) | 5 always-open explanation boxes | per-step, less clutter |
| design tokens (`flows2/framework/tokens.ts`) | hardcoded hex in 3 step palettes | consistent theme |

These live in `src/flows2/framework/` and are consumed by `FlowStep`/`FlowResult`. Result: the
auth-code flow lands at ~300–400 LOC (vs 1,268) **and** the framework is richer for the next flows.

**UI principles** (from the 10 audit opportunities): one button system; one card system; progressive
disclosure (show only the current step's explanation); reduce color/badge noise to the flows2 palette;
`useReducer` for the credential form; no inline styles.

---

## 4. Flow steps (what it teaches)

```
1. Configure   — env/client/secret/scope/redirect (FieldGroup), mode + spec + oidc toggles
2. PKCE        — generate verifier+challenge (real WebCrypto S256); show both (CodeBlock)
3. Authorize   — build + show the /as/authorize URL; "Go to PingOne" (real) or "Simulate" (mock)
4. Callback    — receive code+state; validate state; show the code (ResultCard)
5. Exchange    — POST code+code_verifier → tokens; show response + decoded claims (ResultCard)
6. Use         — UserInfo (OIDC) + Introspect (RFC 7662) against the real token
```

2.1 mode annotates each step with the rule it enforces (PKCE mandatory, exact redirect match, no
plain challenge) + RFC cite.

---

## 5. Verification (definition of done)

- **Mock:** runs fully offline; code→token→userinfo→introspect all return deterministic data; no
  network.
- **Real:** end-to-end against PingOne env `d02d2305-…` using the User app (`b7d00976-…`) → real
  redirect to `/as/authorize` → callback to `/authz-callback` → real token at `/api/pingone/token`
  with PKCE → decoded `iss/aud/exp` shown. (Requires the registered localhost callback — already
  done.)
- `npm run build` exits 0; the new flow lives at `/v2/flows/authorization-code`; the legacy
  `/flows/oauth-authorization-code-v9` route is untouched until parity, then removed.

---

## 6. Phasing

| Phase | Deliverable |
|-------|-------------|
| P1 | flows2 primitives: `FieldGroup`, `ResultCard`, `CodeBlock/JsonView`, `ExplanationPanel`, `tokens.ts` |
| P2 | `authorizationCodeService` (mock first) + `authorizationCode.flow.tsx` steps 1–5, mock end-to-end |
| P3 | `useAuthCallback` + `/v2/flows/callback`; wire **real** redirect + exchange; verify vs PingOne |
| P4 | OIDC toggle (nonce/id_token), step 6 (UserInfo + Introspect), 2.0/2.1 annotations |
| P5 | Reach parity with the legacy mock page; delete `V7MOAuthAuthCodeV9.tsx` + its routes (de-version cleanup) |

P2 (mock) is shippable on its own and de-risks the framework before the redirect work.

---

## 7. Decisions

**Resolved:**
- ✅ **Callback UX = full redirect (Option A)** — realistic round-trip via `/authz-callback`, clean
  flows2 `useAuthCallback` receiver (not `CallbackHandlerV8U`). Mock mode skips the redirect. See §1.
- ✅ **Mock engine = reuse legacy `V9Mock*` services**, contained behind `authorizationCodeService.ts`
  only (single swap point; flow + framework stay decoupled). See §2.

**Still open:**
1. **Scope of UI primitives now:** build all 5 primitives in P1, or only what auth-code needs and grow
   later? (Recommend: build the 5 — they're small and unblock every subsequent flow.)
2. **Legacy page:** delete at parity (recommended, strangler) vs keep both. Deleting removes 1,268 LOC.
3. **Callback route:** add a flows2 branch to the existing `/authz-callback`, or register a dedicated
   `/v2/flows/callback` in PingOne and route to it? (Recommend: dedicated `/v2/flows/callback` — keeps
   flows2 fully isolated from the legacy callback handlers; one-time PingOne redirect-URI add.)

---

## 8. Why this satisfies all three asks

- **Check mock:** P2 builds + verifies the mock path end-to-end.
- **Check real:** P3 wires + verifies the real PingOne round-trip (now unblocked by the registered
  redirect URI).
- **Cleaner UI:** the flows2 rebuild + the 5 extracted primitives cut the flow from 1,268 → ~350 LOC
  and give every future flow a consistent, decluttered UI — instead of polishing a monolith we're
  about to delete.
