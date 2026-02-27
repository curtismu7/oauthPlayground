# useAutoEnvironmentId — new hook

**File:** `src/hooks/useAutoEnvironmentId.ts`
**Change type:** New file

---

## Purpose

Single hook that reads the environment ID from **all known storage locations**,
in priority order, and stays reactive to updates dispatched by other flows.

## Priority order (readBestEnvironmentId)

| Priority | Key | Source |
| --- | --- | --- |
| 1 | `v8:global_environment_id` | `EnvironmentIdServiceV8` — canonical store |
| 2 | `unified_worker_token` → `.credentials.environmentId` | Worker token service |
| 3 | `pingone_shared_environment` → `.environmentId` | `comprehensiveFlowDataService` |
| 4 | `pingone_environment_id_persistence` → `.environmentId` | `environmentIdPersistenceService` |
| 5 | `worker_credentials` → `.environmentId` | Legacy worker credentials |

All values are validated as UUID format before use.

## Exports

### `readBestEnvironmentId(): string`

Synchronous function. Reads from all 5 sources and returns the first valid UUID,
or `''` if none found. Used in `useState(() => readBestEnvironmentId())` patterns.

### `useAutoEnvironmentId(saveOnChange?: boolean)`

React hook. Returns `{ environmentId, setEnvironmentId, refresh }`.

- Initialises from `readBestEnvironmentId()`
- Listens for `environmentIdUpdated` window events and `storage` events
- When `setEnvironmentId(id)` is called and `saveOnChange=true` (default),
  also writes to `EnvironmentIdServiceV8` so other pages update reactively

## Usage patterns

```tsx
// Pattern A — full reactive (for pages that also save the envId globally)
const { environmentId, setEnvironmentId } = useAutoEnvironmentId();

// Pattern B — read-only initial value (for pages that manage their own state)
const [environmentId, setEnvironmentId] = useState(() => readBestEnvironmentId());

// Pattern C — form with auto-fill and manual override
import { AutoEnvironmentIdInput } from '../components/AutoEnvironmentIdInput';
<AutoEnvironmentIdInput value={envId} onChange={setEnvId} label="Environment ID" />
```

## Rollback

Delete the file. Remove any imports of `readBestEnvironmentId` or `useAutoEnvironmentId`
from the files listed in `pages-envid-update.md` and `HelioMartPasswordReset.md`.
