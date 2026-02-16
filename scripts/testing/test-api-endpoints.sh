#!/bin/bash

echo "🔍 Testing API Endpoints After Proxy Fix"
echo "=========================================="

echo ""
echo "1. Testing Backend HTTPS Server (Port 3002):"
echo "   curl -k https://localhost:3002/api/health"
curl -k https://localhost:3002/api/health 2>/dev/null | head -c 100
echo "..."
echo ""

echo "2. Testing Vite Frontend (Port 3000):"
echo "   curl -k https://localhost:3000/"
curl -k https://localhost:3000/ 2>/dev/null | head -c 100
echo "..."
echo ""

echo "3. Testing API Proxy Through Vite:"
echo "   curl -k https://localhost:3000/api/health"
curl -k https://localhost:3000/api/health 2>/dev/null | head -c 100
echo "..."
echo ""

echo "4. Testing Token Query API:"
echo "   curl -k https://localhost:3000/api/tokens/query"
curl -k https://localhost:3000/api/tokens/query 2>/dev/null | head -c 100
echo "..."
echo ""

echo "5. Testing Log File API:"
echo "   curl -k 'https://localhost:3000/api/logs/read?file=pingone-api.log&lines=5'"
curl -k "https://localhost:3000/api/logs/read?file=pingone-api.log&lines=5" 2>/dev/null | head -c 100
echo "..."
echo ""

echo "✅ API Endpoint Tests Complete"
