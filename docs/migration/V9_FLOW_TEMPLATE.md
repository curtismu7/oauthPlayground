# V9 Flow Template Guide

**Last Updated:** March 2, 2026  
**Scope:** Template patterns for creating new V9 flows at `src/pages/flows/v9/`  
**Prerequisites:**
- [migrate_vscode.md](./migrate_vscode.md) — core migration guide
- [V8_FLOW_MIGRATION_GUIDE.md](./V8_FLOW_MIGRATION_GUIDE.md) — import patterns

---

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

## Toast Notifications (MANDATORY replacement)

V9 flows use `toastV8` from V8 utilities. **Never use `v4ToastManager` in V9 flows:**

```tsx
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

// Usage:
toastV8.success('Token obtained successfully');
toastV8.error('Authentication failed');
toastV8.info('Redirecting to authorization server...');
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
- [ ] `toastV8` used (not `v4ToastManager`)
- [ ] `WorkerTokenSectionV8` uses named export destructuring (if applicable)
- [ ] Route added to `src/App.tsx`
- [ ] Sidebar entry added to `src/config/sidebarMenuConfig.ts`
- [ ] TypeScript: no `any` types for API responses (use type guards or proper interfaces)
- [ ] Build passes: `npm run build` — no type errors
