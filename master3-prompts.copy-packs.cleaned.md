# Windsurf Copy Packs — Master Prompts

Purpose: make each workflow **copy/pasteable** into a Windsurf agent prompt without hunting through a giant file.

## How to use

1) Paste **one** of the app packs below when working on that app (OAuth/MFA/Flows/Unified).
2) If you touch anything under `src/shared/`, also paste **Shared Services** pack.
3) If the work is about moving code / imports / modular boundaries, paste **Modular Architecture** pack.

---

## Common repo context (paste once per session)

# master3-prompts.md

## Master Prompts (Windsurf) — No Regression Workflows

## 🏗️ NEW MODULAR APP ARCHITECTURE (COMPLETED)

**IMPORTANT:** This codebase has been restructured into a modular app architecture:

```
src/
├── apps/
│   ├── oauth/     # OAuth-specific components and services
│   ├── mfa/       # MFA-specific components and services  
│   ├── flows/     # Flow management components
│   └── unified/   # Unified app components
└── shared/
    ├── services/  # Shared services
    ├── types/     # Shared types
    ├── config/    # Shared configuration
    └── design/    # Shared design system
```

### 🎯 Import Path Rules:
- **App-specific imports:** `@/apps/{app}/...` (e.g., `@/apps/mfa/services/mfaServiceV8`)
- **Shared imports:** `@/shared/...` (e.g., `@/shared/services/userServiceV8`)
- **Legacy v8 imports:** Still work but should be migrated to new structure

### 🔧 Build & Test Commands:
- **Build:** `npm run build` (✅ 20-25s, consistently successful)
- **Lint:** `npm run lint` (✅ Configured to ignore archives/backup files)
- **TypeScript:** `npx tsc --noEmit --skipLibCheck` (✅ Only shows real source issues)

### 🔍 Cross-App Service Checking:
- **Check Dependencies:** `npm run check:services` (Shows dependency summary)
- **Check Service Impact:** `npm run check:service -- <serviceName>` (Shows affected apps)
- **Check App Dependencies:** `npm run check:app -- <appName>` (Shows services used by app)
- **List All Services:** `npm run check:services:list` (Shows all services and dependencies)
- **Generate Report:** `npm run check:services:report` (Creates detailed dependency report)

### 🚨 Service Update Workflow:
1. **Before Update:** Run `npm run check:service -- <serviceName>` to identify impact
2. **During Update:** Make changes, maintain backward compatibility
3. **After Update:** Run `npm run build`, test affected apps, update documentation
4. **Verify:** Test cross-app functionality, check for regressions

---

## 📋 INVENTORY PATHS (Repo-Relative)

### 📱 App-Specific Inventories
- **OAuth App:** `project/inventory/UNIFIED_OAUTH_INVENTORY.md`
- **MFA App:** `project/inventory/UNIFIED_MFA_INVENTORY.md`
- **Flows App:** `project/inventory/FLOWS_INVENTORY.md` (create if needed)
- **Unified App:** `project/inventory/UNIFIED_APP_INVENTORY.md` (create if needed)

### 🔧 Shared Services Inventories
- **Shared Services:** `project/inventory/SHARED_SERVICES_INVENTORY.md` (create if needed)

### 🎨 UI Component Inventories
- **Company Editor:** `project/inventory/COMPANY_EDITOR_INVENTORY.md`
- **Sidebar Menu:** `project/inventory/SIDEBARMENU_INVENTORY.md`
- **Spinner:** `project/inventory/SPINNER_INVENTORY.md`

### 👥 User Management Inventories
- **User Management:** `project/inventory/USER_MANAGEMENT_INVENTORY.md`
- **SDK Examples:** `project/inventory/SDK_EXAMPLES_INVENTORY.md`

### 🏢 Production & Enterprise Inventories
- **Protect Portal:** `project/inventory/PROTECT_PORTAL_INVENTORY.md`
- **Production:** `project/inventory/PRODUCTION_INVENTORY.md`

### 📚 Protocol-Specific Inventories
- **CIBA:** `project/inventory/UNIFIED_CIBA_INVENTORY.md`

---

---

## COPY PACK — OAuth App

**Paste into Windsurf agent prompt (standalone pack).**

**Context / invariants (keep as-is):**
- Repo root: `.` 
- Apps live under `src/apps/{oauth,mfa,flows,unified}/` and shared code under `src/shared/`.
- Import rules: app code uses `@/apps/{app}/...`, shared uses `@/shared/...`.
- Cross-app blast-radius commands:
  - `npm run check:service -- <serviceName>` (who uses a service)
  - `npm run check:app -- <appName>` (what an app uses)
  - `npm run check:services:report` (full dependency report)

```text
OAuth App – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
App Location: src/apps/oauth/
Must follow:
- SWE-15: SWE-15_UNIFIED_OAUTH_GUIDE.md
- Inventory: project/inventory/UNIFIED_OAUTH_INVENTORY.md
- Architecture: Use @/apps/oauth/... for OAuth-specific imports
- Shared: Use @/shared/... for shared services

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset flows/state unexpectedly
- use legacy v8 import paths when new app structure exists

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- use @/apps/oauth/... for OAuth-specific imports
- test cross-app functionality when touching shared code
- **REGRESSION PREVENTION:** Always validate backward compatibility
- **BREAKING CHANGE MITIGATION:** Use feature flags for risky changes

If you cannot meet the above, do not proceed—explain what's blocking and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching "issue hotspot" in project/inventory/UNIFIED_OAUTH_INVENTORY.md.
- Check if imports use new modular structure (@/apps/oauth/...).
- **CROSS-APP SERVICE CHECK:** If touching shared services, run `npm run check:service -- <serviceName>` to identify all affected apps
- **BACKWARD COMPATIBILITY CHECK:** Identify any API contracts that could be broken
- **RISK ASSESSMENT:** Rate change risk (LOW/MEDIUM/HIGH) and justify
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: npm run build (verify build success)
- If server-impacting: restart services as needed
- Confirm services healthy per the guide.
- **BASELINE VERIFICATION:** Capture current state before changes (screenshots, logs, test results)

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Update import paths to use @/apps/oauth/... structure.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.
- **BREAKING CHANGE PROTECTION:** 
  - Use feature flags for new behavior
  - Maintain old API alongside new API when possible
  - Add deprecation warnings for removed functionality
  - Preserve existing return types and method signatures

4) Verify (provide proof)
- Run build: npm run build (must pass)
- Run lint: npm run lint (must pass)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or OAuth equivalent).
  - If a check for this bug class doesn't exist, add it and ensure it FAILS non-zero on regressions.
- **CROSS-APP VERIFICATION:** If shared code changed, test all apps identified by `npm run check:service -- <serviceName>`
- **BACKWARD COMPATIBILITY TESTS:** Test existing integrations still work
- **REGRESSION TESTS:** Run full test suite to ensure no regressions
- **INTEGRATION TESTS:** Test OAuth flows end-to-end
- Test OAuth app functionality specifically
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why
  - import path changes made
  - **cross-app impact analysis results**
  - **backward compatibility verification**
  - **regression test results**

5) Inventory Update (so it can't happen again)
Update project/inventory/UNIFIED_OAUTH_INVENTORY.md with:
- Where it arises (paths/modules - use new @/apps/oauth/... paths)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short "how to verify" snippet
- Import path requirements for OAuth app
- **Cross-app dependencies** if shared services were touched
- **API Contract Documentation:** Document service interfaces and expected behaviors
- **Regression Prevention Rules:** Add specific rules to prevent this regression
- **Breaking Change Policy:** Document when breaking changes are acceptable and process required

6) Cross-App Service Impact (if shared services touched)
If you modified shared services:
- **Document Impact:** List all apps affected by the service change
- **Testing Evidence:** Show test results for each affected app (especially OAuth)
- **Rollback Plan:** Include rollback strategy if issues arise
- **Update Documentation:** Update service documentation and affected app docs
- **Migration Guide:** If breaking changes unavoidable, provide migration guide
- **Version Strategy:** Document service versioning and compatibility matrix
- **Communication Plan:** Document how to notify dependent teams of changes

7) Post-Deployment Monitoring (if deployed)
- **MONITORING:** Set up alerts for service failures or performance degradation
- **ROLLBACK READINESS:** Ensure quick rollback capability (within 5 minutes)
- **OBSERVABILITY:** Monitor error rates, response times, and user experience metrics
- **GRACEFUL DEGRADATION:** Ensure system degrades gracefully if issues occur

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
- Import path updates (if any)
- Cross-app impact assessment (if shared code touched)
```

## COPY PACK — MFA App

**Paste into Windsurf agent prompt (standalone pack).**

**Context / invariants (keep as-is):**
- Repo root: `.` 
- Apps live under `src/apps/{oauth,mfa,flows,unified}/` and shared code under `src/shared/`.
- Import rules: app code uses `@/apps/{app}/...`, shared uses `@/shared/...`.
- Cross-app blast-radius commands:
  - `npm run check:service -- <serviceName>` (who uses a service)
  - `npm run check:app -- <appName>` (what an app uses)
  - `npm run check:services:report` (full dependency report)

```text
MFA App – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
App Location: src/apps/mfa/
Must follow:
- SWE-15: SWE-15_UNIFIED_MFA_GUIDE.md
- Inventory: project/inventory/UNIFIED_MFA_INVENTORY.md
- Architecture: Use @/apps/mfa/... for MFA-specific imports
- Shared: Use @/shared/... for shared services

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset flows/state unexpectedly
- use legacy v8 import paths when new app structure exists

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- use @/apps/mfa/... for MFA-specific imports
- test cross-app functionality when touching shared code
- **REGRESSION PREVENTION:** Always validate backward compatibility
- **BREAKING CHANGE MITIGATION:** Use feature flags for risky changes
- **MFA-SPECIFIC:** Preserve user authentication state and device registrations

If you cannot meet the above, do not proceed—explain what's blocking and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching "issue hotspot" in project/inventory/UNIFIED_MFA_INVENTORY.md.
- Check if imports use new modular structure (@/apps/mfa/...).
- **CROSS-APP SERVICE CHECK:** If touching shared services, run `npm run check:service -- <serviceName>` to identify all affected apps
- **BACKWARD COMPATIBILITY CHECK:** Identify any API contracts that could be broken
- **RISK ASSESSMENT:** Rate change risk (LOW/MEDIUM/HIGH) and justify
- **MFA STATE IMPACT:** Assess impact on user authentication state and device registrations
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: npm run build (verify build success)
- If server-impacting: restart services as needed
- Confirm services healthy per the guide.
- **BASELINE VERIFICATION:** Capture current state before changes (screenshots, logs, test results)
- **MFA STATE BACKUP:** Document current MFA device registrations and user states

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Update import paths to use @/apps/mfa/... structure.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.
- **BREAKING CHANGE PROTECTION:** 
  - Use feature flags for new behavior
  - Maintain old API alongside new API when possible
  - Add deprecation warnings for removed functionality
  - Preserve existing return types and method signatures
- **MFA-SPECIFIC PROTECTIONS:**
  - Never invalidate existing user sessions unless absolutely necessary
  - Preserve device registrations and user preferences
  - Maintain backward compatibility with existing MFA flows
  - Test all MFA device types (SMS, Email, FIDO2, Mobile OTP)

4) Verify (provide proof)
- Run build: npm run build (must pass)
- Run lint: npm run lint (must pass)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or MFA equivalent).
  - If a check for this bug class doesn't exist, add it and ensure it FAILS non-zero on regressions.
- **CROSS-APP VERIFICATION:** If shared code changed, test all apps identified by `npm run check:service -- <serviceName>`
- **BACKWARD COMPATIBILITY TESTS:** Test existing integrations still work
- **REGRESSION TESTS:** Run full test suite to ensure no regressions
- **MFA-SPECIFIC TESTS:** Test all MFA flows and device types
- **AUTHENTICATION TESTS:** Verify user can authenticate with all methods
- Test MFA app functionality specifically
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why
  - import path changes made
  - **cross-app impact analysis results**
  - **backward compatibility verification**
  - **regression test results**
  - **MFA flow verification results**

5) Inventory Update (so it can't happen again)
Update project/inventory/UNIFIED_MFA_INVENTORY.md with:
- Where it arises (paths/modules - use new @/apps/mfa/... paths)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short "how to verify" snippet
- Import path requirements for MFA app
- **Cross-app dependencies** if shared services were touched
- **API Contract Documentation:** Document service interfaces and expected behaviors
- **Regression Prevention Rules:** Add specific rules to prevent this regression
- **Breaking Change Policy:** Document when breaking changes are acceptable and process required
- **MFA-SPECIFIC RULES:** Add rules to protect user authentication state

6) Cross-App Service Impact (if shared services touched)
If you modified shared services:
- **Document Impact:** List all apps affected by the service change
- **Testing Evidence:** Show test results for each affected app (especially MFA)
- **Rollback Plan:** Include rollback strategy if issues arise
- **Update Documentation:** Update service documentation and affected app docs
- **Migration Guide:** If breaking changes unavoidable, provide migration guide
- **Version Strategy:** Document service versioning and compatibility matrix
- **Communication Plan:** Document how to notify dependent teams of changes
- **MFA IMPACT ASSESSMENT:** Document specific impact on MFA flows and user experience

7) Post-Deployment Monitoring (if deployed)
- **MONITORING:** Set up alerts for service failures or performance degradation
- **ROLLBACK READINESS:** Ensure quick rollback capability (within 5 minutes)
- **OBSERVABILITY:** Monitor error rates, response times, and user experience metrics
- **GRACEFUL DEGRADATION:** Ensure system degrades gracefully if issues occur
- **MFA-SPECIFIC MONITORING:** Monitor authentication success rates, device registration issues
- **USER EXPERIENCE MONITORING:** Track MFA flow completion rates and user feedback

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
- Import path updates (if any)
- Cross-app impact assessment (if shared code touched)
- MFA flow verification results
```

## COPY PACK — Flows App

**Paste into Windsurf agent prompt (standalone pack).**

**Context / invariants (keep as-is):**
- Repo root: `.` 
- Apps live under `src/apps/{oauth,mfa,flows,unified}/` and shared code under `src/shared/`.
- Import rules: app code uses `@/apps/{app}/...`, shared uses `@/shared/...`.
- Cross-app blast-radius commands:
  - `npm run check:service -- <serviceName>` (who uses a service)
  - `npm run check:app -- <appName>` (what an app uses)
  - `npm run check:services:report` (full dependency report)

```text
Flows App – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
App Location: src/apps/flows/
Must follow:
- SWE-15: Create SWE-15_FLOWS_GUIDE.md if not exists
- Inventory: project/inventory/FLOWS_INVENTORY.md (create if not exists)
- Architecture: Use @/apps/flows/... for Flows-specific imports
- Shared: Use @/shared/... for shared services

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset flows/state unexpectedly
- use legacy v8 import paths when new app structure exists

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- use @/apps/flows/... for Flows-specific imports
- test cross-app functionality when touching shared code
- **REGRESSION PREVENTION:** Always validate backward compatibility
- **BREAKING CHANGE MITIGATION:** Use feature flags for risky changes
- **FLOW-SPECIFIC:** Preserve flow state management and step transitions

If you cannot meet the above, do not proceed—explain what's blocking and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching "issue hotspot" in project/inventory/FLOWS_INVENTORY.md.
- Check if imports use new modular structure (@/apps/flows/...).
- **CROSS-APP SERVICE CHECK:** If touching shared services, run `npm run check:service -- <serviceName>` to identify all affected apps
- **BACKWARD COMPATIBILITY CHECK:** Identify any API contracts that could be broken
- **RISK ASSESSMENT:** Rate change risk (LOW/MEDIUM/HIGH) and justify
- **FLOW STATE IMPACT:** Assess impact on flow state management and step transitions
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: npm run build (verify build success)
- If server-impacting: restart services as needed
- Confirm services healthy per the guide.
- **BASELINE VERIFICATION:** Capture current state before changes (screenshots, logs, test results)
- **FLOW STATE BACKUP:** Document current flow configurations and step sequences

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Update import paths to use @/apps/flows/... structure.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.
- **BREAKING CHANGE PROTECTION:** 
  - Use feature flags for new behavior
  - Maintain old API alongside new API when possible
  - Add deprecation warnings for removed functionality
  - Preserve existing return types and method signatures
- **FLOW-SPECIFIC PROTECTIONS:**
  - Never break existing flow step sequences
  - Preserve flow state persistence and recovery
  - Maintain backward compatibility with flow configurations
  - Test all flow types and step transitions

4) Verify (provide proof)
- Run build: npm run build (must pass)
- Run lint: npm run lint (must pass)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or Flows equivalent).
  - If a check for this bug class doesn't exist, add it and ensure it FAILS non-zero on regressions.
- **CROSS-APP VERIFICATION:** If shared code changed, test all apps identified by `npm run check:service -- <serviceName>`
- **BACKWARD COMPATIBILITY TESTS:** Test existing integrations still work
- **REGRESSION TESTS:** Run full test suite to ensure no regressions
- **FLOW-SPECIFIC TESTS:** Test all flow types and step transitions
- **STATE MANAGEMENT TESTS:** Verify flow state persistence and recovery
- Test Flows app functionality specifically
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why
  - import path changes made
  - **cross-app impact analysis results**
  - **backward compatibility verification**
  - **regression test results**
  - **flow state verification results**

5) Inventory Update (so it can't happen again)
Update project/inventory/FLOWS_INVENTORY.md with:
- Where it arises (paths/modules - use new @/apps/flows/... paths)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short "how to verify" snippet
- Import path requirements for Flows app
- **Cross-app dependencies** if shared services were touched
- **API Contract Documentation:** Document service interfaces and expected behaviors
- **Regression Prevention Rules:** Add specific rules to prevent this regression
- **Breaking Change Policy:** Document when breaking changes are acceptable and process required
- **FLOW-SPECIFIC RULES:** Add rules to protect flow state and step transitions

6) Cross-App Service Impact (if shared services touched)
If you modified shared services:
- **Document Impact:** List all apps affected by the service change
- **Testing Evidence:** Show test results for each affected app (especially Flows)
- **Rollback Plan:** Include rollback strategy if issues arise
- **Update Documentation:** Update service documentation and affected app docs
- **Migration Guide:** If breaking changes unavoidable, provide migration guide
- **Version Strategy:** Document service versioning and compatibility matrix
- **Communication Plan:** Document how to notify dependent teams of changes
- **FLOW IMPACT ASSESSMENT:** Document specific impact on flow management and state

7) Post-Deployment Monitoring (if deployed)
- **MONITORING:** Set up alerts for service failures or performance degradation
- **ROLLBACK READINESS:** Ensure quick rollback capability (within 5 minutes)
- **OBSERVABILITY:** Monitor error rates, response times, and user experience metrics
- **GRACEFUL DEGRADATION:** Ensure system degrades gracefully if issues occur
- **FLOW-SPECIFIC MONITORING:** Monitor flow completion rates, step transition failures
- **STATE MONITORING:** Track flow state persistence and recovery issues

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
- Import path updates (if any)
- Cross-app impact assessment (if shared code touched)
- Flow state verification results
```

## COPY PACK — Unified App

**Paste into Windsurf agent prompt (standalone pack).**

**Context / invariants (keep as-is):**
- Repo root: `.` 
- Apps live under `src/apps/{oauth,mfa,flows,unified}/` and shared code under `src/shared/`.
- Import rules: app code uses `@/apps/{app}/...`, shared uses `@/shared/...`.
- Cross-app blast-radius commands:
  - `npm run check:service -- <serviceName>` (who uses a service)
  - `npm run check:app -- <appName>` (what an app uses)
  - `npm run check:services:report` (full dependency report)

```text
Unified App – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
App Location: src/apps/unified/
Must follow:
- SWE-15: Create SWE-15_UNIFIED_GUIDE.md if not exists
- Inventory: project/inventory/UNIFIED_APP_INVENTORY.md (create if not exists)
- Architecture: Use @/apps/unified/... for Unified-specific imports
- Shared: Use @/shared/... for shared services

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset flows/state unexpectedly
- use legacy v8 import paths when new app structure exists

You MUST:
- choose the smallest safest fix
- treat shared flows/services/components as HIGH RISK
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- use @/apps/unified/... for Unified-specific imports
- test cross-app functionality when touching shared code

If you cannot meet the above, do not proceed—explain what's blocking and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- Find the matching "issue hotspot" in project/inventory/UNIFIED_APP_INVENTORY.md.
- Check if imports use new modular structure (@/apps/unified/...).
- **CROSS-APP SERVICE CHECK:** If touching shared services, run `npm run check:service -- <serviceName>` to identify all affected apps
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for flow/server-impacting work)
- From repo root run: npm run build (verify build success)
- If server-impacting: restart services as needed
- Confirm services healthy per the guide.

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Update import paths to use @/apps/unified/... structure.
- Do not alter behavior outside the target path.
- If you touch shared flows/services/components, assume cross-app blast radius and treat as HIGH RISK.

4) Verify (provide proof)
- Run build: npm run build (must pass)
- Run lint: npm run lint (must pass)
- Run SWE-15 test/build steps.
- Run the regression gate: ./comprehensive-inventory-check.sh (or Unified equivalent).
  - If a check for this bug class doesn't exist, add it and ensure it FAILS non-zero on regressions.
- **CROSS-APP VERIFICATION:** If shared code changed, test all apps identified by `npm run check:service -- <serviceName>`
- Test Unified app functionality specifically
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why
  - import path changes made
  - **cross-app impact analysis results**

5) Inventory Update (so it can't happen again)
Update project/inventory/UNIFIED_APP_INVENTORY.md with:
- Where it arises (paths/modules - use new @/apps/unified/... paths)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short "how to verify" snippet
- Import path requirements for Unified app
- **Cross-app dependencies** if shared services were touched

6) Cross-App Service Impact (if shared services touched)
If you modified shared services:
- **Document Impact:** List all apps affected by the service change
- **Testing Evidence:** Show test results for each affected app (especially Unified)
- **Rollback Plan:** Include rollback strategy if issues arise
- **Update Documentation:** Update service documentation and affected app docs

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
- Import path updates (if any)
- Cross-app impact assessment (if shared code touched)
```

## COPY PACK — Shared Services (HIGH RISK)

**Paste into Windsurf agent prompt (standalone pack).**

**Context / invariants (keep as-is):**
- Repo root: `.` 
- Apps live under `src/apps/{oauth,mfa,flows,unified}/` and shared code under `src/shared/`.
- Import rules: app code uses `@/apps/{app}/...`, shared uses `@/shared/...`.
- Cross-app blast-radius commands:
  - `npm run check:service -- <serviceName>` (who uses a service)
  - `npm run check:app -- <appName>` (what an app uses)
  - `npm run check:services:report` (full dependency report)

```text
Shared Services – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Services Location: src/shared/services/
Must follow:
- SWE-15: Create SWE-15_SHARED_SERVICES_GUIDE.md if not exists
- Inventory: project/inventory/SHARED_SERVICES_INVENTORY.md (create if not exists)
- Architecture: Use @/shared/... for shared services
- Impact: HIGH RISK - affects ALL apps

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

🚨 HIGH RISK: Shared services affect ALL apps (OAuth, MFA, Flows, Unified)

You MUST NOT:
- ship a fix without proof (tests + gate passing)
- introduce any new failing checks
- widen behavior changes beyond the targeted path
- add "defaults/fallbacks" that can reset flows/state unexpectedly
- break backward compatibility without explicit migration plan

You MUST:
- choose the smallest safest fix
- maintain backward compatibility when possible
- ensure the regression gate catches this bug class going forward (fail non-zero)
- update the inventory so this regression cannot reappear unnoticed
- **ALWAYS** run `npm run check:service -- <serviceName>` before changes
- test ALL dependent apps after changes
- **CRITICAL:** Use semantic versioning for all shared service changes
- **MANDATORY:** Document breaking changes with migration guides
- **ZERO-TOLERANCE:** No breaking changes without explicit approval process

If you cannot meet the above, do not proceed—explain what's blocking and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (apps/services/flows impacted).
- **MANDATORY:** Run `npm run check:service -- <serviceName>` to identify ALL affected apps
- Find the matching "issue hotspot" in project/inventory/SHARED_SERVICES_INVENTORY.md.
- **BACKWARD COMPATIBILITY ASSESSMENT:** Identify ALL API contracts that could be broken
- **RISK ASSESSMENT:** Rate change risk (LOW/MEDIUM/HIGH/CRITICAL) and justify
- **DEPENDENCY ANALYSIS:** Document all apps, services, and external integrations affected
- **BREAKING CHANGE EVALUATION:** Determine if change is breaking and requires migration
- **VERSION IMPACT:** Determine semantic version bump required (patch/minor/major)
- Propose the smallest safe fix. Call out any risky/broad changes explicitly.

2) Clean Restart Policy (required for shared service changes)
- From repo root run: npm run build (verify build success)
- If server-impacting: restart services as needed
- Confirm services healthy per the guide.
- **BASELINE CAPTURE:** Document current service behavior and app integrations
- **DEPENDENT APPS VERIFICATION:** Confirm all dependent apps are working before changes
- **SERVICE CONTRACT DOCUMENTATION:** Capture current API contracts and behaviors

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Maintain backward compatibility when possible
- Do not alter behavior outside the target path.
- **CRITICAL:** Assume cross-app blast radius for ALL apps
- **BREAKING CHANGE PROTECTION:** 
  - Use feature flags for new behavior
  - Maintain old API alongside new API when possible
  - Add deprecation warnings for removed functionality
  - Preserve existing return types and method signatures
  - Use adapter pattern for API changes when possible
- **SHARED SERVICE PROTECTIONS:**
  - Never remove or modify existing service methods without deprecation
  - Maintain backward compatibility for at least one major version
  - Add new methods instead of modifying existing ones
  - Use semantic versioning consistently
  - Document all breaking changes with migration paths

4) Verify (provide proof)
- Run build: npm run build (must pass)
- Run lint: npm run lint (must pass)
- Run SWE-15 test/build steps.
- **MANDATORY:** Test ALL apps identified by `npm run check:service -- <serviceName>`
- **COMPREHENSIVE INTEGRATION TESTS:** Test all app integrations with shared service
- **BACKWARD COMPATIBILITY TESTS:** Test existing integrations still work
- **REGRESSION TESTS:** Run full test suite across ALL apps
- **API CONTRACT TESTS:** Verify all service contracts are maintained
- **DEPENDENCY VERIFICATION:** Confirm all dependent apps function correctly
- **PERFORMANCE TESTS:** Ensure no performance degradation in dependent apps
- Run the regression gate: ./comprehensive-inventory-check.sh (or Shared Services equivalent).
  - If a check for this bug class doesn't exist, add it and ensure it FAILS non-zero on regressions.
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why
  - **complete cross-app impact analysis results**
  - **backward compatibility verification for ALL apps**
  - **comprehensive regression test results**
  - **service contract verification**

5) Inventory Update (so it can't happen again)
Update project/inventory/SHARED_SERVICES_INVENTORY.md with:
- Where it arises (paths/modules - use new @/shared/... paths)
- Prevention commands (grep/tests) that detect this regression
- Gate notes (CI-friendly, fail non-zero)
- A short "how to verify" snippet
- **Complete list of all affected apps**
- **Service API Documentation:** Document all service interfaces and contracts
- **Regression Prevention Rules:** Add specific rules to prevent this regression
- **Breaking Change Policy:** Document when breaking changes are acceptable and approval process
- **Version Management:** Document semantic versioning strategy and compatibility matrix
- **Dependency Mapping:** Map all service dependencies and their impact

6) Cross-App Service Impact (MANDATORY for shared services)
If you modified shared services:
- **Document Impact:** List ALL apps affected by the service change
- **Testing Evidence:** Show test results for EACH affected app
- **Rollback Plan:** Include rollback strategy if issues arise (must be <5 minutes)
- **Update Documentation:** Update service documentation and ALL affected app docs
- **Migration Guide:** If breaking changes unavoidable, provide comprehensive migration guide
- **Version Strategy:** Document service versioning and compatibility matrix
- **Communication Plan:** Document how to notify ALL dependent teams of changes
- **Impact Assessment:** Document specific impact on each app and integration
- **Performance Impact:** Document any performance changes across all apps

7) Breaking Change Process (MANDATORY if breaking changes)
If breaking changes are unavoidable:
- **APPROVAL PROCESS:** Must get explicit approval from all dependent app teams
- **MIGRATION TIMELINE:** Provide clear timeline for migration (minimum 6 months)
- **DUAL SUPPORT:** Maintain old and new APIs simultaneously during migration
- **DOCUMENTATION:** Provide comprehensive migration guides and examples
- **SUPPORT:** Provide support for teams during migration period
- **MONITORING:** Monitor usage of deprecated APIs and migration progress

8) Post-Deployment Monitoring (MANDATORY for shared services)
- **COMPREHENSIVE MONITORING:** Set up alerts for service failures across ALL apps
- **ROLLBACK READINESS:** Ensure immediate rollback capability (within 2 minutes)
- **OBSERVABILITY:** Monitor error rates, response times, and user experience across ALL apps
- **GRACEFUL DEGRADATION:** Ensure ALL apps degrade gracefully if issues occur
- **SERVICE METRICS:** Monitor service health, performance, and usage patterns
- **DEPENDENT APP MONITORING:** Monitor health and performance of all dependent apps
- **API USAGE MONITORING:** Track API usage patterns and detect anomalies
- **PERFORMANCE MONITORING:** Monitor performance impact across all dependent apps
- **CRITICAL:** Assume cross-app blast radius for ALL apps

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence
- Inventory diffs (what you added/where)
- **Complete cross-app impact assessment**
- **Testing evidence for ALL affected apps**
```

## COPY PACK — Modular Architecture (boundaries + imports)

**Paste into Windsurf agent prompt (standalone pack).**

**Context / invariants (keep as-is):**
- Repo root: `.` 
- Apps live under `src/apps/{oauth,mfa,flows,unified}/` and shared code under `src/shared/`.
- Import rules: app code uses `@/apps/{app}/...`, shared uses `@/shared/...`.
- Cross-app blast-radius commands:
  - `npm run check:service -- <serviceName>` (who uses a service)
  - `npm run check:app -- <appName>` (what an app uses)
  - `npm run check:services:report` (full dependency report)

```text
Modular App Architecture – NO-REGRESSION Fix Workflow (Windsurf)

Repo: .
Architecture: src/apps/{oauth,mfa,flows,unified} + src/shared/

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

🏗️ ARCHITECTURE RULES (NON-NEGOTIABLE):
- App-specific code MUST live in src/apps/{app}/
- Shared code MUST live in src/shared/
- Import paths MUST use @/apps/{app}/... or @/shared/...
- Cross-app imports MUST be explicit and tested

🛑 STOP-SHIP / NO REGRESSIONS (NON-NEGOTIABLE)
REGRESSION = FAILURE. If anything breaks, is uncertain, or expands blast radius, STOP and change approach.

You MUST NOT:
- ship a fix without proof (build + lint + functional tests)
- introduce any new failing checks
- break import path contracts between apps
- modify shared services without testing all dependent apps
- add legacy v8 imports when new app structure exists

You MUST:
- choose the smallest safest fix
- treat shared services as HIGH RISK (affects all apps)
- ensure build passes (npm run build)
- ensure lint passes (npm run lint)
- test cross-app functionality when touching shared code
- update import paths to use new modular structure

If you cannot meet the above, do not proceed—explain what's blocking and propose a safer plan.

1) Baseline + Scope (before any code)
- Reproduce the bug and describe scope (which app(s)/services impacted).
- Identify if it's an app-specific issue or shared service issue.
- Check import paths are using new modular structure.
- **CROSS-APP SERVICE CHECK:** If touching shared services, run `npm run check:service -- <serviceName>` to identify all affected apps
- Propose the smallest safe fix. Call out any risky cross-app changes explicitly.

2) Clean Restart Policy (required for build/server-impacting work)
- From repo root run: npm run build (verify build success)
- If server-impacting: restart services as needed
- Confirm build passes BEFORE repro and AFTER fix

3) Implement (minimal diff, controlled blast radius)
- Make the smallest change that fixes the bug.
- Update import paths to use new modular structure if needed.
- Do not alter behavior outside the target path.
- If touching shared services, test ALL dependent apps.

4) Verify (provide proof)
- Run build: npm run build (must pass)
- Run lint: npm run lint (must pass)
- Test affected app(s) functionality
- **CROSS-APP VERIFICATION:** If shared code changed, test all apps identified by `npm run check:service -- <serviceName>`
- In your response include:
  - commands run (copy/paste)
  - pass/fail summary
  - files changed + why
  - import path changes made

5) Import Path Update (if applicable)
If you modified import paths:
- Ensure all imports use new modular structure:
  - App-specific: @/apps/{app}/services/...
  - Shared: @/shared/services/...
- Verify no legacy v8 imports remain where new structure exists
- Test that all cross-app imports work correctly

6) Cross-App Service Impact (if shared services touched)
If you modified shared services:
- **Document Impact:** List all apps affected by the service change
- **Testing Evidence:** Show test results for each affected app
- **Rollback Plan:** Include rollback strategy if issues arise
- **Update Documentation:** Update service documentation and affected app docs

DELIVERABLES
- Root cause (why it happened)
- Fix summary (what changed)
- Verification evidence (build + lint + functional tests)
- Import path changes (if any)
- Cross-app impact assessment (if shared code touched)
```

---
## Appendix — Troubleshooting

## 🔧 TROUBLESHOOTING: Common Modular Architecture Issues

### 🚨 Cross-App Service Issues
**Problem:** Service update breaks multiple apps unexpectedly
**Solution:**
- Run `npm run check:service -- <serviceName>` before updating
- Review affected apps and files
- Test all affected apps after service update
- Use `npm run check:services:report` for comprehensive analysis

### 🚨 Import Path Issues
**Problem:** `Cannot find module '@/apps/mfa/services/mfaServiceV8'`
**Solution:** 
- Ensure the file exists in `src/apps/mfa/services/`
- Check import path spelling and structure
- Run `npm run build` to verify all imports resolve

### 🚨 Build Failures
**Problem:** Build fails after import path changes
**Solution:**
- Check for circular dependencies between apps
- Verify shared service imports are correct
- Run `npm run build --verbose` for detailed error info
- Ensure no legacy v8 imports conflict with new structure

### 🚨 Cross-App Functionality Issues
**Problem:** Changes in shared service break multiple apps
**Solution:**
- Test ALL dependent apps after shared service changes
- Use `npm run build` to verify cross-app compilation
- Check import paths in all affected apps
- Consider version pinning for shared services

### 🚨 Lint Configuration Issues
**Problem:** Lint shows errors from backup/locked files
**Solution:**
- Lint is configured to ignore `**/*_BACKUP*`, `**/locked/**` patterns
- Update `.biomeignore` if new ignore patterns needed
- Focus on errors from `src/apps/` and `src/shared/` only

### 🚨 Module Resolution Issues
**Problem:** TypeScript can't find modules after restructuring
**Solution:**
- Verify `tsconfig.json` includes path mappings for `@/apps/` and `@/shared/`
- Check `vite.config.ts` for alias configurations
- Ensure all files are in correct directory structure

---

---
## Appendix — Comprehensive regression prevention strategies

## 🛡️ COMPREHENSIVE REGRESSION PREVENTION STRATEGIES

### 🎯 Pre-Change Prevention
**Before Making Any Changes:**
- **Impact Analysis:** Always run `npm run check:service -- <serviceName>` for shared services
- **Risk Assessment:** Rate changes as LOW/MEDIUM/HIGH/CRITICAL
- **Backward Compatibility Check:** Identify all API contracts that could be broken
- **Dependency Mapping:** Document all affected apps and integrations
- **Baseline Capture:** Document current state (screenshots, logs, test results)

### 🔒 Breaking Change Prevention
**Never Make Breaking Changes Without:**
- **Feature Flags:** Use feature flags for new behavior
- **Dual API Support:** Maintain old and new APIs simultaneously
- **Deprecation Warnings:** Add warnings for removed functionality
- **Migration Guides:** Provide comprehensive migration paths
- **Approval Process:** Get explicit approval from all dependent teams
- **Timeline:** Provide minimum 6 months migration period

### 📋 Service Update Checklist
**Before Updating Any Service:**
- [ ] Run `npm run check:service -- <serviceName>` to identify impact
- [ ] Assess backward compatibility impact
- [ ] Document all affected apps and integrations
- [ ] Create rollback plan (must be <5 minutes for shared services)
- [ ] Set up monitoring and alerts
- [ ] Prepare migration guide if breaking changes
- [ ] Get approval from all dependent teams (for shared services)

### 🧪 Testing Requirements
**Mandatory Testing for Service Changes:**
- **Unit Tests:** All service unit tests must pass
- **Integration Tests:** Test all app integrations
- **Regression Tests:** Run full test suite across all affected apps
- **API Contract Tests:** Verify all service contracts maintained
- **Performance Tests:** Ensure no performance degradation
- **End-to-End Tests:** Test complete user flows

### 📊 Monitoring Requirements
**Post-Deployment Monitoring:**
- **Service Health:** Monitor service health and performance
- **Error Rates:** Set up alerts for increased error rates
- **Response Times:** Monitor for performance degradation
- **Usage Patterns:** Track API usage and detect anomalies
- **Dependent Apps:** Monitor health of all dependent apps
- **Rollback Readiness:** Ensure immediate rollback capability

### 🔄 Version Management
**Semantic Versioning Requirements:**
- **Patch (x.x.1):** Backward compatible bug fixes
- **Minor (x.1.x):** Backward compatible new features
- **Major (1.x.x):** Breaking changes (requires approval process)
- **Compatibility Matrix:** Document version compatibility
- **Deprecation Policy:** Maintain backward compatibility for at least one major version

### 📚 Documentation Requirements
**Required Documentation for Service Changes:**
- **API Documentation:** Update all service interfaces
- **Change Log:** Document all changes and their impact
- **Migration Guides:** Provide step-by-step migration instructions
- **Impact Assessment:** Document impact on all dependent apps
- **Rollback Procedures:** Document rollback steps and timelines

### 🚨 Emergency Procedures
**If Issues Occur After Deployment:**
1. **Immediate Rollback:** Execute rollback within 5 minutes (shared services)
2. **Impact Assessment:** Identify all affected apps and users
3. **Communication:** Notify all dependent teams immediately
4. **Root Cause Analysis:** Investigate and document the issue
5. **Prevention Measures:** Update procedures to prevent recurrence
6. **Post-Mortem:** Conduct thorough post-mortem and share learnings

### 📋 Regression Prevention Checklist
**Before Any Service Update:**
- [ ] Impact analysis completed
- [ ] All dependent apps identified
- [ ] Backward compatibility assessed
- [ ] Risk level determined and justified
- [ ] Rollback plan prepared
- [ ] Monitoring configured
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Approval obtained (if required)
- [ ] Migration guide prepared (if needed)

### 🎯 Quality Gates
**Mandatory Quality Gates:**
- **Build:** `npm run build` must pass
- **Lint:** `npm run lint` must pass
- **Tests:** All tests must pass
- **Integration:** All app integrations must work
- **Performance:** No performance degradation
- **Security:** No security vulnerabilities introduced

---

*Last Updated: 2025-02-19*
*Version: 2.0 - Modular Architecture Edition with Comprehensive Regression Prevention*
