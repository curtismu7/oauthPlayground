#!/bin/bash

# Banking Services Docker Stop Script
set -e

echo "🛑 Stopping Banking Services Stack..."
echo "===================================="

# Stop all services
docker-compose down

# Optional: Remove volumes (uncomment if you want to clean up data)
# echo "🗑️  Removing volumes..."
# docker-compose down -v

# Optional: Remove images (uncomment if you want to clean up images)
# echo "🗑️  Removing images..."
# docker-compose down --rmi all

echo "✅ All services stopped successfully!"
echo ""
echo "💡 To start again: ./start-all-services.sh"
echo "🔍 To view stopped containers: docker ps -a"
echo "🗑️  To clean up everything: docker-compose down -v --rmi all"