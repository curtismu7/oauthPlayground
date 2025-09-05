/**
 * Unit tests for tokenExchange
 */

import { 
  exchangeCodeForTokens, 
  exchangeClientCredentialsForTokens, 
  refreshAccessToken,
  testTokenEndpointConnectivity 
} from '../utils/tokenExchange';
import { configStore } from '../utils/configStore';

// Mock fetch
global.fetch = jest.fn();

// Mock configStore
jest.mock('../utils/configStore', () => ({
  configStore: {
    resolveConfig: jest.fn()
  }
}));

const mockConfigStore = configStore as jest.Mocked<typeof configStore>;

describe('tokenExchange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens with client_secret_basic auth', async () => {
      const mockConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic' as const,
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      const mockResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        id_token: 'mock-id-token',
        scope: 'openid profile email'
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await exchangeCodeForTokens('auth_code_pkce', {
        code: 'test-auth-code',
        redirect_uri: 'https://localhost:3000/callback',
        code_verifier: 'test-code-verifier'
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth.pingone.com/test-env-123/as/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa('test-client-123:test-secret')
          },
          body: expect.stringContaining('grant_type=authorization_code')
        }
      );
    });

    it('should exchange code for tokens with client_secret_post auth', async () => {
      const mockConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_post' as const,
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      const mockResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await exchangeCodeForTokens('auth_code_pkce', {
        code: 'test-auth-code',
        redirect_uri: 'https://localhost:3000/callback'
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth.pingone.com/test-env-123/as/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: expect.stringContaining('client_id=test-client-123&client_secret=test-secret')
        }
      );
    });

    it('should handle token exchange errors', async () => {
      const mockConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic' as const,
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      const mockError = {
        error: 'invalid_grant',
        error_description: 'Invalid authorization code'
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockError)
      });

      await expect(exchangeCodeForTokens('auth_code_pkce', {
        code: 'invalid-code',
        redirect_uri: 'https://localhost:3000/callback'
      })).rejects.toThrow('Invalid authorization code');
    });
  });

  describe('exchangeClientCredentialsForTokens', () => {
    it('should exchange client credentials for tokens', async () => {
      const mockConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic' as const,
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'api:read',
        pkceEnabled: false,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'backend' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      const mockResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'api:read'
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await exchangeClientCredentialsForTokens('client_credentials', {
        scope: 'api:read'
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth.pingone.com/test-env-123/as/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa('test-client-123:test-secret')
          },
          body: expect.stringContaining('grant_type=client_credentials')
        }
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      const mockConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic' as const,
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      const mockResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token'
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await refreshAccessToken('auth_code_pkce', {
        refresh_token: 'old-refresh-token',
        scope: 'openid profile email'
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://auth.pingone.com/test-env-123/as/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa('test-client-123:test-secret')
          },
          body: expect.stringContaining('grant_type=refresh_token')
        }
      );
    });
  });

  describe('testTokenEndpointConnectivity', () => {
    it('should test connectivity successfully', async () => {
      const mockConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic' as const,
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400, // Expected for invalid request
        statusText: 'Bad Request'
      });

      const result = await testTokenEndpointConnectivity('auth_code_pkce');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Token endpoint is reachable and responding');
      expect(result.details).toEqual({
        status: 400,
        statusText: 'Bad Request'
      });
    });

    it('should handle connectivity test failure', async () => {
      const mockConfig = {
        environmentId: 'test-env-123',
        clientId: 'test-client-123',
        clientSecret: 'test-secret',
        tokenAuthMethod: 'client_secret_basic' as const,
        tokenEndpoint: 'https://auth.pingone.com/test-env-123/as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com/test-env-123/as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com/test-env-123/as/userinfo',
        applicationType: 'spa' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await testTokenEndpointConnectivity('auth_code_pkce');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connectivity test failed: Network error');
    });

    it('should handle missing configuration', async () => {
      const mockConfig = {
        environmentId: '',
        clientId: '',
        clientSecret: '',
        tokenAuthMethod: 'none' as const,
        tokenEndpoint: 'https://auth.pingone.com//as/token',
        redirectUri: 'https://localhost:3000/callback',
        scopes: 'openid profile email',
        pkceEnabled: true,
        updatedAt: Date.now(),
        authEndpoint: 'https://auth.pingone.com//as/authorize',
        userInfoEndpoint: 'https://auth.pingone.com//as/userinfo',
        applicationType: 'spa' as const,
        jwksMethod: 'jwks_url' as const,
        jwksUrl: '',
        jwks: '',
        requirePar: false,
        parTimeout: 60,
        accessTokenLifetime: 60,
        refreshTokenLifetime: 10080,
        idTokenLifetime: 60,
        allowedOrigins: ['https://localhost:3000'],
        region: 'us' as const
      };

      mockConfigStore.resolveConfig.mockReturnValue({
        config: mockConfig,
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
      });

      const result = await testTokenEndpointConnectivity('auth_code_pkce');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Missing required configuration (Environment ID or Client ID)');
    });
  });
});


