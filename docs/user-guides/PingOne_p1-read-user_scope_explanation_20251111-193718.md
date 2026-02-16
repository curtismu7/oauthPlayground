# Understanding `p1:read:user` Scopes in PingOne SSO

**Date:** 2025-11-11 19:37  

---

## 🧠 Is `p1:read:user` a Real Scope in PingOne SSO?

**Short answer:** No — `p1:read:user` is **not a standard scope** in PingOne SSO (the authorization server used for user authentication).  
It’s a **management API scope**, not an OpenID Connect (OIDC) login scope.

---

## ⚙️ Scope Categories in PingOne

| Context | Scope Type | Example | Purpose |
|----------|-------------|----------|----------|
| **PingOne Platform API (Admin)** | **p1:read:user**, **p1:write:user**, etc. | `p1:read:population`, `p1:update:user` | Used by Worker tokens or service accounts calling PingOne Admin APIs. |
| **PingOne SSO (OIDC)** | **User consent / identity scopes** | `openid`, `profile`, `email`, `address`, `phone`, `offline_access` | Used for user login, token issuance, and OIDC claims. |

---

## 🔍 Why You Might See `p1:read:user` in Your Tokens

1. **App registered as a Worker or Management Client**  
   Worker tokens use `p1:*` scopes to call PingOne’s admin APIs.  

2. **Your OIDC app is configured to use an API resource**  
   In PingOne’s **Resources** tab, if you selected *PingOne API*, the platform automatically injects `p1:*` management scopes.

3. **Mixed Audiences**  
   You might be mixing PingOne SSO (OIDC) and PingOne Platform (Admin) audiences:  
   - `aud=https://auth.pingone.com/{envId}/as` → SSO / ID token audience  
   - `aud=https://api.pingone.com/{envId}` → PingOne Platform API audience  

---

## ✅ How to Fix It (for Standard SSO)

If your goal is normal **user authentication / login**:

1. In the **App configuration**, under **Resources**, choose **OpenID Connect**, not **PingOne API**.  
2. Set your scopes to:
   ```
   openid profile email offline_access
   ```
3. Re-authorize your app. You’ll now see tokens with claims like `sub`, `name`, `email`, and **no p1:*** scopes.

---

## 🧩 If You Actually Need to Manage Users

If you need to call the **PingOne Management APIs** (to create, update, or query users):

| Goal | Scopes | Flow | Token Type |
|------|---------|------|-------------|
| **Manage users via API** | `p1:read:user`, `p1:update:user` | Client Credentials | Worker Access Token |
| **Authenticate users (OIDC)** | `openid profile email offline_access` | Authorization Code + PKCE | ID + Access Tokens |

Use **Worker apps** and **Client Credentials Flow** for management, not end-user login.

---

## 🧠 Summary

| Situation | Scope | Where it Belongs |
|------------|--------|------------------|
| User login | `openid profile email` | PingOne SSO (OIDC) |
| Background service (admin) | `p1:read:user` | PingOne API (Platform) |
| Combined login + management (avoid) | `openid + p1:read:user` | ❌ Mixed context, not supported |

---

### ✅ TL;DR

> **`p1:read:user`** is real, but only for the **PingOne Platform API**, not for **PingOne SSO (OIDC)**.  
> If you’re seeing it in normal login tokens, your app is referencing the wrong resource or audience.

---

*© 2025 Internal Education — PingOne Scope Clarification*
