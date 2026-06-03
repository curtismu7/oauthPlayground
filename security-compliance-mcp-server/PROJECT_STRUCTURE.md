# Security Compliance Checker MCP Server

## Overview
A Model Context Protocol (MCP) server for OAuth 2.0 and OIDC security compliance checking with 6 tools and comprehensive scoring.

## Project Structure

```
security-compliance-mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point; registers 6 tools
│   ├── services/
│   │   ├── logger.ts            # Logging service
│   │   ├── mcpErrors.ts         # Decoupled error handler
│   │   ├── complianceRules.ts   # Rule definitions (10+ rules)
│   │   └── discoveryFetcher.ts  # OIDC discovery endpoint fetcher
│   └── actions/
│       ├── oauthRfc.ts          # check_oauth_config tool
│       ├── pkceCheck.ts         # check_pkce_compliance tool
│       ├── oidcDiscovery.ts     # check_oidc_discovery tool
│       ├── redirectUri.ts       # check_redirect_uri tool
│       ├── tokenSecurity.ts     # check_token_security tool
│       └── reporter.ts          # generate_compliance_report tool
├── dist/                        # Compiled TypeScript (auto-generated)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md (this file)
```

## 6 Tools

### 1. check_oauth_config
Validates OAuth 2.0 configuration against RFC compliance rules.

**Input:**
- `grantTypes` (string[]): Supported grant types
- `redirectUris` (string[]): Registered redirect URIs
- `clientType` (enum): confidential | public | native | spa
- `pkceEnabled` (boolean): PKCE status
- `tokenLifetimeSeconds` (number): Token lifetime in seconds
- `responseTypes` (string[]): Supported response types

**Output:**
- `checks[]`: Array of pass/fail check results
- `score` (0-100): Compliance score
- `summary`: Brief summary message

**Key Rules:**
- RFC6749_NO_WILDCARD_REDIRECT
- RFC8252_LOCALHOST_REDIRECT (for native apps)
- RFC9700_PKCE_REQUIRED_PUBLIC
- RFC9700_NO_IMPLICIT
- TOKEN_EXP_TOO_LONG
- RESPONSE_TYPE_CODE_PREFERRED

### 2. check_pkce_compliance
Validates PKCE (RFC 7636) implementation details.

**Input:**
- `codeVerifier` (string): 43-128 character verifier
- `codeChallenge` (string): Base64url encoded challenge
- `codeChallengeMethod` (enum): plain | S256

**Output:**
- `checks[]`: PKCE-specific compliance checks
- `verifierEntropy` (number): Shannon entropy of code verifier
- `isCompliant` (boolean): Overall compliance status

**Key Rules:**
- RFC7636_VERIFIER_LENGTH: 43-128 chars
- RFC7636_CHALLENGE_S256_PREFERRED: S256 > plain

### 3. check_oidc_discovery
Validates OIDC discovery endpoint and configuration.

**Input:**
- `issuerUrl` (string): OIDC issuer URL (required)

**Output:**
- `checks[]`: Discovery validation results
- `score` (0-100): Compliance score
- `discoveryUrl` (string): Full discovery URL
- `rawDiscovery` (object): Full discovery document

**Key Rules:**
- OIDC_REQUIRED_FIELDS: issuer, authorization_endpoint, token_endpoint, jwks_uri

**Note:** Fetches and validates live OIDC discovery endpoint.

### 4. check_redirect_uri
Validates redirect URIs per client type.

**Input:**
- `redirectUris` (string[]): List of URIs (required)
- `clientType` (enum): native | web | spa (required)

**Output:**
- `checks[]`: Overall URI validation results
- `perUriResults[]`:
  - `uri` (string)
  - `isValid` (boolean)
  - `issues[]`: Array of issues found

**Key Rules:**
- RFC6749_NO_WILDCARD_REDIRECT
- RFC8252_LOCALHOST_REDIRECT (native apps)
- RFC6749_HTTPS_REQUIRED (web/spa non-localhost)

### 5. check_token_security
Analyzes token payload for security claims and risk level.

**Input:**
- `payload` (object): JWT payload claims (required)

**Output:**
- `checks[]`: Security check results
- `riskLevel` (enum): low | medium | high

**Key Rules:**
- TOKEN_MISSING_AUD: Must have aud claim
- TOKEN_MISSING_SUB: Must have sub claim (OIDC)
- TOKEN_EXP_TOO_LONG: Should be ≤ 3600 sec

**Risk Calculation:**
- high: 2+ critical failures
- medium: 1 critical OR 2+ warnings
- low: 0 critical and ≤1 warning

### 6. generate_compliance_report
Generates comprehensive OAuth 2.0/OIDC compliance report with letter grade.

**Input:**
- `grantTypes` (string[]): Supported grant types
- `redirectUris` (string[]): Registered redirect URIs
- `clientType` (enum): confidential | public | native | spa
- `pkceEnabled` (boolean): PKCE enabled
- `issuerUrl` (string): OIDC issuer URL
- `tokenPayload` (object): Token for security analysis

**Output:**
- `reportId` (string): Unique report identifier
- `timestamp` (ISO8601): Report generation time
- `score` (0-100): Overall compliance score
- `grade` (A-F): Letter grade
  - A: ≥90
  - B: ≥75
  - C: ≥60
  - D: ≥45
  - F: <45
- `sections[]`: Per-section scores
- `remediationPlan[]`: Actionable fixes

## Compliance Rules (10+)

| Rule ID | Spec | Severity | Description |
|---------|------|----------|-------------|
| RFC7636_VERIFIER_LENGTH | RFC 7636 | error | Code verifier 43-128 chars |
| RFC7636_CHALLENGE_S256_PREFERRED | RFC 7636 | warn | Use S256 over plain |
| RFC6749_NO_WILDCARD_REDIRECT | RFC 6749 | error | No wildcards in redirect URIs |
| RFC8252_LOCALHOST_REDIRECT | RFC 8252 | warn | Native apps use localhost |
| RFC9700_PKCE_REQUIRED_PUBLIC | RFC 9700 | error | PKCE required for public clients |
| RFC9700_NO_IMPLICIT | RFC 9700 | error | No implicit grant flow |
| TOKEN_EXP_TOO_LONG | OAuth 2.0 BCP | warn | Token lifetime ≤ 1 hour |
| TOKEN_MISSING_AUD | RFC 6749 | error | Tokens must have aud claim |
| TOKEN_MISSING_SUB | OIDC | error | ID tokens must have sub claim |
| OIDC_REQUIRED_FIELDS | OIDC Core | error | Discovery must have required fields |
| RESPONSE_TYPE_CODE_PREFERRED | RFC 9700 | warn | Use response_type=code |

## Scoring Algorithm

**Per Check:**
- Pass (error): +10
- Pass (warn): +5
- Fail (error): -15
- Fail (warn): -5

**Normalization:** `Math.max(0, Math.min(100, 50 + (score / 10) * 10))`

**Report Scoring:** Average of all section scores.

## Installation & Usage

### Install
```bash
npm install
```

### Build
```bash
npm run build
```

### Start
```bash
npm start
```

### Type Check
```bash
npx tsc --noEmit
```

### Dev Mode
```bash
npm run dev
```

## Environment Variables

```bash
LOG_LEVEL=info                           # debug, info, warn, error
OAUTH_ISSUER_URL=https://.../.../as     # Optional: PingOne issuer URL
```

See `.env.example` for template.

## Dependencies

- `@modelcontextprotocol/sdk` ^1.0.0
- `axios` ^1.7.0
- `zod` ^3.23.0
- `dotenv` ^16.3.1
- `typescript` ^5.3.0 (dev)
- `@types/node` ^20.10.0 (dev)

**Note:** No `jose` dependency — validation is rules-based, not cryptographic.

## Error Handling

- `ComplianceError`: Base error with code and status
- `ValidationError`: Schema validation failures (400)
- `DiscoveryError`: OIDC endpoint fetch failures (502)
- `ConfigurationError`: Configuration issues (400)

All errors returned as structured JSON with error, code, message, statusCode.

## Integration Example

```typescript
import axios from 'axios';

// Connect to MCP server (stdio)
const result = await axios.post('http://localhost:3000/tools/check_oauth_config', {
  clientType: 'spa',
  grantTypes: ['authorization_code'],
  redirectUris: ['https://app.example.com/callback'],
  pkceEnabled: true,
});

console.log(result.data); // { checks: [...], score: 85, summary: "..." }
```

## License

MIT
