# Services and Contracts

**Service upgrade candidates, worker token consistency, and V7/V8/V9 contracts.**  
**Last updated:** February 2026

---

## 1. Service Upgrade Candidates

When adding **non-trivial logic** to a flow/page:

1. Search `src/services/` for an existing capability.
2. If there’s a gap, add an entry below (or in a team-maintained list).
3. Classify as **Must replace now** (blocking correctness / copy-paste / messaging) or **Upgrade later**.

**Must replace now:** Broken behavior, repeated copy-paste across flows, or blocks consistent Modern Messaging (errors, retries, timeouts).

**Upgrade later:** Refactors that improve reuse or clarity but aren’t blocking.

**Themes:** Error normalization (API errors → user guidance + retry), timeout/retry policies, polling with cancellation/backoff, request correlation (IDs, duration), shared validators (issuer URL, scopes, redirect URIs).

---

## 2. Worker Token Consistency

- **Single pattern:** Use the standard Worker Token UI (e.g. `WorkerTokenSectionV8` / modal) — no custom “Get Token” buttons or inline token state that duplicates it.
- **Storage:** Use `unifiedWorkerTokenService` and unified storage (IndexedDB/SQLite). No direct `localStorage.getItem('unified_worker_token')` or `worker_credentials` for primary load/save; see **docs/UPDATE_LOG_AND_REGRESSION_PLAN.md** (“Worker token credentials: load/save from IndexedDB/SQLite”).
- **Credentials:** Any app that reads or displays worker token credentials (environmentId, clientId, clientSecret, region) must load from `unifiedWorkerTokenService.loadCredentials()` (or `unifiedTokenStorage.getWorkerTokenCredentials()`) first, then fall back to localStorage. Saves must call `unifiedTokenStorage.storeWorkerTokenCredentials()` (or equivalent) so they persist.

---

## 3. Priority 1 V8 Services (status)

| Service | Target | Status | Notes |
|--------|--------|--------|--------|
| workerTokenStatusServiceV8 | V9WorkerTokenStatusService | Done | Adapter for backward compat |
| specVersionServiceV8 | V9SpecVersionService | Done | |
| unifiedFlowLoggerServiceV8 | V9LoggingService | Done | See docs/UPDATE_LOG |
| mfaServiceV8 | V9MFAService | Planning | High complexity |
| workerTokenServiceV8 | V9TokenService | Planning | Token lifecycle |
| credentialsServiceV8 | V9CredentialService | Planning | Unified storage |

**Strategy:** Foundation (logging) → Token (worker token status, token service) → MFA → Credentials. Prefer adapters so existing V8 callers keep working during rollout.

---

## 4. V7/V8/V9 Contracts (summary)

- **V9 services** live under `src/services/v9/` and expose typed, testable APIs; avoid V7/V8-specific types in public APIs where possible.
- **V8 services** remain in `src/v8/services/`; when migrating, either replace with V9 service + adapter or add a thin V9 wrapper that delegates to V8 until full migration.
- **Flows:** Use services for API calls, request/response shaping, retries, error normalization, and logging. UI owns state, rendering, and calling services.

For full contract details and comparison tables, see archived docs (e.g. `V7_V8_V9_SERVICES_CONTRACTS*.md` in archive) or the codebase.
