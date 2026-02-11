#!/bin/bash

# Final Protect Portal API Test
# Tests all working endpoints with mock data for testing

BASE_URL="https://localhost:3002"
ENV_ID="test-env-id"
CLIENT_ID="test-client-id"
CLIENT_SECRET="test-client-secret"
WORKER_TOKEN="test-worker-token"
USER_ID="test-user-id"

echo "🚀 Final Protect Portal API Tests"
echo "   Base URL: $BASE_URL"
echo "   Environment ID: ${ENV_ID:0:8}..."
echo "   Client ID: ${CLIENT_ID:0:8}..."
echo "   User ID: $USER_ID"
echo ""

# Function to test an endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local headers="$4"
    local body="$5"
    local expected_status="$6"
    
    echo "🧪 Testing: $name"
    echo "   $method $url"
    
    # Build curl command
    local cmd="curl -k -s -w '\\nHTTP_STATUS:%{http_code}' -X $method"
    
    # Add headers
    if [[ -n "$headers" ]]; then
        cmd="$cmd $headers"
    fi
    
    # Add body for POST/PUT
    if [[ -n "$body" ]]; then
        cmd="$cmd -d '$body'"
    fi
    
    cmd="$cmd '$url'"
    
    # Execute and capture response
    local response=$(eval "$cmd")
    local status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed -e 's/HTTP_STATUS:[0-9]*$//')
    
    echo "   Status: $status"
    
    # Check if status is expected
    if [[ "$expected_status" == *"$status"* ]]; then
        echo "   ✅ SUCCESS: Status $status is expected"
    else
        echo "   ❌ FAILED: Expected status $expected_status, got $status"
    fi
    
    # Show response (truncated)
    if [[ -n "$body" ]]; then
        echo "   Response: ${body:0:200}..."
    fi
    
    echo ""
    
    # Return success/failure
    if [[ "$expected_status" == *"$status"* ]]; then
        return 0
    else
        return 1
    fi
}

# Track results
passed=0
failed=0

# Test 1: Risk Evaluation (Working)
if test_endpoint \
    "Risk Evaluation" \
    "POST" \
    "$BASE_URL/api/pingone/risk-evaluations" \
    "-H 'Content-Type: application/json' -H 'Authorization: Bearer $WORKER_TOKEN'" \
    "{\"environmentId\":\"$ENV_ID\",\"riskEvent\":{\"type\":\"LOGIN\",\"userId\":\"$USER_ID\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",\"ipAddress\":\"192.168.1.1\",\"userAgent\":\"Mozilla/5.0 (Test Browser)\"}}" \
    "200"; then
    ((passed++))
else
    ((failed++))
fi

# Test 2: Mock Embedded Login (New)
if test_endpoint \
    "Mock Embedded Login" \
    "POST" \
    "$BASE_URL/api/pingone/redirectless/authorize-mock" \
    "-H 'Content-Type: application/json'" \
    "{\"environmentId\":\"$ENV_ID\",\"clientId\":\"$CLIENT_ID\",\"redirectUri\":\"http://localhost:3000/callback\",\"scopes\":[\"openid\",\"profile\",\"email\"],\"codeChallenge\":\"test-code-challenge\",\"codeChallengeMethod\":\"S256\",\"state\":\"test-state\"}" \
    "200"; then
    ((passed++))
else
    ((failed++))
fi

# Test 3: Worker Token (Working)
if test_endpoint \
    "Worker Token" \
    "POST" \
    "$BASE_URL/api/pingone/worker-token" \
    "-H 'Content-Type: application/json'" \
    "{\"environment_id\":\"$ENV_ID\",\"client_id\":\"$CLIENT_ID\",\"client_secret\":\"$CLIENT_SECRET\",\"grant_type\":\"client_credentials\"}" \
    "200"; then
    ((passed++))
else
    ((failed++))
fi

# Test 4: User MFA Status (Working)
if test_endpoint \
    "User MFA Status" \
    "GET" \
    "$BASE_URL/api/pingone/user/$USER_ID/mfa?environmentId=$ENV_ID&accessToken=$WORKER_TOKEN" \
    "-H 'Accept: application/json'" \
    "" \
    "200"; then
    ((passed++))
else
    ((failed++))
fi

# Test 5: Mock User Devices (New Mock)
if test_endpoint \
    "Mock User Devices" \
    "GET" \
    "$BASE_URL/api/pingone/user/$USER_ID/devices-mock?environmentId=$ENV_ID&accessToken=$WORKER_TOKEN" \
    "-H 'Accept: application/json'" \
    "" \
    "200"; then
    ((passed++))
else
    ((failed++))
fi

# Test 6: Mock User Profile (New Mock)
if test_endpoint \
    "Mock User Profile" \
    "GET" \
    "$BASE_URL/api/pingone/user-mock/$USER_ID?environmentId=$ENV_ID&accessToken=$WORKER_TOKEN" \
    "-H 'Accept: application/json'" \
    "" \
    "200"; then
    ((passed++))
else
    ((failed++))
fi

# Summary
echo "📊 Final Test Results Summary:"
echo "=================================================="
echo "   Total Tests: $((passed + failed))"
echo "   ✅ Passed: $passed"
echo "   ❌ Failed: $failed"
echo ""

if [[ $failed -eq 0 ]]; then
    echo "🎉 All Protect Portal API tests passed!"
    echo "   ✅ Risk Evaluation - Working"
    echo "   ✅ Mock Embedded Login - Working" 
    echo "   ✅ Worker Token - Working"
    echo "   ✅ User MFA Status - Working"
    echo "   ✅ Mock User Devices - Working"
    echo "   ✅ Mock User Profile - Working"
    echo ""
    echo "🔧 Note: Some endpoints use mock data for testing."
    echo "   Real PingOne API calls require valid credentials."
    exit 0
else
    echo "❌ Some tests failed!"
    exit 1
fi
