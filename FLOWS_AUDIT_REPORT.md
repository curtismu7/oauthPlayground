# src/flows Directory Audit Report

Date: March 8, 2026

## Finding: Directory Does Not Exist

`src/flows` does not exist in this workspace.

Flow files are split across:

| Location | Contents |
|---|---|
| `src/pages/flows/v9/` | V9 OAuth flow pages (17 files) |
| `src/v8/flows/` | V8 OAuth flow pages |
| `src/v8m/pages/` | V8 migration flow pages |
| `src/pages/` | Top-level page components including flow entry points |

## V9 Flows (`src/pages/flows/v9/`)

All 17 V9 flow files were previously audited and fixed:

| File | Status |
|---|---|
| ClientCredentialsFlowV9.tsx | ✅ Clean |
| DPoPAuthorizationCodeFlowV9.tsx | ✅ Clean |
| DeviceAuthorizationFlowV9.tsx | ✅ Clean |
| ImplicitFlowV9.tsx | ✅ Clean |
| JWTBearerTokenFlowV9.tsx | ✅ Clean |
| MFALoginHintFlowV9.tsx | ✅ Clean |
| MFAWorkflowLibraryFlowV9.tsx | ✅ Clean |
| OAuthAuthorizationCodeFlowV9.tsx | ✅ Clean |
| OAuthAuthorizationCodeFlowV9_Condensed.tsx | ✅ Clean |
| OAuthROPCFlowV9.tsx | ✅ Clean |
| OIDCHybridFlowV9.tsx | ✅ Clean (createModuleLogger import fixed) |
| PingOnePARFlowV9.tsx | ✅ Clean |
| RARFlowV9.tsx | ✅ Clean |
| ResourcesAPIFlowV9.tsx | ✅ Fixed this session (wrong `../../` → `../../../` import depth) |
| SAMLBearerAssertionFlowV9.tsx | ✅ Clean |
| TokenExchangeFlowV9.tsx | ✅ Clean |
| WorkerTokenFlowV9.tsx | ✅ Clean |

## Related: Import Path Fix Applied This Session

`ResourcesAPIFlowV9.tsx` had all 7 imports using `../../services/...` (2 levels up)
from a file located at `src/pages/flows/v9/`. The correct depth is `../../../` (3 levels up).

Fixed: all imports now resolve correctly. Build passes clean.
