#!/bin/bash

echo "Stress testing rate limiting..."
echo "Target: http://localhost:3002/api/healthz"
echo "Sending 600 requests quickly..."

success_count=0
rate_limited_count=0
error_count=0

# Send requests in parallel to stress test
for i in {1..600}; do
  {
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
  } &
  
  # Limit concurrent processes to avoid overwhelming the system
  if (( i % 50 == 0 )); then
    wait
  fi
done

wait # Wait for all background processes to complete

echo ""
echo "=== Stress Test Results ==="
echo "Total requests: 600"
echo "Successful (200): $success_count"
echo "Rate limited (429): $rate_limited_count"
echo "Errors: $error_count"

if [ $rate_limited_count -gt 0 ]; then
  echo "✅ Rate limiting triggered under stress"
else
  echo "⚠️  Rate limiting not triggered - may need adjustment"
fi

# Check current rate limit status
echo ""
echo "=== Current rate limit status ==="
curl -s -I http://localhost:3002/api/healthz | grep -i "ratelimit\|rate-limit"