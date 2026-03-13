#!/bin/bash

# OAuth Playground Server Startup Script
echo "🚀 Starting OAuth Playground Servers..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo "⏳ Waiting for $name to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -k -s "$url" > /dev/null 2>&1; then
            echo "✅ $name is ready!"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name failed to start within 30 seconds"
    return 1
}

# Check ports
echo "🔍 Checking port availability..."
check_port 3000 || exit 1
check_port 3001 || exit 1

# Start backend
echo "🔧 Starting backend server..."
node server.js &
BACKEND_PID=$!

# Wait for backend to be ready
wait_for_server "https://localhost:3001/api/health" "Backend"

# Start frontend
echo "🔧 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
wait_for_server "https://localhost:3000" "Frontend"

# Run health check
echo "🏥 Running health check..."
node health-check.js

echo ""
echo "🎉 OAuth Playground is ready!"
echo "   Frontend: https://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
