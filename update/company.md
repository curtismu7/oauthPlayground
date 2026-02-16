# Company Editor Production Inventory (Protect Portal)

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
