# Documentation & Reference Page Standardization Plan

## ⚠️ Authoritative References

Before implementing anything in this plan, read the base guides:

| Doc | What it covers |
|---|---|
| [`A-Migration/01-MIGRATION-GUIDE.md`](../A-Migration/01-MIGRATION-GUIDE.md) | Quality gates, Modern Messaging, colors, async patterns |
| [`A-Migration/04-REFERENCE.md`](../A-Migration/04-REFERENCE.md) | Color constants, V9 patterns, guide index |
| [`docs/MOCK_FLOW_STANDARDIZATION_PLAN.md`](./MOCK_FLOW_STANDARDIZATION_PLAN.md) | Mock/flow standards — 3 sidebar items in this group are flows covered there |

This plan adds **documentation-page-specific** standards on top of the base standards. When there is any conflict, `A-Migration/` wins.

---

## 🎯 Objective

Standardize all 14 Documentation & Reference pages to a consistent V9 pattern: fluid sidebar-aware layout, blue gradient hero header, `usePageScroll`, no purple accents, consistent code block rendering, anchor navigation for long pages, and external link safety.

> **3 sidebar items are flows, not doc pages** — they are covered by `MOCK_FLOW_STANDARDIZATION_PLAN.md`:
> - `/oauth-2-1` → `OAuth21InformationalFlowV9.tsx`
> - `/v9/resources-api` → `ResourcesAPIFlowV9.tsx`
> - `/pingone-sessions-api` → `PingOneSessionsAPIFlowV9.tsx`

---

## 📋 Target Pattern: Documentation Hub

### ✅ What `Documentation Hub` (`Documentation.tsx`) already does correctly

`Documentation.tsx` is the **gold standard** for doc pages:

```typescript
import { usePageScroll } from '../hooks/usePageScroll';
import PageLayoutService from '../services/pageLayoutService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

const pageConfig = {
  flowType: 'pingone' as const,
  theme: 'blue' as const,          // ← blue for reference/informational pages
  maxWidth: '1200px',               // ← update to '90rem' (see §2)
  showHeader: true,
  showFooter: false,
  responsive: true,
};

const { PageContainer, ContentWrapper, PageHeader } =
  PageLayoutService.createPageLayout(pageConfig);

// Inside the component:
usePageScroll({ pageName: 'Documentation Hub', force: true });
```

Key correct patterns:
- **`PageLayoutService.createPageLayout()`** — creates `PageContainer`, `ContentWrapper`, `PageHeader`
- **`V9_COLORS`** imported for palette access
- **`usePageScroll`** called with `force: true` (doc pages always scroll to top on load)
- **Blue gradient header** — correct for reference/informational pages
- **No purple** — correct
- **Existing `CollapsibleHeader`** — used for section grouping

### 🔧 What this plan adds or corrects

1. **Fluid layout** — fix `maxWidth: '1200px'` → `'90rem'` in `pageConfig` across all pages
2. **`usePageScroll`** — add to every page that's missing it (9/14 missing)
3. **Blue hero header** — replace purple and amber headers; red reserved for MigrationGuide only
4. **No purple** — remove `#667eea / #764ba2 / #8b5cf6` as primary/accent colors
5. **Consistent `CodeBlock`** — uniform code rendering, never raw `<pre>`
6. **Anchor navigation** — `id=` attributes on all major headings for deep linking
7. **Table of Contents** — required for pages > ~500 lines / 4+ major sections
8. **External link safety** — `target="_blank" rel="noopener noreferrer"` everywhere
9. **RFC / Spec links section** — every page links to the relevant source specifications

---

## 🚫 Requirements

### 1. Page Width — Fluid, Sidebar-Aware Layout (Critical)

Same rule as `MOCK_FLOW_STANDARDIZATION_PLAN.md §2`. Documentation pages sit in the same MainContent column as flows and must scale with the same sidebar.

**The correct pattern** — use `PageLayoutService.createPageLayout()`:

```typescript
const pageConfig = {
  flowType: 'pingone' as const,
  theme: 'blue' as const,
  maxWidth: '90rem',          // ← 90rem NOT 1200px / 1400px
  showHeader: true,
  responsive: true,
};

const { PageContainer, ContentWrapper, PageHeader } =
  PageLayoutService.createPageLayout(pageConfig);

// JSX:
return (
  <PageContainer>
    <ContentWrapper>
      <PageHeader>
        <h1>Page Title</h1>
        <p>Subtitle</p>
      </PageHeader>
      {/* page content */}
    </ContentWrapper>
  </PageContainer>
);
```

Pages that define their own container styled-component instead of using `PageLayoutService` must change to:

```css
/* Correct outer wrapper */
width: 100%;
max-width: 90rem;   /* matches FlowUIService.ContentWrapper */
margin: 0 auto;
padding: 1.5rem 1rem 6rem;
box-sizing: border-box;
```

**Width violations to fix:**

| Current hard-coded width | Pages |
|---|---|
| `1200px` — slightly too narrow | `OIDCOverviewV7`, `OAuth2SecurityBestPractices`, `OIDCSpecs`, `SpiffeSpirePingOne`, `OIDC` |
| `1400px` — acceptable but should use service | `PARvsRAR` |
| `860px` inner div — too narrow | `MigrationGuide` (inner `<ContentInner>`) |
| `800px` inner div — too narrow | `ComprehensiveOAuthEducation` |
| `90rem` ✅ already correct | `PingOneScopesReference`, `PingOneMockFeatures` |

### 2. `usePageScroll` — Scroll Management (Critical)

Every documentation page **must** call `usePageScroll` so users always start at the top of the page on navigation. Use `force: true` for doc pages (unlike flows which use `false`) because doc pages are long and should always reset to the top.

```typescript
import { usePageScroll } from '../hooks/usePageScroll';
// or with two levels of nesting:
import { usePageScroll } from '../../hooks/usePageScroll';

// Inside component, before any conditional returns:
usePageScroll({ pageName: 'My Doc Page', force: true });
```

**Coverage (March 2026):**

| Page | `usePageScroll` |
|---|---|
| Documentation Hub | ✅ |
| OIDC Overview | ✅ |
| OAuth Education | ✅ |
| CIBA vs Device Authz | ✅ |
| Migration Guide | ⬜ missing |
| OAuth2 Security Best Practices | ⬜ missing |
| PAR vs RAR | ⬜ missing |
| Scopes Reference | ⬜ missing |
| OIDC Specs | ⬜ missing |
| SPIFFE/SPIRE | ⬜ missing |
| Mock & Educational Features | ⬜ missing |
| OIDC Info | ⬜ missing |
| OIDC Session Management | ⬜ missing |
| Advanced OAuth Params Demo | ⬜ missing |

**9/14 pages are missing `usePageScroll`.**

### 3. Header Color — Blue Gradient for Reference Pages (Critical)

Documentation & Reference pages are **informational reference content**, not mock/simulated flows. They must use the **blue gradient header**, not red (red = mock flows) and never purple.

The sole exception: `MigrationGuide.tsx` intentionally uses red to signal a "warning/action required" technical guide — this is acceptable.

**Standard doc page hero header:**

```typescript
// Using PageLayoutService (preferred):
const pageConfig = {
  theme: 'blue' as const,
  // ...
};
const { PageHeader } = PageLayoutService.createPageLayout(pageConfig);
// PageLayoutService produces: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE, V9_COLORS.PRIMARY.BLUE_DARK)

// Or, if building a custom hero:
const HeroSection = styled.div`
  background: linear-gradient(135deg, ${V9_COLORS.PRIMARY.BLUE} 0%, ${V9_COLORS.PRIMARY.BLUE_DARK} 100%);
  color: #ffffff;
  padding: 2.5rem 2rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
`;
```

**Color values (exact):**
- Background: `linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%)`
  - Which resolves to: `linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)`
- Text: `#ffffff`

**Rules:**
- ✅ Reference/informational doc pages → **blue gradient** header + white text
- ✅ `MigrationGuide.tsx` (warning/action doc) → red gradient is acceptable (already set)
- ❌ **No purple** (`#667eea`, `#764ba2`, `#8b5cf6`) as page header or primary hero color
- ❌ **No amber/orange** as page hero color (amber = warning status only, not page branding)
- ❌ **No grey header** — a page title should always have a colored gradient background
- ❌ No dark text on colored headers — always `#ffffff`

**Pages with non-conforming headers to fix (March 2026):**

| Page | Current header | Action needed |
|---|---|---|
| `OIDCOverviewV7.tsx` | None — no styled header element | Add blue hero section |
| `OAuth2SecurityBestPractices.tsx` | Blue gradient but with literal CSS string bug (not interpolating `V9_COLORS`) | Fix interpolation |
| `ComprehensiveOAuthEducation.tsx` | No hero — grey/neutral background | Add blue hero section |
| `PARvsRAR.tsx` | No page hero — page jumps straight into content | Add blue hero section |
| `CIBAvsDeviceAuthz.tsx` | No page hero | Add blue hero section |
| `PingOneScopesReference.tsx` | Purple/indigo gradient (`rgba(99, 102, 241, ...)`) ❌ | Replace with blue gradient |
| `OIDCSpecs.tsx` | No hero | Add blue hero section |
| `SpiffeSpirePingOne.tsx` | Purple `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` ❌ | Replace with blue gradient |
| `PingOneMockFeatures.tsx` | Amber/warning gradient ❌ | Replace with blue gradient |
| `OIDC.tsx` | No hero | Add blue hero section |
| `OIDCSessionManagement.tsx` | Blue ✅ already correct | No change needed |

### 4. No Purple Accents (High)

Purple (`#667eea`, `#764ba2`, `#8b5cf6`, `rgb(99, 102, 241)`) must not appear as a primary color, card border, badge, or section header on any doc page. It is not in the `V9_COLORS` palette and creates visual inconsistency.

**Approved accent/border colors** for doc pages:

| Use | Color |
|---|---|
| Primary blue accent (borders, icons, badges) | `#3b82f6` or `V9_COLORS.PRIMARY.BLUE` |
| Info sections / callout borders | `V9_COLORS.BORDER.INFO` (`#bfdbfe`) |
| Success indicators | `V9_COLORS.STATUS.SUCCESS` |
| Warning callouts | `V9_COLORS.STATUS.WARNING` |
| Error callouts | `V9_COLORS.STATUS.ERROR` |
| Neutral borders | `V9_COLORS.BORDER.GRAY` |

**Violations to fix:**

| Page | Purple usage | Fix |
|---|---|---|
| `SpiffeSpirePingOne.tsx` | Hero gradient `#667eea → #764ba2`; `$color || '#3b82f6'` (OK but check) | Replace hero with blue gradient |
| `CIBAvsDeviceAuthz.tsx` | `border-left: 4px solid #8b5cf6` on CIBA-type callouts | Replace with `#3b82f6` |
| `PingOneScopesReference.tsx` | Hero `rgba(99, 102, 241, ...)` indigo; badge backgrounds use indigo | Replace with blue |

### 5. `CodeBlock` — Consistent Code Rendering (High)

All code samples on doc pages must use a consistent `CodeBlock` styled component. Do **not** use raw `<pre>` tags or bare `<code>` elements for multi-line samples.

**Standard code block** (create once in `PageLayoutService` or import from shared component):

```typescript
// Option A — use the existing CodeBlock component if the page already defines one:
const CodeBlock = styled.pre`
  background: ${V9_COLORS.BG.GRAY_LIGHT};
  border: 1px solid ${V9_COLORS.BORDER.GRAY};
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  font-size: 0.8125rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  overflow-x: auto;
  white-space: pre;
  line-height: 1.6;
  margin: 0.75rem 0;
`;

// Option B — import the shared CodeBlock if one is extracted to components/:
import { DocCodeBlock } from '../../components/DocCodeBlock';
```

**Template literal escaping rule (critical):**
When a code sample contains `${variable}` placeholder syntax (for display, not actual interpolation), the `$` must be escaped: `\${variable}`.

```tsx
// ❌ WRONG — causes ReferenceError at runtime:
<CodeBlock>{`GET /authorize?code_challenge=${codeChallenge}`}</CodeBlock>

// ✅ CORRECT — escaped so it renders as literal text:
<CodeBlock>{`GET /authorize?code_challenge=\${codeChallenge}`}</CodeBlock>
```

This was the root cause of the `OAuth21InformationalFlowV9` crash (March 2026). Apply this rule to every `CodeBlock` on every page.

### 6. External Link Safety (High)

Every hyperlink that opens an external URL (RFC editor, IETF, OpenID Foundation, etc.) **must** include both attributes:

```tsx
<a href="https://www.rfc-editor.org/rfc/rfc6749" target="_blank" rel="noopener noreferrer">
  RFC 6749 — The OAuth 2.0 Authorization Framework
</a>
```

Rationale: `noopener` prevents the new tab from accessing `window.opener` (tabnapping vulnerability). `noreferrer` prevents the referrer header from leaking the app URL to external sites.

**Audit each doc page** for bare `href="https://..."` links without these attributes. The large pages (`PARvsRAR`, `CIBAvsDeviceAuthz`, `OIDCSessionManagement`) are most likely to have violations.

### 7. RFC / Spec Reference Section (High)

Every doc page must include a **"Specifications & References"** section (collapsible or at page bottom) with links to the relevant source material. This anchors the page's educational content to authoritative sources.

**Standard pattern:**

```tsx
<SpecsSection>
  <SectionTitle>Specifications & References</SectionTitle>
  <SpecList>
    <li>
      <a href="https://www.rfc-editor.org/rfc/rfcXXXX" target="_blank" rel="noopener noreferrer">
        RFC XXXX
      </a>{' '}
      — Description of what this RFC covers
    </li>
    <li>
      <a href="https://openid.net/specs/openid-connect-core-1_0.html" target="_blank" rel="noopener noreferrer">
        OpenID Connect Core 1.0
      </a>{' '}
      — Core OIDC specification
    </li>
  </SpecList>
</SpecsSection>
```

**Pages missing spec references:**

| Page | Missing specs |
|---|---|
| `OAuth2SecurityBestPractices.tsx` | RFC 9700, RFC 9449, BCP 212 |
| `ComprehensiveOAuthEducation.tsx` | RFC 6749, RFC 6750, RFC 7636 |
| `PARvsRAR.tsx` | RFC 9126 (PAR), RFC 9396 (RAR) |
| `CIBAvsDeviceAuthz.tsx` | OpenID CIBA Core, RFC 8628 |
| `PingOneScopesReference.tsx` | RFC 6749, OIDC Core, PingOne docs |
| `PingOneMockFeatures.tsx` | General reference to mock vs real |
| `OIDC.tsx` | OpenID Connect Core, OIDC Discovery |
| `OIDCSessionManagement.tsx` | OpenID Session Management, Front-Channel Logout, Back-Channel Logout |

### 8. Anchor Navigation for Long Pages (Medium)

Pages > ~500 lines or with 4+ major sections must have anchor IDs on all headings and a **Table of Contents** section at the top.

**Headed section with anchor:**

```tsx
<SectionTitle id="pkce-requirements">PKCE Requirements</SectionTitle>
```

**Table of Contents block (required for long pages):**

```tsx
<TocCard>
  <TocTitle>On This Page</TocTitle>
  <TocList>
    <li><a href="#overview">Overview</a></li>
    <li><a href="#pkce-requirements">PKCE Requirements</a></li>
    <li><a href="#token-security">Token Security</a></li>
    <li><a href="#references">References</a></li>
  </TocList>
</TocCard>
```

**Pages that need a TOC (March 2026):**

| Page | Lines | Sections | TOC needed |
|---|---|---|---|
| `OIDCSessionManagement.tsx` | 3,772 | 8+ | ⬜ Yes — critical |
| `PARvsRAR.tsx` | 1,965 | 6+ | ⬜ Yes |
| `CIBAvsDeviceAuthz.tsx` | 1,501 | 5+ | ⬜ Yes |
| `Documentation.tsx` | 1,352 | n/a — it is the index | ➖ Is the TOC itself |
| `PingOneMockFeatures.tsx` | 1,079 | 4+ | ⬜ Yes |
| `MigrationGuide.tsx` | 967 | 5+ | ⬜ Yes |
| `OAuth2SecurityBestPractices.tsx` | 895 | 4+ | ⬜ Yes |
| `PingOneScopesReference.tsx` | 923 | 3 (scope groups) | ⬜ Yes |

### 9. Section Separators and Visual Hierarchy (Medium)

Doc pages must use a clear and consistent visual hierarchy:

- **H1** (`PageHeader` title) — page title; only one per page
- **H2** (`SectionTitle`) — major topics; appears in TOC
- **H3** (`SubsectionTitle`) — sub-topics within a major section
- **Callout boxes** — for tips, warnings, and important notes — use `V9_COLORS` palette
- **Collapsible sections** — for long supplementary content (e.g. full spec text, code samples > 20 lines)

**Callout pattern (use `V9_COLORS`, not raw hex):**

```tsx
const Callout = styled.div<{ $color?: 'blue' | 'amber' | 'red' | 'green' }>`
  background: ${({ $color }) =>
    $color === 'red' ? V9_COLORS.BG.ERROR_LIGHT
    : $color === 'amber' ? V9_COLORS.BG.WARNING_LIGHT
    : $color === 'green' ? V9_COLORS.BG.SUCCESS_LIGHT
    : V9_COLORS.BG.INFO_LIGHT};
  border-left: 4px solid ${({ $color }) =>
    $color === 'red' ? V9_COLORS.STATUS.ERROR
    : $color === 'amber' ? V9_COLORS.STATUS.WARNING
    : $color === 'green' ? V9_COLORS.STATUS.SUCCESS
    : V9_COLORS.PRIMARY.BLUE};
  padding: 1rem 1.25rem;
  border-radius: 0 0.5rem 0.5rem 0;
  margin: 1rem 0;
`;
```

---

## 🔍 Available Infrastructure

### `PageLayoutService.createPageLayout()`
```typescript
import PageLayoutService from '../services/pageLayoutService';

const { PageContainer, ContentWrapper, PageHeader } = PageLayoutService.createPageLayout({
  flowType: 'pingone',
  theme: 'blue',          // 'blue' | 'red' | 'green' | 'pingRed'
  maxWidth: '90rem',      // ← always use 90rem for doc pages
  showHeader: true,
  responsive: true,
});
```

### `V9_COLORS` Palette
```typescript
import { V9_COLORS } from '../services/v9/V9ColorStandards';
// (two levels deep: ../../services/v9/V9ColorStandards)

V9_COLORS.PRIMARY.BLUE        // #3b82f6
V9_COLORS.PRIMARY.BLUE_DARK   // #1e40af  (or #2563eb — check actual value)
V9_COLORS.STATUS.SUCCESS      // #22c55e
V9_COLORS.STATUS.WARNING      // #f59e0b
V9_COLORS.STATUS.ERROR        // #ef4444
V9_COLORS.BG.GRAY_LIGHT       // #f9fafb
V9_COLORS.BORDER.GRAY         // #e5e7eb
V9_COLORS.BORDER.INFO         // #bfdbfe
V9_COLORS.TEXT.PRIMARY        // #111827
V9_COLORS.TEXT.SECONDARY      // #6b7280
```

### `usePageScroll`
```typescript
import { usePageScroll } from '../hooks/usePageScroll';
// (one level deep from src/pages/)
// (two levels deep from src/pages/docs/)

usePageScroll({ pageName: 'Page Title', force: true });
// force: true — always scroll to top on navigation (correct for doc pages)
// force: false — only scroll to top on first visit (correct for interactive flows)
```

### `CollapsibleHeader`
```typescript
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
// Used in Documentation.tsx for section headers — reuse this pattern
```

---

## 📊 Page Inventory and Audit (March 2026)

Legend: ✅ done · ⬜ missing · ➖ not applicable · ❌ violation

| Page | File | Lines | Width | `usePageScroll` | Hero Header | No Purple | CodeBlock | Spec Links | TOC |
|---|---|---|---|---|---|---|---|---|---|
| Documentation Hub | `Documentation.tsx` | 1,352 | 1200px ⬜ | ✅ | Blue ✅ | ✅ | ➖ (cards) | ➖ (is the hub) | ➖ |
| OIDC Overview | `docs/OIDCOverviewV7.tsx` | 677 | 1200px ⬜ | ✅ | None ❌ | ✅ | ⬜ | ⬜ | ⬜ |
| Migration Guide | `docs/migration/MigrationGuide.tsx` | 967 | 860px ❌ | ⬜ | Red ✅ | ✅ | ✅ | ⬜ | ⬜ |
| OAuth2 Security BP | `docs/OAuth2SecurityBestPractices.tsx` | 895 | 1200px ⬜ | ⬜ | Blue (CSS bug) ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| OAuth Education | `ComprehensiveOAuthEducation.tsx` | 471 | 800px ❌ | ✅ | None ❌ | ✅ | ⬜ | ⬜ | ➖ |
| Advanced OAuth Demo | `?` | ? | ? | ⬜ | ? | ? | ? | ⬜ | ➖ |
| PAR vs RAR | `PARvsRAR.tsx` | 1,965 | 1400px ⬜ | ⬜ | None ❌ | ✅ | ⬜ | ⬜ | ⬜ |
| CIBA vs Device | `CIBAvsDeviceAuthz.tsx` | 1,501 | ~none ⬜ | ✅ | None ❌ | ❌ purple | ⬜ | ⬜ | ⬜ |
| Scopes Reference | `PingOneScopesReference.tsx` | 923 | 90rem ✅ | ⬜ | Purple ❌ | ❌ purple | ⬜ | ⬜ | ⬜ |
| OIDC Specs | `docs/OIDCSpecs.tsx` | 291 | 1200px ⬜ | ⬜ | None ❌ | ✅ | ⬜ | ✅ (is specs list) | ➖ |
| SPIFFE/SPIRE | `docs/SpiffeSpirePingOne.tsx` | 781 | 1200px ⬜ | ⬜ | Purple ❌ | ❌ purple | ⬜ | ⬜ | ⬜ |
| Mock Features | `PingOneMockFeatures.tsx` | 1,079 | 90rem ✅ | ⬜ | Amber ❌ | ✅ | ⬜ | ⬜ | ⬜ |
| OIDC Info | `OIDC.tsx` | 189 | 1200px ⬜ | ⬜ | None ❌ | ✅ | ⬜ | ⬜ | ➖ |
| OIDC Session Mgmt | `OIDCSessionManagement.tsx` | 3,772 | ~none ⬜ | ⬜ | Blue ✅ | ✅ | ⬜ | ⬜ | ⬜ |
| **Totals** | | | **2/14 ✅** | **4/14 ✅** | **4/14 ✅** | **10/14 ✅** | **1/14 ✅** | **1/14 ✅** | **0/14 ✅** |

---

## 🔴 Priority Gaps (by impact)

| Priority | Gap | Affected Pages | Why |
|---|---|---|---|
| 🔴 Critical | `usePageScroll` missing | 10/14 pages | Users arrive mid-page after navigation — jarring UX |
| 🔴 Critical | No hero header / missing page identity | 7/14 pages | Pages look bare; section boundary unclear |
| 🟠 High | Purple violations | 3/14 pages | Off-palette; branding inconsistency |
| 🟠 High | Narrow/hard-coded widths (non-`90rem`) | 10/14 pages | Content cramped on wide viewports |
| 🟠 High | Missing spec/RFC reference sections | 8/14 pages | Reduces intellectual credibility and educational value |
| 🟡 Medium | No Table of Contents on long pages | 5/14 pages | Pages over 900+ lines are hard to navigate |
| 🟡 Medium | Inconsistent `CodeBlock` styling | 9/14 pages | Visual noise; some use raw `<pre>` |
| 🟡 Medium | External links missing `rel="noopener noreferrer"` | 4+ pages | Security best practice not followed |
| 🟢 Low | Section anchor IDs for deep linking | 13/14 pages | Useful for sharing direct links to sections |

---

## 🚀 Implementation Strategy

### Phase 1: Quick wins across all pages (highest ROI, low risk)

All of these are additive — no existing content at risk:

1. **Add `usePageScroll`** to the 10 missing pages — 1-line change per page
2. **Fix width** — change `maxWidth` or outer container to `90rem` across 10 pages
3. **Fix external link safety** — add `rel="noopener noreferrer"` to bare `target="_blank"` links
4. **Escape `\${...}` in CodeBlocks** — audit all template literals in code sample strings

### Phase 2: Header and color standardization

1. **Add blue hero sections** to 7 pages with no header (`OIDCOverviewV7`, `OAuth2SecurityBestPractices`, `ComprehensiveOAuthEducation`, `PARvsRAR`, `CIBAvsDeviceAuthz`, `OIDCSpecs`, `OIDC`)
2. **Replace purple headers** in 3 pages (`PingOneScopesReference`, `SpiffeSpirePingOne`, `CIBAvsDeviceAuthz` border)
3. **Replace amber hero** in `PingOneMockFeatures`
4. **Fix `OAuth2SecurityBestPractices.tsx` CSS interpolation bug** — the `PageHeader` gradient has `V9_COLORS.PRIMARY.BLUE_DARK` as a literal string, not an interpolation

### Phase 3: Navigation and content quality

1. **Add TOC** to 5 long pages (`OIDCSessionManagement`, `PARvsRAR`, `CIBAvsDeviceAuthz`, `PingOneMockFeatures`, `MigrationGuide`)
2. **Add anchor IDs** to all major section headings across all pages
3. **Add spec reference sections** to 8 pages

### Phase 4: Code samples and visual polish

1. **Standardize `CodeBlock`** styled component across all pages that use raw `<pre>`
2. **Audit template literal escaping** in all `CodeBlock` content
3. **Callout boxes** — migrate any raw inline `backgroundColor` style objects to the `Callout` styled component with `V9_COLORS`

---

## 📋 Migration Checklist (Per Page)

### Layout — Fluid, Sidebar-Aware
- [ ] Change `maxWidth` to `'90rem'` in `PageLayoutService.createPageLayout()` config
- [ ] For pages using custom wrapper: set `max-width: 90rem; width: 100%; margin: 0 auto`
- [ ] Remove any inner `max-width: 860px / 800px` on content divs (use `width: 100%` inside the wrapper)
- [ ] Test at 1440 px+ — content expands to fill column
- [ ] Test at 1024 px with sidebar at 700 px — content still readable, no horizontal scroll

### Scroll Management
- [ ] Import `usePageScroll` from correct relative path (`../hooks/` from `src/pages/`, `../../hooks/` from `src/pages/docs/`)
- [ ] Call `usePageScroll({ pageName: 'Page Name Here', force: true })` before any conditional returns

### Hero Header
- [ ] Page has a prominent hero/header section (using `PageHeader` from `PageLayoutService` OR a styled `HeroSection`)
- [ ] Hero uses blue gradient (`V9_COLORS.PRIMARY.BLUE` → `V9_COLORS.PRIMARY.BLUE_DARK`)
- [ ] Text color is `#ffffff` throughout the hero
- [ ] Hero contains: page title (H1), one-line subtitle, and optionally an icon

### No Purple
- [ ] Search file for `#667eea`, `#764ba2`, `#8b5cf6`, `rgb(99, 102, 241)`, `indigo`, `violet`, `purple`
- [ ] Replace any primary/header/accent purple with `V9_COLORS.PRIMARY.BLUE` (`#3b82f6`)
- [ ] Replace any callout border purple with `V9_COLORS.BORDER.INFO` or `V9_COLORS.PRIMARY.BLUE`

### Code Blocks
- [ ] Replace all bare `<pre>`, `<code>` multi-line blocks with the `CodeBlock` styled component
- [ ] Audit every `CodeBlock` template literal for unescaped `${...}` — change to `\${...}` for display placeholders
- [ ] Code blocks use monospace font (JetBrains Mono, Fira Code, or Consolas)
- [ ] Code blocks have `overflow-x: auto` for long lines

### External Links
- [ ] Add `target="_blank" rel="noopener noreferrer"` to every link pointing to an external URL
- [ ] Search for `target="_blank"` without `rel` and `href="https://"` without `target`
- [ ] Internal `<Link to="...">` (React Router) should NOT have `target="_blank"`

### Spec / RFC References
- [ ] Page includes a "Specifications & References" section
- [ ] Links to all directly relevant RFCs, IETF drafts, and OpenID specs
- [ ] All spec links have `target="_blank" rel="noopener noreferrer"`
- [ ] Brief description follows each link explaining what it covers

### Table of Contents (required for pages > ~500 lines)
- [ ] TOC block appears near top of page (after hero, before first section)
- [ ] TOC links are anchor links (`href="#section-id"`) not React Router links
- [ ] All major `H2` headings have matching `id=` attributes
- [ ] TOC is collapsible (nice-to-have) or at minimum visually distinct from body content

### Anchor Navigation
- [ ] Every `H2` section heading has a unique `id` attribute (kebab-case, no spaces)
- [ ] Every `H3` subsection has an `id` if it is reference-worthy
- [ ] IDs are ASCII-safe and match the TOC anchor links exactly

### Typography and Visual Hierarchy
- [ ] One `H1` per page (in the hero/header section only)
- [ ] Major sections use `H2`
- [ ] Sub-sections use `H3`
- [ ] Callout boxes use `V9_COLORS` palette (blue info, amber warning, red error, green success)
- [ ] No inline `style={{backgroundColor: '...'}}` on section containers — use styled components

---

## 📝 Per-Page Notes

### `Documentation.tsx` (Documentation Hub)
- Already the gold standard — has `usePageScroll`, `PageLayoutService`, blue header
- Only fix needed: change `maxWidth: '1200px'` → `'90rem'` in `pageConfig`

### `docs/OIDCOverviewV7.tsx` (OIDC Overview)
- Has `usePageScroll` ✅
- Missing: hero section, spec links, TOC for 677 lines
- `max-width: 1200px` → `90rem`

### `docs/migration/MigrationGuide.tsx` (V7/V8 → V9 Migration Guide)
- Red header ✅ (intentional — migration warning doc)
- Missing: `usePageScroll`, TOC
- Inner `max-width: 860px` → remove (let container handle width)
- Inner `max-width: 700px` on a child element → likely a form/callout, acceptable if intentional

### `docs/OAuth2SecurityBestPractices.tsx` (OAuth 2.0 Security Best Practices)
- Missing: `usePageScroll`, correct CSS interpolation in `PageHeader`
- Current `PageHeader` has: `background: linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE_DARK 0%, V9_COLORS.PRIMARY.BLUE 100%)` — the color values are **literal strings**, not interpolations (missing `${...}`)
- Fix: `background: linear-gradient(135deg, ${V9_COLORS.PRIMARY.BLUE_DARK} 0%, ${V9_COLORS.PRIMARY.BLUE} 100%)`
- Add: TOC, spec links

### `ComprehensiveOAuthEducation.tsx` (OAuth Education)
- Has `usePageScroll` ✅
- Missing: hero section
- Inner card `max-width: 800px` → remove

### `PARvsRAR.tsx` (RAR vs PAR and DPoP Guide)
- Missing: `usePageScroll`, hero section, TOC (1,965 lines!), spec links (RFC 9126, RFC 9396)
- `max-width: 1400px` → `90rem` (almost right, use service)

### `CIBAvsDeviceAuthz.tsx` (CIBA vs Device Authorization)
- Has `usePageScroll` ✅
- Missing: hero section, TOC (1,501 lines), spec links
- Purple border `#8b5cf6` on CIBA callouts → replace with `V9_COLORS.PRIMARY.BLUE`

### `PingOneScopesReference.tsx` (OAuth Scopes Reference)
- Width already `90rem` ✅
- Missing: `usePageScroll`
- Purple/indigo hero → replace with blue gradient
- Consider adding a search/filter input for the scopes list (large reference table)

### `docs/OIDCSpecs.tsx` (OIDC Specifications)
- Only 291 lines — small page, straightforward fix
- Missing: `usePageScroll`, hero, proper code block wrapper
- `max-width: 1200px` → `90rem`
- Is primarily a links/reference list — already has the spec links by nature ✅

### `docs/SpiffeSpirePingOne.tsx` (SPIFFE/SPIRE with PingOne)
- Missing: `usePageScroll`
- Purple hero `#667eea → #764ba2` → replace with blue gradient
- `max-width: 1200px` → `90rem`
- Add spec links (SPIFFE spec, SPIRE docs, PingOne integration guide)

### `PingOneMockFeatures.tsx` (Mock & Educational Features)
- Width already `90rem` ✅
- Missing: `usePageScroll`, blue hero (currently amber/warning)
- Amber/warning hero is misleading — this is a feature guide, not a warning. Replace with blue.

### `OIDC.tsx` (OIDC Information)
- Very short (189 lines) — likely a stub or index page
- Missing: `usePageScroll`, any hero
- If content is thin, consider expanding with proper OIDC overview or redirecting to `OIDCOverview`

### `OIDCSessionManagement.tsx` (OIDC Session Management)
- Hero is blue ✅
- No purple ✅
- Missing: `usePageScroll`, TOC (3,772 lines — most critical TOC need in the whole group)
- Add anchor IDs to all section headings
- Add spec links: OpenID Connect Session Management, Front-Channel Logout, Back-Channel Logout specs

---

## 🎯 Success Metrics

| Goal | Target |
|---|---|
| `usePageScroll` coverage | 14/14 pages |
| Blue (or intentional red) hero | 14/14 pages |
| No purple accents | 14/14 pages |
| Width = `90rem` | 14/14 pages |
| TOC on pages > 500 lines | 5/5 qualifying pages |
| Spec references section | 14/14 pages |
| External link safety | 14/14 pages |
| No unescaped `${...}` in CodeBlocks | 14/14 pages |
