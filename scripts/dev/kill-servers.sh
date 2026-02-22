#!/bin/bash

# MasterFlow API - Kill Servers Script
# Safely terminates all MasterFlow API servers
# Version: 1.0.0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration - Fixed ports for MasterFlow API
FRONTEND_PORT=3000
BACKEND_PORT=3001

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

# Function to display banner
show_banner() {
    echo -e "${RED}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                    🛑 MasterFlow API Server Killer 🛑                     ║"
    echo "║                                                                              ║"
    echo "║  Frontend: https://localhost:3000 (Vite Dev Server)                        ║"
    echo "║  Backend:  https://localhost:3001 (Express API Server)                     ║"
    echo "║                                                                              ║"
    echo "║  This script will safely terminate all MasterFlow API servers            ║"
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

# Function to get process info
get_process_info() {
    local pid=$1
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        ps -p "$pid" -o comm= 2>/dev/null || echo "unknown"
    else
        echo ""
    fi
}

# Function to kill process by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            local process_name=$(get_process_info "$pid")
            print_info "Killing $service_name (PID: $pid, Process: $process_name)"
            
            # Try graceful shutdown first
            kill "$pid" 2>/dev/null
            sleep 2
            
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "Force killing $service_name (PID: $pid)"
                kill -9 "$pid" 2>/dev/null || true
                sleep 1
            fi
            
            # Verify it's dead
            if kill -0 "$pid" 2>/dev/null; then
                print_error "Failed to kill $service_name (PID: $pid)"
                return 1
            else
                print_success "$service_name stopped (PID: $pid)"
            fi
        else
            print_info "$service_name PID file exists but process not running"
        fi
        rm -f "$pid_file"
    else
        print_info "No PID file found for $service_name"
    fi
    return 0
}

# Function to kill process by port
kill_by_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(get_port_process $port)
    if [ -n "$pid" ]; then
        local process_name=$(get_process_info "$pid")
        print_info "Killing $service_name on port $port (PID: $pid, Process: $process_name)"
        
        # Try graceful shutdown first
        kill "$pid" 2>/dev/null
        sleep 2
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "Force killing $service_name on port $port (PID: $pid)"
            kill -9 "$pid" 2>/dev/null || true
            sleep 1
        fi
        
        # Verify port is free
        if check_port $port; then
            print_error "Failed to free port $port"
            return 1
        else
            print_success "$service_name stopped (port $port freed)"
        fi
    else
        print_info "No process found on port $port"
    fi
    return 0
}

# Function to kill all MasterFlow API related processes
kill_all_servers() {
    print_status "🛑 Killing MasterFlow API servers..."
    
    local killed_any=false
    
    # Kill by PID files first
    print_info "Checking PID files..."
    if kill_by_pid_file "$FRONTEND_PID_FILE" "Frontend"; then
        killed_any=true
    fi
    
    if kill_by_pid_file "$BACKEND_PID_FILE" "Backend"; then
        killed_any=true
    fi
    
    # Kill by ports
    print_info "Checking ports..."
    if check_port $FRONTEND_PORT; then
        if kill_by_port $FRONTEND_PORT "Frontend"; then
            killed_any=true
        fi
    else
        print_info "Port $FRONTEND_PORT is already free"
    fi
    
    if check_port $BACKEND_PORT; then
        if kill_by_port $BACKEND_PORT "Backend"; then
            killed_any=true
        fi
    else
        print_info "Port $BACKEND_PORT is already free"
    fi
    
    # Kill any remaining Node.js processes that might be related
    print_info "Cleaning up related processes..."
    local vite_pids=$(pgrep -f "vite" 2>/dev/null || true)
    local server_pids=$(pgrep -f "server.js" 2>/dev/null || true)
    local oauth_pids=$(pgrep -f "oauth-playground" 2>/dev/null || true)
    
    if [ -n "$vite_pids" ]; then
        print_info "Killing Vite processes: $vite_pids"
        echo "$vite_pids" | xargs kill -9 2>/dev/null || true
        killed_any=true
    fi
    
    if [ -n "$server_pids" ]; then
        print_info "Killing server.js processes: $server_pids"
        echo "$server_pids" | xargs kill -9 2>/dev/null || true
        killed_any=true
    fi
    
    if [ -n "$oauth_pids" ]; then
        print_info "Killing oauth-playground processes: $oauth_pids"
        echo "$oauth_pids" | xargs kill -9 2>/dev/null || true
        killed_any=true
    fi
    
    # Final verification
    sleep 2
    local frontend_still_running=false
    local backend_still_running=false
    
    if check_port $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT still in use after cleanup"
        frontend_still_running=true
    fi
    
    if check_port $BACKEND_PORT; then
        print_warning "Port $BACKEND_PORT still in use after cleanup"
        backend_still_running=true
    fi
    
    return 0
}

# Function to show final status
show_final_status() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                           🎯 SERVER KILL COMPLETE 🎯                        ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    print_status "📋 Final Server Status:"
    echo ""
    
    # Check final status
    echo -e "   ${BLUE}Frontend Server (Port $FRONTEND_PORT):${NC}"
    if check_port $FRONTEND_PORT; then
        local pid=$(get_port_process $FRONTEND_PORT)
        local process_name=$(get_process_info "$pid")
        echo -e "   └─ ${RED}❌ STILL RUNNING${NC} - PID: $pid ($process_name)"
    else
        echo -e "   └─ ${GREEN}✅ STOPPED${NC} - Port is free"
    fi
    
    echo -e "   ${BLUE}Backend Server (Port $BACKEND_PORT):${NC}"
    if check_port $BACKEND_PORT; then
        local pid=$(get_port_process $BACKEND_PORT)
        local process_name=$(get_process_info "$pid")
        echo -e "   └─ ${RED}❌ STILL RUNNING${NC} - PID: $pid ($process_name)"
    else
        echo -e "   └─ ${GREEN}✅ STOPPED${NC} - Port is free"
    fi
    
    echo ""
    
    # Overall status
    if ! check_port $FRONTEND_PORT && ! check_port $BACKEND_PORT; then
        echo -e "${GREEN}🎉 SUCCESS: All MasterFlow API servers stopped!${NC}"
        echo -e "${GREEN}✅ Both ports are now free${NC}"
        echo -e "${GREEN}✅ Ready for restart or other applications${NC}"
    elif check_port $FRONTEND_PORT || check_port $BACKEND_PORT; then
        echo -e "${YELLOW}⚠️  PARTIAL SUCCESS: Some processes may still be running${NC}"
        echo -e "${YELLOW}🔍 You may need to manually kill remaining processes${NC}"
        if check_port $FRONTEND_PORT; then
            local pid=$(get_port_process $FRONTEND_PORT)
            echo -e "${YELLOW}   Frontend still on port $FRONTEND_PORT (PID: $pid)${NC}"
        fi
        if check_port $BACKEND_PORT; then
            local pid=$(get_port_process $BACKEND_PORT)
            echo -e "${YELLOW}   Backend still on port $BACKEND_PORT (PID: $pid)${NC}"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}🔄 To restart servers: ./run.sh${NC}"
    echo -e "${CYAN}🔍 To check what's using ports: lsof -i :3000 -i :3001${NC}"
    echo ""
}

# Main execution
main() {
    show_banner
    kill_all_servers
    show_final_status
    
    # Exit with appropriate code
    if ! check_port $FRONTEND_PORT && ! check_port $BACKEND_PORT; then
        exit 0  # Success
    else
        exit 1  # Some processes still running
    fi
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