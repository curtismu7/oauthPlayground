# Plans — Current Index

**Generated:** 2026-03-13  
**Last updated:** 2026-03-13 (docs sync: regression log, Unified MFA Test Plan)  
**Scope:** Active plan documents and project status.

---

## Plan Index

| Plan | Path | Status | Summary |
|------|------|--------|---------|
| Banking Digital Assistant (PingOne) | [docs/BANKING_DIGITAL_ASSISTANT_PINGONE_PLAN.md](BANKING_DIGITAL_ASSISTANT_PINGONE_PLAN.md) | ⬜ Not started | Same UI/behavior as se-ai-demo-banking-digital-assistant; identity and APIs use PingOne (platform) instead of PingOne AIC. Reference code: `se-ai-demo-banking-digital-assistant-main/`. |
| MCP Token Exchange & Mock Flow | [docs/MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md](MCP_TOKEN_EXCHANGE_AND_MOCK_FLOW_PLAN.md) | ✅ Phases 1, 3 done | Phase 1 (MCP doc) ✅. Phase 3 (Mock MCP Agent Flow page + tests) ✅. Phase 2 (Token Exchange command) pending. Phase 4 pending. |
| Collapsible Header Unification | [docs/COLLAPSIBLE_HEADER_UNIFICATION_PLAN.md](COLLAPSIBLE_HEADER_UNIFICATION_PLAN.md) | ⬜ ~60% done | Service + 6 areas migrated. Remaining: UnifiedFlowSteps, CollapsibleSection, flowUIService, PAR/RAR. |
| Mock Flows Standardization | [docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md](MOCK_FLOWS_STANDARDIZATION_PLAN.md) | ✅ Phases 3–8 done | Phases 3–8 ✅. Phase 9 (step-through UX) planned. Migration status, mockFlowStyles, V7MFlowOverview in place. |
| Worker Token Analysis & Plan | [docs/WORKER_TOKEN_ANALYSIS_AND_PLAN.md](WORKER_TOKEN_ANALYSIS_AND_PLAN.md) | ⬜ In progress | 3 of ~16 pages migrated to event. Storage path, modal consolidation pending. |
| Unified OAuth Test Plan | [docs/UNIFIED_OAUTH_TEST_PLAN.md](UNIFIED_OAUTH_TEST_PLAN.md) | ✅ Implemented | FlowTypeSelector, unifiedFlowLoggerServiceV8U tests; E2E unified-oauth spec; `test:unified-oauth` script. |
| Unified MFA Test Plan | [docs/UNIFIED_MFA_TEST_PLAN.md](UNIFIED_MFA_TEST_PLAN.md) | 🔄 Documented | MFA service/hook/utils tests; routes; `test:unified-mfa` script. E2E/backend TBD. |
| Update Log & Regression Plan | [docs/UPDATE_LOG_AND_REGRESSION_PLAN.md](UPDATE_LOG_AND_REGRESSION_PLAN.md) | ✅ Ongoing | Living doc. Updated on every fix. Section 4 checklist, Section 7 do-not-break. |
| MCP Server Development | [MCP_SERVER_DEVELOPMENT_PLAN.md](../MCP_SERVER_DEVELOPMENT_PLAN.md) | ✅ Phases A–C, 5–9 complete | ~70 tools; Auth, Worker, User, OIDC, MFA, CRUD. AI Assistant + MCP wired. MFA expansion next. |
| MCP Server Plan Assessment | [docs/MCP_SERVER_PLAN_ASSESSMENT.md](MCP_SERVER_PLAN_ASSESSMENT.md) | ✅ Assessment complete | Phases A–C, 5–9, AI Assistant + MCP done. MFA expansion next. |
| AI Assistant Improvement | [AIAssistant/IMPROVEMENT_PLAN.md](../AIAssistant/IMPROVEMENT_PLAN.md) | 🔄 Phase 1–2 mostly done | Streaming Groq ✅. Conversation persistence ✅. New chat ✅. Persist toggles ✅. Copy + Export conversation ✅. Save .md (write-to-disk) ✅. **Remaining:** Popout window, Retry on error, multi-line textarea. Phase 3 (knowledge base, summarization, decomposition) future. |
| Astro Migration | [docs/ASTRO_MIGRATION_PLAN.md](ASTRO_MIGRATION_PLAN.md) | ⬜ Blocked (components only) | Full `@pingux/astro` component library requires registry access. **Icons unblocked:** Ping Icons CDN + `PingIcon`; optional local copy. Phase 1 steps documented. |
| Project status / next steps | [project/plans/TODO_STATUS.md](../project/plans/TODO_STATUS.md) | 🔄 In progress | Button migration: infrastructure ✅, flows not yet adopted. UnifiedFlowErrorHandler ~66% (21/32). Recommended: complete Button Migration then Error Handler. |

---

## Related (user-facing, not plans)

| Doc | Path | Notes |
|-----|------|-------|
| Mock MCP Agent Flow (how-to) | [docs/MOCK_MCP_AGENT_FLOW.md](MOCK_MCP_AGENT_FLOW.md) | User guide for the Mock MCP Agent Flow page. |

---

## Quick Links by Area

- **Banking / AI Assistant:** Banking Digital Assistant (PingOne)
- **MCP / Agent:** MCP Token Exchange & Mock Flow, MCP Server Development, MCP Server Plan Assessment
- **UI / flows:** Collapsible Header, Mock Flows Standardization, Project status (Button Migration, Error Handler)
- **Tokens / auth:** Worker Token Analysis
- **Testing:** Unified OAuth Test Plan (`test:unified-oauth`); Unified MFA Test Plan (`test:unified-mfa`); Mock MCP Agent Flow tests
- **Regression:** Update Log & Regression Plan
- **AI Assistant:** AI Assistant Improvement
- **Design system:** Astro Migration
