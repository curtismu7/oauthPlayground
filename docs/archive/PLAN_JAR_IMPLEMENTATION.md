# JAR (JWT-secured Authorization Request) Implementation Plan

## Overview

This document outlines a comprehensive plan to implement JAR (JWT-secured Authorization Request) support in the OAuth Playground, as specified in RFC 9101. JAR allows authorization request parameters to be sent as a signed JWT instead of plain query parameters, providing enhanced security and preventing parameter tampering.

## Current Status

- ❌ **Not Supported** - The OAuth Playground currently does not support JAR
- ✅ **Pre-flight Validation** - We detect when PingOne requires JAR and show appropriate error messages
- ✅ **Educational Content** - Users are informed about JAR limitations and configuration options

## Requirements Analysis

### What is JAR?

According to RFC 9101, JAR allows:
- Authorization request parameters to be encoded as a JWT (JSON Web Token)
- The JWT to be signed using standard JWT signing algorithms (HS256, RS256, ES256, etc.)
- The signed JWT to be sent as a `request` parameter instead of individual query parameters
- Optional encryption of the request object (JWE)

### PingOne Configuration

PingOne supports three configuration options:
1. **Default** - Requires signed request objects (JAR required)
2. **Require signed request parameter** - Only accepts signed request objects (JAR required)
3. **Allow unsigned request parameter** - Allows both signed and unsigned requests (JAR optional)

### What We Need to Support

To fully support JAR, we need:
- ✅ JWT signing capabilities (we already have this for client authentication)
- ✅ Private key management (we already have this for `private_key_jwt`)
- ✅ Request object construction (partially exists in `jwtGenerator.ts`)
- ✅ Support for multiple signing algorithms (HS256, RS256, ES256)
- ❌ Integration with authorization URL generation
- ❌ UI for JAR configuration and key selection
- ❌ Educational content and documentation

## Existing Capabilities

### ✅ What We Already Have

1. **JWT Generation Infrastructure**
   - `src/utils/jwtGenerator.ts` - Has `generateRequestObject()` method
   - `src/services/jwtAuthServiceV8.ts` - JWT signing for client authentication
   - `src/components/JWTConfigV8.tsx` - UI for JWT configuration

2. **Signing Algorithms Supported**
   - HS256 (HMAC-SHA256) - Using client secret
   - RS256 (RSA-SHA256) - Using private key
   - ES256 (ECDSA-SHA256) - Partially supported

3. **Private Key Management**
   - Users can input private keys via `JWTConfigV8`
   - Key storage in credentials (with security considerations)

4. **Authorization URL Generation**
   - `src/v8/services/oauthIntegrationServiceV8.ts` - Authorization code flow
   - `src/v8/services/hybridFlowIntegrationServiceV8.ts` - Hybrid flow
   - `src/v8/services/implicitFlowIntegrationServiceV8.ts` - Implicit flow

### ❌ What We Need to Build

1. **Request Object Builder Service**
   - Convert OAuth parameters to JWT claims
   - Handle all OAuth/OIDC parameters (state, nonce, code_challenge, etc.)
   - Support nested claims structure

2. **JAR Service Integration**
   - Modify authorization URL generation to detect JAR requirement
   - Generate request object when needed
   - Replace query parameters with `request` parameter

3. **UI Components**
   - JAR configuration toggle/section
   - Signing algorithm selection
   - Key selection (client secret vs private key)
   - Request object preview/debug view

4. **Documentation & Education**
   - Update educational modals
   - Add JAR-specific examples
   - Document signing algorithm differences

## Technical Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Authorization URL Generator               │
│  (oauthIntegrationServiceV8, hybridFlowIntegrationServiceV8) │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Pre-flight Validation Service                   │
│  Checks: requireSignedRequestObject === true                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼ (if JAR required)
┌─────────────────────────────────────────────────────────────┐
│                   JAR Request Object Service                 │
│  - Build JWT payload from OAuth parameters                  │
│  - Select signing algorithm (HS256/RS256/ES256)            │
│  - Sign request object                                      │
│  - Return signed JWT                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  JWT Signing Infrastructure                  │
│  - jwtAuthServiceV8 (HMAC signing)                          │
│  - Web Crypto API (RSA/ECDSA signing)                       │
│  - jwtGenerator.ts (request object builder)                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Configuration**
   ```
   User selects flow → Configures credentials → Enables JAR (if PingOne requires it)
   ```

2. **Pre-flight Validation**
   ```
   Check appConfig.requireSignedRequestObject → If true, require JAR configuration
   ```

3. **Authorization URL Generation**
   ```
   Build OAuth parameters → If JAR required → Generate request object JWT → Replace params with 'request'
   ```

4. **Request Object Structure** (RFC 9101 compliant)
   ```json
   {
     "iss": "client_id",
     "aud": "https://auth.pingone.com/{env-id}/as/authorize",
     "response_type": "code",
     "client_id": "client_id",
     "redirect_uri": "https://...",
     "scope": "openid profile email",
     "state": "xyz123",
     "nonce": "abc456",
     "code_challenge": "...",
     "code_challenge_method": "S256",
     "max_age": 3600,
     "claims": {
       "userinfo": {...},
       "id_token": {...}
     },
     "iat": 1234567890,
     "exp": 1234568190,
     "jti": "unique-request-id"
   }
   ```

## Implementation Phases

### Phase 1: Core JAR Request Object Service ⏱️ (2-3 days)

**Goal**: Build a service that can generate RFC 9101-compliant request objects

**Tasks**:
1. Create `src/v8/services/jarRequestObjectServiceV8.ts`
   - `buildRequestObjectPayload()` - Convert OAuth params to JWT claims
   - `signRequestObject()` - Sign the request object using selected algorithm
   - `generateRequestObjectJWT()` - Main method combining payload + signing
   
2. Support all OAuth/OIDC parameters:
   - Required: `iss`, `aud`, `response_type`, `client_id`, `redirect_uri`, `scope`
   - Optional: `state`, `nonce`, `code_challenge`, `code_challenge_method`, `max_age`, `prompt`, `display`, `claims`, etc.

3. Algorithm support:
   - HS256 (using client secret) - Primary method for JAR
   - RS256 (using private key) - Secondary method
   - ES256 (using EC private key) - Future enhancement

4. Add unit tests for request object generation

**Deliverables**:
- `jarRequestObjectServiceV8.ts` service
- Unit tests covering all parameter types
- Integration tests with PingOne

---

### Phase 2: Integration with Authorization URL Generation ⏱️ (2-3 days)

**Goal**: Modify authorization URL generators to use JAR when required

**Tasks**:
1. Update `oauthIntegrationServiceV8.ts`
   - Detect `appConfig.requireSignedRequestObject`
   - Call JAR service if needed
   - Replace query params with `request` parameter
   - Keep `client_id` in query (required by spec)

2. Update `hybridFlowIntegrationServiceV8.ts`
   - Same JAR integration as authorization code flow
   - Ensure `response_type` and other hybrid-specific params are included

3. Update `implicitFlowIntegrationServiceV8.ts`
   - Same JAR integration
   - Note: Implicit flow typically uses fragment, but JAR uses `request` param in query

4. Update pre-flight validation:
   - When JAR is required, validate that:
     - Signing key/secret is available
     - Signing algorithm is selected
     - All required parameters are present

**Deliverables**:
- Updated authorization URL generators
- Updated pre-flight validation
- End-to-end tests for each flow type

---

### Phase 3: UI Components & Configuration ⏱️ (3-4 days)

**Goal**: Add JAR configuration UI to credentials form

**Tasks**:
1. Update `CredentialsFormV8U.tsx`
   - Add JAR section in Advanced Options
   - Toggle for "Enable JAR" (auto-enabled if PingOne requires it)
   - Algorithm selector (HS256/RS256/ES256)
   - Key selection (client secret vs private key)
   - Request object preview (show JWT payload before signing)

2. Update `JWTConfigV8.tsx` (if needed)
   - Ensure it can be used for request object signing
   - Add context-aware help text for JAR vs client auth

3. Add visual indicators:
   - Show when JAR is required vs optional
   - Display signing algorithm being used
   - Show request object preview/debug view

4. Update educational modals:
   - Update JAR modal to show it's now supported
   - Add examples of request objects
   - Explain signing algorithm differences

**Deliverables**:
- JAR configuration UI
- Request object preview/debug view
- Updated educational content

---

### Phase 4: Testing & Documentation ⏱️ (2-3 days)

**Goal**: Comprehensive testing and documentation

**Tasks**:
1. **Unit Tests**
   - Request object payload generation
   - Signing with different algorithms
   - Parameter validation
   - Error handling

2. **Integration Tests**
   - End-to-end flows with PingOne
   - Test with HS256 (client secret)
   - Test with RS256 (private key)
   - Test with different flow types

3. **Documentation**
   - Update `KNOWN_LIMITATIONS.md` - Remove JAR from limitations
   - Add JAR guide to docs
   - Update API documentation
   - Add examples for each signing method

4. **Error Handling**
   - Invalid key/secret errors
   - Signing failures
   - PingOne validation errors
   - User-friendly error messages

**Deliverables**:
- Complete test suite
- Updated documentation
- Error handling improvements

---

## Technical Specifications

### Request Object JWT Structure

**Header** (example for HS256):
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** (RFC 9101 compliant):
```json
{
  "iss": "client_id",
  "aud": "https://auth.pingone.com/{env-id}/as/authorize",
  "response_type": "code",
  "client_id": "client_id",
  "redirect_uri": "https://app.com/callback",
  "scope": "openid profile email",
  "state": "xyz123abc",
  "nonce": "nonce123",
  "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256",
  "max_age": 3600,
  "prompt": "login",
  "claims": {
    "userinfo": {
      "email": null
    },
    "id_token": {
      "email": null
    }
  },
  "iat": 1234567890,
  "exp": 1234568190,
  "jti": "unique-request-id"
}
```

### Signing Algorithms

1. **HS256** (HMAC-SHA256)
   - Uses client secret
   - Simplest to implement
   - Recommended for JAR in most cases
   - Already supported in our JWT infrastructure

2. **RS256** (RSA-SHA256)
   - Uses RSA private key
   - More secure for high-security scenarios
   - Already supported for client authentication

3. **ES256** (ECDSA-SHA256)
   - Uses EC private key
   - More efficient than RSA
   - Future enhancement

### Authorization URL Format with JAR

**Standard URL** (without JAR):
```
https://auth.pingone.com/{env-id}/as/authorize?
  client_id=client123&
  response_type=code&
  redirect_uri=https://app.com/callback&
  scope=openid profile&
  state=xyz123
```

**JAR URL** (with request parameter):
```
https://auth.pingone.com/{env-id}/as/authorize?
  client_id=client123&
  request=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJjbGllbnQxMjMiLCJhdWQiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vZXh0L2FzL2F1dGhvcml6ZSIsInJlc3BvbnNlX3R5cGUiOiJjb2RlIiwiY2xpZW50X2lkIjoiY2xpZW50MTIzIiwicmVkaXJlY3RfdXJpIjoiaHR0cHM6Ly9hcHAuY29tL2NhbGxiYWNrIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSIsInN0YXRlIjoieHl6MTIzIn0.signature
```

**Key Points**:
- `client_id` MUST remain in query parameters (RFC 9101 requirement)
- All other parameters move into the `request` JWT
- The `request` parameter contains the signed JWT

## Dependencies & Prerequisites

### External Dependencies

- ✅ Web Crypto API (for RS256/ES256 signing) - Available in modern browsers
- ✅ Base64 URL encoding utilities - Already implemented
- ⚠️ Consider adding `jose` library for robust JWT handling (optional)

### Internal Dependencies

- ✅ JWT generation utilities (`jwtGenerator.ts`, `jwtAuthServiceV8.ts`)
- ✅ Private key handling (already in `JWTConfigV8`)
- ✅ Pre-flight validation service (`preFlightValidationServiceV8.ts`)
- ✅ App discovery service (for `requireSignedRequestObject` detection)

### Browser Support

- Web Crypto API: Supported in all modern browsers (Chrome, Firefox, Safari, Edge)
- No polyfills needed for core functionality
- Optional: Consider `jose` library for better algorithm support if needed

## Security Considerations

### Key Storage

**Current Approach** (for client authentication):
- Private keys stored in browser localStorage/sessionStorage
- ⚠️ **Security Risk**: Keys visible in browser storage
- ✅ **For Playground**: Acceptable for demo/educational purposes
- ❌ **For Production**: Never store private keys in browser storage

**For JAR Implementation**:
- Use same storage approach as client authentication (consistency)
- Add clear warnings about key security
- Consider adding key import/export functionality for better UX

### Signing Algorithm Selection

- **HS256**: Uses client secret (simpler, less secure for high-security scenarios)
- **RS256**: Uses private key (more secure, recommended for production)
- Default to HS256 (simpler UX) unless user selects RS256

### Request Object Validation

- Ensure all required parameters are present
- Validate `exp` (expiration) - RFC 9101 requires short-lived request objects (e.g., 5-10 minutes)
- Validate `iat` (issued at) - Should be current time
- Ensure `jti` (JWT ID) is unique per request

## Testing Strategy

### Unit Tests

1. **Request Object Generation**
   - Test payload construction with all parameter types
   - Test with missing required parameters
   - Test with optional parameters
   - Test nested claims structure

2. **Signing**
   - Test HS256 signing with client secret
   - Test RS256 signing with RSA private key
   - Test signature verification (verify the signed JWT)

3. **URL Generation**
   - Test standard URL generation (without JAR)
   - Test JAR URL generation (with `request` parameter)
   - Test `client_id` preservation in query params

### Integration Tests

1. **PingOne Integration**
   - Test with `requireSignedRequestObject: true`
   - Test with `requireSignedRequestObject: false`
   - Test authorization code flow with JAR
   - Test hybrid flow with JAR
   - Test implicit flow with JAR

2. **Error Scenarios**
   - Invalid client secret/key
   - Expired request object
   - Missing required parameters
   - PingOne validation errors

### Manual Testing Checklist

- [ ] Enable JAR in PingOne application
- [ ] Configure JAR in OAuth Playground (HS256)
- [ ] Generate authorization URL with JAR
- [ ] Complete authorization code flow
- [ ] Complete hybrid flow
- [ ] Complete implicit flow
- [ ] Test with RS256 (private key)
- [ ] Test error handling (invalid key, expired request, etc.)
- [ ] Test pre-flight validation
- [ ] Test UI components (config, preview, etc.)

## Timeline Estimate

**Total Estimated Time**: 10-13 days

- Phase 1 (Core Service): 2-3 days
- Phase 2 (Integration): 2-3 days
- Phase 3 (UI Components): 3-4 days
- Phase 4 (Testing & Docs): 2-3 days

**Buffer Time**: +2 days for unexpected issues

**Total**: 12-15 days of focused development

## Success Criteria

1. ✅ Users can configure JAR in the credentials form
2. ✅ Pre-flight validation detects JAR requirement
3. ✅ Authorization URLs are generated with `request` parameter when needed
4. ✅ All OAuth flow types support JAR (authorization code, hybrid, implicit)
5. ✅ Both HS256 and RS256 signing are supported
6. ✅ Request objects are RFC 9101 compliant
7. ✅ Comprehensive test coverage (>80%)
8. ✅ Documentation is updated and accurate
9. ✅ Error messages are user-friendly and actionable
10. ✅ PingOne integration works end-to-end

## Future Enhancements (Post-MVP)

1. **ES256 Support** (ECDSA-SHA256)
   - More efficient than RSA
   - Better for mobile/embedded devices

2. **Request Object Encryption** (JWE)
   - Encrypt request objects for additional security
   - Support JWE algorithms (RSA-OAEP, etc.)

3. **Request URI (Pushed Authorization)**
   - Combine JAR with PAR (Pushed Authorization Requests)
   - Push signed request object to `/as/par` endpoint
   - Use `request_uri` in authorization URL

4. **Key Management UI**
   - Better key import/export
   - Key rotation support
   - Key validation before use

5. **Request Object Debugging**
   - Decode and display request object contents
   - Validate request object structure
   - Show signing details

## References

- [RFC 9101 - JWT-Secured Authorization Request (JAR)](https://datatracker.ietf.org/doc/html/rfc9101)
- [RFC 7519 - JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 7515 - JSON Web Signature (JWS)](https://datatracker.ietf.org/doc/html/rfc7515)
- [PingOne API Documentation](https://apidocs.pingidentity.com/)

## Notes

- This implementation focuses on the most common use case: signed request objects (JWS)
- Request object encryption (JWE) is deferred to future enhancements
- We prioritize HS256 and RS256 algorithms (most commonly used)
- UI should guide users to use JAR when PingOne requires it, but make it optional otherwise
