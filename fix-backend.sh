#!/bin/bash

# Quick Fix Script - Start Backend Server
# Resolves "Failed to fetch" errors

echo "🚀 Starting backend server to fix 'Failed to fetch' errors..."

# Check if backend is already running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend server is already running on port 3001"
else
    echo "🔧 Starting backend server on port 3001..."
    
    # Set environment variables
    export BACKEND_PORT=3001
    export NODE_ENV=development
    
    # Start backend server
    node server.js &
    
    # Wait for server to start
    echo "⏳ Waiting for backend server to start..."
    sleep 3
    
    # Check if server started successfully
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend server started successfully!"
        echo "📡 Health check: http://localhost:3001/api/health"
        echo "🔗 Proxy will forward: http://localhost:3000/api/* → http://localhost:3001/api/*"
    else
        echo "❌ Failed to start backend server"
        echo "🔍 Check for errors in server.js"
        exit 1
    fi
fi

echo ""
echo "🎯 'Failed to fetch' errors should now be resolved!"
echo "📊 Test the fix:"
echo "   curl http://localhost:3000/api/health"
echo "   curl http://localhost:3001/api/health"
