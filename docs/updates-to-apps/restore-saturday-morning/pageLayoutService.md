# pageLayoutService.ts — Saturday morning fix

**File:** `src/services/pageLayoutService.ts`
**Change type:** Bug fix (instrumentation removed, no functional change)

## What happened

Debug instrumentation (`fetch` calls to the debug ingest server) was added to
`getPageHeader()` to confirm the root cause of the HelioMartPasswordReset crash.
The instrumentation was removed after the bug was confirmed and fixed.

The service itself was not changed functionally. It already used a cache
(`_pageHeaderCache`) to avoid creating duplicate styled components — the bug
was that the **caller** (`HelioMartPasswordReset`) was calling into the service
from inside `useMemo`, which triggered a cache miss on first mount and therefore
created a styled component (which calls `useContext`) inside a React hook.

## Current state (after fix)

`getPageHeader()` is unchanged. The cache key is `config.theme`. First call
per theme creates the styled component; subsequent calls return the cached one.

## How to verify

Navigate to `https://api.pingdemo.com:3000/security/password-reset`.
No "Rendered fewer hooks than expected" error should appear in the console.

## Rollback

No change to this file is needed to roll back — it is at the same functional
state as before the debug session.
