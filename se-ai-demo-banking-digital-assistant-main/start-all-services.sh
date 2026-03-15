#!/bin/bash

# Banking Services Docker Startup Script
set -e

echo "🏦 Starting Banking Services Stack..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install docker-compose."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p banking_api_server/data
mkdir -p banking_mcp_server/dev-data
mkdir -p banking_mcp_server/dev-logs
mkdir -p langchain_agent/logs
mkdir -p langchain_agent/data
mkdir -p langchain_agent/config

# Check for required .env files
echo "🔍 Checking environment files..."
ENV_FILES=(
    "banking_api_server/.env"
    "banking_api_ui/.env"
    "banking_mcp_server/.env.development"
    "langchain_agent/.env"
)

for env_file in "${ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        echo "⚠️  Warning: $env_file not found. Creating from example..."
        if [ -f "${env_file}.example" ]; then
            cp "${env_file}.example" "$env_file"
            echo "✅ Created $env_file from example"
        else
            echo "❌ No example file found for $env_file"
        fi
    fi
done

# Build and start all services
echo "🚀 Building and starting all services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
services=(
    "banking-api-server:3001"
    "banking-api-ui:3000"
    "banking-mcp-server:8080"
    "langchain-agent-backend:8081"
    "langchain-agent-frontend:3002"
    "langchain-trace-server:8082"
)

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if docker ps | grep -q "$name"; then
        echo "✅ $name is running on port $port"
    else
        echo "❌ $name failed to start"
    fi
done

echo ""
echo "🎉 Banking Services Stack Started!"
echo "=================================="
echo "📊 Banking API Server:      http://localhost:3001"
echo "🖥️  Banking API UI:         http://localhost:3000"
echo "🔧 Banking MCP Server:      http://localhost:8080"
echo "🤖 LangChain Agent Backend: http://localhost:8081"
echo "💻 LangChain Agent Frontend: http://localhost:3002"
echo "📈 LangChain Trace Server:  http://localhost:8082"
echo ""
echo "📝 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop all services: docker-compose down"
echo "🔄 To restart a service: docker-compose restart [service-name]"