# Side Menu Index — AI-Queryable

## Purpose
Enables AIAssistant to answer questions like "show me mock flows", "what CIBA flows exist", "where is device code flow".

## Mock Flows
| Menu Label | Route | Component | File |
|---|---|---|---|
| Mock Authorize | `/mock/authorize` | MockAuthorize | `src/pages/mock/` |
| Redirectless Mock | `/api/pingone/redirectless/authorize-mock` | server endpoint | `server.js` |
| Mock User Profile | `/api/pingone/user-mock/:userId` | server endpoint | `server.js` |
| Mock User Devices | `/api/pingone/user/:userId/devices-mock` | server endpoint | `server.js` |

## OAuth Flows (V8U — Locked)
| Menu Label | Route | Status |
|---|---|---|
| Authorization Code + PKCE | `/v8u/unified/oauth-authz` | ✅ LOCKED |
| Implicit | `/v8u/unified/implicit` | ✅ LOCKED |
| Client Credentials | `/v8u/unified/client-credentials` | ✅ LOCKED |
| Device Code | `/v8u/unified/device-code` | ✅ LOCKED |
| Hybrid | `/v8u/unified/hybrid` | ✅ LOCKED |
| CIBA | `/ciba` | V8+ |

## AI Query Keywords
- `mock` → Mock Flows section above
- `ciba` → CIBA Backchannel, `server.js:/api/ciba-*`
- `device` → Device Code Flow, Device Authorization `/api/device-authorization`
- `mfa` → MFA flows, `src/v8/lockdown/`
- `protect` → Protect Portal, risk evaluations `/api/pingone/risk-evaluations`
- `worker token` → `/api/pingone/worker-token`, `/api/pingone/token`
