#!/usr/bin/env bash
# restart.sh — stop and restart oauthPlayground dev containers
#
# Usage:
#   ./restart.sh          # stop → pull → start
#   ./restart.sh --build  # stop → pull → rebuild images → start

set -euo pipefail

COMPOSE="docker compose -f docker-compose.dev.yml"
BUILD=false

for arg in "$@"; do
  case $arg in
    --build|-b) BUILD=true ;;
    *) echo "Unknown argument: $arg" && exit 1 ;;
  esac
done

echo "→ Stopping containers..."
$COMPOSE down

echo "→ Pulling latest changes..."
git pull --rebase origin main

if $BUILD; then
  echo "→ Rebuilding images and starting..."
  $COMPOSE up --build -d
else
  echo "→ Starting containers..."
  $COMPOSE up -d
fi

echo ""
echo "✓ oauthPlayground running"
echo "  Frontend: https://localhost:3010"
echo "  Backend:  https://localhost:3012/api/health"
echo ""
echo "Logs: docker compose -f docker-compose.dev.yml logs -f"
