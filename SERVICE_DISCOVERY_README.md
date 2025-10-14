# Service Discovery Tools

The OAuth Playground includes comprehensive service discovery tools to help developers find and integrate the right services for their OAuth and OIDC flow implementations.

## 🎯 Overview

The service discovery ecosystem consists of:

1. **Service Registry** - Centralized catalog of all available services
2. **CLI Tool** - Command-line interface for terminal-based discovery
3. **React Component** - Interactive browser-based service explorer
4. **API** - Programmatic access for custom integrations

## 🔧 CLI Tool

### Installation & Setup

The CLI tool is available as an npm script:

```bash
npm run service-discovery -- [options]
```

### Commands

#### List All Services
```bash
npm run service-discovery -- --list
```

#### Find Services for Specific Flow Type
```bash
# OAuth flows
npm run service-discovery -- --flow oauth-authorization-code
npm run service-discovery -- --flow oauth-implicit
npm run service-discovery -- --flow oauth-client-credentials

# OIDC flows
npm run service-discovery -- --flow oidc-authorization-code
npm run service-discovery -- --flow oidc-hybrid
npm run service-discovery -- --flow oidc-implicit
```

#### Search Services
```bash
# Search by functionality
npm run service-discovery -- --search token
npm run service-discovery -- --search credential
npm run service-discovery -- --search error

# Search by service name
npm run service-discovery -- --search ComprehensiveCredentialsService
```

#### Get Help
```bash
npm run service-discovery -- --help
```

### CLI Examples

```bash
# Quick overview of all services
npm run service-discovery -- --list

# Find token-related services
npm run service-discovery -- --search token

# Get services for OAuth Authorization Code flow
npm run service-discovery -- --flow oauth-authorization-code

# Combine search with flow filtering
npm run service-discovery -- --flow oidc-hybrid --search display
```

## 🌐 React Component

### Basic Usage

```tsx
import ServiceDiscoveryBrowser from '../components/ServiceDiscoveryBrowser';

function MyComponent() {
  return (
    <ServiceDiscoveryBrowser
      initialFlowType="oauth-authorization-code"
      showStatistics={true}
    />
  );
}
```

### Props

- `initialFlowType?: FlowType` - Pre-select services for a specific flow type
- `showStatistics?: boolean` - Display service registry statistics (default: true)

### Available Flow Types

- `oauth-authorization-code`
- `oauth-implicit`
- `oauth-client-credentials`
- `oauth-device-code`
- `oidc-authorization-code`
- `oidc-implicit`
- `oidc-hybrid`
- `oidc-device-authorization`

## 📊 Service Registry API

### Import the Service

```typescript
import { ServiceDiscoveryService } from '../services/serviceDiscoveryService';
```

### Get Service Recommendations

```typescript
// Get recommended services for a specific flow
const recommendations = ServiceDiscoveryService.getServiceRecommendations(
  FlowType.OAUTH_AUTHORIZATION_CODE
);

// Each recommendation includes:
// - service: ServiceDefinition
// - relevance: number (0-100)
// - confidence: number (0-1)
// - rationale: string
// - exampleUsage?: UsageExample
// - alternatives: ServiceDefinition[]
```

### Search Services

```typescript
const services = ServiceDiscoveryService.findServices({
  flowType: FlowType.OIDC_HYBRID,
  category: ServiceCategory.TOKENS,
  keywords: ['display', 'management']
});
```

### Get Service Details

```typescript
const service = ServiceDiscoveryService.getServiceDetails('ComprehensiveCredentialsService');
```

### Get Statistics

```typescript
const stats = ServiceDiscoveryService.getServiceStatistics();
// Returns: total services, services by category/maturity/complexity
```

### Get Compatibility Matrix

```typescript
const compatibility = ServiceDiscoveryService.getServiceCompatibility();
// Returns Map<string, string[]> of service relationships
```

## 🔍 Available Services

### Core Services

#### ComprehensiveCredentialsService
- **Category**: Credentials
- **Purpose**: Unified credential management with validation and OIDC discovery
- **Supported Flows**: OAuth Auth Code, OIDC Auth Code, OAuth Client Credentials

#### UnifiedTokenDisplayService
- **Category**: Tokens
- **Purpose**: Consistent token visualization with decoding and management
- **Supported Flows**: OAuth Auth Code, OIDC Auth Code, OAuth Implicit

#### ErrorHandlingService
- **Category**: Error Handling
- **Purpose**: Comprehensive error classification and user-friendly recovery
- **Supported Flows**: All flows

### Specialized Services

#### EnhancedApiCallDisplayService
- **Category**: UI Components
- **Purpose**: Visual API call display with request/response details
- **Supported Flows**: OAuth Auth Code, OAuth Client Credentials

#### AuthenticationModalService
- **Category**: Authentication
- **Purpose**: Reusable authentication modal handling
- **Supported Flows**: Flows requiring user authentication

#### FlowCompletionService
- **Category**: Flow Control
- **Purpose**: Consistent flow completion and summary handling
- **Supported Flows**: All flows

## 🎨 Integration Examples

### Basic Flow Implementation

```typescript
import { ServiceDiscoveryService, FlowType } from '../services/serviceDiscoveryService';

// Get recommended services for your flow
const recommendations = ServiceDiscoveryService.getServiceRecommendations(
  FlowType.OAUTH_AUTHORIZATION_CODE
);

// Use the top recommendation
const primaryService = recommendations[0];
console.log(`Use ${primaryService.service.name}: ${primaryService.rationale}`);
```

### Advanced Service Discovery

```typescript
// Find services with specific features
const tokenServices = ServiceDiscoveryService.findServices({
  category: ServiceCategory.TOKENS,
  supportsFeature: 'decoding'
});

// Get compatibility information
const compatibility = ServiceDiscoveryService.getServiceCompatibility();
const compatibleWithCredentials = compatibility.get('ComprehensiveCredentialsService');
```

## 📈 Benefits

### For Developers
- **Faster Development**: Quickly find appropriate services for specific flows
- **Reduced Learning Curve**: Clear documentation and usage examples
- **Consistency**: Standardized service integration patterns
- **Best Practices**: Built-in recommendations for optimal service usage

### For Teams
- **Knowledge Sharing**: Centralized service documentation
- **Code Quality**: Consistent service usage across team members
- **Maintenance**: Easier to update and maintain service integrations
- **Onboarding**: Faster ramp-up for new team members

### For Projects
- **Scalability**: Service-based architecture supports growth
- **Maintainability**: Clear service boundaries and responsibilities
- **Testability**: Services can be easily mocked and tested
- **Reusability**: Services work across multiple flows and components

## 🚀 Getting Started

1. **Explore Services**: Use the CLI or React component to browse available services
2. **Find Recommendations**: Get personalized service suggestions for your flow type
3. **Review Examples**: Check usage examples and best practices
4. **Integrate Services**: Import and use services in your flow implementations

## 🔗 Links

- [Service Discovery CLI](#cli-tool)
- [React Component](#react-component)
- [Service Registry API](#service-registry-api)
- [Available Services](#available-services)

---

*These tools are part of the OAuth Playground's service architecture, designed to improve developer experience and maintainability of OAuth/OIDC flow implementations.*
