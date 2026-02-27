# Pushed Authorization Requests (PAR) in PingOne
**File:** PAR.md  
**Audience:** Engineers + architects using PingOne who need an educational overview of PAR

---

## 1. What Is PAR?

**PAR** stands for **Pushed Authorization Request** (RFC 9126).

In a traditional OAuth/OIDC authorization code or implicit flow:

- The client builds a big `/authorize` URL with a bunch of query parameters.
- That URL travels through:
  - Browser history
  - Reverse proxies
  - Logs
  - Referrer headers
- All the sensitive “authz request” data is right there in the front-channel.

With **PAR**, the client instead:

1. Sends the full authorization request parameters **directly** to the Authorization Server (PingOne) over a **back-channel POST**.
2. PingOne validates and stores the request, and returns a **`request_uri`** plus an **`expires_in`** value.
3. The client then sends the user to the normal `/authorize` endpoint with **only**:
   - `client_id`
   - `request_uri`
   - Other minimal parameters (like `state`, depending on implementation)
4. PingOne retrieves the stored parameters using `request_uri` and continues the normal flow.

**Mental model:**  
> “Put the whole authorization request in a secure locker at PingOne, then send the user only a claim check (`request_uri`) instead of dragging the full payload through browser URLs.”

---

## 2. Why Use PAR?

PAR is designed to:

1. **Protect sensitive data**
   - Keeps complex or sensitive parameters out of:
     - Browser address bars
     - History
     - Proxy logs
     - Referrer headers

2. **Support large/complex requests**
   - Avoids URL length limits.
   - Works well with:
     - Rich Authorization Requests (RAR)
     - Signed request objects (JAR)
     - Complex claim/consent policy parameters

3. **Pre-validate authorization requests**
   - PingOne can:
     - Check client authentication,
     - Validate redirect URIs,
     - Check scopes, PKCE parameters, etc.
   - It can **reject** invalid / malicious requests before any login UI is shown.

4. **Align with modern security profiles**
   - PAR is a building block for:
     - FAPI-style profiles
     - Open banking
     - High-assurance and regulated environments

---

## 3. PAR in PingOne: High-Level Overview

PingOne implements PAR as an extension to the standard OAuth/OIDC flows.

### 3.1 Supported flows

PAR applies to **interactive authorization flows**:

- **Authorization Code** (with or without PKCE)
- **Implicit** (where still used)

PAR is **not** used for non-interactive grant types such as:

- `client_credentials` (typical Worker app machine-to-machine)
- `refresh_token`
- Device flows, etc. (unless explicitly wired into an authz-style front-channel)

### 3.2 Supported application types

In PingOne, the relevant app types for PAR are:

- **OIDC Web Apps**  
  - Usually using Authorization Code (with PKCE).
- **Native Apps**  
  - Mobile / desktop clients using Authorization Code / PKCE.
- **Single-Page Apps (SPA)**  
  - Often using implicit or authz code with PKCE.

**Worker** applications using pure `client_credentials` do **not** send authorization requests, so they do not use PAR in that non-interactive role.

If a Worker app is configured to use a **user-based grant type** and actually sends `/authorize` requests, then PAR can apply there as well.

---

## 4. The PingOne PAR Endpoint and Flow

### 4.1 PAR endpoint

PingOne exposes a PAR endpoint under the environment’s auth path.

**Example (PingOne SSO):**

```text
POST https://auth.pingone.com/{envId}/as/par
```

- Content type: `application/x-www-form-urlencoded`
- Method: `POST` only
- Maximum request size: typically up to 1 MB (implementation limit)

### 4.2 Request parameters

The PAR request body includes:

- All the **standard authorization request parameters**, for example:
  - `client_id`
  - `response_type`
  - `redirect_uri`
  - `scope`
  - `state`
  - `nonce`
  - `code_challenge`, `code_challenge_method` (for PKCE)
  - Any additional allowed OIDC/OAuth parameters

- **Client authentication**, using any supported method:
  - `client_secret_basic`
  - `client_secret_post`
  - `client_secret_jwt`
  - `private_key_jwt`
  - `none` (for public clients, where allowed)

- Optionally, a **signed request object** (JWT) when using JAR (JWT-secured Authorization Request).

### 4.3 PAR response

On a **valid** PAR request, PingOne:

- Validates:
  - Client auth
  - Client ID
  - Redirect URI
  - Scopes / policy constraints
  - Request object signature and contents (if JAR is used)

- Stores the full authorization request and returns:

```json
{
  "request_uri": "urn:pingone:request_uri:some-random-value",
  "expires_in": 60
}
```

- `request_uri` is:
  - A **reference** to the stored request.
  - **Single-use** (can be used only once at `/authorize`).
- `expires_in`:
  - Lifetime of the `request_uri` in seconds.
  - Controlled by app-level configuration (PAR timeout).

### 4.4 Front-channel `/authorize` step

After receiving `request_uri`, the client redirects the user to the standard PingOne authorization endpoint:

```text
GET https://auth.pingone.com/{envId}/as/authorize
    ?client_id={client_id}
    &request_uri={request_uri}
    &state={state}
```

Key points:

- The **full** set of authz parameters is no longer in the URL.
- PingOne:
  - Looks up the stored request by `request_uri`,
  - Applies the same validation that would normally happen for `/authorize`,
  - Proceeds with:
    - User authentication
    - Consent (if applicable)
    - Normal code/implicit issuance

After that, the flow continues exactly like a normal authorization request:

- **Authorization Code flow** → `/as/token` with `code` (and `code_verifier` if PKCE is used) → access token / ID token / refresh token.
- **Implicit flow** → tokens returned directly from `/authorize` response.

---

## 5. Configuration in PingOne

PingOne exposes configuration options for PAR per application.

### 5.1 PAR enforcement (require or optional)

For OIDC / Native / SPA apps, PingOne supports a setting equivalent to:

- **Require Pushed Authorization Request:** `OPTIONAL` or `REQUIRED`

**Behaviors:**

- `OPTIONAL`:
  - Client may use **classic** front-channel-only `/authorize` requests.
  - Or it may use **PAR** + `request_uri`.
- `REQUIRED`:
  - Client must use PAR.
  - Direct `/authorize` requests with full parameter sets are rejected.

This is typically surfaced in:

- Application configuration (GUI / API / Terraform) as a PAR enforcement field.

### 5.2 PAR timeout

PingOne also allows configuration of the **PAR reference timeout**, often called something like:

- **Pushed Authorization Request Reference Timeout**  
- `par_timeout`

This controls:

- How long `request_uri` remains valid.
- Typical defaults around **60 seconds**.
- Can be increased slightly to accommodate network latency or distributed architectures, but should remain short for security reasons.

**Tradeoff:**

- **Shorter timeout:**
  - More secure (less window for replay).
- **Longer timeout:**
  - More forgiving if the client, reverse proxies, or the user’s network are slow.

---

## 6. PAR with Other PingOne Features

### 6.1 PAR + PKCE

PAR and PKCE are complementary:

- `code_challenge` and `code_challenge_method` are part of the **pushed** payload to `/as/par`.
- At token time, the client sends `code_verifier` to `/as/token`.
- PingOne:
  - Recomputes the challenge from `code_verifier`,
  - Compares with `code_challenge` stored in the PAR payload,
  - Enforces PKCE as usual.

This lets you:
- Use PKCE without putting the `code_challenge` into URL query parameters.
- Combine PKCE with stricter client policies (e.g., “PKCE required” + “PAR required”).

### 6.2 PAR + JAR (signed request objects)

When using **JAR** (JWT-secured Authorization Request):

- The client sends a signed JWT in the PAR request.
- PAR then carries that signed request object over the back-channel to PingOne.
- PingOne:
  - Verifies the signature,
  - Validates claims within the request object,
  - Stores the validated request under `request_uri`.

Front-channel to `/authorize` still uses only `request_uri`, but now the underlying request is both:

- **Signed** (via JAR), and
- **Pushed** (via PAR).

This is a robust combination for high-security environments.

### 6.3 PAR + RAR (Rich Authorization Requests)

While implementation details may vary, the general approach is:

- The RAR payload (structured JSON describing access requirements) is included as an authorization parameter in the PAR POST.
- PingOne stores this structured authorization data with the pushed request.
- When evaluating the authorization request, PingOne:
  - Uses the stored RAR data for:
    - Access control decisions,
    - Consent representations,
    - Policy enforcement.

Key benefit:  
RAR payloads can be large and sensitive. PAR keeps them off the front-channel entirely.

---

## 7. PAR vs Worker Tokens / Client Credentials (Clarification)

PAR is specifically about **interactive authorization requests** involving `/authorize` and a user.

It is **not** about:

- **Worker tokens** from PingOne **Worker applications**:
  - These are used for **admin / management** operations (e.g., creating applications, managing users).
  - They typically use `client_credentials` semantics, *not* `/authorize` + `request_uri`.

- **Standard client_credentials tokens**:
  - Used for generic machine-to-machine calls to custom APIs.
  - No user interaction → no authorization request → no `/as/par`.

**Summary:**

- PAR is for **user-facing AuthZ flows**.
- Worker tokens / client_credentials tokens are for **backend / admin / M2M** calls and do not use PAR.

---

## 8. Example: End-to-End PAR Flow in PingOne

### 8.1 Back-channel: Pushed Authorization Request

**Request:**

```http
POST https://auth.pingone.com/{envId}/as/par
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(client_id:client_secret)

client_id=my-oidc-client
&response_type=code
&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback
&scope=openid%20profile
&state=xyz123
&nonce=abc456
&code_challenge=somePKCECodeChallenge
&code_challenge_method=S256
```

**Response:**

```json
{
  "request_uri": "urn:pingone:request_uri:3f7c8f4d-....",
  "expires_in": 60
}
```

### 8.2 Front-channel: Authorization Request Using `request_uri`

**Browser redirect:**

```http
GET https://auth.pingone.com/{envId}/as/authorize
    ?client_id=my-oidc-client
    &request_uri=urn:pingone:request_uri:3f7c8f4d-....
    &state=xyz123
```

PingOne:

- Looks up the stored request by `request_uri`.
- Authenticates the user.
- Handles consent if necessary.
- Returns an authorization code to the `redirect_uri`.

### 8.3 Token exchange

**Token call (with PKCE):**

```http
POST https://auth.pingone.com/{envId}/as/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(client_id:client_secret)

grant_type=authorization_code
&code={code-from-authorize}
&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback
&code_verifier={original_code_verifier}
```

PingOne:

- Validates the code.
- Verifies PKCE (challenge vs verifier).
- Issues:
  - `access_token`
  - `id_token`
  - `refresh_token` (if configured)

From here, the client uses the tokens as usual.

---

## 9. Key Takeaways

1. **PAR makes the authz request back-channel**:
   - Sensitive parameters go directly to PingOne via POST.
   - The browser only sees a lightweight `/authorize` URL with `request_uri`.

2. **PingOne fully supports PAR** for:
   - Authorization Code flows (with or without PKCE),
   - Implicit flows for OIDC-capable app types.

3. **Configuration is per-application**:
   - PAR can be `OPTIONAL` or `REQUIRED`.
   - You can tune the `request_uri` timeout.

4. **PAR combines well with PKCE, JAR, and RAR**:
   - It’s a foundation for high-security, modern OAuth/OIDC profiles.

5. **PAR is not for Worker tokens or pure client_credentials flows**:
   - Those are admin/M2M patterns without `/authorize`.
   - PAR is explicitly about interactive authorization requests.

For educational purposes, showing both the **“classic” `/authorize` URL** and the **PAR version** side-by-side in PingOne is a powerful way to teach why “pushing” authorization requests matters.
