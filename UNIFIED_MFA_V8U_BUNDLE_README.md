# Unified MFA + V8U + Services Bundle

This zip contains the **Unified MFA** flow, **Unified OAuth (v8u)** flow, all related services, and the dev server.

## Contents

| Path | Description |
|------|-------------|
| **server.js** | Dev server (Express, CORS, PingOne proxy, logging). |
| **src/v8/** | V8 MFA/OAuth layer: Unified MFA flow (`flows/unified/`), MFA services, components, config, contexts, hooks. |
| **src/v8u/** | Unified OAuth UI: `UnifiedOAuthFlowV8U`, `UnifiedFlowSteps`, `UnifiedNavigationV8U`, all v8u services (credentialReload, unifiedFlowIntegration, etc.). |
| **src/services/** | Shared services: `postmanCollectionGeneratorV8`, `unifiedWorkerTokenService`, `apiCallTrackerService`, and others used by both flows. |
| **src/hooks/** | Shared hooks (e.g. `usePageScroll`). |
| **src/contexts/** | Shared contexts (e.g. `FlowStateContext`). |
| **src/types/** | Shared TypeScript types. |
| **src/config/** | App config (e.g. PingOne). |
| **src/styles/** | Global styles used by flows. |
| **package.json** | Dependencies; run `npm install` in the project root. |

## Key entry points

- **Unified MFA (registration):** `src/v8/flows/unified/UnifiedMFARegistrationFlowV8.tsx`  
  Route in App: `/v8/mfa-unified`
- **Unified OAuth (v8u):** `src/v8u/flows/UnifiedOAuthFlowV8U.tsx`  
  Routes in App: `/v8u/unified/oauth-authz/:step?`, `/v8u/unified/:flowType?/:step?`
- **Server:** Run `node server.js` (or your usual dev command that uses it).

## Using this bundle

1. Unzip into your app (or merge with existing `src/` and root files).
2. Run `npm install`.
3. Ensure `App.tsx` (or your router) mounts the Unified MFA and v8u routes and any providers (e.g. `UnifiedFlowProvider`, `FlowStateProvider`, `MFACredentialProvider`).
4. Start the dev server (e.g. `npm run dev` / `node server.js` as applicable).

This bundle does **not** include the full `src/` tree (e.g. other pages, locked/archived code). Add any other routes or components your app needs from the full repo.
