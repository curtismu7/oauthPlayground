#!/bin/bash

# OAuth Playground Startup Script
# Starts both frontend and backend servers with comprehensive error handling

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
GEAR="🔧"
ART="🎨"
HEART="💚"
LINK="🔗"

# Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001
FRONTEND_URL="https://localhost:${FRONTEND_PORT}"
BACKEND_URL="http://localhost:${BACKEND_PORT}"
HEALTH_CHECK_URL="${BACKEND_URL}/api/health"
TOKEN_EXCHANGE_URL="${BACKEND_URL}/api/token-exchange"

# PID files for cleanup
FRONTEND_PID_FILE="/tmp/oauth-playground-frontend.pid"
BACKEND_PID_FILE="/tmp/oauth-playground-backend.pid"

# Function to print colored output
print_status() {
    local color=$1
    local emoji=$2
    local message=$3
    echo -e "${color}${emoji} ${message}${NC}"
}

print_error() {
    print_status "$RED" "$CROSS" "$1"
}

print_success() {
    print_status "$GREEN" "$CHECK" "$1"
}

print_warning() {
    print_status "$YELLOW" "$WARNING" "$1"
}

print_info() {
    print_status "$BLUE" "$INFO" "$1"
}

print_header() {
    print_status "$PURPLE" "$ROCKET" "$1"
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

# Function to check if a URL is responding
check_url() {
    local url=$1
    local timeout=${2:-5}
    if curl -s --max-time $timeout "$url" >/dev/null 2>&1; then
        return 0  # URL is responding
    else
        return 1  # URL is not responding
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_url "$url" 2; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo ""
    print_error "$service_name failed to start after $max_attempts seconds"
    return 1
}

# Function to cleanup processes
cleanup() {
    print_info "Cleaning up processes..."
    
    # Kill frontend if running
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$frontend_pid" 2>/dev/null; then
            print_info "Stopping frontend server (PID: $frontend_pid)..."
            kill "$frontend_pid" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Kill backend if running
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$backend_pid" 2>/dev/null; then
            print_info "Stopping backend server (PID: $backend_pid)..."
            kill "$backend_pid" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Kill any remaining processes on our ports
    if check_port $FRONTEND_PORT; then
        print_info "Killing processes on port $FRONTEND_PORT..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port $BACKEND_PORT; then
        print_info "Killing processes on port $BACKEND_PORT..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    fi
    
    print_success "Cleanup complete"
}

# Function to show error help
show_error_help() {
    echo ""
    print_error "🚨 COMMON ISSUES AND SOLUTIONS:"
    echo ""
    print_warning "1. Backend Server Not Running:"
    echo "   If you see '500 Internal Server Error' or 'Failed to exchange code for tokens':"
    echo "   → The backend server is not running"
    echo "   → Run this script: ./start-oauth-playground.sh"
    echo "   → Or start backend manually: node server.js"
    echo ""
    print_warning "2. Port Already in Use:"
    echo "   If you see 'EADDRINUSE' errors:"
    echo "   → Kill existing processes: lsof -ti:3000,3001 | xargs kill -9"
    echo "   → Or use different ports by modifying this script"
    echo ""
    print_warning "3. Missing Dependencies:"
    echo "   If you see 'command not found' errors:"
    echo "   → Install dependencies: npm install"
    echo "   → Install backend deps: npm install express cors node-fetch dotenv"
    echo ""
    print_warning "4. Environment Configuration:"
    echo "   If you see configuration errors:"
    echo "   → Check .env file exists and has correct PingOne credentials"
    echo "   → Verify PINGONE_ENVIRONMENT_ID, PINGONE_CLIENT_ID, PINGONE_CLIENT_SECRET"
    echo ""
    print_info "For more help, check the logs or run: ./start-oauth-playground.sh --help"
}

# Function to show help
show_help() {
    echo ""
    print_header "OAuth Playground Startup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --frontend-only     Start only the frontend server"
    echo "  --backend-only      Start only the backend server"
    echo "  --check             Check if servers are running"
    echo "  --stop              Stop all running servers"
    echo "  --restart           Restart all servers"
    echo ""
    echo "Examples:"
    echo "  $0                  # Start both servers"
    echo "  $0 --frontend-only  # Start only frontend"
    echo "  $0 --check          # Check server status"
    echo "  $0 --stop           # Stop all servers"
    echo ""
}

# Function to check server status
check_status() {
    print_header "Checking OAuth Playground Status"
    echo ""
    
    # Check frontend
    if check_port $FRONTEND_PORT; then
        print_success "Frontend server is running on port $FRONTEND_PORT"
        if check_url "$FRONTEND_URL" 5; then
            print_success "Frontend is accessible at $FRONTEND_URL"
        else
            print_warning "Frontend port is open but not responding"
        fi
    else
        print_error "Frontend server is not running"
    fi
    
    echo ""
    
    # Check backend
    if check_port $BACKEND_PORT; then
        print_success "Backend server is running on port $BACKEND_PORT"
        if check_url "$HEALTH_CHECK_URL" 5; then
            print_success "Backend is accessible at $BACKEND_URL"
            print_success "Health check: $HEALTH_CHECK_URL"
            print_success "Token exchange: $TOKEN_EXCHANGE_URL"
        else
            print_warning "Backend port is open but not responding"
        fi
    else
        print_error "Backend server is not running"
        print_warning "This will cause '500 Internal Server Error' in token exchange"
    fi
    
    echo ""
}

# Function to start backend server
start_backend() {
    print_header "Starting Backend Server"
    
    # Check if backend is already running
    if check_port $BACKEND_PORT; then
        print_warning "Backend server is already running on port $BACKEND_PORT"
        if check_url "$HEALTH_CHECK_URL" 2; then
            print_success "Backend is healthy and ready"
            return 0
        else
            print_warning "Backend port is occupied but not responding, killing existing process..."
            lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error "No .env file found!"
        print_info "Please create a .env file with your PingOne configuration"
        print_info "You can copy from env.example and fill in your values"
        return 1
    fi
    
    # Check if server.js exists
    if [ ! -f "server.js" ]; then
        print_error "server.js not found!"
        print_info "Make sure you're running this script from the project root directory"
        return 1
    fi
    
    # Install backend dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
        print_info "Installing backend dependencies..."
        npm install express cors node-fetch dotenv 2>/dev/null || {
            print_error "Failed to install backend dependencies"
            return 1
        }
    fi
    
    # Start backend server
    print_info "Starting backend server on port $BACKEND_PORT..."
    node server.js > logs/backend.log 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    # Wait for backend to be ready
    if wait_for_service "$HEALTH_CHECK_URL" "Backend server"; then
        print_success "Backend server started successfully (PID: $backend_pid)"
        print_info "Backend URL: $BACKEND_URL"
        print_info "Health check: $HEALTH_CHECK_URL"
        print_info "Token exchange: $TOKEN_EXCHANGE_URL"
        return 0
    else
        print_error "Backend server failed to start"
        print_info "Check logs/backend.log for details"
        return 1
    fi
}

# Function to start frontend server
start_frontend() {
    print_header "Starting Frontend Server"
    
    # Check if frontend is already running
    if check_port $FRONTEND_PORT; then
        print_warning "Frontend server is already running on port $FRONTEND_PORT"
        if check_url "$FRONTEND_URL" 2; then
            print_success "Frontend is accessible and ready"
            return 0
        else
            print_warning "Frontend port is occupied but not responding, killing existing process..."
            lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        print_info "Make sure you're running this script from the project root directory"
        return 1
    fi
    
    # Install frontend dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/vite/package.json" ]; then
        print_info "Installing frontend dependencies..."
        npm install 2>/dev/null || {
            print_error "Failed to install frontend dependencies"
            return 1
        }
    fi
    
    # Start frontend server
    print_info "Starting frontend server on port $FRONTEND_PORT..."
    npm run dev > logs/frontend.log 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    # Wait for frontend to be ready
    if wait_for_service "$FRONTEND_URL" "Frontend server"; then
        print_success "Frontend server started successfully (PID: $frontend_pid)"
        print_info "Frontend URL: $FRONTEND_URL"
        return 0
    else
        print_error "Frontend server failed to start"
        print_info "Check logs/frontend.log for details"
        return 1
    fi
}

# Function to start both servers
start_all() {
    print_header "Starting OAuth Playground"
    echo ""
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Start backend first
    if ! start_backend; then
        print_error "Failed to start backend server"
        show_error_help
        exit 1
    fi
    
    echo ""
    
    # Start frontend
    if ! start_frontend; then
        print_error "Failed to start frontend server"
        print_warning "Backend is still running, you can access it at $BACKEND_URL"
        show_error_help
        exit 1
    fi
    
    echo ""
    print_success "🎉 OAuth Playground is now running!"
    echo ""
    print_info "📱 Frontend: $FRONTEND_URL"
    print_info "🔧 Backend:  $BACKEND_URL"
    print_info "💚 Health:   $HEALTH_CHECK_URL"
    print_info "🔄 Token:    $TOKEN_EXCHANGE_URL"
    echo ""
    print_info "Press Ctrl+C to stop both servers"
    echo ""
    
    # Keep script running and handle cleanup
    trap cleanup SIGINT SIGTERM
    
    # Wait for processes
    wait
}

# Main script logic
main() {
    case "${1:-}" in
        --help|-h)
            show_help
            ;;
        --check)
            check_status
            ;;
        --stop)
            cleanup
            ;;
        --restart)
            cleanup
            sleep 2
            start_all
            ;;
        --frontend-only)
            start_frontend
            ;;
        --backend-only)
            start_backend
            ;;
        "")
            start_all
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
