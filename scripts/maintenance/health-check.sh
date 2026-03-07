#!/bin/bash

# Health Check Script for OAuth Playground
# Maintains zero-issue status through automated monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/logs"

# Logging function
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Success function
success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

# Warning function
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Error function
error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Info function
info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check build status
check_build() {
    info "Checking build status..."
    
    cd "$PROJECT_ROOT"
    
    if npm run build > /dev/null 2>&1; then
        success "Build successful"
        return 0
    else
        error "Build failed"
        return 1
    fi
}

# Check code quality
check_code_quality() {
    info "Checking code quality..."
    
    cd "$PROJECT_ROOT"
    
    # Run biome check and capture output
    BIOME_OUTPUT=$(npx biome check --max-diagnostics=100 2>&1)
    BIOME_EXIT_CODE=$?
    
    if [ $BIOME_EXIT_CODE -eq 0 ]; then
        success "Code quality check passed"
        return 0
    else
        error "Code quality issues detected"
        echo "$BIOME_OUTPUT" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Check security
check_security() {
    info "Checking security..."
    
    cd "$PROJECT_ROOT"
    
    # Check for security vulnerabilities
    AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1)
    AUDIT_EXIT_CODE=$?
    
    if [ $AUDIT_EXIT_CODE -eq 0 ]; then
        success "Security audit passed"
    else
        warning "Security vulnerabilities found"
        echo "$AUDIT_OUTPUT" | tee -a "$LOG_FILE"
    fi
    
    # Check for security gate violations
    SECURITY_OUTPUT=$(npx biome check --security-only 2>&1)
    SECURITY_EXIT_CODE=$?
    
    if [ $SECURITY_EXIT_CODE -eq 0 ]; then
        success "Security gate check passed"
        return 0
    else
        error "Security gate violations detected"
        echo "$SECURITY_OUTPUT" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Check dependencies
check_dependencies() {
    info "Checking dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Check if node_modules exists and is up to date
    if [ ! -d "node_modules" ]; then
        error "node_modules not found"
        return 1
    fi
    
    # Check package-lock.json consistency
    if npm ci --dry-run > /dev/null 2>&1; then
        success "Dependencies are consistent"
        return 0
    else
        error "Dependency inconsistency detected"
        return 1
    fi
}

# Check tests
check_tests() {
    info "Running tests..."
    
    cd "$PROJECT_ROOT"
    
    if npm test > /dev/null 2>&1; then
        success "Tests passed"
        return 0
    else
        error "Tests failed"
        return 1
    fi
}

# Check performance metrics
check_performance() {
    info "Checking performance metrics..."
    
    cd "$PROJECT_ROOT"
    
    # Check bundle size (if dist exists)
    if [ -d "dist" ]; then
        BUNDLE_SIZE=$(du -sh dist | cut -f1)
        info "Bundle size: $BUNDLE_SIZE"
        
        # Alert if bundle size is too large (>10MB)
        BUNDLE_SIZE_BYTES=$(du -sb dist | cut -f1)
        if [ "$BUNDLE_SIZE_BYTES" -gt 10485760 ]; then
            warning "Bundle size is large: $BUNDLE_SIZE"
        else
            success "Bundle size is acceptable"
        fi
    else
        warning "No dist directory found - run build first"
    fi
    
    return 0
}

# Check git status
check_git_status() {
    info "Checking git status..."
    
    cd "$PROJECT_ROOT"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        warning "Uncommitted changes detected"
        git status --porcelain | tee -a "$LOG_FILE"
    else
        success "Git status is clean"
    fi
    
    return 0
}

# Check environment
check_environment() {
    info "Checking environment..."
    
    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version)
        info "Node.js version: $NODE_VERSION"
    else
        error "Node.js not found"
        return 1
    fi
    
    # Check npm version
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        info "npm version: $NPM_VERSION"
    else
        error "npm not found"
        return 1
    fi
    
    # Check available disk space
    DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}')
    info "Disk usage: $DISK_USAGE"
    
    # Alert if disk usage is high (>90%)
    DISK_USAGE_NUM=$(df . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE_NUM" -gt 90 ]; then
        warning "Disk usage is high: $DISK_USAGE"
    else
        success "Disk usage is acceptable"
    fi
    
    return 0
}

# Generate summary report
generate_summary() {
    local build_status=$1
    local quality_status=$2
    local security_status=$3
    local deps_status=$4
    local tests_status=$5
    local perf_status=$6
    local git_status=$7
    local env_status=$8
    
    echo "" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "HEALTH CHECK SUMMARY" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Build Status: $([ $build_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')" | tee -a "$LOG_FILE"
    echo "Code Quality: $([ $quality_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')" | tee -a "$LOG_FILE"
    echo "Security: $([ $security_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')" | tee -a "$LOG_FILE"
    echo "Dependencies: $([ $deps_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')" | tee -a "$LOG_FILE"
    echo "Tests: $([ $tests_status -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')" | tee -a "$LOG_FILE"
    echo "Performance: $([ $perf_status -eq 0 ] && echo '✅ PASSED' || echo '⚠️ WARNING')" | tee -a "$LOG_FILE"
    echo "Git Status: $([ $git_status -eq 0 ] && echo '✅ CLEAN' || echo '⚠️ CHANGES')" | tee -a "$LOG_FILE"
    echo "Environment: $([ $env_status -eq 0 ] && echo '✅ OK' || echo '❌ ISSUES')" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    
    # Overall status
    local overall_status=0
    [ $build_status -ne 0 ] && overall_status=1
    [ $quality_status -ne 0 ] && overall_status=1
    [ $security_status -ne 0 ] && overall_status=1
    [ $deps_status -ne 0 ] && overall_status=1
    [ $tests_status -ne 0 ] && overall_status=1
    [ $env_status -ne 0 ] && overall_status=1
    
    if [ $overall_status -eq 0 ]; then
        echo "OVERALL STATUS: ✅ ALL SYSTEMS HEALTHY" | tee -a "$LOG_FILE"
        success "Health check completed successfully"
    else
        echo "OVERALL STATUS: ❌ ISSUES DETECTED" | tee -a "$LOG_FILE"
        error "Health check completed with issues"
    fi
    
    echo "========================================" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    return $overall_status
}

# Main execution
main() {
    echo "========================================" | tee -a "$LOG_FILE"
    echo "OAUTH PLAYGROUND HEALTH CHECK" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Timestamp: $TIMESTAMP" | tee -a "$LOG_FILE"
    echo "Project Root: $PROJECT_ROOT" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    # Run all checks
    local build_status=0
    local quality_status=0
    local security_status=0
    local deps_status=0
    local tests_status=0
    local perf_status=0
    local git_status=0
    local env_status=0
    
    check_build || build_status=$?
    check_code_quality || quality_status=$?
    check_security || security_status=$?
    check_dependencies || deps_status=$?
    check_tests || tests_status=$?
    check_performance || perf_status=$?
    check_git_status || git_status=$?
    check_environment || env_status=$?
    
    # Generate summary
    generate_summary $build_status $quality_status $security_status $deps_status $tests_status $perf_status $git_status $env_status
    
    # Exit with appropriate code
    if [ $build_status -eq 0 ] && [ $quality_status -eq 0 ] && [ $security_status -eq 0 ] && [ $deps_status -eq 0 ] && [ $tests_status -eq 0 ] && [ $env_status -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
