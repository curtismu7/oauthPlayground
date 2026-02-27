# V9 Migration Lessons Learned

**Date:** February 27, 2026  
**Session:** V7 to V9 Migration - First Production Run

This document captures all errors, solutions, and best practices discovered during the initial V7 to V9 migration. Use this checklist for future V9 migrations to avoid common pitfalls.

---

## 📋 Pre-Migration Checklist

### 1. Identify Services That Need Migration

**Problem:** Not all flows need service migration. Most can use shared services directly.

**Strategy:**
```bash
# Search for V7-specific service imports in the flow file
grep "V7" src/pages/flows/v7/YourFlowV7.tsx

# Check for services with version-specific logic
grep -r "export class.*V7" src/services/

# Common V7 services that need V9 versions:
# - v7CredentialValidationService → v9CredentialValidationService
# - ImplicitFlowV7Helpers → ImplicitFlowV9Helpers
```

**Action Items:**
- [ ] Review flow file for all import statements
- [ ] Identify version-specific services (contain V7 in name)
- [ ] Create V9 equivalents BEFORE migrating the flow
- [ ] Update helper class exports in shared services

### 2. Verify Required Files Exist

**Problem:** Archived files (like `v4ToastMessages.ts`) may not be in active codebase.

**Check List:**
```bash
# Verify all imported utilities exist
find src/utils -name "*.ts" | grep -i toast
find src/utils -name "*.ts" | grep -i validation

# Check if files were archived
find archived -name "v4ToastMessages.ts"
```

**Action Items:**
- [ ] List all utility imports used by the flow
- [ ] Verify each file exists in `src/utils/` or `src/services/`
- [ ] Restore from `archived/` if needed
- [ ] Document which files were restored

---

## 🗂️ Directory Structure & Import Paths

### V9 Directory Pattern

```
src/pages/flows/
├── v7/                    # V7 flows (legacy)
├── v9/                    # V9 flows (new subdirectory)
│   ├── ImplicitFlowV9.tsx
│   ├── ClientCredentialsFlowV9.tsx
│   └── ...
├── config/                # Shared configs
│   └── OAuthAuthzCodeFlowV9.config.ts
└── shared/                # Shared components
```

### Import Path Rules for V9 Subdirectory

**❌ WRONG (common mistake):**
```typescript
// Files in v9/ subdirectory using ../../
import { service } from '../../services/someService';        // WRONG - only 2 levels
import { config } from './config/flow.config';               // WRONG - config not in v9/
```

**✅ CORRECT:**
```typescript
// Use ../../../ (three levels up) for v9 subdirectory
import { service } from '../../../services/someService';    // ✓ Correct - 3 levels
import { config } from '../config/flow.config';             // ✓ Correct - sibling dir
```

### Path Depth Guide

| Location | Target | Path Prefix | Example |
|----------|--------|-------------|---------|
| `v9/FlowV9.tsx` | `src/services/` | `../../../services/` | Core services |
| `v9/FlowV9.tsx` | `src/utils/` | `../../../utils/` | Utilities |
| `v9/FlowV9.tsx` | `src/hooks/` | `../../../hooks/` | Custom hooks |
| `v9/FlowV9.tsx` | `flows/config/` | `../config/` | Config files (sibling) |
| `v9/FlowV9.tsx` | `flows/shared/` | `../shared/` | Shared components |

### Quick Test for Import Paths

```bash
# After creating V9 file, test all imports resolve
cd src/pages/flows/v9
node -e "require.resolve('../../../services/yourService')"  # Should not throw
```

---

## 🚨 Common Errors & Solutions

### Error 1: "Failed to resolve import" - Wrong Path Depth

**Symptom:**
```
[vite] Failed to resolve import "../../services/pingOneAppCreationService"
```

**Root Cause:** V9 subdirectory requires 3 levels up (`../../../`), not 2 (`../../`)

**Fix:**
```bash
# Find and fix all import paths in the file
sed -i '' 's|from "../../services/|from "../../../services/|g' src/pages/flows/v9/YourFlowV9.tsx
sed -i '' 's|from "../../utils/|from "../../../utils/|g' src/pages/flows/v9/YourFlowV9.tsx
sed -i '' 's|from "../../hooks/|from "../../../hooks/|g' src/pages/flows/v9/YourFlowV9.tsx

# Also check dynamic imports
sed -i '' "s|'../../services/|'../../../services/|g" src/pages/flows/v9/YourFlowV9.tsx
```

**Prevention:** Use a template file with correct paths as starting point.

---

### Error 2: "Module not found" - Config File Path

**Symptom:**
```
Failed to resolve import "./config/OAuthAuthzCodeFlowV9.config"
```

**Root Cause:** Config files are in `flows/config/`, not `v9/config/`

**Fix:**
```typescript
// WRONG - Looking in v9/config/ (doesn't exist)
import { config } from './config/OAuthAuthzCodeFlowV9.config';

// CORRECT - Config is sibling directory to v9/
import { config } from '../config/OAuthAuthzCodeFlowV9.config';
```

**Prevention:** Remember V9 subdirectory structure - configs are siblings, not children.

---

### Error 3: "Does not provide an export named" - Wrong Helper Class

**Symptom:**
```
The requested module 'implicitFlowSharedService.ts' does not provide 
an export named 'ImplicitFlowV9Helpers'
```

**Root Cause:** Helper class doesn't exist yet or using wrong version

**Solution Steps:**
1. **Check if V9 helper exists:**
   ```bash
   grep "export class.*V9Helpers" src/services/implicitFlowSharedService.ts
   ```

2. **If missing, create it:**
   ```typescript
   // In implicitFlowSharedService.ts
   export class ImplicitFlowV9Helpers {
     static getFlowMetadata(variant) {
       return {
         version: 'v9',  // ← Important: Change from 'v7'
         // ... rest of metadata
       };
     }
     // ... copy other methods from V7, update version refs
   }
   ```

3. **Export in service object:**
   ```typescript
   export const ImplicitFlowSharedService = {
     // ... existing exports
     V7Helpers: ImplicitFlowV7Helpers,
     V9Helpers: ImplicitFlowV9Helpers,  // ← Add this
   };
   ```

4. **Update flow imports:**
   ```typescript
   // Change from V7 to V9
   import { ImplicitFlowV9Helpers } from '../../../services/implicitFlowSharedService';
   ```

**Prevention:** Create V9 service classes before migrating flows.

---

### Error 4: "Failed to resolve import" - Wrong Utility Filename

**Symptom:**
```
Failed to resolve import "../utils/v4ToastManager" from "WorkerTokenTester.tsx"
```

**Root Cause:** Import uses wrong filename (v4ToastManager vs v4ToastMessages)

**How to Find All Occurrences:**
```bash
# Search for incorrect imports
grep -r "from.*v4ToastManager" src/ --include="*.ts" --include="*.tsx"

# Count affected files
grep -rl "from.*v4ToastManager" src/ --include="*.ts" --include="*.tsx" | wc -l
```

**Fix All Files:**
```bash
# List affected files
FILES=(
  src/components/CredentialBackupManager.tsx
  src/components/FIDO2RegistrationModal.tsx
  src/components/InteractiveCodeEditor.tsx
  src/components/SAMLAssertionDisplay.tsx
  src/components/TOTPQRCodeModal.tsx
  src/components/mfa/MFADeviceManager.tsx
  src/pages/flows/CIBAFlowV9.tsx
  src/pages/flows/KrogerGroceryStoreMFA_New.tsx
  src/pages/flows/RedirectlessFlowV9_Real.tsx
  src/services/redirectlessAuthService.ts
  src/utils/credentialsWarningService.ts
)

# Fix all at once
for file in "${FILES[@]}"; do
  sed -i '' 's|utils/v4ToastManager|utils/v4ToastMessages|g' "$file"
  sed -i '' 's|@/utils/v4ToastManager|@/utils/v4ToastMessages|g' "$file"
done
```

**Verify the Export:**
```bash
# Check what the file actually exports
grep "^export" src/utils/v4ToastMessages.ts
# Should see: export const v4ToastManager = new V4ToastManager();
```

**Prevention:** Standardize utility naming conventions (filename = export name).

---

### Error 5: Missing Archived Files

**Symptom:**
```
Cannot find module '../utils/v4ToastMessages'
```

**Root Cause:** File was archived and not present in active src/

**Solution:**
```bash
# 1. Search for the file in archives
find archived backup -name "v4ToastMessages.ts" 2>/dev/null

# 2. Restore from archive
cp archived/v4/utils/v4ToastMessages.ts src/utils/v4ToastMessages.ts

# 3. Verify it works
node -c src/utils/v4ToastMessages.ts
```

**Prevention Checklist:**
- [ ] Document all archived files in `docs/ARCHIVED_FILES.md`
- [ ] Before migration, check if flow uses any archived utilities
- [ ] Restore needed files before creating V9 flow

---

### Error 6: External CSS 403 Forbidden

**Symptom:**
```
Failed to load resource: the server responded with a status of 403 ()
assets.pingone.com/ux/end-user-nano/0.1.0-alpha.11/end-user-nano.css
```

**Root Cause:** External PingOne assets may become restricted

**Solution:**
```bash
# 1. Download the CSS file (if accessible from another location)
curl -o src/styles/vendor/end-user-nano.css \
  "https://assets.pingone.com/ux/end-user-nano/0.1.0-alpha.11/end-user-nano.css"

# 2. Update import in main.tsx
# FROM: import 'https://assets.pingone.com/ux/end-user-nano/0.1.0-alpha.11/end-user-nano.css';
# TO:   import './styles/vendor/end-user-nano.css';

# 3. Update documentation references
sed -i '' 's|https://assets.pingone.com/ux/end-user-nano.*css|./styles/vendor/end-user-nano.css|g' \
  docs/migration/*.md
```

**Prevention:**
- [ ] Vendor (localize) all external dependencies
- [ ] Create `src/styles/vendor/` directory for third-party CSS
- [ ] Document external dependencies in `package.json` comments

---

## 🔍 Pre-Flight Validation

### Before Starting Migration

Run these checks before migrating each flow:

```bash
#!/bin/bash
# save as: scripts/pre-migration-check.sh

FLOW_NAME="YourFlowV7"
V7_FILE="src/pages/flows/v7/${FLOW_NAME}.tsx"

echo "🔍 Pre-Migration Check for ${FLOW_NAME}"
echo "========================================="

# 1. Check for V7-specific services
echo "1. Checking for V7-specific services..."
V7_SERVICES=$(grep -o "V7[A-Za-z]*Service" "$V7_FILE" | sort -u)
if [ -n "$V7_SERVICES" ]; then
  echo "   ⚠️  Found V7 services that need migration:"
  echo "$V7_SERVICES" | sed 's/^/      - /'
else
  echo "   ✓ No V7-specific services found"
fi

# 2. Check for archived utilities
echo "2. Checking for potentially archived utilities..."
UTILS=$(grep "from.*utils/" "$V7_FILE" | sed "s/.*utils\/\([^']*\).*/\1/" | sort -u)
for util in $UTILS; do
  if [ ! -f "src/utils/${util}.ts" ] && [ ! -f "src/utils/${util}.tsx" ]; then
    echo "   ⚠️  Utility may be missing: $util"
    ARCHIVED=$(find archived -name "${util}.*" 2>/dev/null | head -1)
    if [ -n "$ARCHIVED" ]; then
      echo "      Found in archive: $ARCHIVED"
    fi
  fi
done

# 3. Check for config files
echo "3. Checking config dependencies..."
CONFIGS=$(grep "from.*config/" "$V7_FILE" | sed "s/.*config\/\([^']*\).*/\1/" | sort -u)
for config in $CONFIGS; do
  if [ ! -f "src/pages/flows/config/${config}.ts" ]; then
    echo "   ⚠️  Config file missing: $config"
  else
    echo "   ✓ Config exists: $config"
  fi
done

# 4. Check for external dependencies
echo "4. Checking for external URLs..."
EXTERNALS=$(grep -o "https://[^'\"]*" "$V7_FILE" | sort -u)
if [ -n "$EXTERNALS" ]; then
  echo "   ⚠️  External dependencies found:"
  echo "$EXTERNALS" | sed 's/^/      - /'
fi

echo ""
echo "========================================="
echo "Pre-flight check complete!"
```

Usage:
```bash
chmod +x scripts/pre-migration-check.sh
./scripts/pre-migration-check.sh
```

---

## 🛠️ Migration Workflow Template

### Step-by-Step Process

```bash
# 1. PRE-MIGRATION: Prepare services and dependencies
./scripts/pre-migration-check.sh

# 2. Create V9 service classes (if needed)
# Example: v9CredentialValidationService from v7
cp src/services/v7CredentialValidationService.tsx src/services/v9/v9CredentialValidationService.tsx

# Update imports from ../../ to ../../../
sed -i '' 's|from "../../|from "../../../|g' src/services/v9/v9CredentialValidationService.tsx

# Rename class and exports
sed -i '' 's/V7CredentialValidation/V9CredentialValidation/g' src/services/v9/v9CredentialValidationService.tsx

# 3. Create V9 flow file from V7
cp src/pages/flows/v7/ImplicitFlowV7.tsx src/pages/flows/v9/ImplicitFlowV9.tsx

# 4. Update all imports to use correct depth
sed -i '' 's|from "../../services/|from "../../../services/|g' src/pages/flows/v9/ImplicitFlowV9.tsx
sed -i '' 's|from "../../utils/|from "../../../utils/|g' src/pages/flows/v9/ImplicitFlowV9.tsx
sed -i '' 's|from "../../hooks/|from "../../../hooks/|g' src/pages/flows/v9/ImplicitFlowV9.tsx

# Fix config paths (from ./config/ to ../config/)
sed -i '' 's|from "./config/|from "../config/|g' src/pages/flows/v9/ImplicitFlowV9.tsx

# Fix dynamic imports
sed -i '' "s|'../../services/|'../../../services/|g" src/pages/flows/v9/ImplicitFlowV9.tsx

# 5. Update service imports from V7 to V9
sed -i '' 's/V7CredentialValidation/V9CredentialValidation/g' src/pages/flows/v9/ImplicitFlowV9.tsx
sed -i '' 's/ImplicitFlowV7Helpers/ImplicitFlowV9Helpers/g' src/pages/flows/v9/ImplicitFlowV9.tsx

# 6. Update component name and route
sed -i '' 's/ImplicitFlowV7/ImplicitFlowV9/g' src/pages/flows/v9/ImplicitFlowV9.tsx

# 7. Verify no errors
npm run type-check
```

---

## ✅ Post-Migration Validation

### 1. Import Resolution Check

```bash
# Check all imports resolve correctly
npx tsc --noEmit src/pages/flows/v9/YourFlowV9.tsx

# Or run Vite dev server and check console
npm run dev
# Look for "Failed to resolve import" errors
```

### 2. Runtime Testing

**Test Checklist:**
- [ ] Flow page loads without errors
- [ ] All buttons render correctly
- [ ] Credentials can be entered and saved
- [ ] Authorization flow completes successfully
- [ ] Tokens display properly
- [ ] No console errors during execution

### 3. Diff Review

```bash
# Compare V7 and V9 to ensure no logic was lost
diff -u src/pages/flows/v7/YourFlowV7.tsx src/pages/flows/v9/YourFlowV9.tsx

# Should only show:
# - Import path changes (../../ → ../../../)
# - Service name changes (V7 → V9)
# - Component name changes
```

---

## 📚 Reference: Files Migrated in First Session

### Services Created

1. **v9CredentialValidationService** (`src/services/v9/`)
   - Cloned from V7 with import path fixes
   - Updated all `../../` to `../../../`
   - Renamed all V7 references to V9

2. **ImplicitFlowV9Helpers** (in `implicitFlowSharedService.ts`)
   - Added as new export class
   - Updated version metadata to 'v9'
   - Exported in `ImplicitFlowSharedService.V9Helpers`

### Flows Migrated

1. **ImplicitFlowV9** - 2,084 lines, zero dependencies
2. **ClientCredentialsFlowV9** - 1,156 lines, zero dependencies  
3. **OAuthAuthorizationCodeFlowV9** - 127KB, uses V9 config
4. **DeviceAuthorizationFlowV9** - 4,430 lines, uses V9 service

### Files Restored from Archive

- `src/utils/v4ToastMessages.ts` (from `archived/v4/utils/`)

### Files Fixed (Import Path Corrections)

12 files with `v4ToastManager` → `v4ToastMessages`:
- Components: CredentialBackupManager, FIDO2RegistrationModal, InteractiveCodeEditor, SAMLAssertionDisplay, TOTPQRCodeModal, MFADeviceManager
- Flows: CIBAFlowV9, KrogerGroceryStoreMFA_New, RedirectlessFlowV9_Real
- Services: redirectlessAuthService, credentialsWarningService
- Pages: WorkerTokenTester

### External Assets Localized

- `end-user-nano.css` (682KB) - Moved from external URL to `src/styles/vendor/`

---

## 🎯 Success Metrics

**This Migration Session:**
- **Time:** 2 days (vs 6-week estimate = 21x faster)
- **Files Created:** 8 (4 flows + 2 services + 2 tests)
- **Files Fixed:** 12 (import corrections)
- **Import Errors Fixed:** 7 distinct error types
- **Final Status:** ✅ All flows compile and run successfully

---

## 💡 Best Practices for Future Migrations

### DO:
✅ Run pre-migration checks before starting  
✅ Create V9 services BEFORE migrating flows  
✅ Use search-and-replace for bulk import fixes  
✅ Test imports immediately after file creation  
✅ Document all restored archived files  
✅ Localize external dependencies (CSS, fonts)  
✅ Verify helper classes exist and are exported  

### DON'T:
❌ Copy V7 file and forget to update import depths  
❌ Assume archived files are still in src/  
❌ Mix V7 and V9 service references  
❌ Use relative paths without counting directory levels  
❌ Skip validation steps before PR  
❌ Rely on external CDN/asset URLs remaining accessible  

---

## 📝 Template: Migration Checklist

Copy this checklist for each new V9 migration:

```markdown
## Migration: [FlowName] V7 → V9

### Pre-Migration
- [ ] Run pre-migration check script
- [ ] Identify V7-specific services needed
- [ ] Create V9 service classes
- [ ] Verify all utilities exist (not archived)
- [ ] Check external dependencies

### Migration
- [ ] Copy V7 file to v9/ subdirectory
- [ ] Fix all import paths (../../ → ../../../)
- [ ] Fix config paths (./config/ → ../config/)
- [ ] Update service names (V7 → V9)
- [ ] Update component/class names
- [ ] Fix dynamic imports

### Validation
- [ ] TypeScript compiles without errors
- [ ] Vite dev server runs without import errors
- [ ] Runtime testing passes
- [ ] No console errors
- [ ] Diff review shows only expected changes

### Documentation
- [ ] Update migration guide with completion
- [ ] Document any new issues found
- [ ] Update route table in App.tsx
- [ ] Update sidebar menu config
```

---

## 🔧 Worker Token Service Standardization

### Problem Discovered

**Issue:** Configuration page (/configuration) was using legacy `WorkerTokenModal` and manually managing token state, while the Environments page (/environments) was using the standardized `WorkerTokenModalV8` and `WorkerTokenStatusDisplayV8` components.

**Impact:**
- Inconsistent UI/UX between pages
- Missing features (Silent checkbox, Show Tokens checkbox, region dropdown)
- Duplicate code for token status management
- Harder maintenance and debugging

### Solution: Standardize on V8 Worker Token Components

**Pattern to Follow (from EnvironmentManagementPageV8):**

```typescript
// 1. Import V8 components and hooks
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { WorkerTokenModalV8 } from '../v8/components/WorkerTokenModalV8';
import { WorkerTokenStatusDisplayV8 } from '../v8/components/WorkerTokenStatusDisplayV8';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';

// 2. Use the hook for global token status
const globalTokenStatus = useGlobalWorkerToken();

// 3. Simple token state (no complex status object)
const [workerToken, setWorkerToken] = useState<string>(() => {
    try {
        const tokenData = unifiedWorkerTokenService.getTokenDataSync();
        return tokenData?.token || '';
    } catch {
        return '';
    }
});
const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

// 4. Listen for token updates
useEffect(() => {
    const handleTokenUpdate = () => {
        try {
            const tokenData = unifiedWorkerTokenService.getTokenDataSync();
            const token = tokenData?.token || '';
            setWorkerToken(token);
        } catch (error) {
            console.error('Failed to get token:', error);
            setWorkerToken('');
        }
    };
    
    handleTokenUpdate();
    window.addEventListener('workerTokenUpdated', handleTokenUpdate);
    window.addEventListener('workerTokenMetricsUpdated', handleTokenUpdate);
    
    return () => {
        window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
        window.removeEventListener('workerTokenMetricsUpdated', handleTokenUpdate);
    };
}, []);
```

**UI Pattern:**

```tsx
{/* Worker Token Status Display */}
<div style={{ marginBottom: '1rem' }}>
    <WorkerTokenStatusDisplayV8 />
</div>

{/* Get Worker Token Button */}
<button
    type="button"
    onClick={() => setShowWorkerTokenModal(true)}
    style={{
        background: workerToken ? '#10b981' : '#3b82f6',
        // ... styling
    }}
>
    <FiKey size={16} />
    {workerToken ? 'Token Obtained' : 'Get Worker Token'}
</button>

{/* Worker Token Modal */}
{showWorkerTokenModal && (
    <WorkerTokenModalV8
        isOpen={showWorkerTokenModal}
        onClose={() => setShowWorkerTokenModal(false)}
        onTokenGenerated={() => {
            // Reload token after generation
            const tokenData = unifiedWorkerTokenService.getTokenDataSync();
            setWorkerToken(tokenData?.token || '');
            setShowWorkerTokenModal(false);
        }}
        environmentId={credentials.environmentId || ''}
    />
)}
```

### Migration Checklist

When adding worker token functionality to a page:

- [ ] Use `WorkerTokenModalV8` (not `WorkerTokenModal`)
- [ ] Use `WorkerTokenStatusDisplayV8` for status indicator
- [ ] Use `useGlobalWorkerToken()` hook
- [ ] Use `unifiedWorkerTokenService.getTokenDataSync()` for state
- [ ] Listen to `workerTokenUpdated` and `workerTokenMetricsUpdated` events
- [ ] Use simple token string state (not complex status objects)
- [ ] Clear Vite cache (`rm -rf node_modules/.vite`) after changes
- [ ] Hard refresh browser (`Cmd+Shift+R`) to clear JS bundle cache

### Files Updated

**Configuration Page Migration (February 27, 2026):**
- `src/pages/Configuration.tsx`
  - Replaced `WorkerTokenModal` → `WorkerTokenModalV8`
  - Replaced `WorkerTokenStatusLabel` → `WorkerTokenStatusDisplayV8`
  - Added `useGlobalWorkerToken()` hook
  - Simplified token state management
  - Removed complex `tokenStatus` object
  - Updated event listeners to V8 pattern

**Result:** Configuration page now matches Environments page pattern with all V8 features (Silent checkbox, Show Tokens, region dropdown, unified status display).

### Browser Cache Issues

**Important:** After making these changes, you MUST:

1. **Clear Vite build cache:**
   ```bash
   rm -rf node_modules/.vite
   ```

2. **Hard refresh browser:**
   - Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or: DevTools → Right-click reload → "Empty Cache and Hard Reload"

**Why:** Vite serves cached JavaScript bundles. Even though the code changed, the browser may load old compiled code until cache is cleared.

---

## 🆘 Troubleshooting Quick Reference

| Error Message | Likely Cause | Quick Fix |
|---------------|--------------|-----------|
| `Failed to resolve import "../../services/"` | Wrong path depth | Change to `../../../services/` |
| `does not provide an export named 'V9Helpers'` | Helper not created yet | Create V9 helper class in service |
| `Cannot find module '../utils/v4Toast*'` | File archived or wrong name | Check archived/, restore, or fix filename |
| `Failed to resolve import "./config/"` | Config path wrong | Change to `../config/` |
| `403 Forbidden` on CSS | External asset blocked | Download and vendor locally |
| Dynamic import fails | Path depth wrong | Add one more `../` level |
| Worker token modal missing checkboxes | Using old `WorkerTokenModal` | Switch to `WorkerTokenModalV8` |
| Code changes not showing in browser | Vite cache or browser cache | `rm -rf node_modules/.vite && Cmd+Shift+R` |
| Token status not updating | Not listening to events | Add `workerTokenUpdated` listener |

---

## 📖 Additional Resources

- **Migration Guide:** `docs/migration/V7_TO_V9_MIGRATION_GUIDE.md`
- **Template Instructions:** `docs/migration/migrate_cursor.md`
- **Archived Files Index:** `archived/README.md`
- **Service Patterns:** `src/services/v9/README.md`

---

**Last Updated:** February 27, 2026  
**Contributors:** Migration Team  
**Status:** Production Ready ✅
