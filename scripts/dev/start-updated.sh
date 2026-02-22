#!/bin/bash

###############################################################################
# ⚠️ CRITICAL FILE - DO NOT DELETE OR MOVE ⚠️
# 
# This file is the updated startup script for MasterFlow API with custom domain
# Based on debugging session fixes for:
# - Route conflicts (/api-status → /system-status)
# - HTTPS configuration issues
# - Custom domain setup (api.pingdemo.com)
# - Infinite loop prevention
###############################################################################

# MasterFlow API - Updated Server Restart Script
# Version: 2.0.0 - Updated with debugging fixes
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

# Configuration - Fixed ports for MasterFlow API
FRONTEND_PORT=3000  # Vite dev server (HTTPS)
BACKEND_PORT=3001   # Express API server (HTTPS only)
CUSTOM_DOMAIN="api.pingdemo.com"

# Function to setup custom domain
setup_custom_domain() {
    print_status "🌐 Setting up custom domain: $CUSTOM_DOMAIN"
    
    # Update hosts file
    if ! grep -q "$CUSTOM_DOMAIN" /etc/hosts 2>/dev/null; then
        print_info "Adding $CUSTOM_DOMAIN to hosts file..."
        echo "127.0.0.1 $CUSTOM_DOMAIN" | sudo tee -a /etc/hosts > /dev/null
        echo "::1 $CUSTOM_DOMAIN" | sudo tee -a /etc/hosts > /dev/null
        print_success "Hosts file updated"
    else
        print_info "Domain already exists in hosts file"
    fi
    
    # Generate SSL certificates if needed
    if [ ! -f "$CUSTOM_DOMAIN.crt" ] || [ ! -f "$CUSTOM_DOMAIN.key" ]; then
        print_info "Generating SSL certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$CUSTOM_DOMAIN.key" \
            -out "$CUSTOM_DOMAIN.crt" \
            -subj "/C=US/ST=State/L/City/O=Development/CN=${CUSTOM_DOMAIN}"
        print_success "SSL certificates generated"
    else
        print_info "SSL certificates already exist"
    fi
    
    # Create .env.local if needed
    if [ ! -f ".env.local" ]; then
        cat > .env.local << EOF
# Custom Domain Configuration
VITE_APP_DOMAIN=https://$CUSTOM_DOMAIN
PINGONE_APP_DOMAIN=https://$CUSTOM_DOMAIN
BACKEND_HOST=$CUSTOM_DOMAIN

# Dev Server Configuration
PINGONE_DEV_SERVER_PORT=$FRONTEND_PORT
PINGONE_DEV_SERVER_HTTPS=true

# API Configuration
VITE_PINGONE_API_URL=https://$CUSTOM_DOMAIN
VITE_BACKEND_URL=https://$CUSTOM_DOMAIN
EOF
        print_success "Environment configuration created"
    else
        print_info "Environment configuration already exists"
    fi
}

# Function to kill existing servers
kill_servers() {
    print_status "🔄 Killing existing servers..."
    
    # Kill Vite processes
    pkill -f "vite" 2>/dev/null || true
    pkill -f "node.*vite" 2>/dev/null || true
    
    # Kill backend processes
    pkill -f "server.js" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    
    # Clear caches
    rm -rf node_modules/.vite 2>/dev/null || true
    rm -rf .vite 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    
    print_success "Servers killed and caches cleared"
}

# Function to start backend server
start_backend() {
    print_status "🔧 Starting backend server..."
    
    nohup node server.js > backend.log 2>&1 &
    local backend_pid=$!
    
    print_info "Backend started with PID: $backend_pid"
    
    # Wait for backend to start
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -k -s "https://$CUSTOM_DOMAIN:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
            print_success "Backend server started successfully on https://$CUSTOM_DOMAIN:$BACKEND_PORT"
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$backend_pid" 2>/dev/null; then
            print_error "Backend process died during startup"
            tail -10 backend.log 2>/dev/null || echo "No backend log found"
            return 1
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    
    echo ""
    print_error "Backend server failed to start within 30 seconds"
    tail -10 backend.log 2>/dev/null || echo "No backend log found"
    return 1
}

# Function to start frontend server
start_frontend() {
    print_status "🎨 Starting frontend server..."
    
    nohup npm run dev > frontend.log 2>&1 &
    local frontend_pid=$!
    
    print_info "Frontend started with PID: $frontend_pid"
    
    # Wait for frontend to start
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -k -s "https://$CUSTOM_DOMAIN:$FRONTEND_PORT" >/dev/null 2>&1; then
            print_success "Frontend server started successfully on https://$CUSTOM_DOMAIN:$FRONTEND_PORT"
            return 0
        fi
        
        # Check if process is still running
        if ! kill -0 "$frontend_pid" 2>/dev/null; then
            print_error "Frontend process died during startup"
            tail -10 frontend.log 2>/dev/null || echo "No frontend log found"
            return 1
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        printf "."
    done
    
    echo ""
    print_error "Frontend server failed to start within 30 seconds"
    tail -10 frontend.log 2>/dev/null || echo "No frontend log found"
    return 1
}

# Function to run health checks
run_health_checks() {
    print_status "🏥 Running health checks..."
    
    local all_healthy=true
    
    # Check frontend
    if curl -k -s "https://$CUSTOM_DOMAIN:$FRONTEND_PORT" >/dev/null 2>&1; then
        print_success "Frontend: https://$CUSTOM_DOMAIN:$FRONTEND_PORT ✅"
    else
        print_error "Frontend: https://$CUSTOM_DOMAIN:$FRONTEND_PORT ❌"
        all_healthy=false
    fi
    
    # Check backend
    if curl -k -s "https://$CUSTOM_DOMAIN:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
        print_success "Backend: https://$CUSTOM_DOMAIN:$BACKEND_PORT/api/health ✅"
    else
        print_error "Backend: https://$CUSTOM_DOMAIN:$BACKEND_PORT/api/health ❌"
        all_healthy=false
    fi
    
    # Check API status page (new route)
    if curl -k -s "https://$CUSTOM_DOMAIN:$FRONTEND_PORT/system-status" >/dev/null 2>&1; then
        print_success "API Status: https://$CUSTOM_DOMAIN:$FRONTEND_PORT/system-status ✅"
    else
        print_warning "API Status: https://$CUSTOM_DOMAIN:$FRONTEND_PORT/system-status ⚠️"
    fi
    
    if [ "$all_healthy" = true ]; then
        print_success "All services are healthy! 🎉"
        return 0
    else
        print_error "Some services are not healthy"
        return 1
    fi
}

# Function to show access URLs
show_access_urls() {
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    🚀 MasterFlow API - Ready! 🚀                        ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🌐 Access URLs:${NC}"
    echo -e "  • Dashboard:     ${GREEN}https://$CUSTOM_DOMAIN:$FRONTEND_PORT/dashboard${NC}"
    echo -e "  • API Status:    ${GREEN}https://$CUSTOM_DOMAIN:$FRONTEND_PORT/system-status${NC}"
    echo -e "  • Backend Health:${GREEN}https://$CUSTOM_DOMAIN:$BACKEND_PORT/api/health${NC}"
    echo ""
    echo -e "${CYAN}📋 Important Notes:${NC}"
    echo -e "  • API Status page moved from /api-status to /system-status (avoids proxy conflict)"
    echo -e "  • Both servers are running with HTTPS enabled"
    echo -e "  • Custom domain $CUSTOM_DOMAIN is configured"
    echo ""
    echo -e "${CYAN}🔧 Debugging Commands:${NC}"
    echo -e "  • Frontend logs: ${YELLOW}tail -f frontend.log${NC}"
    echo -e "  • Backend logs:  ${YELLOW}tail -f backend.log${NC}"
    echo -e "  • Kill servers:  ${YELLOW}pkill -f 'vite|server.js'${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 MasterFlow API Startup Script v2.0.0 🚀                ║"
    echo "║                    Updated with debugging fixes                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_status "🔄 Starting MasterFlow API with custom domain setup..."
    
    # Setup custom domain
    setup_custom_domain
    
    # Kill existing servers
    kill_servers
    
    # Start backend
    if ! start_backend; then
        print_error "Failed to start backend server"
        exit 1
    fi
    
    # Start frontend
    if ! start_frontend; then
        print_error "Failed to start frontend server"
        exit 1
    fi
    
    # Run health checks
    if ! run_health_checks; then
        print_warning "Some health checks failed, but servers may still be starting"
    fi
    
    # Show access URLs
    show_access_urls
    
    print_success "MasterFlow API startup complete! 🎉"
}

# Run main function
main "$@"
