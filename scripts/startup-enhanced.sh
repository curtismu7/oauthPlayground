#!/bin/bash

# Enhanced OAuth Playground Startup Script
# Supports command line switches for different startup modes
# Usage: ./startup-enhanced.sh [OPTIONS]
#   -clear     : Full clear (kill processes + clear all cache)
#   -default   : No prompts, normal startup
#   -quick     : Quick startup (minimal checks, no cache clearing)

set -e

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

# Default values for switches
FULL_CLEAR=false
NO_PROMPTS=false
QUICK_START=false

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

# Function to display help
show_help() {
    echo -e "${PURPLE}Enhanced OAuth Playground Startup Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -clear     Full clear (kill processes + clear all cache)"
    echo "  -default   No prompts, normal startup"
    echo "  -quick     Quick startup (minimal checks, no cache clearing)"
    echo "  -help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Interactive startup with prompts"
    echo "  $0 -clear        # Full clear and start"
    echo "  $0 -default      # Normal startup without prompts"
    echo "  $0 -quick        # Quick startup with minimal checks"
    echo ""
}

# Function to parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -clear)
                FULL_CLEAR=true
                NO_PROMPTS=true
                print_status "Mode: Full clear enabled"
                shift
                ;;
            -default)
                NO_PROMPTS=true
                print_status "Mode: Default startup (no prompts)"
                shift
                ;;
            -quick)
                QUICK_START=true
                NO_PROMPTS=true
                print_status "Mode: Quick startup enabled"
                shift
                ;;
            -help|--help|-h)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use -help for usage information"
                exit 1
                ;;
        esac
    done
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
    if [ "$QUICK_START" = true ]; then
        print_info "Quick mode: Skipping port checks"
        return 0
    fi
    
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

# Function to perform full clear
perform_full_clear() {
    print_status "Performing full clear..."
    
    # Kill processes
    kill_processes_on_ports
    
    # Clear caches
    print_info "Clearing caches..."
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "✓ dist directory cleared"
    else
        print_info "ℹ dist directory not found"
    fi
    
    if [ -d "node_modules/.vite" ]; then
        rm -rf node_modules/.vite
        print_success "✓ Vite cache cleared"
    else
        print_info "ℹ Vite cache not found"
    fi
    
    # Clear package lock files if they exist
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
        print_success "✓ package-lock.json cleared"
    fi
    
    if [ -f "server-package-lock.json" ]; then
        rm -f server-package-lock.json
        print_success "✓ server-package-lock.json cleared"
    fi
    
    print_success "Full clear completed"
}

# Function to check system requirements
check_requirements() {
    if [ "$QUICK_START" = true ]; then
        print_info "Quick mode: Skipping system requirements check"
        return 0
    fi
    
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
    
    print_success "System requirements check passed"
}

# Function to start backend server
start_backend() {
    print_status "Starting Backend Server..."
    
    # Check if backend port is available
    if check_port $BACKEND_PORT; then
        if [ "$NO_PROMPTS" = true ]; then
            print_warning "Port $BACKEND_PORT is in use. Attempting to free it..."
            lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
            sleep 2
        else
            print_warning "Port $BACKEND_PORT is in use. Kill processes and continue? (y/n)"
            read -r response
            if [[ $response =~ ^[Yy]$ ]]; then
                lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
                sleep 2
            else
                print_error "Cannot start backend on port $BACKEND_PORT"
                return 1
            fi
        fi
    fi
    
    # Check if server-package.json exists
    if [ ! -f "server-package.json" ]; then
        print_error "server-package.json not found. Backend cannot start."
        return 1
    fi
    
    # Install backend dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
        print_info "Installing backend dependencies..."
        npm install --package-lock-only --package-lock=server-package.json
        npm install express cors node-fetch dotenv
    fi
    
    # Start backend server
    print_info "Starting backend on port $BACKEND_PORT..."
    print_info "📋 Server logs: backend.log (default) - Use 'tail -f backend.log' to follow"
    node server.js > backend.log 2>&1 &
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
        if [ "$NO_PROMPTS" = true ]; then
            print_warning "Port $FRONTEND_PORT is in use. Attempting to free it..."
            lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
            sleep 3
        else
            print_warning "Port $FRONTEND_PORT is in use. Kill processes and continue? (y/n)"
            read -r response
            if [[ $response =~ ^[Yy]$ ]]; then
                lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
                sleep 3
            else
                print_error "Cannot start frontend on port $FRONTEND_PORT"
                return 1
            fi
        fi
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Frontend cannot start."
        return 1
    fi
    
    # Install frontend dependencies if needed
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
    echo "║                    🚀 MasterFlow API Enhanced Startup 🚀                          ║"
    echo "║                                                                              ║"
    echo "║  Frontend: ${CYAN}$FRONTEND_URL${NC}${PURPLE}"
    echo "║  Backend:  ${CYAN}$BACKEND_URL${NC}${PURPLE}"
    echo "║  Server Log: ${YELLOW}backend.log (default)${NC}${PURPLE}"
    echo "║                                                                              ║"
    echo "║  Mode: $([ "$FULL_CLEAR" = true ] && echo "Full Clear" || [ "$QUICK_START" = true ] && echo "Quick Start" || echo "Standard")"
    echo "║                                                                              ║"
    echo "║  ${YELLOW}📋 Server logs available in: backend.log (tail -f backend.log)${NC}${PURPLE}"
    echo "║  Press Ctrl+C to stop both servers                                          ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Function to cleanup on exit
cleanup() {
    print_info "Shutting down servers..."
    print_info "📋 Server logs preserved in: backend.log"
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$frontend_pid" 2>/dev/null; then
            kill "$frontend_pid" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$backend_pid" 2>/dev/null; then
            kill "$backend_pid" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    print_success "Cleanup completed"
    print_info "📋 Check backend.log for complete session logs"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Parse command line arguments
    parse_args "$@"
    
    # Display startup mode
    if [ "$FULL_CLEAR" = true ]; then
        print_status "🧹 Starting with Full Clear mode"
    elif [ "$QUICK_START" = true ]; then
        print_status "⚡ Starting with Quick mode"
    else
        print_status "🚀 Starting with Standard mode"
    fi
    
    # Perform full clear if requested
    if [ "$FULL_CLEAR" = true ]; then
        perform_full_clear
    fi
    
    # Check system requirements
    check_requirements
    
    # Clean up any existing processes
    if [ "$QUICK_START" != true ]; then
        print_info "Cleaning up any existing processes..."
        kill_processes_on_ports
    fi
    
    # Start backend first
    if start_backend; then
        # Start frontend
        if start_frontend; then
            show_banner
            print_success "🎉 MasterFlow API is now running!"
            print_info "Frontend: $FRONTEND_URL"
            print_info "Backend:  $BACKEND_URL"
            print_info "Press Ctrl+C to stop both servers"
            echo ""
            print_info "${YELLOW}💡 Pro Tip: Follow server logs in real-time with: tail -f backend.log${NC}"
            print_info "${YELLOW}💡 Pro Tip: Monitor both logs with: tail -f backend.log & tail -f vite.log${NC}"
            echo ""
            print_info "${CYAN}📊 Recommended Monitoring Setups:${NC}"
            print_info "${GREEN}  • Development: tail -f backend.log vite.log logs/pingone-api.log${NC}"
            print_info "${GREEN}  • API Testing: tail -f backend.log logs/pingone-api.log logs/real-api.log${NC}"
            print_info "${GREEN}  • Flow Testing: tail -f backend.log logs/sms.log logs/email.log${NC}"
            print_info "${GREEN}  • Complete View: tail -f backend.log vite.log logs/pingone-api.log logs/server.log${NC}"
            print_info "${GREEN}  • All-in-One: tail -f backend.log vite.log logs/pingone-api.log logs/server.log logs/sms.log logs/email.log${NC}"
            echo ""
            
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

# Run main function with all arguments
main "$@"
