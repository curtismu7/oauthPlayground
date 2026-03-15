# TODO Status - What's Next?

**Date:** 2026-03-14  
**Status:** Infrastructure Complete; Button Migration Not Started; Error Handler ~66% Done

Single source for **Button Migration** and **Consistency Plan** (Error Handler, Logger, UI) status. For a summary of recently completed work (tests, docs, plans), see [readme-latest.md](../../readme-latest.md).

**Related:** [docs/plans.md](../../docs/plans.md) (plan index) · [docs/UPDATE_LOG_AND_REGRESSION_PLAN.md](../../docs/UPDATE_LOG_AND_REGRESSION_PLAN.md) (regression checklist)

---

## Table of contents

| Section | Content |
|--------|--------|
| [Recent completions (2026-03)](#recent-completions-2026-03) | Unified OAuth/MFA tests, Mock MCP, AI Assistant, Astro/plans |
| [✅ COMPLETED](#-completed) | Button infra, Error Handler Phase 1A–1B |
| [🔄 NOT FINISHED - Button Migration](#-not-finished---button-migration) | Phase 4 Testing, Phase 5 Migration checklist |
| [🔄 NOT FINISHED - Consistency Plan](#-not-finished---consistency-plan) | Error Handler remaining, Logger/Duplicates done |
| [📋 RECOMMENDED NEXT STEPS](#-recommended-next-steps) | Option 1 (Button), Option 2 (Error Handler) |
| [📊 Overall Progress](#-overall-progress) | Progress table, effort remaining |
| [🚀 NEXT ACTION](#-next-action) | Numbered checklist + quick commands |

---

## Recent completions (2026-03)

- **Unified OAuth tests:** `test:unified-oauth` fixed (async auth URL, compliance API); 27 tests pass.
- **Mock MCP Agent Flow:** Unit + component tests added; how-to guide `docs/MOCK_MCP_AGENT_FLOW.md`.
- **Unified MFA Test Plan:** `docs/UNIFIED_MFA_TEST_PLAN.md` + `test:unified-mfa` script; some MFA tests need Jest→Vitest migration.
- **AI Assistant Improvement:** Status table and Phase 1–2 checkboxes in `AIAssistant/IMPROVEMENT_PLAN.md`; Popout, Retry, multi-line input still open.
- **Astro / plans:** Icons unblocked in ASTRO_MIGRATION_PLAN; plans.md index and Quick Links updated.

---

## ✅ COMPLETED

### Button State Management Infrastructure (Phase 1-3)
- ✅ **FlowStateContext** - Global state provider created
- ✅ **useActionButton** - Custom hook created  
- ✅ **ActionButtonV8** - Button components created
- ✅ **App.tsx Integration** - Provider added to hierarchy
- ✅ **Documentation** - 6 comprehensive docs created
- ✅ **Code Quality** - All linted with Biome
- ✅ **Alerts Fixed** - Replaced with console.log/error

**Result:** Infrastructure is ready but **NOT YET ADOPTED** by flows

### Quick Win #1: UnifiedFlowErrorHandler (Phase 1A-1B)
- ✅ **Main Page** - MFAAuthenticationMainPageV8.tsx
- ✅ **Critical Flows** - SMS, Email, FIDO2, TOTP
- ✅ **Pattern Established** - Ready for remaining files

**Result:** Partially deployed (21 of 32 files, ~66%)

---

## 🔄 NOT FINISHED - Button Migration

### What's Missing?
**NO flows are using the new ActionButtonV8 pattern yet!**

Current state of flows:
- ❌ OAuthAuthorizationCodeFlowV8 - Has TODO comments, not migrated
- ❌ ImplicitFlowV8 - Using old `<button>` elements
- ❌ All other V8 flows - Using old patterns

### To Complete Button Migration:

#### Phase 4: Testing (Not Started)
- [ ] Unit tests for FlowStateContext
- [ ] Unit tests for useActionButton
- [ ] Integration tests

#### Phase 5: Migration (Not Started)
**High Priority:**
- [ ] MFAAuthenticationMainPageV8.tsx
- [ ] PingOnePARFlowV8/PingOnePARFlowV8.tsx
- [ ] ImplicitFlowV8.tsx

**Medium Priority:**
- [ ] UserLoginModalV8.tsx
- [ ] MFADeviceManagerV8.tsx
- [ ] Other modal components

**Low Priority:**
- [ ] Utility buttons
- [ ] Non-async buttons

**Estimated Effort:** 
- High priority: 4-6 hours
- Medium priority: 3-4 hours
- Low priority: 2-3 hours
- **Total:** 9-13 hours

---

## 🔄 NOT FINISHED - Consistency Plan

### What's Missing?

#### Quick Win #1: UnifiedFlowErrorHandler
**Status:** 21 of 32 files completed (~66%)

**Completed (Phase 1C):**
- [x] UnifiedActivationStep.modern.tsx, UnifiedDeviceSelectionStep.modern.tsx
- [x] WorkerTokenStatusDisplayV8, WorkerTokenSectionV8, workerTokenUIServiceV8
- [x] UserLoginSectionV8, RedirectUriValidatorV8
- [x] MFADeviceCreateDemoV8, useCibaFlowV8Enhanced, useHybridFlowV8, usePasskeyAuth
- [x] mfaServiceV8, mfaAuthenticationServiceV8, SMSFlowV8, EmailFlowV8, WhatsAppFlowV8, MFAFlowBaseV8, unifiedFlowIntegrationV8U

**Phase 1D completed:**
- [x] UnifiedMFARegistrationFlowV8, UnifiedRegistrationStep.modern, UnifiedDeviceSelectionStep, UnifiedConfigurationStep.modern
- [x] MFAReportingFlowV8, TOTPFlowV8 (key catch blocks), MFADeviceOrderingFlowV8

**Remaining:**
- [ ] TOTPFlowV8, SMSFlowV8, EmailFlowV8 (remaining inline catch blocks in complex flows)
- [ ] MFAHubV8 (locked)
- [ ] Additional controller/service files

**Completed (2026-03-13):**
- [x] MFAConfigurationPageV8 - all 9 catch blocks
- [x] FIDO2ConfigurationPageV8 - load policies, load device auth policies
- [x] MobileFlowV8 - load devices, initialize auth, activate device, resend OTP

**Estimated Effort:** 1-2 hours remaining

#### Quick Win #2: Logger Adoption ✅ DONE
- [x] Replace console statements in ApiKeyConfiguration, ReportsPage, errorBoundaryUtils, brave-search-server, mobileTemplates
- [x] SuperSimpleApiDisplayV8 popout intentionally keeps console.log (popout context has no logger)
- [x] Centralized logging service exists: `src/utils/logger.ts` (client), `src/server/utils/logger.js` (server)

#### Quick Win #3: Remove Duplicate Utilities ✅ DONE
- [x] Created `src/utils/errorMessageUtils.ts` with `getErrorMessage(error, fallback?)`
- [x] Consolidated: errorHandlingUtilsV8.extractErrorMessage, unifiedErrorHandlerV8 local extractErrorMessage, ErrorHandlerV8.getErrorMessage
- [x] errorHandlingUtilsV8 and unifiedErrorHandlerV8 now use shared getErrorMessage

#### Phase 4: UI Consistency (Infrastructure Only)
- ✅ Button components created
- ❌ Not adopted by flows yet
- **Remaining:** Full adoption across codebase

---

## 📋 RECOMMENDED NEXT STEPS

### Option 1: Complete Button Migration ⭐ RECOMMENDED
**Why:** Infrastructure is done but unused. Complete the work.

**Tasks:**
1. Add unit tests (2 hours)
2. Migrate 3 high-priority flows (4 hours)
3. Validate and document (1 hour)

**Total:** ~7 hours  
**Impact:** Button state management fully deployed

### Option 2: Complete UnifiedFlowErrorHandler
**Why:** Already ~66% done (21 of 32 files), good momentum

**Tasks:**
1. Migrate remaining device flows (2 hours)
2. Update services (2 hours)
3. Update configuration pages (3 hours)

**Total:** ~7 hours  
**Impact:** Error handling consistency complete

### Option 3: ~~Quick Wins #2 and #3~~ ✅ DONE
Logger Adoption and Remove Duplicates are complete. No action needed.

---

## 🎯 MY RECOMMENDATION

**Start with:** Option 1 - Complete Button Migration

**Reasoning:**
1. Infrastructure is already built (investment made)
2. Documentation is complete
3. Pattern is proven
4. Currently 0% adopted (needs completion)
5. Will improve UX consistency immediately

**Next:** Complete UnifiedFlowErrorHandler (already ~66% done)

**Then:** Quick Wins #2 and #3 are ✅ done (Logger adoption, Remove Duplicates)

---

## 📊 Overall Progress

| Task | Status | Progress | Effort Remaining |
|------|--------|----------|------------------|
| Button Infrastructure | ✅ Done | 100% | 0 hours |
| Button Migration | ❌ Not Started | 0% | 9-13 hours |
| Button Tests | ❌ Not Started | 0% | 2-3 hours |
| Error Handler | 🔄 Partial | ~66% | 1-2 hours |
| Logger Adoption | ✅ Done | 100% | 0 hours |
| Remove Duplicates | ✅ Done | 100% | 0 hours |

**Total Remaining:** ~12-18 hours (Button + Error Handler only)

---

## 📌 FUTURE / BACKLOG

- **Phase 9 (Step-through UX):** Still planned. Refactor all Mock flows to step-through UX (JWT Bearer model): one step at a time, step indicator, Prev/Next, final Flow Completion summary. See `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md` §Phase 9.

---

## ✅ ANSWER TO YOUR QUESTIONS

### Did we finish button migration?
**NO** - We completed the **infrastructure** (FlowStateContext, useActionButton, ActionButtonV8) but **have not migrated any flows** to use it yet. It's like building a highway but no one is driving on it.

### Did we finish consistency plan?
**PARTIAL** - We made progress:
- ✅ UnifiedFlowErrorHandler: ~66% complete (21 of 32 files)
- ✅ Logger Adoption: Done (centralized logger in src/utils/logger.ts)
- ✅ Remove Duplicates: Done (errorMessageUtils.ts, getErrorMessage consolidated)
- ✅ UI Components: Created but not adopted by flows yet

---

## 🚀 NEXT ACTION

**Recommended order:**

1. [ ] **Migrate 3 high-priority flows to ActionButtonV8** — MFAAuthenticationMainPageV8.tsx, PingOnePARFlowV8, ImplicitFlowV8.tsx (~4–6 h).
2. [ ] **Complete UnifiedFlowErrorHandler rollout** — Remaining TOTP/SMS/Email inline catch blocks, controller/service files (~1–2 h).
3. [ ] **Add Button Migration tests** — Unit tests for FlowStateContext, useActionButton (~2 h).
4. [ ] **Full test of MFAAuthenticationMainPageV8** — Manual or E2E after migration.
5. [ ] **Migrate to V9** — When Button Migration and Error Handler are stable.

**Quick commands:** `pnpm run test:unified-oauth` · `pnpm run test:unified-mfa` · `pnpm run test:run`

---

*Last reviewed: 2026-03-14. Update this file when you complete Button Migration items, Error Handler rollout, or other items in the NEXT ACTION list.*
