/**
 * Unit tests for configStore
 */

import { configStore, FlowType, GlobalConfig, FlowConfig } from '../utils/configStore';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'https://localhost:3000'
  },
  writable: true
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('configStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('getGlobalConfig', () => {
    it('should return null when no global config exists', () => {
      const result = configStore.getGlobalConfig();
      expect(result).toBeNull();
    });

    it('should return global config when it exists', () => {
      const mockConfig: GlobalConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa',
        jwksMethod: 'jwks_url',
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000']
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockConfig));
      
      const result = configStore.getGlobalConfig();
      expect(result).toEqual(mockConfig);
    });
  });

  describe('setGlobalConfig', () => {
    it('should save valid global config', () => {
      const config: GlobalConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa',
        jwksMethod: 'jwks_url',
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000']
      };

      mockLocalStorage.setItem.mockReturnValue(true);
      
      const result = configStore.setGlobalConfig(config);
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'p1_import_tool.v2.config.global',
        expect.objectContaining({
          ...config,
          updatedAt: expect.any(Number)
        })
      );
    });

    it('should reject invalid global config', () => {
      const invalidConfig = {
        environmentId: '', // Invalid: empty environment ID
        clientId: 'test-client-123',
        tokenAuthMethod: 'client_secret_basic',
        redirectUri: 'invalid-url', // Invalid: not a proper URL
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now()
      } as any;

      const result = configStore.setGlobalConfig(invalidConfig);
      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getFlowConfig', () => {
    it('should return null when no flow config exists', () => {
      const result = configStore.getFlowConfig('auth_code_pkce');
      expect(result).toBeNull();
    });

    it('should return flow config when it exists', () => {
      const mockFlowConfig: FlowConfig = {
        clientId: 'flow-specific-client',
        tokenAuthMethod: 'none',
        pkceEnabled: true,
        updatedAt: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockFlowConfig));
      
      const result = configStore.getFlowConfig('auth_code_pkce');
      expect(result).toEqual(mockFlowConfig);
    });
  });

  describe('setFlowConfig', () => {
    it('should save valid flow config', () => {
      const flowConfig: FlowConfig = {
        clientId: 'flow-specific-client',
        tokenAuthMethod: 'none',
        pkceEnabled: true,
        updatedAt: Date.now()
      };

      mockLocalStorage.setItem.mockReturnValue(true);
      
      const result = configStore.setFlowConfig('auth_code_pkce', flowConfig);
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'p1_import_tool.v2.config.flow.auth_code_pkce',
        expect.objectContaining({
          ...flowConfig,
          updatedAt: expect.any(Number)
        })
      );
    });

    it('should reject invalid flow config', () => {
      const invalidFlowConfig = {
        clientId: '', // Invalid: empty client ID
        tokenAuthMethod: 'invalid_method', // Invalid: not a valid auth method
        updatedAt: Date.now()
      } as any;

      const result = configStore.setFlowConfig('auth_code_pkce', invalidFlowConfig);
      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('resolveConfig', () => {
    it('should return default config when no global or flow config exists', () => {
      const { config, sourceMap } = configStore.resolveConfig('auth_code_pkce');
      
      expect(config).toBeDefined();
      expect(config.environmentId).toBe('');
      expect(config.clientId).toBe('');
      expect(config.tokenAuthMethod).toBe('none');
      expect(config.pkceEnabled).toBe(true);
      
      expect(sourceMap).toBeDefined();
      expect(sourceMap.environmentId).toBe('global');
      expect(sourceMap.clientId).toBe('global');
    });

    it('should merge global config with flow overrides', () => {
      const globalConfig: GlobalConfig = {
        environmentId: 'global-env-123',
        clientId: 'global-client-123',
        clientSecret: 'global-secret',
        tokenAuthMethod: 'client_secret_basic',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/global-env-123/as/authorize',
        tokenEndpoint: 'https://auth.pingone.com/global-env-123/as/token',
        userInfoEndpoint: 'https://auth.pingone.com/global-env-123/as/userinfo',
        applicationType: 'spa',
        jwksMethod: 'jwks_url',
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000']
      };

      const flowConfig: FlowConfig = {
        clientId: 'flow-client-456',
        tokenAuthMethod: 'none',
        pkceEnabled: false,
        updatedAt: Date.now()
      };

      // Mock localStorage responses
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(globalConfig)) // getGlobalConfig
        .mockReturnValueOnce(JSON.stringify(flowConfig)); // getFlowConfig

      const { config, sourceMap } = configStore.resolveConfig('auth_code_pkce');
      
      // Should use flow overrides where available
      expect(config.clientId).toBe('flow-client-456');
      expect(config.tokenAuthMethod).toBe('none');
      expect(config.pkceEnabled).toBe(false);
      
      // Should use global defaults where flow config is not available
      expect(config.environmentId).toBe('global-env-123');
      expect(config.clientSecret).toBe('global-secret');
      expect(config.redirectUri).toBe('https://localhost:3000/callback');
      
      // Source map should reflect the sources
      expect(sourceMap.clientId).toBe('flow');
      expect(sourceMap.tokenAuthMethod).toBe('flow');
      expect(sourceMap.pkceEnabled).toBe('flow');
      expect(sourceMap.environmentId).toBe('global');
      expect(sourceMap.clientSecret).toBe('global');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        redirectUri: 'https://localhost:3000/callback',
        tokenAuthMethod: 'client_secret_basic',
        clientSecret: 'test-secret'
      };

      const result = configStore.validateConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty environment ID', () => {
      const invalidConfig = {
        environmentId: '',
        clientId: 'test-client-123',
        redirectUri: 'https://localhost:3000/callback',
        tokenAuthMethod: 'client_secret_basic'
      };

      const result = configStore.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Environment ID cannot be empty');
    });

    it('should reject invalid redirect URI', () => {
      const invalidConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        redirectUri: 'invalid-url',
        tokenAuthMethod: 'client_secret_basic'
      };

      const result = configStore.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Redirect URI must start with http:// or https://');
    });

    it('should reject client secret when auth method is none', () => {
      const invalidConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        redirectUri: 'https://localhost:3000/callback',
        tokenAuthMethod: 'none',
        clientSecret: 'test-secret'
      };

      const result = configStore.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Client secret is not allowed when token authentication method is "none"');
    });

    it('should require client secret for client_secret_basic', () => {
      const invalidConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        redirectUri: 'https://localhost:3000/callback',
        tokenAuthMethod: 'client_secret_basic'
        // Missing clientSecret
      };

      const result = configStore.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Client secret is required for token authentication method: client_secret_basic');
    });
  });

  describe('clearFlowConfig', () => {
    it('should clear flow config', () => {
      mockLocalStorage.removeItem.mockReturnValue(true);
      
      const result = configStore.clearFlowConfig('auth_code_pkce');
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'p1_import_tool.v2.config.flow.auth_code_pkce'
      );
    });
  });

  describe('clearAllConfigs', () => {
    it('should clear all configs', () => {
      mockLocalStorage.removeItem.mockReturnValue(true);
      
      const result = configStore.clearAllConfigs();
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(7); // 1 global + 6 flow types
    });
  });
});


