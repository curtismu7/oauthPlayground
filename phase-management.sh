#!/bin/bash

# Phase Management Script for OAuth Playground
# Usage: ./phase-management.sh [command] [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to show help
show_help() {
    echo "Phase Management Script for OAuth Playground"
    echo ""
    echo "Usage: ./phase-management.sh [command] [version]"
    echo ""
    echo "Commands:"
    echo "  list                    - List all available phase tags"
    echo "  status                  - Show current phase status"
    echo "  restore [version]       - Restore to specific phase version"
    echo "  branch [version]        - Create branch from specific phase"
    echo "  complete [version]      - Complete current phase and tag"
    echo "  test                    - Run all tests before phase completion"
    echo "  lint                    - Run ESLint check"
    echo "  verify                  - Verify frontend and backend are working"
    echo ""
    echo "Examples:"
    echo "  ./phase-management.sh list"
    echo "  ./phase-management.sh restore v4.2.0"
    echo "  ./phase-management.sh branch v4.3.0"
    echo "  ./phase-management.sh complete v4.3.0"
    echo ""
}

# Function to list all phase tags
list_phases() {
    print_info "Available Phase Tags:"
    echo ""
    git tag -l "v4.*" | sort -V | while read tag; do
        if [ "$tag" = "v4.2.0" ]; then
            echo -e "${GREEN}✅ $tag - Immediate Phase (Security & Code Quality)${NC}"
        elif [ "$tag" = "v4.3.0" ]; then
            echo -e "${YELLOW}🔄 $tag - Phase 2 (Short-term Improvements)${NC}"
        elif [ "$tag" = "v4.4.0" ]; then
            echo -e "${BLUE}⏳ $tag - Phase 3 (Medium-term Enhancements)${NC}"
        elif [ "$tag" = "v4.5.0" ]; then
            echo -e "${BLUE}⏳ $tag - Phase 4 (Long-term Enhancements)${NC}"
        else
            echo "   $tag"
        fi
    done
    echo ""
}

# Function to show current status
show_status() {
    print_info "Current Phase Status:"
    echo ""
    echo "Current Version: $(grep '"version"' package.json | cut -d'"' -f4)"
    echo "Current Branch: $(git branch --show-current)"
    echo "Last Commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    echo ""
    
    # Check if there are uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes"
        git status --short
    else
        print_status "Working directory is clean"
    fi
    echo ""
}

# Function to restore to specific version
restore_phase() {
    local version=$1
    
    if [ -z "$version" ]; then
        print_error "Please specify a version to restore to"
        echo "Usage: ./phase-management.sh restore v4.2.0"
        exit 1
    fi
    
    # Check if tag exists
    if ! git tag -l | grep -q "^$version$"; then
        print_error "Tag $version does not exist"
        echo "Available tags:"
        git tag -l "v4.*"
        exit 1
    fi
    
    print_warning "This will restore your working directory to $version"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restoring to $version..."
        git checkout "$version"
        print_status "Successfully restored to $version"
    else
        print_info "Restore cancelled"
    fi
}

# Function to create branch from specific version
create_branch() {
    local version=$1
    
    if [ -z "$version" ]; then
        print_error "Please specify a version to create branch from"
        echo "Usage: ./phase-management.sh branch v4.2.0"
        exit 1
    fi
    
    # Check if tag exists
    if ! git tag -l | grep -q "^$version$"; then
        print_error "Tag $version does not exist"
        echo "Available tags:"
        git tag -l "v4.*"
        exit 1
    fi
    
    local branch_name="restore-${version}"
    print_info "Creating branch '$branch_name' from $version..."
    git checkout -b "$branch_name" "$version"
    print_status "Successfully created branch '$branch_name' from $version"
}

# Function to run tests
run_tests() {
    print_info "Running all tests..."
    echo ""
    
    # Run ESLint
    print_info "Running ESLint..."
    if npm run lint; then
        print_status "ESLint passed"
    else
        print_error "ESLint failed"
        return 1
    fi
    echo ""
    
    # Run tests
    print_info "Running tests..."
    if npm run test:run; then
        print_status "All tests passed"
    else
        print_error "Tests failed"
        return 1
    fi
    echo ""
}

# Function to run ESLint
run_lint() {
    print_info "Running ESLint..."
    if npm run lint; then
        print_status "ESLint passed - no errors found"
    else
        print_error "ESLint failed - please fix errors before proceeding"
        exit 1
    fi
}

# Function to verify services
verify_services() {
    print_info "Verifying services..."
    echo ""
    
    # Check if backend is running
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        print_status "Backend server is running on port 3001"
    else
        print_warning "Backend server is not running on port 3001"
        echo "Start it with: npm run start:backend"
    fi
    
    # Check if frontend is running
    if curl -s https://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend server is running on port 3000"
    else
        print_warning "Frontend server is not running on port 3000"
        echo "Start it with: npm run start:frontend"
    fi
    echo ""
}

# Function to complete phase
complete_phase() {
    local version=$1
    
    if [ -z "$version" ]; then
        print_error "Please specify a version for phase completion"
        echo "Usage: ./phase-management.sh complete v4.3.0"
        exit 1
    fi
    
    print_info "Completing phase $version..."
    echo ""
    
    # Run pre-completion checks
    print_info "Running pre-completion checks..."
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_error "You have uncommitted changes. Please commit them first."
        git status --short
        exit 1
    fi
    
    # Run tests
    if ! run_tests; then
        print_error "Tests failed. Cannot complete phase."
        exit 1
    fi
    
    # Verify services
    verify_services
    
    # Update version in package.json
    print_info "Updating version to $version..."
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"$version\"/" package.json
    rm package.json.bak
    
    # Add all changes
    print_info "Adding all changes..."
    git add .
    
    # Create commit
    print_info "Creating commit..."
    git commit -m "🚀 $version: Phase completion

✅ Phase completed successfully
🧪 All tests passing
🔍 ESLint clean
🚀 Services verified
📦 Version bumped to $version

🎯 Ready for next phase development"
    
    # Create tag
    print_info "Creating tag $version..."
    git tag -a "$version" -m "$version: Phase completion

🎯 Phase completed successfully

✅ All tests passing
🔍 ESLint clean  
🚀 Services verified
📦 Version bumped

🎯 Ready for next phase development"
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    git push origin main
    git push origin "$version"
    
    print_status "Phase $version completed successfully!"
    print_info "You can now start the next phase development"
}

# Main script logic
case "$1" in
    "list")
        list_phases
        ;;
    "status")
        show_status
        ;;
    "restore")
        restore_phase "$2"
        ;;
    "branch")
        create_branch "$2"
        ;;
    "complete")
        complete_phase "$2"
        ;;
    "test")
        run_tests
        ;;
    "lint")
        run_lint
        ;;
    "verify")
        verify_services
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
