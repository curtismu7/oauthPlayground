# V7 to V9 Migration Guide - VS Code Edition

**Optimized for:** VS Code + GitHub Copilot  
**Last Updated:** February 28, 2026  
**Status:** Production Guide

---

## 📖 CRITICAL: Read Before Starting

**Before migrating any flow, read:**
- [V9 Migration Lessons Learned](./V9_MIGRATION_LESSONS_LEARNED.md) - All errors discovered and solutions
- [V7 to V9 Migration Guide](./V7_TO_V9_MIGRATION_GUIDE.md) - Original migration plan

This guide combines the migration workflow with lessons learned from the first production V7→V9 migration to help you avoid common pitfalls.

---

## 🎯 Migration Overview

### What You're Migrating
- **From:** V7 OAuth/OIDC flows in `src/pages/flows/`
- **To:** V9 flows in `src/pages/flows/v9/` subdirectory

### Why V9?
- ✅ Modern credential validation
- ✅ Better error handling
- ✅ Improved state management
- ✅ Version-specific services (no V7 dependencies)

### Success Metrics (First Session)
- **Time:** 2 days (vs 6-week estimate = **21x faster**)
- **Files Created:** 8 (4 flows + 2 services + 2 tests)
- **Import Errors Fixed:** 7 distinct types
- **Final Status:** All flows compile and run successfully ✅

---

## 🎨 UI COLOR STANDARDS (MANDATORY)

**Approved Colors Only:** Red, Blue, Black, White

**Primary Blue (Headers, Primary Actions):**
- `#2563eb` - Primary blue (borders, accents)
- `#1e40af` - Darker blue (headings)
- `#1e3a8a` - Darkest blue (text)
- `#eff6ff` - Light blue background
- `#dbeafe` - Lighter blue background

**Red (Errors, Warnings, Destructive Actions):**
- `#dc2626` - Error red
- `#fef2f2` - Light red background

**Neutral (Backgrounds, Borders):**
- `#111827` - Black (primary text)
- `#1f2937` - Dark gray (code blocks)
- `#6b7280` - Medium gray (secondary text)
- `#f9fafb` - Light gray (page background)
- `#e5e7eb` - Border gray
- `white` / `#ffffff` - White

**Header Gradient — Blue (default) or Red (PingOne admin pages):**
```typescript
// Standard blue header (flows, utilities, general pages)
background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
// NOT purple: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) ❌

// Red header (PingOne Management API pages — Webhook Viewer, Audit, etc.)
background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
// Title and subtitle must use color: white / rgba(255,255,255,0.85) ❌ not #0891b2
```

**❌ FORBIDDEN COLORS:**
- Purple (#8b5cf6, #7c3aed, #6d28d9, etc.)
- Green (except success states: #10b981)
- Orange (except warnings: #f59e0b)
- Any color not listed above

**Reference Pages:**
- ✅ [CustomDomainTestPage.tsx](../../src/pages/CustomDomainTestPage.tsx) - Approved blue/red palette
- ✅ [Dashboard.tsx](../../src/pages/Dashboard.tsx) - Standard blue headers
- ✅ [PingOneAuditActivities.tsx](../../src/pages/PingOneAuditActivities.tsx) - Red header (PingOne Management API page)
- ✅ [PingOneWebhookViewer.tsx](../../src/pages/PingOneWebhookViewer.tsx) - Red header + popout pattern

---

## 🚨 Common Errors You WILL Encounter

### Error 1: Wrong Import Path Depth
**Symptom:**
```
Failed to resolve import "../../services/pingOneAppCreationService"
```

**Why:** V9 subdirectory requires `../../../` (3 levels), not `../../` (2 levels)

**Fix:**
```bash
# Bulk fix all imports in one command
sed -i '' 's|from "../../services/|from "../../../services/|g' src/pages/flows/v9/YourFlowV9.tsx
sed -i '' 's|from "../../utils/|from "../../../utils/|g' src/pages/flows/v9/YourFlowV9.tsx
sed -i '' 's|from "../../hooks/|from "../../../hooks/|g' src/pages/flows/v9/YourFlowV9.tsx
```

### Error 2: Config File Path Wrong
**Symptom:**
```
Failed to resolve import "./config/OAuthAuthzCodeFlowV9.config"
```

**Why:** Config is sibling directory, not child of v9/

**Fix:**
```typescript
// WRONG
import { config } from './config/flow.config';

// CORRECT
import { config } from '../config/flow.config';
```

### Error 3: Missing V9 Helper Class
**Symptom:**
```
'ImplicitFlowV9Helpers' does not exist
```

**Why:** You need to create V9 version of helper classes

**Fix:** See "Creating V9 Service Classes" section below

### Error 4: Wrong Utility Filename
**Symptom:**
```
Failed to resolve import "../utils/v4ToastManager"
```

**Why:** File is actually `v4ToastMessages.ts` not `v4ToastManager.ts`

**Fix:**
```bash
# Find all incorrect imports
grep -rl "from.*v4ToastManager" src/ --include="*.ts" --include="*.tsx"

# Fix them all at once
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|utils/v4ToastManager|utils/v4ToastMessages|g'
```

### Error 5: Archived Files Missing
**Symptom:**
```
Cannot find module '../utils/v4ToastMessages'
```

**Why:** File was archived and not in active src/

**Fix:**
```bash
# Search archives
find archived -name "v4ToastMessages.ts"

# Restore
cp archived/v4/utils/v4ToastMessages.ts src/utils/
```

### Error 6: Using localStorage for Worker Tokens
**Symptom:**
```typescript
const stored = localStorage.getItem('unified_worker_token');
const data = JSON.parse(stored);
```

**Why:** Pages should use `unifiedWorkerTokenService` for consistent worker token management, dual storage (IndexedDB + SQLite), and event-driven updates.

**Fix:**
```bash
# Check if page uses localStorage for worker tokens
grep -n "localStorage.getItem('unified_worker_token')" src/pages/YourPage.tsx
grep -n "localStorage.removeItem('unified_worker_token')" src/pages/YourPage.tsx

# If found, migrate to unified service:
# 1. Add import
echo "import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';" >> src/pages/YourPage.tsx

# 2. Replace localStorage.getItem
sed -i '' "s/const stored = localStorage.getItem('unified_worker_token');/const data = unifiedWorkerTokenService.getTokenDataSync();/" src/pages/YourPage.tsx
sed -i '' "s/if (stored) {/if (data) {/" src/pages/YourPage.tsx
sed -i '' "/const data = JSON.parse(stored);/d" src/pages/YourPage.tsx

# 3. Replace localStorage.removeItem
sed -i '' "s/localStorage.removeItem('unified_worker_token');/unifiedWorkerTokenService.clearToken();/" src/pages/YourPage.tsx
```

**Examples:**
- ✅ [PingOne User Profile](../updates-to-apps/pingone-user-profile-updates.md) - Migrated 2026-02-27
- ✅ [Configuration](../updates-to-apps/configuration-dashboard-v8-migration.md) - Migrated 2026-02-27
- ✅ [Dashboard](../updates-to-apps/configuration-dashboard-v8-migration.md) - Migrated 2026-02-27
- ✅ [PingOneAuditActivities.tsx](../../src/pages/PingOneAuditActivities.tsx) - Migrated 2026-02-28

---

## 📋 Pre-Migration Checklist

**Run BEFORE starting each flow migration:**

```bash
#!/bin/bash
# Save as: scripts/pre-migration-check.sh

FLOW_NAME="YourFlowV7"
V7_FILE="src/pages/flows/v7/${FLOW_NAME}.tsx"

echo "🔍 Pre-Migration Check for ${FLOW_NAME}"
echo "========================================="

# 1. Check for V7-specific services
echo "1. V7-specific services that need migration:"
grep -o "V7[A-Za-z]*Service" "$V7_FILE" | sort -u || echo "   ✓ None found"

# 2. Check for V7-specific helpers
echo "2. V7-specific helpers that need migration:"
grep -o "V7[A-Za-z]*Helper" "$V7_FILE" | sort -u || echo "   ✓ None found"

# 3. Check utilities exist
echo "3. Checking utility files:"
grep "from.*utils/" "$V7_FILE" | sed "s/.*utils\/\([^'\"]*\).*/\1/" | sort -u | while read util; do
  if [ ! -f "src/utils/${util}.ts" ] && [ ! -f "src/utils/${util}.tsx" ]; then
    echo "   ⚠️  Missing: $util"
    ARCHIVED=$(find archived -name "${util}.*" 2>/dev/null | head -1)
    [ -n "$ARCHIVED" ] && echo "      Found in: $ARCHIVED"
  else
    echo "   ✓ $util"
  fi
done

# 4. Check for direct localStorage worker token usage
echo "4. Worker token storage check:"
if grep -q "localStorage.getItem('unified_worker_token')\|localStorage.removeItem('unified_worker_token')" "$V7_FILE" 2>/dev/null; then
  echo "   ⚠️  Using direct localStorage for worker tokens"
  echo "      Should migrate to: unifiedWorkerTokenService"
  echo "      See Error 6 in migration guide"
else
  echo "   ✓ Using unified worker token service (or no worker tokens)"
fi

# 5. Check external dependencies
echo "5. External URLs (needs vendoring):"
grep -o "https://[^'\"]*" "$V7_FILE" | sort -u || echo "   ✓ None found"

echo ""
echo "✅ Pre-flight check complete!"
```

**Usage:**
```bash
chmod +x scripts/pre-migration-check.sh
FLOW_NAME="ImplicitFlowV7" ./scripts/pre-migration-check.sh
```

---

## 🛠️ Step-by-Step Migration Workflow

### Step 1: Create V9 Service Classes (If Needed)

**Check if services need V9 versions:**
```bash
grep -o "V7[A-Za-z]*Service" src/pages/flows/v7/YourFlowV7.tsx | sort -u
```

**If you see `v7CredentialValidationService`:**

```bash
# 1. Copy V7 to V9
cp src/services/v7CredentialValidationService.tsx src/services/v9/v9CredentialValidationService.tsx

# 2. Fix import paths (../../ → ../../../)
sed -i '' 's|from "../../|from "../../../|g' src/services/v9/v9CredentialValidationService.tsx

# 3. Rename class and exports
sed -i '' 's/V7CredentialValidation/V9CredentialValidation/g' src/services/v9/v9CredentialValidationService.tsx

# 4. Verify
grep "export class" src/services/v9/v9CredentialValidationService.tsx
```

**If you see `ImplicitFlowV7Helpers`:**

1. Open `src/services/implicitFlowSharedService.ts`
2. Find `ImplicitFlowV7Helpers` class
3. Copy entire class and rename to `ImplicitFlowV9Helpers`
4. Update version metadata:
   - `version: 'v7'` → `version: 'v9'`
   - Flow names: Add "(V9)" suffix
5. Export in service object:
   ```typescript
   export const ImplicitFlowSharedService = {
     // ... existing
     V9Helpers: ImplicitFlowV9Helpers,  // Add this
   };
   ```

### Step 2: Create V9 Flow File

```bash
# Copy V7 to v9 subdirectory
cp src/pages/flows/v7/ImplicitFlowV7.tsx src/pages/flows/v9/ImplicitFlowV9.tsx
```

### Step 3: Fix ALL Import Paths

**CRITICAL:** V9 subdirectory uses `../../../` not `../../`

```bash
FLOW="src/pages/flows/v9/ImplicitFlowV9.tsx"

# Fix service imports
sed -i '' 's|from "../../services/|from "../../../services/|g' "$FLOW"

# Fix util imports
sed -i '' 's|from "../../utils/|from "../../../utils/|g' "$FLOW"

# Fix hook imports
sed -i '' 's|from "../../hooks/|from "../../../hooks/|g' "$FLOW"

# Fix component imports
sed -i '' 's|from "../../components/|from "../../../components/|g' "$FLOW"

# Fix config paths (sibling directory)
sed -i '' 's|from "./config/|from "../config/|g' "$FLOW"

# Fix dynamic imports
sed -i '' "s|'../../services/|'../../../services/|g" "$FLOW"
sed -i '' "s|'../../utils/|'../../../utils/|g" "$FLOW"
```

### Step 4: Update Service References

```bash
FLOW="src/pages/flows/v9/ImplicitFlowV9.tsx"

# Update service names V7 → V9
sed -i '' 's/V7CredentialValidation/V9CredentialValidation/g' "$FLOW"
sed -i '' 's/ImplicitFlowV7Helpers/ImplicitFlowV9Helpers/g' "$FLOW"

# Update component name
sed -i '' 's/ImplicitFlowV7/ImplicitFlowV9/g' "$FLOW"
```

### Step 5: Verify No Errors

```bash
# TypeScript check
npx tsc --noEmit "$FLOW"

# If errors, check specific imports
grep "from ['\"]" "$FLOW" | head -20
```

### Step 6: Create Route and Menu Entry

**Add to `src/App.tsx`:**
```typescript
import ImplicitFlowV9 from './pages/flows/v9/ImplicitFlowV9';

// In routes:
<Route path="/flows/implicit-v9" element={<ImplicitFlowV9 />} />
<Route path="/flows/implicit-v9?variant=oidc" element={<ImplicitFlowV9 />} />
```

**Add to `src/config/sidebarMenuConfig.ts`:**
```typescript
['/flows/implicit-v9', 'OAuth 2.0 Implicit Flow (V9)'],
['/flows/implicit-v9?variant=oidc', 'OIDC Implicit Flow (V9)'],
```

### Step 7: Test

---

## 🪟 Popout Window Pattern (Monitoring Pages)

Pages used to **monitor live events** (webhook viewer, debug log viewer) must support a popout window so the user can watch them while running a flow in the main tab.

### 1. Create the helper utility

```typescript
// src/v8/utils/myPagePopoutHelper.ts
const POPUP_WIDTH = 1400;
const POPUP_HEIGHT = 900;

export function openMyPagePopout(): void {
  const left = (window.screen.width - POPUP_WIDTH) / 2;
  const top = (window.screen.height - POPUP_HEIGHT) / 2;
  const popup = window.open(
    '/my-page-popout',
    'myPagePopout',
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no`
  );
  if (!popup) { alert('Popup blocked. Please allow popups for this site.'); return; }
  popup.focus();
}

export function isMyPagePopout(): boolean {
  return window.location.pathname.includes('/my-page-popout');
}
```

### 2. Register route in App.tsx

```tsx
// Add import
import { isMyPagePopout } from './v8/utils/myPagePopoutHelper';

// In the App component routing block — add BEFORE the main app branch:
} : isMyPagePopout() ? (
  <Routes>
    <Route path="/my-page-popout" element={<MyPage />} />
    <Route path="*" element={<Navigate to="/my-page-popout" replace />} />
  </Routes>
) : (
  // ...main app

// Also add inside main app Routes (so deep-linking still works):
<Route path="/my-page-popout" element={<MyPage />} />
```

### 3. Add Popout button in the header

Place the button inside `TitleRow` — hide it when already in popout via `!isMyPagePopout()`:

```tsx
import { FiExternalLink } from 'react-icons/fi';
import { isMyPagePopout, openMyPagePopout } from '../v8/utils/myPagePopoutHelper';

// In JSX header:
{!isMyPagePopout() && (
  <button
    type="button"
    onClick={openMyPagePopout}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      paddingInline: '0.85rem', paddingBlock: '0.45rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(255,255,255,0.4)',
      background: 'rgba(255,255,255,0.15)',
      color: 'white', fontSize: '0.8rem', fontWeight: 600,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}
    title="Open in popout window to monitor while using the app"
  >
    <FiExternalLink size={14} />
    Popout
  </button>
)}
```

**Reference implementation:** `src/pages/PingOneWebhookViewer.tsx` + `src/v8/utils/webhookViewerPopoutHelper.ts`

---

```bash
npm run dev
```

Visit the new route and verify:
- ✅ Page loads without errors
- ✅ No import errors in console
- ✅ Flow executes successfully
- ✅ All UI elements render

---

## 🔍 Post-Migration Validation

### Import Resolution Check

```bash
# Check all imports resolve
npx tsc --noEmit src/pages/flows/v9/YourFlowV9.tsx
```

### Diff Review

```bash
# Compare V7 vs V9 - should only show import path changes
diff -u src/pages/flows/v7/YourFlowV7.tsx src/pages/flows/v9/YourFlowV9.tsx | less
```

**Expected Differences:**
- ✅ Import paths: `../../` → `../../../`
- ✅ Service names: `V7` → `V9`
- ✅ Component name: `FlowV7` → `FlowV9`
- ❌ **No business logic changes**

### Runtime Testing Checklist

- [ ] Flow page loads without errors
- [ ] Credentials can be entered
- [ ] Authorization flow completes
- [ ] Tokens display correctly
- [ ] No console errors
- [ ] v9CredentialValidationService works
- [ ] Helper methods work correctly

---

## 📚 Reference: Files Modified in First Session

### Services Created
1. `src/services/v9/v9CredentialValidationService.tsx` (474 lines)
2. `src/services/implicitFlowSharedService.ts` - Added `ImplicitFlowV9Helpers` class

### Flows Migrated (4 CRITICAL flows)
1. `src/pages/flows/v9/ImplicitFlowV9.tsx` (2,084 lines)
2. `src/pages/flows/v9/ClientCredentialsFlowV9.tsx` (1,156 lines)
3. `src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx` (127KB)
4. `src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx` (4,430 lines)

### Import Fixes Applied (12 files)
**v4ToastManager → v4ToastMessages:**
- WorkerTokenTester.tsx
- CredentialBackupManager.tsx
- FIDO2RegistrationModal.tsx
- InteractiveCodeEditor.tsx
- SAMLAssertionDisplay.tsx
- TOTPQRCodeModal.tsx
- MFADeviceManager.tsx
- CIBAFlowV9.tsx
- KrogerGroceryStoreMFA_New.tsx
- RedirectlessFlowV9_Real.tsx
- redirectlessAuthService.ts
- credentialsWarningService.ts

### External Assets Localized
- `src/styles/vendor/end-user-nano.css` (682KB) - Previously external URL (403 error)

---

## 🎯 Migration Template

Copy this for each new flow:

```markdown
## Migration: [FlowName] V7 → V9

### Pre-Migration
- [ ] Run pre-migration check script
- [ ] Identify V7-specific services needed
- [ ] Create V9 service classes
- [ ] Verify all utilities exist
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
- [ ] No import errors in Vite
- [ ] Runtime testing passes
- [ ] No console errors
- [ ] Diff review shows only expected changes

### Integration
- [ ] Add route to App.tsx
- [ ] Add menu entries to sidebarMenuConfig.ts
- [ ] Update migration guide
- [ ] Test in production build

### Documentation
- [ ] Update V7_TO_V9_MIGRATION_GUIDE.md
- [ ] Document any new issues found
- [ ] Update completion status
```

---

## 🆘 Troubleshooting Guide

### "Cannot find module" Errors

**Step 1:** Check path depth
```bash
# Count directories from v9/ to src/
# v9/ → flows/ → pages/ → src/ = 3 levels
# Therefore use: ../../../
```

**Step 2:** Verify file exists
```bash
# If import is: from '../../../services/myService'
ls -la src/services/myService.ts
```

**Step 3:** Check for typos in filename
```bash
# Case sensitive!
find src -iname "*myservice*"
```

### Icons Show Unicode (e.g., "ea09")

**Cause:** Icon font files not loaded

**Fix:**
```bash
# Verify font files exist
ls -la public/icons/

# Should see:
# materialdesignicons-subset.woff2
# materialdesignicons-subset.woff
# materialdesignicons-subset.ttf
# materialdesignicons-subset.eot
```

If missing, install:
```bash
npm install @mdi/font
cp node_modules/@mdi/font/fonts/materialdesignicons-webfont.* public/icons/
# Rename to materialdesignicons-subset.*
```

### External CSS 403 Forbidden

**Cause:** External assets blocked

**Fix:** Vendor locally
```bash
# Download CSS file
curl -o src/styles/vendor/end-user-nano.css "https://assets.pingone.com/ux/end-user-nano/..."

# Update import
# From: import 'https://assets.pingone.com/...'
# To:   import './styles/vendor/end-user-nano.css'
```

---

## 💡 Best Practices

### DO:
✅ Run pre-migration checks before starting  
✅ Create V9 services BEFORE migrating flows  
✅ Use sed for bulk import fixes  
✅ Test imports immediately after file creation  
✅ Document restored archived files  
✅ Localize external dependencies  
✅ Verify helper classes exist and are exported  
✅ Keep one-to-one mapping between V7 and V9 flows  

### DON'T:
❌ Copy V7 file and forget import depths  
❌ Assume archived files still in src/  
❌ Mix V7 and V9 service references  
❌ Skip validation steps  
❌ Rely on external CDN/asset URLs  
❌ Change business logic during migration  
❌ Migrate without testing V7 flow first  

---

## 📊 Success Metrics

### Speed
- **Estimated Time:** 6 weeks (original estimate)
- **Actual Time:** 2 days
- **Speedup:** 21x faster

### Quality
- **Compilation Errors:** 0 (after fixes)
- **Runtime Errors:** 0
- **Regression Issues:** 0
- **Code Coverage:** Same as V7

### Scope
- **Flows Migrated:** 4 (all CRITICAL flows)
- **Services Created:** 2
- **Import Fixes:** 12 files
- **External Assets:** 1 localized

---

## 🔗 Additional Resources

- [V9 Migration Lessons Learned](./V9_MIGRATION_LESSONS_LEARNED.md) - Complete error catalog
- [V7 to V9 Migration Guide](./V7_TO_V9_MIGRATION_GUIDE.md) - Original plan
- [UI & Icon Migration Guide](./migrate_cursor.md) - Bootstrap/Nano/MDI icon migration (VS Code edition)
- [Icon Migration Complete](./ICON_MIGRATION_COMPLETE.md) - Icon font setup
- [Complete Icon List](./COMPLETE_ICON_LIST.md) - All 34 icons

---

## ✅ Completed Migrations: Feb 28, 2026

### PingOneAuditActivities — Worker Token Service Migration

**Date:** 2026-02-28  
**File:** `src/pages/PingOneAuditActivities.tsx`

**Problem:**  
The page used direct `localStorage.getItem/removeItem('unified_worker_token')` in three places — the `useState` initializer, `handleClearWorkerToken`, and the `workerTokenUpdated` event handler — instead of `unifiedWorkerTokenService` (Error 6 in this guide).

**Changes:**
- **Added import:** `unifiedWorkerTokenService` from `../services/unifiedWorkerTokenService`
- **`useState` initializer:** Replaced 8-line try/catch localStorage parse → `unifiedWorkerTokenService.getTokenDataSync()?.token ?? ''`
- **`handleClearWorkerToken`:** `localStorage.removeItem('unified_worker_token')` → `unifiedWorkerTokenService.clearToken()`
- **`workerTokenUpdated` useEffect:** Replaced try/catch localStorage parse → `unifiedWorkerTokenService.getTokenDataSync()`

**Examples:**
- ✅ [PingOneAuditActivities.tsx](../../src/pages/PingOneAuditActivities.tsx) - Migrated 2026-02-28
- ✅ [PingOneWebhookViewer.tsx](../../src/pages/PingOneWebhookViewer.tsx) - Migrated 2026-02-27

---

### PingOneAuditActivities — Color Compliance Migration

**Date:** 2026-02-28  
**File:** `src/pages/PingOneAuditActivities.tsx`

**Problem:**  
The page used a blue header gradient and multiple forbidden purple/indigo colors (`#667eea`, `#6366f1`, `#c4b5fd`) throughout the UI. Per the migration guide, PingOne Management API pages (Audit, Webhook Viewer, etc.) must use the **red** header gradient.

**Changes:**
- **Header gradient:** `#2563eb → #1e40af` (blue) → `#ef4444 → #dc2626` (red — PingOne admin)
- **Subtitle color:** `#bfdbfe` → `rgba(255, 255, 255, 0.85)` (white on red)
- **Primary button:** `#667eea` (forbidden purple) → `#2563eb` blue
- **Summary card:** border `#667eea` → `#93c5fd`; background lavender → `#eff6ff/#dbeafe`
- **Stat card borders (×6):** `#c4b5fd` (lavender) → `#bfdbfe` blue
- **Stat value numbers:** `#6366f1` (indigo) → `#1e40af` dark blue
- **"View Details" link:** `#667eea` → `#2563eb`

---

## ✅ Completed Migrations: Feb 27, 2026

### PingOneWebhookViewer — Worker Token Service Migration

**Commit:** `7d94c9ded`  
**Date:** 2026-02-27  
**File:** `src/pages/PingOneWebhookViewer.tsx`

**Problem:**  
The page used a bespoke ad-hoc worker token flow (`WorkerTokenModal` + `WorkerTokenDetectedBanner` + inline env ID card) instead of the standard `WorkerTokenSectionV8` service component used by all other V8 pages. The page had no visible token status section — users could not see their token state or easily refresh/clear it.

**Changes:**
- **Removed imports:** `WorkerTokenModal`, `WorkerTokenDetectedBanner`
- **Added import:** `WorkerTokenSectionV8` from `@/v8/components/WorkerTokenSectionV8`
- **Removed state:** `showWorkerTokenModal` (managed internally by `WorkerTokenSectionV8`)
- **Replaced** the three conditional blocks (modal + banner + env ID card) with:
  - `<WorkerTokenSectionV8>` — standard token status display, Get/Update/Clear buttons, internal modal, refreshes on `workerTokenUpdated` events
  - `onTokenUpdated` callback also auto-updates `environmentId` and `selectedRegion` from `unified_worker_token` localStorage
  - Compact always-visible Environment ID input below the token section
- **Removed** the "Provide Worker Token" card inside the Subscriptions tab (now redundant — `WorkerTokenSectionV8` is always shown)

**WorkerTokenSectionV8 features gained:**
- ✅ Token status badge (green Active / red Not Set)
- ✅ Get Worker Token / Update Token / Clear Token action buttons
- ✅ `WorkerTokenStatusDisplayV8` embedded in compact mode
- ✅ Responds to `workerTokenUpdated` window events for cross-tab sync
- ✅ Consistent with all other V8 pages

---

## 📝 Quick Command Reference

```bash
# Pre-migration check
./scripts/pre-migration-check.sh

# Create V9 service
cp src/services/v7Service.tsx src/services/v9/v9Service.tsx
sed -i '' 's|from "../../|from "../../../|g' src/services/v9/v9Service.tsx
sed -i '' 's/V7/V9/g' src/services/v9/v9Service.tsx

# Create V9 flow
cp src/pages/flows/v7/FlowV7.tsx src/pages/flows/v9/FlowV9.tsx

# Fix imports (all at once)
FLOW="src/pages/flows/v9/FlowV9.tsx"
sed -i '' 's|"../../services/|"../../../services/|g' "$FLOW"
sed -i '' 's|"../../utils/|"../../../utils/|g' "$FLOW"
sed -i '' 's|"../../hooks/|"../../../hooks/|g' "$FLOW"
sed -i '' 's|"./config/|"../config/|g' "$FLOW"
sed -i '' 's/V7/V9/g' "$FLOW"

# Verify
npx tsc --noEmit "$FLOW"

# Test
npm run dev
```

---

**Last Updated:** February 28, 2026  
**Status:** Production Ready ✅  
**Next Migration:** Follow this guide for remaining V7 flows
