#!/bin/bash

# MasterFlow API - Enhanced Startup Script
# Provides detailed server status with nice formatting and icons, and logs to logs/startup.log
# Version: 5.0.0 - Windsurf Compatible (No Prompts)

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001
FRONTEND_URL="https://localhost:${FRONTEND_PORT}"
BACKEND_URL="https://localhost:${BACKEND_PORT}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_status "Killing processes on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to start backend
start_backend() {
    print_status "🚀 Starting backend server..."
    
    # Kill existing backend processes
    kill_port $BACKEND_PORT
    
    # Start backend
    print_info "Starting backend on port $BACKEND_PORT (HTTPS)..."
    BACKEND_PORT=$BACKEND_PORT node server.js > backend.log 2>&1 &
    BACKEND_PID=$!
    
    print_info "Backend started with PID: $BACKEND_PID"
    
    # Wait for backend to start
    local max_attempts=30
    local attempt=0
    
    print_info "Waiting for backend to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -k "$BACKEND_URL/api/health" >/dev/null 2>&1; then
            print_success "Backend server started successfully on $BACKEND_URL"
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            print_error "Backend process died during startup"
            print_error "Check backend.log for details:"
            tail -10 backend.log 2>/dev/null || echo "No log file found"
            return 1
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    
    echo ""
    print_error "Backend server failed to start within 30 seconds"
    return 1
}

# Function to start frontend
start_frontend() {
    print_status "🚀 Starting frontend server..."
    
    # Kill existing frontend processes
    kill_port $FRONTEND_PORT
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/vite/package.json" ]; then
        print_info "Installing frontend dependencies..."
        npm install || {
            print_error "Failed to install dependencies"
            return 1
        }
    fi
    
    # Clear caches for clean restart
    print_info "Clearing caches..."
    rm -rf node_modules/.vite 2>/dev/null || true
    rm -rf .vite 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    
    # Start frontend
    print_info "Starting frontend on port $FRONTEND_PORT..."
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    print_info "Frontend started with PID: $FRONTEND_PID"
    
    # Wait for frontend to start
    local max_attempts=30
    local attempt=0
    
    print_info "Waiting for frontend to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -k "$FRONTEND_URL" >/dev/null 2>&1; then
            print_success "Frontend server started successfully on $FRONTEND_URL"
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
            print_error "Frontend process died during startup"
            print_error "Check frontend.log for details:"
            tail -10 frontend.log 2>/dev/null || echo "No log file found"
            return 1
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    
    echo ""
    print_error "Frontend server failed to start within 30 seconds"
    return 1
}

# Function to cleanup on exit
cleanup() {
    echo ""
    print_status "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    
    # Kill any remaining processes
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    print_success "Servers stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           🔐 MASTERFLOW API 🔐                               ║"
echo "║                                                                              ║"
echo "║  🌐 Custom Domain Support Available:                                         ║"
echo "║     • Setup: ./setup-custom-domain.sh                                        ║"
echo "║     • Run:   ./run-custom-domain.sh                                          ║"
echo "║                                                                              ║"
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
  echo "[$TIMESTAMP] MasterFlow API Startup"
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

# Check requirements
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

if [ ! -f "package.json" ]; then
    print_error "package.json not found - not in MasterFlow API directory"
    exit 1
fi

if [ ! -f "server.js" ]; then
    print_error "server.js not found - not in MasterFlow API directory"
    exit 1
fi

# Start servers
print_status "🔧 Starting servers..."
echo "   Port: $PORT"
echo "   URL: https://localhost:$PORT/"
{
  echo "Starting dev server on port $PORT"
  echo "Local URL: https://localhost:$PORT/"
} >> "$LOG_FILE"
echo ""

if start_backend; then
    if start_frontend; then
        echo ""
        echo "╔══════════════════════════════════════════════════════════════════════════════╗"
        echo "║                              🎉 SERVERS READY! 🎉                            ║"
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
        wait
    else
        print_error "Failed to start frontend server"
        cleanup
        exit 1
    fi
else
    print_error "Failed to start backend server"
    cleanup
    exit 1
fi
