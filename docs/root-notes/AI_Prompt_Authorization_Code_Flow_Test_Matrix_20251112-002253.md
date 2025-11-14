# Authorization Code Flow – Actionable Test Checklist

Use this checklist to execute and document OAuth 2.0 **Authorization Code** variants (PKCE, offline access, PAR/JAR, mTLS, etc.). Each item should be ticked only after evidence is captured.

---

## 1. Environment Preparation
- [ ] Confirm authorization server hosts:
  - [ ] `AUTHZ_ENDPOINT` (`https://<auth-host>/as/authorize`)
  - [ ] `TOKEN_ENDPOINT` (`https://<auth-host>/as/token`)
  - [ ] `PAR_ENDPOINT` (`https://<auth-host>/as/par`) if used
- [ ] Collect client credentials:
  - [ ] Confidential client ID + secret (basic/post/private_key_jwt/mTLS)
  - [ ] Public client ID
- [ ] Record shared parameters in a secure location:
  - [ ] `REDIRECT_URI`
  - [ ] `SCOPE_BASE` (default `openid profile email`)
  - [ ] Random `STATE` and `NONCE`
  - [ ] `CODE_VERIFIER` + derived `CODE_CHALLENGE` (S256)
  - [ ] DPoP key pair if required
- [ ] Verify logging redaction rules (no full tokens or secrets stored).

---

## 2. Execution Workflow (repeat per case)
- [ ] Build authorization request (URL or PAR/JAR payload as required).
- [ ] Launch authorization request in browser/test harness.
- [ ] Capture **authorization response** (code, state, any error).
- [ ] Exchange code at token endpoint; log response (with redacted tokens).
- [ ] Validate assertions (state preservation, expected tokens, PKCE enforcement, etc.).
- [ ] Save evidence bundle (auth request, auth response, token request, token response, notes).

Use the following JSON scaffold for each case after execution:
```json
{
  "case": "<CASE_ID>",
  "authz_request": "<full URL or PAR/JAR payload>",
  "authz_response": {"code": "...", "state": "..."},
  "token_request": "<curl or HTTP request>",
  "token_response": {"access_token": "redacted", "id_token": "present?", "refresh_token": "present?"},
  "assertions": [
    "state preserved",
    "id_token present",
    "refresh token present (if offline_access)"
  ],
  "notes": ""
}
```

---

## 3. Test Matrix Checklist

### Public Client Scenarios
- [ ] **A1** – PKCE (S256), `response_mode=query`, base scopes.
- [ ] **A2** – PKCE (S256), `response_mode=form_post`.
- [ ] **A3** – PKCE (S256) + `offline_access` → expect refresh token.
- [ ] **A4** – PKCE (S256), scope=`openid` only.
- [ ] **A5** – PKCE omitted (expect failure when AS requires PKCE).

### Confidential Client Scenarios
- [ ] **B1** – PKCE (S256), basic auth, base scopes.
- [ ] **B2** – PKCE (S256), `offline_access`, client_secret_post, expect refresh rotation.
- [ ] **B3** – PKCE (S256) + **PAR** (private_key_jwt).
- [ ] **B4** – PKCE (S256) + **JAR** (signed request object).
- [ ] **B5** – No PKCE (expect failure if AS enforces PKCE).

### Advanced Scenarios
- [ ] **C1** – PKCE (S256) with **PAR + JAR** (private_key_jwt).
- [ ] **C2** – PKCE (S256) with **mTLS** client authentication.
- [ ] **C3** – PKCE (S256) with `prompt=login` (forces re-authentication).
- [ ] **C4** – PKCE (S256) with `max_age=0` (session expiry check).

### Negative Scenarios
- [ ] **N1** – Missing `state` (expect authorization error).
- [ ] **N2** – Invalid `redirect_uri` (expect rejection).
- [ ] **N3** – Reuse/stale authorization code at token endpoint.
- [ ] **N4** – Wrong `code_verifier` (PKCE failure).
- [ ] **N5** – PAR initiated but no `request_uri` in auth request.

> Extend the matrix with DPoP, Token Exchange, RAR, and redirectless flows if applicable.

---

## 4. Authorization Request Templates
- [ ] **Standard** – build URL with query parameters (`response_type=code`, `scope`, `state`, `code_challenge`, etc.).
- [ ] **PAR** – execute POST to PAR endpoint (Step A) and use `request_uri` (Step B).
- [ ] **JAR** – generate signed JWT request object and call authorization endpoint with `request=<JWT>`.

---

## 5. Token Request Templates
- [ ] **Confidential (Basic Auth)** – POST with `grant_type=authorization_code`.
- [ ] **Public Client** – POST without client secret (include `client_id`).
- [ ] **Refresh Flow** – POST `grant_type=refresh_token` when `offline_access` granted.

---

## 6. Acceptance Criteria Verification
- [ ] Authorization response contains `code` and matches `state`.
- [ ] Token response includes expected tokens (redacted).
- [ ] PKCE enforcement confirmed (negative tests fail with bad verifier).
- [ ] PAR/JAR policies enforced (only accepts `request_uri`/signed request).
- [ ] Security checks: reject bad `redirect_uri`, stale code, missing `state`, altered `nonce`.
- [ ] Logging includes timestamps and correlation IDs without exposing secrets.

---

## 7. Guardrails
- [ ] Redact or hash tokens/credentials in logs.
- [ ] Use environment variables for secrets.
- [ ] Ensure HTTPS/TLS and hostname validation.
- [ ] Test refresh-token rotation and revocation where supported.

---

**Prompt Author:** AuthN/Z QA — Authorization Code Flow Coverage  
**Version:** 1.1 (converted to actionable checklist)
