#!/bin/bash

# Docs Organization Script
# Organizes documentation files into appropriate subfolders

cd "$(dirname "$0")"

echo "🗂️  Organizing OAuth Playground documentation..."

# Create category mapping
declare -A categories=(
    # API & Backend
    ["API"]="./api/"
    ["ENDPOINT"]="./api/"
    ["CALLS"]="./api/"
    ["SERVICE"]="./api/"
    ["BACKEND"]="./api/"
    
    # Authentication & Authorization
    ["AUTH"]="./authentication/"
    ["AUTHZ"]="./authorization/"
    ["LOGIN"]="./authentication/"
    ["TOKEN"]="./authentication/"
    ["JWT"]="./authentication/"
    ["OAUTH"]="./authorization/"
    ["OIDC"]="./authorization/"
    
    # Credentials
    ["CREDENTIAL"]="./credentials/"
    ["CLIENT"]="./credentials/"
    
    # Development & Code
    ["CODE"]="./development/"
    ["BUILD"]="./development/"
    ["LINT"]="./development/"
    ["REVIEW"]="./development/"
    ["TEST"]="./testing/"
    
    # Features
    ["FEATURE"]="./features/"
    ["MFA"]="./features/"
    ["DEVICE"]="./features/"
    ["SPINNER"]="./ui-ux/"
    ["MODAL"]="./ui-ux/"
    ["BUTTON"]="./ui-ux/"
    
    # Flows
    ["FLOW"]="./flows/"
    ["V6"]="./flows/"
    ["V7"]="./flows/"
    ["V8"]="./flows/"
    ["IMPLICIT"]="./flows/"
    ["REDIRECT"]="./flows/"
    
    # Migration
    ["MIGRATE"]="./migration/"
    ["UPGRADE"]="./migration/"
    ["V6_TO_V7"]="./migration/"
    
    # Security
    ["SECURITY"]="./security/"
    ["CORS"]="./security/"
    ["PKCE"]="./security/"
    
    # UI/UX
    ["UI"]="./ui-ux/"
    ["HEADER"]="./ui-ux/"
    ["SIDEBAR"]="./ui-ux/"
    ["DESIGN"]="./ui-ux/"
    
    # Implementation
    ["IMPLEMENTATION"]="./implementation/"
    ["INTEGRATION"]="./implementation/"
    
    # Standards & Contracts
    ["CONTRACT"]="./standards/"
    ["STANDARD"]="./standards/"
    ["SPEC"]="./standards/"
    
    # Troubleshooting
    ["FIX"]="./troubleshooting/"
    ["ERROR"]="./troubleshooting/"
    ["DEBUG"]="./troubleshooting/"
    ["ISSUE"]="./troubleshooting/"
    
    # User Guides
    ["GUIDE"]="./user-guides/"
    ["QUICK"]="./user-guides/"
    ["HOW"]="./user-guides/"
    ["README"]="./user-guides/"
)

# Function to determine category based on filename
get_category() {
    local filename="$1"
    local upper_filename=$(echo "$filename" | tr '[:lower:]' '[:upper:]')
    
    for keyword in "${!categories[@]}"; do
        if [[ "$upper_filename" == *"$keyword"* ]]; then
            echo "${categories[$keyword]}"
            return
        fi
    done
    
    # Default category
    echo "./archive/"
}

# Move files to appropriate categories
for file in *.md; do
    if [[ -f "$file" && "$file" != "organize-docs.sh" ]]; then
        category=$(get_category "$file")
        target_dir="$category"
        
        # Create target directory if it doesn't exist
        mkdir -p "$target_dir"
        
        # Move file if it's not already in the right place
        if [[ ! -f "$target_dir/$file" ]]; then
            echo "📁 Moving $file → $target_dir"
            mv "$file" "$target_dir/"
        else
            echo "⚠️  $file already exists in $target_dir"
        fi
    fi
done

echo "✅ Documentation organization complete!"
echo ""
echo "📊 Summary:"
echo "📁 API & Backend: $(find ./api -name "*.md" 2>/dev/null | wc -l) files"
echo "🔐 Authentication: $(find ./authentication -name "*.md" 2>/dev/null | wc -l) files"
echo "🔑 Authorization: $(find ./authorization -name "*.md" 2>/dev/null | wc -l) files"
echo "🗝️  Credentials: $(find ./credentials -name "*.md" 2>/dev/null | wc -l) files"
echo "💻 Development: $(find ./development -name "*.md" 2>/dev/null | wc -l) files"
echo "🧪 Testing: $(find ./testing -name "*.md" 2>/dev/null | wc -l) files"
echo "⚡ Features: $(find ./features -name "*.md" 2>/dev/null | wc -l) files"
echo "🌊 Flows: $(find ./flows -name "*.md" 2>/dev/null | wc -l) files"
echo "🔄 Migration: $(find ./migration -name "*.md" 2>/dev/null | wc -l) files"
echo "🔒 Security: $(find ./security -name "*.md" 2>/dev/null | wc -l) files"
echo "🎨 UI/UX: $(find ./ui-ux -name "*.md" 2>/dev/null | wc -l) files"
echo "🛠️  Implementation: $(find ./implementation -name "*.md" 2>/dev/null | wc -l) files"
echo "📋 Standards: $(find ./standards -name "*.md" 2>/dev/null | wc -l) files"
echo "🔧 Troubleshooting: $(find ./troubleshooting -name "*.md" 2>/dev/null | wc -l) files"
echo "📖 User Guides: $(find ./user-guides -name "*.md" 2>/dev/null | wc -l) files"
echo "📦 Archive: $(find ./archive -name "*.md" 2>/dev/null | wc -l) files"
