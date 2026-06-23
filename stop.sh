#!/usr/bin/env bash
# stop.sh — Stop all OAuth Playground services

echo "🛑 Stopping OAuth Playground services..."

# Kill backend
if [ -f "/tmp/oauth-backend.pid" ]; then
  pid=$(cat /tmp/oauth-backend.pid)
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    echo "   Backend stopped (PID: $pid)"
  fi
  rm -f /tmp/oauth-backend.pid
fi

# Kill frontend
if [ -f "/tmp/oauth-frontend.pid" ]; then
  pid=$(cat /tmp/oauth-frontend.pid)
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    echo "   Frontend stopped (PID: $pid)"
  fi
  rm -f /tmp/oauth-frontend.pid
fi

echo "✅ All services stopped"
