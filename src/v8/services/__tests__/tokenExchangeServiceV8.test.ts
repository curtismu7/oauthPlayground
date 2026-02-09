// src/v8/services/__tests__/tokenExchangeServiceV8.test.ts
// Token Exchange Phase 1 - Service Tests

import { TokenExchangeServiceV8 } from '../tokenExchangeServiceV8';
import { TokenExchangeConfigServiceV8 } from '../tokenExchangeConfigServiceV8';
import { TokenExchangeParams, TokenExchangeErrorType } from '../../types/tokenExchangeTypesV8';

describe('TokenExchangeServiceV8', () => {
  const mockEnvironmentId = 'test-env-123';
  const mockSubjectToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksImVudl9pZCI6InRlc3QtZW52LTEyMyJ9.mock-signature';

  describe('exchangeToken', () => {
    it('should fail when Token Exchange is disabled', async () => {
      // Mock disabled config
      jest.spyOn(TokenExchangeConfigServiceV8, 'isEnabled').mockResolvedValue(false);

      const params: TokenExchangeParams = {
        subject_token: mockSubjectToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        scope: 'read'
      };

      await expect(TokenExchangeServiceV8.exchangeToken(params, mockEnvironmentId))
        .rejects.toThrow('Token Exchange is not enabled for this environment');
    });

    it('should fail with invalid token', async () => {
      // Mock enabled config
      jest.spyOn(TokenExchangeConfigServiceV8, 'isEnabled').mockResolvedValue(true);

      const params: TokenExchangeParams = {
        subject_token: 'invalid-token',
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        requested_token_type: 'urn:ietf:params:oauth:token-type:access_token'
      };

      await expect(TokenExchangeServiceV8.exchangeToken(params, mockEnvironmentId))
        .rejects.toThrow('Invalid subject token');
    });

    it('should fail with wrong environment token', async () => {
      // Mock enabled config
      jest.spyOn(TokenExchangeConfigServiceV8, 'isEnabled').mockResolvedValue(true);

      const wrongEnvToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksImVudl9pZCI6ImRpZmZlcmVudC1lbnYifQ.mock-signature';

      const params: TokenExchangeParams = {
        subject_token: wrongEnvToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        requested_token_type: 'urn:ietf:params:oauth:token-type:access_token'
      };

      await expect(TokenExchangeServiceV8.exchangeToken(params, mockEnvironmentId))
        .rejects.toThrow('Token must be from the same environment');
    });

    it('should succeed with valid parameters', async () => {
      // Mock enabled config and scope validation
      jest.spyOn(TokenExchangeConfigServiceV8, 'isEnabled').mockResolvedValue(true);
      jest.spyOn(TokenExchangeConfigServiceV8, 'validateScopes').mockResolvedValue(true);

      const params: TokenExchangeParams = {
        subject_token: mockSubjectToken,
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        scope: 'read'
      };

      const result = await TokenExchangeServiceV8.exchangeToken(params, mockEnvironmentId);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('token_type', 'Bearer');
      expect(result).toHaveProperty('expires_in');
      expect(result).toHaveProperty('issued_token_type', 'urn:ietf:params:oauth:token-type:access_token');
      expect(result).not.toHaveProperty('refresh_token'); // Phase 1: no refresh token
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      const result = await TokenExchangeServiceV8.validateToken(mockSubjectToken, mockEnvironmentId);

      expect(result.isValid).toBe(true);
      expect(result.environmentId).toBe(mockEnvironmentId);
      expect(result.tokenType).toBe('access_token');
    });

    it('should reject expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE2MjYyMzkwMjIsImVudl9pZCI6InRlc3QtZW52LTEyMyJ9.mock-signature';

      const result = await TokenExchangeServiceV8.validateToken(expiredToken, mockEnvironmentId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token expired');
    });

    it('should reject malformed token', async () => {
      const malformedToken = 'not-a-jwt-token';

      const result = await TokenExchangeServiceV8.validateToken(malformedToken, mockEnvironmentId);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });
  });
});
