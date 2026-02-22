#!/bin/bash

# OpenSSL Debugging Script
# Helps troubleshoot SSL certificate generation issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║                    🔧 OpenSSL Debugging Utility 🔧                           ║"
    echo "║                                                                              ║"
    echo "║  This script helps diagnose SSL certificate generation issues               ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Main debugging function
debug_openssl() {
    print_header
    
    print_status "🔍 Starting OpenSSL diagnostics..."
    
    # 1. Check if OpenSSL command exists
    print_status "1️⃣  Checking OpenSSL command availability..."
    if command -v openssl &> /dev/null; then
        print_success "OpenSSL command found"
        
        # Show version
        local openssl_version=$(openssl version 2>/dev/null || echo "Version check failed")
        print_status "   Version: $openssl_version"
        
        # Show path
        local openssl_path=$(which openssl 2>/dev/null || echo "Path check failed")
        print_status "   Path: $openssl_path"
        
    else
        print_error "OpenSSL command not found"
        print_status "   Install OpenSSL:"
        print_status "   • macOS: brew install openssl"
        print_status "   • Ubuntu/Debian: sudo apt-get install openssl"
        print_status "   • CentOS/RHEL: sudo yum install openssl"
        print_status "   • Windows: Download from https://slproweb.com/products/Win32OpenSSL.html"
        return 1
    fi
    
    echo ""
    
    # 2. Test OpenSSL functionality
    print_status "2️⃣  Testing OpenSSL functionality..."
    
    # Test basic OpenSSL command
    if openssl version > /dev/null 2>&1; then
        print_success "OpenSSL basic functionality test passed"
    else
        print_error "OpenSSL basic functionality test failed"
        return 1
    fi
    
    echo ""
    
    # 3. Check directory permissions
    print_status "3️⃣  Checking directory permissions..."
    
    local current_dir=$(pwd)
    print_status "   Current directory: $current_dir"
    
    if [ -w "$current_dir" ]; then
        print_success "Directory is writable"
    else
        print_error "Directory is not writable"
        print_status "   Fix: chmod u+w $current_dir"
        return 1
    fi
    
    echo ""
    
    # 4. Test SSL certificate generation
    print_status "4️⃣  Testing SSL certificate generation..."
    
    local test_domain="test.local"
    local test_key="${test_domain}.key"
    local test_cert="${test_domain}.crt"
    
    # Clean up any existing test files
    rm -f "$test_key" "$test_cert"
    
    print_status "   Running test SSL generation..."
    
    local openssl_output
    if openssl_output=$(openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$test_key" \
        -out "$test_cert" \
        -subj "/C=US/ST=State/L=City/O=Test/CN=${test_domain}" 2>&1); then
        
        print_success "Test SSL certificate generation successful"
        
        # Check if files were created
        if [ -f "$test_key" ] && [ -f "$test_cert" ]; then
            print_success "Certificate files created successfully"
            
            # Show file sizes
            local key_size=$(stat -f%z "$test_key" 2>/dev/null || stat -c%s "$test_key" 2>/dev/null || echo "Unknown")
            local cert_size=$(stat -f%z "$test_cert" 2>/dev/null || stat -c%s "$test_cert" 2>/dev/null || echo "Unknown")
            
            print_status "   Key file size: $key_size bytes"
            print_status "   Cert file size: $cert_size bytes"
            
            # Show certificate details
            print_status "   Certificate details:"
            openssl x509 -in "$test_cert" -noout -subject -dates 2>/dev/null | while read -r line; do
                print_status "     $line"
            done
            
            # Clean up test files
            rm -f "$test_key" "$test_cert"
            
        else
            print_error "Certificate files were not created"
            return 1
        fi
        
    else
        print_error "Test SSL certificate generation failed"
        print_error "OpenSSL error output:"
        print_error "$openssl_output"
        return 1
    fi
    
    echo ""
    
    # 5. Check for common issues
    print_status "5️⃣  Checking for common issues..."
    
    # Check if running in restricted environment
    if [ -n "$RESTRICTED" ] || [ -n "$SANDBOX" ]; then
        print_warning "Running in restricted environment detected"
    fi
    
    # Check disk space
    local available_space=$(df -k . | awk 'NR==2 {print $4}' 2>/dev/null || echo "Unknown")
    if [ "$available_space" != "Unknown" ] && [ "$available_space" -lt 1024 ]; then
        print_warning "Low disk space: ${available_space}KB available"
    else
        print_success "Sufficient disk space available"
    fi
    
    # Check for OpenSSL configuration issues
    local openssl_conf=${OPENSSL_CONF:-"/etc/ssl/openssl.cnf"}
    if [ -f "$openssl_conf" ]; then
        print_success "OpenSSL configuration found: $openssl_conf"
    else
        print_warning "OpenSSL configuration not found at: $openssl_conf"
    fi
    
    echo ""
    
    # 6. Provide manual test command
    print_status "6️⃣  Manual test command..."
    print_status "   If you want to test manually, run:"
    print_status "   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
    print_status "     -keyout test.key \\"
    print_status "     -out test.crt \\"
    print_status "     -subj \"/C=US/ST=State/L=City/O=Test/CN=test.local\""
    
    echo ""
    print_success "🎉 OpenSSL diagnostics completed successfully!"
    print_status "   If you're still having issues, please share the output above"
    
    return 0
}

# Run the debugging
debug_openssl
