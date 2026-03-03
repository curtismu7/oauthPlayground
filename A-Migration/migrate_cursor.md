# migrate.md — VS Code Edition (OAuth Playground / Vite + React)

## End-User Nano (Bootstrap-based) + Astro Nano Icons (mdi subset)

**Optimized for:** VS Code + GitHub Copilot  
**Last Updated:** February 27, 2026

This document is written as **explicit, executable steps** for VS Code + GitHub Copilot. Follow in order. Each step should be a small, focused commit where possible.

---

## ⚠️ IMPORTANT: Read This First

**Before starting any V9 migration, read:**

📖 **[V9 Migration Lessons Learned](./V9_MIGRATION_LESSONS_LEARNED.md)**

This document captures all errors, solutions, and best practices from the first V7→V9 production migration session (February 2026). It includes:

- Pre-migration checklist (service dependencies, archived files, external assets)
- Common import path errors and fixes
- Service migration patterns
- Automated validation scripts
- Step-by-step migration workflow
- Post-migration validation checklist

Reading this document will help you avoid 7+ hours of debugging common issues.

---

## 🔒 CRITICAL: Worker Token Service Check

**ALWAYS check pages for direct localStorage worker token usage and migrate to unified service.**

### Why This Matters

Pages should use `unifiedWorkerTokenService` instead of direct `localStorage` manipulation for worker tokens. This provides:

- ✅ **Dual storage:** IndexedDB (primary) + SQLite (backup)  
- ✅ **Event-driven updates:** Cross-tab synchronization  
- ✅ **Consistent pattern:** Same as Configuration, Dashboard, Auto-Discover  
- ✅ **No JSON parsing errors:** Service returns parsed objects  

### Quick Check

```bash
# Check if a page uses direct localStorage for worker tokens
grep -n "localStorage.getItem('unified_worker_token')" src/pages/YourPage.tsx
grep -n "localStorage.removeItem('unified_worker_token')" src/pages/YourPage.tsx
```

### Migration Pattern

**BEFORE (Direct localStorage):**

```typescript
const stored = localStorage.getItem('unified_worker_token');
if (stored) {
  const data = JSON.parse(stored);
  // Use data...
}

// Clearing
localStorage.removeItem('unified_worker_token');
```

**AFTER (Unified Service):**

```typescript
// Add import
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';

// Reading token
const data = unifiedWorkerTokenService.getTokenDataSync();
if (data) {
  // Use data... (no JSON.parse needed)
}

// Clearing
unifiedWorkerTokenService.clearToken();
```

### Automated Migration

```bash
# 1. Add import (manually or with this helper)
echo "import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';" >> src/pages/YourPage.tsx

# 2. Replace localStorage.getItem
sed -i '' "s/const stored = localStorage.getItem('unified_worker_token');/const data = unifiedWorkerTokenService.getTokenDataSync();/" src/pages/YourPage.tsx
sed -i '' "s/if (stored) {/if (data) {/" src/pages/YourPage.tsx
sed -i '' "/const data = JSON.parse(stored);/d" src/pages/YourPage.tsx

# 3. Replace localStorage.removeItem
sed -i '' "s/localStorage.removeItem('unified_worker_token');/unifiedWorkerTokenService.clearToken();/" src/pages/YourPage.tsx

# 4. Update comments
sed -i '' "s|// Use global worker token service instead of custom localStorage handling|// Use global worker token service (unified storage)|g" src/pages/YourPage.tsx
```

### Documentation Required

After migration, create changelog in `docs/updates-to-apps/{page-name}-updates.md`:

- Before/after code examples
- Files modified
- Testing instructions
- Rollback plan

### Already Migrated Examples

- ✅ [PingOne User Profile](../updates-to-apps/pingone-user-profile-updates.md) - Feb 27, 2026
- ✅ [Configuration](../updates-to-apps/configuration-dashboard-v8-migration.md) - Feb 27, 2026
- ✅ [Dashboard](../updates-to-apps/configuration-dashboard-v8-migration.md) - Feb 27, 2026
- ✅ [Auto-Discover](../updates-to-apps/auto-discover-updates.md) - Feb 27, 2026
- ✅ [HelioMart Password Reset](../updates-to-apps/helio-mart-password-reset-updates.md) - Feb 27, 2026

---

## 🎯 Recent Completions (February 26, 2026)

### Session Summary: UI Polish, API Enhancements, and Icon Migration (PR 1)

This session completed multiple improvements across the application, including token status accuracy, API testing enhancements, sidebar UX improvements, and the initial setup for icon font migration.

---

### ✅ COMPLETED: Token Status & Button State Fix (EnvironmentManagementPageV8)

**Page:** [https://api.pingdemo.com:3000/environments](https://api.pingdemo.com:3000/environments)

**Problem:** Token status showed green when button said "no token" - status and button were mismatched.

**Changes Made:**

1. **Updated Token Status Calculation** (`src/v8u/services/workerTokenStatusServiceV8U.ts`)
   - Modified `getWorkerTokenStatusVariant()` to use 5-minute expiration threshold
   - Logic: `>5 minutes = valid (green)`, `<5 minutes = warning (yellow)`, `≤0 or missing = invalid (red)`

2. **Implemented Dynamic Button Colors** (`src/pages/EnvironmentManagementPageV8.tsx`)
   - Added `buttonStyle` useMemo that calculates color based on token expiration
   - Button "Get Worker Token for Environments" now shows:
     - **Green** (#10b981) if token is valid (>5 minutes remaining)
     - **Yellow** (#f59e0b) if token expires soon (<5 minutes)
     - **Red** (#ef4444) if no token or expired
   - Improved button padding: `1rem 1.75rem` (was `0.75rem 1.5rem`)
   - Added `2rem` top margin and `1.5rem` bottom margin for better spacing
   - Added accessibility handlers: `onFocus` and `onBlur` for keyboard navigation

**Files Modified:**

- `src/v8u/services/workerTokenStatusServiceV8U.ts` - Added 5-minute threshold logic
- `src/pages/EnvironmentManagementPageV8.tsx` - Dynamic button styling, improved spacing

**Outcome:** ✅ Token status and button colors now accurately reflect token health state

---

### ✅ COMPLETED: Custom Domain Test Page Enhancements

**Page:** [https://api.pingdemo.com:3000/custom-domain-test](https://api.pingdemo.com:3000/custom-domain-test)

**Changes Made:**

1. **Added 4 New API Endpoints** with parameter support:
   - `GET /api/user/{username}` - Get user by username
   - `GET /api/org/{orgId}/licensing` - Organization licensing info
   - `GET /api/identity/metrics` - Identity metrics
   - `GET /api/environment/{envId}` - Get environment details

2. **Parameter Input Section:**
   - Added 3 input fields: `username`, `orgId`, `envId`
   - Implemented parameter interpolation into API paths using `{paramName}` syntax
   - Parameters are optional but required for APIs that use them

3. **Full URL Display:**
   - Added page URL display at the top: `https://api.pingdemo.com:3000/custom-domain-test`
   - Users can now see the full current page URL

**Files Modified:**

- `src/pages/CustomDomainTestPage.tsx` - Added 4 endpoints, parameter inputs, URL display

**Outcome:** ✅ API testing page now supports parameterized endpoints with dynamic path interpolation

---

### ✅ COMPLETED: Sidebar Resize Handle Enhancement

**Component:** `src/components/Sidebar.tsx`

**Problem:** Resize handle was not visible and difficult to grab.

**Changes Made:**

1. **Enhanced ResizeHandle Styling:**
   - Increased width from `4px` to `8px` for easier grabbing
   - Added `::after` pseudo-element with visible blue indicator
   - Improved hover states:
     - Default: Transparent with cursor change
     - Hover: Blue (#3b82f6) highlight with 30% opacity
     - Active (dragging): Solid blue (#3b82f6) highlight
   - Added proper z-index management for layering
   - Enhanced accessibility with focus states

2. **Visual Feedback:**
   - Resize handle now has a subtle blue vertical line on hover
   - Stronger blue highlight when actively dragging
   - Smooth transitions for better UX

**Files Modified:**

- `src/components/Sidebar.tsx` - Enhanced ResizeHandle component

**Outcome:** ✅ Sidebar is now easily resizable with clear visual feedback

---

### ✅ COMPLETED: API Documentation Links Update

**Page:** [https://api.pingdemo.com:3000/environments](https://api.pingdemo.com:3000/environments)

**Problem:** API endpoint links pointed to old `apidocs.pingidentity.com` domain.

**Changes Made:**

Updated all 6 environment API endpoint links from:

- `https://apidocs.pingidentity.com/pingone/platform/v1/api/#...`

To new PingOne API documentation:

- `https://developer.pingidentity.com/pingone-api/platform/v1/api/#...`

**Specific Endpoint Links:**

1. GET /environments → `#get-read-all-environments`
2. GET /environments/:id → `#get-read-one-environment`
3. POST /environments → `#post-create-environment-activelicense`
4. PUT /environments/:id → `#put-update-environment`
5. PUT /environments/:id/status → `#put-update-environment` (status update)
6. DELETE /environments/:id → `#delete-delete-environment`

**Files Modified:**

- `src/pages/EnvironmentManagementPageV8.tsx` - Updated all API documentation hrefs

**Outcome:** ✅ All API links now point to current developer.pingidentity.com documentation

---

### ✅ COMPLETED: Route Path Fix - Advanced Configuration

**Problem:** Navigation to `/advanced-configuration` resulted in 404 redirect to dashboard.

**Root Cause:** Route path mismatch

- Route defined as: `/advanced-config`
- Sidebar linked to: `/advanced-configuration` ❌

**Changes Made:**

1. **Updated Route Definition** (`src/App.tsx` line 1289)
   - Changed from `/advanced-config` to `/advanced-configuration`

2. **Updated Page Style Context** (`src/contexts/PageStyleContext.tsx` line 93)
   - Updated key from `/advanced-config` to `/advanced-configuration`

3. **Updated E2E Test** (`e2e/tests/configuration/config-validation.spec.ts` line 135)
   - Changed test navigation from `/advanced-config` to `/advanced-configuration`

**Files Modified:**

- `src/App.tsx` - Route path
- `src/contexts/PageStyleContext.tsx` - Page style key
- `e2e/tests/configuration/config-validation.spec.ts` - Test path

**Outcome:** ✅ `/advanced-configuration` route now works correctly, matching sidebar navigation

---

### ✅ COMPLETED: TypeScript Cleanup - App.tsx

**Problem:** Unused lazy-loaded component imports causing TypeScript warnings.

**Changes Made:**

Removed 3 unused imports from `src/App.tsx`:

- Line 213: `const _EmailFlowV8 = lazy(...)`
- Line 222: `const _SMSFlowV8 = lazy(...)`
- Line 225: `const _WhatsAppFlowV8 = lazy(...)`

These components were imported but never used in the routing configuration.

**Files Modified:**

- `src/App.tsx` - Removed unused lazy imports

**Outcome:** ✅ Eliminated TypeScript warnings for unused imports

---

### ✅ COMPLETED: Syntax Error Fix - AllFlowsApiTest.tsx

**Problem:** Build failed with "Unterminated regular expression" error at line 1291.

**Root Cause:** Misplaced `</CollapsibleHeader>` closing tag inside conditional block.

**Changes Made:**

Fixed JSX structure in `src/pages/test/AllFlowsApiTest.tsx`:

- Moved `</CollapsibleHeader>` outside the conditional `{generatedUrl && (...)}` block
- Proper component nesting: `<CollapsibleHeader>` wraps all test sections, including conditional generated URL section

**Files Modified:**

- `src/pages/test/AllFlowsApiTest.tsx` - Fixed JSX structure

**Outcome:** ✅ Build now succeeds without syntax errors

---

### ✅ COMPLETED: Auto-Discover Page Migration (PR 5)

**Page:** [https://api.pingdemo.com:3000/auto-discover](https://api.pingdemo.com:3000/auto-discover)

**Objective:** Migrate OIDC Discovery page to follow Ping UI consistency guidelines.

**Changes Made:**

1. **Replaced react-icons with MDI icons:**
   - `FiInfo` → `mdi-information` (removed - section now uses CollapsibleHeader)
   - `FiGlobe` → `mdi-earth`
   - `FiCheckCircle` → `mdi-check-circle`

2. **Implemented CollapsibleHeader with Ping theme:**
   - Converted info card to collapsible section with `theme="ping"` and `variant="compact"`
   - Section title: "How OIDC Discovery Works"
   - Defaults to expanded state for first-time users

3. **Updated Typography Colors (Ping UI Guidelines):**
   - Primary text: `#111827` (almost black) - replaced `#1f2937`, `#374151`
   - Secondary text: `#1f2937` - replaced `#6b7280` and `#4b5563`
   - Enhanced readability across all text elements

4. **Enhanced Info Section Structure:**
   - Added step numbers (Step 1-5) with bold labels
   - Improved list spacing: `1.8` line-height, `0.75rem` bottom margin
   - Better visual hierarchy with stronger font weights

5. **Updated Action Button (Ping Red):**
   - Changed from blue (#3b82f6) to Ping red (#dc2626)
   - Hover state: darker red (#b91c1c)
   - Improved padding: `1rem 1.75rem` (was `0.75rem 1.5rem`)
   - Enhanced font weight: 600 (was 500)
   - Added subtle box shadow for depth
   - Added `aria-label` for accessibility

6. **Enhanced Success Message:**
   - Improved border color: `#86efac` (was `#bbf7d0`)
   - Better padding: `1.25rem 1.5rem` (was `1rem`)
   - Larger icon size: `1.5rem`
   - Added box shadow for depth
   - Wrapped environment ID in `<strong>` tag for emphasis
   - Better color contrast for text

7. **Updated Card Styling:**
   - Background: `#f9fafb` (lighter, cleaner look)
   - Border: `#e5e7eb` (consistent with guidelines)
   - Border-radius: `0.75rem` (maintained)
   - Better content spacing

**Files Modified:**

- `src/pages/AutoDiscover.tsx` - Complete migration to Ping UI guidelines

**Accessibility Improvements:**

- Added `aria-label="Start OIDC Discovery"` to action button
- All icons marked `aria-hidden="true"` as decorative
- Maintained semantic HTML structure

**Outcome:** ✅ Auto-Discover page now follows Ping UI consistency guidelines with collapsible sections, proper color scheme, and MDI icons

---

### 📊 Session Metrics

**Files Modified:** 12
**Components Enhanced:** 5
**New Features Added:** 5
**Bugs Fixed:** 3
**Routes Fixed:** 1
**API Endpoints Added:** 4
**Pages Migrated:** 1 (Auto-Discover)

**Quality Improvements:**

- ✅ Token status accuracy
- ✅ Better visual feedback (sidebar, buttons)
- ✅ Enhanced API testing capabilities
- ✅ Improved documentation links
- ✅ Cleaner TypeScript (no warnings)
- ✅ Started icon font migration
- ✅ First page fully migrated to Ping UI guidelines

---

### ✅ COMPLETED: Worker Token Standardization — useGlobalWorkerToken Pattern (February 27, 2026)

**Scope:** PingOneUserProfile, HelioMartPasswordReset, useGlobalWorkerToken hook

**Changes Made:**

1. **`useGlobalWorkerToken` hook** — Added `autoFetch?: boolean` option (default `true`). When `false`, reads stored token only (no API call). Also added `workerTokenUpdated` event listener in both modes for reactive updates.

2. **PingOneUserProfile** — Removed custom `WorkerTokenMeta` infrastructure (`interface`, `describeExpiry()`, `getWorkerTokenMeta()`, `useState`, 3 effects). Replaced with `useGlobalWorkerToken` + standard `handleGetWorkerToken` / `handleClearWorkerToken` callbacks. Simplified AlertBanner to two-state. Updated `isExpired` guards to `!globalTokenStatus.isValid`.

3. **HelioMartPasswordReset** — Added `autoFetch: false` so page load no longer triggers a PingOne API call. Added `handleGetWorkerToken` / `handleClearWorkerToken` standard callbacks. Replaced raw `localStorage.getItem` calls with `unifiedWorkerTokenService.getTokenDataSync()`.

**Files Modified:**
- `src/hooks/useGlobalWorkerToken.ts`
- `src/pages/PingOneUserProfile.tsx`
- `src/pages/security/HelioMartPasswordReset.tsx`

**Changelogs:**
- [PingOne User Profile — Update 3](../updates-to-apps/pingone-user-profile-updates.md)
- [HelioMart Password Reset — Update 1](../updates-to-apps/helio-mart-password-reset-updates.md)

---

### ✅ COMPLETED: Identity Metrics JSON/Formatted Toggle (February 27, 2026)

**Page:** `/pingone-identity-metrics`

**Changes Made:**
- Added `showRawJson` state to `PingOneIdentityMetrics.tsx`
- Replaced static Full API Response card with a Formatted/Raw JSON toggle pill in the SectionTitle header
- Formatted view: `JSONHighlighter` component; Raw JSON view: `<pre>` block with `JSON.stringify(metrics, null, 2)`

**Files Modified:**
- `src/pages/PingOneIdentityMetrics.tsx`

**Changelog:** [PingOne Identity Metrics Updates](../updates-to-apps/pingone-identity-metrics-updates.md)

---

### ✅ COMPLETED: PR 1 — Icon Font Migration Setup (February 27, 2026)

**Status:** Complete ✅

**Implementation Method:** Used official `@mdi/font` npm package instead of manual font creation.

**Completed Steps:**

1. ✅ **Task 1.1** - Installed Material Design Icons fonts
   - Installed `@mdi/font` package via npm
   - Copied 4 font files to `public/icons/`:
     - `materialdesignicons-subset.woff2` (394KB)
     - `materialdesignicons-subset.woff` (574KB)
     - `materialdesignicons-subset.ttf` (1.2MB)
     - `materialdesignicons-subset.eot` (1.2MB)

2. ✅ **Task 1.2** - Updated `src/styles/icons.css`
   - Removed SVG font reference (not needed for modern browsers)
   - Maintained absolute runtime paths for Vite compatibility
   - Added 12 new icon definitions:
     - `mdi-server`, `mdi-chart-box`, `mdi-chart-line`, `mdi-cog`
     - `mdi-refresh`, `mdi-content-save`, `mdi-lightning-bolt`
     - `mdi-link`, `mdi-open-in-new`, `mdi-drag`
     - `mdi-settings`, `mdi-info`
   - Total icons defined: 34 (22 original + 12 new)

3. ✅ **Task 1.3** - Nano CSS imports (already completed)
   - End User Nano CSS from CDN
   - Icons CSS
   - Nano overrides CSS

**Files Modified (PR 1):**

- `package.json` - Added `@mdi/font` dependency
- `public/icons/` - Added 4 font files (1.9MB compressed total)
- `src/styles/icons.css` - Removed SVG reference, added 12 icon definitions
- `src/main.tsx` - Already has Nano CSS imports
- `src/styles/nano-overrides.css` - Already has minimal overrides

**Result:**

- ✅ All icon fonts loaded successfully
- ✅ Dashboard "ea09" bug fixed - now shows ✓ check-circle icon
- ✅ All 34 icons available throughout application
- ✅ No console errors
- ✅ Production-ready

**Dependencies:**

```json
"@mdi/font": "^7.4.47"
```

---

### 🔄 DEPRECATED: Old Icon Migration Approach

~~The original plan was to use IcoMoon for manual font subset generation.~~

**Why We Didn't Use IcoMoon:**

- More error-prone (manual Unicode mapping)
- Time-consuming (selecting 34 icons individually)
- Hard to maintain (no package updates)

**Why @mdi/font is Better:**

- One command: `npm install @mdi/font`
- Auto-updated when package updates
- Contains all MDI icons (no manual selection)
- Professionally maintained
- Compressed woff2 is only 394KB

---

## Ground rules (do not skip)

- Keep changes **incremental** and **reversible**.
- Do **one app** at a time (this repo only).
- Do not refactor UI broadly in the same PR as foundational CSS imports.
- Validate after each step with smoke tests + minimal visual checks.

---

## PR 1 — Add icon fonts + wire up CSS imports

## Task 1.1 — Create `public/icons/` and add font files

Create folder:

- `public/icons/`

Add these files to `public/icons/` (exact names):

- `materialdesignicons-subset.woff2`
- `materialdesignicons-subset.woff`
- `materialdesignicons-subset.ttf`
- `materialdesignicons-subset.eot`
- `materialdesignicons-subset.svg`

Acceptance:

- Files exist at `public/icons/*` and are tracked by git.

## Task 1.2 — Fix `src/styles/icons.css` font-face URLs

Open:

- `src/styles/icons.css`

Find `@font-face` and replace the `src:` URLs to **absolute** runtime paths:

```css
@font-face {
  font-display: block;
  font-family: "webfont";
  src: url("/icons/materialdesignicons-subset.eot") format("embedded-opentype");
  src:
    url("/icons/materialdesignicons-subset.svg") format("svg"),
    url("/icons/materialdesignicons-subset.woff2") format("woff2"),
    url("/icons/materialdesignicons-subset.woff") format("woff"),
    url("/icons/materialdesignicons-subset.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
}
```

Acceptance:

- `vite dev` can request `GET /icons/materialdesignicons-subset.woff2` and returns **200**.

## Task 1.3 — Add Nano + icons imports at top of `src/main.tsx`

Edit:

- `src/main.tsx`

Add these imports at the very top of the file (before React imports):

```ts
import "./styles/vendor/end-user-nano.css";
import "./styles/icons.css";
import "./styles/nano-overrides.css";
```

Then create:

- `src/styles/nano-overrides.css`

Start it minimal:

```css
/* Keep this file small. Only fix cascade conflicts needed for migration. */
.mdi::before {
  vertical-align: -0.125em;
}
```

Acceptance:

- App builds and runs.
- No console errors introduced by these imports.

## Task 1.4 — Add temporary icon smoke test

Pick a visible place (e.g. header, dashboard, or a dev-only test route) and render:

```tsx
<i className="mdi mdi-check-circle" aria-hidden="true" style={{ fontSize: 24 }} />
```

Acceptance:

- Icon renders correctly (not a missing glyph box).
- DevTools Network shows fonts loaded successfully (woff2 200).

Rollback (PR 1):

- Remove the imports, remove `public/icons/*`, revert `icons.css` changes.

---

## PR 2 — Update PWA caching patterns for font formats

Edit `vite.config.ts` and update **both** globPatterns occurrences:

1) `workbox.globPatterns`
2) `injectManifest.globPatterns`

Change from:

```js
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
```

To:

```js
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}']
```

Acceptance:

- `vite build` succeeds.
- PWA still runs; no new SW errors in console.

Rollback (PR 2):

- Revert globPatterns changes.

---

## PR 3 — Add a standard React Icon component (mdi-based)

## Task 3.1 — Create Icon component

Create file:

- `src/components/Icon/Icon.tsx`

Paste:

```tsx
import * as React from "react";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
type IconTone = "default" | "muted" | "danger" | "success" | "warning" | "info";

const sizeToEm: Record<IconSize, string> = {
  xs: "0.75em",
  sm: "0.875em",
  md: "1em",
  lg: "1.25em",
  xl: "1.5em",
};

const toneToClass: Record<IconTone, string> = {
  default: "",
  muted: "text-muted",
  danger: "text-danger",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

export type IconProps = {
  name: string; // token without prefix, e.g. "check-circle"
  size?: IconSize;
  tone?: IconTone;

  decorative?: boolean; // default true
  label?: string; // required if decorative=false

  title?: string;
  className?: string;
  style?: React.CSSProperties;
  "data-testid"?: string;
  as?: "i" | "span";
};

export function Icon({
  name,
  size = "md",
  tone = "default",
  decorative = true,
  label,
  title,
  className,
  style,
  as = "i",
  ...rest
}: IconProps) {
  if (!decorative && !label && process.env.NODE_ENV !== "production") {
    // Fail fast in dev
    // eslint-disable-next-line no-console
    console.error(`Icon("${name}") requires 'label' when decorative={false}`);
  }

  const classes = ["mdi", `mdi-${name}`, toneToClass[tone], className]
    .filter(Boolean)
    .join(" ");

  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label || "" };

  const Comp = as;

  return (
    <Comp
      className={classes}
      title={title}
      {...a11yProps}
      {...rest}
      style={{
        display: "inline-block",
        lineHeight: 1,
        verticalAlign: "-0.125em",
        fontSize: sizeToEm[size],
        ...style,
      }}
    />
  );
}
```

Acceptance:

- Typecheck passes.
- You can replace the smoke test usage with `<Icon name="check-circle" />` and it renders.

## Task 3.2 — Replace 1–3 icons in one screen only (low risk)

Pick a single screen (e.g. Dashboard) and replace:

- `<i className="mdi mdi-...">` or react-icons usages (only a few)

Use:

```tsx
<Icon name="check-circle" />
```

Acceptance:

- No layout shifts in that screen beyond icon rendering.
- A11y: icon-only buttons keep aria-label on button; meaningful icons use `decorative={false}` + `label`.

Rollback (PR 3):

- Keep CSS + fonts; revert component + callsite changes.

---

## PR 4 — Reduce GlobalStyle collisions with Nano

Edit:

- `src/styles/global` (where GlobalStyle is defined)

## Task 4.1 — Remove global margin/padding reset

Replace:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

With:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

Acceptance:

- Lists (`ul/ol`) have indentation again where expected.
- Nano/Bootstrap spacing behavior returns to normal.

## Task 4.2 — Remove hard-coded heading sizes

Delete the explicit sizing rules:

```css
h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
...
h6 { font-size: 1rem; }
```

Keep shared heading styling if desired (weight, line-height). Use Bootstrap classes in components for explicit sizes.

Acceptance:

- Typography aligns more closely with Nano.
- No severe regressions on key screens.

## Task 4.3 — Stop forcing font-size on form controls

Change:

```css
button, input, select, textarea {
  font-family: inherit;
  font-size: 1rem;
}
```

To:

```css
button, input, select, textarea {
  font-family: inherit;
}
```

Acceptance:

- `.form-control-sm/.lg` and Nano default sizing works.
- Inputs do not appear unexpectedly large.

## Task 4.4 — Consolidate duplicate body blocks

There are two `body { ... }` blocks. Merge into one coherent block to avoid cascade confusion.

Acceptance:

- Body background/color/line-height are deterministic.

Rollback (PR 4):

- Revert GlobalStyle changes.

---

## PR 5+ — Page-by-page conversion (Bootstrap/Nano classes)

Rule: one route/screen per PR.

For each screen:

1) Convert layout containers to Nano/Bootstrap (`container`, `row`, `col-*`, `card`, `btn`, utilities).
2) Keep styled-components only where necessary; remove per-component wrappers when replaced.
3) Replace react-icons with `<Icon />` gradually.
4) **Collapsible sections (Ping UI):**
   - All major sections MUST be collapsible (use `CollapsibleHeader` or equivalent).
   - Section headers MUST use **Ping red background and white text** (theme `ping`).
   - Headers MUST be **narrow** (use `variant="compact"` or equivalent reduced padding).
   - A **common collapse/expand icon** MUST be used across all sections (e.g. chevron up/down in a consistent style).

Acceptance per screen:

- Visual sanity: spacing, typography, buttons, forms
- Functional sanity: flows still work
- A11y sanity: focus visible, icon-only controls labeled
- All sections collapsible with Ping red/white headers and shared expand/collapse icon

Rollback:

- Revert only the screen PR without touching the global foundation.

---

## Menu — Ping UI (left sidebar)

Plan to align the left-hand navigation with the Ping-style reference: fixed narrow sidebar, light grey background, icon + text items, blue active state with left accent bar, collapsible sections with chevrons.

**See:** `docs/updates-to-apps/MENU_PING_UI_PLAN.md` and `docs/updates-to-apps/menu-updates.md` for full steps and current state (theme CSS, SidebarMenuPing, layout/App/Navbar width, no changes to locked `DragDropSidebar.tsx`).

**Ping UI consistency (all pages):** Same doc, Phase 5 — use **light red headers + white text** on every page (no blue/grey headers); use **almost black** body text (`#111827` / `#1f2937`) instead of grey/muted everywhere.

---

## Storage policy (config & UI — persist across refresh/restore)

- **Dual storage:** Any config, UI preference, or user-entered data that should survive refresh and restore (so the user does not have to re-enter) MUST be stored in **both IndexedDB (client) and SQLite (backend)**.
- **Client:** Use IndexedDB (e.g. a small service or existing app-config store) for fast read on load.
- **Backend:** Expose an API that reads/writes SQLite (e.g. `settingsDB` or backup API); frontend syncs on save and optionally on load.
- **Pattern:** See `customDomainService` (custom domain) and backup services (e.g. worker token): write to API + IndexedDB on save; read from IndexedDB first, then optionally from API.
- **Do not** rely only on `localStorage` for data that must be reliable and restorable; use the dual IndexedDB + SQLite pattern. Document storage keys and API in `docs/updates-to-apps/` when adding or changing persisted data.
- **Updates:** Follow `prompt-all.md` (inventory, change packet, changelog) for any change that touches persistence.

---

## Messaging (toast replacement)

Follow **`toast-replace.md`**: replace toast-based notifications with contextual, user-centered feedback. Do not use toasts unless explicitly justified.

- **Success / confirmation:** Inline message near the triggering element, button state (e.g. Save → Saved ✓), or contextual success banner. Do not rely on transient overlays.
- **Errors:** Field-level or form-level messages; persistent banner when system/account-level. Errors must be actionable and specific.
- **Applied in this repo:** Dashboard (Config save: domainError only; Refresh: inline success/error next to Refresh button). Delete All Devices (inline error banner and Deletion Results section; no toasts).

When adding or changing feedback in an app, choose the pattern from `toast-replace.md` (inline confirmation, validation message, persistent banner, snackbar with Undo, or contextual detail) and document in the relevant `docs/updates-to-apps/` doc.

---

## Consistency rules (all apps — add as you touch each screen)

Apply these when converting or fixing any app/page so the whole product stays consistent.

### Section headers and page title

- **Section headers:** Use `CollapsibleHeader` with `theme="ping"` only. Do not use `theme="blue"`, `theme="green"`, etc. for section headers; reserve those for legacy screens until they are converted.
- **Page-level title:** For non-flow pages, use a single pattern: either the shared layout (e.g. `PageLayoutService` with a Ping-style option when added) or a standard page title bar with Ping red background and white text. For flow pages, `FlowHeader` may stay; ensure any section headers below use `theme="ping"`.
- **Variant:** Use `variant="compact"` for section headers so they stay narrow.

### Body and secondary text

- **Primary text:** `#111827`. **Secondary/supporting text:** `#1f2937`. Replace all `#6b7280`, `theme.colors.gray600`, and other grey/muted body text with these. No grey for normal body copy.

### Page container and width

- **Max-width:** Use one standard for content (e.g. `72rem` or `1200px`) unless the screen has a specific reason (e.g. wide comparison). Prefer the layout service or a shared constant; avoid one-off values like 800px, 960px, 1400px per page.
- **Padding:** Use a consistent scale (e.g. 1rem, 1.5rem, 2rem) or Nano/Bootstrap spacing; avoid arbitrary mix of `2rem`, `24px`, `1.5rem` across pages.

### Icons

- Use `<Icon name="…" />` (MDI) instead of `react-icons` (Fi*) when editing a screen. Map Fi* to the nearest MDI name (e.g. FiCheckCircle → `check-circle`). Icon-only buttons must have `aria-label` on the button.

### Cards and sections

- **Section cards:** Same border (`1px solid #e5e7eb`), border-radius (e.g. `0.75rem`), padding, and white background where sections are card-like. Prefer shared classes or a small set of styled wrappers over one-off styled-components per page.
- **Collapsible sections:** All major sections collapsible via `CollapsibleHeader` (or equivalent) with the same expand/collapse icon (chevron).

### Buttons

- Primary actions: consistent button class (e.g. `btn` with a semantic modifier from dashboard/Nano). Secondary/cancel: outline style. Use the same pattern across pages (e.g. `btn btn-oauth`, `btn btn-outline` where defined).

### Empty and error states

- Use shared patterns for "no data" and error messages: same typography (almost black), spacing, and optional icon. Prefer shared `EmptyState`/`ErrorState` components or CSS classes over inline styles and ad-hoc markup.

### Forms

- Labels: consistent style (e.g. font-weight 600, color `#111827`). Inputs: use Nano/Bootstrap form classes where possible; avoid forcing global `font-size` on controls (see PR 4). Group label + input + hint with consistent spacing.

### Layout services

- When a page uses `PageLayoutService` or `FlowHeader`, prefer or add a Ping-style option so the top bar aligns with Ping red + white. Do not introduce new blue/green/orange header themes for new or converted screens.

### Checklist per screen (when you touch it)

- [ ] Section headers use `CollapsibleHeader` with `theme="ping"` and `variant="compact"`.
- [ ] Body/secondary text use `#111827` / `#1f2937` (no `#6b7280` or grey).
- [ ] Page container uses standard max-width and padding.
- [ ] Icons use `<Icon />`; icon-only buttons have `aria-label`.
- [ ] Cards/sections use shared border, radius, padding, background.
- [ ] Buttons use shared primary/outline pattern.
- [ ] Empty/error states use shared pattern or component.
- [ ] Form labels and controls use consistent style and spacing.

---

## SMOKE TEST CHECKLIST (run after every PR)

### Build/Run

- `npm run dev` loads without console errors
- `npm run build` succeeds

### UI sanity

- Headings not huge/squashed
- Lists indent normally
- Buttons clickable and styled
- Forms readable and aligned

### Icons (smoke)

- Icons render correctly
- Fonts requested successfully (200)
- No missing glyph boxes

### A11y (smoke)

- Tab order reasonable
- Focus visible
- Icon-only buttons have `aria-label`

---

## Notes (do not forget)

- `vite.config.ts` does NOT set `base`, so deployment is assumed at `/`.
- If deployment ever moves to a subpath, revisit font URLs and base path.
- Keep `nano-overrides.css` minimal; prefer component-level classes over global overrides.
