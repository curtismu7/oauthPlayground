#!/bin/bash

# Consumer Lending Service Environment Setup Script
# 
# This script helps set up the development environment for the Consumer Lending Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Help function
show_help() {
    cat << EOF
Consumer Lending Service Environment Setup

This script helps you set up the development environment for the Consumer Lending Service.

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help              Show this help message
    -f, --force             Force overwrite existing configuration files
    --skip-deps             Skip dependency installation
    --skip-oauth            Skip OAuth configuration prompts
    --docker-only           Set up for Docker development only

Examples:
    $0                      # Interactive setup
    $0 --force              # Overwrite existing files
    $0 --docker-only        # Docker-only setup

EOF
}

# Parse command line arguments
FORCE=false
SKIP_DEPS=false
SKIP_OAUTH=false
DOCKER_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --skip-oauth)
            SKIP_OAUTH=true
            shift
            ;;
        --docker-only)
            DOCKER_ONLY=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if file exists and handle force flag
check_file_exists() {
    local file="$1"
    local description="$2"
    
    if [[ -f "$file" && "$FORCE" == "false" ]]; then
        log_warning "$description already exists: $file"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    return 0
}

# Check system requirements
check_system_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js found: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [[ $NODE_MAJOR -lt 18 ]]; then
            log_warning "Node.js version 18+ recommended (current: $NODE_VERSION)"
        fi
    else
        log_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm found: $NPM_VERSION"
    else
        log_error "npm not found. Please install npm"
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_success "Docker found: $DOCKER_VERSION"
        
        # Check if Docker is running
        if docker info &> /dev/null; then
            log_success "Docker is running"
        else
            log_warning "Docker is installed but not running"
        fi
    else
        if [[ "$DOCKER_ONLY" == "true" ]]; then
            log_error "Docker not found but --docker-only specified"
            exit 1
        else
            log_warning "Docker not found. Install Docker for containerized development"
        fi
    fi
    
    # Check Docker Compose (optional)
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        log_success "Docker Compose found: $COMPOSE_VERSION"
    else
        if [[ "$DOCKER_ONLY" == "true" ]]; then
            log_error "Docker Compose not found but --docker-only specified"
            exit 1
        else
            log_warning "Docker Compose not found. Install for easy multi-container development"
        fi
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log_warning "curl not found. Some examples may not work"
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        log_warning "jq not found. JSON formatting in examples will not work"
        log_info "Install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    fi
}

# Install dependencies
install_dependencies() {
    if [[ "$SKIP_DEPS" == "true" || "$DOCKER_ONLY" == "true" ]]; then
        log_info "Skipping dependency installation"
        return 0
    fi
    
    log_info "Installing dependencies..."
    
    # Install API server dependencies
    if [[ -d "$PROJECT_ROOT/lending_api_server" ]]; then
        log_info "Installing API server dependencies..."
        cd "$PROJECT_ROOT/lending_api_server"
        npm install
        log_success "API server dependencies installed"
    fi
    
    # Install UI dependencies
    if [[ -d "$PROJECT_ROOT/lending_api_ui" ]]; then
        log_info "Installing UI dependencies..."
        cd "$PROJECT_ROOT/lending_api_ui"
        npm install
        log_success "UI dependencies installed"
    fi
    
    cd "$PROJECT_ROOT"
}

# Generate secure random string
generate_secret() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Prompt for OAuth configuration
configure_oauth() {
    if [[ "$SKIP_OAUTH" == "true" ]]; then
        log_info "Skipping OAuth configuration"
        return 0
    fi
    
    log_info "OAuth Configuration"
    echo "Please provide your OAuth provider details:"
    
    # OAuth Issuer URL
    read -p "OAuth Issuer URL (e.g., https://auth.pingone.com/your-env-id/as): " OAUTH_ISSUER_URL
    if [[ -z "$OAUTH_ISSUER_URL" ]]; then
        OAUTH_ISSUER_URL="https://auth.pingone.com/your-environment-id/as"
        log_warning "Using placeholder OAuth issuer URL"
    fi
    
    # Client ID
    read -p "OAuth Client ID: " OAUTH_CLIENT_ID
    if [[ -z "$OAUTH_CLIENT_ID" ]]; then
        OAUTH_CLIENT_ID="your_lending_client_id"
        log_warning "Using placeholder client ID"
    fi
    
    # Client Secret
    read -s -p "OAuth Client Secret: " OAUTH_CLIENT_SECRET
    echo
    if [[ -z "$OAUTH_CLIENT_SECRET" ]]; then
        OAUTH_CLIENT_SECRET="your_lending_client_secret"
        log_warning "Using placeholder client secret"
    fi
    
    # Generate secure secrets
    SESSION_SECRET=$(generate_secret 64)
    ENCRYPTION_KEY=$(generate_secret 32)
    
    log_success "OAuth configuration collected"
}

# Create API server environment file
create_api_env() {
    local env_file="$PROJECT_ROOT/lending_api_server/.env"
    
    if ! check_file_exists "$env_file" "API server environment file"; then
        return 0
    fi
    
    log_info "Creating API server environment file..."
    
    cat > "$env_file" << EOF
# Server Configuration
PORT=3002
NODE_ENV=development

# OAuth Configuration
OAUTH_ISSUER_URL=$OAUTH_ISSUER_URL
OAUTH_CLIENT_ID=$OAUTH_CLIENT_ID
OAUTH_CLIENT_SECRET=$OAUTH_CLIENT_SECRET

# Security
SESSION_SECRET=$SESSION_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Lending Service Configuration
CREDIT_SCORE_TTL=3600
DEFAULT_CREDIT_LIMIT=5000
MINIMUM_CREDIT_SCORE=600
MAX_CREDIT_LIMIT=50000

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS Configuration
CORS_ORIGIN=http://localhost:3003

# Development Settings
ENABLE_DEBUG_ROUTES=true
MOCK_EXTERNAL_SERVICES=true
EOF
    
    log_success "API server environment file created: $env_file"
}

# Create UI environment file
create_ui_env() {
    local env_file="$PROJECT_ROOT/lending_api_ui/.env"
    
    if ! check_file_exists "$env_file" "UI environment file"; then
        return 0
    fi
    
    log_info "Creating UI environment file..."
    
    cat > "$env_file" << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:3002

# OAuth Configuration
REACT_APP_OAUTH_CLIENT_ID=$OAUTH_CLIENT_ID
REACT_APP_OAUTH_ISSUER_URL=$OAUTH_ISSUER_URL
REACT_APP_OAUTH_REDIRECT_URI=http://localhost:3003/callback

# Application Configuration
REACT_APP_APP_NAME=Consumer Lending Service
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_ADMIN_PANEL=true
REACT_APP_ENABLE_CREDIT_REPORTS=true
REACT_APP_ENABLE_DEBUG_MODE=true

# Development Configuration
GENERATE_SOURCEMAP=true
REACT_APP_DEBUG_MODE=true
EOF
    
    log_success "UI environment file created: $env_file"
}

# Create Docker Compose environment file
create_docker_env() {
    local env_file="$PROJECT_ROOT/.env"
    
    if ! check_file_exists "$env_file" "Docker Compose environment file"; then
        return 0
    fi
    
    log_info "Creating Docker Compose environment file..."
    
    cat > "$env_file" << EOF
# OAuth Configuration
OAUTH_ISSUER_URL=$OAUTH_ISSUER_URL
LENDING_OAUTH_CLIENT_ID=$OAUTH_CLIENT_ID
LENDING_OAUTH_CLIENT_SECRET=$OAUTH_CLIENT_SECRET

# Security
LENDING_SESSION_SECRET=$SESSION_SECRET
LENDING_ENCRYPTION_KEY=$ENCRYPTION_KEY

# Lending Configuration
CREDIT_SCORE_TTL=3600
DEFAULT_CREDIT_LIMIT=5000
MINIMUM_CREDIT_SCORE=600
EOF
    
    log_success "Docker Compose environment file created: $env_file"
}

# Create development scripts
create_dev_scripts() {
    log_info "Creating development scripts..."
    
    # Start development script
    local start_dev_script="$PROJECT_ROOT/start-dev.sh"
    if check_file_exists "$start_dev_script" "Development start script"; then
        cat > "$start_dev_script" << 'EOF'
#!/bin/bash

# Start Consumer Lending Service in development mode

echo "Starting Consumer Lending Service Development Environment..."

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $(jobs -p) 2>/dev/null || true
    exit
}

trap cleanup SIGINT SIGTERM

# Start API server
echo "Starting API server..."
cd lending_api_server
npm run dev &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start UI application
echo "Starting UI application..."
cd ../lending_api_ui
npm start &
UI_PID=$!

echo ""
echo "Services starting..."
echo "API Server: http://localhost:3002"
echo "UI Application: http://localhost:3003"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
EOF
        chmod +x "$start_dev_script"
        log_success "Development start script created: $start_dev_script"
    fi
    
    # Docker development script
    local docker_dev_script="$PROJECT_ROOT/start-docker-dev.sh"
    if check_file_exists "$docker_dev_script" "Docker development script"; then
        cat > "$docker_dev_script" << 'EOF'
#!/bin/bash

# Start Consumer Lending Service with Docker Compose

echo "Starting Consumer Lending Service with Docker..."

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running"
    exit 1
fi

# Start services
docker-compose -f docker-compose.lending.yml up -d

echo ""
echo "Services started successfully!"
echo "API Server: http://localhost:3002"
echo "UI Application: http://localhost:3003"
echo ""
echo "View logs: docker-compose -f docker-compose.lending.yml logs -f"
echo "Stop services: docker-compose -f docker-compose.lending.yml down"
EOF
        chmod +x "$docker_dev_script"
        log_success "Docker development script created: $docker_dev_script"
    fi
}

# Create test data
create_test_data() {
    log_info "Setting up test data..."
    
    # Ensure data directories exist
    mkdir -p "$PROJECT_ROOT/lending_api_server/data/persistent"
    mkdir -p "$PROJECT_ROOT/lending_api_server/logs"
    
    log_success "Test data directories created"
}

# Validate setup
validate_setup() {
    log_info "Validating setup..."
    
    local errors=0
    
    # Check API server setup
    if [[ -f "$PROJECT_ROOT/lending_api_server/.env" ]]; then
        log_success "API server environment file exists"
    else
        log_error "API server environment file missing"
        ((errors++))
    fi
    
    # Check UI setup
    if [[ -f "$PROJECT_ROOT/lending_api_ui/.env" ]]; then
        log_success "UI environment file exists"
    else
        log_error "UI environment file missing"
        ((errors++))
    fi
    
    # Check Docker setup
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        log_success "Docker Compose environment file exists"
    else
        log_warning "Docker Compose environment file missing (Docker deployment won't work)"
    fi
    
    # Check dependencies (if not Docker-only)
    if [[ "$DOCKER_ONLY" == "false" && "$SKIP_DEPS" == "false" ]]; then
        if [[ -d "$PROJECT_ROOT/lending_api_server/node_modules" ]]; then
            log_success "API server dependencies installed"
        else
            log_error "API server dependencies not installed"
            ((errors++))
        fi
        
        if [[ -d "$PROJECT_ROOT/lending_api_ui/node_modules" ]]; then
            log_success "UI dependencies installed"
        else
            log_error "UI dependencies not installed"
            ((errors++))
        fi
    fi
    
    if [[ $errors -gt 0 ]]; then
        log_error "Setup validation failed with $errors errors"
        return 1
    else
        log_success "Setup validation passed"
        return 0
    fi
}

# Show next steps
show_next_steps() {
    log_success "Environment setup completed!"
    echo ""
    log_info "Next Steps:"
    echo ""
    
    if [[ "$DOCKER_ONLY" == "true" ]]; then
        echo "1. Start services with Docker:"
        echo "   ./start-docker-dev.sh"
        echo ""
        echo "2. Or manually:"
        echo "   docker-compose -f docker-compose.lending.yml up -d"
    else
        echo "1. Start development servers:"
        echo "   ./start-dev.sh"
        echo ""
        echo "2. Or start services individually:"
        echo "   # Terminal 1 - API Server"
        echo "   cd lending_api_server && npm run dev"
        echo ""
        echo "   # Terminal 2 - UI Application"
        echo "   cd lending_api_ui && npm start"
        echo ""
        echo "3. Or use Docker:"
        echo "   ./start-docker-dev.sh"
    fi
    
    echo ""
    echo "4. Access the applications:"
    echo "   API Server: http://localhost:3002"
    echo "   UI Application: http://localhost:3003"
    echo "   API Health: http://localhost:3002/api/health"
    echo ""
    echo "5. Test the API:"
    echo "   cd lending_api_server/examples"
    echo "   ./curl-examples.sh health"
    echo ""
    
    if [[ "$OAUTH_CLIENT_ID" == "your_lending_client_id" ]]; then
        log_warning "Remember to update OAuth configuration with real values!"
        echo "Edit the .env files with your actual OAuth provider details."
        echo ""
    fi
    
    log_info "For more information, see:"
    echo "- lending_api_server/README.md"
    echo "- lending_api_ui/README.md"
    echo "- LENDING_SERVICE_README.md"
    echo "- DEPLOYMENT_GUIDE.md"
}

# Main setup function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  Consumer Lending Service Environment Setup"
    echo "=================================================="
    echo -e "${NC}"
    
    check_system_requirements
    
    if [[ "$SKIP_OAUTH" == "false" ]]; then
        configure_oauth
    else
        # Use placeholder values
        OAUTH_ISSUER_URL="https://auth.pingone.com/your-environment-id/as"
        OAUTH_CLIENT_ID="your_lending_client_id"
        OAUTH_CLIENT_SECRET="your_lending_client_secret"
        SESSION_SECRET=$(generate_secret 64)
        ENCRYPTION_KEY=$(generate_secret 32)
    fi
    
    install_dependencies
    create_api_env
    create_ui_env
    create_docker_env
    create_dev_scripts
    create_test_data
    
    if validate_setup; then
        show_next_steps
    else
        log_error "Setup completed with errors. Please review and fix the issues above."
        exit 1
    fi
}

# Run main function
main