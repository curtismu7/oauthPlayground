# Pushed Authorization Requests (PAR) — OAuth 2.0 vs OpenID Connect

**Purpose:** Explain whether PAR is an OAuth or OpenID Connect feature, and show how both use it.

---

## ⚙️ Overview

**PAR (Pushed Authorization Requests)** is an extension to **OAuth 2.0** (RFC 9126).  
It allows clients to send authorization parameters to the **Authorization Server** via an authenticated **HTTP POST** request rather than exposing them in the browser URL.

OpenID Connect (OIDC) simply **inherits PAR** as a secure transport for its own parameters (like `nonce`, `claims`, and `id_token_hint`).

---

## 🧩 Table: OAuth vs OIDC Usage of PAR

| Aspect | OAuth 2.0 | OpenID Connect |
|--------|------------|----------------|
| **Base Spec** | [RFC 9126 – OAuth 2.0 Pushed Authorization Requests](https://datatracker.ietf.org/doc/html/rfc9126) | Same RFC reused within OIDC context |
| **Purpose** | Securely push authorization request to AS via POST | Same, but includes OIDC-specific fields (`nonce`, `claims`, etc.) |
| **Applies To** | Authorization Code, Device, Hybrid, JWT Bearer, RAR | Authorization Code, Hybrid, Implicit (with `scope=openid`) |
| **Token Type Returned** | Access Token (for API access) | Access Token + ID Token (+ optional Refresh Token) |
| **Example Audience** | API or Resource Server | ID Token audience is the Client (OIDC RP) |
| **Endpoint** | `/as/par` | `/as/par` (same endpoint) |
| **Security Context** | Client Authentication required | Same requirement; includes `nonce` for replay protection |
| **Response** | `{ "request_uri": "urn:ietf:params:oauth:request_uri:xyz", "expires_in": 90 }` | Same JSON, used to call `/authorize` with OpenID scopes |

---

## ✅ Rule of Thumb

- **If you’re authorizing API access →** it’s **OAuth 2.0 PAR**.  
- **If you include `scope=openid` or any OIDC parameters →** it’s **OIDC PAR**.

---

## 🧠 Key Benefits

- Prevents long or sensitive URLs.
- Works with RAR (Rich Authorization Requests) and JAR (JWT-secured Auth Requests).
- Reduces risk of parameter tampering.
- Enforces client authentication at request creation.

---

## 🧩 Example Requests

### OAuth 2.0 PAR
```bash
POST /as/par
client_id=api-client
&response_type=code
&scope=api.read api.write
&redirect_uri=https://app.example.com/cb
&state=abc123
```

### OIDC PAR
```bash
POST /as/par
client_id=web-oidc-client
&response_type=code
&scope=openid profile email
&redirect_uri=https://app.example.com/cb
&state=abc123
&nonce=n-0S6_WzA2Mj
&claims={"id_token":{"email":{"essential":true}}}
```

---

## 🔐 PingOne Example Endpoints

| Endpoint | Example |
|-----------|----------|
| **PAR** | `https://auth.pingone.com/<ENV_ID>/as/par` |
| **Authorize** | `https://auth.pingone.com/<ENV_ID>/as/authorize` |
| **Token** | `https://auth.pingone.com/<ENV_ID>/as/token` |
| **Issuer** | `https://auth.pingone.com/<ENV_ID>` |

All use the same base URL; behavior depends on whether `scope=openid` is present.

---

## 🧭 Summary

- **PAR originated from OAuth 2.0 (RFC 9126).**
- **OpenID Connect extends OAuth 2.0**, so PAR naturally supports both protocols.
- You can treat it as a **secure, standard transport mechanism** for sending authorization data, regardless of whether you’re requesting tokens for APIs (OAuth) or user identity (OIDC).

---

**File name:** `PAR_OAuth_vs_OIDC.md`
