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
- From repo root run: ./restart-servers.sh -quick
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