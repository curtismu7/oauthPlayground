# Design: Wire StateValidationService into live callback (pass 1, state-only)

**Date:** 2026-05-16
**Status:** Approved
**Branch:** `feat/oauth-security-validation`
**Builds on:** `f4aa06c74` (services + 58 tests), `48124d115` (wiring design doc)

## Goal

Wire the committed `StateValidationService` end-to-end into the live OAuth
callback and the four secure flow controllers, **behind a flag, default
WARN-and-allow**, so no existing playground flow regresses. Nonce and id_token
validation are explicitly deferred to later passes.

## Decisions (locked in brainstorming)

1. **Gate placement:** single gate at the top of `processCallback`
   (`src/components/callbacks/AuthzCallback.tsx:~111`), before the popup/V3/V5
   branch fan-out. Not per-branch.
2. **Rollout:** new flag `VITE_ENFORCE_STATE_VALIDATION`. Default `false` =
   validate + log/warn but **allow**. Hard-fail only when flag is true.
3. **Missing stored state:** WARN + allow (un-migrated flows keep working).
4. **Scope this pass:** state only; 4 secure controllers only.
5. **flowId source:** reuse the value each controller already writes to
   `sessionStorage 'active_oauth_flow'`. If a controller does not set it,
   **stop and surface it** — do not fabricate a flowId.
6. **Enforce path:** implemented now but dormant (flag default off), reusing
   the callback's existing popup `postMessage` / redirect error shapes.

## Changes (~6 files)

### 1. New `src/utils/stateValidationGate.ts`
- `resolveFlowId()`: `sessionStorage.getItem('active_oauth_flow')` →
  fallback `JSON.parse(sessionStorage.getItem('flowContext')).flow` →
  `null`.
- `isEnforcing()`: `import.meta.env.VITE_ENFORCE_STATE_VALIDATION === 'true'`.
- `gateState(state: string | null): { ok: boolean; reason?: string; enforced: boolean }`
  - no flowId, or no stored state for it → log warn, `{ ok: true }`.
  - stored state present → `StateValidationService.validateState(flowId, state)`.
    - valid → `{ ok: true }`.
    - invalid → enforcing ? `{ ok: false, reason }` : (log error, `{ ok: true }`).
  - never throws.

### 2. `src/components/callbacks/AuthzCallback.tsx`
One block at the top of `processCallback`, after `currentUrl` is resolved and
before any popup/V3/V5 branching:
- parse `state` from `currentUrl`.
- `const gate = gateState(state)`.
- if `!gate.ok`: set `status='error'`, message = CSRF/state error; if
  `window.opener && !window.opener.closed` emit the existing popup error
  `postMessage({ type: isOAuthV3 ? 'OAUTH_CALLBACK' : 'oauth-callback',
  error: 'invalid_state', error_description: gate.reason })`, else `navigate`
  via the existing default error path; then `return` before fan-out.
- In WARN mode `gate.ok` is always true → zero behavior change.

### 3. State generation — 4 secure controllers
`useAuthorizationCodeFlowController.ts`, `useAuthorizationCodeFlowV7Controller.ts`,
`useHybridFlowController.ts`, `useImplicitFlowController.ts`:
- at the authorize-URL build site, replace the ad-hoc `state` generator with
  `StateValidationService.generateState(flowId)` where `flowId` is the exact
  value that controller already writes to `active_oauth_flow`.
- keep existing `active_oauth_flow` / `flowContext` writes (correlation
  depends on them).
- if a controller does not write `active_oauth_flow`: **halt, report, do not
  invent** (decision 5).
- leave `flowUtils.generateState` and `pingone-url-builders` untouched
  (intentional insecure-demo generators).

## Error handling

Gate never throws; degrades to WARN-allow unless the flag forces enforce.
`StateValidationService` already returns `{ valid:false, error }` on
decrypt/lookup failure; the gate maps that per flag.

## Testing / verification

- New `src/utils/__tests__/stateValidationGate.test.ts`: flowId resolution
  (active_oauth_flow / flowContext / none); WARN-allow on missing state;
  ENFORCE-fail on mismatch; WARN-pass (allow) on mismatch; never-throws.
- Existing 58 service tests must stay green.
- `tsc --noEmit -p tsconfig.json`: changed files add **0** new errors
  (16 pre-existing project errors are unrelated and untouched — minimal diff).
- Per-flow manual matrix deferred to flag-flip time (documented), since
  default WARN = no behavior change in this pass.

## Non-negotiables

- Flag default WARN → no playground flow regresses in this pass.
- Minimal diff: 1 util + 1 test + 1 gate block + 4 one-spot builder swaps.
  No refactor of the 906-line callback.
- One cohesive commit on `feat/oauth-security-validation`.

## Out of scope

Nonce wiring, id_token wiring, recommendations-doc issues #4–6, the
per-flow manual verification matrix (executed when the flag is later flipped).
