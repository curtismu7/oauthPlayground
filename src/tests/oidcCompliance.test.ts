// src/tests/oidcCompliance.test.ts
/**
 * OIDC Core 1.0 Compliance Test Suite
 * 
 * Tests the OIDC compliance service against OIDC Core 1.0 specifications
 * to ensure proper ID token validation, claims processing, and UserInfo handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  OIDCComplianceService,
  type OIDCAuthorizationRequest,
  type ClaimsRequest,
  type IDTokenClaims,
  type UserInfoResponse,
} from '../services/oidcComplianceService';

describe('OIDCComplianceService', () => {
  let service: OIDCComplianceService;

  beforeEach(() => {
    service = new OIDCComplianceService();
  });

  describe('OIDC Authorization Request Validation', () => {
    it('should validate valid OIDC authorization request', () => {
      const validRequest: OIDCAuthorizationRequest = {
        response_type: 'code',
        client_id: 'test-client-123',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid profile email',
        state: 'secure-random-state-12345678',
        nonce: 'secure-random-nonce-12345678',
        code_challenge: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        code_challenge_method: 'S256',
      };

      const result = service.validateOIDCAuthorizationRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require openid scope', () => {
      const invalidRequest: OIDCAuthorizationRequest = {
        response_type: 'code',
        client_id: 'test-client',
        redirect_uri: 'https://example.com/callback',
        scope: 'profile email', // Missing 'openid'
      };

      const result = service.validateOIDCAuthorizationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: scope must include "openid" for OIDC requests');
    });

    it('should require nonce for implicit flows', () => {
      const invalidRequest: OIDCAuthorizationRequest = {
        response_type: 'id_token',
        client_id: 'test-client',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid profile',
        // Missing nonce
      };

      const result = service.validateOIDCAuthorizationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: nonce is required when response_type includes id_token');
    });

    it('should recommend nonce for code flow', () => {
      const requestWithoutNonce: OIDCAuthorizationRequest = {
        response_type: 'code',
        client_id: 'test-client',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid profile',
      };

      const result = service.validateOIDCAuthorizationRequest(requestWithoutNonce);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('nonce parameter recommended for enhanced security');
    });

    it('should validate display parameter', () => {
      const invalidRequest: OIDCAuthorizationRequest = {
        response_type: 'code',
        client_id: 'test-client',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid profile',
        display: 'invalid' as any,
      };

      const result = service.validateOIDCAuthorizationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: invalid display parameter value');
    });

    it('should validate prompt=none constraints', () => {
      const invalidRequest: OIDCAuthorizationRequest = {
        response_type: 'code',
        client_id: 'test-client',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid profile',
        prompt: 'none login', // Invalid combination
      };

      const result = service.validateOIDCAuthorizationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: prompt=none cannot be combined with other values');
    });

    it('should validate max_age parameter', () => {
      const invalidRequest: OIDCAuthorizationRequest = {
        response_type: 'code',
        client_id: 'test-client',
        redirect_uri: 'https://example.com/callback',
        scope: 'openid profile',
        max_age: -1, // Invalid negative value
      };

      const result = service.validateOIDCAuthorizationRequest(invalidRequest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: max_age must be a non-negative integer');
    });
  });

  describe('Claims Request Validation', () => {
    it('should validate valid claims request', () => {
      const validClaims: ClaimsRequest = {
        userinfo: {
          name: { essential: true },
          email: { essential: false },
          picture: null,
        },
        id_token: {
          auth_time: { essential: true },
          acr: { values: ['urn:mace:incommon:iap:silver'] },
        },
      };

      const result = service.validateClaimsRequest(validClaims);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate essential parameter type', () => {
      const invalidClaims: ClaimsRequest = {
        userinfo: {
          name: { essential: 'true' as any }, // Should be boolean
        },
      };

      const result = service.validateClaimsRequest(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: claims.userinfo.name.essential must be boolean');
    });

    it('should validate value parameter type', () => {
      const invalidClaims: ClaimsRequest = {
        id_token: {
          acr: { value: 123 as any }, // Should be string
        },
      };

      const result = service.validateClaimsRequest(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: claims.id_token.acr.value must be string');
    });

    it('should validate values parameter type', () => {
      const invalidClaims: ClaimsRequest = {
        userinfo: {
          locale: { values: 'en-US' as any }, // Should be array
        },
      };

      const result = service.validateClaimsRequest(invalidClaims);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('invalid_request: claims.userinfo.locale.values must be array');
    });
  });

  describe('ID Token Validation', () => {
    it('should validate ID token structure', async () => {
      // Mock ID token payload
      const mockPayload: IDTokenClaims = {
        iss: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
        sub: 'user-123',
        aud: 'client-123',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
        nonce: 'test-nonce',
      };

      // Create mock JWT (header.payload.signature)
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(mockPayload));
      const signature = 'mock-signature';
      const mockIdToken = `${header}.${payload}.${signature}`;

      const result = await service.validateIDToken(
        mockIdToken,
        'client-123',
        'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
        'test-nonce'
      );

      expect(result.valid).toBe(true);
      expect(result.claims).toEqual(mockPayload);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JWT format', async () => {
      const result = await service.validateIDToken(
        'invalid-jwt',
        'client-123',
        'https://auth.pingone.com/test',
        'test-nonce'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid ID token format - must be JWT');
    });

    it('should validate required claims', async () => {
      const mockPayload = {
        // Missing required claims
        iss: 'https://auth.pingone.com/test',
        // sub missing
        // aud missing
        // exp missing
        // iat missing
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(mockPayload));
      const mockIdToken = `${header}.${payload}.signature`;

      const result = await service.validateIDToken(
        mockIdToken,
        'client-123',
        'https://auth.pingone.com/test'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required claim: sub');
      expect(result.errors).toContain('Missing required claim: aud');
      expect(result.errors).toContain('Missing required claim: exp');
      expect(result.errors).toContain('Missing required claim: iat');
    });

    it('should validate issuer claim', async () => {
      const mockPayload: IDTokenClaims = {
        iss: 'https://wrong-issuer.com',
        sub: 'user-123',
        aud: 'client-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(mockPayload));
      const mockIdToken = `${header}.${payload}.signature`;

      const result = await service.validateIDToken(
        mockIdToken,
        'client-123',
        'https://auth.pingone.com/test'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid issuer: expected https://auth.pingone.com/test, got https://wrong-issuer.com');
    });

    it('should validate audience claim', async () => {
      const mockPayload: IDTokenClaims = {
        iss: 'https://auth.pingone.com/test',
        sub: 'user-123',
        aud: 'wrong-client',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(mockPayload));
      const mockIdToken = `${header}.${payload}.signature`;

      const result = await service.validateIDToken(
        mockIdToken,
        'client-123',
        'https://auth.pingone.com/test'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid audience: client_id client-123 not found in aud claim');
    });

    it('should validate expiration claim', async () => {
      const mockPayload: IDTokenClaims = {
        iss: 'https://auth.pingone.com/test',
        sub: 'user-123',
        aud: 'client-123',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200, // Issued 2 hours ago
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(mockPayload));
      const mockIdToken = `${header}.${payload}.signature`;

      const result = await service.validateIDToken(
        mockIdToken,
        'client-123',
        'https://auth.pingone.com/test'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ID token has expired');
    });

    it('should validate nonce claim', async () => {
      const mockPayload: IDTokenClaims = {
        iss: 'https://auth.pingone.com/test',
        sub: 'user-123',
        aud: 'client-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        nonce: 'wrong-nonce',
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(mockPayload));
      const mockIdToken = `${header}.${payload}.signature`;

      const result = await service.validateIDToken(
        mockIdToken,
        'client-123',
        'https://auth.pingone.com/test',
        'expected-nonce'
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nonce mismatch in ID token');
    });
  });

  describe('UserInfo Response Validation', () => {
    it('should validate valid UserInfo response', () => {
      const userInfo: UserInfoResponse = {
        sub: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        email_verified: true,
      };

      const result = service.validateUserInfoResponse(userInfo, 'user-123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require sub claim', () => {
      const userInfo = {
        name: 'John Doe',
        email: 'john@example.com',
      } as UserInfoResponse;

      const result = service.validateUserInfoResponse(userInfo, 'user-123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required claim: sub');
    });

    it('should validate sub claim consistency', () => {
      const userInfo: UserInfoResponse = {
        sub: 'different-user',
        name: 'John Doe',
      };

      const result = service.validateUserInfoResponse(userInfo, 'user-123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('UserInfo sub claim does not match ID token sub claim');
    });

    it('should validate claim types', () => {
      const userInfo: UserInfoResponse = {
        sub: 'user-123',
        email_verified: 'true' as any, // Should be boolean
        updated_at: 'recently' as any, // Should be number
      };

      const result = service.validateUserInfoResponse(userInfo, 'user-123');
      expect(result.valid).toBe(true); // Valid but with warnings
      expect(result.warnings).toContain('email_verified should be boolean');
      expect(result.warnings).toContain('updated_at should be number (Unix timestamp)');
    });
  });

  describe('Hash Validation', () => {
    it('should validate at_hash format', () => {
      const result = service.validateAtHash('access-token', 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
      expect(result).toBe(true);
    });

    it('should reject invalid at_hash format', () => {
      const result = service.validateAtHash('access-token', 'invalid@hash!');
      expect(result).toBe(false);
    });

    it('should validate c_hash format', () => {
      const result = service.validateCHash('auth-code', 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
      expect(result).toBe(true);
    });

    it('should reject invalid c_hash format', () => {
      const result = service.validateCHash('auth-code', 'invalid@hash!');
      expect(result).toBe(false);
    });
  });

  describe('Nonce Generation', () => {
    it('should generate secure nonce', () => {
      const nonce1 = service.generateNonce();
      const nonce2 = service.generateNonce();

      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBeGreaterThanOrEqual(32);
      expect(nonce2.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('OIDC Error Response Creation', () => {
    it('should create proper OIDC error response', () => {
      const error = service.createOIDCErrorResponse(
        'login_required',
        'User authentication is required',
        'test-state-123'
      );

      expect(error.error).toBe('login_required');
      expect(error.error_description).toBe('User authentication is required');
      expect(error.state).toBe('test-state-123');
    });

    it('should create minimal OIDC error response', () => {
      const error = service.createOIDCErrorResponse('interaction_required');

      expect(error.error).toBe('interaction_required');
      expect(error.error_description).toBeUndefined();
      expect(error.state).toBeUndefined();
    });
  });

  describe('OIDC Security Headers', () => {
    it('should provide OIDC security headers', () => {
      const headers = service.getOIDCSecurityHeaders();

      expect(headers['Cache-Control']).toBe('no-store');
      expect(headers['Pragma']).toBe('no-cache');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['Referrer-Policy']).toBe('no-referrer');
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
    });
  });
});