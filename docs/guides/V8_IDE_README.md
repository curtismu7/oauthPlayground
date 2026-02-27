# V8 Identity Training IDE — README

This document describes how to create and use the **V8 Unified Identity Training IDE** as a **separate project** based on your existing PingOne OAuth/MFA playground.

The IDE is **educational-first**:
- It may show **real-looking secrets and tokens** for teaching.
- It runs **locally only**.
- It must **not break or modify** your existing project.

All examples below assume the base path:

```text
/Users/cmuir/P1Import-apps/oauth-playground
```

---

## 1. Project Layout & New Directory

Create a **new sibling directory** under the existing project root, for example:

```text
/Users/cmuir/P1Import-apps/oauth-playground/
  ├── src/               # existing app sources
  ├── package.json       # existing app
  ├── ...                # other existing files
  ├── identity-training-ide-v8/   # NEW V8 IDE project
```

The **`identity-training-ide-v8`** folder will contain the new IDE codebase.  
The **original project** remains untouched and continues to function as-is.

A possible layout inside the new directory:

```text
identity-training-ide-v8/
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts or webpack.config.js
  ├── public/
  └── src/
      ├── index.tsx
      ├── App.tsx
      ├── routes/
      │   ├── FlowExplorerPage.tsx
      │   ├── FlowDetailPage.tsx
      │   └── TokenLabPage.tsx
      ├── flows/
      │   ├── oauth/
      │   ├── mfa/
      │   ├── device-authorization/
      │   └── password-reset/
      ├── training/
      │   ├── panels/
      │   │   ├── CodePanel.tsx
      │   │   ├── RequestResponsePanel.tsx
      │   │   ├── TokenViewerPanel.tsx
      │   │   └── FlowTimelinePanel.tsx
      │   ├── simulators/
      │   └── explanations/
      ├── shared/
      │   ├── pingone-api/
      │   ├── tokens/
      │   ├── logging/
      │   └── ui/
      └── styles/
          └── ide-theme.css
```

---

## 2. Installing & Running the V8 IDE

From the new directory:

```bash
cd /Users/cmuir/P1Import-apps/oauth-playground/identity-training-ide-v8

# Initialize (if starting clean)
npm init -y

# Install dependencies (example using React + Vite)
npm install react react-dom
npm install --save-dev typescript vite @types/react @types/react-dom

# Run dev server
npm run dev
```

Your `package.json` might include scripts like:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

You can keep the **original app scripts** unchanged in the root project and run them **independently**.

---

## 3. High-Level UI Concept

The V8 IDE is structured around a **main shell** with:

- A **left sidebar**: Flow Explorer & navigation.
- A **top header**: Environment, region, and quick status.
- A **main content area**: Panels for code, tokens, requests, logs, and timelines.

Below are **HTML mocks** showing how this could look visually.  
These are not final designs, but conceptual blueprints.

---

## 4. HTML Mock — Flow Explorer Page

This mock shows a landing page listing all flows as cards with a summary and “Open in IDE” button.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>V8 Identity Training IDE – Flow Explorer</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e5e7eb;
    }
    .app-shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      height: 100vh;
    }
    .sidebar {
      background: #020617;
      border-right: 1px solid #1f2937;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sidebar h1 {
      font-size: 18px;
      margin: 0 0 8px 0;
      color: #f97316;
    }
    .sidebar .env-card {
      background: #0b1120;
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      border: 1px solid #1f2937;
    }
    .sidebar nav a {
      display: block;
      padding: 8px 10px;
      margin-bottom: 4px;
      border-radius: 6px;
      font-size: 13px;
      color: #cbd5f5;
      text-decoration: none;
    }
    .sidebar nav a.active,
    .sidebar nav a:hover {
      background: #1f2937;
      color: #f9fafb;
    }
    .main {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .topbar {
      padding: 12px 16px;
      border-bottom: 1px solid #1f2937;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #020617;
    }
    .topbar-title {
      font-size: 16px;
      font-weight: 600;
    }
    .topbar-badges span {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      margin-left: 8px;
      border-radius: 999px;
      font-size: 11px;
      background: #111827;
      border: 1px solid #374151;
    }
    .content {
      padding: 16px 20px;
      overflow: auto;
    }
    .flow-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }
    .flow-card {
      background: #020617;
      border-radius: 12px;
      border: 1px solid #1f2937;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
    }
    .flow-card h2 {
      font-size: 14px;
      margin: 0;
      color: #e5e7eb;
    }
    .flow-chip {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid #374151;
      background: #0f172a;
      display: inline-block;
      margin-right: 4px;
    }
    .flow-card p {
      font-size: 12px;
      margin: 4px 0 0 0;
      color: #9ca3af;
    }
    .flow-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    .flow-footer button {
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      background: #16a34a;
      color: #ecfdf5;
    }
    .flow-footer button.secondary {
      background: #111827;
      color: #e5e7eb;
      border: 1px solid #374151;
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <h1>V8 Identity IDE</h1>
      <div class="env-card">
        <div><strong>Environment:</strong> pingone-demo</div>
        <div><strong>Region:</strong> NA</div>
        <div><strong>Mode:</strong> Local / Educational</div>
      </div>
      <nav>
        <a href="#" class="active">Flow Explorer</a>
        <a href="#">Token Lab</a>
        <a href="#">MFA Device Studio</a>
        <a href="#">Logs & Timeline</a>
        <a href="#">Settings</a>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="topbar-title">Flow Explorer</div>
        <div class="topbar-badges">
          <span>PingOne MFA</span>
          <span>OAuth & OIDC</span>
          <span>Teaching Mode: ON</span>
        </div>
      </header>

      <section class="content">
        <div class="flow-grid">
          <article class="flow-card">
            <h2>Authorization Code + PKCE</h2>
            <div>
              <span class="flow-chip">OAuth 2.0</span>
              <span class="flow-chip">Browser</span>
            </div>
            <p>Walk through the full authorization code flow with PKCE, including redirect, token exchange, and user_info.</p>
            <div class="flow-footer">
              <button>Open in IDE</button>
              <button class="secondary">View Docs</button>
            </div>
          </article>

          <article class="flow-card">
            <h2>Device Authorization (TV / Console)</h2>
            <div>
              <span class="flow-chip">OAuth 2.0</span>
              <span class="flow-chip">Device</span>
            </div>
            <p>Simulate a TV-like device using the device_code/user_code pattern, including pending and expired scenarios.</p>
            <div class="flow-footer">
              <button>Open in IDE</button>
              <button class="secondary">View Docs</button>
            </div>
          </article>

          <article class="flow-card">
            <h2>MFA Device Registration (SMS / Email / WhatsApp)</h2>
            <div>
              <span class="flow-chip">PingOne MFA</span>
              <span class="flow-chip">Enrollment</span>
            </div>
            <p>See how to create and activate MFA devices using PingOne APIs, including educational defaults and status changes.</p>
            <div class="flow-footer">
              <button>Open in IDE</button>
              <button class="secondary">View Docs</button>
            </div>
          </article>

          <article class="flow-card">
            <h2>Redirect-less Authorization (pi.flow)</h2>
            <div>
              <span class="flow-chip">Advanced</span>
              <span class="flow-chip">PingOne</span>
            </div>
            <p>Explore redirect-less login using PingOne pi.flow, including worker token vs user token usage.</p>
            <div class="flow-footer">
              <button>Open in IDE</button>
              <button class="secondary">View Docs</button>
            </div>
          </article>
        </div>
      </section>
    </main>
  </div>
</body>
</html>
```

You can paste this into a standalone HTML file to get a **visual mock** of the V8 IDE’s Flow Explorer.

---

## 5. HTML Mock — Flow Detail with Side-by-Side Panels

This mock shows how a **single flow** might look once opened, with side-by-side panels for code, tokens, HTTP requests, and a timeline.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>V8 Identity Training IDE – Flow Detail</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #020617;
      color: #e5e7eb;
    }
    .page {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .header {
      padding: 12px 20px;
      border-bottom: 1px solid #1f2937;
      background: #020617;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title {
      font-size: 16px;
      font-weight: 600;
    }
    .header-subtitle {
      font-size: 12px;
      color: #9ca3af;
    }
    .badges span {
      display: inline-flex;
      padding: 4px 8px;
      margin-left: 6px;
      border-radius: 999px;
      background: #0b1120;
      border: 1px solid #374151;
      font-size: 11px;
    }
    .body {
      display: grid;
      grid-template-columns: 1.4fr 1.2fr;
      grid-template-rows: 1fr 0.9fr;
      gap: 10px;
      padding: 10px 16px 14px 16px;
      height: 100%;
      box-sizing: border-box;
    }
    .panel {
      border-radius: 10px;
      background: #020617;
      border: 1px solid #1f2937;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 8px 10px;
      border-bottom: 1px solid #1f2937;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #030712;
    }
    .panel-header span {
      opacity: 0.9;
    }
    .panel-body {
      padding: 8px 10px;
      font-size: 11px;
      overflow: auto;
      line-height: 1.45;
    }
    pre {
      margin: 0;
      font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
      white-space: pre-wrap;
    }
    .timeline-step {
      margin-bottom: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      background: #020617;
      border: 1px dashed #374151;
    }
    .timeline-step h4 {
      margin: 0 0 2px 0;
      font-size: 11px;
      color: #e5e7eb;
    }
    .timeline-step p {
      margin: 0;
      font-size: 11px;
      color: #9ca3af;
    }
    .tag {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid #374151;
      margin-left: 6px;
    }
    .pill {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 999px;
      background: #15803d;
      color: #ecfdf5;
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="header">
      <div>
        <div class="header-title">
          Authorization Code + PKCE
          <span class="tag">OAuth 2.0</span>
          <span class="tag">Browser</span>
        </div>
        <div class="header-subtitle">End-to-end login flow using PingOne with explicit teaching defaults.</div>
      </div>
      <div class="badges">
        <span>Teaching Mode</span>
        <span class="pill">Environment: pingone-demo</span>
      </div>
    </header>

    <section class="body">
      <!-- Code Panel -->
      <section class="panel">
        <div class="panel-header">
          <span>Code Panel – React Component</span>
          <span>Read-only</span>
        </div>
        <div class="panel-body">
          <pre>
// src/flows/oauth/AuthCodePKCEFlow.tsx (excerpt)

const AuthCodePKCEFlow: React.FC = () => {
  // Teaching: we show explicit PingOne defaults HERE on purpose.
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);

  const handleStart = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Note: response_type, code_challenge_method, and scope are
    // explicitly shown for educational clarity, even if PingOne
    // would default some values.
    const url = buildAuthorizeUrl({
      response_type: "code",
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      scope: "openid profile email p1:read:user",
      redirect_uri: settings.redirectUri,
      client_id: settings.clientId,
      state: createState(),
      nonce: createNonce(),
    });

    setAuthorizationUrl(url);
    window.location.href = url;
  };

  return (...);
};
          </pre>
        </div>
      </section>

      <!-- Request / Response Panel -->
      <section class="panel">
        <div class="panel-header">
          <span>HTTP Requests & Responses</span>
          <span>Live View</span>
        </div>
        <div class="panel-body">
          <pre>
POST /as/token HTTP/1.1
Host: auth.pingone.com
Authorization: Basic &lt;client_id:client_secret (base64)&gt;
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&amp;code=4e0f6c...
&amp;redirect_uri=https://localhost:3000/v8/callback

---

HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs...",
  "token_type": "Bearer",
  "expires_in": 900
}
          </pre>
        </div>
      </section>

      <!-- Token Viewer Panel -->
      <section class="panel">
        <div class="panel-header">
          <span>Token Viewer</span>
          <span>Decoded ID Token</span>
        </div>
        <div class="panel-body">
          <pre>
Header:
{
  "alg": "RS256",
  "kid": "pingone-key-id"
}

Payload:
{
  "sub": "0057e7c9-8e54-4d1a-a613-2f3d4042f24d",
  "iss": "https://auth.pingone.com/&lt;env-id&gt;/as",
  "aud": "&lt;client_id&gt;",
  "email": "demo.user@example.com",
  "email_verified": true,
  "auth_time": 1733769123,
  "amr": [
    "pwd",
    "mfa"
  ]
}

Note: Tokens are shown in full for educational purposes.
          </pre>
        </div>
      </section>

      <!-- Flow Timeline Panel -->
      <section class="panel">
        <div class="panel-header">
          <span>Flow Timeline</span>
          <span>Step-by-step Teaching</span>
        </div>
        <div class="panel-body">
          <div class="timeline-step">
            <h4>Step 1 — Build Authorization URL</h4>
            <p>Generate PKCE verifier/challenge, state, and nonce. We show *every parameter* explicitly, even if PingOne defaults some of them.</p>
          </div>
          <div class="timeline-step">
            <h4>Step 2 — Redirect Browser to PingOne</h4>
            <p>The user is redirected to the PingOne authorize endpoint with the built URL. We explain each query parameter on hover.</p>
          </div>
          <div class="timeline-step">
            <h4>Step 3 — Callback &amp; Token Exchange</h4>
            <p>When PingOne redirects back with a code, we trade it for tokens. All request/response pairs appear in the HTTP panel.</p>
          </div>
          <div class="timeline-step">
            <h4>Step 4 — Inspect Tokens &amp; Claims</h4>
            <p>Access token and ID token are decoded and displayed in the Token Viewer with comments on each important claim.</p>
          </div>
          <div class="timeline-step">
            <h4>Step 5 — Optional: user_info / introspection</h4>
            <p>We show how to call user_info and/or introspect for deeper inspection, including which token each endpoint accepts.</p>
          </div>
        </div>
      </section>
    </section>
  </div>
</body>
</html>
```

You can paste this into an `.html` file to **see the training layout** of a single flow.

---

## 6. How Cursor Uses These Prompts

In the new project, you will typically:

1. Open the **root prompt** like `fixTheCodeV8.md` in Cursor.
2. Ask Cursor to:
   - Create the `identity-training-ide-v8` directory (if not already created).
   - Scaffold the basic React/Vite app.
   - Implement the **Flow Explorer** page following the HTML mock.
   - Implement a **single Flow Detail page** first (e.g., Auth Code + PKCE).
3. Gradually:
   - Port existing flows from the original project into the IDE.
   - Wrap them with panels and teaching content.
   - Add scenario simulators and timeline steps.

All **new code** lives inside `identity-training-ide-v8`.  
The **existing OAuth/MFA playground** is kept as-is, and can continue to evolve independently.

---

## 7. Next Steps

1. Confirm the new directory name (e.g. `identity-training-ide-v8`).  
2. Let Cursor scaffold the new project using the layout above.  
3. Use the HTML mocks as visual targets for your React components.  
4. Add more flows and panels as your teaching use cases grow.

This V8 IDE becomes your **visual and interactive identity lab**, while your original project remains your core playground and reference implementation.
