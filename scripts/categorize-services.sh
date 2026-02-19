#!/bin/bash

# Service Categorization Script
# Analyze and categorize services for shared vs app-specific placement

set -e

echo "🔍 Analyzing services for categorization..."

# Create categorization report
REPORT_FILE="service-categorization-report.md"
echo "# Service Categorization Report" > $REPORT_FILE
echo "" >> $REPORT_FILE
echo "Generated on: $(date)" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Function to analyze service usage
analyze_service() {
    local service_file=$1
    local service_name=$(basename "$service_file" .ts)
    local import_count=0
    local apps_using=()
    
    # Count imports and which apps use this service
    while IFS= read -r line; do
        if [[ $line == *"from"* ]]; then
            ((import_count++))
            # Extract app from import path
            if [[ $line == *"apps/"* ]]; then
                local app=$(echo "$line" | sed -n 's/.*apps\/\([^/]*\)\/.*/\1/p')
                if [[ -n "$app" ]]; then
                    apps_using+=("$app")
                fi
            fi
        fi
    done < <(grep -r "from.*$service_name" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    
    # Remove duplicates
    local unique_apps=($(printf "%s\n" "${apps_using[@]}" | sort -u))
    
    echo "## $service_name" >> $REPORT_FILE
    echo "- **File**: \`$service_file\`" >> $REPORT_FILE
    echo "- **Import Count**: $import_count" >> $REPORT_FILE
    echo "- **Used by Apps**: ${unique_apps[*]:-}" >> $REPORT_FILE
    
    # Categorize based on usage
    if [[ ${#unique_apps[@]} -gt 1 ]]; then
        echo "- **Category**: 🔄 **SHARED** (used by multiple apps)" >> $REPORT_FILE
        echo "- **Target**: \`src/shared/services/\`" >> $REPORT_FILE
    elif [[ ${#unique_apps[@]} -eq 1 ]]; then
        echo "- **Category**: 📱 **APP-SPECIFIC** (used by ${unique_apps[0]} only)" >> $REPORT_FILE
        echo "- **Target**: \`src/apps/${unique_apps[0]}/services/\`" >> $REPORT_FILE
    else
        echo "- **Category**: ❓ **UNKNOWN** (no imports found)" >> $REPORT_FILE
        echo "- **Target**: Needs manual review" >> $REPORT_FILE
    fi
    echo "" >> $REPORT_FILE
}

# Analyze all services in v8 and v8u
echo "### V8 Services" >> $REPORT_FILE
echo "" >> $REPORT_FILE

for service_file in src/v8/services/*.ts; do
    if [[ -f "$service_file" ]]; then
        analyze_service "$service_file"
    fi
done

echo "### V8U Services" >> $REPORT_FILE
echo "" >> $REPORT_FILE

for service_file in src/v8u/services/*.ts; do
    if [[ -f "$service_file" ]]; then
        analyze_service "$service_file"
    fi
done

# Generate summary
echo "## Summary" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Count services in each category
shared_count=$(grep -c "🔄 **SHARED**" $REPORT_FILE 2>/dev/null || echo "0")
app_specific_count=$(grep -c "📱 **APP-SPECIFIC**" $REPORT_FILE 2>/dev/null || echo "0")
unknown_count=$(grep -c "❓ **UNKNOWN**" $REPORT_FILE 2>/dev/null || echo "0")

echo "- **Shared Services**: $shared_count" >> $REPORT_FILE
echo "- **App-Specific Services**: $app_specific_count" >> $REPORT_FILE
echo "- **Unknown Services**: $unknown_count" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Generate move commands for shared services
echo "## Recommended Move Commands" >> $REPORT_FILE
echo "" >> $REPORT_FILE
echo "### Shared Services" >> $REPORT_FILE
echo "" >> $REPORT_FILE

while IFS= read -r line; do
    if [[ $line == *"🔄 **SHARED**"* ]]; then
        local file_line=$(echo "$line" | sed -n 's/.*File: \`\(.*\)\`.*/\1/p')
        if [[ -n "$file_line" ]]; then
            echo "git mv \"$file_line\" \"src/shared/services/\"" >> $REPORT_FILE
        fi
    fi
done < $REPORT_FILE

echo "" >> $REPORT_FILE
echo "### App-Specific Services" >> $REPORT_FILE
echo "" >> $REPORT_FILE

while IFS= read -r line; do
    if [[ $line == *"📱 **APP-SPECIFIC**"* ]]; then
        file_line=$(echo "$line" | sed -n 's/.*File: \`\(.*\)\`.*/\1/p')
        target_line=$(echo "$line" | sed -n 's/.*Target: \`src\/apps\/\([^/]*\)\/.*/\1/p')
        if [[ -n "$file_line" && -n "$target_line" ]]; then
            echo "git mv \"$file_line\" \"src/apps/$target_line/services/\"" >> $REPORT_FILE
        fi
    fi
done < $REPORT_FILE

echo "✅ Service categorization complete!"
echo "📄 Report saved to: $REPORT_FILE"
echo ""
echo "📊 Summary:"
echo "  - Shared Services: $shared_count"
echo "  - App-Specific Services: $app_specific_count"
echo "  - Unknown Services: $unknown_count"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the categorization report"
echo "  2. Manually verify unknown services"
echo "  3. Execute move commands from the report"
echo "  4. Test after each move"

exit 0
