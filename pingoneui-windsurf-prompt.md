# Windsurf Prompt — Finish PingOne UI Migration Safely (to 100%)

You are Windsurf operating inside this repo. Your mission is to safely complete the PingOne UI migration to 100% with **no behavior regressions**, while also reducing **lint errors** and ensuring **full tests pass after each app update**.

## CONTEXT (READ FIRST)
- The repo is mid-migration to PingOne UI standards: MDI CSS icons, Ping UI variables, `.end-user-nano` namespace, and accessibility improvements.
- Work must be incremental, PR-friendly, and low-risk.

## NON-NEGOTIABLE SAFETY RULES
1) **Do not change business logic** (API calls, auth semantics, routing behavior, data model).
2) **Do not break tests or builds**. If something fails, fix it or clearly document why it’s unrelated.
3) **Do not introduce new lint errors**. Fix lint errors in any file you touch.
4) **Do not do repo-wide reformatting**. Limit formatting changes to what lint requires in files you touched.
5) Preserve test selectors (`data-testid`, stable IDs) and existing DOM structure where possible.

---

## PHASE 0 — DISCOVERY (MANDATORY)
A) Identify the repo’s scripts and standards:
- Find the commands in `package.json` / workspace tools:
  - lint command (e.g., `npm run lint`)
  - test command(s) (unit/component)
  - typecheck command (if separate)
  - build command(s)
  - e2e command(s) if present

B) Establish baselines **before making changes**:
- Run lint and record baseline error/warn counts (brief).
- Run the test suite for the primary app (or the default test command) and record baseline status.
- Run a build once to confirm the baseline compiles.

C) Locate patterns already used in migrated components:
- Look for a reusable MDI icon helper (if present) and reuse it.
- Look for `PingUIWrapper` (or similar) and reuse it.
- Look for `.end-user-nano` application at the app shell and ensure it stays correct.

---

## PHASE 1 — COMPLETE REMAINING UI MIGRATIONS (PRIMARY TASK)
### Target list (work in this order)
1) High priority components first:
- `AdvancedConfiguration.tsx`
- `ClientGenerator.tsx`
- `OAuthCodeGeneratorHub.tsx`
- `AIIdentityArchitectures.tsx`

2) Then medium priority:
- `PostmanCollectionGenerator.PingUI.tsx`
- `EnvironmentManagementPageV8.PingUI.tsx`
- `SDKExamplesHome.PingUI.tsx`
- `HelioMartPasswordReset.PingUI.tsx`

3) Then low priority:
- `UltimateTokenDisplayDemo.tsx`
- `ApiStatusPage.PingUI.tsx`
- `TokenExchangeFlowV9.tsx`

### Migration standards to apply in each component
A) Icons
- Replace React Icons (or other JS icon libs) with MDI CSS icons:
  - `<i class="mdi mdi-ICON_NAME" aria-hidden="true"></i>`
- If the icon is in an interactive control:
  - put the accessible name on the button/link: `aria-label="…"`
  - keep `<i>` `aria-hidden="true"`.

B) Ping UI variables + transitions
- Replace hard-coded colors/spacing with Ping UI variables where feasible.
- Ensure all hover/interactive transitions use **0.15s ease-in-out**.

C) Namespace
- Ensure all UI rendered is under `.end-user-nano`.
- Do not leak global CSS outside the namespace.

D) Accessibility
- Ensure semantic elements (button vs div).
- Ensure visible focus states and keyboard access.
- Ensure form errors are associated with inputs (`aria-describedby`, `id/for`).

E) Keep component behavior identical
- Same input/output, same API calls, same side effects.
- No logic refactors unless required to fix an actual bug.

---

## PHASE 2 — LINT FIXES (AS YOU GO)
While updating each component:
- Fix lint errors in that file and any directly related touched files.
- Prefer safe fixes:
  - remove unused imports/vars
  - replace obvious `any` with correct types when trivial
  - correct JSX a11y lint issues (e.g., icon-only buttons, missing labels)
- If `eslint --fix` exists, run it **only on changed files** (not the whole repo).

**Exit requirement per component batch:** no new lint errors introduced.

---

## PHASE 3 — FULL TESTING AFTER EACH APP UPDATE (MANDATORY)
After you finish updating an app/module area (e.g., MFA app, OAuth app, Protect app, or any standalone app in a monorepo):
1) Run lint (confirm no errors).
2) Run typecheck (if separate).
3) Run unit/component tests for that app.
4) Run build for that app.
5) Run e2e tests if they are part of normal CI expectations.

Only after tests are green for that app may you move to the next app.

---

## PHASE 4 — FINAL GATES (MANDATORY)
At the end, run:
- full lint (repo standard)
- full test suite (repo standard)
- full build (repo standard)
- e2e (if required by repo)

---

## REQUIRED OUTPUT (REPORT BACK)
When you finish, report:
1) **Changed files list** (and new files).
2) Progress update:
   - which remaining components are now migrated
   - what remains (if any)
3) Lint results:
   - baseline vs final error counts (brief)
4) Testing results:
   - commands run and pass/fail
   - confirm “full testing after each app update” was done
5) Any risks or follow-ups:
   - smallest possible remaining items, with file paths and rationale

---

## MIGRATION STATUS UPDATE

### ✅ **COMPLETED MIGRATIONS**

#### **Critical Bug Fixes (Phase 0)**
1. **CIBAFlowV9.tsx** - Fixed critical runtime error
   - ✅ Added missing `useCibaFlowV8Enhanced` import
   - ✅ Fixed async credentials loading
   - ✅ Removed unused imports

2. **Sidebar.tsx** - Fixed styling regression
   - ✅ Reverted to original `DragDropSidebar` to restore styling
   - ✅ V2 file preserved for future Ping UI implementation

#### **UserSearchDropdown Integration (Previous Session)**
1. **RedirectlessFlowV9_Real.tsx** - ✅ Migrated
   - ✅ Replaced basic username input with `UserSearchDropdownV8`
   - ✅ Conditional rendering based on environmentId
   - ✅ Fixed duplicate htmlFor attributes

2. **OAuth2ResourceOwnerPasswordFlow.tsx** - ✅ Migrated
   - ✅ Replaced username input with `UserSearchDropdownV8`
   - ✅ Integrated with existing credential management

3. **OAuthROPCFlowV7.tsx** - ✅ Migrated
   - ✅ Added `UserSearchDropdownV8` with conditional fallback
   - ✅ Preserved V7 badge styling

#### **Ping UI Components (Already Migrated)**
1. **Modal Components** - ✅ Complete
   - `WorkerTokenModal.tsx` - MDI icons + Ping UI namespace
   - `WorkerTokenRequestModal.tsx` - MDI icons + Ping UI namespace
   - `FlowErrorDisplay.tsx` - Comprehensive icon mapping system

2. **Enhanced Logging System** - ✅ Complete
   - `enhancedLoggingService.ts` - Colors, icons, banners
   - `server.js` - Enhanced server-side logging
   - `EnhancedLoggingDemo.tsx` - Interactive demo component

3. **Dashboard Updates** - ✅ Complete
   - `Dashboard.PingUI.tsx` - PingOne API status integration
   - Navigation structure updated with Dashboard group

### 🔄 **REMAINING MIGRATIONS**

#### **High Priority Components**
1. **AdvancedConfiguration.tsx** - PENDING
   - React Icons → MDI CSS icons
   - Ping UI variables and transitions

2. **ClientGenerator.tsx** - PENDING
   - Icon migration needed
   - Ping UI styling patterns

3. **OAuthCodeGeneratorHub.tsx** - PENDING
   - Multiple icon instances
   - Form styling updates

4. **AIIdentityArchitectures.tsx** - PENDING
   - Complex UI with many icons
   - Accessibility improvements

#### **Medium Priority Components**
1. **PostmanCollectionGenerator.PingUI.tsx** - PENDING
   - Already has Ping UI naming but needs icon migration
   - Form and button standardization

2. **EnvironmentManagementPageV8.PingUI.tsx** - PENDING
   - V8 component needs Ping UI compliance
   - Table and form styling

3. **SDKExamplesHome.PingUI.tsx** - PENDING
   - Multiple example components
   - Icon and styling migration

4. **HelioMartPasswordReset.PingUI.tsx** - PENDING
   - Form validation and styling
   - Icon migration

#### **Low Priority Components**
1. **UltimateTokenDisplayDemo.tsx** - PENDING
   - Demo component
   - Icon and styling updates

2. **ApiStatusPage.PingUI.tsx** - PENDING
   - Status display components
   - Ping UI variables

3. **TokenExchangeFlowV9.tsx** - PENDING
   - Flow component with forms
   - Icon migration

### 📊 **CURRENT STATUS**

#### **Migration Progress**
- **✅ Completed**: 12+ components (modals, flows, services)
- **🔄 In Progress**: 0 components (current session)
- **⏳ Pending**: 11 components (listed above)

#### **Lint Status**
- **Baseline**: ~50+ lint errors (unused vars, any types, accessibility)
- **Current**: Reduced but still has errors in remaining components
- **Target**: 0 lint errors after migration

#### **Build Status**
- **✅ Current**: Build passes successfully
- **✅ Tests**: Core functionality working
- **✅ No Regressions**: All completed migrations maintain behavior

### 🎯 **NEXT STEPS**

#### **Immediate Actions**
1. **Start with High Priority**: `AdvancedConfiguration.tsx`
2. **Apply Migration Standards**:
   - MDI CSS icons with aria-labels
   - Ping UI variables (0.15s transitions)
   - `.end-user-nano` namespace
   - Accessibility improvements

#### **Testing Strategy**
1. **Per Component**: Lint → Type Check → Build → Test
2. **Per App Area**: Full test suite after batch completion
3. **Final**: Full repo lint/test/build

#### **Risk Mitigation**
1. **Small Changes**: One component at a time
2. **Behavior Preservation**: No logic changes
3. **Regression Testing**: Verify functionality after each migration

---

## IMPLEMENTATION STYLE
- Make small commits / logical steps.
- Keep diffs readable.
- Prefer adapting existing migrated patterns rather than inventing new ones.
- If a change could be risky, implement it behind a small wrapper or minimal refactor, and add a quick regression check.

End goal: **100% migration complete + lint improved + tests green**.
