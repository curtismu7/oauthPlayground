#!/bin/bash

# OAuth Playground - Restart Script
# Kills all running servers and starts fresh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restarting OAuth Playground...${NC}"

# Kill all related processes
echo -e "${YELLOW}Stopping all servers...${NC}"
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Kill processes on specific ports
echo -e "${YELLOW}Freeing ports...${NC}"
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

# Wait for ports to be free
sleep 3

# Verify ports are free
if lsof -i :3000 -i :3001 | grep LISTEN >/dev/null 2>&1; then
    echo -e "${RED}❌ Some ports are still in use${NC}"
    lsof -i :3000 -i :3001 | grep LISTEN
    exit 1
fi

echo -e "${GREEN}✅ All ports are now free${NC}"

# Start the full-stack setup
echo -e "${BLUE}🚀 Starting full-stack servers...${NC}"
npm start
