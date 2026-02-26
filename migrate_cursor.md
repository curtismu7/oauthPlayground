# migrate.md — Cursor Execution Mode (OAuth Playground / Vite + React)
## End-User Nano (Bootstrap-based) + Astro Nano Icons (mdi subset)

This document is written as **explicit, executable steps** for Cursor. Follow in order. Each step should be a small PR where possible.

---

# Ground rules (do not skip)
- Keep changes **incremental** and **reversible**.
- Do **one app** at a time (this repo only).
- Do not refactor UI broadly in the same PR as foundational CSS imports.
- Validate after each step with smoke tests + minimal visual checks.

---

# PR 1 — Add icon fonts + wire up CSS imports

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
import "https://assets.pingone.com/ux/end-user-nano/0.1.0-alpha.11/end-user-nano.css";
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

# PR 2 — Update PWA caching patterns for font formats

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

# PR 3 — Add a standard React Icon component (mdi-based)

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

# PR 4 — Reduce GlobalStyle collisions with Nano

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

```
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

# PR 5+ — Page-by-page conversion (Bootstrap/Nano classes)

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

# Menu — Ping UI (left sidebar)

Plan to align the left-hand navigation with the Ping-style reference: fixed narrow sidebar, light grey background, icon + text items, blue active state with left accent bar, collapsible sections with chevrons.

**See:** `docs/MENU_PING_UI_PLAN.md` for full steps (theme CSS, new `SidebarMenuPing` or V2 menu component, layout/App/Navbar width, no changes to locked `DragDropSidebar.tsx`).

**Ping UI consistency (all pages):** Same doc, Phase 5 — use **light red headers + white text** on every page (no blue/grey headers); use **almost black** body text (`#111827` / `#1f2937`) instead of grey/muted everywhere.

---

# SMOKE TEST CHECKLIST (run after every PR)

## Build/Run
- `npm run dev` loads without console errors
- `npm run build` succeeds

## UI sanity
- Headings not huge/squashed
- Lists indent normally
- Buttons clickable and styled
- Forms readable and aligned

## Icons
- Icons render correctly
- Fonts requested successfully (200)
- No missing glyph boxes

## A11y
- Tab order reasonable
- Focus visible
- Icon-only buttons have `aria-label`

---

# Notes (do not forget)
- `vite.config.ts` does NOT set `base`, so deployment is assumed at `/`.
- If deployment ever moves to a subpath, revisit font URLs and base path.
- Keep `nano-overrides.css` minimal; prefer component-level classes over global overrides.

