#!/bin/bash

###############################################################################
# ⚠️ CRITICAL FILE - DO NOT DELETE OR MOVE ⚠️
# 
# This file is the primary entry point for starting the MasterFlow API application.
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

# MasterFlow API - Server Restart Script
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
# These ports are hardcoded to ensure consistency with OAuth redirect URIs
# and API endpoint configurations. Do not change these values.
FRONTEND_PORT=3000  # Vite dev server (HTTPS)
BACKEND_PORT=3001   # Express API server (HTTPS only)

# Function to read custom domain from .env.local
read_custom_domain() {
    local env_file=".env.local"
    local default_domain="https://api.pingdemo.com"
    
    if [ -f "$env_file" ]; then
        # Read VITE_APP_DOMAIN from .env.local
        local custom_domain=$(grep "^VITE_APP_DOMAIN=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | sed 's/\r$//')
        
        if [ -n "$custom_domain" ] && [ "$custom_domain" != "https://localhost:3000" ]; then
            # Extract domain without port for display
            local domain_host=$(echo "$custom_domain" | sed 's|^https\?://||' | cut -d':' -f1)
            
            # Update URLs to use custom domain
            FRONTEND_URL="${custom_domain}:${FRONTEND_PORT}"
            BACKEND_URL="${custom_domain}:${BACKEND_PORT}"
            
            # Set flag for custom domain mode
            USE_CUSTOM_DOMAIN=true
            CUSTOM_DOMAIN_HOST="$domain_host"
            
            print_info "Custom domain detected: $custom_domain"
            return 0
        fi
    fi
    
    # Check if we should auto-configure default domain
    if [ ! -f "$env_file" ] || ! grep -q "VITE_APP_DOMAIN" "$env_file" 2>/dev/null; then
        # Auto-configure default domain
        print_info "No custom domain configured, using default: $default_domain"
        
        # Update URLs to use default domain
        FRONTEND_URL="${default_domain}:${FRONTEND_PORT}"
        BACKEND_URL="${default_domain}:${BACKEND_PORT}"
        
        # Set flag for custom domain mode
        USE_CUSTOM_DOMAIN=true
        CUSTOM_DOMAIN_HOST="api.pingdemo.com"
        
        # Create .env.local with default domain
        create_default_env_file "$default_domain"
        
        return 0
    fi
    
    # Default to localhost
    FRONTEND_URL="https://localhost:${FRONTEND_PORT}"
    BACKEND_URL="https://localhost:${BACKEND_PORT}"
    USE_CUSTOM_DOMAIN=false
    CUSTOM_DOMAIN_HOST="localhost"
    
    return 1
}

# Function to create default .env.local file
create_default_env_file() {
    local domain="$1"
    local clean_domain=$(echo "$domain" | sed 's|^https\?://||')
    
    cat > .env.local << EOF
# Custom Domain Configuration
# Generated automatically by MasterFlow API startup script
# Date: $(date -Iseconds)

# Frontend Configuration
VITE_APP_DOMAIN=$domain
PINGONE_APP_DOMAIN=$domain

# Dev Server Configuration
PINGONE_DEV_SERVER_PORT=3000
PINGONE_DEV_SERVER_HTTPS=true

# Backend Configuration
FRONTEND_URL=$domain:3000
BACKEND_URL=$domain:3001

# CORS Configuration
FRONTEND_DOMAIN=$domain:3000

# API Configuration
PINGONE_API_URL=https://api.pingone.com

# Custom Domain Mode
USE_CUSTOM_DOMAIN=true
EOF
    
    print_info "Created .env.local with default domain: $domain"
}

# Initialize configuration
read_custom_domain

# Custom Domain Setup Functions
clear_domain_setup() {
    print_status "🧹 Clearing Existing Domain Setup"
    
    local cleared=false
    
    # Clear .env.local file
    if [ -f ".env.local" ]; then
        print_info "Removing .env.local file..."
        rm .env.local
        cleared=true
    fi
    
    # Get current domain from .env.local if it exists (before removal)
    local current_domain=""
    if [ -f ".env.local" ] 2>/dev/null; then
        current_domain=$(grep "^VITE_APP_DOMAIN=" ".env.local" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'" | sed 's|^https\?://||')
    fi
    
    # Clear SSL certificates for current domain
    if [ -n "$current_domain" ]; then
        local key_file="${current_domain}.key"
        local cert_file="${current_domain}.crt"
        
        if [ -f "$key_file" ]; then
            print_info "Removing SSL key file: $key_file"
            rm "$key_file"
            cleared=true
        fi
        
        if [ -f "$cert_file" ]; then
            print_info "Removing SSL certificate file: $cert_file"
            rm "$cert_file"
            cleared=true
        fi
        
        # Remove backup files
        if [ -f "${key_file}.backup" ]; then
            print_info "Removing SSL key backup: ${key_file}.backup"
            rm "${key_file}.backup"
            cleared=true
        fi
        
        if [ -f "${cert_file}.backup" ]; then
            print_info "Removing SSL certificate backup: ${cert_file}.backup"
            rm "${cert_file}.backup"
            cleared=true
        fi
    fi
    
    # Clear any other certificate files (common names)
    for cert_file in *.crt; do
        if [ -f "$cert_file" ]; then
            print_info "Removing certificate file: $cert_file"
            rm "$cert_file"
            cleared=true
        fi
    done
    
    for key_file in *.key; do
        if [ -f "$key_file" ]; then
            print_info "Removing key file: $key_file"
            rm "$key_file"
            cleared=true
        fi
    done
    
    if [ "$cleared" = true ]; then
        print_success "Domain setup cleared successfully"
    else
        print_info "No existing domain setup found to clear"
    fi
}

setup_custom_domain() {
    show_setup_banner
    
    if [ "$SKIP_SETUP" = true ]; then
        print_info "📋 Skipping custom domain setup (already configured)"
        return 0  # This should continue to server startup, not exit
    fi
    
    print_status "🌐 Custom Domain Setup"
    print_info "This will configure your custom domain for MasterFlow API"
    
    # Check if existing domain setup exists
    local existing_setup=false
    if [ -f ".env.local" ] || [ -f "*.crt" ] || [ -f "*.key" ]; then
        existing_setup=true
    fi
    
    # If existing setup found, ask if user wants to clear it
    if [ "$existing_setup" = true ] && [ "$QUICK_MODE" = false ]; then
        print_warning "Existing domain setup detected"
        print_info "Found: .env.local file and/or SSL certificates"
        
        local clear_setup=$(prompt "Clear existing domain setup before configuring new domain? (y/N)")
        
        if [[ "$clear_setup" =~ ^[Yy]$ ]]; then
            clear_domain_setup
        else
            print_info "Keeping existing domain setup"
            print_warning "Note: This may cause conflicts if changing domains"
        fi
    fi
    
    # Get domain from user
    local domain_input
    local default_domain="api.pingdemo.com"
    
    if [ "$QUICK_MODE" = false ]; then
        while true; do
            domain_input=$(prompt "Enter your custom domain (default: $default_domain)")
            
            # Use default if user just presses Enter
            if [ -z "$domain_input" ]; then
                domain_input="$default_domain"
                print_info "Using default domain: $domain_input"
            fi
            
            # Validate domain
            if validate_domain "$domain_input"; then
                break
            else
                print_error "Invalid domain format. Domain must be in format: xxx.xxxxxx.xxx"
                print_error "Examples: auth.pingdemo.com, api.myapp.com, app.example.org"
                print_error "Requirements: 2+ characters for subdomain and domain, 2-10 letters for TLD"
            fi
        done
    else
        domain_input="$default_domain"
        print_info "Quick mode: Using default domain: $domain_input"
    fi
    
    local domain=$(echo "$domain_input" | sed 's|^https\?://||')
    local clean_domain_for_files="$domain"
    
    print_success "Domain validated: $domain"
    
    # Configure hosts file automatically
    if ! configure_hosts_file "$domain"; then
        print_error "Hosts file configuration failed"
        print_info "Please configure your hosts file manually and try again"
        return 1
    fi
    
    # Generate SSL certificates automatically
    if ! generate_ssl_certificates "$clean_domain_for_files"; then
        print_error "SSL certificate generation failed"
        print_info "Please ensure OpenSSL is installed and try again"
        return 1
    fi
    
    # Verify SSL certificates
    if ! verify_ssl_certificates "$clean_domain_for_files"; then
        print_warning "SSL certificate verification failed"
        print_info "You may encounter SSL certificate errors"
    fi
    
    # Configure browser trust (macOS only)
    configure_browser_trust "$clean_domain_for_files" || true
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        create_default_env_file "$domain"
    fi
    
    print_success "Custom domain setup completed successfully!"
    return 0
}

show_setup_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                    🌐 Custom Domain Setup Utility 🌐                        ║"
    echo "║                    Interactive Configuration Tool                           ║"
    echo "║                                                                              ║"
    echo "║  This script will:                                                          ║"
    echo "║  1. Prompt for your custom domain (default: auth.pingdemo.com)             ║"
    echo "║  2. Validate domain format and accessibility                               ║"
    echo "║  3. Generate .env.local with all environment variables                      ║"
    echo "║  4. Configure hosts file automatically                                      ║"
    echo "║  5. Generate SSL certificates automatically                                 ║"
    echo "║  6. Configure browser trust (macOS)                                         ║"
    echo "║  7. Provide step-by-step setup instructions                                 ║"
    echo "║  8. Show verification commands and troubleshooting tips                     ║"
    echo "║                                                                              ║"
    echo "║  🔧 OpenSSL Commands That Will Be Run:                                     ║"
    echo "║  • openssl req -x509 -nodes -days 365 -newkey rsa:2048                     ║"
    echo "║    -keyout DOMAIN.key -out DOMAIN.crt                                     ║"
    echo "║    -subj \"/C=US/ST=State/L/City/O=Development/CN=DOMAIN\"                ║"
    echo "║  • openssl x509 -in DOMAIN.crt -noout -subject -dates                       ║"
    echo "║  • security add-trusted-cert (macOS browser trust)                          ║"
    echo "║                                                                              ║"
    echo "║  🖥️  Hosts File Commands That Will Be Run:                                 ║"
    echo "║  • sudo sh -c 'echo \"127.0.0.1 DOMAIN\" >> /etc/hosts'                    ║"
    echo "║  • sudo sh -c 'echo \"::1 DOMAIN\" >> /etc/hosts'                          ║"
    echo "║  (Windows: Manual edit of C:\\Windows\\System32\\drivers\\etc\\hosts)      ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

validate_domain() {
    local domain="$1"
    
    # Remove protocol if present
    local clean_domain=$(echo "$domain" | sed 's|^https\?://||')
    
    # Count the number of parts (dots)
    local dot_count=$(echo "$clean_domain" | tr -cd '.' | wc -c)
    
    # Must have exactly 2 dots (3 parts: subdomain.domain.tld)
    if [ "$dot_count" -ne 2 ]; then
        return 1
    fi
    
    # Extract parts
    local subdomain=$(echo "$clean_domain" | cut -d. -f1)
    local domain_part=$(echo "$clean_domain" | cut -d. -f2)
    local tld=$(echo "$clean_domain" | cut -d. -f3)
    
    # Validate each part
    # Subdomain: 2+ chars, alphanumeric and hyphens, starts and ends with alphanumeric
    if ! echo "$subdomain" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9-]{1,}[a-zA-Z0-9]$'; then
        return 1
    fi
    
    # Domain: 2+ chars, alphanumeric and hyphens, starts and ends with alphanumeric
    if ! echo "$domain_part" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9-]{1,}[a-zA-Z0-9]$'; then
        return 1
    fi
    
    # TLD: 2-10 chars, letters only
    if ! echo "$tld" | grep -qE '^[a-zA-Z]{2,10}$'; then
        return 1
    fi
    
    return 0
}

prompt() {
    local question="$1"
    local default="$2"
    local response
    
    if [ -n "$default" ]; then
        echo -e "${CYAN}${question} [${default}]${NC}" >&2
        read -r response
        echo "${response:-$default}"
    else
        echo -e "${CYAN}${question}${NC}" >&2
        read -r response
        echo "$response"
    fi
}

detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

configure_hosts_file() {
    local domain="$1"
    local clean_domain=$(echo "$domain" | sed 's|^https\?://||')
    local os=$(detect_os)
    
    print_status "🔧 Configuring Hosts File"
    print_info "Detected OS: $os"
    print_info "Domain: $clean_domain"
    
    case "$os" in
        "macos"|"linux")
            print_info "Configuring hosts file for Unix-based system..."
            
            # Check if entry already exists
            if grep -q "$clean_domain" /etc/hosts 2>/dev/null; then
                print_warning "Domain $clean_domain already exists in /etc/hosts"
                if [ "$QUICK_MODE" = false ]; then
                    local update=$(prompt "Update existing entry? (y/N)")
                    
                    if [[ "$update" =~ ^[Yy]$ ]]; then
                        # Remove existing entries
                        sudo sed -i.bak "/$clean_domain/d" /etc/hosts
                        print_success "Removed existing entries for $clean_domain"
                    else
                        print_info "Skipping hosts file configuration"
                        return 0
                    fi
                else
                    print_info "Quick mode: Skipping hosts file configuration (entry exists)"
                    return 0
                fi
            fi
            
            # Add new entries
            print_info "Adding domain entries to /etc/hosts..."
            if sudo sh -c "echo '127.0.0.1 $clean_domain' >> /etc/hosts" && \
               sudo sh -c "echo '::1 $clean_domain' >> /etc/hosts"; then
                print_success "Hosts file configured successfully"
                print_info "Added entries:"
                print_info "  127.0.0.1 $clean_domain"
                print_info "  ::1 $clean_domain"
            else
                print_error "Failed to configure hosts file"
                print_info "You may need to run these commands manually:"
                print_info "  sudo sh -c 'echo \"127.0.0.1 $clean_domain\" >> /etc/hosts'"
                print_info "  sudo sh -c 'echo \"::1 $clean_domain\" >> /etc/hosts'"
                return 1
            fi
            ;;
            
        "windows")
            print_warning "Windows detected - automatic hosts file configuration not supported"
            print_info "Please manually add these entries to C:\\Windows\\System32\\drivers\\etc\\hosts (as Administrator):"
            print_info "  127.0.0.1 $clean_domain"
            print_info "  ::1 $clean_domain"
            
            if [ "$QUICK_MODE" = false ]; then
                local manual=$(prompt "Have you manually added these entries? (y/N)")
                if [[ ! "$manual" =~ ^[Yy]$ ]]; then
                    print_warning "Please add the hosts file entries before continuing"
                    return 1
                fi
            else
                print_warning "Quick mode: Assuming hosts file is configured"
            fi
            ;;
            
        "unknown")
            print_warning "Unknown OS detected - manual configuration required"
            print_info "Please add these entries to your hosts file:"
            print_info "  127.0.0.1 $clean_domain"
            print_info "  ::1 $clean_domain"
            
            if [ "$QUICK_MODE" = false ]; then
                local manual=$(prompt "Have you added these entries? (y/N)")
                if [[ ! "$manual" =~ ^[Yy]$ ]]; then
                    print_warning "Please add the hosts file entries before continuing"
                    return 1
                fi
            else
                print_warning "Quick mode: Assuming hosts file is configured"
            fi
            ;;
    esac
    
    return 0
}

check_openssl() {
    if command -v openssl &> /dev/null; then
        local openssl_version
        if openssl_version=$(openssl version 2>/dev/null); then
            print_success "OpenSSL is available: $openssl_version"
            return 0
        else
            print_warning "OpenSSL command found but version check failed"
            return 1
        fi
    else
        print_warning "OpenSSL is not installed or not in PATH"
        return 1
    fi
}

ensure_openssl() {
    if check_openssl; then
        return 0
    else
        print_warning "OpenSSL is not installed"
        
        if [ "$QUICK_MODE" = false ]; then
            local install=$(prompt "Install OpenSSL automatically? (y/N)")
            
            if [[ "$install" =~ ^[Yy]$ ]]; then
                if install_openssl; then
                    print_success "OpenSSL installation completed"
                    return 0
                else
                    print_error "OpenSSL installation failed"
                    print_info "Please install OpenSSL manually and try again"
                    return 1
                fi
            else
                print_info "Skipping OpenSSL installation"
                print_info "Please install OpenSSL manually and try again"
                return 1
            fi
        else
            print_warning "Quick mode: Please install OpenSSL manually before continuing"
            return 1
        fi
    fi
}

install_openssl() {
    local os=$(detect_os)
    
    print_status "🔧 Installing OpenSSL"
    print_info "Detected OS: $os"
    
    case "$os" in
        "macos")
            print_info "Installing OpenSSL on macOS using Homebrew..."
            
            if command -v brew &> /dev/null; then
                print_info "Homebrew found, installing OpenSSL..."
                if brew install openssl; then
                    print_success "OpenSSL installed successfully via Homebrew"
                    return 0
                else
                    print_error "Failed to install OpenSSL via Homebrew"
                    return 1
                fi
            else
                print_warning "Homebrew not found"
                print_info "Please install Homebrew first:"
                print_info "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                print_info ""
                print_info "Then install OpenSSL:"
                print_info "  brew install openssl"
                return 1
            fi
            ;;
            
        "linux")
            print_info "Installing OpenSSL on Linux..."
            
            if command -v apt-get &> /dev/null; then
                print_info "Using apt-get to install OpenSSL..."
                if sudo apt-get update && sudo apt-get install -y openssl; then
                    print_success "OpenSSL installed successfully via apt-get"
                    return 0
                else
                    print_error "Failed to install OpenSSL via apt-get"
                    return 1
                fi
            elif command -v yum &> /dev/null; then
                print_info "Using yum to install OpenSSL..."
                if sudo yum install -y openssl; then
                    print_success "OpenSSL installed successfully via yum"
                    return 0
                else
                    print_error "Failed to install OpenSSL via yum"
                    return 1
                fi
            elif command -v dnf &> /dev/null; then
                print_info "Using dnf to install OpenSSL..."
                if sudo dnf install -y openssl; then
                    print_success "OpenSSL installed successfully via dnf"
                    return 0
                else
                    print_error "Failed to install OpenSSL via dnf"
                    return 1
                fi
            else
                print_warning "No supported package manager found"
                print_info "Please install OpenSSL manually:"
                print_info "  Ubuntu/Debian: sudo apt-get install openssl"
                print_info "  CentOS/RHEL: sudo yum install openssl"
                print_info "  Fedora: sudo dnf install openssl"
                return 1
            fi
            ;;
            
        "windows")
            print_warning "Windows detected - automatic OpenSSL installation not supported"
            print_info "Please install OpenSSL manually:"
            print_info "  1. Download from: https://slproweb.com/products/Win32OpenSSL.html"
            print_info "  2. Or use Chocolatey: choco install openssl"
            print_info "  3. Or use Scoop: scoop install openssl"
            return 1
            ;;
            
        "unknown")
            print_warning "Unknown OS detected - manual installation required"
            print_info "Please install OpenSSL manually for your operating system"
            return 1
            ;;
    esac
}

generate_ssl_certificates() {
    local clean_domain="$1"
    local key_file="${clean_domain}.key"
    local cert_file="${clean_domain}.crt"
    
    print_status "🔐 Generating SSL Certificates"
    print_info "Domain: $clean_domain"
    print_info "Key file: $key_file"
    print_info "Cert file: $cert_file"
    
    # Ensure OpenSSL is available
    if ! ensure_openssl; then
        print_error "OpenSSL is required for SSL certificate generation"
        print_info "Please install OpenSSL manually and run the setup again"
        return 1
    fi
    
    # Check if certificates already exist
    if [ -f "$key_file" ] && [ -f "$cert_file" ]; then
        print_warning "SSL certificates already exist for $clean_domain"
        if [ "$QUICK_MODE" = false ]; then
            local regenerate=$(prompt "Regenerate certificates? (y/N)")
            
            if [[ ! "$regenerate" =~ ^[Yy]$ ]]; then
                print_info "Using existing certificates"
                return 0
            fi
        else
            print_info "Quick mode: Using existing certificates"
            return 0
        fi
        
        # Backup existing certificates
        cp "$key_file" "${key_file}.backup"
        cp "$cert_file" "${cert_file}.backup"
        print_success "Backed up existing certificates"
    fi
    
    # Generate new certificates
    print_info "Generating self-signed SSL certificates..."
    
    # Show the OpenSSL command for debugging
    print_info "Running: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $key_file -out $cert_file -subj \"/C=US/ST=State/L/City/O=Development/CN=${clean_domain}\""
    
    # Try to generate certificates with better error handling
    local openssl_output
    if openssl_output=$(openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$key_file" \
        -out "$cert_file" \
        -subj "/C=US/ST=State/L/City/O=Development/CN=${clean_domain}" 2>&1); then
        
        print_success "SSL certificates generated successfully"
        print_info "Generated files:"
        print_info "  Private key: $key_file"
        print_info "  Certificate: $cert_file"
        
        # Verify the files were created
        if [ -f "$key_file" ] && [ -f "$cert_file" ]; then
            # Set appropriate permissions
            chmod 600 "$key_file"
            chmod 644 "$cert_file"
            
            # Show certificate details
            print_info "Certificate details:"
            openssl x509 -in "$cert_file" -noout -subject -dates 2>/dev/null || print_warning "Could not read certificate details"
            
            return 0
        else
            print_error "Certificate files were not created properly"
            print_info "Expected files: $key_file, $cert_file"
            return 1
        fi
    else
        print_error "Failed to generate SSL certificates"
        print_error "OpenSSL error output:"
        print_error "$openssl_output"
        
        # Provide troubleshooting help
        print_info "Troubleshooting steps:"
        print_info "1. Verify OpenSSL is installed: openssl version"
        print_info "2. Check directory permissions: ls -la"
        print_info "3. Try manual command:"
        print_info "   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout $key_file -out $cert_file -subj \"/C=US/ST=State/L/City/O=Development/CN=${clean_domain}\""
        
        return 1
    fi
}

verify_ssl_certificates() {
    local clean_domain="$1"
    local key_file="${clean_domain}.key"
    local cert_file="${clean_domain}.crt"
    
    print_status "🔍 Verifying SSL Certificates"
    
    if [ ! -f "$key_file" ] || [ ! -f "$cert_file" ]; then
        print_error "SSL certificate files not found"
        print_info "Expected files:"
        print_info "  $key_file"
        print_info "  $cert_file"
        return 1
    fi
    
    # Verify certificate matches domain
    local cert_domain=$(openssl x509 -in "$cert_file" -noout -subject | grep -o 'CN=[^,]*' | cut -d'=' -f2)
    
    if [ "$cert_domain" = "$clean_domain" ]; then
        print_success "SSL certificates verified successfully"
        print_info "Certificate domain: $cert_domain"
        return 0
    else
        print_warning "Certificate domain mismatch"
        print_info "Expected: $clean_domain"
        print_info "Found: $cert_domain"
        return 1
    fi
}

configure_browser_trust() {
    local clean_domain="$1"
    local cert_file="${clean_domain}.crt"
    local os=$(detect_os)
    
    if [ "$os" = "macos" ] && [ -f "$cert_file" ]; then
        print_status "🌐 Configuring Browser Trust (macOS)"
        
        print_info "Attempting to add certificate to macOS Keychain..."
        
        # Try to add certificate to System keychain
        if security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$cert_file" 2>/dev/null; then
            print_success "Certificate added to System Keychain"
            print_info "Browser should now trust the certificate"
            return 0
        else
            print_warning "Could not automatically add certificate to System Keychain"
            print_info "You may need to manually trust the certificate in your browser"
            return 1
        fi
    fi
    
    return 0
}

# PID files for process management
FRONTEND_PID_FILE=".frontend.pid"
BACKEND_PID_FILE=".backend.pid"

# Status tracking
FRONTEND_STATUS="unknown"
BACKEND_STATUS="unknown"
OVERALL_STATUS="unknown"

# Function to find and change to the MasterFlow API directory
find_project_directory() {
    # If in quick mode, assume current directory is correct
    if [ "$QUICK_MODE" = true ]; then
        if [ -f "package.json" ] && [ -f "server.js" ]; then
            print_success "Quick mode: Using current directory: $(pwd)"
            return 0
        else
            print_error "Quick mode: Not in MasterFlow API directory (missing package.json or server.js)"
            exit 1
        fi
    fi
    
    print_status "🔍 Locating MasterFlow API project directory..."
    
    # Check if we're already in the right directory
    if [ -f "package.json" ] && [ -f "server.js" ] && (grep -q "masterflow-api" package.json 2>/dev/null || grep -q "oauth-playground" package.json 2>/dev/null); then
        print_success "Already in MasterFlow API directory: $(pwd)"
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
    
    print_info "Searching common locations for MasterFlow API..."
    
    for path in "${common_paths[@]}"; do
        # Expand tilde
        expanded_path="${path/#\~/$HOME}"
        
        if [ -d "$expanded_path" ]; then
            cd "$expanded_path" 2>/dev/null || continue
            
            if [ -f "package.json" ] && [ -f "server.js" ] && (grep -q "masterflow-api" package.json 2>/dev/null || grep -q "oauth-playground" package.json 2>/dev/null); then
                print_success "Found MasterFlow API at: $(pwd)"
                return 0
            fi
        fi
    done
    
    # If not found and not in quick mode, ask user for path
    if [ "$QUICK_MODE" != true ]; then
        print_warning "MasterFlow API directory not found in common locations."
        echo ""
        echo -e "${YELLOW}Please provide the path to your MasterFlow API directory:${NC}"
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
                print_info "This doesn't appear to be the MasterFlow API directory"
                continue
            fi
            
            if [ ! -f "server.js" ]; then
                print_error "server.js not found in: $expanded_path"
                print_info "This doesn't appear to be the MasterFlow API directory"
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
        print_error "Quick mode: MasterFlow API directory not found"
        exit 1
    fi
}

# Function to display banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                    🔄 MasterFlow API Server Restart 🔄                       ║"
    echo "║                                                                              ║"
    echo "║  Frontend: ${CYAN}$FRONTEND_URL${NC}${PURPLE}"
    echo "║  Backend:  ${CYAN}$BACKEND_URL${NC}${PURPLE}"
    echo "║  Server Log: ${YELLOW}server.log (default)${NC}${PURPLE}"
    echo "║                                                                              ║"
    echo "║  🌐 Custom Domain Support Available:                                         ║"
    echo "║     • Setup: ./setup-custom-domain.sh                                        ║"
    echo "║     • Run:   ./run-custom-domain.sh                                          ║"
    echo "║                                                                              ║"
    echo "║  ${YELLOW}📋 Server logs available in: server.log (tail -f server.log)${NC}${PURPLE}"
    echo "║  This script will:                                                          ║"
    echo "║  1. Find and change to MasterFlow API directory                           ║"
    echo "║  2. Kill all existing servers                                               ║"
    echo "║  3. Clean up processes and ports 3000 & 3001                              ║"
    echo "║  4. Clear Vite cache and build artifacts                                    ║"
    echo "║  5. Restart both servers                                                   ║"
    echo "║  6. Check for errors and report status                                      ║"
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
        # Silent skip - no lockdown manifest found
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

# Function to start backend server
start_backend() {
    print_status "🚀 Starting backend server..."
    
    # Verify port is free
    if check_port $BACKEND_PORT; then
        print_error "Port $BACKEND_PORT is still in use after cleanup"
        BACKEND_STATUS="failed"
        return 1
    fi
    
    # Start backend server (HTTPS only)
    print_info "Starting backend server on port $BACKEND_PORT (HTTPS)..."
    print_info "📋 Server logs: server.log (default) - Use 'tail -f server.log' to follow"
    BACKEND_PORT=3001 node server.js > server.log 2>&1 &
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
            print_error "Check server.log for details:"
            tail -10 server.log 2>/dev/null || echo "No log file found"
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
    print_error "Check server.log for details:"
    tail -10 server.log 2>/dev/null || echo "No log file found"
    
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
    echo -e "${CYAN}║${NC} Backend Server:"
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
        echo -e "${CYAN}║${NC} ${GREEN}✅ MasterFlow API is ready to use!${NC}"
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
        echo -e "${CYAN}║${NC} ${RED}❌ MasterFlow API is not accessible${NC}"
        echo -e "${CYAN}║${NC} ${RED}❌ Check the logs above for error details${NC}"
    fi
    
    echo -e "${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} Log Files:"
    echo -e "${CYAN}║${NC}   Backend:        ${YELLOW}server.log (default)${NC}"
    echo -e "${CYAN}║${NC}   Frontend:       frontend.log"
    echo -e "${CYAN}║${NC}   Server:         logs/server.log"
    echo -e "${CYAN}║${NC}   PingOne API:    ${GREEN}logs/pingone-api.log${NC} ${YELLOW}(NEW - all PingOne API calls)${NC}"
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
    echo -e "${banner_color}║                    ${status_icon} MASTERFLOW API STATUS ${status_icon}                    ║${NC}"
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
            echo -e "${banner_color}║${NC} ${GREEN}🎉 SUCCESS: MasterFlow API is fully operational!${NC}"
            echo -e "${banner_color}║${NC} ${GREEN}🌐 Ready to use at: $FRONTEND_URL${NC}"
            echo -e "${banner_color}║${NC} ${GREEN}🔧 Backend API available at: $BACKEND_URL${NC}"
            ;;
        "partial")
            echo -e "${banner_color}║${NC} ${YELLOW}⚠️  PARTIAL SUCCESS: Check server status above${NC}"
            echo -e "${banner_color}║${NC} ${YELLOW}🔍 Review logs for troubleshooting information${NC}"
            ;;
        "failure")
            echo -e "${banner_color}║${NC} ${RED}❌ FAILURE: Servers failed to start${NC}"
            echo -e "${banner_color}║${NC} ${RED}🔍 Check server.log and frontend.log for details${NC}"
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
    echo -e "${banner_color}║${NC} ${CYAN}   tail -f logs/pingone-api.log${NC}"
    echo -e "${banner_color}║${NC} ${CYAN}   tail -n 200 logs/pingone-api.log${NC}"
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
            echo "║                    🔄 MasterFlow API Server Restart 🔄                       ║"
            echo "║                      Comprehensive Development Server Manager                    ║"
            echo "╚══════════════════════════════════════════════════════════════════════════════╝"
            echo ""
            echo "📋 OVERVIEW:"
            echo "  This is the primary server management script for the MasterFlow API application."
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
            echo "  Frontend: https://localhost:${FRONTEND_PORT}    (Vite dev server with HMR)"
            echo "  Backend:  https://localhost:${BACKEND_PORT}  (Express API with SSL)"
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
            echo "        • Assumes current directory is the MasterFlow API"
            echo "        • Skips directory selection prompts"
            echo "        • Skips confirmation prompts"
            echo "        • Skips log tail prompts"
            echo "        • Auto-accepts all default choices"
            echo "        • Ideal for automated scripts and CI/CD"
            echo ""
            echo "    -default"
            echo "        Default mode: Use defaults without prompting"
            echo "        • Runs all normal startup steps including checks"
            echo "        • Skips custom domain setup (assumes already configured)"
            echo "        • Auto-accepts directory selection (uses current)"
            echo "        • Auto-accepts confirmation prompts"
            echo "        • Auto-accepts database recreation prompts"
            echo "        • Auto-chooses lockdown restore option 1"
            echo "        • Automatically tails pingone-api.log (default log)"
            echo "        • No user interaction required"
            echo "        • Ideal for daily development after initial setup"
            echo ""
            echo "🔧 DEFAULT BEHAVIOR (no flags):"
            echo "  1️⃣  DIRECTORY DISCOVERY:"
            echo "      • Searches common MasterFlow API locations"
            echo "      • Falls back to interactive prompt if not found"
            echo "      • Validates directory contains required files"
            echo ""
            echo "  2️⃣  REQUIREMENT VALIDATION:"
            echo "      • Checks Node.js, npm, curl availability"
            echo "      • Validates package.json and server.js exist"
            echo "      • Verifies SQLite3 is available"
            echo ""
            echo "  3️⃣  CUSTOM DOMAIN SETUP:"
            echo "      • Prompts for custom domain (default: auth.pingdemo.com)"
            echo "      • Validates domain format (xxx.xxxxxx.xxx)"
            echo "      • Detects existing domain setup and offers to clear it"
            echo "      • Configures hosts file automatically"
            echo "      • Generates SSL certificates for HTTPS"
            echo "      • Configures browser trust (macOS)"
            echo "      • Creates .env.local with domain configuration"
            echo "      • Skipped when using -default flag"
            echo "      • Clear option removes .env.local, SSL certs, and backup files"
            echo ""
            echo "  4️⃣  LOCKDOWN INTEGRITY CHECKS:"
            echo "      • SMS lockdown verification (verify:sms-lockdown)"
            echo "      • Email lockdown verification (verify:email-lockdown)"
            echo "      • WhatsApp lockdown verification (verify:whatsapp-lockdown)"
            echo "      • Prompts for action if drift is detected"
            echo ""
            echo "  5️⃣  SERVER MANAGEMENT:"
            echo "      • Gracefully kills existing servers"
            echo "      • Cleans up processes and frees ports"
            echo "      • Clears Vite cache and build artifacts"
            echo "      • Starts backend HTTPS server"
            echo "      • Starts frontend Vite development server"
            echo ""
            echo "  6️⃣  HEALTH VERIFICATION:"
            echo "      • Checks server accessibility"
            echo "      • Validates API endpoints are responding"
            echo "      • Verifies SSL certificate functionality"
            echo ""
            echo "  7️⃣  STATUS REPORTING:"
            echo "      • Prints comprehensive status report"
            echo "      • Shows server URLs and health status"
            echo "      • Displays log file locations"
            echo "      • Provides quick tail command examples"
            echo ""
            echo "  8️⃣  LOG MANAGEMENT (interactive):"
            echo "      • Prompts to tail a log file"
            echo "      • Offers 11 different log file options"
            echo "      • Includes PingOne API logs, flow logs, server logs"
            echo "      • Option to clear log before tailing"
            echo "      • Defaults to Y for both prompts"
            echo ""
            echo "📋 LOG FILE OPTIONS:"
            echo "      1) pingone-api.log     - All PingOne API calls (proxy + direct)"
            echo "      2) real-api.log        - Direct PingOne API calls only"
            echo "      3) server.log          - General server logs"
            echo "      4) sms.log             - SMS flow logs"
            echo "      5) email.log           - Email flow logs"
            echo "      6) whatsapp.log       - WhatsApp flow logs"
            echo "      7) voice.log           - Voice flow logs"
            echo "      8) fido.log            - FIDO2/WebAuthn logs"
            echo "      9) server.log          - Backend application logs (default)"
            echo "     10) frontend.log        - Frontend/Vite logs"
            echo "     11) startup.log         - Script startup logs"
            echo ""
            echo "🎯 USE CASE EXAMPLES:"
            echo "  • Initial setup:         ./run.sh (includes custom domain setup)"
            echo "  • Daily development:     ./run.sh -default (skips setup, uses defaults)"
            echo "  • Change domain:          rm .env.local && ./run.sh"
            echo "  • Help information:      ./run.sh --help, -h, or -help"
            echo "  • Automated scripts:     ./run.sh -quick"
            echo "  • CI/CD pipelines:       ./run.sh -default"
            echo "  • Background monitoring: ./run.sh -default &"
            echo ""
            echo "🌐 DOMAIN MANAGEMENT:"
            echo "  • Clear existing setup:   rm .env.local *.crt *.key"
            echo "  • Change domain:          rm .env.local && ./run.sh"
            echo "  • Keep existing setup:    ./run.sh (answer 'N' to clear prompt)"
            echo "  • Quick domain change:    ./run.sh -quick (uses default domain)"
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
            echo "  • Protect Portal: http://localhost:${FRONTEND_PORT}/protect-portal"
            echo "  • MasterFlow API: http://localhost:${FRONTEND_PORT}"
            echo ""
            echo "🎮 QUICK START:"
            echo "  1. Ensure you're in the MasterFlow API directory"
            echo "  2. For help: ./run.sh -help"
            echo "  3. Run: ./run.sh"
            echo "  4. Wait for servers to start (watch the status report)"
            echo "  5. Open your browser to the provided URLs"
            echo "  6. Start developing!"
            echo ""
            echo "╔══════════════════════════════════════════════════════════════════════════════╗"
            echo "║                    Happy coding with MasterFlow API! 🚀                    ║"
            echo "╚══════════════════════════════════════════════════════════════════════════════╝"
            exit 0
            ;;
        -quick|-quick-quick)
            export QUICK_MODE=true
            export SKIP_SETUP=true
            shift
            ;;
        -default)
            export DEFAULT_MODE=true
            export SKIP_SETUP=true
            # Pass through to main function
            shift
            ;;

        *)
            print_warning "Unknown option: $1 (use --help for usage)"
            shift
            ;;
    esac
done

# Main execution
main() {
    # Check for -quick flag
    QUICK_MODE=false
    DEFAULT_MODE=${DEFAULT_MODE:-false}
    SKIP_SETUP=${SKIP_SETUP:-false}
    while [ $# -gt 0 ]; do
        case "$1" in
            -quick|-quick-quick)
                QUICK_MODE=true
                SKIP_SETUP=true
                export QUICK_MODE
                export SKIP_SETUP
                print_info "🚀 Quick mode enabled - skipping all prompts"
                shift
                ;;
            -default)
                DEFAULT_MODE=true
                SKIP_SETUP=true
                export DEFAULT_MODE
                export SKIP_SETUP
                print_info "📋 Default mode enabled - using defaults and skipping setup"
                shift
                ;;
            *)
                break
                ;;
        esac
    done
    
    show_banner
    
    # Step 0: Find and change to project directory
    find_project_directory
    
    # Step 1: Check requirements
    check_requirements
    
    # Step 1a: Setup custom domain (if needed)
    setup_custom_domain
    
    # Step 1b: Verify lock-down integrity (blocks restart on drift)
    verify_sms_lockdown
    verify_email_lockdown
    verify_whatsapp_lockdown
    
    # Step 2: Kill all existing servers
    kill_all_servers
    
    # Step 3: Start backend (HTTPS server only)
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
            echo "Available log files:"
            echo "  1) pingone-api.log - All PingOne API calls (proxy and direct)"
            echo "  2) real-api.log - Direct PingOne API calls only (no proxy)"
            echo "  3) server.log - Server logs"
            echo ""
            echo "Flow logs:"
            echo "  4) sms.log - SMS flow"
            echo "  5) email.log - Email flow"
            echo "  6) whatsapp.log - WhatsApp flow"
            echo "  7) voice.log - Voice flow"
            echo "  8) fido.log - FIDO2 flow"
            echo ""
            echo "App logs:"
            echo "  9) server.log - Backend log (default)"
            echo "  10) frontend.log - Frontend log"
            echo "  11) startup.log - Startup log"
            echo ""
            echo -n "Enter your choice (1-11, or press Enter for default): "
            read -r log_choice
            
            # Default to option 1 if no choice is made or invalid choice
            if [ -z "$log_choice" ]; then
                log_choice="1"
                print_info "No choice entered, defaulting to option 1 (PingOne API log)"
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
                    LOG_FILE="logs/server.log"
                    LOG_DESCRIPTION="Backend log (default)"
                    ;;
                10)
                    LOG_FILE="logs/frontend.log"
                    LOG_DESCRIPTION="Frontend log"
                    ;;
                11)
                    LOG_FILE="logs/startup.log"
                    LOG_DESCRIPTION="Startup log"
                    ;;
                *)
                    print_warning "Invalid choice '$log_choice'. Defaulting to option 1 (PingOne API log)"
                    LOG_FILE="logs/pingone-api.log"
                    LOG_DESCRIPTION="PingOne API log (all calls)"
                    ;;
            esac
            
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
            echo ""
            tail -f "$LOG_FILE"
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

# Run main function
main "$@"
