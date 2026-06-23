#!/usr/bin/env bash
# run-oauth-docker.sh — OAuth Playground Docker Container Manager
# Dockerized OAuth/OIDC flow simulation platform
# Usage: ./run-oauth-docker.sh [command] [options]

set -euo pipefail

COMPOSE="docker compose -f docker-compose.dev.yml"
BOLD='\033[1m'
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC}  $*"; }
info() { echo -e "  ${CYAN}→${NC}  $*"; }
warn() { echo -e "  ${YELLOW}!${NC}  $*"; }
err()  { echo -e "  ${RED}✗${NC}  $*"; }

# Banner
show_banner() {
  echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║                                                                ║${NC}"
  echo -e "${CYAN}${BOLD}║     🐳 OAuth Playground - Docker Container Manager 🐳          ║${NC}"
  echo -e "${CYAN}${BOLD}║                                                                ║${NC}"
  echo -e "${CYAN}${BOLD}║   Containerized OAuth/OIDC provider simulation platform        ║${NC}"
  echo -e "${CYAN}${BOLD}║                                                                ║${NC}"
  echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# Status display
show_status() {
  echo -e "${CYAN}${BOLD}═════════════════════════════════════════════════════════════════${NC}"
  echo -e "  ${CYAN}📊 Container Status${NC}"
  echo -e "${CYAN}${BOLD}─────────────────────────────────────────────────────────────────${NC}"
  $COMPOSE ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || true
  echo -e "${CYAN}${BOLD}═════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${CYAN}🌐 Application URLs${NC}"
  echo -e "     Frontend: ${BOLD}https://localhost:3010${NC}"
  echo -e "     Backend:  ${BOLD}https://localhost:3012/api/health${NC}"
  echo ""
  echo -e "  ${CYAN}📋 Useful Commands${NC}"
  echo -e "     Logs:     ${BOLD}docker compose -f docker-compose.dev.yml logs -f${NC}"
  echo -e "     Shell:    ${BOLD}docker compose -f docker-compose.dev.yml exec <service> bash${NC}"
  echo -e "     Clean:    ${BOLD}docker compose -f docker-compose.dev.yml down -v${NC}"
  echo ""
}

cmd_start() {
  show_banner

  info "Pulling latest changes..."
  git pull --rebase origin main 2>/dev/null || true

  echo ""
  info "Starting containers..."
  $COMPOSE up -d

  sleep 3
  echo ""
  ok "OAuth Playground is starting"
  echo ""
  show_status

  echo -e "${GREEN}${BOLD}✅ All containers started${NC}"
  echo ""

  # Logging options
  echo -e "${YELLOW}${BOLD}═════════════════════════════════════════════════════════════════${NC}"
  echo -e "  ${CYAN}📋 Logging Options:${NC}"
  echo -e "${YELLOW}${BOLD}──────────────────────────────────────────────────────────────${NC}"
  echo -e "  ${BOLD}./run-oauth-docker.sh logs${NC}           # Stream live logs"
  echo -e "  ${BOLD}docker compose -f docker-compose.dev.yml logs -f${NC}  # All logs"
  echo -e "  ${BOLD}docker compose -f docker-compose.dev.yml logs frontend${NC}  # Frontend only"
  echo -e "  ${BOLD}docker compose -f docker-compose.dev.yml logs backend${NC}   # Backend only"
  echo -e ""
  echo -e "  ${CYAN}Container shell:${NC}"
  echo -e "    ${BOLD}docker compose -f docker-compose.dev.yml exec <service> bash${NC}"
  echo -e "${YELLOW}${BOLD}═════════════════════════════════════════════════════════════════${NC}"
  echo ""
}

cmd_stop() {
  echo ""
  echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║                  🛑 Stopping Containers 🛑                     ║${NC}"
  echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  info "Stopping containers..."
  $COMPOSE down --remove-orphans

  echo ""
  ok "All containers stopped and removed"
  echo ""
}

cmd_restart() {
  echo ""
  echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║                  🔄 Restarting Containers 🔄                   ║${NC}"
  echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  cmd_stop
  sleep 2
  cmd_start
}

cmd_rebuild() {
  echo ""
  echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║              🔨 Rebuilding Docker Images 🔨                   ║${NC}"
  echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  info "Pulling latest changes..."
  git pull --rebase origin main 2>/dev/null || true

  echo ""
  info "Rebuilding images and starting..."
  $COMPOSE up --build -d

  sleep 3
  echo ""
  ok "OAuth Playground rebuilt and running"
  echo ""
  show_status

  echo -e "${GREEN}${BOLD}✅ Images rebuilt and containers started${NC}"
  echo ""
}

cmd_logs() {
  echo ""
  echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║              📋 Streaming Container Logs 📋                    ║${NC}"
  echo -e "${CYAN}${BOLD}║                   (Press Ctrl+C to stop)                        ║${NC}"
  echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  $COMPOSE logs -f
}

cmd_status() {
  echo ""
  show_banner
  show_status
}

cmd_help() {
  show_banner
  cat << EOF
${BOLD}Usage:${NC} $(basename "$0") [command] [options]

${BOLD}Commands:${NC}
  start           Start containers (default)
  stop            Stop and remove containers
  restart         Restart containers
  rebuild         Rebuild images and start (--no-cache for clean build)
  logs            Show container logs (live streaming)
  status          Show container status and URLs
  help            Show this help message

${BOLD}Examples:${NC}
  ./$(basename "$0")                    # Start (default)
  ./$(basename "$0") start              # Start containers
  ./$(basename "$0") stop               # Stop containers
  ./$(basename "$0") restart            # Restart containers
  ./$(basename "$0") rebuild            # Rebuild and start
  ./$(basename "$0") rebuild --no-cache # Clean rebuild (no cache)
  ./$(basename "$0") logs               # View live logs
  ./$(basename "$0") status             # Show status and URLs

${BOLD}Container URLs:${NC}
  Frontend: https://localhost:3010
  Backend:  https://localhost:3012/api/health

${BOLD}System Requirements:${NC}
  • Docker Desktop or Docker Engine
  • Docker Compose v1.29+
  • 2GB+ available memory

EOF
}

main() {
  local cmd="${1:-start}"

  case "$cmd" in
    start)
      cmd_start
      ;;
    stop)
      cmd_stop
      ;;
    restart)
      cmd_restart
      ;;
    rebuild)
      if [[ "${2:-}" == "--no-cache" ]]; then
        COMPOSE="$COMPOSE --no-cache"
      fi
      cmd_rebuild
      ;;
    logs)
      cmd_logs
      ;;
    status)
      cmd_status
      ;;
    help|--help|-h)
      cmd_help
      ;;
    *)
      echo "Unknown command: $cmd"
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"
