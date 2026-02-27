# master3-prompts.md
# Master Prompts (Windsurf) — No Regression Workflows

## Inventory Paths (Repo-Relative)

### Company Editor
- `project/inventory/COMPANY_EDITOR_INVENTORY.md`
- `project/inventory/SWE-15_COMPANY_EDITOR_INVENTORY.md`

### Sidebar Menu
- `project/inventory/SIDEBARMENU_INVENTORY.md`
- `project/inventory/SWE-15_SIDEBARMENU.md`

### Spinner
- `project/inventory/SPINNER_INVENTORY.md`
- `project/inventory/SWE-15_SPINNER_INVENTORY.md`

### Unified Inventories
- `project/inventory/UNIFIED_MFA_INVENTORY.md`
- `project/inventory/UNIFIED_OAUTH_INVENTORY.md`
- `project/inventory/UNIFIED_CIBA_INVENTORY.md`
- `project/inventory/PROTECT_PORTAL_INVENTORY.md`
- `project/inventory/PRODUCTION_INVENTORY.md`
- `project/inventory/SWE-15_PRODUCTION_INVENTORY.md`

### Additional Inventories
- `project/inventory/USER_MANAGEMENT_INVENTORY.md`
- `project/inventory/SDK_EXAMPLES_INVENTORY.md`

---

## Unified MFA (V8+) — NO-REGRESSION Fix Workflow

Unified MFA – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: SWE-15_UNIFIED_MFA_GUIDE.md
- Inventory: project/inventory/UNIFIED_MFA_INVENTORY.md

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
- Find the matching “issue hotspot” in project/inventory/UNIFIED_MFA_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: ./run.sh -default -background
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
Update project/inventory/UNIFIED_MFA_INVENTORY.md with:
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

---

## Unified OAuth (V8+) — NO-REGRESSION Fix Workflow
```text
Unified OAuth – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: SWE-15_UNIFIED_OAUTH_GUIDE.md
- Inventory: project/inventory/UNIFIED_OAUTH_INVENTORY.md

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
- Find the matching “issue hotspot” in project/inventory/UNIFIED_OAUTH_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: ./run.sh -default -background
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
Update project/inventory/UNIFIED_OAUTH_INVENTORY.md with:
- Where it arises (paths/modules)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet

PRODUCTION NOTE
- For production-only changes, use project/inventory/PRODUCTION_INVENTORY.md as the source of truth.

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

---

## Unified CIBA (V8+) — NO-REGRESSION Fix Workflow
```text
Unified CIBA – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: SWE-15_UNIFIED_CIBA_GUIDE.md
- Inventory: project/inventory/UNIFIED_CIBA_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add “defaults/fallbacks” that can reset flows/state unexpectedly
- change polling/interval/timeouts globally unless the change is explicitly scoped and proven safe (CIBA is timing-sensitive)

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- preserve protocol invariants (auth_req_id lifecycle, polling rules, error semantics, token binding if applicable)

If you cannot meet the above, do not proceed—explain what’s blocking (missing tests, missing gate, unclear state source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Identify which CIBA mode(s) are affected (poll, ping, push if supported).
- Find the matching “issue hotspot” in project/inventory/UNIFIED_CIBA_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly (shared OAuth client, token service, retry/backoff utilities).

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: ./run.sh -default -background
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Do not alter behavior outside the target path.
- If you touch shared OAuth flows/services/components, assume cross-app blast radius and treat as HIGH RISK.
- Preserve CIBA timing/error semantics:
  - polling interval/backoff behavior
  - `authorization_pending` / `slow_down` / `expired_token` (or your platform equivalents)
  - auth_req_id issuance + storage + invalidation rules

4) Verify (provide proof)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or CIBA equivalent).
  - If a check for this bug class doesn’t exist, add it and ensure it FAILS non-zero on regressions.
- Verification must include at least:
  - happy path (initiate backchannel auth → user completes → token issued)
  - pending path (poll before user completes → pending response behaves correctly)
  - timeout/expiry path (auth_req_id expires → correct error + no token issuance)
  - slow-down/backoff path (if supported) behaves as specified
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can’t happen again)
Update project/inventory/UNIFIED_CIBA_INVENTORY.md with:
- Where it arises (paths/modules)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet (including at least one pending/expiry case)

PRODUCTION NOTE
- For production-only changes, use project/inventory/PRODUCTION_INVENTORY.md as the source of truth.

Docs (reference only)
- PingOne: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
- PingOne MFA: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
- PingOne Protect: https://developer.pingidentity.com/pingone-api/protect/introduction.html
```

---

## Protect Portal (V8+) — NO-REGRESSION Fix Workflow
```text
Protect Portal – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: SWE-15_PROTECT_PORTAL_GUIDE.md
- Inventory: project/inventory/PROTECT_PORTAL_INVENTORY.md

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
- Find the matching “issue hotspot” in project/inventory/PROTECT_PORTAL_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for portal/server-impacting work)
- From repo root run: ./run.sh -default -background
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
Update project/inventory/PROTECT_PORTAL_INVENTORY.md with:
- Where it arises (paths/modules)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet

PRODUCTION NOTE
- For production-only changes, use project/inventory/PRODUCTION_INVENTORY.md as the source of truth.

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

---

## Production (V8+ Applications) — NO-REGRESSION Fix Workflow
```text
Production – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: project/inventory/SWE-15_PRODUCTION_INVENTORY.md
- Inventory: project/inventory/PRODUCTION_INVENTORY.md

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
- Find the matching “issue hotspot” in project/inventory/PRODUCTION_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for production-impacting work)
- From repo root run: ./run.sh -default -background
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
Update project/inventory/PRODUCTION_INVENTORY.md with:
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

---

## Sidebar Menu — NO-REGRESSION Fix Workflow
```text
Sidebar Menu – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: project/inventory/SWE-15_SIDEBARMENU.md (needs to be created)
- Inventory: project/inventory/SIDEBARMENU_INVENTORY.md

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
- Find the matching “issue hotspot” in project/inventory/SIDEBARMENU_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for menu-impacting work)
- From repo root run: ./run.sh -default -background
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

5) Inventory Update (so it can’t happen again)
Update project/inventory/SIDEBARMENU_INVENTORY.md with:
- add the hotspot location
- add a prevention command
- add/extend the automated gate check that would have caught it
- document the invariant that must never break again
```

---

## Company Editor — NO-REGRESSION Fix Workflow
```text
Company Editor – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: project/inventory/SWE-15_COMPANY_EDITOR_INVENTORY.md
- Inventory: project/inventory/COMPANY_EDITOR_INVENTORY.md

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
- Find the matching "issue hotspot" in project/inventory/COMPANY_EDITOR_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for company/theme-impacting work)
- From repo root run: ./run.sh -default -background
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

5) Inventory Update (so it can’t happen again)
Update project/inventory/COMPANY_EDITOR_INVENTORY.md with:
- add the hotspot location
- add a prevention command
- add/extend the automated gate check that would have caught it
- document the invariant that must never break again
```

---

## Spinner — NO-REGRESSION Fix Workflow
```text
Spinner – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Must follow:
- SWE-15: project/inventory/SWE-15_SPINNER_INVENTORY.md
- Inventory: project/inventory/SPINNER_INVENTORY.md

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset UI state unexpectedly
- change global loading behavior without scoping (spinner changes can affect many flows)

You MUST:
- choose the smallest safest fix
- treat shared UI components/theme/styling as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- preserve existing loading semantics (when it shows, when it hides, and accessibility attributes)

If you cannot meet the above, do not proceed—explain what’s blocking (missing tests, missing gate, unclear trigger source) and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/pages/flows impacted).
- Find the matching “issue hotspot” in project/inventory/SPINNER_INVENTORY.md.
- Propose the smallest safe fix. Call out any risky/broad changes explicitly (global CSS, shared component changes, app-wide providers).

2) Clean Restart Policy (required for UI/runtime-impacting work)
- From repo root run: ./run.sh -default -background
  (Fallback only if missing: ./restart.sh -quick)
- Run restart BEFORE repro (clean baseline) and AFTER fix (before final verification).
- Confirm services healthy per the guide.

3) Fix Implementation (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Do not alter behavior outside the target path.
- If you touch shared components/providers/theme, assume cross-app blast radius and treat as HIGH RISK.
- Preserve:
  - show/hide conditions (no "always show" or "never hide" accidents)
  - transition/animation behavior if it affects UX timing
  - accessibility: `aria-busy`, `role="status"` (or equivalent), and reduced-motion behavior if present

4) Verification + Gate (provide proof)
- Run SWE-15 test/build steps from project/inventory/SWE-15_SPINNER_INVENTORY.md.
- Run the regression gate (inventory script, or spinner equivalent):
  - If a check for this bug class doesn’t exist, add it and ensure it FAILS non-zero on regressions.
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why

5) Inventory Update (so it can’t happen again)
Update project/inventory/SPINNER_INVENTORY.md with:
- Where it arises (paths/modules/components)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short “how to verify” snippet (manual + automated)

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
```
