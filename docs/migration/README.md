# Migration Guides

Guides for migrating between versions and updating to new systems.

---

## 🚀 Active Migration (V7/V8 → V9)

These are the current, actively maintained guides for the ongoing V7/V8 → V9 migration:

| Doc | Purpose |
|---|---|
| **[migrate_vscode.md](./migrate_vscode.md)** ⭐ | **Main guide** — V7 & V8 → V9, VS Code + Copilot optimised. Includes V8 architecture reference, color standards, toast replacement, common errors, step-by-step workflow. Start here. |
| [V9_MIGRATION_TODOS.md](./V9_MIGRATION_TODOS.md) | Remaining TODO checklist — all unfinished flow and service migrations with per-item sub-tasks |
| [V9_MIGRATION_LESSONS_LEARNED.md](./V9_MIGRATION_LESSONS_LEARNED.md) | Errors and solutions discovered during the first production V7→V9 migration session (Feb 2026) |
| [V7_TO_V9_MIGRATION_GUIDE.md](./V7_TO_V9_MIGRATION_GUIDE.md) | Original PR-based migration plan (PRs 1–5 complete, PR 6 pending) |
| [V7_TO_V8_UPGRADE_TARGETS.md](./V7_TO_V8_UPGRADE_TARGETS.md) | Priority inventory of all 18 V7 sidebar apps, service dependency analysis, CRITICAL/High/Medium/Low tiers |
| [V8_FLOW_MIGRATION_GUIDE.md](./V8_FLOW_MIGRATION_GUIDE.md) | V8-specific import styles (A/B/C), directory flow pattern (PAR), factory pattern (MFA), context provider pattern, per-flow `sed` commands |
| [MFA_MIGRATION_GUIDE.md](./MFA_MIGRATION_GUIDE.md) | MFA flow dependency maps — all 3 MFA flows, service status table, context provider hierarchy, factory usage, recommended migration order |
| [V9_FLOW_TEMPLATE.md](./V9_FLOW_TEMPLATE.md) | Starter template for new V9 flows — correct import depths, blue header, toast, WorkerToken, route & sidebar registration |

---

## 🎨 UI / Icon / CSS Migration

| Doc | Purpose |
|---|---|
| [migrate_cursor.md](./migrate_cursor.md) | End-User Nano (Bootstrap) + MDI icon migration — VS Code edition |
| [migrate.md](./migrate.md) | Original phased CSS/Nano migration plan |
| [ICON_MIGRATION_COMPLETE.md](./ICON_MIGRATION_COMPLETE.md) | Icon font setup completion status |
| [COMPLETE_ICON_LIST.md](./COMPLETE_ICON_LIST.md) | All 34 MDI icons used in the project |
| [ICOMOON_FONT_GENERATION.md](./ICOMOON_FONT_GENERATION.md) | How to regenerate the icon subset font |

---

## 🔧 Specific System Migrations

| Doc | Purpose |
|---|---|
| [JWKS_MIGRATION_GUIDE.md](./JWKS_MIGRATION_GUIDE.md) | JWKS endpoint migration |
| [STORAGE_MIGRATION_PROJECT_INVENTORY.md](./STORAGE_MIGRATION_PROJECT_INVENTORY.md) | Storage system migration inventory |
| [migrate_error_handlers.md](./migrate_error_handlers.md) | Error handler migration script (partial — WhatsAppFlowV8 in progress) |

---

## 📦 Historical Migrations (Complete)

| Migration | Location |
|---|---|
| V5 to V6 | [v5-to-v6/](v5-to-v6/) |
| V6 to V7 | [v6-to-v7/](v6-to-v7/) |
| Credential Storage | [credential-storage/](credential-storage/) |

---

## Migration Process

### Before You Start

1. **Read [migrate_vscode.md](./migrate_vscode.md)** — main guide with V8 architecture, color standards, and common errors
2. **Check [V9_MIGRATION_TODOS.md](./V9_MIGRATION_TODOS.md)** — pick up the next unfinished item
3. **Review [V9_MIGRATION_LESSONS_LEARNED.md](./V9_MIGRATION_LESSONS_LEARNED.md)** — avoid known pitfalls

### Rollback Plan

If a V9 flow has a critical issue:
1. Do **not** immediately restore V7 routes
2. Create a hotfix for the V9 issue
3. If hotfix > 2 hours: temporarily restore only the specific V7 route with a deprecation banner
4. Fix V9 and remove the temporary V7 route

Full rollback commands: see [V7_TO_V9_MIGRATION_GUIDE.md § Emergency Rollback](./V7_TO_V9_MIGRATION_GUIDE.md#-emergency-rollback-procedure)

## Getting Help

If you encounter issues during migration:
1. Check the troubleshooting section in the migration guide
2. Review the [troubleshooting guides](../guides/troubleshooting/)
3. Check for known issues in the changelog
4. Contact support with debug information

## Post-Migration

After successful migration:
- Verify all flows work correctly
- Test credential persistence
- Check worker token functionality
- Update documentation
- Train team members on changes
