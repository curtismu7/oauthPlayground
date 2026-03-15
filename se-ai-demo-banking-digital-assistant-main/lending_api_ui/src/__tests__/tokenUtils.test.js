/**
 * Unit tests for token utility functions
 */

import {
  decodeJWTToken,
  fetchOAuthTokenData,
  isJWTToken,
  formatTokenExpiration,
  formatJSONForDisplay
} from '../services/tokenUtils';
import apiClient from '../services/apiClient';

// Mock the apiClient
jest.mock('../services/apiClient', () => ({
  getSessionStatus: jest.fn()
}));

describe('Token Utility Functions', () => {
  
  describe('decodeJWTToken', () => {
    // Valid JWT token for testing (header: {"alg":"HS256","typ":"JWT"}, payload: {"sub":"1234567890","name":"John Doe","iat":1516239022})
    const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    test('should decode a valid JWT token correctly', () => {
      const result = decodeJWTToken(validJWT);
      
      expect(result).toHaveProperty('header');
      expect(result).toHaveProperty('payload');
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('raw');
      
      expect(result.header).toEqual({
        alg: 'HS256',
        typ: 'JWT'
      });
      
      expect(result.payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022
      });
      
      expect(result.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
      expect(result.raw).toBe(validJWT);
    });

    test('should throw error for null or undefined token', () => {
      expect(() => decodeJWTToken(null)).toThrow('Token must be a non-empty string');
      expect(() => decodeJWTToken(undefined)).toThrow('Token must be a non-empty string');
      expect(() => decodeJWTToken('')).toThrow('Token must be a non-empty string');
    });

    test('should throw error for non-string token', () => {
      expect(() => decodeJWTToken(123)).toThrow('Token must be a non-empty string');
      expect(() => decodeJWTToken({})).toThrow('Token must be a non-empty string');
      expect(() => decodeJWTToken([])).toThrow('Token must be a non-empty string');
    });

    test('should throw error for malformed JWT (wrong number of parts)', () => {
      expect(() => decodeJWTToken('invalid')).toThrow('Invalid JWT token format - must have 3 parts separated by dots');
      expect(() => decodeJWTToken('part1.part2')).toThrow('Invalid JWT token format - must have 3 parts separated by dots');
      expect(() => decodeJWTToken('part1.part2.part3.part4')).toThrow('Invalid JWT token format - must have 3 parts separated by dots');
    });

    test('should handle invalid base64 encoding gracefully', () => {
      const invalidBase64JWT = 'invalid-base64.invalid-base64.signature';
      const result = decodeJWTToken(invalidBase64JWT);
      
      expect(result.header).toEqual({ error: 'Failed to decode header' });
      expect(result.payload).toEqual({ error: 'Failed to decode payload' });
      expect(result.signature).toBe('signature');
      expect(result.raw).toBe(invalidBase64JWT);
    });

    test('should handle malformed JSON in token parts', () => {
      // Create a token with valid base64 but invalid JSON
      const invalidJSONHeader = btoa('invalid json');
      const invalidJSONPayload = btoa('invalid json');
      const invalidJSONJWT = `${invalidJSONHeader}.${invalidJSONPayload}.signature`;
      
      const result = decodeJWTToken(invalidJSONJWT);
      
      expect(result.header).toEqual({ error: 'Failed to decode header' });
      expect(result.payload).toEqual({ error: 'Failed to decode payload' });
      expect(result.signature).toBe('signature');
      expect(result.raw).toBe(invalidJSONJWT);
    });

    test('should handle base64 padding issues', () => {
      // Create a token with payload that needs padding
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: '123' })).replace(/=/g, ''); // Remove padding
      const signature = 'signature';
      const tokenWithoutPadding = `${header}.${payload}.${signature}`;
      
      const result = decodeJWTToken(tokenWithoutPadding);
      
      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(result.payload).toEqual({ sub: '123' });
      expect(result.signature).toBe('signature');
    });
  });

  describe('isJWTToken', () => {
    test('should return true for valid JWT format', () => {
      expect(isJWTToken('header.payload.signature')).toBe(true);
      expect(isJWTToken('a.b.c')).toBe(true);
    });

    test('should return false for invalid JWT format', () => {
      expect(isJWTToken('')).toBe(false);
      expect(isJWTToken('invalid')).toBe(false);
      expect(isJWTToken('part1.part2')).toBe(false);
      expect(isJWTToken('part1.part2.part3.part4')).toBe(false);
      expect(isJWTToken(null)).toBe(false);
      expect(isJWTToken(undefined)).toBe(false);
      expect(isJWTToken(123)).toBe(false);
    });

    test('should return false for tokens with empty parts', () => {
      expect(isJWTToken('..')).toBe(false);
      expect(isJWTToken('header..signature')).toBe(false);
      expect(isJWTToken('.payload.signature')).toBe(false);
    });
  });

  describe('formatTokenExpiration', () => {
    test('should format valid expiration date', () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const result = formatTokenExpiration(futureDate.toISOString());
      
      expect(result.formatted).toBe(futureDate.toLocaleString());
      expect(result.isExpired).toBe(false);
      expect(result.timeUntilExpiry).toBeGreaterThan(0);
      expect(result.expirationDate).toEqual(futureDate);
    });

    test('should handle expired tokens', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const result = formatTokenExpiration(pastDate.toISOString());
      
      expect(result.formatted).toBe(pastDate.toLocaleString());
      expect(result.isExpired).toBe(true);
      expect(result.timeUntilExpiry).toBe(0);
    });

    test('should handle missing expiration', () => {
      const result = formatTokenExpiration(null);
      
      expect(result.formatted).toBe('Unknown');
      expect(result.isExpired).toBe(false);
      expect(result.timeUntilExpiry).toBe(null);
    });

    test('should handle invalid date format', () => {
      const result = formatTokenExpiration('invalid-date');
      
      expect(result.formatted).toBe('Invalid Date');
      expect(result.isExpired).toBe(false);
      expect(result.timeUntilExpiry).toBe(null);
    });
  });

  describe('formatJSONForDisplay', () => {
    test('should format valid objects', () => {
      const obj = { name: 'John', age: 30 };
      const result = formatJSONForDisplay(obj);
      
      expect(result).toBe(JSON.stringify(obj, null, 2));
    });

    test('should handle null and undefined', () => {
      expect(formatJSONForDisplay(null)).toBe('null');
      expect(formatJSONForDisplay(undefined)).toBe('null');
    });

    test('should handle primitive values', () => {
      expect(formatJSONForDisplay('string')).toBe('"string"');
      expect(formatJSONForDisplay(123)).toBe('123');
      expect(formatJSONForDisplay(true)).toBe('true');
    });

    test('should handle circular references gracefully', () => {
      const obj = { name: 'test' };
      obj.self = obj; // Create circular reference
      
      const result = formatJSONForDisplay(obj);
      expect(typeof result).toBe('string');
      expect(result).toBe('[object Object]'); // Should fallback to String() conversion
    });
  });

  describe('fetchOAuthTokenData', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should fetch and format token data successfully', async () => {
      const mockSessionData = {
        authenticated: true,
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        tokenType: 'Bearer',
        expiresAt: '2024-12-31T23:59:59Z',
        clientType: 'lending-client',
        oauthProvider: 'lending-oauth',
        user: { id: '123', name: 'John Doe' },
        scopes: ['read', 'write']
      };

      apiClient.getSessionStatus.mockResolvedValue(mockSessionData);

      const result = await fetchOAuthTokenData();

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toHaveProperty('header');
      expect(result.accessToken).toHaveProperty('payload');
      expect(result.accessToken).toHaveProperty('raw');
      expect(result.tokenType).toBe('Bearer');
      expect(result.user).toEqual({ id: '123', name: 'John Doe' });
      expect(result.sessionInfo.authenticated).toBe(true);
    });

    test('should handle non-JWT tokens', async () => {
      const mockSessionData = {
        authenticated: true,
        accessToken: 'opaque-token-12345', // Not a JWT
        tokenType: 'Bearer',
        user: { id: '123', name: 'John Doe' }
      };

      apiClient.getSessionStatus.mockResolvedValue(mockSessionData);

      const result = await fetchOAuthTokenData();

      expect(result.accessToken.header).toBe(null);
      expect(result.accessToken.payload).toBe(null);
      expect(result.accessToken.raw).toBe('opaque-token-12345');
      expect(result.accessToken.error).toContain('Token is not a JWT');
    });

    test('should throw error when not authenticated', async () => {
      apiClient.getSessionStatus.mockResolvedValue({
        authenticated: false
      });

      await expect(fetchOAuthTokenData()).rejects.toThrow('No authenticated OAuth session found');
    });

    test('should throw error when no access token', async () => {
      apiClient.getSessionStatus.mockResolvedValue({
        authenticated: true,
        accessToken: null
      });

      await expect(fetchOAuthTokenData()).rejects.toThrow('No access token available in session');
    });

    test('should handle 401 errors', async () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };
      apiClient.getSessionStatus.mockRejectedValue(error);

      await expect(fetchOAuthTokenData()).rejects.toThrow('Authentication required - please log in again');
    });

    test('should handle 403 errors', async () => {
      const error = new Error('Forbidden');
      error.response = { status: 403 };
      apiClient.getSessionStatus.mockRejectedValue(error);

      await expect(fetchOAuthTokenData()).rejects.toThrow('Insufficient permissions to access token information');
    });

    test('should handle network errors', async () => {
      const error = new Error('Network error');
      error.code = 'NETWORK_ERROR';
      apiClient.getSessionStatus.mockRejectedValue(error);

      await expect(fetchOAuthTokenData()).rejects.toThrow('Network error - please check your connection');
    });

    test('should handle generic errors', async () => {
      const error = new Error('Something went wrong');
      apiClient.getSessionStatus.mockRejectedValue(error);

      await expect(fetchOAuthTokenData()).rejects.toThrow('Failed to fetch token data: Something went wrong');
    });
  });
});