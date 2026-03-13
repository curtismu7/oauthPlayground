# Mock Flows Standardization Plan

## 1. Purpose

Make all flows in the **Mock Flows** group behave and look very similar so users learn a consistent pattern; only the **actual content and steps** (authorize vs token vs device vs CIBA, etc.) should change. Reuse shared services and UI primitives so we have one place to fix bugs and one place to evolve the experience.

---

## 2. Current State Summary

### 2.1 Flows in scope (Mock Flows group)

| Flow | Component | Location | Credentials | Step UI |
|------|------------|----------|-------------|---------|
| OIDC Authorization Code | V7MOAuthAuthCodeV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Sections + headers |
| OIDC Hybrid | V7MOIDCHybridFlowV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Sections + headers |
| CIBA | V7MCIBAFlowV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Sections + headers |
| Device Authorization | V7MDeviceAuthorizationV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Sections + headers |
| Client Credentials | V7MClientCredentialsV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Sections + headers |
| Implicit | V7MImplicitFlowV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Sections + headers |
| JWT Bearer Token | JWTBearerTokenFlowV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Step indicator + steps |
| SAML Bearer Assertion | SAMLBearerAssertionFlowV9 | pages/flows/v9 | CompactAppPickerV8U + custom | CollapsibleHeader + styled |
| ROPC | V7MROPCV9 | pages/flows/v9 | UnifiedCredentialManagerV9 | Sections + headers |
| SPIFFE/SPIRE | SpiffeSpireFlowV8U | v8u/flows (route /flows/spiffe-spire-v9) | (env ID from storage) | FloatingStepperContext |

### 2.1b Migration status (V9 subfolder and routes)

**Target:** All Mock flows live under `src/pages/flows/v9/` and are served at `/flows/*-v9`. Side menu points to these canonical paths.

| Flow | Route | Component location | Status |
|------|--------|---------------------|--------|
| OIDC Authorization Code | `/flows/oidc-authorization-code-v9` | pages/flows/v9 | ✅ Migrated |
| OIDC Hybrid | `/flows/oidc-hybrid-v9` | pages/flows/v9 | ✅ Migrated |
| CIBA | `/flows/ciba-v9` | pages/flows/v9 | ✅ Migrated |
| Device Authorization | `/flows/device-authorization-v9` | pages/flows/v9 | ✅ Migrated |
| Client Credentials | `/flows/client-credentials-v9` | pages/flows/v9 | ✅ Migrated |
| Implicit | `/flows/implicit-v9` | pages/flows/v9 | ✅ Migrated |
| ROPC | `/flows/oauth-ropc-v9` | pages/flows/v9 | ✅ Migrated; sidebar now `/flows/oauth-ropc-v9` |
| JWT Bearer Token | `/flows/jwt-bearer-token-v9` | pages/flows/v9 | ✅ Already V9 |
| SAML Bearer Assertion | `/flows/saml-bearer-assertion-v9` | pages/flows/v9 | ✅ Already V9 |
| RAR | `/flows/rar-v9` | pages/flows/v9 | ✅ Already V9 |
| PAR | `/flows/par-v9` | pages/flows/v9 | ✅ Already V9 |
| SPIFFE/SPIRE | `/flows/spiffe-spire-v9` | v8u/flows (canonical route) | ✅ Route + redirect; sidebar `/flows/spiffe-spire-v9` |

**Fixes:** (1) Sidebar: ROPC link to `/flows/oauth-ropc-v9`; SPIFFE to `/flows/spiffe-spire-v9`. (2) App routes: add `/flows/spiffe-spire-v9` and redirect `/v8u/spiffe-spire*`. (3) Move V7M flow components from `src/v7/pages/` to `src/pages/flows/v9/` and update their imports (`../../` → `../../../`, `../` → `../../../v7/`). (4) App.tsx: import moved components from `./pages/flows/v9/...`.

### 2.2 What is already consistent

- **FlowHeader** (flowHeaderService): used by all V7M pages with `flowId`; JWT uses V9FlowHeader.
- **MockApiCallDisplay**: used for request/response learning in Auth Code, Hybrid, Device, CIBA, Implicit, ROPC, Client Credentials, JWT Bearer, SAML Bearer.
- **ColoredJsonDisplay**: used for token/userinfo/introspection JSON in V7M flows.
- **ColoredUrlDisplay**: use for authorization URLs, callback URLs, and POST request body (query-string form) so all Mock flows share the same URL color display and Decode behavior.
- **Section headers**: all use light blue (`#dbeafe`) via `getSectionHeaderStyle` so collapse icons and header colors are consistent.
- **Reset button**: every Mock Flow has a Reset button (style `MOCK_RESET_BTN` or equivalent) that clears flow state and returns to the first step; scroll to top and show a short success/info message.
- **DEMO_API_BASE / DEMO_ENVIRONMENT_ID**: used in mock API URLs (api.pingdemo.com + real env ID).
- **V7MHelpModal, V7MInfoIcon, V7MJwtInspectorModal**: shared across V7M pages.
- **Educational Mock banner**: same copy pattern (📚 Educational Mock Mode + short description) and similar styling (#fef3c7, #fbbf24) in most V7M flows.
- **Mock flow backend services**: canonical location is **`src/services/v9/mock/`** (migrated from `services/v7m`; symbols renamed V7M* → V9Mock*). Exports V9MockAuthorizeService, V9MockTokenService, V9MockUserInfoService, V9MockIntrospectionService, V9MockDeviceAuthorizationService, V9MockCIBAService, V9MockStateStore, V9MockTokenGenerator, V9MockApiLogger, and core/ui submodules (e.g. V9MockPKCEGenerationService, V9MockFlowHeader). Use `from '@/services/v9/mock'` or `from '../../../services/v9/mock/...'` from pages/flows/v9.

### 2.3 What is inconsistent

| Area | Inconsistency |
|------|----------------|
| **Page container** | Most use `<div style={{ padding: 24 }}>`. JWT uses `padding: 2rem`, `maxWidth: 1200px`, `margin: 0 auto`. SAML uses FlowUIService Container/ContentWrapper. |
| **Section/chunk layout** | V7M: inline `<section style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>` and `<header style={{ padding: '10px 12px', background: '#dbeafe' }}>`. Header colors vary (#dbeafe, #d1fae5, #f0f9ff, #f9fafb, #86efac). No shared component. |
| **Button styles** | Each V7M page defines its own `primaryBtn`, `secondaryBtn`, `inputStyle` (and sometimes `copyBtn`, `smallButtonStyle`, `buttonStyle`) with nearly identical values. |
| **Credentials** | Most use UnifiedCredentialManagerV9; Hybrid and CIBA do not (clientId only). SAML uses CompactAppPickerV8U + custom token endpoint. |
| **Deprecation / warnings** | Hybrid and Implicit and ROPC have extra deprecation banners; others only have the generic Educational Mock banner. No shared “deprecation strip” component. |
| **Step numbering** | Some use emoji (1️⃣ 2️⃣), some use “Step 1:”, some use different wording. No shared step-section component. |
| **JSON display** | All use ColoredJsonDisplay component; no dedicated **Colored JSON Display Service** exists (see §3.5.1). |
| **Show More / Show Less** | Collapse toggle must visibly truncate content; use a collapsed max-height (e.g. 150px) so "Show Less" actually shortens the block. Avoid default collapsed height larger than typical content so the button appears to do nothing. |
| **Copy controls** | Standardize on one pattern: **Copy button with visible "Copy" text** everywhere. No icon-only copy (e.g. round button with no icon when icon font fails to load). Use "Copy" label so all Mock flows look and behave the same. |
| **API display** | All use MockApiCallDisplay; URL/base comes from PingOneApiCallDisplay constants. Minor: some flows show API block before button, some after; could standardize “show API, then action button, then response”. |
| **JWT Bearer / SAML** | JWT has step progress (steps 0–4), restart button, different header (V9FlowHeader). SAML uses CollapsibleHeader, InfoBox, ParameterGrid, Button from FlowUIService/styled — different look from V7M. |
| **Multi-step flows** | Any mock flow with multiple sequential steps (e.g. SPIFFE/SPIRE) should use the **new stepper** (`usePageStepper()` from FloatingStepperContext), not a custom inline step indicator or URL-based step navigation. Register steps, drive content from stepper `currentStep`; use `completeStep` / `setCurrentStep` on advancement; optional URL sync on mount for deep links. |
| **Secondary buttons** | Secondary actions (e.g. Reset, Cancel) must use **blue background** with **white text** (e.g. `#3b82f6`, hover `#2563eb`), not grey. Grey + dark text is deprecated for secondary buttons in Mock flows. |

---

## 3. Reusable Services & Components to Introduce or Reuse

### 3.1 Centralized mock flow styles (new)

**Goal:** One place for section, header, button, and input styles so all Mock Flows look the same.

- **Add:** `src/v7/styles/mockFlowStyles.ts` (or `src/services/mockFlowStyles.ts`) exporting:
  - `MOCK_FLOW_CONTAINER_STYLE`: page wrapper (e.g. `{ padding: 24 }` or with maxWidth for readability).
  - `MOCK_FLOW_BANNER_STYLE`: educational banner (background, border, borderRadius, padding, marginBottom).
  - `MOCK_SECTION_STYLE`, `MOCK_SECTION_HEADER_STYLE`: section wrapper and header bar (with optional variant: `default` | `success` | `info` for header color).
  - `MOCK_INPUT_STYLE`, `MOCK_PRIMARY_BTN`, `MOCK_SECONDARY_BTN`: form and button styles. **Secondary button standard:** blue background (`#3b82f6`), white text, hover `#2563eb` — not grey. Grey + dark text for secondary is deprecated.

All V7M pages (and ideally JWT Bearer / SAML, and other mock flows like SPIFFE/SPIRE) would import these and remove local `const primaryBtn` etc.

### 3.2 Shared “step section” component (new)

**Goal:** Every step looks the same: a bordered card with a colored header and body.

- **Add:** `src/v7/components/V7MStepSection.tsx` (or under `src/components/` for reuse):
  - Props: `title: string`, `icon?: ReactNode` (e.g. 1️⃣ or 📤), `variant?: 'default' | 'success' | 'info'`, `children`, optional `maxWidth` for body.
  - Renders: outer section with consistent border/radius, header with consistent padding. All section header variants use the same light blue (#dbeafe) so collapse icons and header colors are consistent (mockFlowStyles.ts).
  - Usage: replace every `<section>…<header>…</header><div>…</div></section>` in Mock Flows with `<V7MStepSection title="Build Authorization Request" icon="📤" variant="info">…</V7MStepSection>`.

### 3.3 Shared educational banner component (new)

**Goal:** Same banner everywhere: icon + title + short description; optional deprecation/warning line.

- **Add:** `src/v7/components/V7MMockBanner.tsx`:
  - Props: `description: string`, `deprecation?: { short: string; learnMoreUrl?: string }` (optional).
  - Renders: yellow strip with “📚 Educational Mock Mode” and description; if deprecation, a second line or link “This flow is deprecated… Learn more”.
  - Usage: replace the inline banner div in every Mock Flow with `<V7MMockBanner description="…" deprecation={…} />`.

### 3.4 URL display (ColoredUrlDisplay) — use in all Mock flows

- **Reuse:** `ColoredUrlDisplay` (`src/components/ColoredUrlDisplay.tsx`) for authorization URL, callback URL (with fragment), or POST request body shown as query string. Same colors, Copy, and Decode/Encode everywhere.
- **Decode on POST request body:** When the value is form data (e.g. `?grant_type=password&...`), Decode runs `decodeURIComponent`. The component now wraps decode and `getUrlParameters` in try/catch so invalid URLs do not throw; Decode toggles encoded/decoded view without breaking.

### 3.4b API display service / helper (reuse + optional thin wrapper)

**Goal:** All flows use the same pattern for “show mock API call (request + response)”.

- **Reuse:** `MockApiCallDisplay` and `DEMO_API_BASE` / `DEMO_ENVIRONMENT_ID` from `PingOneApiCallDisplay.tsx`. No new service required.
- **Optional:** Add a small helper or preset in a shared module, e.g. `buildMockTokenRequestDisplay({ method, path, body, response })` that returns props for `MockApiCallDisplay` with base URL and env ID already set, so every flow just passes path + body + response. Reduces duplication of `url={\`${DEMO_API_BASE}/${DEMO_ENVIRONMENT_ID}/as/token\`}` everywhere.

### 3.5 JSON response display (consistent; Show Less + Copy standard)

- **Reuse:** `ColoredJsonDisplay` everywhere.
- **Show More / Show Less:** Collapse must visibly truncate. `ColoredJsonDisplay` uses default `maxHeight = '150px'` when collapsed so "Show Less" shortens the block; avoid larger default so the toggle has a visible effect.
- **Copy:** Use a **Copy button with visible "Copy" text** (not icon-only). `ColoredJsonDisplay` uses `CopyButtonService` with `showLabel={true}` and `label="Copy"`. Token displays (e.g. `UnifiedTokenDisplayService`) use a button that shows "Copy" text. No icon-only copy controls in Mock flows so behavior is consistent and works when icon fonts do not load.

#### 3.5.1 Colored JSON — no dedicated service (gap)

- **Current state:** Mock flows use the **ColoredJsonDisplay** **component** (`src/components/ColoredJsonDisplay.tsx`), not a named service. ColoredJsonDisplay composes:
  - **JSONHighlighter** (component) for syntax-colored JSON rendering (uses V9_COLORS in styled spans).
  - **CopyButtonService** for copy with label.
  - **codeHighlightingService** only for `VSCODE_COLORS` on the container (background/border), not for token colors inside the JSON.
- **Gap — Colored JSON Display Service does not exist:** There is no app-level **Colored JSON Display Service** (or "Color JSON Editor Service" for read-only display) that flows are expected to call. We have:
  - **Components:** `ColoredJsonDisplay`, `JSONHighlighter`, `JsonEditor` (editable config in AdvancedConfiguration).
  - **Services:** `codeHighlightingService` (Prism + VSCODE_COLORS for general code/JSON highlighting elsewhere).
- **Recommendation:** Mock flows should continue to use the **ColoredJsonDisplay** component for read-only JSON (UserInfo, Introspection, etc.) until a service exists. If we want a single, consistent API (e.g. `ColoredJsonDisplayService.render(data, options)` or a shared service that encapsulates colors + copy + collapse), **that service needs to be created** and then all Mock flows (and any other JSON display call sites) should be updated to use it.

### 3.6 Credentials (reuse, optional alignment)

- **Reuse:** `UnifiedCredentialManagerV9` for flows that need client (and optionally secret). CIBA and Hybrid currently only use clientId in local state; we could add UnifiedCredentialManagerV9 for consistency so all Mock Flows have the same “Credentials” block and app picker, or leave as-is and only standardize the ones that already use it.
- **Recommendation:** Use UnifiedCredentialManagerV9 on Hybrid and CIBA too, with appropriate `flowKey` and `grantType`, so credentials UX is identical.

### 3.7 Flow overview (About this flow) — same detail as RAR/PAR

- **Reuse:** `V7MFlowOverview` (`src/v7/components/V7MFlowOverview.tsx`) on every Mock Flow after credentials. Props: `title`, `description`, `keyPoint?`, `standard?`, `benefits?`, `educationalNote?`. Renders a section with light blue header and body with description, key point, RFC/standard, optional benefits list, and educational note so each flow has the same depth of explanation as RAR and PAR overview sections.
- **RAR and PAR:** Use same fixes as other flows: `usePageScroll` with `force: false` to avoid scroll jump; use `ColoredUrlDisplay` for authorization URL and (for PAR) request_uri instead of plain `CodeBlock`. Both already have rich overview content; V7M flows now match with `V7MFlowOverview`.

### 3.8 Gaps — services that do not exist (create if desired)

| Missing service | Purpose | Current workaround |
|-----------------|---------|--------------------|
| **Colored JSON Display Service** (or "Color JSON Editor Service" for read-only) | Single API for displaying read-only colored JSON with copy + collapse + consistent styling across Mock flows and the app. | Use **ColoredJsonDisplay** component; no service facade. |

When created, the service should wrap or replace ColoredJsonDisplay usage so all JSON (UserInfo, Introspection, token responses, etc.) goes through one API and one color/behavior contract.

---

## 4. Standard Flow Layout (target)

Every Mock Flow page should follow the same structure:

1. **Page container** – single wrapper (from shared styles or a layout component).
2. **Educational banner** – `V7MMockBanner` (and optional deprecation).
3. **Flow header** – `FlowHeader` with appropriate `flowId` (and `customConfig` where needed, e.g. pingone for red header).
4. **Credentials** – `UnifiedCredentialManagerV9` (when the flow needs client_id / client_secret / env); same props pattern everywhere.
5. **About this flow** – `V7MFlowOverview` with title, description, key point, standard (RFC), optional benefits list, and educational note. Same level of detail as RAR/PAR overview sections so all Mock flows have consistent educational depth.
6. **Steps** – sequence of `V7MStepSection` (or equivalent). Each step:
   - Optional: **Mock API call** (request + response) via `MockApiCallDisplay`.
   - **Form/controls** (inputs, dropdowns) and **primary action button**.
   - **Response** (tokens, JSON) via `ColoredJsonDisplay` or token display service.
   - Optional: **Secondary actions** (UserInfo, Introspect) and their API display + JSON.
7. **Modals** – JWT inspector, help modals at the end.

Only the **number of steps**, **labels**, and **content** (which fields, which API calls) differ per flow.

---

## 5. Per-Flow Customization (what stays unique)

- **OIDC Authorization Code:** Steps: Build authorization request → (Authorize) → Exchange token → UserInfo / Introspect. Content: response_type=code, PKCE, redirect_uri, scope, state, nonce.
- **OIDC Hybrid:** Response type selector; then Build request → Authorize → Front-channel response → Exchange token → Introspect. Content: response_type code id_token / code token / code id_token token, fragment params.
- **CIBA:** Delivery mode; backchannel auth request → polling/approval → token response → Introspect.
- **Device Authorization:** Device auth request → user approval → poll token → UserInfo / Introspect.
- **Client Credentials:** Token request (no user); then UserInfo / Introspect.
- **Implicit:** Build authorize URL → tokens in fragment → UserInfo / Introspect.
- **JWT Bearer:** Steps 0–4 (config, JWT generation, token request, token response, completion). Content: assertion, private key, token display with decode.
- **SAML Bearer:** SAML assertion config → token request with assertion. Content: SAML XML, base64, grant_type saml2-bearer.
- **ROPC:** Username/password + token request → UserInfo / Introspect.

No need to change the **logic or step content** of each flow; only the **container, banner, section chrome, and styles** become shared.

---

## 5b. Step-Through Model (JWT Bearer as Reference)

**Goal:** Use `/flows/jwt-bearer-token-v9` as the **reference pattern** for all Mock flows: one step visible at a time, step indicator at top, Prev/Next navigation, and a **Flow Completion** (summary) step at the end. No more “everything on one page” with stacked sections.

### 5b.1 Pattern elements (from JWT Bearer flow)

| Element | Description |
|--------|-------------|
| **STEP_METADATA** | Array of `{ title, subtitle, description }` — one entry per step. |
| **currentStep** | 0-based state; only one step’s content is rendered (`currentStep === 0`, `currentStep === 1`, …). |
| **Step progress indicator** | Numbered circles (1, 2, 3, …) with connecting lines; current step highlighted; below it show `STEP_METADATA[currentStep].title` and `subtitle`. |
| **Step content** | Single block per step: `{ currentStep === 0 && (... step 0 content ...) }`, `{ currentStep === 1 && (... ) }`, etc. No stacked sections. |
| **Navigation** | **Previous** (disabled on step 0), **step number buttons** (1–N) for direct jump, **Next** (disabled on last step or when validation fails). Last step label can be “Complete” instead of “Next”. |
| **Validation** | `validateCurrentStep()` so “Next” is only enabled when the current step is complete (e.g. URL built, token received). |
| **Last step = Flow Completion** | Dedicated final step with **summary**: “What you did”, “Why use this flow?”, “Why it’s secure?”, and **PingOne documentation** link. Optional: “Flow Completion Summary” card at bottom (e.g. “🎉 Flow Completion Summary” with short recap). |
| **Reset / Restart** | Header button (e.g. V9FlowRestartButton or MOCK_RESET_BTN) that clears state and sets `currentStep` to 0. |

### 5b.2 Suggested step breakdown per flow

| Flow | Steps (0-based) | Last step (summary) |
|------|------------------|---------------------|
| **OIDC Authorization Code** | 0: Config + credentials, 1: Build auth URL + authorize, 2: Exchange code for tokens, 3: UserInfo / Introspect, 4: Flow Completion | What you did; why auth code; why secure; docs link. |
| **OIDC Hybrid** | 0: Config, 1: Build auth URL + authorize, 2: Front-channel response (fragment), 3: Exchange code (back channel), 4: Introspect, 5: Flow Completion | Same pattern. |
| **CIBA** | 0: Config + delivery mode, 1: Backchannel auth request, 2: Simulate user approval + poll token, 3: Token response + Introspect, 4: Flow Completion | What you did; why CIBA; why secure; docs. |
| **Device Authorization** | 0: Config, 1: Device auth request, 2: Simulate user approval + poll token, 3: Token response + UserInfo/Introspect, 4: Flow Completion | Same. |
| **Client Credentials** | 0: Config + credentials, 1: Token request + response, 2: UserInfo / Introspect, 3: Flow Completion | Same. |
| **Implicit** | 0: Config, 1: Build auth URL + authorize (tokens in fragment), 2: UserInfo / Introspect, 3: Flow Completion | Same; note deprecation in summary. |
| **ROPC** | 0: Config + credentials, 1: Token request + response, 2: UserInfo / Introspect, 3: Flow Completion | Same; note deprecation. |
| **JWT Bearer** | Already has 5 steps + Flow Completion (reference). | Keep as-is. |
| **SAML Bearer** | 0: Credentials + SAML config, 1: Generate SAML + token request, 2: Token response, 3: Flow Completion | What you did; why SAML bearer; why secure; docs. |
| **RAR** | Already step-based (FloatingStepperContext). | Add explicit “Flow Completion” step with summary if missing. |
| **PAR** | Already step-based. | Add explicit “Flow Completion” step with summary if missing. |
| **SPIFFE/SPIRE** | Already uses FloatingStepperContext. | Add Flow Completion summary step if missing. |

### 5b.3 Implementation approach

1. **Option A – Shared step-wizard component**  
   Extract from JWT Bearer a reusable component (e.g. `MockFlowStepWizard`) that accepts `steps: STEP_METADATA[]`, `currentStep`, `onStepChange`, `validateCurrentStep`, and `children` (step content per index). All flows use this wrapper and only supply step metadata and per-step content.

2. **Option B – Per-flow refactor (no shared wizard)**  
   Refactor each V7M flow in place: introduce `STEP_METADATA` and `currentStep`, replace stacked sections with `currentStep === n && (...)` blocks, add the same step indicator and Prev/Next UI as JWT Bearer, and add a final “Flow Completion” step with the summary template. Reuse styles (e.g. from `mockFlowStyles`) and optionally a small `FlowCompletionSummary` presentational component for the green summary box.

3. **Recommended**  
   Start with **Option B** for one flow (e.g. **Implicit** or **Client Credentials**). Once the pattern is proven, consider extracting a shared **MockFlowStepWizard** (Option A) and migrating the rest.

### 5b.4 Flow Completion summary template (reusable)

Each flow’s last step should include:

- **What you did** — 3–5 bullet points summarizing the steps (e.g. “Configured client and scope”, “Built authorization URL”, “Exchanged code for tokens”).
- **Why use this flow?** — Short paragraph + bullets (e.g. “Best for web apps with a backend”, “PKCE for public clients”).
- **Why it’s secure?** — Bullets (e.g. “Code is one-time”, “Tokens server-side”, “PKCE binds code to verifier”).
- **PingOne documentation** — Link to the relevant PingOne/PingFederate doc (e.g. authorization code, device auth, CIBA).

Use the same visual structure as JWT Bearer: green success-style card for “What you did”, blue for “Why use this flow?”, amber for “Why it’s secure?”, neutral card for docs link.

---

## 6. Implementation Phases

### Phase 1 – Shared styles and banner (low risk) ✅ Implemented

- Add `mockFlowStyles.ts` with container, banner, section, header, input, primaryBtn, secondaryBtn.
- Add `V7MMockBanner` and use it on all V7M pages (and optionally JWT Bearer).
- Replace local style constants in each V7M page with imports from `mockFlowStyles`. Replace inline banner div with `<V7MMockBanner>`.

**Files:** New: `src/v7/styles/mockFlowStyles.ts`, `src/v7/components/V7MMockBanner.tsx`. Edit: all V7M pages (Client Credentials, Device Authorization, OAuth Auth Code, OIDC Hybrid, CIBA, Implicit, ROPC). V7MStepSection.tsx added for optional Phase 2 use.

### Phase 2 – Step section component

- Add `V7MStepSection` with title, icon, variant, children.
- Refactor one flow (e.g. Client Credentials) to use it everywhere; then roll out to the rest of V7M (Auth Code, Hybrid, CIBA, Device, Implicit, ROPC).

**Files:** New: `src/v7/components/V7MStepSection.tsx`. Edit: each V7M page to use `<V7MStepSection>` instead of raw `<section>`/`<header>`.

### Phase 3 – Credentials and API display consistency ✅ Implemented

- Add `UnifiedCredentialManagerV9` to Hybrid and CIBA with appropriate flowKey/grantType so every Mock Flow that needs client_id has the same credentials block.
- Optional: add a small helper (e.g. `getMockApiBaseUrl()`, or a preset builder for token/userinfo/introspect) so all Mock Flows build MockApiCallDisplay URLs the same way (already using DEMO_API_BASE/DEMO_ENVIRONMENT_ID; just reduce copy-paste).

**Files:** Edit: V7MOIDCHybridFlowV9 (flowKey v7m-oidc-hybrid, grantType authorization_code), V7MCIBAFlowV9 (flowKey v7m-ciba, grantType urn:openid:params:oauth:grant-type:ciba). API URL helper deferred.

### Phase 4 – Align JWT Bearer and SAML Bearer (optional)

- JWT Bearer: use same container style, `V7MMockBanner`, and if feasible use `V7MStepSection`-like step cards so the “step” look matches V7M (or keep step indicator but make section cards match).
- SAML Bearer: use same banner and, where it makes sense, use shared section/button styles (or even `V7MStepSection`) for the token request/response blocks so the page doesn’t feel like a different app.

**Files:** Edit: JWTBearerTokenFlowV9.tsx, SAMLBearerAssertionFlowV9.tsx.

### Phase 5 – Show More/Show Less and Copy consistency ✅ Implemented

- **Show Less:** `ColoredJsonDisplay` default collapsed `maxHeight` set to `150px` so "Show Less" visibly truncates content (was 300px; short content appeared to do nothing).
- **Copy:** Standardize on **Copy button with "Copy" text**. `ColoredJsonDisplay` uses `CopyButtonService` with `showLabel={true}` and `label="Copy"` (no icon-only). Token displays use buttons that show "Copy" text. Ensures consistency and avoids empty round button when icon font does not load.

**Files:** Edit: `src/components/ColoredJsonDisplay.tsx`. All Mock flows using ColoredJsonDisplay and UnifiedTokenDisplayService inherit the standard.

### Phase 6 – Section headers light blue, ColoredUrlDisplay, PAR scroll ✅ Implemented

- **Section headers / collapse icons:** All section header variants (default, info, success, warning) use the same light blue (`#dbeafe`) in `mockFlowStyles.ts` so header colors and collapse icons are consistent across Mock flows.
- **ColoredUrlDisplay:** Implicit flow now uses `ColoredUrlDisplay` for Authorization URL and Callback URL (with fragment) so sizes and colors match other flows (e.g. ROPC); doc updated (§3.4) so all Mock flows use ColoredUrlDisplay for URLs and POST body where applicable.
- **Decode on POST request body:** `ColoredUrlDisplay` now wraps `decodeURIComponent` and `getUrlParameters` in try/catch so Decode/Encode toggle does not throw on malformed or invalid URLs (e.g. when used for form query string).
- **PAR scroll:** `/flows/par-v9` used `usePageScroll({ force: true })`, which triggered multiple scroll-to-top attempts (0, 50, 100, 200 ms) and caused the page to jump. Changed to `force: false` so only one scroll runs on mount.

**Files:** `src/v7/styles/mockFlowStyles.ts`, `src/v7/pages/V7MImplicitFlowV9.tsx`, `src/components/ColoredUrlDisplay.tsx`, `src/pages/flows/v9/PARFlowV9.tsx`, `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`.

### Phase 7 – RAR/PAR same fixes; overview detail on all Mock flows ✅ Implemented

- **RAR and PAR same issues as other flows:** RAR now uses `usePageScroll({ force: false })` to prevent scroll jump. PAR and RAR now use `ColoredUrlDisplay` for authorization URL (and PAR for request_uri) instead of `CodeBlock`, so URL display and Decode/Explain are consistent.
- **More detail on other pages like RAR/PAR:** All V7M Mock flows (Implicit, Client Credentials, Device Authorization, OAuth Auth Code, OIDC Hybrid, CIBA, ROPC) now include an **About this flow** section via `V7MFlowOverview` with description, key point, standard (RFC), benefits list, and educational note — matching the level of detail on RAR and PAR overview sections.

**Files:** `src/pages/flows/v9/RARFlowV9.tsx`, `src/pages/flows/v9/PARFlowV9.tsx`, `src/v7/components/V7MFlowOverview.tsx`, all `src/v7/pages/V7M*.tsx`, `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`.

### Phase 8 – New stepper for multi-step flows; secondary button blue ✅ Implemented

- **Multi-step flows use new stepper:** Any mock flow with multiple sequential steps (e.g. SPIFFE/SPIRE) must use `usePageStepper()` from `FloatingStepperContext` (same pattern as PAR/RAR). Register steps with `registerSteps([...])`; drive content from `currentStep` (0-based); advance with `completeStep(index)` and `setCurrentStep(index)`. No custom inline step indicator; no URL-based step advancement (optional URL sync on mount for deep links only). SPIFFE/SPIRE flow refactored to use the floating stepper; custom `StepIndicator` removed.
- **Secondary button: blue background, white text:** Secondary actions (e.g. Reset Flow, Cancel) use **blue background** (`#3b82f6`) with **white text**; hover `#2563eb`. Grey background with dark text is deprecated. SPIFFE/SPIRE Reset button updated; other flows with secondary buttons should follow the same standard.

**Files:** `src/v8u/flows/SpiffeSpireFlowV8U.tsx`, `docs/MOCK_FLOWS_STANDARDIZATION_PLAN.md`.

### Phase 9 – Step-through UX (JWT Bearer model) for all Mock flows (plan)

- **Reference:** `/flows/jwt-bearer-token-v9` — one step visible at a time, step indicator, Prev/Next + step buttons, last step = Flow Completion with summary.
- **Target:** Refactor all Mock flows from “everything on one page” (stacked sections) to step-through with a final **Flow Completion** step containing: “What you did”, “Why use this flow?”, “Why it’s secure?”, PingOne docs link.
- **Approach:** See **§5b. Step-Through Model**. Recommended: refactor one flow (e.g. Implicit or Client Credentials) first with Option B (per-flow); then consider shared `MockFlowStepWizard` and roll out to the rest.
- **Order (suggested):** Implicit → Client Credentials → OIDC Auth Code → Device Authorization → CIBA → OIDC Hybrid → ROPC → SAML Bearer; then add Flow Completion step to RAR, PAR, SPIFFE if missing.
- **Files (per flow):** Each `src/pages/flows/v9/V7M*.tsx` and `SAMLBearerAssertionFlowV9.tsx`; optional new `src/v7/components/MockFlowStepWizard.tsx` and `FlowCompletionSummary.tsx` if extracting shared UI.

---

## 7. Success Criteria

- All Mock Flows use the same page container and educational banner.
- All use the same section card (step section) with the same border, header colors, and padding.
- All use the same button and input styles from a single shared module.
- All use `MockApiCallDisplay` + `ColoredJsonDisplay` for API and JSON; URLs use `DEMO_API_BASE` and `DEMO_ENVIRONMENT_ID`.
- **About this flow** (overview) appears on every Mock Flow with description, key point, standard, benefits, and educational note (same detail level as RAR/PAR).
- **Section headers** use the same light blue (#dbeafe) so collapse icons and header colors are consistent.
- **URLs** (auth URL, callback URL, POST body as query string) use **ColoredUrlDisplay** for consistent colors and Decode behavior. RAR and PAR use ColoredUrlDisplay for authorization URL (and PAR for request_uri); RAR/PAR use `usePageScroll` with `force: false`.
- **Show More / Show Less** in collapsible JSON (and similar blocks) visibly expands/collapses (e.g. collapsed max-height 150px so "Show Less" truncates).
- **Copy** is always a button with visible **"Copy"** text (no icon-only copy); same pattern across all Mock flows.
- **Multi-step flows** (e.g. SPIFFE/SPIRE) use the **new stepper** (FloatingStepperContext): `usePageStepper()`, register steps, drive content from `currentStep`; no custom inline step indicator or URL-based step advancement.
- **Secondary buttons** (Reset, Cancel, etc.) use **blue background** (`#3b82f6`) with **white text**, not grey.
- Credentials UX is the same (UnifiedCredentialManagerV9) wherever the flow needs client_id/secret.
- Only the **steps and content** (labels, fields, which API calls) differ between flows; behavior and look are consistent.
- **(Phase 9)** All Mock flows use **step-through UX** (JWT Bearer model): one step visible at a time, step indicator, Prev/Next + step buttons, and a final **Flow Completion** step with summary (“What you did”, “Why use this flow?”, “Why it’s secure?”, docs link).

---

## 8. Regression and Do-Not-Break

- After each phase, run the **Mock Flows** regression from `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md` (Section 4): open each flow, complete the main path, confirm tokens and UserInfo/Introspect where applicable.
- Preserve **Do-not-break** (sidebar z-index, worker token, discovery logger, button styling, etc.); shared styles must not override flow-specific needs (e.g. disabled button grey only when disabled).
- Document any new shared component in the regression plan so future edits don’t break the standard layout.
