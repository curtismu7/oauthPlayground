---
applyTo: "src/flows/**,src/pages/flows/**,src/hooks/use*Flow*,src/hooks/use*Authorization*,src/v8/**,src/v8u/**,src/v7/**"
---

# OAuth / OIDC Flow Safety

## Supported Flows (do not break any of these)

| Flow | Key files |
|------|-----------|
| Authorization Code + PKCE | `src/pages/flows/AuthorizationCodeFlowPage.tsx`, `src/services/authorizationCodeSharedService.ts` |
| Implicit (legacy) | `src/v8/flows/types/ImplicitFlow*.tsx` |
| Device Authorization (RFC 8628) | `src/hooks/useDeviceAuthorizationFlow.ts`, `src/services/deviceFlowService.tsx` |
| Client Credentials | `src/services/clientCredentialsSharedService.ts` |
| Hybrid | `src/services/hybridFlowSharedService.ts` |
| ROPC | `src/services/implicitFlowSharedService.ts` |
| Token Exchange (RFC 8693) | `src/services/v9/` |
| PAR / RAR | `src/services/parService.ts`, `src/services/rarService.ts` |

## Non-Negotiable Rules

- **Never modify a shared service in-place** when it could affect flows you didn't intend to change. Fork a versioned copy (`v2/` subfolder) instead and migrate only the targeted flow.
- **Device flow polling** must stop after 3 consecutive 400 errors — never introduce infinite loops.
- **PKCE** — `code_verifier` must stay server-side or be cleared from memory immediately after use; never log or return it.
- **State parameter** — always generate server-side, validate on callback; never accept a client-supplied state for session binding.

## Before Changing Any Flow File

1. Read `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`, Section 4 (checklist) and Section 7 (do-not-break).
2. Search for all consumers of the service/hook you are changing (`grep -r "ServiceName" src/`).
3. Classify the change: PATCH / MINOR / MAJOR.
4. For MAJOR: create a versioned copy; do not silently alter the existing contract.

## After Fixing a Flow Bug

Add an entry to Section 3 of `docs/UPDATE_LOG_AND_REGRESSION_PLAN.md`:
```
### <Short heading>
**Cause:** ...  **Fix:** ...  **Files:** ...  **Regression check:** ...
```

## Version Namespacing

| Dir | Purpose |
|-----|---------|
| `v7/` | Legacy v7 flows — preserve; don't add new features |
| `v8/` | v8 flows — stable; additions only |
| `v8u/` | Unified v8 flows — stable; additions only |
| `v9/` | Active v9 flows — new features go here |

Never mix concerns across version directories.

## Device Flow — Critical Feature Checklist

After any change touching `useDeviceAuthorizationFlow.ts` or `deviceFlowService.tsx`, verify:
- [ ] Polling stops after 3 consecutive 400 errors (no infinite loop)
- [ ] Device greyed out until authorization completes; QR code always visible
- [ ] Token display uses `UnifiedTokenDisplayService`
- [ ] RFC 8628: `verification_uri_complete`, slow_down interval respected
