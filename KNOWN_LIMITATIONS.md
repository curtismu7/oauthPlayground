# Known Limitations

This document outlines known limitations and configuration requirements for the OAuth Playground.

## JAR (JWT-secured Authorization Request) - Not Supported

### What is JAR?

JAR (JWT-secured Authorization Request) is an OAuth 2.0 extension ([RFC 9101](https://datatracker.ietf.org/doc/html/rfc9101)) that requires authorization request parameters to be sent as a signed JWT instead of plain query parameters.

### Current Status

❌ **Not Supported** - The OAuth Playground does not currently support generating signed request objects.

### Error Message

If your PingOne OAuth client has `requireSignedRequestObject` enabled, you'll see:

```json
{
  "id": "...",
  "code": "INVALID_DATA",
  "details": {
    "code": "INVALID_VALUE",
    "target": "request",
    "message": "The \"request\" must be supplied when requireSignedRequestObject is on."
  }
}
```

### Workaround

**Disable `requireSignedRequestObject` in PingOne:**

1. Navigate to: **Applications** → Your OAuth Client → **Configuration** tab
2. Scroll to **"Require Signed Request Object"** setting
3. Toggle it **OFF**
4. Click **Save**

### Why Not Implement JAR?

JAR support requires:
- JWT signing capabilities (HMAC or RSA)
- Private key management
- Complex request object construction
- Support for multiple signing algorithms

For a demo/playground application, this adds significant complexity without substantial educational value for most OAuth flows. The core OAuth concepts can be demonstrated without JAR.

### When Would You Use JAR in Production?

JAR is typically used in high-security environments where:
- Authorization request integrity must be cryptographically guaranteed
- Request parameters cannot be tampered with in transit
- Compliance requirements mandate request signing
- Additional security beyond HTTPS is required

## PAR (Pushed Authorization Requests) - ✅ Supported

PAR is fully supported via the dedicated PAR flow pages:
- **PingOne PAR Flow V6** (`/flows/pingone-par-v6`)
- **RAR Flow V6** (`/flows/rar-v6`)

## Other Limitations

### 1. Client Authentication Methods

**Supported:**
- `client_secret_post` (default)
- `client_secret_basic`
- `client_secret_jwt` (PAR flows only)
- `private_key_jwt` (PAR flows only)

**Not Supported:**
- `tls_client_auth`
- `self_signed_tls_client_auth`

### 2. Response Modes

**Supported:**
- `query` (default for code flow)
- `fragment` (implicit flow)
- `form_post`
- `pi.flow` (redirectless flow)

**Not Supported:**
- `web_message`
- `jwt` (JARM - JWT-secured Authorization Response Mode)

### 3. Grant Types

**Supported:**
- ✅ Authorization Code
- ✅ Implicit
- ✅ Hybrid
- ✅ Client Credentials
- ✅ Device Authorization
- ✅ JWT Bearer
- ✅ SAML Bearer
- ✅ Refresh Token

**Not Supported:**
- ❌ Password Grant (deprecated)
- ❌ CIBA (Client-Initiated Backchannel Authentication)

---

## Contributing

If you'd like to implement support for any of these features, please:
1. Open an issue to discuss the implementation approach
2. Submit a PR with comprehensive tests
3. Update this documentation

## Questions?

For PingOne-specific configuration questions, consult the [PingOne documentation](https://docs.pingidentity.com/).

For OAuth/OIDC specification questions, refer to:
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [JAR RFC 9101](https://datatracker.ietf.org/doc/html/rfc9101)

