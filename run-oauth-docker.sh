#!/usr/bin/env bash
# run-oauth-docker.sh — OAuth Playground Docker container manager
# Usage: ./run-oauth-docker.sh [command] [options]

set -euo pipefail

COMPOSE="docker compose -f docker-compose.dev.yml"

# Colors
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
NC='\033[0m'

ok()  { echo -e "  ${GREEN}✓${NC}  $*"; }
info() { echo -e "  ${CYAN}→${NC}  $*"; }
warn() { echo -e "  ${YELLOW}!${NC}  $*"; }

cmd_start() {
  info "Pulling latest changes..."
  git pull --rebase origin main 2>/dev/null || true

  info "Starting containers..."
  $COMPOSE up -d

  echo ""
  ok "oauthPlayground running"
  echo "  Frontend: https://localhost:3010"
  echo "  Backend:  https://localhost:3012/api/health"
  echo ""
}

cmd_stop() {
  info "Stopping containers..."
  $COMPOSE down --remove-orphans
  ok "Containers stopped"
}

cmd_restart() {
  cmd_stop
  sleep 2
  cmd_start
}

cmd_rebuild() {
  info "Pulling latest changes..."
  git pull --rebase origin main 2>/dev/null || true

  info "Rebuilding images and starting..."
  $COMPOSE up --build -d

  echo ""
  ok "oauthPlayground running (rebuilt)"
  echo "  Frontend: https://localhost:3010"
  echo "  Backend:  https://localhost:3012/api/health"
  echo ""
}

cmd_logs() {
  $COMPOSE logs -f
}

cmd_status() {
  $COMPOSE ps
}

cmd_help() {
  cat << EOF
Usage: $(basename "$0") [command] [options]

Commands:
  start           Start containers (default)
  stop            Stop and remove containers
  restart         Restart containers
  rebuild         Rebuild images and start (--no-cache for clean build)
  logs            Show container logs
  status          Show container status
  help            Show this help message

Examples:
  ./$(basename "$0")                  # Start (default)
  ./$(basename "$0") start            # Start
  ./$(basename "$0") stop             # Stop
  ./$(basename "$0") restart          # Restart
  ./$(basename "$0") rebuild          # Rebuild
  ./$(basename "$0") rebuild --no-cache  # Clean rebuild
  ./$(basename "$0") logs             # Show logs
  ./$(basename "$0") status           # Show status
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
