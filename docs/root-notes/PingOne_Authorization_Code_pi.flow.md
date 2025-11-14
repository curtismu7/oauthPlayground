# PingOne SSO — Authorization Code Flow (Redirectless `response_mode=pi.flow`)

## Overview

In **PingOne redirectless mode (`response_mode=pi.flow`)**, the user still enters credentials *before* the code exchange.  
However, instead of using browser redirects, your application orchestrates the flow using PingOne’s **Flows** or **Authentication API**.

Your app never directly sends username or password to `/as/token`.  
The token exchange only happens after authentication succeeds.

---

## Step-by-Step Flow

### 1️⃣ Start Authorization (Request a Flow)

**POST** request:
```http
POST https://auth.pingone.com/{envId}/as/authorize
Content-Type: application/x-www-form-urlencoded

response_type=code
&client_id=...
&scope=openid%20profile
&response_mode=pi.flow
&code_challenge=...
&code_challenge_method=S256
&state=...
```

🔹 PingOne returns a **flow** (in JSON), not a redirect.  
This flow will guide your app through authentication steps.

---

### 2️⃣ Drive the Sign-On UI (User Enters Username & Password)

Your app uses the **flow ID** returned from step 1 and interacts with PingOne’s
**Flows API** or **Authentication Actions API** to render and complete login prompts.

Example actions:
- `USERNAME_PASSWORD_REQUIRED` → prompt user
- `POST /flows/{flowId}` → with collected username/password

This is where the **credentials are validated** — handled by PingOne.  
Your app never directly sees or stores the password.

---

### 3️⃣ Resume to Get Authorization Code

When the flow completes successfully:

```http
GET https://auth.pingone.com/{envId}/as/resume?flowId={flowId}
```

PingOne responds with a **Location header** containing the **authorization code**.

Example:
```
HTTP/1.1 302 Found
Location: https://yourapp.example.com/callback?code=abc123&state=xyz
```

---

### 4️⃣ Exchange the Code for Tokens

**POST** to `/as/token` (no user credentials here):

```bash
curl -X POST "https://auth.pingone.com/{envId}/as/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "grant_type=authorization_code"   -d "code=abc123"   -d "client_id=YOUR_CLIENT_ID"   -d "code_verifier=YOUR_CODE_VERIFIER"
```

Confidential clients authenticate with:
```bash
-H "Authorization: Basic BASE64(client_id:client_secret)"
```

---

## Key Takeaways

✅ **Username & password are entered before code exchange** — in step 2 via PingOne Flows API.  
🚫 **Never** include them in `/as/token`.  
⚙️ The `/as/token` exchange only uses the authorization code + client/PKCE credentials.  
🔒 Your app remains passwordless and standards-compliant.

---

## Notes

- `response_mode=pi.flow` allows you to host custom UIs while keeping authentication logic inside PingOne.
- `redirect_uri` may not be required depending on configuration.
- Works with PKCE for public clients or with `client_secret_basic` / `private_key_jwt` for confidential clients.

---

**TL;DR:**  
In `response_mode=pi.flow`, username/password are collected during PingOne’s flow actions **before** `/as/token`.  
The code exchange still follows normal Authorization Code flow rules — no credentials ever sent to the token endpoint.
