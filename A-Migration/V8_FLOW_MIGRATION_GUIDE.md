# V8 Flow Migration Guide

**Last Updated:** March 2, 2026  
**Prerequisite:** Read [migrate_vscode.md](./migrate_vscode.md) first — this doc covers V8-specific patterns only.

> The [V9_MIGRATION_LESSONS_LEARNED.md](./V9_MIGRATION_LESSONS_LEARNED.md) covers V7→V9 pitfalls.  
> This doc covers the **different patterns** you encounter when the source is a V8 flow in `src/v8/flows/`.

> ⚠️ **Also read:** [`migrate_vscode.md` → `🔬 Programming Patterns & Code Quality`](./migrate_vscode.md) — covers dead state variables, missing `AbortController` cleanup, unsafe error casting, and other code quality issues found via audit of real V7/V8 source files.

---

## V8 vs V7 — Key Structural Differences

| Concern | V7 flow | V8 flow |
|---|---|---|
| **Location** | `src/pages/flows/v7/FlowV7.tsx` | `src/v8/flows/FlowV8.tsx` |
| **Import style** | Relative `../../services/...` | Mix: `@/v8/...` alias **or** relative `../services/...` |
| **Services** | Scattered in `src/services/` | Canonical home is `src/v8/services/` |
| **Contexts** | Usually none | May wrap with `GlobalMFAProvider`, `MFACredentialProvider` |
| **Flow as directory** | Single `.tsx` file | Can be a directory (e.g. `PingOnePARFlowV8/`) |
| **Internal factories** | None | `v8/flows/factories/` — `MFAFlowComponentFactory`, `MFAFlowControllerFactory` |
| **Shared flow types** | In `src/types/` | `src/v8/flows/shared/MFATypes.ts` |
| **Test files** | `src/services/__tests__/` | `src/v8/services/__tests__/`, `src/v8/flows/__tests__/` |

---

## Import Pattern: Alias vs Relative

V8 flows use **two different import styles** depending on when the file was written:

### Style A — `@/v8/...` alias (preferred, path-depth independent)
```typescript
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { WorkerTokenSectionV8 } from '@/v8/components/WorkerTokenSectionV8';
import { useWorkerToken } from '@/v8/hooks/useWorkerToken';
```
✅ These work unchanged when the file is copied to `src/pages/flows/v9/`.

### Style B — V8-internal relative imports (depth = 1 from `src/v8/flows/`)
```typescript
import { TokenExchangeServiceV8 } from '../services/tokenExchangeServiceV8';
import { toastV8 } from '../utils/toastNotificationsV8';
import { GlobalEnvironmentService } from '../services/globalEnvironmentService';
```
❌ These **break** when copied to `src/pages/flows/v9/` — `../` now means `src/pages/flows/` not `src/v8/`.

**Fix — convert to alias on copy:**
```bash
FLOW="src/pages/flows/v9/MyFlowV9.tsx"

# V8-internal single-level → alias
sed -i '' "s|from '../services/|from '@/v8/services/|g" "$FLOW"
sed -i '' "s|from '../utils/|from '@/v8/utils/|g" "$FLOW"
sed -i '' "s|from '../components/|from '@/v8/components/|g" "$FLOW"
sed -i '' "s|from '../hooks/|from '@/v8/hooks/|g" "$FLOW"
sed -i '' "s|from '../types/|from '@/v8/types/|g" "$FLOW"
sed -i '' "s|from '../contexts/|from '@/v8/contexts/|g" "$FLOW"
```

### Style C — Two-level relative imports from `src/v8/flows/` referencing `src/`
Some V8 flows reach outside the `v8/` module for shared components:
```typescript
import { ButtonSpinner } from '../../components/ui/ButtonSpinner';
import { CommonSpinner } from '../../components/common/CommonSpinner';
```
From `src/v8/flows/FlowV8.tsx`, `../../` resolves to `src/`.  
When copied to `src/pages/flows/v9/FlowV9.tsx`, `../../../` resolves to `src/`.

**Fix:**
```bash
sed -i '' "s|from '../../components/|from '../../../components/|g" "$FLOW"
sed -i '' "s|from '../../hooks/|from '../../../hooks/|g" "$FLOW"
sed -i '' "s|from '../../utils/|from '../../../utils/|g" "$FLOW"
```

---

## Pattern: Directory Flows (PAR)

`PingOnePARFlowV8` is a **module directory**, not a single file:

```
src/v8/flows/PingOnePARFlowV8/
├── index.ts                     ← re-exports the component
├── PingOnePARFlowV8.tsx         ← main component
├── constants/parFlowConstants.ts
├── hooks/
│   ├── usePARFlowState.ts
│   └── usePAROperations.ts
└── types/parFlowTypes.ts
```

**Migration approach — move the whole directory:**
```bash
# Copy entire directory to v9/
cp -r src/v8/flows/PingOnePARFlowV8 src/pages/flows/v9/PingOnePARFlowV9

# Rename files
cd src/pages/flows/v9/PingOnePARFlowV9
mv PingOnePARFlowV8.tsx PingOnePARFlowV9.tsx
sed -i '' 's/PingOnePARFlowV8/PingOnePARFlowV9/g' PingOnePARFlowV9.tsx index.ts

# Fix external path depths (PingOnePARFlowV8 was 1 dir deep in v8/flows/,
# the copy is now 1 dir deep in pages/flows/v9/ — same depth, but base differs)
# From src/v8/flows/PingOnePARFlowV8/:  ../../../../utils/oauth
# From src/pages/flows/v9/PingOnePARFlowV9/: ../../../../utils/oauth (SAME — 4 levels to src/)
# ✅ No depth change needed for files inside the directory
```

**PAR flow has no V8 service dependencies** — it uses only:
- Internal hooks (`usePARFlowState`, `usePAROperations`) — self-contained, no changes needed
- `generateCodeChallenge`, `generateCodeVerifier` from `../../../../utils/oauth`
- `useProductionSpinner` from `../../../../hooks/useProductionSpinner`
- Generic shared components (`ButtonSpinner`, `CommonSpinner`, `StepNavigationButtons`, `LearningTooltip`)

---

## Pattern: Factory-Based Flows (MFAFlowV8)

`MFAFlowV8.tsx` uses the flow component factory pattern:

```typescript
import { MFAFlowComponentFactory } from './factories/MFAFlowComponentFactory';
import { MFAFlowControllerFactory } from './factories/MFAFlowControllerFactory';
```

These factories live in `src/v8/flows/factories/` and are not V9-aware.

**Migration approach:**
1. The factories can be imported via alias: `@/v8/flows/factories/MFAFlowComponentFactory`
2. Internal flow types come from `@/v8/flows/shared/MFATypes` — no rename needed
3. Update the alias in the V9 file:
```bash
sed -i '' "s|from './factories/|from '@/v8/flows/factories/|g" "$FLOW"
sed -i '' "s|from './shared/|from '@/v8/flows/shared/|g" "$FLOW"
sed -i '' "s|from '../shared/|from '@/v8/flows/shared/|g" "$FLOW"
```

---

## Pattern: Context Provider Wrappers (CompleteMFAFlowV8)

`CompleteMFAFlowV8.tsx` wraps its render tree in two React Contexts:

```typescript
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';
```

These must be preserved exactly — the child MFA components consume these contexts via `useContext`.

**Available contexts in `src/v8/contexts/`:**
| Context file | Provider export | Used by |
|---|---|---|
| `GlobalMFAContext.tsx` | `GlobalMFAProvider` | Complete MFA, MFA Auth Main Page |
| `MFACredentialContext.tsx` | `MFACredentialProvider` | Complete MFA, MFA config pages |
| `FlowStateContext.tsx` | (flow state) | General flow state |

**Pattern in V9 file:**
```typescript
// Keep the provider wrappers — import via alias
import { GlobalMFAProvider } from '@/v8/contexts/GlobalMFAContext';
import { MFACredentialProvider } from '@/v8/contexts/MFACredentialContext';

// JSX stays the same
return (
  <GlobalMFAProvider>
    <MFACredentialProvider>
      {/* flow content */}
    </MFACredentialProvider>
  </GlobalMFAProvider>
);
```

---

## Token Exchange — Internal Types Migration

`TokenExchangeFlowV8.tsx` imports types from its own sibling directory:

```typescript
import type { TokenExchangeParams, TokenExchangeResponse } from '../types/tokenExchangeTypesV8';
import { TokenExchangeError, TokenExchangeErrorType } from '../types/tokenExchangeTypesV8';
```

From `src/v8/flows/`, `../types/` is `src/v8/types/`.

**Fix:**
```bash
sed -i '' "s|from '../types/|from '@/v8/types/|g" "$FLOW"
```

The type file itself (`src/v8/types/tokenExchangeTypesV8.ts`) does **not** need to be copied — import it via alias.

---

## Pre-Migration Check for V8 Flows

```bash
#!/bin/bash
FLOW_FILE="src/v8/flows/YourFlowV8.tsx"

echo "=== Import Style Audit ==="
echo "Style A (alias — safe):"
grep "from '@/v8" "$FLOW_FILE" | wc -l

echo "Style B (V8-internal relative — needs fix):"
grep "from '\.\./services/\|from '\.\./utils/\|from '\.\./hooks/\|from '\.\./components/\|from '\.\./types/\|from '\.\./contexts/" "$FLOW_FILE"

echo "Style C (two-level reaching outside v8/ — needs depth fix):"
grep "from '\.\.\/\.\.\/" "$FLOW_FILE"

echo "=== Context Providers ==="
grep "Provider\|Context" "$FLOW_FILE" | grep import

echo "=== Factory Usage ==="
grep "Factory" "$FLOW_FILE" | grep import

echo "=== Shared Flow Types ==="
grep "shared/MFATypes\|flows/shared" "$FLOW_FILE" | grep import

echo "=== V8U imports (separate module!) ==="
grep "v8u/" "$FLOW_FILE" | grep import
```

> **Note on `@/v8u/` imports:** Some V8 flows import from `src/v8u/` (a separate module). These also resolve correctly via alias and require no changes.

---

## Post-Copy Validation

After copying and fixing imports:

```bash
# 1. Check no remaining V8-internal relative service/util imports
grep "from '\.\./services/\|from '\.\./utils/\|from '\.\./hooks/\|from '\.\./types/" src/pages/flows/v9/YourFlowV9.tsx

# 2. Lint V9 flows only (Biome)
npx biome lint src/pages/flows/v9

# 3. Lint V9 flows only (ESLint)
npx eslint src/pages/flows/v9 --ext .ts,.tsx

# 4. TypeScript compile check (whole project — catches cross-file type errors)
npm run type-check

# 5. Check Vite resolves all imports
npm run dev -- --force
```

To lint V8 source after touching V8 files:
```bash
npx biome lint src/v8
npx eslint src/v8 --ext .ts,.tsx
```

---

## Scroll-to-Top: Add `usePageScroll` (V8 → V9)

V8 flows do **not** call `usePageScroll`. When you copy a V8 flow into V9, add it:

```tsx
import { usePageScroll } from '../../../hooks/usePageScroll';

// Inside the component:
const { scrollToTop } = usePageScroll();

// Call on scenario/step changes so users return to the top:
const handleScenarioChange = useCallback((scenario: string) => {
  setSelectedScenario(scenario as SomeScenario);
  scrollToTop();
}, [scrollToTop]);
```

> **Why this works now (root cause resolved):**  
> The layout in `App.tsx` uses `ContentColumn` (a div with `height: 100vh; overflow-y: auto`).  
> Previously all scroll attempts targeted `window`, which never actually scrolls in this layout.  
> `App.tsx` now has `<ContentColumn data-content-column>` and `scrollManager.ts` targets that  
> element directly. `usePageScroll()` / `scrollToTop()` will work on **every page** after this fix.

---

## Status Indicator Colors (Approved Exception to Blue-Only Rule)

When migrating V8 components that show live token / connection state, **keep** the Green / Amber / Red colors — they are an approved exception:

| State | Hex | Meaning |
|-------|-----|---------|
| Valid | `#10b981` | Token present, not expiring soon |
| Warning | `#f59e0b` | Token expires in < 5 min |
| Invalid | `#ef4444` / `#dc2626` | No token or auth failed |

This exception applies **only** to status indicator components (token displays, health badges).  
Flow page **headers must stay blue** (`#2563eb` / `#1e40af`).

---

## Reference: Flow-by-Flow Import Fix Commands

### Token Exchange
```bash
FLOW="src/pages/flows/v9/TokenExchangeFlowV9.tsx"
sed -i '' "s|from '../services/|from '@/v8/services/|g" "$FLOW"
sed -i '' "s|from '../utils/|from '@/v8/utils/|g" "$FLOW"
sed -i '' "s|from '../types/|from '@/v8/types/|g" "$FLOW"
sed -i '' "s|from '../../components/|from '../../../components/|g" "$FLOW"
sed -i '' "s|from '../../hooks/|from '../../../hooks/|g" "$FLOW"
sed -i '' 's/TokenExchangeFlowV8/TokenExchangeFlowV9/g' "$FLOW"
```

### CompleteMFAFlow
```bash
FLOW="src/pages/flows/v9/PingOneCompleteMFAFlowV9.tsx"
# Most imports already use @/v8/... alias — check for any stragglers
grep "from '\.\." "$FLOW"
sed -i '' "s|from '../../components/|from '../../../components/|g" "$FLOW"
sed -i '' 's/CompleteMFAFlowV8/PingOneCompleteMFAFlowV9/g' "$FLOW"
```

### MFAFlowV8
```bash
FLOW="src/pages/flows/v9/MFAFlowV9.tsx"
sed -i '' "s|from './factories/|from '@/v8/flows/factories/|g" "$FLOW"
sed -i '' "s|from './shared/|from '@/v8/flows/shared/|g" "$FLOW"
sed -i '' 's/MFAFlowV8/MFAFlowV9/g' "$FLOW"
```
