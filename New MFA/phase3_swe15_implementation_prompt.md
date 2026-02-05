# phase3_swe15_implementation_prompt.md
## Phase 3 Prompt — SWE‑1.5 (FREE) (Implementation Iterations)

You are SWE‑1.5. Follow the Operating Rules in **swe_phase3_implementation.md**.

INPUT — Claude spec (paste here):
```
# Unified MFA Specification

## 1) Route Map (Single Route) + Route-Lock Behavior

**Primary Route:** `/v8/unified-mfa`

**Route-Lock Rules:**
- Entry: Generate `runId` → lock route → prevent navigation
- No `navigate/push/replace` for step transitions
- Tab-based UI within single route (config | register | auth | docs | success)
- URL query param `?tab=X` for deep linking only
- Unlock: explicit cancel, flow completion, or browser refresh

## 2) Canonical State Machine

**States:**
```
INIT → CONFIG → DEVICE_DISCOVERY → AUTH_INIT → AUTH_VERIFY → SUCCESS
                     ↓                                ↓
                   ERROR ←─────────────────────────────┘
```

**Invariants:**
- `runId` immutable after generation
- `workerToken` required for all API calls
- `transactionId` unique per auth attempt
- State transitions only via explicit events

**Events & Transitions:**
| From | Event | To | Side Effects |
|------|-------|-----|--------------|
| INIT | WORKER_TOKEN_LOADED | CONFIG | Store runId in IndexedDB |
| CONFIG | CONFIG_COMPLETE | DEVICE_DISCOVERY | Fetch MFA factors |
| DEVICE_DISCOVERY | FACTOR_SELECTED | AUTH_INIT | Send challenge |
| AUTH_INIT | CHALLENGE_SENT | AUTH_VERIFY | Poll/wait for response |
| AUTH_VERIFY | VERIFICATION_SUCCESS | SUCCESS | Journal completion |
| * | ERROR | ERROR | Log error, allow retry |

## 3) Persistence Model

**Primary Keys:** `{envId, userId, runId}`

**IndexedDB Schema (oauth_playground_v8):**
- Store: `unified_mfa_sessions`
- Keys: `runId` (primary), `envId`, `userId` (indexed)
- Data: `{runId, envId, userId, transactionId, state, workerToken, selectedFactor, challengeData, createdAt, updatedAt}`

**SQLite Backstop:**
- Mirror IndexedDB every 30s via batch sync
- Fallback on IndexedDB quota/corruption
- Same schema as IndexedDB

**Retention:**
- Active (state < SUCCESS): 7 days
- Completed: 30 days read-only
- Failed: 3 days

**Resume Rules:**
- Resume if `runId` exists AND state < SUCCESS AND workerToken valid
- Reset to CONFIG if workerToken expired
- Clear on explicit cancel or browser refresh

## 4) Journaling Schema

**ApiCallRecord:**
```typescript
{
  runId: string,
  transactionId: string,
  timestamp: number,
  method: string,
  url: string,
  headers: Record<string, string>, // Authorization redacted
  body?: any, // client_secret redacted
  response: { status, headers?, data? },
  duration: number,
  error?: string
}
```

**ClientEventRecord:**
```typescript
{
  runId: string,
  transactionId: string,
  timestamp: number,
  type: 'state_change' | 'user_action' | 'ui_event' | 'error',
  data: any
}
```

**"Cannot Forget" Enforcement:**
- Write-ahead log before state transitions
- Buffered writes with immediate flush on critical events (API calls, state changes)
- Retry failed writes with exponential backoff (1s, 2s, 4s, 8s)
- Block state transition until write confirmed

## 5) Server.log Shipping Semantics

**Batching:**
- 100 records OR 5 seconds (whichever first)
- Compress with gzip
- Batch ID: `${runId}-${batchIndex}`
- Include checksum: `sha256(records.join(''))`

**Idempotency:**
- Server deduplicates on batch ID
- Client retries on failure without creating duplicates

**Backpressure:**
- Local queue max 1000 records
- Drop oldest if full (log drop event)
- Exponential backoff: 1s, 2s, 4s, 8s, 16s max
- Circuit breaker: stop shipping after 5 consecutive failures

**Verification:**
```bash
# Verify runId completeness
grep "runId-xyz" server.log | jq '.runId' | sort | uniq -c

# Check batch integrity
grep "batchId" server.log | jq '{batchId, checksum, recordCount}'
```

## 6) Screen Contracts

**Main/Config Tab:**
- Worker token gauge + modal trigger
- Environment selector (envId, region)
- "Clear All Data" button
- API documentation toggle

**Registration Tab:**
- Device discovery list (SMS, Email, Push, WebAuthn)
- Factor selection cards with icons
- Progress indicator (step X of Y)
- "Back to Config" button

**Auth Steps (per factor):**
- **SMS/Email:** Input → Send OTP → Code entry → Verify
- **Push:** Device select → Push sent → Poll status
- **WebAuthn:** Device select → Credential create → Assertion

**API Docs Tab:**
- Real-time API call display (from journal)
- Request/response viewer with syntax highlighting
- Export to Postman button
- Filter by runId/transactionId

**Success Tab:**
- Completion summary (factor, timestamp)
- "Manage Devices" link
- "Start New Flow" button
- "Export Logs" button

**Next Rules:**
- Auto-advance after success (2s delay)
- Error: show retry button + "Back to Config"
- Network timeout: retry with backoff
- Invalid token: force return to CONFIG

**Recovery:**
- All errors show: error message + retry button + cancel button
- Cancel returns to CONFIG and clears state
- Retry preserves runId and transactionId

## 7) Test Matrix + Definition of Done

**Test Matrix:**
| Dimension | Values |
|-----------|--------|
| Worker Token | valid, expired, invalid |
| Network | online, offline, slow (3G) |
| Factors | SMS, Email, Push, WebAuthn |
| Browser | Chrome, Firefox, Safari, Edge |
| Storage | IndexedDB on/off, SQLite on/off |

**Definition of Done:**
- ✅ Single route invariant: no navigate() for steps
- ✅ All API calls logged with runId
- ✅ IndexedDB + SQLite persistence verified
- ✅ Server.log shipping with grep verification
- ✅ Smoke-test passes (all factors)
- ✅ Error recovery tested (network, token, API)
- ✅ Performance < 2s per step
- ✅ No breaking changes to existing mfa-hub

## 8) Top 5 Failure Modes + Mitigations

**1. IndexedDB Quota Exceeded**
- Detect: QuotaExceededError on write
- Mitigate: Purge old sessions, fallback to SQLite

**2. Worker Token Expiry Mid-Flow**
- Detect: 401 from Platform API
- Mitigate: Auto-refresh token, retry request

**3. Network Disconnection**
- Detect: Failed fetch + navigator.onLine
- Mitigate: Queue locally, retry on reconnect, show offline banner

**4. Browser Tab Closure**
- Detect: beforeunload event
- Mitigate: Force flush journal to IndexedDB

**5. Server Log Endpoint Unavailable**
- Detect: Failed POST to /api/logs
- Mitigate: Local queue + exponential backoff + circuit breaker

## 9) Next 5 Implementation Tasks

**Task 1: Enhanced Logger (1 file)**
- File: `dependencies/v8/services/unifiedLoggerV8.ts`
- Add runId threading, batch shipping, SQLite fallback

**Task 2: State Machine Service (1 file)**
- File: `dependencies/v8/services/unifiedStateServiceV8.ts`
- Implement canonical states, transitions, persistence

**Task 3: Single-Route Component (2 files)**
- Files: `src/locked/mfa-hub-v8/feature/UnifiedMFAV8.tsx`, `dependencies/v8/components/UnifiedMFATabsV8.tsx`
- Tab-based UI, route lock, state machine integration

**Task 4: HTTP Interception Enhancement (1 file)**
- File: `dependencies/utils/workerToken.ts`
- Enhance `requestClientCredentialsToken()` with comprehensive logging

**Task 5: Log Shipper Service (1 file)**
- File: `dependencies/v8/services/logShipperServiceV8.ts`
- Batching, idempotency, backpressure, verification

```

Goal:
Implement in small safe iterations:
- single stable route + route lock
- state machine drives steps
- full journaling + persistence (IndexedDB + SQLite backstop)
- full PingOne logging + client events + server.log shipping (grep runId verification)
- reuse mfa-hub/proxy wiring (no parallel clients)

Per iteration requirements:
- Touch 1–3 files (or ≤6 new files in standalone scaffold mode)
- Output unified diff + verification steps + how to confirm runId in server.log
- If a fix fails twice, STOP and report error + causes + smallest next experiment.

Start with the first task from Claude’s “Next 5 tasks” list and stop after one iteration.
