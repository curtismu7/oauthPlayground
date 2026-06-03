---
name: oauth-oidc-mcp-server
description: Use when working with the oauth-oidc-mcp-server — a provider-agnostic MCP server that EXECUTES real OAuth 2.0 / OIDC flows (authorization code + PKCE, client credentials, ROPC, refresh, RFC 8693 token exchange, device, CIBA, PAR, DPoP, introspection, revocation, discovery, JWKS) against any OIDC issuer, with a PingOne convenience preset. Covers its 18 tools, endpoint-resolution model, the PingOne API reference for validating requests, and how it differs from pingone-mcp-server (management) and oauth-simulator (mock steps).
---

# oauth-oidc-mcp-server

A **provider-agnostic** MCP server that runs **real** OAuth 2.0 / OIDC flows against any
OIDC-compliant issuer. PingOne is a first-class preset, but nothing is hardcoded to it.

Location: `oauth-oidc-mcp-server/` · Transport: **stdio** · Entry: `src/index.ts`

## When to use this server (vs. the neighbors)

| Need | Use |
|------|-----|
| Execute a live OAuth/OIDC flow and get real tokens | **oauth-oidc-mcp-server** (this) |
| RFC 8693 token exchange with `act` delegation | **oauth-oidc-mcp-server** → `oauth_token_exchange` |
| Manage PingOne config (users, groups, MFA, apps) | `pingone-mcp-server` (management APIs) |
| Show educational mock flow *steps* (no real call) | `oauth-simulator-mcp-server` |
| Verify a JWT signature only | `jwt-verifier-mcp-server` or `oauth_verify_jwt` here |
| Check a config against RFC/FAPI rules | `security-compliance-mcp-server` |

`pingone-mcp-server` stays alive — this server did **not** replace it. It owns OAuth/OIDC
*flows*; pingone-mcp-server owns *management*.

## Endpoint resolution (what makes it provider-agnostic)

Every tool accepts the same provider-location fields and resolves endpoints in priority order
(later wins per individual endpoint):

1. **Explicit overrides** — `tokenEndpoint`, `authorizationEndpoint`, `jwksUri`, etc.
2. **OIDC discovery** — `issuerUrl` → `${issuer}/.well-known/openid-configuration` (cached 5 min)
3. **PingOne preset** — `pingoneEnvironmentId` (+ `pingoneRegion`: `com`|`eu`|`ca`|`asia`) →
   `https://auth.pingone.{region}/{envId}/as/{token|authorize|jwks|userinfo|introspect|revoke|device_authorization|par|bc-authorize}`
4. **Env defaults** — `OAUTH_ISSUER_URL`, `PINGONE_ENVIRONMENT_ID`, `PINGONE_REGION`,
   `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_CLIENT_AUTH_METHOD`, `OAUTH_DEFAULT_SCOPE`

Client auth method per call: `client_secret_basic` | `client_secret_post` | `none`.
**PingOne AI_AGENT apps use `client_secret_post`.** Quote secrets with special chars.

## The 18 tools

**Discovery & JWT**
- `oauth_discover` — resolve & return the full endpoint set for an issuer/preset
- `oauth_decode_jwt` — decode header+payload, no signature check (educational)
- `oauth_verify_jwt` — verify signature against JWKS (`jose` createRemoteJWKSet)

**Grants**
- `oauth_password_grant` — ROPC (RFC 6749 §4.3)
- `oauth_refresh_token` — refresh grant (RFC 6749 §6)
- `oauth_client_credentials` — M2M (RFC 6749 §4.4); supports `audience`/`resource`

**Authorization Code + PKCE**
- `oauth_build_authorization_url` — builds URL, generates PKCE pair + state/nonce; **returns the
  `codeVerifier` — save it** to complete the swap
- `oauth_exchange_authorization_code` — code→token (RFC 6749 §4.1.3), with `codeVerifier`

**Token Exchange (flagship)**
- `oauth_token_exchange` — RFC 8693. `subjectToken` (+ optional `actorToken`) → delegated token.
  Decodes the result and surfaces `act` / `hasActClaim`. Mirrors the AI-Demo BFF delegation
  pattern (`agentMcpTokenService` / `oauthService.performTokenExchangeWithActor`).

**Device & CIBA & PAR & DPoP**
- `oauth_device_authorization` / `oauth_poll_device_token` — RFC 8628
- `oauth_backchannel_authentication` / `oauth_poll_ciba_token` — OIDC CIBA (grant
  `urn:openid:params:grant-type:ciba`)
- `oauth_pushed_authorization_request` — RFC 9126, returns `request_uri`
- `oauth_generate_dpop_proof` — RFC 9449 proof JWT (htm/htu/jti/iat, optional `ath`/`nonce`);
  returns reusable key JWKs + JKT thumbprint

**Token lifecycle & OIDC**
- `oauth_introspect_token` — RFC 7662
- `oauth_revoke_token` — RFC 7009
- `oauth_userinfo` — OIDC UserInfo (GET with Bearer)

## Validating requests against PingOne's APIs

**Authoritative PingOne API reference:** https://developer.pingidentity.com/apis.html

When building or debugging a PingOne request, validate parameter names, grant URNs, endpoint
paths, and error codes against that reference. Key checkpoints:

- **Token endpoint** (`/as/token`) — grant types, `client_secret_basic` vs `_post`, scope syntax.
  Confirm against the PingOne **OIDC/OAuth** API docs.
- **Token exchange** — PingOne supports `urn:ietf:params:oauth:grant-type:token-exchange`. The
  returned `act` claim depends on the **resource token policy** + `may_act` config (see the
  repo's `docs/PINGONE_CONFIG.md` if present, and the PingOne "Securing AI Agents" guidance).
- **Device / CIBA / PAR** — confirm the PingOne tenant has these endpoints enabled and the app
  has the grant types added on its **Advanced** OAuth config.
- **Region hosts** — `auth.pingone.com` (US/`com`), `.eu`, `.ca`, `.asia`. Management API is
  `api.pingone.com`; flows use the `auth.pingone.*` host (this server only touches auth hosts).
- **Discovery** — prefer `oauth_discover` with `issuerUrl =
  https://auth.pingone.{region}/{envId}/as` to pull live endpoints instead of assuming paths.

If a request shape is uncertain, fetch the specific endpoint's page under
https://developer.pingidentity.com/apis.html and confirm before sending.

## Example prompts

- "Run a client credentials grant against PingOne env `b9817c16-…` region com with scope `read write`."
- "Build a PKCE authorization URL for client `a4f963…` redirect `https://localhost:3000/authz-callback`, then I'll give you the code to exchange."
- "Do an RFC 8693 token exchange: here's the subject token, audience `https://mcp-server.pingdemo.com` — tell me if the result has an `act` claim."
- "Discover the endpoints for issuer `https://auth.pingone.eu/{envId}/as`."
- "Generate a DPoP proof for `POST https://auth.pingone.com/{envId}/as/token`."

## Gotchas

- **Poll tools throw on `authorization_pending`/`slow_down`** by design — that surfaces the OAuth
  error code cleanly; keep polling until approval or `expired_token`.
- **`oauth_build_authorization_url` returns the `codeVerifier`** — it's stateless, so you must
  pass that same verifier back into `oauth_exchange_authorization_code`.
- **HS256 can't be verified via JWKS** — `oauth_verify_jwt` needs an asymmetric key (RS256/ES256).
- **DPoP keys are ephemeral** unless you pass `privateJwk`/`publicJwk` back in — reuse the
  returned key pair across a token request + resource request.