#!/usr/bin/env bash
# start.sh — Start all OAuth Playground services
set -e

BASEDIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔐 Starting OAuth Playground..."
echo "   Using environment: ${NODE_ENV:-development}"

# Check for node_modules
if [ ! -d "$BASEDIR/node_modules" ]; then
  echo "📦 Installing dependencies..."
  (cd "$BASEDIR" && npm install --legacy-peer-deps)
fi

# Start backend server (port 3002)
echo "🚀 Starting Backend Server on :3002..."
(cd "$BASEDIR" && npm run start:backend > /tmp/oauth-backend.log 2>&1) &
echo $! > /tmp/oauth-backend.pid

sleep 2

# Start frontend server (port 3000)
echo "🌐 Starting Frontend Server on :3000..."
(cd "$BASEDIR" && npm run start:frontend > /tmp/oauth-frontend.log 2>&1) &
echo $! > /tmp/oauth-frontend.pid

echo ""
echo "✅ Services started:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3002"
echo ""
echo "📋 Logs:"
echo "   Backend:  /tmp/oauth-backend.log"
echo "   Frontend: /tmp/oauth-frontend.log"
echo ""
echo "ℹ️  To stop all services: ./stop.sh"
