# Services Contracts: Safety Gates + Recommended Updates (V7/V8/V9)

This note is intended to be used alongside `V7_V8_V9_SERVICES_CONTRACTS.md` to:
1) prevent breaking changes during V7/V8→V9 migration, and
2) capture contract-level improvements that benefit the app overall.

---

## Contract Safety Gates (MANDATORY)

### 1) “Do not break apps” gate (PR requirement)
For any change touching `src/services/**` or service-like components:
- **No signature breaking changes** to anything used by active flows (props/types/exports).
- **Only additive changes** are allowed by default (new optional fields, new methods, overloads).
- If a breaking change is unavoidable, use an **adapter** and a **deprecation path**:
  - keep old API working
  - route implementation to the new API
  - mark old API `@deprecated` with removal target

### 2) Contract-first development
Before implementing new logic in flows:
- confirm whether a contract already exists that covers the need
- if it doesn’t, update the **contract doc first** (or in the same PR) and implement in services (not in UI)

### 3) Enforceable checks
- Add a CI grep / lint gate to prevent introducing `console.error` / `console.warn` in services/flows.
- Use TypeScript strictness and avoid `any` in public service contracts.
- Consider a lightweight “API surface” test (e.g., `tsd`) to catch accidental signature breaks.

---

## Observations and Issues to Fix in the Contracts Doc (Recommended)

### A) “Service” vs “Component” classification drift
Several entries labeled as “services” are actually React components (e.g., `WorkerTokenModalV8`, `TokenDisplayV8`, `JWTConfigV8`, etc.).
**Fix:** split the doc into:
- **Services** (pure logic / endpoints / storage / validation)
- **UI Components** (React components with props)
- **Hooks**

This reduces confusion and helps enforce “business logic in services” policy.

### B) File naming / location consistency
There are multiple naming patterns in V9 (e.g., `V9TokenService.ts`, `V9AuthorizeService.ts`, but credentials lists `credentialsServiceV9.ts`).
**Fix:** pick one convention and apply it:
- either `V9CredentialService.ts` (PascalCase consistent with others)
- or `credentialsServiceV9.ts` (but then align all V9 services similarly)

Also consider aligning `*.tsx` usage: service contracts should generally be `*.ts` unless React is required.

### C) `v4ToastManager` is obsolete in V9 direction
The contract doc still treats `v4ToastManager` as a V7 critical service contract.
**Fix:** keep it documented for legacy compatibility, but mark it:
- **deprecated**
- “do not introduce new usages”
- “replace with Modern Messaging system”

### D) Missing explicit “error normalization” contract
Many V9 services imply endpoints + validation but don’t define a consistent error shape that flows can convert into user messaging.
**Add:** a shared, versioned error contract:
- `code`, `message`, `retryable`, `hint`, `details` (sanitized)
- and a helper that maps errors → user guidance

---

## Contract Updates That Would Benefit the Whole App (Upgrade Candidates)

These are backwards-compatible improvements that reduce duplication and enforce consistent UX.

### 1) Standardized error contract + mapping helpers (high ROI)
Add a V9 core contract:
- `V9ServiceError` (typed)
- `normalizeServiceError(err): V9ServiceError`
- `toUserGuidance(error): { title, message, nextSteps[], severity }`

Benefit: consistent Modern Messaging, fewer ad-hoc catch blocks, no console noise.

### 2) Shared timeout + retry policy utilities
Add reusable helpers:
- `withTimeout(promise, ms, { retryableHint })`
- `retry({ attempts, backoff, jitter, shouldRetry })`

Benefit: removes copy/pasted polling/retry logic from flows.

### 3) Polling primitive with cancellation (device code, approvals, MFA)
A single polling helper with:
- AbortController support
- max attempts
- interval control
- progress callbacks for footer messaging

Benefit: fewer bugs + consistent UX.

### 4) Credentials contract simplification and “flowKey” scoping
The V7 `ComprehensiveCredentialsService` has a very large surface area.
Add/standardize:
- `V9FlowCredentialStore` usage everywhere (flow-scoped creds)
- a minimal “credential view model” for UI components

Benefit: reduces prop explosion and improves maintainability.

### 5) Token display & copy behavior contracts (education friendly, safe defaults)
Define:
- default masking behavior (masked by default, reveal toggle)
- copy callbacks route through Modern Messaging (success in footer, errors as banner)

Benefit: consistent user experience and fewer accidental leaks.

---

## “Must replace now” guidance (what should block a migration)

Promote to **critical** only if:
- a contract mismatch breaks an active flow
- multiple flows are implementing the same service logic ad hoc
- missing contract prevents consistent Modern Messaging/error guidance

Everything else belongs in `SERVICE_UPGRADES_CANDIDATES.md`.

---

## Recommended Next Steps

1) Update `V7_V8_V9_SERVICES_CONTRACTS.md` structure (Services vs Components vs Hooks).
2) Add a V9 **Error contract** section and reference it from all V9 services.
3) Normalize V9 file naming conventions (pick one and apply).
4) Mark `v4ToastManager` explicitly deprecated + “no new usage”.
