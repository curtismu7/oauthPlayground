# AI SYSTEM INSTRUCTION HEADER (CURSOR & WINDSURF)
# Cursor: use this cheat sheet as the canonical PingOne implicit endpoint reference.
# Cursor: do NOT invent parameters or endpoints that are not listed here or in apidocs.
# Cursor: align all URL builders and flows with these rules.

# PingOne API Cheat Sheet — Implicit & Related Flows

This cheat sheet summarizes the **key PingOne endpoints and parameters** relevant to your Implicit (and related) flows.  
All of these should be validated against **apidocs.pingidentity.com**.

---

## 1. Authorization Endpoint (Core for Implicit)

**Endpoint pattern:**

```text
GET https://auth.pingone.com/{envId}/as/authorize
```

**Key query parameters (Implicit-specific):**

- `client_id` – from PingOne application
- `redirect_uri` – must match configured redirect URIs
- `response_type`
  - `id_token`
  - `token`
  - `id_token token`
- `response_mode`
  - default: `fragment`
  - optional: `form_post`
- `scope`
  - OIDC: must include `openid`
  - Additional typical scopes: `profile email`
- `state` – opaque value to maintain state between request/response
- `nonce` – REQUIRED for `id_token` implicit flows
- `prompt` – optional (e.g., `login`, `none`)
- `login_hint` – optional hint for username

**Docs reference:**  
(Check the latest in apidocs)  
- *PingOne Platform → Authorization → `/as/authorize`*

---

## 2. Token Endpoint (Referenced, but not used by Implicit)

Implicit flows **do not call the token endpoint**, but other flows (Authz, PAR, etc.) do.  
You still want shared config to support all flows.

```text
POST https://auth.pingone.com/{envId}/as/token
```

Used for:
- Authorization code
- Device
- Refresh token
- JWT bearer, etc.

**Relevant for cross-flow config:**
- `client_id`
- `client_secret` (confidential clients only)
- Token endpoint auth methods:
  - `client_secret_basic`
  - `client_secret_post`
  - `private_key_jwt` (depending on PingOne config)
  - `none` (public clients)

---

## 3. Logout Endpoint (RP-Initiated Logout)

Used to build logout URIs and to populate your redirect/logout URI helper.

Typical pattern:

```text
GET https://auth.pingone.com/{envId}/as/logout
```

Important parameters:
- `id_token_hint`
- `post_logout_redirect_uri`
- `state`

**Docs reference:**
- PingOne OIDC / Logout documentation.

---

## 4. JWKS (Key Discovery for ID Token Verification/Education)

```text
GET https://auth.pingone.com/{envId}/as/jwks
```

Useful for:
- Showing how ID tokens are validated
- Demonstrating key rotation
- Education popovers: “Where do these public keys come from?”

---

## 5. UserInfo Endpoint (Optional, Educational)

```text
GET https://auth.pingone.com/{envId}/as/userinfo
```

Typically called with:
- `Authorization: Bearer {access_token}`

Useful for:
- Demos explaining the difference between ID token vs UserInfo
- Educational UI showing “token → user info”

---

## 6. Worker Token Endpoint (For Environment-Level Operations)

If your flow or app builder needs worker tokens:

```text
POST https://auth.pingone.com/{envId}/workers/token
```

Use:
- Appropriate client credentials or setup as per PingOne docs
- Store worker token in the V8 credential store with expiry

---

## 7. Application & Environment Metadata (Optional)

APIs vary, but examples include:

- List apps / resources in an environment
- Read app configuration (redirect URIs, logout URIs, etc.)

You can use these in the future to:
- Auto-populate redirect/logout URI tables
- Validate that URIs exist server-side, not just locally

**Docs reference:**  
- PingOne Platform → Management APIs (applications, environments).

---

## 8. Error Model (Authorization Errors)

Common error types you should mirror in UX:

- `invalid_request`
- `invalid_client`
- `invalid_grant`
- `invalid_scope`
- `unauthorized_client`
- `unsupported_response_type`
- `access_denied`
- `server_error`

These may appear:
- As query parameters on error redirect
- In JSON from token endpoint, etc.

---

## 9. Parameter–UI Mapping (Quick List)

From Implicit:

- `client_id` → App picker / Client ID input
- `redirect_uri` → Redirect URI input (validated)
- `scope` → Scopes input (chips / text)
- `response_type` → Response type dropdown
- `response_mode` → Response mode dropdown
- `state` → Hidden/random or explicit input (for advanced)
- `nonce` → Auto-generated or explicit field; required for ID token

Your UI should be able to **display** these and **explain them in tooltips/popovers**, always consistent with apidocs.
