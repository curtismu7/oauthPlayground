---
applyTo: "src/services/pingOne*,src/services/pingone*,src/services/environmentId*,server.js,api/**"
---

# PingOne Integration Patterns

## Endpoint Construction

Always build PingOne URLs through the existing region/environment helpers — never hardcode them:

```ts
// ✅ Use regionService + environment ID
import { getRegionBaseUrl } from '../services/regionService';
const tokenUrl = `${getRegionBaseUrl(region)}/${environmentId}/as/token`;

// ❌ Never hardcode
const tokenUrl = `https://auth.pingone.com/${environmentId}/as/token`;
```

Supported region helpers: `NA`, `EU`, `AP`, `CA` — plus custom domains via `customDomainService`.

## Token Exchange on the Backend (`server.js`)

- `POST /api/token-exchange` and `POST /api/pingone/token` are the canonical proxy endpoints.
- **Playground mode** (default): returns full PingOne token response to SPA.
- **BFF Session mode** (feature-flagged): stores token server-side; returns only `{ authenticated, userSummary }`.
- Never return `access_token`, `refresh_token`, or `id_token` from BFF session endpoints.

## Session Management (BFF Mode)

```js
// Session cookie settings (server.js)
res.cookie('mf_session', sessionId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_TTL_MS,
});
```

- Session IDs **must be generated server-side** (UUID v4) — never accept client-supplied session IDs.
- State parameter for PKCE flows: generate server-side, store with TTL, validate on callback.

## PingOne Cookie Jar (pi.flow Redirectless)

The in-memory `cookieJar = new Map<sessionId, string>()` in `server.js` is used **only** for forwarding PingOne Set-Cookie values during redirectless `pi.flow` resume/poll/check-username-password. This is separate from the application session store.

- Do not add non-PingOne data to `cookieJar`.
- Do not use `cookieJar` as an application security mechanism.

## Credentials Storage

- Worker tokens and client credentials: use `WorkerTokenManager` / `CredentialStorageManager` — not raw `localStorage`.
- Environment IDs: always persist via `EnvironmentIdPersistenceService`.
- API keys (Groq, GitHub, Brave): use `ApiKeyService`.

## MFA Flows

- MFA service: `src/services/pingOneMfaService.ts` (v9 canonical); `src/services/enhancedPingOneMfaService.ts` (enhanced).
- Do not modify `v8/services/mfaFeatureFlags*` without updating the Admin MFA feature flags page.
- OTP delivery tracking: `otpDeliveryTrackingService.ts` — do not inline OTP state in components.

## Security Constraints

| What | Rule |
|------|------|
| `client_secret` | Server-side only; never sent to or logged from the browser |
| `code_verifier` | Generated client-side for PKCE; cleared after exchange; never logged |
| Token response | Mask in UI by default; unmask only on explicit user action |
| User input (`environment_id`, `region`, redirect URIs) | Validate on the server before using in URL construction |
| Discovery endpoints | Cache via `discoveryPersistenceService`; do not re-fetch on every render |
