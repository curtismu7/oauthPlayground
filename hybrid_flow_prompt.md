# 🧠 AI Prompt — Convert **OIDC Hybrid Flow** to V3 (OIDC 1.0 + 2.0, PingOne SSO)

**Goal:** Implement/upgrade **OIDC Hybrid Flow** (`response_type=code id_token [token]`) to follow **OIDC 1.0 spec**, adopt **OIDC 2.0 best practices**, and align with **PingOne SSO** behavior. Must reuse V3 modules, no duplication.

---

## 🔒 Standards Alignment

- **OIDC 1.0**  
  - Hybrid = `code` + `id_token` and/or `access_token`.  
  - Require `state` + `nonce`.  
  - PKCE with `code_challenge` and `code_verifier`.  

- **OIDC 2.0**  
  - **PKCE mandatory (S256)**.  
  - Short-lived access tokens, refresh optional.  
  - PAR/JAR support if PingOne enables.  
  - Exact redirect URIs + HTTPS required.  

- **PingOne SSO**  
  - Authorize endpoint supports hybrid response types.  
  - Token exchange via PingOne token endpoint.  
  - `id_token` validated with PingOne JWKS.  
  - Audience = PingOne APIs.  

---

## 0) Guardrails & Parity

- Styling/copy parity with V3.  
- Reuse shared utils; no duplication.  
- Config fallback: `.env` → `settings.json` → `localStorage`.  
- Logs: emoji + safe.  

---

## 1) Implementation

- **Start**: `/flows/hybrid`  
- Inputs: `authorization_endpoint`, `client_id`, `redirect_uri`, `scope`, `response_type`.  
- Generate: `state`, `nonce`, PKCE.  
- Build URL with response_type (`code id_token`, `code token`, `code id_token token`).  
- **Callback**: `/callbacks/hybrid`  
  - Parse query (`code`) + fragment (`id_token`, `access_token`).  
  - Validate state/nonce.  
  - Verify `id_token` via JWKS.  
  - Exchange `code` → tokens.  
  - Store in `tokenStorage('hybrid')`.  
- Status panel: tokens, countdown, decode modal.  

---

## 2) Security

- PKCE S256 only.  
- Nonce required if `id_token`.  
- JWKS verification for all tokens.  
- One-time state/nonce.  
- Clear hash + sanitize history.  
- Feature flag: `oidc.hybrid.enabled`.  

---

## 3) Logging

- `[🧭 HYBRID] URL built resp_type=${respType}`  
- `[📥 HYBRID] parsed query+fragment`  
- `[✅ HYBRID] id_token verified`  
- `[📤 HYBRID] code exchanged`  
- `[📦 HYBRID] tokens stored`  

---

## 4) Config

```json
{
  "oidc": {
    "hybrid": {
      "enabled": true,
      "responseTypes": ["code id_token token"],
      "scopes": ["openid", "profile", "email"],
      "pkce": true,
      "nonceLength": 32,
      "stateLength": 32
    }
  }
}
```

---

## 5) Tests

- Unit: URL builder, PKCE, state/nonce, JWKS.  
- Integration: mock PingOne hybrid response.  
- E2E: `/flows/hybrid` → OP → `/callbacks/hybrid`.  
- Negatives: bad state, nonce mismatch, expired token.  

---

**Deliver per OIDC 1.0 + 2.0, validated against PingOne SSO. Reuse `NewAuthContext`, `StepByStepFlow`, `tokenStorage`, `discoveryService`, `logger`.**
