# Linter Audit System — Developer Guide

> Version 1.0 | Tool: `scripts/lint_per_group.py` | Updated: 2026-03-07

---

## 1. Overview

The **Linter Audit System** scans source code app-by-app — following the sidebar menu order — using six analysis layers:

| Layer | Tool | What it finds |
|-------|------|---------------|
| 1 | **Biome auto-fix** | Formatting + safe import fixes (applied automatically with `--fix`) |
| 2 | **Biome check** | Style, suspicious patterns, correctness rules |
| 3 | **ESLint** | React hooks rules, import rules, custom project rules |
| 4 | **tsc** | TypeScript type errors (all strict flags on) |
| 5 | **Runtime analysis** | 7 custom Python patterns that tsc/Biome don't catch (JSON.parse without try/catch, JWT decode-only, setInterval not assigned, etc.) |
| 6 | **Tests** (opt-in) | Vitest unit tests, Jest API tests, Playwright E2E — mapped per group |

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
| `--list` | Print all 18 group IDs and labels with completion status |
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
4. Runs all six analysis layers on that full file set

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
| `tool: "runtime-analysis"` | Flagged by the Python pattern scanner (not Biome/ESLint/tsc) |

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

The script will automatically move resolved issues to `"status": "fixed"` on the next scan if the issue is no longer reported by the tool.

> **Note:** The script preserves `in_progress`, `fixed`, `waived`, and `auto_fixed` statuses across re-scans. A fresh re-scan will not reset your manually-set statuses.

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
| `lint_per_group.py` | `python3 scripts/lint_per_group.py` | Per-group Biome+ESLint+tsc+runtime scan with manual-fix tracking and service regression detection |

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

## 15. FAQ

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
