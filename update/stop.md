# Unified MFA Regression Stop-List (SWE-15 + Inventory + Gate)

This document captures a hardened workflow for preventing regressions in Unified MFA work, based on the SWE-15 guide + inventory approach, plus concrete upgrades to make it safer and more repeatable.

---

## 1) What’s already working (keep doing this)

Your current method has the right backbone:

- A **decision framework** + “before/during/after” checklist in the guide.
- Explicit **After Changes** discipline: update inventory, run tests, verify flows, document changes.
- A centralized **Issue Location Map** / “where issues arise” concept in the inventory.
- A curated **Enhanced Prevention Commands** section (the best part: this can be operationalized into an automated gate).

---

## 2) Biggest safety upgrade: make inventory checks a *hard gate*

Right now, the inventory is doing two jobs:

1) Documentation / knowledge base  
2) Enforcement / checklist

To prevent regressions reliably, enforcement should be:

- **deterministic**
- **machine-runnable**
- **non-zero exit on failure**
- **CI-friendly output**

### Recommendation

- Treat `comprehensive-inventory-check.sh` as the canonical **inventory gate**.
- Run it:
  - **locally before merge**
  - **in CI on every PR**
  - optionally as a **pre-push hook** (fast subset) + CI (full set)

---

## 3) Fix the common script trap: boolean checks that always succeed

Use a safe, explicit pattern:

- compute a count
- compare count to a threshold
- fail when out of bounds

Avoid misleading constructs like `... | wc -l && echo "bad" || echo "good"` because `wc` typically exits 0 even when the count is 0.

Preferred template:

```bash
count="$(grep -R "pattern" path | wc -l | tr -d ' ')"
if [[ "${count}" -gt 0 ]]; then
  echo "❌ Found ${count} matches: pattern"
  exit 1
fi
```

---

## 4) Make issues easier to find next time (inventory UX)

Two improvements dramatically increase “findability” and reduce “I forgot where this bites” issues:

- Add a **Quick Links / Jump Table** near the top that points testers to the exact headings.
- Under “Enhanced Prevention Commands”, add an **Automated Inventory Gate** subsection that:
  - says **when to run it**
  - says it must **fail non-zero**
  - shows the **safe bash pattern**
  - explains **how to add a new regression guard**

This complements the existing Issue Location Map structure and encourages consistent usage.

---

## 5) Artifacts created (drop-in)

I produced updated versions that **do not overwrite** your originals:

- `SWE-15_UNIFIED_MFA_GUIDE.updated.md`  
  Adds an explicit **Inventory Regression Guardrail** step to run the inventory gate after code changes.

- `UNIFIED_MFA_INVENTORY.updated.md`  
  Adds **Quick Links** and an **Automated Inventory Gate** section under “Enhanced Prevention Commands”.

- `comprehensive-inventory-check.v2.sh`  
  Hardened, CI-friendly gate script:
  - `set -euo pipefail`
  - safe match counting
  - non-zero exit on failures
  - clean output + summary

---

## 6) Additional high-ROI safety upgrades

### A) Split checks into “fast” vs “full”
- **Fast (pre-push):** highest-signal grep checks + TypeScript compile
- **Full (CI):** fast + tests + slower repo scans

### B) Add “blast radius” tags to every change
In PR description / commit footer:

- `Touches:` flows | services | components | docs
- `Risk:` low | med | high
- `Requires:` inventory gate | menu sync check | flow compliance check

This forces impact thinking and makes reviews more consistent.

### C) Path-scope checks (reduce fatigue)
If the script can accept changed files (or derive from git diff), you can:
- run only relevant checks locally
- still run the full gate in CI

### D) Promote “known footguns” into explicit gates
Example: if sidebar/menu sync issues are critical, detect when those files change and require a sync/consistency check automatically.

---

## 7) Rule of thumb

If it caused a regression once, it should become one of:
- a **hard gate** (scripted, fails CI), or
- a **required checklist line** with an explicit verification command, ideally both.

