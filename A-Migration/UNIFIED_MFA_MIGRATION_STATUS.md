# Unified MFA Migration Status

**Purpose:** Track Unified MFA (`/v8/unified-mfa`) alignment with services and patterns used by other updated flows (Unified OAuth, Worker Token, etc.).  
**Last updated:** 2026-03

---

## 1. Service Usage Comparison

### Unified MFA (current)

| Service/Pattern                      | Unified MFA | Notes                                                                                                                                                                                    |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Worker Token**                     | ✅          | Uses `WorkerTokenUIServiceV8` in UnifiedConfigurationStep; `useGlobalWorkerToken`, `globalWorkerTokenService` via UnifiedFlowServiceIntegration; `unifiedWorkerTokenService` for storage |
| **flowHeaderService / V9FlowHeader** | ❌          | Uses custom `MFAHeaderV8` and `MFAFlowBaseV8` flow-header (red gradient) — not `FlowHeader` or `V9FlowHeader`                                                                            |
| **flowHeaderService FLOW_CONFIGS**   | ❌          | No `unified-mfa-v8` entry; header title/description hardcoded in components                                                                                                              |
| **collapsibleHeaderService**         | ❌          | Device selection uses `usePersistedCollapse` for sections but not `UnifiedFlowCollapsibleHeader`                                                                                         |
| **Modern Messaging**                 | ✅          | Uses `modernMessaging` from V9ModernMessagingService                                                                                                                                     |
| **Restart Flow button**              | ✅ (moved)  | Now at bottom with StepActionButtonsV8 (was in header)                                                                                                                                   |

### Unified OAuth (reference)

| Service/Pattern          | Unified OAuth                                                                 |
| ------------------------ | ----------------------------------------------------------------------------- |
| Worker Token             | ✅ `useGlobalWorkerToken`, `WorkerTokenStatusDisplayV8`, `WorkerTokenModalV8` |
| flowHeaderService        | ✅ `V9FlowHeader` with `oauth-authz-v8u` in FLOW_CONFIGS                      |
| collapsibleHeaderService | ✅ AdvancedOAuthFeatures, FlowGuidanceSystem, SecurityScorecard               |
| StepActionButtonsV8      | ✅ Previous/Next at bottom                                                    |
| Restart                  | Via UnifiedNavigationV8U or step content                                      |

---

## 2. Gaps to Address (Migration Plan)

1. **flowHeaderService**
   - Add `unified-mfa-v8` to FLOW_CONFIGS (flowType: `pingone`, red header, title: "Unified MFA Flow", subtitle for device registration).
   - Consider replacing `MFAFlowBaseV8` flow-header with `V9FlowHeader` or `FlowHeader` — requires adapting MFAFlowBaseV8 to accept header from service.

2. **Collapsible sections**
   - Device selection screen (Configuration, Worker Token Status, Policy Details): consider `UnifiedFlowCollapsibleHeader` from collapsibleHeaderService for consistency with Configuration page and Unified OAuth.

3. **Stepper alignment**
   - MFAFlowBaseV8 uses custom step breadcrumb + StepActionButtonsV8.
   - Migration target: align with V9 flow template / UnifiedFlowSteps pattern if/when MFA moves to V9.
   - For now: Restart Flow button moved to bottom with Previous/Next (StepActionButtonsV8 children).

---

## 3. Completed (2026-03)

- [x] **Restart Flow button** — Moved from flow-header to bottom row with Previous/Next (StepActionButtonsV8).
- [x] **Red header** — MFAFlowBaseV8 and device selection MFAHeaderV8 use PingOne red gradient with white text.
- [x] **Duplicate header removal** — Single header when device selected; title/description via `titleOverride`/`descriptionOverride`.

---

## 4. Related Docs

- `A-Migration/01-MIGRATION-GUIDE.md` — V9 migration, quality gates
- `A-Migration/02-SERVICES-AND-CONTRACTS.md` — Worker token, service contracts
- `docs/COLLAPSIBLE_HEADER_UNIFICATION_PLAN.md` — Collapsible header migration
- `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` — Regression checklist
