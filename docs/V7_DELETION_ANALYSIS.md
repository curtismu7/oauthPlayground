# `src/v7/` Deletion Analysis (Phase 6 gate)

**Date:** 2026-06-18
**Conclusion: the `src/v7/` mass-delete is still BLOCKED. Zero v7 files are currently orphaned.**

Policy followed (per the user): keep V9 as the latest legacy tier; where a flow has no V9
replacement, a V7/V8 page must be upgraded to V9 before its V7 dependencies can go; delete only
what is provably unreferenced. Nothing here meets that bar yet, so nothing was deleted.

## What `src/v7/` contains (13 files)

A small set of shared "V7M mock-flow" UI primitives plus a barrel:

- `index.ts`, `facade.ts`, `mode.ts`
- `styles/mockFlowStyles.ts`
- `components/`: `V7MMockBanner`, `V7MFlowOverview`, `V7MStepSection`, `V7MHelpModal`,
  `V7MInfoIcon`, `V7MJwtInspectorModal`
- `pages/V7MSettingsV9.tsx` (+ its test)

These are **not flows** — they are the chrome (mock banner, step sections, help modal, JWT
inspector) that the legacy V9 flow pages render.

## Who still imports `src/v7/` (the blockers)

| v7 file | Non-v7 importers (active) |
|---------|---------------------------|
| `mockFlowStyles`, `V7MMockBanner` | the widest: `DPoPFlow`, `MockMcpAgentFlowPage`, `JWTBearerTokenFlowV9`, `RARFlowV9`, `SAMLServiceProviderFlowV9`, `SAMLBearerAssertionFlowV9`, `SpiffeSpireFlowV8U`, `PARFlowV9`, `DeviceAuthorizationVerifyPage`, and the `V7M*V9` pages below |
| `V7MJwtInspectorModal`, `V7MFlowOverview`, `V7MHelpModal`, `V7MInfoIcon` | `V7MOIDCHybridFlowV9`, `V7MCIBAFlowV9`, `V7MOAuthAuthCodeV9`, `V7MDeviceAuthorizationV9`, `V7MROPCV9`, `V7MImplicitFlowV9` |
| `mode` | **non-flow pages**: `EmergingAIStandards`, `McpToolDiscovery`, `docs/MCPDocumentation`, `docs/AIAgentAuthDraft`, `components/AIAssistant` |
| `V7MSettingsV9` | `App.tsx` (still routed) |

Every v7 file has at least one active non-v7 importer ⇒ none are safe to remove.

## What this batch already replaced (flows2)

New `/v2/flows/*` pages now exist for: PAR (#7), Refresh+rotation (#9), OIDC Discovery/JWKS (#10),
DPoP (#11), Redirectless (#12), Implicit/Hybrid (#13), ROPC (#14) — joining the 8 shipped earlier.
The flows2 pages are **self-contained** (no `src/v7/` imports), so they add no new coupling.

They are **additive** and the old V9 pages remain routed: per `FLOWS_REBUILD_PLAN.md` §5/§6 a legacy
page is retired only after its replacement is **verified against real PingOne**. This batch is
verified at build-green + unit-test level only (the chosen bar), which is below that gate — so the
old routes were intentionally left in place and not redirected/deleted.

## Backlog to actually unblock the `src/v7/` delete

In dependency order:

1. **Retire the V7M V9 flow pages** once their flows2 replacements are real-PingOne-verified:
   `V7MOAuthAuthCodeV9`, `V7MDeviceAuthorizationV9`, `V7MROPCV9`, `V7MImplicitFlowV9`,
   `V7MOIDCHybridFlowV9`, `PARFlowV9`, `DPoPFlow`. (Redirect routes → `/v2/flows/*`, remove pages.)
2. **Rebuild the flows that have no flows2 equivalent** into flows2 (so their V7M imports disappear):
   CIBA (`V7MCIBAFlowV9`), JWT Bearer (`JWTBearerTokenFlowV9`), RAR (`RARFlowV9`),
   SAML SP / SAML Bearer, SPIFFE/SPIRE (`SpiffeSpireFlowV8U`), Mock MCP Agent.
3. **Migrate the `mode` import** off `src/v7/` for the five non-flow consumers
   (`EmergingAIStandards`, `McpToolDiscovery`, `docs/MCPDocumentation`, `docs/AIAgentAuthDraft`,
   `AIAssistant`) — extract `mode.ts` to a neutral location or inline it.
4. **Re-home `V7MSettingsV9`** (routed from `App.tsx`) or fold it into a flows2 settings page.
5. Then `src/v7/` (and the duplicated postman generators, `src/locked/**` already gone) can be
   deleted and `App.tsx` routes pruned — the FLOWS_REBUILD_PLAN.md Phase 6 exit criteria.

Until 1–4 are done, deleting any `src/v7/` file breaks the build.
