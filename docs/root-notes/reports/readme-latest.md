# Latest completed TODOs (2026-03)

Summary of documentation and test work completed in March 2026. For current next steps, see [project/plans/TODO_STATUS.md](project/plans/TODO_STATUS.md).

---

## 1. Astro Migration — Icons unblocked

- **Done:** Clarified that the full Astro component library is still blocked (registry), but **icons are not**. The app uses Ping Icons from `https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css` and the `PingIcon` component.
- **Docs:** [docs/ASTRO_MIGRATION_PLAN.md](docs/ASTRO_MIGRATION_PLAN.md) — added "Icons (unblocked)" section, optional local copy in `src/styles/vendor/`; [docs/plans.md](docs/plans.md) updated (Blocked components only).

---

## 2. Mock MCP Agent Flow — How-to and tests

- **Done:** User guide for the Mock MCP Agent Flow page and full test coverage.
- **How-to:** [docs/MOCK_MCP_AGENT_FLOW.md](docs/MOCK_MCP_AGENT_FLOW.md) — steps, expected results, troubleshooting, secure-auth section.
- **Tests:**  
  - [src/services/__tests__/mockMcpAgentService.test.ts](src/services/__tests__/mockMcpAgentService.test.ts) — unit tests for `listTools()` and `callTool()` (all three tools + unknown tool + errors).  
  - [src/pages/flows/__tests__/MockMcpAgentFlowPage.test.tsx](src/pages/flows/__tests__/MockMcpAgentFlowPage.test.tsx) — component tests: render, Step 1→2→3, Reset, MCP Documentation link.
- **Run:** `pnpm exec vitest run src/services/__tests__/mockMcpAgentService.test.ts src/pages/flows/__tests__/MockMcpAgentFlowPage.test.tsx` — **17 tests pass.**

---

## 3. Unified OAuth tests — All passing

- **Done:** Fixed 5 failing tests in `unifiedFlowIntegrationV8U.integration.test.ts`.
- **Changes:** `generateAuthorizationUrl` is async and returns `{ authorizationUrl, state, ... }` — tests now `await` and assert on `result.authorizationUrl`. PKCE test passes `pkceCodes` as 4th argument. Compliance tests aligned with `getComplianceErrors(specVersion, flowType)` (2 args only). Fixed [docs/UNIFIED_OAUTH_TEST_PLAN.md](docs/UNIFIED_OAUTH_TEST_PLAN.md) line 1 typo.
- **Run:** `pnpm run test:unified-oauth` — **27 tests pass.**

---

## 4. Unified MFA Test Plan — Doc and script

- **Done:** New test plan for MFA (same style as Unified OAuth) and a single command to run MFA-focused tests.
- **Doc:** [docs/UNIFIED_MFA_TEST_PLAN.md](docs/UNIFIED_MFA_TEST_PLAN.md) — test categories, MFA test file table, key routes (§5), run commands (§6), regression checklist (§7), future (E2E, Jest→Vitest).
- **Script:** `pnpm run test:unified-mfa` — runs 8 MFA test files (services, hooks, utils). Some tests have pre-existing Jest/mock issues; see plan for details.
- **Plans:** [docs/plans.md](docs/plans.md) — Plan Index and Quick Links updated.

---

## 5. AI Assistant Improvement — Status and phases

- **Done:** Plan doc updated with current status and Phase 1–2 checkboxes.
- **Doc:** [AIAssistant/IMPROVEMENT_PLAN.md](AIAssistant/IMPROVEMENT_PLAN.md) — "Status (2026-03)" table (Streaming ✅, Conversation persistence ✅, New chat ✅, Persist toggles ✅, Copy + Export ✅, Save .md ✅; Popout, Retry, multi-line not done). Phase 1–2 items marked done/remaining.
- **Plans:** [docs/plans.md](docs/plans.md) — AI Assistant row: "Phase 1–2 mostly done", remaining Popout, Retry, multi-line textarea.

---

## 6. Plans index and regression log

- **Done:** Plans and regression doc kept in sync with the above.
- **Docs:**  
  - [docs/plans.md](docs/plans.md) — Current index, Unified MFA Test Plan row, Quick Links (testing: unified-oauth, unified-mfa, Mock MCP tests).  
  - [docs/UPDATE_LOG_AND_REGRESSION_PLAN.md](docs/UPDATE_LOG_AND_REGRESSION_PLAN.md) — Entries for: Unified MFA Test Plan + script, Unified OAuth integration test fix, Mock MCP Agent Flow tests, Astro icons unblocked (and earlier userinfo/MCP work).

---

## 7. TODO_STATUS — Finished and next actions

- **Done:** [project/plans/TODO_STATUS.md](project/plans/TODO_STATUS.md) completed with recent completions, related doc links, and a clear next-action checklist.
- **Additions:** "Recent completions (2026-03)" (Unified OAuth, Mock MCP, Unified MFA, AI Assistant, Astro/plans). "NEXT ACTION" rewritten as a numbered checklist (Button Migration, Error Handler, tests, MFAAuthenticationMainPageV8, V9). Quick commands: `test:unified-oauth`, `test:unified-mfa`, `test:run`.

---

## Quick reference

| Item | Command / doc |
|------|----------------|
| Unified OAuth tests | `pnpm run test:unified-oauth` (27 pass) |
| Mock MCP Agent Flow tests | `pnpm exec vitest run src/services/__tests__/mockMcpAgentService.test.ts src/pages/flows/__tests__/MockMcpAgentFlowPage.test.tsx` (17 pass) |
| Unified MFA tests | `pnpm run test:unified-mfa` |
| Mock MCP how-to | [docs/MOCK_MCP_AGENT_FLOW.md](docs/MOCK_MCP_AGENT_FLOW.md) |
| Plan index | [docs/plans.md](docs/plans.md) |
| What's next | [project/plans/TODO_STATUS.md](project/plans/TODO_STATUS.md) |
| Regression checklist | [docs/UPDATE_LOG_AND_REGRESSION_PLAN.md](docs/UPDATE_LOG_AND_REGRESSION_PLAN.md) |
