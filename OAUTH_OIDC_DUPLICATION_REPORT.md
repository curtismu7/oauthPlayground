# OAuth/OIDC Duplication Audit Report

**Date:** March 10, 2026  
**Scope:** `src/pages/flows/`, `src/components/FlowCategories.tsx`, `src/App.tsx`  
**Goal:** Reduce duplicate OAuth/OIDC flow files and clean up the side menu  
**Recovery:** All deleted files are permanently recoverable from git history — `git checkout <commit> -- <path>` or `git show <commit>:<path>`. No in-repo archive folder needed.

---

## Executive Summary

The app has **two problems**:

1. **File duplication** — multiple versions of the same OAuth/OIDC flows coexist as active routes (Authorization Code, PAR, DPoP, ROPC)
2. **Side menu is entirely broken** — `FlowCategories.tsx` links to routes that **do not exist** (all 404)

Total archiveable code: **~3,500+ lines** across 6+ files.
Total nav fixes needed: **12 broken links** in `FlowCategories.tsx`.

---

## Part 1: File Duplication

### The Canonical Architecture (Keep As-Is)

| Category                      | Canonical File                     | Route                                | Lines |
| ----------------------------- | ---------------------------------- | ------------------------------------ | ----- |
| **Unified OAuth (Auth Code)** | `OAuthAuthorizationCodeFlowV9.tsx` | `/flows/oauth-authorization-code-v9` | 3,612 |
| **DPoP**                      | `DPoPAuthorizationCodeFlowV9.tsx`  | `/flows/dpop-authorization-code-v9`  | 744   |
| **PAR**                       | `PingOnePARFlowV9.tsx`             | `/flows/pingone-par-v9`              | 1,115 |
| **ROPC**                      | `OAuthROPCFlowV9.tsx`              | `/flows/oauth-ropc-v9`               | 1,023 |
| **Implicit**                  | `ImplicitFlowV9.tsx`               | `/flows/implicit-v9`                 | 369   |
| **OIDC Hybrid**               | `OIDCHybridFlowV9.tsx`             | `/flows/oidc-hybrid-v9`              | 1,393 |
| **Device Auth**               | `DeviceAuthorizationFlowV9.tsx`    | `/flows/device-authorization-v9`     | 3,602 |
| **Client Credentials**        | `ClientCredentialsFlowV9.tsx`      | `/flows/client-credentials-v9`       | 1,097 |
| **CIBA**                      | `CIBAFlowV9.tsx`                   | `/flows/ciba-v9`                     | ~600  |
| **RAR** (example flow)        | `RARFlowV9.tsx`                    | `/flows/rar-v9`                      | 1,009 |
| **JWT Bearer**                | `JWTBearerTokenFlowV9.tsx`         | `/flows/jwt-bearer-token-v9`         | 1,181 |
| **Token Exchange**            | `TokenExchangeFlowV9.tsx`          | `/flows/token-exchange-v9`           | 1,047 |
| **Worker Token**              | `WorkerTokenFlowV9.tsx`            | `/flows/worker-token-v9`             | 608   |
| **SAML Bearer**               | `SAMLBearerAssertionFlowV9.tsx`    | `/flows/saml-bearer-assertion-v9`    | 1,273 |

### V7M Mock Flows (Keep — these are the intentional "mock flows")

These are the condensed educational flows under `/v7/*` routes. They use `V7MOAuthAuthCodeV9`, `V7MDeviceAuthorizationV9`, `V7MImplicitFlowV9`, `V7MROPCV9`, etc. Keep as mock/simplified educational versions.

| Mock Flow                | Route                            | Purpose              |
| ------------------------ | -------------------------------- | -------------------- |
| V7M OAuth Auth Code      | `/v7/oauth/authorization-code`   | Mock OAuth auth code |
| V7M OIDC Auth Code       | `/v7/oidc/authorization-code`    | Mock OIDC auth code  |
| V7M Device Authorization | `/v7/oauth/device-authorization` | Mock device flow     |
| V7M Client Credentials   | `/v7/oauth/client-credentials`   | Mock client creds    |
| V7M OAuth Implicit       | `/v7/oauth/implicit`             | Mock implicit OAuth  |
| V7M OIDC Implicit        | `/v7/oidc/implicit`              | Mock implicit OIDC   |
| V7M ROPC OAuth           | `/v7/oauth/ropc`                 | Mock ROPC            |
| V7M ROPC OIDC            | `/v7/oidc/ropc`                  | Mock ROPC OIDC       |

---

### Duplicate Files — Delete These

#### 🔴 Group 1: Authorization Code Duplicates (covered by Unified V9)

| File                                        | Route                                                   | Lines    | Issue                                |
| ------------------------------------------- | ------------------------------------------------------- | -------- | ------------------------------------ |
| `OAuth2CompliantAuthorizationCodeFlow.tsx`  | `/flows/oauth2-compliant-authorization-code`            | **921**  | Duplicate of V9 auth code            |
| `OIDCCompliantAuthorizationCodeFlow.tsx`    | `/flows/oidc-compliant-authorization-code`              | **90**   | Thin wrapper, duplicate of V9        |
| `OAuthAuthorizationCodeFlowV7_1/` (9 files) | `/flows/oauth-authorization-code-v7` (→ redirect to V9) | **~700** | Old V7 flow, route already redirects |

**Action:** Delete all three → redirect their routes to `/flows/oauth-authorization-code-v9`.

> Note: `OAuthAuthorizationCodeFlowV7_1` is already redirected in App.tsx (line 699-700), but the file is still compiled and bundled. The `OAuth2Compliant` and `OIDCCompliant` files have **live active routes** — those routes need to be converted to redirects.

**Estimated savings: ~1,700 lines**

---

#### 🔴 Group 2: PAR Duplicate

| File                   | Route                   | Lines     | Issue                  |
| ---------------------- | ----------------------- | --------- | ---------------------- |
| `PARFlow.tsx`          | `/flows/par`            | **1,067** | Old PAR implementation |
| `PingOnePARFlowV9.tsx` | `/flows/pingone-par-v9` | 1,115     | ✅ V9 canonical — keep |

`PARFlow.tsx` appears to be an earlier implementation. Both routes are active. The V9 version (`PingOnePARFlowV9.tsx`) is the one kept.

**Action:** Delete `PARFlow.tsx` → convert `/flows/par` to redirect → `/flows/pingone-par-v9`.

**Estimated savings: 1,067 lines**

---

#### 🟡 Group 3: DPoP Duplicate (assess intent)

| File                              | Route                               | Lines   | Issue                                         |
| --------------------------------- | ----------------------------------- | ------- | --------------------------------------------- |
| `DPoPFlow.tsx`                    | `/flows/dpop`                       | **822** | Header says "Educational/Mock Implementation" |
| `DPoPAuthorizationCodeFlowV9.tsx` | `/flows/dpop-authorization-code-v9` | 744     | ✅ V9 canonical — keep                        |

`DPoPFlow.tsx` is explicitly labeled as a mock/educational implementation (comment in file header). This makes it a candidate to keep as an **example flow** showing DPoP without requiring real credentials — similar to the V7M mock flows.

**Decision needed:**

- If it demonstrates DPoP key generation/proof concepts without a live PingOne app → **keep as example flow**
- If V9 covers the same ground with better UX → **delete and redirect** `/flows/dpop` → `/flows/dpop-authorization-code-v9`

**Estimated savings if archived: 822 lines**

---

#### 🔴 Group 4: ROPC Duplicate

| File                                    | Route                   | Lines   | Issue                            |
| --------------------------------------- | ----------------------- | ------- | -------------------------------- |
| `V7RMOIDCResourceOwnerPasswordFlow.tsx` | `/flows/mock-oidc-ropc` | **185** | Old RMOIDC variant, thin wrapper |
| `OAuthROPCFlowV9.tsx`                   | `/flows/oauth-ropc-v9`  | 1,023   | ✅ V9 canonical — keep           |

**Action:** Delete `V7RMOIDCResourceOwnerPasswordFlow.tsx` → convert `/flows/mock-oidc-ropc` to redirect → `/flows/oauth-ropc-v9`.

**Estimated savings: 185 lines**

---

#### 🔴 Group 5: Dead Code — `OAuthFlows.tsx` (Old Flow List Page)

| File                       | Status                            | Lines   |
| -------------------------- | --------------------------------- | ------- |
| `src/pages/OAuthFlows.tsx` | Not imported anywhere — dead code | **902** |

App.tsx mounts `OAuthFlowsNew` at `/flows`. The old `OAuthFlows.tsx` is never imported or routed.

**Action:** Delete (never imported — confirmed dead code).

**Estimated savings: 902 lines**

---

#### 🟡 Group 6: Condensed Flow — Assess

| File                                         | Route                                          | Lines   | Notes                  |
| -------------------------------------------- | ---------------------------------------------- | ------- | ---------------------- |
| `OAuthAuthorizationCodeFlowV9_Condensed.tsx` | `/flows/oauth-authorization-code-v9-condensed` | **704** | Streamlined UX variant |

This is a legitimate variant serving a different UX purpose (condensed step-by-step view vs the full educational V9). Keep if it intentionally serves a "quick demo" use case different from the main V9 flow. If V9 has a "compact mode" or the condensed version is rarely used, archive.

---

### Duplication Summary

| #   | File(s)                                     | Decision                              | Savings          |
| --- | ------------------------------------------- | ------------------------------------- | ---------------- |
| 1   | `OAuth2CompliantAuthorizationCodeFlow.tsx`  | **Delete → redirect to V9**           | 921 lines        |
| 2   | `OIDCCompliantAuthorizationCodeFlow.tsx`    | **Delete → redirect to V9**           | 90 lines         |
| 3   | `OAuthAuthorizationCodeFlowV7_1/` (9 files) | **Delete** (route already redirects)  | ~700 lines       |
| 4   | `PARFlow.tsx`                               | **Delete → redirect to PingOnePARV9** | 1,067 lines      |
| 5   | `DPoPFlow.tsx`                              | **Decide: keep as example vs delete** | 822 lines        |
| 6   | `V7RMOIDCResourceOwnerPasswordFlow.tsx`     | **Delete → redirect to ROPC V9**      | 185 lines        |
| 7   | `OAuthFlows.tsx`                            | **Delete (dead code)**                | 902 lines        |
| —   | **Definite total**                          |                                       | **~3,865 lines** |
| —   | **+ DPoP if archived**                      |                                       | **~4,687 lines** |

---

## Part 2: Side Menu (FlowCategories.tsx) — All Links Broken

`FlowCategories.tsx` is the nav/discovery component rendered on the `/flows` landing page. **Every single link currently 404s** — none of the routes it links to exist in App.tsx.

### Broken Links Inventory

| Nav Label                         | Current Route                        | Status                                   | Fix →                                                        |
| --------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| Authorization Code Flow V7        | `/flows/oauth-authorization-code-v7` | Redirects silently to V9, label is wrong | `/flows/oauth-authorization-code-v9` + rename to "V9"        |
| PKCE Flow                         | `/flows/pkce`                        | **404 — route doesn't exist**            | `/flows/oauth-authorization-code-v9` (PKCE is built into V9) |
| Client Credentials                | `/flows/client-credentials`          | **404**                                  | `/flows/client-credentials-v9`                               |
| Device Code Flow                  | `/flows/device-code`                 | **404**                                  | `/flows/device-authorization-v9`                             |
| Hybrid Flow                       | `/flows/hybrid`                      | **404**                                  | `/flows/oidc-hybrid-v9`                                      |
| JWT Bearer Flow                   | `/flows/jwt-bearer`                  | **404**                                  | `/flows/jwt-bearer-token-v9`                                 |
| Worker Token Flow                 | `/flows/worker-token`                | **404**                                  | `/flows/worker-token-v9`                                     |
| Implicit Grant Flow               | `/flows/implicit`                    | **404**                                  | `/flows/implicit-v9`                                         |
| PingOne MFA V7                    | `/flows/pingone-complete-mfa-v7`     | **404**                                  | `/flows/mfa-v8` (active MFA route)                           |
| Worker Token Flow V7              | `/flows/worker-token-v7`             | **404**                                  | `/flows/worker-token-v9`                                     |
| Quick Start: Start with Auth Code | `/flows/authorization-code`          | **404**                                  | `/flows/oauth-authorization-code-v9`                         |
| Quick Start: Compare Flows        | `/flows/compare`                     | **404**                                  | `/flows/v8u/flow-comparison` or remove                       |
| Quick Start: Interactive Diagrams | `/flows/diagrams`                    | **404**                                  | Remove or link to docs                                       |

### Missing Flows in Nav

These V9 flows exist but aren't listed in `FlowCategories` at all:

| Flow           | Route                               |
| -------------- | ----------------------------------- |
| CIBA           | `/flows/ciba-v9`                    |
| PAR            | `/flows/pingone-par-v9`             |
| RAR            | `/flows/rar-v9`                     |
| DPoP (V9)      | `/flows/dpop-authorization-code-v9` |
| ROPC           | `/flows/oauth-ropc-v9`              |
| SAML Bearer    | `/flows/saml-bearer-assertion-v9`   |
| Token Exchange | `/flows/token-exchange-v9`          |
| OIDC Hybrid    | `/flows/oidc-hybrid-v9`             |

### Proposed FlowCategories Structure

```
Essential Flows
  ✅ Authorization Code (PKCE built-in)   → /flows/oauth-authorization-code-v9
  Client Credentials                      → /flows/client-credentials-v9
  Device Authorization                    → /flows/device-authorization-v9
  Worker Token (PingOne)                  → /flows/worker-token-v9

Advanced Flows
  DPoP (Demonstration of Proof-of-Possession) → /flows/dpop-authorization-code-v9
  PAR (Pushed Authorization Requests)     → /flows/pingone-par-v9
  CIBA (Client-Initiated Backchannel)     → /flows/ciba-v9
  OIDC Hybrid                             → /flows/oidc-hybrid-v9
  JWT Bearer                              → /flows/jwt-bearer-token-v9
  SAML Bearer Assertion                   → /flows/saml-bearer-assertion-v9
  Token Exchange (RFC 8693)               → /flows/token-exchange-v9

Example / Extension Flows
  RAR (Rich Authorization Requests)       → /flows/rar-v9
  DPoP Mock (Educational)                 → /flows/dpop  [if kept]

Legacy / Deprecated
  Implicit Grant                          → /flows/implicit-v9

Mock Flows (Simulated, No Real Credentials)
  OAuth Authorization Code                → /v7/oauth/authorization-code
  OIDC Authorization Code                 → /v7/oidc/authorization-code
  Device Authorization                    → /v7/oauth/device-authorization
  Client Credentials                      → /v7/oauth/client-credentials
  Implicit                                → /v7/oauth/implicit
  ROPC                                    → /v7/oauth/ropc

Utilities
  UserInfo                                → /flows/userinfo
  Token Management                        → /token-management
  PingOne Logout                          → /flows/pingone-logout
```

---

## Part 3: Dead Service / Hook Chain

When the duplicate flow files are archived, their supporting hooks and services become fully orphaned. The dependency tree cascades like this:

```
OAuth2CompliantAuthorizationCodeFlow.tsx  ──► useOAuth2CompliantAuthorizationCodeFlow.ts  ──► oauth2ComplianceService.ts
OIDCCompliantAuthorizationCodeFlow.tsx    ──► useOIDCCompliantAuthorizationCodeFlow.ts    ──► oidcComplianceService.ts
                                                                                            └─► oauth2ComplianceService.ts (same)
V7RMOIDCResourceOwnerPasswordFlow.tsx     ──► useV7RMOIDCResourceOwnerPasswordController.ts (uses only V9CredStorage + mockOAuth utils)
                                          ──► createV7RMOIDCResourceOwnerPasswordSteps.tsx
```

Additionally, `useOAuth2CompliantImplicitFlow.ts` and `implicitFlowComplianceService.ts` are **already dead** — nothing imports them from outside their own files.

### Dead Files After Archiving

| File                                                           | Type      | Lines           | Goes Dead When...                                                |
| -------------------------------------------------------------- | --------- | --------------- | ---------------------------------------------------------------- |
| `hooks/useOAuth2CompliantAuthorizationCodeFlow.ts`             | Hook      | **648**         | `OAuth2CompliantAuthorizationCodeFlow.tsx` archived              |
| `hooks/useOIDCCompliantAuthorizationCodeFlow.ts`               | Hook      | **786**         | `OIDCCompliantAuthorizationCodeFlow.tsx` archived                |
| `hooks/useOAuth2CompliantImplicitFlow.ts`                      | Hook      | **439**         | Already dead — no callers                                        |
| `hooks/useV7RMOIDCResourceOwnerPasswordController.ts`          | Hook      | **483**         | `V7RMOIDCResourceOwnerPasswordFlow.tsx` archived                 |
| `services/oauth2ComplianceService.ts`                          | Service   | **705**         | All 3 hooks above gone (only users)                              |
| `services/oidcComplianceService.ts`                            | Service   | **630**         | `useOIDCCompliantAuthorizationCodeFlow` gone                     |
| `services/implicitFlowComplianceService.ts`                    | Service   | **442**         | Already dead — only called from `useOAuth2CompliantImplicitFlow` |
| `components/flow/createV7RMOIDCResourceOwnerPasswordSteps.tsx` | Component | **583**         | `V7RMOIDCResourceOwnerPasswordFlow.tsx` archived                 |
| **Total**                                                      |           | **4,716 lines** |                                                                  |

### Services That Are NOT Dead After DPoP Archive

`src/services/dpopService.ts` — still used by:

- `src/components/DPoPConfiguration.tsx` (live shared component)
- `src/components/PingOneApplicationConfig.tsx` (live shared component)

Even if `DPoPFlow.tsx` is archived, `dpopService.ts` stays.

### Already-Dead Hooks (zero callers — delete now)

| Hook                                | Lines | Callers                       |
| ----------------------------------- | ----- | ----------------------------- |
| `useOAuth2CompliantImplicitFlow.ts` | 439   | **zero** — safe to delete now |
| `implicitFlowComplianceService.ts`  | 442   | **zero** — safe to delete now |

---

## Part 4: Recommended Action Plan

### Phase 0 — Delete Already-Dead Code Now (Zero Risk)

No route changes needed — these files have zero callers. Git preserves them at every prior commit.

1. `src/hooks/useOAuth2CompliantImplicitFlow.ts` — 439 lines, 0 callers
2. `src/services/implicitFlowComplianceService.ts` — 442 lines, 0 callers
3. `src/pages/OAuthFlows.tsx` — 902 lines, never imported

**Savings: 1,783 lines, no app changes**

---

### Phase 1 — Fix Broken Nav (High Impact, Low Risk)

Fix `FlowCategories.tsx` routes — all string changes, no file deletions needed.

- Update 13 broken routes to correct V9 paths
- Add missing V9 flows (CIBA, PAR, RAR, DPoP V9, ROPC, Token Exchange, SAML, OIDC Hybrid)
- Reorganize into logical categories (Essential / Advanced / Example / Mock / Legacy / Utilities)
- Update "V7" labels to "V9"

---

### Phase 2 — Delete Duplicate Flow Files

For each: convert the active route in `App.tsx` to `<Navigate replace />`, then delete the file. Git preserves them in history.

| #   | File                                        | Route                                        | Redirect To                          |
| --- | ------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| 1   | `PARFlow.tsx`                               | `/flows/par`                                 | `/flows/pingone-par-v9`              |
| 2   | `OAuth2CompliantAuthorizationCodeFlow.tsx`  | `/flows/oauth2-compliant-authorization-code` | `/flows/oauth-authorization-code-v9` |
| 3   | `OIDCCompliantAuthorizationCodeFlow.tsx`    | `/flows/oidc-compliant-authorization-code`   | `/flows/oauth-authorization-code-v9` |
| 4   | `V7RMOIDCResourceOwnerPasswordFlow.tsx`     | `/flows/mock-oidc-ropc`                      | `/flows/oauth-ropc-v9`               |
| 5   | `OAuthAuthorizationCodeFlowV7_1/` (9 files) | Already redirects                            | Delete directory only                |

**Route for #5** (`/flows/oauth-authorization-code-v7`) already has `<Navigate>` in App.tsx so no route change needed — just delete the 9 files.

---

### Phase 2.5 — Delete Dead Services + Hooks (Cascades from Phase 2)

After Phase 2 files are deleted, these become fully orphaned:

| File                                                           | Lines | Trigger            |
| -------------------------------------------------------------- | ----- | ------------------ |
| `hooks/useOAuth2CompliantAuthorizationCodeFlow.ts`             | 648   | Phase 2 #2 done    |
| `hooks/useOIDCCompliantAuthorizationCodeFlow.ts`               | 786   | Phase 2 #3 done    |
| `hooks/useV7RMOIDCResourceOwnerPasswordController.ts`          | 483   | Phase 2 #4 done    |
| `components/flow/createV7RMOIDCResourceOwnerPasswordSteps.tsx` | 583   | Phase 2 #4 done    |
| `services/oauth2ComplianceService.ts`                          | 705   | Hooks #1 + #2 gone |
| `services/oidcComplianceService.ts`                            | 630   | Hook #2 gone       |

**Phase 2.5 savings: 3,835 lines**

---

### Phase 3 — Decide on DPoP Mock + Condensed

Two files need a product decision:

- **`DPoPFlow.tsx`** (822 lines): Header says "Educational/Mock Implementation". Does it show DPoP key generation without requiring a live PingOne app? → Keep as Example Flow or delete + redirect `/flows/dpop` → `/flows/dpop-authorization-code-v9`
- **`OAuthAuthorizationCodeFlowV9_Condensed.tsx`** (704 lines): Is the condensed view a valuable "quick start" entry point? → Keep or fold into V9 with a compact mode toggle

---

### Phase 4 — Remove V7_1 Directory (same as Phase 2 #5)

`OAuthAuthorizationCodeFlowV7_1/` has 9 files (main + sub-components). Route already redirects to V9. Safe to delete once Phase 2 is verified.

---

## Total Impact Summary

| Phase         | What                                            | Files    | Lines Removed     |
| ------------- | ----------------------------------------------- | -------- | ----------------- |
| **Phase 0**   | Delete already-dead (no callers)                | 3        | **1,783**         |
| **Phase 1**   | Fix 13 broken nav links in `FlowCategories.tsx` | 1 edited | 0                 |
| **Phase 2**   | Archive duplicate flow files + redirect routes  | 13       | **~3,865**        |
| **Phase 2.5** | Archive dead hooks + services (cascade)         | 6        | **3,835**         |
| **Phase 3**   | DPoP mock + Condensed flow (decision needed)    | 0–2      | **0–1,526**       |
| —             | **Definite total (Ph 0+2+2.5)**                 | **22**   | **~9,483 lines**  |
| —             | **Maximum total (+ Ph 3 if archived)**          | **24**   | **~11,009 lines** |

**Key insight:** The service/hook cascade (Phase 2.5) removes nearly as much code as the flow files themselves — 3 compliance services + 4 hooks total **4,133 lines** that exist purely to support flows that are already being removed.
