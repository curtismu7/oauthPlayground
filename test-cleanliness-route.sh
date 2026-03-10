#!/bin/bash

# Test Cleanliness Dashboard Route
echo "🧪 Testing Cleanliness Dashboard Route..."

# Check if the route returns 200 (success) or 404 (not found)
echo "📍 Testing: http://localhost:3000/cleanliness-dashboard"

# Test with curl (follow redirects)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/cleanliness-dashboard

echo ""
echo "📍 Testing: http://localhost:3000/dashboard (should work)"

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard

echo ""
echo "📍 Testing: http://localhost:3000/nonexistent (should be 404 or redirect)"

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/nonexistent

echo ""
echo "🔍 If cleanliness-dashboard returns 200, the route works."
echo "🔍 If it returns 404, there's a routing issue."
echo "🔍 Check browser console for JavaScript errors."
