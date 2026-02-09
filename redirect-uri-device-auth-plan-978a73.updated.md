# Redirect URI Analysis & Fix Plan: Device Auth, Device Registration, and OAuth
This plan audits all redirect URI sources and callback routing for Device Authentication, Device Registration, and OAuth flows, then defines and implements a single, consistent return-path strategy aligned with the UI contract.

## Flow Scope
- **Device Registration**: New device onboarding via unified MFA flow (Step 1 OAuth -> Step 2+ device-specific).
- **Device Authentication**: Existing device authentication via MFA hub/flows (Step 1 OAuth -> Step 2+ device-specific).
- **OAuth/OIDC Flows**: Standard authorization code/implicit/hybrid flows in unified V8U system.

## Guiding Principles (cheapest + safest)
- **Redirect URI ≠ Return Target**: treat `redirect_uri` (IdP callback endpoint) separately from the **in-app return target** (what screen/step to resume). This avoids “correct callback, wrong page” failures.
- **Additive first**: introduce a flow-aware return-target contract and callback priority logic before removing any legacy paths.
- **Single writer, single reader**: minimize the number of places that set/clear return-path state; prefer “set at modal open” and “consume once on successful callback”.

## Phase 0: Safety rails (minimal change, high impact)
### 0.1 Introduce a flow-aware Return Target contract (new module)
Add a tiny service (e.g., `ReturnTargetServiceV8U`) that manages a structured return target stored in `sessionStorage`:

- **ReturnTarget shape (structured, versioned)**
  - `kind`: `mfa_device_registration` | `mfa_device_authentication` | `oauth_v8u`
  - `path`: absolute in-app path (may include query params)
  - `step`: explicit numeric step (for traceability)
  - `createdAt`: epoch ms (optional; useful for debugging)

- **Keys (separate per flow kind)**
  - `v8u_return_target_device_registration`
  - `v8u_return_target_device_authentication`
  - `v8u_return_target_oauth`

- **API**
  - `setReturnTarget(kind, target)`
  - `peekReturnTarget(kind)`
  - `consumeReturnTarget(kind)` (returns + clears)
  - **Rule:** only `consume` after successful callback handling.

### 0.2 Set return target at the moment the login modal opens (flow-aware)
Update call sites that open `UserLoginModalV8` to set the return target **right before opening**:
- Device Registration entry → set `{ kind: mfa_device_registration, step: 2, path: <unified MFA step 2+> }`
- Device Authentication entry → set `{ kind: mfa_device_authentication, step: 2, path: <hub / device select> }`
- OAuth V8U entry → set `{ kind: oauth_v8u, step: 2/3, path: <V8U step> }`

### 0.3 Callback handler routing priority (flow-aware, additive)
Update `CallbackHandlerV8U` to resolve navigation in this order:
1. **If a return target exists for the active flow kind → navigate there and consume it.**
2. Else fall back to current/default routing behavior (no breaking change).

### 0.4 Legacy callback paths: alias/redirect, not 404 (until migration is verified)
Keep legacy callback routes working by aliasing them to the canonical handler:
- Example: `/v8/mfa-unified-callback` → canonical callback route/component (preserve query + hash)
- Record usage (log/metric) before removal.


## 1) Inventory redirect URI sources (read-only audit)
- Map **defaults** and **user-editable** values across all flows:
  - `MFARedirectUriServiceV8` (flow mapping + migration rules)
  - `flowRedirectUriMapping.ts` and `redirectUriServiceV8.ts` (callbackPath + flowType)
  - `UserLoginModalV8` (UI field default, saved credentials, override logic)
  - `MFAAuthenticationMainPageV8` (auth flow redirects)
  - `UnifiedMFARegistrationFlowV8_Legacy` (user login modal usage + callback handling)
  - OAuth/OIDC flow entry points (`UnifiedFlowSteps`, `UnifiedFlowIntegrationV8U`, `AuthorizationUrlBuilderServiceV8U`)
- Document where **/mfa-unified-callback** and any legacy **/v8/** paths are generated or forced.

## 2) Trace callback routing and return-path storage
- Trace how callbacks are **sent** and **handled** across flows:
  - OAuth URL creation (`OAuthIntegrationServiceV8`, `AuthorizationUrlBuilderServiceV8U`)
  - Callback routing (`CallbackHandlerV8U`, `App.tsx` routes)
- Identify **state/return-path storage** and usage:
  - `sessionStorage` keys (`user_login_state_v8`, `user_login_return_to_mfa`, `mfa_oauth_callback_return`, etc.)
  - Who sets them, when they're cleared, and what page they target.
- Produce concrete flow diagrams for **Device Registration**, **Device Authentication**, and **OAuth** return targets.

## 3) Define correct return targets per UI contract
- **Device Registration** (unified MFA flow):
  - Post-OAuth callback: Step 2 (Device Selection) or Step 3 (device-specific action)
  - Device-specific next steps:
    - OTP: OTP entry screen (Step 3/4)
    - TOTP: QR code screen then OTP (Step 3/4)
    - FIDO: start browser FIDO process (Step 3/4)
    - Push: confirmation/polling screen (Step 3/4)
- **Device Authentication** (MFA hub/flows):
  - Post-OAuth callback: Device selection or device-specific action
  - Device-specific next steps:
    - OTP: OTP entry screen
    - TOTP: QR code screen then OTP
    - FIDO: start browser FIDO process
    - Push: confirmation/polling screen
- **OAuth/OIDC Flows** (V8U unified):
  - Authorization Code: Step 3 (callback handling)
  - Implicit: Step 2 (parse fragment)
  - Hybrid: Step 3 (parse callback)
- Align with **MFA_DEVICE_AUTHENTICATION_UI_CONTRACT.md** (Step 1 -> Step 2, etc.).

## 4) Fix strategy (additive, no UI change unless required)

### A) Separate concerns: Redirect URI vs Return Target
- **Redirect URI**: what is sent to the IdP as `redirect_uri`.
- **Return Target**: the in-app path/step to resume after callback.
- **Rule:** callback routing must never “guess” the return target from `redirect_uri`.

### B) Unified `redirect_uri` logic (single getter)
- Enforce **one source of truth** for `redirect_uri` used in OAuth URL creation by routing all builders through a single function (e.g., `getRedirectUriForFlow(flowType)`).
- Keep existing inputs (UI field override + mapping defaults + migration rules), but ensure callers never construct callback paths ad hoc.
- **Unified Redirect URI Logic**:
  - Enforce **one source of truth** for redirect URI used in OAuth URL (UI field value).
  - Ensure callback handler **does not override** unified MFA return path.
  - Remove legacy `/v8/` callback paths from active logic (migrations only, no active routing).
- **Return-Path Storage**:
  - Store explicit return path when opening login modal (flow-aware).
  - Clear only after successful consumption.
  - Separate storage keys for Device Reg vs Device Auth vs OAuth flows.
- **Flow-Aware Callback Handling**:
  - Device Registration: return to unified MFA flow at correct step
  - Device Authentication: return to MFA hub or device-specific flow
  - OAuth: return to V8U unified flow at correct step

## 5) Implement changes + regression checks
- **Files to Update**:
  - `UserLoginModalV8` (flow-aware return path storage)
  - `CallbackHandlerV8U` (flow-aware routing, remove legacy paths)
  - `UnifiedMFARegistrationFlowV8_Legacy` (return path setting)
  - `MFAAuthenticationMainPageV8` (return path setting)
  - Redirect services/mapping as needed
- **Regression Checks**:
  - Device authentication no longer falls back to OAuth flow main page
  - Device registration resumes at correct next step
  - Device authentication resumes at correct next step
  - OAuth flows return to correct V8U steps
  - Silent auth does not re-open login modal
  - Legacy `/v8/` callbacks handled via migration only

## 6) Documentation & verification
### Acceptance criteria (Definition of Done)
- Device Registration: after OAuth callback, user resumes at the correct unified MFA step (Step 2 device select or the correct device-specific step) with no unexpected detours.
- Device Authentication: after OAuth callback, user resumes at the correct hub/device step and does **not** fall back to an OAuth “main page”.
- OAuth V8U flows: Authorization Code / Implicit / Hybrid return to the correct V8U step consistently.
- Silent auth does not reopen the login modal or clobber the return target.
- Legacy callback URLs continue to work via alias/redirect until migration is complete.

### Manual verification checklist
- **Device Registration**
  - Start registration → login modal → OAuth → callback → lands Step 2/3 as expected
  - Repeat after refresh mid-flow (if supported)
- **Device Authentication**
  - Start auth → login modal → OAuth → callback → lands device selection/action
- **OAuth V8U**
  - Auth Code: callback lands step 3
  - Implicit: fragment parsing lands step 2
  - Hybrid: callback lands step 3
- **Negative cases**
  - No return target set → fallback behavior still works (no crash)
  - Legacy callback path hit → routes correctly and logs usage
  - Return target consumed only once (no loops)

### Rollout + risk controls (cheap)
- Add temporary debug logging/metrics:
  - when setting return target, when consuming it, and when falling back to defaults
- Remove legacy callback routes only after metrics show no/near-zero usage for an agreed period.
- Update `redirectURI.md` and any relevant UI contract/restore docs if behavior changes.
- Provide a checklist for manual verification (registration + authentication).

### Open Questions
- None (answered on 2026-02-06).
