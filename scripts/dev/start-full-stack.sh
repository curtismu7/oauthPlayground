#!/bin/bash

# OAuth Playground - Full Stack Startup Script
# Starts both frontend (Vite) and backend (Express) servers
# Version: 4.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
BACKEND_URL="https://localhost:${BACKEND_PORT}"

# PID files for process management
FRONTEND_PID_FILE=".frontend.pid"
BACKEND_PID_FILE=".backend.pid"

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
    echo -e "${CYAN}[$(date +'%H:%M:%S')] ℹ️${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on specific ports
kill_processes_on_ports() {
    print_info "Killing any processes on ports $FRONTEND_PORT and $BACKEND_PORT..."
    
    # Kill processes on frontend port
    if check_port $FRONTEND_PORT; then
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # Kill processes on backend port
    if check_port $BACKEND_PORT; then
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # Also kill any Vite and Node server processes
    pkill -f "vite" 2>/dev/null || true
    pkill -f "node server.js" 2>/dev/null || true
    sleep 2
}

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            print_info "Stopping $service_name (PID: $pid)..."
            kill "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name..."
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
        print_success "$service_name stopped"
    fi
}

# Function to cleanup on exit
cleanup() {
    print_info "Shutting down servers..."
    kill_by_pid_file "$FRONTEND_PID_FILE" "Frontend"
    kill_by_pid_file "$BACKEND_PID_FILE" "Backend"
    print_success "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Function to start backend server
start_backend() {
    print_status "Starting Backend Server..."
    
    # Check if backend port is available
    if check_port $BACKEND_PORT; then
        print_warning "Port $BACKEND_PORT is already in use. Attempting to free it..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Check if server-package.json exists
    if [ ! -f "server-package.json" ]; then
        print_error "server-package.json not found. Backend cannot start."
        return 1
    fi
    
    # Install backend dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
        print_info "Installing backend dependencies..."
        npm install --package-lock-only --package-lock=server-package.json
        npm install express cors node-fetch dotenv
    fi
    
    # Start backend server
    print_info "Starting backend on port $BACKEND_PORT..."
    node server.js &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    # Wait for backend to start
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -k "$BACKEND_URL/api/health" >/dev/null 2>&1; then
            print_success "Backend server started successfully on $BACKEND_URL"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "Backend server failed to start within 30 seconds"
    return 1
}

# Function to start frontend server
start_frontend() {
    print_status "Starting Frontend Server..."
    
    # Kill any existing Vite processes
    pkill -f "vite" 2>/dev/null || true
    sleep 2
    
    # Check if frontend port is available
    if check_port $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT is already in use. Attempting to free it..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 3
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Frontend cannot start."
        return 1
    fi
    
    # Install frontend dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/vite/package.json" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    fi
    
    # Double-check that frontend port is available
    if check_port $FRONTEND_PORT; then
        print_error "Port $FRONTEND_PORT is still in use after cleanup. Cannot start frontend."
        return 1
    fi
    
    # Start frontend server with explicit port
    print_info "Starting frontend on port $FRONTEND_PORT..."
    npx vite --port $FRONTEND_PORT --strictPort &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    # Wait for frontend to start
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            print_success "Frontend server started successfully on http://localhost:$FRONTEND_PORT"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "Frontend server failed to start within 30 seconds"
    return 1
}

# Function to display startup banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                    🚀 MasterFlow API v4.0.0 🚀                                 ║"
    echo "║                    Full Stack Startup Script                                ║"
    echo "║                                                                              ║"
    echo "║  Frontend: $FRONTEND_URL"
    echo "║  Backend:  $BACKEND_URL"
    echo "║                                                                              ║"
    echo "║  🌐 Custom Domain Support Available:                                         ║"
    echo "║     • Setup: ./setup-custom-domain.sh                                        ║"
    echo "║     • Run:   ./run-custom-domain.sh                                          ║"
    echo "║                                                                              ║"
    echo "║  Press Ctrl+C to stop both servers                                          ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ to continue."
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm to continue."
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        print_warning "curl is not installed. Health checks may not work properly."
    fi
    
    print_success "System requirements check passed"
}

# Function to display server status
show_status() {
    echo -e "\n${CYAN}📊 Server Status:${NC}"
    echo -e "${BLUE}Frontend:${NC} $FRONTEND_URL"
    if check_port $FRONTEND_PORT; then
        echo -e "  Status: ${GREEN}✅ Running${NC}"
    else
        echo -e "  Status: ${RED}❌ Not Running${NC}"
    fi
    
    echo -e "${BLUE}Backend:${NC}  $BACKEND_URL"
    if check_port $BACKEND_PORT; then
        echo -e "  Status: ${GREEN}✅ Running${NC}"
    else
        echo -e "  Status: ${RED}❌ Not Running${NC}"
    fi
    echo ""
}

# Function to open browser
open_browser() {
    if command -v open &> /dev/null; then
        # macOS
        open "$FRONTEND_URL"
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$FRONTEND_URL"
    elif command -v start &> /dev/null; then
        # Windows
        start "$FRONTEND_URL"
    else
        print_info "Please open your browser and navigate to: $FRONTEND_URL"
    fi
}

# Main execution
main() {
    check_requirements
    
    # Clean up any existing processes
    print_info "Cleaning up any existing processes..."
    kill_processes_on_ports
    kill_by_pid_file "$FRONTEND_PID_FILE" "Frontend"
    kill_by_pid_file "$BACKEND_PID_FILE" "Backend"
    
    # Start backend first
    if start_backend; then
        # Start frontend
        if start_frontend; then
            show_banner
            show_status
            print_success "🎉 OAuth Playground is now running!"
            print_info "Frontend: $FRONTEND_URL"
            print_info "Backend:  $BACKEND_URL"
            print_info "Press Ctrl+C to stop both servers"
            
            # Open browser
            sleep 2
            open_browser
            
            # Keep script running and monitor processes
            while true; do
                sleep 5
                
                # Check if processes are still running
                if [ -f "$FRONTEND_PID_FILE" ]; then
                    local frontend_pid=$(cat "$FRONTEND_PID_FILE")
                    if ! kill -0 "$frontend_pid" 2>/dev/null; then
                        print_error "Frontend process died unexpectedly"
                        cleanup
                    fi
                fi
                
                if [ -f "$BACKEND_PID_FILE" ]; then
                    local backend_pid=$(cat "$BACKEND_PID_FILE")
                    if ! kill -0 "$backend_pid" 2>/dev/null; then
                        print_error "Backend process died unexpectedly"
                        cleanup
                    fi
                fi
            done
        else
            print_error "Failed to start frontend server"
            cleanup
        fi
    else
        print_error "Failed to start backend server"
        cleanup
    fi
}

# Run main function
main "$@"

