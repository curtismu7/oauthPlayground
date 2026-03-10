#!/bin/bash

# Popout Routes Test Script
echo "🧪 Testing Debug Log Viewer Popout Routes..."

echo ""
echo "📍 Testing V8 Route (should show test version):"
echo "URL: https://api.pingdemo.com:3000/v8/debug-logs-popout"

# Test V8 route
v8_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/v8/debug-logs-popout 2>/dev/null || echo "000")

echo "Status: $v8_status"

if [ "$v8_status" = "200" ]; then
    echo "✅ V8 Route Working"
elif [ "$v8_status" = "000" ]; then
    echo "⚠️  Cannot test - server may not be running"
else
    echo "❌ V8 Route Not Working"
fi

echo ""
echo "📍 Testing V9 Route (should show full viewer):"
echo "URL: https://api.pingdemo.com:3000/v9/debug-logs-popout"

# Test V9 route
v9_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/v9/debug-logs-popout 2>/dev/null || echo "000")

echo "Status: $v9_status"

if [ "$v9_status" = "200" ]; then
    echo "✅ V9 Route Working"
elif [ "$v9_status" = "000" ]; then
    echo "⚠️  Cannot test - server may not be running"
else
    echo "❌ V9 Route Not Working"
fi

echo ""
echo "📍 Testing Main App (should work):"
echo "URL: https://api.pingdemo.com:3000/dashboard"

# Test main app
main_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard 2>/dev/null || echo "000")

echo "Status: $main_status"

if [ "$main_status" = "200" ]; then
    echo "✅ Main App Working"
elif [ "$main_status" = "000" ]; then
    echo "⚠️  Cannot test - server may not be running"
else
    echo "❌ Main App Not Working"
fi

echo ""
echo "🎯 Test Summary:"
echo "- V8 Route: $v8_status"
echo "- V9 Route: $v9_status" 
echo "- Main App: $main_status"

echo ""
echo "📝 Manual Testing Instructions:"
echo "1. Open browser and navigate to: https://api.pingdemo.com:3000"
echo "2. Click the log viewer toggle (bottom-right)"
echo "3. Click the popout button"
echo "4. Should open V9 debug log viewer in new window"
echo "5. Test direct URLs:"
echo "   - V8: https://api.pingdemo.com:3000/v8/debug-logs-popout"
echo "   - V9: https://api.pingdemo.com:3000/v9/debug-logs-popout"

echo ""
echo "🔧 If routes don't work:"
echo "1. Check browser console for JavaScript errors"
echo "2. Check network tab for failed requests"
echo "3. Ensure server is running: npm start"
echo "4. Check if build is successful: npm run build"
