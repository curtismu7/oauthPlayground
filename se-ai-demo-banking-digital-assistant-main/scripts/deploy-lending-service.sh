#!/bin/bash

# Consumer Lending Service Deployment Script
# 
# This script automates the deployment of the Consumer Lending Service
# for different environments (development, staging, production).

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Help function
show_help() {
    cat << EOF
Consumer Lending Service Deployment Script

Usage: $0 [OPTIONS] ENVIRONMENT

ENVIRONMENT:
    dev         Deploy to development environment
    staging     Deploy to staging environment
    prod        Deploy to production environment
    local       Deploy locally with Docker Compose

OPTIONS:
    -h, --help              Show this help message
    -v, --verbose           Enable verbose output
    -b, --build             Force rebuild of Docker images
    -c, --config FILE       Use custom configuration file
    -t, --tag TAG           Use specific image tag (default: latest)
    --no-backup             Skip backup creation (production only)
    --dry-run               Show what would be done without executing

Examples:
    $0 dev                  # Deploy to development
    $0 prod --build         # Deploy to production with image rebuild
    $0 local --verbose      # Deploy locally with verbose output
    $0 staging --tag v1.2.3 # Deploy specific version to staging

EOF
}

# Parse command line arguments
ENVIRONMENT=""
VERBOSE=false
BUILD=false
CONFIG_FILE=""
IMAGE_TAG="latest"
NO_BACKUP=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --no-backup)
            NO_BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        dev|staging|prod|local)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "Environment is required"
    show_help
    exit 1
fi

# Verbose logging
if [[ "$VERBOSE" == "true" ]]; then
    set -x
fi

# Dry run prefix
DRY_RUN_PREFIX=""
if [[ "$DRY_RUN" == "true" ]]; then
    DRY_RUN_PREFIX="echo [DRY-RUN]"
    log_warning "Running in dry-run mode - no changes will be made"
fi

# Environment-specific configuration
case "$ENVIRONMENT" in
    "dev")
        COMPOSE_FILE="docker-compose.lending.yml"
        ENV_FILE=".env.development"
        BACKUP_REQUIRED=false
        ;;
    "staging")
        COMPOSE_FILE="docker-compose.staging.yml"
        ENV_FILE=".env.staging"
        BACKUP_REQUIRED=true
        ;;
    "prod")
        COMPOSE_FILE="docker-compose.prod.yml"
        ENV_FILE=".env.production"
        BACKUP_REQUIRED=true
        ;;
    "local")
        COMPOSE_FILE="docker-compose.lending.yml"
        ENV_FILE=".env"
        BACKUP_REQUIRED=false
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Use custom config file if provided
if [[ -n "$CONFIG_FILE" ]]; then
    ENV_FILE="$CONFIG_FILE"
fi

log_info "Starting deployment for environment: $ENVIRONMENT"
log_info "Using compose file: $COMPOSE_FILE"
log_info "Using environment file: $ENV_FILE"
log_info "Image tag: $IMAGE_TAG"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if compose file exists
    if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        log_error "Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "You can create it from the example: cp .env.example $ENV_FILE"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Validate configuration
validate_config() {
    log_info "Validating configuration..."
    
    # Check required environment variables
    source "$PROJECT_ROOT/$ENV_FILE"
    
    required_vars=(
        "OAUTH_ISSUER_URL"
        "LENDING_OAUTH_CLIENT_ID"
        "LENDING_OAUTH_CLIENT_SECRET"
        "LENDING_SESSION_SECRET"
        "LENDING_ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Required environment variable not set: $var"
            exit 1
        fi
    done
    
    # Validate OAuth URL format
    if [[ ! "$OAUTH_ISSUER_URL" =~ ^https?:// ]]; then
        log_error "Invalid OAuth issuer URL format: $OAUTH_ISSUER_URL"
        exit 1
    fi
    
    # Check secret lengths
    if [[ ${#LENDING_SESSION_SECRET} -lt 32 ]]; then
        log_error "Session secret must be at least 32 characters long"
        exit 1
    fi
    
    if [[ ${#LENDING_ENCRYPTION_KEY} -lt 32 ]]; then
        log_error "Encryption key must be at least 32 characters long"
        exit 1
    fi
    
    log_success "Configuration validation passed"
}

# Create backup
create_backup() {
    if [[ "$BACKUP_REQUIRED" == "true" && "$NO_BACKUP" == "false" ]]; then
        log_info "Creating backup..."
        
        BACKUP_DIR="$PROJECT_ROOT/backups"
        BACKUP_FILE="$BACKUP_DIR/lending-backup-$TIMESTAMP.tar.gz"
        
        $DRY_RUN_PREFIX mkdir -p "$BACKUP_DIR"
        
        # Backup data and configuration
        $DRY_RUN_PREFIX tar -czf "$BACKUP_FILE" \
            -C "$PROJECT_ROOT" \
            lending_api_server/data/persistent/ \
            lending_api_server/logs/ \
            "$ENV_FILE" \
            2>/dev/null || true
        
        if [[ "$DRY_RUN" == "false" && -f "$BACKUP_FILE" ]]; then
            log_success "Backup created: $BACKUP_FILE"
        else
            log_info "Backup would be created: $BACKUP_FILE"
        fi
    else
        log_info "Skipping backup creation"
    fi
}

# Build Docker images
build_images() {
    if [[ "$BUILD" == "true" ]]; then
        log_info "Building Docker images..."
        
        # Build API server image
        log_info "Building lending API server image..."
        $DRY_RUN_PREFIX docker build \
            -t "lending-api-server:$IMAGE_TAG" \
            "$PROJECT_ROOT/lending_api_server/"
        
        # Build UI application image
        log_info "Building lending UI application image..."
        $DRY_RUN_PREFIX docker build \
            -t "lending-ui:$IMAGE_TAG" \
            "$PROJECT_ROOT/lending_api_ui/"
        
        log_success "Docker images built successfully"
    else
        log_info "Skipping image build (use --build to force rebuild)"
    fi
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for docker-compose
    export IMAGE_TAG="$IMAGE_TAG"
    
    # Stop existing services
    log_info "Stopping existing services..."
    $DRY_RUN_PREFIX docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Pull latest images (if not building locally)
    if [[ "$BUILD" == "false" ]]; then
        log_info "Pulling latest images..."
        $DRY_RUN_PREFIX docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    fi
    
    # Start services
    log_info "Starting services..."
    $DRY_RUN_PREFIX docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    log_success "Services deployed successfully"
}

# Health check
health_check() {
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would perform health check"
        return 0
    fi
    
    log_info "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check API health
    API_URL="http://localhost:3002/api/health"
    for i in {1..30}; do
        if curl -s -f "$API_URL" > /dev/null; then
            log_success "API server is healthy"
            break
        fi
        
        if [[ $i -eq 30 ]]; then
            log_error "API server health check failed"
            return 1
        fi
        
        log_info "Waiting for API server... (attempt $i/30)"
        sleep 2
    done
    
    # Check UI health
    UI_URL="http://localhost:3003/health"
    for i in {1..30}; do
        if curl -s -f "$UI_URL" > /dev/null; then
            log_success "UI application is healthy"
            break
        fi
        
        if [[ $i -eq 30 ]]; then
            log_error "UI application health check failed"
            return 1
        fi
        
        log_info "Waiting for UI application... (attempt $i/30)"
        sleep 2
    done
    
    log_success "All services are healthy"
}

# Show deployment status
show_status() {
    log_info "Deployment status:"
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Would show service status"
        return 0
    fi
    
    # Show running containers
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    # Show service URLs
    echo ""
    log_info "Service URLs:"
    echo "  API Server: http://localhost:3002"
    echo "  UI Application: http://localhost:3003"
    echo "  API Health: http://localhost:3002/api/health"
    echo "  UI Health: http://localhost:3003/health"
}

# Cleanup function
cleanup() {
    if [[ $? -ne 0 ]]; then
        log_error "Deployment failed!"
        
        if [[ "$DRY_RUN" == "false" ]]; then
            log_info "Showing container logs for debugging:"
            cd "$PROJECT_ROOT"
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50
        fi
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment flow
main() {
    log_info "Consumer Lending Service Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $TIMESTAMP"
    echo ""
    
    check_prerequisites
    validate_config
    create_backup
    build_images
    deploy_services
    health_check
    show_status
    
    log_success "Deployment completed successfully!"
    
    if [[ "$ENVIRONMENT" == "prod" ]]; then
        log_warning "Production deployment completed. Please verify all services are working correctly."
        log_info "Monitor logs: docker-compose -f $COMPOSE_FILE logs -f"
    fi
}

# Run main function
main