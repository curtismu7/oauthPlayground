#!/bin/bash

# OAuth Playground Interactive Startup Script
# Handles credential management, testing, and server startup

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env"
CACHE_FILE=".oauth_cache"
LOG_FILE="logs/startup.log"

# Create logs directory if it doesn't exist
mkdir -p logs

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    echo "[$timestamp] [$level] $message"
}

# Display header
show_header() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           🔐 OAUTH PLAYGROUND 🔐                           ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Secure credential input
secure_input() {
    local prompt="$1"
    local var_name="$2"

    echo -n "$prompt: "
    read -s input
    echo ""
    eval "$var_name=\"$input\""
}

# Validate PingOne environment ID format
validate_env_id() {
    local env_id="$1"
    # PingOne environment IDs are typically UUIDs or specific format
    if [[ $env_id =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Cache credentials securely
cache_credentials() {
    local env_id="$1"
    local client_id="$2"
    local client_secret="$3"

    cat > "$CACHE_FILE" << EOF
# OAuth Playground Credential Cache
# Generated on $(date)
# This file contains cached credentials for faster startup

PINGONE_ENVIRONMENT_ID=$env_id
PINGONE_CLIENT_ID=$client_id
PINGONE_CLIENT_SECRET=$client_secret
EOF

    chmod 600 "$CACHE_FILE"
    log "INFO" "Credentials cached successfully"
}

# Load cached credentials
load_cached_credentials() {
    if [ -f "$CACHE_FILE" ]; then
        echo -e "${BLUE}📂 Found cached credentials${NC}"

        # Source the cached credentials
        source "$CACHE_FILE"

        # Update .env file with cached values
        if [ ! -f "$ENV_FILE" ]; then
            cp .env.example "$ENV_FILE"
        fi

        # Update .env with cached values
        sed -i '' "s/PINGONE_ENVIRONMENT_ID=.*/PINGONE_ENVIRONMENT_ID=$PINGONE_ENVIRONMENT_ID/" "$ENV_FILE"
        sed -i '' "s/PINGONE_CLIENT_ID=.*/PINGONE_CLIENT_ID=$PINGONE_CLIENT_ID/" "$ENV_FILE"
        sed -i '' "s/PINGONE_CLIENT_SECRET=.*/PINGONE_CLIENT_SECRET=$PINGONE_CLIENT_SECRET/" "$ENV_FILE"

        echo -e "${GREEN}✅ Cached credentials loaded${NC}"
        return 0
    fi
    return 1
}

# Check if .env has valid PingOne configuration
check_env_configuration() {
    if [ ! -f "$ENV_FILE" ]; then
        return 1
    fi

    # Check if required variables are set (not placeholder values)
    local env_id=$(grep "PINGONE_ENVIRONMENT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    local client_id=$(grep "PINGONE_CLIENT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    local client_secret=$(grep "PINGONE_CLIENT_SECRET=" "$ENV_FILE" | cut -d'=' -f2)

    if [ "$env_id" = "your-environment-id" ] || [ "$client_id" = "your-client-id" ] || [ "$client_secret" = "your-client-secret" ]; then
        return 1
    fi

    # Validate environment ID format
    if ! validate_env_id "$env_id"; then
        echo -e "${YELLOW}⚠️  Warning: Environment ID format may be invalid${NC}"
    fi

    return 0
}

# Interactive credential input
get_credentials_interactive() {
    echo ""
    echo -e "${CYAN}🔑 PingOne Configuration Required${NC}"
    echo "Please enter your PingOne credentials:"
    echo ""

    # Environment ID
    while true; do
        echo -n "Environment ID (from PingOne Admin Console): "
        read env_id
        if validate_env_id "$env_id"; then
            break
        else
            echo -e "${YELLOW}⚠️  Environment ID should be a valid UUID format${NC}"
        fi
    done

    # Client ID
    echo -n "Client ID: "
    read client_id

    # Client Secret (secure input)
    secure_input "Client Secret" client_secret

    echo ""
    echo -e "${BLUE}💾 Caching credentials for future use...${NC}"
    cache_credentials "$env_id" "$client_id" "$client_secret"

    # Update .env file
    if [ ! -f "$ENV_FILE" ]; then
        cp .env.example "$ENV_FILE"
    fi

    sed -i '' "s/PINGONE_ENVIRONMENT_ID=.*/PINGONE_ENVIRONMENT_ID=$env_id/" "$ENV_FILE"
    sed -i '' "s/PINGONE_CLIENT_ID=.*/PINGONE_CLIENT_ID=$client_id/" "$ENV_FILE"
    sed -i '' "s/PINGONE_CLIENT_SECRET=.*/PINGONE_CLIENT_SECRET=$client_secret/" "$ENV_FILE"

    echo -e "${GREEN}✅ Configuration updated successfully${NC}"
}

# Run comprehensive tests
run_tests() {
    echo ""
    echo -e "${BLUE}🧪 Running Comprehensive Tests...${NC}"

    local test_passed=0
    local test_failed=0

    # Run our test script
    if [ -f "./test-startup.sh" ]; then
        echo "   • Running startup tests..."
        if ./test-startup.sh > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ Startup tests passed${NC}"
            ((test_passed++))
        else
            echo -e "   ${RED}❌ Startup tests failed${NC}"
            ((test_failed++))
        fi
    else
        echo -e "   ${YELLOW}⚠️  Test script not found${NC}"
    fi

    # Check Node.js and npm
    if command_exists node; then
        echo -e "   ${GREEN}✅ Node.js installed${NC}"
        ((test_passed++))
    else
        echo -e "   ${RED}❌ Node.js not found${NC}"
        ((test_failed++))
    fi

    if command_exists npm; then
        echo -e "   ${GREEN}✅ npm installed${NC}"
        ((test_passed++))
    else
        echo -e "   ${RED}❌ npm not found${NC}"
        ((test_failed++))
    fi

    # Check if port 3000 is available
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠️  Port 3000 is already in use${NC}"
    else
        echo -e "   ${GREEN}✅ Port 3000 is available${NC}"
        ((test_passed++))
    fi

    # Summary
    echo ""
    echo -e "${BLUE}📊 Test Summary:${NC}"
    echo -e "   ${GREEN}✅ Passed: $test_passed${NC}"
    if [ $test_failed -gt 0 ]; then
        echo -e "   ${RED}❌ Failed: $test_failed${NC}"
    fi

    if [ $test_failed -eq 0 ]; then
        echo -e "${GREEN}🎉 All critical tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Some tests failed. Please resolve issues before continuing.${NC}"
        return 1
    fi
}

# Main startup process
main() {
    show_header
    log "INFO" "OAuth Playground startup initiated"

    echo -e "${BLUE}🚀 Starting OAuth Playground Setup...${NC}"

    # Step 1: Check configuration
    echo ""
    echo -e "${CYAN}📋 Step 1: Checking Configuration${NC}"

    if check_env_configuration; then
        echo -e "${GREEN}✅ Configuration is valid${NC}"
    else
        echo -e "${YELLOW}⚠️  Configuration incomplete${NC}"

        # Try to load cached credentials
        if ! load_cached_credentials; then
            get_credentials_interactive
        fi
    fi

    # Step 2: Run tests
    echo ""
    echo -e "${CYAN}📋 Step 2: Running Tests${NC}"

    if ! run_tests; then
        echo ""
        echo -e "${RED}❌ Setup failed. Please resolve the issues above.${NC}"
        log "ERROR" "Setup failed due to test failures"
        exit 1
    fi

    # Step 3: Start the application
    echo ""
    echo -e "${CYAN}📋 Step 3: Starting Application${NC}"

    echo -e "${BLUE}🔥 Launching OAuth Playground...${NC}"
    echo ""

    # Display startup information
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                              🎉 READY! 🎉                                 ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    printf "║  🌐 Local URL:   %-55s ║\n" "http://localhost:3000/"
    printf "║  🌍 Network URL: %-55s ║\n" "http://$(hostname -I 2>/dev/null | awk '{print $1}'):$PORT/"
    echo "║                                                                            ║"
    echo "║  📱 Available Features:                                                    ║"
    echo "║     • OAuth 2.0 Authorization Code Flow                                   ║"
    echo "║     • PKCE (Proof Key for Code Exchange)                                  ║"
    echo "║     • JWT Token Inspector                                                 ║"
    echo "║     • Interactive Flow Demonstrations                                     ║"
    echo "║     • Real PingOne Integration                                           ║"
    echo "║                                                                            ║"
    echo "║  🔐 Security Features:                                                     ║"
    echo "║     • Secure by Default (No localStorage)                                 ║"
    echo "║     • Strict Token Validation                                             ║"
    echo "║     • Issuer Validation (Mix-up Attack Prevention)                        ║"
    echo "║     • CSRF Protection                                                     ║"
    echo "║                                                                            ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}🎮 Ready to explore OAuth/OIDC flows!${NC}"
    echo -e "${BLUE}💡 Start with: http://localhost:3000/flows${NC}"
    echo ""
    echo -e "${YELLOW}📝 Press Ctrl+C to stop the server${NC}"
    echo ""

    log "INFO" "OAuth Playground setup completed successfully"

    # Start the development server
    npm run dev
}

# Handle script interruption
trap 'echo ""; echo -e "${YELLOW}🛑 Setup interrupted${NC}"; log "WARN" "Setup interrupted by user"; exit 130' INT

# Run main function
main "$@"
