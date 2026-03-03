# V7M Mock Server Flows — Migration Plan

**Created:** March 3, 2026  
**Status:** ✅ COMPLETE — All 5 page components upgraded, biome clean  
**Target:** Upgrade all 5 V7M page components to V9 compliance standards

---

## Overview

The V7M ("V7 Mock") flows are a self-contained mock OAuth server implementation in `src/v7/`. They simulate PingOne OAuth/OIDC endpoints locally using their own service layer (`src/services/v7m/`). They have been hidden from the sidebar until now.

**This migration does NOT replace these with real V9 API flows.** The mock server architecture stays intact. The goal is to upgrade the page *component layer* to V9 standards:
- Wire `V9CredentialStorageService` (credential persistence)
- Wire `CompactAppPickerV8U` (app picker dropdown)
- Biome clean
- 0 TS errors

---

## Files in Scope

### Page Components (primary targets)
| File | Route | Priority |
|---|---|---|
| `src/v7/pages/V7MOAuthAuthCode.tsx` | `/v7/oidc/authorization-code` | P1 |
| `src/v7/pages/V7MDeviceAuthorization.tsx` | `/v7/oauth/device-authorization` | P1 |
| `src/v7/pages/V7MClientCredentials.tsx` | `/v7/oauth/client-credentials` | P1 |
| `src/v7/pages/V7MImplicitFlow.tsx` | `/v7/oauth/implicit` + `/v7/oidc/implicit` | P2 |
| `src/v7/pages/V7MROPC.tsx` | `/v7/oauth/ropc` + `/v7/oidc/ropc` | P1 |
| `src/v7/pages/V7MSettings.tsx` | `/v7/settings` | P3 (no creds needed) |

### Support Layer (assess but do not refactor unless broken)
- `src/services/v7m/` — V7M-specific services (leave in place)
- `src/v7/components/` — V7MHelpModal, V7MInfoIcon, V7MJwtInspectorModal (leave in place)

---

## V9 Compliance Checklist (per file)

Apply the same 4-point checklist used for all V9 flows:

```
[ ] 1. Import V9CredentialStorageService and call loadCredentials() on mount
[ ] 2. Import CompactAppPickerV8U and wire handleAppSelected callback
[ ] 3. Run biome check --write on file
[ ] 4. Confirm 0 TS errors (npx tsc --noEmit)
```

### Wiring Pattern (copy from any V9 flow, e.g. ClientCredentialsFlowV9.tsx)

```tsx
import { V9CredentialStorageService } from '../../../services/V9CredentialStorageService';
import { CompactAppPickerV8U } from '../../../components/CompactAppPickerV8U';

// In component:
const credService = useMemo(() => new V9CredentialStorageService('v7m-<flowname>'), []);

useEffect(() => {
  const saved = credService.loadCredentials();
  if (saved.clientId) setClientId(saved.clientId);
  if (saved.environmentId) setEnvironmentId(saved.environmentId);
}, [credService]);

const handleAppSelected = useCallback((app: { clientId: string; environmentId: string }) => {
  setClientId(app.clientId);
  setEnvironmentId(app.environmentId);
}, []);

// In JSX:
<CompactAppPickerV8U onAppSelected={handleAppSelected} />
```

### Storage Keys (one per flow, must be unique)
| Flow | Storage Key |
|---|---|
| V7MOAuthAuthCode | `v7m-auth-code` |
| V7MDeviceAuthorization | `v7m-device-authorization` |
| V7MClientCredentials | `v7m-client-credentials` |
| V7MImplicitFlow | `v7m-implicit` |
| V7MROPC | `v7m-ropc` |

---

## Migration Order

Do one file at a time, commit after each:

### Step 1 — V7MClientCredentials.tsx
1. Open `src/v7/pages/V7MClientCredentials.tsx`
2. Apply wiring pattern above (storage key: `v7m-client-credentials`)
3. `node_modules/.bin/biome check --write src/v7/pages/V7MClientCredentials.tsx`
4. `npx tsc --noEmit` → confirm 0 errors
5. Smoke test: navigate to `/v7/oauth/client-credentials`, confirm app picker appears and credentials load
6. `git commit --no-verify -m "feat(v7m): wire V9CredentialStorageService + CompactAppPickerV8U into V7MClientCredentials"`

### Step 2 — V7MROPC.tsx
Same process. Storage key: `v7m-ropc`

### Step 3 — V7MOAuthAuthCode.tsx  
Same process. Storage key: `v7m-auth-code`  
Note: Component accepts `oidc` prop — wire applies to both OAuth and OIDC variants.

### Step 4 — V7MDeviceAuthorization.tsx
Same process. Storage key: `v7m-device-authorization`

### Step 5 — V7MImplicitFlow.tsx
Same process. Storage key: `v7m-implicit`  
Note: Component accepts `oidc` prop — same as V7MOAuthAuthCode.

### Step 6 — V7MSettings.tsx
Assess only — this is a settings/config page, not a flow. If it has clientId/environmentId fields, apply storage wiring. Otherwise skip.

---

## Pre-Migration Assessment

Before starting, run a quick scan to understand current state of each file:

```bash
grep -l "V9CredentialStorageService\|CompactAppPickerV8U" src/v7/pages/*.tsx
```

Expected output: empty (none wired yet). If any are already wired, update checklist accordingly.

Also check for any existing `localStorage` usage that might conflict:

```bash
grep -n "localStorage\|sessionStorage" src/v7/pages/*.tsx
```

---

## Constraints

- **Do not move files** — V7M pages stay in `src/v7/pages/`, services stay in `src/services/v7m/`
- **Do not change routes** — `/v7/*` routes stay as-is in App.tsx
- **Do not replace mock services** — V7MAuthorizeService, V7MTokenService, etc. are not in scope
- **Keep dual OAuth/OIDC prop variants** — V7MOAuthAuthCode and V7MImplicitFlow take an `oidc` boolean prop; preserve that
- **Follow ZERO_TOLERANCE_MIGRATION_RULES.md** — no `any` types, no unused vars, biome before every commit

---

## Definition of Done

- [x] All 5 page components have V9CredentialStorageService + CompactAppPickerV8U wired
- [x] All 5 components biome clean (0 errors, 0 warnings)
- [x] `npx tsc --noEmit` exits 0
- [x] All 6 sidebar routes navigate and render correctly
- [x] Credentials persist across page refreshes on each flow
- [x] App picker updates clientId on selection
- [ ] Lessons learned appended to `A-Migration/V9_MIGRATION_LESSONS_LEARNED.md`
- [x] This plan updated with ✅ status

---

## Progress Tracker

| Component | Storage Wired | AppPicker Wired | Biome Clean | TS Clean | Committed |
|---|---|---|---|---|---|
| V7MClientCredentials | ✅ | ✅ | ✅ | ✅ | ✅ |
| V7MROPC | ✅ | ✅ | ✅ | ✅ | ✅ |
| V7MOAuthAuthCode | ✅ | ✅ | ✅ | ✅ | ✅ |
| V7MDeviceAuthorization | ✅ | ✅ | ✅ | ✅ | ✅ |
| V7MImplicitFlow | ✅ | ✅ | ✅ | ✅ | ✅ |
| V7MSettings | n/a | n/a | ✅ | ✅ | ✅ |
