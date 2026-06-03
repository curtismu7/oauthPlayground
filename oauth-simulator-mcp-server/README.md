# OAuth Flow Simulator MCP Server

An educational Model Context Protocol (MCP) server for simulating and learning OAuth 2.0 and OpenID Connect flows. Perfect for developers, security researchers, and learners who need to understand the mechanics of different OAuth grant types and PKCE security.

## Features

- **6 Interactive Tools** for building, simulating, validating, and testing OAuth flows
- **5 OAuth 2.0 Flow Types**: Authorization Code, Implicit, Client Credentials, Device Code, Password
- **PKCE Support**: RFC 7636 compliant code verifier and challenge generation using Node.js crypto
- **Flow Simulation**: Step-by-step educational walkthroughs with RFC references
- **Token Validation**: Validate OAuth token responses for correctness and completeness
- **Configuration Checking**: Best practice validation and security recommendations
- **Test Scenario Generation**: Comprehensive test cases including happy path, edge cases, and security checks

## Installation

```bash
npm install
```

## Building

```bash
npm run build      # Compile TypeScript to dist/
npm run typecheck  # Type-check without emitting
```

## Running

```bash
npm start          # Run the compiled server
npm run dev        # Compile and run
```

## Tools Reference

### 1. `generate_pkce_pair`
Generate PKCE code verifier and challenge pair using SHA-256.

**Input:**
```json
{
  "verifierLength": 128
}
```

**Output:**
```json
{
  "codeVerifier": "abc123...xyz",
  "codeChallenge": "E9Mrozoa2owUujDGl...",
  "codeChallengeMethod": "S256",
  "verifierLength": 128,
  "challengeLength": 43
}
```

### 2. `build_authorization_url`
Construct an OAuth authorization URL with parameters.

**Input:**
```json
{
  "baseUrl": "https://auth.example.com",
  "clientId": "my-client-id",
  "redirectUri": "https://app.example.com/callback",
  "scope": "openid profile email",
  "responseType": "code",
  "state": "random_state_value",
  "codeChallenge": "E9Mrozoa2owUujDGl..."
}
```

**Output:**
```json
{
  "url": "https://auth.example.com/authorize?response_type=code&...",
  "params": { "response_type": "code", "client_id": "...", ... },
  "paramCount": 6
}
```

### 3. `simulate_flow`
Simulate an OAuth flow step-by-step with detailed educational information.

**Input:**
```json
{
  "flowType": "authorization_code",
  "config": {
    "clientId": "my-client-id",
    "redirectUri": "https://app.example.com/callback",
    "scope": "openid profile email",
    "enablePkce": true
  }
}
```

**Output:**
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
    ...
  ],
  "stepCount": 8,
  "summary": "Authorization Code flow: Three-legged OAuth with user interaction...",
  "educational": true,
  "flowType": "authorization_code"
}
```

### 4. `validate_token_response`
Validate an OAuth token response for required fields and formats.

**Input:**
```json
{
  "response": {
    "access_token": "access_token_value",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

**Output:**
```json
{
  "valid": true,
  "issues": [],
  "description": "Token response is valid"
}
```

### 5. `check_flow_config`
Validate OAuth flow configuration against best practices.

**Input:**
```json
{
  "flowType": "authorization_code",
  "config": {
    "clientId": "my-client-id",
    "redirectUri": "https://app.example.com/callback"
  }
}
```

**Output:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "recommendation": "Authorization Code flow with PKCE is the recommended flow for most applications."
}
```

### 6. `generate_test_scenarios`
Generate comprehensive test scenarios for a specific OAuth flow.

**Input:**
```json
{
  "flowType": "authorization_code"
}
```

**Output:**
```json
{
  "scenarios": [
    {
      "name": "Happy Path - Authorization Code Flow",
      "description": "Complete authorization code flow with PKCE and state validation",
      "input": { "clientId": "...", "redirectUri": "...", "enablePkce": true },
      "expectedOutcome": "User authenticated, authorization code issued, token exchanged successfully",
      "testSteps": [
        { "action": "Generate PKCE pair", "expectedResult": "code_verifier and code_challenge generated" },
        ...
      ],
      "rfcReferences": ["RFC 6749 §4.1", "RFC 7636", "OpenID Connect Core 1.0"]
    },
    ...
  ],
  "scenarioCount": 3,
  "flowType": "authorization_code"
}
```

## Supported OAuth 2.0 Flows

### Authorization Code Flow (RFC 6749 §4.1)
Recommended flow for web applications. User authenticates at authorization server, application receives authorization code, exchanges code for tokens via backend.

### Implicit Flow (RFC 6749 §4.2)
NOT RECOMMENDED for new applications. Tokens returned directly in URL fragment. Security limitations documented in OAuth 2.0 Security Best Practices.

### Client Credentials Flow (RFC 6749 §4.4)
Backend-to-backend authentication without user involvement. No user interaction, direct token issuance to client.

### Device Code Flow (RFC 8628)
For devices without a browser (TVs, IoT devices). User completes authentication on a secondary device using a user code.

### Resource Owner Password Credentials (RFC 6749 §4.3)
NOT RECOMMENDED for new applications. Direct username/password exchange. Only for highly trusted first-party applications.

## PKCE Implementation

Uses Node.js native `node:crypto` module for security:
- **Verifier**: 43-128 character unreserved character string ([A-Z][a-z][0-9]-._~)
- **Challenge**: Base64URL-encoded SHA-256 hash of verifier
- **Method**: S256 (SHA-256)

```typescript
import { randomBytes, createHash } from 'node:crypto';

function generateVerifier(length: number = 128): string {
  // Generate random verifier using unreserved characters
}

function computeChallenge(verifier: string): string {
  // Compute base64url(sha256(verifier))
}
```

## Configuration

Environment variables (see `.env.example`):
- `LOG_LEVEL`: 'debug' | 'info' | 'warn' | 'error' (default: 'info')
- `DEFAULT_ISSUER_URL`: Optional default issuer URL for token validation
- `PKCE_VERIFIER_MIN_LENGTH`: Minimum PKCE verifier length (default: 43)
- `PKCE_VERIFIER_MAX_LENGTH`: Maximum PKCE verifier length (default: 128)
- `ENABLE_EDUCATIONAL_MODE`: Enable educational details in responses (default: true)
- `INCLUDE_RFC_REFERENCES`: Include RFC section references (default: true)

## Architecture

```
src/
├── index.ts                    # MCP server with 6 tool registrations
├── services/
│   ├── logger.ts              # Logging utility (debug/info/warn/error)
│   ├── mcpErrors.ts           # Decoupled error types (McpError, ValidationError, etc.)
│   ├── pkceService.ts         # PKCE generation and validation (node:crypto)
│   └── flowEngine.ts          # Stateless flow step generator
└── actions/
    ├── pkce.ts                # generate_pkce_pair tool
    ├── urlBuilder.ts          # build_authorization_url tool
    ├── simulator.ts           # simulate_flow tool
    ├── validator.ts           # validate_token_response + check_flow_config tools
    └── scenarios.ts           # generate_test_scenarios tool
```

## Error Handling

The server uses typed error classes:
- `McpError`: Base error with code, message, statusCode
- `ValidationError`: Input validation failures
- `ConfigError`: Configuration validation failures
- `FlowError`: Flow simulation errors
- `TokenError`: Token validation errors

All errors are caught and returned as JSON responses with error messages.

## Development

### Type Checking
```bash
npx tsc --noEmit
```

### Building
```bash
npm run build
```

### Logging
Set `LOG_LEVEL` environment variable:
```bash
LOG_LEVEL=debug npm start
```

## Learning Resources

Each flow simulation includes:
- Step-by-step educational walkthrough
- Parameter explanations
- Expected responses
- RFC 6749, RFC 7636, RFC 8628, and OpenID Connect Core references
- Security notes and best practices

## Security Notes

1. **Never expose secrets**: Client secrets should always be transmitted over HTTPS in POST body
2. **PKCE required**: Use PKCE for all public clients (SPAs, native apps)
3. **State parameter**: Required for CSRF protection in authorization code flow
4. **Nonce in OIDC**: Required in implicit and hybrid flows to prevent token substitution
5. **HTTPS enforcement**: All OAuth flows should use HTTPS for production

## License

MIT

## References

- [RFC 6749: OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 7636: Proof Key for Public Clients (PKCE)](https://tools.ietf.org/html/rfc7636)
- [RFC 8628: OAuth 2.0 Device Authorization Grant](https://tools.ietf.org/html/rfc8628)
- [RFC 6750: OAuth 2.0 Bearer Token Usage](https://tools.ietf.org/html/rfc6750)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
