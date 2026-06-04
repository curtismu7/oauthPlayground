# Plan: Client Credentials Flow — consolidate, reach parity, clean UI

**Goal:** One Client Credentials (machine-to-machine) flow on flows2 that runs **mock + real
PingOne**, adopts the shared UI primitives, reaches feature parity with the legacy worker-token flow,
and replaces the three legacy variants.
**Difference from the Auth Code plan:** the flows2 Client Credentials flow **already exists** — it was
the *first* flows2 flow, built **before** the 5 UI primitives. So this is less "build" and more
"retrofit + reach parity + delete the legacy".
**Status:** Plan (no code yet). Date: June 2026.

---

## 0. Current state (from audit)

| Piece | Where | State |
|-------|-------|-------|
| **flows2 CC flow** | `src/flows2/flows/clientCredentials.flow.tsx` (**208 LOC**) + `clientCredentialsService.ts` (88) | Real + mock, 2 steps (Configure, Request & Inspect). Auth toggle (basic/post). **Verified real against PingOne earlier.** Uses **0 of the 5 new primitives** — its own inline `Field/Input/ModeButton/Run` styled-components. Route `/v2/flows/client-credentials`. |
| **Legacy mock #1** | `src/pages/flows/v9/ClientCredentialsV9.tsx` (**453 LOC**) | Mock "standardized" variant. |
| **Legacy mock #2** | `src/pages/flows/v9/V7MClientCredentialsV9.tsx` (**590 LOC**) | Mock, V7M educational variant. |
| **Legacy real** | `src/pages/flows/v9/WorkerTokenFlowV9.tsx` (**705 LOC**) | **Real** worker-token (client_credentials for M2M). Richer: **OIDC discovery**, **scope selection from discovered scopes**, **introspection endpoint**, app lookup, token display. Route `/flows/worker-token-v9`. |

So Client Credentials is spread across **4 implementations** (1 clean flows2 + 3 legacy, ~1,750 LOC).
The flows2 one is the keeper; it needs polish + parity, then the 3 legacy go.

---

## 1. Retrofit the 5 flows2 primitives (the flow predates them)

The flows2 CC flow was built before `FieldGroup`, `ResultCard`, `CodeBlock`/`JsonView`,
`ExplanationPanel`, and `tokens`. Swap its bespoke inline styled-components for the shared primitives
(exactly as the Auth Code flow now uses them) so the two flows look identical and the framework is the
single source of UI truth.

- Credential inputs → `FieldGroup`
- Token response + decoded claims → `FlowResult` / `ResultCard` + `JsonView`
- Raw token / curl example → `CodeBlock`
- "What is client_credentials / when to use it" → `ExplanationPanel` (progressive disclosure)
- Colors/spacing → `tokens`

Net: drops the duplicated styled-components, ~30–40 LOC lighter, visually consistent.

---

## 2. Parity gaps vs the legacy worker-token flow

`WorkerTokenFlowV9` (the real one we're replacing) teaches more than the current 2-step flows2 flow.
Bring the worthwhile bits across — without the 705-LOC bulk:

| Legacy feature | Bring to flows2? | How |
|----------------|------------------|-----|
| **OIDC discovery** (find token/introspection endpoints + supported scopes from an issuer) | ✅ optional | a "Discover" affordance in Configure; reuse `oidcDiscoveryService` behind the service |
| **Scope selection from discovered scopes** | ✅ | populate a scope picker from discovery; free-text fallback |
| **Token introspection (RFC 7662)** of the worker token | ✅ | add a 3rd step "Inspect" — introspect the access token (real via BFF `/api/introspect-token`, mock via `V9Mock*`), same as the Auth Code flow's Use step |
| **App lookup / credential manager** | ⚠️ skip | flows2 prefills from env; app-picker is legacy-credential-manager coupling we're leaving behind |
| **Audience / resource indicator** (RFC 8707) | ✅ small | optional `audience`/`resource` fields → token params (service already has the seam) |

Target step shape: `Configure (+optional discover) → Request → Inspect`.

---

## 3. Mock + real (already done, keep + extend)

- The service already branches `mode`. Mock returns a deterministic token; real calls
  `/api/pingone/token` with `grant_type=client_credentials` and the chosen client-auth method
  (**worker app uses `client_secret_basic`** — keep that default for the prefilled worker creds).
- Extend with the introspection call for the Inspect step (real BFF + mock `V9Mock*`), contained in
  `clientCredentialsService.ts` only (same containment rule as `authorizationCodeService.ts`).

---

## 4. Steps the flow teaches

```
1. Configure  — env/client/secret/region, auth method (basic/post), scope (+ optional discover),
                optional audience/resource; mode toggle (real/mock)
2. Request    — POST grant_type=client_credentials; show token + decoded claims (FlowResult)
3. Inspect    — introspect the access token (RFC 7662); explain aud/scope/exp (ResultCard + JsonView)
```

No PKCE, no redirect, no user — the teaching point is *the app authenticating as itself*. An
`ExplanationPanel` contrasts it with Authorization Code (no user identity; `act`/delegation belongs to
token-exchange, linked).

---

## 5. Verification (definition of done)

- **Mock:** offline; deterministic token + introspection.
- **Real:** worker app (`15881ac7-…`, `client_secret_basic`) → real token (`aud: api.pingone.com`) →
  real introspection. (Already proven for the token step; add the introspection assertion.)
- Add `clientCredentialsService.test.ts` (mock path: request + introspect; real URL/param shape).
- `npm run build` exits 0; route stays `/v2/flows/client-credentials`.

---

## 6. Phasing

| Phase | Deliverable |
|-------|-------------|
| P1 | Retrofit the 5 primitives into `clientCredentials.flow.tsx` (visual parity with Auth Code) |
| P2 | Add the **Inspect** step (introspection, real + mock) to the service + flow |
| P3 | Optional **discovery** + scope picker + audience/resource fields |
| P4 | `clientCredentialsService.test.ts` (mock end-to-end + real param shape) |
| P5 | Delete the 3 legacy variants (`ClientCredentialsV9`, `V7MClientCredentialsV9`, `WorkerTokenFlowV9`) + redirect their routes to `/v2/flows/client-credentials`; remove ~1,750 LOC |

P1 alone gives immediate visual consistency; P5 is the big consolidation.

---

## 7. Decisions

**Recommended defaults:**
- ✅ Keep the existing flows2 CC flow as the single keeper; retrofit, don't rebuild.
- ✅ Worker-app default auth method stays `client_secret_basic` (that's what the registered worker app
  requires).
- ✅ Mock via `V9Mock*` contained behind the service (consistent with Auth Code).

**Open:**
1. **Discovery scope (P3):** ship discovery + scope picker now, or defer until a flow actually needs
   it? (Recommend: defer to P3 — the core flow + inspect is the 80%.)
2. **Worker-token naming:** keep one route `/v2/flows/client-credentials`, or also expose a
   "worker-token" alias (legacy users know that name)? (Recommend: one route + redirect the legacy
   worker-token routes to it.)
3. **Delete vs keep legacy worker-token:** `WorkerTokenFlowV9` has real discovery UX some users rely
   on — confirm parity (P3) before deleting it (P5).

---

## 8. Why this satisfies the asks (same shape as the Auth Code plan)

- **Check mock + real:** both already work; P2/P4 verify + extend with introspection.
- **Cleaner UI:** P1 retrofits the shared primitives → the CC flow matches the Auth Code flow exactly,
  and the framework is the single UI source. P5 deletes ~1,750 LOC of legacy variants.
- **One flow, not four:** consolidates client_credentials + worker-token into a single, version-free
  flows2 flow.

> Cross-ref: mirrors `docs/AUTH_CODE_FLOW_PLAN.md` (now implemented). The two flows share the framework,
> the primitives, and the containment rule — so finishing this plan also hardens the pattern for the
> remaining flows (device, token-exchange, refresh, PAR, …).
