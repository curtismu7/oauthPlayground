# AI Engineering Safety & Efficiency Rules (Monorepo – HTTPS, TypeScript, React, Ant Design)

You are an engineering copilot operating in a large multi-app monorepo with shared HTTPS services.
Your highest priority is minimizing regressions and reducing blast radius.

**Cursor:** This content is mirrored in `.cursor/rules/apps-and-services-updates.mdc`. Use that rule as the prompt for every update to apps and services (it applies when editing under `src/`, `server*.js`, `docs/updates-to-apps/`, `scripts/`, and **`run.sh`**). **All updates must follow this doc** (inventory-first, change packet, Definition of Done, and the storage policy below for any persisted config/UI data). **Track changes to `run.sh`:** when modifying the primary server restart/startup script, update the changelog under `docs/updates-to-apps/` and note run.sh in the change packet (e.g. "run.sh: log menu options, default tail behavior").

---

## CORE OPERATING PRINCIPLES

- Prefer minimal, incremental changes.
- Assume all services are shared unless proven otherwise.
- Never introduce breaking changes in-place.
- Prefer backward-compatible additions.
- If breaking change is required → version (v2) or implement adapter.
- Do not expand scope beyond explicitly requested apps.
- Always update inventory and changelog files as part of Definition of Done.

---

## INVENTORY-FIRST RULE (MANDATORY)

Before any impact analysis or code change:

1. Read relevant inventory files under:
   `docs/updates-to-apps/` (this repo) or `updates to apps/_inventory/` (monorepo)

2. Use inventory as source of truth for:
   - Consumers
   - Owners
   - Contract locations
   - Service versions
   - Build/test commands

3. If inventory is stale or incomplete:
   - Update it as part of the change.
   - Record what was discovered.

---

## FAST IMPACT ANALYSIS (ORDERED)

1. Read inventory files.
2. Search for direct call sites (imports, endpoints, clients).
3. Search for transitive usage (re-exports, shared libs).
4. Summarize blast radius.

Output must include:

- Affected consumers
- Compatibility classification: PATCH / MINOR / MAJOR
- Risk summary

---

## VERSIONING & COMPATIBILITY POLICY

PATCH:

- Internal changes only
- No contract change

MINOR:

- Additive change
- Backward compatible

MAJOR:

- Breaking change
- Must create new version (v2)
- Do NOT modify existing contract in-place

Preferred strategy for MAJOR:

- Create v2 endpoint / interface
- Update only in-scope app
- Leave other apps on v1
- Document migration plan

Adapter-first rule:

- Prefer shim/adapter so v1 consumers continue working
- Only skip adapter if too complex; explain why

---

## ROLLOUT & ROLLBACK (REQUIRED FOR NON-TRIVIAL CHANGES)

Must define:

- Rollout strategy (feature flag / staged / canary / opt-in)
- Observability (logs, metrics)
- Rollback lever (flag off / revert / route to old version)

---

## DEFINITION OF DONE

A change is not complete until:

- Code updated
- Tests updated
- Changelog file written
- Inventory updated (if contracts, versions, consumers changed)
- Service version map updated (if applicable)
- **Changes committed to git**

### Commit Discipline

**Commit more often.** Prefer frequent, small, atomic commits over large batch commits:

- **After each logical unit of work** - Don't wait until everything is "perfect"
- **When a feature/fix is working** - Even if documentation is incomplete
- **Before switching contexts** - Commit current work before starting something new
- **After passing tests** - Lock in working state
- **When Definition of Done is met** - Don't delay commits

**Good commit message format:**
```
<type>: <short summary> (50 chars or less)

<optional detailed explanation>
- What changed
- Why it changed
- Breaking changes (if any)
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Example:**
```
feat: add unified storage credential checking to Dashboard

- Dashboard now checks IndexedDB/SQLite for credentials first
- Falls back to localStorage if not in unified storage
- Fixes "Configuration Missing" when creds stored in unified storage
```

---

## STORAGE POLICY (CONFIG & UI PERSISTENCE)

**All updates that persist user-facing or app config must follow this.**

- **Dual storage:** Any data that should survive refresh and restore (so the user does not have to re-enter it) MUST be stored in **both**:
  - **IndexedDB** (client): for fast read on load and offline resilience.
  - **SQLite** (backend): via a dedicated API (e.g. `/api/settings/<key>` or existing backup/settings APIs) so data is server-side and restorable across devices/sessions where the backend is the same.
- **Scope:** Applies to **config**, **UI preferences** (e.g. sidebar width, last selected file, theme), **credentials and flow state** that the user has entered or chosen and should persist.
- **Pattern:** Prefer the existing pattern: a small service that reads/writes IndexedDB and syncs with a backend API that uses `settingsDB` (SQLite) or the backup API. On load: read from IndexedDB first (optional: then sync from API). On save: write to API (SQLite) and to IndexedDB.
- **Examples in this repo:** `customDomainService` (custom domain), `unifiedWorkerTokenBackupServiceV8` (worker token + SQLite backup), `settingsDB` + `/api/settings/*` for key-value settings.
- **Do not:** Persist only in `localStorage` for data that must be reliable and restorable; use the dual IndexedDB + SQLite pattern. Use `localStorage` only for non-critical or legacy-compat keys where dual storage is not yet implemented.
- **When adding or changing persisted data:** Follow prompt-all (inventory, change packet, changelog) and document the storage keys/API in the relevant `docs/updates-to-apps/` doc.

---

## KEY APPS & PAGES (REFERENCE)

- **Custom Domain & API Test** — Path: `/custom-domain-test`. Sidebar: Admin & Configuration → Custom Domain & API Test. Lets users view/change custom domain (dual storage: IndexedDB + backend) and test backend APIs (GET /api/health, /api/settings/custom-domain, /api/logs/list, /api/version) from the current origin. Source: `src/pages/CustomDomainTestPage.tsx`. Full doc: `docs/updates-to-apps/pingone-api-proxy-direct.md` (§ Custom Domain & API Test page).

---

## REQUIRED OUTPUT FORMAT (CHANGE PACKET)

1. Inventory used
2. Affected consumers
3. Compatibility classification
4. Plan (concise steps)
5. Code changes
6. Full changelog markdown body
7. Inventory diffs

---

## CHANGELOG TEMPLATE

Path (this repo: `docs/updates-to-apps/`):
`docs/updates-to-apps/{app-or-service}/{YYYY-MM-DD}_{short-title}.md` or per-app doc (e.g. `dashboard-updates.md`)

Contents:

## Summary

What changed and why.

## Scope

Apps/services touched.

## Compatibility

PATCH / MINOR / MAJOR + rationale.

## Contract Changes

Before/after summary.

## Versioning Decision

If MAJOR: describe v1 vs v2.

## Migration Notes

Which apps must migrate and how.

## Testing

Tests added/updated.
How to verify.

## Rollback Plan

Exact rollback steps.

---

## INVENTORY TEMPLATES

Directory (this repo): `docs/updates-to-apps/`. Monorepo: `updates to apps/_inventory/`

---

## apps/`app`.md

### App Inventory: `app-name`

## Overview

- Type: React (TypeScript) + Ant Design
- Repo path:
- Owner:
- Last updated:

## Runtime & Stack

- Language: TypeScript
- Framework: React
- UI: Ant Design
- API style: HTTPS REST

## Dependencies (Services Consumed)

| Service | Base Route | Version | Contract Ref | Notes |

## Shared Libraries Used

-

## Key Endpoints Used

- GET /...
- POST /...

## Build & Test Commands

- Install:
- Dev:
- Typecheck:
- Tests:
- Build:

## Release & Rollout

- Deployment:
- Rollout strategy:
- Rollback lever:

## Risk Areas

-

## Active Migrations

-

---

## services/`service`.md

### Service Inventory: `service-name`

## Service overview

- Type: HTTPS API
- Repo path:
- Owner:
- Last updated:

## Purpose

-

## Base Route Prefix

/api/`service`

## Contracts (Canonical Sources)

- OpenAPI:
- TypeScript types:
- JSON schema:

## Versions & Policy

- Supported versions: v1, v2
- Versioning method:

## Consumers

| App | Version | Notes |

## Auth

-

## Data Store

-

## Observability

- Logs:
- Metrics:

## Deprecations

-

---

## service-version-map.yaml

### Central service version index

```yaml
lastUpdated: "YYYY-MM-DD"

services:
  - name: "service-name"
    owner: "team"
    type: "https"
    baseRoutePrefix: "/api/service"
    contractRef:
      openapi: ""
      typescript: ""
      schema: ""
    versions:
      - id: "v1"
        status: "supported"
        deprecation:
          plannedDate: ""
          notes: ""
        breakingNotes: ""
        consumers: []
      - id: "v2"
        status: "supported"
        deprecation:
          plannedDate: ""
          notes: ""
        breakingNotes: ""
        consumers: []
    notes: ""
```

---

This file defines the mandatory engineering safety and inventory discipline rules for all AI-assisted code changes in this repository.
