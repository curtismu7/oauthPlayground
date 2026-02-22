#!/bin/bash

###############################################################################
# ⚠️ CRITICAL FILE - DO NOT DELETE OR MOVE ⚠️
# 
# This file stops all MasterFlow API servers (frontend and backend).
# It kills processes, cleans up PID files, and frees ports.
#
# PROTECTION:
# - This file MUST exist in the root directory
# - It is referenced in documentation and user workflows
# - Moving or deleting this file will break the stop process
# - Updates should be made to this file (it can be edited)
#
###############################################################################

# MasterFlow API - Server Stop Script
# Kills all servers, cleans up PID files, and frees ports
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
# These ports are hardcoded to ensure consistency with OAuth redirect URIs
# and API endpoint configurations. Do not change these values.
FRONTEND_PORT=3000  # Vite dev server (HTTPS)
BACKEND_PORT=3001   # Express API server (HTTPS only)
FRONTEND_URL="https://localhost:${FRONTEND_PORT}"
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

# Function to display banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                    🛑 MasterFlow API Server Stop 🛑                        ║"
    echo "║                                                                              ║"
    echo "║  Frontend: https://localhost:3000 (Vite Dev Server)                        ║"
    echo "║  Backend:  https://localhost:3001 (Express API Server - HTTPS)              ║"
    echo "║                                                                              ║"
    echo "║  This script will:                                                          ║"
    echo "║  1. Kill all running servers (frontend and backend)                        ║"
    echo "║  2. Clean up PID files                                                     ║"
    echo "║  3. Free ports 3000 and 3001                                              ║"
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

# Function to kill all MasterFlow API related processes
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
    local backend_pid=$(get_port_process $BACKEND_PORT)
    
    if [ -n "$frontend_pid" ]; then
        print_info "Killing process on port $FRONTEND_PORT (PID: $frontend_pid)"
        kill -9 "$frontend_pid" 2>/dev/null || true
    fi
    
    if [ -n "$backend_pid" ]; then
        print_info "Killing process on port $BACKEND_PORT (PID: $backend_pid)"
        kill -9 "$backend_pid" 2>/dev/null || true
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
    
    if check_port $BACKEND_PORT; then
        print_warning "Port $BACKEND_PORT still in use, force killing..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    print_success "All servers killed successfully"
}

# Parse command line arguments
while [ $# -gt 0 ]; do
    case "$1" in
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Purpose:"
            echo "  Stop all MasterFlow API dev servers (frontend + backend HTTPS),"
            echo "  clean up PID files, and free ports 3000 and 3001."
            echo ""
            echo "Servers and ports:"
            echo "  Frontend: https://localhost:${FRONTEND_PORT}    (Vite dev server)"
            echo "  Backend:  https://localhost:${BACKEND_PORT}  (Express API - HTTPS)"
            echo ""
            echo "Options:"
            echo "  --help, -h"
            echo "      Show this help message and exit."
            echo ""
            echo "What this script does:"
            echo "  1) Kill processes by PID files (.frontend.pid, .backend.pid)"
            echo "  2) Kill processes using ports ${FRONTEND_PORT} and ${BACKEND_PORT}"
            echo "  3) Kill any related Node.js processes (vite, server.js, oauth-playground)"
            echo "  4) Clean up PID files"
            echo "  5) Verify all ports are free"
            echo ""
            echo "Exit codes:"
            echo "  0   Success (all servers stopped and ports free)"
            echo "  130 Interrupted (Ctrl+C)"
            echo ""
            echo "Examples:"
            echo "  $0"
            echo "  $0 --help"
            echo "  $0 -h"
            exit 0
            ;;

        *)
            print_warning "Unknown option: $1 (use --help for usage)"
            shift
            ;;
    esac
done

# Main execution
main() {
    show_banner
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
        print_warning "This doesn't appear to be the MasterFlow API directory"
        print_info "Current directory: $(pwd)"
        echo ""
        echo -n "Continue anyway? (y/N): "
        read -r confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            print_info "Aborted by user"
            exit 0
        fi
    fi
    
    # Stop all servers
    kill_all_servers
    
    # Final verification
    local all_free=true
    if check_port $FRONTEND_PORT; then
        print_error "Port $FRONTEND_PORT is still in use"
        all_free=false
    fi
    
    if check_port $BACKEND_PORT; then
        print_error "Port $BACKEND_PORT is still in use"
        all_free=false
    fi
    
    echo ""
    if [ "$all_free" = true ]; then
        print_success "✅ All servers have been stopped and ports are free"
    else
        print_warning "⚠️  Some ports may still be in use. You may need to manually kill processes."
    fi
    print_info "You can now run ./run.sh to start them again"
    echo ""
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

