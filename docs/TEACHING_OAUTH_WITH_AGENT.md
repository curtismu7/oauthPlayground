# Plan: Teaching OAuth/OIDC Through an Agent

**Status:** Plan (no code yet)
**Scope decisions (locked):** Token management = **skill only** (no new server). Teaching = **agent-as-guide** layered on top of the **existing flow apps**, which are preserved unchanged.
**Date:** June 2026

---

## 0. Non-negotiable: the existing apps stay

The ~34 V9 flow pages and ~8 token pages are the **canonical visual teaching surface**. This plan
does **not** replace, restyle, or retire any of them. The agent is a *guide that points at and
drives* these pages — it never becomes a substitute for them.

| Guarantee | How |
|-----------|-----|
| Every flow page keeps its route | Agent links to existing routes; no route changes |
| No UI rewrite | Agent reads/explains/links; new work is skill + (optional) thin link layer |
| Mock pages stay mock | Live execution is *additive* via `oauth-oidc-mcp-server`, never forced into the mock UI |

---

## 1. The two deliverables

This plan has exactly two buildable outputs (both deferred until you approve):

1. **`token-education` skill** (oauthPlayground) — teaches the agent to reason about and operate
   on tokens using the tools and UI that already exist. Skill only, no server, no state.
2. **`oauth-curriculum` skill + lesson map** — teaches the agent to *guide a learner through OAuth
   flows*, anchored to the existing flow pages, with optional live execution.

They share the same toolbelt; #1 is the "tokens" subsystem, #2 is the "flows" subsystem.

---

## 2. Why a skill (not a token-management server)

We deal with tokens constantly, but the protocol-level token tools **already exist** and are
stateless by design:

| Need | Already covered by |
|------|--------------------|
| Decode header/payload | `oauth_decode_jwt`, `pingone_decode_jwt` |
| Verify signature (JWKS) | `oauth_verify_jwt`, `jwt-verifier-mcp-server` |
| Introspect (RFC 7662) | `oauth_introspect_token` |
| Revoke (RFC 7009) | `oauth_revoke_token` |
| Exchange / delegate (RFC 8693) | `oauth_token_exchange` (+ `act`/`may_act` surfacing) |
| Claim/compliance checks | `security-compliance-mcp-server` |
| Token display / monitoring UI | `CombinedTokenPage` (`/token/operations`), `TokenMonitoringPage`, `TokenInspector`, `UltimateTokenDisplayDemo` |

The gap is **judgment, not tools**: *when* to refresh, *why* an `act` claim is absent, *what* each
claim means, *how* to read a T1→T2→T3 delegation chain, *how* to debug a 401. That is exactly what
a skill encodes. A stateful server is deferred unless re-pasting raw JWTs becomes a real pain point.

---

## 3. The `token-education` skill (mirrors AI-Demo's structure)

AI-Demo's `token-education` skill is an *architecture guide* for its banking Token-Chain UI. We
mirror its **shape** (data-flow diagram, concept map, debugging table, "files to read") but anchor
the content to oauthPlayground's own assets.

### 3.1 Concepts it teaches
- JWT anatomy: header (`alg`, `kid`, `typ`) vs payload claims (`sub`, `aud`, `scope`, `exp`, `iat`, `jti`, `iss`, `client_id`)
- The delegation chain: `may_act` (pre-authorization) → `act` (current actor) → audience/scope **narrowing** at each hop (the RFC 8693 T1→T2→T3 model)
- BFF token custody (why tokens stay server-side) — cross-references AI-Demo's pattern
- Expiry & refresh reasoning; introspection vs local verification (when each is correct)
- Why HS256 can't be JWKS-verified; why `act` may be absent (PingOne token policy)

### 3.2 Tools it orchestrates (the agent's token toolbelt)
```
decode      → oauth_decode_jwt
verify      → oauth_verify_jwt        (needs jwks_uri / issuer)
introspect  → oauth_introspect_token  (RFC 7662)
revoke      → oauth_revoke_token      (RFC 7009)
exchange    → oauth_token_exchange    (RFC 8693, reads back act/hasActClaim)
discover    → oauth_discover          (resolve jwks_uri / endpoints)
compliance  → security-compliance-mcp-server: check_token_security
```

### 3.3 Existing UI it points the learner to
- `/token/operations` — Token Operations Hub (display + introspect + revoke)
- `/token-management` (`TokenMonitoringPage`) — lifecycle / expiry monitoring
- `TokenInspector` / `UltimateTokenDisplayDemo` — decode & visualize

### 3.4 Debugging playbook (the high-value part)
A table of symptom → likely cause → tool to confirm, e.g.:
| Symptom | Likely cause | Confirm with |
|---------|--------------|--------------|
| 401 at resource | expired / wrong `aud` | `oauth_decode_jwt` → check `exp`, `aud` |
| `act` absent after exchange | PingOne token policy not emitting `act` | `oauth_token_exchange` → `hasActClaim:false`; check policy |
| signature invalid | wrong issuer/JWKS or HS256 | `oauth_verify_jwt`; `oauth_discover` for `jwks_uri` |
| "token works in UI not API" | scope/audience narrowed | `oauth_introspect_token` → compare `scope`/`aud` |

---

## 4. The `oauth-curriculum` skill + lesson map (agent-as-guide)

### 4.1 The per-flow teaching loop
```
1. EXPLAIN  — agent describes the flow + when to use it (skill knowledge)
2. SHOW     — agent links the learner to the existing V9 page for that flow  ← the app
3. RUN      — (optional) agent executes it live via oauth-oidc-mcp-server
4. INSPECT  — agent decodes/verifies the resulting tokens (token-education skill)
5. CHECK    — agent poses a checkpoint question; confirms understanding
6. NEXT     — advance along the learning path
```

The **SHOW** step is what keeps the apps central. The **RUN** step is what the mock pages couldn't
do before — real tokens, then a real INSPECT.

### 4.2 Learning path (ordered) + page/tool mapping

| # | Flow | Existing page (route) | Live tool (oauth-oidc) |
|---|------|----------------------|------------------------|
| 1 | OAuth 2.0 fundamentals / OAuth 2.1 | `/oauth-2-1` | — (concept) |
| 2 | Authorization Code | `/flows/oauth-authorization-code-v9` | `oauth_build_authorization_url` → `oauth_exchange_authorization_code` |
| 3 | + PKCE | (same page, PKCE on) | same (PKCE auto) |
| 4 | Client Credentials | `/flows/client-credentials-v9`, `/flows/worker-token-v9` | `oauth_client_credentials` |
| 5 | Device Authorization | `/flows/device-authorization-v9` | `oauth_device_authorization` → `oauth_poll_device_token` |
| 6 | Refresh | (token pages) | `oauth_refresh_token` |
| 7 | UserInfo | `/flows/userinfo` | `oauth_userinfo` |
| 8 | Introspection (7662) | `/flows/token-introspection-v1` | `oauth_introspect_token` |
| 9 | Revocation (7009) | `/flows/token-revocation` | `oauth_revoke_token` |
| 10 | PAR (9126) | `/flows/par-v9`, `/flows/pingone-par-v9` | `oauth_pushed_authorization_request` |
| 11 | DPoP (9449) | `/flows/dpop` | `oauth_generate_dpop_proof` |
| 12 | CIBA | `/flows/ciba-v9` | `oauth_backchannel_authentication` → `oauth_poll_ciba_token` |
| 13 | **Token Exchange (8693)** | `/flows/token-exchange-v9` | `oauth_token_exchange` (capstone: delegation + `act`) |
| 14 | ROPC (legacy, anti-pattern) | `/flows/oauth-ropc-v9` | `oauth_password_grant` (taught as "avoid") |

Advanced/optional electives (pages exist, agent can branch into): Hybrid, Implicit (deprecated),
JWT Bearer (7523), mTLS-bound tokens, JAR/JARM, Step-Up (9470), GNAP, SPIFFE/SPIRE, WIMSE.

### 4.3 Capstone
**RFC 8693 token exchange** ties tokens + flows + delegation together — the learner runs a real
exchange, then uses the token-education skill to read the `act` chain. This is the bridge to the
AI-Demo agent-delegation story.

### 4.4 Assessment / checkpoints
Per stage: 1–2 questions the agent asks and grades from the real token it just produced
(e.g. "what's the `aud` of the exchanged token, and why did it narrow?").

---

## 5. Architecture (how the pieces compose)

```
            Learner
              │  (natural language)
              ▼
        ┌───────────────┐   reads   ┌──────────────────────────┐
        │  Guide Agent  │──────────▶│ oauth-curriculum skill   │  (flow pedagogy + lesson map)
        │ (LLM)         │──────────▶│ token-education skill    │  (token judgment + debugging)
        └──────┬────────┘           └──────────────────────────┘
               │ links to                       │ calls
               ▼                                ▼
   Existing V9 flow pages (apps)        MCP servers (real execution)
   /flows/*  •  /token/operations       oauth-oidc • jwt-verifier • security-compliance
   (UNCHANGED — the visual truth)       (real tokens, real inspection)
```

- **Skills** = knowledge/judgment (no code execution of their own).
- **MCP servers** = real OAuth/OIDC execution + inspection.
- **Existing apps** = the visual canvas the agent points at.

---

## 6. Phased rollout

| Phase | Deliverable | Notes |
|-------|-------------|-------|
| P1 | `token-education` skill | Highest value, lowest risk. Mirrors AI-Demo structure. |
| P2 | `oauth-curriculum` skill + lesson map | The per-flow loop + the §4.2 mapping table as data. |
| P3 | (optional) live smoke-tests of each `oauth-oidc` tool vs a real PingOne env | Validates the RUN step actually works before teaching with it. |
| P4 | (optional) thin "Run this live" affordance on flow pages | Only if you want the UI to invoke the agent/MCP inline — additive, no rewrite. |
| P5 | (deferred) stateful `token-session` server | Only if re-pasting JWTs becomes painful. |

---

## 7. Open decisions (for when we build)

1. **Skill location** — `.claude/skills/token-education/` and `.claude/skills/oauth-curriculum/` in oauthPlayground (consistent with the new `oauth-oidc-mcp-server` skill).
2. **Live execution default** — should the RUN step default to a sandbox/test PingOne env, or always require the learner to supply creds? (Recommend: test env via `.env` defaults.)
3. **Lesson map format** — embed the §4.2 table in the skill, or as a separate `oauth-lessons.json` the skill references? (Recommend: JSON data file so it's editable without touching the skill prose.)
4. **Assessment depth** — light checkpoints vs a graded path with progress tracking (would need state → reopens the server question).

---

## 8. What this plan deliberately does NOT do

- Does not modify any existing flow page or route.
- Does not build a token-management server (skill-only decision).
- Does not write code yet — this is the plan; build is gated on your approval of phases.
