# comprehensiveFlowDataService.ts — Saturday morning update

**File:** `src/services/comprehensiveFlowDataService.ts`
**Change type:** Additive — cascade sync added inside `saveSharedEnvironment()`

---

## What changed

After a successful `localStorage.setItem` in `saveSharedEnvironment()`, a
cascade block now also calls `EnvironmentIdServiceV8.saveEnvironmentId()` via
an async import (best-effort, errors are silenced).

```ts
// NEW block added at the end of the try block in saveSharedEnvironment()
if (updated.environmentId) {
  import('../v8/services/environmentIdServiceV8')
    .then(({ EnvironmentIdServiceV8 }) => {
      EnvironmentIdServiceV8.saveEnvironmentId(updated.environmentId);
    })
    .catch(() => {
      // Silent — sync is best-effort
    });
}
```

## Why

Any flow that calls `saveSharedEnvironment` (e.g. OAuth flows, OIDC discovery)
now also propagates the environment ID to the canonical global store. This means
the next page load will auto-populate the environment ID field without any user
action.

## Rollback

Remove the new `if (updated.environmentId) { import(...) }` block. The rest
of `saveSharedEnvironment()` is unchanged.

## Risk

- **Very low.** The block uses `import().then().catch()` — fully async and
  non-blocking. Any failure is silently swallowed. The primary save to
  localStorage is not affected.
