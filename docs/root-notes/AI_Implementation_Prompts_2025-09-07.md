# 🚀 AI Implementation Prompts — 2025-09-07

## Table of Contents
1. [Add Eye Icon to Mask/Unmask Client Secret](#1-add-eye-icon-to-maskunmask-client-secret)  
2. [Default Expanded Menu Items (“OpenID Connect” & “Resources”)](#2-default-expanded-menu-items-openid-connect--resources)  
3. [Dashboard Login Errors: Config/Token Bootstrap Hardening](#3-dashboard-login-errors-configtoken-bootstrap-hardening)  
4. [Auth Code Flow Step-2 Fix: PKCE + TDZ Elimination](#4-auth-code-flow-step2-fix-pkce--tdz-elimination)  
5. [NEW: Tiny Discovery-on-Boot (AI Prompt + Snippet)](#5-new-tiny-discovery-on-boot-ai-prompt--snippet)  
6. [Unified QA Checklist](#6-unified-qa-checklist)  
7. [Security Warning Banner Should Be Red](#7-security-warning-banner-should-be-red)  
8. [Fix Hybrid Flow Errors (TDZ + Undefined ClientId)](#8-ai-prompt-fix-hybrid-flow-errors-tdz--undefined-clientid)
9. [Fix Client Credentials Flow Error (Undefined clientId + Proper Client Authentication)](#9-ai-prompt-fix-client-credentials-flow-error-undefined-clientid--proper-client-authentication)

---

## 1) Add Eye Icon to Mask/Unmask Client Secret

### AI Prompt
**Goal:** Add an **eye icon** to the Client Secret input to toggle masked ↔ unmasked while preserving current styling and security.

**Requirements**
- Add an inline right-aligned eye icon (`👁️` / `fa-eye` ↔ `fa-eye-slash`) inside the input container.
- Toggle `type="password"` ↔ `type="text"` on click; update tooltip (`Show secret`/`Hide secret`).
- Keep existing styles; support desktop & mobile.
- **Logging (non-blocking):**  
  - `[🔒 UI-SECRET] Secret visibility toggled: shown|hidden`
- Hardening:
  - Default masked on load.
  - Field remains `readonly` unless user explicitly enters edit mode.
  - Never log actual secret values.

**Reference Snippet**
```html
<div style="position: relative; max-width: 600px;">
  <input 
    id="clientSecret" 
    type="password" 
    placeholder="Enter your application's Client Secret"
    autocomplete="current-password"
    readonly
    value="••••••••••••"
    style="width: 100%; padding: 0.5rem 2rem 0.5rem 0.5rem; border: 1px solid #dee2e6; border-radius: 4px; font-family: Monaco, Menlo, 'Ubuntu Mono', monospace; font-size: 0.85rem; background-color: #f8f9fa;">
  <span 
    id="toggleSecret" 
    title="Show secret"
    style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: pointer;">
    👁️
  </span>
</div>
<script>
  const input = document.getElementById("clientSecret");
  const toggle = document.getElementById("toggleSecret");
  toggle.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    toggle.textContent = hidden ? "🙈" : "👁️";
    toggle.title = hidden ? "Hide secret" : "Show secret";
    console.log(`[🔒 UI-SECRET] Secret visibility toggled: ${hidden ? "shown" : "hidden"}`);
  });
</script>
```

---

## 2) Default Expanded Menu Items (“OpenID Connect” & “Resources”)

### AI Prompt
**Goal:** Ensure **“OpenID Connect”** and **“Resources”** menu sections are **expanded on initial render**, without breaking normal toggle behavior.

**Requirements**
- Force default open for:
  - `<span>OpenID Connect</span>`
  - `<div class="sc-lgpSej fWiPVu">…<span>Resources</span>…</div>`
- Preserve expand/collapse for other items.
- Update chevron visuals to “expanded”.
- **Logging:**  
  - `[📂 MENU] OpenID Connect default expanded`  
  - `[📂 MENU] Resources default expanded`
- Accessibility: set `aria-expanded="true"` on defaults.
- Optional: persist user-initiated collapse/expand in `localStorage`.

**Reference Snippet (React-like)**
```tsx
function MenuItem({ label, children, defaultExpanded=false }) {
  const [open, setOpen] = React.useState(defaultExpanded);
  React.useEffect(() => { if (defaultExpanded) console.log(`[📂 MENU] ${label} default expanded`); }, [defaultExpanded, label]);
  return (
    <div className="menu-item" aria-expanded={open}>
      <div className="menu-header" onClick={() => setOpen(!open)}>
        <span>{label}</span>
        <svg className={`chevron ${open ? "rotated" : ""}`} viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      {open && <div className="submenu">{children}</div>}
    </div>
  );
}
// Usage
<MenuItem label="OpenID Connect" defaultExpanded>{/* … */}</MenuItem>
<MenuItem label="Resources" defaultExpanded>{/* … */}</MenuItem>
```

---

## 3) Dashboard Login Errors: Config/Token Bootstrap Hardening

### AI Prompt
**Goal:** Clean startup by hardening **configuration loading** & **token bootstrap**. Fix duplicate init, TDZ risks, and suppress third-party extension noise.

**Symptoms**
- `Config service not available…`
- `❌ No valid configuration available`
- Repeated `No tokens found` spam
- Extension noise (`background.js … autofill-card`)

**Acceptance Criteria**
- Config fallback order: **server → embedded env → localStorage**.
- No TDZ/hoisting bugs; single deduped init pass.
- Token bootstrap: if tokens present → proceed; else show setup modal once.
- Rate-limit repeated info logs.
- UI status bar reflects `CONFIG_OK` / `TOKEN_OK`.
- **Never log secrets/tokens**; only safe prefixes.

**Key Actions**
- Centralize `StorageAdapter`; rate-limit token-miss logs.
- Add migration shim to standardize keys:  
  `pingone_environment_id`, `pingone_region`, `pingone_client_id`, `pingone_client_secret`.
- Reduce password manager interference with attributes:  
  `autocomplete="off"`, `data-bitwarden-watching="false"`, `data-1p-ignore="true"`.

---

## 4) Auth Code Flow Step-2 Fix: PKCE + TDZ Elimination

### AI Prompt
**Goal:** Make Authorization Code **with PKCE (S256)** the default and remove `ReferenceError: Cannot access 'config2' before initialization`.

**Acceptance Criteria**
- `/authorize` includes `code_challenge` + `code_challenge_method=S256`.
- `state` & `nonce` generated and validated round-trip.
- `code_verifier` persisted in `sessionStorage` and used in token exchange.
- Callback exchanges `code` with `code_verifier`; clears artifacts after success.
- No secrets/tokens in logs.
- TDZ fixed in `NewAuthContext`; single init pass.

**Core Snippets**
- **PKCE utils (`pkce.ts`)**
```ts
function b64u(buf: ArrayBuffer){return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+/g,"");}
export async function generatePkcePair(){const r=crypto.getRandomValues(new Uint8Array(64));const v=b64u(r.buffer);const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return {verifier:v,challenge:b64u(d)};}
export function randomB64Url(n=24){const a=crypto.getRandomValues(new Uint8Array(n));return btoa(String.fromCharCode(...a)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+/g,"");}
```

- **Start login (`/authorize`)**
```ts
import {generatePkcePair, randomB64Url} from "./pkce";
export async function startLogin(cfg:{authorizationEndpoint:string; tokenEndpoint:string; clientId:string; redirectUri:string; scopes:string;}) {
  const {verifier, challenge} = await generatePkcePair();
  const state = randomB64Url(); const nonce = randomB64Url();
  sessionStorage.setItem("pkce_verifier", verifier);
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("oauth_nonce", nonce);
  const url = new URL(cfg.authorizationEndpoint);
  url.searchParams.set("response_type","code");
  url.searchParams.set("client_id",cfg.clientId);
  url.searchParams.set("redirect_uri",cfg.redirectUri);
  url.searchParams.set("scope",cfg.scopes);
  url.searchParams.set("state",state);
  url.searchParams.set("nonce",nonce);
  url.searchParams.set("code_challenge",challenge);
  url.searchParams.set("code_challenge_method","S256");
  console.info("[🔐 PKCE] Generated verifier/challenge"); console.info("[➡️ OIDC] Redirecting to /authorize");
  window.location.assign(url.toString());
}
```

- **Callback (exchange code with verifier)**
```ts
async function exchangeCode(tokenEndpoint:string, p:{clientId:string; redirectUri:string; code:string; codeVerifier:string;}) {
  const body = new URLSearchParams({grant_type:"authorization_code", client_id:p.clientId, redirect_uri:p.redirectUri, code:p.code, code_verifier:p.codeVerifier});
  const r = await fetch(tokenEndpoint,{method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body});
  if(!r.ok) throw new Error(`Token exchange failed: ${r.status} ${(await r.text()).slice(0,300)}`); return r.json();
}
```

---

## 5) NEW: Tiny Discovery-on-Boot (AI Prompt + Snippet)

### AI Prompt
**Goal:** On app boot, if **`issuer`** is available but **`authorizationEndpoint`** or **`tokenEndpoint`** are missing, **discover** them from `/.well-known/openid-configuration`, **persist** them, and proceed without user intervention.

**Requirements**
- Trigger **once** at startup (idempotent).
- Fetch `${issuer}/.well-known/openid-configuration`.
- Extract `authorization_endpoint` and `token_endpoint`.
- Save to `localStorage` as `authorizationEndpoint` and `tokenEndpoint`.
- Update in-memory config and continue normal login flow.
- **Logging (non-blocking):**  
  - `[🧭 DISCOVERY] Starting OIDC discovery for issuer: <issuer>`  
  - `[🧭 DISCOVERY] Endpoints discovered`  
  - `[🧭 DISCOVERY] Skipped (already present)`  
  - `[🧭 DISCOVERY] Failed: <message>`

**Discovery Snippet**
```ts
// discovery.ts
export async function discoverEndpointsIfNeeded(cfg: {
  issuer?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
}) {
  try {
    if (!cfg.issuer) return { ...cfg, discovered: false, reason: "no-issuer" };
    if (cfg.authorizationEndpoint and cfg.tokenEndpoint) {
      console.info("[🧭 DISCOVERY] Skipped (already present)");
      return { ...cfg, discovered: false, reason: "already-present" };
    }
    console.info(`[🧭 DISCOVERY] Starting OIDC discovery for issuer: ${cfg.issuer}`);
    const res = await fetch(`${cfg.issuer}/.well-known/openid-configuration`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const meta = await res.json();
    const authorizationEndpoint = meta.authorization_endpoint;
    const tokenEndpoint = meta.token_endpoint;
    if (!authorizationEndpoint || !tokenEndpoint) throw new Error("missing endpoints in discovery doc");

    // persist
    try {
      localStorage.setItem("authorizationEndpoint", authorizationEndpoint);
      localStorage.setItem("tokenEndpoint", tokenEndpoint);
    } catch {}

    console.info("[🧭 DISCOVERY] Endpoints discovered", { authorizationEndpoint, tokenEndpoint: tokenEndpoint?.slice(0, 40) + "..." });
    return { ...cfg, authorizationEndpoint, tokenEndpoint, discovered: true };
  } catch (e: any) {
    console.warn(`[🧭 DISCOVERY] Failed: ${e?.message ?? e}`);
    return { ...cfg, discovered: false, error: e?.message ?? String(e) };
  }
}
```

**Wire Up on Boot (inside NewAuthContext after loading config)**
```ts
// After you load a partial config that has `issuer` but missing endpoints:
import { discoverEndpointsIfNeeded } from "./discovery";

async function loadAndMaybeDiscover(): Promise<AppConfig | undefined> {
  const cfg = await loadConfiguration(); // returns partial/complete config
  if (!cfg) return undefined;

  const maybe = await discoverEndpointsIfNeeded({
    issuer: cfg.issuer,
    authorizationEndpoint: cfg.authorizationEndpoint,
    tokenEndpoint: cfg.tokenEndpoint,
  });

  // If discovery filled gaps, merge & return
  return {
    ...cfg,
    authorizationEndpoint: maybe.authorizationEndpoint ?? cfg.authorizationEndpoint,
    tokenEndpoint: maybe.tokenEndpoint ?? cfg.tokenEndpoint,
  } as AppConfig;
}
```

---

## 6) Unified QA Checklist

- [ ] **Config Loader**: server → embedded env → localStorage; no TDZ; single init pass.
- [ ] **Discovery**: runs only when needed; endpoints persisted; clean logs.
- [ ] **PKCE Step-2**: `/authorize` includes `code_challenge` + `S256`; `state` & `nonce` present.
- [ ] **Callback**: validates `state`; exchanges `code` with `code_verifier`; clears artifacts.
- [ ] **Security**: no secrets/tokens in logs; secret fields masked by default; mask/unmask icon works.
- [ ] **Menu UX**: “OpenID Connect” & “Resources” default expanded; ARIA reflects state.
- [ ] **Bootstrap**: if tokens exist → skip setup; else show modal once; rate-limit noisy logs.
- [ ] **Noise Filtering**: password manager console spam does not affect flows.
- [ ] **E2E**: fresh user → discovery (if needed) → auth → tokens saved → dashboard OK.

---

## 7) Security Warning Banner Should Be Red

### AI Prompt
**Goal:** Update the **Security Warning component** styling so it clearly indicates a **critical security issue** by rendering in **red** instead of yellow.

**Current Behavior**
- Renders with yellow background & text (`#ffc107` or similar warning palette).
- Displays:  
  *“⚠️ Security Warning — The Implicit Grant flow has security limitations and is generally not recommended for new applications. Consider using the Authorization Code flow with PKCE instead.”*

**Requirements**
- Change color scheme from **yellow → red** for any **security warnings**.
- Background: light red (e.g., `#fff5f5` or `#fdecea`).  
- Border: solid red (`#f5c2c7`).  
- Icon/text color: red (`#dc3545` or equivalent).  
- Keep consistent spacing, padding, rounded corners, and font weights.

**Reference Styling**
```css
.security-warning {
  background-color: #fdecea; /* light red */
  border: 1px solid #f5c2c7; /* red border */
  color: #dc3545;            /* red text */
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
}
.security-warning strong {
  font-weight: 600;
}
```

**Logging**
- When rendered, log: `[🛑 SECURITY] Security warning displayed: <message>`  

**Accessibility**
- Use `role="alert"` so screen readers announce the warning immediately.  

---

## 8) AI Prompt: Fix Hybrid Flow Errors (TDZ + Undefined ClientId)

### Context
Errors observed:
- `ReferenceError: Cannot access 'config2' before initialization` (TDZ in `NewAuthContext`).  
- `TypeError: Cannot read properties of undefined (reading 'clientId')` in `HybridFlow.generateAuthUrl`.  
- Duplicate config-loading logs and noisy retries.  
- Hybrid flow starting with incomplete config.

### Goals
- Eliminate TDZ bugs in `NewAuthContext` by ensuring **all variables declared before use** and using **single init pass**.  
- Ensure **flow credentials** (issuer, endpoints, clientId, redirectUri, scopes) are **resolved and validated before Hybrid starts**.  
- Harden `generateAuthUrl` with validation and safe failure (return error instead of throwing).  
- Add a **feature flag**: disable Hybrid by default, fall back to Authorization Code + PKCE.  
- Use **discovery-on-boot** to populate `authorizationEndpoint` and `tokenEndpoint` if missing.

### Requirements
1. **NewAuthContext**
   - No TDZ references (no `config2` before init).  
   - Wrap startup with `initOnce` ref to prevent duplicate init.  
   - Log errors cleanly.  

2. **Flow Credentials Resolver**
   - Centralize resolution of config from global + overrides.  
   - Validate required fields: `authorizationEndpoint`, `tokenEndpoint`, `clientId`, `redirectUri`, `scopes`.  
   - Fail early with descriptive error if missing.  

3. **HybridFlow.generateAuthUrl**
   - Input validation before use.  
   - Always return `{ok:true,url}` or `{ok:false,error}`.  
   - Generate `state` + `nonce`, persist in `sessionStorage`.  

4. **Feature Flags**
   - Add `feature.hybrid=false` by default.  
   - If disabled, show “Use Authorization Code + PKCE” path.  
   - If enabled, only start Hybrid when config passes validation.  

5. **Discovery Integration**
   - If only `issuer` is present, run discovery (`/.well-known/openid-configuration`) on boot.  
   - Persist endpoints to `localStorage`.  

### Logging
- `[⚙️ Config] Loading configuration...` (once only).  
- `[✅ Config] Using stored config { clientId: a4f963ea... }`.  
- `[🧭 DISCOVERY] Endpoints discovered` (if needed).  
- `[⚙️ FlowCredentials] Loaded global credentials`.  
- `[🚀 HybridFlow] Redirecting to authorize (hybrid)`.  

### QA Checklist
- [ ] No TDZ errors (`config2` bug fixed).  
- [ ] No undefined `clientId` in Hybrid flow.  
- [ ] Discovery fills missing endpoints when only `issuer` exists.  
- [ ] `generateAuthUrl` fails safe with clear error.  
- [ ] Feature flag disables Hybrid and falls back to Code + PKCE.  
- [ ] Logs are deduped and non-spammy.  

---

## 9) AI Prompt: Fix Client Credentials Flow Error (Undefined clientId + Proper Client Authentication)

### Context (from logs)
- `ClientCredentialsFlow.tsx:377 Uncaught TypeError: Cannot read properties of undefined (reading 'clientId')`  
- Recurrent TDZ error in `NewAuthContext` during config bootstrap.  
- Client Credentials flow is a **confidential client** pattern and **must** have a valid `client_id` and **client authentication** when calling the **token endpoint** with `grant_type=client_credentials`.

### Goals
- Ensure the Client Credentials flow **never renders** until a **validated config** exists.  
- Add a **flow config resolver** for Client Credentials that guarantees `clientId`, `clientSecret`, `tokenEndpoint`, and `scopes` (or audience) are present.  
- Perform **token request** with proper **client authentication**: either `client_secret_basic` (Authorization header) or `client_secret_post` (body).  
- Fail **early + safely** with a user-facing error if any required field is missing.

### Requirements
1. **Block Rendering Until Ready**
   - In `ClientCredentialsFlow`, guard on `config`:
     ```tsx
     const { config } = useAuthConfig();
     if (!config) return <Loading />;
     ```
   - Resolve/validate CC config before reading fields.

2. **Resolve & Validate Config**
   ```ts
   type ClientCredsConfig = {
     tokenEndpoint: string;
     clientId: string;
     clientSecret: string;
     scopes?: string;      // optional; or use 'audience'
     audience?: string;    // if required by AS
   };
   function validateCC(c: Partial<ClientCredsConfig>): asserts c is ClientCredsConfig {
     const missing = ["tokenEndpoint","clientId","clientSecret"].filter(k => !(c as any)[k]);
     if (missing.length) throw new Error("Missing Client Credentials config: " + missing.join(", "));
   }
   ```

3. **Token Request (choose auth method)**
   ```ts
   async function requestClientCredentialsToken(cfg: ClientCredsConfig) {
     const body = new URLSearchParams({ grant_type: "client_credentials" });
     if (cfg.scopes) body.set("scope", cfg.scopes);
     if (cfg.audience) body.set("audience", cfg.audience);

     const useBasic = true; // prefer basic
     const headers: Record<string,string> = { "Content-Type": "application/x-www-form-urlencoded" };
     let authBody: BodyInit = body;
     if (useBasic) {
       const basic = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
       headers["Authorization"] = `Basic ${basic}`;
     } else {
       body.set("client_id", cfg.clientId);
       body.set("client_secret", cfg.clientSecret);
     }

     const res = await fetch(cfg.tokenEndpoint, { method: "POST", headers, body: authBody });
     if (!res.ok) throw new Error(`Client Credentials token failed: ${res.status} ${(await res.text()).slice(0,300)}`);
     return res.json(); // { access_token, token_type, expires_in, ... }
   }
   ```

4. **Component Guard + Error UX**
   ```tsx
   function ClientCredentialsFlow() {
     const { config } = useAuthConfig();
     if (!config) return <Spinner label="Loading config..." />;

     // Map global → CC config
     const cc: Partial<ClientCredsConfig> = {
       tokenEndpoint: config.tokenEndpoint,
       clientId: config.pingone_client_id,
       clientSecret: config.pingone_client_secret,
       scopes: config.scopes,
     };

     try { validateCC(cc); }
     catch (e:any) { return <ErrorPanel title="Configuration Error" detail={e?.message} />; }

     const onGetToken = async () => {
       try {
         const tokens = await requestClientCredentialsToken(cc as ClientCredsConfig);
         console.info("[🎫 CLIENT_CREDENTIALS] Token acquired");
         // Display result safely (do NOT log token value)
       } catch (e:any) {
         console.error("[❌ CLIENT_CREDENTIALS] " + (e?.message ?? e));
       }
     };

     return <button onClick={onGetToken}>Get App Token</button>;
   }
   ```

5. **Security & Logging**
   - **Never** log `client_secret` or token values.  
   - Log safe prefixes only.  
   - Consider storing secrets **server-side** and proxying the token call if this is not a trusted client.

### QA Checklist
- [ ] `ClientCredentialsFlow` never reads `clientId` until config is validated.  
- [ ] Token call uses proper client authentication (Basic or POST).  
- [ ] Clear error panel when required fields are missing.  
- [ ] No TDZ errors during config bootstrap.  
- [ ] Tokens not logged; only safe status logs.

---


---

## 10) AI Prompt: Clean Up “PingOne Credentials” Section (All Flow Pages)

### Context
The “PingOne Credentials for worker_token” section shows:
- Truncated/obscured text in inputs
- Icons rendering as gray boxes
- Non-functional checkbox: `<label class="sc-dRpCaM lmEWTT"><input type="checkbox" class="sc-inhABl krWOoX">Use global PingOne configuration</label>`
- Font size too small
- Copy icons look inconsistent/ugly

### Goals
- Ensure **all text is fully visible** in inputs (no clipping, adequate padding).
- Replace gray boxes with **legible icons** (SVGs with proper sizing/contrast).
- Make **“Use global PingOne configuration”** checkbox **work** (bind to global config + disables fields when checked).
- Slightly **increase font size** for readability.
- Provide **clean copy buttons** and **show/hide secret** eye icon with tooltips.
- Maintain accessibility (labels, `aria-*`, contrast) and keyboard navigation.

### Acceptance Criteria
- Checkbox toggles using global config; when enabled:
  - Fields lock (`readonly`/`disabled`) and source values from global config.
  - A small hint row appears: “Using global PingOne config”.
  - State persists in `localStorage` (`useGlobalPingOne=true|false`).
- Inputs render at least **14px** font, **line-height 1.4**, **padding 10–12px**.
- Icons are crisp SVGs with **currentColor**, 16–18px, hover/focus styles.
- Copy buttons use tooltip: “Copy”, “Copied!” with 2s timeout.
- Secrets default **masked**, toggleable with eye icon.
- No layout shift when toggling.
- All controls reachable via Tab; tooltips are `aria-live="polite"`.
- Logging:
  - `[🧩 CREDENTIALS] useGlobalPingOne: true|false`
  - `[🧩 CREDENTIALS] Copied <field>` (no values logged)

### Styles (CSS)
```css
.credentials-panel {
  font-size: 14px; line-height: 1.4;
}
.credentials-panel .field {
  position: relative; margin-bottom: 12px;
}
.credentials-panel input[type="text"],
.credentials-panel input[type="url"],
.credentials-panel input[type="password"] {
  width: 100%; padding: 10px 40px 10px 12px;
  border: 1px solid #d0d7de; border-radius: 8px;
  background: #fff; font-size: 14px; line-height: 1.4;
}
.credentials-panel .icon-btn {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  width: 28px; height: 28px; display: grid; place-items: center;
  border: 1px solid #d0d7de; border-radius: 6px; background: #f6f8fa;
  color: #24292f; cursor: pointer;
}
.credentials-panel .icon-btn:hover { background: #eef1f4; }
.credentials-panel .icon-btn svg {
  width: 16px; height: 16px; display: block;
}
.credentials-panel .row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
.credentials-panel .hint {
  font-size: 12px; color: #57606a; margin-top: 4px;
}
.credentials-panel .checkbox {
  display: flex; gap: 8px; align-items: center; margin-bottom: 12px;
}
```

### React Snippet
```tsx
type GlobalCfg = {
  environmentId?: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string;
};

function useGlobalPingOne() {
  const [useGlobal, setUseGlobal] = React.useState(
    () => localStorage.getItem("useGlobalPingOne") === "true"
  );
  const toggle = (val: boolean) => {
    setUseGlobal(val);
    try { localStorage.setItem("useGlobalPingOne", String(val)); } catch {}
    console.info("[🧩 CREDENTIALS] useGlobalPingOne:", val);
  };
  return { useGlobal, toggle };
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
      <path d="M5 15V5a2 2 0 0 1 2-2h10"></path>
    </svg>
  );
}
function IconEye({ off }: { off?: boolean }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.4 18.4 0 0 1 5.06-6.94M1 1l22 22"/>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export function CredentialsPanel({
  id = "worker_token",
  globalCfg
}: { id?: string; globalCfg: GlobalCfg }) {
  const { useGlobal, toggle } = useGlobalPingOne();
  const [envId, setEnvId] = React.useState(globalCfg.environmentId || "");
  const [clientId, setClientId] = React.useState(globalCfg.clientId || "");
  const [clientSecret, setClientSecret] = React.useState(globalCfg.clientSecret || "");
  const [redirectUri, setRedirectUri] = React.useState(globalCfg.redirectUri || "");
  const [scopes, setScopes] = React.useState("");

  React.useEffect(() => {
    if (useGlobal) {
      setEnvId(globalCfg.environmentId || "");
      setClientId(globalCfg.clientId || "");
      setClientSecret(globalCfg.clientSecret || "");
      setRedirectUri(globalCfg.redirectUri || "");
    }
  }, [useGlobal, globalCfg]);

  const disabled = useGlobal;

  const copy = async (label: string, value: string) => {
    try { await navigator.clipboard.writeText(value || ""); console.info("[🧩 CREDENTIALS] Copied", label); }
    catch {}
  };

  const [showSecret, setShowSecret] = React.useState(false);

  return (
    <section className="credentials-panel" aria-label="PingOne Credentials">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={useGlobal}
          onChange={(e) => toggle(e.target.checked)}
          aria-label="Use global PingOne configuration"
        />
        <span>Use global PingOne configuration</span>
      </label>

      {useGlobal && <div className="hint" role="status" aria-live="polite">Using global PingOne config</div>}

      <div className="row">
        <div className="field">
          <label>Environment ID</label>
          <input value={envId} onChange={(e)=>setEnvId(e.target.value)} readOnly={disabled} />
          <button className="icon-btn" aria-label="Copy Environment ID" onClick={()=>copy("environmentId", envId)}><IconCopy/></button>
        </div>
        <div className="field">
          <label>Client ID</label>
          <input value={clientId} onChange={(e)=>setClientId(e.target.value)} readOnly={disabled} />
          <button className="icon-btn" aria-label="Copy Client ID" onClick={()=>copy("clientId", clientId)}><IconCopy/></button>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Client Secret</label>
          <input type={showSecret ? "text" : "password"} value={clientSecret}
                 onChange={(e)=>setClientSecret(e.target.value)} readOnly={disabled} />
          <button className="icon-btn" aria-label={showSecret ? "Hide secret" : "Show secret"}
                  onClick={()=>setShowSecret(s=>!s)}><IconEye off={showSecret}/></button>
        </div>
        <div className="field">
          <label>Redirect URI</label>
          <input type="url" value={redirectUri} onChange={(e)=>setRedirectUri(e.target.value)} readOnly={disabled} />
          <button className="icon-btn" aria-label="Copy Redirect URI" onClick={()=>copy("redirectUri", redirectUri)}><IconCopy/></button>
        </div>
      </div>

      <div className="field">
        <label>Additional Scopes</label>
        <input placeholder="e.g., api:read api:write" value={scopes} onChange={(e)=>setScopes(e.target.value)} readOnly={false} />
      </div>
    </section>
  );
}
```

### Notes
- The checkbox binds to persisted `useGlobalPingOne`. When checked, inputs reflect global config and become read-only.
- Icons are inline SVGs (no external icon font dependency), so they won’t render as gray boxes.
- Increase base font size to **14px**; if you use CSS-in-JS, map the rules accordingly.
- Ensure all flow pages import and reuse this component to keep a consistent UX.


---

## 11) AI Prompt: Fix Worker Token Flow Error (Undefined clientId + Safe Step Executor)

### Context (from logs)
- `TypeError: Cannot read properties of undefined (reading 'clientId')` inside **WorkerTokenFlow.tsx:343** during **Step 1** execution.
- Repeated `ReferenceError: Cannot access 'config2' before initialization` from **NewAuthContext** (TDZ) during bootstrap.
- Flow logs show credentials loading correctly, then failure when `execute` runs — suggests **step executor is dereferencing an undefined config object** (likely not merged or memoized yet).

### Goals
- Prevent Worker Token flow from starting until a **validated, immutable flow config** exists.
- Centralize **flow-specific override merging** (global → flow overrides) and **validate required fields**.
- Make **step executor** resilient: return `{ok:false,error}` rather than throwing on missing fields.
- Provide a **token request helper** that supports either `grant_type=client_credentials` or vendor-specific `worker_token` grant (feature-flagged).
- Remove TDZ by ensuring config is initialized **before** React render reads it.

### Acceptance Criteria
- No `undefined clientId` errors in `WorkerTokenFlow`.
- Step 1 `execute()` only runs when `configReady === true`.
- Clear inline error panel if required fields missing; never crash the tree.
- Token request logs safe status only (no secrets/tokens).
- Works with **global config** or **flow-specific overrides**.

### Implementation Plan

1) **Config Guard + Resolver**
```ts
type WorkerTokenCfg = {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  environmentId?: string;
  scopes?: string;
  audience?: string;
  grant?: "client_credentials" | "worker_token";
};

export function resolveWorkerTokenConfig(globalCfg: any, flowOverrides: any): WorkerTokenCfg {
  const c = {
    tokenEndpoint: flowOverrides?.tokenEndpoint ?? globalCfg?.tokenEndpoint,
    clientId: flowOverrides?.clientId ?? globalCfg?.clientId,
    clientSecret: flowOverrides?.clientSecret ?? globalCfg?.clientSecret,
    environmentId: flowOverrides?.environmentId ?? globalCfg?.environmentId,
    scopes: flowOverrides?.additionalScopes ?? globalCfg?.scopes,
    audience: flowOverrides?.audience ?? globalCfg?.audience,
    grant: flowOverrides?.grant ?? "client_credentials"
  } as Partial<WorkerTokenCfg>;

  const missing = ["tokenEndpoint","clientId","clientSecret"].filter(k => !(c as any)[k]);
  if (missing.length) throw new Error("Missing Worker Token config: " + missing.join(", "));
  return c as WorkerTokenCfg;
}
```

2) **Safe Step Executor**
```ts
async function executeStep1(ctx:{globalCfg:any; flowOverrides:any}) {
  try {
    const cfg = resolveWorkerTokenConfig(ctx.globalCfg, ctx.flowOverrides);
    const token = await requestWorkerToken(cfg);
    return { ok: true, token };
  } catch (e:any) {
    console.error("[❌ WORKER_TOKEN] Step1 failed:", e?.message ?? e);
    return { ok: false, error: String(e?.message ?? e) };
  }
}
```

3) **Token Request Helper**
```ts
async function requestWorkerToken(cfg: WorkerTokenCfg) {
  const body = new URLSearchParams();
  body.set("grant_type", cfg.grant === "worker_token" ? "worker_token" : "client_credentials");
  if (cfg.scopes) body.set("scope", cfg.scopes);
  if (cfg.audience) body.set("audience", cfg.audience);

  // Prefer client_secret_basic
  const headers: Record<string,string> = { "Content-Type": "application/x-www-form-urlencoded" };
  const basic = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
  headers["Authorization"] = `Basic ${basic}`;

  const res = await fetch(cfg.tokenEndpoint, { method: "POST", headers, body });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    throw new Error(`Worker token request failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  console.info("[🎫 WORKER_TOKEN] Token acquired"); // Do not log token!
  return json; // { access_token, token_type, expires_in, ... }
}
```

4) **Component Guard**
```tsx
export function WorkerTokenFlow() {
  const { config: globalCfg, configReady } = useAuthConfig(); // ensure TDZ-free in context
  const flowOverrides = useFlowOverrides("worker_token");     // state from UI

  if (!configReady) return <Spinner label="Loading configuration..." />;

  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const start = async () => {
    const r = await executeStep1({ globalCfg, flowOverrides });
    if (!r.ok) setError(r.error);
    else setResult(r.token);
  };

  return (
    <StepByStep onStart={start}>
      {error && <ErrorPanel title="Worker Token Error" detail={error} />}
      {result && <TokenPanel token={result} />}
    </StepByStep>
  );
}
```

5) **NewAuthContext TDZ Fix (recap)**
- Initialize config in a **single effect** with `initOnce` ref.  
- Export `{config, configReady}` so flows don’t read half-initialized values.  
- Ensure no references to variables (`config2`) before they’re declared.

### Logging
- `[⚙️ FlowCredentials] Credentials loaded for worker_token` (once).  
- `[🚀 WORKER_TOKEN] Starting` only after `configReady === true`.  
- `[❌ WORKER_TOKEN] Step1 failed: <message>` (no secrets).

### QA Checklist
- [ ] No crashes; step executor returns structured errors.  
- [ ] `clientId` is never read from `undefined`.  
- [ ] Works with both global config and flow overrides.  
- [ ] Token helper uses `client_secret_basic`; alternative supported via body if required.  
- [ ] No secrets/tokens written to logs.  
- [ ] TDZ eliminated in `NewAuthContext`; flows consume `configReady`.


---

## 12) AI Prompt: Fix Device Code Flow Error (Missing deviceAuthorizationEndpoint + Friendly Error Panel)

### Context (from logs)
- DeviceCodeFlow starts, credentials load correctly, but **Step 1 fails**:
  ```
  TypeError: Cannot read properties of undefined (reading 'deviceAuthorizationEndpoint')
  at DeviceCodeFlow.tsx:356:34
  ```
- Suggests that the **deviceAuthorizationEndpoint** was not resolved in config merging.

### Goals
- Ensure `deviceAuthorizationEndpoint` is included in resolved flow config before `execute()` runs.
- Add **guard** so that if endpoint is missing, flow stops gracefully with a UI error panel instead of crashing React tree.
- Provide **friendly error boundary** for all StepByStepFlow children so runtime errors render as inline error panels.

### Implementation Plan

1) **Resolve deviceAuthorizationEndpoint in config**
```ts
type DeviceCodeCfg = {
  deviceAuthorizationEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  scopes?: string;
  audience?: string;
};

export function resolveDeviceCodeConfig(globalCfg:any, overrides:any): DeviceCodeCfg {
  const c = {
    deviceAuthorizationEndpoint: overrides?.deviceAuthorizationEndpoint ?? globalCfg?.deviceAuthorizationEndpoint,
    tokenEndpoint: overrides?.tokenEndpoint ?? globalCfg?.tokenEndpoint,
    clientId: overrides?.clientId ?? globalCfg?.clientId,
    clientSecret: overrides?.clientSecret ?? globalCfg?.clientSecret,
    scopes: overrides?.scopes ?? globalCfg?.scopes,
    audience: overrides?.audience ?? globalCfg?.audience,
  } as Partial<DeviceCodeCfg>;

  const missing = ["deviceAuthorizationEndpoint","tokenEndpoint","clientId","clientSecret"]
    .filter(k => !(c as any)[k]);
  if (missing.length) throw new Error("Missing Device Code config: " + missing.join(", "));
  return c as DeviceCodeCfg;
}
```

2) **Safe executor**
```ts
async function executeDeviceCodeStep1(ctx:{globalCfg:any;flowOverrides:any}) {
  try {
    const cfg = resolveDeviceCodeConfig(ctx.globalCfg, ctx.flowOverrides);
    const res = await fetch(cfg.deviceAuthorizationEndpoint, {
      method:"POST",
      headers:{ "Content-Type":"application/x-www-form-urlencoded" },
      body:new URLSearchParams({
        client_id: cfg.clientId,
        scope: cfg.scopes ?? "openid profile email"
      })
    });
    if(!res.ok) throw new Error("Device code request failed: "+res.status);
    const json = await res.json();
    return {ok:true, result:json};
  } catch(e:any) {
    console.error("[❌ DEVICE_CODE] Step1 failed:", e?.message);
    return {ok:false, error:String(e?.message??e)};
  }
}
```

3) **Friendly Error Boundary**
```tsx
export class FriendlyErrorBoundary extends React.Component<any, {error:any}> {
  constructor(p:any){super(p);this.state={error:null};}
  static getDerivedStateFromError(e:any){return {error:e};}
  componentDidCatch(e:any,info:any){console.error("[💥 ERROR BOUNDARY]",e,info);}
  render(){
    if(this.state.error){
      return <ErrorPanel title="Unexpected Error" detail={String(this.state.error?.message||this.state.error)} />;
    }
    return this.props.children;
  }
}
```

4) **Wrap StepByStepFlow**
```tsx
<FriendlyErrorBoundary>
  <StepByStepFlow ... />
</FriendlyErrorBoundary>
```

### Logging
- `[⚙️ FlowCredentials] Loaded global credentials` → keep.  
- `[❌ DEVICE_CODE] Step1 failed: ...` → no secrets.  
- `[💥 ERROR BOUNDARY]` when caught.

### QA Checklist
- [ ] No crash on missing `deviceAuthorizationEndpoint`.  
- [ ] Inline ErrorPanel displayed with actionable message.  
- [ ] Friendly error boundary covers all flows, safe fallback.  
- [ ] Config validated before request.  
- [ ] Logs sanitized.


---

## 13) AI Prompt: Apply Friendly Error Boundary Across All Flows (Hybrid, Worker Token, Client Credentials, Device Code)

### Goal
Adopt a **single, reusable error boundary** and **standard ErrorPanel** so any runtime error inside a flow renders a friendly inline panel rather than crashing the app.

### Deliverables
1) Exported `<FriendlyErrorBoundary>` (Section 12) in a shared module, e.g. `components/FriendlyErrorBoundary.tsx`.
2) A consistent `<ErrorPanel />` with title, detail, and optional action (Retry).  
3) Wrap all flow routes and the `StepByStepFlow` region with the boundary.

### ErrorPanel (shared)
```tsx
export function ErrorPanel({
  title = "Something went wrong",
  detail,
  onRetry,
}: { title?: string; detail?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
      <div className="font-semibold mb-1">{title}</div>
      {detail && <div className="text-sm whitespace-pre-wrap">{detail}</div>}
      {onRetry && (
        <button className="mt-2 inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                onClick={onRetry} aria-label="Retry">
          Retry
        </button>
      )}
    </div>
  );
}
```

### Route Wrapping
```tsx
// AppRoutes.tsx (or wherever routes mount)
import { FriendlyErrorBoundary } from "@/components/FriendlyErrorBoundary";

export function AppRoutes() {
  return (
    <FriendlyErrorBoundary>
      <Routes>
        <Route path="/oidc/hybrid" element={<HybridFlow />} />
        <Route path="/oidc/worker-token" element={<WorkerTokenFlow />} />
        <Route path="/oidc/client-credentials" element={<ClientCredentialsFlow />} />
        <Route path="/oidc/device-code" element={<DeviceCodeFlow />} />
        {/* ...other routes... */}
      </Routes>
    </FriendlyErrorBoundary>
  );
}
```

### Inside Each Flow (defensive wrap of the interactive region)
```tsx
export function HybridFlow() {
  // ...existing code...
  return (
    <FriendlyErrorBoundary>
      <StepByStepFlow /* props */ />
    </FriendlyErrorBoundary>
  );
}
```
_Do the same in **WorkerTokenFlow**, **ClientCredentialsFlow**, and **DeviceCodeFlow**._

### QA Checklist
- [ ] Any thrown error within flow components renders ErrorPanel (with message) instead of crashing.
- [ ] Retry button re-triggers the current step/action when provided.
- [ ] Keyboard/AT users can focus the panel (role="alert").
- [ ] No secrets or tokens ever displayed in `detail`.


---

## 14) AI Prompt: Token Management UI Styling Consistency

### Goal
Unify the **Token Management** page styling so all token views (Raw Token, Header, Payload) are consistent, accessible, and professional.

### Requirements
1) **Backgrounds:** Use a **white background** with **black text** in all token display boxes (Raw, Header, Payload).  
2) **Consistency:** Ensure fonts and padding are consistent across all sections (Raw token entry, decoded header, decoded payload).  
3) **Borders:** Apply subtle rounded borders with light-gray outlines.  
4) **Readability:** Use monospace fonts, adequate spacing, and slightly larger font size for better legibility.  
5) **Dark mode awareness:** If dark theme is enabled globally, invert appropriately but maintain consistent scheme across all sections.

### Example
```tsx
<div className="rounded-md border border-gray-300 bg-white p-3 font-mono text-sm text-black">
  {decodedHeader || "No token data"}
</div>
```

### QA Checklist
- [ ] Raw Token, Header, Payload sections all share identical styles.  
- [ ] Black-on-white text ensures readability and aligns with overall UI design.  
- [ ] Copy button + Decode button maintain same button style as other pages.  
- [ ] Works in both light and dark themes without losing consistency.


---

## 14) AI Prompt: Unify Token Management Styling (Raw Token, Header, Payload)

### Goal
Make the **Token Management** area visually consistent and readable:
- **White background**, **black text** for Raw Token input and decoded **Header** and **Payload** boxes.
- Consistent border radius, padding, and monospaced font.
- Respect dark mode by *keeping these boxes white* with black text for legibility (override theme), optional toggle if desired.

### Acceptance Criteria
- Raw token textarea, Header viewer, and Payload viewer all use shared styles.
- No gradient or dark backgrounds; text is #111 (near-black) on white.
- JSON is pretty-printed with stable wrapping and horizontal scroll (no overflow clipping).
- Copy buttons and Decode actions retain spacing and size.

### CSS (shared)
```css
.token-surface {
  background: #ffffff !important;
  color: #111111 !important;
  border: 1px solid #d0d7de;
  border-radius: 10px;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.4;
}
.token-surface pre, .token-surface code, .token-surface textarea {
  background: transparent !important;
  color: inherit !important;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
.token-surface textarea {
  width: 100%;
  min-height: 140px;
  resize: vertical;
  border: 0;
  outline: none;
}
.token-surface--scroll {
  overflow: auto;
  max-height: 320px;
  white-space: pre;
}
.token-section-title {
  font-weight: 700;
  margin: 12px 0 8px;
}
```

### React wiring
```tsx
function TokenTextArea({ value, onChange }:{ value:string; onChange:(v:string)=>void }) {
  return (
    <div className="token-surface" aria-label="Raw token input">
      <textarea value={value} onChange={(e)=>onChange(e.target.value)} placeholder="Paste your JWT token here" />
    </div>
  );
}

function JsonViewer({ title, data }:{ title:string; data:any }) {
  const pretty = data ? JSON.stringify(data, null, 2) : "No token data";
  return (
    <section>
      <div className="token-section-title">{title}</div>
      <div className="token-surface token-surface--scroll" role="region" aria-label={`${title} JSON`}>
        {pretty}
      </div>
    </section>
  );
}

// Usage
<TokenTextArea value={raw} onChange={setRaw} />
<div className="actions">{/* Get Token | Copy | Decode | Load Sample */}</div>
<h3>Decoded Token</h3>
<JsonViewer title="Header" data={decoded?.header} />
<JsonViewer title="Payload" data={decoded?.payload} />
```

### Notes
- The `!important` keeps the boxes white/black even in dark themes for clarity. If you prefer theme-aware, create CSS variables and set them for light/dark.
- Keep copy and decode buttons outside the `token-surface` block to avoid crowding.
- Ensure the copy action never logs token content—only status.


---

## 15) AI Prompt: Keep Left Menu Sections Expanded After Selection (Sticky Expansion)

### Goal
When a user selects an item in the left navigation, **keep its parent section expanded** so returning to the menu (or moving to the next item) doesn’t require re-expanding. Persist the open state per section across route changes and reloads.

### Requirements
- Selecting any child item **does not collapse** its parent section.
- Expansion state is **sticky** across navigations and page refreshes.
- Supports multi-expand (several sections open) with optional “accordion” mode.
- Accessible semantics: `aria-expanded`, `aria-controls`, keyboard toggle with Enter/Space.
- Works with deep-links: URL reflects active item; expansion derives from URL and/or stored state.

### Acceptance Criteria
- Parent section corresponding to the current route is expanded on initial load.
- Toggling section header updates UI + saves state in `localStorage` (key `nav.openSections`).
- In “accordion” mode, opening one section closes the others (configurable).
- No jarring layout shift during content mount/unmount.

### React Snippet
```tsx
type Section = { id: string; title: string; items: { id: string; title: string; href: string }[] };

function useStickyExpansion(sectionIds: string[], accordion = false) {
  const [open, setOpen] = React.useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("nav.openSections") || "{}"); } catch { return {}; }
  });

  const setOpenFor = (id: string, val: boolean) => {
    setOpen(prev => {
      const next = accordion
        ? Object.fromEntries(sectionIds.map(sid => [sid, sid === id ? val : false]))
        : { ...prev, [id]: val };
      try { localStorage.setItem("nav.openSections", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { open, setOpenFor };
}

function LeftNav({ sections, accordion=false }: { sections: Section[]; accordion?: boolean }) {
  const ids = sections.map(s => s.id);
  const { open, setOpenFor } = useStickyExpansion(ids, accordion);
  const location = useLocation();

  // Expand section of active route on mount/route change
  React.useEffect(() => {
    const active = sections.find(s => s.items.some(it => location.pathname.startsWith(it.href)));
    if (active && !open[active.id]) setOpenFor(active.id, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <nav aria-label="Flows navigation">
      {sections.map(section => {
        const isOpen = !!open[section.id];
        const panelId = `panel-${section.id}`;
        return (
          <div key={section.id} className="nav-section">
            <button
              className="nav-section__header"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenFor(section.id, !isOpen)}
            >
              <span className="nav-section__title">{section.title}</span>
              <span className={`chev ${isOpen ? "open" : ""}`} aria-hidden="true">▾</span>
            </button>
            <div id={panelId} className={`nav-section__panel ${isOpen ? "open" : "closed"}`}>
              {section.items.map(it => (
                <NavLink key={it.id} to={it.href} className={({isActive}) => "nav-item"+(isActive?" active":"")}>
                  {it.title}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
```

### CSS
```css
.nav-section { margin-bottom: 6px; }
.nav-section__header {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 8px; background: #f6f8fa; border: 1px solid #d0d7de;
  cursor: pointer; font-weight: 600;
}
.nav-section__panel { padding-left: 8px; max-height: 0; overflow: hidden; transition: max-height .2s ease; }
.nav-section__panel.open { max-height: 1000px; } /* large enough for content */
.nav-item { display: block; padding: 6px 8px; border-radius: 6px; color: #24292f; }
.nav-item.active { background: #e6f0ff; font-weight: 600; }
.chev { transition: transform .2s ease; }
.chev.open { transform: rotate(180deg); }
```

### Notes
- Persisted state ensures sections remain expanded when navigating between flow pages.  
- The effect expands the parent section that matches the current route on first load, so deep-links are friendly.  
- Toggle `accordion=true` when you want only one section open at a time.


---

## 16) AI Prompt: Navigation Cleanup — Remove Duplicate Device Code Flow & Fix PAR Route

### Goal
Clean up left navigation:
- **Remove Device Code Flow** from the `Resources` section. It already exists under **OpenID Connect**, so it should not be duplicated.  
- Ensure the `/flows/device_code` route still works, but only appears in the **OpenID Connect** menu.

Also fix routing for **PAR (Pushed Authorization Requests)** flow:  
- Navigating to `https://localhost:3000/flows/par` currently results in a **404 Not Found**.  
- Add a valid route + placeholder page (with consistent styling) so it no longer errors.

### Requirements
1. **Sidebar update**
   - Remove Device Code Flow entry from `Resources` menu config.
   - Confirm it remains under OpenID Connect menu.
   - Do not break deep-links (`/flows/device_code`).

2. **PAR route**
   - Define route `/flows/par` in `routes.tsx` (or equivalent).
   - If PAR flow is not yet implemented, provide a **placeholder panel** with title “Pushed Authorization Requests (PAR)” and info text “This flow is under construction.”

3. **Consistency**
   - Ensure sidebar highlights OpenID Connect → Device Code when visiting `/flows/device_code`.
   - Placeholder PAR page uses same panel style as other flows.

### React Example
```tsx
// routes.tsx
<Route path="/flows/par" element={<ParFlow />} />

// ParFlow.tsx
export default function ParFlow() {
  return (
    <div className="flow-panel">
      <h2>Pushed Authorization Requests (PAR)</h2>
      <p>This flow is under construction.</p>
    </div>
  );
}
```

### Acceptance Criteria
- Device Code Flow appears **only under OpenID Connect** in sidebar.
- `/flows/device_code` route still loads and highlights correctly.
- `/flows/par` route resolves without 404 and shows placeholder.
- No duplicate menu items in navigation.


---

## 17) AI Prompt: Navigation Tests — Prevent Duplicate Menu Items & Ensure `/flows/par` Works

### Goal
Add automated test coverage to ensure navigation integrity and route availability.

### Requirements
1. **Duplicate Menu Test**
   - Ensure `Device Code Flow` appears **only once** in sidebar navigation.
   - Test should query rendered sidebar items and confirm uniqueness.

2. **PAR Route Test**
   - Navigate to `/flows/par` and assert it renders the placeholder page.
   - Placeholder should contain heading: **"Pushed Authorization Requests (PAR)"**.

3. **General Route Safety**
   - Add regression guard for all flow routes to verify they don’t return 404.
   - Include `device_code`, `worker_token`, `hybrid`, `client_credentials`, etc.

### Example with React Testing Library + Vitest
```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../Sidebar";
import AppRoutes from "../AppRoutes";

test("Device Code Flow appears only once in sidebar", () => {
  render(<Sidebar />);
  const items = screen.getAllByText(/Device Code Flow/i);
  expect(items).toHaveLength(1);
});

test("PAR route renders placeholder", () => {
  render(
    <MemoryRouter initialEntries={["/flows/par"]}>
      <AppRoutes />
    </MemoryRouter>
  );
  expect(
    screen.getByRole("heading", { name: /Pushed Authorization Requests \(PAR\)/i })
  ).toBeInTheDocument();
});
```

### Acceptance Criteria
- Test suite fails if Device Code Flow shows more than once.
- Test suite fails if `/flows/par` does not render placeholder page.
- Route guard tests confirm all defined flows resolve successfully.
- All new tests pass in CI.


---

## 17) AI Prompt: Test Coverage — Routes & Navigation (No 404 for PAR, No Duplicates, Sticky Expansion)

### Goal
Add automated tests to prevent regressions in routing and left-nav behavior:
- `/flows/par` resolves without 404 and renders placeholder content.
- **Device Code Flow** appears **only once** in the sidebar (OpenID Connect) — no duplicates under Resources.
- **Sticky expansion** persists and restores open sections across route changes.

### Stack
Use **Vitest + React Testing Library** (or Jest if already configured).

### Tests

1) **Route: PAR should render**
```tsx
// routes.par.spec.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppRoutes from "@/AppRoutes";

test("PAR route renders without 404", async () => {
  render(
    <MemoryRouter initialEntries={["/flows/par"]}>
      <AppRoutes />
    </MemoryRouter>
  );
  expect(await screen.findByRole("heading", { name: /pushed authorization requests/i })).toBeInTheDocument();
  expect(screen.queryByText(/not found/i)).not.toBeInTheDocument();
});
```

2) **Sidebar: Device Code only under OpenID Connect**
```tsx
// nav.device-code.spec.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LeftNav from "@/components/LeftNav";

const sections = [
  { id:"oidc", title:"OpenID Connect", items:[{id:"device_code", title:"Device Code", href:"/flows/device_code"}] },
  { id:"resources", title:"Resources", items:[/* intentionally empty for this test */] },
];

test("Device Code appears only under OpenID Connect", () => {
  render(
    <MemoryRouter>
      <LeftNav sections={sections} />
    </MemoryRouter>
  );
  const deviceLinks = screen.getAllByRole("link", { name: /device code/i });
  expect(deviceLinks).toHaveLength(1);
});
```

3) **Sticky Expansion persists**
```tsx
// nav.sticky-expansion.spec.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LeftNav from "@/components/LeftNav";

function setupStorage() {
  const store: Record<string,string> = {};
  vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(k => store[k] ?? null);
  vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation((k,v) => { store[k]=String(v); });
}

test("section remains expanded across renders", () => {
  setupStorage();
  const sections = [
    { id:"oidc", title:"OpenID Connect", items:[{id:"device_code", title:"Device Code", href:"/flows/device_code"}] },
    { id:"resources", title:"Resources", items:[] },
  ];
  const { rerender } = render(
    <MemoryRouter>
      <LeftNav sections={sections} />
    </MemoryRouter>
  );

  // expand OIDC
  const toggle = screen.getByRole("button", { name: /openid connect/i });
  fireEvent.click(toggle);
  // re-render (simulate route change / reload)
  rerender(
    <MemoryRouter>
      <LeftNav sections={sections} />
    </MemoryRouter>
  );

  expect(toggle).toHaveAttribute("aria-expanded", "true");
});
```

### CI Notes
- Add to `vitest.config.ts` or Jest config:
  - `testEnvironment: "jsdom"`
- Run in CI: `pnpm vitest run --coverage` (or `npm/yarn` equivalent).

### Acceptance Criteria
- All three tests pass in CI.
- Failing any of these (404 reappears, duplicate links, non-sticky nav) blocks merge.


---

## 19) AI Prompt: Add **Docs** Menu (Official Ping Identity / PingOne SSO)

### Goal
Add a **Docs** section in the left sidebar that surfaces curated, official **Ping Identity** links (PingOne SSO), matching the app’s style and accessibility. All links must be to official Ping Identity domains only (e.g., `docs.pingidentity.com`, `www.pingidentity.com`, `developer.pingidentity.com`).

### Requirements
- New sidebar section: **Docs** → categories: **Overview**, **Tutorials**, **Developer Tools**, **Security Guides**.
- Links open in a new tab with `rel="noopener noreferrer"`. Show an external-link icon.
- Enforce domain allowlist: block or warn if a non-PingIdentity domain is added.
- Style matches other sidebar items; **sticky expansion** applies (Section 15).
- Add `/docs` route with a landing page mirroring left nav categories with descriptions.
- Add automated tests for link allowlist and 200/OK health (mocked).

### Navigation Config
```ts
// nav.config.ts
export const ALLOWED_DOC_DOMAINS = [
  "docs.pingidentity.com",
  "www.pingidentity.com",
  "pingidentity.com",
  "developer.pingidentity.com",
];

export type NavLinkItem = { id: string; title: string; href: string; external?: boolean };
export type NavSection = { id: string; title: string; items: NavLinkItem[] };

export const docsSection: NavSection = {
  id: "docs",
  title: "Docs",
  items: [
    // Overview
    { id: "docs-overview", title: "PingOne Overview", href: "https://docs.pingidentity.com/pingone/introduction_to_pingone/p1_introduction.html", external: true },
    // Tutorials
    { id: "docs-sso-setup", title: "Setup SSO (PingOne)", href: "https://docs.pingidentity.com/pingone/getting_started_with_pingone/p1_set_up_sso_p1_advanced_identity_cloud.html", external: true },
    { id: "docs-idp-init", title: "IdP-Initiated SSO → OIDC", href: "https://docs.pingidentity.com/pingone/integrations/p1_set_up_saml_initiated_sso_to_oidc_app.html", external: true },
    // Developer Tools
    { id: "docs-config-guides", title: "Configuration Guides", href: "https://docs.pingidentity.com/configuration_guides/config_configuration_guides.html", external: true },
    // Security Guides
    { id: "docs-sso-security", title: "SSO Security & Best Practices", href: "https://www.pingidentity.com/en/resources.html", external: true },
  ],
};
```

### Docs Route & Page
```tsx
// routes.tsx
<Route path="/docs" element={<DocsHome />} />

// DocsHome.tsx
import { docsSection } from "@/nav.config";
import { ExternalLinkIcon } from "@/components/icons";

function isAllowed(url: string) {
  try {
    const u = new URL(url);
    return ["docs.pingidentity.com","www.pingidentity.com","pingidentity.com","developer.pingidentity.com"].includes(u.hostname);
  } catch { return false; }
}

export default function DocsHome() {
  return (
    <div className="flow-panel">
      <h2>Documentation</h2>
      <p>Official Ping Identity documentation for PingOne SSO.</p>
      <ul className="doc-links">
        {docsSection.items.map(link => (
          <li key={link.id}>
            <a
              className="doc-link"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { if (!isAllowed(link.href)) { e.preventDefault(); alert("Blocked non-official domain."); } }}
              aria-label={`${link.title} (opens in new tab)`}
            >
              {link.title} <ExternalLinkIcon aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Sidebar Wiring
```tsx
// LeftNav.tsx (add docsSection to sections array)
import { docsSection } from "@/nav.config";

const sections = [
  // ...existing sections (OpenID Connect, Resources, etc)
  docsSection,
];
```

### Styling
```css
.doc-links { list-style: none; padding-left: 0; }
.doc-link { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
.doc-link:hover { text-decoration: underline; }
```

### Tests
```tsx
// docs.allowlist.spec.tsx
import { ALLOWED_DOC_DOMAINS, docsSection } from "@/nav.config";

test("all docs links point to allowed Ping Identity domains", () => {
  for (const item of docsSection.items) {
    const u = new URL(item.href);
    expect(ALLOWED_DOC_DOMAINS).toContain(u.hostname);
  }
});
```

```tsx
// docs.route.spec.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DocsHome from "@/pages/DocsHome";

test("/docs renders list of official docs", () => {
  render(
    <MemoryRouter initialEntries={["/docs"]}>
      <Routes><Route path="/docs" element={<DocsHome/>}/></Routes>
    </MemoryRouter>
  );
  expect(screen.getByRole("heading", { name: /documentation/i })).toBeInTheDocument();
  expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
});
```

### Acceptance Criteria
- New **Docs** section appears in sidebar with sticky expansion (Section 15).
- Only official **Ping Identity** links are present; attempts to add others are blocked.
- Links open in new tab with proper accessibility and icon.
- `/docs` route renders and all links work (manually QA’d).


---

## 20) AI Prompt: Docs Page — Add Summaries, Expand Allowlist (include openid.net), Block Okta/Auth0

### Goal
Improve the **Docs** experience with short descriptions under each link, allow referencing **openid.net** (public OIDC/OAuth specs), and **explicitly block Okta/Auth0** documentation in app links.

### Requirements
- Under each Docs link, render a concise 1–2 sentence description.
- Update domain allowlist to include `openid.net`.
- Add a denylist to block `okta.com`, `developer.okta.com`, `auth0.com`, `developer.auth0.com`.
- Keep style consistent with the rest of the app; preserve sticky expansion behavior.

### Navigation Config Changes
```ts
// nav.config.ts
export const ALLOWED_DOC_DOMAINS = [
  "docs.pingidentity.com",
  "www.pingidentity.com",
  "pingidentity.com",
  "developer.pingidentity.com",
  "openid.net", // NEW — allowed public OIDC/OAuth specs
];

export const DENIED_DOC_DOMAINS = [
  "okta.com",
  "developer.okta.com",
  "auth0.com",
  "developer.auth0.com",
];
```

### Docs Items with Descriptions
```ts
// nav.config.ts (Docs items augmented with descriptions)
export const docsSection = {
  id: "docs",
  title: "Docs",
  items: [
    {
      id: "docs-overview",
      title: "PingOne Overview",
      href: "https://docs.pingidentity.com/pingone/introduction_to_pingone/p1_introduction.html",
      external: true,
      desc: "Introduction to PingOne platform capabilities: SSO, MFA, identity verification, credentials, authorization, and more."
    },
    {
      id: "docs-sso-setup",
      title: "Setup SSO (PingOne)",
      href: "https://docs.pingidentity.com/pingone/getting_started_with_pingone/p1_set_up_sso_p1_advanced_identity_cloud.html",
      external: true,
      desc: "Step-by-step guidance to configure SSO to Advanced Identity Cloud from your PingOne environment."
    },
    {
      id: "docs-idp-init",
      title: "IdP-Initiated SSO → OIDC",
      href: "https://docs.pingidentity.com/pingone/integrations/p1_set_up_saml_initiated_sso_to_oidc_app.html",
      external: true,
      desc: "How to set up SAML-initiated SSO leading into OIDC applications in PingOne."
    },
    {
      id: "docs-config-guides",
      title: "Configuration Guides",
      href: "https://docs.pingidentity.com/configuration_guides/config_configuration_guides.html",
      external: true,
      desc: "Central index for Ping Identity configuration guides and the integration directory (SAML/OIDC apps)."
    },
    {
      id: "docs-oidc-spec",
      title: "OpenID Connect Specifications (openid.net)",
      href: "https://openid.net/developers/specs/",
      external: true,
      desc: "Canonical OpenID Connect specifications and extensions maintained by the OpenID Foundation."
    },
  ],
};
```

### Docs Page Update
```tsx
// DocsHome.tsx
import { docsSection, ALLOWED_DOC_DOMAINS, DENIED_DOC_DOMAINS } from "@/nav.config";
import { ExternalLinkIcon } from "@/components/icons";

function isAllowed(url: string) {
  try {
    const u = new URL(url);
    if (DENIED_DOC_DOMAINS.includes(u.hostname)) return false;
    return ALLOWED_DOC_DOMAINS.includes(u.hostname);
  } catch { return false; }
}

export default function DocsHome() {
  return (
    <div className="flow-panel">
      <h2>Documentation</h2>
      <p>Official Ping Identity and OpenID (public) documentation. No Okta/Auth0 links allowed.</p>
      <ul className="doc-links">
        {docsSection.items.map(link => (
          <li key={link.id} className="doc-item">
            <a
              className="doc-link"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { if (!isAllowed(link.href)) { e.preventDefault(); alert("Blocked: Non-allowed documentation domain."); } }}
              aria-label={`${link.title} (opens in new tab)`}
            >
              {link.title} <ExternalLinkIcon aria-hidden="true" />
            </a>
            {link.desc && <div className="doc-desc">{link.desc}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Styling
```css
.doc-links { list-style: none; padding-left: 0; }
.doc-item { margin: 8px 0 14px; }
.doc-link { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-weight: 600; }
.doc-link:hover { text-decoration: underline; }
.doc-desc { color: #525252; font-size: 0.92rem; margin-top: 4px; }
```

### Tests
```tsx
// docs.allowlist.spec.tsx
import { ALLOWED_DOC_DOMAINS, DENIED_DOC_DOMAINS, docsSection } from "@/nav.config";

test("all docs links are allowed and none are denied", () => {
  for (const item of docsSection.items) {
    const host = new URL(item.href).hostname;
    expect(DENIED_DOC_DOMAINS).not.toContain(host);
    expect(ALLOWED_DOC_DOMAINS).toContain(host);
  }
});
```

### Acceptance Criteria
- Each Docs link includes a short, accurate description.
- `openid.net` links work and are allowed.
- Any Okta/Auth0 domain is blocked from being added or clicked.
- Visual style and nav behavior remain consistent.


---

## 21) AI Prompt: **Docs → OIDC Specs Section** + **CI Link Checker**

### A) Add Dedicated **OIDC Specs** Section (OpenID Foundation)
Create a new **Docs** subsection titled **“OIDC Specs”** that lists canonical OpenID Connect specifications hosted on **openid.net**. Keep existing Docs categories (Overview, Tutorials, Developer Tools, Security Guides).

#### Requirements
- New sidebar section (or nested group under Docs): **OIDC Specs**
- All links must point to **openid.net** pages only
- Include short 1–2 sentence descriptions for each spec
- Respect allowlist/denylist from Section 20
- Same styling as other Docs entries, with sticky expansion

#### Navigation Config (example)
```ts
// nav.config.ts (append a new section or group under Docs)
export const oidcSpecsSection = {
  id: "oidc-specs",
  title: "OIDC Specs",
  items: [
    {
      id: "spec-oidc-core",
      title: "OpenID Connect Core 1.0",
      href: "https://openid.net/specs/openid-connect-core-1_0.html",
      external: true,
      desc: "Defines the core OIDC authentication flows and token interactions on top of OAuth 2.0."
    },
    {
      id: "spec-oidc-discovery",
      title: "OpenID Connect Discovery 1.0",
      href: "https://openid.net/specs/openid-connect-discovery-1_0.html",
      external: true,
      desc: "Describes how clients can discover OpenID Provider metadata and endpoints automatically."
    },
    {
      id: "spec-oidc-dcr",
      title: "OpenID Connect Dynamic Client Registration 1.0",
      href: "https://openid.net/specs/openid-connect-registration-1_0.html",
      external: true,
      desc: "Standardizes dynamic client registration and metadata for OIDC clients."
    },
    {
      id: "spec-oidc-front-channel-logout",
      title: "Front-Channel Logout 1.0",
      href: "https://openid.net/specs/openid-connect-frontchannel-1_0.html",
      external: true,
      desc: "Front-channel logout mechanism using the user-agent to notify RPs of logout."
    },
    {
      id: "spec-oidc-back-channel-logout",
      title: "Back-Channel Logout 1.0",
      href: "https://openid.net/specs/openid-connect-backchannel-1_0.html",
      external: true,
      desc: "Back-channel logout mechanism using direct server-to-server communication."
    },
    {
      id: "spec-oidc-session",
      title: "Session Management 1.0",
      href: "https://openid.net/specs/openid-connect-session-1_0.html",
      external: true,
      desc: "Manages end-user sessions for RPs and coordinates status with the OP."
    }
  ],
};
```

#### Sidebar Wiring
```tsx
// LeftNav.tsx (add oidcSpecsSection below Docs section)
import { docsSection, oidcSpecsSection } from "@/nav.config";

const sections = [
  // ...existing sections (OpenID Connect, Resources, etc)
  docsSection,
  oidcSpecsSection,
];
```

#### Docs Home Rendering
```tsx
// DocsHome.tsx (render both docsSection and oidcSpecsSection)
import { docsSection, oidcSpecsSection, ALLOWED_DOC_DOMAINS, DENIED_DOC_DOMAINS } from "@/nav.config";

function isAllowed(url: string) {
  try {
    const u = new URL(url);
    if (DENIED_DOC_DOMAINS.includes(u.hostname)) return false;
    return ALLOWED_DOC_DOMAINS.includes(u.hostname);
  } catch { return false; }
}

export default function DocsHome() {
  const groups = [docsSection, oidcSpecsSection];
  return (
    <div className="flow-panel">
      <h2>Documentation</h2>
      {groups.map(group => (
        <section key={group.id} className="docs-group">
          <h3>{group.title}</h3>
          <ul className="doc-links">
            {group.items.map(link => (
              <li key={link.id} className="doc-item">
                <a
                  className="doc-link"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { if (!isAllowed(link.href)) { e.preventDefault(); alert("Blocked: Non-allowed documentation domain."); } }}
                >
                  {link.title}
                </a>
                {link.desc && <div className="doc-desc">{link.desc}</div>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

---

### B) **CI Link Checker** for Docs (Ping Identity + openid.net Only)

#### Goal
Add a CI step that validates all Docs links are reachable (HTTP 2xx) and domains are allowlisted. Fail the build on broken or disallowed links.

#### Script (Node + TypeScript)
```ts
// scripts/check-doc-links.ts
import fs from "node:fs";
import path from "node:path";

const ALLOWED = new Set([
  "docs.pingidentity.com",
  "www.pingidentity.com",
  "pingidentity.com",
  "developer.pingidentity.com",
  "openid.net",
]);

const DENIED = new Set([
  "okta.com",
  "developer.okta.com",
  "auth0.com",
  "developer.auth0.com",
]);

const DOCS_FILES = [
  path.resolve("src/nav.config.ts"),
  path.resolve("src/pages/DocsHome.tsx"),
];

async function checkUrl(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (res.ok) return true;
    // fallback to GET if HEAD not allowed
    const resGet = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    return resGet.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function extractUrls(text: string): string[] {
  const re = /https?:\/\/[^\s"'<>)+]+/g;
  return Array.from(text.matchAll(re)).map(m => m[0]);
}

(async () => {
  const urls = new Set<string>();
  for (const file of DOCS_FILES) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    extractUrls(content).forEach(u => urls.add(u));
  }

  const failures: string[] = [];
  for (const u of urls) {
    try {
      const host = new URL(u).hostname;
      if (DENIED.has(host)) {
        failures.append?.(`DENIED DOMAIN: ${u}`) || failures.push(`DENIED DOMAIN: ${u}`);
        continue;
      }
      if (!ALLOWED.has(host)) {
        failures.push(`NON-ALLOWED DOMAIN: ${u}`);
        continue;
      }
      const ok = await checkUrl(u);
      if (!ok) failures.push(`BROKEN LINK: ${u}`);
    } catch {
      failures.push(`INVALID URL: ${u}`);
    }
  }

  if (failures.length) {
    console.error("Link check failed:\n" + failures.join("\n"));
    process.exit(1);
  } else {
    console.log(`Link check passed for ${urls.size} URLs.`);
  }
})();
```

#### GitHub Actions Workflow
```yaml
# .github/workflows/docs-link-check.yml
name: Docs Link Check

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  linkcheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build --if-present
      - run: node --version
      - name: Check Docs Links
        run: node scripts/check-doc-links.ts
```

#### Acceptance Criteria
- **OIDC Specs** group appears in Docs with descriptive entries (all under `openid.net`).
- Link checker runs in CI and **fails** on broken or disallowed links.
- Sidebar and Docs page maintain consistent styling and sticky expansion.


---

## 22) AI Prompt: **Add “OIDC for AI” Documentation Section**

### Purpose
Introduce a dedicated Docs section that addresses **OpenID Connect (OIDC) in the context of AI**, combining official documentation, industry insights, and academic research. This ensures developers and architects understand both the baseline OIDC protocol and its application to AI-driven systems.

### Requirements
- New sidebar section under Docs → **OIDC for AI**
- Group links into **Official Docs**, **OpenID Foundation**, **Industry Analysis**, and **Research**
- Each entry must have: title, link, and short description
- Respect domain allowlist/denylist rules (Ping Identity + openid.net allowed; Okta/Auth0 denied)

### Navigation Config (example)
```ts
export const oidcForAiSection = {
  id: "oidc-for-ai",
  title: "OIDC for AI",
  items: [
    {
      id: "ping-oidc-dev-guide",
      title: "Ping Identity OIDC Developer Guide",
      href: "https://docs.pingidentity.com/developer-resources/openid_connect_developer_guide/index.html?utm_source=chatgpt.com",
      external: true,
      desc: "Official Ping guide covering OIDC implementation, flows, and token validation."
    },
    {
      id: "openid-how-it-works",
      title: "OpenID Connect – How it Works (OpenID Foundation)",
      href: "https://openid.net/developers/how-connect-works/?utm_source=chatgpt.com",
      external: true,
      desc: "Explains how OIDC builds on OAuth 2.0 with ID tokens and federation capabilities."
    },
    {
      id: "prefactor-ai-oidc",
      title: "OAuth vs OIDC for AI Systems (Prefactor Blog)",
      href: "https://prefactor.tech/blog/oauth-vs-oidc-for-ai-systems-complete-guide?utm_source=chatgpt.com",
      external: true,
      desc: "Industry analysis on applying OIDC to AI ecosystems: agent verification, delegation, compliance."
    },
    {
      id: "arxiv-2501-09674",
      title: "Authenticated Delegation and Authorized AI Agents (Research)",
      href: "https://arxiv.org/abs/2501.09674?utm_source=chatgpt.com",
      external: true,
      desc: "Proposes extending OAuth/OIDC to issue agent-specific credentials for accountability."
    },
    {
      id: "arxiv-2505-19301",
      title: "Zero-Trust Identity Framework for Agentic AI (Research)",
      href: "https://arxiv.org/abs/2505.19301?utm_source=chatgpt.com",
      external: true,
      desc: "Advocates for DIDs and verifiable credentials to support trust in multi-agent AI systems."
    }
  ]
};
```

### Acceptance Criteria
- **OIDC for AI** group visible in Docs sidebar
- Four categories present (Official Docs, OpenID Foundation, Industry, Research)
- Each entry links correctly and displays description
- Styling matches existing Docs entries with sticky expansion

---

## 23) AI Prompt: **Globalize Spec/Info Card Styling (White BG, Black Text)** + **Menu Wiring for OIDC for AI**

### Goal
Make the **OAuth 2.1** informational boxes—and any similar **spec/info cards** across the entire app—use consistent, accessible styling: **white background** with **black text** (no inverted/low-contrast schemes). Also wire **OIDC for AI** into the left navigation permanently and keep sections expanded after selection.

### Scope
- Affects: OAuth 2.1 panels (e.g., *PKCE Required*, *Exact String Matching*), OIDC/OAuth doc cards, token examples, warnings, and spec highlights on all flow pages.
- Do **not** change the severity banners (Info/Warning/Error). Those retain their existing brand colors; only the content card body is normalized to white/black.

### Implementation

#### A) Design Tokens (CSS Variables)
```css
/* theme.css */
:root {
  --card-bg: #ffffff;
  --card-fg: #111111;
  --card-border: #E5E7EB;
  --card-muted: #525252;
  --code-bg: #f6f8fa;     /* for inline code + pre */
  --code-fg: #0f172a;
}

.dark :root {
  /* Keep accessible in dark mode as well */
  --card-bg: #ffffff;
  --card-fg: #111111;
  --card-border: #E5E7EB;
  --card-muted: #404040;
  --code-bg: #f6f8fa;
  --code-fg: #0f172a;
}
```

#### B) Reusable Card Class
```css
/* cards.css */
.spec-card {
  background: var(--card-bg);
  color: var(--card-fg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 16px;
}

.spec-card h3 { margin: 0 0 8px; font-weight: 700; }
.spec-card p  { margin: 0 0 8px; color: var(--card-muted); }
.spec-card pre, .spec-card code {
  background: var(--code-bg);
  color: var(--code-fg);
  border-radius: 8px;
  padding: 10px 12px;
  overflow: auto;
}
```

#### C) Component Update (Example: OAuth 2.1 Panels)
```tsx
// OAuth21Panels.tsx
export function OAuth21Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="spec-card" role="region" aria-label={title}>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
```

#### D) Global Sweep
- Replace ad-hoc dark panels with `<section class="spec-card">` or the `OAuth21Panel` component.
- Ensure **Header**, **Payload**, **Raw Token** displays (Token Management) use white background / black text (already requested in Section 17) and adopt the same variables.
- Keep **Warning**/**Error** banners (e.g., Security Warning) using brand-colored borders/backgrounds, but place their **body content** inside `.spec-card` where appropriate for readability.

#### E) Accessibility (AA+)
- Font-size min **14px** for body, **16px** for headings.
- Contrast: verify with tooling (`> 7:1` for body text). Use `--card-fg` and `--card-muted` as defined.
- Keyboard focus ring visible on links and buttons inside cards.

### F) Left Menu Wiring (Persistent Expansion)
```tsx
// LeftNav.tsx (excerpt)
import { docsSection, oidcSpecsSection, oidcForAiSection } from "@/nav.config";

const sections = [
  openIdConnectSection,
  resourcesSection, // device_code hidden here (duplicate removed)
  docsSection,
  oidcSpecsSection,
  oidcForAiSection, // NEW – OIDC for AI
];

// Keep group expanded for the current route and after navigation
function shouldStayOpen(sectionId: string, currentPath: string) {
  return localStorage.getItem(`nav-open:${sectionId}`) === "1"
    || currentPath.startsWith("/docs")
    || currentPath.startsWith("/oidc");
}
```

### G) QA Checklist
- [ ] All OAuth 2.1 info panels show **white background/black text**.
- [ ] Token Management “Header / Payload / Raw Token” boxes use the same theme variables.
- [ ] Security Warning banners remain brand-colored but content text is black on white.
- [ ] Left nav includes **OIDC for AI** under Docs and stays expanded post-click.
- [ ] No duplicate “Device Code” in **Resources** (link remains under **OpenID Connect** only).

### Acceptance Criteria
- Uniform spec/info card styling across the app with accessible contrast.
- OIDC for AI is visible and persistent in the menu.
- No regressions in spacing, hover/focus states, or banner severity styles.

---

## 24) AI Prompt: **Deployment Safety Split – “Safe to Apply” vs “Requires Context”**

### Purpose
Enable teams (or AI code engines with little prior knowledge) to apply improvements safely. Prompts are split into two categories:
- **A. Safe to Apply Without Full App Context** – UI/UX and docs-navigation items that are self-contained.
- **B. Requires Understanding of App Architecture** – Auth flows, context providers, and configuration loading that depend on existing logic.

### A) Safe to Apply Without Full Context
1. **Global Spec/Info Card Styling** (Section 23) – `.spec-card`, white background, black text, code block variables.
2. **OAuth 2.1 Panel Cleanup** (Sections 21/23) – PKCE required, exact redirect match; replace dark panels with `.spec-card`.
3. **Token Management Boxes Normalization** (Sections 17/23) – Header, Payload, Raw Token all using `.spec-card` and theme tokens.
4. **Security Warning Readability** (Section 20) – Keep brand color banners; body content in `.spec-card` for legibility.
5. **Left Menu Wiring & Persistence** (Sections 18/23) – Add **OIDC for AI**, keep sections expanded on selection, hide duplicate Device Code.
6. **Docs Integration Navigation** (Sections 16/22) – Docs → OIDC Specs (openid.net), Docs → OIDC for AI (Ping + OpenID + industry + research). *Links only; no dynamic fetching.*
7. **UI Fixes** – Eye icon for mask/unmask secrets; copy icon cleanup; menu default expansion (OpenID Connect, Resources).

**Acceptance for A**
- No TypeScript type changes beyond new components/props.
- No new backend calls or config services.
- All styles scoped via CSS variables and reusable class/component.

### B) Requires App Understanding (Proceed with Caution)
1. **NewAuthContext config loading bug** – `ReferenceError: Cannot access 'config2' before initialization`. Likely variable hoisting/temporal dead zone and double-initialization with localStorage fallback.
2. **Authorization Code / PKCE Error** – `invalid_request: code_challenge is required` – ensure PKCE generation and inclusion in authorization request.
3. **Hybrid Flow Null Access** – `Cannot read properties of undefined (reading 'clientId')` in `HybridFlow.tsx#generateAuthUrl` – credentials injection order and null-guards.
4. **Client Credentials Flow** – `Cannot read properties of undefined (reading 'clientId')` in `ClientCredentialsFlow.tsx#377` – guard and ensure `FlowCredentials` populates.
5. **Worker Token Flow** – step 1 error: undefined `clientId` – flow-specific credentials vs global merge timing.
6. **Device Code Flow** – missing `deviceAuthorizationEndpoint` – fetch from discovery or config; handle well-known `.well-known/openid-configuration` parsing.
7. **Dashboard Autofill/Extension Noise** – Bitwarden “Cannot find menu item …” – avoid conflating with app errors; add debounce/suppression in dev mode.
8. **404 on /flows/par** – Add route or hide link until implemented; guard nav to avoid dead links.

**Acceptance for B**
- Add null guards and typed fallbacks for credentials objects.
- Centralize discovery: fetch `.well-known/openid-configuration` for PingOne tenant on demand; cache in context.
- Ensure PKCE utilities (verifier/challenge) are generated per session and persisted through redirect.
- Step orchestration in `StepByStepFlow.tsx` must check preconditions; surface friendly error panel when unmet.
- Unit tests for each flow step happy-path and major failure-path.

### How to Use This Split
- Feed **A (Safe)** to a cold AI/code engine to implement immediately.
- Assign **B (Context)** to a dev or an AI run that is allowed to analyze `NewAuthContext.tsx`, `FlowCredentials`, and each *Flow*. Apply with tests.

