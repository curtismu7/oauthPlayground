/**
 * Unit tests for BankingAuthenticationManager
 */

import { vi } from 'vitest';
import { BankingAuthenticationManager } from '../../src/auth/BankingAuthenticationManager';
import { PingOneConfig } from '../../src/interfaces/auth';

// Mock the individual components
vi.mock('../../src/auth/TokenIntrospector');
vi.mock('../../src/auth/AuthorizationManager');
vi.mock('../../src/auth/AuthorizationRequestGenerator');

describe('BankingAuthenticationManager', () => {
  let authManager: BankingAuthenticationManager;
  let mockConfig: PingOneConfig;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://openam-dna.forgeblocks.com:443',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      tokenIntrospectionEndpoint: 'https://openam-dna.forgeblocks.com:443/am/oauth2/realms/root/realms/alpha/introspect',
      authorizationEndpoint: 'https://openam-dna.forgeblocks.com:443/am/oauth2/realms/root/realms/alpha/authorize',
      tokenEndpoint: 'https://openam-dna.forgeblocks.com:443/am/oauth2/realms/root/realms/alpha/access_token'
    };

    authManager = new BankingAuthenticationManager(mockConfig);
  });

  afterEach(() => {
    authManager.destroy();
  });

  it('should initialize with all required components', () => {
    expect(authManager).toBeDefined();
    expect(authManager.validateAgentToken).toBeDefined();
    expect(authManager.exchangeAuthorizationCode).toBeDefined();
    expect(authManager.generateAuthorizationRequest).toBeDefined();
  });

  it('should have all required methods', () => {
    const expectedMethods = [
      'validateAgentToken',
      'validateTokenScopes',
      'exchangeAuthorizationCode',
      'refreshUserToken',
      'generateAuthorizationRequest',
      'validateAuthorizationState',
      'completeAuthorizationRequest',
      'validateBankingScopes',
      'isTokenExpired',
      'getTokenLifetime',
      'getPendingRequestsForSession',
      'cleanupExpiredRequests',
      'healthCheck',
      'destroy'
    ];

    expectedMethods.forEach(method => {
      expect(typeof (authManager as any)[method]).toBe('function');
    });
  });
});