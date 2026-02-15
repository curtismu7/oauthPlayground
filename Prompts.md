


Unified MFA – Regression-Safe Fix Workflow (SWE-15 + Inventory Gate)

You are working in: /Users/cmuir/P1Import-apps/oauth-playground

MANDATORY PROCESS
1) Read and follow:
   - SWE-15 guide: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_UNIFIED_MFA_GUIDE.md
   - Inventory: /Users/cmuir/P1Import-apps/oauth-playground/UNIFIED_MFA_INVENTORY.md

2) Before changing code:
   - Identify the exact bug/regression and its scope (which app(s)/service(s)/flows are impacted).
   - Locate the relevant “issue hotspot” section(s) in UNIFIED_MFA_INVENTORY.md where this issue can arise.
   - Propose the smallest safe fix (avoid breaking changes). Call out any risky changes explicitly.

CLEAN RESTART POLICY (mandatory for flow/server-impacting changes)
3) Always run a clean restart whenever you:
   - change server-side behavior
   - touch Unified MFA/auth flows
   - modify shared services/components used by MFA flows
   - update config that affects runtime behavior

Restart command:
   - ./restart-servers.sh -quick

Restart timing:
   - Run ./restart-servers.sh -quick BEFORE reproducing the bug (clean baseline)
   - Run ./restart-servers.sh -quick AFTER implementing the fix (before final verification)

Also confirm services are healthy (per the guide’s health check/log indicator).

IMPLEMENTATION RULES
4) Apply the fix with minimal diff and no behavior changes outside the targeted path.
5) If the change touches shared flows/services/components, assume cross-app blast radius and treat as high risk.

REQUIRED VERIFICATION (provide evidence)
6) Run the project’s standard test/build commands from the SWE-15 guide.
7) Run the Unified MFA inventory regression gate:
   - Execute: ./comprehensive-inventory-check.sh (or the MFA equivalent if named differently)
   - If no script exists, create/extend one to automate the relevant inventory checks for THIS bug class.
8) Provide proof in your response:
   - Commands run (copy/paste)
   - Key outputs (pass/fail summary)
   - Files changed (list + short rationale)

INVENTORY UPDATE (so it doesn’t happen again)
9) Update: /Users/cmuir/P1Import-apps/oauth-playground/UNIFIED_MFA_INVENTORY.md
   - Add/modify an entry under:
     a) ISSUE LOCATION MAP (where this issue can arise)
     b) Enhanced Prevention Commands (add grep/test checks that detect this regression)
     c) Automated Gate Notes (if applicable): ensure new checks are runnable in CI and fail non-zero
   - Make it easy to find next time: include exact file paths, patterns, and a “how to verify” snippet.

CRITICAL NOTE (path typo)
10) Your message references:
    /Users/cmuir/P1Import-apps/oauth-playgroung/UNIFIED_MFA_INVENTORY.md
    That path has a likely typo ("oauth-playgroung"). Use the correct folder:
    /Users/cmuir/P1Import-apps/oauth-playground/UNIFIED_MFA_INVENTORY.md

DELIVERABLES
11) Return:
   - A short root-cause summary
   - The fix summary (what changed and why)
   - Verification evidence (steps + results)
   - Inventory diffs (what you added and where)
12) pingone full Docs: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
13) PIngOne MFA Docs: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
14) Pingone protect docs: https://developer.pingidentity.com/pingone-api/protect/introduction.html



------
OAUTH

Unified OAuth – Regression-Safe Fix Workflow (SWE-15 + Inventory Gate)

You are working in: /Users/cmuir/P1Import-apps/oauth-playground

MANDATORY PROCESS
1) Read and follow:
   - SWE-15 guide: SWE-15_UNIFIED_OAUTH_GUIDE.md
   - Inventory: UNIFIED_OAUTH_INVENTORY.md

2) Before changing code:
   - Identify the exact bug/regression and its scope (which app(s)/service(s)/flows are impacted).
   - Locate the relevant “issue hotspot” section(s) in UNIFIED_OAUTH_INVENTORY.md where this type of bug can arise.
   - Propose the smallest safe fix (avoid breaking changes). Call out any risky changes explicitly.

CLEAN RESTART (required when touching flows/services)
3) Restart servers cleanly before verification:
   - Run: ./run.sh -quick
   - Confirm services are healthy (whatever health check/log indicator your guide uses).

IMPLEMENTATION RULES
4) Apply the fix with minimal diff and no behavior changes outside the targeted path.
5) If the change touches shared flows/services/components, assume cross-app blast radius and treat as high risk.

REQUIRED VERIFICATION (provide evidence)
6) Run the project’s standard test/build commands from the guide.
7) Run the inventory regression checks:
   - Execute: ./comprehensive-inventory-check.sh (or the OAuth equivalent if named differently)
   - If no script exists, create/extend one to automate the relevant inventory checks for THIS bug class.
8) Provide proof in your response:
   - Commands run (copy/paste)
   - Key outputs (pass/fail summary)
   - Files changed (list + short rationale)

INVENTORY UPDATE (so it doesn’t happen again)
9) Update /Users/cmuir/P1Import-apps/oauth-playground/UNIFIED_OAUTH_INVENTORY.md:
   - Add a new entry under:
     a) ISSUE LOCATION MAP (where this issue can arise)
     b) Enhanced Prevention Commands (add grep/test checks that detect this regression)
     c) Automated Gate Notes (if applicable): ensure the new checks are runnable in CI and fail non-zero
   - Make it easy to find next time: include the exact file paths, patterns, and a “how to verify” snippet.
10) For Production work, treat the source of truth as:
    /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md

DELIVERABLES
11) Return:
   - A short root-cause summary
   - The fix summary (what changed and why)
   - Verification evidence (steps + results)
   - Inventory diffs (what you added and where)12) pingone full Docs: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
13) PIngOne MFA Docs: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
14) Pingone protect docs: https://developer.pingidentity.com/pingone-api/protect/introduction.html





------
Protect Portal – Regression-Safe Fix Workflow (SWE-15 + Inventory Gate)

You are working in: /Users/cmuir/P1Import-apps/oauth-playground

MANDATORY PROCESS
1) Read and follow:
   - SWE-15 guide: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_PROTECT_PORTAL_INVENTORY.md
   - Inventory: /Users/cmuir/P1Import-apps/oauth-playground/PROTECT_PORTAL_INVENTORY.md

2) Before changing code:
   - Identify the exact bug/regression and its scope (which app(s)/service(s)/flows are impacted).
   - Locate the relevant “issue hotspot” section(s) in PROTECT_PORTAL_INVENTORY.md where this issue can arise.
   - Propose the smallest safe fix (avoid breaking changes). Call out any risky changes explicitly.

CLEAN RESTART POLICY (mandatory for portal/server-impacting changes)
3) Always run a clean restart whenever you:
   - change server-side behavior
   - touch Protect Portal auth/security flows
   - modify shared services/components used by portal flows
   - update config that affects runtime behavior

Restart command:
   - ./run.sh -quick

Restart timing:
   - Run ./run.sh -quick BEFORE reproducing the bug (clean baseline)
   - Run ./run.sh -quick AFTER implementing the fix (before final verification)

Also confirm services are healthy (per the guide’s health check/log indicator).

IMPLEMENTATION RULES
4) Apply the fix with minimal diff and no behavior changes outside the targeted path.
5) If the change touches shared flows/services/components, assume cross-app blast radius and treat as high risk.

REQUIRED VERIFICATION (provide evidence)
6) Run the project’s standard test/build commands from the SWE-15 guide.
7) Run the Protect Portal inventory regression gate:
   - Execute: ./comprehensive-inventory-check.sh (or the Protect Portal equivalent if named differently)
   - If no script exists, create/extend one to automate the relevant inventory checks for THIS bug class.
8) Provide proof in your response:
   - Commands run (copy/paste)
   - Key outputs (pass/fail summary)
   - Files changed (list + short rationale)

INVENTORY UPDATE (so it doesn’t happen again)
9) Update: /Users/cmuir/P1Import-apps/oauth-playground/PROTECT_PORTAL_INVENTORY.md
   - Add/modify an entry under:
     a) ISSUE LOCATION MAP (where this issue can arise)
     b) Enhanced Prevention Commands (add grep/test checks that detect this regression)
     c) Automated Gate Notes (if applicable): ensure new checks are runnable in CI and fail non-zero
   - Make it easy to find next time: include exact file paths, patterns, and a “how to verify” snippet.
 10) For Production work, treat the source of truth as:
    /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md

DELIVERABLES
11) Return:
   - A short root-cause summary
   - The fix summary (what changed and why)
   - Verification evidence (steps + results)
   - Inventory diffs (what you added and where)12) pingone full Docs: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
13) PIngOne MFA Docs: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
14) Pingone protect docs: https://developer.pingidentity.com/pingone-api/protect/introduction.html




----

Production – Regression-Safe Fix Workflow (SWE-15 + Inventory Gate)

You are working in: /Users/cmuir/P1Import-apps/oauth-playground

MANDATORY PROCESS
1) Read and follow:
   - SWE-15 guide: /Users/cmuir/P1Import-apps/oauth-playground/SWE-15_PRODUCTION_INVENTORY.md
   - Inventory: /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md

2) Before changing code:
   - Identify the exact bug/regression and its scope (which app(s)/service(s)/flows are impacted).
   - Locate the relevant “issue hotspot” section(s) in PRODUCTION_INVENTORY.md where this issue can arise.
   - Propose the smallest safe fix (avoid breaking changes). Call out any risky changes explicitly.

CLEAN RESTART POLICY (mandatory for production-impacting changes)
3) Always run a clean restart whenever you:
   - change server-side behavior
   - touch production auth/security/runtime flows
   - modify shared services/components used by production flows
   - update config that affects runtime behavior

Restart command:
   - ./run.sh -quick

Restart timing:
   - Run ./run.sh -quick BEFORE reproducing the bug (clean baseline)
   - Run ./run.sh -quick AFTER implementing the fix (before final verification)

Also confirm services are healthy (per the guide’s health check/log indicator).

IMPLEMENTATION RULES
4) Apply the fix with minimal diff and no behavior changes outside the targeted path.
5) If the change touches shared flows/services/components, assume cross-app blast radius and treat as high risk.

REQUIRED VERIFICATION (provide evidence)
6) Run the project’s standard test/build commands from the SWE-15 guide.
7) Run the Production inventory regression gate:
   - Execute: ./comprehensive-inventory-check.sh (or the Production equivalent if named differently)
   - If no script exists, create/extend one to automate the relevant inventory checks for THIS bug class.
8) Provide proof in your response:
   - Commands run (copy/paste)
   - Key outputs (pass/fail summary)
   - Files changed (list + short rationale)

INVENTORY UPDATE (so it doesn’t happen again)
9) Update: /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md
   - Add/modify an entry under:
     a) ISSUE LOCATION MAP (where this issue can arise)
     b) Enhanced Prevention Commands (add grep/test checks that detect this regression)
     c) Automated Gate Notes (if applicable): ensure new checks are runnable in CI and fail non-zero
   - Make it easy to find next time: include exact file paths, patterns, and a “how to verify” snippet.

10) For Production work, treat the source of truth as:
    /Users/cmuir/P1Import-apps/oauth-playground/PRODUCTION_INVENTORY.md

DELIVERABLES
11) Return:
   - A short root-cause summary
   - The fix summary (what changed and why)
   - Verification evidence (steps + results)
   - Inventory diffs (what you added and where)12) pingone full Docs: https://developer.pingidentity.com/pingone-api/getting-started/introduction.html
13) PIngOne MFA Docs: https://developer.pingidentity.com/pingone-api/mfa/introduction.html
14) Pingone protect docs: https://developer.pingidentity.com/pingone-api/protect/introduction.html


https://www.rfc-editor.org/rfc/rfc9449.txt