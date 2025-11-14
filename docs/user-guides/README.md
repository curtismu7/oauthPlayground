# User Guides

Welcome! This section contains documentation for **using** the PingOne OAuth Playground application.

> **Note:** If you're looking for developer documentation (architecture, services, implementation details), see the [main docs folder](../README.md).

## 📖 Quick Start

New to the OAuth Playground? Start here:

1. [Redirect URIs Configuration](flows/redirect-uris.md) - Configure your PingOne application
2. [Logout URIs Configuration](flows/logout-uris.md) - Set up logout functionality
3. [Security Features Guide](security/SECURITY_FEATURES_CONFIGURATION.md) - Configure security settings

## 🔐 OAuth/OIDC Flows

### Understanding Flows

- [PingOne pi.flow Usage](flows/pingone-pi-flow-guidance.md) - Non-redirect authorization flows
- [PAR (Pushed Authorization Requests)](flows/oidc_par_explanation_20251008.md) - Enhanced security for authorization
- [RAR (Rich Authorization Requests)](flows/oidc_rar_explanation_20251008.md) - Fine-grained authorization
- [PingOne Flow Explanation](flows/pingone_pi_flow_explanation_20251008.md) - PingOne-specific flow details

### Configuration Guides

- [Redirect URIs Reference](flows/redirect-uris.md) - Complete list of redirect URIs for all flows
- [Logout URIs Reference](flows/logout-uris.md) - Logout URI configuration for each flow

## 🔒 Security

- [Security Features Configuration](security/SECURITY_FEATURES_CONFIGURATION.md) - Comprehensive security setup guide
  - PKCE configuration
  - Client authentication
  - Token security
  - Advanced features (DPoP, PAR, JWKS)
  - Security testing and analysis

## 🎯 Common Tasks

### Setting Up Your First Flow

1. **Configure PingOne Application**
   - Add redirect URIs from the [Redirect URIs Reference](flows/redirect-uris.md)
   - Add logout URIs from the [Logout URIs Reference](flows/logout-uris.md)
   - Enable required security features

2. **Configure OAuth Playground**
   - Enter your PingOne credentials
   - Select the flow you want to test
   - Follow the step-by-step guide

3. **Test Your Configuration**
   - Run through the flow
   - Review security features
   - Check token responses

### Troubleshooting

**"Invalid redirect_uri" Error**
- Verify the URI is added to your PingOne application
- Check for exact match (including protocol and port)
- See [Redirect URIs Reference](flows/redirect-uris.md#troubleshooting)

**Logout Not Working**
- Ensure logout URI is configured in PingOne
- Check that you're using the flow-specific logout URI
- See [Logout URIs Reference](flows/logout-uris.md)

**Security Feature Issues**
- Review [Security Features Configuration](security/SECURITY_FEATURES_CONFIGURATION.md)
- Check PingOne application settings match playground configuration
- Run security tests in the playground

## 📚 Flow-Specific Guides

### Authorization Code Flow
- Redirect URI: `https://localhost:3000/authz-callback`
- Logout URI: `https://localhost:3000/authz-logout-callback`
- Best for: Web applications, SPAs

### Implicit Flow
- Redirect URI: `https://localhost:3000/implicit-callback`
- Logout URI: `https://localhost:3000/implicit-logout-callback`
- Best for: Legacy SPAs (consider Authorization Code + PKCE instead)

### Device Authorization Flow
- Redirect URI: `https://localhost:3000/device-code-status`
- Logout URI: `https://localhost:3000/device-logout-callback`
- Best for: Smart TVs, IoT devices

### Client Credentials Flow
- Redirect URI: `https://localhost:3000/worker-token-callback`
- Logout URI: `https://localhost:3000/worker-token-logout-callback`
- Best for: Server-to-server communication

## 🔗 Related Resources

### PingOne Documentation
- [PingOne Platform API](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [PingOne Admin Console](https://console.pingone.com/)

### OAuth/OIDC Standards
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)

## 💡 Tips

- **Always use HTTPS** in production environments
- **Enable PKCE** for all public clients (SPAs, mobile apps)
- **Use flow-specific logout URIs** to avoid conflicts
- **Test security features** before deploying to production
- **Keep credentials secure** - never commit them to version control

## 🆘 Getting Help

1. Check the relevant guide in this section
2. Review the troubleshooting sections
3. Test your configuration in the OAuth Playground
4. Check PingOne application settings
5. Review browser developer console for errors

## 📝 Feedback

Found an issue with the documentation? Have a suggestion?
- Check if there's already an issue filed
- Create a new issue with details
- Contribute improvements via pull request

---

**For Developers:** Looking for architecture, services, or implementation docs? See the [main documentation folder](../README.md).
