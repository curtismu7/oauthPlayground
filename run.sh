#!/bin/bash

# MasterFlow API Server Startup Script
# This script forwards to the correct development script
# 
# Usage:
#   ./run.sh           - Interactive mode
#   ./run.sh -quick    - Quick mode (no prompts)
#   ./run.sh -default  - Default mode (use existing config)
#   ./run.sh --help    - Show help

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to the actual development script
DEV_SCRIPT="$SCRIPT_DIR/scripts/development/run.sh"

# Check if the development script exists
if [ ! -f "$DEV_SCRIPT" ]; then
    echo "❌ Error: Development script not found at: $DEV_SCRIPT"
    echo ""
    echo "Please ensure the following file exists:"
    echo "  $DEV_SCRIPT"
    echo ""
    echo "Current script location: $SCRIPT_DIR"
    echo "Looking for: scripts/development/run.sh"
    exit 1
fi

# Make the development script executable
chmod +x "$DEV_SCRIPT"

# Forward all arguments to the development script
echo "🚀 MasterFlow API Server Startup"
echo "📁 Using development script: $DEV_SCRIPT"
echo ""

# Execute the development script with all original arguments
exec "$DEV_SCRIPT" "$@"
