# Design System Standard + Pilot Rollout — Design

Promote the look-and-feel of the `/v2/use-cases` page — navy (`#1e3a8a`) +
electric-teal (`#14b8a6`) accent, IBM Plex Mono for accents, clean card/chip
layout on a centered column — into a **shared, documented design system** that
any page can adopt, then restyle four high-traffic pilot pages with it. This
proves the standard on real pages without a risky big-bang migration of the
~400 files in the app.

## Context: two coexisting design systems

The app currently has two visual foundations:

- **Legacy app-wide theme** — `src/styles/global.ts` exports `theme` +
  `GlobalStyle`, wired through a styled-components `ThemeProvider` in
  `src/main.tsx`. ~400 older files (`src/components/`, `src/pages/`, `src/v8/`)
  depend on it.
- **flows2 `tokens`** — `src/flows2/framework/tokens.ts` + `primitives.tsx`,
  the newer navy/teal/IBM-Plex-Mono system the Use Cases page uses. Only ~19
  files import it today.

"Make it the standard" = promote the flows2 look so pages can adopt it
app-wide. The legacy theme is **not** removed; the two coexist and pages
migrate opt-in, one at a time.

## Goal / success criteria

- A neutral `src/design/` module exports the codified standard: tokens,
  primitives, a page shell, and a documented typography recipe.
- `src/flows2/framework/` re-exports from `src/design/` so the 19 existing
  flows2 files keep working with **zero** behavior or visual change.
- A dev-facing style-guide page at `/design` renders every token, primitive,
  and the page shell with live examples — the standard is visible and
  reviewable.
- Four pilot pages (`/dashboard`, `/configuration`, `/documentation`,
  `/flows`) are restyled to match the Use Cases look, each a **visual-only**
  change (no behavior, routing, or data changes).
- Build succeeds, type-check ratchet holds, and each restyled page visually
  matches the Use Cases reference (verified by browser screenshot).

## Non-goals

- Removing or replacing the legacy `ThemeProvider` / `src/styles/global.ts`.
- Restyling any of the other ~395 files. Those migrate later, page by page,
  once the system is proven.
- Any change to page behavior, routes, data fetching, or component logic.
- Dark mode or theming beyond the single Use Cases light palette (the source
  page is light-only; matching it is the bar).

## The typography recipe (explicit)

The Use Cases page uses **system sans for body text** and **IBM Plex Mono for
accents** — numeric badges (the theme-order numbers), labels/eyebrows, and
action buttons. Mono is the *signature accent*, not the body font. The design
system codifies exactly this: `typography.ts` documents the body stack, the
mono stack (`'IBM Plex Mono', monospace`), and which elements use which. Pages
adopting the standard follow this split; they do not set mono as body text.

## Architecture

Neutral shared module, adopted opt-in, legacy theme untouched.

```
src/design/                     ← new, neutral home for the standard
  tokens.ts                     ← moved from flows2/framework/tokens.ts
  primitives.tsx                ← Pill, Action, Note, Card, Grid (promoted)
  typography.ts                 ← body vs mono stacks + usage rules
  PageShell.tsx                 ← the Use Cases page frame
  index.ts                      ← barrel export
  __tests__/

src/flows2/framework/
  tokens.ts                     ← becomes: export * from '../../design/tokens'
  primitives.tsx                ← becomes: re-export from '../../design/primitives'

src/pages/design/
  DesignSystemPage.tsx          ← the /design style guide (dev-facing)
```

### `src/design/tokens.ts`

Physically move the current `flows2/framework/tokens.ts` here unchanged (same
`tokens` object: color/space/radius). It is already the single source of truth
the Use Cases page uses. `flows2/framework/tokens.ts` becomes a one-line
re-export so every existing importer resolves to the same object.

### `src/design/primitives.tsx`

Promote the flows2 primitives (`Toggle`, `Pill`, `Action`, `Note`, `Grid`)
plus a generalized `Card` (extracted from the inline `Card` styled-component in
`UseCasesPage.tsx`). Keep the exact styling — these are what make a page read as
"Use Cases." `flows2/framework/primitives.tsx` re-exports them.

### `src/design/PageShell.tsx`

The page frame from `UseCasesPage.tsx`, extracted and generalized:

```tsx
export interface PageShellProps {
  title: string;         // navy H1 (PageTitle)
  intro?: React.ReactNode; // the muted intro paragraph under the title
  children: React.ReactNode;
}
export const PageShell: React.FC<PageShellProps>;
// Also export the section building blocks the Use Cases page uses:
export const Section: StyledComponent;     // themed section wrapper
export const SectionHead: StyledComponent;  // order-badge + heading row
```

`PageShell` renders the centered `max-width` column, the navy `PageTitle`, the
muted intro, and slots `children`. A page adopts the standard by rendering
`<PageShell title=… intro=…>` and composing `Section`/`Card`/`primitives`
inside.

### `src/design/typography.ts`

```ts
export const fonts = {
  body: "…system sans stack…",         // matches current app body
  mono: "'IBM Plex Mono', monospace",  // signature accent
} as const;
// Documented usage: mono for numeric badges, eyebrows/labels, action buttons.
```

### `src/design/index.ts`

Barrel re-exporting tokens, primitives, typography, PageShell so consumers
`import { PageShell, Card, tokens } from 'src/design'`.

### `/design` style guide — `src/pages/design/DesignSystemPage.tsx`

A dev-facing page (lazy route `/design`, added to `App.tsx` and, optionally, a
"Design System" nav entry under a developer group) that renders:
- the full color palette (each token swatch + name/hex),
- the spacing and radius scales,
- every primitive (`Pill` active/inactive, `Action`, `Note`, `Card`, `Grid`),
- a `PageShell` example with a `Section` and cards,
- the typography recipe (body vs mono samples).

This is the visual contract: it proves the system renders correctly before any
real page changes, and is the reference each pilot page is screenshot-checked
against.

## Data flow / behavior

None. This is a presentational system. `PageShell` and primitives take props
and render markup; there is no state, storage, network, or routing logic in
`src/design/`. The style-guide page is static. Pilot-page migrations swap
styling only — existing handlers, state, and data flow are preserved verbatim.

## Error handling

- Extraction is behavior-preserving: the re-export shims mean any importer that
  worked before resolves to the identical object/component. A unit test asserts
  `flows2/framework/tokens` and `src/design/tokens` export the same `tokens`
  reference.
- Pilot pages: because changes are visual-only, the risk surface is CSS/markup.
  Each phase is verified by `vite build` (catches broken imports/JSX),
  `type-check-ratchet` (catches type regressions), and a browser screenshot of
  the page compared to the Use Cases reference.

## Testing / verification

- **Foundation unit tests** (`src/design/__tests__/`):
  - `tokens` re-export identity: `flows2/framework/tokens.tokens ===
    design/tokens.tokens`.
  - `PageShell` renders its `title` as an `<h1>` and its `intro`, and renders
    `children`.
  - primitives render (smoke): `Pill`, `Action`, `Card` mount without error.
- **Per phase**: `npx vite build` succeeds; `node scripts/type-check-ratchet.mjs`
  holds baseline; manual browser check of the affected page (screenshot vs the
  `/v2/use-cases` reference and the `/design` style guide).
- **Regression guard for the extraction**: run the existing flows2 tests
  (`npx vitest run src/flows2`) after phase 1 to confirm the re-export shims
  didn't break any flow.

## Pilot rollout — phases (each independently shippable)

Exact pilot page files (verified present):
- `/dashboard` → `src/pages/Dashboard.tsx`
- `/configuration` → `src/pages/Configuration.tsx`
- `/documentation` → `src/pages/Documentation.tsx`
- `/flows` → `src/pages/OAuthFlowsNew.tsx`

1. **Foundation** — create `src/design/` (move tokens; promote primitives;
   build `PageShell` + `typography`; barrel `index.ts`); add re-export shims in
   `flows2/framework/`; build the `/design` style-guide page + route. No
   user-facing page changes. Verify: unit tests, flows2 regression tests,
   build, type-check. *Ship.*
2. **Dashboard** — wrap `Dashboard.tsx` in `PageShell`; replace ad-hoc
   containers/headings/buttons with tokens + primitives. Visual-only. *Ship.*
3. **Configuration / Setup** — same treatment for `Configuration.tsx`; the
   credential forms adopt `Card` / `Grid` / `Action` / `FieldGroup`. *Ship.*
4. **Documentation & Reference** — `Documentation.tsx`; `PageShell` +
   `typography` carry the text-heavy layout; long-form sections use `Section`
   and `Note`. *Ship.*
5. **Flow index / landing** — `OAuthFlowsNew.tsx`; restyle to the Use Cases
   chip/card language (themed sections of flow cards). *Ship.*

## Scope guards

- **Foundation + 4 pilot pages only.** The other ~395 files are out of scope.
- **Visual-only page changes.** No behavior/routing/data edits in any phase.
- **Legacy theme stays.** No changes to `src/styles/global.ts` or the global
  `ThemeProvider`.
- **Back-compat via re-exports.** Moving tokens/primitives must not change any
  existing import's resolved value; the re-export shims and the identity test
  enforce this.
- **Match, don't redesign.** The bar is "looks like the Use Cases page," not a
  new visual direction. Light palette only.
