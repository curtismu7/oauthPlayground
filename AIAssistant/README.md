# OAuth AI Assistant — Standalone Page

A self-contained React app that hosts the AI Assistant as a full-page application.  
It reuses the existing `server.js` backend and all API keys you've already configured.

## Features

- **Full-page AI chat** — same power as the floating assistant, no button to click
- **OAuth Login Window** — click "🔐 OAuth Login" in the top bar to open the Authorization
  Code Flow panel: configure endpoints, launch a login popup, capture the callback, and
  exchange the code for tokens — all in one panel
- **PKCE support** — S256 code challenge generated client-side
- **OIDC Discovery** — hit "🔍 Discover" to auto-fill endpoints from the `.well-known` doc
- **API Key Configuration** — the `/configuration` route lets you manage Groq, Brave, and
  GitHub keys (same as the main app)
- **Callback page** — `/callback` receives the authorization code redirect and displays it

## Running

Make sure the backend (`server.js`) is running on port 3001, then:

```bash
# From the repo root
npm run assistant
```

Opens at **https://localhost:3002** (uses the same self-signed cert as development).

Or run manually:

```bash
npx vite --root AIAssistant --port 3002
```

## Architecture

```
AIAssistant/
├── index.html                       # HTML entry point
├── vite.config.ts                   # Vite dev server (port 3002, proxies /api → 3001)
├── tsconfig.json                    # TypeScript config
└── src/
    ├── main.tsx                     # React entry
    ├── App.tsx                      # Router + layout (main page / config / callback)
    ├── components/
    │   ├── AIAssistant.tsx          # Copy of the AI Assistant (fullPage prop added)
    │   ├── ApiKeyConfiguration.tsx  # Copy of the API key config UI
    │   └── OAuthLoginPanel.tsx      # NEW: OAuth Authorization Code Flow login window
    ├── services/                    # Copies of all required services
    │   ├── aiAgentService.ts
    │   ├── aiAssistantWorkerTokenService.ts
    │   ├── apiKeyService.ts
    │   ├── groqService.ts
    │   ├── mcpQueryService.ts
    │   ├── unifiedWorkerTokenService.ts
    │   └── unifiedTokenStorageService.ts
    ├── standards/
    │   └── types.ts                 # ServiceResult type contracts
    └── utils/
        └── logger.ts
```

## OAuth Login Window

1. Click **🔐 OAuth Login** in the top bar
2. Fill in your Authorization Endpoint, Client ID, Redirect URI, and Scopes
   - Or click **🔍 Discover** to auto-fill from the OIDC well-known endpoint
3. Click **▶ Open Login Window** — a popup opens with the PingOne login page
4. After login the popup closes and the callback parameters appear automatically
5. For Authorization Code flows, click **🔄 Exchange Code for Tokens** to get the token set

The redirect_uri should point back to this app:
```
https://localhost:3002/callback
```

Register this URI in your PingOne application's redirect URIs.

## Backend Dependencies

The standalone frontend proxies all `/api/*` calls to `server.js` (port 3001).  
No additional setup is needed — the same backend serves both the main app and the assistant.

Key endpoints used:
- `POST /api/groq/chat` — Groq LLM
- `GET/POST /api/api-key/:service` — API key storage (Groq, Brave, GitHub)
- `POST /api/mcp/query` — PingOne live data via MCP tools
- `GET /api/mcp/web-search` — Brave Search
- `POST /api/pingone/token` — Worker token refresh
- `POST /api/token-exchange` — Authorization code → tokens (proxies to PingOne)
