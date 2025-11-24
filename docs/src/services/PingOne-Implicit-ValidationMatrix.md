---

## 3) `PingOne-Implicit-ValidationMatrix.md`

```markdown
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