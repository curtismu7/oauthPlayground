# Flows2 Look-and-Feel Standardization

Tracking the rollout of the `/v2/flows/authorization-code` design language across every flows2 page.

**Status:** 🟡 In progress · **Started:** 2026-06-24 · **Reference:** [`authorizationCode.flow.tsx`](../src/flows2/flows/authorizationCode.flow.tsx)

---

## 1. The Gold Standard (reference format)

`/v2/flows/authorization-code` is the format we are standardizing on. Its defining traits:

| Trait | What it is |
|---|---|
| **Mode toggle** | `onModeChange` → `FlowContainer` renders a Real PingOne / Mock pill toggle in the header. Mock auto-fills realistic creds so it runs offline. |
| **Spec toggle** | `spec` state (`2.0`/`2.1`) as Pill buttons in the Configure step, plus an OIDC on/off pill. Teaches OAuth 2.1's stricter rules (mandatory PKCE, exact redirect match, no implicit). |
| **Design palette** | Deep indigo `#1e3a8a` + electric teal `#14b8a6`, IBM Plex Mono on action buttons / labels. |
| **Signature visual** | A distinctive inline-SVG flow diagram on the Configure step (Client → AuthZ → User → Token). |
| **Service layer** | A `mode`-aware service in `src/flows2/services/*` (real → BFF, mock → offline). |
| **Teaching copy** | Every step has `description` + `explanation`; subtitle cites the RFCs. |

---

## 2. Mode-support rule (real vs mock)

> **Rule (from product owner):** If PingOne supports the flow → ship **both Real and Mock**. If PingOne does not support it → **Mock only**.

Real mode = `onModeChange` is passed to `FlowContainer` (renders the Real/Mock toggle) and the service makes live BFF calls.
Mock only = no `onModeChange`; header shows a static "Mock" badge; service runs entirely offline.

Per-flow PingOne support is verified during conversion using the `oauth-pingone` skill. Current best understanding:

| PingOne-supported → Real + Mock | Mock only (not a PingOne capability) |
|---|---|
| authorization-code · par · device-authorization · refresh-token · client-credentials · token-introspection · token-revocation · userinfo · oidc-discovery · ropc¹ · redirectless (pi.flow) · dpop² | token-exchange³ · saml-bearer³ · implicit/hybrid⁴ |

¹ ROPC is supported by PingOne but discouraged; keep real + a deprecation callout.
² DPoP support depends on environment/app config — verify before enabling real.
³ RFC 8693 token-exchange and RFC 7522 SAML-bearer: confirm PingOne grant support per environment; default to mock until confirmed.
⁴ Implicit/hybrid: PingOne can issue tokens via the authorize endpoint, but it is discouraged under 2.1; confirm before enabling real.

**Action item:** each flow's real-mode support is re-confirmed (not assumed) at conversion time. The audit found all 15 currently *declare* real+mock; we will demote any to mock-only where PingOne genuinely does not support the grant.

---

## 3. Best-practice findings (research)

### 3.1 What is already shared (good)
- `FlowContainer` / `FlowStep` / `FieldGroup` / `ResultCard` / `CodeBlock` / `JsonView` / `ExplanationPanel` / `FlowResult`.
- `useFlowEngine(STEPS)` — step state, completion, navigation.
- `tokens.ts` — palette/spacing/radius (18 flows import it).
- `services/pingone.ts` — shared BFF helper; every flow has a `mode`-aware service.

### 3.2 What is duplicated / missing (the gap to close)
- The **teal accent** (`#14b8a6` / hover `#0d9488`) and **neutral scale** that *make* the reference look are **NOT in `tokens.ts`** — hand-redeclared as a local `DESIGN` object in the authz files. Converting 15 flows by copy-paste would create 15 copies.
- The signature `FlowDiagram` / `FlowLabel` wrapper and the `Pill` / `Action` / `Toggle` / `Note` styled-components live **inline only in the authz flow** — no shared home.

### 3.3 Decision: extract before converting (DRY)
1. **Extend `tokens.ts`** — add `color.accent`, `color.accentHover`, and a `neutral` scale.
2. **Shared styled-components** in `framework/` — `Pill` / `Action` / `Toggle` / `Note` (extracted from the reference, retokenized).
3. **Parameterized `FlowDiagram` component** — `<FlowDiagram label="..." nodes={['Client','AuthZ','User','Token']} />`. Each flow passes its own node list → distinct signature, **zero duplicated SVG**.
4. **Refactor the reference flow** onto the shared pieces (proves the API; stays canonical example).

### 3.4 OAuth 2.0 / 2.1 + OIDC compliance
- Authoritative guide: the `oauth-pingone` skill.
- **Spec toggle only where 2.0 and 2.1 actually differ** (grant flows). OAuth 2.1 deltas to enforce when `spec === '2.1'`: PKCE mandatory on auth-code flows, exact redirect-URI matching, no implicit/ROPC grants, refresh-token rotation.

---

## 4. Spec-toggle scope (which flows get the 2.0/2.1 toggle)

| Applies (grant flows w/ real 2.0↔2.1 deltas) | Informational only / N/A (extensions, OIDC utilities) |
|---|---|
| authorization-code ✅ · par · device-authorization · ropc · implicit-hybrid · hybrid · redirectless · refresh-token | client-credentials · token-exchange · token-introspection · token-revocation · userinfo · oidc-discovery · dpop · saml-bearer |

For the right-column flows the **signature element** is the distinctive trait, not a spec toggle.

---

## 5. Conversion tracker

Legend: ⬜ not started · 🟨 in progress · ✅ done (committed)

### Phase 0 — Framework extraction (foundation)
- ⬜ Extend `tokens.ts` (accent + neutral scale)
- ⬜ Shared `Pill` / `Action` / `Toggle` / `Note` styled-components
- ⬜ Parameterized `FlowDiagram` component
- ⬜ Refactor reference `authorizationCode.flow.tsx` onto shared pieces

### Phase 1 — Grant flows (palette + signature + spec toggle)
| Flow | File | LOC | Mode | Status |
|---|---|---|---|---|
| Authorization Code | authorizationCode.flow.tsx | 518 | real+mock | ✅ reference |
| PAR | par.flow.tsx | 369 | real+mock | ⬜ |
| Device Authorization | deviceAuthorization.flow.tsx | 398 | real+mock | ⬜ |
| Refresh Token | refreshToken.flow.tsx | 318 | real+mock | ⬜ |
| ROPC | ropc.flow.tsx | 304 | real+mock | ⬜ |
| Implicit / Hybrid | implicitHybrid.flow.tsx | 471 | verify | ⬜ |
| Hybrid | hybrid.flow.tsx | 379 | verify | ⬜ |
| Redirectless | redirectless.flow.tsx | 430 | real+mock | ⬜ |

### Phase 2 — Extension / utility flows (palette + signature)
| Flow | File | LOC | Mode | Status |
|---|---|---|---|---|
| Client Credentials | clientCredentials.flow.tsx | 288 | real+mock | ⬜ |
| Token Exchange | tokenExchange.flow.tsx | 254 | verify | ⬜ |
| Token Introspection | tokenIntrospection.flow.tsx | 253 | real+mock | ⬜ |
| Token Revocation | tokenRevocation.flow.tsx | 273 | real+mock | ⬜ |
| UserInfo | userInfo.flow.tsx | 245 | real+mock | ⬜ |
| OIDC Discovery | oidcDiscovery.flow.tsx | 445 | real+mock | ⬜ |
| DPoP | dpop.flow.tsx | 386 | verify | ⬜ |
| SAML Bearer | samlBearerAssertion.flow.tsx | 301 | verify | ⬜ |

"verify" = confirm PingOne supports real mode before enabling; otherwise demote to mock-only.

---

## 6. Per-flow process (repeat for each)
1. Confirm mode support (PingOne supported → real+mock; else mock-only).
2. Apply shared palette (`Action` / `Pill` / `Note` from framework).
3. Add a signature `<FlowDiagram>` to the first step with the flow's node sequence.
4. Add spec toggle if in Phase-1 scope; verify 2.1 deltas are enforced.
5. Verify mock runs offline and real wires to the BFF.
6. Commit (`flows2: standardize <flow> look-and-feel`), tick the box here.
