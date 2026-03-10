# Complete Icon List for IcoMoon Font Generation

**Total Icons Needed:** 34

This list includes all icons currently used in the OAuth Playground application, discovered by scanning the codebase.

---

## Icons Currently Defined in CSS (22 icons)

These are already in `/Users/cmuir/P1Import-apps/oauth-playground/src/styles/icons.css`:

```
ea01  account-key-outline
ea02  alert
ea03  alert-circle
ea04  alert-decagram
ea05  auto-fix
ea06  book-open-page-variant
ea07  cellphone
ea08  cellphone-key
ea09  check-circle          ← CRITICAL: Fixes "ea09" bug
ea0a  chevron-down
ea0b  chevron-up
ea0c  code-braces
ea0d  comment-text-outline
ea0e  email-outline
ea0f  eye-off-outline
ea10  eye-outline
ea11  face-agent
ea12  fingerprint
ea13  flag
ea14  phone-outline
ea15  puzzle-outline
ea16  usb-flash-drive
```

---

## Additional Icons Found in Code (12 icons)

These are used in React components but not yet defined in icons.css:

### High Priority (Dashboard & Core UI)
```
ea17  server               ← Used in Dashboard.tsx, CustomDomainTestPage.tsx
ea18  chart-box            ← Used in Dashboard.tsx
ea19  chart-line           ← Used in Dashboard.tsx (appears 2x)
ea1a  cog                  ← Used in Dashboard.tsx, CustomDomainTestPage.tsx
ea1b  refresh              ← Used in Dashboard.tsx (with spin animation)
ea1c  content-save         ← Used in Dashboard.tsx save button
ea1d  lightning-bolt       ← Used in Dashboard.tsx
ea1e  link                 ← Used in Dashboard.tsx, CustomDomainTestPage.tsx
ea1f  open-in-new          ← Used in Dashboard.tsx (external links)
```

### Medium Priority (Sidebar & Navigation)
```
ea20  drag                 ← Used in SidebarMenuPing.tsx (2 instances)
ea21  settings             ← Used in CustomDomainTestPage.tsx
ea22  info                 ← Used in docs/specs (may be needed)
```

---

## Complete List for IcoMoon (34 icons)

Copy and paste this into IcoMoon search:

```
account-key-outline
alert
alert-circle
alert-decagram
auto-fix
book-open-page-variant
cellphone
cellphone-key
chart-box
chart-line
check-circle
chevron-down
chevron-up
code-braces
cog
comment-text-outline
content-save
drag
email-outline
eye-off-outline
eye-outline
face-agent
fingerprint
flag
info
lightning-bolt
link
open-in-new
phone-outline
puzzle-outline
refresh
server
settings
usb-flash-drive
```

---

## Priority Levels

### Must Have (Fixes Current Bugs)
- ✅ check-circle (ea09) - **CRITICAL**: Fixes "ea09" text showing on Dashboard

### High Priority (Used on Dashboard)
- server, chart-box, chart-line, cog, refresh, content-save, lightning-bolt, link, open-in-new

### Medium Priority (Used in Navigation/Subpages)
- drag, settings, chevron-down, chevron-up

### Standard Set (Already Defined)
- All other icons from the original 22

---

## IcoMoon Unicode Mapping

Use these Unicode values when setting character codes in IcoMoon:

| Icon | Unicode | Usage |
|------|---------|-------|
| account-key-outline | ea01 | |
| alert | ea02 | |
| alert-circle | ea03 | Dashboard errors |
| alert-decagram | ea04 | |
| auto-fix | ea05 | |
| book-open-page-variant | ea06 | |
| cellphone | ea07 | |
| cellphone-key | ea08 | |
| **check-circle** | **ea09** | **Dashboard status (CRITICAL)** |
| chevron-down | ea0a | Sidebar collapse |
| chevron-up | ea0b | |
| code-braces | ea0c | |
| comment-text-outline | ea0d | |
| email-outline | ea0e | |
| eye-off-outline | ea0f | Password visibility |
| eye-outline | ea10 | Password visibility |
| face-agent | ea11 | |
| fingerprint | ea12 | |
| flag | ea13 | |
| phone-outline | ea14 | |
| puzzle-outline | ea15 | |
| usb-flash-drive | ea16 | |
| **server** | **ea17** | **Dashboard API status** |
| **chart-box** | **ea18** | **Dashboard metrics** |
| **chart-line** | **ea19** | **Dashboard analytics** |
| **cog** | **ea1a** | **Dashboard config** |
| **refresh** | **ea1b** | **Dashboard refresh button** |
| **content-save** | **ea1c** | **Dashboard save** |
| **lightning-bolt** | **ea1d** | **Dashboard quick actions** |
| **link** | **ea1e** | **Dashboard links** |
| **open-in-new** | **ea1f** | **External links** |
| drag | ea20 | Sidebar reorder |
| settings | ea21 | Settings pages |
| info | ea22 | Info tooltips |

---

## After Adding Icons to icons.css

You'll need to update `/Users/cmuir/P1Import-apps/oauth-playground/src/styles/icons.css` to include the new icons:

```css
/* Add these after .mdi-usb-flash-drive::before */

.mdi-server::before {
  content: "ea17";
}

.mdi-chart-box::before {
  content: "ea18";
}

.mdi-chart-line::before {
  content: "ea19";
}

.mdi-cog::before {
  content: "ea1a";
}

.mdi-refresh::before {
  content: "ea1b";
}

.mdi-content-save::before {
  content: "ea1c";
}

.mdi-lightning-bolt::before {
  content: "ea1d";
}

.mdi-link::before {
  content: "ea1e";
}

.mdi-open-in-new::before {
  content: "ea1f";
}

.mdi-drag::before {
  content: "ea20";
}

.mdi-settings::before {
  content: "ea21";
}

.mdi-info::before {
  content: "ea22";
}
```

---

## File Size Estimate

- **22 icons (original):** ~10-15 KB total (all 5 formats)
- **34 icons (complete):** ~15-20 KB total (all 5 formats)

Still very lightweight compared to full MDI font (~600KB).

---

**Next Step:** Use this complete list when generating your IcoMoon font to ensure all icons work throughout the app.
