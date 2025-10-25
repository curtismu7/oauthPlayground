# OIDC / OAuth2 Token Exchange — Advanced Parameters, Examples, and UI

**Purpose:** Go beyond `scope` during the `/token` exchange and explicitly control **audience**, **claims**, **RAR**, **token type**, **delegation**, and **client authentication**. Includes runnable **cURL**, **Node/Express** handlers, and a **React** UI form design.

---

## 1) What You Can Control (Beyond `scope`)

| Parameter | Applies To | Purpose / Effect | Notes |
|---|---|---|---|
| `grant_type` | All | Determines the exchange type (`authorization_code`, `refresh_token`, `urn:ietf:params:oauth:grant-type:token-exchange`) | Must match flow |
| `code` | Authz Code | One-time code from `/authorize` | Required for code flow |
| `redirect_uri` | Authz Code | Must match registration | Anti-interception |
| `code_verifier` | PKCE | Proof for public clients | Always use S256 |
| `client_assertion` + `client_assertion_type` | Confidential | Private Key JWT / Client Secret JWT | Prefer **Private Key JWT** |
| `client_id`, `client_secret` | Confidential | Secret-based auth (basic/post) | Avoid for browsers |
| `resource` (audience) | Access Token | Request token audience (RS) | Repeatable param |
| `audience` | Access Token | Alternate audience param (provider-specific) | Some vendors |
| `requested_token_type` | RFC 8693 Exchange | Ask for `access_token`, `id_token`, `refresh_token`, or `urn:ietf:params:oauth:token-type:jwt` | Token Exchange only |
| `subject_token`, `actor_token` (+ types) | RFC 8693 Exchange | Delegation / impersonation | Powerful; protect strictly |
| `claims` | OIDC | Add structured claims to **ID Token** or **UserInfo** | JSON object |
| `authorization_details` | RAR | Fine‑grained consent context | JSON array |
| `resource` (multiple) | Resource Indicators | Multiple APIs per token | Supported by many AS |
| `include_claims` / policy hints | Provider | Ask AS for enrichment | Provider-specific |
| `refresh_token` | Refresh | New access token (and ID token if OIDC server issues one) | Rotation recommended |

---

## 2) cURL — Authorization Code → Tokens (with Audience, PKCE, Claims, RAR)

```bash
AS="https://auth.pingone.com/<ENV_ID>"
TOKEN="$AS/as/token"
CLIENT_ID="<client_id>"
CODE="<authz_code>"
REDIRECT_URI="https://app.example.com/cb"
CODE_VERIFIER="<your_pkce_code_verifier>"

curl -s -X POST "$TOKEN" \
 -H "Content-Type: application/x-www-form-urlencoded" \
 --data-urlencode "grant_type=authorization_code" \
 --data-urlencode "code=$CODE" \
 --data-urlencode "redirect_uri=$REDIRECT_URI" \
 --data-urlencode "client_id=$CLIENT_ID" \
 --data-urlencode "code_verifier=$CODE_VERIFIER" \
 --data-urlencode "resource=https://api.example.com" \
 --data-urlencode "claims={\"id_token\":{\"email\":{\"essential\":true}}}" \
 --data-urlencode "authorization_details=[{\"type\":\"payment_initiation\",\"instructedAmount\":{\"currency\":\"USD\",\"amount\":\"125.00\"}}]"
```

**JSON response (typical OIDC)**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJraWQiOi...",
  "refresh_token": "def50200..."
}
```

---

## 3) cURL — RFC 8693 Token Exchange (Delegation / Impersonation)

```bash
AS="https://auth.pingone.com/<ENV_ID>"
TOKEN="$AS/as/token"
CLIENT_ID="<client_id>"
CLIENT_ASSERTION="<signed_private_key_jwt>"
SUBJECT_TOKEN="<user_access_token_here>"

curl -s -X POST "$TOKEN" \
 -H "Content-Type: application/x-www-form-urlencoded" \
 --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
 --data-urlencode "client_id=$CLIENT_ID" \
 --data-urlencode "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
 --data-urlencode "client_assertion=$CLIENT_ASSERTION" \
 --data-urlencode "subject_token=$SUBJECT_TOKEN" \
 --data-urlencode "subject_token_type=urn:ietf:params:oauth:token-type:access_token" \
 --data-urlencode "requested_token_type=urn:ietf:params:oauth:token-type:access_token" \
 --data-urlencode "resource=https://downstream.api.example.com"
```

---

## 4) Node/Express — Token Exchange Handler (Authorization Code)

```ts
// token.exchange.ts (TypeScript)
import fetch from "node-fetch";
import * as jose from "jose";

const AS = process.env.AS_ISSUER!;               // https://auth.pingone.com/<ENV_ID>
const TOKEN = `${AS}/as/token`;
const CLIENT_ID = process.env.CLIENT_ID!;
const PRIVATE_KEY_PEM = process.env.PRIVATE_KEY_PEM!;

async function clientAssertion(aud: string) {
  const pk = await jose.importPKCS8(PRIVATE_KEY_PEM, "RS256");
  const now = Math.floor(Date.now()/1000);
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now).setExpirationTime(now + 60)
    .setIssuer(CLIENT_ID).setSubject(CLIENT_ID).setAudience(aud)
    .sign(pk);
}

export async function exchangeCode({ code, redirect_uri, code_verifier, resource, claims, authorization_details }:{ 
  code: string; redirect_uri: string; code_verifier: string; resource?: string|string[]; claims?: string; authorization_details?: string;
}) {
  const form = new URLSearchParams();
  form.set("grant_type","authorization_code");
  form.set("code", code);
  form.set("redirect_uri", redirect_uri);
  form.set("client_id", CLIENT_ID);
  form.set("code_verifier", code_verifier);

  if (resource) {
    const list = Array.isArray(resource) ? resource : [resource];
    for (const r of list) form.append("resource", r);
  }
  if (claims) form.set("claims", claims);
  if (authorization_details) form.set("authorization_details", authorization_details);

  const assertion = await clientAssertion(TOKEN);
  form.set("client_assertion_type","urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
  form.set("client_assertion", assertion);

  const r = await fetch(TOKEN, { method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded" }, body: form });
  const json = await r.json();
  if (!r.ok) throw Object.assign(new Error("token_exchange_failed"), { status:r.status, detail:json });
  return json;
}
```

---

## 5) React UI — Token Exchange Form (Advanced)

```tsx
// TokenExchangeForm.tsx (React)
import React, { useState } from "react";

export default function TokenExchangeForm() {
  const [state, setState] = useState({
    code: "", redirect_uri: "https://app.example.com/cb", code_verifier: "",
    resource: "https://api.example.com",
    claims: '{"id_token":{"email":{"essential":true}}}',
    authorization_details: '[{"type":"payment_initiation","instructedAmount":{"currency":"USD","amount":"125.00"}}]'
  });
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string| null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setErr(null);
    const r = await fetch("/api/token/exchange", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(state)
    });
    const json = await r.json();
    if (!r.ok) setErr(json.error || "Exchange failed");
    setResult(json);
    setBusy(false);
  };

  return (
    <div className="p-4 rounded-2xl border shadow bg-white text-gray-900 max-w-3xl">
      <h2 className="text-2xl font-bold mb-2">Token Exchange (Advanced)</h2>
      <div className="grid grid-cols-2 gap-3">
        <label>Code<input className="w-full border p-2 rounded" value={state.code} onChange={e=>setState({...state, code:e.target.value})}/></label>
        <label>Redirect URI<input className="w-full border p-2 rounded" value={state.redirect_uri} onChange={e=>setState({...state, redirect_uri:e.target.value})}/></label>
        <label>PKCE Code Verifier<input className="w-full border p-2 rounded" value={state.code_verifier} onChange={e=>setState({...state, code_verifier:e.target.value})}/></label>
        <label>Resource (audience)<input className="w-full border p-2 rounded" value={state.resource} onChange={e=>setState({...state, resource:e.target.value})}/></label>
      </div>
      <label className="block mt-3">Claims (OIDC) JSON<textarea className="w-full h-24 border rounded p-2 font-mono" value={state.claims} onChange={e=>setState({...state, claims:e.target.value})}/></label>
      <label className="block mt-3">Authorization Details (RAR) JSON<textarea className="w-full h-28 border rounded p-2 font-mono" value={state.authorization_details} onChange={e=>setState({...state, authorization_details:e.target.value})}/></label>
      <div className="mt-3 flex gap-3">
        <button disabled={busy} onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white">Exchange</button>
        {err && <span className="text-red-600">{err}</span>}
      </div>
      {result && <pre className="mt-3 bg-gray-50 border rounded p-3 overflow-auto text-sm">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

---

## 6) Security Guidance

- **Always use PKCE** for public clients; recommended for all clients.
- Prefer **Private Key JWT** for client auth on confidential clients.
- Restrict **Token Exchange** (RFC 8693) to backends only; never from browsers.
- Validate `resource` values against an allow‑list.
- Sanitize and validate JSON for `claims` and `authorization_details` before posting to the AS.
- Keep tokens short‑lived; rotate refresh tokens; enable introspection on RS side as needed.

---

## 7) Troubleshooting Cheatsheet

| Symptom | Likely Cause | Fix |
|---|---|---|
| `invalid_grant` (code) | Wrong `redirect_uri` or reused/expired code | Exact match redirect, single-use code |
| `invalid_client` | Client auth mismatch | Use proper Private Key JWT / secret |
| `invalid_request` (claims/RAR) | Malformed JSON | Validate and minify before send |
| No audience in token | Missing `resource` | Add one or more `resource` params |
| Claims missing in ID Token | Server policy | Ask AS admin to enable claim mapping/enrichment |

---

### Copy/Paste Checklist
- [ ] PKCE implemented (S256)
- [ ] Private Key JWT configured on server
- [ ] `/api/token/exchange` endpoint wired to your UI
- [ ] JSON validators for `claims` and `authorization_details`
- [ ] RS expects correct `aud` (resource) claim

---

**File name:** `OIDC_TokenExchange_AdvancedParams.md`
