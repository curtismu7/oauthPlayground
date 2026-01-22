# Production Group Flows Documentation

## Overview

This document provides comprehensive documentation for all flows in the **Production Group** section of the OAuth Playground. These flows represent the latest, most secure, and production-ready implementations for OAuth 2.0 and OpenID Connect with PingOne.

## 📋 Table of Contents

- [Unified OAuth & OIDC Flow](#unified-oauth--oidc-flow)
- [SPIFFE/SPIRE Mock Flow](#spiffespire-mock-flow)
- [PingOne MFA Flow](#pingone-mfa-flow)
- [Delete All Devices Utility](#delete-all-devices-utility)
- [MFA One-Time Devices](#mfa-one-time-devices)
- [Email MFA Sign-On](#email-mfa-signon)

---

## 🎯 Unified OAuth & OIDC Flow

**Path:** `/v8u/unified`  
**Status:** ✅ **NEW** - V8U: Single UI for all OAuth/OIDC flows with real PingOne APIs

### Overview
The Unified OAuth & OIDC Flow provides a single, consolidated interface for all OAuth 2.0 and OpenID Connect flows. It replaces multiple separate flow implementations with one unified interface that supports:

- **OAuth 2.0 Authorization Code Flow** (with PKCE)
- **OAuth 2.0 Implicit Flow** (legacy, not recommended)
- **OAuth 2.0 Client Credentials Flow** (worker tokens)
- **OAuth 2.0 Resource Owner Password Flow** (legacy)
- **OpenID Connect Authorization Code Flow** (with PKCE)
- **OpenID Connect Implicit Flow** (legacy)
- **OpenID Connect Hybrid Flow** (legacy)

### Key Features
- **Single Interface**: One UI for all flow types
- **Real PingOne APIs**: Direct integration with PingOne services
- **PKCE Support**: Automatic PKCE for public clients
- **Pre-flight Validation**: Configuration validation before requests
- **Security Scorecard**: Real-time security compliance feedback
- **Token Monitoring**: Comprehensive token lifecycle management
- **Collapsible Documentation**: Enhanced API documentation with expandable sections

### Configuration Requirements
- **Environment ID**: PingOne environment identifier
- **Client ID**: OAuth client identifier
- **Client Secret**: OAuth client secret (if required)
- **Redirect URI**: Valid redirect URI registered in PingOne
- **Scopes**: Required OAuth/OIDC scopes

### Security Features
- **PKCE (Proof Key for Code Exchange)** for public clients
- **State Parameter** for CSRF protection
- **Nonce Parameter** for replay attack prevention
- **Token Validation** and introspection
- **Secure Token Storage** with automatic expiration handling

### Usage Examples

#### Authorization Code Flow with PKCE
```typescript
// Automatic PKCE generation
const flowType = 'oauth-authz';
const specVersion = 'oidc';
// PKCE is automatically enabled for public clients
```

#### Client Credentials Flow (Worker Tokens)
```typescript
// For M2M applications
const flowType = 'client-credentials';
const specVersion = 'oauth2.0';
// Uses client_id and client_secret for authentication
```

### API Documentation
The flow includes comprehensive API documentation with:
- **OAuth Flow API Calls**: Step-by-step API call tracking
- **Pre-flight Validation API Calls**: Configuration validation
- **Token Exchange**: Detailed token response information
- **User Info**: User profile and claims information

---

## 🔐 SPIFFE/SPIRE Mock Flow

**Path:** `/v8u/spiffe-spire`  
**Status:** 🧪 **MOCK** - Mock flow demonstrating SPIFFE/SPIRE workload identity to PingOne token exchange

### Overview
The SPIFFE/SPIRE Mock Flow demonstrates how to exchange SPIFFE/SPIRE workload identities for PingOne OAuth tokens. This is a mock implementation for testing and development purposes.

### Key Concepts
- **SPIFFE**: Secure Production Identity Framework for Everyone
- **SPIRE**: SPIRE Runtime Environment
- **Workload Identity**: X.509-based identity for workloads
- **Token Exchange**: Exchange SPIFFE tokens for OAuth tokens

### Flow Steps
1. **Generate SPIFFE Token**: Create mock SPIFFE/SPIRE token
2. **Validate Token**: Verify token format and structure
3. **Exchange for PingOne Token**: Convert to PingOne access token
4. **Use Token**: Access PingOne APIs with exchanged token

### Mock Implementation Details
- Uses self-signed certificates for demonstration
- Simulates SPIFFE token validation
- Mocks PingOne token exchange endpoint
- Provides educational examples for real-world implementation

### Real-World Usage
In production, this flow would integrate with:
- **SPIFFE Workload API**: Real SPIFFE token issuance
- **PingOne Token Exchange**: Actual token exchange service
- **Certificate Management**: Proper X.509 certificate handling
- **Security Policies**: Enterprise security requirements

---

## 📱 PingOne MFA Flow

**Path:** `/v8/mfa`  
**Status:** ✅ **NEW** - V8: PingOne MFA Playground with SMS, Email, TOTP, and FIDO2

### Overview
The PingOne MFA Flow provides comprehensive multi-factor authentication capabilities using PingOne's MFA services. It supports multiple MFA methods and provides a complete user experience for device registration and authentication.

### Supported MFA Methods

#### SMS OTP
- **Phone Number Registration**: Register user phone number
- **OTP Generation**: Generate and send one-time password
- **OTP Validation**: Verify entered OTP
- **Device Registration**: Register trusted devices

#### Email OTP
- **Email Registration**: Register user email address
- **OTP Generation**: Send one-time password via email
- **OTP Validation**: Verify entered OTP
- **Device Registration**: Register trusted devices

#### TOTP (Time-based One-Time Password)
- **Secret Generation**: Generate TOTP secret
- **QR Code Display**: Show QR code for authenticator apps
- **TOTP Validation**: Verify time-based codes
- **Device Registration**: Register trusted devices

#### FIDO2/WebAuthn
- **Platform Authenticators**: Use built-in device authenticators
- **Security Keys**: Use USB/NFC security keys
- **Biometric Authentication**: Fingerprint, Face ID, etc.
- **Device Registration**: Register FIDO2 credentials

### Key Features
- **Multi-Method Support**: Choose from multiple MFA methods
- **Device Management**: Register and manage trusted devices
- **One-Time Devices**: Temporary device registration
- **User Experience**: Seamless authentication flow
- **Security**: Strong authentication with proper token handling

### Configuration Requirements
- **PingOne Environment**: MFA-enabled PingOne environment
- **MFA Application**: Configured MFA application in PingOne
- **User Population**: Users with MFA enabled
- **Device Policies**: MFA device registration policies

### Security Features
- **Device Binding**: Bind tokens to specific devices
- **Biometric Support**: Leverage device biometrics
- **Secure Storage**: Proper token and credential storage
- **Expiration Handling**: Automatic token refresh and expiration

### API Documentation
- **MFA Device Registration**: Register new MFA devices
- **OTP Generation**: Generate one-time passwords
- **Device Authentication**: Authenticate with registered devices
- **User Management**: Manage user MFA settings

---

## 🗑️ Delete All Devices Utility

**Path:** `/v8/delete-all-devices`  
**Status:** 🛠️ **UTILITY** - Utility to delete all MFA devices for a user with device type filtering

### Overview
The Delete All Devices Utility provides a safe and controlled way to delete all MFA devices for a user. This is useful for testing, device cleanup, and security management.

### Key Features
- **Device Type Filtering**: Filter by device type before deletion
- **Safety Confirmation**: Multiple confirmation steps
- **Bulk Operations**: Delete multiple devices at once
- **Audit Trail**: Track device deletion operations
- **Selective Deletion**: Choose specific device types

### Supported Device Types
- **SMS Devices**: Phone-based MFA devices
- **Email Devices**: Email-based MFA devices
- **TOTP Devices**: Time-based OTP authenticators
- **FIDO2 Devices**: Security keys and platform authenticators
- **All Devices**: Complete device cleanup

### Safety Features
- **Multi-Step Confirmation**: Prevent accidental deletion
- **Device Preview**: Show devices before deletion
- **Type Filtering**: Selective deletion by device type
- **Operation Logging**: Track all deletion operations
- **Rollback Protection**: No undo operation for security

### Use Cases
- **Testing**: Clean up test devices
- **Security**: Remove compromised devices
- **Migration**: Prepare for device migration
- **Compliance**: Meet device management requirements

### API Documentation
- **Device Listing**: List all user devices
- **Device Deletion**: Delete specific devices
- **Device Types**: Filter by device type
- **Operation History**: Track deletion operations

---

## ⚡ MFA One-Time Devices

**Path:** `/v8/mfa-one-time-devices`  
**Status:** 🧪 **EXPERIMENTAL** - Phase 2: One-time MFA where app controls device info

### Overview
The MFA One-Time Devices flow demonstrates an experimental approach where the application controls device information rather than relying on user-provided device details. This provides better security and user experience.

### Key Concepts
- **One-Time Devices**: Temporary device registration
- **App-Controlled Info**: Application manages device details
- **Enhanced Security**: Better control over device metadata
- **User Experience**: Simplified device registration

### Flow Steps
1. **Device Information**: App generates device information
2. **MFA Registration**: Register with controlled device details
3. **Authentication**: Authenticate with one-time device
4. **Token Exchange**: Exchange for access tokens

### Experimental Features
- **Device Metadata Control**: Application controls device information
- **Temporary Registration**: One-time device usage
- **Enhanced Security**: Better device validation
- **Simplified UX**: Reduced user input requirements

### Security Benefits
- **Reduced Attack Surface**: Less user-provided data
- **Better Validation**: Application-controlled validation
- **Temporary Access**: Limited device lifetime
- **Audit Trail**: Better device tracking

### Limitations
- **Experimental**: Not for production use
- **Limited Scope**: Specific use cases only
- **Compatibility**: May not work with all MFA methods
- **Support**: Limited documentation and support

---

## 📧 Email MFA Sign-On

**Path**: `/v8/email-mfa-signon`  
**Status:** ✅ **NEW** - V8: Email-based MFA sign-on experience

### Overview
The Email MFA Sign-On flow provides a complete email-based multi-factor authentication experience. It combines email OTP generation with device registration for secure user authentication.

### Key Features
- **Email Registration**: Register user email for MFA
- **OTP Generation**: Generate and send email OTP
- **Device Registration**: Register trusted devices
- **Sign-On Flow**: Complete authentication experience
- **User Management**: Manage user MFA settings

### Authentication Flow
1. **Email Input**: User enters email address
2. **OTP Generation**: System generates and sends OTP
3. **OTP Validation**: User enters received OTP
4. **Device Registration**: Register device for future use
5. **Authentication**: Complete sign-on process

### Security Features
- **Email Verification**: Verify email ownership
- **Device Binding**: Bind tokens to devices
- **Secure Storage**: Proper token handling
- **Expiration Management**: Token lifecycle management

### User Experience
- **Simple Interface**: Clean, intuitive UI
- **Clear Instructions**: Step-by-step guidance
- **Error Handling**: Proper error messages
- **Success Feedback**: Confirmation of successful actions

### Configuration Requirements
- **Email Service**: Configured email delivery
- **MFA Application**: PingOne MFA configuration
- **Template Management**: Email template customization
- **User Directory**: User population management

### API Documentation
- **Email Registration**: Register email for MFA
- **OTP Generation**: Generate and send OTP
- **Device Registration**: Register trusted devices
- **Authentication**: Complete sign-on process

---

## 🔧 Common Features Across Production Flows

### Security Features
- **PKCE Support**: Public client security
- **State Management**: CSRF protection
- **Token Validation**: Proper token handling
- **Secure Storage**: Safe credential storage
- **Expiration Handling**: Automatic token refresh

### User Experience
- **Responsive Design**: Mobile-friendly interfaces
- **Clear Instructions**: Step-by-step guidance
- **Error Handling**: Comprehensive error messages
- **Loading States**: Proper loading indicators
- **Success Feedback**: Confirmation messages

### API Documentation
- **Comprehensive Docs**: Detailed API documentation
- **Collapsible Sections**: Expandable documentation
- **Real-time Tracking**: Live API call monitoring
- **Request/Response**: Complete request/response details
- **Error Information**: Detailed error reporting

### Pre-flight Validation
- **Configuration Validation**: Validate settings before requests
- **Compatibility Checks**: Ensure proper configuration
- **Error Prevention**: Catch issues early
- **User Guidance**: Helpful error messages
- **Auto-fix Options**: Automatic configuration fixes

## 📚 Additional Resources

### Documentation
- [API Reference](./API_REFERENCE.md)
- [Security Guidelines](./SECURITY_GUIDELINES.md)
- [Configuration Guide](./CONFIGURATION_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Best Practices
- Use HTTPS in production environments
- Implement proper error handling
- Validate all user inputs
- Use secure token storage
- Monitor token expiration
- Implement proper logging

### Support
- Check console logs for debugging
- Review API documentation
- Validate configuration settings
- Test in development environment
- Monitor security compliance

---

## 📝 Version Information

**Document Version:** 1.0.0  
**Last Updated:** 2026-01-22  
**Production Status:** Ready for production use  

### Version History
- **v1.0.0**: Initial documentation for Production Group flows
- **v0.9.0**: Beta testing and feedback incorporation
- **v0.8.0**: Alpha release with core functionality

---

*This documentation covers all flows in the Production Group section of the OAuth Playground. For specific implementation details, please refer to the individual flow documentation and API references.*
