# Windsurf Prompt — Add Expand/Collapse All Sections on Every Page

You are Windsurf operating inside this repo. Implement a standard system so that every page with “sections” supports:
- each section is collapsible
- two page-level buttons: “Expand all” and “Collapse all” that control all sections on that page

Critical targets:
- Route/page: `/v8/mfa/register/fido2`
- Route/page: `/sdk-examples`

Every other page with sections must be updated to follow the same pattern.

---

## NON-NEGOTIABLE RULES
1) Do NOT change business logic, API calls, auth semantics, routing outcomes, or data model meaning.  
2) Preserve test selectors and stable IDs (`data-testid`, etc.). Avoid unnecessary DOM churn.  
3) Fix lint errors in any files you touch; do not introduce new lint errors.  
4) Run full testing after each app/module update: lint + typecheck (if separate) + unit tests + build (+ e2e if normally required).  
5) Keep changes incremental and PR-friendly; do not do repo-wide formatting.

---

## PHASE 0 — DISCOVERY (MANDATORY)
- Identify the app/module that owns:
  - `/v8/mfa/register/fido2`
  - `/sdk-examples`
- Locate their page components and determine current “sections” (cards/panels/headers).
- Identify the repo’s lint/test/build commands from package.json/workspace scripts.
- Identify the repo’s “new storage service” module and its approved API usage.

---

## PHASE 1 — BUILD SHARED SECTION SYSTEM (REQUIRED)
Create shared UI primitives (place in the existing shared/components folder for the repo):

### 1) `CollapsibleSection` component
- Props: `id`, `title`, `children`, `expanded`, `onExpandedChange`, `defaultExpanded?`, `actions?`
- Header MUST be a `<button>` with:
  - `aria-expanded`
  - `aria-controls` → panel id
- Panel uses `role="region"` and a stable `id`
- Keyboard: Enter/Space toggles
- Chevron icon indicates state (use MDI CSS icon; icon itself `aria-hidden="true"`)
- Visual style aligned to PingOne UI (`.end-user-nano`), using existing variables/tokens and **0.15s** transitions

### 2) `useSectionsController(pageKey, sectionIds, defaults?)` hook
- State: `expandedById: Record<string, boolean>`
- Methods: `toggle(id)`, `setExpanded(id,bool)`, `expandAll()`, `collapseAll()`
- Derived: `allExpanded`, `allCollapsed`
- Persist `expandedById` using the **NEW storage service** (not `localStorage` directly):
  - Key format: `ui.sections.<pageKey>`
  - Backwards compatibility: if legacy keys exist, read them once and migrate

### 3) `ExpandCollapseAllControls` component
- Renders two buttons: **Expand all** / **Collapse all**
- Disables Expand when `allExpanded`; disables Collapse when `allCollapsed`
- Uses PingOne UI button classes and MDI icons if appropriate
- Accessible labels

---

## PHASE 2 — APPLY TO TARGET PAGES FIRST (REQUIRED)

### A) `/v8/mfa/register/fido2`
- Identify all logical sections (examples: device info, security key options, advanced config, troubleshooting, etc.)
- Wrap each section in `CollapsibleSection`
- Add **Expand/Collapse All** controls at top of the page
- Form-specific rule:
  - If validation errors exist in a collapsed section, **auto-expand** that section so errors are visible
- Ensure no behavior change in registration flow; only presentation/state

### B) `/sdk-examples`
- Identify section groupings (example categories, per-example details panels, filters, etc.)
- Implement collapsible sections for each category/panel
- Add **Expand/Collapse All** controls at top

---

## PHASE 3 — APPLY ACROSS ALL PAGES WITH SECTIONS (REQUIRED)
- Inventory all other pages that contain multiple cards/panels/section headers
- Apply the same pattern:
  - add top Expand/Collapse controls
  - wrap each section
  - use controller hook with a stable `pageKey` and stable section IDs
- Ensure `.end-user-nano` scoping remains correct

---

## PHASE 4 — LINT + TESTING (MANDATORY)
After finishing each app/module:
- Run lint and fix issues in touched files
- Run typecheck (if separate)
- Run unit/component tests
- Run build
- Run e2e if that’s part of normal CI  
Do not proceed to next app/module until green.

---

## REQUIRED OUTPUT
1) List of changed/new files  
2) For `/v8/mfa/register/fido2` and `/sdk-examples`:
   - what sections were identified and their IDs
   - confirm Expand/Collapse All works and persists (if enabled)  
3) Lint results: baseline vs final for the touched app/module  
4) Tests run (commands) and pass/fail  
5) Any follow-ups (if any), minimal and with file paths

---

## END STATE
- Every page with sections supports collapse/expand
- Two buttons expand/collapse all sections on the page
- PingOne UI styling is maintained
- Lint improved/clean for touched files
- Full tests pass after each app/module update
