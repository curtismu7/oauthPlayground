# Credential Guard Standardization Plan

## Objective
Document the cross-flow gaps for credential validation, define a consistent blocking experience, and outline the work needed to ship modal-based credential guards across every credential-driven flow in the playground.

## Candidate Flows (Initial Inventory)

| Flow | File | Controller Hook | Known Required Fields | Blocking Implemented? |
| --- | --- | --- | --- | --- |
| OIDC Hybrid Flow V6 | `src/pages/flows/OIDCHybridFlowV6.tsx` | `useHybridFlowController` | `environmentId`, `clientId` | ✅ (modal) |
| OIDC Authorization Code Flow V6 | `src/pages/flows/OIDCAuthorizationCodeFlowV6.tsx` | `useAuthorizationCodeFlowController` | `environmentId`, `clientId`, `redirectUri?` | ⚠️ verify |
| OAuth Authorization Code Flow V6 | `src/pages/flows/OAuthAuthorizationCodeFlowV6.tsx` | `useAuthorizationCodeFlowController` | `clientId`, `redirectUri` | ⚠️ verify |
| OAuth Implicit Flow V6 | `src/pages/flows/OAuthImplicitFlowV6.tsx` | `useOAuthImplicitFlowController` | `clientId`, `redirectUri` | ⚠️ verify |
| OIDC Implicit Flow V6 | `src/pages/flows/OIDCImplicitFlowV6.tsx` | `useOAuthImplicitFlowController` | `environmentId`, `clientId` | ⚠️ verify |
| OIDC Device Authorization Flow V6 | `src/pages/flows/OIDCDeviceAuthorizationFlowV6.tsx` | `useDeviceAuthorizationFlow` | `environmentId`, `clientId` | ⚠️ verify |
| PingOne PAR Flow V6 | `src/pages/flows/PingOnePARFlowV6.tsx` | `usePingOnePARController` | `environmentId`, `clientId`, `clientSecret` | ⚠️ verify |
| RAR Flow V6 | `src/pages/flows/RARFlowV6.tsx` | `useRARFlowController` | `environmentId`, `clientId` | ⚠️ verify |
| JWT Bearer Token Flow V6 | `src/pages/flows/JWTBearerTokenFlowV6.tsx` | `useJWTBearerTokenFlowController` | `clientId`, `clientSecret` | ⚠️ verify |
| Worker Token Flow V6 | `src/pages/flows/WorkerTokenFlowV6.tsx` | `useWorkerTokenFlowController` | `clientId`, `clientSecret` | ⚠️ verify |
| Device Authorization Flow V6 | `src/pages/flows/DeviceAuthorizationFlowV6.tsx` | `useDeviceAuthorizationFlow` | `clientId`, `clientSecret` | ⚠️ verify |

> **Action**: expand the table after auditing each file; add legacy V5 flows if they reuse controllers or present credential forms.

## Standard Guard Requirements
- **Blocking modality**: Prevent step advancement whenever a required credential field is blank. Trigger `ModalPresentationService` with a standardized warning copy.
- **Controller contract**: Each controller hook should expose either `hasValidCredentials` or `getMissingCredentialFields()`; never rely solely on UI state.
- **UI consistency**: Reuse `ModalPresentationService` for messaging. Keep button labeling consistent (`Back to credentials`).
- **Accessibility**: Ensure modal uses ARIA roles (`role="dialog"`, `aria-modal="true"`) and focus handling (follow-up task).

## Implementation Steps

1. **Inventory Completion**
   - **Deliverable**: Updated table with confirmed required fields and current guard status.
   - **Method**: Inspect each flow’s `handleNext` (or equivalent) plus the controller’s credential validation logic.

2. **Reusable Guard Helper**
   - **Design**: Create `validateCredentialsOrShowModal()` utility (proposed location: `src/services/credentialGuardService.ts`).
   - **Inputs**: Current credentials object, array of required keys, modal state setters.
   - **Outputs**: `{ canProceed: boolean, missingFields: string[] }`.

3. **Controller Enhancements**
   - Ensure controllers populate required credential defaults and expose a `getMissingCredentialFields()` method or similar.
   - Align existing `setCredentials` implementations to update missing-field state.

4. **Flow Integration**
   - Replace manual `handleNext` checks with guard helper calls.
   - Update `StepNavigationButtons` props so `disabledMessage` reflects credential prerequisites when necessary.

5. **QA Checklist**
   - Populate mandatory fields and confirm navigation advances.
   - Clear fields and verify modal blocks progression.
   - Confirm modal closes properly and focus returns to credential inputs.
   - Re-test controller persistence (save/load) so guard doesn’t regress stored credentials.

6. **Documentation & Training**
   - Update `OAUTH_FLOW_STANDARDIZATION_GUIDE.md` or add a short appendix summarizing the guard requirement per flow.
   - Create a testing playbook entry in `TESTING.md` covering credential guard regression checks.

## Open Questions
- Should guard logic also cover optional `redirectUri` when `FlowRedirectUriService` produces `null`? (Need product decision.)
- How should we handle API-driven flows (e.g., Device Code) where credentials might be injected externally? Determine fallback behavior.

## Next Actions
- **[Inventory]** Finish the table audit (priority).
- **[Utility]** Draft the guard helper interface and validate with one additional flow (Authorization Code V6).
- **[Alignment]** Sync with UX/documentation owners about standardized modal messaging.
