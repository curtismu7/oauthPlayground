# CollapsibleHeader Migration Scripts

## 🚀 Quick Start

### Option 1: Automated Migration (Recommended)

```bash
# Dry run - see what would change without modifying files
node scripts/migrate-collapsible-sections.js --dry-run

# Dry run with verbose output
node scripts/migrate-collapsible-sections.js --dry-run --verbose

# Apply migration to all flows
node scripts/migrate-collapsible-sections.js

# Migrate specific files
node scripts/migrate-collapsible-sections.js PingOnePARFlowV6_New.tsx RARFlowV6_New.tsx
```

### Option 2: Manual Migration Helper

```bash
# List all flows that need migration
node scripts/list-flows-to-migrate.js

# Check specific flow
node scripts/list-flows-to-migrate.js DeviceAuthorizationFlowV6.tsx
```

---

## 📋 What the Script Does

### Automated (`migrate-collapsible-sections.js`)

1. ✅ Adds `CollapsibleHeader` import
2. ✅ Removes local `CollapsibleSection`, `CollapsibleHeaderButton`, etc. styled components
3. ✅ Transforms JSX from old pattern to new pattern
4. ✅ Sets `defaultCollapsed={false}` for credentials/overview sections
5. ✅ Sets `defaultCollapsed={true}` for all other sections
6. ✅ Removes unused `FiChevronDown` imports
7. ✅ Cleans up formatting

### Manual Helper (`list-flows-to-migrate.js`)

1. Lists all flows with local collapsible components
2. Shows section count per flow
3. Identifies flows using FlowUIService (need different approach)

---

## ⚠️ Important Notes

### Flows Requiring Manual Review

The script works well for most cases, but these require manual attention:

1. **FlowUIService flows** (OAuthImplicitFlowV6, OIDCImplicitFlowV6_Full, JWTBearerTokenFlowV6)
   - Use shared components from FlowUIService
   - Need different migration approach

2. **Complex nested sections**
   - Conditional rendering
   - Dynamic section IDs
   - Sections with custom props

3. **Non-standard patterns**
   - Custom toggle handlers
   - External state management
   - Special styling requirements

### After Running the Script

1. **Check linter errors:**
   ```bash
   npm run lint
   ```

2. **Test each flow:**
   - Open the flow in browser
   - Verify all sections render correctly
   - Check collapse/expand behavior
   - Confirm default collapsed states

3. **Review transformed code:**
   - Check section titles are correct
   - Verify icons are properly extracted
   - Confirm content is intact

4. **Fix any issues:**
   - The script marks removed code with `// [REMOVED]` comments
   - Search for these to ensure nothing important was deleted

---

## 🔧 Troubleshooting

### Script says "No files need migration"

- Files may already be migrated
- Check if they use FlowUIService instead
- Run with verbose flag to see details

### Linter errors after migration

Common fixes:

1. **Unused imports:**
   ```typescript
   // Remove if no longer used:
   - FiChevronDown
   - useState for collapsedSections (if fully migrated)
   ```

2. **Missing icons:**
   - Script extracts icons automatically
   - Verify icon imports are present

3. **Type errors:**
   - Check `defaultCollapsed` prop type
   - Ensure CollapsibleHeader is imported correctly

### Sections not rendering

- Check console for errors
- Verify content between CollapsibleHeader tags
- Ensure no syntax errors in JSX

---

## 📊 Migration Status

Run to check current status:
```bash
node scripts/list-flows-to-migrate.js
```

Expected output:
```
📊 Flows Needing Migration: 10
📊 Already Migrated: 6
📊 FlowUIService (Manual): 3
```

---

## 🎯 Migration Workflow

### Phase 1: Automated (Low-Risk Flows)
```bash
# Start with dry run
node scripts/migrate-collapsible-sections.js --dry-run --verbose

# Review output, then apply
node scripts/migrate-collapsible-sections.js

# Test and verify
npm run dev
```

### Phase 2: Review & Fix
```bash
# Check for errors
npm run lint

# Fix any issues manually
# Test each flow

# Commit when stable
git add src/pages/flows/*.tsx
git commit -m "chore: migrate flows to CollapsibleHeader service"
```

### Phase 3: FlowUIService Flows (Manual)
- OAuthImplicitFlowV6.tsx
- OIDCImplicitFlowV6_Full.tsx
- JWTBearerTokenFlowV6.tsx

These require a different approach - see FLOWUI_MIGRATION.md

---

## 💡 Tips

1. **Start small:** Migrate 1-2 flows first to verify the script works
2. **Use dry-run:** Always run with `--dry-run` first
3. **Backup:** Git commit before running (just in case)
4. **Verify:** Test each flow after migration
5. **Iterate:** If script misses something, fix the pattern and re-run

---

## 🆘 Need Help?

If the automated script doesn't work for a specific flow:

1. **Check the pattern:** Some flows may have non-standard structures
2. **Manual migration:** Follow the template in MIGRATION_TEMPLATE.md
3. **Report issues:** Document any patterns the script can't handle

---

**Happy migrating! 🚀**

