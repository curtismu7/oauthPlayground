/**
 * CredentialsRepository Tests
 * 
 * Test coverage:
 * - Flow-specific credentials (get/set/clear)
 * - Shared credentials
 * - Environment ID management
 * - Reload functionality
 * - Event listeners
 * - Migration from old keys
 */

import { CredentialsRepository, createCredentialsRepository, Credentials, SharedCredentials } from '../credentialsRepository';

describe('CredentialsRepository', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Flow-specific credentials', () => {
    it('should set and get flow credentials', () => {
      const credentials: Credentials = {
        clientId: 'test-client',
        clientSecret: 'test-secret',
        environmentId: 'test-env',
        scopes: ['openid', 'profile'],
      };

      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);
      const result = CredentialsRepository.getFlowCredentials('unified-oauth');

      expect(result).toEqual(credentials);
    });

    it('should return null for non-existent flow', () => {
      const result = CredentialsRepository.getFlowCredentials('non-existent');
      expect(result).toBeNull();
    });

    it('should clear flow credentials', () => {
      const credentials: Credentials = {
        clientId: 'test-client',
      };

      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);
      CredentialsRepository.clearFlowCredentials('unified-oauth');
      const result = CredentialsRepository.getFlowCredentials('unified-oauth');

      expect(result).toBeNull();
    });

    it('should handle multiple flows independently', () => {
      const oauthCreds: Credentials = { clientId: 'oauth-client' };
      const mfaCreds: Credentials = { clientId: 'mfa-client' };

      CredentialsRepository.setFlowCredentials('unified-oauth', oauthCreds);
      CredentialsRepository.setFlowCredentials('mfa-sms', mfaCreds);

      expect(CredentialsRepository.getFlowCredentials('unified-oauth')).toEqual(oauthCreds);
      expect(CredentialsRepository.getFlowCredentials('mfa-sms')).toEqual(mfaCreds);
    });
  });

  describe('Shared credentials', () => {
    it('should set and get shared credentials', () => {
      const shared: SharedCredentials = {
        environmentId: 'shared-env',
        defaultClientId: 'default-client',
        defaultIssuerUrl: 'https://auth.example.com',
      };

      CredentialsRepository.setSharedCredentials(shared);
      const result = CredentialsRepository.getSharedCredentials();

      expect(result).toEqual(shared);
    });

    it('should return null for non-existent shared credentials', () => {
      const result = CredentialsRepository.getSharedCredentials();
      expect(result).toBeNull();
    });
  });

  describe('Environment ID management', () => {
    it('should set and get environment ID', () => {
      CredentialsRepository.setEnvironmentId('test-env-123');
      const result = CredentialsRepository.getEnvironmentId();

      expect(result).toBe('test-env-123');
    });

    it('should return null for non-existent environment ID', () => {
      const result = CredentialsRepository.getEnvironmentId();
      expect(result).toBeNull();
    });

    it('should update environment ID in shared credentials', () => {
      CredentialsRepository.setSharedCredentials({
        defaultClientId: 'client-123',
      });

      CredentialsRepository.setEnvironmentId('new-env');

      const shared = CredentialsRepository.getSharedCredentials();
      expect(shared?.environmentId).toBe('new-env');
      expect(shared?.defaultClientId).toBe('client-123');
    });
  });

  describe('Reload functionality', () => {
    it('should reload flow credentials', () => {
      const credentials: Credentials = {
        clientId: 'test-client',
      };

      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);
      const reloaded = CredentialsRepository.reloadFlowCredentials('unified-oauth');

      expect(reloaded).toEqual(credentials);
    });

    it('should return null when reloading non-existent flow', () => {
      const reloaded = CredentialsRepository.reloadFlowCredentials('non-existent');
      expect(reloaded).toBeNull();
    });
  });

  describe('Event listeners', () => {
    it('should notify credentials change listeners', () => {
      const listener = jest.fn();
      const credentials: Credentials = { clientId: 'test' };

      CredentialsRepository.onCredentialsChanged('unified-oauth', listener);
      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);

      expect(listener).toHaveBeenCalledWith(credentials);
    });

    it('should support multiple listeners for same flow', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const credentials: Credentials = { clientId: 'test' };

      CredentialsRepository.onCredentialsChanged('unified-oauth', listener1);
      CredentialsRepository.onCredentialsChanged('unified-oauth', listener2);
      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);

      expect(listener1).toHaveBeenCalledWith(credentials);
      expect(listener2).toHaveBeenCalledWith(credentials);
    });

    it('should unsubscribe credentials listener', () => {
      const listener = jest.fn();
      const credentials: Credentials = { clientId: 'test' };

      const unsubscribe = CredentialsRepository.onCredentialsChanged('unified-oauth', listener);
      unsubscribe();
      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify environment ID change listeners', () => {
      const listener = jest.fn();

      CredentialsRepository.onEnvironmentIdChanged(listener);
      CredentialsRepository.setEnvironmentId('new-env');

      expect(listener).toHaveBeenCalledWith('new-env');
    });

    it('should unsubscribe environment ID listener', () => {
      const listener = jest.fn();

      const unsubscribe = CredentialsRepository.onEnvironmentIdChanged(listener);
      unsubscribe();
      CredentialsRepository.setEnvironmentId('new-env');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should notify on reload', () => {
      const listener = jest.fn();
      const credentials: Credentials = { clientId: 'test' };

      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);
      listener.mockClear();

      CredentialsRepository.onCredentialsChanged('unified-oauth', listener);
      CredentialsRepository.reloadFlowCredentials('unified-oauth');

      expect(listener).toHaveBeenCalledWith(credentials);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();
      const credentials: Credentials = { clientId: 'test' };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      CredentialsRepository.onCredentialsChanged('unified-oauth', errorListener);
      CredentialsRepository.onCredentialsChanged('unified-oauth', goodListener);
      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);

      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Migration', () => {
    it('should migrate old credentials keys on first use', () => {
      localStorage.setItem('credentials_v8_unified-oauth', JSON.stringify({ clientId: 'old-client' }));
      localStorage.setItem('shared_credentials_v8', JSON.stringify({ environmentId: 'old-env' }));

      const repo = createCredentialsRepository();

      const flowCreds = repo.getFlowCredentials('unified-oauth');
      const sharedCreds = repo.getSharedCredentials();

      expect(flowCreds).toEqual({ clientId: 'old-client' });
      expect(sharedCreds?.environmentId).toBe('old-env');
    });

    it('should migrate environment_id to shared credentials', () => {
      localStorage.setItem('environment_id', JSON.stringify('standalone-env'));

      const repo = createCredentialsRepository();

      const envId = repo.getEnvironmentId();
      expect(envId).toBe('standalone-env');
    });

    it('should only migrate once', () => {
      localStorage.setItem('credentials_v8_unified-oauth', JSON.stringify({ clientId: 'old-client' }));

      const repo1 = createCredentialsRepository();
      repo1.getFlowCredentials('unified-oauth');

      localStorage.setItem('credentials_v8_unified-oauth', JSON.stringify({ clientId: 'newer-client' }));

      const repo2 = createCredentialsRepository();
      const creds = repo2.getFlowCredentials('unified-oauth');

      expect(creds).toEqual({ clientId: 'old-client' });
    });

    it('should handle migration errors gracefully', () => {
      localStorage.setItem('credentials_v8_unified-oauth', '{invalid json}');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const repo = createCredentialsRepository();
      repo.getFlowCredentials('unified-oauth');

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Multiple instances', () => {
    it('should support multiple repository instances', () => {
      const repo1 = createCredentialsRepository();
      const repo2 = createCredentialsRepository();

      repo1.setFlowCredentials('flow1', { clientId: 'client1' });
      repo2.setFlowCredentials('flow2', { clientId: 'client2' });

      expect(repo1.getFlowCredentials('flow1')).toEqual({ clientId: 'client1' });
      expect(repo2.getFlowCredentials('flow2')).toEqual({ clientId: 'client2' });
    });
  });

  describe('Complex credentials', () => {
    it('should handle all credential fields', () => {
      const credentials: Credentials = {
        clientId: 'test-client',
        clientSecret: 'test-secret',
        environmentId: 'test-env',
        issuerUrl: 'https://auth.example.com',
        redirectUri: 'https://app.example.com/callback',
        scopes: ['openid', 'profile', 'email'],
        responseType: 'code',
        grantType: 'authorization_code',
        tokenEndpointAuthMethod: 'client_secret_basic',
        pkceMethod: 'S256',
        maxAge: '3600',
        loginHint: 'user@example.com',
        acrValues: 'urn:mace:incommon:iap:silver',
        prompt: 'login',
        display: 'page',
        uiLocales: 'en-US',
        idTokenHint: 'eyJhbGc...',
        claims: '{"userinfo":{"email":null}}',
        resource: 'https://api.example.com',
        audience: 'https://api.example.com',
      };

      CredentialsRepository.setFlowCredentials('unified-oauth', credentials);
      const result = CredentialsRepository.getFlowCredentials('unified-oauth');

      expect(result).toEqual(credentials);
    });
  });
});
