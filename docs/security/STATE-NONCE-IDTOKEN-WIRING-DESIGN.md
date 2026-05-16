# Wiring design: state / nonce / id_token validation into live flows

**Date:** 2026-05-16
**Status:** Design — not yet implemented
**Branch:** `feat/oauth-security-validation`
**Prereq committed:** `f4aa06c74` (services + 58 passing tests + `OAUTH_OIDC_RECOMMENDATIONS.md`)

## Problem

Three hardened services exist and are unit-tested but **not wired** into any
live flow:

- `StateValidationService` (CSRF, RFC 6819)
- `NonceValidationService` (OIDC replay)
- `IdTokenValidator` (JWT sig + claims + at_hash/c_hash)

An earlier in-flight edit wired state validation into
`src/pages/AuthzCallback.tsx` — but that file is **dead code** (imported
nowhere) and the edit used a `sessionStorage.getItem('oauth_flow_id') ||
'default'` shortcut that collapses all concurrent flows to one storage key.
That edit was reverted.

The real routed callback is **`src/components/callbacks/AuthzCallback.tsx`**
(906 lines), wired in `App.tsx` to `/oauth-callback`, `/oidc-callback`,
`/mfa-callback`, `/pingone-callback`, `/callback/*`. It extracts `code`/`state`
in **~24 branch points** (popup, OAuth V3, Enhanced V3, V5, default
`handleCallback`) and forwards via `postMessage` / `navigate` /
`sessionStorage` **without validating state or nonce**.

## Core design gap and its resolution

`StateValidationService` keys storage by `flowId`. The callback must recover
the same `flowId` on return to validate. **A correlation mechanism already
exists and must be reused — not reinvented:**

- Flows already call `sessionStorage.setItem('flowContext', JSON.stringify(...))`
  and `sessionStorage.setItem('active_oauth_flow', flowKey)` before redirect
  (`useAuthorizationCodeFlowController.ts:1213/1328`,
  `useAuthorizationCodeFlowV7Controller.ts:1038/1104`, others).
- The callback already reads `sessionStorage.getItem('flowContext')`
  (`AuthzCallback.tsx:173`) and derives `isOAuthV3` / `isEnhancedV3` / `isV5`.

**Decision:** `flowId` = the existing `active_oauth_flow` key (fallback:
`flowContext.flow`). No new correlation scheme, no `'default'` collapse. State
generation and validation both key off the value the flow already persists.

## Scope (real, after excluding doc examples)

`grep` shows 17 files referencing authorize-URL building, but several hits are
**documentation code blocks** (e.g. `V7MOAuthAuthCodeV9.tsx:1038`
`crypto.randomUUID()` inside a displayed snippet), not call sites. Real
integration surface:

| Layer | Files (approx) | Change |
|---|---|---|
| State generation | the auth-URL builders in `src/hooks/useAuthorizationCodeFlowController.ts`, `useAuthorizationCodeFlowV7Controller.ts`, `useHybridFlowController.ts`, `useImplicitFlowController.ts` | replace ad-hoc `generateState()` with `StateValidationService.generateState(flowId)`; keep writing `active_oauth_flow` |
| Nonce generation | OIDC builders (hybrid, implicit, auth-code with `openid` scope) | `NonceValidationService.generateNonce(flowId)`; add `nonce` to auth URL |
| Validation | `src/components/callbacks/AuthzCallback.tsx` — one shared pre-forward gate | validate state (always) + nonce (when id_token present) **before** any `postMessage`/`navigate`/store |
| id_token | post-token-exchange in `useAuth().handleCallback` path | `IdTokenValidator.validateIdToken()` after token response |

## Approach: single choke-point, not 24 edits

The callback has a single entry `processCallback()` (line 111) that fans into
the 24 branches. **Do not** add validation to all 24 sites. Instead:

1. At the **top** of `processCallback`, once `code`/`state` are read from the
   URL, resolve `flowId` from `active_oauth_flow`/`flowContext`.
2. Run `StateValidationService.validateState(flowId, state)` once. On failure,
   short-circuit to the existing error path (set error status + the existing
   `postMessage`/`navigate` error shape per branch) **before** the branch fan-out.
3. Nonce + id_token validation happens in the token-exchange result path
   (`handleCallback`), not the callback URL parse — that is where `id_token`
   first exists.

This converts a 24-site change into ~3 focused edits + the builder changes.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Breaking every OAuth flow in the playground (its core purpose) | Land behind a flag `VITE_ENFORCE_STATE_VALIDATION` (default off in dev demo, on for the "secure" educational mode) until each flow verified |
| Flows that legitimately do not set `active_oauth_flow` | Validation must **warn + allow** when no stored state exists in non-enforcing mode; only hard-fail in enforcing mode |
| Popup vs full-redirect branches store state differently | Resolve `flowId` from the same `flowContext` the popup branch already reads; add a regression test per branch type |
| Existing `generateState` (`flowUtils`, `pingone-url-builders`) used by demos that intentionally show tampering | Keep those for explicitly "insecure demo" flows; only swap secure/production flow builders |

## Execution plan (follow-up, not this session)

1. Add `VITE_ENFORCE_STATE_VALIDATION` flag + a `resolveFlowId()` helper
   reading `active_oauth_flow`/`flowContext`.
2. Swap state generation in the 4 secure builders; add nonce for OIDC.
3. Add the single pre-fan-out validation gate in `processCallback`.
4. Add `IdTokenValidator` call in the `handleCallback` token path.
5. Per-flow manual verification matrix (auth-code, hybrid, implicit, PAR, V3,
   V5, popup) before flipping the flag default.
6. Add integration tests mirroring the 58 unit tests at the callback layer.

Each step is independently revertable; no step touches more than ~4 files.

## Not in scope

Recommendations doc issues #4–6 (redirect-URI strictness, token storage,
error disclosure) — separate efforts.
