# Lint Fix Status Board

This file is the **single source of truth** for lint cleanup coordination.  
If you're fixing lint, **claim a slice here first** so we don’t step on each other.

## Rules of engagement (to avoid collisions)

1. **Claim before coding**
   - Add yourself to the **Claims** table with a specific scope (exact path).
   - One claim = one PR (or a clearly defined series of small PRs).

2. **Keep scopes non-overlapping**
   - Avoid two people editing the same folder tree.
   - If you must touch shared code, coordinate in chat and note it under “Cross-cutting”.

3. **Small PRs**
   - Autofix-only PRs are fine, but isolate them.
   - Manual logic fixes must remain narrow.

4. **Use the `lint` label**
   - Lint/config PRs should use label `lint` and include Lint Delta + Test Evidence in the PR description.

5. **Update this file when you open a PR**
   - Add PR link, update counts if you measured them, and mark the claim “In Review / Merged”.

---

## Baseline (most recent known)

- Total diagnostics: 5,321  
- Errors: 2,767  
- Warnings: 2,472  

> Update these after major milestones or when you run a full baseline scan.

---

## Group tracker (high-level)

| Group | Owner | Status | Latest Errors | Latest Warnings | Notes |
|---|---|---|---:|---:|---|
| Dashboard |  | Not Started |  |  |  |
| Admin & Configuration |  | Not Started |  |  |  |
| PingOne Platform |  | Not Started |  |  |  |
| Unified & Production Flows |  | Not Started |  |  |  |
| OAuth 2.0 Flows |  | Not Started |  |  |  |
| OpenID Connect |  | Not Started |  |  |  |
| PingOne Flows |  | Not Started |  |  |  |
| Tokens & Session |  | Not Started |  |  |  |
| Developer & Tools |  | Not Started |  |  |  |

Status values: Not Started / In Progress / In Review / Done

---

## Claims (the collision-avoidance table)

> **Claim format:** be as specific as possible (a folder, not “the whole repo”).  
> Example scope: `src/dashboard/components` or `src/v8/delete-all-devices/services`

| Claimed By | Group | Scope (exact path) | Type | Branch | PR | State | Started | Target |
|---|---|---|---|---|---|---|---|---|
|  |  |  | Autofix / Manual / Config |  |  | Claimed / In Progress / In Review / Merged |  |  |

### Claiming guidelines
- **Autofix**: safe mechanical changes (imports, formatting, trivial unused).
- **Manual**: correctness fixes, hooks deps, async logic, anything behavior-adjacent.
- **Config**: `biome.json` or tooling changes (coordinate first).

---

## Canary checks (required when shared services are touched)

When a PR modifies shared services/routing/auth/session/token code, test these two canaries and record it in the PR:

- **Dashboard**: `/dashboard`
- **Delete All Devices**: `/v8/delete-all-devices`

---

## Cross-cutting work (coordinate explicitly)

Use this section for changes that affect many areas (high collision risk):
- `biome.json` changes
- repo-wide autofix runs
- shared core utilities used across many apps

| Item | Owner | Plan | PR(s) | Status |
|---|---|---|---|---|
|  |  |  |  |  |

---

## How to run and record lint counts (per scope)

Run:
```bash
npx biome check --only=<scope> --max-diagnostics=200 > lint.<scope>.txt
```

Record in PR:
- Before: Errors/Warns
- After: Errors/Warns
- Test evidence (build + smoke)

---

## Per-group detailed reports (optional but recommended)

If the team wants deeper tracking, create one file per group:

- `docs/linting/by-group/dashboard.md`
- `docs/linting/by-group/admin-config.md`
- etc.

These should include top rules, top files, and PR-sized work items.
