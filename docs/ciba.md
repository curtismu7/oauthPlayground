# CIBA — Client-Initiated Backchannel Authentication

**Standard:** OpenID Connect CIBA Core 1.0  
**Grant type:** `urn:openid:params:grant-type:ciba`  
**Route:** `/flows/ciba-v9`  
**Legacy redirects:** `/flows/ciba-v6`, `/flows/ciba-v7`, `/flows/ciba-v8`, `/v7/oidc/ciba` → all redirect to `/flows/ciba-v9`

---

## What is CIBA?

CIBA allows a **client application** (consumption device — kiosk, call-centre terminal, IoT device) to trigger an authentication that the **user completes on a separate trusted device** (authentication device — mobile phone, biometric reader). There is no browser redirect in the requesting application.

```
┌─────────────────────┐      BC-Authorize      ┌──────────────────┐
│  Client App         │ ──────────────────────► │  PingOne AS      │
│  (kiosk / terminal) │ ◄────────────────────── │  /as/bc-authorize│
└─────────────────────┘    auth_req_id           └──────────────────┘
         │                                               │
         │  poll/ping/push                        push notification
         │                                               │
         │                                               ▼
         │                                    ┌────────────────────┐
         │                                    │  Auth Device       │
         │                                    │  (user's phone)    │
         │                                    │  Approve / Deny    │
         │                                    └────────────────────┘
         │                                               │
         ▼              tokens                           │
┌─────────────────────┐ ◄──────────────────────────────────────────
│  /as/token          │
└─────────────────────┘
```

---

## Implementation Overview

### Two modes of operation

| Mode | Description | When to use |
|---|---|---|
| **Mock (educational)** | Fully in-browser simulation, no PingOne credentials needed | Learning the flow; demos |
| **Real (PingOne)** | Calls live PingOne `/as/bc-authorize` and `/as/token` via BFF | Integration testing |

---

## Mock Implementation (V7M)

### Files

| File | Purpose |
|---|---|
| [src/pages/flows/v9/V7MCIBAFlowV9.tsx](../src/pages/flows/v9/V7MCIBAFlowV9.tsx) | Main flow page component |
| [src/services/v9/mock/V9MockCIBAService.ts](../src/services/v9/mock/V9MockCIBAService.ts) | In-memory CIBA simulator |
| [src/components/CIBAUserApprovalModal.tsx](../src/components/CIBAUserApprovalModal.tsx) | Phone-mockup approval modal |

### V9MockCIBAService

The service implements the full CIBA state machine in-browser using an in-memory `Map<auth_req_id, CIBARecord>`. No external network calls are made.

#### Key types

```ts
type V9MockCIBADeliveryMode = 'poll' | 'ping' | 'push';

type V9MockCIBABackchannelRequest = {
  client_id: string;
  scope: string;
  login_hint?: string;
  id_token_hint?: string;
  user_email?: string;
  binding_message?: string;
  client_notification_token?: string; // required for ping/push modes
  delivery_mode?: V9MockCIBADeliveryMode;
};

// Success response from BC-Authorize:
type BackchannelResponse =
  | { auth_req_id: string; expires_in: number; interval: number }
  | { error: string; error_description?: string };

// Token poll result mirrors spec error codes exactly:
type CIBATokenResult =
  | { access_token; id_token; token_type: 'Bearer'; expires_in; scope? }
  | { error: 'authorization_pending'; ... }
  | { error: 'slow_down'; ... }
  | { error: 'access_denied'; ... }
  | { error: 'expired_token'; ... };
```

#### Methods

| Method | Description |
|---|---|
| `requestBackchannelAuth(req, expiresInSeconds?, intervalSeconds?)` | Issues `auth_req_id`; stores pending record |
| `approveRequest(auth_req_id)` | Simulates user approving on their device (sets `approved=true`) |
| `denyRequest(auth_req_id)` | Simulates user denying (sets `denied=true`) |
| `pollForToken(auth_req_id, ttls?)` | Returns tokens if approved; spec-compliant errors otherwise |

#### Spec-compliant behaviours implemented

- **`authorization_pending`** — user has not yet approved
- **`slow_down`** — client polls before `interval` seconds have elapsed (CIBA Core 1.0 §10.3.2)
- **`access_denied`** — user denied the request
- **`expired_token`** — `auth_req_id` TTL exceeded (default 120 s)
- **Single-use** — `auth_req_id` is deleted from store after tokens are issued
- **`binding_message`** — accepted and stored; displayed in the approval modal to mitigate MITM

### Delivery Modes Simulated

| Mode | Simulation behaviour |
|---|---|
| **Poll** | Auto-polling interval (5 s) starts immediately after BC-Authorize; each tick increments `pollCount` which triggers `pollForToken` |
| **Ping** | UI shows `client_notification_token` field; poll button remains manual (simulates server-initiated ping) |
| **Push** | Same as Ping in mock; in real implementations the AS would POST tokens to the client's registered endpoint |

### User Approval Modal (`CIBAUserApprovalModal`)

A phone-mockup modal that mimics the out-of-band device experience:

- Shows `binding_message` (the same message the user sees on their phone)
- Countdown timer matching `expires_in`
- **Approve** → calls `V9MockCIBAService.approveRequest()` → status transitions `pending → approved`
- **Deny** → calls `V9MockCIBAService.denyRequest()` → next poll returns `access_denied`

---

## Real PingOne Implementation

### Backend API routes (server.js)

#### `POST /api/ciba-backchannel`

Proxies to `https://auth.pingone.com/{environment_id}/as/bc-authorize`.

**Request body:**

| Field | Required | Description |
|---|---|---|
| `environment_id` | ✅ | PingOne environment UUID |
| `client_id` | ✅ | Application client ID |
| `client_secret` | ✅ | Required for client authentication |
| `scope` | ✅ | Must include `openid` |
| `login_hint` | ✅ | Identifies the user (email / username) |
| `binding_message` | — | Shown on both devices; prevents MITM |
| `requested_context` | — | JSON object for step-up context |
| `auth_method` | — | `client_secret_basic` or `client_secret_post` (default) |

**Response** (from PingOne):

```json
{
  "auth_req_id": "abc123...",
  "expires_in": 300,
  "interval": 5,
  "server_timestamp": "2026-03-22T00:00:00.000Z"
}
```

**Error handling:**
- Missing required params → `400 invalid_request`
- Missing `client_secret` → `400 invalid_request` with explicit message
- PingOne error → proxied status + body intact

#### `POST /api/ciba-token`

Proxies to `https://auth.pingone.com/{environment_id}/as/token` with:

```
grant_type = urn:openid:params:grant-type:ciba
auth_req_id = <the id from bc-authorize>
client_id / client_secret
```

**Polling error codes proxied transparently:**

| Code | Meaning |
|---|---|
| `authorization_pending` | User has not authenticated yet; keep polling |
| `slow_down` | Reduce polling frequency |
| `expired_token` | Request TTL exceeded; start over |
| `access_denied` | User denied |

---

## PingOne Application Requirements

To use the **real** CIBA flow with PingOne you need:

1. A PingOne application with grant type **CIBA** enabled.
2. The application must have an associated **authentication policy** that supports backchannel delivery (e.g. mobile push, email OTP).
3. `login_hint` must match a registered user's email or username in the environment.
4. A CIBA-capable authenticator registered for the target user.

---

## Flow Steps (Mock)

```
1.  Fill in: Client ID, Scope, Login Hint, Binding Message, Delivery Mode
2.  Click "Request Backchannel Auth"
    └─ POST /bc-authorize (mock) → auth_req_id returned; status = pending
3.  [Poll mode] Auto-poll every 5 s → authorization_pending until step 4
4.  Click "Simulate User Approval" → Phone modal appears
    ├─ Approve → status = approved; next poll returns tokens
    └─ Deny   → status = denied;   next poll returns access_denied
5.  [Manual] Click "Poll Token Endpoint" (or wait for auto-poll)
    └─ Returns: access_token, id_token
6.  Optionally click "Introspect" to validate the access token
```

---

## Spec References

| RFC / Spec | Section | Behaviour |
|---|---|---|
| OIDC CIBA Core 1.0 | §7 | `bc-authorize` request parameters |
| OIDC CIBA Core 1.0 | §10.1 | `client_notification_token` for ping/push |
| OIDC CIBA Core 1.0 | §10.3.2 | `slow_down`, `authorization_pending`, `access_denied`, `expired_token` |
| OIDC CIBA Core 1.0 | §10.3.2 | `auth_req_id` single-use after token issue |
| RFC 9436 | — | `urn:openid:params:grant-type:ciba` grant type |

---

## Comparison: CIBA vs Device Authorization

See the [CIBA vs Device Authorization](/ciba-vs-device-authz) comparison page in the app for a side-by-side breakdown.

Key difference: Device Authorization requires the user to navigate to a URL displayed on the consumption device; CIBA uses a pre-registered authentication device (phone) identified by `login_hint` — no URL transfer needed.

---

## Security Notes

- `client_secret` is accepted by the BFF and forwarded to PingOne; it is **never** returned to the browser or logged.
- `binding_message` should be short, unambiguous, and **not contain sensitive data** — it is displayed in clear text on the user's device.
- The mock's `auth_req_id` values are deterministic-looking but are single-use; they cannot be used to predict future IDs.
