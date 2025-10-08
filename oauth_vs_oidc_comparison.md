# OAuth 2.0 vs OpenID Connect (OIDC)

## 🔐 Overview

| Standard | Primary Purpose | Layer of Functionality | Defined By |
| -------- | --------------- | ---------------------- | ---------- |
|          |                 |                        |            |

| **OAuth 2.0**             | **Delegated Authorization** — allows a client app to access resources on behalf of a user  | **Authorization Layer**                      | IETF (RFC 6749, 6750) |
| ------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------- | --------------------- |
| **OpenID Connect (OIDC)** | **Federated Authentication** — verifies the user’s identity and provides user profile info | **Identity Layer built on top of OAuth 2.0** | OpenID Foundation     |

---

## 🧭 Core Difference

- **OAuth 2.0** says:\
  “You can access this user’s data if they grant you permission.”

- **OIDC** says:\
  “You can access this user’s data *and* I’ll tell you who they are.”

OIDC **extends** OAuth 2.0 by adding an **authentication layer**, standardizing how identity information (like who the user is) is conveyed via an **ID Token**.

---

## 🧱 Key Components

| Feature                     | OAuth 2.0                                           | OpenID Connect                                                          |
| --------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| **Purpose**                 | Delegates access to resources (authorization)       | Authenticates the user (identity)                                       |
| **Tokens Used**             | Access Token (optional Refresh Token)               | ID Token (JWT) + Access Token (+ optional Refresh Token)                |
| **User Identity**           | Not defined — OAuth doesn’t confirm who the user is | Defined via ID Token and UserInfo endpoint                              |
| **Protocol Layer**          | Authorization framework                             | Identity layer built on OAuth 2.0                                       |
| **Endpoints**               | `/authorize`, `/token`, (resource server APIs)      | `/authorize`, `/token`, `/userinfo`, `/discovery`, `/jwks`              |
| **Scopes**                  | Arbitrary (e.g., `read`, `write`, `email`)          | Includes `openid` (required) and optional `profile`, `email`, `address` |
| **Response Types**          | `code`, `token`                                     | `code`, `id_token`, `id_token token`, `code id_token` (Hybrid flows)    |
| **Specification Authority** | IETF                                                | OpenID Foundation (extends OAuth 2.0)                                   |

---

## 🚦 Example Use Cases

| Scenario                                                 | Recommended Standard                         |
| -------------------------------------------------------- | -------------------------------------------- |
| Allowing an app to access your calendar on your behalf   | **OAuth 2.0**                                |
| Signing in to an app with your Google or PingOne account | **OIDC**                                     |
| API-to-API access without user context                   | **OAuth 2.0 (Client Credentials Flow)**      |
| Mobile app login using identity tokens                   | **OIDC (Authorization Code Flow with PKCE)** |

---

## 🧩 Token Example

**OAuth 2.0 Access Token**

```json
{
  "scope": "calendar.read",
  "exp": 1735267200,
  "client_id": "abc123"
}
```

**OIDC ID Token**

```json
{
  "sub": "user-123",
  "name": "Curtis Muir",
  "email": "curtis@domain.com",
  "iss": "https://auth.pingone.com",
  "aud": "my-client-id",
  "exp": 1735267200
}
```

---

## 🧠 Summary Analogy

| Analogy              | OAuth 2.0                               | OIDC                                                |
| -------------------- | --------------------------------------- | --------------------------------------------------- |
| **Driver’s License** | Lets someone drive a car on your behalf | Confirms *who* the driver is                        |
| **Hotel Access**     | Gives you a room key (access)           | Confirms your identity at check-in (authentication) |

---

## 🏁 TL;DR

- **OAuth 2.0 = Authorization Framework**\
  → “Can this app do *X* on the user’s behalf?”

- **OIDC = Authentication Layer on top of OAuth 2.0**\
  → “Who is this user, and are they authenticated?”

