# Unified MFA V8 Spec — Phase 2 Output

## 1) Route Map + Route-Lock Behavior

**Single Stable Route:** `/v8/mfa-hub`
- No sub-routes (no `/v8/mfa-hub/register`, `/v8/mfa-hub/auth`, etc.)
- Navigation handled via internal state machine (no `navigate()` calls for steps)
- Route-lock: Prevent back/forward browser navigation during active MFA flows
  - Use `beforeunload` handler + `popstate` interception
  - Warn user: "MFA operation in progress. Exit will lose state."
- Resume: On page reload, check IndexedDB for `{envId, userId, runId}` + restore state

**Redirect Rules:**
- `/v8/mfa` → 301 redirect to `/v8/mfa-hub` (already exists)
- `/unified-mfa` → 301 redirect to `/v8/mfa-hub` (add to App.tsx)

---

## 2) Canonical State Machine

**States:**
1. `INIT` — Load credentials, check worker token
2. `CONFIG` — User inputs environment ID / selects policy
3. `DEVICE_SELECT` — User chooses device type (SMS/Email/TOTP/FIDO2)
4. `REGISTER_START` — Initiate device registration API call
5. `REGISTER_WAIT` — Polling/waiting for user action (e.g., FIDO2 ceremony)
6. `REGISTER_COMPLETE` — Device registered successfully
7. `AUTH_START` — Begin authentication flow
8. `AUTH_CHALLENGE` — Wait for OTP/biometric
9. `AUTH_COMPLETE` — MFA authentication succeeded
10. `ERROR` — Recoverable error state
11. `TERMINAL_ERROR` — Unrecoverable failure (network/auth)

**Invariants:**
- `workerToken` must exist before entering `CONFIG`
- `environmentId + userId` must exist before entering `DEVICE_SELECT`
- `deviceId` must exist before entering `AUTH_START`
- All state transitions journaled to IndexedDB + shipped to backend

**Event Table:**

| From State | Event | To State | Side Effects |
|------------|-------|----------|-------------|
| INIT | WORKER_TOKEN_READY | CONFIG | Load policies |
| CONFIG | POLICY_SELECTED | DEVICE_SELECT | Persist selection |
| DEVICE_SELECT | DEVICE_TYPE_CHOSEN | REGISTER_START | Start registration API |
| REGISTER_START | API_SUCCESS | REGISTER_WAIT | Start polling |
| REGISTER_WAIT | USER_COMPLETED | REGISTER_COMPLETE | Store deviceId |
| REGISTER_COMPLETE | START_AUTH | AUTH_START | Begin auth flow |
| AUTH_START | CHALLENGE_SENT | AUTH_CHALLENGE | Display OTP input |
| AUTH_CHALLENGE | OTP_VERIFIED | AUTH_COMPLETE | Show success |
| * | API_ERROR | ERROR | Log + retry logic |
| * | FATAL_ERROR | TERMINAL_ERROR | Show recovery UI |

---

## 3) Persistence Model

**Primary:** IndexedDB `mfa-hub-journal`
**Backstop:** SQLite (via Tauri/WASM fallback)

**Composite Keys:**
```
{
  envId: string,         // Environment ID
  userId: string,        // PingOne user ID
  runId: string,         // UUID per session
  transactionId: string  // UUID per API call
}
```

**Retention:**
- Keep last 30 days or 1000 records per `{envId, userId}`, whichever is larger
- Auto-prune on app startup (lazy cleanup)

**Resume Rules:**
- On page load: Query IndexedDB for incomplete runs (`state !== AUTH_COMPLETE && state !== TERMINAL_ERROR`)
- If found: Prompt user "Resume MFA session from [timestamp]?"
- If yes: Restore state machine + credentials from journal
- If no: Mark run as abandoned, start fresh

---

## 4) Journaling Schema

**ApiCallRecord:**
```typescript
{
  transactionId: string,
  timestamp: ISO8601,
  source: 'Platform' | 'MFA' | 'OIDC' | 'TokenService' | 'Proxy',
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  requestHeaders: Record<string, string>,
  requestBody: string | null,
  responseStatus: number,
  responseHeaders: Record<string, string>,
  responseBody: string,
  durationMs: number,
  runId: string,
  envId: string,
  userId: string
}
```

**ClientEventRecord:**
```typescript
{
  eventId: string,
  timestamp: ISO8601,
  eventType: 'STATE_TRANSITION' | 'USER_ACTION' | 'ERROR' | 'RETRY',
  fromState: string,
  toState: string,
  payload: Record<string, any>,
  runId: string,
  envId: string,
  userId: string
}
```

**"Cannot Forget" Enforcement:**
- All HTTP interceptors MUST call `journal.recordApiCall()` before returning
- All state machine transitions MUST call `journal.recordEvent()` synchronously
- Batch writes to IndexedDB every 100ms (debounced)
- If IndexedDB write fails, fallback to SQLite, then localStorage, then console.error

---

## 5) server.log Shipping Semantics

**Batching:**
- Accumulate up to 50 records OR 5 seconds, whichever comes first
- Ship via `POST /api/logs/batch` with `Content-Type: application/json`

**Idempotency:**
- Each batch tagged with `batchId: UUID`
- Server responds 200 + `processedBatchIds: string[]`
- Client marks batches as shipped, retries unacknowledged batches

**Backpressure:**
- If server returns 429 or 503, exponential backoff (1s, 2s, 4s, 8s, 16s max)
- Queue max 1000 unsent records; if exceeded, drop oldest batches (log warning)

**Verification:**
- Backend writes to `server.log` with line format:
  ```
  [TIMESTAMP] MFA_JOURNAL runId=<UUID> transactionId=<UUID> source=<SOURCE> status=<STATUS>
  ```
- Verify with: `grep "runId=abc-123" server.log | wc -l` (should match client record count)

---

## 6) Screen Contracts

**Main/Config (State: INIT → CONFIG → DEVICE_SELECT):**
- Input: Environment ID, User ID (optional: auto-fill from worker token)
- Policy selector (dropdown or auto-detect)
- Next: Enable "Select Device" button only when valid
- Recovery: "Clear Credentials" button resets to INIT

**Registration Tabs (State: REGISTER_START → REGISTER_COMPLETE):**
- Tabs: SMS | Email | TOTP | FIDO2 | Mobile
- Each tab shows: 1) API call status, 2) User instructions, 3) Retry button
- Next: After success, auto-transition to "Start Authentication" button
- Recovery: "Cancel Registration" → back to DEVICE_SELECT

**Auth Steps (State: AUTH_START → AUTH_COMPLETE):**
- Display: OTP input OR "Tap your security key"
- API Docs: Collapsible panel showing request/response for each step
- Next: On success, show "View Token" + "Try Another Device"
- Recovery: "Resend Code" / "Use Different Device"

**Success Screen (State: AUTH_COMPLETE):**
- Display: Access token (truncated), expiry, device type
- Next Actions: "Authenticate Again" (same device), "Register New Device" (→ DEVICE_SELECT), "Export Postman Collection"
- Recovery: "Start Over" → INIT

---

## 7) Test Matrix + Definition of Done

**Test Matrix:**
| Flow | Happy Path | Error Case | Resume | Log Verification |
|------|------------|------------|--------|------------------|
| SMS Reg + Auth | ✓ | Network fail | ✓ | grep runId |
| Email Reg + Auth | ✓ | Invalid OTP | ✓ | grep runId |
| TOTP Reg + Auth | ✓ | Expired code | ✓ | grep runId |
| FIDO2 Reg + Auth | ✓ | User cancel | ✓ | grep runId |
| Mobile Reg + Auth | ✓ | Timeout | ✓ | grep runId |

**Definition of Done:**
- [ ] All 5 device types complete happy path without errors
- [ ] Error states (network fail, invalid input, timeout) recover gracefully
- [ ] Resume works: Close tab mid-flow → reopen → restore state
- [ ] IndexedDB stores all API calls + events
- [ ] Backend `server.log` contains all transactions (verified with `grep`)
- [ ] No `navigate()` calls for step changes (state machine only)
- [ ] Route-lock prevents back button during active flow

---

## 8) Top 5 Failure Modes + Mitigations

**1. Worker Token Expired Mid-Flow**
- Mitigation: Check token expiry before each API call; auto-refresh if <5min remaining; show modal if refresh fails

**2. User Reloads Page During FIDO2 Ceremony**
- Mitigation: Resume logic detects `REGISTER_WAIT` state; prompt "Continue FIDO2 registration?" with device hint

**3. IndexedDB Quota Exceeded**
- Mitigation: Lazy prune on startup (keep last 1000 records); if write fails, fallback to SQLite → localStorage

**4. Backend `/api/logs/batch` Returns 500**
- Mitigation: Exponential backoff + queue; after 5 failures, log to console + continue (don't block UX)

**5. State Machine Receives Unexpected Event**
- Mitigation: Log error to journal + backend; transition to ERROR state; show "Unexpected error. Retry or Start Over" UI

---

## 9) Next 5 Implementation Tasks

**Task 1: Add Route-Lock + Resume (1 file)**
- Edit: `src/locked/mfa-hub-v8/feature/MFAHubV8.tsx`
- Add: `useEffect` hooks for `beforeunload` + `popstate`; check IndexedDB on mount; prompt user to resume

**Task 2: Implement IndexedDB Journal Service (1 file)**
- Create: `src/locked/mfa-hub-v8/dependencies/services/journalServiceV8.ts`
- Methods: `recordApiCall()`, `recordEvent()`, `getIncompleteRuns()`, `prune()`

**Task 3: Wire HTTP Interceptor to Journal (2 files)**
- Edit: `dependencies/services/apiCallTrackerService.ts` (add journal calls)
- Edit: `dependencies/utils/oauth.ts` (wrap fetch with interceptor)

**Task 4: Build State Machine Wrapper (1 file)**
- Create: `src/locked/mfa-hub-v8/dependencies/services/stateMachineV8.ts`
- Exports: `dispatch(event)`, `getState()`, `subscribe(listener)`; auto-journals transitions

**Task 5: Backend Log Shipping Endpoint (3 files)**
- Create: `server/routes/logs.ts` (POST `/api/logs/batch`)
- Edit: `server.js` (mount route)
- Add: Write to `server.log` with structured format

---

**Total: 147 lines. Spec complete.**
