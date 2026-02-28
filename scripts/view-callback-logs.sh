#!/bin/bash

# View MFA Callback Debug Logs
# Usage: ./view-callback-logs.sh [today|yesterday|all]

LOG_DIR="./logs/callback-debug"

if [ ! -d "$LOG_DIR" ]; then
    echo "❌ Log directory not found: $LOG_DIR"
    echo "💡 Make sure the callback debug API has been called at least once"
    exit 1
fi

case "${1:-today}" in
    "today")
        LOG_FILE="$LOG_DIR/callback-debug-$(date +%Y-%m-%d).log"
        ;;
    "yesterday")
        LOG_FILE="$LOG_DIR/callback-debug-$(date -v-1d +%Y-%m-%d).log"
        ;;
    "all")
        echo "📋 All callback debug logs:"
        ls -la "$LOG_DIR"
        echo ""
        echo "🔍 Latest entries from all files:"
        find "$LOG_DIR" -name "*.log" -exec tail -10 {} \; | tail -20
        exit 0
        ;;
    *)
        echo "❌ Invalid option: $1"
        echo "Usage: $0 [today|yesterday|all]"
        exit 1
        ;;
esac

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    echo "💡 Available log files:"
    ls -la "$LOG_DIR"
    exit 1
fi

echo "📋 Viewing: $LOG_FILE"
echo "🕐 Last modified: $(stat -f %Sm "$LOG_FILE")"
echo "📊 Line count: $(wc -l < "$LOG_FILE")"
echo ""

# Show the logs with pretty formatting
echo "🔍 Recent callback debug entries:"
echo "================================"
tail -20 "$LOG_FILE" | while IFS= read -r line; do
    if echo "$line" | jq -e . >/dev/null 2>&1; then
        # Pretty print JSON
        echo "$line" | jq -r '"\(.timestamp) - \(.event) - \(.data.currentPath // "N/A")"'
        echo "  → URL: $(echo "$line" | jq -r '.url // "N/A"')"
        echo "  → Reason: $(echo "$line" | jq -r '.data.fallbackReason // .data.reason // "N/A"')"
        echo ""
    else
        echo "$line"
    fi
done
