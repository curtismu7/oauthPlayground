#!/bin/bash
# Check for system modals in source code
# Usage: ./scripts/check-system-modals.sh

echo "🔍 Checking for system modals (alert/confirm/prompt)..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
alert_count=0
confirm_count=0
prompt_count=0

# Check for alert()
echo "Checking for alert() calls..."
alert_files=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="dist" \
  --exclude-dir="build" \
  --exclude-dir="coverage" \
  --exclude-dir="backups" \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  '\balert\(' src/ 2>/dev/null | grep -v "Alert.alert" | grep -v "alert(\"xss\")" | grep -v "// alert")

if [ -n "$alert_files" ]; then
  echo -e "${RED}❌ Found alert() calls:${NC}"
  echo "$alert_files"
  alert_count=$(echo "$alert_files" | wc -l)
  echo ""
else
  echo -e "${GREEN}✅ No alert() calls found${NC}"
  echo ""
fi

# Check for confirm()
echo "Checking for confirm() calls..."
confirm_files=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="dist" \
  --exclude-dir="build" \
  --exclude-dir="coverage" \
  --exclude-dir="backups" \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  '\bconfirm\(' src/ 2>/dev/null | grep -v "setShowClearConfirm" | grep -v "showClearConfirm" | grep -v "// confirm")

if [ -n "$confirm_files" ]; then
  echo -e "${RED}❌ Found confirm() calls:${NC}"
  echo "$confirm_files"
  confirm_count=$(echo "$confirm_files" | wc -l)
  echo ""
else
  echo -e "${GREEN}✅ No confirm() calls found${NC}"
  echo ""
fi

# Check for prompt()
echo "Checking for prompt() calls..."
prompt_files=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir="node_modules" \
  --exclude-dir="dist" \
  --exclude-dir="build" \
  --exclude-dir="coverage" \
  --exclude-dir="backups" \
  --exclude="*.test.*" \
  --exclude="*.spec.*" \
  '\bprompt\(' src/ 2>/dev/null | grep -v "PromptModal" | grep -v "// prompt")

if [ -n "$prompt_files" ]; then
  echo -e "${RED}❌ Found prompt() calls:${NC}"
  echo "$prompt_files"
  prompt_count=$(echo "$prompt_files" | wc -l)
  echo ""
else
  echo -e "${GREEN}✅ No prompt() calls found${NC}"
  echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "alert() calls:   $alert_count"
echo "confirm() calls: $confirm_count"
echo "prompt() calls:  $prompt_count"
echo ""

total=$((alert_count + confirm_count + prompt_count))
if [ $total -eq 0 ]; then
  echo -e "${GREEN}✅ All system modals eliminated!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  $total system modal(s) remaining${NC}"
  echo ""
  echo "Use uiNotificationServiceV8 instead:"
  echo "  - alert()   → uiNotificationServiceV8.showError() or showSuccess()"
  echo "  - confirm() → await uiNotificationServiceV8.confirm()"
  echo "  - prompt()  → await uiNotificationServiceV8.prompt()"
  exit 1
fi
