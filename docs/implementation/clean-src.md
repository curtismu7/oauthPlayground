# clean-src.md — Recommended `/src` Cleanup Plan (Node Monorepo, NPM)

This document proposes a **low-regression** restructuring of `/src` so each app is isolated, shared code is explicit, and “impacted apps” are easy to determine.

---

## Goals

- Prevent **feature-loss regressions** caused by shared drift.
- Make blast radius obvious from file paths.
- Keep refactors incremental (no big-bang move).
- Enable simple rules for “which gates must run”.

---

## Target Layout (Recommended)

```
src/
  apps/
    v8/                  # V8 flows (“Production”)
      pages/
      features/
      components/
      services/
      index.tsx
    v8u/                 # Unified flows (OAuth/CIBA/etc.)
      pages/
      features/
      components/
      services/
      index.tsx
    protect/             # Protect portal
      pages/
      features/
      components/
      services/
      index.tsx

  shared/
    components/          # truly reusable UI
    services/            # shared service clients/adapters
    hooks/
    lib/
    utils/
    contexts/
    constants/
    types/
    styles/

  server/                # if server-side is shared across apps
  config/
  tests/
```

### What goes where

- `src/apps/<app>/...`  
  App-owned pages, feature modules, and app-specific components/services.

- `src/shared/...`  
  Code that is **designed** to be reused by more than one app/flow. This is the highest regression risk area.

- `src/server/...`  
  Only if it truly applies across apps. If parts are app-specific, move them under the relevant `src/apps/<app>/`.

---

## Import Boundary Rules (Non-Negotiable)

These rules prevent “accidental sharing” and keep scoped folders meaningful.

### Allowed
- `src/apps/**` → may import from `src/shared/**`
- `src/apps/v8/**` → may import from `src/apps/v8/**`
- `src/apps/v8u/**` → may import from `src/apps/v8u/**`
- `src/apps/protect/**` → may import from `src/apps/protect/**`

### Disallowed (must enforce)
- `src/shared/**` **must not** import from `src/apps/**`
- `src/apps/v8/**` must not import from `src/apps/v8u/**` (and vice versa), unless explicitly approved
- `src/apps/protect/**` must not import from v8/v8u app code (unless explicitly approved)

Enforce via ESLint path restrictions (preferred) or a lightweight script that fails CI non-zero.

---

## “Impacted Apps” Rules (for Gates)

Use these rules to decide what must run in a PR.

### If a PR touches only one app folder
- Touches only `src/apps/v8/**` → run V8 gates
- Touches only `src/apps/v8u/**` → run V8U gates
- Touches only `src/apps/protect/**` → run Protect gates

### If a PR touches shared or cross-cutting code
Treat as **Upgrade PR**:
- Touches `src/shared/**` → run **all app gates**
- Touches `src/server/**` or shared runtime config → run **all app gates**
- Touches “global wiring” (routing/nav/auth bootstrapping) → run **all app gates**

---

## Minimal Gate Commands (NPM, No Docker)

Run from repo root (monorepo-safe):

```
npm ci
npm run build
npm test
./comprehensive-inventory-check.sh
```

If you later add app-scoped scripts, prefer them:
- `npm run build:v8u` / `npm run test:v8u`
- `npm run build:v8` / `npm run test:v8`
- `npm run build:protect` / `npm run test:protect`

---

## Migration Plan (Low Risk, Incremental)

### Phase 0 — Inventory + Safety Net
- Identify the two regressions you hit (“lost features”) and add a **feature-presence gate** for each (route/menu/action must exist).
- Confirm `npm ci`, `npm run build`, `npm test`, and `./comprehensive-inventory-check.sh` are stable on `main`.

### Phase 1 — Create folders (no moves)
- Add empty `src/apps/` and `src/shared/` skeleton.
- Add import-boundary enforcement (even before moving files).

### Phase 2 — Move truly shared utilities first
Move in small PRs:
- `src/utils` → `src/shared/utils`
- `src/lib` → `src/shared/lib`
- `src/hooks` → `src/shared/hooks`
- `src/types` → `src/shared/types`
- `src/contexts` → `src/shared/contexts`

Each PR:
- updates imports
- runs full gates
- is reversible (small diff)

### Phase 3 — Split app code
Move code *into* app folders gradually:
- V8-related → `src/apps/v8/**`
- V8U-related → `src/apps/v8u/**`
- Protect portal → `src/apps/protect/**`

Start with the highest-signal directories (pages/features), then components.

### Phase 4 — Consolidate components
- Move `src/v8/components` → `src/apps/v8/components`
- Move `src/v8u/components` → `src/apps/v8u/components`
- Move truly shared components from `src/components` → `src/shared/components`

### Phase 5 — Cleanup + tighten rules
- Remove old directories after all imports updated.
- Tighten import boundary rules to prevent backsliding.

---

## Decision Notes

### Why not “one big components folder”?
A flat `src/components/` increases ambiguity and makes “impacted apps” unclear, which forces you to run broad gates constantly. Keeping app folders restores clarity and reduces regressions.

### When to run the whole master prompt vs app section in Windsurf
- Most work: provide **global monorepo discipline section + the single app workflow**.
- Shared changes (`src/shared/**`, `src/server/**`): provide **global section + impacted app workflows** (or whole file if unsure).

---

## Checklist for “I’m about to refactor /src”
- [ ] Import boundary rules in place and failing non-zero.
- [ ] Feature-presence gates exist for known regressions.
- [ ] Migration PRs are small and reversible.
- [ ] Shared changes use Upgrade PR discipline and run all app gates.
