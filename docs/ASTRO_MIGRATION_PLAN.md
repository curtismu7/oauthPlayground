# Astro (Ping Identity Design System) Migration Plan

This document outlines the plan to migrate the OAuth Playground to **Astro** (`@pingux/astro`), Ping Identity’s React component library and design system.

## References

- **Design system:** https://www.pingidentity.design  
- **Storybook (component docs):** https://storybook.pingidentity.design  
- **NPM package:** `@pingux/astro` (https://www.npmjs.com/package/@pingux/astro)  
- **Requirements:** Node 20+, React 16.8+

---

## Prerequisites: Package access

`@pingux/astro` depends on **`@pingux/onyx-tokens`**, which is not on the public npm registry. To install Astro you need one of:

1. **Ping Identity private npm registry**  
   Configure `.npmrc` (or your package manager’s registry config) so that `@pingux/*` packages resolve to the correct registry, then run:

   ```bash
   pnpm add @pingux/astro
   ```

2. **Internal artifact / mirror**  
   If your org mirrors or re-publishes `@pingux/astro` and `@pingux/onyx-tokens` elsewhere, point the resolver there and install as above.

Until these packages are available in your environment, the app continues to run without the **Astro component library** (no AstroProvider, Button, Modal, etc.). Icons are **not** blocked — see [Icons (unblocked)](#icons-unblocked) below.

---

## Icons (unblocked)

**Ping Icons** are available without the private registry:

- **CDN:** `https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css` — already linked in `index.html`. The app uses the shared **`PingIcon`** component (`src/components/PingIcon.tsx`) to render `.mdi` / `.mdi-*` classes from this stylesheet on AI & Identity and Ping UI pages.
- **Local copy (optional):** To avoid CDN dependency (e.g. offline or air-gapped), download the same URL and add a file under `src/styles/vendor/` (e.g. `astro-nano-icons.css`), then link that in `index.html` instead of the CDN. Keep a comment at the top with the source URL and version.

So **Phase 3 (icons)** does not require `@pingux/astro` or registry access. The full Astro migration (Phases 1, 2, 4, 5) remains blocked only by the need to install `@pingux/astro` and `@pingux/onyx-tokens`.

---

## Phase 1: Add Astro and wrap the app

**Goal:** Install Astro and enable its theming/context without changing existing UI.

**Already in the repo:**

- **`.npmrc.example`** — Template for the `@pingux` scope registry. Copy to `.npmrc` and set your registry URL (and token if required). Without it, `pnpm add @pingux/astro` fails (404 on `@pingux/onyx-tokens`).

**Steps for you (when you have registry access):**

1. **Configure registry:** Copy `.npmrc.example` to `.npmrc` and set your Ping/org registry URL for the `@pingux` scope.
2. **Install Astro:** `pnpm add @pingux/astro`
3. **Wrap app with AstroProvider:** In `src/main.tsx`, add `import { AstroProvider } from '@pingux/astro';` and wrap the root so the tree is `<AstroProvider><BrowserRouter>...</BrowserRouter></AstroProvider>`.
4. **Smoke test:** Start the app; confirm no regressions.

Until then, the app runs without Astro (no dependency, no provider in `main.tsx`) so the dev server and build succeed.

---

## Phase 2: Theming and style coexistence

**Current stack:** styled-components `ThemeProvider` + `GlobalStyle`, Bootstrap-based and custom CSS.  
**Astro stack:** ThemeUI / Emotion, `@pingux/onyx-tokens`.

- **Strategy:** Run both systems in parallel. Keep existing `ThemeProvider` and global styles; add Astro’s theme via `AstroProvider`. New or migrated components can use Astro’s theme tokens; existing components stay on current styles until migrated.
- **Optional:** Align a few key values (e.g. primary red, spacing) with Astro tokens in `src/styles/global.ts` so new Astro components feel consistent with current flow headers and buttons.
- **Doc:** See Astro docs for theming (e.g. custom themes, AstroNanoTheme) and any ThemeUI/Emotion usage so we don’t conflict with styled-components.

---

## Phase 3: Icons migration

**Already in place (no registry needed):** The app uses **Ping Icons** from `https://assets.pingone.com/ux/astro-nano/0.1.0-alpha.11/icons.css` and the **`PingIcon`** component for AI & Identity and Ping UI pages. This matches the Astro Nano icon set (`.mdi` / `.mdi-*` classes) without requiring `@pingux/astro`.

**Optional — local icons file:** To avoid the CDN, add a local copy (e.g. `src/styles/vendor/astro-nano-icons.css`) and link it in `index.html` instead of the CDN URL.

**Remaining (when/if full Astro is installed):**

- **Current elsewhere:** Feather Icons via `react-icons/fi` in `src/icons/index.ts` and other pages.
- **Strategy:** When touching a file, prefer `PingIcon` with the astro-nano icon name (or the CDN/local icons.css class). For new components after Astro is installed, use Astro’s IconButton or `@pingux/mdi-react` per Astro docs.
- **End state:** Broader use of PingIcon / astro-nano icons across the app; deprecate or narrow `react-icons/fi` where possible.

---

## Phase 4: Component migration

**Goal:** Replace custom or third-party UI with Astro components where it adds value (consistency, a11y, maintenance).

**Suggested order:**

1. **Buttons**  
   Use Astro `Button` (and variants) for primary actions. Map current `MOCK_PRIMARY_BTN` / `MOCK_SECONDARY_BTN` and flow header buttons to Astro button props.

2. **Form controls**  
   Use Astro text fields, checkboxes, selects where forms are updated (e.g. Configuration, Client Generator, flow credential forms). Ensures labels, validation, and a11y match the design system.

3. **Modals / dialogs**  
   Use Astro modal/dialog components for Worker Token modal, confirmation dialogs, and other overlays. Align focus handling and escape behavior with Astro.

4. **Navigation**  
   Evaluate Astro nav/sidebar components for the app shell (Sidebar, Navbar). May require layout changes; do after core flows and modals are stable.

5. **Data display**  
   Use Astro table, list, or card components where we show token tables, flow results, or app lists.

**Per component:**

- Check Storybook for the Astro component API and props.
- Replace one component (or one route) at a time; run regression (e.g. `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`) for that area.
- Preserve behavior (e.g. Worker Token modal still uses `unifiedWorkerTokenService`; do-not-break areas in the regression plan stay intact).

---

## Phase 5: Cleanup and deprecation

- **Icons:** If migration is complete, remove or narrow `src/icons` (e.g. only re-export Astro/MDI where needed) and update or retire `icons:check` / `icons:fix`.
- **Styles:** Remove duplicate global styles that are fully replaced by Astro (e.g. button or form styles). Keep any app-specific overrides.
- **Dependencies:** Consider removing `react-icons` if unused; keep Bootstrap only if still required by legacy or vendor CSS.

---

## Regression and do-not-break

When changing UI for Astro:

- **Worker token & credentials:** Token button, WorkerTokenModalV9, unifiedWorkerTokenService behavior must remain as documented in `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`.
- **Sidebar / Navbar:** z-index and overlay behavior (e.g. floating log viewer) must not regress (Section 7 do-not-break).
- **Mock flows:** Reset buttons, stepper, and flow-specific behavior must continue to work after component swaps.
- **Discovery / logging:** Use `logger.info` (not `logger.discovery`) in discovery paths per regression plan.

Run the relevant checklist in Section 4 of the regression plan after each phase or large UI change.

---

## Summary

| Phase | Focus                         | Blocker / note                                                                 |
|-------|-------------------------------|--------------------------------------------------------------------------------|
| 0     | Registry access               | Only for full Astro component library (`@pingux/onyx-tokens` private).       |
| —     | **Icons**                     | **Unblocked.** Ping Icons via CDN (astro-nano/icons.css) + `PingIcon`; optional local copy. |
| 1     | Add Astro, AstroProvider      | Requires registry; install + wrap in main.tsx.                                |
| 2     | Theming coexistence           | Optional token alignment.                                                    |
| 3     | Icons (Fi → PingIcon / MDI)   | Partially done (PingIcon on AI/Identity pages); expand incrementally.        |
| 4     | Components (buttons, forms…)  | Per-component; requires Astro install; follow Storybook.                     |
| 5     | Cleanup (icons, styles, deps) | After migration is stable.                                                    |

Last updated: 2026-03.
