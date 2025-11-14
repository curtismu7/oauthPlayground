#!/bin/bash

# OAuth Playground Enhanced Startup Script
# Provides detailed server status with nice formatting and icons, and logs to logs/startup.log

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           🔐 OAUTH PLAYGROUND 🔐                           ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Prepare logging
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/startup.log"
mkdir -p "$LOG_DIR"

# Get system information
PORT=${PORT:-3000}
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
MEMORY_TOTAL=$(echo "$(sysctl -n hw.memsize) / 1024 / 1024 / 1024" | bc 2>/dev/null || echo "Unknown")
MEMORY_USED=$(ps -o rss= -p $$ | awk '{print $1/1024/1024}' | bc 2>/dev/null || echo "0")
CPU_CORES=$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo "Unknown")
NODE_ENV=${NODE_ENV:-development}
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')
APP_VERSION=$(grep -m1 '"version"' package.json | sed -E 's/.*"version"\s*:\s*"([^"]+)".*/\1/' 2>/dev/null || echo "Unknown")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")

# Display system info
echo "📊 System Information:"
echo "   • Node.js: $NODE_VERSION"
echo "   • NPM: $NPM_VERSION"
echo "   • Memory: ${MEMORY_USED}MB / ${MEMORY_TOTAL}GB"
echo "   • CPU Cores: $CPU_CORES"
echo "   • Node Env: $NODE_ENV"
echo "   • App Version: $APP_VERSION"
echo "   • Git: $GIT_BRANCH@$GIT_COMMIT"
echo ""

# Write summary to startup.log
{
  echo "[$TIMESTAMP] OAuth Playground Startup"
  echo "Node: $NODE_VERSION | NPM: $NPM_VERSION | Env: $NODE_ENV"
  echo "App Version: $APP_VERSION | Git: $GIT_BRANCH@$GIT_COMMIT"
  echo "Memory: ${MEMORY_USED}MB / ${MEMORY_TOTAL}GB | CPU Cores: $CPU_CORES"
} >> "$LOG_FILE"

# Check if .env file exists and has PingOne config
if [ -f ".env" ]; then
    echo "✅ Configuration Status:"
    echo "   • .env file: Found"

    if grep -q "PINGONE_ENVIRONMENT_ID" .env && grep -q "PINGONE_CLIENT_ID" .env; then
        echo "   • PingOne Config: ✅ Complete"
    else
        echo "   • PingOne Config: ⚠️  Incomplete"
    fi
else
    echo "⚠️  Configuration Status:"
    echo "   • .env file: Missing (copy from .env.example)"
fi
echo ""

# Start the development server
echo "🚀 Starting OAuth Playground Development Server..."
echo "   Port: $PORT"
echo "   URL: https://localhost:$PORT/"
{
  echo "Starting dev server on port $PORT"
  echo "Local URL: https://localhost:$PORT/"
} >> "$LOG_FILE"
echo ""

# Run Vite dev server in background and capture output
npm run dev &
VITE_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server is running
if kill -0 $VITE_PID 2>/dev/null; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                              🎉 SERVER READY! 🎉                            ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    echo "║                                                                            ║"
    LOCAL_URL="https://localhost:$PORT/"
    NETWORK_HOST=$(hostname -I 2>/dev/null | awk '{print $1}')
    NETWORK_URL="https://$NETWORK_HOST:$PORT/"
    printf "║  🌐 Local URL:   %-55s ║\n" "$LOCAL_URL"
    printf "║  🌍 Network URL: %-55s ║\n" "$NETWORK_URL"
    {
      echo "Server Ready"
      echo "Local URL: $LOCAL_URL"
      echo "Network URL: $NETWORK_URL"
    } >> "$LOG_FILE"
    echo "║                                                                            ║"
    echo "║  📱 Available Pages:                                                       ║"
    echo "║     • /                 - Dashboard (Overview)                             ║"
    echo "║     • /flows            - OAuth Flows (Interactive Demos)                  ║"
    echo "║     • /inspector        - Token Inspector (JWT Analysis)                   ║"
    echo "║     • /config           - Configuration (PingOne Settings)                 ║"
    echo "║     • /docs             - Documentation (OAuth Guides)                     ║"
    echo "║                                                                            ║"
    echo "║  🔐 Security Features:                                                     ║"
    echo "║     • Authorization Code + PKCE (S256) - Default                          ║"
    echo "║     • Strict ID Token Validation                                          ║"
    echo "║     • Issuer Validation (Mix-up Attack Prevention)                        ║"
    echo "║     • Exact Redirect URI Matching                                         ║"
    echo "║     • CSRF Protection                                                     ║"
    echo "║                                                                            ║"
    echo "║  🎓 Educational Features:                                                 ║"
    echo "║     • 5 Interactive OAuth Flow Demonstrations                             ║"
    echo "║     • Real-time JWT Token Analysis                                        ║"
    echo "║     • Step-by-step Tutorials                                              ║"
    echo "║     • Comprehensive Documentation                                         ║"
    echo "║                                                                            ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🔥 Ready to explore OAuth/OIDC flows!"
    echo "💡 Start with: http://localhost:$PORT/flows"
    echo ""
    echo "📝 Press Ctrl+C to stop the server"
    echo ""

    # Wait for the server process
    wait $VITE_PID
else
    echo ""
    echo "❌ Server failed to start!"
    echo "   Check the console output above for error messages."
    echo ""
    exit 1
fi
