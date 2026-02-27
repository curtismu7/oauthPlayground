# Updates to Apps — Regression Recovery

This folder holds **per-app/per-service change logs** so we can restore an app or feature to its current state after a regression.

- **Purpose**: If something breaks, open the doc for that app, see what’s in place, and re-apply features and fixes.
- **Scope**: One doc (or linked set) per app/service; each doc lists implemented changes, key files, and how to verify or restore behavior.
- **Naming**: `*-updates.md` (e.g. `menu-updates.md`, `dashboard-updates.md`, `run-sh-updates.md`).
- **Apps in this repo**: See **`apps-in-this-repo.md`** for the list of apps/services covered by prompt-all and for the backend requirement (404 for /api → run `./run.sh`).

When you add or change a feature, update the relevant doc here.
