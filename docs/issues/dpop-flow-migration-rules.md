# DPoP Flow Migration & Rules - [MEDIUM] [OPEN]

## Summary
The DPoP flow at `/flows/dpop` has not been fully migrated to the V9 flow pattern. It uses the PingOne-style header and reset button but still uses the older accordion (CollapsibleHeader) layout, lives outside the v9 folder, and is not wired into the field-rules system. It is only partially using PingOne UI (header + colors; no step-by-step stepper).

## Severity
**MEDIUM** — UI/UX consistency, documentation/architecture gap; flow is functional but diverges from other V9 flows.

## Affected Components
- `src/pages/flows/DPoPFlow.tsx` — DPoP flow page (not under `flows/v9/`)
- Field-rules system — no rule config for `dpop-flow` or `dpop-v7` in codebase
- Flow header config — `dpop-flow` present in `flowHeaderService.tsx` (red header)

## Symptoms
1. DPoP flow does not use the step-by-step wizard UI (StepByStepFlow, usePageStepper, FlowUIService) used by JWT Bearer V9, PAR V9, RAR V9.
2. Flow uses CollapsibleHeader (accordion) instead of step chips and Next/Previous navigation.
3. Flow lives at `src/pages/flows/DPoPFlow.tsx` instead of `src/pages/flows/v9/`.
4. Field-rules spec lists "Implement rules for DPoP flow (dpop-v7)" as done, but no `dpop` / `dpop-v7` / `dpop-flow` references exist in field-rules or related config under `src/`.
5. Inconsistent UX compared to other mock/V9 flows that use the shared PingOne step UI.

## Root Cause Analysis
- DPoP flow was given V9FlowHeader and V9FlowRestartButton in a prior fix but was never refactored to the full V9 pattern (step-based layout, v9 folder, FlowUIService).
- Field-rules task (docs/.kiro/specs/field-rules-system/tasks.md) was marked complete for `dpop-v7` but the app flow uses `flowId="dpop-flow"` and no rules implementation for DPoP exists in `src/`.

## Fix Implementation (Proposed)
1. **Optional full migration:** Move `DPoPFlow.tsx` to `src/pages/flows/v9/DPoPFlowV9.tsx`; refactor content into discrete steps and use `StepByStepFlow` (and optionally `usePageStepper` / `FlowUIService`) so the flow matches JWT Bearer V9 / PAR V9 pattern. Update route and sidebar to the new path.
2. **Field rules:** Either register `dpop-flow` (or `dpop-v7`) in the field-rules config used by the app so DPoP gets the same validation/visibility behavior as other flows, or document that DPoP is intentionally excluded and why.
3. **Documentation:** Keep this issue and UPDATE_LOG_AND_REGRESSION_PLAN.md updated when any of the above is done.

## Testing Requirements
- After any migration: open `/flows/dpop` (or new path) and confirm header, reset, and all sections/steps work; no regressions in key generation, proof creation, or Test API Call.
- If field rules are added: verify rule-driven visibility/editability for DPoP flow fields.

## Prevention Measures
- When adding or updating flows under "Mock flows" or "Advanced OAuth", follow the same pattern as other V9 flows (v9 folder, StepByStepFlow or FloatingStepper, FlowUIService, flowId in header config and in field-rules if applicable).
- Reference this issue in any DPoP flow refactor or field-rules change.

## Related Issues
- UPDATE_LOG_AND_REGRESSION_PLAN.md — "DPoP flow: add header and reset button"
- docs/.kiro/specs/field-rules-system/tasks.md — task "Implement rules for DPoP flow (dpop-v7)"
- docs/.kiro/specs/dpop-mock-flows/ — design for DPoP mock flows

## Status
**OPEN** — Tracked; fix deferred until prioritization.

## Created/Updated
- **Created:** 2026-03-11
- **Last Updated:** 2026-03-11
