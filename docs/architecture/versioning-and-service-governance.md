---
title: Versioning & Service Governance
last_updated: 2025-10-28
owner: platform-engineering
---

## Purpose

This document codifies how we manage shared services and versioning inside the OAuth Playground. Follow these rules whenever modifying code under `src/services/**` or releasing a new build. The guidance is written for both humans and autonomous agents so the rules remain consistent across contributors.

---

## Single Source of Truth for Versions

1. `package.json` holds the canonical semantic version. Bump it according to semver (MAJOR.MINOR.PATCH).
2. `src/version.ts` reads the version from `package.json` and exports `APP_VERSION`. Never hardcode version strings anywhere else.
3. Runtime consumers:
   - UI header (`Navbar`), config loaders (`config.ts`, `pingone.ts`), and any logs pull from `APP_VERSION`.
   - Vite build (`vite.config.ts`) injects `__PINGONE_APP_VERSION__` using the same source.
   - Backend (`server.js`) reports the shared version through `/api/health`.
   - CLI/start scripts (`start-dev.sh`, etc.) must read `package.json` via Node, not shell regex.
4. Whenever you bump the version, ensure the following surfaces reflect it automatically (check at least once):
   - UI badge, `/api/health`, terminal startup banner, `logs/startup.log`.
   - Any external documentation or release notes.

### Version bump enforcement
- Script: `scripts/check-version-bump.mjs` blocks commits that touch `src/services/**` without updating `package.json`.
- Integrate this script in CI (e.g., `npm run lint` or a dedicated workflow) and optional pre-commit hooks so it always runs.

---

## Service-Change Checklist

Apply this checklist when altering anything under `src/services/**` (including shared controllers, UI service factories, or helper utilities that many flows import).

1. **API contract review**
   - Document public exports in the service file header or associated README.
   - Do not introduce breaking changes silently. If signatures change, bump MAJOR version.
2. **Type safety guardrails**
   - Add or update TypeScript tests (e.g., using `tsd`/`vitest` type assertions) to lock down expected interfaces.
   - Reject `any` leaks. Enable `satisfies` or explicit generics where helpful.
3. **Regression test coverage**
   - Add/refresh unit tests that cover the modified logic.
   - Ensure each flow family (authorization, hybrid, implicit, device, etc.) has at least one integration test exercising the shared service. Update snapshots/fixtures as needed.
   - Place shared data in `src/__fixtures__/` so multiple tests reuse identical payloads.
4. **Consumer audit**
   - Search for all imports of the service (`rg "from '.*service'"`) and confirm downstream flows still compile with `npm run test && npm run build`.
   - Run `npm run lint` to catch unused exports or prop drift.
5. **Version + changelog**
   - Bump `package.json` version following semver.
   - Update `CHANGELOG.md` with a note under the new version. Highlight breaking changes plainly.
6. **Communication**
   - Note the change in the PR description with a “Service Impact” section:
     ```
     ## Service Impact
     - [x] Breaking change (requires flow updates)
     - [ ] Behavioral change only
     - [ ] Internal refactor
     ```
   - Ping #oauth-playground (or relevant channel) and tag flow owners when breaking.
7. **Deployment readiness**
   - Ensure CI passes (lint/tests/build, plus type-check of all flows).
   - For breaking releases, provide migration guidance in the PR and changelog.

---

## Test Strategy Requirements

| Layer                 | Expectation                                                                                                   |
|-----------------------|---------------------------------------------------------------------------------------------------------------|
| Unit                  | Every shared service exports at least one unit test verifying core behavior and edge cases.                  |
| Integration (Flows)   | A representative flow per family runs end-to-end with the modified service (Vitest or Playwright smoke).     |
| Type Assertions       | Add compile-time tests (e.g., `vitest` + `expectTypeOf`) to enforce public API shapes.                        |
| Fixtures              | Canonical controller/token fixtures live in `src/__fixtures__/`. Updating them requires reviewing all flows. |

---

## CI & Automation

1. Add a CI job (`.github/workflows/version-governance.yml`) that:
   - Executes `node scripts/check-version-bump.mjs` on pull requests.
   - Runs `npm run test`, `npm run build`, and `npm run lint` to ensure all flows still build.
   - Optionally runs Playwright smoke tests for critical flows nightly.
2. Pre-commit / pre-push hooks (optional but recommended):
   - `npm run lint`
   - `npm run test -- --runInBand --passWithNoTests`
   - `node scripts/check-version-bump.mjs`

---

## When in Doubt

- If you cannot guarantee a change is non-breaking, err on the side of a MAJOR version bump and call out the risk.
- Open an issue titled `[Service Governance]` describing the uncertainty so we can follow up before merging.
- Autonomy agents should halt and request human review when automated checks fail or ambiguity exists about API impact.

---

Following this playbook keeps the OAuth Playground stable for every team and AI worker using it.
