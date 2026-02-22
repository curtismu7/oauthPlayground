# service-consolidation.md — Slow, Safe Plan to Consolidate Services (Node Monorepo)

Purpose: reduce maintenance by consolidating duplicate/overlapping services into **one canonical service per domain** without causing feature-loss regressions.

This plan is designed for a large Node/React monorepo where “apps” are flows/features inside one codebase, and where regressions have occurred from shared drift.

---

## Non‑Negotiables (Stop‑Ship)

- **No big-bang rewrites.** One service/domain at a time.
- **No deletions without proof.** Old service is removed only after:
  - `rg` shows **zero imports**
  - contract tests exist and pass
  - full repo gates pass
- **Behavior is a contract.** Preserve error semantics, timing, retries/backoff, and token handling.
- **Shared code = high risk.** Any change to shared services/utilities requires full gates.

---

## Definitions

- **Service**: any module providing domain behavior behind an interface (API client, token/OIDC helpers, MFA/device helpers, storage, polling/backoff utilities), typically under:
  - `src/services/**`, `src/server/**`, `src/sdk/**`, `src/lib/**`, `src/utils/**`

- **Canonical service**: the single “blessed” implementation for a domain (e.g., `token`, `oidc-discovery`, `mfa-device`, `ciba`, `protect`).

- **Adapter**: a thin wrapper that keeps the old import path working while internally delegating to the canonical service.

---

## Phase 0 — Create the Service Inventory (source of truth)

Create: `docs/services/SERVICE_INVENTORY.md` (or add to your existing inventory system)

For each service/module, capture:

- **Path** (e.g., `src/services/token/...`)
- **Domain** (token, discovery, mfa, device, ciba, protect…)
- **Responsibility** (1–2 lines)
- **Interface** (exports: functions/classes; public surface)
- **Inputs/Outputs** (request/response shapes; types)
- **Error semantics** (error codes/strings, thrown vs returned)
- **Side effects** (storage, caching, retries/backoff, timers)
- **Dependencies** (config/env, other services)
- **Consumers** (apps/components/files)
- **Tests** (existing coverage)
- **Status**: `active | deprecated | candidate-merge | merged | removed`
- **Notes**: invariants, risks, migration constraints

### Inventory rule
If it isn’t in inventory, it doesn’t get consolidated.

---

## Phase 1 — Identify Consolidation Candidates (don’t guess)

Goal: find services with overlapping responsibilities and select the safest/highest ROI candidates first.

### Quick discovery commands (repo root)
```bash
# likely service-like modules
find src -maxdepth 5 -type f \( -iname "*service*.ts*" -o -iname "*client*.ts*" -o -iname "*api*.ts*" \)

# scan domains / keywords
rg -n "token|oidc|discovery|mfa|device|ciba|authorize|callback|introspect|userinfo" src/services src/sdk src/server src/lib src/utils
```

### Candidate signals (prioritize)
- duplicate domain names (“token”, “discovery”, “device”) in multiple locations
- parallel “v7/v8/v8u” implementations
- old+new coexisting with both still imported
- similar files with minor differences (params, mapping, error translation)

---

## Phase 2 — Build the Consumer Map (before code changes)

For each candidate service pair/group, map exactly who uses it.

```bash
# direct imports of a module or directory
rg -n "from ['\"].*(<SERVICE_PATH>|<SERVICE_NAME>).*['\"]" src

# type-level coupling (reveals hidden dependency)
rg -n "<ServiceTypeName>|<ServiceInterfaceName>" src
```

Record in inventory:
- direct importer files
- transitive usage (barrel exports)
- runtime usage (contexts/providers, DI patterns)

### Stop‑ship rule
If you can’t identify consumers, do not proceed.

---

## Phase 3 — Choose a Consolidation Strategy (smallest safe diff)

### Strategy A (recommended): Canonical + Adapter (safest)
1) Implement canonical service: `src/services/<domain>/<canonical>.ts`
2) Keep old service path but refactor it into an **adapter** that calls canonical
3) Migrate consumers gradually to canonical imports
4) Remove adapter + old service only after zero consumers

Pros: lowest regression risk, easy rollback.  
Cons: temporary duplication until migrations finish.

### Strategy B: Promote the newer service
If there is a clear “winner” already:
- add missing behavior to the winner
- keep adapter at old path temporarily

### Strategy C: Facade with multiple backends (only if needed)
Use when old behavior must exist for some consumers while migrating:
- stable facade API
- internally routes to old/new based on explicit config
- migrate consumer-by-consumer until facade only uses new

---

## Phase 4 — Lock Down Behavior with Contract Tests (before migrating consumers)

Most “lost feature” regressions happen because behavior isn’t asserted.

For each canonical service, add a minimal **contract test suite**:

Must cover:
- request shape mapping
- response shape mapping
- error semantics (codes/messages/throwing)
- token handling invariants (if IAM-related)
- retries/backoff/timers (if applicable)

### Minimal target (per service)
- 3–6 contract tests
- 1 negative/error case
- 1 edge case (expiry/invalid input)

### Options (pick fastest)
- unit tests around canonical service with mocked transport
- integration tests against a mocked server
- small end-to-end “golden flow” test if service is critical

---

## Phase 5 — Migrate Consumers Slowly (one area per PR)

Process (repeat per consumer group):
1) update imports to canonical service
2) run full gates
3) merge
4) update inventory status/notes

### Slow cadence guideline
- 1 service consolidation in flight at a time
- 1–2 consumer migrations per PR max

---

## Phase 6 — Prevent Reintroduction (“no new usage” gate)

Once a service is deprecated, add a CI-friendly check that fails non-zero if it’s imported again.

Example:
```bash
rg -n "from ['\"].*oldTokenService" src && exit 1 || exit 0
```

Add the command to the relevant inventory so it’s enforced.

---

## Phase 7 — Remove Old Service (only when provably unused)

Deletion checklist:
- `rg` confirms **zero** imports/usages
- adapter removed
- contract tests pass
- repo gates pass
- inventory updated: `removed` + “why” note

---

## Full Gates (Node monorepo, NPM, NO DOCKER)

Run from repo root:
```bash
npm ci
npm run build
npm test
./comprehensive-inventory-check.sh
```

If a consolidation touches shared layers (`src/services`, `src/server`, `src/lib`, `src/utils`, `src/components`):
- treat as shared-change work and run full gates across all impacted flows/apps.

---

## IAM-Specific Invariants to Preserve (where applicable)

When consolidating services related to OAuth/OIDC/CIBA/token exchange:

- **Error mapping** is part of the contract (no silent changes)
- **Token semantics**: audience, issuer, scopes, expiry, token_type, claims mapping
- **OIDC discovery**: issuer/metadata parsing correctness
- **Polling/backoff/timers**: do not globally change intervals/timeouts unless explicitly scoped and proven safe
- **Security controls**: no loosening validation “to make it work”

Add contract tests that assert these invariants.

---

## Suggested 2-Week Iteration (repeatable)

### Week 1 (foundation)
- build inventory
- pick 1 low-risk candidate
- implement canonical + adapter
- add contract tests
- run full gates

### Week 2 (migration)
- migrate consumers in small PRs
- add “no new usage” gate
- remove old service once consumers hit zero

---

## Deliverables per Consolidation (required)

Each consolidation effort must produce:
- updated inventory entry
- consumer map evidence (rg outputs summarized)
- canonical service + adapter (if Strategy A/B)
- contract tests
- “no new usage” gate for deprecated service
- proof: commands run + pass summary

---

## What to Provide to Windsurf (recommended prompt inputs)

- This file (`service-consolidation.md`)
- The inventory file(s) and any “comprehensive inventory check” script usage
- The specific service candidate you’re consolidating
- The `rg` consumer map results
- The contract tests you want added/updated
