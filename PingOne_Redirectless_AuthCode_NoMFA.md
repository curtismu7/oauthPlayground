# PingOne Redirectless (pi.flow) — Authorization Code Flow Without Redirects

## Overview

This example demonstrates **Authorization Code + PKCE** flow using PingOne’s **redirectless mode (`response_mode=pi.flow`)**, where your app hosts the login UI.  
There are **no browser redirects** — your app drives the entire authentication journey.

---

## 🧭 Key Principles

- Your app presents the **login UI**.
- PingOne controls the **authentication state** using a **flowId**.
- You collect **username/password once**, then send them **directly to PingOne’s Flows API**.
- You **never** send credentials to your own backend.
- The **code exchange** step remains exactly the same as normal Authorization Code flow.

---

## 1️⃣ Start Authorization Flow

**Front-end → PingOne**

```http
POST https://auth.pingone.com/{envId}/as/authorize
Content-Type: application/x-www-form-urlencoded

response_type=code
&response_mode=pi.flow
&client_id={CLIENT_ID}
&scope=openid%20profile%20email
&state={RANDOM_STATE}
&code_challenge={PKCE_CODE_CHALLENGE}
&code_challenge_method=S256
```

**PingOne Response (JSON):**
```json
{
  "flowId": "flw_abc123",
  "status": "IN_PROGRESS",
  "actions": [
    { "name": "USERNAME_PASSWORD_REQUIRED" }
  ]
}
```

The `flowId` identifies the user’s authentication session.

---

## 2️⃣ Present Login Form and Send Credentials to PingOne

Your app shows a username/password form. When the user submits, send credentials **directly to PingOne** (never your backend):

```http
POST https://auth.pingone.com/{envId}/flows/flw_abc123
Content-Type: application/json

{
  "action": "usernamePassword.check",
  "username": "curtis",
  "password": "SuperSecret!"
}
```

PingOne validates the credentials and updates the flow.  
If authentication succeeds, you’ll get a response with `status=READY_TO_RESUME`.

**Important:**  
✅ Send credentials only to PingOne.  
🚫 Never store or log passwords.  
🚫 Never send them to `/as/token` or your backend.

---

## 3️⃣ Resume to Obtain Authorization Code

After credentials are validated, finalize the flow:

```http
GET https://auth.pingone.com/{envId}/as/resume?flowId=flw_abc123
```

PingOne responds with:
- A redirect-style `Location` header containing the **authorization code**, or  
- A JSON payload with `{ "code": "abc123", "state": "xyz" }` (if configured for JSON return).

Extract the `code` and `state`.

---

## 4️⃣ Backend Exchanges Code for Tokens

Your backend calls `/as/token` to retrieve tokens — **no username/password here**.

```bash
curl -X POST "https://auth.pingone.com/{envId}/as/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "grant_type=authorization_code"   -d "code={AUTH_CODE}"   -d "client_id={CLIENT_ID}"   -d "code_verifier={PKCE_CODE_VERIFIER}"
```

For confidential clients:
```bash
-H "Authorization: Basic BASE64(client_id:client_secret)"
```

**PingOne Response:**
```json
{
  "access_token": "eyJ...",
  "id_token": "eyJ...",
  "refresh_token": "....",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## 5️⃣ Token Usage

- Include the `access_token` in your API calls as:
  ```http
  Authorization: Bearer eyJ...
  ```
- Parse the `id_token` for user claims if needed.
- Store tokens securely (server session or HttpOnly cookies).

---

## 🔐 Security Best Practices

| Rule | Description |
|------|--------------|
| ✅ **Send credentials only to PingOne** | Use HTTPS, never proxy or store them. |
| ✅ **Use PKCE** | Always for public clients (mobile/SPAs). |
| ✅ **Validate `state`** | Protect against CSRF attacks. |
| ✅ **Enforce HTTPS** | Required for all endpoints. |
| ✅ **Minimal Scopes** | Request only what’s needed (e.g., `openid profile`). |

---

## 🧠 Summary

| Step | Endpoint | Includes Password? | Purpose |
|------|-----------|--------------------|----------|
| 1 | `/as/authorize` (with `pi.flow`) | ❌ | Start flow |
| 2 | `/flows/{flowId}` | ✅ | User authentication |
| 3 | `/as/resume?flowId={flowId}` | ❌ | Get authorization code |
| 4 | `/as/token` | ❌ | Code exchange for tokens |

---

## 🏁 TL;DR

- Collect username/password **once** in your hosted UI.  
- Send them **directly to PingOne’s Flows API**.  
- **Never** touch passwords on your backend.  
- **Resume** the flow to get a code.  
- **Exchange** that code for tokens securely on your backend.

This is the **redirectless equivalent** of the Authorization Code + PKCE flow, keeping your app fully in control of UX while maintaining PingOne’s security model.
