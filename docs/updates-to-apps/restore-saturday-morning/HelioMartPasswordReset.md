# HelioMartPasswordReset.tsx — Saturday morning fix

**File:** `src/pages/security/HelioMartPasswordReset.tsx`
**Route:** `/security/password-reset`
**Change type:** Bug fix + environment ID auto-populate

---

## Change 1 — Hooks crash fix

### Problem

```
Error: Rendered fewer hooks than expected.
```

`PageLayoutService.createPageLayout(...)` was called inside `useMemo`:

```tsx
// BEFORE (broken)
const { PageHeader, PageContainer, ContentWrapper } = useMemo(
  () => PageLayoutService.createPageLayout({ flowType: 'pingone', theme: 'red', ... }),
  []
);
```

styled-components v6 calls `useContext` internally when `styled.header\`...\`` runs.
Calling `useContext` inside `useMemo` → Rules of Hooks violation → crash on mount.

### Fix

Moved `createPageLayout` to **module scope** (before the component function):

```tsx
// AFTER (fixed) — at module level, line ~40
const _helioMartLayout = PageLayoutService.createPageLayout({
  flowType: 'pingone',
  theme: 'red',
  showHeader: true,
  showFooter: false,
  responsive: true,
});

// Inside component — simple destructure, no hook involved
const { PageHeader, PageContainer, ContentWrapper } = _helioMartLayout;
```

### Why this works

Styled components are created once at module load time. The `useMemo`/`useContext`
chain is broken entirely.

---

## Change 2 — Environment ID auto-populate

### Before

```tsx
const [environmentId, setEnvironmentId] = useState('');
```

User had to type the environment ID every time.

### After

```tsx
import { useAutoEnvironmentId } from '../../hooks/useAutoEnvironmentId';
// ...
const { environmentId, setEnvironmentId } = useAutoEnvironmentId();
```

The hook reads from all storage sources in priority order and stays reactive
to `environmentIdUpdated` events dispatched by other pages/flows.

---

## Rollback — hooks crash fix

To roll back only the hooks fix (will re-introduce the crash):

```tsx
// Replace module-level block with useMemo inside component:
import { useMemo } from 'react'; // add back to import

const { PageHeader, PageContainer, ContentWrapper } = useMemo(
  () => PageLayoutService.createPageLayout({
    flowType: 'pingone',
    theme: 'red',
    showHeader: true,
    showFooter: false,
    responsive: true,
  }),
  []
);
```

## Rollback — environment ID auto-populate

```tsx
// Replace useAutoEnvironmentId hook with:
const [environmentId, setEnvironmentId] = useState('');
// and remove the import
```
