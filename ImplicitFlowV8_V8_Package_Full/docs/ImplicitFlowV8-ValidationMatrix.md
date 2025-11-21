# AI SYSTEM INSTRUCTION HEADER (CURSOR & WINDSURF)
# Cursor: this matrix is the contract between PingOne apidocs and the ImplicitFlowV8 UI.
# Cursor: all validation and error handling must follow these rules.
# Cursor: do NOT remove or relax these validations without explicit human approval.

# PingOne Implicit Validation Matrix  
### apidocs → UI Components Mapping (V8)

> This matrix connects PingOne API requirements (from apidocs) to your **UI fields, validation rules, and error states** in ImplicitFlowV8.

---

## 1. Authorization Endpoint: `/as/authorize`

**Endpoint:**  
`GET https://auth.pingone.com/{envId}/as/authorize`

| Parameter       | Required?                  | UI Element / Component                      | Validation Rules                                                                                              | Error / UX Behavior                                                                                       |
|----------------|---------------------------|----------------------------------------------|---------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `client_id`    | Yes                       | App picker + Client ID text input           | Non-empty. Must match client ID of selected PingOne app.                                                     | Show inline error if empty. Show warning if changed from stored app.                                     |
| `redirect_uri` | Yes (for OAuth/OIDC)      | Redirect URI text input                     | Non-empty. Must match one of known redirect URIs for selected app (from store or config table).              | Inline error if empty. Warning if not in known list. Educational popup: “This must match app config.”    |
| `response_type`| Yes                       | Response Type dropdown                      | Must be one of: `id_token`, `token`, `id_token token`.                                                        | Disable “Build URL” if invalid combination. Clear copy explaining each option.                           |
| `response_mode`| Optional (default=fragment)| Response Mode dropdown / advanced field     | If omitted, assume `fragment`. If `form_post`, explain it via tooltip.                                       | If user chooses unsupported mode, show validation error before building URL.                             |
| `scope`        | Yes (for OIDC)            | Scopes text input / chip selector           | Must include `openid` for ID token usage. No invalid characters.                                             | Warn if `openid` missing while response_type includes id_token. Tooltip: OIDC vs OAuth scopes.          |
| `state`        | Recommended               | Hidden generated field or optional input    | Should be random, opaque. If user provides, no constraints beyond length.                                   | If user wants advanced, show field + explanation. If omitted, auto-generate for UX realism.             |
| `nonce`        | REQUIRED for id_token     | Hidden generated field or optional input    | Required when `response_type` includes `id_token`. Must be random.                                           | Auto-generate and show in a tooltip; error if building URL without nonce when id_token is selected.     |
| `prompt`       | Optional                  | Advanced dropdown / multi-select            | Must be one or more allowed values (`login`, `consent`, `none`, etc.).                                      | Only show in advanced panel. Validate against allowed values.                                           |
| `login_hint`   | Optional                  | Optional advanced text field                | Free-form but recommended to be email/username.                                                             | Show only in advanced. No strict validation.                                                            |

---

## 2. Implicit Fragment Format

**Returned fragment example:**

```text
#id_token=...&access_token=...&expires_in=3600&token_type=Bearer&state=xyz
```

| Field         | Source            | UI Element                     | Validation Rules                                                                            | UX Behavior                                                                                  |
|--------------|-------------------|--------------------------------|---------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| `id_token`   | From fragment     | TokenDisplayV8 (ID Token slot) | Must be a well-formed JWT (3 segments).                                                    | Button: Decode. Show header/payload JSON. Show error if malformed or missing.               |
| `access_token`| From fragment    | TokenDisplayV8 (Access slot)   | Opaque or JWT depending on config; do not assume structure.                                | Copy-only. Optionally show “opaque token” explanation.                                      |
| `expires_in` | From fragment     | TokenDisplayV8 meta info       | Should parse to integer (seconds).                                                         | Show remaining seconds; optionally convert to minutes in tooltip.                           |
| `token_type` | From fragment     | TokenDisplayV8 meta info       | Typically `Bearer`.                                                                        | If missing, show default; if unexpected, show tooltip explaining uncommon token types.      |
| `state`      | From fragment     | Hidden / advanced debug panel  | Must match original state if provided.                                                     | If mismatch with stored state, show security warning; educational popover about CSRF.       |

---

## 3. Worker Token Endpoint: `/workers/token`

**Endpoint:**  
`POST https://auth.pingone.com/{envId}/workers/token`

| Aspect              | UI / Service Component                        | Validation / Behavior                                                                                   |
|---------------------|-----------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `envId`             | From App Config / Credential Store            | Must be non-empty and valid PingOne environment ID.                                                     |
| Credentials         | CredentialStoreV8                             | Only retrieved when no valid worker token exists or expired.                                            |
| Worker Token        | Stored in CredentialStoreV8                   | Must have expiry recorded (from token claims or TTL from response).                                     |
| Reuse Logic         | Shared across flows (Authz, PAR, Implicit)    | Always reuse until expiry; never prompt user again while valid.                                         |
| Error Handling      | Show unobtrusive warnings on worker token failure | Educational tooltip: “Worker token is used for environment-level operations; not required for implicit itself.” |

---

## 4. UI Components → Docs References

| UI Component               | Purpose                                         | Docs Section (apidocs)                                      |
|---------------------------|-------------------------------------------------|-------------------------------------------------------------|
| App Picker                | Choose PingOne app config                       | Application / Environment management APIs (Platform)        |
| Client ID Input           | Authz client_id                                 | Authorization endpoint (`/as/authorize`)                    |
| Redirect URI Input        | Authz redirect_uri                              | Authorization endpoint + App config docs                    |
| Response Type Dropdown    | id_token / token / both                         | OIDC/OAuth authorization docs                               |
| Response Mode Dropdown    | fragment / form_post                            | Authorization endpoint docs                                 |
| Scopes Input              | scope parameter                                 | OIDC scopes & claims docs                                   |
| TokenDisplayV8            | Show tokens from implicit                       | OIDC ID Token / Access Token docs                           |
| LearnMoreSection          | Deep dive into flows & security                 | Conceptual sections (OIDC, OAuth, Implicit vs PKCE)         |

Use this matrix to keep Cursor/Windsurf from drifting away from the **actual PingOne contract**.
