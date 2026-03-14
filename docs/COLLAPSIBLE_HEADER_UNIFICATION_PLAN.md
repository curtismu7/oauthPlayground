# Collapsible Section Header Unification Plan

**Goal:** Use the same collapse/expand icon, color, size, and behavior. Prefer a single service so icons, colors, and behavior stay consistent.

**Executive summary:** Unify all flow/section collapsible headers on one pattern (⬇️ emoji, white box, blue border, -90° when collapsed). The service (`collapsibleHeaderService`) already exports `UnifiedFlowCollapsibleHeader`, `UnifiedFlowCollapsibleHeaderButton`, and `UnifiedFlowCollapsibleToggleIcon`. ~60% done (Configuration, AdvancedOAuthFeatures, FlowGuidanceSystem, SecurityScorecard, worker-token-v9). Remaining: UnifiedFlowSteps, CollapsibleSection, flowUIService, PAR/RAR, UnifiedOAuthFlowV8U credentials block.

**Table of contents:** [Progress](#progress-last-updated-2026-03) · [0. Safest icon](#0-safest-icon-to-migrate-to-most-common-already) · [1. Current state](#1-current-state-who-uses-what) · [2–7. Differences, phases, risks](#2-differences-to-reconcile) · [8. Implementation steps](#8-implementation-steps) · [9. Migration recipes](#9-migration-recipes-for-implementers) · [10. Plan status](#10-plan-status) · [11. Verification](#11-verification-after-each-migration)

---

**Reference UI:** The Unified OAuth flow step 0 uses:
- **Header:** Light green gradient (`#f0fdf4` → `#ecfdf3`), dark green text (`#14532d`), 1.25rem padding, rounded corners.
- **Toggle icon:** White box, 32×32px, 6px border-radius, 2px solid blue (`#3b82f6`), chevron rotates **-90°** when collapsed (points right when collapsed, down when expanded). Uses emoji ⬇️ in current code; can be replaced with SVG for consistency.
- **Behavior:** Click header toggles section; icon animates with `transition: transform 0.2s ease`.

---

## Progress (last updated 2026-03)

| Status | Item |
|--------|------|
| ✅ | **Service:** `collapsibleHeaderService` — unified-flow primitives + composite `UnifiedFlowCollapsibleHeader` added and exported. |
| ✅ | **AdvancedOAuthFeatures.tsx** — migrated to service unified-flow components. |
| ✅ | **FlowGuidanceSystem.tsx** — migrated to service unified-flow components. |
| ✅ | **Configuration page** (`src/pages/Configuration.tsx`) — all 10 sections now use `UnifiedFlowCollapsibleHeader`. |
| ✅ | **SecurityScorecard.tsx** — migrated to service unified-flow components (UnifiedFlowCollapsibleSection, HeaderButton, Title, ToggleIcon, Content). |
| ✅ | **Worker token flow** (`/flows/worker-token-v9`) — `CollapsibleHeader` uses `useUnifiedIcon` (white box + blue border, ⬇️, -90°) via comprehensiveCredentialsService. |
| ⬜ | UnifiedFlowSteps.tsx + snapshot — pending. |
| ⬜ | CollapsibleSection.tsx (+ snapshot) — pending. |
| ⬜ | flowUIService + PAR/RAR + UnifiedOAuthFlowV8U credentials — pending. |
| ⬜ | Mock flows (optional) — not started. |

---

## 0. Safest icon to migrate to (most common already)

**Recommendation: standardize on the pattern that’s already used in most flow/section collapse.**

| Pattern | Where it’s used | Count (approx) |
|--------|------------------|----------------|
| **⬇️ emoji + rotate(-90deg) when collapsed** | UnifiedFlowSteps, CollapsibleSection, AdvancedOAuthFeatures, FlowGuidanceSystem, SecurityScorecard, UnifiedOAuthFlowV8U, EnvironmentIdInput, FlowCredentials, TokenIntrospect, CredentialsFormV8U, PAR/RAR worker-token block, PostmanCollectionGenerator, FIDO2, MFA docs, locked copies | **Dominant** (30+ files, many instances in UnifiedFlowSteps alone) |
| **SVG chevron in circle + 180°** | collapsibleHeaderService (DPoP, SAML, docs, ApplicationGenerator, FlowComparisonTool, etc.). **Configuration** now uses UnifiedFlowCollapsibleHeader. | One shared component, many consumers |
| **⬇️ / ⬆️ (two emojis, no rotation)** | CollapsibleIcon (used by PAR/RAR via flowUIService) | One component |
| **FiChevronDown + 180° or -90°** | EducationModeToggle, DragDropSidebar, EnhancedApiCallDisplay, ColoredJsonDisplay, MockApiCallDisplay; dropdowns (different context) | Mixed contexts |

**Safest choice:** Use **⬇️ (single icon) with -90° rotation** for section collapse. That’s already the dominant pattern for flow/section headers. Optional: keep the **white box with blue border** (32×32, 6px radius) so it matches UnifiedFlowSteps and the reference page.

- **If you change collapsibleHeaderService:** Add a “unified flow” style that uses ⬇️ + -90° (and optionally the white box). Then pages that currently use the service’s circle + 180° can opt in to the unified style; flow pages already using ⬇️ + -90° stay as-is or switch to the service for one source of truth.
- **If you change flow pages only:** Keep the service as-is for Configuration/docs; unify flow pages on the existing ⬇️ + -90° + white box (e.g. by moving that into the service and having UnifiedFlowSteps/PAR/RAR import it). No need to adopt the service’s current circle + 180° — that would be the opposite of “safest,” since it’s the minority for section collapse.

---

## 1. Current State (Who Uses What)

### 1.1 Reference implementation (Unified OAuth – keep as visual spec)

| Location | What it uses | Notes |
|----------|----------------|-------|
| `src/v8u/components/UnifiedFlowSteps.tsx` | Local `CollapsibleHeaderButton` + `CollapsibleToggleIcon` (styled-components) | Green gradient, white box + blue border, ⬇️ emoji, -90° rotation. **This is the reference.** |
| `src/v8u/components/UnifiedFlowSteps/components/CollapsibleSection.tsx` | Same visual language (green gradient, white box, ⬇️), variant styles (info/warning/success) | Reusable section; used where step content is wrapped in CollapsibleSection. |
| `src/v8u/lockdown/unified/snapshot/` | Copy of same styled components in snapshot `UnifiedFlowSteps.tsx` and snapshot `CollapsibleSection.tsx` | Must stay in sync or snapshot can diverge. |

### 1.2 Shared service (different look)

| Location | What it uses | Notes |
|----------|----------------|-------|
| `src/services/collapsibleHeaderService.tsx` | `CollapsibleHeader` component; **UnifiedFlowCollapsibleHeader** (composite) | **Circular** arrow (CollapsibleHeader); **UnifiedFlowCollapsibleHeader** = green gradient + ⬇️ + -90°. |
| Used by (CollapsibleHeader) | DPoPFlow, SAMLBearerAssertionFlowV9, SDKSampleApp, AIAgentOverview, ApplicationGenerator, PingAIResources, AIGlossary, OIDCForAI, OAuthForAI, PingViewOnAI, AIAgentAuthDraft, OAuthAndOIDCForAI.PingUI, FlowComparisonTool, comprehensiveCredentialsService, oauthFlowComparisonService, RedirectlessFlowV9_Real, SAMLServiceProviderFlowV1, AdvancedConfiguration, PARvsRAR, CustomDomainTestPage, CIBAvsDeviceAuthz, PingOneSessionsAPI | Configuration **migrated** to UnifiedFlowCollapsibleHeader (2026-03). |

### 1.3 FlowUIService (themed buttons; used by PAR/RAR)

| Location | What it uses | Notes |
|----------|----------------|-------|
| `src/services/flowUIService.tsx` | `getCollapsibleHeaderButton(theme)` + `getCollapsibleToggleIcon(theme)` | **Circular** toggle icon (32px, filled circle by theme color), green/blue/orange/pingRed themes. **No** white box with blue border; different from Unified. |
| `src/pages/flows/v9/PARFlowV9.tsx` | Imports `CollapsibleHeaderButton` from flowUIService | Uses flowUIService’s green theme. |
| `src/pages/flows/v9/RARFlowV9.tsx` | Same | Same. |

### 1.4 Duplicated “Unified-style” button (same idea, local definitions)

| Location | What it uses | Notes |
|----------|----------------|-------|
| `src/v8u/components/AdvancedOAuthFeatures.tsx` | **Migrated:** uses `collapsibleHeaderService` unified-flow components | Was local; now imports UnifiedFlowCollapsibleSection, UnifiedFlowCollapsibleHeaderButton, etc. |
| `src/v8u/components/FlowGuidanceSystem.tsx` | **Migrated:** uses `collapsibleHeaderService` unified-flow components | Same. |
| `src/v8u/components/SecurityScorecard.tsx` | **Migrated:** uses `collapsibleHeaderService` unified-flow components | Done 2026-03. |

### 1.5 Other patterns (not Unified look)

| Location | What it uses | Notes |
|----------|----------------|-------|
| `src/services/v9/mock/ui/V9MockCollapsibleHeader.tsx` | Inline styles, solid theme color, **+ / −** text for expand/collapse | Used by V7M mock flows; different look. |
| `src/v7/styles/mockFlowStyles.ts` | `getSectionHeaderStyle()`, `MOCK_SECTION_HEADER_LIGHT_BLUE` | Light blue header for Mock flow sections; no shared toggle icon component. |
| `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` | Inline `<button>` with gradient and 🔧 emoji for credentials block | Custom one-off; not using CollapsibleHeader or UnifiedFlowSteps button. |
| `src/components/CollapsibleIcon.tsx` | Emoji ⬇️/⬆️ in a small wrapper | Used by flowUIService’s toggle icon (inside a circle). |

---

## 2. Differences to Reconcile

| Aspect | Reference (Unified OAuth) | collapsibleHeaderService | flowUIService (PAR/RAR) |
|--------|----------------------------|---------------------------|--------------------------|
| Header background | Light green gradient | Solid theme (blue/green/ping, etc.) | Light gradient by theme (green/blue/orange) |
| Header text | Dark green | White | Theme text color |
| Toggle icon shape | **White rounded square**, blue border | **Circle**, theme fill | **Circle**, theme fill |
| Toggle icon rotation | **-90°** (point right when collapsed) | **180°** (point up/down) | Via CollapsibleIcon (emoji) |
| Icon asset | Emoji ⬇️ | SVG chevron | Emoji ⬇️/⬆️ |

To unify, we need one of:
- **Option A:** Extend the **service** to support a “unified flow” style (green gradient + white box chevron, -90°), then migrate all flow sections to it.
- **Option B:** Extract the **UnifiedFlowSteps** header/toggle into a shared component (or service export) and use it everywhere; leave existing `CollapsibleHeader` for non-flow pages (Configuration, docs) or migrate those to a theme that matches.

---

## 3. Recommended Direction: Single Source in collapsibleHeaderService

- **Add a “unified flow” style to `collapsibleHeaderService`** so one module owns:
  - Header: light green gradient, dark text (and optional variants: info = light blue, warning = light orange, etc.).
  - Toggle: white box, 32×32, blue border, chevron SVG, **-90°** when collapsed.
- **Export:**
  1. **Full section:** e.g. `UnifiedFlowCollapsibleSection` (header + content, optional variant) for drop-in use.
  2. **Header + toggle only:** e.g. `UnifiedFlowCollapsibleHeaderButton` + `UnifiedFlowCollapsibleToggleIcon` for cases that already manage content (e.g. UnifiedFlowSteps, PAR, RAR).
- **Migrate in order:**
  1. **UnifiedFlowSteps.tsx** (and snapshot): Replace local `CollapsibleHeaderButton` / `CollapsibleToggleIcon` with service exports. *(Pending.)*
  2. **UnifiedFlowSteps/components/CollapsibleSection.tsx**: Use service's full section or header+toggle. *(Pending.)*
  3. **AdvancedOAuthFeatures, FlowGuidanceSystem, SecurityScorecard**: **(Done: all three.)**
  4. **Configuration page**: **(Done 2026-03 — uses `UnifiedFlowCollapsibleHeader`.)**
  5. **flowUIService**: For PAR/RAR, use unified header/toggle from collapsibleHeaderService or add "unified" theme. *(Pending.)*
  6. **UnifiedOAuthFlowV8U.tsx** credentials block: Replace inline button with service's unified section or header. *(Pending.)*
  7. **Optional (later):** Mock flows (V9MockCollapsibleHeader, mockFlowStyles section headers): Decide whether they should switch to the unified look or stay as-is for “mock” branding.


**Existing** `CollapsibleHeader` (blue/ping/theme circles) remains for other pages (DPoP, SAML, docs, etc.). Configuration now uses `UnifiedFlowCollapsibleHeader`.

---

## 4. Files to Touch (Summary)

| Priority | File(s) | Status |
|----------|---------|--------|
| 1 | `src/services/collapsibleHeaderService.tsx` | Done — unified-flow primitives + `UnifiedFlowCollapsibleHeader` composite; `useUnifiedIcon` for CollapsibleHeader. |
| 1b | `src/services/comprehensiveCredentialsService.tsx` | Done — worker-token-v9 uses `useUnifiedIcon` on all CollapsibleHeaders. |
| 2 | `src/v8u/components/UnifiedFlowSteps.tsx` | Pending. |
| 3 | `src/v8u/lockdown/unified/snapshot/components/UnifiedFlowSteps.tsx` | Pending. |
| 4 | `src/v8u/components/UnifiedFlowSteps/components/CollapsibleSection.tsx` | Pending. |
| 5 | `src/v8u/lockdown/unified/snapshot/components/UnifiedFlowSteps/components/CollapsibleSection.tsx` | Pending. |
| 6 | `src/v8u/components/AdvancedOAuthFeatures.tsx` | Done — uses service unified-flow components. |
| 7 | `src/v8u/components/FlowGuidanceSystem.tsx` | Done — uses service unified-flow components. |
| 8 | `src/v8u/components/SecurityScorecard.tsx` | Done — uses service unified-flow components. |
| — | `src/pages/Configuration.tsx` | Done — all sections use `UnifiedFlowCollapsibleHeader`. |
| 9 | `src/services/flowUIService.tsx` | Pending. |
| 10 | `src/pages/flows/v9/PARFlowV9.tsx` | Pending. |
| 11 | `src/pages/flows/v9/RARFlowV9.tsx` | Pending. |
| 12 | `src/v8u/flows/UnifiedOAuthFlowV8U.tsx` | Pending. |
| 13 | Snapshot `UnifiedOAuthFlowV8U.tsx` (lockdown) | Pending (if applicable). |

**Optional / later:**
- Mock flows: `V9MockCollapsibleHeader`, `mockFlowStyles.ts` section headers — only if we want mock flows to match the same icon/size/behavior.
- Other pages that use `CollapsibleHeader` (DPoP, SAML, etc.): no change unless they opt in to `UnifiedFlowCollapsibleHeader`.

---

## 5. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Regressions on Unified OAuth (oauth-authz/0) | Migrate UnifiedFlowSteps first; keep styles pixel-aligned with current reference; manual and (if any) visual regression check. |
| PAR/RAR look different today | Document that we’re aligning them to Unified look; single test pass for PAR/RAR expand/collapse. |
| Snapshot drift | Snapshot UnifiedFlowSteps and CollapsibleSection import from the same service; no local copies of the styled components. |
| collapsibleHeaderService size/API creep | Add only a small set of exports (e.g. `UnifiedFlowCollapsibleHeaderButton`, `UnifiedFlowCollapsibleToggleIcon`, optional `UnifiedFlowCollapsibleSection`); keep existing `CollapsibleHeader` API unchanged. |
| Theming: some pages want blue/ping, not green | Keep existing themes in the service; “unified flow” is an additional style. Flow pages use unified; config/docs can keep current themes. |

---

## 6. Effort Estimate

| Phase | Scope | Status |
|-------|--------|--------|
| **Phase 1 (partial)** | Add unified-flow components to collapsibleHeaderService | Done. UnifiedFlowSteps + CollapsibleSection still pending. |
| **Phase 2** | AdvancedOAuthFeatures, FlowGuidanceSystem, SecurityScorecard | Done (3/3). |
| **Phase 2b** | Configuration page | Done. |
| **Phase 3** | flowUIService + PAR/RAR + UnifiedOAuthFlowV8U credentials header | Pending. |
| **Phase 4** | Mock flows / optional pages | Not started. |

**Remaining:** Complete Phase 1 (UnifiedFlowSteps + CollapsibleSection), then Phase 3.

---

## 7. Decision

- **Worth the risk?** Yes, if we want one source of truth for “flow” section headers and consistent icons/size/behavior. Risk is contained by doing UnifiedFlowSteps first and keeping the reference page identical.
- **Recommendation:** Proceed with **Phase 1** (service + UnifiedFlowSteps + CollapsibleSection). If that looks good, do Phase 2 and 3 so all flows (including PAR, RAR, and credentials block) use the same collapsible header style as oauth-authz/0.

---

## 8. Next Steps (ordered checklist)

1. **UnifiedFlowSteps.tsx** — Replace local `CollapsibleHeaderButton` and `CollapsibleToggleIcon` with imports from `collapsibleHeaderService` (UnifiedFlowCollapsibleHeaderButton, UnifiedFlowCollapsibleToggleIcon). Verify `/oauth-authz` flow looks identical.
2. **Snapshot** — Update `src/v8u/lockdown/unified/snapshot/components/UnifiedFlowSteps.tsx` the same way.
3. **CollapsibleSection.tsx** — Migrate to service unified-flow components (or shared primitives). Update snapshot CollapsibleSection similarly.
4. **flowUIService** — Add "unified" theme or switch PAR/RAR to use collapsibleHeaderService exports instead of flowUIService's circular icon.
5. **PARFlowV9.tsx** and **RARFlowV9.tsx** — Use unified header/toggle (from service or updated flowUIService).
6. **UnifiedOAuthFlowV8U.tsx** — Replace inline credentials block button with `UnifiedFlowCollapsibleSection` or `UnifiedFlowCollapsibleHeader`.

**Completion criteria:** All flow pages (oauth-authz, worker-token, PAR, RAR) and credential blocks use the same white-box icon and -90° rotation; no local copies of the toggle styles.

---

## 9. Migration Recipes (for implementers)

### 9.1 UnifiedFlowSteps.tsx

**Remove** local styled components `CollapsibleHeaderButton`, `CollapsibleToggleIcon` (and optionally `CollapsibleSection`, `CollapsibleTitle`, `CollapsibleContent` if migrating to service equivalents).

**Add:**
```tsx
import {
  UnifiedFlowCollapsibleHeaderButton,
  UnifiedFlowCollapsibleToggleIcon,
  UnifiedFlowCollapsibleSection,
  UnifiedFlowCollapsibleTitle,
  UnifiedFlowCollapsibleContent,
} from '@/services/collapsibleHeaderService';
```

**Replace** each block (e.g. Quick Start):
```tsx
<UnifiedFlowCollapsibleSection>
  <UnifiedFlowCollapsibleHeaderButton
    onClick={() => setIsQuickStartCollapsed(!isQuickStartCollapsed)}
    aria-expanded={!isQuickStartCollapsed}
    $collapsed={isQuickStartCollapsed}
  >
    <UnifiedFlowCollapsibleTitle>
      <span>📖</span>
      <span>Quick Start & Overview - ...</span>
    </UnifiedFlowCollapsibleTitle>
    <UnifiedFlowCollapsibleToggleIcon $collapsed={isQuickStartCollapsed}>
      <span>⬇️</span>
    </UnifiedFlowCollapsibleToggleIcon>
  </UnifiedFlowCollapsibleHeaderButton>
  {!isQuickStartCollapsed && (
    <UnifiedFlowCollapsibleContent>
      {/* existing content */}
    </UnifiedFlowCollapsibleContent>
  )}
</UnifiedFlowCollapsibleSection>
```

**Note:** Service uses `$collapsed` (styled-components transient prop); UnifiedFlowSteps currently uses `$collapsed` for the icon. Keep `CollapsibleTitle` → `UnifiedFlowCollapsibleTitle`, `CollapsibleContent` → `UnifiedFlowCollapsibleContent` if service exports match; otherwise retain local names and only swap HeaderButton + ToggleIcon.

### 9.2 CollapsibleSection.tsx

Use the full composite when the section is self-contained:

```tsx
import {
  UnifiedFlowCollapsibleHeader,
  type UnifiedFlowCollapsibleHeaderProps,
} from '@/services/collapsibleHeaderService';

<UnifiedFlowCollapsibleHeader
  title="Section Title"
  defaultCollapsed={false}
  icon={<span>🔧</span>}
>
  {children}
</UnifiedFlowCollapsibleHeader>
```

The composite manages collapse state internally. For variant styles (info/warning/success), the service may need an optional `variant` prop; check `collapsibleHeaderService` exports.

### 9.3 flowUIService (PAR/RAR)

**Option A (preferred):** Switch PAR/RAR to import from `collapsibleHeaderService`:

```tsx
// In PARFlowV9.tsx, RARFlowV9.tsx:
import {
  UnifiedFlowCollapsibleHeaderButton,
  UnifiedFlowCollapsibleToggleIcon,
} from '@/services/collapsibleHeaderService';

// $collapsed = true when section is collapsed:
<UnifiedFlowCollapsibleHeaderButton onClick={() => toggleSection('overview')} $collapsed={collapsedSections.overview}>
  ...
  <UnifiedFlowCollapsibleToggleIcon $collapsed={collapsedSections.overview}>
    <span>⬇️</span>
  </UnifiedFlowCollapsibleToggleIcon>
</UnifiedFlowCollapsibleHeaderButton>
```

**Option B:** Add a "unified" theme to flowUIService that returns components styled like the service (white box, -90°). More duplication; prefer Option A.

### 9.4 UnifiedOAuthFlowV8U credentials block

Replace the inline `<button>` with gradient and 🔧 emoji:

```tsx
import { UnifiedFlowCollapsibleHeader } from '@/services/collapsibleHeaderService';

<UnifiedFlowCollapsibleHeader
  title="Credentials"
  defaultCollapsed={!credentialsOpen}
  icon={<span>🔧</span>}
>
  {/* existing credentials form content */}
</UnifiedFlowCollapsibleHeader>
```

If state must be controlled by parent, the composite accepts `defaultCollapsed` only. For fully controlled state, use the primitives (HeaderButton + ToggleIcon + Content) and manage `credentialsOpen` in the parent.

---

## 10. Plan Status

| Metric | Value |
|--------|-------|
| **Overall completion** | ~60% |
| **Phases done** | Phase 1 (partial), Phase 2, Phase 2b |
| **Phases pending** | Phase 1 (UnifiedFlowSteps + CollapsibleSection), Phase 3, Phase 4 |
| **Files migrated** | 7 (service, comprehensiveCredentialsService, AdvancedOAuthFeatures, FlowGuidanceSystem, SecurityScorecard, Configuration, worker-token-v9) |
| **Files pending** | 6 (UnifiedFlowSteps x2, CollapsibleSection x2, flowUIService, PAR/RAR, UnifiedOAuthFlowV8U) |

**Next implementer:** Start with item 1 in Section 8 (UnifiedFlowSteps.tsx). Run the app, open `/oauth-authz` or equivalent unified flow, verify step 0 headers look identical before/after. Then proceed to snapshot and CollapsibleSection.

---

## 11. Verification (after each migration)

After migrating a file, run these checks to avoid regressions:

| Step | Command / Action |
|------|------------------|
| Typecheck | `pnpm tsc --noEmit` |
| Lint | `pnpm lint` (if available) |
| Build | `pnpm build` |
| Manual | Open the affected page; expand/collapse each section; verify icon rotates -90° when collapsed; verify no layout shift or console errors |

**Visual regression:** Compare migrated header to the reference (`/oauth-authz` Unified OAuth flow, step 0). Toggle icon should be: white box, 32×32px, 6px radius, 2px solid blue (`#3b82f6`), ⬇️ emoji, points right when collapsed and down when expanded.

**Regression plan:** Before migrating flow UI or Configuration areas, read `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` Section 4 (checklist) and Section 7 (do-not-break). After each fix, add an entry to Section 3.

---

_Last updated: 2026-03. Progress: service, AdvancedOAuthFeatures, FlowGuidanceSystem, Configuration, SecurityScorecard, worker-token-v9 (useUnifiedIcon) done; UnifiedFlowSteps, CollapsibleSection, flowUIService, PAR/RAR, credentials block pending._
