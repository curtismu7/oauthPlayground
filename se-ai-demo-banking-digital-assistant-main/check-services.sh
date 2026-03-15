#!/bin/bash

# Banking Services Health Check Script
set -e

echo "🔍 Checking Banking Services Health..."
echo "====================================="

# Function to check if a service is responding
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo "✅ Healthy"
        return 0
    else
        echo "❌ Unhealthy"
        return 1
    fi
}

# Check Docker containers
echo "📦 Docker Container Status:"
docker-compose ps

echo ""
echo "🌐 Service Health Checks:"

# Check each service with appropriate endpoints
check_service "Banking API Server" "http://localhost:3001/health" || true
check_service "Banking API UI" "http://localhost:3000" || true
# MCP Server doesn't have HTTP endpoints, check if process is running
echo -n "Checking Banking MCP Server... "
if docker exec banking-mcp-server pgrep -f node > /dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Unhealthy"
fi
check_service "LangChain Agent Backend" "http://localhost:8081/health" || true
check_service "LangChain Agent Frontend" "http://localhost:3002" || true
check_service "LangChain Trace Server" "http://localhost:8090/" || true

echo ""
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "💡 Useful commands:"
echo "   View logs: docker-compose logs -f [service-name]"
echo "   Restart service: docker-compose restart [service-name]"
echo "   Scale service: docker-compose up -d --scale [service-name]=2"