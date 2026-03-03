# migrate.md — OAuth Playground (Vite + React) Migration Plan
## End-User Nano + Astro Nano Icons

---

# OBJECTIVE

Incrementally migrate OAuth Playground to:

1. End-User Nano (Bootstrap-based CSS)
2. Astro Nano icon font (mdi subset)
3. Reduce styled-components layout reliance over time
4. Prevent regressions during transition
5. Keep changes PR-sized and reversible

This migration is foundation-first, then incremental UI refactors.

---

# PHASE 0 — FOUNDATION (CSS + ICON ASSETS)

## 0.1 Add Icon Font Files

Place font files inside:

public/icons/

Required files:
- materialdesignicons-subset.woff2
- materialdesignicons-subset.woff
- materialdesignicons-subset.ttf
- materialdesignicons-subset.eot
- materialdesignicons-subset.svg

These will be served at runtime from:

/icons/materialdesignicons-subset.*

---

## 0.2 Update src/styles/icons.css

Modify @font-face to use absolute root paths:

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

This ensures fonts resolve correctly in both dev and production builds.

---

## 0.3 Import CSS in src/main.tsx

At the very top of main.tsx:

```ts
import "./styles/vendor/end-user-nano.css";
import "./styles/icons.css";
import "./styles/nano-overrides.css"; // optional
```

Import order is critical:
1. Nano base
2. Icons
3. Local overrides

---

## 0.4 Verify Icon Rendering

Add temporary test render:

```tsx
<i className="mdi mdi-check-circle" aria-hidden="true" style={{ fontSize: 24 }} />
```

Validation:
- Network shows 200 for .woff2
- Icon renders (not empty square)

---

# PHASE 1 — PWA FONT CACHING UPDATE

Update both globPatterns locations:

Replace:

```js
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
```

With:

```js
globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}']
```

Apply in:
- workbox.globPatterns
- injectManifest.globPatterns

---

# PHASE 2 — ICON WRAPPER COMPONENT

Create:

src/components/Icon/Icon.tsx

```tsx
import * as React from "react";

type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeToEm = {
  xs: "0.75em",
  sm: "0.875em",
  md: "1em",
  lg: "1.25em",
  xl: "1.5em",
};

export type IconProps = {
  name: string;
  size?: IconSize;
  decorative?: boolean;
  label?: string;
  className?: string;
  as?: "i" | "span";
};

export function Icon({
  name,
  size = "md",
  decorative = true,
  label,
  className,
  as = "i",
  ...rest
}: IconProps) {
  const Comp = as;

  const classes = ["mdi", `mdi-${name}`, className]
    .filter(Boolean)
    .join(" ");

  const a11yProps = decorative
    ? { "aria-hidden": true }
    : { role: "img", "aria-label": label || "" };

  return (
    <Comp
      className={classes}
      {...a11yProps}
      {...rest}
      style={{
        display: "inline-block",
        lineHeight: 1,
        verticalAlign: "-0.125em",
        fontSize: sizeToEm[size],
      }}
    />
  );
}
```

Usage:

```tsx
<Icon name="check-circle" />
<Icon name="alert" decorative={false} label="Warning" />
```

---

# PHASE 3 — GLOBALSTYLE COLLISION FIXES

The current GlobalStyle conflicts with Bootstrap/Nano.

## Required Fixes

### Remove Universal Margin/Padding Reset

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

### Remove Hardcoded Heading Sizes

Delete:

```
h1 { font-size: ... }
h2 { font-size: ... }
...
```

Let Nano control typography scale.

### Remove Forced Form Font Size

Change:

```
button, input, select, textarea {
  font-family: inherit;
  font-size: 1rem;
}
```

To:

```
button, input, select, textarea {
  font-family: inherit;
}
```

### Consolidate Duplicate body Blocks

Merge multiple body definitions into one.

---

# PHASE 4 — OPTIONAL LEGACY TOGGLE

To support incremental rollout:

Use:

```
body.legacy { ... }
```

Scope aggressive legacy rules under `.legacy`.

Default behavior should favor Nano baseline.

---

# VALIDATION CHECKLIST

Visual:
- Layout intact
- Headings correct
- Lists properly indented
- Forms styled correctly
- Buttons render correctly

Functional:
- Routing works
- OAuth flows function
- No console errors

Icons:
- Fonts load (200)
- Icons align correctly

Accessibility:
- Focus states visible
- Icon-only buttons labeled
- Meaningful icons have aria-label

---

# PR BREAKDOWN

PR1 — Fonts + CSS imports  
PR2 — Workbox font patterns  
PR3 — Icon wrapper component  
PR4 — GlobalStyle cleanup  
PR5+ — Incremental component migration

---

END OF DOCUMENT
