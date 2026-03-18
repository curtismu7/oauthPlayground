# MCP Servers Integration Plan — filesystem, memory, fetch

**Status:** Draft — not yet wired into run.sh  
**Scope:** Wire `filesystem-mcp-server`, `memory-mcp-server`, and `fetch-mcp-server` into run.sh, stop.sh, and `.cursor/mcp.json`

---

## Memory Impact Assessment (Read This First)

**Short answer: wiring these in will NOT cause "Aw Snap" OOM.** Here's why:

Each MCP server is an **independent Node.js stdio process** — not embedded in Vite or the browser. They run completely separately from the Chrome renderer and the Vite dev server. The OOM we fixed was specifically the Vite Node process growing unbounded (now capped at 4 GB). These additions are additive to system RAM only, not renderer heap.

| Server | Estimated RSS | Proposed cap | Net system cost |
|---|---|---|---|
| `filesystem-mcp-server` | ~60–80 MB | 256 MB | ~80 MB |
| `memory-mcp-server` | ~40–60 MB (node-persist is tiny) | 128 MB | ~60 MB |
| `fetch-mcp-server` | ~80–120 MB (axios + cheerio) | 256 MB | ~120 MB |
| **Total addition** | | | **~260 MB** |

For comparison, the existing `pingone-mcp-server` runs at ~200 MB in practice (512 MB cap). Adding ~260 MB across three more processes is safe on any machine with > 8 GB RAM.

**However:** These servers are only useful when **an AI client is actively querying them**. If you're not using Cursor/Claude Desktop actively, they sit idle burning ~20 MB each. The implementation below adds them to an **optional `-mcp-all` flag** so you can opt in, rather than running them always.

---

## What Each Server Does

### `filesystem-mcp-server` (11 tools)

Provides AI clients with sandboxed read/write access to OAuth flow configurations stored on disk.

| Tool | Description |
|---|---|
| `save-config` | Persist an OAuth flow configuration by flowId |
| `load-config` | Retrieve a saved flow configuration |
| `delete-config` | Remove a saved configuration |
| `list-configs` | List all saved OAuth flow configurations |
| `export-config` | Export a config to a portable format |
| `import-config` | Import a config from a portable format |
| + 5 more | File watch, diff, backup tools |

**Value:** Lets an AI assistant persist flow configs across sessions, compare configurations, and help debug "why did my PKCE flow break" scenarios by reading the saved state.

**Security note:** The server already uses a `FilesystemManager` that sandboxes paths — it will not allow reads/writes outside the project's config directory. No additional hardening needed.

### `memory-mcp-server` (6 tools)

Provides AI clients with persistent user preferences and session context via `node-persist`.

| Tool | Description |
|---|---|
| `save-user-preference` | Store user preferences (theme, flow defaults, etc.) |
| `get-user-preference` | Retrieve stored preferences |
| `save-session-context` | Store a labelled context blob |
| `get-session-context` | Retrieve a stored context blob |
| `list-sessions` | List all stored session keys |
| `clear-session` | Delete a session by key |

**Value:** Gives AI assistants memory across chat sessions — "remember that I always use the Authorization Code flow with PKCE" without repeating it every session.

**Storage:** `node-persist` writes to a local directory (typically `~/.ping-memory-server/` or configurable via `MEMORY_DIR` env). No database needed.

### `fetch-mcp-server` (9 tools)

Provides AI clients with HTTP request capabilities (think: curl for AI).

| Tool | Description |
|---|---|
| `fetch` | Perform an HTTP request with full control |
| `fetch-and-parse` | Fetch + parse JSON or HTML response |
| `fetch-json` | Fetch a URL and return parsed JSON |
| `fetch-form` | POST a form-encoded body |
| `fetch-authenticated` | Fetch with an Authorization header |
| `get-fetch-history` | Get recent fetch request history |
| `get-fetch-analytics` | Analytics about outbound requests |
| `clear-fetch-history` | Clear history |
| + 1 more | Batch fetch |

**Value:** Lets an AI assistant hit PingOne API endpoints directly to validate tokens, test OIDC discovery, or verify that an introspection endpoint returns what you expect. Particularly useful alongside the `pingone-mcp-server` for end-to-end AI-driven OAuth testing.

**Security:** The `FetchManager` uses axios. It does **not** currently enforce an allowlist of URLs. Before going to production use, pin `validateSSL: true` as default and consider an allowlist for your PingOne domains. For local dev this is acceptable as-is.

---

## Implementation Plan

### Phase 1: Build verification (Day 1, ~30 min)

Confirm all three servers build and start cleanly before touching run.sh.

```bash
# Build each server
(cd filesystem-mcp-server && npm run build)
(cd memory-mcp-server && npm run build)
(cd fetch-mcp-server && npm run build)

# Smoke-test each: it should start, print nothing, and hang waiting for stdin
echo '{}' | node filesystem-mcp-server/dist/index.js
echo '{}' | node memory-mcp-server/dist/index.js
echo '{}' | node fetch-mcp-server/dist/index.js
# Ctrl+C each — expect no crash errors in stderr
```

If any fail, fix the TypeScript errors in that server's `src/` before proceeding.

### Phase 2: PID file and port constants in run.sh (Day 1, ~20 min)

Add PID file variables to the constants block at the top of `scripts/development/run.sh`:

```bash
FILESYSTEM_MCP_PID_FILE=".filesystem-mcp.pid"
MEMORY_MCP_PID_FILE=".memory-mcp.pid"
FETCH_MCP_PID_FILE=".fetch-mcp.pid"
```

These servers are pure stdio — they do not bind to any TCP port — so no port constants are needed.

### Phase 3: Add `start_*` functions to run.sh (Day 1, ~45 min)

Add three start functions modelled on the existing `start_mcp_server()`. Place them immediately after `start_mcp_inspector()`:

```bash
start_filesystem_mcp_server() {
    print_status "📁 Starting Filesystem MCP server..."
    local dist="filesystem-mcp-server/dist/index.js"
    if [ ! -f "$dist" ]; then
        print_info "Building filesystem-mcp-server..."
        (cd filesystem-mcp-server && NODE_OPTIONS="--max-old-space-size=512" npm run build 2>&1) \
            || { print_error "filesystem-mcp-server build failed"; return 1; }
    fi
    mkdir -p logs
    NODE_OPTIONS="--max-old-space-size=256" node "$dist" > logs/filesystem-mcp-server.log 2>&1 &
    echo $! > "$FILESYSTEM_MCP_PID_FILE"
    sleep 1
    kill -0 "$(cat $FILESYSTEM_MCP_PID_FILE 2>/dev/null)" 2>/dev/null \
        && print_success "Filesystem MCP server started — logs: logs/filesystem-mcp-server.log" \
        || { print_error "Filesystem MCP server died on startup"; tail -5 logs/filesystem-mcp-server.log; return 1; }
}

start_memory_mcp_server() {
    print_status "🧠 Starting Memory MCP server..."
    local dist="memory-mcp-server/dist/index.js"
    if [ ! -f "$dist" ]; then
        print_info "Building memory-mcp-server..."
        (cd memory-mcp-server && NODE_OPTIONS="--max-old-space-size=512" npm run build 2>&1) \
            || { print_error "memory-mcp-server build failed"; return 1; }
    fi
    mkdir -p logs
    NODE_OPTIONS="--max-old-space-size=128" node "$dist" > logs/memory-mcp-server.log 2>&1 &
    echo $! > "$MEMORY_MCP_PID_FILE"
    sleep 1
    kill -0 "$(cat $MEMORY_MCP_PID_FILE 2>/dev/null)" 2>/dev/null \
        && print_success "Memory MCP server started — logs: logs/memory-mcp-server.log" \
        || { print_error "Memory MCP server died on startup"; tail -5 logs/memory-mcp-server.log; return 1; }
}

start_fetch_mcp_server() {
    print_status "🌐 Starting Fetch MCP server..."
    local dist="fetch-mcp-server/dist/index.js"
    if [ ! -f "$dist" ]; then
        print_info "Building fetch-mcp-server..."
        (cd fetch-mcp-server && NODE_OPTIONS="--max-old-space-size=512" npm run build 2>&1) \
            || { print_error "fetch-mcp-server build failed"; return 1; }
    fi
    mkdir -p logs
    NODE_OPTIONS="--max-old-space-size=256" node "$dist" > logs/fetch-mcp-server.log 2>&1 &
    echo $! > "$FETCH_MCP_PID_FILE"
    sleep 1
    kill -0 "$(cat $FETCH_MCP_PID_FILE 2>/dev/null)" 2>/dev/null \
        && print_success "Fetch MCP server started — logs: logs/fetch-mcp-server.log" \
        || { print_error "Fetch MCP server died on startup"; tail -5 logs/fetch-mcp-server.log; return 1; }
}
```

### Phase 4: Add `-mcp-all` flag to run.sh (Day 1, ~30 min)

Rather than starting these three servers in all modes (which would be wasteful when running the app without Cursor open), add an opt-in flag:

```bash
# In the argument parsing block:
--mcp-all)
    START_ALL_MCP=true
    ;;
```

Then in each mode function (`run_assistant_mode`, `run_both_mode`, and optionally `run_backend_only`), add:

```bash
if [ "${START_ALL_MCP:-false}" = true ]; then
    start_filesystem_mcp_server || print_warning "Filesystem MCP server failed to start"
    start_memory_mcp_server     || print_warning "Memory MCP server failed to start"
    start_fetch_mcp_server      || print_warning "Fetch MCP server failed to start"
fi
```

Usage:
```bash
./run.sh -both --mcp-all     # start everything including all 3 extra MCP servers
./run.sh -assistant --mcp-all
```

### Phase 5: Wire kills into stop.sh (Day 1, ~20 min)

In `scripts/development/stop.sh`, add kill blocks for the three new PID files, modelled on the existing MCP server kill block. Add them immediately after the existing MCP server kill:

```bash
# Filesystem MCP server
if [ -f ".filesystem-mcp.pid" ]; then
    local pid=$(cat ".filesystem-mcp.pid" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        print_info "Killing Filesystem MCP server (PID: $pid)"
        kill "$pid" 2>/dev/null || true
        sleep 1
    fi
    rm -f ".filesystem-mcp.pid"
fi

# Memory MCP server
if [ -f ".memory-mcp.pid" ]; then
    local pid=$(cat ".memory-mcp.pid" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        print_info "Killing Memory MCP server (PID: $pid)"
        kill "$pid" 2>/dev/null || true
        sleep 1
    fi
    rm -f ".memory-mcp.pid"
fi

# Fetch MCP server
if [ -f ".fetch-mcp.pid" ]; then
    local pid=$(cat ".fetch-mcp.pid" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        print_info "Killing Fetch MCP server (PID: $pid)"
        kill "$pid" 2>/dev/null || true
        sleep 1
    fi
    rm -f ".fetch-mcp.pid"
fi
```

Also add project-scoped pkill fallbacks in the pkill block:

```bash
pkill -f "${PROJECT_ROOT}/filesystem-mcp-server" 2>/dev/null || true
pkill -f "${PROJECT_ROOT}/memory-mcp-server" 2>/dev/null || true
pkill -f "${PROJECT_ROOT}/fetch-mcp-server" 2>/dev/null || true
```

### Phase 6: Update mcp-inspector-config.json (Day 2, ~15 min)

Add the three servers to `mcp-inspector-config.json` so they can be inspected too:

```json
{
  "mcpServers": {
    "pingone": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "pingone-mcp-server/src/index.ts"],
      "env": { "MCP_LOG_DIR": "logs" }
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "filesystem-mcp-server/src/index.ts"],
      "env": {}
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "memory-mcp-server/src/index.ts"],
      "env": {}
    },
    "fetch": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "fetch-mcp-server/src/index.ts"],
      "env": {}
    }
  }
}
```

Inspect them individually:
```bash
npx @modelcontextprotocol/inspector --config mcp-inspector-config.json --server memory
npx @modelcontextprotocol/inspector --config mcp-inspector-config.json --server fetch
npx @modelcontextprotocol/inspector --config mcp-inspector-config.json --server filesystem
```

### Phase 7: Update `.cursor/mcp.json` (Day 2, ~15 min)

`.cursor/mcp.json` is gitignored — edit it directly to add the three servers so Cursor can use them:

```json
{
  "mcpServers": {
    "pingone": {
      "command": "npx",
      "args": ["tsx", "pingone-mcp-server/src/index.ts"],
      "env": {}
    },
    "filesystem": {
      "command": "npx",
      "args": ["tsx", "filesystem-mcp-server/src/index.ts"],
      "env": {}
    },
    "memory": {
      "command": "npx",
      "args": ["tsx", "memory-mcp-server/src/index.ts"],
      "env": {}
    },
    "fetch": {
      "command": "npx",
      "args": ["tsx", "fetch-mcp-server/src/index.ts"],
      "env": {}
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
    },
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
               "ghcr.io/github/github-mcp-server"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
    }
  }
}
```

> **Security:** Move the hardcoded API keys currently in `.cursor/mcp.json` to environment variables (as shown above with `${BRAVE_API_KEY}` and `${GITHUB_PERSONAL_ACCESS_TOKEN}`). Store them in `~/.zshrc` or a secrets manager.

---

## Rollout Order (Recommended)

| Priority | Server | Reason |
|---|---|---|
| **1 (first)** | `memory-mcp-server` | Lowest RAM, highest AI UX value, zero security surface (no network calls) |
| **2** | `fetch-mcp-server` | High value for OAuth flow debugging; review URL allowlist first |
| **3 (last)** | `filesystem-mcp-server` | Most useful once the other two are working; test sandboxing |

---

## Definition of Done

- [ ] All three servers build without TypeScript errors
- [ ] Each server passes a stdio smoke test (start, receive ping, respond, exit cleanly)
- [ ] `start_*` functions added to `scripts/development/run.sh`
- [ ] PID kill blocks added to `scripts/development/stop.sh`
- [ ] `./run.sh -both --mcp-all && ./stop.sh` cleans up all 4 MCP server PIDs
- [ ] `mcp-inspector-config.json` updated with all three servers
- [ ] `.cursor/mcp.json` updated; hardcoded secrets moved to env vars
- [ ] Memory confirmed — `ps aux` during `--mcp-all` run shows ≤ 400 MB RSS across all three new processes
- [ ] `docs/MCP_INSPECTOR_GUIDE.md` updated with multi-server inspector commands
