#!/bin/bash

# Docker control script for oauthPlayground
# Usage: ./docker-control.sh [command] [options]

set -euo pipefail

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="${BASEDIR}/docker-compose.yml"

# Colors
BOLD='\033[1m'
CYAN='\033[1;36m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
RED='\033[1;31m'
DIM='\033[2m'
RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✓${RESET}  $*"; }
warn() { echo -e "  ${YELLOW}!${RESET}  $*"; }
err()  { echo -e "  ${RED}✗${RESET}  $*" >&2; }

# Services table
SERVICES=(
  "oauthplayground-oauth-frontend|Frontend (nginx)|8080|https://localhost:8080"
  "oauthplayground-oauth-backend|Backend (Node.js)|3002|https://localhost:3002"
)

is_known_service() {
  local want="${1:-}"
  [[ -z "${want}" ]] && return 1
  for entry in "${SERVICES[@]}"; do
    [[ "${entry%%|*}" == "${want}" ]] && return 0
  done
  return 1
}

print_service_table() {
  echo -e "  ${WHITE}${BOLD}SERVICE                       PORT${RESET}"
  echo -e "  ${DIM}──────────────────────────────────────────${RESET}"
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r svc label port _ <<< "${entry}"
    printf "  ${BOLD}%-30s${RESET} %s\n" "${svc}" ":${port}"
  done
}

print_status_table() {
  echo -e "  ${WHITE}${BOLD}SERVICE                       STATUS        PORT${RESET}"
  echo -e "  ${DIM}────────────────────────────────────────────────────────${RESET}"
  for entry in "${SERVICES[@]}"; do
    IFS='|' read -r svc label port _ <<< "${entry}"
    state=$(docker compose -f "${COMPOSE_FILE}" ps --format '{{.State}}' "${svc}" 2>/dev/null | head -1 || true)
    if [[ "${state}" == "running" ]]; then
      status_str="${GREEN}${BOLD}running${RESET}"
    elif [[ -n "${state}" ]]; then
      status_str="${RED}${BOLD}${state}${RESET}"
    else
      status_str="${DIM}stopped${RESET}"
    fi
    printf "  ${BOLD}%-30s${RESET} %-25b %s\n" "${label}" "${status_str}" ":${port}"
  done
}

git_sync_check() {
  command -v git >/dev/null 2>&1 || return 0
  git -C "${BASEDIR}" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0

  local branch dirty upstream
  branch="$(git -C "${BASEDIR}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  dirty="$(git -C "${BASEDIR}" status --porcelain 2>/dev/null || true)"

  if [[ -n "$dirty" ]]; then
    warn "git: uncommitted changes on '${branch}' — these WILL be built."
  else
    ok "git: '${branch}' is clean."
  fi
}

preflight_check() {
  if ! command -v docker &>/dev/null; then
    err "docker not found — install Docker Desktop and try again."
    exit 1
  fi
  ok "Docker found"
}

build_frontend() {
  echo "Building frontend..."
  docker build $CACHE_FLAG -f Dockerfile.frontend -t oauthplayground:latest .
  ok "Frontend built"
}

build_backend() {
  echo "Building backend..."
  docker build $CACHE_FLAG -f Dockerfile.backend -t oauthplayground-backend:latest .
  ok "Backend built"
}

cmd_start() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}   [DOCKER]  OAUTH PLAYGROUND — STARTING${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  
  git_sync_check
  echo ""

  docker-compose -f "${COMPOSE_FILE}" up -d
  
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}   [DOCKER]  STATUS${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  print_status_table
  echo ""
  echo -e "${GREEN}${BOLD}  ╭─ URLS ───────────────────────────────────────────────╮${RESET}"
  echo -e "${GREEN}${BOLD}  │${RESET}  Frontend  ${YELLOW}${BOLD}https://localhost:8080${RESET}"
  echo -e "${GREEN}${BOLD}  │${RESET}  Backend   ${YELLOW}${BOLD}https://localhost:3002${RESET}"
  echo -e "${GREEN}${BOLD}  ╰───────────────────────────────────────────────────────╯${RESET}"
  echo ""
}

cmd_stop() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}   [DOCKER]  STOPPING${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  docker compose -f "${COMPOSE_FILE}" down --remove-orphans 2>/dev/null || true
  ok "All containers stopped and removed."
  echo ""
}

cmd_restart() {
  cmd_stop
  cmd_start
}

cmd_rebuild() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}   [DOCKER]  REBUILDING${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  git_sync_check
  echo ""
  build_frontend
  build_backend
  echo ""
  cmd_stop
  cmd_start
}

cmd_logs() {
  local svc="${1:-}"
  if [[ -n "${svc}" ]]; then
    docker compose -f "${COMPOSE_FILE}" logs -f --tail=100 "${svc}"
  else
    docker compose -f "${COMPOSE_FILE}" logs -f --tail=50
  fi
}

cmd_status() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}   [DOCKER]  STATUS${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  print_status_table
  echo ""
}

cmd_clean() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}   [DOCKER]  CLEANING UP${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  docker compose -f "${COMPOSE_FILE}" down -v
  ok "All containers, volumes removed."
  echo ""
}

cmd_help() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${CYAN}${BOLD}   [DOCKER]  OAuth Playground — docker-control.sh${RESET}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo -e "${WHITE}${BOLD}  Usage:${RESET}  ./docker-control.sh [command] [options]"
  echo ""
  echo -e "${WHITE}${BOLD}  Commands:${RESET}"
  echo "    (default)          Start all services"
  echo "    start              Start containers"
  echo "    stop               Stop and remove containers"
  echo "    restart            Stop then start everything"
  echo "    rebuild            Rebuild images and restart"
  echo "    build              Build images only"
  echo "    build-frontend     Build frontend only"
  echo "    build-backend      Build backend only"
  echo "    logs [service]     Follow container logs"
  echo "    status             Show container health"
  echo "    clean              Remove containers and volumes"
  echo "    help               Show this message"
  echo ""
  echo -e "${WHITE}${BOLD}  Options:${RESET}"
  echo "    --no-cache         Build without cache"
  echo ""
  echo -e "${WHITE}${BOLD}  Examples:${RESET}"
  echo "    ./docker-control.sh rebuild"
  echo "    ./docker-control.sh build --no-cache"
  echo "    ./docker-control.sh logs oauthplayground-oauth-frontend"
  echo "    ./docker-control.sh status"
  echo ""
  echo -e "${WHITE}${BOLD}  Services:${RESET}"
  print_service_table
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
}

# Preflight
preflight_check

# Parse arguments
COMMAND="${1:-start}"
CACHE_FLAG=""

shift || true

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-cache)
      CACHE_FLAG="--no-cache"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

case "${COMMAND}" in
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
    cmd_rebuild
    ;;
  build)
    build_frontend
    build_backend
    ;;
  build-frontend)
    build_frontend
    ;;
  build-backend)
    build_backend
    ;;
  logs)
    cmd_logs "${1:-}"
    ;;
  status)
    cmd_status
    ;;
  clean)
    cmd_clean
    ;;
  help|--help|-h)
    cmd_help
    ;;
  *)
    err "Unknown command: ${COMMAND}"
    cmd_help
    exit 1
    ;;
esac
