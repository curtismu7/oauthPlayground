#!/bin/bash

# MasterFlow API - Simple Startup Script
# Quick start for both frontend and backend with no prompts
# Version: 5.0.0 - Windsurf Compatible

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
echo -e "${BLUE}🚀 MasterFlow API Simple Startup v5.0.0${NC}"
echo -e "${BLUE}🌐 Custom Domain Support Available:${NC}"
echo -e "${BLUE}   • Setup: ./setup-custom-domain.sh${NC}"
echo -e "${BLUE}   • Run:   ./run-custom-domain.sh${NC}"
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

if start_backend; then
    if start_frontend; then
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                              🎉 SERVERS READY! 🎉                          ║${NC}"
        echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${GREEN}║${NC} Frontend: ${GREEN}$FRONTEND_URL${NC}"
        echo -e "${GREEN}║${NC} Backend:  ${GREEN}$BACKEND_URL${NC}"
        echo -e "${GREEN}║${NC} Status:   ${GREEN}✅ Both servers running and healthy${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${GREEN}🔥 MasterFlow API is ready to use!${NC}"
        echo -e "${GREEN}💡 Open your browser to: $FRONTEND_URL${NC}"
        echo ""
        echo -e "${BLUE}📝 Log files:${NC}"
        echo -e "${BLUE}   • Backend:  backend.log${NC}"
        echo -e "${BLUE}   • Frontend: frontend.log${NC}"
        echo ""
        echo -e "${YELLOW}Press Ctrl+C to stop the servers${NC}"
        echo ""
        
        # Wait for processes
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

