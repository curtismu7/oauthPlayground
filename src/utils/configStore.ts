/**
 * Configuration Store for Per-Flow Credentials
 * 
 * This module provides a centralized configuration management system that supports:
 * - Global default configuration
 * - Per-flow credential overrides
 * - Secure storage with proper namespacing
 * - Configuration resolution with fallback logic
 * - Validation and migration utilities
 */

import { localStorageService } from './storage';

// Storage namespace for v2 configuration
const STORAGE_NAMESPACE = 'p1_import_tool.v2';

// Flow types supported by the system
export type FlowType = 
  | 'auth_code_pkce'
  | 'hybrid'
  | 'client_credentials'
  | 'refresh'
  | 'introspection'
  | 'implicit'
  | 'device_code'
  | 'worker_token';

// Token endpoint authentication methods
export type TokenAuthMethod = 
  | 'none'
  | 'client_secret_basic'
  | 'client_secret_post'
  | 'private_key_jwt';

// Base configuration interface
export interface BaseConfig {
  environmentId: string;
  region?: string;
  clientId: string;
  clientSecret?: string;
  tokenAuthMethod: TokenAuthMethod;
  redirectUri?: string;
  scopes?: string;
  pkceEnabled?: boolean;
  updatedAt: number;
}

// Global configuration extends base config
export interface GlobalConfig extends BaseConfig {
  authEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  applicationType?: 'spa' | 'backend';
  jwksMethod?: 'jwks_url' | 'jwks';
  jwksUrl?: string;
  jwks?: string;
  requirePar?: boolean;
  parTimeout?: number;
  accessTokenLifetime?: number;
  refreshTokenLifetime?: number;
  idTokenLifetime?: number;
  allowedOrigins?: string[];
}

// Per-flow configuration (only fields that can be overridden)
export interface FlowConfig extends Partial<BaseConfig> {
  // Only include fields that can be overridden per flow
  environmentId?: string;
  region?: string;
  clientId?: string;
  clientSecret?: string;
  tokenAuthMethod?: TokenAuthMethod;
  redirectUri?: string;
  scopes?: string;
  pkceEnabled?: boolean;
  updatedAt?: number;
}

// Effective configuration (resolved from global + flow overrides)
export interface EffectiveConfig extends BaseConfig {
  authEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  applicationType: 'spa' | 'backend';
  jwksMethod: 'jwks_url' | 'jwks';
  jwksUrl: string;
  jwks: string;
  requirePar: boolean;
  parTimeout: number;
  accessTokenLifetime: number;
  refreshTokenLifetime: number;
  idTokenLifetime: number;
  allowedOrigins: string[];
}

// Source map indicating where each value came from
export interface ConfigSourceMap {
  environmentId: 'global' | 'flow';
  region: 'global' | 'flow';
  clientId: 'global' | 'flow';
  clientSecret: 'global' | 'flow';
  tokenAuthMethod: 'global' | 'flow';
  redirectUri: 'global' | 'flow';
  scopes: 'global' | 'flow';
  pkceEnabled: 'global' | 'flow';
}

// Configuration store interface
export interface ConfigStore {
  getGlobalConfig(): GlobalConfig | null;
  setGlobalConfig(config: GlobalConfig): boolean;
  getFlowConfig(flowType: FlowType): FlowConfig | null;
  setFlowConfig(flowType: FlowType, config: FlowConfig): boolean;
  resolveConfig(flowType: FlowType): { config: EffectiveConfig; sourceMap: ConfigSourceMap };
  clearFlowConfig(flowType: FlowType): boolean;
  clearAllConfigs(): boolean;
  migrateFromV1(): boolean;
  validateConfig(config: Partial<BaseConfig>): { isValid: boolean; errors: string[] };
}

// Default global configuration
const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  environmentId: '',
  clientId: '',
  clientSecret: '',
  tokenAuthMethod: 'none',
  redirectUri: window.location.origin + '/callback',
  scopes: 'openid profile email',
  pkceEnabled: true,
  updatedAt: Date.now(),
  authEndpoint: 'https://auth.pingone.com/{envId}/as/authorize',
  tokenEndpoint: 'https://auth.pingone.com/{envId}/as/token',
  userInfoEndpoint: 'https://auth.pingone.com/{envId}/as/userinfo',
  applicationType: 'spa',
  jwksMethod: 'jwks_url',
  jwksUrl: '',
  jwks: '',
  requirePar: false,
  parTimeout: 60,
  accessTokenLifetime: 60,
  refreshTokenLifetime: 10080,
  idTokenLifetime: 60,
  allowedOrigins: [window.location.origin]
};

// PingOne regions and their base URLs
const PINGONE_REGIONS = {
  'us': 'https://auth.pingone.com',
  'eu': 'https://auth.pingone.eu',
  'ca': 'https://auth.pingone.ca',
  'ap': 'https://auth.pingone.asia'
} as const;

type PingOneRegion = keyof typeof PINGONE_REGIONS;

/**
 * Get storage key for global configuration
 */
const getGlobalConfigKey = (): string => `${STORAGE_NAMESPACE}.config.global`;

/**
 * Get storage key for flow-specific configuration
 */
const getFlowConfigKey = (flowType: FlowType): string => `${STORAGE_NAMESPACE}.config.flow.${flowType}`;

/**
 * Derive region from environment ID or PingOne URL
 */
const deriveRegion = (environmentId: string, authEndpoint?: string): PingOneRegion => {
  if (authEndpoint) {
    if (authEndpoint.includes('.eu/')) return 'eu';
    if (authEndpoint.includes('.ca/')) return 'ca';
    if (authEndpoint.includes('.asia/')) return 'ap';
  }
  
  // Default to US region
  return 'us';
};

/**
 * Get PingOne base URL for a region
 */
const getPingOneBaseUrl = (region: PingOneRegion): string => {
  return PINGONE_REGIONS[region];
};

/**
 * Build auth endpoints from environment ID and region
 */
const buildAuthEndpoints = (environmentId: string, region: PingOneRegion) => {
  const baseUrl = getPingOneBaseUrl(region);
  return {
    authEndpoint: `${baseUrl}/${environmentId}/as/authorize`,
    tokenEndpoint: `${baseUrl}/${environmentId}/as/token`,
    userInfoEndpoint: `${baseUrl}/${environmentId}/as/userinfo`
  };
};

/**
 * Validate configuration object
 */
const validateConfig = (config: Partial<BaseConfig>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (config.environmentId && !config.environmentId.trim()) {
    errors.push('Environment ID cannot be empty');
  }

  if (config.clientId && !config.clientId.trim()) {
    errors.push('Client ID cannot be empty');
  }

  if (config.redirectUri && !/^https?:\/\//.test(config.redirectUri)) {
    errors.push('Redirect URI must start with http:// or https://');
  }

  if (config.tokenAuthMethod) {
    const validMethods: TokenAuthMethod[] = ['none', 'client_secret_basic', 'client_secret_post', 'private_key_jwt'];
    if (!validMethods.includes(config.tokenAuthMethod)) {
      errors.push(`Invalid token authentication method: ${config.tokenAuthMethod}`);
    }
  }

  // Validate token auth method requirements
  if (config.tokenAuthMethod === 'none' && config.clientSecret) {
    errors.push('Client secret is not allowed when token authentication method is "none"');
  }

  if (config.tokenAuthMethod && config.tokenAuthMethod !== 'none' && config.tokenAuthMethod !== 'private_key_jwt' && !config.clientSecret) {
    errors.push(`Client secret is required for token authentication method: ${config.tokenAuthMethod}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Migrate configuration from v1 to v2 format
 */
const migrateFromV1 = (): boolean => {
  try {
    console.log('🔄 [⚙️ CONFIG] Starting migration from v1 to v2...');
    
    // Check for v1 configuration
    const v1Config = localStorage.getItem('pingone_config');
    if (!v1Config) {
      console.log('ℹ️ [⚙️ CONFIG] No v1 configuration found, skipping migration');
      return true;
    }

    const parsedV1Config = JSON.parse(v1Config);
    console.log('📦 [⚙️ CONFIG] Found v1 configuration:', {
      environmentId: !!parsedV1Config.environmentId,
      clientId: !!parsedV1Config.clientId,
      hasClientSecret: !!parsedV1Config.clientSecret
    });

    // Convert v1 config to v2 global config
    const v2GlobalConfig: GlobalConfig = {
      environmentId: parsedV1Config.environmentId || '',
      clientId: parsedV1Config.clientId || '',
      clientSecret: parsedV1Config.clientSecret || '',
      tokenAuthMethod: parsedV1Config.authenticationMethod || 'none',
      redirectUri: parsedV1Config.redirectUri || window.location.origin + '/callback',
      scopes: parsedV1Config.scopes || 'openid profile email',
      pkceEnabled: parsedV1Config.usePKCE !== false,
      updatedAt: Date.now(),
      authEndpoint: parsedV1Config.authEndpoint || 'https://auth.pingone.com/{envId}/as/authorize',
      tokenEndpoint: parsedV1Config.tokenEndpoint || 'https://auth.pingone.com/{envId}/as/token',
      userInfoEndpoint: parsedV1Config.userInfoEndpoint || 'https://auth.pingone.com/{envId}/as/userinfo',
      applicationType: parsedV1Config.applicationType || 'spa',
      jwksMethod: parsedV1Config.jwksMethod || 'jwks_url',
      jwksUrl: parsedV1Config.jwksUrl || '',
      jwks: parsedV1Config.jwks || '',
      requirePar: parsedV1Config.requirePar || false,
      parTimeout: parsedV1Config.parTimeout || 60,
      accessTokenLifetime: parsedV1Config.accessTokenLifetime || 60,
      refreshTokenLifetime: parsedV1Config.refreshTokenLifetime || 10080,
      idTokenLifetime: parsedV1Config.idTokenLifetime || 60,
      allowedOrigins: parsedV1Config.allowedOrigins || [window.location.origin]
    };

    // Save v2 global config
    const success = localStorageService.setItem(getGlobalConfigKey(), v2GlobalConfig);
    if (success) {
      console.log('✅ [⚙️ CONFIG] Successfully migrated v1 configuration to v2');
      // Optionally remove v1 config after successful migration
      // localStorage.removeItem('pingone_config');
      return true;
    } else {
      console.error('❌ [⚙️ CONFIG] Failed to save v2 configuration during migration');
      return false;
    }
  } catch (error) {
    console.error('❌ [⚙️ CONFIG] Error during v1 to v2 migration:', error);
    return false;
  }
};

/**
 * Configuration store implementation
 */
export const configStore: ConfigStore = {
  /**
   * Get global configuration
   */
  getGlobalConfig(): GlobalConfig | null {
    try {
      const config = localStorageService.getItem<GlobalConfig>(getGlobalConfigKey());
      if (config) {
        console.log('📖 [⚙️ CONFIG] Loaded global configuration');
        return config;
      }
      return null;
    } catch (error) {
      console.error('❌ [⚙️ CONFIG] Error loading global configuration:', error);
      return null;
    }
  },

  /**
   * Set global configuration
   */
  setGlobalConfig(config: GlobalConfig): boolean {
    try {
      const validation = validateConfig(config);
      if (!validation.isValid) {
        console.error('❌ [⚙️ CONFIG] Global configuration validation failed:', validation.errors);
        return false;
      }

      const configWithTimestamp = {
        ...config,
        updatedAt: Date.now()
      };

      const success = localStorageService.setItem(getGlobalConfigKey(), configWithTimestamp);
      if (success) {
        console.log('💾 [⚙️ CONFIG] Global configuration saved successfully');
      }
      return success;
    } catch (error) {
      console.error('❌ [⚙️ CONFIG] Error saving global configuration:', error);
      return false;
    }
  },

  /**
   * Get flow-specific configuration
   */
  getFlowConfig(flowType: FlowType): FlowConfig | null {
    try {
      const config = localStorageService.getItem<FlowConfig>(getFlowConfigKey(flowType));
      if (config) {
        console.log(`📖 [⚙️ CONFIG] Loaded flow configuration for ${flowType}`);
        return config;
      }
      return null;
    } catch (error) {
      console.error(`❌ [⚙️ CONFIG] Error loading flow configuration for ${flowType}:`, error);
      return null;
    }
  },

  /**
   * Set flow-specific configuration
   */
  setFlowConfig(flowType: FlowType, config: FlowConfig): boolean {
    try {
      const validation = validateConfig(config);
      if (!validation.isValid) {
        console.error(`❌ [⚙️ CONFIG] Flow configuration validation failed for ${flowType}:`, validation.errors);
        return false;
      }

      const configWithTimestamp = {
        ...config,
        updatedAt: Date.now()
      };

      const success = localStorageService.setItem(getFlowConfigKey(flowType), configWithTimestamp);
      if (success) {
        console.log(`💾 [⚙️ CONFIG] Flow configuration saved successfully for ${flowType}`);
      }
      return success;
    } catch (error) {
      console.error(`❌ [⚙️ CONFIG] Error saving flow configuration for ${flowType}:`, error);
      return false;
    }
  },

  /**
   * Resolve effective configuration by merging global defaults with flow overrides
   */
  resolveConfig(flowType: FlowType): { config: EffectiveConfig; sourceMap: ConfigSourceMap } {
    try {
      console.log(`🔍 [⚙️ CONFIG] Resolving configuration for flow: ${flowType}`);
      
      // Get global configuration (with migration if needed)
      let globalConfig = this.getGlobalConfig();
      if (!globalConfig) {
        console.log('🔄 [⚙️ CONFIG] No global config found, attempting migration...');
        if (migrateFromV1()) {
          globalConfig = this.getGlobalConfig();
        }
        if (!globalConfig) {
          console.log('📝 [⚙️ CONFIG] Using default global configuration');
          globalConfig = { ...DEFAULT_GLOBAL_CONFIG };
        }
      }

      // Get flow-specific configuration
      const flowConfig = this.getFlowConfig(flowType) || {};

      // Derive region and build endpoints
      const region = deriveRegion(
        flowConfig.environmentId || globalConfig.environmentId,
        flowConfig.authEndpoint || globalConfig.authEndpoint
      );

      const endpoints = buildAuthEndpoints(
        flowConfig.environmentId || globalConfig.environmentId,
        region
      );

      // Create source map
      const sourceMap: ConfigSourceMap = {
        environmentId: flowConfig.environmentId ? 'flow' : 'global',
        region: flowConfig.region ? 'flow' : 'global',
        clientId: flowConfig.clientId ? 'flow' : 'global',
        clientSecret: flowConfig.clientSecret ? 'flow' : 'global',
        tokenAuthMethod: flowConfig.tokenAuthMethod ? 'flow' : 'global',
        redirectUri: flowConfig.redirectUri ? 'flow' : 'global',
        scopes: flowConfig.scopes ? 'flow' : 'global',
        pkceEnabled: flowConfig.pkceEnabled !== undefined ? 'flow' : 'global'
      };

      // Merge configurations (flow overrides global)
      const effectiveConfig: EffectiveConfig = {
        environmentId: flowConfig.environmentId || globalConfig.environmentId,
        region,
        clientId: flowConfig.clientId || globalConfig.clientId,
        clientSecret: flowConfig.clientSecret || globalConfig.clientSecret,
        tokenAuthMethod: flowConfig.tokenAuthMethod || globalConfig.tokenAuthMethod,
        redirectUri: flowConfig.redirectUri || globalConfig.redirectUri,
        scopes: flowConfig.scopes || globalConfig.scopes,
        pkceEnabled: flowConfig.pkceEnabled !== undefined ? flowConfig.pkceEnabled : globalConfig.pkceEnabled,
        updatedAt: flowConfig.updatedAt || globalConfig.updatedAt,
        authEndpoint: flowConfig.authEndpoint || endpoints.authEndpoint,
        tokenEndpoint: flowConfig.tokenEndpoint || endpoints.tokenEndpoint,
        userInfoEndpoint: flowConfig.userInfoEndpoint || endpoints.userInfoEndpoint,
        applicationType: globalConfig.applicationType || 'spa',
        jwksMethod: globalConfig.jwksMethod || 'jwks_url',
        jwksUrl: globalConfig.jwksUrl || '',
        jwks: globalConfig.jwks || '',
        requirePar: globalConfig.requirePar || false,
        parTimeout: globalConfig.parTimeout || 60,
        accessTokenLifetime: globalConfig.accessTokenLifetime || 60,
        refreshTokenLifetime: globalConfig.refreshTokenLifetime || 10080,
        idTokenLifetime: globalConfig.idTokenLifetime || 60,
        allowedOrigins: globalConfig.allowedOrigins || [window.location.origin]
      };

      console.log(`✅ [⚙️ CONFIG] Configuration resolved for ${flowType}:`, {
        environmentId: effectiveConfig.environmentId,
        clientId: effectiveConfig.clientId,
        hasClientSecret: !!effectiveConfig.clientSecret,
        tokenAuthMethod: effectiveConfig.tokenAuthMethod,
        pkceEnabled: effectiveConfig.pkceEnabled,
        sourceMap
      });

      return { config: effectiveConfig, sourceMap };
    } catch (error) {
      console.error(`❌ [⚙️ CONFIG] Error resolving configuration for ${flowType}:`, error);
      // Return default configuration on error
      const defaultConfig = { ...DEFAULT_GLOBAL_CONFIG };
      const region = deriveRegion(defaultConfig.environmentId);
      const endpoints = buildAuthEndpoints(defaultConfig.environmentId, region);
      
      return {
        config: {
          ...defaultConfig,
          ...endpoints,
          region,
          applicationType: 'spa',
          jwksMethod: 'jwks_url',
          jwksUrl: '',
          jwks: '',
          requirePar: false,
          parTimeout: 60,
          accessTokenLifetime: 60,
          refreshTokenLifetime: 10080,
          idTokenLifetime: 60,
          allowedOrigins: [window.location.origin]
        },
        sourceMap: {
          environmentId: 'global',
          region: 'global',
          clientId: 'global',
          clientSecret: 'global',
          tokenAuthMethod: 'global',
          redirectUri: 'global',
          scopes: 'global',
          pkceEnabled: 'global'
        }
      };
    }
  },

  /**
   * Clear flow-specific configuration
   */
  clearFlowConfig(flowType: FlowType): boolean {
    try {
      const success = localStorageService.removeItem(getFlowConfigKey(flowType));
      if (success) {
        console.log(`🗑️ [⚙️ CONFIG] Cleared flow configuration for ${flowType}`);
      }
      return success;
    } catch (error) {
      console.error(`❌ [⚙️ CONFIG] Error clearing flow configuration for ${flowType}:`, error);
      return false;
    }
  },

  /**
   * Clear all configurations
   */
  clearAllConfigs(): boolean {
    try {
      // Clear global config
      localStorageService.removeItem(getGlobalConfigKey());
      
      // Clear all flow configs
      const flowTypes: FlowType[] = ['auth_code_pkce', 'hybrid', 'client_credentials', 'refresh', 'introspection', 'implicit', 'device_code', 'worker_token'];
      flowTypes.forEach(flowType => {
        localStorageService.removeItem(getFlowConfigKey(flowType));
      });

      console.log('🗑️ [⚙️ CONFIG] Cleared all configurations');
      return true;
    } catch (error) {
      console.error('❌ [⚙️ CONFIG] Error clearing all configurations:', error);
      return false;
    }
  },

  /**
   * Migrate from v1 configuration format
   */
  migrateFromV1(): boolean {
    return migrateFromV1();
  },

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<BaseConfig>): { isValid: boolean; errors: string[] } {
    return validateConfig(config);
  }
};

export default configStore;
