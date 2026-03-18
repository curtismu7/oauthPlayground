---
mode: edit
description: Scaffold a new React hook following MasterFlow API conventions
---

Scaffold a new React hook for this project. Use the patterns below **exactly**.

## What to create

1. `src/hooks/${hookName}.ts` — the hook

## Rules

- Strict TypeScript — export a `${HookName}Config` interface and a `${HookName}State` interface
- All callbacks wrapped in `useCallback` with explicit, stable dependency arrays
- Audit every `useEffect` dependency array: it must NOT contain state that the effect itself writes (causes infinite loops)
- Every `useEffect` that does async work must use `AbortController` and guard `setState` calls with `if (!signal.aborted)`
- No `console.*` — use `logger` from `../utils/logger`
- Return a plain object `{ state, ...methods }` — not an array

## Template

```ts
// src/hooks/${hookName}.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

const MODULE_TAG = '[🪝 ${HOOK_NAME_UPPER}]';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ${HookName}Config {
  /** Pass false to disable the hook entirely */
  enabled?: boolean;
  /** Used to debug — logs extra info when true */
  debug?: boolean;
}

export interface ${HookName}State {
  isLoading: boolean;
  data: null | unknown; // replace `unknown` with your result type
  error: Error | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const ${hookName} = (config: ${HookName}Config = {}) => {
  const { enabled = true, debug = false } = config;

  const [state, setState] = useState<${HookName}State>({
    isLoading: false,
    data: null,
    error: null,
  });

  // Use a ref to track whether the component is still mounted
  const abortRef = useRef<AbortController | null>(null);

  // ─── Load / initialise ────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled) return;

    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    (async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        // TODO: replace with actual async work
        const result = await Promise.resolve(null);
        if (!signal.aborted) {
          setState({ isLoading: false, data: result, error: null });
          if (debug) logger.debug(MODULE_TAG, 'Load complete', { result });
        }
      } catch (err) {
        if (!signal.aborted) {
          const error = err as Error;
          logger.error(MODULE_TAG, 'Load failed', error);
          setState((prev) => ({ ...prev, isLoading: false, error }));
        }
      }
    })();

    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, debug]); // ← only stable inputs; does NOT include state written above

  // ─── Actions ──────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ isLoading: false, data: null, error: null });
    logger.info(MODULE_TAG, 'State reset');
  }, []); // ← no dependencies: setState from useState is stable

  const refresh = useCallback(async () => {
    if (!enabled) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await Promise.resolve(null); // replace with real call
      if (!signal.aborted) {
        setState({ isLoading: false, data: result, error: null });
      }
    } catch (err) {
      if (!signal.aborted) {
        const error = err as Error;
        logger.error(MODULE_TAG, 'Refresh failed', error);
        setState((prev) => ({ ...prev, isLoading: false, error }));
      }
    }
  }, [enabled]);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    state,
    reset,
    refresh,
  };
};
```

## After scaffolding

- Replace `Promise.resolve(null)` placeholders with the actual async work
- Replace the `data: null | unknown` type with a concrete interface
- Add tests: `src/hooks/__tests__/${hookName}.test.ts` (use the `new-test` prompt)
- Check `useEffect` dependency arrays one more time for infinite-loop risk
- `npm run type-check` must pass
