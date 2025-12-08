#!/bin/bash

# OAuth Playground - Server Restart Script
# Kills all servers, restarts them, checks for errors, and reports status
# Version: 1.0.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration - Fixed ports for OAuth Playground
# These ports are hardcoded to ensure consistency with OAuth redirect URIs
# and API endpoint configurations. Do not change these values.
FRONTEND_PORT=3000  # Vite dev server (HTTPS)
BACKEND_HTTP_PORT=3001   # Express API server (HTTP)
BACKEND_HTTPS_PORT=3002  # Express API server (HTTPS)
FRONTEND_URL="https://localhost:${FRONTEND_PORT}"
BACKEND_HTTP_URL="http://localhost:${BACKEND_HTTP_PORT}"
BACKEND_HTTPS_URL="https://localhost:${BACKEND_HTTPS_PORT}"

# PID files for process management
FRONTEND_PID_FILE=".frontend.pid"
BACKEND_PID_FILE=".backend.pid"

# Status tracking
FRONTEND_STATUS="unknown"
BACKEND_HTTP_STATUS="unknown"
BACKEND_HTTPS_STATUS="unknown"
OVERALL_STATUS="unknown"

# Function to find and change to the OAuth Playground directory
find_project_directory() {
    print_status "🔍 Locating OAuth Playground project directory..."
    
    # Check if we're already in the right directory
    if [ -f "package.json" ] && [ -f "server.js" ] && grep -q "pingone-oauth-playground" package.json 2>/dev/null; then
        print_success "Already in OAuth Playground directory: $(pwd)"
        return 0
    fi
    
    # Common locations to check
    local common_paths=(
        "."
        "./oauth-playground"
        "../oauth-playground"
        "~/oauth-playground"
        "~/Projects/oauth-playground"
        "~/Development/oauth-playground"
        "~/Code/oauth-playground"
        "~/Desktop/oauth-playground"
        "~/Documents/oauth-playground"
    )
    
    print_info "Searching common locations for OAuth Playground..."
    
    for path in "${common_paths[@]}"; do
        # Expand tilde
        expanded_path="${path/#\~/$HOME}"
        
        if [ -d "$expanded_path" ]; then
            cd "$expanded_path" 2>/dev/null || continue
            
            if [ -f "package.json" ] && [ -f "server.js" ] && grep -q "pingone-oauth-playground" package.json 2>/dev/null; then
                print_success "Found OAuth Playground at: $(pwd)"
                return 0
            fi
        fi
    done
    
    # If not found, ask user
    print_warning "OAuth Playground directory not found in common locations"
    echo ""
    echo -e "${YELLOW}Please provide the path to your OAuth Playground directory:${NC}"
    echo -e "${CYAN}(The directory should contain package.json and server.js files)${NC}"
    echo ""
    
    while true; do
        echo -n "Enter directory path (or 'quit' to exit): "
        read -r user_path
        
        if [ "$user_path" = "quit" ] || [ "$user_path" = "q" ]; then
            print_error "User cancelled directory selection"
            exit 1
        fi
        
        if [ -z "$user_path" ]; then
            print_warning "Please enter a valid directory path"
            continue
        fi
        
        # Expand tilde and resolve path
        expanded_path="${user_path/#\~/$HOME}"
        expanded_path=$(realpath "$expanded_path" 2>/dev/null || echo "$expanded_path")
        
        if [ ! -d "$expanded_path" ]; then
            print_error "Directory does not exist: $expanded_path"
            continue
        fi
        
        cd "$expanded_path" 2>/dev/null || {
            print_error "Cannot access directory: $expanded_path"
            continue
        }
        
        if [ ! -f "package.json" ]; then
            print_error "package.json not found in: $expanded_path"
            print_info "This doesn't appear to be the OAuth Playground directory"
            continue
        fi
        
        if [ ! -f "server.js" ]; then
            print_error "server.js not found in: $expanded_path"
            print_info "This doesn't appear to be the OAuth Playground directory"
            continue
        fi
        
        if ! grep -q "pingone-oauth-playground" package.json 2>/dev/null; then
            print_warning "This appears to be a different Node.js project"
            echo -n "Continue anyway? (y/N): "
            read -r confirm
            if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                continue
            fi
        fi
        
        print_success "Using directory: $(pwd)"
        return 0
    done
}

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

# Function to display banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                    🔄 OAuth Playground Server Restart 🔄                    ║"
    echo "║                                                                              ║"
    echo "║  Frontend: https://localhost:3000 (Vite Dev Server)                        ║"
    echo "║  Backend:  http://localhost:3001 (Express API Server - HTTP)               ║"
    echo "║  Backend:  https://localhost:3002 (Express API Server - HTTPS)             ║"
    echo "║                                                                              ║"
    echo "║  This script will:                                                          ║"
    echo "║  1. Find and change to OAuth Playground directory                          ║"
    echo "║  2. Kill all existing servers                                               ║"
    echo "║  3. Clean up processes and ports 3000, 3001 & 3002                         ║"
    echo "║  4. Restart all three servers                                               ║"
    echo "║  5. Check for errors and report status                                      ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
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

# Function to get process using port
get_port_process() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null || echo ""
}

# Function to kill all OAuth playground related processes
kill_all_servers() {
    print_status "🛑 Killing all existing servers..."
    
    # Kill by PID files first
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing frontend process (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing backend process (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Kill processes by port
    local frontend_pid=$(get_port_process $FRONTEND_PORT)
    local backend_http_pid=$(get_port_process $BACKEND_HTTP_PORT)
    local backend_https_pid=$(get_port_process $BACKEND_HTTPS_PORT)
    
    if [ -n "$frontend_pid" ]; then
        print_info "Killing process on port $FRONTEND_PORT (PID: $frontend_pid)"
        kill -9 "$frontend_pid" 2>/dev/null || true
    fi
    
    if [ -n "$backend_http_pid" ]; then
        print_info "Killing process on port $BACKEND_HTTP_PORT (PID: $backend_http_pid)"
        kill -9 "$backend_http_pid" 2>/dev/null || true
    fi
    
    if [ -n "$backend_https_pid" ]; then
        print_info "Killing process on port $BACKEND_HTTPS_PORT (PID: $backend_https_pid)"
        kill -9 "$backend_https_pid" 2>/dev/null || true
    fi
    
    # Kill any node processes that might be related to our project
    print_info "Cleaning up any remaining Node.js processes..."
    pkill -f "vite" 2>/dev/null || true
    pkill -f "server.js" 2>/dev/null || true
    pkill -f "oauth-playground" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 3
    
    # Verify ports are free
    if check_port $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT still in use, force killing..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    if check_port $BACKEND_HTTP_PORT; then
        print_warning "Port $BACKEND_HTTP_PORT still in use, force killing..."
        lsof -ti:$BACKEND_HTTP_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    if check_port $BACKEND_HTTPS_PORT; then
        print_warning "Port $BACKEND_HTTPS_PORT still in use, force killing..."
        lsof -ti:$BACKEND_HTTPS_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    print_success "All servers killed successfully"
}

# Function to check system requirements
check_requirements() {
    print_status "🔍 Checking system requirements..."
    
    local requirements_ok=true
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        requirements_ok=false
    else
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 16 ]; then
            print_error "Node.js version 16+ required. Current: $(node --version)"
            requirements_ok=false
        else
            print_success "Node.js $(node --version) ✓"
        fi
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        requirements_ok=false
    else
        print_success "npm $(npm --version) ✓"
    fi
    
    # Check required files
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        requirements_ok=false
    else
        print_success "package.json ✓"
    fi
    
    if [ ! -f "server.js" ]; then
        print_error "server.js not found"
        requirements_ok=false
    else
        print_success "server.js ✓"
    fi
    
    # Check curl for health checks
    if ! command -v curl &> /dev/null; then
        print_warning "curl not installed - health checks may not work"
    else
        print_success "curl ✓"
    fi
    
    if [ "$requirements_ok" = false ]; then
        print_error "System requirements not met. Please fix the above issues."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Function to start backend server
start_backend() {
    print_status "🚀 Starting backend server..."
    
    # Verify ports are free
    if check_port $BACKEND_HTTP_PORT; then
        print_error "Port $BACKEND_HTTP_PORT is still in use after cleanup"
        BACKEND_HTTP_STATUS="failed"
        BACKEND_HTTPS_STATUS="failed"
        return 1
    fi
    
    if check_port $BACKEND_HTTPS_PORT; then
        print_error "Port $BACKEND_HTTPS_PORT is still in use after cleanup"
        BACKEND_HTTP_STATUS="failed"
        BACKEND_HTTPS_STATUS="failed"
        return 1
    fi
    
    # Start backend server (starts both HTTP and HTTPS)
    print_info "Starting backend servers on ports $BACKEND_HTTP_PORT (HTTP) and $BACKEND_HTTPS_PORT (HTTPS)..."
    BACKEND_PORT=3001 node server.js > backend.log 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    print_info "Backend started with PID: $backend_pid"
    
    # Wait for backend to start
    local max_attempts=30
    local attempt=0
    local http_ready=false
    local https_ready=false
    
    print_info "Waiting for backend servers to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        # Check HTTP backend
        if [ "$http_ready" = false ] && curl -s "$BACKEND_HTTP_URL/api/health" >/dev/null 2>&1; then
            print_success "Backend HTTP server started successfully on $BACKEND_HTTP_URL"
            http_ready=true
            BACKEND_HTTP_STATUS="running"
        fi
        
        # Check HTTPS backend
        if [ "$https_ready" = false ] && curl -s -k "$BACKEND_HTTPS_URL/api/health" >/dev/null 2>&1; then
            print_success "Backend HTTPS server started successfully on $BACKEND_HTTPS_URL"
            https_ready=true
            BACKEND_HTTPS_STATUS="running"
        fi
        
        # If both are ready, we're done
        if [ "$http_ready" = true ] && [ "$https_ready" = true ]; then
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$backend_pid" 2>/dev/null; then
            print_error "Backend process died during startup"
            print_error "Check backend.log for details:"
            tail -10 backend.log 2>/dev/null || echo "No log file found"
            BACKEND_HTTP_STATUS="failed"
            BACKEND_HTTPS_STATUS="failed"
            return 1
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    
    echo ""
    
    # Check final status
    if [ "$http_ready" = false ]; then
        print_error "Backend HTTP server failed to start within 30 seconds"
        BACKEND_HTTP_STATUS="failed"
    fi
    
    if [ "$https_ready" = false ]; then
        print_error "Backend HTTPS server failed to start within 30 seconds"
        BACKEND_HTTPS_STATUS="failed"
    fi
    
    print_error "Backend process status: $(kill -0 "$backend_pid" 2>/dev/null && echo "running" || echo "dead")"
    print_error "Check backend.log for details:"
    tail -10 backend.log 2>/dev/null || echo "No log file found"
    
    # Return success if at least one backend is running
    if [ "$http_ready" = true ] || [ "$https_ready" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to start frontend server
start_frontend() {
    print_status "🚀 Starting frontend server..."
    
    # Verify port is free
    if check_port $FRONTEND_PORT; then
        print_error "Port $FRONTEND_PORT is still in use after cleanup"
        FRONTEND_STATUS="failed"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/vite/package.json" ]; then
        print_info "Installing frontend dependencies..."
        npm install || {
            print_error "Failed to install dependencies"
            FRONTEND_STATUS="failed"
            return 1
        }
    fi
    
    # Start frontend server
    print_info "Starting frontend on port $FRONTEND_PORT..."
    npm run dev > frontend.log 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > "$FRONTEND_PID_FILE"
    
    print_info "Frontend started with PID: $frontend_pid"
    
    # Wait for frontend to start
    local max_attempts=30
    local attempt=0
    
    print_info "Waiting for frontend to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -k "$FRONTEND_URL" >/dev/null 2>&1; then
            print_success "Frontend server started successfully on $FRONTEND_URL"
            FRONTEND_STATUS="running"
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$frontend_pid" 2>/dev/null; then
            print_error "Frontend process died during startup"
            print_error "Check frontend.log for details:"
            tail -10 frontend.log 2>/dev/null || echo "No log file found"
            FRONTEND_STATUS="failed"
            return 1
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    
    echo ""
    print_error "Frontend server failed to start within 30 seconds"
    print_error "Frontend process status: $(kill -0 "$frontend_pid" 2>/dev/null && echo "running" || echo "dead")"
    print_error "Check frontend.log for details:"
    tail -10 frontend.log 2>/dev/null || echo "No log file found"
    FRONTEND_STATUS="failed"
    return 1
}

# Function to run health checks
run_health_checks() {
    print_status "🏥 Running health checks..."
    
    local health_ok=true
    
    # Backend HTTP health check
    if [ "$BACKEND_HTTP_STATUS" = "running" ]; then
        if curl -s "$BACKEND_HTTP_URL/api/health" | grep -q '"status":"ok"'; then
            print_success "Backend HTTP health check passed"
        else
            print_error "Backend HTTP health check failed"
            health_ok=false
        fi
    fi
    
    # Backend HTTPS health check
    if [ "$BACKEND_HTTPS_STATUS" = "running" ]; then
        if curl -s -k "$BACKEND_HTTPS_URL/api/health" | grep -q '"status":"ok"'; then
            print_success "Backend HTTPS health check passed"
        else
            print_error "Backend HTTPS health check failed"
            health_ok=false
        fi
    fi
    
    # Frontend health check
    if [ "$FRONTEND_STATUS" = "running" ]; then
        if curl -s -k "$FRONTEND_URL" >/dev/null 2>&1; then
            print_success "Frontend health check passed"
        else
            print_error "Frontend health check failed"
            health_ok=false
        fi
    fi
    
    # Port checks
    if check_port $BACKEND_HTTP_PORT; then
        print_success "Backend HTTP port $BACKEND_HTTP_PORT is active"
    else
        print_error "Backend HTTP port $BACKEND_HTTP_PORT is not active"
        health_ok=false
    fi
    
    if check_port $BACKEND_HTTPS_PORT; then
        print_success "Backend HTTPS port $BACKEND_HTTPS_PORT is active"
    else
        print_error "Backend HTTPS port $BACKEND_HTTPS_PORT is not active"
        health_ok=false
    fi
    
    if check_port $FRONTEND_PORT; then
        print_success "Frontend port $FRONTEND_PORT is active"
    else
        print_error "Frontend port $FRONTEND_PORT is not active"
        health_ok=false
    fi
    
    if [ "$health_ok" = true ]; then
        print_success "All health checks passed"
        return 0
    else
        print_error "Some health checks failed"
        return 1
    fi
}

# Function to display final status
show_final_status() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                              📊 FINAL STATUS REPORT                          ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Backend HTTP status
    echo -e "${CYAN}║${NC} Backend HTTP Server:"
    if [ "$BACKEND_HTTP_STATUS" = "running" ]; then
        echo -e "${CYAN}║${NC}   Status: ${GREEN}✅ RUNNING${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${BLUE}$BACKEND_HTTP_URL${NC}"
        echo -e "${CYAN}║${NC}   Health: ${GREEN}✅ HEALTHY${NC}"
    elif [ "$BACKEND_HTTP_STATUS" = "failed" ]; then
        echo -e "${CYAN}║${NC}   Status: ${RED}❌ FAILED${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${RED}$BACKEND_HTTP_URL (not accessible)${NC}"
        echo -e "${CYAN}║${NC}   Health: ${RED}❌ UNHEALTHY${NC}"
    else
        echo -e "${CYAN}║${NC}   Status: ${YELLOW}⚠️  UNKNOWN${NC}"
    fi
    
    echo -e "${CYAN}║${NC}"
    
    # Backend HTTPS status
    echo -e "${CYAN}║${NC} Backend HTTPS Server:"
    if [ "$BACKEND_HTTPS_STATUS" = "running" ]; then
        echo -e "${CYAN}║${NC}   Status: ${GREEN}✅ RUNNING${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${BLUE}$BACKEND_HTTPS_URL${NC}"
        echo -e "${CYAN}║${NC}   Health: ${GREEN}✅ HEALTHY${NC}"
    elif [ "$BACKEND_HTTPS_STATUS" = "failed" ]; then
        echo -e "${CYAN}║${NC}   Status: ${RED}❌ FAILED${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${RED}$BACKEND_HTTPS_URL (not accessible)${NC}"
        echo -e "${CYAN}║${NC}   Health: ${RED}❌ UNHEALTHY${NC}"
    else
        echo -e "${CYAN}║${NC}   Status: ${YELLOW}⚠️  UNKNOWN${NC}"
    fi
    
    echo -e "${CYAN}║${NC}"
    
    # Frontend status
    echo -e "${CYAN}║${NC} Frontend Server:"
    if [ "$FRONTEND_STATUS" = "running" ]; then
        echo -e "${CYAN}║${NC}   Status: ${GREEN}✅ RUNNING${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${BLUE}$FRONTEND_URL${NC}"
        echo -e "${CYAN}║${NC}   Health: ${GREEN}✅ HEALTHY${NC}"
    elif [ "$FRONTEND_STATUS" = "failed" ]; then
        echo -e "${CYAN}║${NC}   Status: ${RED}❌ FAILED${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${RED}$FRONTEND_URL (not accessible)${NC}"
        echo -e "${CYAN}║${NC}   Health: ${RED}❌ UNHEALTHY${NC}"
    else
        echo -e "${CYAN}║${NC}   Status: ${YELLOW}⚠️  UNKNOWN${NC}"
    fi
    
    echo -e "${CYAN}║${NC}"
    
    # Overall status
    if [ "$BACKEND_HTTP_STATUS" = "running" ] && [ "$BACKEND_HTTPS_STATUS" = "running" ] && [ "$FRONTEND_STATUS" = "running" ]; then
        OVERALL_STATUS="success"
        echo -e "${CYAN}║${NC} Overall Status: ${GREEN}🎉 ALL SERVERS RUNNING SUCCESSFULLY${NC}"
        echo -e "${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} ${GREEN}✅ OAuth Playground is ready to use!${NC}"
        echo -e "${CYAN}║${NC} ${GREEN}✅ Open your browser and navigate to: $FRONTEND_URL${NC}"
    elif [ "$BACKEND_HTTP_STATUS" = "running" ] || [ "$BACKEND_HTTPS_STATUS" = "running" ] || [ "$FRONTEND_STATUS" = "running" ]; then
        OVERALL_STATUS="partial"
        echo -e "${CYAN}║${NC} Overall Status: ${YELLOW}⚠️  PARTIAL SUCCESS${NC}"
        echo -e "${CYAN}║${NC}"
        if [ "$BACKEND_HTTP_STATUS" = "running" ]; then
            echo -e "${CYAN}║${NC} ${GREEN}✅ Backend HTTP is running${NC}"
        else
            echo -e "${CYAN}║${NC} ${RED}❌ Backend HTTP failed to start${NC}"
        fi
        if [ "$BACKEND_HTTPS_STATUS" = "running" ]; then
            echo -e "${CYAN}║${NC} ${GREEN}✅ Backend HTTPS is running${NC}"
        else
            echo -e "${CYAN}║${NC} ${RED}❌ Backend HTTPS failed to start${NC}"
        fi
        if [ "$FRONTEND_STATUS" = "running" ]; then
            echo -e "${CYAN}║${NC} ${GREEN}✅ Frontend is running${NC}"
        else
            echo -e "${CYAN}║${NC} ${RED}❌ Frontend failed to start${NC}"
        fi
    else
        OVERALL_STATUS="failure"
        echo -e "${CYAN}║${NC} Overall Status: ${RED}❌ ALL SERVERS FAILED${NC}"
        echo -e "${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} ${RED}❌ OAuth Playground is not accessible${NC}"
        echo -e "${CYAN}║${NC} ${RED}❌ Check the logs above for error details${NC}"
    fi
    
    echo -e "${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Log Files:"
    echo -e "${CYAN}║${NC}   Backend:        backend.log"
    echo -e "${CYAN}║${NC}   Frontend:       frontend.log"
    echo -e "${CYAN}║${NC}   Server:         logs/server.log"
    echo -e "${CYAN}║${NC}   PingOne API:    ${GREEN}logs/pingone-api.log${NC} ${YELLOW}(NEW - all PingOne API calls)${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to open browser if successful
open_browser() {
    if [ "$OVERALL_STATUS" = "success" ]; then
        print_info "Opening browser..."
        if command -v open &> /dev/null; then
            # macOS
            open "$FRONTEND_URL" 2>/dev/null || true
        elif command -v xdg-open &> /dev/null; then
            # Linux
            xdg-open "$FRONTEND_URL" 2>/dev/null || true
        elif command -v start &> /dev/null; then
            # Windows
            start "$FRONTEND_URL" 2>/dev/null || true
        fi
    fi
}

# Function to show final summary message with status banner
show_final_summary() {
    echo ""
    
    # Check current server status for the banner
    local backend_http_running=false
    local backend_https_running=false
    local frontend_running=false
    local backend_http_healthy=false
    local backend_https_healthy=false
    local frontend_healthy=false
    
    # Backend HTTP status check
    if check_port $BACKEND_HTTP_PORT; then
        backend_http_running=true
        if curl -s "$BACKEND_HTTP_URL/api/health" >/dev/null 2>&1; then
            backend_http_healthy=true
        fi
    fi
    
    # Backend HTTPS status check
    if check_port $BACKEND_HTTPS_PORT; then
        backend_https_running=true
        if curl -s -k "$BACKEND_HTTPS_URL/api/health" >/dev/null 2>&1; then
            backend_https_healthy=true
        fi
    fi
    
    # Frontend status check
    if check_port $FRONTEND_PORT; then
        frontend_running=true
        if curl -s -k "$FRONTEND_URL" >/dev/null 2>&1; then
            frontend_healthy=true
        fi
    fi
    
    # Determine overall status for banner
    local banner_color=""
    local status_icon=""
    local status_text=""
    
    if [ "$backend_http_running" = true ] && [ "$backend_https_running" = true ] && [ "$frontend_running" = true ] && [ "$backend_http_healthy" = true ] && [ "$backend_https_healthy" = true ] && [ "$frontend_healthy" = true ]; then
        banner_color="${GREEN}"
        status_icon="🎉"
        status_text="ALL SYSTEMS OPERATIONAL"
        OVERALL_STATUS="success"
    elif [ "$backend_http_running" = true ] || [ "$backend_https_running" = true ] || [ "$frontend_running" = true ]; then
        banner_color="${YELLOW}"
        status_icon="⚠️"
        status_text="SERVERS RUNNING - HEALTH ISSUES"
        OVERALL_STATUS="partial"
    else
        banner_color="${RED}"
        status_icon="❌"
        status_text="SYSTEM FAILURE - SERVERS DOWN"
        OVERALL_STATUS="failure"
    fi
    
    # Show the status banner
    echo -e "${banner_color}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${banner_color}║                                                                              ║${NC}"
    echo -e "${banner_color}║                    ${status_icon} OAUTH PLAYGROUND STATUS ${status_icon}                    ║${NC}"
    echo -e "${banner_color}║                                                                              ║${NC}"
    echo -e "${banner_color}║                          ${status_text}                          ║${NC}"
    echo -e "${banner_color}║                                                                              ║${NC}"
    echo -e "${banner_color}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Backend HTTP status in banner
    echo -e "${banner_color}║${NC} ${BLUE}Backend HTTP Server (Port $BACKEND_HTTP_PORT):${NC}"
    if [ "$backend_http_running" = true ] && [ "$backend_http_healthy" = true ]; then
        echo -e "${banner_color}║${NC}   ${GREEN}✅ RUNNING and HEALTHY${NC} - $BACKEND_HTTP_URL"
    elif [ "$backend_http_running" = true ]; then
        echo -e "${banner_color}║${NC}   ${YELLOW}⚠️  RUNNING but UNHEALTHY${NC} - $BACKEND_HTTP_URL"
    else
        echo -e "${banner_color}║${NC}   ${RED}❌ NOT RUNNING${NC} - $BACKEND_HTTP_URL"
    fi
    
    echo -e "${banner_color}║${NC}"
    
    # Backend HTTPS status in banner
    echo -e "${banner_color}║${NC} ${BLUE}Backend HTTPS Server (Port $BACKEND_HTTPS_PORT):${NC}"
    if [ "$backend_https_running" = true ] && [ "$backend_https_healthy" = true ]; then
        echo -e "${banner_color}║${NC}   ${GREEN}✅ RUNNING and HEALTHY${NC} - $BACKEND_HTTPS_URL"
    elif [ "$backend_https_running" = true ]; then
        echo -e "${banner_color}║${NC}   ${YELLOW}⚠️  RUNNING but UNHEALTHY${NC} - $BACKEND_HTTPS_URL"
    else
        echo -e "${banner_color}║${NC}   ${RED}❌ NOT RUNNING${NC} - $BACKEND_HTTPS_URL"
    fi
    
    echo -e "${banner_color}║${NC}"
    
    # Frontend status in banner
    echo -e "${banner_color}║${NC} ${BLUE}Frontend Server (Port $FRONTEND_PORT):${NC}"
    if [ "$frontend_running" = true ] && [ "$frontend_healthy" = true ]; then
        echo -e "${banner_color}║${NC}   ${GREEN}✅ RUNNING and HEALTHY${NC} - $FRONTEND_URL"
    elif [ "$frontend_running" = true ]; then
        echo -e "${banner_color}║${NC}   ${YELLOW}⚠️  RUNNING but UNHEALTHY${NC} - $FRONTEND_URL"
    else
        echo -e "${banner_color}║${NC}   ${RED}❌ NOT RUNNING${NC} - $FRONTEND_URL"
    fi
    
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    
    # Final message based on overall status
    case "$OVERALL_STATUS" in
        "success")
            echo -e "${banner_color}║${NC} ${GREEN}🎉 SUCCESS: OAuth Playground is fully operational!${NC}"
            echo -e "${banner_color}║${NC} ${GREEN}🌐 Ready to use at: $FRONTEND_URL${NC}"
            echo -e "${banner_color}║${NC} ${GREEN}🔧 Backend HTTP API available at: $BACKEND_HTTP_URL${NC}"
            echo -e "${banner_color}║${NC} ${GREEN}🔐 Backend HTTPS API available at: $BACKEND_HTTPS_URL${NC}"
            ;;
        "partial")
            echo -e "${banner_color}║${NC} ${YELLOW}⚠️  PARTIAL SUCCESS: Check server status above${NC}"
            echo -e "${banner_color}║${NC} ${YELLOW}🔍 Review logs for troubleshooting information${NC}"
            ;;
        "failure")
            echo -e "${banner_color}║${NC} ${RED}❌ FAILURE: Servers failed to start${NC}"
            echo -e "${banner_color}║${NC} ${RED}🔍 Check backend.log and frontend.log for details${NC}"
            ;;
        *)
            echo -e "${banner_color}║${NC} ${YELLOW}❓ UNKNOWN STATUS: Unexpected result${NC}"
            ;;
    esac
    
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}📝 Log files: backend.log, frontend.log, logs/server.log${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}🌐 PingOne API logs: ${GREEN}logs/pingone-api.log${NC} ${YELLOW}(NEW)${NC}"
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}📋 Available Options:${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./restart-servers.sh              - Normal restart${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./restart-servers.sh --tail-api-log - Restart + tail PingOne API log${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./restart-servers.sh --tail --clear - Restart + clear & tail API log${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./restart-servers.sh --help        - Show help message${NC}"
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Parse command line arguments
TAIL_API_LOG=false
CLEAR_API_LOG=false
for arg in "$@"; do
    case "$arg" in
        --tail-api-log|--tail)
            TAIL_API_LOG=true
            ;;
        --clear-api-log|--clear)
            CLEAR_API_LOG=true
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --tail-api-log, --tail    Tail the PingOne API log file after servers start"
            echo "  --clear-api-log, --clear Clear the PingOne API log file before tailing (requires --tail)"
            echo "  --help, -h                Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                       # Restart servers normally"
            echo "  $0 --tail-api-log        # Restart servers and tail PingOne API log"
            echo "  $0 --tail --clear        # Restart servers, clear API log, then tail it"
            exit 0
            ;;
        *)
            print_warning "Unknown option: $arg (use --help for usage)"
            ;;
    esac
done

# Main execution
main() {
    show_banner
    
    # Step 0: Find and change to project directory
    find_project_directory
    
    # Step 1: Check requirements
    check_requirements
    
    # Step 2: Kill all existing servers
    kill_all_servers
    
    # Step 3: Start backend (starts both HTTP and HTTPS servers)
    print_status "🔧 Starting servers..."
    start_backend
    
    # Step 4: Start frontend
    start_frontend
    
    # Step 5: Run health checks
    run_health_checks
    
    # Step 6: Show final status
    show_final_status
    
    # Step 7: Open browser if successful (DISABLED - user requested no auto-open)
    # open_browser
    
    # Step 8: Final success message and server status summary
    show_final_summary
    
    # Step 9: Tail PingOne API log if requested
    if [ "$TAIL_API_LOG" = true ]; then
        if [ "$OVERALL_STATUS" = "success" ] || [ "$OVERALL_STATUS" = "partial" ]; then
            echo ""
            print_info "📋 Tailing PingOne API log file (Ctrl+C to stop)..."
            echo ""
            
            # Clear log if requested via command line option, otherwise ask user
            if [ -f "logs/pingone-api.log" ]; then
                if [ "$CLEAR_API_LOG" = true ]; then
                    print_info "Clearing logs/pingone-api.log (--clear-api-log option specified)..."
                    > logs/pingone-api.log
                    print_success "Log file cleared"
                    echo ""
                else
                    echo -e "${YELLOW}The PingOne API log file exists.${NC}"
                    echo -n "Do you want to clear it before tailing? (y/N): "
                    read -r clear_log
                    if [ "$clear_log" = "y" ] || [ "$clear_log" = "Y" ]; then
                        print_info "Clearing logs/pingone-api.log..."
                        > logs/pingone-api.log
                        print_success "Log file cleared"
                        echo ""
                    fi
                fi
            else
                print_warning "PingOne API log file not found: logs/pingone-api.log"
                print_info "The file will be created when the first PingOne API call is made"
                print_info "Press Ctrl+C to exit"
                # Wait for file to be created, then tail it
                while [ ! -f "logs/pingone-api.log" ]; do
                    sleep 1
                done
            fi
            
            # Tail the log file (always tail, whether cleared or not)
            print_info "Starting to tail logs/pingone-api.log..."
            tail -f logs/pingone-api.log
        else
            print_warning "Servers did not start successfully. Skipping log tail."
        fi
    fi
    
    # Exit with appropriate code
    case "$OVERALL_STATUS" in
        "success")
            exit 0
            ;;
        "partial")
            exit 2
            ;;
        "failure")
            exit 1
            ;;
        *)
            exit 3
            ;;
    esac
}

# Handle Ctrl+C gracefully
cleanup() {
    echo ""
    print_info "Script interrupted by user"
    exit 130
}

trap cleanup SIGINT SIGTERM

# Run main function
main "$@"