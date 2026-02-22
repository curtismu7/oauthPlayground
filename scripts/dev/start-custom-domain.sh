#!/bin/bash

###############################################################################
# ⚠️  DEPRECATED SCRIPT - DO NOT USE ⚠️
# 
# This script is DEPRECATED and should NOT be used.
# Custom domain setup is now integrated into the main run.sh script.
# 
# ✅ USE INSTEAD:
#   - ./scripts/development/run.sh (includes custom domain setup)
#   - ./scripts/development/run.sh -default (skips setup, uses defaults)
# 
# The main run.sh script now includes:
# • Automatic custom domain setup on first run
# • Domain validation (xxx.xxxxxx.xxx format)
# • SSL certificate generation
# • Hosts file configuration
# • Browser trust setup (macOS)
# • Environment file creation
# • Clear existing domain setup option
###############################################################################

echo ""
echo "🚨 🚨 🚨 DEPRECATED SCRIPT 🚨 🚨 🚨"
echo ""
echo "This script (start-custom-domain.sh) is DEPRECATED and should NOT be used."
echo ""
echo "❌ PROBLEMS WITH THIS SCRIPT:"
echo "   - Custom domain setup is now integrated into run.sh"
echo "   - This script is redundant and outdated"
echo "   - May cause conflicts with the integrated setup"
echo ""
echo "✅ USE THESE INSTEAD:"
echo "   • ./scripts/development/run.sh           (First-time setup with custom domain)"
echo "   • ./scripts/development/run.sh -default (Daily development, skips setup)"
echo "   • ./scripts/development/run.sh -quick    (Automated scripts)"
echo ""
echo "🎯 NEW WORKFLOW:"
echo "   1. First time:    ./scripts/development/run.sh"
echo "      → Includes custom domain setup"
echo "      → Prompts for domain (default: auth.pingdemo.com)"
echo "      → Configures SSL certificates and hosts file"
echo "      → Starts servers"
echo ""
echo "   2. Daily work:    ./scripts/development/run.sh -default"
echo "      → Skips custom domain setup (already configured)"
echo "      → Uses existing configuration"
echo "      → Starts servers quickly"
echo ""
echo "   3. Change domain: rm .env.local && ./scripts/development/run.sh"
echo "      → Clears existing domain configuration"
echo "      → Prompts for new domain setup"
echo "      → Reconfigures everything with new domain"
echo ""
echo "📚 MORE INFORMATION:"
echo "   • Run help: ./scripts/development/run.sh --help"
echo "   • Project README: ./README.md"
echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    Please use the integrated run.sh script! 🚀                    ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

exit 1
