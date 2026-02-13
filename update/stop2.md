# Stop Regressions v2 (Complementary Methods)

This document lists additional methods that **complement** the SWE-15 + Inventory + Gate approach. The goal is to catch both **known regressions** (inventory patterns) and **unknown regressions** (user journeys, UI diffs, service contracts).

---

## 1) Golden-path smoke tests (end-to-end)

Add a small suite of **golden flows** that run headlessly and assert **user-visible outcomes** (not implementation details). Example flows:

- Enroll **TOTP** → verify code → recovery path
- Step-up challenge → success + fail + retry/lockout behavior
- Device remembered vs not-remembered branches
- Logout/login → MFA state preserved correctly

**Why it complements:** the inventory gate catches known bad patterns; E2E catches “it still builds but the user journey broke”.

---

## 2) Contract tests between apps/services

For cross-app/service issues, define a **contract** for each interaction point (request/response schema, required claims, error shapes, status codes) and enforce it with either:

- Consumer-driven contracts (Pact-style), or
- Schema validation tests (OpenAPI/JSON Schema) in both producer + consumer

**Why it complements:** prevents silent breaking changes between services even when UI and unit tests pass.

---

## 3) Snapshot / diff testing for UI outputs

For the “american / united HTML/CSS” class of work, add:

- Visual regression tests (Playwright/Cypress + screenshot diffs)
- DOM snapshots for critical fragments (menus, MFA screens, error banners)

**Why it complements:** inventory checks won’t detect “CSS changed layout” regressions; diffs will.

---

## 4) Change-scope automation (“only run relevant checks”)

Use `git diff` to classify what changed and automatically run the right buckets:

- If `flows/` changed → run MFA golden paths + inventory gate
- If shared UI components changed → run visual diffs across multiple apps
- If auth claims/config changed → run contract tests

**Why it complements:** reduces fatigue, increases compliance, and makes the safety net more consistent.

---

## 5) Staged rollout + canary checks (if you deploy)

If you have multiple environments:

- deploy to stage/canary automatically
- run golden paths + synthetic monitoring
- only then promote

**Why it complements:** catches environment/config issues local checks can’t.

---

## 6) “Regression diary” → gate promotion rule

Adopt a hard rule:

> If a regression escaped once, it must become either an automated test, a contract check, or an inventory gate rule within 24 hours.

**Why it complements:** ensures the safety net grows based on real failures.

---

## Recommended next step (highest ROI)

Without a big buildout: add **5–10 golden-path Playwright tests** and run them in CI immediately after the inventory script. This usually stops the majority of regressions (known + unknown) across UI + services.
