# MCP Inspector — Setup, Configuration & Usage Guide

**MasterFlow API · PingOne MCP Server**  
**Inspector version:** `@modelcontextprotocol/inspector` (latest via npx)  
**Inspector UI port:** `6274`  
**Node.js requirement:** `^22.7.5` (strict — older versions will fail silently)

---

## Overview

The MCP Inspector is a browser-based debug UI from the Model Context Protocol team. It spawns your MCP server as a stdio child process, then lets you:

- Browse all registered tools with their full JSON schemas
- Execute any tool interactively and inspect the raw JSON-RPC message exchange
- View server-side logs in real time
- Validate that new tools are correctly registered before wiring them into an AI client

In this project it connects exclusively to the **PingOne MCP server** (`pingone-mcp-server/`), which exposes 70+ tools for managing PingOne environments, users, groups, applications, OAuth flows, and tokens.

---

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Node.js | `^22.7.5` | `node --version` |
| npm | `^10` | `npm --version` |
| PingOne MCP server built | `pingone-mcp-server/dist/index.js` | `ls pingone-mcp-server/dist/index.js` |
| Credentials saved | `~/.pingone-playground/credentials/mcp-config.json` | see [Credentials](#credentials) |

> **Note:** Node 22 is required by the MCP Inspector at runtime. If you have multiple Node versions (e.g. via nvm), run `nvm use 22` before starting the inspector manually.

---

## Quick Start

```bash
# From repo root:
npm run mcp:inspector
```

This runs:
```
npx @modelcontextprotocol/inspector --config mcp-inspector-config.json --server pingone --no-open
```

Open **http://localhost:6274** in your browser. The inspector prints a one-time session token to the console — the URL has it pre-filled.

---

## How It's Wired Into run.sh

The inspector starts automatically when you run the app in **assistant** or **both** mode:

```bash
./run.sh -assistant   # backend + MCP server + MCP Inspector + AI Assistant
./run.sh -both        # all of the above + frontend Vite
```

The `start_mcp_inspector()` function in `scripts/development/run.sh`:
1. Checks that `mcp-inspector-config.json` exists at the repo root
2. Kills any existing process on port 6274
3. Runs `npx @modelcontextprotocol/inspector` in the background
4. Writes the PID to `.mcp-inspector.pid` for clean shutdown via `./stop.sh`
5. Logs to `mcp-inspector.log` in the repo root

`./stop.sh` kills the inspector by PID file and scopes the `pkill` to the project root, so it won't affect any other project's inspector.

---

## Configuration

### `mcp-inspector-config.json` (repo root)

```json
{
  "mcpServers": {
    "pingone": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "pingone-mcp-server/src/index.ts"],
      "env": {
        "MCP_LOG_DIR": "logs"
      }
    }
  }
}
```

| Field | Purpose |
|---|---|
| `type: "stdio"` | Server communicates over stdin/stdout (required for all local servers) |
| `command: "npx"` | Uses npx to resolve `tsx` without a global install |
| `args: ["tsx", "..."]` | Runs the TypeScript source directly — no build step needed for dev |
| `MCP_LOG_DIR: "logs"` | Server writes its debug logs to `logs/mcp-server.log` |

> **Tip:** If you want to test the compiled build instead of typescript source, change `args` to `["node", "pingone-mcp-server/dist/index.js"]`. This is faster to start but requires a build first.

### Adding More Servers to Inspector

To add one of the project's other servers for inspection, add a second entry:

```json
{
  "mcpServers": {
    "pingone": { ... },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "memory-mcp-server/src/index.ts"],
      "env": {}
    }
  }
}
```

Then target it: `npm run mcp:inspector -- --server memory`

---

## Credentials

The PingOne MCP server reads credentials at startup from (in priority order):

1. **Environment variables**: `PINGONE_ENVIRONMENT_ID`, `PINGONE_CLIENT_ID`, `PINGONE_CLIENT_SECRET`, `PINGONE_API_URL`  
2. **File**: `~/.pingone-playground/credentials/mcp-config.json`

### mcp-config.json format

```json
{
  "environmentId": "your-pingone-environment-id",
  "clientId":      "your-client-id",
  "clientSecret":  "your-client-secret",
  "apiUrl":        "https://auth.pingone.com"
}
```

| `apiUrl` value | Region |
|---|---|
| `https://auth.pingone.com` | North America (US) |
| `https://auth.pingone.eu` | Europe |
| `https://auth.pingone.asia` | Asia-Pacific |
| `https://auth.pingone.ca` | Canada |

### How to set credentials

**Option A — Via the app UI (recommended)**  
Open the MasterFlow API app → open the Worker Token modal (or Configuration page → Worker Token section) → enter your PingOne credentials → Save. The app writes `mcp-config.json` automatically.

**Option B — Manually**

```bash
mkdir -p ~/.pingone-playground/credentials
cat > ~/.pingone-playground/credentials/mcp-config.json <<'EOF'
{
  "environmentId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientId":      "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret":  "your-secret",
  "apiUrl":        "https://auth.pingone.com"
}
EOF
```

**Option C — Environment variables**

```bash
export PINGONE_ENVIRONMENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export PINGONE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export PINGONE_CLIENT_SECRET="your-secret"
export PINGONE_API_URL="https://auth.pingone.com"
npm run mcp:inspector
```

---

## Using the Inspector UI

### 1. Connect

Navigate to **http://localhost:6274**. The inspector shows a "Connected" status indicator at the top. If it shows "Disconnected", see [Troubleshooting](#troubleshooting).

### 2. Browse Tools

Click the **Tools** tab in the left panel. You'll see all 70+ registered tools grouped by category. Each tool shows:
- Name and description
- Full `inputSchema` (the Zod-derived JSON Schema)
- Required vs optional parameters

### 3. Execute a Tool

1. Click any tool name to expand it
2. Fill in the parameter inputs (the UI renders a form from the JSON Schema)
3. Click **Run**
4. The right panel shows:
   - The raw JSON-RPC `tools/call` request sent to the server
   - The raw JSON-RPC response from the server
   - A rendered view of the tool result

### 4. View Logs

The **Logs** tab streams anything the server writes to stderr. The PingOne MCP server writes structured logs to both `logs/mcp-server.log` and stderr — you'll see tool call traces, PingOne API calls, and error details here.

### 5. Resources Tab

The **Resources** tab lists any resources the server exposes. The PingOne server exposes:
- Training resources (static documentation links)
- `pingone://applications` (dynamic list, reads from PingOne API when fetched)

---

## CLI Mode (Scripting & CI)

For headless use, automated testing, or scripting:

```bash
# List all registered tools
npx @modelcontextprotocol/inspector \
  --cli \
  --config mcp-inspector-config.json \
  --server pingone \
  --method tools/list

# npm script shortcut:
npm run mcp:tools:list

# Call a specific tool
npx @modelcontextprotocol/inspector \
  --cli \
  --config mcp-inspector-config.json \
  --server pingone \
  --method tools/call \
  --tool-name pingone_list_users \
  --tool-arg limit=5
```

### What is `tools/call`?

`tools/call` is the MCP JSON-RPC method used to **invoke any registered tool on the MCP server**. When you pass `--method tools/call`, the inspector sends a `tools/call` request with the tool name and arguments you supply, and prints the raw response.

The PingOne MCP server exposes **70+ tools** across these categories:

#### Users
| Tool | Description |
|---|---|
| `pingone_list_users` | List users with optional filter/limit |
| `pingone_lookup_users` | Full-text search across users |
| `pingone_get_user` | Get a single user by ID |
| `pingone_create_user` | Create a new user |
| `pingone_update_user` | Update user attributes |
| `pingone_delete_user` | Delete a user |
| `pingone_get_user_groups` | List groups a user belongs to |
| `pingone_get_user_roles` | List roles assigned to a user |
| `pingone_get_user_consents` | Get a user's OAuth consents |
| `pingone_check_username_password` | Validate username/password credentials |
| `pingone_password_state` | Get current password state for a user |
| `pingone_password_send_recovery_code` | Send a password recovery code |

#### Groups
| Tool | Description |
|---|---|
| `pingone_list_groups` | List groups |
| `pingone_get_group` | Get a group by ID |
| `pingone_create_group` | Create a new group |
| `pingone_update_group` | Update a group |
| `pingone_delete_group` | Delete a group |
| `pingone_add_user_to_group` | Add a user to a group |
| `pingone_remove_user_from_group` | Remove a user from a group |

#### Applications
| Tool | Description |
|---|---|
| `pingone.applications.list` | List applications |
| `pingone_get_application` | Get an application by ID |
| `pingone_create_application` | Create an OIDC/SAML application |
| `pingone_update_application` | Update application settings |
| `pingone_delete_application` | Delete an application |
| `pingone_get_application_secret` | Get client secret |
| `pingone_rotate_application_secret` | Rotate client secret |
| `pingone_get_application_resources` | Get resource grants for an app |

#### Tokens & Auth
| Tool | Description |
|---|---|
| `pingone_get_worker_token` | Get a worker (client credentials) access token |
| `pingone_introspect_token` | Introspect an access or refresh token |
| `pingone_token_exchange` | Perform OAuth 2.0 Token Exchange (RFC 8693) |
| `pingone_decode_jwt` | Decode and display JWT claims |
| `pingone_oidc_config` | Get current OIDC client configuration |
| `pingone_oidc_discovery` | Fetch the OIDC discovery document |
| `pingone_userinfo` | Call the UserInfo endpoint with an access token |
| `pingone.workerToken.issue` | Issue a worker token via client credentials |
| `pingone.auth.login` | Authenticate with username/password (ROPC) |
| `pingone.auth.logout` | Revoke tokens / logout |
| `pingone.auth.refresh` | Refresh an access token |
| `pingone.auth.userinfo` | Get userinfo via the auth service |

#### Redirectless (pi.flow) Auth
| Tool | Description |
|---|---|
| `pingone.redirectless.start` | Start a redirectless Authorization Code flow |
| `pingone.redirectless.poll` | Poll for a redirectless auth result |
| `pingone.redirectless.complete` | Complete/exchange the redirectless flow |

#### MFA
| Tool | Description |
|---|---|
| `pingone.mfa.devices.list` | List MFA devices for a user |
| `pingone.mfa.devices.register` | Register a new MFA device |
| `pingone.mfa.devices.activate` | Activate a registered device |
| `pingone.mfa.devices.delete` | Delete an MFA device |
| `pingone.mfa.devices.block` / `unblock` | Block/unblock a device |
| `pingone.mfa.devices.unlock` | Unlock a locked device |
| `pingone.mfa.devices.otp` | Send OTP to a device |
| `pingone.mfa.devices.nickname` | Set a device nickname |
| `pingone.mfa.devices.reorder` | Reorder preferred devices |
| `pingone.mfa.challenge.send` | Send an MFA challenge |
| `pingone.mfa.challenge.validate` | Validate an MFA challenge response |
| `pingone.mfa.bypass.allow` | Create an MFA bypass |
| `pingone.mfa.bypass.check` | Check bypass status |
| `pingone.mfa.policy.list` / `get` / `create` / `update` | Manage MFA policies |

#### Device Authorization
| Tool | Description |
|---|---|
| `pingone_device_authorization` | Start a Device Authorization (RFC 8628) flow |

#### Populations & Organizations
| Tool | Description |
|---|---|
| `pingone_list_populations` | List populations |
| `pingone_get_population` | Get a population by ID |
| `pingone_get_organization_licenses` | Get organization license info |

#### Subscriptions (Webhooks)
| Tool | Description |
|---|---|
| `pingone_list_subscriptions` | List event subscriptions |
| `pingone_get_subscription` | Get a subscription by ID |
| `pingone_create_subscription` | Create a webhook subscription |
| `pingone_update_subscription` | Update a subscription |
| `pingone_delete_subscription` | Delete a subscription |

#### Risk
| Tool | Description |
|---|---|
| `pingone_risk_evaluation` | Evaluate risk for a user/session |

### CLI `tools/call` examples

```bash
# Get a worker token
npm run mcp:inspector -- --cli --method tools/call \
  --tool-name pingone_get_worker_token

# List users (limit 10)
npm run mcp:inspector -- --cli --method tools/call \
  --tool-name pingone_list_users --tool-arg limit=10

# Get a user by ID
npm run mcp:inspector -- --cli --method tools/call \
  --tool-name pingone_get_user --tool-arg userId=<uuid>

# Introspect a token
npm run mcp:inspector -- --cli --method tools/call \
  --tool-name pingone_introspect_token --tool-arg token=<access_token>

# List MFA devices for a user
npm run mcp:inspector -- --cli --method tools/call \
  --tool-name pingone.mfa.devices.list --tool-arg userId=<uuid>
```

---

## Running in Cursor or VS Code

The inspector is for human testing. For AI clients (Cursor, Claude Desktop, VS Code Copilot), configure them to connect to the server directly.

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "pingone": {
      "command": "npx",
      "args": ["tsx", "pingone-mcp-server/src/index.ts"],
      "env": {}
    }
  }
}
```

This file is already configured and is gitignored. When Cursor is open in this repo, it connects to the PingOne MCP server automatically.

---

## MCP Spec Validation

For automated validation that the server conforms to the MCP spec (2025-11-25):

```bash
npm run mcp:validate
# or:
pnpm run mcp:validate
```

This test (`tests/backend/mcp-spec-validation.test.js`) spawns the server over stdio, exercises `initialize` → `notifications/initialized` → `tools/list`, and asserts:
- Server responds to JSON-RPC
- `tools/list` returns ≥50 tools with `name`, `description`, `inputSchema`
- Key tools (`pingone_get_user`, `pingone_list_users`, `pingone_oidc_config`, etc.) are present

Run after any structural change to `pingone-mcp-server/src/`.

---

## Troubleshooting

### Inspector exits immediately

```bash
cat mcp-inspector.log
```

Common causes:
- **Wrong Node version** — inspector requires Node `^22.7.5`. Run `node --version`. Use `nvm use 22` if needed.
- **Port 6274 already in use** — `lsof -ti:6274 | xargs kill -9`
- **mcp-inspector-config.json not found** — must run from repo root

### "Could not connect to server"

The inspector UI can't reach the MCP server child process. Check:
- `logs/mcp-server.log` for startup errors
- Credentials file exists: `ls ~/.pingone-playground/credentials/mcp-config.json`
- MCP server source is valid: `cd pingone-mcp-server && npx tsx src/index.ts` (should hang waiting for stdin — press Ctrl+C)

### Tools list is empty

The server started but registered no tools. This means either:
- A TypeScript compile error in `pingone-mcp-server/src/` — check `logs/mcp-server.log`
- The `dist/` build is stale and `tsx` is not being used — confirm `mcp-inspector-config.json` uses `tsx`

### Session token invalid / 403 in browser

The session token in the URL has expired (they rotate on each restart). Re-run `npm run mcp:inspector` and copy the fresh URL printed to the console.

### Tool call returns authentication error

The credentials are missing or wrong. Re-save them via the app's Worker Token modal, or check `~/.pingone-playground/credentials/mcp-config.json`.

---

## Logs Reference

| Log file | What's in it |
|---|---|
| `mcp-inspector.log` | Inspector process stdout/stderr — session token, startup errors |
| `logs/mcp-server.log` | PingOne MCP server — tool calls, PingOne API requests/responses, errors |

Both files are written relative to the repo root. `logs/` is gitignored. `mcp-inspector.log` is in the root (also gitignored).

---

## npm Scripts Reference

| Script | What it does |
|---|---|
| `npm run mcp:inspector` | Start inspector UI → **pingone** server (http://localhost:6274) |
| `npm run mcp:inspector:memory` | Start inspector UI → **memory** server |
| `npm run mcp:inspector:filesystem` | Start inspector UI → **filesystem** server |
| `npm run mcp:inspector:fetch` | Start inspector UI → **fetch** server |
| `npm run mcp:tools:list` | CLI: list all tools from **pingone** server |
| `npm run mcp:tools:list:memory` | CLI: list all tools from **memory** server |
| `npm run mcp:tools:list:filesystem` | CLI: list all tools from **filesystem** server |
| `npm run mcp:tools:list:fetch` | CLI: list all tools from **fetch** server |
| `npm run mcp:validate` | Run MCP spec validation test suite |
| `npm run mcp:tools:generate` | Regenerate `pingone-mcp-server/mcp-tool-names.json` from source |
