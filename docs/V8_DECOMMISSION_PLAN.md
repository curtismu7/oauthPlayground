# V8 / V8U Decommission Plan

**Written 2026-07-04.** Status of the legacy-generation cleanup and the path to
retiring the remaining pre-V9 code.

## Where things stand

| Generation | Location | Size | Status |
| --- | --- | --- | --- |
| V6 | (routes only) | ~15 route paths | All redirect to V9 — harmless compat shims |
| V7 flows | `src/pages/flows/*V7*` | mostly deleted | Routes redirect to V9 |
| V7M mocks | `src/v7/` | 10 files | **Intentional keep** — simulated educational flows (`/v7/oauth/*`, `/v7/oidc/*`), no real credentials |
| V8 | `src/v8/` | ~261 files / ~139k lines | **Live** — 34 routed paths incl. MFA, still the only implementation of several features |
| V8U | `src/v8u/` | ~87 files / ~56k lines | **Live** — unified flow UI (`/v8u/unified` is the redirect target for retired compliance flows) |
| V9 | `src/pages/flows/v9`, `src/services/v9`, `src/flows2` | — | Canonical for standard OAuth/OIDC flows |

The OAuth/OIDC duplication tranche
(`docs/root-notes/reports/OAUTH_OIDC_DUPLICATION_REPORT.md`) is fully executed
as of 2026-07-04 — duplicate flow pages, orphaned hooks/services, and the
broken flow nav are done.

## Why V8/V8U can't just be deleted

- MFA lives only in V8 (`/flows/mfa-v8` and the `src/v8/services/mfa*` family);
  the flow nav links to it.
- V8U's unified flow is a live redirect target and has no V9 equivalent.
- 6+ active V9/flows2 pages import shared components from `src/v8/` and
  `src/v7/` — the generations are entangled, not siloed.

Deleting them is a feature-migration project, not a cleanup.

## Decommission sequence (each step independently shippable)

1. **Freeze**: no new code in `src/v8`/`src/v8u` (enforceable with a biome/CI
   path rule). New features land in V9 locations only.
2. **Untangle shared imports**: move the components/services that V9 pages
   import *out of* `src/v8//src/v7/` into shared locations, so the legacy
   trees have zero inbound imports from active code. This is mechanical and
   low-risk; do it first.
3. **Inventory the 34 V8 routes** into three buckets: (a) duplicate of a V9
   flow → convert route to redirect, delete page; (b) feature with no V9
   equivalent worth keeping (MFA, Protect portal) → plan a V9 migration or
   explicitly bless the V8 implementation as canonical and move it out of
   `src/v8`; (c) dead/unreachable → delete.
4. **Migrate or bless bucket (b)** one feature at a time (MFA is the big one).
5. **Delete `src/v8`, then `src/v8u`** once their route counts hit zero.
   Expected payoff: ~195k lines removed and a large bite out of the
   `.tsc-error-baseline`.

## Ground rules

- **This app exists to teach OAuth/OIDC and PingOne's implementation of
  them.** Before converting any V8 route to a redirect, check whether the
  page teaches something its V9 target doesn't (step-by-step detail,
  PingOne-specific behavior, a spec variant shown explicitly). If it does,
  it belongs in bucket (b) — migrate the educational content, don't drop it.
  Apparent "duplication" (OAuth vs OIDC variants, mock/simulated flows) is
  often pedagogy, not cruft.
- Git history is the archive — delete, don't move to "archive" folders.
- Every step must pass: `npm run type-check:ratchet`, `npx vite build`,
  `npx vitest run src/services/__tests__/`.
- Convert routes to `<Navigate replace />` before deleting their components,
  never after.
