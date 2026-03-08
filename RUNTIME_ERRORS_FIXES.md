# Runtime Errors — Root Causes & Fixes

A reference for the team on 5 categories of runtime/parse errors fixed in this session, what caused them, and how to avoid them.

---

## 1. Pre-existing Parse Errors (3 files)

**Files:** `UserInformationStep.tsx`, `TokenInspector.tsx`, `KrogerGroceryStoreMFA.tsx`

**Errors:**
```
Parsing error: Property assignment expected
Parsing error: JSX element 'div' has no corresponding closing tag
Parsing error: Declaration or statement expected
```

**Root cause:** Three separate hand-editing mistakes left the files in a broken state:

- **`UserInformationStep.tsx`** — a stray `{` inside an object literal argument turned it into an invalid nested object:
  ```ts
  // Broken
  showFooterMessage({ type: 'status', message: '...', {
      description: '...',
  }, duration: 4000 });

  // Fixed
  showFooterMessage({ type: 'status', message: '...', description: '...', duration: 4000 });
  ```

- **`TokenInspector.tsx`** — a `<div>` opened at line 249 was never closed. The JSX tree had one `</div>` too few before `</CardBody>`.

- **`KrogerGroceryStoreMFA.tsx`** — the body of a `useCallback` (`enableMFADevice`) had its opening declaration deleted, leaving ~40 lines of orphaned function body code sitting between `useEffect` blocks, outside any function scope. The function was never called anywhere in the file so the entire orphaned block was removed.

**Fix summary:** Remove the stray `{`, add the missing `</div>`, delete the orphaned dead code.

---

## 2. V9_COLORS Import Incorrectly Removed

**Files:** `EnvironmentIdInput.tsx`, `Analytics.tsx`, `Configuration.tsx`

**Error:**
```
ReferenceError: V9_COLORS is not defined  (runtime, in browser)
```

**Root cause:** An automated cleanup script removed `V9_COLORS` imports from ~160 files. The script correctly identified that most usages were bare CSS text — **not** real JS references:
```ts
// NOT a JS reference — just a literal string in CSS, the import is not needed
const Label = styled.label`
  color: V9_COLORS.TEXT.GRAY_DARK;
`;
```

But it missed the real JS interpolation pattern in 3 files:
```ts
// IS a JS reference — ${} evaluates the variable, the import IS needed
const Container = styled.div`
  background: ${V9_COLORS.BG.GRAY_LIGHT};
`;
```

**Fix:** Restored `import { V9_COLORS } from '../services/v9/V9ColorStandards'` in the 3 affected files.

**Rule of thumb for styled-components:**
| Pattern | Import needed? |
|---|---|
| `` `color: V9_COLORS.TEXT.GRAY_DARK;` `` | ❌ No — literal CSS text |
| `` `color: ${V9_COLORS.TEXT.GRAY_DARK};` `` | ✅ Yes — JS interpolation |
| `` `color: ${'V9_COLORS.TEXT.GRAY_DARK'};` `` | ❌ No — string literal inside `${}` |

---

## 3. Bare Emoji as JSX Children

**File:** `PingOneProtectFlowV8.tsx`

**Error:**
```
[plugin:vite:react-babel] Unexpected character '✅'. (574:8)
```

**Root cause:** Emoji were placed as direct JSX children without any wrapper:
```tsx
// Broken — Babel cannot tokenize a raw emoji as a JS expression
{tokenStatus.isValid ? (
    ✅
) : (
    ❌
)}
```

Babel's parser treats JSX children as either JS expressions (inside `{}`) or JSX text nodes. A raw multi-byte emoji character in expression position is neither — it's not a valid JS token.

**Fix:** Wrap in a `<span>`:
```tsx
{tokenStatus.isValid ? <span>✅</span> : <span>❌</span>}
```

**General rule:** Never use emoji (or any non-ASCII character) as a bare JSX expression child. Always wrap in a `<span>` or put inside a JSX text node (outside `{}`).

---

## 4. Named Export Mismatch

**File:** `unifiedFlowErrorHandlerV8U.ts`

**Error:**
```
SyntaxError: The requested module '...unifiedFlowLoggerServiceV8U.ts'
does not provide an export named 'UnifiedFlowLoggerService'
```

**Root cause:** The module exports a camelCase singleton object:
```ts
// unifiedFlowLoggerServiceV8U.ts
export const unifiedFlowLoggerService = { ... };  // ← actual export name
```

But the consumer was importing a PascalCase name that doesn't exist:
```ts
import { UnifiedFlowLoggerService } from './unifiedFlowLoggerServiceV8U';  // ← broken
```

PascalCase (`UnifiedFlowLoggerService`) suggests a class or type, but this is a plain object singleton with a camelCase name. The mismatch was likely introduced during a naming convention migration.

**Fix:** Use an import alias so all internal call sites stay unchanged:
```ts
import { unifiedFlowLoggerService as UnifiedFlowLoggerService } from './unifiedFlowLoggerServiceV8U';
```

---

## 5. `createModuleLogger` Imported from the Wrong Module (14 files)

**Files:** `Callback.tsx`, `TokenInspector.tsx`, `WorkerTokenTester.tsx`, `URLDecoder.tsx`, `FlowComparisonTool.tsx`, `PingOneLogoutFlow.tsx`, `TokenRevocationFlow.tsx`, `UserInfoFlow.tsx`, `ClientCredentialsFlowV9.tsx`, `DeviceAuthorizationFlowV9.tsx`, `ImplicitFlowV9.tsx`, `OAuthAuthorizationCodeFlowV9.tsx`, `OIDCHybridFlowV9.tsx`, `PingOnePARFlowV9.tsx`

**Error:**
```
SyntaxError: The requested module '/src/utils/logger.ts'
does not provide an export named 'createModuleLogger'
```

**Root cause:** Two different utilities exist in `src/utils/` with similar purposes but different exports:

| File | Exports |
|---|---|
| `utils/logger.ts` | `logger` (singleton instance) |
| `utils/consoleMigrationHelper.ts` | `createModuleLogger(filePath)` (factory function) |

All 14 files were importing `createModuleLogger` from `logger.ts`, which doesn't have it. This was likely introduced by an automated import fixer that matched by function name without checking the actual source.

**Fix:** Updated all 14 imports to point to the correct module:
```ts
// Before (broken)
import { createModuleLogger } from '../utils/logger';

// After (correct)
import { createModuleLogger } from '../utils/consoleMigrationHelper';
```

---

## Common Thread

All 5 errors are **import/export contract violations** — either:
- Wrong source module path
- Wrong export name (case mismatch, wrong file)
- Import was removed when it was still genuinely needed

The browser's native ES module system enforces these contracts strictly at load time, producing the `SyntaxError: does not provide an export named '...'` family of errors. These are always caught immediately on page load — nothing renders until the module graph resolves cleanly.

**Prevention tips:**
1. Use TypeScript's `noImplicitAny` and `moduleResolution: bundler` — TS will catch missing exports at compile time before you hit the browser.
2. Be careful with automated import removal tools — always verify `${expression}` vs `bare text` in styled-components template literals.
3. When renaming exports, use your IDE's "Rename Symbol" refactor so all consumers update atomically.
