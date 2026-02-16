# Master Prompts (Windsurf) — No Regression Workflows

## MFA (V8+ Unified)
```text
Unified MFA – NO-REGRESSION Fix Workflow (Windsurf)

Repo: /Users/cmuir/P1Import-apps/oauth-playground
Must follow:
- SWE-15: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_UNIFIED_MFA_GUIDE.md
- Inventory: /Users/cmuir/P1Import-apps/oauth-playground/UNIFIED_MFA_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add “defaults/fallbacks” that can reset flows/state unexpectedly

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed

If you cannot meet the above, do not proceed—explain what’s blocking (missing tests, missing gate, unclear state source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching “issue hotspot” in UNIFIED_MFA_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: ./run.sh -quick
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.

4) Verify (provide proof)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or MFA equivalent).
  - If a check for this bug class doesn’t exist, add it and ensure it FAILS non-zero on regressions.
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can’t happen again)
Update UNIFIED_MFA_INVENTORY.md with:
- Where it arises (paths/modules)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
```

## OAuth (V8+ Unified)
```text
Unified OAuth – NO-REGRESSION Fix Workflow (Windsurf)

Repo: /Users/cmuir/P1Import-apps/oauth-playground
Must follow:
- SWE-15: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_UNIFIED_OAUTH_GUIDE.md
- Inventory: /Users/cmuir/P1Import-apps/oauth-playground/UNIFIED_OAUTH_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add “defaults/fallbacks” that can reset flows/state unexpectedly

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed

If you cannot meet the above, do not proceed—explain what’s blocking (missing tests, missing gate, unclear state source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching “issue hotspot” in UNIFIED_OAUTH_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: ./run.sh -quick
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.

4) Verify (provide proof)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or OAuth equivalent).
  - If a check for this bug class doesn’t exist, add it and ensure it FAILS non-zero on regressions.
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can’t happen again)
Update UNIFIED_OAUTH_INVENTORY.md with:
- Where it arises (paths/modules)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet

PRODUCTION NOTE
- For production-only changes, use /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md as the source of truth.

Docs (reference only)
- PingOne: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
- PingOne MFA: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
- PingOne Protect: https://developer.pingidentity.com/pingone-api/protect/introduction.html

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
```

## Protect Portal (V8+)
```text
Protect Portal – NO-REGRESSION Fix Workflow (Windsurf)

Repo: /Users/cmuir/P1Import-apps/oauth-playground
Must follow:
- SWE-15: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_PROTECT_PORTAL_GUIDE.md
- Inventory: /Users/cmuir/P1Import-apps/oauth-playground/PROTECT_PORTAL_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add “defaults/fallbacks” that can reset flows/state unexpectedly

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed

If you cannot meet the above, do not proceed—explain what’s blocking (missing tests, missing gate, unclear state source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching “issue hotspot” in PROTECT_PORTAL_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for portal/server-impacting work)
- From repo root run: ./run.sh -quick
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.

4) Verify (provide proof)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or Protect Portal equivalent).
  - If a check for this bug class doesn’t exist, add it and ensure it FAILS non-zero on regressions.
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can’t happen again)
Update PROTECT_PORTAL_INVENTORY.md with:
- Where it arises (paths/modules)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet

PRODUCTION NOTE
- For production-only changes, use /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md as the source of truth.

Docs (reference only)
- PingOne: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
- PingOne MFA: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
- PingOne Protect: https://developer.pingidentity.com/pingone-api/protect/introduction.html

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
```

## Production (V8+ Applications)


Production – NO-REGRESSION Fix Workflow (Windsurf)

Repo: /Users/cmuir/P1Import-apps/oauth-playground
Must follow:
- SWE-15: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_PRODUCTION_INVENTORY.md
- Inventory: /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)implement The migration guide (SIDEBAR_BADGE_MIGRATION_GUIDE.md) contains complete examples for all 60 replacements.
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add “defaults/fallbacks” that can reset flows/state unexpectedly

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed

If you cannot meet the above, do not proceed—explain what’s blocking (missing tests, missing gate, unclear state source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching “issue hotspot” in PRODUCTION_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for production-impacting work)
- From repo root run: ./run.sh -quick
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.

4) Verify (provide proof)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or Production equivalent).
  - If a check for this bug class doesn’t exist, add it and ensure it FAILS non-zero on regressions.
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can’t happen again)
Update PRODUCTION_INVENTORY.md with:
- Where it arises (paths/modules)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet

Docs (reference only)
- PingOne: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
- PingOne MFA: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
- PingOne Protect: https://developer.pingidentity.com/pingone-api/protect/introduction.html

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
```
## Sidebar Menu System

### Architecture Overview (Updated Feb 2026)

The sidebar system has been completely rebuilt with a clean, maintainable architecture that separates concerns:

**Core Components:**
- **`Sidebar.tsx`**: Main container component with resizing, search, and drag-drop toggle
- **`DragDropSidebar.tsx`**: Handles all menu structure, items, and drag-drop functionality
- **`SidebarSearch.tsx`**: Search input with advanced filtering options
- **`VersionBadge.tsx`**: Displays version numbers with sidebar-specific styling

**Key Features:**
1. **Resizable Sidebar**: Drag handle with localStorage persistence (300-600px range)
2. **Search Functionality**: Real-time filtering with "match anywhere" option
3. **Drag & Drop Mode**: Toggle between standard and drag-drop menu organization
4. **Version Display**: App version and component-specific versions
5. **Clean State Management**: All menu structure handled by DragDropSidebar

**Component Responsibilities:**
- `Sidebar.tsx`: Container, layout, resize, search state, drag mode toggle
- `DragDropSidebar.tsx`: Menu items, groups, navigation, drag-drop logic
- Menu structure is NOT defined in Sidebar.tsx (delegated to DragDropSidebar)

**Styling:**
- Styled-components for all UI elements
- Consistent design system (colors, spacing, transitions)
- Responsive hover states and focus indicators
- Clean separation between container and content styling

**State Management:**
- Sidebar width: localStorage (`sidebar.width`)
- Drag mode: localStorage (`sidebar.dragDropMode`)
- Search query: Component state
- Resize state: useRef for performance

**Important Notes:**
- Sidebar.tsx is now ~260 lines (down from 1,800+ with orphaned code)
- All menu items and structure are in DragDropSidebar.tsx
- No orphaned code or unused imports
- Clean TypeScript with proper exports

Sidebar Menu – NO-REGRESSION Fix Workflow (Windsurf)

Repo: /Users/cmuir/P1Import-apps/oauth-playground
Must follow:
- SWE-15: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_SIDEBAR.md
- Inventory: /Users/cmuir/P1Import-apps/oauth-playground/SIDEBARMENU_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset flows/state unexpectedly
- modify menu structure in Sidebar.tsx (it belongs in DragDropSidebar.tsx)

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- keep Sidebar.tsx focused on container/layout concerns only

If you cannot meet the above, do not proceed—explain what's blocking (missing tests, missing gate, unclear state source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching “issue hotspot” in SIDEBENU_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for menu-impacting work)
- From repo root run: ./run.sh -quick
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Fix Implementation
- Apply the smallest safe diff
- Test in isolation first
- Verify no global theme leakage
- Confirm existing menu functionality unchanged
- Keep menu structure changes in DragDropSidebar.tsx only

4) Verification + Gate
- Run full test suite
- Run automated gate
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can't happen again)
Update SIDEBAR_INVENTORY.md with:
- add the hotspot location
- add a prevention command
- add/extend the automated gate check that would have caught it
- document the invariant that must never break again

```


```text
Company Editor – NO-REGRESSION Fix Workflow (Windsurf)

Repo: /Users/cmuir/P1Import-apps/oauth-playground
Must follow:
- SWE-15: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_COMPANY_EDITOR_GUIDE.md
- Inventory: /Users/cmuir/P1Import-apps/oauth-playground/COMPANY_EDITOR_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset companies/themes unexpectedly

You MUST:
- choose the smallest safest fix
- treat shared theme/styling/services as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed

If you cannot meet the above, do not proceed—explain what's blocking (missing tests, missing gate, unclear state source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching "issue hotspot" in COMPANY_EDITOR_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for company/theme-impacting work)
- From repo root run: ./run.sh -quick
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Fix Implementation
- Apply the smallest safe diff
- Test in isolation first
- Verify no global theme leakage
- Confirm existing companies/themes unchanged

4) Verification + Gate
- Run full test suite
- Run automated gate
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can't happen again)
Update COMPANY_EDITOR_INVENTORY.md with:
- add the hotspot location
- add a prevention command
- add/extend the automated gate check that would have caught it
- document the invariant that must never break again

```

# Company Editor Production Inventory 

## 🔎 Quick Links (Start here when testing a change)
- **STOP-SHIP / No Regressions**
- **Issue Location Map (Hotspots)**
- **Flow Compliance (MUST NOT CHANGE)**
- **Enhanced Prevention Commands**
- **Automated Gate Notes (CI / local)**
- **Verification Checklist (SWE-15 aligned)**

---

## 🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
Regression = failure. If anything is uncertain, expands blast radius, or breaks existing companies/themes: **STOP and change approach**.

You MUST NOT:
- ship without proof (tests + gate passing)
- widen behavior changes beyond the targeted path
- change global CSS in a way that affects existing companies
- log secrets/PII or dump raw file contents to logs

You MUST:
- keep the smallest safe diff
- treat shared theme/styling/services as **HIGH RISK**
- add/extend automated checks for any escaped bug class
- update this inventory so the issue can’t repeat unnoticed

---

## Feature Summary
- **Route**: `/admin/create-company`
- **Purpose**: Create/manage company theme configs for Protect Portal
- **Core Actions**:
  - **Save**: validate + persist *draft* only
  - **Create**: validate + persist + register new company
- **Required fields**: name, industry, logo, 4 colors
- **Optional**: footer image (auto-fit)

---

## ✅ Flow Compliance (MUST NOT CHANGE)
These behaviors are invariants. Changes here are **HIGH RISK** and require extra verification.

1) **Save is non-destructive**
- Save must **NOT** create a new company or modify the registry.
- Save must only persist draft state.

2) **Create is transactional**
- Create must validate, then create exactly **one** company entry.
- Create must handle collisions deterministically (slug/id uniqueness rule).
- Create must preserve existing companies exactly.

3) **Theme application must be scoped**
- Preview/theme override must not mutate global styling for unrelated pages.
- Prefer CSS variables scoped to preview/container (or per-company class).

4) **Footer is optional**
- No footer image must still render a clean layout.
- Footer image, when present, must auto-fit (no overflow, responsive).

---

## 🧭 Issue Location Map (Hotspots)
Where regressions commonly arise:

### 1) Routing / access control
- `App.tsx` route registration for `/admin/create-company`
- Any admin gating middleware (ensure no accidental exposure/regression)

### 2) Storage & persistence
- Draft key naming + slug generation
- Registry serialization/deserialization
- Log rotation / quota handling

### 3) Theme / CSS overrides
- CSS variables application scope
- Styled Components theme provider integration
- Preview-only styling leakage into global styles

### 4) File uploads
- File type + size validation
- Blob URL lifecycle (revokeObjectURL to prevent leaks)
- Footer “fit” implementation (object-fit, height constraints)

### 5) Validation & UX state
- Required fields enforcement (all except footer)
- Disable Save/Create when invalid
- Error messaging and state resets

### 6) Logging (persistent, not console)
- Ensure logs go through the persistent logger pipeline
- Redaction: never log secrets/PII/raw file contents

---

## Data Models (Contract)
The following schema is the contract. Any changes require an inventory update + migration plan.

### CompanyConfig (canonical)
- `id` (generated)
- `name`
- `industry`
- `colors: { button, headers, text, background }`
- `assets: { logoUrl, footerUrl? }`
- `createdAt`, `updatedAt`

---

## Storage Contract
### Keys
- Draft: `companyDraft:${slug}`
- Registry: `companyRegistry`
- Logs: `companyEditorLogs` (rotated)

### Invariants
- Drafts are isolated per slug
- Registry is append/update-safe and never wipes existing entries
- Logs are bounded (e.g., last 1000)

---

## Logging & Monitoring (persistent; NO console)
### Required events
- `company_config_save_attempt|success|failure`
- `company_create_attempt|success|failure`

### Required log fields (sanitized)
- timestamp
- event
- companyId / slug
- validation error codes (no raw secrets)
- asset metadata: mime, size (no binary)

---

## 🔍 Enhanced Prevention Commands (copy/paste)
Use these to catch regressions quickly.

### A) “Save must not create”
Search for Save calling create/register:
```bash
rg -n "onSave|saveDraft" src | rg -n "create|register|registry"
```

### B) “Create must register exactly once”
```bash
rg -n "onCreate|createCompany" src
rg -n "companyRegistry" src
```

### C) “No global theme leakage”
Look for global CSS variable writes outside preview/container:
```bash
rg -n "document\.documentElement\.style\.setProperty|:root" src
```

### D) “No console logging”
```bash
rg -n "console\.(log|debug|info|warn|error)" src
```

### E) “Blob URLs revoked”
```bash
rg -n "URL\.createObjectURL|revokeObjectURL" src
```

---

## 🧰 Automated Gate Notes (local + CI)
If Company Editor code changes:
- run the standard SWE-15 verify steps
- run inventory gate script (must fail non-zero on regressions)

**Gate must include:**
- no console logging
- no global theme leakage patterns
- save/create contract checks (at least grep-based)

---

## ✅ Verification Checklist (SWE-15 aligned)
Before merge:
1) Restart cleanly (if server/theme integration is runtime-dependent):
   - `./run.sh -quick` (fallback: `./restart.sh -quick`)
2) Reproduce baseline behavior (existing companies unchanged)
3) Save flow:
   - invalid state blocks save
   - save persists draft only
   - reload restores draft
4) Create flow:
   - creates exactly one company
   - appears in list
   - persists across reload
   - collision handling works (duplicate name/id)
5) Theme application:
   - preview looks correct
   - existing pages/companies unchanged
6) Footer:
   - absent footer renders cleanly
   - present footer auto-fits across breakpoints
7) Run tests + inventory gate; attach proof (commands + summary)

---

## Inventory Update Rule (“so it doesn’t happen again”)
If a bug/regression occurs:
- add the hotspot location
- add a prevention command
- add/extend the automated gate check that would have caught it
- document the invariant that must never break again

Repo: /Users/cmuir/P1Import-apps/oauth-playground
Must follow:
- SWE-15: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_COMPANY_EDITOR_GUIDE.md
- Inventory: /Users/cmuir/P1Import-apps/oauth-playground/COMPANY_EDITOR_INVENTORY.md
