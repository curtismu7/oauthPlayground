// src/services/enhancedConfigurationService.ts
// Enhanced configuration service for OAuth flows
// Provides granular, dynamic configuration management with inheritance and validation

import { FlowType } from './serviceDiscoveryService';

// Re-export for convenience
export { FlowType } from './serviceDiscoveryService';

export interface BaseFlowConfig {
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
  enablePar: boolean;
  enableCiba: boolean;
  enableDeviceFlow: boolean;
}

export interface EnvironmentOverrides {
  // Environment-specific settings
  apiBaseUrl?: string;
  enableDebugLogging?: boolean;
  allowInsecureRedirects?: boolean;
  customScopes?: string[];
  featureFlags?: Record<string, boolean>;
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test'
}

export interface FlowSpecificConfig extends BaseFlowConfig {
  // Flow-specific overrides
  flowType: FlowType;
  customRedirectUris?: string[];
  customScopes?: string[];
  supportedAuthMethods?: string[];
  requiredParameters?: string[];
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: ConfigurationError[];
  warnings: ConfigurationWarning[];
  suggestions: ConfigurationSuggestion[];
}

export interface ConfigurationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ConfigurationWarning {
  field: string;
  message: string;
  impact: string;
}

export interface ConfigurationSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  benefit: string;
}

export class EnhancedConfigurationService {
  private static baseConfigs: Map<FlowType, BaseFlowConfig> = new Map();
  private static environmentOverrides: Map<Environment, EnvironmentOverrides> = new Map();
  private static configurationHistory: Map<string, ConfigurationSnapshot[]> = new Map();

  /**
   * Initialize base configurations for all flow types
   */
  static initializeBaseConfigs(): void {
    if (EnhancedConfigurationService.baseConfigs.size > 0) return;

    // OAuth Authorization Code Flow - Base Config
    EnhancedConfigurationService.baseConfigs.set(FlowType.OAUTH_AUTHORIZATION_CODE, {
      responseTypes: ['code'],
      grantTypes: ['authorization_code'],
      scopes: ['openid', 'profile', 'email'],
      requirePkce: true,
      allowHttpRedirects: false,
      enforceState: true,
      showAdvancedOptions: false,
      enableDebugMode: false,
      displayTokenDetails: true,
      validateRedirectUris: true,
      validateScopes: true,
      validateClientCredentials: true,
      requestTimeout: 30000,
      tokenExchangeTimeout: 30000,
      enableTokenIntrospection: true,
      enableTokenRevocation: true,
      enableRefreshTokens: true,
      enableBackChannelLogout: false,
      enablePar: true,
      enableCiba: false,
      enableDeviceFlow: false
    });

    // OAuth Implicit Flow - Base Config
    EnhancedConfigurationService.baseConfigs.set(FlowType.OAUTH_IMPLICIT, {
      responseTypes: ['token', 'id_token'],
      grantTypes: ['implicit'],
      scopes: ['openid', 'profile'],
      requirePkce: false,
      allowHttpRedirects: false,
      enforceState: true,
      showAdvancedOptions: false,
      enableDebugMode: false,
      displayTokenDetails: true,
      validateRedirectUris: true,
      validateScopes: true,
      validateClientCredentials: false,
      requestTimeout: 30000,
      tokenExchangeTimeout: 10000,
      enableTokenIntrospection: false,
      enableTokenRevocation: false,
      enableRefreshTokens: false,
      enableBackChannelLogout: false,
      enablePar: false,
      enableCiba: false,
      enableDeviceFlow: false
    });

    // OAuth Client Credentials Flow - Base Config
    EnhancedConfigurationService.baseConfigs.set(FlowType.OAUTH_CLIENT_CREDENTIALS, {
      responseTypes: [],
      grantTypes: ['client_credentials'],
      scopes: ['openid'],
      requirePkce: false,
      allowHttpRedirects: false,
      enforceState: false,
      showAdvancedOptions: true,
      enableDebugMode: false,
      displayTokenDetails: true,
      validateRedirectUris: false,
      validateScopes: true,
      validateClientCredentials: true,
      requestTimeout: 30000,
      tokenExchangeTimeout: 30000,
      enableTokenIntrospection: true,
      enableTokenRevocation: true,
      enableRefreshTokens: false,
      enableBackChannelLogout: false,
      enablePar: false,
      enableCiba: false,
      enableDeviceFlow: false
    });

    // OIDC Authorization Code Flow - Base Config
    EnhancedConfigurationService.baseConfigs.set(FlowType.OIDC_AUTHORIZATION_CODE, {
      responseTypes: ['code'],
      grantTypes: ['authorization_code'],
      scopes: ['openid', 'profile', 'email', 'address', 'phone'],
      requirePkce: true,
      allowHttpRedirects: false,
      enforceState: true,
      showAdvancedOptions: false,
      enableDebugMode: false,
      displayTokenDetails: true,
      validateRedirectUris: true,
      validateScopes: true,
      validateClientCredentials: true,
      requestTimeout: 30000,
      tokenExchangeTimeout: 30000,
      enableTokenIntrospection: true,
      enableTokenRevocation: true,
      enableRefreshTokens: true,
      enableBackChannelLogout: true,
      enablePar: true,
      enableCiba: false,
      enableDeviceFlow: false
    });

    // OIDC Hybrid Flow - Base Config
    EnhancedConfigurationService.baseConfigs.set(FlowType.OIDC_HYBRID, {
      responseTypes: ['code id_token', 'code token', 'code id_token token'],
      grantTypes: ['authorization_code', 'implicit'],
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      requirePkce: true,
      allowHttpRedirects: false,
      enforceState: true,
      showAdvancedOptions: true,
      enableDebugMode: false,
      displayTokenDetails: true,
      validateRedirectUris: true,
      validateScopes: true,
      validateClientCredentials: true,
      requestTimeout: 30000,
      tokenExchangeTimeout: 30000,
      enableTokenIntrospection: true,
      enableTokenRevocation: true,
      enableRefreshTokens: true,
      enableBackChannelLogout: true,
      enablePar: true,
      enableCiba: false,
      enableDeviceFlow: false
    });

    // Initialize environment overrides
    EnhancedConfigurationService.initializeEnvironmentOverrides();
  }

  /**
   * Initialize environment-specific overrides
   */
  private static initializeEnvironmentOverrides(): void {
    // Development environment
    EnhancedConfigurationService.environmentOverrides.set(Environment.DEVELOPMENT, {
      enableDebugLogging: true,
      allowInsecureRedirects: true,
      featureFlags: {
        experimentalFeatures: true,
        detailedLogging: true
      }
    });

    // Staging environment
    EnhancedConfigurationService.environmentOverrides.set(Environment.STAGING, {
      enableDebugLogging: false,
      allowInsecureRedirects: false,
      featureFlags: {
        experimentalFeatures: false,
        performanceMonitoring: true
      }
    });

    // Production environment
    EnhancedConfigurationService.environmentOverrides.set(Environment.PRODUCTION, {
      enableDebugLogging: false,
      allowInsecureRedirects: false,
      featureFlags: {
        experimentalFeatures: false,
        performanceMonitoring: true,
        securityHardening: true
      }
    });

    // Test environment
    EnhancedConfigurationService.environmentOverrides.set(Environment.TEST, {
      enableDebugLogging: true,
      allowInsecureRedirects: true,
      featureFlags: {
        experimentalFeatures: true,
        mockServices: true
      }
    });
  }

  /**
   * Get complete configuration for a flow type and environment
   */
  static getFlowConfig(flowType: FlowType, environment: Environment = Environment.DEVELOPMENT): FlowSpecificConfig {
    EnhancedConfigurationService.initializeBaseConfigs();

    const baseConfig = EnhancedConfigurationService.baseConfigs.get(flowType);
    if (!baseConfig) {
      throw new Error(`No base configuration found for flow type: ${flowType}`);
    }

    const envOverrides = EnhancedConfigurationService.environmentOverrides.get(environment) || {};

    // Merge configurations
    const mergedConfig = EnhancedConfigurationService.mergeConfigurations(baseConfig, envOverrides);

    return {
      ...mergedConfig,
      flowType
    };
  }

  /**
   * Get configuration with custom overrides
   */
  static getCustomFlowConfig(
    flowType: FlowType,
    customOverrides: Partial<BaseFlowConfig>,
    environment: Environment = Environment.DEVELOPMENT
  ): FlowSpecificConfig {
    const baseConfig = EnhancedConfigurationService.getFlowConfig(flowType, environment);

    // Apply custom overrides
    const finalConfig = {
      ...baseConfig,
      ...customOverrides
    };

    // Validate the final configuration
    const validation = EnhancedConfigurationService.validateConfiguration(finalConfig);
    if (!validation.isValid) {
      console.warn('[EnhancedConfigurationService] Configuration validation failed:', validation.errors);
    }

    return finalConfig;
  }

  /**
   * Merge base configuration with environment overrides
   */
  private static mergeConfigurations(baseConfig: BaseFlowConfig, envOverrides: EnvironmentOverrides): BaseFlowConfig {
    const merged = { ...baseConfig };

    // Apply environment overrides
    if (envOverrides.apiBaseUrl !== undefined) {
      // Could modify API endpoints if needed
    }

    if (envOverrides.enableDebugLogging !== undefined) {
      merged.enableDebugMode = envOverrides.enableDebugLogging;
    }

    if (envOverrides.allowInsecureRedirects !== undefined) {
      merged.allowHttpRedirects = envOverrides.allowInsecureRedirects;
    }

    if (envOverrides.customScopes) {
      merged.scopes = [...new Set([...merged.scopes, ...envOverrides.customScopes])];
    }

    if (envOverrides.featureFlags) {
      // Apply feature flags to relevant config properties
      if (envOverrides.featureFlags.experimentalFeatures === false) {
        merged.enablePar = false;
        merged.enableCiba = false;
      }

      if (envOverrides.featureFlags.securityHardening === true) {
        merged.requirePkce = true;
        merged.validateRedirectUris = true;
        merged.validateScopes = true;
      }
    }

    return merged;
  }

  /**
   * Validate configuration for consistency and security
   */
  static validateConfiguration(config: FlowSpecificConfig): ConfigurationValidationResult {
    const errors: ConfigurationError[] = [];
    const warnings: ConfigurationWarning[] = [];
    const suggestions: ConfigurationSuggestion[] = [];

    // Security validations
    if (config.allowHttpRedirects && config.flowType !== FlowType.OAUTH_IMPLICIT) {
      warnings.push({
        field: 'allowHttpRedirects',
        message: 'HTTP redirects enabled for non-implicit flow',
        impact: 'Reduces security by allowing unencrypted redirects'
      });
    }

    if (!config.requirePkce && config.responseTypes.includes('code')) {
      errors.push({
        field: 'requirePkce',
        message: 'PKCE required for authorization code flows',
        severity: 'error',
        suggestion: 'Set requirePkce to true for authorization code flows'
      });
    }

    // Timeout validations
    if (config.requestTimeout < 5000) {
      suggestions.push({
        field: 'requestTimeout',
        currentValue: config.requestTimeout,
        suggestedValue: 10000,
        reason: 'Request timeout too low',
        benefit: 'Prevents premature request failures'
      });
    }

    if (config.tokenExchangeTimeout < 10000) {
      warnings.push({
        field: 'tokenExchangeTimeout',
        message: 'Token exchange timeout may be too low',
        impact: 'Could cause token exchange failures under load'
      });
    }

    // Flow-specific validations
    if (config.flowType === FlowType.OAUTH_CLIENT_CREDENTIALS) {
      if (config.responseTypes.length > 0) {
        errors.push({
          field: 'responseTypes',
          message: 'Client credentials flow should not specify response types',
          severity: 'error',
          suggestion: 'Set responseTypes to empty array for client credentials flow'
        });
      }
    }

    if (config.flowType === FlowType.OAUTH_IMPLICIT) {
      if (config.enableRefreshTokens) {
        warnings.push({
          field: 'enableRefreshTokens',
          message: 'Refresh tokens not typically used with implicit flow',
          impact: 'May confuse client implementations'
        });
      }
    }

    // Scope validations
    if (config.scopes.length === 0) {
      errors.push({
        field: 'scopes',
        message: 'At least one scope must be configured',
        severity: 'error',
        suggestion: 'Add appropriate scopes for the flow type'
      });
    }

    // OpenID Connect validations
    const oidcFlows = [FlowType.OIDC_AUTHORIZATION_CODE, FlowType.OIDC_HYBRID, FlowType.OIDC_IMPLICIT];
    if (oidcFlows.includes(config.flowType)) {
      if (!config.scopes.includes('openid')) {
        errors.push({
          field: 'scopes',
          message: 'OpenID Connect flows must include openid scope',
          severity: 'error',
          suggestion: 'Add "openid" to the scopes array'
        });
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get configuration suggestions for optimization
   */
  static getConfigurationSuggestions(config: FlowSpecificConfig): ConfigurationSuggestion[] {
    const suggestions: ConfigurationSuggestion[] = [];

    // Performance suggestions
    if (!config.enablePar && config.flowType === FlowType.OAUTH_AUTHORIZATION_CODE) {
      suggestions.push({
        field: 'enablePar',
        currentValue: false,
        suggestedValue: true,
        reason: 'Pushed Authorization Requests improve security',
        benefit: 'Reduces authorization code interception risk'
      });
    }

    // Security suggestions
    if (!config.enforceState) {
      suggestions.push({
        field: 'enforceState',
        currentValue: false,
        suggestedValue: true,
        reason: 'State parameter prevents CSRF attacks',
        benefit: 'Enhanced security against cross-site request forgery'
      });
    }

    // UX suggestions
    if (!config.displayTokenDetails && config.flowType !== FlowType.OAUTH_CLIENT_CREDENTIALS) {
      suggestions.push({
        field: 'displayTokenDetails',
        currentValue: false,
        suggestedValue: true,
        reason: 'Token details help with debugging and education',
        benefit: 'Better developer experience and learning'
      });
    }

    return suggestions;
  }

  /**
   * Save configuration snapshot for versioning
   */
  static saveConfigurationSnapshot(flowType: FlowType, config: FlowSpecificConfig, author: string, description: string): void {
    const key = flowType;
    const snapshots = EnhancedConfigurationService.configurationHistory.get(key) || [];

    snapshots.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      config,
      author,
      description,
      version: snapshots.length + 1
    });

    EnhancedConfigurationService.configurationHistory.set(key, snapshots);
  }

  /**
   * Get configuration history
   */
  static getConfigurationHistory(flowType: FlowType): ConfigurationSnapshot[] {
    return EnhancedConfigurationService.configurationHistory.get(flowType) || [];
  }

  /**
   * Get configuration diff between versions
   */
  static getConfigurationDiff(flowType: FlowType, version1: number, version2: number): ConfigurationDiff {
    const snapshots = EnhancedConfigurationService.getConfigurationHistory(flowType);
    const snapshot1 = snapshots.find(s => s.version === version1);
    const snapshot2 = snapshots.find(s => s.version === version2);

    if (!snapshot1 || !snapshot2) {
      throw new Error('Configuration version not found');
    }

    return EnhancedConfigurationService.computeDiff(snapshot1.config, snapshot2.config);
  }

  /**
   * Export configuration for backup/sharing
   */
  static exportConfiguration(flowType: FlowType, environment?: Environment): string {
    const config = EnhancedConfigurationService.getFlowConfig(flowType, environment || Environment.DEVELOPMENT);
    const exportData = {
      flowType,
      environment: environment || Environment.DEVELOPMENT,
      config,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration from export
   */
  static importConfiguration(configJson: string): { flowType: FlowType; config: FlowSpecificConfig } {
    const importData = JSON.parse(configJson);

    if (!importData.flowType || !importData.config) {
      throw new Error('Invalid configuration export format');
    }

    // Validate imported configuration
    const validation = EnhancedConfigurationService.validateConfiguration(importData.config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    return {
      flowType: importData.flowType,
      config: importData.config
    };
  }

  // Private helper methods

  private static computeDiff(config1: FlowSpecificConfig, config2: FlowSpecificConfig): ConfigurationDiff {
    const changes: ConfigurationChange[] = [];
    const added: string[] = [];
    const removed: string[] = [];

    // Compare all properties
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);

    for (const key of allKeys) {
      const value1 = (config1 as any)[key];
      const value2 = (config2 as any)[key];

      if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        changes.push({
          field: key,
          oldValue: value1,
          newValue: value2,
          type: EnhancedConfigurationService.getChangeType(value1, value2)
        });
      }
    }

    return {
      changes,
      added,
      removed,
      summary: `${changes.length} fields changed`
    };
  }

  private static getChangeType(oldValue: any, newValue: any): 'added' | 'removed' | 'modified' {
    if (oldValue === undefined) return 'added';
    if (newValue === undefined) return 'removed';
    return 'modified';
  }
}

interface ConfigurationSnapshot {
  id: string;
  timestamp: Date;
  config: FlowSpecificConfig;
  author: string;
  description: string;
  version: number;
}

interface ConfigurationDiff {
  changes: ConfigurationChange[];
  added: string[];
  removed: string[];
  summary: string;
}

interface ConfigurationChange {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified';
}

// Initialize configurations when module loads
EnhancedConfigurationService.initializeBaseConfigs();
