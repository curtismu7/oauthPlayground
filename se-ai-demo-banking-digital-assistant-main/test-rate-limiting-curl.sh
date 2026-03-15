#!/bin/bash

echo "Testing rate limiting with curl..."
echo "Target: http://localhost:3002/api/healthz"
echo "Sending 60 requests..."

success_count=0
rate_limited_count=0
error_count=0

for i in {1..60}; do
  response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3002/api/healthz 2>/dev/null)
  
  case $response in
    200)
      success_count=$((success_count + 1))
      ;;
    429)
      rate_limited_count=$((rate_limited_count + 1))
      echo "Request $i: Rate limited (429)"
      ;;
    *)
      error_count=$((error_count + 1))
      echo "Request $i: Error ($response)"
      ;;
  esac
  
  # Small delay to avoid overwhelming
  sleep 0.01
done

echo ""
echo "=== Results ==="
echo "Total requests: 60"
echo "Successful (200): $success_count"
echo "Rate limited (429): $rate_limited_count"
echo "Errors: $error_count"

if [ $rate_limited_count -gt 0 ]; then
  echo "✅ Rate limiting is working"
else
  echo "⚠️  Rate limiting may not be working properly"
fi

# Test headers
echo ""
echo "=== Testing rate limit headers ==="
curl -s -I http://localhost:3002/api/healthz | grep -i "ratelimit\|rate-limit"