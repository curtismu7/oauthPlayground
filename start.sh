#!/usr/bin/env bash
# start.sh — OAuth Playground Quick Start (Simplified)
# Starts frontend and backend services with automatic dependency installation

set -e

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-3001}
NODE_ENV=${NODE_ENV:-development}

# Colors
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# Banner
show_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║                                                                ║"
  echo "║              🔐 OAuth Playground - Quick Start 🔐              ║"
  echo "║                                                                ║"
  echo "║         Full-Stack OAuth/OIDC Flow Simulation Platform         ║"
  echo "║                                                                ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

# Status
show_status() {
  echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "  ${GREEN}✓${NC} Environment: ${BOLD}${NODE_ENV}${NC}"
  echo -e "  ${GREEN}✓${NC} Frontend Port: ${BOLD}${FRONTEND_PORT}${NC}"
  echo -e "  ${GREEN}✓${NC} Backend Port: ${BOLD}${BACKEND_PORT}${NC}"
  echo ""
  echo -e "  ${BOLD}URLs:${NC}"
  echo -e "    Frontend: ${BOLD}http://localhost:${FRONTEND_PORT}${NC}"
  echo -e "    Backend:  ${BOLD}http://localhost:${BACKEND_PORT}${NC}"
  echo ""
  echo -e "  ${BOLD}Logs:${NC}"
  echo -e "    Frontend: /tmp/oauth-frontend.log"
  echo -e "    Backend:  /tmp/oauth-backend.log"
  echo ""
  echo -e "  ${BOLD}Commands:${NC}"
  echo -e "    Stop:     ${BOLD}./stop.sh${NC}"
  echo -e "    Logs:     ${BOLD}tail -f /tmp/oauth-*.log${NC}"
  echo -e "    Advanced: ${BOLD}./run-oauth.sh${NC} (start|stop|restart|status)"
  echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
}

show_banner

echo ""
echo "📋 Checking dependencies..."

# Check for node_modules
if [ ! -d "$BASEDIR/node_modules" ]; then
  echo "📦 Installing dependencies (may take 1-2 minutes)..."
  (cd "$BASEDIR" && npm install --legacy-peer-deps) || {
    echo "❌ Failed to install dependencies"
    exit 1
  }
fi

echo "🚀 Starting services..."
echo ""

# Start backend server
echo "  ↳ Backend Server (port $BACKEND_PORT)..."
(cd "$BASEDIR" && npm run start:backend > /tmp/oauth-backend.log 2>&1) &
echo $! > /tmp/oauth-backend.pid

sleep 2

# Start frontend server
echo "  ↳ Frontend Server (port $FRONTEND_PORT)..."
(cd "$BASEDIR" && npm run start:frontend > /tmp/oauth-frontend.log 2>&1) &
echo $! > /tmp/oauth-frontend.pid

sleep 2

echo ""
echo -e "${GREEN}${BOLD}✅ OAuth Playground is starting...${NC}"
echo ""

show_status

echo ""
echo -e "${YELLOW}💡 Tip: Use ${BOLD}./run-oauth.sh${YELLOW} for advanced commands (start/stop/restart/status)${NC}"
echo ""

# Logging options
echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}📋 Logging Options:${NC}"
echo -e "${YELLOW}${BOLD}─────────────────────────────────────────────────────────────${NC}"
echo ""
echo "  View all logs (live):"
echo "    ${BOLD}tail -f /tmp/oauth-*.log${NC}"
echo ""
echo "  View backend logs:"
echo "    ${BOLD}tail -f /tmp/oauth-backend.log${NC}"
echo ""
echo "  View frontend logs:"
echo "    ${BOLD}tail -f /tmp/oauth-frontend.log${NC}"
echo ""
echo "  View logs with timestamps:"
echo "    ${BOLD}tail -f /tmp/oauth-*.log | sed 's/^/[$(date +%H:%M:%S)] /'${NC}"
echo ""
echo "  Clear logs:"
echo "    ${BOLD}rm /tmp/oauth-*.log${NC}"
echo ""
echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
