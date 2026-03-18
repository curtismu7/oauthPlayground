# Mock Flow Standardization Plan

## ⚠️ Authoritative Migration Reference

**Newer mock flows already follow the V9 migration standard.** Before implementing anything in this plan, read the authoritative guides in [`A-Migration/`](../A-Migration/):

| Doc | What it covers |
|---|---|
| [`A-Migration/01-MIGRATION-GUIDE.md`](../A-Migration/01-MIGRATION-GUIDE.md) | Quality gates, Modern Messaging, colors, async patterns, import rules |
| [`A-Migration/02-SERVICES-AND-CONTRACTS.md`](../A-Migration/02-SERVICES-AND-CONTRACTS.md) | Service upgrade map, worker token, V9 service status |
| [`A-Migration/03-TESTING-AND-RULES.md`](../A-Migration/03-TESTING-AND-RULES.md) | Zero-tolerance rules, infinite-loop prevention, pre-merge checklist |
| [`A-Migration/04-REFERENCE.md`](../A-Migration/04-REFERENCE.md) | V9 flow template snippet, color constants, guide index |

This plan adds **mock-flow-specific** standards (educational API panels, token display, spec links) on top of the base migration standard. When there is any conflict, `A-Migration/` wins.

---

## 🎯 Objective
Standardize all 31 mock/educational flows to the V9 pattern: fluid sidebar-aware layout, educational API request/response panels, standardized token display, spec reference links, and consistent page chrome (header, restart, scroll).

---

## 📋 Target Pattern: DPoP Authorization Code V9 + V9 Migration Standard

### ✅ What newer flows already do correctly (following A-Migration)
- **Modern Messaging** — wait screens, banners, footer messages, red critical errors (no legacy toast)
- **V9FlowUIService.getFlowUIComponents()** — Container, ContentWrapper, MainCard, CollapsibleSection
- **V9FlowHeader** — consistent page header
- **V9FlowRestartButton** — standardized restart with state reset
- **usePageScroll** — scroll reset on route change
- **V9_COLORS** — approved blue/red/neutral palette (no purple; green/amber status only)
- **`@/v8/...` imports** — correct import depth from `src/pages/flows/v9/`
- **Async cleanup** — `AbortController`, guard setState after unmount
- **Feature parity** with the V7/V8 source flow it replaces

### 🔧 What this plan adds on top
1. **`MockApiCallDisplay`** — educational HTTP request/response panel per flow step
2. **`UltimateTokenDisplay` / `StandardizedTokenDisplay`** — decode/copy/inspect tokens
3. **Spec/RFC reference links** — IETF/OpenID links in every flow
4. **`StandardizedCredentialExportImport`** — save/restore credentials
5. **Fluid layout** — remove all hard-coded `860px / 800px / 1200px` outer widths; use `FlowUIService.ContentWrapper` (`max-width: 90rem`)

---

## 🚫 Requirements

### 1. Zero-Field Entry (Critical)
- **Auto-populate all credentials** with sensible defaults
- **No manual data entry required** for basic flow execution
- **Optional customization** available but not required
- **One-click testing** for all flows

### 2. Page Width — Fluid, Sidebar-Aware Layout (Critical)
Every flow page must fill the available content area and scale correctly as the browser window is resized and as the sidebar is resized (sidebar range: 220 px min → 700 px max, default 520 px).

**The correct pattern** — use `FlowUIService` components directly; do **not** add an additional hard-coded `max-width` on the outer wrapper:

```typescript
const {
  Container,       // min-height: 100vh; padding: 2rem 0 6rem — fills column
  ContentWrapper,  // max-width: 90rem (1440px); margin: 0 auto; padding: 0 1rem
  MainCard,        // white card with border-radius and shadow
} = FlowUIService.getFlowUIComponents();

// In JSX — no extra width div needed:
return (
  <Container>
    <ContentWrapper>
      <MainCard>
        {/* flow content */}
      </MainCard>
    </ContentWrapper>
  </Container>
);
```

For flows that define their own wrapper (not using `FlowUIService`), replace the inline/styled `max-width` with:

```css
/* Correct — fills column, scales with sidebar + browser resize */
width: 100%;
max-width: 90rem;   /* matches FlowUIService.ContentWrapper */
margin: 0 auto;
padding: 0 1.5rem 6rem;
box-sizing: border-box;
```

**Violations to fix (current widths are wrong)**:

| Previous hard-coded width | Flows | Status |
|---|---|---|
| `860px` — too narrow | AttestationClientAuthFlow, GnapFlow, JarJarmFlow, MtlsClientAuthFlow, StepUpAuthFlow, TokenIntrospectionFlow, WIMSEFlow | ✅ Fixed 2026-03-17 → `90rem` |
| `800px` — too narrow | MFALoginHintFlowV9 (inner div), OAuthROPCFlowV9 (inner div), TokenExchangeFlowV9 (inner div) | ✅ Fixed 2026-03-17 → `90rem` |
| `600px` — too narrow | ResourcesAPIFlowV9 (inner card — outer `ContentWrapper` was `1200px`) | ✅ Outer fixed 2026-03-17 → `90rem`; inner 600px on `Subtitle` text-wrap left (acceptable) |
| `1200px` styled-component | McpServerConfigFlowV9, OAuth21InformationalFlowV9, PARFlowV9, PingOneSessionsAPIFlowV9, RARFlowV9, ResourcesAPIFlowV9, WorkerTokenFlowV9 | ✅ Fixed 2026-03-17 → `90rem` |
| `1200px` inline style | JWTBearerTokenFlowV9, ClientCredentialsV9, PingOnePARFlowV9 | ✅ Fixed 2026-03-17 → `90rem` |

**Responsive breakpoints** (already in `App.tsx` theme):
- ≥ `lg` breakpoint: full layout, `padding: 1.5rem 2rem`
- < `lg` breakpoint: `padding: 1rem`, `margin-top: 100px`

**DPoP-Style Layout** (additional layout requirements)
- **Professional collapsible sections** with proper icons
- **V9FlowUIService components** for consistency
- **Responsive design** (desktop/tablet/mobile)

### 3. A-Migration Quality Gates (Critical — applies to every flow)
These are mandatory per [`A-Migration/01-MIGRATION-GUIDE.md`](../A-Migration/01-MIGRATION-GUIDE.md) § 2. Newer flows already satisfy most of these; older flows being migrated must meet all of them:

- **Modern Messaging** — wait screens, banners, footer messages, red critical errors. No `v4ToastManager`, no raw `alert()`.
- **No `console.error` / `console.warn` for runtime failures** — use `logger` + user-facing message.
- **Async cleanup** — `AbortController` on every fetch; guard `setState` with `!signal.aborted`; clear intervals/timeouts on unmount.
- **Flow state machine** — `idle → loading → success → error`; disable submit while in-flight; safe retries.
- **Services-first** — no direct fetch/protocol code in UI; use or extend services in `src/services/v9/`.
- **Colors** — **mock/educational flows use red gradient headers** (`pingRed`); live PingOne flows use blue gradient; no purple; green/amber for status indicators only. Note: `A-Migration/01` § 5 says "blue default" for live flows — mock flows override this with red. See Requirement §5 below.
- **Import depth** — use `@/v8/...` for V8 components/services; use `../../../` from `src/pages/flows/v9/` to reach `src/`.
- **Feature parity** — every function, UI element, and workflow from the V7/V8 source must be present.
- **`tsc --noEmit` + Biome** must pass before merge.

### 4. Restart Functionality — Complete State Clear (Critical)
Clicking restart/clear must reset **all runtime state** accumulated during the flow run. The header, credentials/config fields, and educational text must remain visible. Nothing from a previous run should bleed into the next run.

**Complete reset must clear all of these** (use `null` or initial value as appropriate):

```typescript
const handleReset = useCallback(() => {
  // 1. Step navigation
  setStep(0);           // or resetSteps() + setCurrentStep(0) if using FloatingStepperContext

  // 2. ALL API result state — every intermediate and final response
  setAttestResult(null);    // or setTokenResult, setCertResult, setWitResult,
  setTokenResult(null);     //    setExchangeResult, setAuthorizationUrl,
  setError(null);           //    setAuthCode, setTokens, setApiResponse, etc.

  // 3. Loading state — never leave a spinner after reset
  setLoading(false);

  // 4. Collapsible sections — re-collapse result sections, expand step 1
  setCollapsedSections({ step1: false, step2: true, step3: true, ... });

  // 5. Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 6. User feedback via Modern Messaging (required)
  modernMessaging.showBanner({
    type: 'info',
    title: 'Flow reset',
    message: 'All progress has been cleared. Start again from step 1.',
    dismissible: true,
  });
}, [...]);
```

**What must NOT be cleared on reset:**
- Credential/config fields (clientId, scope, environmentId, etc.) — user filled these in; preserve them
- The page header (`V9FlowHeader`)
- Educational text, callout boxes, spec links

**Back navigation vs full reset:**
"Back" (previous step) must also clear the results of the step being left so they don't reappear. Example: navigating back from Step 2 to Step 1 must null `attestResult` / `tokenResult` accumulated in Step 2.

```typescript
// ← Back from step 2 to step 1: clear step 2's result
<Button $variant="secondary" onClick={() => { setAttestResult(null); setStep(1); }}>
  ← Back
</Button>
```

**Common gaps found (March 2026):**

| Flow | Missing from reset |
|---|---|
| `AttestationClientAuthFlow` | `setLoading(false)`, scroll to top, Modern Messaging feedback |
| `MtlsClientAuthFlow` | `setLoading(false)`, scroll to top, Modern Messaging feedback |
| `WIMSEFlow` | `setLoading(false)`, scroll to top, Modern Messaging feedback |
| `V7MClientCredentialsV9` | `setLoading(false)` (uses `fetchingToken` state) |
| Multiple V7M flows | Back navigation doesn't clear step results before reverting step |

### 5. Header Color — Red with White Text for Mock/Educational Flows (Critical)
Mock and educational flows **must** use a **red gradient header with white text**. This visually signals to users that the flow is a simulation — not a live API call — and distinguishes mock flows from the production PingOne flows (which use blue headers).

**Standard mock flow header** — use the `pingRed` theme throughout:

```tsx
// When using FlowUIService.getStepHeader():
const StepHeader = FlowUIService.getStepHeader('pingRed');
// Produces: linear-gradient(135deg, #ef4444 0%, #dc2626 100%), color: #ffffff

// When using CollapsibleHeaderAdapter:
<CollapsibleHeaderAdapter theme="pingRed" ... />

// When using V9FlowHeader:
<V9FlowHeader flowId="my-mock-flow-v9" customConfig={{ flowType: 'mock' }} />
// (V9FlowHeader derives color from flow config — ensure the flow config maps to red/pingRed)
```

**For flows that define their own `PageTitle` or section headers** (AttestationClientAuthFlow, MtlsClientAuthFlow, WIMSEFlow, GnapFlow, JarJarmFlow etc.), update the styled-components:

```typescript
const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  padding: 1.5rem 2rem;
  border-radius: 0.75rem 0.75rem 0 0;
  margin: 0 0 1.5rem 0;
`;
```

**Color values (use exactly these — match `V9_COLORS` where possible):**
- Background: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`
- Text: `#ffffff`
- Accent/badge: `rgba(255, 255, 255, 0.2)` border, `rgba(255, 255, 255, 0.9)` text

**Rule:**
- ✅ Mock/educational flows → `pingRed` / red gradient header + white text
- ✅ Live PingOne flows (real API calls) → blue gradient (`#2563eb → #1e40af`) + white text
- ❌ No dark text on a red/colored header — always white
- ❌ No black or grey page titles on mock flows

**Flows with non-red, non-conforming headers to update (March 2026):**

| Flow | Current header | Needs |
|---|---|---|
| `AttestationClientAuthFlow` | Plain `PageTitle` (black text, no background) | Red gradient + white |
| `MtlsClientAuthFlow` | Plain `PageTitle` (black text, no background) | Red gradient + white |
| `WIMSEFlow` | Plain `PageTitle` (black text, no background) | Red gradient + white |
| `GnapFlow` | Custom `Btn`-based layout, no StepHeader | Red gradient + white |
| `JarJarmFlow` | Custom layout, no StepHeader | Red gradient + white |
| `StepUpAuthFlow` | Custom layout | Red gradient + white |
| `TokenIntrospectionFlow` | Custom layout | Red gradient + white |
| V7M flows using `getStepHeader` | Check theme arg — must be `'pingRed'` | Verify/update |


- **Use `CollapsibleToggleIcon`** from `FlowUIService.getFlowUIComponents()`
- **Consistent chevron behavior** (points right when collapsed, down when expanded)
- **Proper accessibility** with ARIA labels
- **Smooth transitions** (0.15s ease-in-out)

### 6. Button Color Rules — No Grey Enabled Buttons (High)
Grey is reserved **exclusively** for disabled/unavailable buttons (the system automatics: `opacity: 0.6` + `background-color: #9ca3af` on `:disabled`). An enabled button must always use a colored variant that communicates its action.

**Approved button variants** (from `FlowUIService.getButton()`):

| Variant | Use for | Color |
|---|---|---|
| `primary` (default) | Primary action, advance step | Blue `#3b82f6` → hover `#2563eb` |
| `secondary` / `outline` | Secondary action, show/generate | White bg + blue border `#3b82f6` |
| `danger` | Destructive / reset confirmation | Red `#ef4444` |
| `success` | Final submit / confirm success | Green `#22c55e` (status only) |
| **disabled** | Action not yet available | `#9ca3af` grey — set via `disabled` prop, never inline |

**"Back" navigation buttons** must use `secondary` or `outline`, **not** `ghost` (grey). Back is still a valid, available action.

**Rules:**
- ❌ `$variant="ghost"` — do not use; replace with `secondary` or `outline`
- ❌ `background: '#6b7280'` / `'#9ca3af'` / `'#e5e7eb'` on an **enabled** button — use `disabled` prop instead
- ❌ `background: isLoading ? '#9ca3af' : '#3b82f6'` — use `disabled={isLoading}` and let the system style it
- ✅ `<Button $variant="secondary" onClick={...}>← Back</Button>`
- ✅ `<Button $variant="primary" onClick={...} disabled={isLoading || !requiredValue}>Submit</Button>`

**Flows with violations to fix:**

| Flow | Issue |
|---|---|
| `AttestationClientAuthFlow.tsx` | `Btn $variant="ghost"` on Back buttons |
| `GnapFlow.tsx` | `Btn $variant="ghost"` on Back buttons |
| `JarJarmFlow.tsx` | `Btn $variant="ghost"` on Back buttons |
| `JWTBearerTokenFlowV9.tsx` | `background: isLoading ? '#9ca3af' : ...` inline; `background: '#6b7280'` on enabled step button |
| `DeviceAuthorizationVerifyPage.tsx` | `background: '#6b7280'` inline on enabled button |
| `MFALoginHintFlowV9.tsx` | `background: !isLoading && valid ? '#10b981' : '#9ca3af'` inline — use `disabled` prop |

### 6. API Call Logging (Critical)
- **Log all mock API calls** to the logging system
- **Write to appropriate log files** (oauth.log, mfa.log, etc.)
- **Include request/response details** for debugging
- **Timestamp all API calls** for traceability
- **Educational value** - users can see what's happening behind the scenes

### 6. MockApiCallDisplay — Educational Request/Response Panel (Critical)
Every flow step that performs (or simulates) an API call **must** render a `<MockApiCallDisplay>` before the action button. This gives learners a complete view of the HTTP request and expected response before they click.
- **Import**: `import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay';`
- **Props**: `title`, `method`, `url`, `headers`, `body`, `response: {status, statusText, headers, data}`, `description`, `note`, `defaultExpanded`
- **Gold pattern**: `V7MClientCredentialsV9.tsx` — copy/adapt for each flow
- **`***REDACTED***`** must be used for any credential value shown in the `body` prop (e.g. `client_secret`)

**Current coverage (March 2026)**:
| Flows with MockApiCallDisplay | Flows missing it |
|---|---|
| V7MClientCredentialsV9, V7MDeviceAuthorizationV9, V7MCIBAFlowV9, V7MImplicitFlowV9, V7MROPCV9, V7MOAuthAuthCodeV9, V7MOIDCHybridFlowV9, OAuthROPCFlowV9, ClientCredentialsV9, SAMLBearerAssertionFlowV9, JWTBearerTokenFlowV9, MFALoginHintFlowV9 (12) | AttestationClientAuthFlow, MtlsClientAuthFlow, WIMSEFlow, RARFlowV9, DPoPAuthorizationCodeFlowV9, GnapFlow, JarJarmFlow, PARFlowV9, PingOnePARFlowV9, TokenExchangeFlowV9, TokenIntrospectionFlow, StepUpAuthFlow, MFAWorkflowLibraryFlowV9, ResourcesAPIFlowV9, McpServerConfigFlowV9, OAuth21InformationalFlowV9, PingOneSessionsAPIFlowV9, WorkerTokenFlowV9, DeviceAuthorizationVerifyPage (19) |

### 7. Token Display — Use the Standardized Token Display Service (High)
This is an **educational playground** — tokens are intentionally shown in full so learners can inspect, decode, and understand them. Do **not** add blanket masking. Instead, use the existing token display components that provide decode / encode / copy / mask-toggle in one place.

**Preferred components** (in order of preference):

```typescript
// Option A — Full featured (decode, copy, mask toggle, JWT claims, metadata)
import { UltimateTokenDisplay } from '../../../components/UltimateTokenDisplay';
// Props: tokens, flowType, displayMode='educational', showDecodeButtons, showCopyButtons, showMaskToggle, showEducationalInfo
<UltimateTokenDisplay
  tokens={tokenResult}
  flowType="oauth"
  displayMode="educational"
  showDecodeButtons={true}
  showCopyButtons={true}
  showMaskToggle={true}
  showEducationalInfo={true}
/>

// Option B — Consistent multi-token layout (access + id + refresh)
import StandardizedTokenDisplay from '../../../components/StandardizedTokenDisplay';
// Props: tokens, backgroundColor, borderColor
<StandardizedTokenDisplay tokens={tokenResult} />

// Option C — Single inline token with copy + mask toggle
import InlineTokenDisplay from '../../../components/InlineTokenDisplay';
```

**Do NOT** use raw token display patterns like `<Pre>{tokenResult.access_token}</Pre>` — these give learners no decode/copy affordance. Replace them with one of the components above.

**Current coverage (March 2026)**: Most flows use raw `<Pre>` or `<CodeBlock>` to display token strings — 17/31 flows need to be migrated to use the token display service.

### 8. V9FlowHeader — Consistent Page Header (High)
All flows must use `<V9FlowHeader flowId="..." />` as the first element inside the wrapper. This provides:
- Flow title, subtitle, and PingOne badge
- Breadcrumb navigation
- Consistent top-of-page branding

**Current coverage**: 17/31 flows have it. Missing from: `AttestationClientAuthFlow`, `DPoPAuthorizationCodeFlowV9`, `DeviceAuthorizationVerifyPage`, `GnapFlow`, `JarJarmFlow`, `MFAWorkflowLibraryFlowV9`, `MtlsClientAuthFlow`, `PingOnePARFlowV9`, `ResourcesAPIFlowV9`, `StepUpAuthFlow`, `TokenIntrospectionFlow`, `WIMSEFlow`, `WorkerTokenFlowV9`.

### 9. usePageScroll — Scroll Management (Medium)
All flows must call `usePageScroll({ pageName: '...', force: false })` at the top of the component. This prevents jarring scroll position carry-over between route changes.

```typescript
import { usePageScroll } from '../../../hooks/usePageScroll';
// Inside component:
usePageScroll({ pageName: 'My Flow V9', force: false });
```

**Current coverage**: 9/31 flows use it. Missing from 22 flows.

### 10. Spec / RFC Reference Links (Medium)
Every flow must include a collapsible or footer "Spec References" card with links to the relevant IETF RFCs, OpenID Foundation specs, or IETF drafts. This is core educational value.

Format (reuse existing pattern from `WIMSEFlow.tsx`, `AttestationClientAuthFlow.tsx`):
```tsx
<Card>
  <CardTitle>Spec References</CardTitle>
  <ul>
    <li><a href="https://www.rfc-editor.org/rfc/rfcXXXX" target="_blank" rel="noopener noreferrer">RFC XXXX</a> — Description</li>
  </ul>
</Card>
```

**Current coverage**: 8/31 flows have spec links (AttestationClientAuthFlow, DPoP, GnapFlow, JarJarmFlow, MtlsClientAuthFlow, StepUpAuthFlow, TokenIntrospectionFlow, WIMSEFlow). The 23 remaining flows need them added.

### 11. StandardizedCredentialExportImport — Credential Persistence (Medium)
All flows that accept user-configurable credentials (environmentId, clientId, etc.) must include `<StandardizedCredentialExportImport>` so users can save and restore their settings across sessions and devices.

```typescript
import { StandardizedCredentialExportImport } from '../../../components/StandardizedCredentialExportImport';
```

**Current coverage**: Only 2/31 flows (PARFlowV9, RARFlowV9). All remaining credential-bearing flows need this added.

---

## 🔍 Available Infrastructure

### V9FlowUIService (Complete Component Library)
```typescript
const {
  Container,           // 1200px max-width, responsive
  StepHeader,          // Professional step indicators
  CollapsibleSection,  // With proper icons
  CollapsibleHeaderButton,
  CollapsibleTitle,
  CollapsibleToggleIcon, // The correct chevron icon!
  CollapsibleContent,
  Button,              // Styled buttons
  Input,               // Styled inputs
  InfoBox,             // Educational content
} = V9FlowUIService.getFlowUIComponents();
```

### CollapsibleIcon Component
```typescript
import { CollapsibleIcon } from '../components/CollapsibleIcon';

// Used in FlowUIService with proper rotation:
styled(CollapsibleIcon).attrs<{ $collapsed?: boolean }>(({ $collapsed }) => ({
  isExpanded: !$collapsed,
}))
```

### V9CredentialStorageService
```typescript
// Auto-load stored credentials
const saved = V9CredentialStorageService.loadSync('flow-key');
// Auto-save credentials
V9CredentialStorageService.save('flow-key', credentials);
```

### Mock Services
- **V9MockTokenService** - Token generation
- **V9MockDeviceAuthorizationService** - Device codes
- **V9MockIntrospectionService** - Token validation

### Logging Service
```typescript
// Backend API endpoint for writing logs
POST /api/logs/write
{
  file: 'oauth.log' | 'mfa.log' | 'client.log' | 'server.log',
  message: string,
  level: 'info' | 'error' | 'warn' | 'debug'
}

// Example usage in mock flows:
const logMockApiCall = async (
  endpoint: string,
  method: string,
  request: any,
  response: any
) => {
  const logMessage = `[MOCK] ${method} ${endpoint}\nRequest: ${JSON.stringify(request, null, 2)}\nResponse: ${JSON.stringify(response, null, 2)}`;
  
  await fetch('/api/logs/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: 'oauth.log',
      message: logMessage,
      level: 'info'
    })
  });
};
```

---

## 📊 Flow Inventory

### OIDC / OAuth V7M Mock Flows (8 flows)
- `V7MCIBAFlowV9.tsx` — CIBA (Backchannel)
- `V7MClientCredentialsV9.tsx` — Client Credentials ✅ Gold standard for MockApiCallDisplay
- `V7MDeviceAuthorizationV9.tsx` — Device Authorization
- `V7MImplicitFlowV9.tsx` — Implicit Flow
- `V7MOAuthAuthCodeV9.tsx` — Authorization Code
- `V7MOIDCHybridFlowV9.tsx` — Hybrid Flow
- `V7MROPCV9.tsx` — Resource Owner Password (ROPC)
- `OAuthROPCFlowV9.tsx` — ROPC (duplicate/updated variant)

### Standard V9 OAuth Flows (7 flows)
- `ClientCredentialsV9.tsx` — Client Credentials (PingOne live)
- `DPoPAuthorizationCodeFlowV9.tsx` — DPoP ✅ TARGET PATTERN for layout
- `JWTBearerTokenFlowV9.tsx` — JWT Bearer Token
- `PARFlowV9.tsx` — Pushed Authorization Requests
- `PingOnePARFlowV9.tsx` — PAR (PingOne-specific)
- `RARFlowV9.tsx` — Rich Authorization Requests
- `SAMLBearerAssertionFlowV9.tsx` — SAML Bearer Assertion

### Advanced / Emerging Protocol Flows (7 flows)
- `AttestationClientAuthFlow.tsx` — Attestation-Based Client Auth (IETF draft)
- `GnapFlow.tsx` — GNAP (Grant Negotiation and Authorization Protocol)
- `JarJarmFlow.tsx` — JAR/JARM (JWT-Secured Auth Request/Response)
- `MtlsClientAuthFlow.tsx` — mTLS Certificate-Bound Tokens (RFC 8705)
- `OAuth21InformationalFlowV9.tsx` — OAuth 2.1 (informational)
- `TokenExchangeFlowV9.tsx` — Token Exchange (RFC 8693)
- `WIMSEFlow.tsx` — WIMSE Workload Identity

### MFA / Session Flows (4 flows)
- `MFALoginHintFlowV9.tsx` — MFA with login_hint
- `MFAWorkflowLibraryFlowV9.tsx` — MFA Workflow Library
- `PingOneSessionsAPIFlowV9.tsx` — PingOne Sessions API
- `StepUpAuthFlow.tsx` — Step-Up Authentication

### Utility / Info Flows (5 flows)
- `DeviceAuthorizationVerifyPage.tsx` — Device Auth verification page
- `McpServerConfigFlowV9.tsx` — MCP Server Configuration
- `ResourcesAPIFlowV9.tsx` — Resources API
- `TokenIntrospectionFlow.tsx` — Token Introspection
- `WorkerTokenFlowV9.tsx` — Worker Token

**Total: 31 flows to standardize** (up from original 18 estimate)

---

## 🚀 Implementation Strategy

### Phase 1: Create Standardized Template

#### Base Component Structure
```typescript
interface StandardizedMockFlowConfig {
  flowId: string;
  flowKey: string;
  title: string;
  description: string;
  steps: StepMetadata[];
  defaultCredentials: DefaultCredentials;
  mockServices: MockServiceInterfaces;
  autoPopulate: boolean;
  layoutTheme: 'green' | 'orange' | 'blue' | 'pingRed' | 'red';
}

const V9StandardizedMockFlow: React.FC<StandardizedMockFlowConfig> = ({
  flowId,
  flowKey,
  title,
  description,
  steps,
  defaultCredentials,
  mockServices,
  autoPopulate = true,
  layoutTheme = 'blue',
}) => {
  // Use existing services
  const { credentials } = useAutoPopulatedCredentials(flowKey, defaultCredentials);
  const { handleRestart } = useFlowRestart({ flowKey });
  
  // Use V9FlowUIService components
  const {
    Container,
    StepHeader,
    CollapsibleSection,
    Button,
    Input,
  } = V9FlowUIService.getFlowUIComponents();
  
  // Standardized DPoP-style layout
  return (
    <Container>
      <StepHeader>{/* Professional step indicator */}</StepHeader>
      <CollapsibleSection>{/* Auto-populated content */}</CollapsibleSection>
      <V9FlowRestartButton onRestart={handleRestart} />
    </Container>
  );
};
```

#### Step Metadata Structure
```typescript
interface StepMetadata {
  title: string;
  subtitle: string;
  description: string;
  autoExecute?: boolean;
  dependencies?: string[];
  mockService?: string;
  component?: React.ComponentType<StepProps>;
}
```

### Phase 2: Zero-Field Entry & API Logging Implementation

#### API Call Logging Integration
```typescript
// Create a reusable logging service for mock flows
class MockFlowLoggingService {
  private static async writeLog(
    file: string,
    message: string,
    level: 'info' | 'error' | 'warn' | 'debug' = 'info'
  ): Promise<void> {
    try {
      await fetch('/api/logs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, message, level })
      });
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  static async logMockApiCall(
    flowName: string,
    endpoint: string,
    method: string,
    request: any,
    response: any,
    logFile: string = 'oauth.log'
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = [
      `[${timestamp}] [MOCK FLOW: ${flowName}]`,
      `${method} ${endpoint}`,
      `Request: ${JSON.stringify(request, null, 2)}`,
      `Response: ${JSON.stringify(response, null, 2)}`,
      '---'
    ].join('\n');

    await this.writeLog(logFile, logMessage, 'info');
  }

  static async logMockError(
    flowName: string,
    error: string,
    context: any,
    logFile: string = 'oauth.log'
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = [
      `[${timestamp}] [MOCK FLOW ERROR: ${flowName}]`,
      `Error: ${error}`,
      `Context: ${JSON.stringify(context, null, 2)}`,
      '---'
    ].join('\n');

    await this.writeLog(logFile, logMessage, 'error');
  }
}

// Usage in mock flows:
// After each mock API call
await MockFlowLoggingService.logMockApiCall(
  'Client Credentials V9',
  '/token',
  'POST',
  { grant_type: 'client_credentials', client_id: 'xxx' },
  { access_token: 'mock_token_xxx', expires_in: 3600 },
  'oauth.log'
);
```

#### Default Credentials by Flow Type
```typescript
const DEFAULT_CREDENTIALS = {
  'client-credentials': {
    clientId: 'v7m-client-credentials',
    clientSecret: 'topsecret',
    scope: 'read write',
    environmentId: 'demo-env',
  },
  'device-authorization': {
    clientId: 'v7m-device-client',
    scope: 'read write',
    userEmail: 'jane.doe@example.com',
    environmentId: 'demo-env',
  },
  'jwt-bearer': {
    clientId: 'jwt-bearer-client',
    clientSecret: 'topsecret',
    tokenEndpoint: 'https://api.pingone.com/oauth2/token',
    environmentId: 'demo-env',
  },
  'oauth-authz-code': {
    clientId: 'v7m-oauth-authz-code',
    clientSecret: 'topsecret',
    redirectUri: 'https://localhost:3000/callback',
    scope: 'openid profile email',
    environmentId: 'demo-env',
  },
  'implicit': {
    clientId: 'v7m-implicit-client',
    redirectUri: 'https://localhost:3000/callback',
    scope: 'openid profile email',
    environmentId: 'demo-env',
  },
  'ropc': {
    clientId: 'v7m-ropc-client',
    clientSecret: 'topsecret',
    username: 'jane.doe@example.com',
    password: 'P@ssw0rd123',
    scope: 'openid profile email',
    environmentId: 'demo-env',
  },
  'ciba': {
    clientId: 'v7m-ciba-client',
    clientSecret: 'topsecret',
    loginHint: 'jane.doe@example.com',
    scope: 'openid profile email',
    environmentId: 'demo-env',
  },
  'hybrid': {
    clientId: 'v7m-hybrid-client',
    clientSecret: 'topsecret',
    redirectUri: 'https://localhost:3000/callback',
    scope: 'openid profile email',
    responseType: 'code id_token',
    environmentId: 'demo-env',
  },
};
```

#### Auto-Population Hook
```typescript
const useAutoPopulatedCredentials = (flowKey: string, defaults: DefaultCredentials) => {
  const [credentials, setCredentials] = useState(defaults);
  
  useEffect(() => {
    // Try to load saved credentials first
    const saved = V9CredentialStorageService.loadSync(flowKey);
    if (saved && Object.keys(saved).length > 0) {
      setCredentials({ ...defaults, ...saved });
    } else {
      // Use defaults and save them
      setCredentials(defaults);
      V9CredentialStorageService.save(flowKey, defaults);
    }
  }, [flowKey, defaults]);
  
  return { credentials, setCredentials };
};
```

### Phase 3: Collapsible Icon Standardization

#### Standard Collapsible Section
```typescript
const StandardCollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  isCollapsed,
  onToggle,
  variant = 'default',
}) => {
  const theme = getThemeFromVariant(variant);
  const {
    CollapsibleSection: Section,
    CollapsibleHeaderButton: HeaderButton,
    CollapsibleTitle: Title,
    CollapsibleToggleIcon: ToggleIcon,
    CollapsibleContent: Content,
  } = V9FlowUIService.getFlowUIComponents();

  return (
    <Section>
      <HeaderButton onClick={onToggle} $collapsed={isCollapsed}>
        <Title>{title}</Title>
        <ToggleIcon $collapsed={isCollapsed} />
      </HeaderButton>
      {!isCollapsed && <Content>{children}</Content>}
    </Section>
  );
};
```

### Phase 4: Restart Functionality

#### Standardized Restart Hook
```typescript
interface RestartConfig {
  resetSteps: boolean;
  clearFormData: boolean;
  clearApiResponses: boolean;
  clearCredentials: boolean;
  scrollReset: boolean;
  showConfirmation: boolean;
}

const useFlowRestart = (config: RestartConfig) => {
  const handleRestart = useCallback(() => {
    // Reset step navigation
    if (config.resetSteps) setCurrentStep(0);
    
    // Clear form data
    if (config.clearFormData) setFormData(getDefaultFormData());
    
    // Clear API responses
    if (config.clearApiResponses) setApiResponses({});
    
    // Reset credentials
    if (config.clearCredentials) setCredentials(getDefaultCredentials());
    
    // Scroll to top
    if (config.scrollReset) window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show confirmation
    if (config.showConfirmation) {
      modernMessaging.showBanner({
        type: 'success',
        title: 'Flow Reset',
        message: 'All data has been cleared. Start again from step 1.',
        dismissible: true,
      });
    }
  }, [config]);
  
  return { handleRestart };
};
```

---

## 🎯 Priority Implementation Order

> **Start by reading [`A-Migration/01-MIGRATION-GUIDE.md`](../A-Migration/01-MIGRATION-GUIDE.md) and [`A-Migration/03-TESTING-AND-RULES.md`](../A-Migration/03-TESTING-AND-RULES.md)** before touching any flow. Newer flows (OAuthROPCFlowV9, PARFlowV9, RARFlowV9, SAMLBearerAssertionFlowV9, etc.) are already V9-migrated; they only need the mock-specific additions below.

### Phase 1: Mock-specific additions to already-migrated flows (highest ROI)
1. **Add `MockApiCallDisplay`** to all 19 flows that are missing it — start with AttestationClientAuthFlow, MtlsClientAuthFlow, WIMSEFlow, RARFlowV9
2. **Replace raw `<Pre>` token renders** with `<UltimateTokenDisplay>` in 17 flows
3. **Fix hard-coded narrow widths** (860 px / 800 px flows) → `FlowUIService.ContentWrapper`

### Phase 2: Page chrome gaps in older-style flows
1. **V9FlowHeader + V9FlowRestartButton + usePageScroll** — add to the 9 flows missing all three
2. **Spec/RFC reference links** — add to the 23 flows without them

### Phase 3: Full V9 migration of flows still using old patterns
1. **AttestationClientAuthFlow** → full V9 migration per A-Migration guide
2. **MtlsClientAuthFlow** → full V9 migration
3. **WIMSEFlow** → full V9 migration
4. **GnapFlow, JarJarmFlow, StepUpAuthFlow, TokenIntrospectionFlow** → V9 migration

### Phase 4: Credential persistence
1. Add `<StandardizedCredentialExportImport>` to all credential-bearing flows (29 still missing it)

---

## 📋 Migration Checklist (Per Flow)

> **First**: run [`A-Migration/03-TESTING-AND-RULES.md`](../A-Migration/03-TESTING-AND-RULES.md) § 5 pre-merge checklist on any flow you touch.

### A-Migration Quality Gates (mandatory — from `A-Migration/01` § 2)
- [ ] Modern Messaging used (wait / banner / footer / red critical error) — no `v4ToastManager`
- [ ] No `console.error` / `console.warn` for runtime failures
- [ ] Async effects have `AbortController` cleanup; no `setState` after unmount
- [ ] Flow state: `idle → loading → success → error`; submit disabled while in-flight
- [ ] Services-first: no direct fetch in UI component
- [ ] Colors: blue gradient header; no purple; green/amber for status indicators only
- [ ] Import depth: `@/v8/...` for V8 imports, `../../../` from `src/pages/flows/v9/`
- [ ] Feature parity with V7/V8 source verified
- [ ] `tsc --noEmit` passes · Biome lint passes · no unused imports

### Layout — Fluid, Sidebar-Aware
- [ ] Remove all hard-coded `max-width: 860px / 800px / 600px / 1200px` on outer wrappers
- [ ] Use `FlowUIService.getFlowUIComponents()` → `Container` + `ContentWrapper` + `MainCard`
- [ ] For custom wrappers: `width: 100%; max-width: 90rem; margin: 0 auto`
- [ ] Test at 1024 px viewport with sidebar at max width (700 px) — content still usable
- [ ] Test at 1440 px+ — content fills column, not artificially capped

### Button Colors
- [ ] Remove all `$variant="ghost"` — replace Back/navigation buttons with `$variant="secondary"` or `$variant="outline"`
- [ ] Remove all inline `background: '#9ca3af'` / `'#6b7280'` / `'#e5e7eb'` on enabled buttons
- [ ] Replace `background: isLoading ? '#9ca3af' : '#3b82f6'` patterns with `disabled={isLoading}` prop — let the system apply grey
- [ ] Primary actions → `$variant="primary"` (blue)
- [ ] Back / secondary actions → `$variant="secondary"` or `$variant="outline"` (white + blue border)
- [ ] Destructive / reset → `$variant="danger"` (red)

### MockApiCallDisplay — API Request/Response
- [ ] Add `import { MockApiCallDisplay } from '../../../components/MockApiCallDisplay'`
- [ ] Add `<MockApiCallDisplay>` before the action button in each flow step
- [ ] Use `'***REDACTED***'` for any credential value in the `body` prop
- [ ] Set `defaultExpanded={true}` for the first/primary call in a flow
- [ ] Show real `tokenResult` / `exchangeResult` data in the `response.data` prop when available
- [ ] Include `description` explaining the protocol purpose and `note` clarifying mock status

### Token Display Service
- [ ] Remove raw `<Pre>{tokenResult.access_token}</Pre>` / `<CodeBlock>` token renders
- [ ] Replace with `<UltimateTokenDisplay>` (decode + copy + mask toggle) where full features are wanted
- [ ] Or `<StandardizedTokenDisplay>` for a compact multi-token layout
- [ ] Ensure `showDecodeButtons={true}` and `showCopyButtons={true}` so learners can inspect JWT claims

### Page Chrome & Header Color
- [ ] Add `<V9FlowHeader flowId="..." />` as first child inside the wrapper
- [ ] Add `<V9FlowRestartButton>` in the header area
- [ ] Add `usePageScroll({ pageName: '...', force: false })` at top of component
- [ ] **Header color must be red** (`pingRed` theme: `linear-gradient(135deg, #ef4444 0%, #dc2626 100%)`)
- [ ] **Header text must be white** (`#ffffff`) — no black/dark text on colored headers
- [ ] Replace any plain `PageTitle` styled-component with one using the red gradient
- [ ] Update `getStepHeader` calls to use `'pingRed'` theme
- [ ] Update `<CollapsibleHeaderAdapter>` to use `theme="pingRed"`

### Spec References
- [ ] Add a "Spec References" card/section with links to relevant RFCs / IETF drafts
- [ ] Use `target="_blank" rel="noopener noreferrer"` on all external links

### Credential Persistence
- [ ] Add `<StandardizedCredentialExportImport>` section for any flow with user-configurable credentials
- [ ] Wire `onCredentialsImported` to update local state

### Zero-Field Entry
- [ ] Auto-populate all credentials from DEFAULT_CREDENTIALS
- [ ] No required user input for basic flow execution
- [ ] Optional customization available via CompactAppPicker
- [ ] Credentials persist across sessions

### Layout & Sizing — Fluid, Sidebar-Aware
- [ ] Remove all hard-coded `max-width: 860px / 800px / 600px / 1200px` on outer wrappers
- [ ] Replace with `FlowUIService.getFlowUIComponents()` → `Container` + `ContentWrapper` + `MainCard`
- [ ] For flows with custom wrappers: set `width: 100%; max-width: 90rem; margin: 0 auto`
- [ ] **No `max-width` in inline styles on the page root** — let `ContentWrapper` do it
- [ ] Test at 1024 px viewport with sidebar at max width (700 px) — content must still be usable
- [ ] Test at 1440 px+ viewport — content should expand to fill column, not be artificially capped

### Restart / Clear — Complete State Reset
- [ ] `setStep(0)` (or `resetSteps()` + `setCurrentStep(0)`) to return to step 1
- [ ] **Every API result state nulled**: token results, intermediate results, error, authorization URL, auth code, API responses — anything set during a flow run
- [ ] `setLoading(false)` — never leave a spinner active after reset
- [ ] Collapsible sections reset: step 1 expanded, all result sections collapsed
- [ ] `window.scrollTo({ top: 0, behavior: 'smooth' })`
- [ ] Modern Messaging feedback: `modernMessaging.showBanner({ type: 'info', title: 'Flow reset', ... })`
- [ ] **Credentials/config fields preserved** — do NOT clear clientId, scope, environmentId, etc.
- [ ] Back navigation clears the results of the current step before reverting (not just `setStep(prev - 1)`)
- [ ] Use `<V9FlowRestartButton onRestart={handleReset} />` — do not implement custom restart UI

### Collapsible Icons
- [ ] Use CollapsibleIcon component from FlowUIService
- [ ] Ensure chevron rotation (right when collapsed, down when expanded)
- [ ] Add smooth transitions (0.15s ease-in-out)
- [ ] Test accessibility with proper ARIA labels

### API Call Logging
- [ ] Integrate MockFlowLoggingService into all flows
- [ ] Log all mock API calls (token requests, device auth, etc.)
- [ ] Write to appropriate log files (oauth.log, mfa.log, client.log)
- [ ] Include request/response details in logs
- [ ] Add timestamps to all log entries
- [ ] Log errors with context for debugging
- [ ] Test log file creation and writing

### Cross-Flow Consistency
- [ ] Same button placement (top-right corner)
- [ ] Same button styling (V9FlowRestartButton)
- [ ] Same reset behavior (consistent state clearing)
- [ ] Same feedback messages (standardized notifications)

---

## 🎯 Success Metrics

### Consistency Goals
- ✅ **100%** of flows use DPoP pattern
- ✅ **100%** have consistent API call displays
- ✅ **100%** show mock status indicators
- ✅ **100%** use modern messaging system
- ✅ **100%** have standardized credential management

### UX Goals
- 📱 **Responsive design** on all flows
- 🎯 **Clear step progression** with dependencies
- 💬 **Consistent messaging** and feedback
- 🔧 **Easy configuration** and testing
- 📚 **Educational value** with examples

---

## 📐 Layout Standards

### Correct Width Chain

```
Browser viewport
  └── App layout (flex row)
        ├── Sidebar: 220 px–700 px (resizable, default 520 px)
        └── MainContent: flex: 1; width: 100%; max-width: 100%; overflow-y: auto
              └── FlowUIService.Container: min-height: 100vh; padding: 2rem 0 6rem
                    └── FlowUIService.ContentWrapper: max-width: 90rem (1440px); margin: 0 auto; padding: 0 1rem
                          └── FlowUIService.MainCard: white card, no fixed width (fills ContentWrapper)
```

The **only** width constraint that matters is `ContentWrapper`'s `max-width: 90rem`. Everything inside should use `width: 100%` or let normal block layout fill the card. Any additional `max-width` on inner elements (860 px, 800 px, 600 px, 1200 px) should be removed unless it constrains a specific sub-component (e.g. a form field or modal).

### Target Dimensions
```typescript
const STANDARD_LAYOUT = {
  outerMaxWidth: '90rem',      // 1440px — ContentWrapper ceiling (matches FlowUIService)
  margin: '0 auto',            // Centered within MainContent column
  desktopPadding: '0 1rem',    // ContentWrapper horizontal padding
  mainContentPadding: '1.5rem 2rem', // App.tsx MainContent (@media ≥ lg)
  mobilePadding: '1rem',       // App.tsx MainContent (@media < lg)
};
```

### Sidebar impact on available width
The sidebar is resizable from **220 px** to **700 px** (default 520 px). Flows must **never** use a fixed `max-width` that is close to or larger than the available column space. At the narrowest practical viewport (e.g. 1024 px wide + 700 px sidebar = 324 px for content) flows must still be usable — which means `width: 100%` fluid layout, not fixed pixel widths.

### Responsive Breakpoints
```typescript
const RESPONSIVE_BREAKPOINTS = {
  desktop: '1200px',  // Full layout
  tablet: '768px',    // Reduced padding
  mobile: '480px',    // Minimal padding, full width
};
```

---

## 🔧 Testing Requirements

### Layout Testing
- ✅ **At ≥ lg breakpoint**: full padding (`1.5rem 2rem` from `App.tsx MainContent`)
- ✅ **At < lg breakpoint**: reduced padding (`1rem`, `margin-top: 100px`)
- ✅ **Sidebar at max (700 px) + 1024 px viewport**: flow must still be usable (no horizontal scroll, no overflow)
- ✅ **Wide viewport (1440 px+)**: content fills available column up to `90rem` ceiling, then centers
- ✅ **No hard-coded `max-width` < `90rem` on page roots** — only `FlowUIService.ContentWrapper` controls the ceiling

### Reset / Restart Testing
- ✅ **Run the full flow** (submit all steps, get a token); click Restart — no previous response data, tokens, or error messages should remain visible
- ✅ **Credentials preserved**: clientId, scope, environmentId unchanged after reset
- ✅ **No spinner**: `isLoading` is `false` after reset — no stuck loading indicators
- ✅ **Step 1 opens**: flow is back at step 1 with configuration section expanded
- ✅ **Re-run works**: running the flow again after reset produces fresh results, not cached ones
- ✅ **Back navigation**: navigating back one step does not show the previous run's results when re-entering that step

---

## 📊 Current Coverage Matrix (March 2026)

Legend: ✅ done · ⬜ missing · ➖ not applicable

| Flow | Width `90rem` | MockApiCallDisplay | V9FlowRestartButton | V9FlowHeader | usePageScroll | Button Colors | Spec Links | CredExportImport |
|---|---|---|---|---|---|---|---|---|
| AttestationClientAuthFlow | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ ghost Back btns | ✅ | ⬜ |
| ClientCredentialsV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| DPoPAuthorizationCodeFlowV9 | ✅ | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ✅ | ⬜ |
| DeviceAuthorizationVerifyPage | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ grey enabled btn | ⬜ | ➖ |
| GnapFlow | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ ghost Back btns | ✅ | ⬜ |
| JWTBearerTokenFlowV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ inline grey | ⬜ | ⬜ |
| JarJarmFlow | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ ghost Back btns | ✅ | ⬜ |
| MFALoginHintFlowV9 | ✅ | ✅ | ⬜ | ✅ | ✅ | ⬜ inline grey | ⬜ | ⬜ |
| MFAWorkflowLibraryFlowV9 | ✅ | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ⬜ | ⬜ |
| McpServerConfigFlowV9 | ✅ | ⬜ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ➖ |
| MtlsClientAuthFlow | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ⬜ |
| OAuth21InformationalFlowV9 | ✅ | ⬜ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| OAuthROPCFlowV9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| PARFlowV9 | ✅ | ⬜ | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ |
| PingOnePARFlowV9 | ✅ | ⬜ | ✅ | ⬜ | ✅ | ✅ | ⬜ | ⬜ |
| PingOneSessionsAPIFlowV9 | ✅ | ⬜ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| RARFlowV9 | ✅ | ⬜ | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ |
| ResourcesAPIFlowV9 | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ⬜ |
| SAMLBearerAssertionFlowV9 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| StepUpAuthFlow | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ⬜ |
| TokenExchangeFlowV9 | ✅ | ⬜ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| TokenIntrospectionFlow | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ⬜ |
| V7MCIBAFlowV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| V7MClientCredentialsV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| V7MDeviceAuthorizationV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| V7MImplicitFlowV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| V7MOAuthAuthCodeV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| V7MOIDCHybridFlowV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| V7MROPCV9 | ✅ | ✅ | ✅ | ✅ | ⬜ | ✅ | ⬜ | ⬜ |
| WIMSEFlow | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ⬜ |
| WorkerTokenFlowV9 | ✅ | ⬜ | ⬜ | ⬜ | ✅ | ✅ | ⬜ | ⬜ |
| **Totals** | **31/31** | **12/31** | **18/31** | **17/31** | **9/31** | **25/31** | **8/31** | **2/31** |

---

## 🔴 Priority Gaps (by impact)

| Priority | Gap | Affected Flows | Why |
|---|---|---|---|
| ✅ Done | Fluid `90rem` layout | ~~19 flows~~ 0 remaining | Fixed 2026-03-17 — all 31 flows now `max-width: 90rem` |
| 🔴 Critical/UX | MockApiCallDisplay | 19 flows | Core educational feature; plan's primary goal |
| 🟠 High | Button colors — grey enabled buttons | 6 flows | Ghost/grey on enabled buttons is visually ambiguous |
| 🟠 High | Token display service (UltimateTokenDisplay) | 17 flows | Raw `<Pre>` gives no decode/copy/JWT-claims affordance |
| 🟠 High | V9FlowHeader | 14 flows | Inconsistent navigation and branding |
| 🟠 High | V9FlowRestartButton | 13 flows | User can't restart without hard reload |
| 🟡 Medium | Spec/RFC links | 23 flows | Reduces educational value |
| 🟡 Medium | usePageScroll | 22 flows | Jarring scroll carry-over on navigation |
| 🟢 Low | CredentialExportImport | 29 flows | Convenience; not blocking |
- ✅ **Confirmation message**: Success banner appears
- ✅ **Button consistency**: Same placement/styling

### Zero-Field Entry Testing
- ✅ **Auto-population**: All fields filled on load
- ✅ **One-click execution**: Flow runs without manual input
- ✅ **Persistence**: Credentials saved across sessions
- ✅ **Customization**: Optional fields can be modified

---

## 📝 Notes

- **Exclude FloatingStepperContext**: Not using global stepper integration
- **Focus on DPoP pattern**: Use internal step management like DPoP flow
- **Leverage existing services**: V9FlowUIService, V9CredentialStorageService, Mock services
- **Maintain educational value**: Keep mock banners, API examples, server logs
- **Preserve functionality**: All existing features must continue working

---

## 🚀 Ready to Implement

All infrastructure is in place:
- ✅ V9FlowUIService (complete component library)
- ✅ CollapsibleIcon (correct chevron behavior)
- ✅ V9CredentialStorageService (persistence)
- ✅ Mock services (token, device auth, introspection)
- ✅ DPoP V9 pattern (optimal layout and sizing)

Next step: Begin Phase 1 infrastructure creation or start migrating high-priority flows.
