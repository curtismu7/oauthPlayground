#!/bin/bash

# Startup Cache Clear Prompt Script
# Provides options to clear cache and kill processes during startup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    OAuth Playground Startup Options${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if processes are running
VITE_RUNNING=false
NPM_RUNNING=false

if pgrep -f "vite" > /dev/null 2>&1; then
    VITE_RUNNING=true
fi

if pgrep -f "npm" > /dev/null 2>&1; then
    NPM_RUNNING=true
fi

# Display current status
echo -e "${YELLOW}Current Status:${NC}"
echo -e "  Vite processes running: $([ "$VITE_RUNNING" = true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
echo -e "  NPM processes running: $([ "$NPM_RUNNING" = true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
echo ""

# Check if dist and node_modules/.vite exist
DIST_EXISTS=false
VITE_CACHE_EXISTS=false

if [ -d "dist" ]; then
    DIST_EXISTS=true
fi

if [ -d "node_modules/.vite" ]; then
    VITE_CACHE_EXISTS=true
fi

echo -e "${YELLOW}Cache Status:${NC}"
echo -e "  dist directory: $([ "$DIST_EXISTS" = true ] && echo -e "${GREEN}Exists${NC}" || echo -e "${RED}Not found${NC}")"
echo -e "  Vite cache: $([ "$VITE_CACHE_EXISTS" = true ] && echo -e "${GREEN}Exists${NC}" || echo -e "${RED}Not found${NC}")"
echo ""

# Prompt for options
echo -e "${BLUE}Select startup options:${NC}"
echo "1) Normal startup (no cache clearing)"
echo "2) Clear dist directory only"
echo "3) Clear Vite cache only"
echo "4) Clear both dist and Vite cache"
echo "5) Kill running processes only"
echo "6) Full reset (kill processes + clear all cache)"
echo "7) Clear backend.log file"
echo "8) Exit without starting"
echo ""

# Read user choice
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        echo -e "${GREEN}Starting normally...${NC}"
        ;;
    2)
        echo -e "${YELLOW}Clearing dist directory...${NC}"
        if [ -d "dist" ]; then
            rm -rf dist
            echo -e "${GREEN}✓ dist directory cleared${NC}"
        else
            echo -e "${BLUE}ℹ dist directory not found${NC}"
        fi
        ;;
    3)
        echo -e "${YELLOW}Clearing Vite cache...${NC}"
        if [ -d "node_modules/.vite" ]; then
            rm -rf node_modules/.vite
            echo -e "${GREEN}✓ Vite cache cleared${NC}"
        else
            echo -e "${BLUE}ℹ Vite cache not found${NC}"
        fi
        ;;
    4)
        echo -e "${YELLOW}Clearing both dist and Vite cache...${NC}"
        if [ -d "dist" ]; then
            rm -rf dist
            echo -e "${GREEN}✓ dist directory cleared${NC}"
        else
            echo -e "${BLUE}ℹ dist directory not found${NC}"
        fi
        if [ -d "node_modules/.vite" ]; then
            rm -rf node_modules/.vite
            echo -e "${GREEN}✓ Vite cache cleared${NC}"
        else
            echo -e "${BLUE}ℹ Vite cache not found${NC}"
        fi
        ;;
    5)
        echo -e "${YELLOW}Killing running processes...${NC}"
        if [ "$VITE_RUNNING" = true ]; then
            pkill -f "vite"
            echo -e "${GREEN}✓ Vite processes killed${NC}"
        else
            echo -e "${BLUE}ℹ No Vite processes running${NC}"
        fi
        if [ "$NPM_RUNNING" = true ]; then
            pkill -f "npm"
            echo -e "${GREEN}✓ NPM processes killed${NC}"
        else
            echo -e "${BLUE}ℹ No NPM processes running${NC}"
        fi
        ;;
    6)
        echo -e "${YELLOW}Performing full reset...${NC}"
        
        # Kill processes first
        if [ "$VITE_RUNNING" = true ] || [ "$NPM_RUNNING" = true ]; then
            echo -e "${YELLOW}  Killing running processes...${NC}"
            pkill -f "vite\|npm" || true
            echo -e "${GREEN}  ✓ Processes killed${NC}"
        else
            echo -e "${BLUE}  ℹ No processes running${NC}"
        fi
        
        # Clear caches
        echo -e "${YELLOW}  Clearing caches...${NC}"
        if [ -d "dist" ]; then
            rm -rf dist
            echo -e "${GREEN}  ✓ dist directory cleared${NC}"
        else
            echo -e "${BLUE}  ℹ dist directory not found${NC}"
        fi
        if [ -d "node_modules/.vite" ]; then
            rm -rf node_modules/.vite
            echo -e "${GREEN}  ✓ Vite cache cleared${NC}"
        else
            echo -e "${BLUE}  ℹ Vite cache not found${NC}"
        fi
        ;;
    7)
        echo -e "${YELLOW}Clearing backend.log file...${NC}"
        if [ -f "backend.log" ]; then
            rm backend.log
            echo -e "${GREEN}✓ backend.log file cleared${NC}"
        else
            echo -e "${BLUE}ℹ backend.log file not found${NC}"
        fi
        ;;
    8)
        echo -e "${RED}Exiting without starting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✓ Startup options applied${NC}"
echo -e "${BLUE}Starting development server...${NC}"
echo ""
echo -e "${CYAN}📊 Recommended Monitoring Setups:${NC}"
echo -e "${GREEN}  • Development: tail -f backend.log vite.log logs/pingone-api.log${NC}"
echo -e "${GREEN}  • API Testing: tail -f backend.log logs/pingone-api.log logs/real-api.log${NC}"
echo -e "${GREEN}  • Flow Testing: tail -f backend.log logs/sms.log logs/email.log${NC}"
echo -e "${GREEN}  • Complete View: tail -f backend.log vite.log logs/pingone-api.log logs/server.log${NC}"
echo -e "${GREEN}  • All-in-One: tail -f backend.log vite.log logs/pingone-api.log logs/server.log logs/sms.log logs/email.log${NC}"
echo -e "${GREEN}  • Quick History: tail -n 200 logs/startup.log && tail -n 200 logs/pingone-api.log${NC}"
echo ""

# Continue with normal startup
npm run dev
