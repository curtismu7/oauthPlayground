# V9 Flow Template Guide

> **Editor note (VS Code / Windsurf):** This guide applies to **VS Code/Windsurf** and **Windsurf** (VS Code/Windsurf-compatible). All commands and file paths are the same; where the text says “VS Code/Windsurf”, read it as “VS Code/Windsurf”.

**Last Updated:** March 2, 2026  
**Scope:** Template patterns for creating new V9 flows at `src/pages/flows/v9/`  
**Prerequisites:**
- [migrate_vscode.md](./migrate_vscode.md) — core migration guide (includes `🔬 Programming Patterns & Code Quality` section)
- [V8_FLOW_MIGRATION_GUIDE.md](./V8_FLOW_MIGRATION_GUIDE.md) — import patterns

> ⚠️ **Important:** The existing V9 flows in `src/pages/flows/v9/` currently use `Legacy Toast (`v4ToastManager`)` (the old V7 toast system). New flows **must** use `Modern Messaging`. See the Modern Messaging section below and the Programming Patterns audit in `migrate_vscode.md`.

---

## Modern Messaging (MANDATORY)

All flows and pages migrated or modified during V9 upgrades must use **Modern Messaging**:

- **Wait screens** for blocking work (user cannot proceed)
- **Banner messaging** for persistent context/warnings
- **Critical errors** highlighted in **red** with clear next-step guidance
- **Footer messaging** for low-noise status updates (polling, copying, etc.)
- **No `console.error` / `console.warn` for runtime failures** — convert to user messaging **plus** structured logging

**Legacy Toast (`v4ToastManager`) is deprecated.** If you touch a file that still uses it, remove it and migrate to Modern Messaging in the same change.

### Messaging API (single source of truth)
Modern Messaging is **mandatory**, but we also need a single canonical implementation so patterns don’t drift.

**Canonical requirement**
- Use the shared messaging API/component(s) (do **not** invent local “mini-messaging” utilities per flow).
- If you cannot locate the canonical messaging API yet, **do not implement a one-off**. Add an entry to `SERVICE_UPGRADES_CANDIDATES.md` describing what you need, and use the smallest temporary UI-level implementation possible that still:
  - provides wait/banners/critical/footers as appropriate, and
  - converts runtime failures into user messages (no `console.error`/`console.warn`).

**Where to look**
- Search the services directory first: `/Users/cmuir/P1Import-apps/oauth-playground/src/services`
- Suggested quick searches (ripgrep):
  - `rg -n "message|messaging|banner|toast|notify|alert" /Users/cmuir/P1Import-apps/oauth-playground/src/services`
  - `rg -n "wait|loading|spinner|progress" /Users/cmuir/P1Import-apps/oauth-playground/src/services`

### Console error enforcement (MANDATORY)
**Goal:** prevent runtime failures from being “handled” via console noise. Failures must become user messages + structured logging.

**Required**
- Do not introduce `console.error(...)` / `console.warn(...)` for runtime failures in flows/pages/services.
- Route errors through the logging service and the Modern Messaging surfaces.

**Enforcement options (choose at least one)**
- **ESLint:** enable `no-console` with an allowlist (e.g., allow `console.log` in dev if needed) but **disallow `error`/`warn`**.
- **CI check:** fail PRs that introduce `console.error(` or `console.warn(` under `src/`:
  - Example: `rg -n "console\.(error|warn)\(" src/` (no matches allowed)
- **Code review gate:** PR checklist item “No console error/warn for runtime failures” must be ✅.

**Exception**
- Temporary debugging is allowed only on short-lived local branches; it must be removed before merge.

## Engineering Quality Gates (MANDATORY)

These are review gates for **every** V9 migration or update (educational app–appropriate: lightweight safety, strong reliability).

- [ ] **Modern Messaging** used appropriately: wait screen / banner / red critical error / footer status
- [ ] **No runtime `console.error` / `console.warn`** for failures — convert to user messaging + structured logging
- [ ] **Async cleanup** everywhere: `AbortController` for fetches; clear intervals/timeouts; unsubscribe listeners; no state updates after unmount
- [ ] **Flow state clarity**: `idle → loading → success → error`; safe retries that reset state cleanly; disable submit while in-flight
- [ ] **Input validation with guidance**: inline field errors for fixable issues; critical error block for “can’t proceed”
- [ ] **Sanitized technical details**: mask/truncate tokens & sensitive values; no stack traces by default
- [ ] **Accessibility basics**: keyboard works; focus management after transitions/errors; `aria-live` for dynamic banners/errors
- [ ] **Minimal tests**: at least one failure-path assertion that verifies a user message appears (plus happy path for critical flows)

### Services-first rule (MANDATORY)

Keep flows/components thin. If code is reusable, protocol-specific, or touches remote APIs, it belongs in a **service** (or a dedicated hook that calls a service), not in the view layer.

- [ ] **No direct fetch/protocol code in UI components** (except wiring to a service call)
- [ ] **No duplicated protocol logic across flows** — centralize in services (token exchange, PAR, MFA operations, credential operations, worker token)
- [ ] **Services own**: API calls, request shaping, response parsing, retries/timeouts, error normalization, and logging context
- [ ] **UI owns**: state transitions, rendering, input collection/validation messages, and calling services
- [ ] When you add “one-off” logic in a flow, ask: *Will another flow need this?* If yes, move it into a service now.

### Services reuse & dependency hygiene (MANDATORY)
**Goal:** keep flows thin and prevent duplicated protocol/business logic from creeping into UI code.

**Before adding non-trivial logic to a flow/page component:**
- **Search the services directory first** for an existing capability (or close analogue) to reuse or extend.
- **Check service dependencies**: if your change would introduce a new dependency chain (e.g., service → service → service), confirm it’s justified and does not create cycles.
- Prefer **small, composable service functions** over large “one-off” logic embedded in a component.
- If you must add new service functionality, implement it behind a **typed interface** and keep UI integration minimal.

**PR expectations**
- Any net-new “logic chunk” (> ~20–30 lines of non-UI logic) should be either:
  - moved into a service/util, or
  - explicitly justified in the PR description (“why this can’t live in a service”).
- When you discover service gaps or duplication risks, capture them in: **`SERVICE_UPGRADES_CANDIDATES.md`** (see template doc).
- Only escalate to “must replace now” if the issue is blocking correctness (broken behavior), causing repeated copy/paste, or preventing consistent messaging/error handling.

### Services contracts reference (MANDATORY)
**Source of truth:** `V7_V8_V9_SERVICES_CONTRACTS_UPDATED.md`

When changing or introducing anything in `src/services/**` (or adding logic that should live in services):
- Validate the change against the **service contracts** to avoid breaking existing flows/apps.
- Prefer **additive** changes; for breaking changes use an **adapter + deprecation path** (keep old API working).
- If you discover contract gaps or mismatches, **update the contracts doc in the same PR** (or add a critical entry in `SERVICE_UPGRADES_CANDIDATES.md` if it must be fixed later).

**PR checklist**
- [ ] Services changes reviewed against `V7_V8_V9_SERVICES_CONTRACTS_UPDATED.md` (no accidental contract breaks)

## Quick Start

1. Copy the starter template below to `src/pages/flows/v9/MyFlowV9.tsx`
2. Replace `MyFlow`, `My Flow`, `my-flow` with the actual flow name
3. Register the route in `src/App.tsx`
4. Add the sidebar entry in `src/config/sidebarMenuConfig.ts`

---

## Starter Template

```tsx
// src/pages/flows/v9/MyFlowV9.tsx
// V9.0.0 — [Flow Name] Flow

import { FiInfo, FiShield } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';

// Relative imports from src/pages/flows/v9/ → back to src/ = '../../../'
import { EducationModeToggle } from '../../../components/education/EducationModeToggle';
import { MasterEducationSection } from '../../../components/education/MasterEducationSection';
import FlowUIService from '../../../services/flowUIService';

// V8 services — use @/v8/... alias (not relative paths)
// import { SomeServiceV8 } from '@/v8/services/someServiceV8';

// ─── Shared UI from FlowUIService ───────────────────────────────────────────
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

// ─── Styled Components ───────────────────────────────────────────────────────
const MainCard = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

// ── V9 Flow header color: BLUE (#2563eb / #1e40af) ──
// ── Do NOT use red here — red is for PingOne admin pages only ──
const FlowHeader = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: #ffffff;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FlowHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const VersionBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  display: inline-block;
  width: fit-content;
`;

const FlowHeaderTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const FlowHeaderSubtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
`;

const FlowBody = styled.div`
  padding: 2rem;
`;

// ─── Component ───────────────────────────────────────────────────────────────
const MyFlowV9: React.FC = () => {
  const [isEducationMode, setIsEducationMode] = useState(false);

  return (
    <Container>
      <ContentWrapper>
        <EducationModeToggle
          isEnabled={isEducationMode}
          onToggle={() => setIsEducationMode(prev => !prev)}
        />

        <MainCard>
          <FlowHeader>
            <FlowHeaderLeft>
              <VersionBadge>V9</VersionBadge>
              <FlowHeaderTitle>My Flow Name</FlowHeaderTitle>
              <FlowHeaderSubtitle>Short description of what this flow does</FlowHeaderSubtitle>
            </FlowHeaderLeft>
            <FiShield size={48} color="rgba(255,255,255,0.3)" />
          </FlowHeader>

          <FlowBody>
            {/* Flow content here */}
          </FlowBody>
        </MainCard>

        {isEducationMode && (
          <MasterEducationSection flowType="my-flow" />
        )}
      </ContentWrapper>
    </Container>
  );
};

export default MyFlowV9;
```

---

## Route Registration

Add to `src/App.tsx` in the routes section (keep near other V9 flows):

```tsx
// In the lazy imports section at the top of App.tsx:
const MyFlowV9 = lazy(() => import('./pages/flows/v9/MyFlowV9'));

// In the <Routes> JSX:
<Route path="/flows/my-flow-v9" element={
  <Suspense fallback={<LoadingSpinner />}>
    <MyFlowV9 />
  </Suspense>
} />
```

---

## Sidebar Entry

Add to `src/config/sidebarMenuConfig.ts` in the appropriate section. Follow existing order conventions (V9 entries next to related V8 entries):

```typescript
// In the relevant flow group:
['/flows/my-flow-v9', 'My Flow (V9)'],
```

> **Color note:** Sidebar section colors are defined separately. Flows use blue (`#2563eb`). No changes to sidebar color section are needed for new flows.

---

## Import Depth Reference

Files in `src/pages/flows/v9/` use **3-level** relative paths:

```
src/pages/flows/v9/MyFlowV9.tsx
│
└── relative '../../../' = src/
    ├── ../../../components/ui/Button
    ├── ../../../services/flowUIService
    ├── ../../../hooks/usePageScroll
    └── ../../../utils/storage
```

| Target | Correct Import |
|---|---|
| `src/components/ui/X` | `'../../../components/ui/X'` |
| `src/services/flowUIService` | `'../../../services/flowUIService'` |
| `src/hooks/useX` | `'../../../hooks/useX'` |
| `src/utils/X` | `'../../../utils/X'` |
| Any V8 service/component | `'@/v8/services/...'` or `'@/v8/components/...'` (alias) |

**Why use `@/v8/...` for V8 instead of relative?**  
V8 imports via `../../../v8/` would break if the file depth changes. The `@/v8/` alias always resolves to `src/v8/` regardless of where the importing file lives.

---

## WorkerTokenSectionV8 Integration

If the flow requires a PingOne worker app token, add `WorkerTokenSectionV8` from V8:

```tsx
// Named export — MUST use destructuring:
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';

// NOT this (default export doesn't exist):
// import WorkerTokenSectionV8 from '@/v8/components/WorkerTokenSectionV8'; ❌
```

Usage pattern:
```tsx
<WorkerTokenSectionV8
  onTokenChange={(token) => setWorkerToken(token)}
  environmentId={environmentId}
/>
```

---

## Modern Messaging (MANDATORY)

V9 flows use the **true Modern Messaging system**. **Never use Legacy Toast (`v4ToastManager`) or toastV8 in V9 flows:**

```tsx
// Import the Modern Messaging system
import { V9ModernMessagingProvider, useModernMessaging } from '../../../components/v9/V9ModernMessagingComponents';

// In your component
const MyV9Flow = () => {
  const [, messaging] = useModernMessaging();
  
  // Use the messaging API
  const handleSuccess = () => {
    messaging.showFooterMessage({
      type: 'info',
      message: 'Operation completed successfully',
      duration: 3000
    });
  };
  
  const handleError = (error: Error) => {
    messaging.showCriticalError({
      title: 'Operation Failed',
      message: error.message,
      contactSupport: false
    });
  };
  
  const handleWarning = () => {
    messaging.showBanner({
      type: 'warning',
      title: 'Warning',
      message: 'Please check your input',
      dismissible: true
    });
  };
  
  return (
    <V9ModernMessagingProvider>
      {/* Your flow content */}
    </V9ModernMessagingProvider>
  );
};

// For V9 services (outside React components):
import { modernMessaging } from '../../../components/v9/V9ModernMessagingComponents';

// Usage in services:
modernMessaging.showFooterMessage({
  type: 'info', 
  message: 'Operation completed successfully',
  duration: 3000
});
```

---

## MFA Flows: Additional Requirements

For MFA flows specifically, see [MFA_MIGRATION_GUIDE.md](./MFA_MIGRATION_GUIDE.md).

**Extra imports required for MFA V9 flows:**
```tsx
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';

// Wrap in this order:
const MyMFAFlowV9: React.FC = () => (
  <GlobalMFAProvider>
    <MFACredentialProvider>
      {/* flow content */}
    </MFACredentialProvider>
  </GlobalMFAProvider>
);
```

---

## Checklist: New V9 Flow

- [ ] File created at `src/pages/flows/v9/FlowNameV9.tsx`
- [ ] Component named `FlowNameV9` (PascalCase matching filename)
- [ ] Header color is blue (`#2563eb` / `#1e40af`) — not green, not red
- [ ] `VersionBadge` shows `V9`
- [ ] `EducationModeToggle` included
- [ ] All relative imports use `'../../../'` depth (not `'../../'` which is for `src/pages/flows/`)
- [ ] V8 services use `@/v8/...` alias (not relative)
- [ ] `Modern Messaging` used (not `Legacy Toast (`v4ToastManager`)`)
- [ ] `WorkerTokenSectionV8` uses named export destructuring (if applicable)
- [ ] `usePageScroll()` called — scroll-to-top works (root cause fixed in `scrollManager.ts` + `App.tsx`)
- [ ] Route added to `src/App.tsx`
- [ ] Sidebar entry added to `src/config/sidebarMenuConfig.ts`
- [ ] TypeScript: no `any` types for API responses (use type guards or proper interfaces)
- [ ] **Color Accessibility**: Use `V9ColorStandards.ts` helper functions (no hardcoded colors)
- [ ] **No Green-on-Green**: All text/background combinations pass WCAG AA contrast
- [ ] Biome lint passes: `npx biome lint src/pages/flows/v9`
- [ ] ESLint passes: `npx eslint src/pages/flows/v9 --ext .ts,.tsx`
- [ ] Build passes: `npm run build` — no type errors

---

## Status Indicator Colors (Approved Exception)

Flow page **headers must be blue**. But components that display live token/connection state **may** use Green / Amber / Red:

| Status | Hex | When |
|--------|-----|------|
| Valid / success | `#10b981` (emerald green) | Token present and not expiring soon |
| Warning | `#f59e0b` (amber) | Token expires in < 5 minutes |
| Invalid / error | `#ef4444` / `#dc2626` (red) | No token, expired, or auth failed |

```tsx
// ✅ Correct pattern — status indicator colors
const statusColors = {
  valid:   '#10b981',
  warning: '#f59e0b',
  invalid: '#ef4444',
} as const;
```

This exception applies **only** to status indicators, badges, and health displays.  
It does **not** apply to headers, action buttons, or general UI chrome.

See also: `src/v8/components/WorkerTokenStatusDisplayV8.tsx` — reference implementation.

---

## 🎨 **V9 Color Accessibility Standards (MANDATORY)**

All V9 flows **MUST** use the centralized color standards to prevent green-on-green and other contrast issues.

### **✅ Required Import:**
```typescript
import { V9_COLORS, getButtonStyles, getBannerStyles, getStepStyles } 
from '../../../services/v9/V9ColorStandards';
```

### **✅ Required Patterns:**

#### **Button Styling:**
```typescript
// ✅ REQUIRED - Use helper functions
style={{
  ...getButtonStyles('primary', disabled),
  fontWeight: 600,
}}
```

#### **Banner Styling:**
```typescript
// ✅ REQUIRED - Use helper functions
style={{
  ...getBannerStyles(messageState.banner.type || 'info'),
  padding: '1rem',
  borderRadius: '0.5rem',
}}
```

#### **Step Indicators:**
```typescript
// ✅ REQUIRED - Use helper functions
style={{
  ...getStepStyles(isActive, isCompleted),
  display: 'flex',
  alignItems: 'center',
}}
```

### **❌ Prohibited Patterns:**
```typescript
// ❌ PROHIBITED - Green on green (unreadable)
style={{ background: '#10b981', color: '#10b981' }}

// ❌ PROHIBITED - Hardcoded colors without contrast validation
style={{ background: '#10b981', color: 'white' }}

// ❌ PROHIBITED - Inline color definitions
style={{ background: '#10b981', color: 'white' }}
```

### **✅ WCAG AA Compliance:**
- **Normal Text:** 4.5:1 contrast ratio minimum
- **Large Text:** 3:1 contrast ratio minimum  
- **UI Components:** 3:1 contrast ratio minimum

**All colors in `V9ColorStandards.ts` are pre-validated for WCAG AA compliance.**

### **📋 Documentation:**
- **Color Standards:** `src/services/v9/V9ColorStandards.ts`
- **Accessibility Guide:** `A-Migration/V9_ACCESSIBILITY_COLOR_STANDARDS.md`

---

## 🔄 **Framework Validation for New V9 Flows (MANDATORY)**

All new V9 flows **MUST** pass the **Rapid Migration Validation Framework** to ensure production readiness and system consistency.

### **⚡ Framework Validation Requirements**
```bash
# 1. Validate New Flow
npm run migrate:verify [new-flow-name]
# Example: npm run migrate:verify NewOAuthFlowV9

# 2. Validate All V9 Flows (System Consistency)
npm run test:validate-all-v9-flows

# 3. Check System Health
npm run test:baseline-health
```

### **✅ Framework Compliance Checklist**
- ✅ **Build Validation**: New flow builds successfully
- ✅ **Linting Validation**: Biome lint passes (0 errors, 0 warnings)
- ✅ **TypeScript Validation**: No TypeScript errors
- ✅ **Dev Server**: Flow works in development environment
- ✅ **V9 Patterns**: Modern messaging, flow header, accessibility
- ✅ **System Integration**: No conflicts with existing V9 flows

### **🚫 Framework Enforcement**
- **MANDATORY**: All new V9 flows must pass framework validation
- **BLOCKING**: New flows cannot be merged without framework approval
- **DOCUMENTATION**: Validation results must be documented

### **📋 Example: New Flow Validation**
```bash
# Step 1: Create New Flow
# (Follow template from above sections)

# Step 2: Framework Validation
npm run migrate:verify NewOAuthFlowV9
# Output: ✅ Build: SUCCESS, ✅ Linting: CLEAN, ✅ TypeScript: VALID

# Step 3: System Consistency Check
npm run test:validate-all-v9-flows
# Output: Total Flows Tested: 10, Passed: 10, Failed: 0 (100%)

# Step 4: Health Check
npm run test:baseline-health
# Output: ✅ Current build: HEALTHY, ✅ Linting: CLEAN, ✅ TypeScript: VALID
```

### **🎯 Framework Validation Metrics**
When creating new V9 flows, the framework validates:
- **Code Quality**: 0 Biome errors/warnings
- **Type Safety**: 0 TypeScript errors
- **Build Success**: Production build works
- **Development Ready**: Dev server compatibility
- **V9 Compliance**: Modern messaging, accessibility, service patterns
- **System Harmony**: No conflicts with existing flows

### **📚 Framework Resources**
- ✅ **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - 5-minute setup
- ✅ **[RAPID_MIGRATION_VALIDATION_FRAMEWORK.md](./RAPID_MIGRATION_VALIDATION_FRAMEWORK.md)** - Complete framework
- ✅ **[MIGRATION_TESTING_FRAMEWORK.md](./MIGRATION_TESTING_FRAMEWORK.md)** - Testing procedures
- ✅ **[JWT_BEARER_V7_V9_COMPARISON.md](./JWT_BEARER_V7_V9_COMPARISON.md)** - Working example

### **🚀 New Flow Success Metrics**
- **Development Speed**: 50% faster with template + framework
- **Quality Assurance**: 100% automated validation
- **System Consistency**: Guaranteed compatibility with existing flows
- **Production Readiness**: Zero deployment surprises
