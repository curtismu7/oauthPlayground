# Enhanced Comprehensive Standardization Plan for MasterFlow API

This plan transforms the MasterFlow API application into a highly consistent, maintainable, and scalable system through an enforceable standardization program covering design tokens, services, components, APIs, configuration, state, error handling, testing, and documentation with clear contracts, ownership, and enforcement mechanisms.

> **Guiding mantra:** *Reduce variation, shrink blast radius, accelerate delivery.*

---

## Standards Charter

### Goals
- **Consistency:** predictable patterns across 20+ apps/services, including Unified OAuth and Unified MFA
- **Maintainability:** fewer bespoke implementations; easier refactors and upgrades  
- **Scalability:** new features follow a "golden path" without requiring architecture debates
- **Security & reliability:** consistent auth/session patterns, error handling, logging, and safe defaults

### Non-goals
- Rewriting every legacy module immediately
- Enforcing one framework "forever" regardless of future requirements
- Perfect uniformity at the cost of shipping—this plan uses a **ratchet model** (no new drift) plus staged migration

### Scope
- Front-end application code (UI, state, client services)
- API integration layer and error model
- Build/config pipelines and environment handling
- Shared libraries and reusable components

### Compatibility promise
- **Backward compatibility by default** during migration via adapters/wrappers
- Breaking changes require an ADR and a migration path

---

## Governance & Decision Process

### Ownership (DRIs)
Assign one accountable DRI per layer:
- **Service/API client patterns** - Lead API architect
- **UI component library & design tokens** - Lead UI/UX engineer
- **State management & persistence** - Lead frontend architect  
- **Testing & tooling/CI enforcement** - Lead DevOps engineer
- **Docs & developer experience** - Lead technical writer

> ⚠️ **Blocker:** DRIs must be named before any gate can open. Anonymous role labels create no accountability.

### Decision artifacts
- **ADRs (Architecture Decision Records)** for: new patterns, deprecations, breaking changes, and cross-layer contracts
- ADR template includes: context, decision, alternatives considered, rollout plan, and deprecation timeline

### Exception policy ("waivers")
- Waivers must be **time-boxed** (e.g., 30/60/90 days) with an owner and a tracking issue
- Waivers expire automatically unless renewed with justification
- **Maximum 5 open waivers at a time**; a new waiver requires closing an existing one or a DRI escalation
- Goal: **zero waivers** for new code after Phase 1

---

## Current State Analysis

Based on analysis of 20+ apps and services, including complex Unified OAuth and Unified MFA flows:

### ✅ Already Standardized
- **CSS Colors**: V9 components fully migrated to CSS variables (76 hardcoded styles eliminated)
- **CSS Variables**: Ping UI design token system implemented
- **Typography**: Font sizes and weights standardized
- **Spacing**: Consistent spacing variables applied

### 🔄 Partially Standardized  
- **Services**: Mixed patterns (some unified, many legacy)
- **Components**: Inconsistent styling approaches
- **APIs**: Different error handling and response patterns
- **State Management**: Multiple contexts and storage systems

---

## Golden Path (Reference Implementation)

To accelerate adoption, we will build a **small reference feature** that demonstrates the standards end-to-end:

**Golden Path slice includes**
- BaseService + BaseApiClient usage
- Standard request/response and error envelope
- Unified storage via a single abstraction
- Base UI components + accessibility baseline
- One state approach for new work
- Tests (unit + integration) + Storybook docs (if applicable)
- Observability: correlation IDs + safe logging defaults

**Done when:** a new engineer can ship a feature end-to-end using only golden path docs, without asking how to do anything.

---

## Enforcement & Tooling (CI as the Referee)

### Ratchet model
- Phase 1 introduces **lint/type/CI gates** so "new drift" stops immediately
- Legacy violations can remain temporarily, but **must trend down**

### Enforcement mechanisms
- **ESLint rules** (including custom rules) to prevent:
  - Direct `fetch` usage (must use BaseApiClient) — **done when:** zero direct `fetch()` calls in new code pass CI
  - Ad-hoc `localStorage`/IndexedDB usage (must use unified storage) — **done when:** ESLint `no-raw-localstorage` rule blocks PRs
  - New hardcoded colors (must use tokens)
- **Codemods** for mechanical migrations at scale
- **PR checks**: "no new violations" + "standard contracts used"

---

## Cross-layer Canonical Contracts

### Standard Error Envelope (single source of truth)
All service/API errors must map to:

```ts
// src/standards/types.ts — already exists
type StandardError = {
  code: string;          // stable enum-like string
  message: string;       // safe for UI
  httpStatus?: number;
  correlationId?: string;
  retryable?: boolean;
  details?: unknown;     // structured payload for debugging
};
```

Rules:
- UI renders `message` and may surface `correlationId`
- Logging includes `code`, `httpStatus`, and `correlationId` with redaction rules
- BaseApiClient/BaseService are responsible for normalization

### Service Method Conventions — ERROR HANDLING DECISION ✅

**Decision (March 5, 2026): All service methods return `ServiceResult<T>`. `throw` is reserved for programming errors only.**

```ts
// src/standards/types.ts — already exists
type ServiceResult<T = unknown> = {
  data?: T;
  error?: StandardError;
  success: boolean;
};
```

> All service methods return `ServiceResult<T>` from `@/standards/types`. `throw` is reserved for programming errors — invalid arguments, impossible states, misconfigured invariants. Runtime failures (network errors, validation, not-found) are `{ success: false, error: StandardError }`. Callers check `result.success` before accessing `result.data`.

**Why:** `exactOptionalPropertyTypes: true` in tsconfig enforces that callers check `success` before accessing `data` at the type level. The current mix of throw + result + null-return causes double-wrapping bugs (e.g. `try { if (result.success && result.data && ...) }` in V9 flow pages).

- Naming: `getX`, `listX`, `createX`, `updateX`, `deleteX`
- Idempotent calls may retry (with backoff/jitter) when `retryable=true`

### UI Component Interface Conventions
- Every shared component supports `className`
- Loading/disabled patterns: `isLoading`, `isDisabled`
- Accessibility: `aria-*` required where relevant; keyboard interactions consistent

---

## Standardization Areas

> **Standards levels**
> - **MUST**: required for new code immediately (Phase 1 ratchet)
> - **SHOULD**: required for new code after migration helpers exist
> - **MAY**: recommended, situational

### 1. Service Layer Standardization

#### Current Issues
- Inconsistent error handling across 47+ services — three incompatible shapes in use simultaneously:
  1. `ServiceResult<T>` (standards layer — 2-3 services only)
  2. Ad-hoc `{ success, error?: string }` (majority of `src/services/`)
  3. `throw` on failure (e.g. `parService.ts`)
- Mixed storage patterns (localStorage, IndexedDB, SQLite)
- Duplicate logic for auth/session concerns
- Ad-hoc request wrappers and retry behavior

#### Target Standard (MUST)
- All network calls go through **BaseApiClient**
- All business services extend **BaseService**
- All errors normalized to **StandardError** via `ServiceResult<T>`
- All persistence goes through **UnifiedStorage**

#### Deliverables
- `BaseApiClient` — **done when:** zero direct `fetch()` calls in new code pass CI
  - Request/response normalization
  - Retry policy (idempotent only)
  - Correlation ID propagation
  - Consistent headers and auth injection
- `BaseService` — **done when:** all service test mocks return `ServiceResult` shape
  - Shared logging + metrics hooks
  - Normalized error mapping
  - Common utilities (pagination, caching policies, etc.)
- Migration adapters for legacy services

### 2. Component Standardization

#### Current Issues
- Inconsistent styling approaches (inline styles vs tokens)
- Mixed component patterns across V9 and legacy
- Inconsistent accessibility and interaction patterns

#### Target Standard
- **MUST:** all new UI uses design tokens (CSS variables)
- **SHOULD:** shared components come from the base component library
- **SHOULD:** Storybook (or equivalent) for shared components

#### Deliverables
- Base component library with consistent props, accessible defaults, documented usage patterns
- Deprecation plan for legacy components
- Migration codemods where feasible

### 3. API Standardization

#### Current Issues
- Different response shapes and error formats
- Inconsistent pagination and filtering conventions
- Scattered auth handling

#### Target Standard (MUST)
- Standardized request/response contracts and error envelope
- All API calls via BaseApiClient
- Consistent auth token acquisition/refresh patterns

#### Deliverables
- API contract conventions (naming, pagination, filter parameters)
- Response mappers for legacy endpoints
- Centralized auth/session handling

### 4. Configuration Standardization

#### Current Issues
- Configuration scattered across files
- Environment handling varies across apps
- Secrets and feature flags inconsistently managed

#### Target Standard
- **MUST:** single typed config module for runtime config
- **MUST:** consistent environment variable schema
- **MUST:** invalid config = **startup failure**, not a runtime warning
- **SHOULD:** feature flags standardized and documented

#### Deliverables
- `config.ts` with schema validation at startup — app refuses to start on invalid config
- Standard env var naming and mapping
- Feature flag registry + ownership

### 5. State Management Standardization

#### Current Issues
- Multiple context patterns and duplicated state logic
- Storage fragmentation and unclear ownership

#### Target Standard
- **MUST:** one approved state strategy for new code (document the choice)
- **SHOULD:** adapters for legacy contexts
- **MUST:** state persistence only through UnifiedStorage

#### Deliverables
- Standard state pattern guide (when to use local component state vs shared state)
- UnifiedStorage abstraction:
  - Consistent key strategy
  - Encryption/secure storage rules (if needed)
  - Migration/versioning support

### 6. Error Handling Standardization

#### Current Issues
- Different error messages and user experiences
- Errors not consistently actionable for users or support

#### Target Standard
- **MUST:** UI renders StandardError consistently
- **SHOULD:** user-safe messaging with support-friendly correlation IDs
- **MUST:** errors logged with redaction and consistent fields

#### Deliverables
- Error UX guidelines (inline vs toast vs modal) — **done when:** all service test mocks return `StandardError` shape
- Standard error boundary patterns
- Centralized error logger with redaction

### 7. Testing Standardization

#### Current Issues
- Inconsistent testing frameworks and coverage expectations
- Limited integration testing for critical flows

#### Target Standard
- **MUST:** unit tests for BaseApiClient/BaseService and shared components
- **SHOULD:** integration tests for Unified OAuth/MFA flows
- **SHOULD:** contract tests for API response mapping

#### Deliverables
- Test harness utilities
- Standard mocking strategy for network and storage
- CI test tiers: fast unit vs slower integration

### 8. Documentation Standardization

#### Current Issues
- Patterns undocumented or tribal knowledge
- Onboarding requires oral history

#### Target Standard
- **MUST:** "How to do X" docs for core patterns
- **SHOULD:** golden path walkthrough
- **SHOULD:** ADR index and deprecation registry

#### Deliverables
- `/docs/standards/` with:
  - Golden Path
  - Service/API patterns
  - UI component usage
  - State & storage rules
  - Error and observability conventions

---

## Observability & Security Baselines

> These are **MUST** items. Assign each to a phase gate — see Roadmap below.

### Observability (MUST — Phase 2)
- Correlation IDs on all requests and logged events
- Standard client telemetry fields (feature, screen, action, outcome, duration)
- Sampling rules for high-volume logs

### Security (MUST — Phase 1)
- Redaction rules for logs (no tokens/PII)
- Safe defaults for session handling and token storage
- Audit event schema for sensitive actions (auth, MFA changes, admin actions)

---

## Implementation Roadmap

> Weeks are directional; treat as a planning scaffold. Each phase ends with a **gate** (binary pass/fail) that unlocks the next.

### Phase 1: Foundation (Week 1–2) — **Stop new drift**
**Deliver**
- Standards Charter + ADR process + **DRIs named** (blocker — no gate opens without this)
- Base contracts: `StandardError` + `ServiceResult<T>` finalized (decision already made — document it)
- CI ratchet: ESLint `no-raw-fetch`, `no-raw-localstorage`, `no-hardcoded-colors` rules active
- Skeleton BaseApiClient/BaseService + UnifiedStorage interfaces
- Security baseline: redaction rules + audit event schema
- Golden Path scope selected
- WorkerTokenModal — **freeze new implementations** (no new duplicates allowed past this gate)

**Gate A — pass/fail**
- [ ] DRIs named and confirmed
- [ ] `StandardError` + `ServiceResult<T>` in `src/standards/types.ts` locked
- [ ] CI blocks any PR with a new direct `fetch()` call, raw `localStorage` usage, or hardcoded color
- [ ] Zero waivers open that predate this gate

### Phase 2: Service Layer (Week 3–4)
**Deliver**
- BaseApiClient and BaseService fully implemented
- Correlation IDs on all requests and logged events (observability baseline)
- Legacy adapters and first wave of migrations — **priority:** `parService`, `oidcDiscoveryService`, `workerTokenDiscoveryService`
- UnifiedStorage implementation + key schema + migration/versioning

**Gate B — pass/fail**
- [ ] 100% of services created after Gate A use BaseApiClient (no exceptions without waiver)
- [ ] `parService`, `oidcDiscoveryService`, `workerTokenDiscoveryService` migrated to `ServiceResult<T>`
- [ ] Correlation ID present in all new service calls

### Phase 3: Component Layer (Week 5–6)
**Deliver**
- Base component library with documented props + a11y baseline
- Deprecation list for legacy components
- Codemods for common UI migrations

**Gate C — pass/fail**
- [ ] All components created after Gate A use base components and design tokens
- [ ] Legacy component usage count trending down (measured, not just asserted)

### Phase 4: State Management (Week 7–8)
**Deliver**
- Approved state strategy for new work documented
- Adapters for legacy contexts
- Unified persistence via UnifiedStorage — **done when:** ESLint `no-raw-localstorage` blocks all new PRs

**Gate D — pass/fail**
- [ ] All features created after Gate A use the documented state pattern
- [ ] Zero new direct `localStorage` / `IndexedDB` calls pass CI

### Phase 5: Component Consolidation (Week 9–10)
**Deliver**
- Eliminate WorkerTokenModal duplication — 8 implementations → 1 `WorkerTokenModalServiceV9`
- Consolidate stepper components — 3 implementations → 1 `StepperServiceV9`
- Unify header services — multiple → 1 `HeaderServiceV9`
- Migrate all V9 flows from V8 components to V9 services

> ⚠️ **Verify the V9-uses-V8 list before starting this phase** — some flows on the list may already be migrated. Run: `grep -r "from '@/v8/" src/pages/flows/v9/` to get current state.

**Gate E — pass/fail**
- [ ] Zero V9 flows import from `@/v8/components/`
- [ ] `WorkerTokenModal` has exactly 1 implementation

### Phase 6: Integration (Week 11–12)
**Deliver**
- Golden Path completed end-to-end
- Integration tests for critical OAuth/MFA flows
- All one-off components eliminated

### Phase 7: Deployment (Week 13–14)
**Deliver**
- Build/config standardization + startup validation completed
- Release checklist + operational runbook
- Final enforcement tightening (close or escalate remaining waivers)

---

## Success Metrics

### Adoption Metrics (leading indicators)
- % of API calls using BaseApiClient
- % of services extending BaseService
- % of persistence operations using UnifiedStorage
- % of screens using base component library

### Drift Metrics
- New lint violations/week (target: 0 after Phase 1)
- Count + age of open waivers (max 5 at any time)
- Number of duplicate "service helper" implementations (trend down)

### Code Quality Metrics
- WorkerTokenModal: 8 implementations → 1
- Stepper: 3 implementations → 1
- Header: multiple → 1
- **Zero one-off components** — all use shared services
- **Service-based architecture** for all common patterns

### Developer Experience Metrics
- Time to onboard a new engineer to ship a change
- Fewer "how do I do X" questions in reviews
- Faster PR review cycles due to predictable patterns

### User Experience Metrics
- Reduced runtime errors and more actionable messages
- Improved performance consistency across flows

---

## Risk Mitigation

### Technical Risks
- **Migration complexity:** use adapters + codemods; migrate by risk tier
- **Breaking changes:** ADR required; provide migration tooling and phased rollout
- **Over-enforcement too early:** ratchet first; tighten gradually with gates

### Business Risks
- **Delivery delays:** focus early migrations on highest-risk/high-impact paths
- **Stakeholder alignment:** DRIs + visible metrics; communicate weekly progress
- **Vendor dependency constraints:** isolate integrations with scoped contracts and fast revocation mechanisms

---

## Critical Component Duplication Analysis

### WorkerTokenModal — freeze new implementations at Gate A; consolidate at Phase 5
8 implementations currently in the codebase:
- `src/components/WorkerTokenModal.tsx` (1,720 lines)
- `src/v8/components/WorkerTokenModalV8.tsx` (1,761 lines)
- 5+ additional duplicates
- **Target:** single `WorkerTokenModalServiceV9`

### Stepper Components — consolidate at Phase 5
- `AuthenticationFlowStepperV8.tsx` (445 lines)
- `RegistrationFlowStepperV8.tsx` (474 lines)
- `StepperV8U.tsx` (~300 lines)
- **Target:** single `StepperServiceV9`

### Header Components — consolidate at Phase 5
- `MFAHeaderV8.tsx` (216 lines) — used by 21+ files
- Multiple overlapping header services
- **Target:** single `HeaderServiceV9`

### V9 Flows Using V8 Components
> ⚠️ List reflects state as of plan creation. **Verify before Phase 5** — run `grep -r "from '@/v8/" src/pages/flows/v9/` for current state.

Known at time of writing:
- TokenManagementFlowV9.tsx
- MFADeviceOrderingFlowV9.tsx
- MFADeviceManagementFlowV9.tsx
- TokenRevocationFlowV9.tsx *(may already be migrated — check)*
- MFAReportingFlowV9.tsx
- MFAAuthenticationFlowV9.tsx
- PingOneProtectFlowV9.tsx
- TokenIntrospectionFlowV9.tsx *(may already be migrated — check)*

### Solution Architecture
```typescript
// Before (V9 flow using V8 component)
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';

// After (V9 flow using V9 service)
import { workerTokenModalServiceV9 } from '@/services/v9/WorkerTokenModalServiceV9';

const result = await workerTokenModalServiceV9.showModal({
  forceShow: true,
  onSuccess: (token) => setTokenStatus(token),
});
```

---

## Conclusion

This plan turns standardization into an enforceable program:
- A **charter** and **governance** model with named DRIs prevent drift
- A **golden path** makes adoption easy
- **CI enforcement** stops new inconsistency at Gate A
- **Canonical contracts** eliminate ambiguity — `ServiceResult<T>` is the decided return pattern
- A gated roadmap with **binary pass/fail gates** ensures we standardize by impact and dependency
- **Component consolidation** eliminates massive code duplication at Phase 5

**Immediate next steps:**
1. Name DRIs (required to open Gate A)
2. Lock `StandardError` + `ServiceResult<T>` in `src/standards/types.ts`
3. Ship Phase 1 ESLint ratchet rules
4. Freeze new WorkerTokenModal implementations
5. Implement `WorkerTokenModalServiceV9` contract (interface only — implementation at Phase 5)
