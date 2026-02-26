# Plan: Menu and Layout — Ping UI Reference

This plan describes how to change the app’s left-hand menu and layout to match the reference design: fixed narrow sidebar, light grey background, icon + text items, blue active state with a left accent bar, and collapsible sections with chevrons.

---

## Reference design (target)

- **Sidebar**
  - Fixed-width left sidebar (~15–20% of viewport, e.g. 240–280px).
  - Background: very light grey / off-white (e.g. `#f5f5f5` or `#f8f9fa`), distinct from white main content.
  - No resize handle in the reference; fixed width is acceptable for this theme.

- **Menu items**
  - Each item: **icon** (left) + **text**.
  - **Text must not wrap by default** — use `white-space: nowrap` (or equivalent) so labels stay on one line; overflow can be hidden or show ellipsis if needed.
  - Icons: simple, monochromatic (dark grey/black).
  - Inactive: dark grey text (e.g. `#374151`).
  - **Active item:**
    - Solid blue background (e.g. `#007BFF` or `#2563eb`).
    - White text and icon.
    - **Vertical accent bar** on the **left edge** of the item, darker blue (e.g. `#0056b3`), ~3–4px.

- **Collapsible sections**
  - Sections that expand/collapse show a **chevron** (e.g. down when closed, up when open) on the **right** of the label.
  - Chevron colour: dark grey, consistent with inactive text.

- **Main content**
  - Pure white background, clear separation from the light grey sidebar.

- **Top bar (Navbar)**
  - Reference shows Ping Identity branding; our Navbar can stay as-is or be adjusted to match (logo, height, colour) in a later step.

---

## Current implementation

| Piece | Location | Notes |
|-------|----------|--------|
| **Sidebar shell** | `src/components/Sidebar.tsx` | Width 300–600px (resizable), white bg, border. Contains header (title, search, drag toggle), then `DragDropSidebar`, footer. |
| **Menu content** | `src/components/DragDropSidebar.tsx` | **LOCKED** — do not edit. Defines groups, items, nested sub-groups. Uses `react-icons/fi`, inline styles. Active state: amber/yellow (`#fef3c7` / `#d97706`), no left bar. |
| **Layout** | `src/App.tsx` | `AppContainer` > `Navbar`, `Sidebar`, `ContentColumn` > `MainContent`. Navbar `left` shifts by `sidebarWidth` when sidebar is open. |
| **Navbar** | `src/components/Navbar.tsx` | Fixed top bar, theme primary colour, logo, menu toggle, etc. |

---

## Approach

Because `DragDropSidebar.tsx` is locked, we have two paths:

- **Option A (recommended): New V2 menu component**  
  Create a new menu component (e.g. `SidebarMenuPing.tsx` or `DragDropSidebar.V2.tsx`) that reproduces the same route structure (or reads from a shared config) and renders with the reference styling. The existing `Sidebar.tsx` can be updated to use this new menu and the new theme (width, background). No changes to the locked file.

- **Option B: Theme overlay**  
  Add a CSS-only “Ping” theme that overrides the current sidebar and menu styles (e.g. `src/styles/sidebar-ping-theme.css`) targeting the existing DOM/classes. Works only if the current structure is stable and we don’t need to change markup (e.g. left bar requires a wrapper or pseudo-element).

The plan below assumes **Option A** for a reliable, maintainable result; Option B can be a follow-up or alternative if we want a quicker, CSS-only pass.

---

## Implementation steps

### Phase 1 — Sidebar shell and theme CSS

1. **Add `src/styles/sidebar-ping-theme.css`**
   - Sidebar container (when “Ping” theme is active):
     - Fixed width, e.g. `260px` (or a CSS variable `--sidebar-width: 260px`).
     - Background: `#f5f5f5` (or `#f8f9fa`).
     - Border-right: optional subtle `1px solid #e5e7eb`.
   - Ensure main content area stays white (no change if already correct).

2. **Update `src/components/Sidebar.tsx`**
   - Use a fixed width when “Ping” theme is active (no resize, or hide resize handle).
   - Apply a data attribute or class for the theme (e.g. `data-theme="ping"` or `className="sidebar sidebar--ping"`).
   - Import `sidebar-ping-theme.css` (or wrap theme classes so they only apply when this attribute/class is present).
   - Optionally: reduce or simplify header/footer (search, drag mode) for the Ping layout; keep close button if the sidebar can be closed.

3. **Layout in `App.tsx`**
   - Use the same fixed sidebar width (e.g. `260px`) for `MainContent` margin/padding and Navbar `left` when the Ping sidebar is active, so content and navbar align with the new width.

---

### Phase 2 — New menu component (Ping UI)

4. **Create `src/components/SidebarMenuPing.tsx` (or `DragDropSidebar.V2.tsx`)**
   - **Data:** Reuse the same groups/items structure as in `DragDropSidebar.tsx` (copy the menu tree into a shared config if desired, or duplicate for now).
   - **Structure:**
     - One list of top-level entries.
     - Each entry: icon + label; if it has children, add a chevron on the right and expand/collapse on click.
     - Nested items (when expanded): same icon+text style, indented (e.g. `padding-left: 1.5rem`).
  - **Styling (BEM or class names):**
    - `.sidebar-ping__item` — base item (flex, icon + text, padding); **text must not wrap** (`white-space: nowrap`; overflow hidden or ellipsis as needed).
    - `.sidebar-ping__item--active` — blue background, white text, **left border** (e.g. `border-left: 4px solid #0056b3`; background `#007BFF` or `#2563eb`).
     - `.sidebar-ping__item--inactive` — dark grey text, no left bar.
     - `.sidebar-ping__group` — optional wrapper for a collapsible block.
     - Chevron: right-aligned, dark grey; rotate when open/closed (e.g. `transform: rotate(-90deg)` when collapsed).
   - **Icons:** Use the existing `Icon` component (MDI) for consistency with Dashboard/PR 5; map current Fi* usage to MDI names (e.g. Dashboard → `chart-box`, Applications → `apps`, OAuth2 → `lock`, etc.).
   - **Routing:** Use `useLocation` / `useNavigate` (or `Link`) and highlight the current route as active (same path-matching logic as in `DragDropSidebar` if needed).
   - **Accessibility:** Focus states, `aria-expanded` for collapsible sections, `aria-current="page"` for the active link.

5. **Integrate into `Sidebar.tsx`**
   - When theme is “Ping”, render `SidebarMenuPing` instead of `DragDropSidebar`.
   - Keep search optional: either add a simple filter in `SidebarMenuPing` or hide search in Ping theme.

---

### Phase 3 — Colors and tokens

6. **Define tokens (optional but recommended)**
   - In `sidebar-ping-theme.css` or `global.ts`:
     - `--sidebar-ping-bg: #f5f5f5`
     - `--sidebar-ping-item-text: #374151`
     - `--sidebar-ping-active-bg: #007BFF` (or `#2563eb`)
     - `--sidebar-ping-active-text: #ffffff`
     - `--sidebar-ping-active-bar: #0056b3` (darker blue for left bar)
   - Use these in the new menu component and in any overlay styles so we can adjust later without touching components.

7. **Active state**
   - Ensure the active item has:
     - Background: `var(--sidebar-ping-active-bg)` (or token).
     - Color: `var(--sidebar-ping-active-text)`.
     - `border-left: 4px solid var(--sidebar-ping-active-bar)` (or equivalent class).

---

### Phase 4 — Navbar and polish

8. **Navbar**
   - Match sidebar width: when Ping sidebar is open, set Navbar `left` to the same fixed width (e.g. `260px`).
   - No other Navbar changes required unless we want to align the top bar visually with the reference (e.g. Ping logo, height). Can be a separate task.

9. **Responsive behavior**
   - Decide: on small screens, keep the current “slide-over” / “close” behavior, or match reference (e.g. collapse to a hamburger that opens the same sidebar over content). Document the choice.

10. **Smoke tests**
    - Sidebar and main content widths align; no horizontal scroll.
    - Active route is clearly indicated (blue + left bar).
    - Collapsible sections expand/collapse; chevron updates.
    - Keyboard and screen reader: focus order, aria attributes, visible focus ring.

---

### Phase 5 — Ping UI consistency (all pages)

Apply the same header and text treatment across every page so the app feels consistent.

11. **Section / page headers (same on every page)**
    - **All** section headers (e.g. collapsible headers, step headers, page titles) MUST use the **same color**: **Ping light red** background with **white text**.
    - Use the existing token: `#E4002B` (Ping red), or a CSS variable such as `--ping-header-bg: #E4002B` and `--ping-header-text: #ffffff`.
    - Apply to:
      - Dashboard section headers (already use `CollapsibleHeader` with `theme="ping"`).
      - Any flow or app page that shows a section title or step header — use the same red/white style (e.g. `CollapsibleHeader` with `theme="ping"` or a shared `.ping-page-header` class).
    - **Goal:** No page uses a different header colour (e.g. blue or grey); every page uses light red + white for headers.

12. **Body text (almost black, no muted grey)**
    - Where body or secondary text is currently **grey or muted** (e.g. `#6b7280`, `#666`, `#9ca3af`), change it to **almost black** for readability and consistency.
    - Use:
      - Primary text: `#111827` (or `--ping-text-primary: #111827`).
      - Secondary / supporting text: `#1f2937` (or `--ping-text-secondary: #1f2937`).
    - Apply in:
      - Page-level CSS (e.g. dashboard, flow pages, settings).
      - Shared components (cards, descriptions, labels).
      - Avoid leaving large blocks of text in light grey; reserve grey only for subtle hints if needed, and prefer dark grey/almost black everywhere else.
    - **Goal:** Same reading experience on every page — almost black text, no washed-out grey.

---

## File checklist

| Action | File / artifact |
|--------|------------------|
| Create | `src/styles/sidebar-ping-theme.css` |
| Create | `src/components/SidebarMenuPing.tsx` (or `DragDropSidebar.V2.tsx`) |
| Modify | `src/components/Sidebar.tsx` — theme flag, fixed width, optional header tweaks, render new menu when Ping |
| Modify | `src/App.tsx` — use fixed sidebar width for layout when Ping theme is on (or always if we fully switch) |
| Optional | Extract menu structure to e.g. `src/config/sidebarMenuConfig.ts` and consume from both old and new menu |
| Optional | `src/components/Navbar.tsx` — ensure `left` uses the same width when sidebar is Ping |

---

## Rollback

- Keep the existing `Sidebar` + `DragDropSidebar` path: use a feature flag or theme switch (e.g. `data-theme="default"` vs `data-theme="ping"`) so we can revert to the current menu without code changes.
- If we only add CSS and a new component, reverting is “don’t render SidebarMenuPing and don’t load sidebar-ping-theme.css”.

---

## Summary

1. Add **sidebar-ping-theme.css** for container width and background.
2. Update **Sidebar.tsx** to support a “Ping” theme (fixed width, new class, optional simpler header).
3. Create **SidebarMenuPing.tsx** (or V2) with icon+text items, blue active state + left bar, collapsible sections with chevrons, and **menu text no-wrap by default** (`white-space: nowrap`).
4. Use **Icon** (MDI) in the new menu; align layout and tokens with the reference.
5. Ensure **App** and **Navbar** use the same sidebar width when the Ping theme is active.
6. Add a way to switch theme (or default to Ping) and run smoke tests.
7. **Consistency (all pages):** Use **same header style everywhere** — **light red** (`#E4002B`) background with **white** text for every section/page header (e.g. via `CollapsibleHeader` theme `ping` or shared header class).
8. **Text colour (all pages):** Use **almost black** text (`#111827` / `#1f2937`) instead of grey or muted; apply across pages and shared components so no page has washed-out grey body text.

This keeps the locked `DragDropSidebar.tsx` unchanged and delivers the reference colour and menu layout via a new component and theme CSS.
