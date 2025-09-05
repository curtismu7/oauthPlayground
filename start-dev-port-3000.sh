#!/bin/bash

# Kill any process using port 3000
echo "🔍 Checking for processes on port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Found processes on port 3000, killing them..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
    echo "✅ Port 3000 is now available"
else
    echo "✅ Port 3000 is available"
fi

# Start the development server
echo "🚀 Starting development server on port 3000..."
npm run dev



