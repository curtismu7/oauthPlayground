# Linter Audit System — Developer Guide

> Version 2.0 | Tool: `scripts/lint_per_group.py` | Updated: 2026-03-07

---

## 1. Overview

The **Linter Audit System** scans source code app-by-app — following the sidebar menu order — using seven analysis layers (plus optional tests):

| Layer | Tool tag | What it finds |
|-------|----------|---------------|
| 1 | **Biome auto-fix** | Formatting + safe import fixes (applied automatically with `--fix`) |
| 2 | **Biome check** (`biome`) | Style, suspicious patterns, correctness rules |
| 3 | **ESLint** (`eslint`) | React hooks rules, import rules, custom project rules |
| 4 | **tsc** (`tsc`) | TypeScript type errors (all strict flags on) |
| 5 | **runtime-analysis** | 7 patterns: JSON.parse without try/catch, JWT decode-only, setInterval not assigned, localStorage null-deref, fetch response.ok, map-on-nullable, unsafe `as any` cast |
| 6 | **a11y-keyboard** | 7 keyboard accessibility patterns (WCAG 2.1 SC 2.1.1): `<div onClick>` without role, `tabIndex > 0`, onClick without onKeyDown, icon button with no aria-label, autofocus advisory |
| 7 | **a11y-color** | 4 color/visual accessibility patterns (WCAG 1.4.1/1.4.3): hardcoded hex/rgb in style props, color-only state communication, inline `style={{ color:` advisory |
| 8 | **migration-check** | 9 V8→V9 migration gate patterns: `token-value-in-jsx` (**error**), `v4toast-straggler` (**error**), `toastv8-straggler` (**error**), fetch-in-component, fetch without AbortController, useEffect async no-cleanup, raw console.error/warn, throw in service (Gate B), missing loading state |
| 9 | **Tests** (opt-in) | Vitest unit tests, Jest API tests, Playwright E2E — mapped per group |

Each scan writes a **per-group JSON report** to `lint-reports/groups/<id>.json` and regenerates the shared **STATUS.md** dashboard automatically.

### Three-pass safety model

```
Pass 1 (--fix):   Biome auto-fixes formatting / import rules in the group's files
Pass 2 (scan):    Biome + ESLint + tsc + runtime-analysis collect remaining issues
Pass 3 (track):   Issues are persisted in JSON; manually-set statuses survive re-scans
```

---

## 2. Prerequisites

- **Python 3.9+** — `python3 --version`
- **Node 18+** — `node --version`
- **npx** available (comes with npm) — `npx --version`
- `npm install` already run in the repo root

No additional installs needed. The script invokes all tools via `npx`.

---

## 3. Quick Start (first time on this machine)

```bash
# 1. Pull the latest reports and script
git pull

# 2. See what groups are available
python3 scripts/lint_per_group.py --list

# 3. Run a pilot scan on one group (with auto-fix, unit tests)
python3 scripts/lint_per_group.py --fix --tests unit --group dashboard

# 4. Open the status board
open lint-reports/STATUS.md      # macOS
# or view it in VS Code: code lint-reports/STATUS.md
```

---

## 4. Full CLI Reference

```bash
python3 scripts/lint_per_group.py [options]
```

| Flag | Description |
|------|-------------|
| `--list` | Print all 17 group IDs and labels with completion status |
| `--group <id>` | Scan a single group (writes `lint-reports/groups/<num>-<id>.json`) |
| `--all` | Scan every group in sidebar order |
| `--fix` | Apply Biome `--write` auto-fixes **before** scanning |
| `--tests unit` | Run Vitest unit tests mapped to the group after scanning |
| `--tests api` | Run Jest backend API tests mapped to the group (requires backend running) |
| `--tests e2e` | Run Playwright E2E specs mapped to the group (requires full stack) |
| `--tests all` | Run all three test layers |
| `--report` | Regenerate `STATUS.md` from existing JSON reports without re-scanning |
| `--scanned-by <name>` | Record your name in the report (shows in STATUS.md Assignee column) |
| `--update-issue <id>` | Update one issue record by ID (no re-scan) |
| `--status <s>` | New status for `--update-issue`: `open`, `in_progress`, `fixed`, `waived` |
| `--assignee <name>` | Assignee name for `--update-issue` |
| `--notes "<text>"` | Free-text notes for `--update-issue` |

### Examples

```bash
# ------- List & discover -------
python3 scripts/lint_per_group.py --list

# ------- Scan one group -------
python3 scripts/lint_per_group.py --fix --group dashboard
python3 scripts/lint_per_group.py --fix --tests unit --group oauth-flows
python3 scripts/lint_per_group.py --fix --tests all --group tokens-session

# ------- Scan all groups (CI-safe: lint + unit tests only, no server needed) -------
python3 scripts/lint_per_group.py --fix --tests unit --all

# ------- Refresh the dashboard without re-scanning -------
python3 scripts/lint_per_group.py --report

# ------- Update issue status -------
python3 scripts/lint_per_group.py --update-issue oauth-flows-001 --status in_progress --assignee alice
python3 scripts/lint_per_group.py --update-issue oauth-flows-001 --status fixed
python3 scripts/lint_per_group.py --update-issue dashboard-002 --status waived --notes "intentional: console.error in test harness"

# ------- Record who ran the scan -------
python3 scripts/lint_per_group.py --fix --group oauth-flows --scanned-by alice
```

---

## 5. What Gets Scanned Per Group

For each sidebar group the script:

1. Starts with the **page components** listed in the internal `GROUPS` dict (derived from `src/config/sidebarMenuConfig.ts`)
2. Recursively traces **imports** within `src/` up to 3 levels deep
3. Collects the full file set into four categories:
   - **Pages** — `src/pages/**`
   - **Services** — `src/services/**`
   - **Components** — `src/components/**`
   - **Hooks** — `src/hooks/**`
4. Runs all seven analysis layers on that full file set

The resolved file list is written to `files_scanned[]` in the group JSON so you can audit exactly what was checked.

> **Tip:** To see what files will be scanned without running the full analysis, scan the group and look at `files_scanned` in the output JSON.

---

## 6. Available Groups

| # | Group ID | Label |
|---|----------|-------|
| 01 | `dashboard` | Dashboard |
| 02 | `admin-configuration` | Admin & Configuration |
| 03 | `pingone-platform` | PingOne Platform |
| 04 | `unified-production-flows` | Unified & Production Flows |
| 05 | `oauth-flows` | OAuth 2.0 Flows |
| 06 | `oidc-flows` | OpenID Connect |
| 07 | `pingone-flows` | PingOne Flows |
| 08 | `tokens-session` | Tokens & Session |
| 09 | `developer-tools` | Developer & Tools |
| 10 | `education-tutorials` | Education & Tutorials |
| 11a | `oauth-mock-flows` | OAuth Mock Flows |
| 11b | `advanced-mock-flows` | Advanced Mock Flows |
| 11c | `v7m-mock-server-flows` | V7 Mock Server Flows |
| 12 | `ai-ping` | AI - Ping |
| 13 | `ai-prompts` | AI Prompts & Development |
| 14 | `documentation-reference` | Documentation & Reference |
| 15 | `review` | Review - New Apps |

---

## 7. Understanding the JSON Report

Each `lint-reports/groups/<num>-<group-id>.json` follows this schema:

```jsonc
{
  "group_id": "oauth-flows",
  "label": "OAuth 2.0 Flows",
  "scanned_at": "2026-03-07T12:00:00+00:00",
  "scanned_by": "alice",

  // ALL files resolved for this group (pages + imports)
  "files_scanned": ["src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx", ...],

  // Services subset only (used for cross-group regression map)
  "services_scanned": ["src/services/authorizationCodeSharedService.ts"],

  // Cross-group service tracking
  "service_cross_refs": [
    {
      "service": "authorizationCodeSharedService.ts",
      "previously_in": null,       // null = first time this service is scanned
      "check_regression": false    // true = re-test the prior group
    }
  ],

  // Per-tool issue counts
  "biome":   { "errors": 2, "warnings": 5, "auto_fixed": 3 },
  "eslint":  { "errors": 0, "warnings": 2 },
  "tsc":     { "errors": 1 },
  "runtime": { "errors": 0, "warnings": 2 },

  // Test results (only populated when --tests flag is used)
  "tests": {
    "ran_at": "2026-03-07T12:01:00+00:00",
    "unit":   { "passed": 14, "failed": 0, "skipped": 2, "duration_ms": 1240 },
    "api":    null,   // null = not run
    "e2e":    null,
    "overall": "pass"  // "pass" | "fail" | "partial" | "not_run"
  },

  // Individual issues
  "issues": [
    {
      "id": "oauth-flows-001",
      "tool": "biome",
      "file": "src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx",
      "line": 42,
      "col": 5,
      "severity": "warning",
      "rule": "lint/suspicious/noExplicitAny",
      "message": "Unexpected any. Specify a different type.",
      "can_autofix": false,
      "fix_type": "manual",   // "auto" | "manual" | "config"
      "status": "open",       // "open" | "in_progress" | "fixed" | "waived" | "auto_fixed"
      "assignee": null,
      "fixed_at": null,
      "notes": null
    }
  ],

  // Aggregated counts
  "summary": {
    "total": 10, "errors": 3, "warnings": 7,
    "auto_fixed": 3, "manual_required": 4,
    "open": 4, "in_progress": 1, "fixed": 2, "waived": 0
  }
}
```

### Field reference

| Field | Description |
|-------|-------------|
| `fix_type: "auto"` | Biome `--write` can fix it; applied automatically when `--fix` is passed |
| `fix_type: "manual"` | Requires a human code edit |
| `fix_type: "config"` | Fix by changing `biome.json` or `eslint.config.js` |
| `status: "open"` | Not yet worked |
| `status: "in_progress"` | Someone is working it (set `assignee`) |
| `status: "fixed"` | Code has been fixed and verified |
| `status: "waived"` | Intentionally suppressed — `notes` must explain why |
| `status: "auto_fixed"` | Applied by Biome `--write` automatically |
| `tool: "runtime-analysis"` | Runtime bug patterns (JSON.parse, JWT, setInterval, etc.) |
| `tool: "a11y-keyboard"` | Keyboard accessibility patterns (WCAG 2.1 SC 2.1.1) |
| `tool: "a11y-color"` | Color/visual accessibility patterns (WCAG 1.4.1/1.4.3) |
| `tool: "migration-check"` | V8→V9 migration gate regressions — **token-value-in-jsx**, **v4toast-straggler**, **toastv8-straggler** are `error` severity |

---

## 8. Programmer Workflow — Working Manual Issues

**Step 1 — Claim a group**

Check `lint-reports/STATUS.md` to see what's unscanned or has open issues. Pick a group.

```bash
# Run a fresh scan on your group
python3 scripts/lint_per_group.py --fix --tests unit --group oauth-flows --scanned-by yourname
```

**Step 2 — Open the JSON report**

```
lint-reports/groups/05-oauth-flows.json
```

Filter by `"fix_type": "manual"` and `"status": "open"` to find your work queue.

**Step 3 — Claim an issue**

```bash
python3 scripts/lint_per_group.py --update-issue oauth-flows-007 --status in_progress --assignee yourname
```

**Step 4 — Fix the code**

Open the file and line number from the issue record, then make the code change.

**Step 5 — Verify the fix**

```bash
# Re-scan to confirm the issue is gone
python3 scripts/lint_per_group.py --fix --group oauth-flows
```

If the underlying code problem is gone the tool will no longer report it, and the issue will be absent from the new report. **Statuses you set manually (`in_progress`, `fixed`, `waived`) are preserved across re-scans** — the script merges old statuses by issue ID. However, if the issue was re-detected (same rule + file + line) it will remain open in the new report, meaning your fix did not fully resolve it.

> **Note:** The script does **not** automatically promote issues to `fixed` — you must either mark them fixed manually with `--update-issue` or confirm the issue no longer appears in the re-scan output.

**Step 6 — Commit**

```bash
git add src/pages/flows/... lint-reports/groups/05-oauth-flows.json lint-reports/STATUS.md
git commit -m "fix(oauth-flows): resolve noExplicitAny in OAuthAuthorizationCodeFlowV9"
```

---

## 9. Waiving an Issue

Waivers are for cases where the rule genuinely does not apply in this context.

```bash
python3 scripts/lint_per_group.py \
  --update-issue oauth-flows-003 \
  --status waived \
  --notes "reason: type assertion is safe here — validated by zod schema on line 38"
```

Waivers are visible in `STATUS.md` and will be reviewed during code review. If the reviewer disagrees, they can reset the status to `open`.

---

## 10. Service Regression Tracking

When you scan group B and it imports a service that was already scanned in group A, the script:

1. Prints a `⚠️ Service regression warning` to stdout
2. Adds the service to the `⚠️ Service Regression Checks` table in `STATUS.md`
3. Sets `check_regression: true` in `service_cross_refs`

**What to do:**

```bash
# 1. After fixing issues in group B, re-run the original group A scan to verify
python3 scripts/lint_per_group.py --fix --group oauth-flows

# 2. Confirm group A's issues are still in "fixed" status (not re-opened)
cat lint-reports/groups/05-oauth-flows.json | python3 -c \
  "import sys,json; r=json.load(sys.stdin); print([i for i in r['issues'] if i['status']=='open'])"

# 3. Once confirmed, the regression flag clears on the next scan
```

---

## 11. Adding a New Tool / Script

When you add a new tool that other programmers should know about:

1. Add a row to `lint-reports/TOOLS_CHANGELOG.md` (append only — never delete rows)
2. Add a section to this guide under **Section 12**
3. In your commit message, include: `docs: update TOOLS_CHANGELOG`

---

## 12. Available Tools

| Tool | Command | Purpose |
|------|---------|---------|
| `lint_per_group.py` | `python3 scripts/lint_per_group.py` | Per-group Biome+ESLint+tsc+runtime-analysis+a11y-keyboard+a11y-color+migration-check scan with manual-fix tracking and service regression detection |

### migration-check patterns — priority triage

These three patterns are `error` severity and should be fixed before anything else:

| Rule | What it catches | Where to fix |
|------|----------------|-------------|
| `migration-check/token-value-in-jsx` | Raw `access_token`/`id_token`/`client_secret` string interpolated directly into JSX output — security gate | Sanitize/truncate the value before rendering |
| `migration-check/v4toast-straggler` | `v4ToastManager`/`toastV4`/`showToastV4` still referenced | Migrate to `modernMessaging` |
| `migration-check/toastv8-straggler` | `toastV8`/`showToastV8` still referenced | Migrate to `modernMessaging` |

> **Full-codebase scan completed 2026-03-07**: 23,663 total issues / 1,630 errors across all 17 groups.
> Top migration errors: oauth-flows (60 token hits), oidc-flows (61 token hits), pingone-flows (39 token hits).
> Clean group: `ai-prompts` (0 issues).

*Append new tools here as they are built.*

---

## 13. Commit Convention

| Prefix | When to use |
|--------|-------------|
| `fix(<group-id>): <description>` | Code fix in a group's files |
| `chore(<group-id>): update lint report` | JSON/STATUS.md only (no code change) |
| `docs: update TOOLS_CHANGELOG` | New tool added to docs |
| `feat: add <tool name>` | New script/tool added to scripts/ |

Examples:
```
fix(oauth-flows): resolve noExplicitAny in AuthorizationCodeFlowV9
chore(dashboard): update lint report after clean pass
docs: update TOOLS_CHANGELOG with lint_per_group.py
feat: add per-group lint audit system (scripts/lint_per_group.py + lint-reports/)
```

---

## 14. Sharing Results

The entire `lint-reports/` folder is committed to the repo. To share your results:

```bash
git add lint-reports/
git commit -m "chore(<group-id>): update lint report"
git push
```

Other programmers will see your results in `STATUS.md` after `git pull`.

---

## 15. Priority Work Queue

> **Baseline scan: 2026-03-07** — 23,663 issues / 1,630 errors across all 17 groups.
> Pick a group from this table, claim it in STATUS.md, and work top-down.

Groups are ordered by **error count** (highest impact first). Tackle errors before warnings — errors include all `migration-check` security/gate violations.

| Priority | Group ID | Errors | Warnings | Top migration errors |
|----------|----------|-------:|----------:|----------------------|
| 🔴 1 | `oauth-flows` | 324 | 1,562 | token-value-in-jsx×60, v4toast-straggler×4, toastv8-straggler×2 |
| 🔴 2 | `oidc-flows` | 280 | 1,331 | token-value-in-jsx×61, v4toast-straggler×4, toastv8-straggler×2 |
| 🔴 3 | `pingone-flows` | 194 | 996 | token-value-in-jsx×39, toastv8-straggler×2, v4toast-straggler×1 |
| 🔴 4 | `tokens-session` | 143 | 750 | token-value-in-jsx×30, toastv8-straggler×2, v4toast-straggler×1 |
| 🟠 5 | `oauth-mock-flows` | 116 | 398 | token-value-in-jsx×10, toastv8-straggler×2 |
| 🟠 6 | `review` | 114 | 919 | token-value-in-jsx×26, toastv8-straggler×2 |
| 🟠 7 | `advanced-mock-flows` | 82 | 389 | token-value-in-jsx×21, toastv8-straggler×2 |
| 🟠 8 | `developer-tools` | 69 | 569 | token-value-in-jsx×7 |
| 🟡 9 | `v7m-mock-server-flows` | 62 | 124 | token-value-in-jsx×12 |
| 🟡 10 | `admin-configuration` | 59 | 417 | token-value-in-jsx×4, toastv8-straggler×2 |
| 🟡 11 | `pingone-platform` | 59 | 886 | token-value-in-jsx×28, toastv8-straggler×2 |
| 🟡 12 | `unified-production-flows` | 48 | 757 | token-value-in-jsx×15, toastv8-straggler×2 |
| 🟡 13 | `documentation-reference` | 48 | 539 | token-value-in-jsx×20, v4toast-straggler×4 |
| 🟢 14 | `education-tutorials` | 16 | 68 | token-value-in-jsx×1 |
| 🟢 15 | `dashboard` | 13 | 32 | — |
| 🟢 16 | `ai-ping` | 3 | 102 | — |
| ✅ 17 | `ai-prompts` | **0** | **0** | **Clean** |

### How to claim a group

1. Check `lint-reports/STATUS.md` — confirm no one else has claimed it
2. Run the scan with your name:
   ```bash
   python3 scripts/lint_per_group.py --fix --group oauth-flows --scanned-by yourname
   ```
3. Commit the updated JSON + STATUS.md so others see it claimed

### Where to start within a group

Filter the group JSON for `error` severity + `status: "open"` + `tool: "migration-check"` first — these are the gate-blocking issues. Then work `error` severity from other tools, then `warning`.

```bash
# Quick triage: show all open errors in a group
python3 -c "
import json
d = json.load(open('lint-reports/groups/05-oauth-flows.json'))
errs = [i for i in d['issues'] if i['severity']=='error' and i['status']=='open']
for i in errs:
    print(f\"{i['id']}  {i['tool']:<20} {i['file']}:{i['line']}  {i['rule']}\")
"
```

---

## 16. False Positives & Waiver Guidance

Not every flagged issue requires a code change. Some patterns have well-known false-positive cases. Before filing a waiver, confirm the issue is genuinely a false positive using the criteria below.

---

### `migration-check/token-value-in-jsx` (334 hits)

**What it catches:** JSX output that interpolates `access_token`, `id_token`, `refresh_token`, or `client_secret` — a security gate (tokens must be masked/truncated before display).

**Genuine false positives:** The pattern fires on *field names used as object keys or JSX prop names*, not just rendered values. It also fires inside code-generation template strings (Postman scripts, code examples).

| False-positive pattern | Example | Waiver? |
|---|---|---|
| Object key / prop name, not a rendered value | `{ access_token: response.access_token }` assignment | ✅ Waive if value is not rendered to DOM |
| `<pre>` or `<code>` display intentionally showing a token for demo purposes | `<pre>{tokenData.access_token}</pre>` in a demo flow | ✅ Waive with note: "demo display — intentional" |
| Template literal in code-generation service | `postmanCollectionGeneratorV9.ts` template strings | ✅ Waive — these generate code examples, not UI |
| **Actual rendered raw token** in a user-visible string | `<p>Your token: {token}</p>` | ❌ Must fix — truncate/mask |

**Hot files:** `src/components/steps/CommonSteps.tsx` (120 hits) — most are display components for demo flows that intentionally show token fields. Review each hit: if it is inside a `<TokenDisplay>`, `<pre>`, or similar intentional display component, waive with a note. If it is in user-facing UI output with no masking, fix it.

---

### `migration-check/raw-console-in-src` (264 hits)

**What it catches:** `console.error()` or `console.warn()` calls that should have been replaced with `logger.*` during the console migration (completed 2026-03-07 per STANDARDIZATION_HANDOFF.md).

**Known intentional exceptions** — **always waive these, never migrate:**

| File | Reason |
|---|---|
| `src/utils/logger.ts` | IS the logger itself |
| `src/services/loggingService.ts` | Logger output sink — console calls are intentional |
| `src/utils/errorMonitoring.ts` | `console.error = override` monkey-patch lines |
| `src/hooks/useErrorDiagnosis.ts` | Intentionally patches `console.error` as diagnostic tool |
| `src/main.tsx` | `console.warn = override` to filter noisy third-party lib warnings |
| `src/pages/HybridCallback.tsx` L16 | Local logger function that dispatches to `console.error` |
| `src/services/codeGeneration/**` | All calls are inside template literal strings (generated code examples) |
| `src/services/postmanCollectionGeneratorV8.ts` / `V9.ts` | All calls are embedded Postman test script strings |
| `src/v8/` files | V8 codebase — out of migration scope |

**Hot file:** `src/v8/components/WorkerTokenModalV8.tsx` (110 hits) — V8 file, out of scope. Waive all.

---

### `migration-check/fetch-in-component` (191 hits)

**What it catches:** `await fetch(` in a non-service file — the services-first migration rule says network calls belong in service files, not components, hooks, or utils.

**False positives / waivers:**

| Pattern | Action |
|---|---|
| `src/utils/` files (`oauth.ts`, `jwks.ts`, `credentialManager.ts`, `workerToken.ts`) | These are utility modules, not UI components. If they were deliberately placed in `utils/` as shared helpers (not as a migration leftover), waive with note: "utility module — services-first rule does not apply" |
| Low-level framework wrappers (`trackedFetch.ts`) | Waive — these ARE the fetch abstraction |
| Hook files (`src/hooks/`) that own a self-contained network call for good reason | Waive with note explaining why it cannot be in a service |
| Component that directly fetches (e.g. `EnhancedApiCallDisplay.tsx`) | **Fix** — extract to a service |

---

### `migration-check/throw-in-service` (632 hits)

**What it catches:** `throw new Error(` in a service file — Gate B of the migration says services should return `ServiceResult<T>` instead of throwing.

**Context:** Gate B migration is **partially complete** (5 services migrated per STANDARDIZATION_HANDOFF.md). The majority of `throw` hits are in services that have **not yet been migrated to Gate B**. These are **not false positives** — they are real work items — but they are low priority compared to `error`-severity issues.

**Waiver guideline:** Only waive if the `throw` is in a constructor, a guard that is always caught by the caller, or an intentional re-throw in an error boundary. Otherwise mark `in_progress` and track it.

---

### `migration-check/fetch-no-abort-signal` (381 hits)

**What it catches:** `await fetch(` without an `AbortController` signal — the async cleanup gate requires cancellable requests.

**False positives:**

| Pattern | Action |
|---|---|
| One-shot fire-and-forget calls (e.g. analytics pings, token revocation) where cancellation is meaningless | Waive with note: "fire-and-forget — abort not applicable" |
| Server-side / Node.js scripts (`configurationManagerCLI.js`, etc.) | Waive — no component unmount lifecycle |
| Calls already wrapped in a retry/timeout utility that handles abort internally | Waive with note pointing to the wrapper |
| All others | Fix — add `AbortController` and pass `signal` |

---

### `a11y-keyboard/onclick-no-keydown` (2,409 hits)

**What it catches:** `onClick` on a non-`<button>`/`<a>` element without a paired `onKeyDown`/`onKeyPress` handler.

**High-volume false positives:** Many hits are on library component wrappers (FluentUI `<Button>`, PingOne `<PButton>`, custom `<StepButton>`) that render as native `<button>` elements internally and are already keyboard-accessible. The regex cannot see through the component abstraction.

| Pattern | Action |
|---|---|
| `onClick` on a custom component that renders as `<button>` internally (e.g. `<StepButton>`, `<PButton>`, `<IconButton>`) | Waive with note: "component renders as native button — keyboard accessible" |
| `onClick` on a `<div>` or `<span>` that IS the interactive surface (not a wrapper) | **Fix** — add `role`, `tabIndex={0}`, and `onKeyDown` |
| `onClick` on a drag handle, resize handle, or other non-button visual affordance with custom keyboard handling elsewhere | Waive with note explaining the keyboard alternative |

**Hot files:** `src/components/steps/CommonSteps.tsx`, `src/components/ConfigCheckerButtons.tsx` — review case by case.

---

### `a11y-color/hardcoded-hex-color` (6,147 hits)

**What it catches:** Hardcoded hex/rgb values in JSX `style=` props instead of design tokens or CSS variables.

**This is an `info`-severity pattern** — it will never block a release. Work it after all `error` and `warning` issues are resolved.

**Common false positives:**
- Dynamic color calculations (e.g. `hsl(${hue}, 100%, 50%)`) — these are intentional
- SVG `fill=` or `stroke=` attributes with brand colors — waive if the color is defined in the design system and cannot use a CSS var
- Chart/graph libraries that require numeric color values — waive with note

**Fix strategy:** Replace all `#xxxxxx` values in `style=` props with a CSS variable reference (`var(--color-something)`) or a token constant from the design system. Do this in bulk per file rather than issue by issue.

---

### General waiver command

```bash
python3 scripts/lint_per_group.py \
  --update-issue <issue-id> \
  --status waived \
  --notes "reason: <explanation>"
```

Waivers are visible to reviewers in `STATUS.md`. Every waiver **must** have a `notes` value — empty-note waivers will be rejected in code review.

---

## 17. FAQ

**Q: The script says "biome: 0 issues" but I can see linter errors in VS Code.**
A: VS Code uses the workspace biome extension, which may use a different config scope. Run with `--fix` to apply all safe fixes first, then re-scan.

**Q: tsc shows errors in files I didn't touch.**
A: The tsc scan is global — it runs `tsc --noEmit` then filters to your group's files. Errors in shared utils that your page imports will show up. Check `previously_in` in `service_cross_refs` — another programmer may have already claimed those files.

**Q: My manual status (`fixed`, `waived`) was reset after a rescan.**
A: This should not happen — statuses are preserved. If it did happen, check `git log lint-reports/groups/<id>.json` to see who overwrote the file.

**Q: I want to add a new group (new sidebar section).**
A: Add an entry to the `GROUPS` dict in `scripts/lint_per_group.py`, following the existing pattern. Then commit the script change with `feat: add <group-name> group to lint_per_group.py`.

**Q: Can I run this in CI?**
A: Yes. Use `--tests unit --all` (no `--fix` in CI so the diff is clean). Set `--scanned-by ci` for the report. Gate the CI step on `summary.errors == 0`.
