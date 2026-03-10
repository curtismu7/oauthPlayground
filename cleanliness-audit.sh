#!/bin/bash

# 🧪 Comprehensive Cleanliness Audit Script
# Usage: ./cleanliness-audit.sh

echo "🧪 Running Comprehensive Cleanliness Audit..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create results file
RESULTS_FILE="cleanliness-audit-results-$(date +%Y%m%d-%H%M%S).txt"
echo "Audit Results - $(date)" > "$RESULTS_FILE"
echo "================================" >> "$RESULTS_FILE"

echo ""
echo "${BLUE}📁 1. Checking for potentially unused files...${NC}"
echo "📁 1. Checking for potentially unused files..." >> "$RESULTS_FILE"
echo ""

unused_count=0
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    # Skip test files themselves
    if [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]]; then
        continue
    fi
    
    # Get base filename without extension
    base_name=$(basename "$file" | sed 's/\..*$//')
    
    # Count imports (excluding React imports and relative imports with different patterns)
    import_count=$(grep -r "import.*$base_name" src --include="*.tsx" --include="*.ts" | grep -v "$file" | wc -l)
    
    # Also check for default exports
    default_import_count=$(grep -r "from.*['\"].*$base_name['\"]" src --include="*.tsx" --include="*.ts" | grep -v "$file" | wc -l)
    
    total_imports=$((import_count + default_import_count))
    
    if [ "$total_imports" -eq 0 ]; then
        echo "${YELLOW}⚠️  Potentially unused: $file${NC}"
        echo "⚠️  Potentially unused: $file" >> "$RESULTS_FILE"
        unused_count=$((unused_count + 1))
    fi
done

echo ""
echo "${GREEN}✅ Found $unused_count potentially unused files${NC}"
echo "Found $unused_count potentially unused files" >> "$RESULTS_FILE"

echo ""
echo "${BLUE}📏 2. Analyzing component sizes...${NC}"
echo "📏 2. Analyzing component sizes..." >> "$RESULTS_FILE"
echo ""

echo "Top 10 largest components:"
echo "Top 10 largest components:" >> "$RESULTS_FILE"
find src -name "*.tsx" -exec wc -l {} + | sort -nr | head -10 | while read line; do
    size=$(echo "$line" | awk '{print $1}')
    file=$(echo "$line" | awk '{print $2}')
    
    if [ "$size" -gt 500 ]; then
        echo "${RED}🔴 $size lines: $file${NC}"
        echo "🔴 $size lines: $file" >> "$RESULTS_FILE"
    elif [ "$size" -gt 300 ]; then
        echo "${YELLOW}🟡 $size lines: $file${NC}"
        echo "🟡 $size lines: $file" >> "$RESULTS_FILE"
    else
        echo "${GREEN}🟢 $size lines: $file${NC}"
        echo "🟢 $size lines: $file" >> "$RESULTS_FILE"
    fi
done

echo ""
echo "${BLUE}🔄 3. Checking for duplicate patterns...${NC}"
echo "🔄 3. Checking for duplicate patterns..." >> "$RESULTS_FILE"
echo ""

echo "Top 10 most common styled component patterns:"
echo "Top 10 most common styled component patterns:" >> "$RESULTS_FILE"
grep -r "styled\." src --include="*.tsx" --include="*.ts" | cut -d':' -f2 | sort | uniq -c | sort -nr | head -10 | while read line; do
    count=$(echo "$line" | awk '{print $1}')
    pattern=$(echo "$line" | cut -d' ' -f2-)
    
    if [ "$count" -gt 10 ]; then
        echo "${RED}🔴 Used $count times: $pattern${NC}"
        echo "🔴 Used $count times: $pattern" >> "$RESULTS_FILE"
    elif [ "$count" -gt 5 ]; then
        echo "${YELLOW}🟡 Used $count times: $pattern${NC}"
        echo "🟡 Used $count times: $pattern" >> "$RESULTS_FILE"
    else
        echo "${GREEN}🟢 Used $count times: $pattern${NC}"
        echo "🟢 Used $count times: $pattern" >> "$RESULTS_FILE"
    fi
done

echo ""
echo "${BLUE}📝 4. Checking for console statements...${NC}"
echo "📝 4. Checking for console statements..." >> "$RESULTS_FILE"
echo ""

console_count=$(grep -r "console\." src --include="*.tsx" --include="*.ts" | wc -l)
echo "Found $console_count console statements"

if [ "$console_count" -gt 0 ]; then
    echo "${YELLOW}⚠️  Console statements found (should be removed in production):${NC}"
    echo "⚠️  Console statements found:" >> "$RESULTS_FILE"
    grep -r "console\." src --include="*.tsx" --include="*.ts" | head -10 | while read line; do
        echo "  $line"
        echo "  $line" >> "$RESULTS_FILE"
    done
else
    echo "${GREEN}✅ No console statements found${NC}"
    echo "✅ No console statements found" >> "$RESULTS_FILE"
fi

echo ""
echo "${BLUE}🔍 5. Checking for TODO/FIXME comments...${NC}"
echo "🔍 5. Checking for TODO/FIXME comments..." >> "$RESULTS_FILE"
echo ""

todo_count=$(grep -r "TODO\|FIXME\|XXX\|HACK" src --include="*.tsx" --include="*.ts" | wc -l)
echo "Found $todo_count TODO/FIXME comments"

if [ "$todo_count" -gt 0 ]; then
    echo "${YELLOW}⚠️  TODO/FIXME comments found:${NC}"
    echo "⚠️  TODO/FIXME comments found:" >> "$RESULTS_FILE"
    grep -r "TODO\|FIXME\|XXX\|HACK" src --include="*.tsx" --include="*.ts" | head -10 | while read line; do
        echo "  $line"
        echo "  $line" >> "$RESULTS_FILE"
    done
else
    echo "${GREEN}✅ No TODO/FIXME comments found${NC}"
    echo "✅ No TODO/FIXME comments found" >> "$RESULTS_FILE"
fi

echo ""
echo "${BLUE}📦 6. Checking package.json for unused dependencies...${NC}"
echo "📦 6. Checking package.json for unused dependencies..." >> "$RESULTS_FILE"
echo ""

# Get dependencies from package.json
deps=$(jq -r '.dependencies | keys[]' package.json 2>/dev/null || echo "")
unused_deps=0

for dep in $deps; do
    # Skip if it's a dev dependency or peer dependency
    if jq -e ".devDependencies[\"$dep\"]" package.json >/dev/null 2>&1; then
        continue
    fi
    
    # Check if dependency is used in code
    usage_count=$(grep -r "import.*$dep\|require.*$dep" src --include="*.tsx" --include="*.ts" --include="*.js" | wc -l)
    
    if [ "$usage_count" -eq 0 ]; then
        echo "${YELLOW}⚠️  Potentially unused dependency: $dep${NC}"
        echo "⚠️  Potentially unused dependency: $dep" >> "$RESULTS_FILE"
        unused_deps=$((unused_deps + 1))
    fi
done

if [ "$unused_deps" -eq 0 ]; then
    echo "${GREEN}✅ No unused dependencies found${NC}"
    echo "✅ No unused dependencies found" >> "$RESULTS_FILE"
fi

echo ""
echo "${BLUE}🗂️  7. Checking for empty or near-empty files...${NC}"
echo "🗂️  7. Checking for empty or near-empty files..." >> "$RESULTS_FILE"
echo ""

empty_files=0
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    line_count=$(wc -l < "$file")
    
    if [ "$line_count" -lt 10 ]; then
        echo "${YELLOW}⚠️  Small file ($line_count lines): $file${NC}"
        echo "⚠️  Small file ($line_count lines): $file" >> "$RESULTS_FILE"
        empty_files=$((empty_files + 1))
    fi
done

echo ""
echo "${BLUE}🎯 8. Generating summary...${NC}"
echo "🎯 8. Generating summary..." >> "$RESULTS_FILE"
echo ""

echo "=========================================="
echo "📊 AUDIT SUMMARY"
echo "=========================================="
echo "📊 AUDIT SUMMARY" >> "$RESULTS_FILE"
echo "=========================================="
echo "Potentially unused files: $unused_count"
echo "Large components (>300 lines): $(find src -name "*.tsx" -exec wc -l {} + | awk '$1 > 300' | wc -l)"
echo "Console statements: $console_count"
echo "TODO/FIXME comments: $todo_count"
echo "Unused dependencies: $unused_deps"
echo "Small files (<10 lines): $empty_files"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo "=========================================="

echo "📊 AUDIT SUMMARY" >> "$RESULTS_FILE"
echo "Potentially unused files: $unused_count" >> "$RESULTS_FILE"
echo "Large components (>300 lines): $(find src -name "*.tsx" -exec wc -l {} + | awk '$1 > 300' | wc -l)" >> "$RESULTS_FILE"
echo "Console statements: $console_count" >> "$RESULTS_FILE"
echo "TODO/FIXME comments: $todo_count" >> "$RESULTS_FILE"
echo "Unused dependencies: $unused_deps" >> "$RESULTS_FILE"
echo "Small files (<10 lines): $empty_files" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"
echo "Results saved to: $RESULTS_FILE" >> "$RESULTS_FILE"

# Calculate cleanliness score
total_issues=$((unused_count + console_count + todo_count + unused_deps + empty_files))
max_possible_issues=50
cleanliness_score=$(( (max_possible_issues - total_issues) * 100 / max_possible_issues ))

if [ "$cleanliness_score" -gt 80 ]; then
    echo "${GREEN}🎉 CLEANLINESS SCORE: $cleanliness_score/100 - EXCELLENT!${NC}"
elif [ "$cleanliness_score" -gt 60 ]; then
    echo "${YELLOW}👍 CLEANLINESS SCORE: $cleanliness_score/100 - GOOD${NC}"
else
    echo "${RED}⚠️  CLEANLINESS SCORE: $cleanliness_score/100 - NEEDS IMPROVEMENT${NC}"
fi

echo ""
echo "✅ Audit complete! Review the detailed results in $RESULTS_FILE"
echo "💡 Next steps: Address the issues identified above to improve code cleanliness"
