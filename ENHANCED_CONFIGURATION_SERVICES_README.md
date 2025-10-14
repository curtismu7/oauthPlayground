# Enhanced Configuration Services

The OAuth Playground includes comprehensive **Enhanced Configuration Services** that provide granular, dynamic configuration management with inheritance, validation, and environment-specific settings.

## 🎯 Overview

The Enhanced Configuration Services replace static config files with:

1. **Configuration Inheritance** - Base configs with environment overrides
2. **Runtime Validation** - Automatic consistency and security checks
3. **Environment Management** - Dynamic configuration per deployment environment
4. **Version Control** - Configuration history and diff tracking
5. **Developer Tools** - CLI and UI tools for configuration management

## 🏗️ Core Architecture

### Configuration Hierarchy

```
Base Flow Config (FlowType)
├── Environment Overrides (development/staging/production/test)
├── Custom Overrides (optional)
└── Validation & Suggestions
```

### Key Components

#### **BaseFlowConfig Interface**
```typescript
interface BaseFlowConfig {
  // Core OAuth/OIDC settings
  responseTypes: string[];
  grantTypes: string[];
  scopes: string[];

  // Security settings
  requirePkce: boolean;
  allowHttpRedirects: boolean;
  enforceState: boolean;

  // UI settings
  showAdvancedOptions: boolean;
  enableDebugMode: boolean;
  displayTokenDetails: boolean;

  // Validation settings
  validateRedirectUris: boolean;
  validateScopes: boolean;
  validateClientCredentials: boolean;

  // Timeout settings
  requestTimeout: number;
  tokenExchangeTimeout: number;

  // Feature flags
  enableTokenIntrospection: boolean;
  enableTokenRevocation: boolean;
  enableRefreshTokens: boolean;
  enableBackChannelLogout: boolean;

  // PingOne specific
  enablePar: boolean;      // Pushed Authorization Requests
  enableCiba: boolean;     // Client-Initiated Backchannel Authentication
  enableDeviceFlow: boolean;
}
```

#### **Environment Overrides**
```typescript
interface EnvironmentOverrides {
  apiBaseUrl?: string;
  enableDebugLogging?: boolean;
  allowInsecureRedirects?: boolean;
  customScopes?: string[];
  featureFlags?: Record<string, boolean>;
}
```

## 🔧 CLI Tool

### Installation & Setup

```bash
npm run config [command] [options]
```

### Commands

#### Get Configuration
```bash
# Get default configuration for a flow
npm run config get --flow oauth-authorization-code

# Get configuration for specific environment
npm run config get --flow oidc-authorization-code --env production
```

#### Validate Configuration
```bash
# Validate configuration with automatic suggestions
npm run config validate --flow oauth-implicit

# Validate for specific environment
npm run config validate --flow oidc-hybrid --env staging
```

### Examples

```bash
# Basic configuration retrieval
npm run config get --flow oauth-authorization-code

# Production environment validation
npm run config validate --flow oidc-authorization-code --env production

# Development environment with debug features
npm run config get --flow oauth-client-credentials --env development
```

### Sample Output

```
🔧 Configuration Details:
   Flow Type: oauth-authorization-code
   Response Types: code
   Grant Types: authorization_code
   Scopes: openid, profile, email
   Require PKCE: true
   Enable Debug: true (development override)
   Request Timeout: 30000ms
   Token Introspection: true
   PAR Enabled: true
```

## 🌐 React Component

### Basic Usage

```tsx
import ConfigurationManager from '../components/ConfigurationManager';

function AdminPanel() {
  return (
    <ConfigurationManager
      initialFlowType="oauth-authorization-code"
      initialEnvironment="development"
    />
  );
}
```

### Features

- **Real-time Configuration Editing** - Modify settings with immediate validation
- **Environment Switching** - Switch between development, staging, production
- **Validation Feedback** - Live error checking with suggestions
- **Configuration Export/Import** - Backup and share configurations
- **Change Tracking** - Version history and diff comparison

### Configuration Groups

1. **OAuth/OIDC Settings** - Response types, grant types, scopes
2. **Security Settings** - PKCE, redirects, state enforcement
3. **UI Settings** - Debug mode, advanced options, token display
4. **Validation Settings** - URI, scope, and credential validation
5. **Timeout Settings** - Request and token exchange timeouts
6. **Feature Flags** - Token operations, PingOne-specific features

## 📊 Service API

### Import the Service

```typescript
import {
  EnhancedConfigurationService,
  FlowType,
  Environment,
  FlowSpecificConfig
} from '../services/enhancedConfigurationService';
```

### Get Configuration

```typescript
// Get base configuration for a flow type
const config = EnhancedConfigurationService.getFlowConfig(
  FlowType.OAUTH_AUTHORIZATION_CODE,
  Environment.DEVELOPMENT
);

// Get configuration with custom overrides
const customConfig = EnhancedConfigurationService.getCustomFlowConfig(
  FlowType.OIDC_HYBRID,
  { enableDebugMode: true, requestTimeout: 45000 },
  Environment.PRODUCTION
);
```

### Validate Configuration

```typescript
const validation = EnhancedConfigurationService.validateConfiguration(config);

if (!validation.isValid) {
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
}

// Get optimization suggestions
const suggestions = EnhancedConfigurationService.getConfigurationSuggestions(config);
```

### Configuration Management

```typescript
// Save configuration snapshot
EnhancedConfigurationService.saveConfigurationSnapshot(
  FlowType.OAUTH_AUTHORIZATION_CODE,
  config,
  'developer@example.com',
  'Updated PKCE settings for better security'
);

// Get configuration history
const history = EnhancedConfigurationService.getConfigurationHistory(
  FlowType.OAUTH_AUTHORIZATION_CODE
);

// Compare configurations
const diff = EnhancedConfigurationService.getConfigurationDiff(
  FlowType.OAUTH_AUTHORIZATION_CODE,
  1, 2  // version numbers
);
```

### Export/Import

```typescript
// Export configuration for backup/sharing
const configJson = EnhancedConfigurationService.exportConfiguration(
  FlowType.OIDC_AUTHORIZATION_CODE,
  Environment.PRODUCTION
);

// Import configuration
const imported = EnhancedConfigurationService.importConfiguration(configJson);
```

## 🔍 Validation & Suggestions

### Automatic Validation

The service automatically validates configurations for:

#### **Security Issues**
- PKCE requirements for authorization code flows
- HTTP redirect restrictions
- State parameter enforcement
- Scope validation

#### **Flow-Specific Rules**
- Client credentials flow response type restrictions
- OIDC openid scope requirements
- Implicit flow refresh token warnings

#### **Performance Checks**
- Timeout value reasonableness
- Feature flag compatibility

### Intelligent Suggestions

The service provides optimization suggestions:

```typescript
const suggestions = EnhancedConfigurationService.getConfigurationSuggestions(config);
// Returns suggestions like:
// - Enable PAR for better security
// - Enable token introspection for validation
// - Adjust timeout values for performance
// - Enable debug mode for development
```

## 🌍 Environment Management

### Supported Environments

- **Development** - Debug logging, experimental features, insecure redirects allowed
- **Staging** - Performance monitoring, feature testing
- **Production** - Security hardening, performance optimization
- **Test** - Mock services, isolated testing

### Environment Overrides

```typescript
// Development environment enables debug features
{
  enableDebugLogging: true,
  allowInsecureRedirects: true,
  featureFlags: {
    experimentalFeatures: true,
    detailedLogging: true
  }
}

// Production environment enforces security
{
  enableDebugLogging: false,
  allowInsecureRedirects: false,
  featureFlags: {
    securityHardening: true,
    performanceMonitoring: true
  }
}
```

## 📈 Benefits

### For Developers

#### **Configuration Discovery**
- **Quick Setup** - Get validated configurations instantly
- **Environment Awareness** - Automatic environment-specific settings
- **Validation Guidance** - Clear error messages and fix suggestions
- **Best Practices** - Built-in security and performance recommendations

#### **Development Workflow**
- **Rapid Prototyping** - Start with validated base configurations
- **Environment Parity** - Consistent behavior across development stages
- **Change Tracking** - Understand configuration evolution
- **Team Collaboration** - Share and import configuration templates

### For Operations

#### **Environment Management**
- **Deployment Safety** - Validate configurations before deployment
- **Security Enforcement** - Automatic security settings by environment
- **Performance Optimization** - Environment-specific performance tuning
- **Audit Trail** - Complete configuration change history

### For Organizations

#### **Consistency**
- **Standardization** - Uniform configuration patterns across teams
- **Compliance** - Built-in security and regulatory requirements
- **Scalability** - Easy configuration management for multiple environments
- **Maintainability** - Clear configuration inheritance and versioning

## 🎯 Use Cases

### Development Setup
```typescript
// Get development configuration with debug features
const devConfig = EnhancedConfigurationService.getFlowConfig(
  FlowType.OAUTH_AUTHORIZATION_CODE,
  Environment.DEVELOPMENT
);
// Automatically includes debug logging and experimental features
```

### Production Deployment
```typescript
// Validate production configuration
const prodConfig = EnhancedConfigurationService.getFlowConfig(
  FlowType.OIDC_AUTHORIZATION_CODE,
  Environment.PRODUCTION
);

const validation = EnhancedConfigurationService.validateConfiguration(prodConfig);
// Ensures security hardening and performance optimizations
```

### Configuration Migration
```typescript
// Export current configuration
const exportData = EnhancedConfigurationService.exportConfiguration(
  FlowType.OAUTH_IMPLICIT
);

// Import into new environment
const imported = EnhancedConfigurationService.importConfiguration(exportData);
// Automatic validation ensures compatibility
```

## 🚀 Getting Started

1. **Choose Flow Type** - Select your OAuth/OIDC flow type
2. **Select Environment** - Pick development, staging, or production
3. **Get Configuration** - Use CLI or API to retrieve validated config
4. **Customize as Needed** - Apply custom overrides with validation
5. **Validate & Deploy** - Ensure configuration passes all checks

## 📋 Configuration Examples

### OAuth Authorization Code Flow (Development)
```json
{
  "flowType": "oauth-authorization-code",
  "responseTypes": ["code"],
  "grantTypes": ["authorization_code"],
  "scopes": ["openid", "profile", "email"],
  "requirePkce": true,
  "allowHttpRedirects": true,
  "enforceState": true,
  "enableDebugMode": true,
  "enablePar": true,
  "requestTimeout": 30000
}
```

### OIDC Hybrid Flow (Production)
```json
{
  "flowType": "oidc-hybrid",
  "responseTypes": ["code id_token", "code token"],
  "grantTypes": ["authorization_code", "implicit"],
  "scopes": ["openid", "profile", "email", "offline_access"],
  "requirePkce": true,
  "allowHttpRedirects": false,
  "enforceState": true,
  "enableDebugMode": false,
  "enableTokenIntrospection": true,
  "enableRefreshTokens": true,
  "enableBackChannelLogout": true
}
```

---

*Enhanced Configuration Services provide enterprise-grade configuration management for OAuth/OIDC flows, ensuring security, performance, and maintainability across all deployment environments.*
