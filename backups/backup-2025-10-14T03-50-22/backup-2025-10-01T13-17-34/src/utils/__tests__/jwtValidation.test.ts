// src/utils/__tests__/jwtValidation.test.ts - Tests for JWT validation utilities

import { JWTPayload } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	checkTokenExpiry,
	createClaimPresenceValidator,
	createClaimTypeValidator,
	createClaimValidator,
	createNumericRangeValidator,
	createStringPatternValidator,
	ExtendedValidationOptions,
	ExtendedValidationResult,
	validateJWTClaims,
	verifyJWTSignature,
} from '../jwtValidation';

// Mock the jwks module
vi.mock('../jwks', () => ({
	validateJWT: vi.fn(),
}));

// Mock logger
vi.mock('../logger', () => ({
	logger: {
		info: vi.fn(),
		success: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

describe('JWT Validation Utilities', () => {
	const mockPayload: JWTPayload = {
		iss: 'https://auth.pingone.com/test/as',
		aud: 'test_client',
		sub: 'test_user',
		exp: Math.floor(Date.now() / 1000) + 3600,
		iat: Math.floor(Date.now() / 1000) - 300,
		auth_time: Math.floor(Date.now() / 1000) - 600,
		nonce: 'test_nonce',
		scope: 'openid profile email',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('verifyJWTSignature', () => {
		it('should verify JWT signature successfully', async () => {
			const { validateJWT } = require('../jwks');
			validateJWT.mockResolvedValue({
				valid: true,
				payload: mockPayload,
				header: { alg: 'RS256', kid: 'key1' },
			});

			const options: ExtendedValidationOptions = {
				flowType: 'authorization_code',
				issuer: 'https://auth.pingone.com/test/as',
				audience: 'test_client',
				nonce: 'test_nonce',
			};

			const result = await verifyJWTSignature('mock-token', { jwksUri: 'mock-uri' }, options);

			expect(result.valid).toBe(true);
			expect(result.payload).toEqual(mockPayload);
			expect(result.flowValidation?.valid).toBe(true);
			expect(result.claimValidation?.valid).toBe(true);
			expect(result.scopeValidation?.valid).toBe(true);
		});

		it('should fail when basic validation fails', async () => {
			const { validateJWT } = require('../jwks');
			validateJWT.mockResolvedValue({
				valid: false,
				error: 'Invalid signature',
			});

			const result = await verifyJWTSignature('mock-token', { jwksUri: 'mock-uri' }, {});

			expect(result.valid).toBe(false);
			expect(result.error).toBe('Invalid signature');
			expect(result.flowValidation?.valid).toBe(false);
		});

		it('should validate flow-specific claims for implicit flow', async () => {
			const { validateJWT } = require('../jwks');
			validateJWT.mockResolvedValue({
				valid: true,
				payload: { ...mockPayload, sub: undefined }, // Missing sub
				header: { alg: 'RS256', kid: 'key1' },
			});

			const options: ExtendedValidationOptions = {
				flowType: 'implicit',
				issuer: 'https://auth.pingone.com/test/as',
				audience: 'test_client',
			};

			const result = await verifyJWTSignature('mock-token', { jwksUri: 'mock-uri' }, options);

			expect(result.valid).toBe(false);
			expect(result.flowValidation?.errors).toContain(
				'Missing sub (subject) claim required for implicit flow'
			);
		});

		it('should validate required claims', async () => {
			const { validateJWT } = require('../jwks');
			validateJWT.mockResolvedValue({
				valid: true,
				payload: mockPayload,
				header: { alg: 'RS256', kid: 'key1' },
			});

			const options: ExtendedValidationOptions = {
				requiredClaims: ['sub', 'iss', 'missing_claim'],
			};

			const result = await verifyJWTSignature('mock-token', { jwksUri: 'mock-uri' }, options);

			expect(result.valid).toBe(false);
			expect(result.claimValidation?.missingClaims).toContain('missing_claim');
		});

		it('should validate required scopes', async () => {
			const { validateJWT } = require('../jwks');
			validateJWT.mockResolvedValue({
				valid: true,
				payload: mockPayload,
				header: { alg: 'RS256', kid: 'key1' },
			});

			const options: ExtendedValidationOptions = {
				requiredScopes: ['openid', 'profile', 'missing_scope'],
			};

			const result = await verifyJWTSignature('mock-token', { jwksUri: 'mock-uri' }, options);

			expect(result.valid).toBe(false);
			expect(result.scopeValidation?.missingScopes).toContain('missing_scope');
		});

		it('should run custom validators', async () => {
			const { validateJWT } = require('../jwks');
			validateJWT.mockResolvedValue({
				valid: true,
				payload: mockPayload,
				header: { alg: 'RS256', kid: 'key1' },
			});

			const customValidator = vi.fn().mockReturnValue('Custom validation error');
			const options: ExtendedValidationOptions = {
				customValidators: [customValidator],
			};

			const result = await verifyJWTSignature('mock-token', { jwksUri: 'mock-uri' }, options);

			expect(customValidator).toHaveBeenCalledWith(mockPayload);
			expect(result.valid).toBe(false);
			expect(result.flowValidation?.errors).toContain('Custom validation error');
		});

		it('should handle validation errors', async () => {
			const { validateJWT } = require('../jwks');
			validateJWT.mockRejectedValue(new Error('Network error'));

			const result = await verifyJWTSignature('mock-token', { jwksUri: 'mock-uri' }, {});

			expect(result.valid).toBe(false);
			expect(result.error).toBe('Network error');
		});
	});

	describe('validateJWTClaims', () => {
		it('should validate claims successfully', () => {
			const result = validateJWTClaims(mockPayload, {
				issuer: 'https://auth.pingone.com/test/as',
				audience: 'test_client',
			});

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should fail with invalid issuer', () => {
			const result = validateJWTClaims(mockPayload, {
				issuer: 'https://wrong.issuer.com',
			});

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid issuer');
		});

		it('should fail with invalid audience', () => {
			const result = validateJWTClaims(mockPayload, {
				audience: 'wrong_client',
			});

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid audience');
		});

		it('should fail with expired token', () => {
			const expiredPayload = {
				...mockPayload,
				exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
			};

			const result = validateJWTClaims(expiredPayload, {});

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Token expired');
		});

		it('should fail with missing iat', () => {
			const invalidPayload = {
				...mockPayload,
				iat: undefined,
			};

			const result = validateJWTClaims(invalidPayload, {});

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Missing or invalid iat');
		});

		it('should fail with future nbf', () => {
			const futurePayload = {
				...mockPayload,
				nbf: Math.floor(Date.now() / 1000) + 3600, // 1 hour in future
			};

			const result = validateJWTClaims(futurePayload, {});

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Token not valid yet');
		});

		it('should handle array audiences', () => {
			const payloadWithArrayAud = {
				...mockPayload,
				aud: ['test_client', 'other_client'],
			};

			const result = validateJWTClaims(payloadWithArrayAud, {
				audience: 'test_client',
			});

			expect(result.valid).toBe(true);
		});

		it('should handle array issuers', () => {
			const result = validateJWTClaims(mockPayload, {
				issuer: ['https://auth.pingone.com/test/as', 'https://other.issuer.com'],
			});

			expect(result.valid).toBe(true);
		});
	});

	describe('checkTokenExpiry', () => {
		it('should return false for valid token', () => {
			const result = checkTokenExpiry(mockPayload);

			expect(result).toBe(false);
		});

		it('should return true for expired token', () => {
			const expiredPayload = {
				...mockPayload,
				exp: Math.floor(Date.now() / 1000) - 3600,
			};

			const result = checkTokenExpiry(expiredPayload);

			expect(result).toBe(true);
		});

		it('should return true for token without exp', () => {
			const payloadWithoutExp = {
				...mockPayload,
				exp: undefined,
			};

			const result = checkTokenExpiry(payloadWithoutExp);

			expect(result).toBe(true);
		});

		it('should respect clock tolerance', () => {
			const slightlyExpiredPayload = {
				...mockPayload,
				exp: Math.floor(Date.now() / 1000) - 100, // 100 seconds ago
			};

			const result = checkTokenExpiry(slightlyExpiredPayload, 200); // 200 second tolerance

			expect(result).toBe(false);
		});
	});

	describe('createClaimValidator', () => {
		it('should create validator for specific claim value', () => {
			const validator = createClaimValidator('iss', 'https://auth.pingone.com/test/as');

			expect(validator(mockPayload)).toBeNull(); // Valid
			expect(validator({ ...mockPayload, iss: 'wrong' })).toContain('Invalid iss');
		});
	});

	describe('createClaimPresenceValidator', () => {
		it('should create validator for claim presence', () => {
			const validator = createClaimPresenceValidator('sub');

			expect(validator(mockPayload)).toBeNull(); // Valid
			expect(validator({ ...mockPayload, sub: undefined })).toContain(
				'Missing required claim: sub'
			);
		});
	});

	describe('createClaimTypeValidator', () => {
		it('should create validator for claim type', () => {
			const validator = createClaimTypeValidator('exp', 'number');

			expect(validator(mockPayload)).toBeNull(); // Valid
			expect(validator({ ...mockPayload, exp: 'not_a_number' })).toContain('Invalid exp type');
		});
	});

	describe('createNumericRangeValidator', () => {
		it('should create validator for numeric range', () => {
			const validator = createNumericRangeValidator('exp', 1000, 2000);

			expect(validator({ ...mockPayload, exp: 1500 })).toBeNull(); // Valid
			expect(validator({ ...mockPayload, exp: 500 })).toContain('below minimum');
			expect(validator({ ...mockPayload, exp: 2500 })).toContain('above maximum');
			expect(validator({ ...mockPayload, exp: 'not_number' })).toContain('expected number');
		});
	});

	describe('createStringPatternValidator', () => {
		it('should create validator for string pattern', () => {
			const validator = createStringPatternValidator('iss', /^https:\/\/auth\.pingone\.com/);

			expect(validator(mockPayload)).toBeNull(); // Valid
			expect(validator({ ...mockPayload, iss: 'https://wrong.com' })).toContain(
				'does not match pattern'
			);
			expect(validator({ ...mockPayload, iss: 123 })).toContain('expected string');
		});
	});
});
