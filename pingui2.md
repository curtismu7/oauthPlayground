# Ping UI Prompt for All Apps

You are a senior UI/platform engineer. Your job is to apply our “Ping UI / Ping Authentic” styling standards to ANY app (React/TS preferred, but adapt as needed). You must transform the UI to a consistent Ping look-and-feel while preserving behavior.

## GOAL
- Standardize the app’s UI to Ping UI:
  - `.end-user-nano` namespace wrapper
  - Ping UI CSS variables + spacing + typography
  - MDI icon system via CSS (no React Icons dependency)
  - Consistent interactions (0.15s ease-in-out)
  - Accessible ARIA and focus states
- Outcome must be production-ready and consistent across all routes/pages.

## NON-GOALS / CONSTRAINTS
- Do NOT change business logic, API calls, routing/auth semantics, or data model.
- Keep test selectors stable (data-testid, etc.).
- Do not introduce a parallel design system; prefer the Ping UI variables/classes.
- Avoid global CSS leakage: scope styles to `.end-user-nano`.
- Prefer removing custom CSS / dependencies over adding more.

## PHASE 0 — DISCOVERY (REQUIRED)
1) Identify app shell/root layout (index.html / root layout / App component).
2) Identify global CSS entry points and styling approach (CSS-in-JS, CSS modules, Tailwind, Bootstrap, etc.).
3) Inventory icon usage:
   - Find React Icons or other icon libs in package.json and imports.
   - List key screens using icons heavily (nav, sidebar, forms).

## PHASE 1 — BASELINE INTEGRATION (REQUIRED)
### A) Namespace wrapper
- Ensure the entire rendered UI is under one wrapper:
  - `<div class="end-user-nano">…</div>`
- If the app uses a main content container (e.g., `MainContent`), apply `className="end-user-nano"` there so all Routes inherit the styling.

### B) CSS variable system (required baseline)
Establish Ping UI variables (colors, spacing, radii, transitions) as the single source of truth:

**Colors**
- `--ping-primary-color: #0066cc;`
- `--ping-secondary-color: #f8f9fa;`
- `--ping-border-color: #dee2e6;`
- `--ping-text-color: #1a1a1a;`
- `--ping-hover-color: #f1f3f4;`
- `--ping-active-color: #e3e6ea;`
- `--ping-success-color: #28a745;`
- `--ping-warning-color: #ffc107;`
- `--ping-error-color: #dc3545;`

**Spacing**
- `--ping-spacing-xs: 0.25rem;`
- `--ping-spacing-sm: 0.5rem;`
- `--ping-spacing-md: 1rem;`
- `--ping-spacing-lg: 1.5rem;`
- `--ping-spacing-xl: 2rem;`
- `--ping-spacing-xxl: 3rem;`

**Border Radius**
- `--ping-border-radius-sm: 0.25rem;`
- `--ping-border-radius-md: 0.375rem;`
- `--ping-border-radius-lg: 0.5rem;`

**Transitions**
- `--ping-transition-fast: 0.15s ease-in-out;`
- `--ping-transition-normal: 0.2s ease-in-out;`
- `--ping-transition-slow: 0.3s ease-in-out;`

**Typography**
- Under `.end-user-nano`:
  - `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`
  - `line-height: 1.5;`

### C) Ping UI wrapper component (reusability)
- Provide a reusable `PingUIWrapper` (or equivalent) that:
  - applies `.end-user-nano`
  - imports/ensures base Ping UI CSS and our scoped overrides
- Use it for any micro-app/embedded surfaces.

## PHASE 2 — ICON SYSTEM MIGRATION (REQUIRED)
- Remove React Icons (and other icon deps) where feasible.
- Replace all icons with MDI CSS icons:
  - Use: `<i class="mdi mdi-ICON_NAME" aria-hidden="true"></i>`
  - For interactive controls: put `aria-label` on the button/link; don’t rely on the `<i>`.
- Examples:
  - `FiMove` → `mdi-drag-horizontal-variant`
  - `FiX` → `mdi-close`
- Ensure every icon-only button/link has a proper `aria-label` and visible focus style.

## PHASE 3 — CORE NAV + LAYOUT (REQUIRED)
Transform these first in every app:

### 1) Sidebar / Left menu
- White background, subtle gray borders (use variables).
- Resize handle with Ping blue hover effects.
- Spacing in `1rem` units using spacing vars.
- Interactions use `--ping-transition-fast` (0.15s ease-in-out).

### 2) Navbar / Top navigation
- Migrate all navbar icons to MDI.
- Use a professional Ping-style blue gradient background (or app-approved Ping blue treatment).
- Add appropriate shadow/depth.
- Consistent hover states, transitions, and accessible ARIA.

### 3) Main layout foundation
- Ensure all routes inherit Ping UI via `.end-user-nano`.
- Normalize spacing, border radius, hover/focus across page containers/cards/forms.

## PHASE 4 — FORM / PAGE SURFACE STANDARDIZATION (REQUIRED)
For key pages (login/registration/MFA/errors/success, settings, etc.):
- Standardize:
  - Buttons: primary/secondary hierarchy, consistent radius, hover/focus
  - Inputs: consistent border, padding, label+help text, error message association
  - Cards/panels: consistent borders, shadows, spacing
  - Lists/nav: consistent selection/active states
- Replace bespoke CSS with variable-driven, scoped styles.
- Delete dead CSS, unused imports, and duplicated style blocks.

## ACCESSIBILITY QUALITY GATES (REQUIRED)
- Icon-only controls: `aria-label` present.
- Keyboard navigation: no traps; tab order sensible.
- Focus states: visible and consistent (blue outline + shadow).
- Validation: errors associated with inputs (`aria-describedby` / `id` + `for`).
- Avoid layout shift when showing errors (reserve space or consistent container behavior).

## PERFORMANCE REQUIREMENTS (REQUIRED)
- Reduce bundle size:
  - Prefer CSS icons over JS icon libraries.
  - Remove unused icon dependencies and re-run build.
- Keep transitions CSS-based (0.15s ease-in-out); avoid heavy JS animations.

## LINT / CODE QUALITY REQUIREMENTS (REQUIRED)
While upgrading the UI, you must also keep the codebase clean and **fix lint issues** as part of the work.

### Discovery + baseline
- Identify lint tooling and commands from `package.json` / repo scripts (e.g., `npm run lint`, `yarn lint`, `pnpm lint`).
- Run lint **before** starting and capture a brief baseline:
  - count of errors vs warnings (if available)
  - a short list of the top offending files/areas

### During implementation
- Fix lint errors in any files you touch while doing UI work (unused imports/vars, TypeScript issues, React hooks deps, etc.).
- Prefer safe, low-risk fixes:
  - remove unused imports/vars
  - correct obvious TypeScript types
  - address hooks dependency arrays only when clearly correct
  - format only where required by lint rules (do not reformat the entire repo)
- If supported, run the auto-fixer in scope:
  - `eslint --fix` (or equivalent) on **only the changed files** or relevant folders.
- Do not introduce new lint errors.

### Exit criteria
- Run lint at the end.
- Expected: **0 lint errors** (warnings acceptable only if they already existed and are not increased; prefer reducing them).
- If lint still fails due to unrelated legacy areas, document:
  - what remains, why it’s out of scope, and minimal follow-up steps.

## OUTPUT REQUIREMENTS (WHAT YOU MUST REPORT)
At the end of the change set, provide:
1) List of modified files (and new files).
2) A concise “before vs after” summary for:
   - Sidebar
   - Navbar
   - Main content / namespace inheritance
3) Verification checklist with PASS/FAIL:
   - MDI icons everywhere in nav surfaces
   - `.end-user-nano` applied at root (all routes inherit)
   - Transitions standardized (0.15s)
   - Colors/spacing/radius via variables
   - ARIA labels for icon buttons
   - Tests/build passing
   - Lint passing (0 errors)
4) Follow-up items (if any) as a prioritized list.

## IMPLEMENTATION STYLE
- Make incremental, safe changes.
- Prefer refactoring patterns that can be propagated across pages.
- Avoid increasing CSS specificity; scope under `.end-user-nano` instead.
- Keep the overrides file small and well commented.
