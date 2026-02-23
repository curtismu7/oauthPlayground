#!/bin/bash

# MasterFlow API Server Startup Script
# This script forwards to the correct development script
# 
# Usage:
#   ./run.sh           - Interactive mode
#   ./run.sh -clear    - Full clear mode (kill processes + clear all cache)
#   ./run.sh -quick    - Quick mode (no prompts)
#   ./run.sh -default  - Default mode (use existing config)
#   ./run.sh --help    - Show help

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to the enhanced startup script
ENHANCED_SCRIPT="$SCRIPT_DIR/scripts/startup-enhanced.sh"
DEV_SCRIPT="$SCRIPT_DIR/scripts/development/run.sh"

# Function to show help
show_help() {
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 MasterFlow API Startup Script 🚀                        ║"
    echo "║                      Enhanced Startup Options                                ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📋 USAGE:"
    echo "  ./run.sh              - Interactive startup with prompts"
    echo "  ./run.sh -clear       - Full clear: kill processes + clear all cache"
    echo "  ./run.sh -quick       - Quick mode: minimal checks, no prompts"
    echo "  ./run.sh -default     - Default mode: normal startup without prompts"
    echo "  ./run.sh --help       - Show this help message"
    echo ""
    echo "🔧 STARTUP MODES:"
    echo ""
    echo "  🧹 FULL CLEAR MODE (-clear):"
    echo "    • Kills all processes on ports 3000 and 3001"
    echo "    • Clears dist directory"
    echo "    • Clears Vite cache (node_modules/.vite)"
    echo "    • Removes package-lock.json files"
    echo "    • Installs fresh dependencies"
    echo "    • Use when experiencing build issues or need fresh start"
    echo ""
    echo "  ⚡ QUICK MODE (-quick):"
    echo "    • Skips system requirements check"
    echo "    • Skips port availability checks"
    echo "    • Starts servers immediately"
    echo "    • Minimal logging"
    echo "    • Use for rapid development iterations"
    echo ""
    echo "  📋 DEFAULT MODE (-default):"
    echo "    • Normal startup without interactive prompts"
    echo "    • Kills existing processes if ports are in use"
    echo "    • Performs system requirements check"
    echo "    • Installs dependencies if needed"
    echo "    • Use for automated scripts or CI/CD"
    echo ""
    echo "  🎯 INTERACTIVE MODE (no flags):"
    echo "    • Complete system requirements check"
    echo "    • Port availability checks with prompts"
    echo "    • Cache clearing options"
    echo "    • Full logging and status updates"
    echo "    • Use for first-time setup or full control"
    echo ""
    echo "🌐 SERVER INFORMATION:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  https://localhost:3001"
    echo ""
    echo "📚 EXAMPLES:"
    echo "  ./run.sh -clear        # Full reset and start"
    echo "  ./run.sh -quick        # Fast startup for development"
    echo "  ./run.sh -default      # Automated startup"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    Happy coding with MasterFlow API! 🚀                    ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -clear)
            echo "🧹 MasterFlow API - Full Clear Mode"
            echo "📁 Using enhanced startup script: $ENHANCED_SCRIPT"
            echo ""
            
            # Check if enhanced script exists
            if [ ! -f "$ENHANCED_SCRIPT" ]; then
                echo "❌ Error: Enhanced startup script not found at: $ENHANCED_SCRIPT"
                echo ""
                echo "Please ensure the following file exists:"
                echo "  $ENHANCED_SCRIPT"
                echo ""
                echo "Current script location: $SCRIPT_DIR"
                echo "Looking for: scripts/startup-enhanced.sh"
                exit 1
            fi
            
            # Make the enhanced script executable
            chmod +x "$ENHANCED_SCRIPT"
            
            # Execute the enhanced script with -clear flag
            exec "$ENHANCED_SCRIPT" -clear
            ;;
        -quick)
            echo "⚡ MasterFlow API - Quick Mode"
            echo "📁 Using development script: $DEV_SCRIPT"
            echo ""
            
            # Check if development script exists
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
            
            # Execute the development script with -quick flag
            exec "$DEV_SCRIPT" -quick
            ;;
        -default)
            echo "📋 MasterFlow API - Default Mode"
            echo "📁 Using enhanced startup script: $ENHANCED_SCRIPT"
            echo ""
            
            # Check if enhanced script exists
            if [ ! -f "$ENHANCED_SCRIPT" ]; then
                echo "❌ Error: Enhanced startup script not found at: $ENHANCED_SCRIPT"
                echo ""
                echo "Please ensure the following file exists:"
                echo "  $ENHANCED_SCRIPT"
                echo ""
                echo "Current script location: $SCRIPT_DIR"
                echo "Looking for: scripts/startup-enhanced.sh"
                exit 1
            fi
            
            # Make the enhanced script executable
            chmod +x "$ENHANCED_SCRIPT"
            
            # Execute the enhanced script with -default flag
            exec "$ENHANCED_SCRIPT" -default
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Error: Unknown option: $1"
            echo ""
            echo "Available options:"
            echo "  -clear    Full clear mode"
            echo "  -quick    Quick mode"
            echo "  -default  Default mode"
            echo "  --help    Show help"
            echo ""
            echo "Use --help for detailed usage information"
            exit 1
            ;;
    esac
    shift
done

# Default behavior (no arguments) - use development script
echo "🚀 MasterFlow API Server Startup"
echo "📁 Using development script: $DEV_SCRIPT"
echo ""

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

# Execute the development script with all original arguments
exec "$DEV_SCRIPT" "$@"
