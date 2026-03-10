# Migration Docs

Central place for **V7/V8 → V9** migration: how to migrate, services, testing rules, and quick reference. Everything is condensed into **four main docs** plus this README.

---

## Start here

| Doc | Purpose |
|-----|--------|
| **[01-MIGRATION-GUIDE.md](./01-MIGRATION-GUIDE.md)** | **Main guide** — Modern Messaging, quality gates, V8 layout, colors, common errors, services summary. Start migrations here. |
| [02-SERVICES-AND-CONTRACTS.md](./02-SERVICES-AND-CONTRACTS.md) | Service upgrade candidates, worker token consistency, priority 1 services status. |
| [03-TESTING-AND-RULES.md](./03-TESTING-AND-RULES.md) | Zero-tolerance rules, testing prevention, infinite-loop and runtime safeguards. |
| [04-REFERENCE.md](./04-REFERENCE.md) | V9 flow template snippet, colors, JWKS/MFA pointers. |

**Regression and fixes:** `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` (in repo root).

---

## Process

1. **Before migrating:** Read 01 (§ 1–2), 02 (worker token), 03 (checklist).
2. **Implement:** Follow 01 (V8 imports, colors, messaging, patterns); use 04 for template.
3. **Before merge:** Run 03 checklist (parity, tsc, no infinite loops, async cleanup).

---

## Other docs (archive)

Older and variant docs (e.g. multiple `migrate_vscode_*`, `V9_MIGRATION_TODOS_*`, status reports, comparison docs) are in **`archive/`**. Use them for deep dives or history; the **01–04** set above is the single source of truth.

**Historical migrations:** `v5-to-v6/`, `v6-to-v7/` (and optionally in archive).
