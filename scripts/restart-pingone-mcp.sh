#!/bin/bash
# Restart the PingOne MCP server: terminate existing instance and start a fresh one.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)
MCP_DIR="${REPO_ROOT}/pingone-mcp-server"
LOG_FILE="${MCP_DIR}/mcp-server.log"
PID_FILE="${MCP_DIR}/mcp-server.pid"

if [[ ! -d "${MCP_DIR}" ]]; then
  echo "[restart-pingone-mcp] ERROR: Directory '${MCP_DIR}' not found." >&2
  exit 1
fi

cd "${MCP_DIR}"

echo "[restart-pingone-mcp] Stopping any existing PingOne MCP server processes..."
# pkill returns non-zero if nothing was killed; suppress errors so script continues.
pkill -f "pingone-mcp-server/dist/index.js" >/dev/null 2>&1 || true
pkill -f "pingone-mcp-server/src/index.ts" >/dev/null 2>&1 || true
pkill -f "pingone-mcp-server" >/dev/null 2>&1 || true

if [[ -f "${PID_FILE}" ]]; then
  OLD_PID=$(cat "${PID_FILE}")
  if ps -p "${OLD_PID}" >/dev/null 2>&1; then
    kill "${OLD_PID}" >/dev/null 2>&1 || true
  fi
  rm -f "${PID_FILE}"
fi

# Ensure dependencies are installed before starting.
echo "[restart-pingone-mcp] Ensuring dependencies are installed (npm install)..."
npm install >/dev/null

echo "[restart-pingone-mcp] Starting PingOne MCP server (logs: ${LOG_FILE})..."
nohup npm run dev >/dev/null 2>>"${LOG_FILE}" 1>>"${LOG_FILE}" &
NEW_PID=$!
echo "${NEW_PID}" > "${PID_FILE}"

echo "[restart-pingone-mcp] Server started with PID ${NEW_PID}."
echo "[restart-pingone-mcp] Tail logs with: tail -f '${LOG_FILE}'"
