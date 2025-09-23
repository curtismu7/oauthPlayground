# 🧠 AI Prompt — Implement **OIDC Device Code** using existing V3 patterns (code-aware)

**Goal:** Implement (or finish hardening) the **OIDC Device Code** flow so it is visually and behaviorally identical to our V3 flows—**without duplicating logic**. Reuse existing components, hooks, and utils from this repo (see file paths below). Ship with full logging, validation, and tests.

> Note: Device Code flow is designed for input-constrained devices (smart TVs, IoT, CLI tools). It requires polling the token endpoint and provides a user-friendly verification flow with QR codes and short user codes.

---

## 0) Guardrails & Parity

- **Visual/UX parity** with V3 flows:
  - Reuse `styled-components` theme + shared components (stepper, buttons, toasts, status bar).
  - Match copy tone, tooltips, and step order.
  - Add QR code display and user-friendly verification UI.
- **Reuse > duplicate**:
  - Prefer extracting shared bits into `src/utils/*` over cloning.
- **Unified logging**:
  - Use `src/utils/logger.ts` with module tags + emojis.
- **Config resolution order**:
  - `.env` → `settings.json` → `localStorage` via `src/services/config` + `src/utils/credentialManager`.
- **Hardening**: strict validation, graceful errors, polling timeout handling, user code expiry.

---

## 1) Files to (Re)use & Where to Plug In

- **Context / Session**
  - `src/contexts/NewAuthContext.tsx` (token presence, session, helpers)
- **Flow Pages & Components**
  - Start/Flow page: `src/pages/flows/DeviceCodeFlowOIDC.tsx` (create new)
  - Verification page: `src/components/device/DeviceVerification.tsx` (create new)
  - Polling component: `src/components/device/DevicePolling.tsx` (create new)
- **UI Kit**
  - `src/components/StepByStepFlow.tsx` (stepper)
  - `src/components/TokenDisplay.tsx`, `src/components/ColorCodedURL.tsx`, `src/components/ConfigurationButton.tsx`, `src/components/PageTitle.tsx`
  - `src/components/QRCodeDisplay.tsx` (create new for verification URL)
- **Config & Discovery**
  - `src/services/config` (central config)
  - `src/services/discoveryService.ts` (OIDC metadata, device_authorization_endpoint)
  - `src/config/pingone.ts` (PingOne env helpers)
- **Flow Utilities (reusable)**
  - `src/utils/oauth.ts` (`jose` helpers, randoms, PKCE, etc.)
  - `src/utils/deviceCode.ts` (create new for device flow specific logic)
  - `src/utils/tokenStorage.ts` + `src/utils/storage.ts` (consistent token storage)
  - `src/utils/tokenHistory.ts`, `src/utils/tokenLifecycle.ts` (status/expiry)
  - `src/utils/flowConfiguration.ts`, `src/utils/flowConfigDefaults.ts` (step metadata)
  - `src/utils/secureJson.ts`, `src/utils/urlValidation.ts`
  - `src/utils/logger.ts` (🔍 required)
  - `src/utils/polling.ts` (create new for smart polling logic)
- **Types**
  - `src/types/*` (oauth/auth/storage/errors)
  - `src/types/deviceCode.ts` (create new for device flow types)

---

## 2) Routes & Navigation

- Ensure routes exist and are registered:
  - **Start**: `/flows/device-code` → `DeviceCodeFlowOIDC.tsx`
  - **Verification**: `/device/verify` → device verification component (can be embedded in main flow)
- No callback URL needed (polling-based flow)

---

## 3) Functional Spec

### 3.1 Device Authorization Request (`DeviceCodeFlowOIDC.tsx`)
- Required inputs (validate like V3):
  - `device_authorization_endpoint`, `client_id`, `scope`
- Defaults:
  - Scopes: from `flowConfigDefaults` or `config` (e.g., `openid profile email`)
- Build device authorization request:
  - POST to `device_authorization_endpoint`
  - Body: `client_id`, `scope` (URL-encoded)
  - Headers: `Content-Type: application/x-www-form-urlencoded`
- Handle response:
  - Extract: `device_code`, `user_code`, `verification_uri`, `verification_uri_complete?`, `expires_in`, `interval`
- Use `StepByStepFlow` with identical CTA/buttons/spinner behavior as V3 pages.
- **Log examples** (use logger):
  - `[🎯 DEVICE-CODE] Requesting device authorizationâ€¦`
  - `[📱 DEVICE-CODE] Got user_code=${userCode} expires=${expiresIn}s`

### 3.2 User Verification Display (`DeviceVerification.tsx`)
- Display user-friendly verification instructions:
  - **Large, clear user code** (formatted for easy reading, e.g., "ABCD-EFGH")
  - **QR code** for `verification_uri_complete` or `verification_uri` 
  - **Manual instructions**: "Go to [verification_uri] and enter code [user_code]"
  - **Copy buttons** for user code and verification URL
- Visual hierarchy:
  - Primary: QR code for mobile users
  - Secondary: Manual entry instructions
  - Tertiary: Raw URLs for debugging
- Countdown timer showing code expiry
- **Accessibility**: Screen reader support, high contrast mode, keyboard navigation

### 3.3 Token Polling (`DevicePolling.tsx`)
- Start polling immediately after displaying verification info
- Poll `token_endpoint` with:
  - `grant_type=urn:ietf:params:oauth:grant-type:device_code`
  - `device_code=${deviceCode}`
  - `client_id=${clientId}`
- Handle polling responses:
  - **Success**: `access_token`, `id_token?`, `refresh_token?`, `token_type`, `expires_in`, `scope`
  - **Pending**: `authorization_pending` → continue polling
  - **Slow down**: `slow_down` → increase interval by 5s
  - **Expired**: `expired_token` → restart flow
  - **Denied**: `access_denied` → show user-friendly error
- Smart polling logic:
  - Respect `interval` from device auth response (default 5s)
  - Implement exponential backoff on errors
  - Stop on success, denial, or expiry
  - Visual feedback: spinner, progress, "waiting for authorization"
- Store tokens via `src/utils/tokenStorage.ts`:
  - Keep absolute expiry
  - Support refresh tokens (unlike Implicit)

### 3.4 Token Validation & Storage
- Validate tokens (same as other flows):
  - **id_token**: verify signature with `jose` + JWKS
  - **aud/iss/exp/iat**: verify against discovered metadata and config
- Store tokens via `src/utils/tokenStorage.ts`:
  - Keep absolute expiry
  - Store refresh token if present
- Surface result with same success/error cards as other flows.

### 3.5 Post-Auth UX
- Token status panel (same as V3):
  - Use `TokenDisplay` + decode modal, expiry countdown
  - If `access_token` is present, allow sample API call using existing API client patterns
  - If `refresh_token` is present, show refresh capability
- Status bar: show env ID, region, version (keep parity with V3).

---

## 4) Security & Hardening

- **Device code protection**: 
  - Store device code securely during polling
  - Clear device code after use/expiry
  - Validate device code format and expiry
- **Polling limits**:
  - Respect rate limiting (`slow_down` response)
  - Maximum polling duration (e.g., 10 minutes)
  - Circuit breaker on repeated failures
- **Token validation**: Full JWT verification via `jose` + JWKS
- **HTTPS enforcement**: All endpoints must use HTTPS in production
- **Clock skew tolerance**: consistent with V3 (2–5 min)
- **User code security**: 
  - Generate strong, user-friendly codes
  - Short expiry (typically 10-15 minutes)

---

## 5) Code Reuse (concrete refactors)

Create or extend small, shared helpers (in `src/utils/`):

- `deviceCode.ts`:
  - `requestDeviceAuthorization(endpoint: string, clientId: string, scope: string[])`
  - `pollTokenEndpoint(tokenEndpoint: string, deviceCode: string, clientId: string, interval: number)`
  - `formatUserCode(code: string)` (add hyphens, uppercase, etc.)
- `polling.ts`:
  - `createSmartPoller(pollFn: Function, options: { interval: number, maxAttempts: number })`
  - `handlePollingResponse(response: any)` (parse standard device flow responses)
- `qrCode.ts`:
  - `generateQRCode(url: string, size?: number)` (wrapper around QR library)
- Extend `tokenStorage.put/get/clear(flowKey='device-code')`
- Reuse `verifyIdToken` from `src/utils/oauth.ts`

> Rule of thumb: If any new code would be ≥70% identical to an existing V3 utility, **extract** and inject differences via params.

---

## 6) Telemetry & Logging

All major stages emit logs via `logger`:

- Device auth request: `[🎯 DEVICE-CODE] requesting authorization scopes=${scopes}`
- Device auth response: `[📱 DEVICE-CODE] user_code=${code} expires=${exp}s interval=${int}s`
- Polling start: `[🔄 POLLING] started interval=${interval}ms device=${deviceCode.slice(0,8)}...`
- Polling response: `[⏳ POLLING] status=${status} attempt=${n}`
- Token success: `[✅ TOKEN] received flow=device-code hasRefresh=${!!refresh_token}`
- Polling stop: `[🛑 POLLING] stopped reason=${reason}`
- Errors: `[⛔ DEVICE-ERROR] type=${errorType} msg=${err.message}`

Keep entries emoji'd, timestamped, module-tagged, non-blocking.

---

## 7) Config Additions

Add configuration block (respect `.env` → `settings.json` → `localStorage`) via `services/config`:

```json
{
  "oidc": {
    "deviceCode": {
      "scopes": ["openid", "profile", "email"],
      "defaultInterval": 5000,
      "maxPollingDuration": 600000,
      "qrCodeSize": 200,
      "userCodeFormat": "XXXX-XXXX"
    }
  }
}
```

---

## 8) Dependencies

May need to add:
- QR code generation library (e.g., `qrcode` or `react-qr-code`)
- Ensure `jose` is available for JWT verification

---

## 9) Test Plan

- **Unit**
  - `requestDeviceAuthorization` builds correct POST request
  - `pollTokenEndpoint` handles all response types (`authorization_pending`, `slow_down`, success, errors)
  - `formatUserCode` produces readable codes
  - `createSmartPoller` respects intervals and backoff
- **Integration**
  - Mock device auth endpoint: verify user code display and QR generation
  - Mock token endpoint: simulate polling states and token receipt
  - Negatives: expired codes, denied access, network errors, malformed responses
- **E2E**
  - `/flows/device-code → verification display → (manual auth) → token receipt → dashboard` happy path
  - Timeout scenarios, user denial, code expiry
  - Refresh/idempotency during polling
- **Accessibility**
  - QR code alt text, user code screen reader support
  - Focus order, aria labels, keyboard nav consistent with V3
  - High contrast mode for user codes

---

## 10) UX Considerations

- **Mobile-first**: QR codes should be primary interaction method
- **Copy-friendly**: All codes and URLs easily copyable
- **Progress indication**: Clear feedback during polling ("Waiting for you to authorize...")
- **Error recovery**: Clear instructions when codes expire or are denied
- **Multi-device UX**: Optimize for auth happening on different device than initiating device
- **Timeout handling**: Graceful degradation when polling times out

---

## 11) Acceptance Criteria

- [ ] **Exact** styling/copy parity with V3 step pages/components
- [ ] No duplicated business logic; shared utils added to `src/utils/*`
- [ ] QR codes generated and displayed for verification URLs
- [ ] Smart polling with proper interval respect and backoff
- [ ] User codes formatted for readability (e.g., "ABCD-EFGH")
- [ ] Tokens stored via `tokenStorage` with visible Status Bar + decode modal
- [ ] Refresh token support (unlike Implicit flow)
- [ ] Proper error handling for all polling states
- [ ] Polling stops on success/failure/timeout
- [ ] Unit + integration + E2E green; coverage ≥ V3 baseline
- [ ] Accessibility compliance for vision-impaired users
- [ ] Mobile-responsive QR code and verification UI

---

**Do all of the above using only the existing patterns in this repo—`NewAuthContext`, `StepByStepFlow`, `tokenStorage`, `discoveryService`, and `logger`—so the Device Code flow "feels" like Auth v3 and stays maintainable. The flow should excel at cross-device authentication scenarios while maintaining the same high security and UX standards as existing flows.**