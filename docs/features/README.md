# Feature Documentation

Documentation for key features and capabilities of the PingOne OAuth Playground.

## Available Features

### [Credential Storage](credentials/)
Secure storage and management of OAuth credentials:
- Flow-specific credential isolation
- Multi-tier storage (memory, browser, file)
- Worker token management
- Cross-tab synchronization
- Import/export capabilities

### [Code Generator](code-generator/)
Generate production-ready code from flow configurations:
- Multiple language support
- Framework-specific templates
- Best practices included
- Copy-paste ready

### [Password Reset](password-reset/)
Self-service password reset flows:
- Email-based reset
- SMS-based reset
- Security questions
- Account recovery

### [Multi-Factor Authentication (MFA)](mfa/)
MFA enrollment and verification:
- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification
- Push notifications
- Biometric authentication

### [Worker Token Management](worker-token/)
Automated management of PingOne Management API tokens:
- Automatic token refresh
- Token caching
- Expiration handling
- Retry logic
- Status monitoring

## Feature Status

| Feature | Status | Version |
|---------|--------|---------|
| Credential Storage | ✅ Active | v7 |
| Code Generator | ✅ Active | v7 |
| Password Reset | ✅ Active | v7 |
| MFA | ✅ Active | v7 |
| Worker Token | ✅ Active | v7 |

## Getting Started

1. Review the feature documentation in each subdirectory
2. Check requirements and prerequisites
3. Follow setup instructions
4. Test with sample configurations
5. Integrate into your flows

## Common Patterns

- All features support v7 flows
- Credentials are flow-specific (except Worker Token)
- Features include error handling and retry logic
- UI components are responsive and accessible
- All features support dark mode
