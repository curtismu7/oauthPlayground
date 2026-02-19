#!/bin/bash

###############################################################################
# ⚠️  DEPRECATED SCRIPT - DO NOT USE ⚠️
# 
# This script is DEPRECATED and should NOT be used.
# It contains outdated dual HTTP/HTTPS backend configuration.
# 
# ✅ USE INSTEAD:
#   - npm start (recommended)
#   - ./scripts/dev/start-full-stack.sh
#   - ./scripts/development/run.sh
#   - ./scripts/development/stop.sh
# 
# These scripts use the correct single HTTPS backend configuration (port 3001 only).
###############################################################################

echo ""
echo "🚨 🚨 🚨 DEPRECATED SCRIPT 🚨 🚨 🚨"
echo ""
echo "This script (run-restart.sh) is DEPRECATED and should NOT be used."
echo ""
echo "❌ PROBLEMS WITH THIS SCRIPT:"
echo "   - Uses outdated dual HTTP/HTTPS backend (ports 3001 & 3002)"
echo "   - Backend should only run on HTTPS port 3001"
echo "   - Will cause startup issues and errors"
echo ""
echo "✅ USE THESE INSTEAD:"
echo "   • npm start                    (Recommended)"
echo "   • ./scripts/dev/start-full-stack.sh"
echo "   • ./scripts/development/run.sh"
echo "   • ./scripts/development/stop.sh"
echo ""
echo "� Start Server with ./run.sh from the main Master Flow API Directory"
echo ""
echo "�🔧 These scripts use the correct configuration:"
echo "   • Frontend: https://localhost:3000"
echo "   • Backend:  https://localhost:3001 (HTTPS only)"
echo ""
echo "📚 For help, see: docs/root-notes/SERVER_RESTART_GUIDE.md"
echo ""

# Exit with error code to prevent accidental use
exit 1
