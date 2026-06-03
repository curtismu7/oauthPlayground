# JWT Verifier MCP Server

Production-ready MCP (Model Context Protocol) server for JWT inspection, verification, and JWKS management.

## Features

- **jwt_decode_full** — Decode JWT into header, payload, and signature (no verification)
- **jwt_verify_signature** — Verify JWT signature cryptographically using JWKS URL
- **jwt_validate_claims** — Validate specific claims in JWT payload
- **jwt_fetch_jwks** — Fetch and inspect JSON Web Key Set from remote URL
- **jwt_inspect_key** — Inspect a specific key from JWKS by key ID (kid)

## Build Status

TypeScript: ✅ Zero errors (`npm run type-check`)
Build: ✅ Successful (`npm run build`)

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

Compiles TypeScript to `dist/` with strict type checking.

## Development

```bash
npm run dev
```

Watches `src/` and auto-rebuilds on changes.

## Architecture

- **src/index.ts** — MCP server entry point with StdioServerTransport
- **src/services/logger.ts** — Rotating JSON logger to `/tmp/jwt-verifier-mcp.log`
- **src/services/mcpErrors.ts** — Error handling and tool result formatting
- **src/services/jwtVerifierService.ts** — Core JWT/JWKS logic (jose, axios)
- **src/actions/** — Individual tool handlers (jwtDecode.ts, jwtVerify.ts, jwksTools.ts)

## Dependencies

- `@modelcontextprotocol/sdk@^1.0.1` — MCP protocol & types
- `jose@^5.9.6` — JWT signing/verification
- `axios@^1.7.7` — HTTP client for JWKS fetching
- `zod@^3.23.8` — Input validation
- `dotenv@^16.4.5` — Environment config

## Environment

No required environment variables. Create `.env` from `.env.example` if needed.

## Logging

All events logged to `/tmp/jwt-verifier-mcp.log` with automatic rotation at 10 MB.
