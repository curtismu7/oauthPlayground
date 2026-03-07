#!/bin/bash

echo "🚀 Starting V9 Color Migration..."

# Color mappings
declare -A colors=(
  ["#3b82f6"]="V9_COLORS.PRIMARY.BLUE"
  ["#2563eb"]="V9_COLORS.PRIMARY.BLUE_DARK"
  ["#10b981"]="V9_COLORS.PRIMARY.GREEN"
  ["#059669"]="V9_COLORS.PRIMARY.GREEN_DARK"
  ["#ef4444"]="V9_COLORS.PRIMARY.RED"
  ["#dc2626"]="V9_COLORS.PRIMARY.RED_DARK"
  ["#f59e0b"]="V9_COLORS.PRIMARY.YELLOW"
  ["#d97706"]="V9_COLORS.PRIMARY.YELLOW_DARK"
  ["#1f2937"]="V9_COLORS.TEXT.GRAY_DARK"
  ["#374151"]="V9_COLORS.TEXT.GRAY_DARK"
  ["#6b7280"]="V9_COLORS.TEXT.GRAY_MEDIUM"
  ["#475569"]="V9_COLORS.TEXT.GRAY_MEDIUM"
  ["#64748b"]="V9_COLORS.TEXT.GRAY_MEDIUM"
  ["#e5e7eb"]="V9_COLORS.TEXT.GRAY_LIGHTER"
  ["#d1d5db"]="V9_COLORS.TEXT.GRAY_LIGHTER"
  ["#e2e8f0"]="V9_COLORS.TEXT.GRAY_LIGHTER"
  ["#f8fafc"]="V9_COLORS.BG.GRAY_LIGHT"
  ["#ffffff"]="V9_COLORS.BG.WHITE"
  ["#000000"]="V9_COLORS.TEXT.BLACK"
)

# Function to process a single file
process_file() {
  local file="$1"
  local changed=false
  local color_count=0
  
  # Check if file has hardcoded colors
  if ! grep -q "#" "$file"; then
    return 0
  fi
  
  # Create temporary file
  local temp_file=$(mktemp)
  cp "$file" "$temp_file"
  
  # Add V9 import if needed
  if ! grep -q "V9_COLORS" "$file" && grep -q "#" "$file"; then
    # Find last import and add V9 import after it
    local import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    if [[ -n "$import_line" ]]; then
      local relative_path=$(realpath --relative-to="$(dirname "$file")" "src/services/v9/V9ColorStandards" | sed 's|\\|/|g')
      sed -i "${import_line}a\\
import { V9_COLORS } from '${relative_path}';" "$temp_file"
      changed=true
    fi
  fi
  
  # Replace colors
  for hex in "${!colors[@]}"; do
    local v9="${colors[$hex]}"
    if grep -q "$hex" "$temp_file"; then
      sed -i "s|$hex|$v9|g" "$temp_file"
      changed=true
      color_count=$((color_count + 1))
    fi
  done
  
  # Apply changes if file was modified
  if [[ "$changed" == true ]]; then
    mv "$temp_file" "$file"
    echo "✅ $file - $color_count colors"
    return 1
  else
    rm "$temp_file"
    return 0
  fi
}

# Find and process files
total_files=0
processed_files=0

# Process pages and components
for dir in src/pages src/components; do
  if [[ -d "$dir" ]]; then
    while IFS= read -r -d '' file; do
      ((total_files++))
      if process_file "$file"; then
        ((processed_files++))
      fi
    done < <(find "$dir" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -print0)
  fi
done

echo ""
echo "📊 Summary: $processed_files/$total_files files processed"
echo "🎉 Migration completed!"
