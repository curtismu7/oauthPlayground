#!/bin/bash

###############################################################################
# ⚠️ CRITICAL FILE - DO NOT DELETE OR MOVE ⚠️
# 
# This file is the primary entry point for starting the OAuth Playground application.
# It contains comprehensive startup logic including lockdown verification, health checks,
# status reports, and log tailing.
#
# PROTECTION:
# - This file MUST exist in the root directory
# - It is referenced in documentation and user workflows
# - Moving or deleting this file will break the startup process
# - Updates should be made to this file (it can be edited)
#
###############################################################################

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
# Custom domain and certs are loaded from config/run-config.db (see load_ssl_config); default below.
# App starts on https://<domain>:3000 (ensure domain resolves to this host, e.g. /etc/hosts).
FRONTEND_PORT=3000  # Vite dev server (HTTPS)
BACKEND_PORT=3001   # Express API server (HTTPS only)
FRONTEND_HOST="${FRONTEND_HOST:-api.pingdemo.com}"
BACKEND_HOST="${BACKEND_HOST:-api.pingdemo.com}"
FRONTEND_URL="https://${FRONTEND_HOST}:${FRONTEND_PORT}"
BACKEND_URL="https://${BACKEND_HOST}:${BACKEND_PORT}"
# SSL cert paths (set by load_ssl_config from run-config-ssl.js; backend uses these if set)
SSL_CERT_PATH="${SSL_CERT_PATH:-}"
SSL_KEY_PATH="${SSL_KEY_PATH:-}"

ASSISTANT_PORT=3002  # Standalone AI Assistant (Vite)
MCP_INSPECTOR_PORT=6274  # MCP Inspector UI (modelcontextprotocol/inspector)
MCP_SERVER_DIR_REL="pingone-mcp-server"  # Relative to project root

# PID files for process management
FRONTEND_PID_FILE=".frontend.pid"
BACKEND_PID_FILE=".backend.pid"
ASSISTANT_PID_FILE=".assistant.pid"
MCP_INSPECTOR_PID_FILE=".mcp-inspector.pid"
MCP_PID_FILE_REL="pingone-mcp-server/mcp-server.pid"

# Status tracking
FRONTEND_STATUS="unknown"
BACKEND_STATUS="unknown"
OVERALL_STATUS="unknown"

# Function to find and change to the OAuth Playground directory
find_project_directory() {
    # If in quick mode, assume current directory is correct
    if [ "$QUICK_MODE" = true ]; then
        if [ -f "package.json" ] && [ -f "server.js" ]; then
            print_success "Quick mode: Using current directory: $(pwd)"
            return 0
        else
            print_error "Quick mode: Not in OAuth Playground directory (missing package.json or server.js)"
            exit 1
        fi
    fi
    
    print_status "🔍 Locating OAuth Playground project directory..."
    
    # Check if we're already in the right directory
    if [ -f "package.json" ] && [ -f "server.js" ] && (grep -q "masterflow-api" package.json 2>/dev/null || grep -q "oauth-playground" package.json 2>/dev/null); then
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
            
            if [ -f "package.json" ] && [ -f "server.js" ] && (grep -q "masterflow-api" package.json 2>/dev/null || grep -q "oauth-playground" package.json 2>/dev/null); then
                print_success "Found OAuth Playground at: $(pwd)"
                return 0
            fi
        fi
    done
    
    # If not found and not in quick mode, ask user for path
    if [ "$QUICK_MODE" != true ]; then
        print_warning "OAuth Playground directory not found in common locations."
        echo ""
        echo -e "${YELLOW}Please provide the path to your OAuth Playground directory:${NC}"
        echo -e "${CYAN}(The directory should contain package.json and server.js files)${NC}"
        echo ""
        
        while true; do
            # Skip directory selection prompt in default mode
            if [ "$DEFAULT_MODE" = true ]; then
                print_info "Default mode: Using current directory"
                break
            fi
            
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
                if [ "$QUICK_MODE" = true ]; then
                    print_info "Quick mode: Continuing anyway"
                elif [ "$DEFAULT_MODE" = true ]; then
                    print_info "Default mode: Continuing anyway (auto-accept)"
                else
                    echo -n "Continue anyway? (y/N): "
                    read -r confirm
                    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                        continue
                    fi
                fi
            fi
            
            print_success "Using directory: $(pwd)"
            return 0
        done
    else
        print_error "Quick mode: OAuth Playground directory not found"
        exit 1
    fi
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
    echo "║                    🔄 OAuth Playground Server Restart 🔄                     ║"
    echo "║                                                                              ║"
    echo "║  Frontend: https://localhost:3000 (Vite Dev Server)                          ║"
    echo "║  Backend:  https://localhost:3001 (Express API Server - HTTPS only)          ║"
    echo "║                                                                              ║"
    echo "║  This script will:                                                           ║"
    echo "║  1. Find and change to OAuth Playground directory                            ║"
    echo "║  2. Kill all existing servers                                                 ║"
    echo "║  3. Clean up processes and ports 3000 & 3001                                 ║"
    echo "║  4. Clear Vite cache and build artifacts                                    ║"
    echo "║  5. Restart frontend and backend servers                                   ║"
    echo "║  6. Check for errors and report status                                    ║"
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
    local backend_pid=$(get_port_process $BACKEND_PORT)
    
    if [ -n "$frontend_pid" ]; then
        print_info "Killing process on port $FRONTEND_PORT (PID: $frontend_pid)"
        kill -9 "$frontend_pid" 2>/dev/null || true
    fi
    
    if [ -n "$backend_pid" ]; then
        print_info "Killing process on port $BACKEND_PORT (PID: $backend_pid)"
        kill -9 "$backend_pid" 2>/dev/null || true
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

    # Kill MCP Inspector by PID file or port
    if [ -f "$MCP_INSPECTOR_PID_FILE" ]; then
        local pid=$(cat "$MCP_INSPECTOR_PID_FILE" 2>/dev/null)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            print_info "Killing MCP Inspector (PID: $pid)"
            kill "$pid" 2>/dev/null || true
        fi
        rm -f "$MCP_INSPECTOR_PID_FILE"
    fi
    if check_port $MCP_INSPECTOR_PORT 2>/dev/null; then
        lsof -ti:$MCP_INSPECTOR_PORT | xargs kill -9 2>/dev/null || true
    fi

    # Kill any node processes that might be related to our project
    print_info "Cleaning up any remaining Node.js processes..."
    pkill -f "vite" 2>/dev/null || true
    pkill -f "server.js" 2>/dev/null || true
    pkill -f "oauth-playground" 2>/dev/null || true
    pkill -f "@modelcontextprotocol/inspector" 2>/dev/null || true
    
    # Clear Vite cache and node_modules to ensure clean restart
    print_info "Clearing Vite cache and dependencies..."
    rm -rf node_modules/.vite 2>/dev/null || true
    rm -rf .vite 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    print_success "Vite cache cleared"
    
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
    
    # Check SQLite3
    if ! command -v sqlite3 &> /dev/null; then
        print_warning "sqlite3 not installed - database operations may not work"
    else
        print_success "sqlite3 ✓"
    fi
    
    if [ "$requirements_ok" = false ]; then
        print_error "System requirements not met. Please fix the above issues."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Load custom domain and SSL cert paths from SQLite (config/run-config.db); optionally prompt to change domain.
# Sets FRONTEND_HOST, BACKEND_HOST, SSL_CERT_PATH, SSL_KEY_PATH and recomputes FRONTEND_URL, BACKEND_URL.
load_ssl_config() {
    print_status "🔐 Loading custom domain and SSL certificate config..."
    local prompt_flag=""
    [ "${CHANGE_DOMAIN:-false}" = true ] && prompt_flag="--prompt"
    local run_ssl_output
    run_ssl_output=$(node scripts/development/run-config-ssl.js $prompt_flag) || true
    if [ -n "$run_ssl_output" ]; then
        eval "$run_ssl_output"
        FRONTEND_URL="https://${FRONTEND_HOST}:${FRONTEND_PORT}"
        BACKEND_URL="https://${BACKEND_HOST}:${BACKEND_PORT}"
        export FRONTEND_HOST BACKEND_HOST SSL_CERT_PATH SSL_KEY_PATH
        print_success "Domain: ${FRONTEND_HOST:-api.pingdemo.com}"
    else
        print_warning "Could not load SSL config; using default domain ${FRONTEND_HOST:-api.pingdemo.com}"
    fi
}

# Ask user if the script should add/update the hosts file so the custom domain resolves to 127.0.0.1.
# Skips in -quick/-default; on macOS/Linux uses /etc/hosts (requires sudo to write).
ask_and_update_hosts_file() {
    [ "$QUICK_MODE" = true ] && return 0
    [ "$DEFAULT_MODE" = true ] && return 0

    local domain="${FRONTEND_HOST:-api.pingdemo.com}"
    local hosts_file=""

    case "$(uname -s)" in
        Darwin|Linux)
            hosts_file="/etc/hosts"
            ;;
        *)
            print_info "Hosts file update is supported on macOS/Linux only. Add manually: 127.0.0.1 $domain"
            return 0
            ;;
    esac

    if [ ! -r "$hosts_file" ]; then
        print_warning "Cannot read $hosts_file; add manually: 127.0.0.1 $domain"
        return 0
    fi

    if grep -qF "127.0.0.1 $domain" "$hosts_file" 2>/dev/null; then
        print_success "Hosts file already has 127.0.0.1 $domain"
        return 0
    fi

    echo ""
    echo -n "Add/update hosts file so ${domain} resolves to 127.0.0.1? (y/N): "
    read -r reply
    if [ -z "$reply" ] || [ "$reply" != "y" ] && [ "$reply" != "Y" ]; then
        print_info "Skipping hosts file. Add manually if needed: 127.0.0.1 $domain"
        return 0
    fi

    print_status "Adding 127.0.0.1 $domain to $hosts_file (may prompt for password)..."
    if sudo sh -c "echo '127.0.0.1 $domain' >> $hosts_file" 2>/dev/null; then
        print_success "Hosts file updated. $domain now resolves to 127.0.0.1"
    else
        print_warning "Could not write to $hosts_file (sudo failed or denied). Add manually:"
        echo -e "   ${CYAN}echo '127.0.0.1 $domain' | sudo tee -a $hosts_file${NC}"
    fi
}

# Check SQLite database schema
check_sqlite_database() {
    local db_file="src/server/data/users.db"
    
    if [ ! -f "$db_file" ]; then
        print_info "Database file not found - will be created on first run"
        return 0
    fi
    
    # Check if sqlite3 is available
    if ! command -v sqlite3 &> /dev/null; then
        print_warning "sqlite3 not available - skipping database schema check"
        return 0
    fi
    
    print_status "🔍 Checking SQLite database schema..."
    
    # Check if the users table has the required columns
    local schema_check=$(sqlite3 "$db_file" "PRAGMA table_info(users);" 2>/dev/null)
    
    if [ -z "$schema_check" ]; then
        print_warning "Could not read database schema - database may be corrupted"
        if [ "$DEFAULT_MODE" = true ]; then
            print_info "Default mode: Auto-deleting and recreating database"
            rm -f "$db_file" "${db_file}-shm" "${db_file}-wal"
            print_success "Database deleted - will be recreated on startup"
        else
            echo -n "Delete and recreate database? (y/N): "
            read -r delete_db
            if [ "$delete_db" = "y" ] || [ "$delete_db" = "Y" ]; then
                rm -f "$db_file" "${db_file}-shm" "${db_file}-wal"
                print_success "Database deleted - will be recreated on startup"
            fi
        fi
        return 0
    fi
    
    # Check for required columns
    local has_user_type=$(echo "$schema_check" | grep -c "user_type")
    local has_updated_at=$(echo "$schema_check" | grep -c "updated_at")
    
    if [ "$has_user_type" -eq 0 ] || [ "$has_updated_at" -eq 0 ]; then
        print_warning "Database schema is outdated (missing required columns)"
        if [ "$DEFAULT_MODE" = true ]; then
            print_info "Default mode: Auto-deleting and recreating database with correct schema"
            rm -f "$db_file" "${db_file}-shm" "${db_file}-wal"
            print_success "Database deleted - will be recreated with correct schema"
        else
            echo -n "Delete and recreate database? (Y/n): "
            read -r delete_db
            if [ -z "$delete_db" ] || [ "$delete_db" = "y" ] || [ "$delete_db" = "Y" ]; then
                rm -f "$db_file" "${db_file}-shm" "${db_file}-wal"
                print_success "Database deleted - will be recreated with correct schema"
            else
                print_warning "Continuing with old schema - sync operations may fail"
            fi
        fi
    else
        print_success "Database schema is up to date"
    fi
}

verify_sms_lockdown() {
    verify_lockdown_generic \
        "SMS" \
        "src/v8/lockdown/sms/manifest.json" \
        "verify:sms-lockdown" \
        "sms:lockdown:approve" \
        "src/v8/lockdown/sms/snapshot"
}

verify_lockdown_generic() {
    # Generic soft-lock verifier used for SMS/FIDO2/EMAIL/WHATSAPP.
    # Params:
    #  1) NAME (display)
    #  2) manifest path
    #  3) npm verify script name (e.g. verify:sms-lockdown)
    #  4) npm approve script name (e.g. sms:lockdown:approve)
    #  5) snapshot dir
    local name="$1"
    local manifest_path="$2"
    local verify_script="$3"
    local approve_script="$4"
    local snapshot_dir="$5"

    if [ ! -f "$manifest_path" ]; then
        print_warning "${name} lockdown manifest not found. Skipping ${name} lockdown check."
        return 0
    fi

    print_status "🔒 Verifying ${name} lockdown integrity (${verify_script})..."
    set +e
    npm run -s "$verify_script"
    local verify_exit=$?
    set -e

    if [ "$verify_exit" -eq 0 ]; then
        print_success "${name} lockdown verification passed"
        return 0
    fi

    print_error "${name} lockdown verification FAILED. ${name}-critical files drifted."
    echo ""
    echo -e "${RED}To prevent ${name} regressions, server restart is blocked.${NC}"
    echo ""
    echo -e "${CYAN}Choose an action:${NC}"
    echo -e "${CYAN}  1) Restore ${name} locked files from snapshot (recommended)${NC}"
    echo -e "${CYAN}  2) Approve current ${name} changes (updates snapshot + manifest)${NC}"
    echo -e "${CYAN}  3) Abort restart (default)${NC}"
    echo -e "${CYAN}  4) Continue anyway (unsafe)${NC}"
    echo ""
    
    if [ "$DEFAULT_MODE" = true ]; then
        print_info "Default mode: Auto-choosing option 1 (restore from snapshot)"
        choice="1"
    else
        echo -n "Enter choice [1/2/3/4]: "
        read -r choice
    fi

    if [ "$choice" = "1" ]; then
        print_status "🛠️ Restoring ${name} locked files from snapshot..."

        # Read manifest paths via Node (no jq dependency).
        local paths
        paths=$(node --input-type=module - <<NODE
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync('${manifest_path}', 'utf8'));
for (const f of manifest.files || []) console.log(f.path);
NODE
)

        while IFS= read -r p; do
            [ -z "$p" ] && continue
            local base
            base="$(basename "$p")"
            local snap="${snapshot_dir}/${base}"
            if [ ! -f "$snap" ]; then
                print_error "Snapshot file missing: $snap"
                exit 1
            fi
            mkdir -p "$(dirname "$p")"
            cp "$snap" "$p"
        done <<< "$paths"

        print_status "🔁 Re-running ${name} lockdown verification..."
        set +e
        npm run -s "$verify_script"
        verify_exit=$?
        set -e

        if [ "$verify_exit" -ne 0 ]; then
            print_error "${name} lockdown still failing after restore. Aborting restart."
            exit 1
        fi

        print_success "${name} lockdown restored successfully. Continuing restart."
        return 0
    fi

    if [ "$choice" = "2" ]; then
        if npm run -s "$approve_script"; then
            print_status "🔁 Re-running ${name} lockdown verification..."
            set +e
            npm run -s "$verify_script"
            verify_exit=$?
            set -e

            if [ "$verify_exit" -ne 0 ]; then
                print_error "${name} lockdown still failing after approve. Aborting restart."
                exit 1
            fi

            print_success "${name} lockdown approved successfully. Continuing restart."
            return 0
        fi

        print_error "Approve failed. Aborting restart."
        exit 1
    fi

    if [ "$choice" = "4" ]; then
        print_warning "Continuing restart despite ${name} lockdown drift (unsafe)."
        return 0
    fi

    print_error "Aborting restart due to ${name} lockdown drift."
    exit 1
}

verify_fido2_lockdown() {
    verify_lockdown_generic \
        "FIDO2" \
        "src/v8/lockdown/fido2/manifest.json" \
        "verify:fido2-lockdown" \
        "fido2:lockdown:approve" \
        "src/v8/lockdown/fido2/snapshot"
}

verify_email_lockdown() {
    verify_lockdown_generic \
        "EMAIL" \
        "src/v8/lockdown/email/manifest.json" \
        "verify:email-lockdown" \
        "email:lockdown:approve" \
        "src/v8/lockdown/email/snapshot"
}

verify_whatsapp_lockdown() {
    verify_lockdown_generic \
        "WHATSAPP" \
        "src/v8/lockdown/whatsapp/manifest.json" \
        "verify:whatsapp-lockdown" \
        "whatsapp:lockdown:approve" \
        "src/v8/lockdown/whatsapp/snapshot"
}

# Ensure sqlite3 native bindings exist (pnpm often skips build scripts)
ensure_sqlite3_bindings() {
    local binding_path="node_modules/sqlite3/build/Release/node_sqlite3.node"
    if [ ! -f "$binding_path" ]; then
        print_warning "sqlite3 native bindings not found; building..."
        if pnpm run rebuild:sqlite3 2>/dev/null; then
            print_success "sqlite3 bindings built successfully"
        else
            print_warning "sqlite3 rebuild failed - backend may fall back to defaults (see backend.log)"
        fi
    fi
}

# Function to start backend server
start_backend() {
    print_status "🚀 Starting backend server..."
    ensure_sqlite3_bindings

    # Verify port is free
    if check_port $BACKEND_PORT; then
        print_error "Port $BACKEND_PORT is still in use after cleanup"
        BACKEND_STATUS="failed"
        return 1
    fi
    
    # Start backend server (HTTPS only)
    print_info "Starting backend server on port $BACKEND_PORT (HTTPS)..."
    BACKEND_PORT=3001 node server.js > backend.log 2>&1 &
    local backend_pid=$!
    echo $backend_pid > "$BACKEND_PID_FILE"
    
    print_info "Backend started with PID: $backend_pid"
    
    # Wait for backend to start
    local max_attempts=30
    local attempt=0
    local server_ready=false
    
    print_info "Waiting for backend server to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        # Check backend server
        if [ "$server_ready" = false ] && curl -s -k "$BACKEND_URL/api/health" >/dev/null 2>&1; then
            print_success "Backend server started successfully on $BACKEND_URL"
            server_ready=true
            BACKEND_STATUS="running"
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$backend_pid" 2>/dev/null; then
            print_error "Backend process died during startup"
            print_error "Check backend.log for details:"
            tail -10 backend.log 2>/dev/null || echo "No log file found"
            BACKEND_STATUS="failed"
            return 1
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    
    echo ""
    
    # Check final status
    if [ "$server_ready" = false ]; then
        print_error "Backend server failed to start within 30 seconds"
        BACKEND_STATUS="failed"
    fi
    
    print_error "Backend process status: $(kill -0 "$backend_pid" 2>/dev/null && echo "running" || echo "dead")"
    print_error "Check backend.log for details:"
    tail -10 backend.log 2>/dev/null || echo "No log file found"
    
    return 1
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
    
    # Clear all caches before starting Vite for clean restart
    print_info "Performing comprehensive cache cleanup before starting Vite..."
    rm -rf node_modules/.vite 2>/dev/null || true
    rm -rf .vite 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    rm -rf .vite-cache 2>/dev/null || true
    find node_modules -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    print_success "All caches cleared for clean Vite restart"
    
    # Start frontend server (listen on all interfaces so https://api.pingdemo.com:3000 works)
    print_info "Starting frontend on $FRONTEND_URL..."
    export VITE_HMR_HOST="$FRONTEND_HOST"
    export VITE_PUBLIC_APP_URL="https://${FRONTEND_HOST}:3000"
    npm run dev -- --host > frontend.log 2>&1 &
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
    
    # Backend health check
    if [ "$BACKEND_STATUS" = "running" ]; then
        if curl -s -k "$BACKEND_URL/api/health" | grep -q '"status":"ok"'; then
            print_success "Backend health check passed"
        else
            print_error "Backend health check failed"
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
    if check_port $BACKEND_PORT; then
        print_success "Backend port $BACKEND_PORT is active"
    else
        print_error "Backend port $BACKEND_PORT is not active"
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
    
    # Backend status
    echo -e "${CYAN}║${NC} Backend Server (HTTPS):"
    if [ "$BACKEND_STATUS" = "running" ]; then
        echo -e "${CYAN}║${NC}   Status: ${GREEN}✅ RUNNING${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${BLUE}$BACKEND_URL${NC}"
        echo -e "${CYAN}║${NC}   Health: ${GREEN}✅ HEALTHY${NC}"
    elif [ "$BACKEND_STATUS" = "failed" ]; then
        echo -e "${CYAN}║${NC}   Status: ${RED}❌ FAILED${NC}"
        echo -e "${CYAN}║${NC}   URL:    ${RED}$BACKEND_URL (not accessible)${NC}"
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
    if [ "$BACKEND_STATUS" = "running" ] && [ "$FRONTEND_STATUS" = "running" ]; then
        OVERALL_STATUS="success"
        echo -e "${CYAN}║${NC} Overall Status: ${GREEN}🎉 ALL SERVERS RUNNING SUCCESSFULLY${NC}"
        echo -e "${CYAN}║${NC}"
        echo -e "${CYAN}║${NC} ${GREEN}✅ OAuth Playground is ready to use!${NC}"
        echo -e "${CYAN}║${NC} ${GREEN}✅ Open your browser and navigate to: $FRONTEND_URL${NC}"
    elif [ "$BACKEND_STATUS" = "running" ] || [ "$FRONTEND_STATUS" = "running" ]; then
        OVERALL_STATUS="partial"
        echo -e "${CYAN}║${NC} Overall Status: ${YELLOW}⚠️  PARTIAL SUCCESS${NC}"
        echo -e "${CYAN}║${NC}"
        if [ "$BACKEND_STATUS" = "running" ]; then
            echo -e "${CYAN}║${NC} ${GREEN}✅ Backend is running${NC}"
        else
            echo -e "${CYAN}║${NC} ${RED}❌ Backend failed to start${NC}"
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
    echo -e "${CYAN}║${NC}   PingOne API:    ${GREEN}logs/pingone-api.log${NC} (all PingOne API calls)"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to show final summary message with status banner
show_final_summary() {
    echo ""
    
    # Check current server status
    local frontend_running=false
    local backend_running=false
    local frontend_healthy=false
    local backend_healthy=false
    
    # Backend status check
    if check_port $BACKEND_PORT; then
        backend_running=true
        if curl -s -k "$BACKEND_URL/api/health" >/dev/null 2>&1; then
            backend_healthy=true
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
    
    if [ "$backend_running" = true ] && [ "$frontend_running" = true ] && [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ]; then
        banner_color="${GREEN}"
        status_icon="🎉"
        status_text="ALL SYSTEMS OPERATIONAL"
        OVERALL_STATUS="success"
    elif [ "$backend_running" = true ] || [ "$frontend_running" = true ]; then
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
    
    # Backend status in banner
    echo -e "${banner_color}║${NC} ${BLUE}Backend Server (Port $BACKEND_PORT):${NC}"
    if [ "$backend_running" = true ] && [ "$backend_healthy" = true ]; then
        echo -e "${banner_color}║${NC}   ${GREEN}✅ RUNNING and HEALTHY${NC} - $BACKEND_URL"
    elif [ "$backend_running" = true ]; then
        echo -e "${banner_color}║${NC}   ${YELLOW}⚠️  RUNNING but UNHEALTHY${NC} - $BACKEND_URL"
    else
        echo -e "${banner_color}║${NC}   ${RED}❌ NOT RUNNING${NC} - $BACKEND_URL"
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
            echo -e "${banner_color}║${NC} ${GREEN}🔧 Backend API available at: $BACKEND_URL${NC}"
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
    echo -e "${banner_color}║${NC} ${CYAN}📝 Log files:${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   - logs/server.log (server logs)${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   - logs/pingone-api.log (all PingOne API calls - proxy and direct)${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   - logs/real-api.log (direct PingOne API calls only - no proxy)${NC}"
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}📌 Quick tail commands (copy/paste):${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   tail -f backend.log   tail -f frontend.log   tail -f logs/server.log${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   tail -f logs/pingone-api.log   tail -n 200 logs/pingone-api.log${NC}"
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}📋 Usage:${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./run.sh - Restart servers (will prompt to tail logs)${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./run.sh -quick - Restart servers (no prompts)${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   ./run.sh --help - Show help message${NC}"
    echo -e "${banner_color}║${NC}"
    echo -e "${banner_color}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Parse command line arguments
while [ $# -gt 0 ]; do
    case "$1" in
        --help|-h|-help)
            echo "╔══════════════════════════════════════════════════════════════════════════════╗"
            echo "║                    🔄 OAuth Playground Server Restart 🔄                    ║"
            echo "║                      Comprehensive Development Server Manager                    ║"
            echo "╚══════════════════════════════════════════════════════════════════════════════╝"
            echo ""
            echo "📋 OVERVIEW:"
            echo "  This is the primary server management script for the OAuth Playground application."
            echo "  It handles the complete lifecycle of development servers including startup, health"
            echo "  monitoring, and log management. The script ensures all services are properly"
            echo "  configured and running before allowing the development environment to be used."
            echo ""
            echo "🏗️  WHAT THIS SCRIPT DOES:"
            echo "  • Manages two core services: Frontend (Vite), Backend (HTTPS)"
            echo "  • Performs comprehensive system and requirement validation"
            echo "  • Enforces lockdown integrity to prevent regressions"
            echo "  • Handles graceful server shutdown and cleanup"
            echo "  • Runs health checks to verify service availability"
            echo "  • Provides detailed status reporting and log management"
            echo "  • Supports multiple operation modes for different use cases"
            echo ""
            echo "🌐 SERVERS AND PORTS:"
            echo "  Frontend: $FRONTEND_URL    (Vite dev server with HMR)"
            echo "  Backend:  $BACKEND_URL  (Express API with SSL)"
            echo ""
            echo "📚 AVAILABLE OPTIONS:"
            echo ""
            echo "  📖 HELP & INFORMATION:"
            echo "    --help, -h, -help"
            echo "        Show this comprehensive help message and exit."
            echo ""
            echo "  🚀 QUICK MODES:"
            echo "    -quick, -quick-quick"
            echo "        Quick mode: Skip ALL interactive prompts"
            echo "        • Assumes current directory is the OAuth Playground"
            echo "        • Skips directory selection prompts"
            echo "        • Skips confirmation prompts"
            echo "        • Skips log tail prompts"
            echo "        • Auto-accepts all default choices"
            echo "        • Ideal for automated scripts and CI/CD"
            echo ""
            echo "    -default"
            echo "        Default mode: Use defaults without prompting"
            echo "        • Runs all normal startup steps including checks"
            echo "        • Auto-accepts directory selection (uses current)"
            echo "        • Auto-accepts confirmation prompts"
            echo "        • Auto-accepts database recreation prompts"
            echo "        • Auto-chooses lockdown restore option 1"
            echo "        • Automatically tails pingone-api.log (default log)"
            echo "        • No user interaction required"
            echo ""
            echo "    -change-domain, --change-domain"
            echo "        Prompt to change the custom domain (default api.pingdemo.com)."
            echo "        Generates a new self-signed certificate for the chosen domain and saves"
            echo "        domain and cert paths in config/run-config.db for the next run."
            echo ""
            echo "🔧 DEFAULT BEHAVIOR (no flags):"
            echo "  1️⃣  DIRECTORY DISCOVERY:"
            echo "      • Searches common OAuth Playground locations"
            echo "      • Falls back to interactive prompt if not found"
            echo "      • Validates directory contains required files"
            echo ""
            echo "  2️⃣  REQUIREMENT VALIDATION:"
            echo "      • Checks Node.js, npm, curl availability"
            echo "      • Validates package.json and server.js exist"
            echo "      • Verifies SQLite3 is available"
            echo ""
            echo "  2b️⃣ CUSTOM DOMAIN & HOSTS FILE:"
            echo "      • Loads domain/certs from config/run-config.db"
            echo "      • Asks whether to add/update hosts file (e.g. /etc/hosts) so the domain"
            echo "        resolves to 127.0.0.1 (macOS/Linux; skipped with -quick/-default)"
            echo ""
            echo "  3️⃣  LOCKDOWN INTEGRITY CHECKS:"
            echo "      • SMS lockdown verification (verify:sms-lockdown)"
            echo "      • Email lockdown verification (verify:email-lockdown)"
            echo "      • WhatsApp lockdown verification (verify:whatsapp-lockdown)"
            echo "      • Prompts for action if drift is detected"
            echo ""
            echo "  4️⃣  SERVER MANAGEMENT:"
            echo "      • Gracefully kills existing servers"
            echo "      • Cleans up processes and frees ports"
            echo "      • Clears Vite cache and build artifacts"
            echo "      • Starts backend HTTP and HTTPS servers"
            echo "      • Starts frontend Vite development server"
            echo ""
            echo "  5️⃣  HEALTH VERIFICATION:"
            echo "      • Checks server accessibility"
            echo "      • Validates API endpoints are responding"
            echo "      • Verifies SSL certificate functionality"
            echo ""
            echo "  6️⃣  STATUS REPORTING:"
            echo "      • Prints comprehensive status report"
            echo "      • Shows server URLs and health status"
            echo "      • Displays log file locations"
            echo "      • Provides quick tail command examples"
            echo ""
            echo "  7️⃣  LOG MANAGEMENT (interactive):"
            echo "      • Prompts to tail a log file"
            echo "      • Offers 12 options (1-11 = log files, 12 = no tail)"
            echo "      • Includes PingOne API logs, flow logs, server logs"
            echo "      • Option to clear log before tailing"
            echo "      • Default: option 1 (pingone-api.log) if you press Enter"
            echo ""
            echo "📋 LOG FILE OPTIONS:"
            echo "      1) pingone-api.log     - All PingOne API calls (proxy + direct) [DEFAULT]"
            echo "      2) real-api.log        - Direct PingOne API calls only"
            echo "      3) server.log          - General server logs (tail -f logs/server.log)"
            echo "      4) sms.log             - SMS flow logs"
            echo "      5) email.log           - Email flow logs"
            echo "      6) whatsapp.log       - WhatsApp flow logs"
            echo "      7) voice.log           - Voice flow logs"
            echo "      8) fido.log            - FIDO2/WebAuthn logs"
            echo "      9) backend.log         - Backend log (tail -f backend.log)"
            echo "     10) frontend.log        - Frontend log (tail -f frontend.log)"
            echo "     11) startup.log         - Script startup logs"
            echo "     12) No tail             - Exit without following a log"
            echo ""
            echo "🎯 USE CASE EXAMPLES:"
            echo "  • Full stack (frontend + backend):  ./run.sh"
            echo "  • AI Assistant only:                ./run.sh -assistant"
            echo "  • AI Assistant (no prompts):        ./run.sh -assistant -quick"
            echo "  • Full stack + AI Assistant:        ./run.sh -both"
            echo "  • Full stack + AI Assistant (quick):./run.sh -both -quick"
            echo "  • Help information:                 ./run.sh --help, -h, or -help"
            echo "  • Automated scripts:                ./run.sh -quick"
            echo "  • CI/CD pipelines:                  ./run.sh -default"
            echo "  • Background monitoring:            ./run.sh -default &"
            echo "  • Change custom domain:             ./run.sh --change-domain"
            echo ""
            echo "🚨 EXIT CODES:"
            echo "  0   ✅ Success (all servers running and healthy)"
            echo "  1   ❌ Failure (servers failed to start)"
            echo "  2   ⚠️  Partial success (some running but health issues)"
            echo "  3   ❓ Unknown/unexpected status"
            echo "  130 ⛔ Interrupted (Ctrl+C)"
            echo ""
            echo "🔧 TROUBLESHOOTING:"
            echo "  • If servers don't start: Check port conflicts with 'lsof -i :3000-3001'"
            echo "  • If lockdown fails: Run 'git status' to check for uncommitted changes"
            echo "  • If health checks fail: Check logs/server.log for detailed errors"
            echo "  • For permission issues: Ensure script has execute permissions (chmod +x run.sh)"
            echo ""
            echo "📖 MORE INFORMATION:"
            echo "  • Project README: ./README.md"
            echo "  • API Documentation: Available at https://localhost:${BACKEND_PORT}/docs"
            echo "  • Protect Portal: $FRONTEND_URL/protect-portal"
            echo "  • OAuth Playground: $FRONTEND_URL"
            echo ""
            echo "🎮 QUICK START:"
            echo "  Full OAuth Playground:"
            echo "    1. cd to the OAuth Playground directory"
            echo "    2. Run: ./run.sh"
            echo "    3. Wait for servers to start, then open: $FRONTEND_URL"
            echo ""
            echo "  AI Assistant only (backend + MCP + MCP Inspector + standalone UI):"
            echo "    1. cd to the OAuth Playground directory"
            echo "    2. Run: ./run.sh -assistant"
            echo "    3. Open: https://localhost:3002 (AI Assistant)"
            echo "    4. MCP Inspector: http://localhost:${MCP_INSPECTOR_PORT} (test PingOne MCP tools)"
            echo "    5. Logs: backend.log | mcp-server.log | mcp-inspector.log | assistant.log"
            echo ""
            echo "  Full stack + AI Assistant (all services at once):"
            echo "    1. cd to the OAuth Playground directory"
            echo "    2. Run: ./run.sh -both"
            echo "    3. OAuth Playground: https://localhost:3000"
            echo "    4. AI Assistant:     https://localhost:3002"
            echo "    5. MCP Inspector:    http://localhost:${MCP_INSPECTOR_PORT} (test PingOne MCP tools)"
            echo "    6. Logs: backend.log | frontend.log | mcp-server.log | mcp-inspector.log | assistant.log"
            echo ""
            echo "╔══════════════════════════════════════════════════════════════════════════════╗"
            echo "║                    Happy coding with OAuth Playground! 🚀                    ║"
            echo "╚══════════════════════════════════════════════════════════════════════════════╝"
            exit 0
            ;;
        -default)
            export DEFAULT_MODE=true
            # Pass through to main function
            shift
            ;;
        -assistant|--assistant)
            export ASSISTANT_MODE=true
            shift
            ;;
        -both|--both)
            export BOTH_MODE=true
            shift
            ;;

        *)
            print_warning "Unknown option: $1 (use --help for usage)"
            shift
            ;;
    esac
done

###############################################################################
# ASSISTANT MODE — backend + MCP server + standalone AI Assistant only
###############################################################################

start_mcp_server() {
    print_status "🤖 Starting PingOne MCP server..."
    local dist_index="${MCP_SERVER_DIR_REL}/dist/index.js"

    # Build if dist/index.js doesn't exist
    if [ ! -f "$dist_index" ]; then
        print_info "MCP server not built — running npm run build in ${MCP_SERVER_DIR_REL}/..."
        if (cd "$MCP_SERVER_DIR_REL" && npm run build 2>&1); then
            print_success "MCP server built successfully"
        else
            print_error "MCP server build failed. Check ${MCP_SERVER_DIR_REL} for errors."
            return 1
        fi
    fi

    # Kill any existing MCP server process
    if [ -f "$MCP_PID_FILE_REL" ]; then
        local old_pid
        old_pid=$(cat "$MCP_PID_FILE_REL" 2>/dev/null)
        if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
            print_info "Killing existing MCP server (PID: $old_pid)"
            kill "$old_pid" 2>/dev/null || true
            sleep 1
        fi
        rm -f "$MCP_PID_FILE_REL"
    fi

    # Ensure logs/ directory exists (backend may not be started yet)
    mkdir -p logs
    node "$dist_index" > logs/mcp-server.log 2>&1 &
    local mcp_pid=$!
    echo $mcp_pid > "$MCP_PID_FILE_REL"
    sleep 1

    if kill -0 "$mcp_pid" 2>/dev/null; then
        print_success "PingOne MCP server started (PID: $mcp_pid) — logs: mcp-server.log"
        return 0
    else
        print_error "MCP server process died immediately. Check mcp-server.log for details."
        tail -5 mcp-server.log 2>/dev/null || true
        return 1
    fi
}

start_mcp_inspector() {
    print_status "🔬 Starting MCP Inspector (visual testing for PingOne MCP server)..."
    if [ ! -f "mcp-inspector-config.json" ]; then
        print_warning "mcp-inspector-config.json not found — skipping MCP Inspector"
        return 1
    fi
    if [ -f "$MCP_INSPECTOR_PID_FILE" ]; then
        local old_pid=$(cat "$MCP_INSPECTOR_PID_FILE" 2>/dev/null)
        if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
            print_info "MCP Inspector already running (PID: $old_pid)"
            return 0
        fi
        rm -f "$MCP_INSPECTOR_PID_FILE"
    fi
    if check_port $MCP_INSPECTOR_PORT 2>/dev/null; then
        print_info "Port $MCP_INSPECTOR_PORT in use — killing existing process"
        lsof -ti:$MCP_INSPECTOR_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    npx @modelcontextprotocol/inspector --config mcp-inspector-config.json --server pingone --no-open > mcp-inspector.log 2>&1 &
    local inspector_pid=$!
    echo $inspector_pid > "$MCP_INSPECTOR_PID_FILE"
    sleep 2
    if kill -0 "$inspector_pid" 2>/dev/null; then
        print_success "MCP Inspector started (PID: $inspector_pid) — http://localhost:${MCP_INSPECTOR_PORT}"
        return 0
    else
        print_warning "MCP Inspector may have exited. Check mcp-inspector.log (Node ^22.7.5 required)"
        return 1
    fi
}

start_assistant_frontend() {
    print_status "🚀 Starting standalone AI Assistant on port $ASSISTANT_PORT..."

    # Kill any existing process on port 3002
    local existing_pid
    existing_pid=$(lsof -ti:"$ASSISTANT_PORT" 2>/dev/null || true)
    if [ -n "$existing_pid" ]; then
        print_info "Killing existing process on port $ASSISTANT_PORT (PID: $existing_pid)"
        kill -9 "$existing_pid" 2>/dev/null || true
        sleep 1
    fi
    if [ -f "$ASSISTANT_PID_FILE" ]; then rm -f "$ASSISTANT_PID_FILE"; fi

    # Check AIAssistant directory exists
    if [ ! -d "AIAssistant" ]; then
        print_error "AIAssistant/ directory not found. Has it been created?"
        return 1
    fi

    npx vite AIAssistant --port "$ASSISTANT_PORT" > assistant.log 2>&1 &
    local assistant_pid=$!
    echo $assistant_pid > "$ASSISTANT_PID_FILE"

    # Wait for Vite to be ready (up to 20s)
    local attempt=0
    print_info "Waiting for AI Assistant to be ready..."
    while [ $attempt -lt 20 ]; do
        if curl -s -k "https://localhost:${ASSISTANT_PORT}" >/dev/null 2>&1; then
            print_success "AI Assistant ready at https://localhost:${ASSISTANT_PORT}"
            return 0
        fi
        if ! kill -0 "$assistant_pid" 2>/dev/null; then
            print_error "AI Assistant process died during startup. Check assistant.log:"
            tail -10 assistant.log 2>/dev/null || true
            return 1
        fi
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    echo ""
    # Vite might not respond to curl on HTTPS without certs — check process is alive
    if kill -0 "$assistant_pid" 2>/dev/null; then
        print_success "AI Assistant started (PID: $assistant_pid) — https://localhost:${ASSISTANT_PORT}"
        return 0
    fi
    print_error "AI Assistant failed to start. Check assistant.log."
    return 1
}

run_assistant_mode() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║              🤖 AI Assistant Mode — Standalone Startup 🤖                   ║"
    echo "║                                                                              ║"
    echo "║  Backend:        https://localhost:3001  (Express API)                        ║"
    echo "║  MCP Server:     pingone-mcp-server (stdio, background)                      ║"
    echo "║  MCP Inspector:   http://localhost:${MCP_INSPECTOR_PORT}  (test MCP tools)           ║"
    echo "║  AI Assistant:   https://localhost:${ASSISTANT_PORT}  (Vite standalone)                 ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Locate project directory (quick — assume cwd is correct if files exist)
    if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
        find_project_directory
    else
        print_success "Using current directory: $(pwd)"
    fi

    check_requirements
    load_ssl_config

    # Kill existing backend
    print_status "🛑 Cleaning up existing processes..."
    if check_port $BACKEND_PORT; then
        print_info "Killing process on port $BACKEND_PORT"
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    pkill -f "server.js" 2>/dev/null || true
    sleep 1

    # Start backend
    start_backend
    if [ "$BACKEND_STATUS" != "running" ]; then
        print_error "Backend failed to start. Aborting assistant mode."
        exit 1
    fi

    # Start MCP server (non-fatal if it fails — backend still works without it)
    start_mcp_server || print_warning "MCP server failed to start — continuing without it"

    # Start MCP Inspector (visual testing UI for PingOne MCP tools)
    start_mcp_inspector || print_warning "MCP Inspector failed to start — continuing without it"

    # Start AI Assistant frontend
    start_assistant_frontend || {
        print_error "AI Assistant frontend failed to start."
        exit 1
    }

    # Status summary — all services started with URLs
    print_success "All services started. Key URLs:"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✅ BACKEND + MCP + MCP INSPECTOR + AI ASSISTANT STARTED         ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Open in browser:${NC}"
    echo -e "${GREEN}║${NC}   Backend API:      ${BLUE}https://localhost:${BACKEND_PORT}${NC}"
    echo -e "${GREEN}║${NC}   AI Assistant:     ${BLUE}https://localhost:${ASSISTANT_PORT}${NC}"
    echo -e "${GREEN}║${NC}   MCP Inspector:    ${BLUE}http://localhost:${MCP_INSPECTOR_PORT}${NC} (test PingOne MCP tools)"
    echo -e "${GREEN}║${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Background (no URL):${NC}"
    echo -e "${GREEN}║${NC}   MCP Server:       ${BLUE}stdio process${NC} → logs/mcp-server.log"
    echo -e "${GREEN}║${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Log files:${NC}"
    echo -e "${GREEN}║${NC}   backend.log       — Express API server"
    echo -e "${GREEN}║${NC}   mcp-server.log    — PingOne MCP server"
    echo -e "${GREEN}║${NC}   mcp-inspector.log — MCP Inspector"
    echo -e "${GREEN}║${NC}   assistant.log     — AI Assistant (Vite)"
    echo -e "${GREEN}║${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Stop all:${NC} pkill -f 'server.js'; lsof -ti:${ASSISTANT_PORT},${MCP_INSPECTOR_PORT} | xargs kill -9"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Offer to tail a log
    if [ "${QUICK_MODE:-false}" = true ] || [ "${DEFAULT_MODE:-false}" = true ]; then
        print_info "Quick/default mode: tailing backend.log (Ctrl+C to stop)"
        tail -f backend.log
        return
    fi

    echo -n "Tail a log? [1=backend, 2=mcp-server, 3=assistant, 4=all, Enter=skip]: "
    read -r log_choice
    case "${log_choice:-skip}" in
        1) tail -f backend.log ;;
        2) tail -f mcp-server.log ;;
        3) tail -f assistant.log ;;
        4) tail -f backend.log mcp-server.log assistant.log ;;
        *) print_info "Exiting. Servers continue running in background." ;;
    esac
}

###############################################################################
# BOTH MODE — backend + MCP server + main OAuth Playground + AI Assistant
###############################################################################

run_both_mode() {
    echo -e "${PURPLE}"
    echo "╔═════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                             ║"
    echo "║          🚀 Full Stack + AI Assistant — Combined Mode 🤖                   ║"
    echo "║                                                                             ║"
    echo "║  Backend:        https://localhost:3001  (Express API)                      ║"
    echo "║  OAuth Frontend: https://localhost:3000  (Vite main app)                    ║"
    echo "║  MCP Server:     pingone-mcp-server (stdio, background)                     ║"
    echo "║  MCP Inspector:  http://localhost:${MCP_INSPECTOR_PORT}  (test MCP tools)             ║"
    echo "║  AI Assistant:   https://localhost:${ASSISTANT_PORT}  (Vite standalone)                ║"
    echo "║                                                                             ║"
    echo "╚═════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
        find_project_directory
    else
        print_success "Using current directory: $(pwd)"
    fi

    check_requirements
    load_ssl_config

    # Kill all existing processes including assistant port
    print_status "🛑 Cleaning up existing processes..."
    kill_all_servers
    if check_port $ASSISTANT_PORT; then
        print_info "Killing process on port $ASSISTANT_PORT"
        lsof -ti:$ASSISTANT_PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    pkill -f "vite.*AIAssistant" 2>/dev/null || true
    sleep 1

    # Start backend
    start_backend
    if [ "$BACKEND_STATUS" != "running" ]; then
        print_error "Backend failed to start. Aborting."
        exit 1
    fi

    # Start MCP server (non-fatal)
    start_mcp_server || print_warning "MCP server failed to start — continuing without it"

    # Start MCP Inspector (visual testing UI for PingOne MCP tools)
    start_mcp_inspector || print_warning "MCP Inspector failed to start — continuing without it"

    # Start main OAuth Playground frontend
    start_frontend

    # Start AI Assistant frontend (non-fatal)
    start_assistant_frontend || print_warning "AI Assistant frontend failed to start"

    # Status summary — all services started with URLs
    print_success "All services started. Key URLs:"
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        ✅ BACKEND + FRONTEND + MCP + MCP INSPECTOR + AI ASSISTANT STARTED    ║${NC}"
    echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Open in browser:${NC}"
    echo -e "${GREEN}║${NC}   Backend API:      ${BLUE}https://localhost:${BACKEND_PORT}${NC}"
    echo -e "${GREEN}║${NC}   OAuth Playground: ${BLUE}https://localhost:${FRONTEND_PORT}${NC}"
    echo -e "${GREEN}║${NC}   AI Assistant:     ${BLUE}https://localhost:${ASSISTANT_PORT}${NC}"
    echo -e "${GREEN}║${NC}   MCP Inspector:    ${BLUE}http://localhost:${MCP_INSPECTOR_PORT}${NC} (test PingOne MCP tools)"
    echo -e "${GREEN}║${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Background (no URL):${NC}"
    echo -e "${GREEN}║${NC}   MCP Server:       ${BLUE}stdio process${NC} → logs/mcp-server.log"
    echo -e "${GREEN}║${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Log files:${NC}"
    echo -e "${GREEN}║${NC}   backend.log        — Express API server"
    echo -e "${GREEN}║${NC}   frontend.log       — OAuth Playground (Vite)"
    echo -e "${GREEN}║${NC}   mcp-server.log     — PingOne MCP server"
    echo -e "${GREEN}║${NC}   mcp-inspector.log  — MCP Inspector"
    echo -e "${GREEN}║${NC}   assistant.log      — AI Assistant (Vite)"
    echo -e "${GREEN}║${NC}"
    echo -e "${GREEN}║${NC} ${CYAN}Stop all:${NC} pkill -f 'server.js'; lsof -ti:${FRONTEND_PORT},${ASSISTANT_PORT},${MCP_INSPECTOR_PORT} | xargs kill -9"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "${QUICK_MODE:-false}" = true ] || [ "${DEFAULT_MODE:-false}" = true ]; then
        print_info "Quick/default mode: tailing backend.log (Ctrl+C to stop)"
        tail -f backend.log
        return
    fi

    echo -n "Tail a log? [1=backend, 2=frontend, 3=mcp-server, 4=assistant, 5=all, Enter=skip]: "
    read -r log_choice
    case "${log_choice:-skip}" in
        1) tail -f backend.log ;;
        2) tail -f frontend.log ;;
        3) tail -f mcp-server.log ;;
        4) tail -f assistant.log ;;
        5) tail -f backend.log frontend.log mcp-server.log assistant.log ;;
        *) print_info "Exiting. Servers continue running in background." ;;
    esac
}

# Main execution
main() {
    # Check for -quick flag
    QUICK_MODE=false
    DEFAULT_MODE=${DEFAULT_MODE:-false}
    while [ $# -gt 0 ]; do
        case "$1" in
            -quick|-quick-quick)
                QUICK_MODE=true
                export QUICK_MODE
                print_info "🚀 Quick mode enabled - skipping all prompts"
                shift
                ;;
            -default)
                DEFAULT_MODE=true
                export DEFAULT_MODE
                print_info "📋 Default mode enabled - using default logging without prompting"
                shift
                ;;
            -change-domain|--change-domain)
                CHANGE_DOMAIN=true
                export CHANGE_DOMAIN
                print_info "🔐 Will prompt to change custom domain and regenerate certificate"
                shift
                ;;
            -assistant|--assistant)
                ASSISTANT_MODE=true
                export ASSISTANT_MODE
                shift
                ;;
            -both|--both)
                BOTH_MODE=true
                export BOTH_MODE
                shift
                ;;
            *)
                break
                ;;
        esac
    done

    show_banner

    # If assistant mode was re-enabled inside main(), delegate immediately
    if [ "${ASSISTANT_MODE:-false}" = true ]; then
        run_assistant_mode
        return
    fi

    # Step 0: Find and change to project directory
    find_project_directory
    
    # Step 1: Check requirements
    check_requirements

    # Step 1a: Load custom domain and SSL cert from SQLite (prompt to change if --change-domain)
    load_ssl_config

    # Step 1a2: Optionally add/update hosts file so the custom domain resolves to 127.0.0.1
    ask_and_update_hosts_file

    # Step 1b: Verify lock-down integrity (blocks restart on drift)
    verify_sms_lockdown
    verify_email_lockdown
    verify_whatsapp_lockdown
    
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
    
    # Step 9: Ask user if they want to tail a log file (interactive)
    if [ "$OVERALL_STATUS" = "success" ] || [ "$OVERALL_STATUS" = "partial" ]; then
        if [ "$QUICK_MODE" = true ]; then
            print_info "Quick mode: Skipping log tail (no prompts)"
            return
        fi
        
        if [ "$DEFAULT_MODE" = true ]; then
            print_info "📋 Default mode: Auto-tailing pingone-api.log (default log) without prompting"
            LOG_FILE="logs/pingone-api.log"
            LOG_DESCRIPTION="PingOne API log (all calls)"
            
            # Check if log file exists and clear it if needed (default to clearing)
            if [ -f "$LOG_FILE" ]; then
                print_info "Clearing ${LOG_FILE}..."
                if command -v truncate &> /dev/null; then
                    truncate -s 0 "$LOG_FILE"
                else
                    > "$LOG_FILE"
                fi
                print_success "Log file cleared successfully"
            else
                print_warning "Log file not found: ${LOG_FILE}"
                print_info "The file will be created when the first API call is made"
                print_info "Press Ctrl+C to exit"
                # Wait for file to be created, then tail it
                while [ ! -f "$LOG_FILE" ]; do
                    sleep 1
                done
            fi
            
            # Tail the log file
            echo ""
            print_info "📋 Tailing ${LOG_DESCRIPTION} file (Ctrl+C to stop)..."
            echo -e "   ${CYAN}Log file: ${GREEN}${LOG_FILE}${NC}"
            echo ""
            tail -f "$LOG_FILE"
            return
        fi
        
        echo ""
        echo -n "Would you like to tail a log file? (Y/n): "
        read -r tail_log
        
        # Default to yes if empty (just press Enter) or if user types y/Y
        if [ -z "$tail_log" ] || [ "$tail_log" = "y" ] || [ "$tail_log" = "Y" ]; then
            echo ""
            print_info "📋 Which log file would you like to tail?"
            echo ""
            echo -e "${CYAN}Available log files:${NC}"
            echo -e "  1) ${GREEN}pingone-api.log${NC} - All PingOne API calls (proxy and direct)"
            echo -e "  2) ${GREEN}real-api.log${NC} - Direct PingOne API calls only (no proxy)"
            echo -e "  3) ${GREEN}server.log${NC} - Server logs (tail -f logs/server.log)"
            echo ""
            echo -e "${CYAN}Flow logs:${NC}"
            echo -e "  4) ${GREEN}sms.log${NC} - SMS flow"
            echo -e "  5) ${GREEN}email.log${NC} - Email flow"
            echo -e "  6) ${GREEN}whatsapp.log${NC} - WhatsApp flow"
            echo -e "  7) ${GREEN}voice.log${NC} - Voice flow"
            echo -e "  8) ${GREEN}fido.log${NC} - FIDO2 flow"
            echo ""
            echo -e "${CYAN}App logs:${NC}"
            echo -e "  9) ${GREEN}backend.log${NC} - Backend log (tail -f backend.log)"
            echo -e "  10) ${GREEN}frontend.log${NC} - Frontend log (tail -f frontend.log)"
            echo -e "  11) ${GREEN}startup.log${NC} - Startup log"
            echo -e "  12) ${GREEN}Server + Backend + Frontend${NC} - Tail server.log, backend.log, frontend.log ${CYAN}[DEFAULT]${NC}"
            echo -e "  13) ${GREEN}No tail${NC} - Exit without following a log"
            echo ""
            echo -e "${CYAN}Default: 12 (tail server + backend + frontend). Press Enter for default.${NC}"
            echo -n "Enter your choice (1-13, or press Enter for default): "
            read -r log_choice
            
            # Default to option 12 (tail server + backend + frontend) if no choice is made or invalid choice
            if [ -z "$log_choice" ]; then
                log_choice="12"
                print_info "No choice entered, defaulting to option 12 (tail server + backend + frontend)"
            fi
            
            # Determine which log file to tail based on user choice
            case "$log_choice" in
                1)
                    LOG_FILE="logs/pingone-api.log"
                    LOG_DESCRIPTION="PingOne API log (all calls)"
                    ;;
                2)
                    LOG_FILE="logs/real-api.log"
                    LOG_DESCRIPTION="Real API log (direct calls only, no proxy)"
                    ;;
                3)
                    LOG_FILE="logs/server.log"
                    LOG_DESCRIPTION="Server log"
                    ;;
                4)
                    LOG_FILE="logs/sms.log"
                    LOG_DESCRIPTION="SMS flow log"
                    ;;
                5)
                    LOG_FILE="logs/email.log"
                    LOG_DESCRIPTION="Email flow log"
                    ;;
                6)
                    LOG_FILE="logs/whatsapp.log"
                    LOG_DESCRIPTION="WhatsApp flow log"
                    ;;
                7)
                    LOG_FILE="logs/voice.log"
                    LOG_DESCRIPTION="Voice flow log"
                    ;;
                8)
                    LOG_FILE="logs/fido.log"
                    LOG_DESCRIPTION="FIDO2 flow log"
                    ;;
                9)
                    LOG_FILE="backend.log"
                    LOG_DESCRIPTION="Backend log (tail -f backend.log)"
                    ;;
                10)
                    LOG_FILE="frontend.log"
                    LOG_DESCRIPTION="Frontend log (tail -f frontend.log)"
                    ;;
                11)
                    LOG_FILE="logs/startup.log"
                    LOG_DESCRIPTION="Startup log"
                    ;;
                12)
                    # Tail server, backend, and frontend logs together (default)
                    echo ""
                    print_info "📋 Tailing server.log, backend.log, frontend.log (Ctrl+C to stop)..."
                    echo -e "   ${CYAN}Files: ${GREEN}logs/server.log backend.log frontend.log${NC}"
                    echo ""
                    tail -f logs/server.log backend.log frontend.log 2>/dev/null || \
                    tail -f backend.log frontend.log 2>/dev/null || \
                    tail -f backend.log 2>/dev/null || true
                    case "$OVERALL_STATUS" in
                        "success") exit 0 ;;
                        "partial") exit 2 ;;
                        "failure") exit 1 ;;
                        *) exit 3 ;;
                    esac
                    ;;
                13)
                    print_info "No tail selected. Exiting."
                    case "$OVERALL_STATUS" in
                        "success") exit 0 ;;
                        "partial") exit 2 ;;
                        "failure") exit 1 ;;
                        *) exit 3 ;;
                    esac
                    ;;
                *)
                    print_warning "Invalid choice '$log_choice'. Defaulting to option 12 (tail server + backend + frontend)"
                    log_choice="12"
                    LOG_FILE=""
                    ;;
            esac
            
            # For single-file choices (1-11), prompt to clear and then tail; option 12 already tailed and exited
            if [ -z "$LOG_FILE" ]; then
                # Invalid choice defaulted to 12 - run triple tail here
                echo ""
                print_info "📋 Tailing server.log, backend.log, frontend.log (Ctrl+C to stop)..."
                echo -e "   ${CYAN}Files: ${GREEN}logs/server.log backend.log frontend.log${NC}"
                echo ""
                tail -f logs/server.log backend.log frontend.log 2>/dev/null || \
                tail -f backend.log frontend.log 2>/dev/null || \
                tail -f backend.log 2>/dev/null || true
            else
            echo ""
            
            # Ask if user wants to clear the log file (default to Y)
            if [ -f "$LOG_FILE" ]; then
                echo -e "${YELLOW}The log file exists: ${LOG_FILE}${NC}"
                echo -n "Do you want to clear it before tailing? (Y/n): "
                read -r clear_log
                
                # Default to yes if empty (just press Enter) or if user types y/Y
                if [ -z "$clear_log" ] || [ "$clear_log" = "y" ] || [ "$clear_log" = "Y" ]; then
                    print_info "Clearing ${LOG_FILE}..."
                    # Use truncate to clear the file (more reliable than >)
                    if command -v truncate &> /dev/null; then
                        truncate -s 0 "$LOG_FILE"
                    else
                        # Fallback: use > to truncate
                        > "$LOG_FILE"
                    fi
                    # Verify the file was cleared
                    if [ -s "$LOG_FILE" ]; then
                        print_error "Failed to clear log file (file still has content)"
                    else
                        print_success "Log file cleared successfully"
                    fi
                    echo ""
                fi
            else
                print_warning "Log file not found: ${LOG_FILE}"
                if [ "$LOG_FILE" = "logs/real-api.log" ] || [ "$LOG_FILE" = "logs/pingone-api.log" ]; then
                    print_info "The file will be created when the first API call is made"
                fi
                print_info "Press Ctrl+C to exit"
                # Wait for file to be created, then tail it
                while [ ! -f "$LOG_FILE" ]; do
                    sleep 1
                done
            fi
            
            # Tail the log file
            echo ""
            print_info "📋 Tailing ${LOG_DESCRIPTION} file (Ctrl+C to stop)..."
            echo -e "   ${CYAN}Log file: ${GREEN}${LOG_FILE}${NC}"
            echo ""
            tail -f "$LOG_FILE"
            fi
        else
            print_info "Skipping log tail."
        fi
    else
        print_warning "Servers did not start successfully. Skipping log tail."
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

###############################################################################
# QUICK REFERENCE BANNER — all service URLs
###############################################################################

show_url_banner() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                     📋  SERVICE URL QUICK REFERENCE                         ║${NC}"
    echo -e "${PURPLE}╠══════════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}  ${CYAN}Masterflow (OAuth Playground)${NC}"
    echo -e "${PURPLE}║${NC}    Frontend   →  ${GREEN}${FRONTEND_URL}${NC}"
    echo -e "${PURPLE}║${NC}    Backend    →  ${GREEN}${BACKEND_URL}${NC}"
    echo -e "${PURPLE}║${NC}    API Docs   →  ${GREEN}${BACKEND_URL}/docs${NC}"
    echo -e "${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}  ${CYAN}Standalone AI Assistant${NC}"
    echo -e "${PURPLE}║${NC}    UI         →  ${GREEN}https://localhost:${ASSISTANT_PORT}${NC}"
    echo -e "${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}  ${CYAN}MCP Inspector${NC} (test PingOne MCP tools)"
    echo -e "${PURPLE}║${NC}    UI         →  ${GREEN}http://localhost:${MCP_INSPECTOR_PORT}${NC}"
    echo -e "${PURPLE}║${NC}"
    echo -e "${PURPLE}║${NC}  ${CYAN}How to run${NC}"
    echo -e "${PURPLE}║${NC}    Masterflow only         →  ${YELLOW}./run.sh${NC}"
    echo -e "${PURPLE}║${NC}    AI Assistant only       →  ${YELLOW}./run.sh -assistant${NC}"
    echo -e "${PURPLE}║${NC}    Both together           →  ${YELLOW}./run.sh -both${NC}"
    echo -e "${PURPLE}║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Run main function
if [ "${ASSISTANT_MODE:-false}" = true ]; then
    show_url_banner
    run_assistant_mode
elif [ "${BOTH_MODE:-false}" = true ]; then
    show_url_banner
    run_both_mode
else
    show_url_banner
    main "$@"
fi
