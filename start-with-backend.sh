#!/bin/bash

# Start OAuth Playground with Backend Server
echo "🚀 Starting OAuth Playground with Backend Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/express/package.json" ]; then
    echo "📦 Installing backend dependencies..."
    npm install express cors node-fetch dotenv nodemon
fi

# Start backend server in background
echo "🔧 Starting backend server on port 3001..."
node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend server failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend server started successfully"

# Start frontend development server
echo "🎨 Starting frontend development server on port 3000..."
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🎉 OAuth Playground is running!"
echo "   Frontend: https://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for processes
wait
