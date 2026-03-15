# Sidebar Navigation Guide - What Each Flow Does

## 📋 Navigation Overview

This guide explains every item in the sidebar and what it's used for.

---

## 🔐 OAuth Flows

### 1. Authorization Code Flow
**📍 Location**: OAuth Flows → Authorization Code

**🎯 Purpose**: Standard web application authentication
**🔧 Use Case**: User login for web applications, Single Sign-On (SSO)

**⚙️ Setup Required**:
- PingOne Web Application
- Redirect URI: `http://localhost:3000/callback`
- Scopes: `openid`, `profile`, `email`

**🚀 How to Use**:
1. Configure client credentials (auto-loaded from .env)
2. Set redirect URI
3. Choose scopes
4. Click "Authorize" → Login to PingOne → Get tokens

**✅ What You Get**: Authorization code → Access token + ID token + Refresh token

---

### 2. Client Credentials Flow
**📍 Location**: OAuth Flows → Client Credentials

**🎯 Purpose**: Application-to-application authentication
**🔧 Use Case**: Backend services calling APIs, system-to-system communication

**⚙️ Setup Required**:
- PingOne Service/M2M Application
- Client credentials only

**🚀 How to Use**:
1. Configure client ID and secret
2. Set required scopes
3. Click "Request Token"
4. Get access token immediately

**✅ What You Get**: Access token (no user context, no refresh token)

---

### 3. Resource Owner Password Credentials (ROPC)
**📍 Location**: OAuth Flows → ROPC

**🎯 Purpose**: Direct user authentication with credentials
**🔧 Use Case**: Legacy systems, trusted applications, mobile apps

**⚙️ Setup Required**:
- PingOne Application with ROPC enabled
- User credentials

**🚀 How to Use**:
1. Enter username and password
2. Configure client credentials
3. Set scopes
4. Click "Request Token"

**✅ What You Get**: Access token + ID token + Refresh token

---

### 4. Device Authorization Flow
**📍 Location**: OAuth Flows → Device Authorization

**🎯 Purpose**: Authentication on devices with limited input
**🔧 Use Case**: Smart TVs, IoT devices, command-line tools

**⚙️ Setup Required**:
- PingOne Application with Device Authorization grant

**🚀 How to Use**:
1. Click "Request Device Authorization"
2. Display user code (e.g., "ABCD-EFGH") and verification URL
3. User visits URL on separate device
4. User enters code and approves
5. Original device polls for token

**✅ What You Get**: Access token + ID token + Refresh token

---

### 5. Implicit Flow
**📍 Location**: OAuth Flows → Implicit

**🎯 Purpose**: Frontend-only authentication (LEGACY)
**🔧 Use Case**: Single-page applications (deprecated)

**⚠️ Security Warning**: This flow is deprecated and not recommended for production use.

**🚀 How to Use**:
1. Configure client credentials
2. Build authorization URL
3. Complete authentication
4. Token returned in URL fragment

**✅ What You Get**: Access token + ID token (in URL)

---

## 🛡️ MFA Flows

### 1. Unified MFA Registration
**📍 Location**: MFA Flows → Unified MFA Registration

**🎯 Purpose**: Complete MFA device registration and testing
**🔧 Use Case**: Register user devices for MFA, test MFA flows

**⚙️ Setup Required**:
- Worker token with MFA scopes
- PingOne Protect enabled
- User account

**🚀 How to Use**:
1. Configure worker token
2. Enter user identifier (email/phone)
3. Choose MFA method (SMS/Email/TOTP/FIDO2)
4. Complete registration flow
5. Test authentication

**✅ What You Get**: Registered MFA devices, test authentication results

---

### 2. MFA Device Management
**📍 Location**: MFA Flows → Device Management

**🎯 Purpose**: Manage and test existing MFA devices
**🔧 Use Case**: View registered devices, test authentication, remove devices

**⚙️ Setup Required**:
- Worker token with MFA scopes
- Existing MFA devices

**🚀 How to Use**:
1. View list of registered devices
2. Test device authentication
3. Remove unwanted devices
4. Monitor device status

**✅ What You Get**: Device inventory, authentication test results

---

## 📱 Communication Flows

### 1. SMS Flow Testing
**📍 Location**: Communication Flows → SMS

**🎯 Purpose**: Test SMS-based MFA and notifications
**🔧 Use Case**: SMS OTP testing, notification delivery testing

**⚙️ Setup Required**:
- PingOne SMS provider configured
- User phone number registered

**🚀 How to Use**:
1. Configure SMS settings
2. Enter recipient phone number
3. Send test SMS
4. Verify delivery

**✅ What You Get**: SMS delivery status, test results

---

### 2. Email Flow Testing
**📍 Location**: Communication Flows → Email

**🎯 Purpose**: Test email-based MFA and notifications
**🔧 Use Case**: Email OTP testing, notification delivery testing

**⚙️ Setup Required**:
- PingOne Email provider configured
- User email address

**🚀 How to Use**:
1. Configure email settings
2. Enter recipient email
3. Send test email
4. Verify delivery

**✅ What You Get**: Email delivery status, test results

---

### 3. WhatsApp Flow Testing
**📍 Location**: Communication Flows → WhatsApp

**🎯 Purpose**: Test WhatsApp-based authentication
**🔧 Use Case**: WhatsApp OTP testing, business messaging

**⚙️ Setup Required**:
- WhatsApp Business API configured
- User WhatsApp number

**🚀 How to Use**:
1. Configure WhatsApp settings
2. Enter recipient number
3. Send test message
4. Verify delivery

**✅ What You Get**: WhatsApp delivery status, test results

---

### 4. Mobile Flow Testing
**📍 Location**: Communication Flows → Mobile

**🎯 Purpose**: Test mobile push notifications
**🔧 Use Case**: Push notification testing, mobile app integration

**⚙️ Setup Required**:
- Mobile app configured
- Push notification service

**🚀 How to Use**:
1. Configure mobile settings
2. Enter device token
3. Send test notification
4. Verify delivery

**✅ What You Get**: Push notification status, test results

---

## 🔧 Mock Flows (V9)

### All Mock Flows
**📍 Location**: Mock Flows → [Various V9 Flows]

**🎯 Purpose**: Test OAuth flows without real PingOne connection
**🔧 Use Case**: Development, testing, demos, learning

**⚙️ Setup Required**: None (uses mock services)

**Available Mock Flows**:
- **Client Credentials V9**: Mock client credentials flow
- **OAuth Auth Code V9**: Mock authorization code flow
- **ROPC V9**: Mock resource owner password flow
- **Implicit V9**: Mock implicit flow
- **CIBA V9**: Mock client-initiated backchannel authentication
- **OIDC Hybrid V9**: Mock hybrid flow
- **Device Authorization V9**: Mock device authorization flow
- **SAML Bearer Assertion V9**: Mock SAML assertion flow

**🚀 How to Use**:
1. Select any mock flow
2. Enter test credentials
3. Execute flow
4. View mock responses

**✅ What You Get**: Realistic mock responses for testing

---

## 🔍 Monitoring & Tools

### 1. Token Status Page
**📍 Location**: Monitoring → Token Status

**🎯 Purpose**: Monitor active tokens and their status
**🔧 Use Case**: Token management, expiration monitoring

**🚀 How to Use**:
1. View active tokens
2. Check expiration times
3. Monitor refresh status
4. Test token validity

**✅ What You Get**: Token inventory, health status

---

### 2. API Documentation
**📍 Location**: API Documentation

**🎯 Purpose**: Interactive API documentation and testing
**🔧 Use Case**: API exploration, endpoint testing

**🚀 How to Use**:
1. Browse API endpoints
2. Test endpoints interactively
3. View request/response examples
4. Export API collections

**✅ What You Get**: API explorer, testing tools

---

### 3. Flow Comparison Tool
**📍 Location**: Tools → Flow Comparison

**🎯 Purpose**: Compare different OAuth flows
**🔧 Use Case**: Flow selection, security analysis

**🚀 How to Use**:
1. Select flows to compare
2. View comparison matrix
3. Analyze security differences
4. Get recommendations

**✅ What You Get**: Flow comparison analysis, recommendations

---

### 4. Cleanliness Dashboard
**📍 Location**: Cleanliness Dashboard

**🎯 Purpose**: Monitor code quality and technical debt
**🔧 Use Case**: Code quality tracking, regression monitoring

**🚀 How to Use**:
1. View code quality metrics
2. Track regression fixes
3. Monitor technical debt
4. Review audit items

**✅ What You Get**: Quality metrics, improvement tracking

---

### 5. Configuration Pages
**📍 Location**: Configuration

**🎯 Purpose**: Application configuration and setup
**🔧 Use Case**: Initial setup, API key management

**Configuration Sections**:
- **General**: PingOne connection settings
- **API Keys**: Manage API keys and test connectivity
- **Environment**: Environment-specific settings

**🚀 How to Use**:
1. Configure PingOne connection
2. Add API keys
3. Test connectivity
4. Save settings

**✅ What You Get**: Configured application, tested connections

---

## 🎯 Choosing the Right Flow

### For Web Applications
- **Use**: Authorization Code Flow
- **Why**: Most secure, supports refresh tokens, standard for web apps

### For Backend Services
- **Use**: Client Credentials Flow
- **Why**: No user interaction, simple, secure for service-to-service

### For Mobile Apps
- **Use**: Authorization Code with PKCE
- **Why**: Secure, supports refresh tokens, mobile-friendly

### For IoT/Smart Devices
- **Use**: Device Authorization Flow
- **Why**: Designed for limited input devices, user-friendly

### For Legacy Systems
- **Use**: ROPC (if necessary)
- **Why**: Direct credential input, but less secure

### For Testing/Development
- **Use**: Mock Flows
- **Why**: No PingOne dependency, fast, reliable

---

## 🚀 Quick Reference

| Need | Flow | Location |
|------|------|----------|
| Web login | Authorization Code | OAuth Flows → Authorization Code |
| API access | Client Credentials | OAuth Flows → Client Credentials |
| MFA testing | Unified MFA Registration | MFA Flows → Unified MFA Registration |
| Device auth | Device Authorization | OAuth Flows → Device Authorization |
| SMS testing | SMS Flow | Communication Flows → SMS |
| Token monitoring | Token Status | Monitoring → Token Status |
| API testing | API Documentation | API Documentation |
| Development | Mock Flows | Mock Flows → [Any V9 Flow] |

---

## 🎉 Ready to Start!

**For Beginners**: Start with Authorization Code Flow
**For API Development**: Use Client Credentials Flow
**For MFA Testing**: Try Unified MFA Registration
**For Development**: Use Mock Flows

Choose your flow and start testing! 🚀
