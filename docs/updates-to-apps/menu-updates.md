# Menu (Sidebar) Updates — Current State & Recovery

Summary of the left-hand menu and sidebar so we can restore behavior after a regression.

---

## Change Log

### 2026-02-27: Enhanced Resize Handle UX

**Changes:**
- Widened resize handle from 4px to 8px for easier grabbing
- Changed cursor from `ew-resize` to `col-resize` (standard)
- Added hover effect: blue translucent background
- Added visual indicator line (2px) that turns blue on hover
- Improved z-index layering for better usability
- Made min/max width configurable via props (supports Ping vs legacy menu)

**Files Modified:**
- `src/components/Sidebar.tsx` - ResizeHandle styling, SidebarContainer min/max props
- Uses `SIDEBAR_PING_MIN_WIDTH` (220px) and `SIDEBAR_PING_MAX_WIDTH` (500px) from config

---

## Current implementation

- **Config**: `src/config/sidebarMenuConfig.ts` — `USE_PING_MENU = true`, `SIDEBAR_MENU_GROUPS`, `SIDEBAR_PING_WIDTH` (260), `SIDEBAR_PING_MIN_WIDTH` (220), `SIDEBAR_PING_MAX_WIDTH` (500).
- **Sidebar shell**: `src/components/Sidebar.tsx` — When `USE_PING_MENU`, renders `SidebarMenuPing`; shows **resize handle** (sidebar width 220–500px, stored in `localStorage` key `sidebar.width`); shows **Reorder** (drag mode) toggle; passes `dragMode` to `SidebarMenuPing`.
- **Ping menu**: `src/components/SidebarMenuPing.tsx` — Reads `SIDEBAR_MENU_GROUPS`; restores order from `localStorage` key `sidebarPing.menuOrder` (version `sidebarPing.menuVersion`); when `dragMode` true, groups and items are draggable; reorder is saved automatically.
- **Theme**: `src/styles/sidebar-ping-theme.css` — Light grey background, blue active state with left bar, no fixed width (resizable via Sidebar state); drag handles, drop zones, chevron rotation on group header `aria-expanded`.
- **Layout**: `src/App.tsx`, `src/components/Navbar.tsx` — Read `sidebar.width` from localStorage (when `USE_PING_MENU`, clamp 220–500); use that for main content offset and navbar `left`.

## Features

1. **Ping UI menu**: Icon + text, blue active state, collapsible groups with chevrons, text no-wrap.
2. **Resizable**: Sidebar width 220–500px; persisted in `sidebar.width`.
3. **Drag-and-drop**: "Reorder" toggle in header; reorder groups (drop zones between sections) and items within a group; order in `sidebarPing.menuOrder`.
4. **Rollback**: Set `USE_PING_MENU = false` in `sidebarMenuConfig.ts` to use legacy `DragDropSidebar`.

## Detailed plans (in this folder)

- [MENU_PING_UI_PLAN.md](./MENU_PING_UI_PLAN.md) — Reference design, phases, file checklist, global header/text consistency (Ping red headers, almost black body text).
- [MENU_GROUPING_PROPOSAL.md](./MENU_GROUPING_PROPOSAL.md) — Group structure and item list; source for `SIDEBAR_MENU_GROUPS`.

## Key files to restore

| File | Purpose |
|------|--------|
| `src/config/sidebarMenuConfig.ts` | Menu groups, Ping width constants, `USE_PING_MENU` |
| `src/components/Sidebar.tsx` | Resize, drag toggle, render SidebarMenuPing vs DragDropSidebar |
| `src/components/SidebarMenuPing.tsx` | Ping menu UI, drag/drop, localStorage order |
| `src/styles/sidebar-ping-theme.css` | Ping theme, drag handles, drop zones |
| `src/App.tsx` | Main content width from localStorage when Ping |
| `src/components/Navbar.tsx` | Navbar `left` from localStorage when Ping |
