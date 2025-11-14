# OAuth/OIDC Flow Documentation

Comprehensive documentation for all supported authentication and authorization flows.

## OAuth 2.0 Flows

### [OAuth Flows](oauth/)
- Authorization Code Flow
- Implicit Flow
- Client Credentials Flow
- Resource Owner Password Credentials
- Refresh Token Flow

## OpenID Connect Flows

### [OIDC Flows](oidc/)
- Authorization Code with PKCE
- Hybrid Flow
- ID Token validation
- UserInfo endpoint

## Specialized Flows

### [Device Authorization](device/)
Device Authorization Grant for input-constrained devices (smart TVs, IoT devices).

### [CIBA](ciba/)
Client Initiated Backchannel Authentication for decoupled authentication scenarios.

### [PAR](par/)
Pushed Authorization Requests for enhanced security.

### [SAML](saml/)
SAML 2.0 integration and federation.

## Flow Selection Guide

| Use Case | Recommended Flow |
|----------|------------------|
| Web application | Authorization Code + PKCE |
| Single Page App (SPA) | Authorization Code + PKCE |
| Mobile app | Authorization Code + PKCE |
| Server-to-server | Client Credentials |
| Smart TV / IoT | Device Authorization |
| Decoupled auth | CIBA |
| Legacy integration | SAML |

## Common Concepts

- **Scopes**: Define access permissions
- **Tokens**: Access tokens, ID tokens, refresh tokens
- **PKCE**: Proof Key for Code Exchange
- **State**: CSRF protection
- **Nonce**: Replay attack protection

## Testing Flows

Each flow includes:
- Step-by-step walkthrough
- Request/response examples
- Error handling scenarios
- Security considerations
