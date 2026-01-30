#!/bin/bash

# Quick test script for SMS registration
ENV_ID="your-environment-id"
USERNAME="test.user@example.com"
WORKER_TOKEN="your-worker-token"
PHONE="+15551234567"

echo "🔍 Testing SMS Registration Flow..."

echo "1. Testing worker token status..."
curl -s -X POST http://localhost:3001/api/pingone/worker-token-status \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

echo -e "\n2. Testing user lookup..."
curl -s -X POST http://localhost:3001/api/pingone/mfa/lookup-user \
  -H "Content-Type: application/json" \
  -d "{\"environmentId\":\"$ENV_ID\",\"username\":\"$USERNAME\",\"workerToken\":\"$WORKER_TOKEN\"}" | jq .

echo -e "\n3. Testing device registration..."
curl -s -X POST http://localhost:3001/api/pingone/mfa/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -d "{\"environmentId\":\"$ENV_ID\",\"username\":\"$USERNAME\",\"type\":\"SMS\",\"phone\":\"$PHONE\",\"nickname\":\"Test SMS Device\",\"status\":\"ACTIVATION_REQUIRED\"}" | jq .

echo -e "\n✅ Test complete. Check responses above for any errors."
