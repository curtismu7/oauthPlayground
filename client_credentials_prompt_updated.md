# 🧠 AI Prompt — Convert **Client Credentials** flow to **Authz Flows v3** (OIDC 1.0 + 2.0, PingOne SSO)

**Goal:** Implement/upgrade the **Client Credentials** flow to fully match **Authz Flows v3** styling, copy, logging, and hardening—**following OIDC 1.0 Core, OIDC 2.0 guidance, and PingOne SSO behavior**. Reuse existing components with no code duplication. Ship behind a feature flag with full tests.

---

## 🔒 Standards Alignment

- **OIDC 1.0 / OAuth2**  
  - Use `grant_type=client_credentials`.  
  - Support `client_secret_basic`, `client_secret_post`, and `private_key_jwt`.  
  - Token endpoint from PingOne discovery metadata.  

- **OIDC 2.0 / OAuth 2.1 best practices**  
  - **PKCE not required** (M2M), but strong key-based auth preferred.  
  - Prefer `private_key_jwt` over shared secrets.  
  - Short-lived access tokens; refresh tokens optional.  
  - Support `audience` or `resource` to constrain token.  
  - Support PAR/JAR if PingOne tenant advertises them.  

- **PingOne SSO**  
  - Token endpoint is tenant/env-scoped.  
  - Client creds can return tokens for PingOne APIs (scopes or audience).  
  - Secrets/keys resolved via Credential Manager (`settings.json`, `.env`, `localStorage`).  

---

## 0) Guardrails & Parity

- Same stepper, copy, status bar, logging as V3.  
- **No duplicated code**; extend `src/utils/*`.  
- **Unified logs**: emoji, timestamped, safe.  
- **Config sources**: `.env` → `settings.json` → `localStorage`.  

---

## 1) Implementation

- **Start page**: `/flows/client-credentials`  
- Collect inputs: `token_endpoint`, `client_id`, `auth_method`, `scope`, `audience/resource`.  
- Request body:  
  - `grant_type=client_credentials`.  
  - Add `scope` or `audience`.  
  - For `private_key_jwt`: sign JWT assertion with `jose`.  
- Send POST → `token_endpoint`.  
- On success: store `access_token`, expiry.  
- Status panel: show masked token, expiry countdown, history.  

---

## 2) Security

- Enforce strong algs (RS256/ES256).  
- Redact secrets in logs/UI.  
- Validate HTTPS + exact endpoints.  
- Cache tokens with proactive refresh.  
- Feature flag: `oauth.clientCredentials.enabled`.  

---

## 3) Logging

- `[🏗️ CC] request built auth_method=${auth_method}`  
- `[📤 CC] POST /token`  
- `[✅ CC] token acquired exp=${exp}`  
- `[⛔ CC] failure code=${error}`  

---

## 4) Config

```json
{
  "oauth": {
    "clientCredentials": {
      "enabled": true,
      "authMethod": "private_key_jwt",
      "scopes": ["p1:read:users"],
      "audience": "https://api.pingone.com",
      "proactiveRefreshSeconds": 90
    }
  }
}
```

---

## 5) Tests

- Unit: body builder, JWT signer, storage.  
- Integration: simulate PingOne token endpoint.  
- E2E: `/flows/client-credentials` → get token → status bar.  
- Negatives: invalid_client, expired key.  

---

**Implement per OIDC 1.0 + OIDC 2.0 guidance and PingOne SSO. Reuse `NewAuthContext`, `StepByStepFlow`, `tokenStorage`, `discoveryService`, `logger`.**
