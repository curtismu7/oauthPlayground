# PingOne `response_mode=pi.flow` (Redirectless OAuth/OIDC)

**Date:** 2025-10-08  
**Author:** He who talks the most  
**Version:** 1.0.0  

---

## 🔍 Overview

`response_mode=pi.flow` is a **Ping Identity–specific response mode** used in OAuth 2.0 and OpenID Connect to enable **redirectless authorization flows**.  
Instead of performing browser redirects to PingOne's authorization endpoint, the client app interacts **directly via API** — ideal for embedded, mobile, or desktop experiences.

This mode lets the client app:
- Start and drive the authentication experience via API calls.
- Avoid front-channel browser redirects entirely.
- Securely receive authorization responses within the same session context.

---

## ⚙️ When to Use `pi.flow`

- Native and **mobile apps** where you can’t or don’t want to redirect to an external browser.  
- **Thick clients** or **desktop applications** needing OAuth/OIDC tokens without browser context.  
- **Embedded or SDK-driven flows** that handle login UX within the application (such as identity-first or step-up flows).  
- Used by **PingOne Auth APIs** and **PingOne Flow APIs** to provide seamless in-app authentication.

---

## 🧩 How It Works

1. **App initiates flow**
   - Calls `/as/authorize` or Flow API endpoint with `response_mode=pi.flow`.
   - Includes usual OAuth parameters (`client_id`, `response_type`, `scope`, `state`, etc.).

2. **Server returns flow handle**
   - Instead of redirecting, PingOne responds with a **flow object** containing `id`, `status`, and next steps.

3. **Client continues the flow**
   - The app polls or follows the **Flow API** to handle login steps (e.g., username/password, MFA, consent).

4. **Tokens returned directly**
   - Upon completion, the final **authorization result** (authorization code or tokens) is returned **via API**, not via browser redirect.

---

## 🧠 Conceptual Example

### Step 1️⃣ — Initiate Authorization
```http
POST https://auth.pingone.com/{envId}/as/authorize
Content-Type: application/x-www-form-urlencoded

client_id=myclient
&response_type=code
&scope=openid profile email
&response_mode=pi.flow
&code_challenge=abc123
&code_challenge_method=S256
```

### Step 2️⃣ — PingOne Responds
```json
{
  "flow": {
    "id": "pi.flow.5f9a9d67-bd9e-48b5-9b13-d15c41a6b90b",
    "status": "IN_PROGRESS",
    "next": "https://auth.pingone.com/{envId}/flows/pi.flow.5f9a9d67-bd9e-48b5-9b13-d15c41a6b90b"
  }
}
```

### Step 3️⃣ — Client Drives Flow
The app continues the flow using PingOne’s Flow API, providing user input for login, MFA, etc.

### Step 4️⃣ — Authorization Complete
When authentication succeeds, the final step returns the tokens (authorization code or ID/access tokens) directly to the client.

---

## ✅ Benefits

| Category | Advantage |
|-----------|------------|
| Redirectless | Works entirely via API, no browser navigation required |
| Seamless UX | Embeds PingOne authentication steps in your app |
| Security | Avoids front-channel redirects and URL leakage |
| Developer control | Enables flexible handling of steps and policies |
| Integration | Works with PingOne Flow API, Auth API, and DaVinci policies |

---

## 🔐 Integration Notes for PingOne

- **Supported by:** PingOne Authentication API / Flow API  
- **Parameter:** `response_mode=pi.flow`  
- **Redirect URI:** Not required  
- **Flows supported:** Authorization Code Flow, PKCE, Device Authorization, some Hybrid variants  
- **Typical endpoint:**  
  `https://auth.pingone.com/{environmentId}/as/authorize`  
- **Tokens retrieved:** via back-channel (not via browser redirect)  

---

## ⚠️ Key Considerations

- `pi.flow` is **Ping-specific** — it is *not part of the OAuth 2.0 or OIDC standards*.  
- It must be enabled and supported by your PingOne environment.  
- Token response format and steps depend on your **Flow configuration** and **Auth policies**.  
- Ideal for DaVinci or custom app experiences where full browser redirect UX is not desired.  

---

## 🧠 Summary

`response_mode=pi.flow` is a **PingOne proprietary redirectless flow** that provides in-app authorization UX and direct token retrieval through PingOne APIs.  
It is a cornerstone of modern app experiences that need embedded login flows without losing OAuth/OIDC compliance.

**Recommended Use:**  
Use `pi.flow` in secure client environments (mobile, native, or SDK-based) where redirect-based authorization isn’t feasible.

---

**References**
- [PingOne Authentication API Docs](https://docs.pingidentity.com/)  
- [PingOne Flow API Overview](https://docs.pingidentity.com/)  
- [PingOne Redirectless Authentication Overview (pi.flow)](https://docs.pingidentity.com/)  
- [OAuth 2.0 & OIDC Core Specifications](https://openid.net/specs/openid-connect-core-1_0.html)
