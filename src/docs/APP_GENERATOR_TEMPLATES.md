# App Generator Templates

This document describes all the built-in templates available in the PingOne Application Generator.

## 🔧 Worker Applications

### Basic Worker Application
- **ID**: `worker-app-basic`
- **Use Case**: Background workers and automated processes
- **Security Level**: Enhanced
- **Grant Types**: Client Credentials
- **Auth Method**: Client Secret Basic
- **Scopes**: `p1:read:user`, `p1:update:user`
- **Token Validity**: 1 hour

### Administrative Worker Application
- **ID**: `worker-app-admin`
- **Use Case**: Administrative operations and user management
- **Security Level**: Enterprise
- **Grant Types**: Client Credentials
- **Auth Method**: Client Secret JWT
- **Scopes**: Full administrative privileges including user and application management
- **Token Validity**: 2 hours

## 🌐 OIDC Web Applications

### Enterprise OIDC Web Application
- **ID**: `oidc-web-enterprise`
- **Use Case**: Enterprise web applications requiring high security and compliance
- **Security Level**: Enterprise
- **Grant Types**: Authorization Code, Refresh Token
- **PKCE**: Required
- **PAR**: Required
- **Scopes**: `openid`, `profile`, `email`, `address`, `phone`
- **Token Validity**: 1 hour access, 7 days refresh

### Development OIDC Web Application
- **ID**: `oidc-web-development`
- **Use Case**: Local development and testing environments
- **Security Level**: Basic
- **Grant Types**: Authorization Code, Refresh Token
- **PKCE**: Optional
- **Redirect URIs**: Localhost variants (3000, 8080)
- **Token Validity**: 2 hours access, 30 days refresh

## 🔐 SAML Applications

### SAML Web Application
- **ID**: `saml-web-app`
- **Use Case**: SAML-based enterprise SSO integration
- **Security Level**: Enhanced
- **Grant Types**: Authorization Code
- **Redirect URIs**: SAML ACS endpoints
- **Signoff URLs**: SAML SLS endpoints
- **Token Validity**: 1 hour access, 8 hours refresh

## 📱 Single Page Applications

### React Single Page Application
- **ID**: `spa-react`
- **Use Case**: React-based single page applications
- **Security Level**: Enhanced
- **Grant Types**: Authorization Code, Refresh Token
- **PKCE**: Required
- **Auth Method**: None (public client)
- **Token Validity**: 1 hour access, 1 day refresh

### Angular Single Page Application
- **ID**: `spa-angular`
- **Use Case**: Angular-based single page applications
- **Security Level**: Enhanced
- **Default Port**: 4200
- **PKCE**: Required
- **Token Validity**: 1 hour access, 1 day refresh

### Vue.js Single Page Application
- **ID**: `spa-vue`
- **Use Case**: Vue.js-based single page applications
- **Security Level**: Enhanced
- **Default Port**: 8080
- **PKCE**: Required
- **Token Validity**: 1 hour access, 1 day refresh

## 📺 Device Authorization

### Smart TV Device Authorization
- **ID**: `device-auth-tv`
- **Use Case**: Smart TVs, streaming devices, and input-constrained devices
- **Security Level**: Enhanced
- **Grant Types**: Device Code, Refresh Token
- **Redirect URIs**: None (device flow)
- **Scopes**: `openid`, `profile`
- **Token Validity**: 1 hour access, 30 days refresh

### IoT Device Authorization
- **ID**: `device-auth-iot`
- **Use Case**: IoT devices and embedded systems with limited input capabilities
- **Security Level**: Enhanced
- **Grant Types**: Device Code
- **Scopes**: `openid`, `device:read`, `device:write`
- **Token Validity**: 2 hours access, 7 days refresh

## 📱 Mobile Applications

### iOS Mobile Application
- **ID**: `mobile-ios`
- **Use Case**: Native iOS mobile applications
- **Security Level**: Enhanced
- **Grant Types**: Authorization Code, Refresh Token
- **PKCE**: Required
- **Auth Method**: None (public client)
- **Redirect URIs**: Custom URL scheme (`com.company.app://callback`)
- **Token Validity**: 1 hour access, 30 days refresh

### Android Mobile Application
- **ID**: `mobile-android`
- **Use Case**: Native Android mobile applications
- **Security Level**: Enhanced
- **Grant Types**: Authorization Code, Refresh Token
- **PKCE**: Required
- **Auth Method**: None (public client)
- **Redirect URIs**: Custom URL scheme (`com.company.app://callback`)
- **Token Validity**: 1 hour access, 30 days refresh

## 🔗 Service Applications

### Microservice API
- **ID**: `microservice-api`
- **Use Case**: Microservice-to-microservice authentication
- **Security Level**: Enhanced
- **Grant Types**: Client Credentials
- **Auth Method**: Client Secret JWT
- **Scopes**: `api:read`, `api:write`
- **Token Validity**: 1 hour access, no refresh tokens

## 🏷️ Template Categories

Templates are organized into the following categories in the UI:

1. **Worker Applications** - Service accounts and background processes
2. **OIDC Web Applications** - Traditional web applications
3. **SAML Applications** - Enterprise SSO integration
4. **Single Page Apps** - Browser-based JavaScript applications
5. **Device Authorization** - Input-constrained and IoT devices
6. **Mobile Applications** - Native mobile apps
7. **Service Applications** - API and microservice authentication

## 🔒 Security Levels

- **Basic**: Suitable for development and testing
- **Enhanced**: Production-ready with good security practices
- **Enterprise**: High-security environments with strict compliance requirements

## 🎯 Usage Guidelines

1. **Development**: Use development templates for local testing
2. **Production**: Use enterprise or enhanced templates for production deployments
3. **Mobile**: Always use PKCE-required templates for mobile applications
4. **IoT/Devices**: Use device authorization flow for input-constrained devices
5. **Services**: Use client credentials flow for service-to-service communication

## 🔧 Customization

All templates can be:
- Applied as-is for quick setup
- Customized before application creation
- Saved as custom templates for reuse
- Exported/imported for sharing between environments