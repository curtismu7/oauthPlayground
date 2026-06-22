#!/bin/bash

# Docker control script for oauthPlayground
# Usage: ./docker-control.sh [command] [options]
# Commands: build, stop, start, restart, rebuild, logs, clean

set -e

COMPOSE_FILE="docker-compose.yml"

usage() {
  cat << EOF
Usage: $0 [command] [options]

Commands:
  build           Build images (frontend and backend)
  build-frontend  Build frontend only
  build-backend   Build backend only
  start           Start containers
  stop            Stop containers
  restart         Stop and start containers
  rebuild         Build and restart containers
  logs            Show logs (use -f for follow)
  clean           Stop and remove containers, volumes

Options:
  -f              Follow logs (with logs command)
  --no-cache      Build without cache

Examples:
  $0 build
  $0 rebuild
  $0 logs -f
  $0 build --no-cache
EOF
  exit 1
}

build_frontend() {
  echo "Building frontend..."
  docker build $CACHE_FLAG -f Dockerfile.frontend -t oauthplayground:latest .
  echo "✓ Frontend built"
}

build_backend() {
  echo "Building backend..."
  docker build $CACHE_FLAG -f Dockerfile.backend -t oauthplayground-backend:latest .
  echo "✓ Backend built"
}

start() {
  echo "Starting containers..."
  docker-compose -f $COMPOSE_FILE up -d
  echo "✓ Containers started"
}

stop() {
  echo "Stopping containers..."
  docker-compose -f $COMPOSE_FILE down
  echo "✓ Containers stopped"
}

restart() {
  stop
  start
}

rebuild() {
  build_frontend
  build_backend
  restart
}

show_logs() {
  if [ "$FOLLOW" = "true" ]; then
    docker-compose -f $COMPOSE_FILE logs -f
  else
    docker-compose -f $COMPOSE_FILE logs
  fi
}

clean() {
  echo "Cleaning up containers and volumes..."
  docker-compose -f $COMPOSE_FILE down -v
  echo "✓ Cleaned up"
}

# Parse arguments
COMMAND="${1:-}"
FOLLOW=false
CACHE_FLAG=""

if [ -z "$COMMAND" ]; then
  usage
fi

shift || true

while [[ $# -gt 0 ]]; do
  case $1 in
    -f)
      FOLLOW=true
      shift
      ;;
    --no-cache)
      CACHE_FLAG="--no-cache"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

case $COMMAND in
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
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    restart
    ;;
  rebuild)
    rebuild
    ;;
  logs)
    show_logs
    ;;
  clean)
    clean
    ;;
  *)
    echo "Unknown command: $COMMAND"
    usage
    ;;
esac
