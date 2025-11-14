# Documentation Index

Welcome to the PingOne OAuth Playground documentation.

## 👥 For Users

**Looking to use the OAuth Playground?** Start here:

### [📖 User Guides](user-guides/)
Complete guides for using the application:
- [Redirect URIs Configuration](user-guides/flows/redirect-uris.md)
- [Logout URIs Configuration](user-guides/flows/logout-uris.md)
- [Security Features Guide](user-guides/security/SECURITY_FEATURES_CONFIGURATION.md)
- [Local Webhook Tunnel Setup](user-guides/WebhookTunnelSetup.md)
- [OAuth/OIDC Flow Guides](user-guides/flows/)

---

## 👨‍💻 For Developers

**Working on the codebase?** Developer documentation below:

### Quick Links

- [Async/Await Best Practices](async/ASYNC_BEST_PRACTICES.md)
- [OAuth Flows (Internal)](flows/)
- [Feature Documentation](features/)
- [Architecture](architecture/)

## Developer Documentation Structure

### 📚 [Async/Await Patterns](async/)
Best practices, refactoring guides, and syntax error prevention for async JavaScript/TypeScript code.

### 📋 [Phase Implementation Docs](phases/)
Documentation for multi-phase feature implementations and project milestones.

### 🔐 [OAuth/OIDC Flows (Internal)](flows/)
Internal development documentation for OAuth/OIDC flow implementations:
- OAuth 2.0 flow implementations
- OpenID Connect flow implementations
- Device Authorization implementation
- CIBA implementation
- PAR/RAR implementation
- SAML integration

> **Note:** For user-facing flow guides, see [User Guides](user-guides/flows/)

### ⚙️ [Features](features/)
Feature-specific implementation documentation:
- Credential storage and management
- Code generator
- Password reset flows
- Multi-factor authentication (MFA)
- Worker token management

### 🏗️ [Architecture](architecture/)
System architecture, service design, and component patterns.

### 📖 [Developer Guides](guides/)
Developer-focused guides:
- Setup and installation
- Testing strategies
- Deployment procedures
- Troubleshooting common issues

### 🔄 [Migration Guides](migration/)
Version migration guides and breaking changes:
- V5 to V6 migration
- V6 to V7 migration
- Credential storage migration

### 🔌 [API Documentation](api/)
Service and component API references.

### 📦 [Archive](archive/)
Historical documentation, completed session summaries, and deprecated features.

## Contributing

When adding new documentation:
1. Place files in the appropriate category folder
2. Use kebab-case for filenames: `feature-name.md`
3. Use UPPERCASE for summaries: `FEATURE_NAME_SUMMARY.md`
4. Update this index if adding new top-level categories
5. Add date prefixes for archives: `2025-11-06-feature-name.md`

## Finding Documentation

- **By Topic**: Browse the category folders above
- **By Date**: Check the [archive](archive/) organized by year
- **By Feature**: See [features](features/) directory
- **By Flow**: See [flows](flows/) directory

## Need Help?

- Check [troubleshooting guides](guides/troubleshooting/)
- Review [setup guides](guides/setup/)
- See [architecture docs](architecture/) for system design
