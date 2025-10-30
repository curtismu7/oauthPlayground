# PingOne Redirectless (`response_mode=pi.flow`) — Do We Still Do Code Exchange?

## 🔍 Short Answer

✅ **Yes — you still perform a code exchange** *if* you are using `response_type=code`.

Even in Redirectless (`pi.flow`) mode, the PingOne Authorization Server issues an **authorization code**, and your backend must still exchange it at `/as/token` to obtain tokens.

---

## ⚙️ How It Works

### 1️⃣ Authorization (Flow Initialization)
```http
POST https://auth.pingone.com/{envId}/as/authorize
Content-Type: application/x-www-form-urlencoded

response_type=code
&response_mode=pi.flow
&client_id=YOUR_CLIENT_ID
&scope=openid profile
&code_challenge=XYZ
&code_challenge_method=S256
```

Instead of redirecting the browser, PingOne returns a **flow object (JSON)**:
```json
{
  "flowId": "abc123",
  "actions": [
    { "name": "USERNAME_PASSWORD_REQUIRED" }
  ]
}
```

This tells your app how to drive the authentication UI via PingOne’s **Flows API**.

---

### 2️⃣ Flow Execution (Credentials Step)
Your app interacts with the PingOne **Flows API** to collect credentials and complete login steps.

Example:
```http
POST https://auth.pingone.com/{envId}/flows/{flowId}
Content-Type: application/json

{
  "action": "usernamePassword.check",
  "username": "jdoe",
  "password": "s3cret"
}
```
PingOne authenticates the user and advances the flow (MFA, consent, etc.).

---

### 3️⃣ Resume Flow (Get Authorization Code)

After successful authentication, call:
```http
GET https://auth.pingone.com/{envId}/as/resume?flowId={flowId}
```

PingOne responds with either:
- a **302 redirect** with `?code=abc123` and `state=xyz`, or  
- a **JSON response** (if you also set `response_mode=pi.flow` here) containing the code.

---

### 4️⃣ Exchange the Code for Tokens

The **code exchange** is identical to standard Authorization Code flow:

```bash
curl -X POST "https://auth.pingone.com/{envId}/as/token"   -H "Content-Type: application/x-www-form-urlencoded"   -d "grant_type=authorization_code"   -d "code=abc123"   -d "client_id=YOUR_CLIENT_ID"   -d "code_verifier=YOUR_CODE_VERIFIER"
```

If confidential client:
```bash
-H "Authorization: Basic BASE64(client_id:client_secret)"
```

---

## 🧩 Example Sequence

| Step | Endpoint | Purpose | Password Sent? |
|------|-----------|----------|----------------|
| 1 | `/as/authorize` (with `pi.flow`) | Start flow | ❌ |
| 2 | `/flows/{flowId}` | User login | ✅ |
| 3 | `/as/resume?flowId={flowId}` | Get authorization code | ❌ |
| 4 | `/as/token` | Exchange code for tokens | ❌ |

---

## 🧠 Important Distinctions

- `response_mode=pi.flow` changes **how responses are delivered**, not **the OAuth semantics**.
- `/as/token` is **always required** when `response_type=code`.
- If you use `response_type=id_token` or `token`, then tokens are returned directly (no code exchange).

---

## ✅ Summary Table

| Mode | Code Exchange Required? | Description |
|------|--------------------------|--------------|
| `response_mode=query` | ✅ Yes | Browser redirect with `code` |
| `response_mode=form_post` | ✅ Yes | Form POST with `code` |
| `response_mode=pi.flow` + `response_type=code` | ✅ Yes | Redirectless JSON flow, still uses code exchange |
| `response_mode=pi.flow` + `response_type=id_token` or `token` | ❌ No | Redirectless implicit flow |

---

## 🏁 TL;DR

Even in PingOne's **Redirectless (`pi.flow`)** mode, you still perform a **code exchange** if you requested `response_type=code`.  
The Redirectless flow just moves the **user interaction** (username/password, MFA, etc.) into your app using PingOne's APIs — but **OAuth semantics remain identical**.
