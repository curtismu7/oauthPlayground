# Restore — Saturday Morning Session

**Date:** 2026-02-26 (Saturday)
**Branch:** phase1-app-based-structure

## Sessions covered

### Session 1 — HelioMartPasswordReset hooks crash fix

Root cause: `PageLayoutService.createPageLayout()` was called inside `useMemo`, which calls
`styled.header` (a styled-components v6 factory that uses `useContext` internally).
Calling a hook inside `useMemo` violates React Rules of Hooks → "Rendered fewer hooks than expected".

**Fix:** Moved `createPageLayout(...)` to module scope in `HelioMartPasswordReset.tsx`
(before the component function) so styled components are created once at load time,
never inside a hook.

### Session 2 — Environment ID auto-populate across all pages

Built a 3-layer system so users never have to type the environment ID again once
the worker token is configured:
1. `useAutoEnvironmentId` hook + `readBestEnvironmentId()` utility
2. Cascade sync: worker token save and shared environment save both push to `EnvironmentIdServiceV8`
3. All major pages updated to use `readBestEnvironmentId()` as their initial state

## Additional docs in this folder

| Doc | Covers |
| --- | --- |
| `2026-02-26_envid-auto-populate.md` | prompt-all.md compliant changelog for all envId changes |
| `biome-cleanup.md` | Biome results, what was fixed, PR5 checklist status |

---

## Files changed — index

| File | Type | Doc |
| --- | --- | --- |
| `src/services/pageLayoutService.ts` | Modified | [pageLayoutService.md](./pageLayoutService.md) |
| `src/pages/security/HelioMartPasswordReset.tsx` | Modified | [HelioMartPasswordReset.md](./HelioMartPasswordReset.md) |
| `src/services/environmentIdService.ts` | **New** | [environmentIdService.md](./environmentIdService.md) |
| `src/hooks/useAutoEnvironmentId.ts` | **New** | [useAutoEnvironmentId.md](./useAutoEnvironmentId.md) |
| `src/components/AutoEnvironmentIdInput.tsx` | **New** | [AutoEnvironmentIdInput.md](./AutoEnvironmentIdInput.md) |
| `src/services/unifiedWorkerTokenService.ts` | Modified | [unifiedWorkerTokenService.md](./unifiedWorkerTokenService.md) |
| `src/services/comprehensiveFlowDataService.ts` | Modified | [comprehensiveFlowDataService.md](./comprehensiveFlowDataService.md) |
| `src/pages/PingOneUserProfile.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/pages/PingOneWebhookViewer.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/pages/PingOneAuditActivities.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/pages/PasskeyManager.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/pages/flows/JWTBearerTokenFlowV7.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/pages/flows/RARFlowV7.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/v8/pages/DeleteAllDevicesUtilityV8.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/v8/pages/MFADeviceCreateDemoV8.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |
| `src/v8/flows/EmailMFASignOnFlowV8.tsx` | Modified | [pages-envid-update.md](./pages-envid-update.md) |

## Rollback

To revert the environment ID auto-populate work only:

```bash
# Revert the 8 page files
git checkout HEAD -- \
  src/pages/PingOneUserProfile.tsx \
  src/pages/PingOneWebhookViewer.tsx \
  src/pages/PingOneAuditActivities.tsx \
  src/pages/PasskeyManager.tsx \
  src/pages/flows/JWTBearerTokenFlowV7.tsx \
  src/pages/flows/RARFlowV7.tsx \
  src/v8/pages/DeleteAllDevicesUtilityV8.tsx \
  src/v8/pages/MFADeviceCreateDemoV8.tsx \
  src/v8/flows/EmailMFASignOnFlowV8.tsx \
  src/services/unifiedWorkerTokenService.ts \
  src/services/comprehensiveFlowDataService.ts

# Remove new files
rm src/hooks/useAutoEnvironmentId.ts
rm src/components/AutoEnvironmentIdInput.tsx
```

To revert the HelioMartPasswordReset hooks fix only (not recommended — will re-introduce the crash):

```bash
git checkout HEAD -- src/pages/security/HelioMartPasswordReset.tsx
```
