#!/bin/bash
# memory-mcp.sh — Build, start, stop, or inspect the Memory MCP server.
# Usage:
#   ./scripts/memory-mcp.sh             # start server (default)
#   ./scripts/memory-mcp.sh start       # start server
#   ./scripts/memory-mcp.sh stop        # stop server
#   ./scripts/memory-mcp.sh restart     # stop then start
#   ./scripts/memory-mcp.sh status      # show running status
#   ./scripts/memory-mcp.sh inspect     # open MCP Inspector UI for this server
#   ./scripts/memory-mcp.sh tools       # list tools via CLI (no browser)
#   ./scripts/memory-mcp.sh build       # build only (no start)
#   ./scripts/memory-mcp.sh logs        # tail the server log
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)
SERVER_DIR="${REPO_ROOT}/memory-mcp-server"
DIST_INDEX="${SERVER_DIR}/dist/index.js"
PID_FILE="${REPO_ROOT}/.memory-mcp.pid"
LOG_FILE="${REPO_ROOT}/logs/memory-mcp-server.log"
MCP_INSPECTOR_CONFIG="${REPO_ROOT}/mcp-inspector-config.json"
MCP_INSPECTOR_PORT=6274

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${CYAN}[memory-mcp]${NC} $*"; }
success() { echo -e "${GREEN}[memory-mcp]${NC} ✅ $*"; }
warn()    { echo -e "${YELLOW}[memory-mcp]${NC} ⚠️  $*"; }
error()   { echo -e "${RED}[memory-mcp]${NC} ❌ $*" >&2; }

# ── helpers ─────────────────────────────────────────────────────────────────

do_build() {
    if [[ ! -d "${SERVER_DIR}" ]]; then
        error "Directory '${SERVER_DIR}' not found."
        exit 1
    fi
    info "Building memory-mcp-server..."
    (cd "${SERVER_DIR}" && NODE_OPTIONS="--max-old-space-size=512" npm run build)
    success "Build complete → ${DIST_INDEX}"
}

do_stop() {
    if [[ -f "${PID_FILE}" ]]; then
        local pid
        pid=$(cat "${PID_FILE}" 2>/dev/null || true)
        if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
            info "Stopping Memory MCP server (PID: ${pid})..."
            kill "${pid}" 2>/dev/null || true
            sleep 1
            kill -0 "${pid}" 2>/dev/null && kill -9 "${pid}" 2>/dev/null || true
            success "Stopped."
        else
            info "Memory MCP server is not running (stale PID file)."
        fi
        rm -f "${PID_FILE}"
    else
        # Fallback: kill by cmdline match scoped to this repo
        pkill -f "${SERVER_DIR}/dist/index.js" 2>/dev/null && success "Stopped via pkill." || info "No running process found."
    fi
}

do_start() {
    if [[ -f "${PID_FILE}" ]]; then
        local pid
        pid=$(cat "${PID_FILE}" 2>/dev/null || true)
        if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
            warn "Already running (PID: ${pid}). Use 'restart' to restart."
            return 0
        fi
        rm -f "${PID_FILE}"
    fi

    if [[ ! -f "${DIST_INDEX}" ]]; then
        warn "dist/index.js not found — building first..."
        do_build
    fi

    mkdir -p "${REPO_ROOT}/logs"
    info "Starting Memory MCP server..."
    cd "${REPO_ROOT}"
    NODE_OPTIONS="--max-old-space-size=128" node "${DIST_INDEX}" > "${LOG_FILE}" 2>&1 &
    echo $! > "${PID_FILE}"
    sleep 1

    local pid
    pid=$(cat "${PID_FILE}")
    if kill -0 "${pid}" 2>/dev/null; then
        success "Memory MCP server running (PID: ${pid})"
        info "Log: ${LOG_FILE}"
        info "Inspect: npm run mcp:inspector:memory  OR  ./scripts/memory-mcp.sh inspect"
    else
        error "Server exited immediately. Check log:"
        tail -10 "${LOG_FILE}" 2>/dev/null || true
        exit 1
    fi
}

do_status() {
    if [[ -f "${PID_FILE}" ]]; then
        local pid
        pid=$(cat "${PID_FILE}" 2>/dev/null || true)
        if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
            success "Running (PID: ${pid})"
            info "Log: ${LOG_FILE}"
        else
            warn "PID file exists but process is dead. Run 'start' or 'restart'."
        fi
    else
        info "Not running (no PID file)."
    fi
}

do_inspect() {
    if [[ ! -f "${MCP_INSPECTOR_CONFIG}" ]]; then
        error "mcp-inspector-config.json not found at ${MCP_INSPECTOR_CONFIG}"
        exit 1
    fi
    info "Starting MCP Inspector for memory server on port ${MCP_INSPECTOR_PORT}..."
    info "Open: http://localhost:${MCP_INSPECTOR_PORT} — then click Connect"
    cd "${REPO_ROOT}"
    npx @modelcontextprotocol/inspector \
        --config "${MCP_INSPECTOR_CONFIG}" \
        --server memory
}

do_tools() {
    if [[ ! -f "${MCP_INSPECTOR_CONFIG}" ]]; then
        error "mcp-inspector-config.json not found at ${MCP_INSPECTOR_CONFIG}"
        exit 1
    fi
    cd "${REPO_ROOT}"
    npx @modelcontextprotocol/inspector \
        --cli \
        --config "${MCP_INSPECTOR_CONFIG}" \
        --server memory \
        --method tools/list
}

do_logs() {
    if [[ ! -f "${LOG_FILE}" ]]; then
        warn "Log file not found: ${LOG_FILE}. Start the server first."
        exit 1
    fi
    exec tail -f "${LOG_FILE}"
}

# ── dispatch ─────────────────────────────────────────────────────────────────

CMD="${1:-start}"
case "${CMD}" in
    start)   do_start   ;;
    stop)    do_stop    ;;
    restart) do_stop; do_start ;;
    status)  do_status  ;;
    build)   do_build   ;;
    inspect) do_inspect ;;
    tools)   do_tools   ;;
    logs)    do_logs    ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|build|inspect|tools|logs}"
        exit 1
        ;;
esac
