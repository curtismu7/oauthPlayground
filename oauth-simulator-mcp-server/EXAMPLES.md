# OAuth Flow Simulator Examples

Quick examples of using each of the 6 tools.

## 1. Generate PKCE Pair

Generate a PKCE code verifier and challenge for secure OAuth flows.

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "generate_pkce_pair",
    "params": {
      "verifierLength": 128
    }
  }'
```

Response:
```json
{
  "codeVerifier": "GH5~t-n2kX_Q9yL4mP8vR3bF6sJ1wZ0aB7cD~E2xN5mK9vL3tQ6rS0uW4yV8zC1d",
  "codeChallenge": "E9Mrozoa2owUujDGlvAjvPuGvMqBzNHGghC1Ty-mCGI",
  "codeChallengeMethod": "S256",
  "verifierLength": 128,
  "challengeLength": 43
}
```

## 2. Build Authorization URL

Build a complete OAuth authorization URL for redirecting users.

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "build_authorization_url",
    "params": {
      "baseUrl": "https://auth.example.com",
      "clientId": "my-spa-client",
      "redirectUri": "https://app.example.com/callback",
      "responseType": "code",
      "scope": "openid profile email",
      "state": "state_12345",
      "codeChallenge": "E9Mrozoa2owUujDGlvAjvPuGvMqBzNHGghC1Ty-mCGI"
    }
  }'
```

Response:
```json
{
  "url": "https://auth.example.com/authorize?response_type=code&client_id=my-spa-client&scope=openid+profile+email&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback&state=state_12345&code_challenge=E9Mrozoa2owUujDGlvAjvPuGvMqBzNHGghC1Ty-mCGI&code_challenge_method=S256",
  "params": {
    "response_type": "code",
    "client_id": "my-spa-client",
    "scope": "openid profile email",
    "redirect_uri": "https://app.example.com/callback",
    "state": "state_12345",
    "code_challenge": "E9Mrozoa2owUujDGlvAjvPuGvMqBzNHGghC1Ty-mCGI",
    "code_challenge_method": "S256"
  },
  "paramCount": 6
}
```

## 3. Simulate Authorization Code Flow

Step-by-step simulation of the OAuth 2.0 Authorization Code flow with PKCE.

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "simulate_flow",
    "params": {
      "flowType": "authorization_code",
      "config": {
        "clientId": "my-spa-client",
        "redirectUri": "https://app.example.com/callback",
        "scope": "openid profile email",
        "enablePkce": true
      }
    }
  }'
```

Response includes step-by-step walkthrough:
```json
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "User Initiates Login",
      "description": "User clicks login on application",
      "method": "USER_ACTION",
      "parameters": { "action": "click_login" },
      "rfcSection": "RFC 6749 §1.3.1"
    },
    {
      "stepNumber": 2,
      "title": "Application Redirects to Authorization Endpoint",
      "description": "Application redirects user to OAuth provider authorization endpoint",
      "method": "GET",
      "endpoint": "/authorize",
      "parameters": {
        "response_type": "code",
        "client_id": "my-spa-client",
        "redirect_uri": "https://app.example.com/callback",
        "scope": "openid profile email",
        "state": "random_state_value",
        "code_challenge": "computed_challenge_value",
        "code_challenge_method": "S256"
      },
      "rfcSection": "RFC 6749 §4.1.1, RFC 7636 §4.1"
    },
    // ... more steps (8 total)
  ],
  "stepCount": 8,
  "summary": "Authorization Code flow: Three-legged OAuth with user interaction and backend token exchange.",
  "educational": true,
  "flowType": "authorization_code"
}
```

## 4. Validate Token Response

Validate an OAuth token response for correctness.

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "validate_token_response",
    "params": {
      "response": {
        "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "token_type": "Bearer",
        "expires_in": 3600,
        "scope": "openid profile email",
        "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }'
```

Response:
```json
{
  "valid": true,
  "issues": [],
  "description": "Token response is valid"
}
```

Example with issues:
```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "validate_token_response",
    "params": {
      "response": {
        "access_token": "token123",
        "token_type": "Basic"
      }
    }
  }'
```

Response:
```json
{
  "valid": false,
  "issues": [
    {
      "severity": "error",
      "field": "expires_in",
      "message": "expires_in not provided; token expiration unknown"
    },
    {
      "severity": "warning",
      "field": "token_type",
      "message": "token_type should be \"Bearer\", got \"Basic\""
    }
  ]
}
```

## 5. Check Flow Configuration

Validate OAuth flow configuration against best practices.

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "check_flow_config",
    "params": {
      "flowType": "authorization_code",
      "config": {
        "clientId": "my-spa-client",
        "redirectUri": "https://app.example.com/callback",
        "scope": "openid profile email",
        "enablePkce": true
      }
    }
  }'
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "recommendation": "Authorization Code flow with PKCE is the recommended flow for most applications."
}
```

Example with warnings (implicit flow):
```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "check_flow_config",
    "params": {
      "flowType": "implicit",
      "config": {
        "clientId": "legacy-client",
        "redirectUri": "https://app.example.com/callback"
      }
    }
  }'
```

Response:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "field": "flowType",
      "message": "Implicit flow is NOT RECOMMENDED. Use Authorization Code flow with PKCE instead.",
      "severity": "warning"
    }
  ],
  "recommendation": "Switch to Authorization Code flow with PKCE. Implicit flow has security limitations."
}
```

## 6. Generate Test Scenarios

Generate comprehensive test scenarios for a specific OAuth flow.

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "generate_test_scenarios",
    "params": {
      "flowType": "authorization_code"
    }
  }'
```

Response:
```json
{
  "scenarios": [
    {
      "name": "Happy Path - Authorization Code Flow",
      "description": "Complete authorization code flow with PKCE and state validation",
      "input": {
        "clientId": "my-client-id",
        "redirectUri": "https://app.example.com/callback",
        "scope": "openid profile email",
        "enablePkce": true,
        "state": "random_state_12345"
      },
      "expectedOutcome": "User authenticated, authorization code issued, token exchanged successfully",
      "testSteps": [
        {
          "action": "Generate PKCE pair",
          "expectedResult": "code_verifier and code_challenge generated"
        },
        {
          "action": "Build authorization URL with code_challenge and state",
          "expectedResult": "URL contains challenge and state"
        },
        {
          "action": "User authenticates and consents",
          "expectedResult": "Redirect with authorization code and state"
        },
        {
          "action": "Validate state parameter",
          "expectedResult": "State matches initial value"
        },
        {
          "action": "Exchange code with code_verifier",
          "expectedResult": "Access token received"
        }
      ],
      "rfcReferences": [
        "RFC 6749 §4.1",
        "RFC 7636",
        "OpenID Connect Core 1.0"
      ]
    },
    // ... more scenarios
  ],
  "scenarioCount": 3,
  "flowType": "authorization_code"
}
```

## Client Credentials Flow Example

For backend-to-backend authentication:

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "simulate_flow",
    "params": {
      "flowType": "client_credentials",
      "config": {
        "clientId": "backend-service-client",
        "scope": "api:read api:write"
      }
    }
  }'
```

## Device Code Flow Example

For IoT devices and TVs:

```bash
curl -X POST http://localhost:8080/call_tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "simulate_flow",
    "params": {
      "flowType": "device_code",
      "config": {
        "clientId": "smart-tv-client",
        "scope": "video watch_history"
      }
    }
  }'
```

## All Flows Example

Quick test of all 5 supported flows:

```bash
for flow in authorization_code implicit client_credentials device_code password; do
  echo "Testing $flow flow..."
  curl -s -X POST http://localhost:8080/call_tool \
    -H "Content-Type: application/json" \
    -d "{
      \"tool\": \"simulate_flow\",
      \"params\": {
        \"flowType\": \"$flow\",
        \"config\": {
          \"clientId\": \"test-client\",
          \"redirectUri\": \"https://app.example.com/callback\",
          \"scope\": \"openid\"
        }
      }
    }" | jq '.stepCount'
done
```

## Integration Pattern

Typical integration in your OAuth testing workflow:

1. Call `generate_pkce_pair` to get verifier + challenge
2. Call `build_authorization_url` with the challenge
3. Call `simulate_flow` to understand the steps
4. Call `check_flow_config` to validate your config
5. After implementing, call `validate_token_response` with real token
6. Use `generate_test_scenarios` for comprehensive testing

This ensures your OAuth implementation matches RFC 6749, RFC 7636, and OpenID Connect specifications.
