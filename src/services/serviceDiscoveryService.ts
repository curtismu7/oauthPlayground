// src/services/serviceDiscoveryService.ts
// Service discovery and registry system for OAuth flows
// Helps developers find appropriate services for their implementations

export interface ServiceDefinition {
  name: string;
  fileName: string;
  description: string;
  category: ServiceCategory;
  supportedFlowTypes: FlowType[];
  features: string[];
  dependencies: ServiceDependency[];
  version: string;
  author: string;
  lastUpdated: string;
  usageExamples: UsageExample[];
  bestPractices: string[];
  relatedServices: string[];
  complexity: ServiceComplexity;
  maturity: ServiceMaturity;
}

export interface ServiceDependency {
  name: string;
  purpose: string;
  required: boolean;
  version?: string;
}

export interface UsageExample {
  title: string;
  description: string;
  code: string;
  flowType?: FlowType;
  complexity: 'basic' | 'intermediate' | 'advanced';
}

export interface ServiceRecommendation {
  service: ServiceDefinition;
  relevance: number;
  confidence: number;
  rationale: string;
  exampleUsage?: UsageExample;
  alternatives: ServiceDefinition[];
}

export interface ServiceSearchQuery {
  flowType?: FlowType;
  category?: ServiceCategory;
  keywords?: string[];
  complexity?: ServiceComplexity;
  maturity?: ServiceMaturity;
  hasDependencies?: boolean;
  supportsFeature?: string;
}

export enum ServiceCategory {
  CREDENTIALS = 'credentials',
  TOKENS = 'tokens',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  UI_COMPONENTS = 'ui-components',
  CONFIGURATION = 'configuration',
  VALIDATION = 'validation',
  LOGGING = 'logging',
  ANALYTICS = 'analytics',
  ERROR_HANDLING = 'error-handling',
  FLOW_CONTROL = 'flow-control',
  UTILITIES = 'utilities'
}

export enum FlowType {
  OAUTH_AUTHORIZATION_CODE = 'oauth-authorization-code',
  OAUTH_IMPLICIT = 'oauth-implicit',
  OAUTH_CLIENT_CREDENTIALS = 'oauth-client-credentials',
  OAUTH_DEVICE_CODE = 'oauth-device-code',
  OIDC_AUTHORIZATION_CODE = 'oidc-authorization-code',
  OIDC_IMPLICIT = 'oidc-implicit',
  OIDC_HYBRID = 'oidc-hybrid',
  OIDC_DEVICE_AUTHORIZATION = 'oidc-device-authorization',
  SAML_BEARER = 'saml-bearer',
  JWT_BEARER = 'jwt-bearer',
  TOKEN_INTROSPECTION = 'token-introspection',
  TOKEN_REVOCATION = 'token-revocation',
  USER_INFO = 'user-info'
}

export enum ServiceComplexity {
  LOW = 'low',      // Simple utility services
  MEDIUM = 'medium', // Standard business logic services
  HIGH = 'high'     // Complex integration services
}

export enum ServiceMaturity {
  EXPERIMENTAL = 'experimental', // New services, APIs may change
  STABLE = 'stable',             // Proven, well-tested services
  DEPRECATED = 'deprecated',     // No longer recommended for new use
  LEGACY = 'legacy'             // Maintained for backward compatibility
}

export class ServiceDiscoveryService {
  private static serviceRegistry: Map<string, ServiceDefinition> = new Map();
  private static initialized = false;

  /**
   * Initialize the service registry with all available services
   */
  static initializeRegistry(): void {
    if (this.initialized) return;

    // Core Credential Services
    this.registerService({
      name: 'ComprehensiveCredentialsService',
      fileName: 'comprehensiveCredentialsService.tsx',
      description: 'Unified credential management with validation, discovery, and persistence',
      category: ServiceCategory.CREDENTIALS,
      supportedFlowTypes: [
        FlowType.OAUTH_AUTHORIZATION_CODE, FlowType.OAUTH_IMPLICIT, FlowType.OAUTH_CLIENT_CREDENTIALS,
        FlowType.OIDC_AUTHORIZATION_CODE, FlowType.OIDC_IMPLICIT, FlowType.OIDC_HYBRID,
        FlowType.OAUTH_DEVICE_CODE, FlowType.OIDC_DEVICE_AUTHORIZATION
      ],
      features: [
        'Credential validation',
        'OIDC discovery integration',
        'Persistent storage',
        'Real-time validation feedback',
        'PingOne configuration support'
      ],
      dependencies: [
        { name: 'oidcDiscoveryService', purpose: 'OIDC discovery operations', required: false },
        { name: 'credentialManager', purpose: 'Secure credential storage', required: true }
      ],
      version: '6.1.0',
      author: 'OAuth Playground Team',
      lastUpdated: '2025-10-11',
      usageExamples: [
        {
          title: 'Basic credential input with validation',
          description: 'Standard credential input with automatic validation and persistence',
          code: `
<ComprehensiveCredentialsService
  credentials={credentials}
  onCredentialsChange={handleCredentialsChange}
  onSaveCredentials={saveCredentials}
  flowType="oauth-authorization-code"
  showAdvancedConfig={true}
/>
          `,
          flowType: FlowType.OAUTH_AUTHORIZATION_CODE,
          complexity: 'basic'
        },
        {
          title: 'OIDC discovery integration',
          description: 'Credentials service with automatic OIDC discovery',
          code: `
<ComprehensiveCredentialsService
  credentials={credentials}
  onCredentialsChange={handleCredentialsChange}
  onDiscoveryComplete={(result) => {
    // Handle discovery results
    console.log('Discovered endpoints:', result);
  }}
  discoveryPlaceholder="Enter issuer URL or environment ID"
/>
          `,
          flowType: FlowType.OIDC_AUTHORIZATION_CODE,
          complexity: 'intermediate'
        }
      ],
      bestPractices: [
        'Always validate credentials before API calls',
        'Use OIDC discovery for dynamic endpoint resolution',
        'Persist credentials securely using the built-in storage',
        'Handle validation errors gracefully in the UI'
      ],
      relatedServices: [
        'oidcDiscoveryService',
        'credentialManager',
        'EducationalContentService'
      ],
      complexity: ServiceComplexity.MEDIUM,
      maturity: ServiceMaturity.STABLE
    });

    // Token Display Services
    this.registerService({
      name: 'UnifiedTokenDisplayService',
      fileName: 'unifiedTokenDisplayService.tsx',
      description: 'Consistent token visualization with decoding, introspection, and management',
      category: ServiceCategory.TOKENS,
      supportedFlowTypes: [
        FlowType.OAUTH_AUTHORIZATION_CODE, FlowType.OAUTH_IMPLICIT, FlowType.OAUTH_CLIENT_CREDENTIALS,
        FlowType.OIDC_AUTHORIZATION_CODE, FlowType.OIDC_IMPLICIT, FlowType.OIDC_HYBRID,
        FlowType.OAUTH_DEVICE_CODE, FlowType.OIDC_DEVICE_AUTHORIZATION
      ],
      features: [
        'JWT decoding and display',
        'Token introspection',
        'Token management (copy, revoke)',
        'Expiration tracking',
        'Token validation'
      ],
      dependencies: [
        { name: 'TokenIntrospectionService', purpose: 'Token validation', required: false },
        { name: 'CopyButtonService', purpose: 'Token copying functionality', required: false }
      ],
      version: '6.1.0',
      author: 'OAuth Playground Team',
      lastUpdated: '2025-10-11',
      usageExamples: [
        {
          title: 'Basic token display',
          description: 'Display access and refresh tokens with basic information',
          code: `
<UnifiedTokenDisplayService
  tokens={tokens}
  flowType="oauth-authorization-code"
/>
          `,
          flowType: FlowType.OAUTH_AUTHORIZATION_CODE,
          complexity: 'basic'
        },
        {
          title: 'Full token management',
          description: 'Complete token display with introspection and management',
          code: `
<UnifiedTokenDisplayService
  tokens={tokens}
  flowType="oidc-authorization-code"
  showTokenManagementButtons={true}
  onTokenIntrospect={(token) => introspectToken(token)}
  onTokenRevoke={(token) => revokeToken(token)}
/>
          `,
          flowType: FlowType.OIDC_AUTHORIZATION_CODE,
          complexity: 'advanced'
        }
      ],
      bestPractices: [
        'Always decode tokens for user verification',
        'Use introspection for server-side token validation',
        'Provide clear token expiration information',
        'Handle token revocation gracefully'
      ],
      relatedServices: [
        'TokenIntrospectionService',
        'CopyButtonService',
        'tokenRefreshService'
      ],
      complexity: ServiceComplexity.MEDIUM,
      maturity: ServiceMaturity.STABLE
    });

    // Error Handling Service
    this.registerService({
      name: 'ErrorHandlingService',
      fileName: 'errorHandlingService.ts',
      description: 'Comprehensive error classification, user-friendly messages, and recovery strategies',
      category: ServiceCategory.ERROR_HANDLING,
      supportedFlowTypes: Object.values(FlowType), // All flow types
      features: [
        'Error classification and severity assessment',
        'User-friendly error messages',
        'Context-aware recovery options',
        'Error analytics and reporting',
        'Correlation ID tracking'
      ],
      dependencies: [],
      version: '1.0.0',
      author: 'OAuth Playground Team',
      lastUpdated: '2025-10-11',
      usageExamples: [
        {
          title: 'Basic error handling',
          description: 'Standard error handling with user-friendly messages',
          code: `
try {
  await makeApiCall();
} catch (error) {
  const errorResponse = ErrorHandlingService.handleFlowError(error, {
    flowId: 'my-flow',
    stepId: 'api-call'
  });
  
  // Show user-friendly message
  showToast(errorResponse.userMessage);
  
  // Log technical details
  console.error('Error:', errorResponse.technicalMessage);
}
          `,
          complexity: 'basic'
        },
        {
          title: 'Advanced error recovery',
          description: 'Error handling with recovery options',
          code: `
const errorResponse = ErrorHandlingService.handleFlowError(error, context);

// Display recovery options to user
errorResponse.recoveryOptions.forEach(option => {
  if (option.primary) {
    showPrimaryButton(option.label, option.action);
  } else {
    showSecondaryButton(option.label, option.action);
  }
});
          `,
          complexity: 'advanced'
        }
      ],
      bestPractices: [
        'Always use handleFlowError for consistent error processing',
        'Provide meaningful context in error calls',
        'Use recovery options to improve user experience',
        'Log correlation IDs for support troubleshooting'
      ],
      relatedServices: [],
      complexity: ServiceComplexity.LOW,
      maturity: ServiceMaturity.STABLE
    });

    // API Call Display Service
    this.registerService({
      name: 'EnhancedApiCallDisplayService',
      fileName: 'enhancedApiCallDisplayService.ts',
      description: 'Visual API call display with request/response details and debugging',
      category: ServiceCategory.UI_COMPONENTS,
      supportedFlowTypes: [
        FlowType.OAUTH_AUTHORIZATION_CODE, FlowType.OAUTH_CLIENT_CREDENTIALS,
        FlowType.OIDC_AUTHORIZATION_CODE, FlowType.TOKEN_INTROSPECTION
      ],
      features: [
        'Request/response visualization',
        'HTTP status indicators',
        'Request timing',
        'Collapsible display',
        'Copy functionality'
      ],
      dependencies: [
        { name: 'CopyButtonService', purpose: 'Copy request/response data', required: false }
      ],
      version: '6.1.0',
      author: 'OAuth Playground Team',
      lastUpdated: '2025-10-11',
      usageExamples: [
        {
          title: 'Basic API call display',
          description: 'Show API request and response details',
          code: `
<EnhancedApiCallDisplayService
  title="Token Exchange"
  apiCall={{
    method: 'POST',
    url: '/oauth2/token',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: { grant_type: 'authorization_code', code: '...' },
    response: { status: 200, data: tokens },
    timestamp: Date.now()
  }}
/>
          `,
          flowType: FlowType.OAUTH_AUTHORIZATION_CODE,
          complexity: 'basic'
        }
      ],
      bestPractices: [
        'Include all relevant headers and parameters',
        'Handle both successful and error responses',
        'Use appropriate titles for different API calls',
        'Consider performance impact of large response bodies'
      ],
      relatedServices: [
        'CopyButtonService',
        'FlowAnalyticsService'
      ],
      complexity: ServiceComplexity.LOW,
      maturity: ServiceMaturity.STABLE
    });

    this.initialized = true;
  }

  /**
   * Register a new service in the discovery system
   */
  static registerService(service: ServiceDefinition): void {
    this.serviceRegistry.set(service.name, service);
  }

  /**
   * Find services that match the given criteria
   */
  static findServices(query: ServiceSearchQuery): ServiceDefinition[] {
    const services = Array.from(this.serviceRegistry.values());

    return services.filter(service => {
      // Flow type match
      if (query.flowType && !service.supportedFlowTypes.includes(query.flowType)) {
        return false;
      }

      // Category match
      if (query.category && service.category !== query.category) {
        return false;
      }

      // Complexity match
      if (query.complexity && service.complexity !== query.complexity) {
        return false;
      }

      // Maturity match
      if (query.maturity && service.maturity !== query.maturity) {
        return false;
      }

      // Dependencies filter
      if (query.hasDependencies !== undefined) {
        const hasDeps = service.dependencies.length > 0;
        if (query.hasDependencies !== hasDeps) {
          return false;
        }
      }

      // Feature support
      if (query.supportsFeature) {
        if (!service.features.some(feature =>
          feature.toLowerCase().includes(query.supportsFeature!.toLowerCase())
        )) {
          return false;
        }
      }

      // Keyword search
      if (query.keywords && query.keywords.length > 0) {
        const searchText = [
          service.name,
          service.description,
          ...service.features,
          ...service.bestPractices
        ].join(' ').toLowerCase();

        if (!query.keywords.some(keyword =>
          searchText.includes(keyword.toLowerCase())
        )) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get service recommendations for a specific flow type
   */
  static getServiceRecommendations(flowType: FlowType): ServiceRecommendation[] {
    const relevantServices = this.findServices({ flowType });
    const allServices = Array.from(this.serviceRegistry.values());

    return relevantServices.map(service => {
      const relevance = this.calculateRelevance(service, flowType);
      const alternatives = this.findAlternatives(service, flowType, allServices);

      return {
        service,
        relevance,
        confidence: Math.min(relevance / 100, 1),
        rationale: this.generateRationale(service, flowType),
        exampleUsage: service.usageExamples.find(ex => ex.flowType === flowType),
        alternatives
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get detailed information about a specific service
   */
  static getServiceDetails(serviceName: string): ServiceDefinition | null {
    return this.serviceRegistry.get(serviceName) || null;
  }

  /**
   * Get service compatibility matrix
   */
  static getServiceCompatibility(): Map<string, string[]> {
    const compatibility = new Map<string, string[]>();

    this.serviceRegistry.forEach((service, name) => {
      const compatibleServices = Array.from(this.serviceRegistry.keys())
        .filter(otherName => {
          if (otherName === name) return false;
          const otherService = this.serviceRegistry.get(otherName)!;

          // Check if they share flow types
          const sharedFlows = service.supportedFlowTypes.filter(flow =>
            otherService.supportedFlowTypes.includes(flow)
          );

          return sharedFlows.length > 0;
        });

      compatibility.set(name, compatibleServices);
    });

    return compatibility;
  }

  /**
   * Get service dependency graph
   */
  static getServiceDependencies(): Map<string, ServiceDependency[]> {
    const dependencies = new Map<string, ServiceDependency[]>();
    this.serviceRegistry.forEach((service, name) => {
      dependencies.set(name, service.dependencies);
    });
    return dependencies;
  }

  /**
   * Get all available services
   */
  static getAllServices(): ServiceDefinition[] {
    return Array.from(this.serviceRegistry.values());
  }

  /**
   * Get services by category
   */
  static getServicesByCategory(category: ServiceCategory): ServiceDefinition[] {
    return this.findServices({ category });
  }

  /**
   * Get service statistics
   */
  static getServiceStatistics(): {
    totalServices: number;
    servicesByCategory: Record<ServiceCategory, number>;
    servicesByMaturity: Record<ServiceMaturity, number>;
    servicesByComplexity: Record<ServiceComplexity, number>;
  } {
    const services = this.getAllServices();
    const stats = {
      totalServices: services.length,
      servicesByCategory: {} as Record<ServiceCategory, number>,
      servicesByMaturity: {} as Record<ServiceMaturity, number>,
      servicesByComplexity: {} as Record<ServiceComplexity, number>
    };

    // Initialize counters
    Object.values(ServiceCategory).forEach(cat => stats.servicesByCategory[cat] = 0);
    Object.values(ServiceMaturity).forEach(mat => stats.servicesByMaturity[mat] = 0);
    Object.values(ServiceComplexity).forEach(comp => stats.servicesByComplexity[comp] = 0);

    // Count services
    services.forEach(service => {
      stats.servicesByCategory[service.category]++;
      stats.servicesByMaturity[service.maturity]++;
      stats.servicesByComplexity[service.complexity]++;
    });

    return stats;
  }

  // Private helper methods

  private static calculateRelevance(service: ServiceDefinition, flowType: FlowType): number {
    let relevance = 50; // Base relevance

    // Boost for exact flow type match
    if (service.supportedFlowTypes.includes(flowType)) {
      relevance += 30;
    }

    // Boost for core categories
    if ([ServiceCategory.CREDENTIALS, ServiceCategory.TOKENS, ServiceCategory.AUTHENTICATION].includes(service.category)) {
      relevance += 20;
    }

    // Boost for stable maturity
    if (service.maturity === ServiceMaturity.STABLE) {
      relevance += 10;
    }

    // Reduce for high complexity
    if (service.complexity === ServiceComplexity.HIGH) {
      relevance -= 10;
    }

    return Math.max(0, Math.min(100, relevance));
  }

  private static findAlternatives(service: ServiceDefinition, flowType: FlowType, allServices: ServiceDefinition[]): ServiceDefinition[] {
    return allServices
      .filter(s =>
        s.name !== service.name &&
        s.category === service.category &&
        s.supportedFlowTypes.includes(flowType)
      )
      .slice(0, 3); // Limit to 3 alternatives
  }

  private static generateRationale(service: ServiceDefinition, flowType: FlowType): string {
    const reasons = [];

    if (service.supportedFlowTypes.includes(flowType)) {
      reasons.push('directly supports this flow type');
    }

    if (service.maturity === ServiceMaturity.STABLE) {
      reasons.push('is stable and well-tested');
    }

    if (service.complexity === ServiceComplexity.LOW) {
      reasons.push('is easy to integrate');
    }

    if (service.features.length > 0) {
      reasons.push(`provides ${service.features.length} key features`);
    }

    return reasons.length > 0 ? reasons.join(', ') : 'provides essential functionality';
  }
}

// Initialize the registry when the module loads
ServiceDiscoveryService.initializeRegistry();
