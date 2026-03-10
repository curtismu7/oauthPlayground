# src/flows Directory Audit Report

Date: March 10, 2026 (updated) | Originally: March 8, 2026

## Finding: Directory Does Not Exist

`src/flows` does not exist in this workspace.

Flow files are split across:

| Location              | Contents                                              |
| --------------------- | ----------------------------------------------------- |
| `src/pages/flows/v9/` | V9 OAuth flow pages (17 files) — all clean            |
| `src/v8/flows/`       | V8 MFA + misc flow pages (active subset kept)         |
| `src/pages/`          | Top-level page components including flow entry points |

> `src/v8m/pages/` deleted: `V8MTokenExchange.tsx` was the only file and was already archived per App.tsx comment.

---

## V9 Flows (`src/pages/flows/v9/`) — All Clean ✅

All 17 V9 flow files audited and clean:

| File                                       | Status                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| ClientCredentialsFlowV9.tsx                | ✅ Clean                                             |
| DPoPAuthorizationCodeFlowV9.tsx            | ✅ Clean                                             |
| DeviceAuthorizationFlowV9.tsx              | ✅ Clean                                             |
| ImplicitFlowV9.tsx                         | ✅ Clean                                             |
| JWTBearerTokenFlowV9.tsx                   | ✅ Clean                                             |
| MFALoginHintFlowV9.tsx                     | ✅ Clean                                             |
| MFAWorkflowLibraryFlowV9.tsx               | ✅ Clean                                             |
| OAuthAuthorizationCodeFlowV9.tsx           | ✅ Clean                                             |
| OAuthAuthorizationCodeFlowV9_Condensed.tsx | ✅ Clean                                             |
| OAuthROPCFlowV9.tsx                        | ✅ Clean                                             |
| OIDCHybridFlowV9.tsx                       | ✅ Clean (createModuleLogger import fixed)           |
| PingOnePARFlowV9.tsx                       | ✅ Clean                                             |
| RARFlowV9.tsx                              | ✅ Clean                                             |
| ResourcesAPIFlowV9.tsx                     | ✅ Fixed (wrong `../../` → `../../../` import depth) |
| SAMLBearerAssertionFlowV9.tsx              | ✅ Clean                                             |
| TokenExchangeFlowV9.tsx                    | ✅ Clean                                             |
| WorkerTokenFlowV9.tsx                      | ✅ Clean                                             |

---

## V8 Flows (`src/v8/flows/`) — March 10 Audit

### Active V8 Flows (kept — no V9 equivalent or MFA-specific)

| File                                     | Route                            | Notes                                  |
| ---------------------------------------- | -------------------------------- | -------------------------------------- |
| `MFAFlowV8.tsx`                          | `/flows/mfa-v8`                  | Active; uses MFAFlowComponentFactory   |
| `MFAConfigurationPageV8.tsx`             | `/v8/mfa-config`                 | Active                                 |
| `MFADeviceManagementFlowV8.tsx`          | `/v8/mfa-device-management`      | Active                                 |
| `MFADeviceOrderingFlowV8.tsx`            | `/v8/mfa-device-ordering`        | Active                                 |
| `MFAReportingFlowV8.tsx`                 | `/v8/mfa-reporting`              | Active                                 |
| `EmailMFASignOnFlowV8.tsx`               | `/v8/email-mfa-signon`           | Active                                 |
| `PingOneProtectFlowV8.tsx`               | `/v8/protect`                    | Active (bugs fixed Mar 8)              |
| `UnifiedMFARegistrationFlowV8.tsx`       | `/v8/unified-mfa`                | Active (renamed from `_Legacy` Mar 10) |
| `types/FIDO2FlowV8.tsx`                  | `/v8/mfa/register/fido2/device`  | Active (lazy)                          |
| `types/FIDO2ConfigurationPageV8.tsx`     | `/v8/mfa/register/fido2`         | Active                                 |
| `types/MobileFlowV8.tsx`                 | `/v8/mfa/register/mobile/device` | Active (lazy)                          |
| `types/MobileOTPConfigurationPageV8.tsx` | `/v8/mfa/register/mobile`        | Active                                 |
| `types/SMSFlowV8.tsx`                    | via MFAFlowComponentFactory      | Active (lazy)                          |
| `types/EmailFlowV8.tsx`                  | via MFAFlowComponentFactory      | Active (lazy)                          |
| `types/TOTPFlowV8.tsx`                   | via MFAFlowComponentFactory      | Active (lazy)                          |
| `types/WhatsAppFlowV8.tsx`               | via MFAFlowComponentFactory      | Active (lazy)                          |

### V8 Flows Migrated → Redirect to V9 ✅

| File                   | Old Route            | Now Redirects To        | Lines Deleted |
| ---------------------- | -------------------- | ----------------------- | ------------- |
| `CIBAFlowV8.tsx`       | `/flows/ciba-v8`     | `/flows/ciba-v9`        | 856           |
| `ImplicitFlowV8.tsx`   | `/flows/implicit-v8` | `/flows/implicit-v9`    | 1167          |
| `OIDCHybridFlowV8.tsx` | `/flows/hybrid-v8`   | `/flows/oidc-hybrid-v9` | 802           |

Pattern consistent with v6/v7 → v9 redirects already in place.

### V8 Flows Deleted (dead — no active route or import) ✅

| File(s)                                                                                  | Lines | Reason                                                          |
| ---------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------- |
| `MFAAuthenticationMainPageV8.tsx` + `MFAAuthenticationMainPageV8/hooks/` (5 files)       | 8,014 | Old monolith; superseded by extracted hooks in `src/v8/hooks/`  |
| `CompleteMFAFlowV8.tsx`                                                                  | 735   | No route, no imports                                            |
| `MFASettingsV8.tsx`                                                                      | 222   | No route, no imports                                            |
| `OAuthAuthorizationCodeFlowV8.tsx`                                                       | 1,192 | Superseded by V9                                                |
| `ResourcesAPIFlowV8.tsx`                                                                 | 2,052 | Superseded by V9                                                |
| `TokenExchangeFlowV8.tsx`                                                                | 808   | Superseded by V9                                                |
| `PingOnePARFlowV8/` (6 files: main + constants + hooks + index + types)                  | 1,411 | Superseded by V9                                                |
| `types/TOTPConfigurationPageV8.tsx`                                                      | 464   | TOTP uses UnifiedMFARegistrationFlowV8                          |
| `types/WhatsAppOTPConfigurationPageV8.tsx`                                               | 1,127 | No route, no imports                                            |
| `types/SMSOTPConfigurationPageV8.tsx`                                                    | 1,332 | No route (1 JSDoc comment ref only)                             |
| `types/EmailOTPConfigurationPageV8.tsx`                                                  | 1,107 | No active imports (2 refs in `src/locked/` only)                |
| `.txt` artifacts (`MFAFlowBaseV8.txt`, `SMSFlowV8.txt`, `SMSOTPConfigurationPageV8.txt`) | ~0    | Dead text files                                                 |
| `src/v8m/pages/V8MTokenExchange.tsx`                                                     | 3,517 | Archived per App.tsx comment; token-exchange-v7 redirects to V9 |

**Total deleted: ~22,991 lines across 27 files/folders**

---

## Session Summary (March 10, 2026)

- 3 V8 OAuth flows redirected to V9 equivalents (Implicit, OIDC Hybrid, CIBA)
- 24 files + folders deleted (~22,991 lines removed)
- `src/v8m/` directory fully removed (was single-file directory)
- No TypeScript errors after all changes
- Active V8 flow set: 16 files (all MFA-specific, no V9 equivalent exists)
