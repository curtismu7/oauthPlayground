# Testing and Rules

**Zero-tolerance migration rules, critical testing prevention, and loop/runtime safeguards.**  
**Last updated:** February 2026

---

## 1. Zero-Tolerance Migration Rules

**Rule: Every V9 migration MUST maintain feature parity with V7/V8.** No “we’ll add it later.”

**Pre-migration:** Feature inventory, function mapping, component list, service dependencies, state, user workflows, error handling, data persistence, worker token usage, URLs/ports.

**Implementation:** Migrate feature-by-feature; preserve every function/UI/service/state/workflow/error path; use standard worker token UI and unified storage.

**Post-migration:** Feature parity test, UI comparison, service integration test, workflow test, error-handling test, data persistence test, no regressions.

---

## 2. Critical Testing Failures Prevention

**Known incident:** V9 page infinite looping (e.g. JWT Bearer flow) due to TypeScript/structural errors (missing imports, variables used outside scope). Fix: ensure `tsc --noEmit` and linter pass before merge; fix missing imports (e.g. `FlowHeader`) and scope issues.

**Before any migration:** Run pre-migration test suite (or at least one failure-path test + one happy-path test for critical flows). Document features and verify parity.

**V9 services:** Keep `src/services/v9/` clean (Biome/TS pass). Fix any “ReferenceError: X is not defined” or “Maximum update depth exceeded” in V9 flows before release.

---

## 3. Infinite Loop Prevention

**Dangerous pattern:** `useEffect` depends on state it updates (e.g. `[controller.credentials, controller.setCredentials]`), causing setState → re-run effect → setState.

**Safe approach:** Depend only on inputs that don’t change as a side effect of the effect (e.g. selected variant, route params). If you must react to “credentials,” use a stable ref or a dependency that changes only when the user intent changes, not when the effect writes.

**Audit:** Search for `useEffect` with dependencies that include state setters or objects that are updated inside the same effect.

---

## 4. Runtime Issues Prevention

- **Async cleanup:** Every `useEffect` that does async work must cancel (e.g. `AbortController`) and avoid setState after unmount.
- **No state updates after unmount:** Guard setState with `if (!controller.signal.aborted)` or similar.
- **Worker token / storage:** Use `unifiedWorkerTokenService` and unified storage; don’t rely only on localStorage for worker credentials (see 02-SERVICES-AND-CONTRACTS and docs/UPDATE_LOG).

---

## 5. Quick Checklist Before Merge

- [ ] Feature parity with source (V7/V8) verified.
- [ ] `tsc --noEmit` and linter pass.
- [ ] No `useEffect` dependency that causes infinite loop (effect updates what it depends on).
- [ ] Async effects have cleanup (abort/unsubscribe); no setState after unmount.
- [ ] Worker token uses standard UI and unified storage where applicable.
- [ ] At least one test covers a failure path (and happy path for critical flows).
