#!/bin/bash

###############################################################################
# ⚠️ CRITICAL FILE - DO NOT DELETE OR MOVE ⚠️
# 
# This file stops all OAuth Playground servers (frontend and backend).
# It kills processes, cleans up PID files, and frees ports.
#
# PROTECTION:
# - This file MUST exist in the root directory
# - It is referenced in documentation and user workflows
# - Moving or deleting this file will break the stop process
# - Updates should be made to this file (it can be edited)
#
###############################################################################

# OAuth Playground - Server Stop Script
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

# Configuration - Fixed ports for OAuth Playground
# These ports are hardcoded to ensure consistency with OAuth redirect URIs
# and API endpoint configurations. Do not change these values.
FRONTEND_PORT=3000  # Vite dev server (HTTPS)
BACKEND_PORT=3001   # Express API server (HTTPS only)
ASSISTANT_PORT=3002  # Standalone AI Assistant (Vite)
MCP_INSPECTOR_PORT=6274  # MCP Inspector UI (modelcontextprotocol/inspector)
FRONTEND_URL="https://localhost:${FRONTEND_PORT}"
BACKEND_URL="https://localhost:${BACKEND_PORT}"

# PID files for process management
FRONTEND_PID_FILE=".frontend.pid"
BACKEND_PID_FILE=".backend.pid"
ASSISTANT_PID_FILE=".assistant.pid"
MCP_INSPECTOR_PID_FILE=".mcp-inspector.pid"
MCP_PID_FILE_REL="pingone-mcp-server/mcp-server.pid"

# Project root (resolved from this script's location) — used to scope pkill patterns
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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
    echo "║                    🛑 MasterFlow API Server Stop 🛑                          ║"
    echo "║                                                                              ║"
    echo "║  Frontend:      https://localhost:3000 (Vite Dev Server)                   ║"
    echo "║  Backend:       https://localhost:3001 (Express API Server)                ║"
    echo "║  AI Assistant:  https://localhost:3002 (Standalone Vite)                   ║"
    echo "║  MCP Inspector: http://localhost:6274  (MCP Inspector UI)                  ║"
    echo "║  MCP Server:    PingOne MCP Server                                          ║"
    echo "║                                                                              ║"
    echo "║  This script will:                                                          ║"
    echo "║  1. Kill all running servers (frontend, backend, assistant, MCP)           ║"
    echo "║  2. Clean up PID files                                                      ║"
    echo "║  3. Free all ports (3000, 3001, 3002, 6274)                                ║"
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
    
    # Kill by PID files first (use 1 s grace period, not 2 s, to keep shutdown snappy)
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing frontend process (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
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
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Kill AI Assistant by PID file
    if [ -f "$ASSISTANT_PID_FILE" ]; then
        local pid=$(cat "$ASSISTANT_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing AI Assistant process (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$ASSISTANT_PID_FILE"
    fi
    
    # Kill MCP server (PingOne) by PID file
    if [ -f "$MCP_PID_FILE_REL" ]; then
        local pid=$(cat "$MCP_PID_FILE_REL" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing MCP server (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$MCP_PID_FILE_REL"
    fi

    # Kill MCP Inspector by PID file
    if [ -f "$MCP_INSPECTOR_PID_FILE" ]; then
        local pid=$(cat "$MCP_INSPECTOR_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing MCP Inspector (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$MCP_INSPECTOR_PID_FILE"
    fi

    # Kill Memory MCP server by PID file
    if [ -f ".memory-mcp.pid" ]; then
        local pid=$(cat ".memory-mcp.pid" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing Memory MCP server (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f ".memory-mcp.pid"
    fi
    
    # Kill processes by port
    local frontend_pid=$(get_port_process $FRONTEND_PORT)
    local backend_pid=$(get_port_process $BACKEND_PORT)
    local assistant_pid=$(get_port_process $ASSISTANT_PORT)
    local mcp_inspector_pid=$(get_port_process $MCP_INSPECTOR_PORT)
    
    if [ -n "$frontend_pid" ]; then
        print_info "Killing process on port $FRONTEND_PORT (PID: $frontend_pid)"
        kill -9 "$frontend_pid" 2>/dev/null || true
    fi
    
    if [ -n "$backend_pid" ]; then
        print_info "Killing process on port $BACKEND_PORT (PID: $backend_pid)"
        kill -9 "$backend_pid" 2>/dev/null || true
    fi
    
    if [ -n "$assistant_pid" ]; then
        print_info "Killing process on port $ASSISTANT_PORT (PID: $assistant_pid)"
        kill -9 "$assistant_pid" 2>/dev/null || true
    fi
    
    if [ -n "$mcp_inspector_pid" ]; then
        print_info "Killing process on port $MCP_INSPECTOR_PORT (PID: $mcp_inspector_pid)"
        kill -9 "$mcp_inspector_pid" 2>/dev/null || true
    fi
    # Also kill inspector proxy port 6277
    lsof -ti:6277 | xargs kill -9 2>/dev/null || true
    
    # Kill any node processes that might be related to our project
    # Scope patterns to PROJECT_ROOT to avoid killing other projects on this machine
    print_info "Cleaning up any remaining Node.js processes..."
    pkill -f "${PROJECT_ROOT}.*vite" 2>/dev/null || true
    pkill -f "${PROJECT_ROOT}/server.js" 2>/dev/null || true
    pkill -f "${PROJECT_ROOT}/pingone-mcp-server" 2>/dev/null || true
    pkill -f "${PROJECT_ROOT}/memory-mcp-server" 2>/dev/null || true
    pkill -f "@modelcontextprotocol/inspector" 2>/dev/null || true
    # Fallback: catch processes that may not have full paths (e.g. spawned from npm run dev)
    pkill -f "masterflow-api" 2>/dev/null || true
    
    # Wait for processes to die — only as long as needed (max 2 s instead of fixed 3 s)
    local waited=0
    while [ $waited -lt 2 ]; do
        local still_running=false
        for p in $FRONTEND_PORT $BACKEND_PORT $ASSISTANT_PORT $MCP_INSPECTOR_PORT; do
            if check_port "$p" 2>/dev/null; then
                still_running=true
                break
            fi
        done
        [ "$still_running" = false ] && break
        sleep 1
        waited=$((waited + 1))
    done

    # Clear Vite dev cache so next restart starts clean and doesn't drag in stale memory
    print_info "Clearing Vite cache..."
    rm -rf node_modules/.vite 2>/dev/null || true
    rm -rf .vite 2>/dev/null || true
    print_success "Vite cache cleared"
    
    # Verify ports are free
    if check_port $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT still in use, force killing..."
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 0.5
    fi
    
    if check_port $BACKEND_PORT; then
        print_warning "Port $BACKEND_PORT still in use, force killing..."
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 0.5
    fi
    
    if check_port $ASSISTANT_PORT; then
        print_warning "Port $ASSISTANT_PORT still in use, force killing..."
        lsof -ti:$ASSISTANT_PORT | xargs kill -9 2>/dev/null || true
        sleep 0.5
    fi
    
    if check_port $MCP_INSPECTOR_PORT; then
        print_warning "Port $MCP_INSPECTOR_PORT still in use, force killing..."
        lsof -ti:$MCP_INSPECTOR_PORT | xargs kill -9 2>/dev/null || true
        sleep 0.5
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
            echo "  Stop all OAuth Playground dev servers (frontend + backend HTTPS),"
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
        print_warning "This doesn't appear to be the OAuth Playground directory"
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
    
    if check_port $ASSISTANT_PORT; then
        print_error "Port $ASSISTANT_PORT is still in use"
        all_free=false
    fi
    
    if check_port $MCP_INSPECTOR_PORT; then
        print_error "Port $MCP_INSPECTOR_PORT is still in use"
        all_free=false
    fi
    
    echo ""
    show_stop_summary "$all_free"
}

# Function to show final stop status banner (mirrors run.sh show_final_summary)
show_stop_summary() {
    local all_free="${1:-true}"

    # Determine banner color / status text
    local banner_color status_icon status_text
    if [ "$all_free" = true ]; then
        banner_color="${GREEN}"
        status_icon="🛑"
        status_text="ALL SYSTEMS STOPPED"
    else
        banner_color="${YELLOW}"
        status_icon="⚠️"
        status_text="STOP COMPLETE — SOME PORTS STILL IN USE"
    fi

    echo -e "${banner_color}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${banner_color}║                                                                              ║${NC}"
    echo -e "${banner_color}║                    ${status_icon}  OAUTH PLAYGROUND STATUS ${status_icon}                   ║${NC}"
    echo -e "${banner_color}║                                                                              ║${NC}"
    echo -e "${banner_color}║                          ${status_text}                          ║${NC}"
    echo -e "${banner_color}║                                                                              ║${NC}"
    echo -e "${banner_color}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"

    # Per-port status
    for entry in \
        "Frontend|${FRONTEND_PORT}|${FRONTEND_URL}" \
        "Backend|${BACKEND_PORT}|${BACKEND_URL}" \
        "AI Assistant|${ASSISTANT_PORT}|https://localhost:${ASSISTANT_PORT}" \
        "MCP Inspector|${MCP_INSPECTOR_PORT}|http://localhost:${MCP_INSPECTOR_PORT}"
    do
        local label port url
        label="${entry%%|*}"; rest="${entry#*|}"; port="${rest%%|*}"; url="${rest#*|}"
        echo -e "${banner_color}║${NC} ${BLUE}${label} (Port ${port}):${NC}"
        if check_port "$port" 2>/dev/null; then
            echo -e "${banner_color}║${NC}   ${YELLOW}⚠️  STILL RUNNING${NC} — ${url}"
        else
            echo -e "${banner_color}║${NC}   ${GREEN}✅ STOPPED — port ${port} is free${NC}"
        fi
        echo -e "${banner_color}║${NC}"
    done

    echo -e "${banner_color}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"

    if [ "$all_free" = true ]; then
        echo -e "${banner_color}║${NC} ${GREEN}🎉 SUCCESS: All servers stopped and all ports are free${NC}"
    else
        echo -e "${banner_color}║${NC} ${YELLOW}⚠️  Some ports may still be in use — kill manually if needed${NC}"
        echo -e "${banner_color}║${NC} ${YELLOW}   e.g.  lsof -ti:3000 | xargs kill -9${NC}"
    fi

    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}📋 Restart commands:${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./run.sh         - Restart servers (will prompt to tail logs)${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./run.sh -quick  - Restart servers (no prompts)${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./run.sh --help  - Show help message${NC}"
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}Modes:${NC}"
    echo -e "${banner_color}║${NC}   Masterflow only        →  ${YELLOW}./run.sh${NC}"
    echo -e "${banner_color}║${NC}   MCP server + Inspector →  ${YELLOW}./run.sh -mcp${NC}"
    echo -e "${banner_color}║${NC}   AI Assistant only      →  ${YELLOW}./run.sh -assistant${NC}"
    echo -e "${banner_color}║${NC}   Both together          →  ${YELLOW}./run.sh -both${NC}"
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
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

