#!/usr/bin/env bash
# stop.sh — Stop OAuth Playground services

# Colors
CYAN='\033[1;36m'
GREEN='\033[1;32m'
RED='\033[1;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║              🛑 Stopping OAuth Playground Services 🛑            ║${NC}"
echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

stopped_count=0
failed_count=0

# Kill backend
if [ -f "/tmp/oauth-backend.pid" ]; then
  pid=$(cat /tmp/oauth-backend.pid)
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    if ! kill -0 "$pid" 2>/dev/null; then
      echo -e "  ${GREEN}✓${NC} Backend stopped (PID: $pid)"
      ((stopped_count++))
    else
      kill -9 "$pid" 2>/dev/null || true
      echo -e "  ${GREEN}✓${NC} Backend force stopped (PID: $pid)"
      ((stopped_count++))
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} Backend not running (stale PID: $pid)"
  fi
  rm -f /tmp/oauth-backend.pid
else
  echo -e "  ${YELLOW}⚠${NC} Backend: no PID file"
fi

# Kill frontend
if [ -f "/tmp/oauth-frontend.pid" ]; then
  pid=$(cat /tmp/oauth-frontend.pid)
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    sleep 1
    if ! kill -0 "$pid" 2>/dev/null; then
      echo -e "  ${GREEN}✓${NC} Frontend stopped (PID: $pid)"
      ((stopped_count++))
    else
      kill -9 "$pid" 2>/dev/null || true
      echo -e "  ${GREEN}✓${NC} Frontend force stopped (PID: $pid)"
      ((stopped_count++))
    fi
  else
    echo -e "  ${YELLOW}⚠${NC} Frontend not running (stale PID: $pid)"
  fi
  rm -f /tmp/oauth-frontend.pid
else
  echo -e "  ${YELLOW}⚠${NC} Frontend: no PID file"
fi

echo ""
echo -e "${CYAN}${BOLD}───────────────────────────────────────────────────────────────${NC}"
echo -e "  ${GREEN}✓${NC} ${stopped_count} service(s) stopped"
if [ $failed_count -gt 0 ]; then
  echo -e "  ${RED}✗${NC} ${failed_count} service(s) failed to stop"
fi
echo -e "${CYAN}${BOLD}───────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${GREEN}${BOLD}✅ Cleanup complete${NC}"
echo ""
echo -e "${YELLOW}💡 To restart, run: ${BOLD}./start.sh${YELLOW} or ${BOLD}./run-oauth.sh start${NC}"
echo ""

# Logging options
echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${CYAN}📋 Log Locations:${NC}"
echo -e "${YELLOW}${BOLD}─────────────────────────────────────────────────────────────${NC}"
echo -e "  Backend:  ${BOLD}/tmp/oauth-backend.log${NC}"
echo -e "  Frontend: ${BOLD}/tmp/oauth-frontend.log${NC}"
echo ""
echo -e "  ${CYAN}View past logs:${NC}"
echo -e "    ${BOLD}tail -n 50 /tmp/oauth-backend.log${NC}   # Last 50 lines"
echo -e "    ${BOLD}cat /tmp/oauth-frontend.log${NC}         # Full log"
echo ""
echo -e "  ${CYAN}Clear logs:${NC}"
echo -e "    ${BOLD}rm /tmp/oauth-*.log${NC}"
echo -e "${YELLOW}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""
