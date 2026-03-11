# Project Rules

- Commit frequently with meaningful messages to avoid code loss and keep history granular.
- When committing to GitHub, ensure version numbers are updated in APP, UI, Server, Logs, and verify terminal shows correct version.
- Follow the Flow-Safe-Change-Protocol-Full.md guidelines for zero-regression flow updates.
- **ALWAYS follow UPDATE_LOG_AND_REGRESSION_PLAN.md process** - See `.windsurf/rules/regression-plan-check.mdc` for automated guidance.

## Regression Prevention
- Before making changes to sensitive files, read the regression plan checklist
- After fixing bugs, always update the UPDATE_LOG_AND_REGRESSION_PLAN.md with:
  - Update log entry (what was wrong, cause, fix, files, regression check)
  - Regression checklist item (if easy to regress)
  - Do-not-break areas (if new area added)
- This prevents regressions and maintains code quality across the team
