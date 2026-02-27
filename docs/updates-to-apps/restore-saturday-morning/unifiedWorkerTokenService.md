# unifiedWorkerTokenService.ts — Saturday morning update

**File:** `src/services/unifiedWorkerTokenService.ts`
**Change type:** Additive — cascade sync added inside `saveCredentials()`

---

## What changed

A cascade sync block was added **near the start** of `saveCredentials()` (before
the SQLite backup block, around line 334). When credentials are saved, the
`environmentId` is now also written to `EnvironmentIdServiceV8` so all pages
that use `useAutoEnvironmentId` or `readBestEnvironmentId()` pick it up automatically.

```ts
// NEW block added inside saveCredentials()
try {
  const { EnvironmentIdServiceV8 } = await import('../v8/services/environmentIdServiceV8');
  if (credentials.environmentId) {
    EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
  }
} catch (error) {
  console.warn(`${MODULE_TAG} Failed to sync environmentId to global store`, error);
}
```

## Why

Previously, setting up a worker token (which contains the environment ID) did not
automatically propagate the envId to `EnvironmentIdServiceV8`. Pages that read
from `v8:global_environment_id` would not see it until explicitly refreshed.

Now, saving worker token credentials cascades the envId to all consumers.

## Rollback

Remove the new block (approximately lines 334–341). The rest of the function
is unchanged.

## Risk

- **Low.** The block is wrapped in try/catch, so any failure silently warns
  and does not break the credential save.
- The `saveEnvironmentId` call dispatches `environmentIdUpdated`, which may
  cause a brief re-render on any page using `useAutoEnvironmentId`. This is
  expected and harmless.
