# MasterFlow API - Complete User Guide

## 📖 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [PingOne Setup](#pingone-setup)
4. [Application Setup](#application-setup)
5. [Flows & Applications Guide](#flows--applications-guide)
6. [API Key Configuration](#api-key-configuration)
7. [Worker Token Setup](#worker-token-setup)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Features](#advanced-features)

---

## 🎯 Overview

MasterFlow API is a comprehensive PingOne integration platform that allows you to test, develop, and debug OAuth 2.0, OpenID Connect, and MFA flows. It provides a complete testing environment for PingOne services with real-time monitoring and debugging capabilities.

### Key Features
- **OAuth 2.0 & OIDC Flow Testing**: Complete implementation of all standard flows
- **MFA Testing**: Full Multi-Factor Authentication flow testing
- **Worker Token Management**: Advanced worker token handling and monitoring
- **Real-time Debugging**: Live token introspection and monitoring
- **Mock Services**: Complete mock environment for development
- **API Key Management**: Secure API key storage and configuration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PingOne account with appropriate permissions
- Git for cloning (if needed)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd oauth-playground

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start the application
npm start
```

### Access the Application
- **Main Application**: https://localhost:3000
- **API Documentation**: https://localhost:3000/docs
- **Health Check**: https://localhost:3000/api/health

---

## 🔧 PingOne Setup

### Required PingOne Resources

#### 1. PingOne Application
Create a PingOne application with the following settings:

**Application Type**: Web Application
**Grant Types**: 
- Authorization Code
- Client Credentials
- Resource Owner Password Credentials
- Device Authorization

**Required Scopes**:
- `openid` - For OpenID Connect
- `profile` - User profile information
- `email` - User email access
- `pingone:protect` - MFA protection
- `pingone:api:read` - API read access
- `pingone:api:write` - API write access

#### 2. Worker Token Application
Create a separate application for worker tokens:

**Application Type**: Service/Machine-to-Machine
**Grant Types**: Client Credentials
**Required Scopes**:
- `pingone:api:read`
- `pingone:api:write`
- `pingone:protect:admin`

#### 3. Environment Configuration
From your PingOne admin console, collect:
- **Environment ID**: Your PingOne environment identifier
- **API URL**: Usually `https://api.pingone.com`
- **Issuer URL**: Usually `https://auth.pingone.com`

### Environment Variables Setup

Create a `.env` file with the following variables:

```bash
# PingOne Configuration
PINGONE_ENVIRONMENT_ID=your-environment-id
PINGONE_CLIENT_ID=your-client-id
PINGONE_CLIENT_SECRET=your-client-secret
PINGONE_REDIRECT_URI=http://localhost:3000/callback
PINGONE_API_URL=https://api.pingone.com
PINGONE_ISSUER=https://auth.pingone.com/your-environment-id

# Worker Token Configuration
PINGONE_WORKER_CLIENT_ID=your-worker-client-id
PINGONE_WORKER_CLIENT_SECRET=your-worker-client-secret

# Optional: Additional Configuration
PINGONE_LOG_LEVEL=info
PINGONE_DEBUG=false
```

---

## 🛠️ Application Setup

### 1. Initial Configuration

1. **Start the Application**
   ```bash
   npm start
   ```

2. **Access the Configuration Page**
   - Navigate to https://localhost:3000/configuration
   - Verify all PingOne settings are properly loaded

3. **Configure API Keys**
   - Go to **Configuration** → **API Keys**
   - Add your PingOne API keys for enhanced functionality
   - Test API connectivity

### 2. Worker Token Setup

1. **Navigate to Worker Token Section**
   - Go to **Worker Token** in the sidebar
   - Click "Get Worker Token" if no token exists

2. **Configure Worker Token**
   - Enter your worker application credentials
   - Set appropriate scopes
   - Save configuration

3. **Verify Token Status**
   - Check token validity and expiration
   - Monitor token usage and refresh status

---

## 📚 Flows & Applications Guide

### 🔄 OAuth 2.0 & OIDC Flows

#### 1. Authorization Code Flow
**Location**: Sidebar → OAuth Flows → Authorization Code

**Purpose**: Standard web application authentication with user consent

**Setup Required**:
- PingOne application with Authorization Code grant
- Proper redirect URI configuration
- User credentials for testing

**Usage**:
1. Configure client credentials
2. Set redirect URI
3. Choose scopes (openid, profile, email)
4. Click "Authorize" to start flow
5. Complete authentication in PingOne
6. Receive authorization code and exchange for tokens

**Common Use Cases**:
- Web application login
- Single Sign-On (SSO)
- User profile access

#### 2. Client Credentials Flow
**Location**: Sidebar → OAuth Flows → Client Credentials

**Purpose**: Application-to-application authentication

**Setup Required**:
- Service/M2M application in PingOne
- Client credentials only (no user interaction)

**Usage**:
1. Configure client ID and secret
2. Set required scopes
3. Click "Request Token"
4. Receive access token directly

**Common Use Cases**:
- API access between services
- Backend service authentication
- System-to-system communication

#### 3. Resource Owner Password Credentials (ROPC)
**Location**: Sidebar → OAuth Flows → ROPC

**Purpose**: Direct user authentication with credentials

**Setup Required**:
- User account in PingOne
- Application with ROPC grant enabled

**Usage**:
1. Enter user credentials
2. Configure client credentials
3. Set scopes
4. Click "Request Token"
5. Receive tokens directly

**Common Use Cases**:
- Legacy system integration
- Trusted applications
- Mobile app authentication

#### 4. Device Authorization Flow
**Location**: Sidebar → OAuth Flows → Device Authorization

**Purpose**: Device-based authentication on limited input devices

**Setup Required**:
- Application with Device Authorization grant
- Device capable of displaying user codes

**Usage**:
1. Click "Request Device Authorization"
2. Note the user code (e.g., "ABCD-EFGH")
3. Visit verification URL on separate device
4. Enter user code and approve
5. Return to original device and poll for token

**Common Use Cases**:
- Smart TV authentication
- IoT device access
- Command-line tools

#### 5. Implicit Flow (Legacy)
**Location**: Sidebar → OAuth Flows → Implicit

**Purpose**: Frontend-only authentication (deprecated for security)

**⚠️ Security Note**: This flow is deprecated and not recommended for production use.

**Usage**:
1. Configure client credentials
2. Build authorization URL
3. Complete authentication
4. Receive token in URL fragment

### 🔐 Multi-Factor Authentication (MFA)

#### 1. Unified MFA Registration
**Location**: Sidebar → MFA Flows → Unified MFA Registration

**Purpose**: Complete MFA device registration and testing

**Setup Required**:
- PingOne Protect enabled
- User account with MFA enabled
- Worker token with MFA scopes

**Usage**:
1. Configure worker token
2. Enter user identifier
3. Choose MFA methods (SMS, Email, TOTP, FIDO2)
4. Complete registration flow
5. Test authentication with registered devices

#### 2. MFA Device Management
**Location**: Sidebar → MFA Flows → Device Management

**Purpose**: Manage and test MFA devices

**Features**:
- View registered devices
- Test device authentication
- Remove devices
- Monitor device status

### 📱 Communication Flows

#### 1. SMS Flow Testing
**Location**: Sidebar → Communication Flows → SMS

**Purpose**: Test SMS-based MFA and notifications

**Setup Required**:
- SMS provider configured in PingOne
- User phone number registered

#### 2. Email Flow Testing
**Location**: Sidebar → Communication Flows → Email

**Purpose**: Test email-based MFA and notifications

**Setup Required**:
- Email provider configured in PingOne
- User email address registered

#### 3. WhatsApp Flow Testing
**Location**: Sidebar → Communication Flows → WhatsApp

**Purpose**: Test WhatsApp-based authentication

**Setup Required**:
- WhatsApp Business API configured
- User WhatsApp number registered

### 🔍 Advanced Features

#### 1. Token Introspection
**Location**: Available in all flow pages

**Purpose**: Validate and inspect token contents

**Usage**:
- Click "Introspect Token" on any flow page
- View token claims and metadata
- Check token validity and expiration

#### 2. UserInfo Endpoint
**Location**: Available in all flow pages

**Purpose**: Retrieve user profile information

**Usage**:
- Click "Get UserInfo" after authentication
- View user profile data
- Test different scopes

#### 3. Token Monitoring
**Location**: Sidebar → Monitoring → Token Status

**Purpose**: Real-time token monitoring and management

**Features**:
- Monitor token expiration
- Track token usage
- Automatic refresh capabilities
- Token validation status

---

## 🔑 API Key Configuration

### Supported API Keys

#### 1. PingOne API Keys
- **Purpose**: Enhanced API access and management
- **Required For**: Advanced features and monitoring
- **Setup**: Configure in Configuration → API Keys

#### 2. Third-Party API Keys
- **Purpose**: Integration with external services
- **Examples**: Analytics, logging, monitoring services

### API Key Management

1. **Add API Key**
   - Navigate to Configuration → API Keys
   - Click "Add API Key"
   - Enter key name and value
   - Set permissions and usage limits

2. **Test API Key**
   - Use built-in test functionality
   - Verify connectivity and permissions
   - Check rate limits and quotas

3. **Monitor Usage**
   - Track API key usage statistics
   - Monitor error rates
   - Set up alerts for unusual activity

---

## 🛡️ Worker Token Setup

### Worker Token Requirements

#### 1. Worker Application
Create a dedicated application in PingOne for worker tokens:

**Application Settings**:
- **Type**: Service/Machine-to-Machine
- **Grant Types**: Client Credentials
- **Token Auth Method**: Client Secret Post or Basic Auth

#### 2. Required Scopes
```bash
pingone:api:read          # Read API access
pingone:api:write         # Write API access
pingone:protect:admin     # MFA administration
pingone:users:read        # User directory access
pingone:environments:read # Environment information
```

### Worker Token Configuration

1. **Navigate to Worker Token Section**
   - Sidebar → Worker Token

2. **Configure Credentials**
   ```json
   {
     "client_id": "your-worker-client-id",
     "client_secret": "your-worker-client-secret",
     "token_endpoint": "https://auth.pingone.com/{env-id}/as/token",
     "scopes": ["pingone:api:read", "pingone:api:write"]
   }
   ```

3. **Test Connection**
   - Click "Test Connection"
   - Verify token acquisition
   - Check token validity

4. **Save Configuration**
   - Store credentials securely
   - Enable auto-refresh if needed
   - Set monitoring preferences

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid or expired user code" (Device Authorization)
**Cause**: User code expired or was never generated
**Solution**:
- Request a new device authorization
- Use the code immediately (expires in 30 minutes)
- Ensure correct format (XXXX-XXXX)

#### 2. "API Key Not Set" Status
**Cause**: API key not properly stored or `isActive` flag missing
**Solution**:
- Reconfigure API key in Configuration → API Keys
- Ensure key is saved with `isActive: true`
- Test connectivity after configuration

#### 3. Worker Token Not Refreshing
**Cause**: Token expired or refresh mechanism disabled
**Solution**:
- Click "Get Token" to obtain new token
- Check worker application credentials
- Verify required scopes are configured

#### 4. CORS Errors
**Cause**: Frontend trying to access PingOne APIs directly
**Solution**:
- Use backend proxy for API calls
- Configure proper CORS in PingOne
- Use worker token for server-side calls

#### 5. Redirect URI Mismatch
**Cause**: Redirect URI in PingOne doesn't match application
**Solution**:
- Update PingOne application with correct redirect URI
- Ensure exact match including protocol and port
- Test with `http://localhost:3000/callback`

### Debug Tools

#### 1. Browser Console
- Check for JavaScript errors
- Monitor network requests
- Verify token storage

#### 2. Network Tab
- Inspect API calls
- Check response status codes
- Verify request headers

#### 3. Application Logs
- View server logs in terminal
- Check error messages
- Monitor authentication flow

#### 4. Token Inspector
- Use built-in token introspection
- Verify token claims
- Check expiration times

---

## 🚀 Advanced Features

### 1. Flow Comparison
**Location**: Sidebar → Tools → Flow Comparison

**Purpose**: Compare different OAuth flows side-by-side

**Features**:
- Visual flow diagrams
- Security comparisons
- Use case recommendations

### 2. Token Analytics
**Location**: Sidebar → Monitoring → Analytics

**Purpose**: Analyze token usage patterns

**Metrics**:
- Token issuance rates
- Expiration patterns
- Error rates
- Performance metrics

### 3. Mock Services
**Location**: Sidebar → Mock Services

**Purpose**: Test flows without real PingOne connection

**Features**:
- Complete OAuth 2.0 mock server
- Configurable responses
- Error simulation
- Performance testing

### 4. Export/Import Configuration
**Purpose**: Backup and restore application settings

**Features**:
- Export configuration to JSON
- Import settings across environments
- Share configurations with team

---

## 📞 Support & Resources

### Documentation
- **API Documentation**: https://localhost:3000/docs
- **PingOne Docs**: https://docs.pingidentity.com/pingone/
- **OAuth 2.0 RFC**: https://tools.ietf.org/html/rfc6749
- **OIDC Specification**: https://openid.net/specs/openid-connect-core-1_0.html

### Community
- **GitHub Issues**: Report bugs and feature requests
- **Discord/Slack**: Community support (if available)
- **Stack Overflow**: Tag questions with `pingone` and `oauth`

### Getting Help
1. Check this documentation first
2. Review PingOne documentation
3. Check browser console for errors
4. Review application logs
5. Create GitHub issue with detailed information

---

## 🎉 Best Practices

### Security
- Never expose client secrets in frontend code
- Use HTTPS in production environments
- Implement proper token storage
- Regularly rotate secrets and keys
- Monitor for unusual activity

### Performance
- Use appropriate token lifetimes
- Implement token caching where appropriate
- Monitor API rate limits
- Optimize token refresh strategies

### Development
- Use mock services for development
- Test all flows thoroughly
- Implement proper error handling
- Document custom configurations

### Production
- Use environment-specific configurations
- Implement proper logging and monitoring
- Set up alerts for critical errors
- Regular security audits

---

**🎯 You're now ready to use MasterFlow API!** 

Start with the Authorization Code flow for web applications, or explore the MFA flows for advanced authentication testing. Happy coding! 🚀
