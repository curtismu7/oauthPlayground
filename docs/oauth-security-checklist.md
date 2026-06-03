# OAuth 2.0 / OpenID Connect Security Checklist

A comprehensive checklist for validating OAuth 2.0 and OpenID Connect implementations against relevant RFCs, industry standards, and security best practices.

---

## 1. RFC 6749 — OAuth 2.0 Core Security

Authorization Server Requirements:

- [ ] **Endpoint TLS:** All endpoints use TLS 1.2+ (RFC 6749 §3)
- [ ] **Token Endpoint Auth:** Client authentication required (client_id + secret or mTLS) (RFC 6749 §3.2.1)
- [ ] **Token Expiration:** Access tokens expire (recommended: 1 hour or less) (RFC 6749 §4)
- [ ] **Refresh Token Storage:** Issued only via confidential clients or with PKCE (RFC 6749 §6)
- [ ] **Authorization Code Lifetime:** Expires within 10 minutes (RFC 6749 §4.1)
- [ ] **State Parameter Handling:** Verified on callback, unique per request (RFC 6749 §4.1.1)
- [ ] **Client Registration Validation:** Redirect URIs must be exact-match, no wildcards (RFC 6749 §3.1.2.1)
- [ ] **Token Response:** Does not include sensitive data in URL (RFC 6749 §4.1.2)
- [ ] **Error Logging:** Server does not log sensitive credentials (RFC 6749 §3.2.1)

Client Requirements:

- [ ] **Credential Storage:** Does not store client_secret in client-side code (RFC 6749 §2.3.1)
- [ ] **Redirect URI Validation:** Uses exact-match, never wildcards (RFC 6749 §3.1.2.1)
- [ ] **Authorization Code:** Single-use, verified within timeout (RFC 6749 §4.1)
- [ ] **Token Storage:** Access tokens in memory or secure storage, not localStorage (RFC 6749 §6.1)

---

## 2. RFC 7636 — PKCE (Proof Key for Public Clients)

- [ ] **Verifier Length:** 43–128 characters (RFC 7636 §4.1)
- [ ] **Verifier Charset:** Matches `[A-Za-z0-9\-._~]+` (RFC 7636 §4.1)
- [ ] **Challenge Method:** Uses S256 (SHA256) by default, plain only if network isolation guaranteed (RFC 7636 §4.3)
- [ ] **Challenge Encoding:** Base64url-encoded, no padding (RFC 7636 §4.2)
- [ ] **Server Validation:** Verifies challenge = BASE64URL(SHA256(verifier)) for S256 (RFC 7636 §4.6)
- [ ] **Native Apps:** PKCE is mandatory for all native clients (RFC 7636 §4)
- [ ] **SPAs:** PKCE is mandatory for browser-based flows (RFC 7636 §4)
- [ ] **Confidential Clients:** PKCE recommended even for server-side clients (RFC 7636 §1)

---

## 3. RFC 8252 — Native Application OAuth 2.0 Security

- [ ] **Localhost Redirect:** Uses `http://localhost:<port>` with dynamic port OR custom scheme (RFC 8252 §7.1)
- [ ] **Custom Scheme:** Uses app-specific scheme (e.g., `myapp://callback`), never generic schemes (RFC 8252 §7.2)
- [ ] **Embedded Browser:** Does NOT embed browser in app; uses system browser or webview (RFC 8252 §7.5)
- [ ] **Credential Storage:** Does NOT store refresh tokens in plaintext (RFC 8252 §6.3)
- [ ] **PKCE:** All native apps use PKCE (RFC 8252 §7.1)
- [ ] **Loopback Listener:** Closes server after receiving callback (RFC 8252 §7.1)

---

## 4. FAPI 2.0 — Financial-Grade API Security

- [ ] **PKCE Mandatory:** All flows require PKCE (FAPI 2.0 Baseline)
- [ ] **PAR (Pushed Authorization Request):** Recommended for high-security environments (FAPI 2.0)
- [ ] **DPoP (Demonstration of Proof-of-Possession):** Bind tokens to client (FAPI 2.0 Advanced)
- [ ] **mTLS:** Client certificate authentication supported (FAPI 2.0)
- [ ] **Scope Enforcement:** Scopes narrowly defined and enforced (FAPI 2.0)
- [ ] **Resource Indicator:** Support for `resource` parameter in token requests (FAPI 2.0)

---

## 5. Token Security

- [ ] **Access Token Expiration:** Expires within recommended window (typically 1 hour max)
- [ ] **No Secrets in Tokens:** JWT payloads do not contain client_secret or passwords
- [ ] **Audience Claim (`aud`):** Present and validated by resource server (OpenID Connect §3.1.3)
- [ ] **Subject Claim (`sub`):** Present and unique per user (OpenID Connect §5.1)
- [ ] **Issuer Claim (`iss`):** Present and validated against expected issuer (OpenID Connect §3.1.3)
- [ ] **JTI (JWT ID) Claim:** Present for replay attack prevention (optional but recommended)
- [ ] **Token Signature:** Verified using JWKS or public key (RFC 7515)
- [ ] **Token Encryption:** Encrypted if transmitted over non-TLS channels (rare; not recommended)
- [ ] **Refresh Token Rotation:** Issued new refresh token with each use (optional, increases security)
- [ ] **Refresh Token Expiration:** Expires after inactivity period (e.g., 30 days)

---

## 6. Transport Security

- [ ] **TLS 1.2+:** All OAuth endpoints use TLS 1.2 or higher (RFC 6749 §1.6)
- [ ] **HSTS:** HTTP Strict-Transport-Security header present (minimum 1 year)
- [ ] **Certificate Pinning:** Recommended for critical clients (RFC 7469)
- [ ] **No Plain HTTP:** Authorization endpoints never use plain HTTP
- [ ] **CORS Configuration:** Properly restricted (not `*` for sensitive endpoints)
- [ ] **Secure Cookies:** HttpOnly, Secure, SameSite=Strict for session cookies

---

## 7. State Parameter & CSRF Protection

- [ ] **State Parameter:** Present in authorization request (RFC 6749 §4.1.1)
- [ ] **State Validation:** Verified on callback (exact match)
- [ ] **State Entropy:** Minimum 32 bytes of cryptographically secure random data
- [ ] **State Expiration:** Expires after reasonable timeout (e.g., 10 minutes)
- [ ] **Unique State:** Each authorization request has unique state value
- [ ] **SameSite Cookies:** Set to Strict or Lax to prevent CSRF on session cookies

---

## 8. Redirect URI Security

- [ ] **Exact Match:** Authorization server enforces exact URI matching (no substring matching) (RFC 6749 §3.1.2.1)
- [ ] **No Wildcards:** Redirect URIs do not contain wildcards (e.g., `https://*.example.com/callback` is forbidden)
- [ ] **HTTPS Only:** All redirect URIs use HTTPS (except localhost for native/desktop apps)
- [ ] **Localhost:** Allowed only for native/desktop apps with dynamic port or custom scheme
- [ ] **Pre-registration:** All redirect URIs must be pre-registered, no dynamic registration without authorization
- [ ] **Validation on Refresh:** Redirect URI validated again if included in refresh token request (RFC 6749 §6)

---

## 9. Token Lifetime Guidelines

**By Grant Type (RFC 6749, Community Best Practices):**

- [ ] **Authorization Code:** Code lifetime ≤ 10 minutes (expires quickly)
- [ ] **Access Token (User Delegation):** Lifetime 1 hour (common industry default)
- [ ] **Access Token (Client Credentials):** Lifetime 1 hour (or as required by resource policy)
- [ ] **Refresh Token:** Lifetime 30 days to 1 year (resource-dependent)
- [ ] **ID Token (OpenID Connect):** Lifetime 1 hour or less (short-lived, used for session)
- [ ] **Device Flow Token:** Device code ≤ 15 minutes, user code ≤ 15 minutes (RFC 8628)

---

## 10. OpenID Connect (OIDC) Compliance

- [ ] **Discovery Endpoint:** `/.well-known/openid-configuration` available (OpenID Connect Discovery §4)
- [ ] **JWKS Endpoint:** `jwks_uri` available, contains current signing keys (OpenID Connect §4)
- [ ] **ID Token Signature:** Signed with RS256 or ES256 (not HS256 for high-security contexts) (OpenID Connect §3.1.3)
- [ ] **ID Token Validation:** Verified signature, aud claim, exp claim, iss claim (OpenID Connect §3.1.3)
- [ ] **Nonce Parameter:** Supported and validated to prevent token replay (OpenID Connect §3.1.2.11)
- [ ] **UserInfo Endpoint:** Returns claims protected by access token (OpenID Connect §5)
- [ ] **Response Types:** Supports code (recommended), id_token+code, id_token
- [ ] **Implicit Flow:** Avoided in favor of Authorization Code + PKCE (OpenID Connect §5.1.3 deprecation)

---

## Appendix: RFC & Standard Reference Table

| Requirement | RFC/Standard | Section | Priority |
|---|---|---|---|
| TLS 1.2+ | RFC 6749 | §1.6 | CRITICAL |
| Exact Redirect URI Matching | RFC 6749 | §3.1.2.1 | CRITICAL |
| State Parameter | RFC 6749 | §4.1.1 | CRITICAL |
| Client Authentication | RFC 6749 | §3.2.1 | CRITICAL |
| PKCE (Public Clients) | RFC 7636 | Full | CRITICAL |
| Authorization Code Expiration | RFC 6749 | §4.1 | HIGH |
| Access Token Expiration | RFC 6749 | §4 | HIGH |
| JWKS Endpoint | OpenID Connect | Discovery §4 | HIGH |
| Secure Cookie Attributes | Best Practice | N/A | HIGH |
| Nonce Validation | OpenID Connect | §3.1.2.11 | MEDIUM |
| Refresh Token Rotation | Best Practice | N/A | MEDIUM |
| HSTS Header | RFC 6797 | Full | MEDIUM |

---

## How to Use This Checklist

1. **Before Deployment:** Review all CRITICAL items; ensure 100% compliance.
2. **During Audits:** Check HIGH and MEDIUM items; document any deviations with risk mitigations.
3. **Ongoing Compliance:** Revisit quarterly as standards evolve.
4. **Per Flow Type:** Highlight requirements specific to your grant type (e.g., PKCE for native apps).

---

*Last Updated: June 2026*
*References: RFC 6749, RFC 7636, RFC 8252, FAPI 2.0, OpenID Connect Core*
