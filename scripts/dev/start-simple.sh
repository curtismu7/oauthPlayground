#!/bin/bash

# OAuth Playground - Simple Startup Script
# Quick start for both frontend and backend
# Version: 4.0.0

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting OAuth Playground v4.0.0...${NC}"

# Kill any existing processes on ports 3001 and 5173
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start backend in background
echo "Starting backend server..."
node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${GREEN}✅ OAuth Playground is running!${NC}"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo "Press Ctrl+C to stop"

# Wait for processes
wait

