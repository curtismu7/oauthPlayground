# oauthPlayground — UI Simplification & De-duplication Audit

**Date:** 2026-06-19
**Guiding rule:** *the live, real-PingOne demo takes precedence.* The canonical implementations are the 14 **flows2** flows (`src/flows2/flows/*.flow.tsx`, routed under `/v2/flows/*`, real PingOne + mock toggle). Everything older (v7 / v8 / v8u / v9 / standalone mock pages) is a duplicate to retire **once flows2 covers it**. Concepts flows2 does *not* yet cover are kept (the most-live legacy version) and flagged for migration.

This is a **plan to action on**, sequenced low-risk → high-risk. Every removal is gated by `npm run build` (must be 0) + `npx vitest run`, committed per batch so it can be reverted.

---

## Current state (the problem)

| Metric | Now | Notes |
|---|---|---|
| Total routes (App.tsx) | ~215 | ~80 are pure `<Navigate replace/>` redirects (v6/v7/v8 → canonical) |
| Real-element routes | ~135 | only 16 are the canonical `/v2/flows/*` |
| `lazy()` imports | ~179 | most point at legacy versions |
| Sidebar entries | ~109 | incl. 6 duplicate flow pairs + a misleading "Mock Flows" group mixing live + mock |
| `archived/` (top-level) | **REMOVED** | 171 files / ~152K LOC — Phase 0, done (commit `e3962c85b`) |
| `src/` orphan files (madge) | ~514 / ~190K LOC | imported by nothing; the dead-code bulk |

flows2 already covers 14 of the core grant/endpoint demos; the bloat is everything it superseded that was never deleted.

---

## Section 1 — Flow-version duplication (the headline)

flows2 canonical (keep, all `/v2/flows/*`): authorization-code, client-credentials, device-authorization, dpop, implicit-hybrid, oidc-discovery, par, redirectless, refresh-token, ropc, token-exchange, token-introspection, token-revocation, userinfo.

### 1a. Legacy flow pages flows2 ALREADY covers — RETIRE (redirect route → `/v2/flows/*`, delete page)

High-priority (3+ duplicate implementations of one concept):

| Concept | Legacy files to delete | Old routes → redirect to |
|---|---|---|
| Authorization Code | `v9/V7MOAuthAuthCodeV9.tsx`, `pages/AuthorizationCodeFlow.tsx` (already unrouted) | `/flows/oauth-authorization-code-v9`, `/flows/oidc-authorization-code-v9` → `/v2/flows/authorization-code` |
| Implicit + Hybrid | `v9/V7MImplicitFlowV9.tsx`, `v9/V7MOIDCHybridFlowV9.tsx`, `pages/flows/OAuthImplicitFlowCompletion.tsx` | `/flows/implicit-v9`, `/flows/oidc-implicit-v9`, `/flows/oidc-hybrid-v9` → `/v2/flows/implicit-hybrid` |
| ROPC | `v9/OAuthROPCFlowV9.tsx`, `v9/V7MROPCV9.tsx`, `pages/flows/OAuth2ResourceOwnerPasswordFlow.tsx` | `/flows/oauth-ropc-v9`, `/v7/oauth/ropc`, `/v7/oidc/ropc`, `/flows/oauth2-resource-owner-password` → `/v2/flows/ropc` |
| DPoP | `pages/flows/DPoPFlow.tsx`, `pages/DpopAuthorizationCodeFlow.tsx` (unrouted) | `/flows/dpop` → `/v2/flows/dpop` |
| Device Authorization | `v9/V7MDeviceAuthorizationV9.tsx`, `v9/DeviceAuthorizationVerifyPage.tsx` | `/flows/device-authorization-v9` → `/v2/flows/device-authorization` |

Remaining single/double duplicates:

| Concept | Legacy files to delete | Old routes → redirect to |
|---|---|---|
| Token Exchange | `v9/TokenExchangeFlowV9.tsx` | `/flows/token-exchange-v9` → `/v2/flows/token-exchange` |
| Token Revocation | `pages/flows/TokenRevocationFlow.tsx` | `/flows/token-revocation` → `/v2/flows/token-revocation` |
| UserInfo | `pages/flows/UserInfoFlow.tsx`, `pages/flows/UserInfoPostFlow.tsx` | `/oidc/userinfo`, `/flows/userinfo` → `/v2/flows/userinfo` |
| Redirectless | `pages/flows/RedirectlessFlowV9_Real.tsx` | `/flows/redirectless-v9-real` → `/v2/flows/redirectless` |
| PAR | `v9/PARFlowV9.tsx` (mock); evaluate `v9/PingOnePARFlowV9.tsx` (real — confirm no unique RAR/login_hint variant before deleting) | `/flows/par-v9` → `/v2/flows/par` |
| Token Introspection | (already redirected) — delete leftover `v9` introspection component files if present | — |
| Client Credentials | mostly retired; untangle from `UnifiedOAuthFlowV8U` | `/v8u/unified` (CC) → `/v2/flows/client-credentials` |

Plus the **V8U umbrella** `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` — covers Auth Code / CC / Device / Implicit / Hybrid / ROPC / Refresh, all now in flows2. It is the redirect target for many legacy routes; repoint `/v8u/unified` → `/v2/flows/authorization-code` and retire (keep `SpiffeSpireFlowV8U` — that's a gap).

**~18 legacy flow files retirable** (2 already unrouted = instant deletes: `pages/AuthorizationCodeFlow.tsx`, `pages/DpopAuthorizationCodeFlow.tsx`; 1 unrouted orphan: `v9/MFALoginHintFlowV9.tsx`).

### 1b. flows2 GAPS — KEEP (no flows2 equivalent yet; migrate later)

CIBA (`v9/V7MCIBAFlowV9.tsx`), JWT Bearer (`v9/JWTBearerTokenFlowV9.tsx`), SAML Bearer (`v9/SAMLBearerAssertionFlowV9.tsx`), SAML SP (`v9/SAMLServiceProviderFlowV9.tsx`), RAR (`v9/RARFlowV9.tsx`), SPIFFE/SPIRE (`v8u/flows/SpiffeSpireFlowV8U.tsx`), WIMSE (`v9/WIMSEFlow.tsx`), GNAP (`v9/GnapFlow.tsx`), JAR+JARM (`v9/JarJarmFlow.tsx`), Step-Up (`v9/StepUpAuthFlow.tsx`), mTLS (`v9/MtlsClientAuthFlow.tsx`), Attestation (`v9/AttestationClientAuthFlow.tsx`), ID Tokens (`pages/flows/IDTokensFlow.tsx`), PingOne Logout (`pages/flows/PingOneLogoutFlow.tsx`), MFA Workflow Library, Mock MCP Agent (`pages/flows/MockMcpAgentFlowPage.tsx`), Resources API, Sessions API, OAuth 2.1 Informational, MCP Server Config, Kroger MFA demo, Advanced OAuth Params demo. **(~22 concepts.)**

---

## Section 2 — Variant components / services / hooks (trial-and-error clutter)

**Variant component clusters** (keep the live one, delete the rest):
- `CleanlinessDashboard*` → keep `CleanlinessDashboardWorking` (routed `/cleanliness-dashboard`); delete **5** (`.tsx` base, `Fixed`, `Minimal`, `Simple`, `Test`).
- `OIDCOverview*` → keep `OIDCOverviewV7` (routed); delete **7** (`_Enhanced`, `_Enhanced_Simple`, `_Minimal`, `_New`, `_Simple`, `_Test`, base).
- `src/pages/protect/` → **14 files**, a stale verbatim copy of the live `src/pages/protect-portal/` (the dead copy still has a hardcoded-localhost redirect-URI bug the live one fixed). Delete the whole `pages/protect/` subtree.
- `EnhancedStepFlow.tsx` (keep `EnhancedStepFlowV2`), `CompactApplicationPicker.tsx` (keep `CompactAppPickerV9`), `TokenInspector.tsx`/`.new.tsx` (both unrouted), v8u lockdown/snapshot `SpiffeSpireFlowV8U` copy, unused base MFA step components (`UnifiedConfigurationStep`, `UnifiedDeviceSelectionStep`, `UnifiedRegistrationStep` — only `.modern` versions are used).

**Duplicate services** (keep flows2/live, retire orphans):
- `services/postman/` (5 files) — unwired refactor of `postmanCollectionGeneratorV8.ts` (all 8 callers still use the monolith). Delete the folder.
- ~11 `services/v9/` transitional utilities, all orphans: `MessagingAdapter`, `MockFlowLoggingService`, `V8ToV9Adapter`, `V9SpecVersionService`, `specVersionServiceV9`, `apiDisplayServiceV9`, `flowResetServiceV9`, `environmentServiceV9`, `v9UnifiedTokenDisplayService`, `v9OidcDiscoveryService`, `v9OAuthFlowComparisonService`.
- Orphaned single services: top-level `services/tokenIntrospectionService.ts`, `tokenManagementService.ts`, `pkceGenerationService.tsx`, plus redundant `V9AuthorizeService`/`V9TokenService`/`V9IntrospectionService` (no live callers). **Keep** the V9 *mock* services — the V7M V9 pages (gaps) still use them.

**Duplicate flow-controller hooks** (orphans — delete): `useAuthorizationCodeFlowV7Controller`, `useHybridFlowControllerV7`, `useHybridFlowControllerV9`, `useHybridFlow`, `useCibaFlow`, `useCibaFlowV7`, `useResourceOwnerPasswordFlowController`. (Keep the live `useAuthorizationCodeFlowController`, `useResourceOwnerPasswordFlowV7`.)

---

## Section 3 — Sidebar & route simplification

**Sidebar — 6 duplicate flow pairs to remove** (keep the `/v2/flows/*` live entry, drop the legacy one): ROPC, DPoP, PAR (each has a live + a v9 entry in the same group); UserInfo, Redirectless, Implicit (live + legacy in different groups). Also: "Worker Token" (`/flows/worker-token-v9`) silently redirects to client-credentials — remove or fold into Client Credentials; the "Mock Flows" group name is misleading (mixes live + mock).

**Proposed simplified menu (one entry per flow, live route preferred):**
- **OIDC:** Authorization Code, Hybrid, Redirectless, CIBA*, UserInfo, OIDC Discovery/JWKS
- **OAuth 2.0:** Client Credentials, Device, Token Exchange, Introspection, Revocation, Refresh
- **Advanced / FAPI:** PAR, DPoP, ROPC, JWT Bearer*, SAML Bearer*, RAR*, SPIFFE*, WIMSE*, Attestation*, mTLS*, GNAP*, JAR+JARM*, Step-Up*
- **Tools:** Configuration, Discovery, Environments, Token Operations, MCP Agent
- **AI & Identity / Admin & Platform:** keep existing groups
  (`*` = flows2 gap, kept until migrated)

**Route collapse** (~80 redirects today): ~60 v6/v7/v8 redirect-only routes can be deleted now (Client Credentials ×8, Auth Code ×8, Implicit ×8, Device ×4, CIBA ×4, SPIFFE ×5, PAR ×4, ROPC ×4, JWT Bearer ×2, SAML ×3, v7 catch-alls ×5, misc utility ×5). **Bug:** `/flows/saml-bearer-assertion-v7` is defined twice (App.tsx ~1382 and ~1399) — remove the duplicate. Near-term target **~90–100 routes**; after gap migration (Section 1b) the entire `/flows/*` + `/v8u/*` namespaces collapse to **~30–40 routes**.

---

## Section 4 — Dead code (orphans)

madge (which correctly follows this app's lazy `import()`) flags **~514 orphan files / ~190K LOC** in `src/` (after excluding tests, `.d.ts`, entry points). By area: components 164, pages 104, v8 86, utils 40, hooks 33, services 31, v8u 30. Most of Section 2's removals are inside this set. Caveat: a handful may be referenced only by HTML/string — the per-batch `npm run build` gate (fails if a still-imported file is deleted) is the safety net; entry points (`main.tsx`, `AppLazy.tsx`) are already excluded.

---

## Prioritized action plan

| Phase | Work | Risk | Payoff |
|---|---|---|---|
| **0 ✅** | Remove `archived/` | none (not compiled) | −152K LOC (done) |
| **1** | Delete confirmed orphan dead code in per-dir batches: variant clusters (CleanlinessDashboard, OIDCOverview, `pages/protect/`, `services/postman/`, v9 utility services, dead hooks) then the rest of the ~514 orphans | low (build+vitest gate) | −~190K LOC; biggest cleanup |
| **2** | Retire the ~18 legacy flow pages flows2 covers: redirect old routes → `/v2/flows/*`, delete pages; remove the 6 duplicate sidebar pairs | medium (routing) | UI de-duplicated; users land on live demos |
| **3** | Remove the ~60 v6/v7/v8 redirect-only routes; fix the duplicate SAML route def | low–medium | route count ~215 → ~90–100 |
| **4** | Implement the simplified 6-group sidebar | low | clean nav |
| **5** | Migrate the ~22 flows2-GAP concepts (CIBA, JWT Bearer, SAML×2, RAR, SPIFFE, WIMSE, GNAP, JAR/JARM, Step-Up, mTLS, Attestation, …) into flows2; then delete the entire `/flows/*` + `/v8u/*` namespaces | high (real work per flow) | route count → ~30–40; single canonical flow framework |

**Verification per batch:** `npm run build` (exit 0) + `npx vitest run`; commit per batch; keep flows2-gap pages and their (mock) services until Phase 5. The "routed / not routed" calls in this report are agent-inferred — the build gate is the final arbiter before any delete lands.
