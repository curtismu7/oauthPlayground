# PAR (Pushed Authorization Request) for OIDC

**Date:** 2025-10-08  
**Author:** He who talks the most  
**Version:** 1.0.0  

---

## 🔍 Overview

**PAR (Pushed Authorization Request)** is an enhancement to OAuth 2.0 and OpenID Connect that improves security and reliability during the authorization process.  
It allows clients to **push the authorization request parameters directly to the Authorization Server** via a secure back-channel, instead of passing them through the user’s browser as URL query parameters.

This prevents:
- Exposure of sensitive data (like scopes or client IDs) in browser URLs  
- Manipulation of parameters by the user or malicious actors  
- URL length limitations and encoding issues

---

## ⚙️ How PAR Works in OIDC

1. **Client → Authorization Server (Back-Channel POST):**  
   The client sends the authorization request parameters (e.g., client_id, redirect_uri, scope, state, etc.) directly to the server using a **`POST /par`** endpoint.

2. **Authorization Server → Client (Response):**  
   The server validates the request and responds with a **`request_uri`** — a short, opaque reference to the stored parameters.

3. **Client → Authorization Endpoint (Front-Channel GET):**  
   The client then redirects the user’s browser to the standard **`/authorize`** endpoint, but instead of including all parameters, it includes **only the `request_uri`**.

4. **Authorization Server → Browser:**  
   The Authorization Server retrieves the parameters associated with that `request_uri` and proceeds with the normal OIDC authorization flow (including login and consent screens).

---

## ✅ Benefits of Using PAR

| Feature | Without PAR | With PAR |
|----------|--------------|----------|
| Parameter security | Parameters visible in URL | Parameters securely stored server-side |
| Request integrity | User can modify query params | Params validated server-side only |
| URL length limit | May exceed browser limits | Compact URL with short `request_uri` |
| Compatibility | Basic OAuth/OIDC | Fully compatible with all OIDC flows |

---

## 🧩 Example PAR Flow

### 1️⃣ Client Sends Pushed Request
```http
POST /as/par HTTP/1.1
Host: auth.pingone.com
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

client_id=acme-client-123
&redirect_uri=https%3A%2F%2Fapp.acme.com%2Fcallback
&response_type=code
&scope=openid%20profile%20email
&state=af0ifjsldkj
```

### 2️⃣ Authorization Server Responds
```json
{
  "request_uri": "urn:pingone:par:847dj39dk20f9skd",
  "expires_in": 90
}
```

### 3️⃣ Client Redirects Browser
```http
GET /as/authorize?client_id=acme-client-123
&request_uri=urn:pingone:par:847dj39dk20f9skd
```

### 4️⃣ User Authenticates and Consents
PingOne retrieves the stored request and completes the authorization.

---

## 🔐 Integration Notes for PingOne

- **Endpoint:** `https://auth.pingone.com/{environmentId}/as/par`
- **Authentication:** Client credentials (Basic or private_key_jwt)
- **Use Cases:** Works with OIDC Authorization Code Flow, Hybrid Flow, and PAR+PKCE combinations
- **Requires:** PAR enabled for your application in PingOne console under *Authorization Settings*

---

## 🧠 Summary

PAR ensures:
- Greater **security** through back-channel transmission  
- Improved **integrity** of authorization requests  
- Cleaner **URLs** and easier debugging  
- Seamless **compatibility** with OpenID Connect and PingOne  

**Recommended Use:** Always enable PAR for production OIDC clients, especially those handling sensitive scopes or mobile/native flows.

---

**References**
- [RFC 9126 – OAuth 2.0 Pushed Authorization Requests](https://datatracker.ietf.org/doc/html/rfc9126)
- [OpenID Connect Core Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [Ping Identity PAR Documentation](https://docs.pingidentity.com/)
