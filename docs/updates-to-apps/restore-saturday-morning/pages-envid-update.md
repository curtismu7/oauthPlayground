# Pages — environment ID auto-populate update

**Change type:** Modified — `useState` initial value updated to use `readBestEnvironmentId()`

All pages below now read from **all known storage sources** in priority order
instead of a single source or empty string. No page-specific logic was changed.

---

## Pattern applied

### Before (varies per page, examples)

```tsx
// Empty — user always had to type
const [environmentId, setEnvironmentId] = useState('');

// Single source — missed other storage locations
const [environmentId, setEnvironmentId] = useState(
  () => EnvironmentIdServiceV8.getEnvironmentId() || ''
);

// Multi-source inline (20+ lines) — duplicated logic per page
const [environmentId, setEnvironmentId] = useState<string>(() => {
  try {
    const stored = localStorage.getItem('unified_worker_token');
    if (stored) { ... }
    const globalEnvId = localStorage.getItem('v8:global_environment_id');
    if (globalEnvId) { return globalEnvId; }
  } catch {}
  return '';
});
```

### After (all pages)

```tsx
import { readBestEnvironmentId } from '../../hooks/useAutoEnvironmentId';
// or '@/hooks/useAutoEnvironmentId' for v8 paths

const [environmentId, setEnvironmentId] = useState(() => readBestEnvironmentId());
```

---

## Files updated

### `src/pages/PingOneUserProfile.tsx`

- **Before:** Checked `searchParams.get('environmentId')` → `worker_environment_id`
  localStorage key → unified worker token credentials
- **After:** URL param (`searchParams.get`) still takes priority; falls back to
  `readBestEnvironmentId()` (which checks all 5 sources)
- **Import added:** `import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';`

### `src/pages/PingOneWebhookViewer.tsx`

- **Before:** 20-line inline logic checking unified worker token then legacy
  `environmentId` localStorage key
- **After:** Single line: `useState<string>(() => readBestEnvironmentId())`
- **Import added:** `import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';`

### `src/pages/PingOneAuditActivities.tsx`

- **Before:** 20-line inline logic checking unified worker token then
  `v8:global_environment_id` with a "CRITICAL FIX" comment
- **After:** Single line: `useState<string>(() => readBestEnvironmentId())`
- **Import added:** `import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';`

### `src/pages/PasskeyManager.tsx`

- **Before:** `useState(() => EnvironmentIdServiceV8.getEnvironmentId() || '')`
  (read only from `EnvironmentIdServiceV8`, missed worker token and others)
- **After:** `useState(() => readBestEnvironmentId())`
- **Import added:** `import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';`

### `src/pages/flows/JWTBearerTokenFlowV7.tsx`

- **Before:** `useState('')` — always empty
- **After:** `useState(() => readBestEnvironmentId())`
- **Import added:** `import { readBestEnvironmentId } from '../../hooks/useAutoEnvironmentId';`

### `src/pages/flows/RARFlowV7.tsx`

- **Before:** `useState('')` — always empty
- **After:** `useState(() => readBestEnvironmentId())`
- **Import added:** `import { readBestEnvironmentId } from '../../hooks/useAutoEnvironmentId';`

### `src/v8/pages/DeleteAllDevicesUtilityV8.tsx`

- **Before:** 30-line inline logic checking `locationState`, `StorageServiceV8`,
  `EnvironmentIdServiceV8`, and the unified worker token
- **After:** Checks `locationState` and `StorageServiceV8` first (same as before),
  then falls back to `readBestEnvironmentId()` instead of re-implementing the same logic
- **Import added:** `import { readBestEnvironmentId } from '@/hooks/useAutoEnvironmentId';`

### `src/v8/pages/MFADeviceCreateDemoV8.tsx`

- **Before:** `useState('')` — always empty
- **After:** `useState(() => readBestEnvironmentId())`
- **Import added:** `import { readBestEnvironmentId } from '@/hooks/useAutoEnvironmentId';`

### `src/v8/flows/EmailMFASignOnFlowV8.tsx`

- **Before:** `useState('')` — always empty
- **After:** `useState(() => readBestEnvironmentId())`
- **Import added:** `import { readBestEnvironmentId } from '@/hooks/useAutoEnvironmentId';`

---

## Rollback (any single page)

1. Remove the `import { readBestEnvironmentId } from '...' ;` line
2. Restore the original `useState` expression from the before pattern above

The pages are independent — rolling back one does not affect others.
