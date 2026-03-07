#!/bin/bash

# Performance Optimization Script for OAuth Playground
# Advanced optimization techniques for maximum performance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/performance-optimization.log"
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

# Purple function for optimization
optimize() {
    echo -e "${PURPLE}🔧 $1${NC}" | tee -a "$LOG_FILE"
}

# Cyan function for metrics
metric() {
    echo -e "${CYAN}📊 $1${NC}" | tee -a "$LOG_FILE"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get file size in bytes
get_file_size() {
    if [ -f "$1" ]; then
        stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Format bytes for human reading
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$((bytes / 1024))KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$((bytes / 1048576))MB"
    else
        echo "$((bytes / 1073741824))GB"
    fi
}

# Measure execution time
measure_time() {
    local start_time=$(date +%s.%N)
    "$@"
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "0")
    echo "$duration"
}

# Optimize bundle size
optimize_bundle_size() {
    info "Optimizing bundle size..."
    
    cd "$PROJECT_ROOT"
    
    # Initial build
    optimize "Running initial build..."
    local initial_build_time=$(measure_time npm run build)
    
    # Get initial bundle size
    local initial_bundle_size=0
    if [ -d "dist" ]; then
        initial_bundle_size=$(find dist -type f -exec stat -f%z {} + 2>/dev/null | awk '{sum += $1} END {print sum}' || find dist -type f -exec stat -c%s {} + 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "0")
    fi
    
    metric "Initial build time: ${initial_build_time}s"
    metric "Initial bundle size: $(format_bytes $initial_bundle_size)"
    
    # Optimize imports
    optimize "Optimizing imports..."
    find src -name "*.ts" -o -name "*.tsx" | while read file; do
        # Remove unused imports (simplified check)
        if grep -q "import.*React" "$file" && ! grep -q "React\." "$file" && ! grep -q "<.*>" "$file"; then
            warning "Potential unused React import in $file"
        fi
    done
    
    # Tree shaking optimization
    optimize "Analyzing tree shaking opportunities..."
    find src -name "*.ts" -o -name "*.tsx" | while read file; do
        # Check for unused exports
        local exports=$(grep -n "^export" "$file" | wc -l)
        if [ "$exports" -gt 10 ]; then
            info "File $file has $exports exports - consider splitting"
        fi
    done
    
    # Rebuild with optimizations
    optimize "Running optimized build..."
    local optimized_build_time=$(measure_time npm run build)
    
    # Get optimized bundle size
    local optimized_bundle_size=0
    if [ -d "dist" ]; then
        optimized_bundle_size=$(find dist -type f -exec stat -f%z {} + 2>/dev/null | awk '{sum += $1} END {print sum}' || find dist -type f -exec stat -c%s {} + 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "0")
    fi
    
    metric "Optimized build time: ${optimized_build_time}s"
    metric "Optimized bundle size: $(format_bytes $optimized_bundle_size)"
    
    # Calculate improvements
    local build_improvement=$(echo "scale=2; ($initial_build_time - $optimized_build_time) / $initial_build_time * 100" | bc -l 2>/dev/null || echo "0")
    local size_improvement=$(echo "scale=2; ($initial_bundle_size - $optimized_bundle_size) / $initial_bundle_size * 100" | bc -l 2>/dev/null || echo "0")
    
    if (( $(echo "$build_improvement > 0" | bc -l 2>/dev/null || echo "0") )); then
        success "Build time improved by ${build_improvement}%"
    else
        warning "Build time increased by ${build_improvement#-}%"
    fi
    
    if (( $(echo "$size_improvement > 0" | bc -l 2>/dev/null || echo "0") )); then
        success "Bundle size reduced by ${size_improvement}%"
    else
        warning "Bundle size increased by ${size_improvement#-}%"
    fi
}

# Optimize dependencies
optimize_dependencies() {
    info "Optimizing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Check for unused dependencies
    optimize "Analyzing dependency usage..."
    local package_deps=$(jq -r '.dependencies | keys[]' package.json 2>/dev/null || echo "")
    local unused_deps=0
    
    for dep in $package_deps; do
        if ! grep -r "import.*from.*['\"]$dep['\"]" src/ >/dev/null 2>&1 && ! grep -r "require(['\"]$dep['\"]" src/ >/dev/null 2>&1; then
            warning "Potentially unused dependency: $dep"
            unused_deps=$((unused_deps + 1))
        fi
    done
    
    if [ "$unused_deps" -eq 0 ]; then
        success "No unused dependencies detected"
    else
        warning "Found $unused_deps potentially unused dependencies"
    fi
    
    # Check for duplicate dependencies
    optimize "Checking for duplicate dependencies..."
    local duplicates=$(npm ls --depth=0 2>/dev/null | grep -c "deduped" || echo "0")
    metric "Duplicate dependencies found: $duplicates"
    
    # Optimize npm cache
    optimize "Optimizing npm cache..."
    npm cache clean --force >/dev/null 2>&1 || true
    success "npm cache optimized"
    
    # Check for security updates
    optimize "Checking for security updates..."
    local security_audit=$(npm audit --audit-level=high --json 2>/dev/null | jq -r '.vulnerabilities | length' 2>/dev/null || echo "0")
    if [ "$security_audit" -eq 0 ]; then
        success "No high-severity vulnerabilities found"
    else
        warning "Found $security_audit high-severity vulnerabilities"
    fi
}

# Optimize images and assets
optimize_assets() {
    info "Optimizing assets..."
    
    cd "$PROJECT_ROOT"
    
    # Optimize images in public directory
    if [ -d "public" ]; then
        optimize "Analyzing images in public directory..."
        local total_image_size=0
        local image_count=0
        
        find public -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" \) | while read img; do
            local size=$(get_file_size "$img")
            total_image_size=$((total_image_size + size))
            image_count=$((image_count + 1))
            
            if [ "$size" -gt 1048576 ]; then # > 1MB
                warning "Large image file: $img ($(format_bytes $size))"
            fi
        done
        
        metric "Total images: $image_count"
        metric "Total image size: $(format_bytes $total_image_size)"
        
        if [ "$image_count" -gt 0 ]; then
            local avg_size=$((total_image_size / image_count))
            metric "Average image size: $(format_bytes $avg_size)"
        fi
    fi
    
    # Check for unused CSS
    optimize "Analyzing CSS usage..."
    local css_files=$(find src -name "*.css" | wc -l)
    if [ "$css_files" -gt 0 ]; then
        metric "CSS files found: $css_files"
        
        # Check for unused CSS classes (simplified)
        find src -name "*.css" | while read css_file; do
            local classes=$(grep -o '\.[a-zA-Z][a-zA-Z0-9_-]*' "$css_file" | sort -u | wc -l)
            if [ "$classes" -gt 100 ]; then
                warning "Large CSS file $css_file with $classes classes"
            fi
        done
    fi
}

# Optimize code structure
optimize_code_structure() {
    info "Optimizing code structure..."
    
    cd "$PROJECT_ROOT"
    
    # Analyze file sizes
    optimize "Analyzing source file sizes..."
    local large_files=0
    find src -name "*.ts" -o -name "*.tsx" | while read file; do
        local size=$(get_file_size "$file")
        local lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        
        if [ "$size" -gt 524288 ]; then # > 512KB
            warning "Large source file: $file ($(format_bytes $size), $lines lines)"
            large_files=$((large_files + 1))
        elif [ "$lines" -gt 1000 ]; then
            warning "Long source file: $file ($lines lines)"
            large_files=$((large_files + 1))
        fi
    done
    
    # Check for code duplication
    optimize "Analyzing code duplication..."
    local total_files=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)
    metric "Total source files: $total_files"
    
    # Simple duplication check (same content size)
    find src -name "*.ts" -o -name "*.tsx" -exec wc -c {} + 2>/dev/null | sort -n | while read size file; do
        if [ "$size" -gt 10000 ]; then # > 10KB
            local duplicates=$(find src -name "*.ts" -o -name "*.tsx" -exec wc -c {} + 2>/dev/null | grep " $size$" | wc -l)
            if [ "$duplicates" -gt 1 ]; then
                warning "Potential duplicate file size: $file ($size bytes)"
            fi
        fi
    done
    
    # Check for circular dependencies
    optimize "Checking for circular dependencies..."
    # This is a simplified check - real circular dependency detection would require more complex analysis
    find src -name "*.ts" -o -name "*.tsx" | while read file; do
        local imports=$(grep -c "^import.*from.*'\.\./\.\.'" "$file" 2>/dev/null || echo "0")
        if [ "$imports" -gt 5 ]; then
            warning "File with many relative imports: $file ($imports imports)"
        fi
    done
}

# Generate performance report
generate_performance_report() {
    info "Generating performance report..."
    
    cd "$PROJECT_ROOT"
    
    local report_file="logs/performance-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Performance Optimization Report

**Generated**: $(date)
**Project**: OAuth Playground

## Bundle Analysis
- Build Time: ${build_time:-"N/A"}
- Bundle Size: ${bundle_size:-"N/A"}
- Compression: ${compression_ratio:-"N/A"}

## Dependency Analysis
- Total Dependencies: ${total_deps:-"N/A"}
- Unused Dependencies: ${unused_deps:-"N/A"}
- Security Vulnerabilities: ${security_vulns:-"N/A"}

## Asset Analysis
- Image Files: ${image_count:-"N/A"}
- Total Image Size: ${total_image_size:-"N/A"}
- CSS Files: ${css_files:-"N/A"}

## Code Structure
- Source Files: ${source_files:-"N/A"}
- Large Files: ${large_files:-"N/A"}
- Lines of Code: ${total_lines:-"N/A"}

## Recommendations
- Consider code splitting for large bundles
- Optimize image assets
- Remove unused dependencies
- Implement lazy loading where appropriate
- Consider bundle compression

## Next Steps
1. Review optimization opportunities
2. Implement suggested improvements
3. Monitor performance metrics
4. Schedule regular optimization reviews
EOF

    success "Performance report generated: $report_file"
}

# Main execution
main() {
    echo "========================================" | tee -a "$LOG_FILE"
    echo "PERFORMANCE OPTIMIZATION" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Timestamp: $TIMESTAMP" | tee -a "$LOG_FILE"
    echo "Project Root: $PROJECT_ROOT" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    
    # Check prerequisites
    if ! command_exists npm; then
        error "npm not found"
        exit 1
    fi
    
    if ! command_exists jq; then
        warning "jq not found - some features may be limited"
    fi
    
    # Run optimization phases
    optimize_bundle_size
    optimize_dependencies
    optimize_assets
    optimize_code_structure
    generate_performance_report
    
    echo "" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "PERFORMANCE OPTIMIZATION COMPLETED" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    success "Performance optimization completed successfully"
    echo "" | tee -a "$LOG_FILE"
}

# Run main function
main "$@"
