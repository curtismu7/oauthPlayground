---
trigger: always_on
---

Write good profesional code following this for UI guidelines.  https://marketplace.pingone.com/item/ping-ux-css.  # OAuth/OIDC Playground Development Rules

## The Golden Rule
**Make the playground behave like a production RP (client) with “secure-by-default” settings — and force users to *opt in* to anything weaker for learning purposes.**

---

## Non-Negotiables (Coding + Security)

### Flows & Protocol Choices
- Default to **Authorization Code + PKCE (S256)**; hide/remove Implicit and password grants.
- Support **PAR** (pushed authorization requests) and **JAR** (signed request objects); prefer them **on** to prevent parameter tampering and leakage.
- Include **issuer (`iss`) parameter** checking to mitigate mix-up attacks during the auth response.

### Redirect URIs & CORS
- Enforce **exact** redirect URI matching per client; no wildcards.
- Lock CORS to a short allowlist; never use `*` with credentials.

### Token Handling
- **Never store access/refresh tokens in `localStorage`**.  
  Use a **BFF pattern (backend-for-frontend)**: keep tokens server-side, issue a short-lived, HttpOnly, Secure, SameSite cookie.
- Offer **DPoP** (sender-constrained tokens) as an advanced option.
- Validate ID Tokens strictly: signature, `iss`, `aud`, `azp`, `exp/nbf`, `nonce`.  
  Use JWKS with expiry/backoff for rotation.

### Cookies & Sessions
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` where feasible).
- Add CSRF tokens for any state-changing POSTs.

### Secrets Management
- Keep secrets outside the repo (vault or env vars).
- Mask secrets in logs/UI; rotate regularly.

### Logging & Telemetry
- Log **metadata only** (timestamps, correlation IDs, endpoints).
- If showing examples, redact sensitive values.

### Abuse & Isolation
- Rate-limit endpoints and throttle token requests.
- Use **short-lived, low-privilege** demo accounts and scopes.
- Reset/expire test tenants frequently.

### UI/UX Guardrails
- Dangerous toggles (e.g., PKCE off) must be **off by default** with warnings.
- Explain mitigations inline with links to specs.

### Compliance & Conformance
- Provide **OpenID Conformance Suite** integration or instructions.
- Offer a **FAPI 2.0** preset for high-security testing.

---

## Good Defaults to Enforce
- **Auth request:** `response_type=code`, PKCE=`S256`, strong `state`/`nonce`.
- **Request delivery:** Prefer **PAR**; otherwise **JAR**.
- **Response handling:** Verify `iss`, `state`, `nonce` before exchanging code.
- **Token use:** Restrict audience; call UserInfo for claims.
- **JWT handling:** Use JWT BCP (alg whitelist, claim checks, `kid` validation).

---

## Nice-to-Have Toggles (Learning)
- **Sender-constrained tokens**: DPoP on/off.
- **Hardened requests**: PAR/JAR strict mode.
- **OAuth 2.1 preset**: hides legacy grants, forces PKCE.
- **Attack labs**: simulate CSRF, mix-up, replay attacks, with explanations.
- **FAPI 2.0 mode**: strict redirect/scope rules, alg constraints.

---

## Build Checklist
1. Authorization Code + **PKCE (S256)** on by default.
2. Exact redirect URIs, strict CORS.
3. Server-side tokens (BFF); HttpOnly cookies.
4. Strict ID Token validation (sig, iss, aud, exp, nbf, nonce).
5. Prefer PAR; otherwise JAR.
6. Verify `iss` in responses.
7. Optional DPoP/mTLS.
8. Mask secrets in logs; rate-limit requests.
9. Use short-lived demo users; reset environments often.
10. Include OIDC Conformance testing & FAPI 2.0 mode.
