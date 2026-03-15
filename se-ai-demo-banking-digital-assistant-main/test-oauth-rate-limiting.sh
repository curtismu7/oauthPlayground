#!/bin/bash

echo "Testing OAuth-specific rate limiting..."
echo "Target: http://localhost:3002/api/auth/oauth/status"
echo "OAuth limit should be 100 requests per 15 minutes in development"

success_count=0
rate_limited_count=0
error_count=0

# Send 120 requests to trigger OAuth rate limiting
for i in {1..120}; do
  response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3002/api/auth/oauth/status 2>/dev/null)
  
  case $response in
    200)
      success_count=$((success_count + 1))
      ;;
    429)
      rate_limited_count=$((rate_limited_count + 1))
      if [ $rate_limited_count -eq 1 ]; then
        echo "First rate limit hit at request $i"
      fi
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
echo "=== OAuth Rate Limiting Results ==="
echo "Total requests: 120"
echo "Successful (200): $success_count"
echo "Rate limited (429): $rate_limited_count"
echo "Errors: $error_count"

if [ $rate_limited_count -gt 0 ]; then
  echo "✅ OAuth rate limiting is working"
  echo "Rate limiting started after ~$success_count requests"
else
  echo "⚠️  OAuth rate limiting may not be working properly"
fi

# Test rate limit headers
echo ""
echo "=== OAuth Rate Limit Headers ==="
curl -s -I http://localhost:3002/api/auth/oauth/status | grep -i "ratelimit\|rate-limit"