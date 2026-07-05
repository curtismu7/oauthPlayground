# fixer-plan.md — Lint Debt Fix Plan (Biome / React + Vite / TS+JS / Monorepo)

## Goal

Reduce and control lint debt across the codebase using **Biome** with a workflow that is:
- **incremental**
- **reviewable**
- **low-risk (don’t break the app)**
- **parallelizable** across multiple programmers

Current baseline (from latest scan):
- **5,321** total diagnostics  
- **2,767 errors**, **2,472 warnings**

Primary objective:
- Drive errors down aggressively first (target: **< 500 errors**), then warnings.

---

## Non-Negotiables

1. **Main stays green** (CI must pass before merge).
2. **Small PRs** only (avoid “mega PRs”).
3. **No mixing lint cleanup with feature work.**
4. **Avoid mass formatting** unless it’s explicitly an *autofix-only* PR.
5. **Respect legacy** (`v8`, `v8u`, `v9`): don’t “fix by refactor” unless the team agrees.

---

## Operating Model

### Ownership and parallel work
- Work is split by **app groups** (aligned to sidebar).
- Each group can be worked on in parallel **as long as people don’t overlap the same folders**.
- Each PR has:
  - **owner** (author responsible for merging)
  - **reviewer** (someone familiar with adjacent area)
- If two efforts touch the same hot directories, coordinate and serialize.

### Lint PR labeling + enforcement
- If a PR is primarily lint cleanup/config, add the **`lint`** label.
- Lint-labeled PRs must include in PR description:
  - a Lint section (`## Lint Delta` / `## Lint Results`)
  - commands run
  - before/after counts (errors + warnings)
  - test evidence

---

## App Group Breakdown (Work Buckets)

### 1) Dashboard Group
- `/dashboard` — Dashboard

### 2) Admin & Configuration Group
- `/api-status` — API Status
- `/custom-domain-test` — Custom Domain & API Test
- `/v8/mfa-feature-flags` — MFA Feature Flags
- `/environments` — Environment Management
- `/advanced-configuration` — Advanced Configuration
- `/auto-discover` — OIDC Discovery

### 3) PingOne Platform Group
- `/pingone-user-profile` — User Profile
- `/pingone-identity-metrics` — Identity Metrics
- `/security/password-reset` — Password Reset
- `/pingone-audit-activities` — Audit Activities
- `/pingone-webhook-viewer` — Webhook Viewer
- `/organization-licensing` — Organization Licensing

### 4) Unified & Production Flows Group
- `/v8u/unified` — Unified OAuth & OIDC
- `/v8/unified-mfa` — Unified MFA
- `/v8/delete-all-devices` — Delete All Devices
- `/v8u/flow-comparison` — Flow Comparison Tool
- `/v8u/token-monitoring` — Token Monitoring Dashboard
- `/v8u/enhanced-state-management` — Enhanced State Management (V2)
- `/protect-portal` — Protect Portal App
- `/flows/token-exchange-v9` — Token Exchange (V9)

### 5) OAuth 2.0 Flows Group
- `/flows/oauth-authorization-code-v9` — Authorization Code (V9)
- `/flows/oauth-authorization-code-v9-condensed` — Authorization Code Condensed (V9)
- `/flows/implicit-v9` — Implicit Flow (V9)
- `/flows/device-authorization-v9` — Device Authorization (V9)
- `/flows/client-credentials-v9` — Client Credentials (V9)
- `/flows/dpop-authorization-code-v9` — DPoP Authorization Code (V9)

### 6) OpenID Connect Group
- `/flows/implicit-v9?variant=oidc` — Implicit Flow (V9)
- `/flows/device-authorization-v9?variant=oidc` — Device Authorization (V9 – OIDC)
- `/flows/oidc-hybrid-v9` — Hybrid Flow (V9)
- `/flows/ciba-v9` — CIBA Flow (V9)

### 7) PingOne Flows Group
- `/flows/pingone-par-v9` — Pushed Authorization Request (V9)
- `/flows/redirectless-v9-real` — Redirectless Flow (V9)
- `/flows/pingone-mfa-workflow-library-v9` — PingOne MFA Workflow Library (V9)
- `/flows/kroger-grocery-store-mfa` — Kroger Grocery Store MFA
- `/pingone-authentication` — PingOne Authentication

### 8) Tokens & Session Group
- `/flows/worker-token-v9` — Worker Token (V9)
- `/worker-token-tester` — Worker Token Check
- `/token-management` — Token Management
- `/flows/token-introspection` — Token Introspection
- `/flows/token-revocation` — Token Revocation
- `/flows/userinfo` — UserInfo Flow
- `/flows/pingone-logout` — PingOne Logout

### 9) Developer & Tools Group
- developer tools and utilities

---

## Standard Workflow (Per Group)

### Step 0 — Pick a scope and avoid overlap
Pick one of:
- a whole group (if small), or
- a specific app within a group, or
- a directory slice (e.g., `components/`, `services/`)

Write down the exact paths you’ll touch.

### Step 1 — Run lint (bounded output)
Biome truncates output, so run per-path and capture results:

```bash
npx biome check --only=path/to/scope --max-diagnostics=200 > lint.scope.txt
```

If still too noisy, split further:
- `.../components`
- `.../services`
- `.../hooks`
- etc.

### Step 2 — Classify what you see
For the main rule families, classify into:

- **Correctness / bug risk** (highest priority)
- **Reliability / maintainability**
- **Type safety (TS-only)**
- **Style / consistency** (lowest priority; only if autofix)
- **Accessibility / security** (if applicable)

Mark each as:
- autofixable vs manual
- behavior-changing risk (yes/no)

### Step 3 — Execute in PR-sized chunks
Preferred PR patterns:

1) **Autofix-only PR**
- uses `--write`
- should be mechanical and reviewable
- avoid mixing with manual logic changes

2) **Manual fix PR**
- focuses on correctness errors first
- smallest possible surface area
- explicit test evidence

### Step 4 — Validate + regression
Minimum per PR:
- Build the affected app(s)
- Run unit tests if available
- Smoke test critical routes/flows for that area

If shared services were touched:
- sanity-check at least one dependent app (“canary”)

### Step 5 — Record deltas
In PR description (required for `lint` label):
- before/after error+warning counts for the scope
- commands run
- test evidence

---

## PR Description Template (Required for `lint` label)

Paste into PR description:

```md
## Summary
- What this PR changes:
- Scope (paths):
  - <path 1>
  - <path 2>

## Lint Delta
Command(s) run:
- `npx biome check --only=<path> --max-diagnostics=200`

Before:
- Errors: <n>
- Warnings: <n>

After:
- Errors: <n>
- Warnings: <n>

Notes:
- Autofix used? (Y/N). If yes: `--write` and what it touched
- Remaining diagnostics intentionally left? Why?

## Risk Assessment
- Behavior-changing risk: None / Low / Medium / High
- Details (if not None):

## Test Evidence
- Build: <command or CI job>
- Unit tests: <command or “none”>
- Smoke checks: <what you clicked/validated>

## Cross-App / Shared Service Impact
- Shared services touched: None / <list>
- Dependent apps sanity-checked: None / <list>
```

---

## What We Fix First (Priority Order)

1) **Errors** over warnings  
2) **Correctness** (runtime bug potential) over style  
3) **High-frequency rules** (top offenders)  
4) **Hot paths** (frequently touched apps)  
5) **Legacy areas** (`v8`, `v8u`, `v9`) last, unless they are actively changing

Suggested milestone targets:
- Milestone A: **< 1500 errors**
- Milestone B: **< 800 errors**
- Milestone C: **< 500 errors**

---

## “Never Enable” Rules (Default Policy)

These are too noisy/subjective/expensive for now unless explicitly agreed + scoped:

- complexity limits (complexity, max-lines-per-function, etc.)
- strict naming/style opinions that cause churn
- cycle detection across the whole repo (only scoped if ever)
- TS suppression bans (ban `any`, ban `@ts-ignore`) without a migration plan
- style rules without autofix support

---

## Group Report Template (Optional but Recommended)

If you want consistent reporting per group, create:
`docs/linting/by-group/<group>.md`

Use:

```md
# Lint Report — <Group Name>

## Snapshot
- Date:
- Owner:
- Reviewer:
- Scope paths:
  - <path 1>
  - <path 2>
- Command(s):
  - `npx biome check --only=<path> --max-diagnostics=200`
- Total diagnostics:
  - Errors:
  - Warnings:

## Top Rules (by count)
| Rule / Category | Count | Notes |
|---|---:|---|
| <rule> | <n> | <notes> |

## Top Offending Files
| File | Errors | Warnings | Notes |
|---|---:|---:|---|
| <file> | <n> | <n> | <notes> |

## Proposed Work Items
- PR 1:
- PR 2:
- PR 3:

## Regression Considerations
- Shared services touched:
- Dependent apps to check:
```

---

## Execution Checklist (Per Programmer)

1. Pick a group/app/folder slice (announce in chat to avoid collisions).
2. Run Biome check on the exact paths; capture output.
3. Decide whether PR is:
   - autofix-only, or
   - manual correctness fixes
4. Make the smallest PR possible with clean before/after numbers.
5. Add `lint` label and fill PR template fields.
6. Run build/tests/smoke checks; include evidence.

---

## Done Criteria (Per Group)

A group is “done” when:
- Errors are reduced to an agreed threshold (or near-zero),
- remaining warnings are documented/understood,
- future work doesn’t reintroduce debt (ratchet behavior via review discipline + `lint` PR template enforcement).

---

## FAQ + Safety Checks (to reduce back-and-forth)

### When should I label a PR `lint`?
Label a PR **`lint`** when the primary intent is lint cleanup or lint configuration changes, including:
- changes to `biome.json`
- “autofix-only” runs (`biome check --write`)
- broad lint cleanup in an app/group/folder
- mechanical cleanup driven by lint (unused imports, simple safe rewrites)

Do **not** label `lint` when lint fixes are incidental to feature work.

Why: `lint` label triggers the PR-template requirements (Lint Delta + Test Evidence).

---

### What if Biome truncates output (`--max-diagnostics`)?
Biome truncates diagnostics. Don’t try to fix an entire group in one run. Instead:
- **split by folder** and rerun:
  - `src/<app>/components`
  - `src/<app>/services`
  - `src/<app>/hooks`
- **capture output** for review:
  - `npx biome check --only=<path> --max-diagnostics=200 > lint.<path>.txt`

Rule of thumb: if you can’t review the output comfortably, the scope is too big.

---

### How do we handle legacy `v8` / `v8u` / `v9` paths?
Default policy: **containment + ratchet**.
- Keep lint PRs in legacy folders **small and local**
- Prefer mechanical fixes and obvious correctness fixes
- Avoid refactors “just to satisfy lint” in legacy areas
- If a rule conflicts with legacy patterns, document and **scope/suppress** with justification instead of fighting it everywhere
- If code is being migrated between versions/areas, do it in a **separate, explicit migration PR**

---

### What counts as “high risk” for lint fixes?
Treat these as higher-risk and run the extra runtime checks:
- changes to hooks dependencies or effect logic
- async changes (`await`, promise returns, error handling)
- token/session/auth/redirect handling
- state machines, polling/timers, loops/iterators
- removing “unused” variables where side effects might exist

Call it out in PR Risk Assessment.

---

### What’s the smallest acceptable PR?
Good lint PRs typically:
- touch **one folder** (or a small set of related files)
- fix **one rule family** (or one “top offender”)
- include before/after counts and minimal runtime checks

If the PR feels hard to review, shrink the scope.

---

### What if Biome suggests a fix that seems wrong?
Don’t apply it blindly.
- leave it for later and note it in the group report, or
- add a scoped exception/suppression with a short justification

Goal is steady progress without introducing regressions.

---

## Runtime Safety Test Matrix (required for higher-risk lint fixes)

Not every lint PR needs the full matrix. Use the minimum set based on risk.

### Risk levels
- **Low risk**: formatting, import ordering, unused imports, type-only changes
- **Medium risk**: refactors to satisfy lint, moving code, changing hook deps, minor logic edits
- **High risk**: auth/token flows, redirects, concurrency/async logic, loops/iterators, state machines

### Baseline required checks (all `lint` PRs)
1) **Build succeeds**
- Run your standard build (per-app if applicable)
- Include command + result in PR

2) **Smoke test the touched route(s)**
- Load the page(s) you changed
- Verify there are **no console errors**
- Verify primary UI renders and interactions work

3) **Biome clean for touched scope**
- `npx biome check --only=<scope>`

---

### Additional runtime checks (Medium/High risk)
Perform these **for any PR that changes runtime logic** (not purely mechanical fixes).

#### A) Console error sweep (runtime errors)
- Open DevTools Console
- Reload page(s)
- Confirm no new:
  - `TypeError`, `ReferenceError`
  - React warnings that indicate invalid hook calls or dependency issues
  - “Cannot read properties of undefined”
- Record: “Console clean on routes: X, Y”.

#### B) Looping / infinite render detection (React-specific)
Watch for:
- rapid re-rendering / UI “flicker”
- CPU spike or browser tab hang
- repeated network calls without interaction

Quick checks:
- Keep the page open for **30–60 seconds**
- Navigate away/back once
- If there’s polling, verify it’s stable (not duplicating timers)

If you touched hooks/effects:
- specifically verify `useEffect` isn’t firing continuously.

#### C) Network sanity (duplicate requests / runaway calls)
- Open Network tab
- Reload route(s)
- Confirm expected calls occur **once** (or at expected cadence)
- Watch for:
  - repeated identical requests without user interaction
  - rapidly increasing request count
  - repeated token refresh/reauth patterns

#### D) Auth / redirect flows (if applicable)
If the PR touches any of:
- OAuth/OIDC flows, redirect handlers, token parsing, state/nonce, PKCE, session storage

Run the flow end-to-end:
- start flow
- complete login/consent
- verify redirect returns successfully
- verify tokens/session state are set
- verify logout clears state (if relevant)

Record the exact flow tested in PR notes.

---

## Canary App Checks (when shared services are touched)

If the PR changes shared services used across apps:
- Build and smoke test at least **one dependent app** (a “canary”)
- Prefer a canary that exercises:
  - routing
  - auth/session
  - shared UI components

Record canary app tested + the minimal steps performed.

### Canonical Canary Apps (required when shared services are touched)

When a lint PR modifies **shared services**, **routing utilities**, **auth/session/token logic**, or other cross-app dependencies, run at least these two canaries:

#### Canary 1 — Dashboard (`/dashboard`)
Minimum checks:
- Load `/dashboard`
- Confirm page renders and primary widgets/sections appear
- Open DevTools Console → **no new errors/warnings**
- Open Network tab → verify requests are **not repeating unexpectedly**
- Navigate within the dashboard (at least 1 internal navigation) and return

Watch-outs:
- infinite re-render (CPU spike, flicker)
- repeated polling or duplicated API calls after navigation

#### Canary 2 — Delete All Devices (`/v8/delete-all-devices`)
Minimum checks:
- Load `/v8/delete-all-devices`
- Confirm UI renders and main action(s) are present
- Console → **no runtime errors**
- Trigger the main flow to the last safe step (do not perform destructive actions unless intended)
- Verify request/response behavior looks normal (no repeated calls, no stuck loading)

If this area touches auth/session/token code:
- run the flow end-to-end in the expected environment
- confirm redirect/token/session state behaves normally

Record in PR:
- “Canary tested: Dashboard + Delete All Devices”
- Which routes were opened and what actions were taken
- Whether console/network were clean

---

## Troubleshooting + Guardrails

### If you suspect a lint fix introduced a loop
Common causes:
- effect dependency changed (new function identity each render)
- missing dependency caused stale behavior, then “fixed” incorrectly
- moving logic into render path instead of an effect or memo

Response:
- revert only the risky change(s) and isolate into a separate PR
- add memoization (`useCallback`, `useMemo`) only when justified
- ensure timers/intervals are cleared in cleanup functions

### If Biome suggests a “fix” that feels wrong
- don’t apply it blindly
- leave it for later with a brief note in the group report
- or scope/suppress with justification if it is a known pattern

---

## Minimal Manual Smoke Checklist (copy into PR)
- [ ] No console errors on touched routes
- [ ] No infinite re-render / CPU spike observed
- [ ] Network requests occur at expected cadence (no runaway repeats)
- [ ] Primary UI interactions still work (buttons/forms/navigation)
- [ ] If auth/flows touched: end-to-end flow works
