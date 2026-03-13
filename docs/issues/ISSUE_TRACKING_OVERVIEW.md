# Issue Tracking — For Developers

How to use our issue tracking and regression prevention. Everything is in-repo under `docs/`.

---

## Where things live

| Use this | For |
|----------|-----|
| **`docs/issues/ISSUE_REGISTRY.md`** | List of all issues (ID, status, priority, components). |
| **`docs/issues/<name>.md`** | One file per issue (symptoms, root cause, fix, tests). New issues: kebab-case name. |
| **`docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`** | **Main doc.** Section 3 = log of fixes. Section 4 = regression checklist. Section 7 = do-not-break summary. |
| **`docs/issues/ISSUE_TRACKING_SYSTEM.md`** | Template for new issues, lifecycle, testing/monitoring. |
| **`docs/issues/REGRESSION_PREVENTION_CHECKLIST.md`** | Full pre-dev, review, deploy checklists. |

---

## Before you change code

1. Open **`docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`**.
2. Read **Section 4** (Regression checklist) and **Section 7** (Do-not-break) for the files/areas you’re touching.
3. Don’t break the guarantees listed there (sidebar z-index, worker token, discovery logger, buttons, log viewer, AppDiscoveryModalV8U, etc.).

---

## After you fix something

1. **Update log:** Add an entry in **Section 3** of `UPDATE_LOG_AND_REGRESSION_PLAN.md`:
   - Short heading + one-line summary.
   - **Cause**, **Fix**, **Files**, **Regression check** (1–2 concrete steps to verify).
2. If the fix is easy to regress, add or update a bullet in **Section 4** for that area.
3. Run the regression checks you wrote (and any existing ones that apply).

---

## New bug to track

1. Add a file in **`docs/issues/`** named `something-descriptive.md` (kebab-case).
2. Use the template in **`docs/issues/ISSUE_TRACKING_SYSTEM.md`** (Summary, Severity, Affected components, Symptoms, Root cause, Fix, Testing, Prevention).
3. Add the issue to **`docs/issues/ISSUE_REGISTRY.md`** with ID, status, priority, components, root cause.

---

## Do-not-break (quick ref)

- **Sidebar/Navbar:** z-index ≥ 10050 (log viewer is 9999).
- **Worker token:** Modal is source of token; invalid `expiresAt` must not throw; `/environments` must load when token valid.
- **Discovery:** Use `logger.info` only (no `logger.discovery` or `logger.success`).
- **Buttons:** Grey only when disabled; never grey when enabled.
- **Log viewer:** Category filters must filter the displayed content.
- **AppDiscoveryModalV8U:** Backdrop is `div`, not `button`.

Full list and details: **Section 4 & 7** of `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`.

---

**Last updated:** 2026-03-11 (issues: added #010 DPoP flow migration & rules)
