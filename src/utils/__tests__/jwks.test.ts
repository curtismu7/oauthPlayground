// src/utils/__tests__/jwks.test.ts - Tests for JWKS utilities
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('jose');

import type { JWKS, JWKSConfig, TokenValidationOptions } from '../jwks';
import {
	buildDiscoveryUri,
	buildJWKSUri,
	createJWKSSet,
	decodeJWTHeader,
	decodeJWTPayload,
	discoverJWKS,
	findKeyByID,
	findKeysByAlgorithm,
	findKeysByUse,
	formatJWKS,
	getKeyStatistics,
	getSigningKey,
	isJWKS,
	normalizeIssuer,
	validateJWKSStructure,
	validateJWT,
} from '../jwks';

// Mock jose library
vi.mock('jose', () => ({
	jwtVerify: vi.fn(),
	createRemoteJWKSet: vi.fn(),
	JWTPayload: {},
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

describe('JWKS Utilities', () => {
	const mockJWKS: JWKS = {
		keys: [
			{
				kty: 'RSA',
				kid: 'key1',
				use: 'sig',
				alg: 'RS256',
				n: 'test_modulus',
				e: 'AQAB',
			},
			{
				kty: 'EC',
				kid: 'key2',
				use: 'sig',
				alg: 'ES256',
				crv: 'P-256',
				x: 'test_x',
				y: 'test_y',
			},
		],
	};

	const mockJWT =
		'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleTEifQ.eyJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vdGVzdC9hcyIsImF1ZCI6InRlc3RfY2xpZW50Iiwic3ViIjoidGVzdF91c2VyIiwiZXhwIjoxNzAwMDAwMDAwfQ.signature';

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('discoverJWKS', () => {
		it('should discover JWKS endpoint from discovery response', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({
					jwks_uri: 'https://auth.pingone.com/test/as/jwks',
				}),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await discoverJWKS(
				'https://auth.pingone.com/test/as/.well-known/openid_configuration'
			);

			expect(result).toBe('https://auth.pingone.com/test/as/jwks');
			expect(global.fetch).toHaveBeenCalledWith(
				'https://auth.pingone.com/test/as/.well-known/openid_configuration',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Accept: 'application/json',
					}),
				})
			);
		});

		it('should throw error when discovery fails', async () => {
			const mockResponse = {
				ok: false,
				status: 404,
				statusText: 'Not Found',
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			await expect(
				discoverJWKS('https://invalid.com/.well-known/openid_configuration')
			).rejects.toThrow('Discovery failed: 404 Not Found');
		});

		it('should throw error when JWKS URI is missing', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({}),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			await expect(
				discoverJWKS('https://auth.pingone.com/test/as/.well-known/openid_configuration')
			).rejects.toThrow('JWKS URI not found in discovery response');
		});
	});

	describe('createJWKSSet', () => {
		it('should create remote JWKS set', () => {
			vi.mock('jose');
			const mockJWKSSet = { mock: 'jwks-set' };
			vi.mocked(createRemoteJWKSet).mockReturnValue(mockJWKSSet);

			const result = createJWKSSet('https://auth.pingone.com/test/as/jwks');

			expect(createRemoteJWKSet).toHaveBeenCalledWith(
				new URL('https://auth.pingone.com/test/as/jwks')
			);
			expect(result).toBe(mockJWKSSet);
		});

		it('should throw error for invalid URL', () => {
			expect(() => createJWKSSet('invalid-url')).toThrow();
		});
	});

	describe('getSigningKey', () => {
		it('should get signing key by kid', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockJWKS),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await getSigningKey('https://auth.pingone.com/test/as/jwks', 'key1');

			expect(result).toEqual(mockJWKS.keys[0]);
		});

		it('should return null when key not found', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockJWKS),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await getSigningKey('https://auth.pingone.com/test/as/jwks', 'nonexistent');

			expect(result).toBeNull();
		});

		it('should throw error when fetch fails', async () => {
			const mockResponse = {
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			await expect(getSigningKey('https://auth.pingone.com/test/as/jwks', 'key1')).rejects.toThrow(
				'Failed to fetch JWKS: 500 Internal Server Error'
			);
		});
	});

	describe('decodeJWTHeader', () => {
		it('should decode JWT header', () => {
			const result = decodeJWTHeader(mockJWT);

			expect(result).toEqual({
				alg: 'RS256',
				typ: 'JWT',
				kid: 'key1',
			});
		});

		it('should throw error for invalid JWT format', () => {
			expect(() => decodeJWTHeader('invalid.jwt')).toThrow('Invalid JWT format');
		});

		it('should throw error for malformed header', () => {
			expect(() => decodeJWTHeader('invalidheader.payload.signature')).toThrow();
		});
	});

	describe('decodeJWTPayload', () => {
		it('should decode JWT payload', () => {
			const result = decodeJWTPayload(mockJWT);

			expect(result).toEqual({
				iss: 'https://auth.pingone.com/test/as',
				aud: 'test_client',
				sub: 'test_user',
				exp: 1700000000,
			});
		});

		it('should throw error for invalid JWT format', () => {
			expect(() => decodeJWTPayload('invalid.jwt')).toThrow('Invalid JWT format');
		});

		it('should throw error for malformed payload', () => {
			expect(() => decodeJWTPayload('header.invalidpayload.signature')).toThrow();
		});
	});

	describe('validateJWT', () => {
		const mockConfig: JWKSConfig = {
			jwksUri: 'https://auth.pingone.com/test/as/jwks',
		};

		const mockOptions: TokenValidationOptions = {
			issuer: 'https://auth.pingone.com/test/as',
			audience: 'test_client',
			clockTolerance: 300,
		};

		it('should validate JWT successfully', async () => {
			import { jwtVerify } from 'jose';
			const mockPayload = {
				iss: 'https://auth.pingone.com/test/as',
				aud: 'test_client',
				sub: 'test_user',
				exp: Math.floor(Date.now() / 1000) + 3600,
			};
			const mockHeader = { alg: 'RS256', kid: 'key1' };

			jwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: mockHeader,
			});

			const result = await validateJWT(mockJWT, mockConfig, mockOptions);

			expect(result.valid).toBe(true);
			expect(result.payload).toEqual(mockPayload);
			expect(result.header).toEqual(mockHeader);
		});

		it('should fail validation with nonce mismatch', async () => {
			import { jwtVerify } from 'jose';
			const mockPayload = {
				iss: 'https://auth.pingone.com/test/as',
				aud: 'test_client',
				sub: 'test_user',
				exp: Math.floor(Date.now() / 1000) + 3600,
				nonce: 'wrong_nonce',
			};
			const mockHeader = { alg: 'RS256', kid: 'key1' };

			jwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: mockHeader,
			});

			const result = await validateJWT(mockJWT, mockConfig, {
				...mockOptions,
				nonce: 'expected_nonce',
			});

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Nonce validation failed');
		});

		it('should fail validation with expired auth_time', async () => {
			import { jwtVerify } from 'jose';
			const mockPayload = {
				iss: 'https://auth.pingone.com/test/as',
				aud: 'test_client',
				sub: 'test_user',
				exp: Math.floor(Date.now() / 1000) + 3600,
				auth_time: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
			};
			const mockHeader = { alg: 'RS256', kid: 'key1' };

			jwtVerify.mockResolvedValue({
				payload: mockPayload,
				protectedHeader: mockHeader,
			});

			const result = await validateJWT(mockJWT, mockConfig, { ...mockOptions, maxAge: 3600 });

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Authentication too old');
		});

		it('should handle JWT verification errors', async () => {
			import { jwtVerify } from 'jose';
			jwtVerify.mockRejectedValue(new Error('Invalid signature'));

			const result = await validateJWT(mockJWT, mockConfig, mockOptions);

			expect(result.valid).toBe(false);
			expect(result.error).toBe('Invalid signature');
		});
	});

	describe('validateJWKSStructure', () => {
		it('should validate correct JWKS structure', () => {
			const result = validateJWKSStructure(mockJWKS);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject non-object input', () => {
			const result = validateJWKSStructure('invalid');

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('JWKS must be a valid JSON object');
		});

		it('should reject missing keys array', () => {
			const result = validateJWKSStructure({});

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('JWKS must contain a "keys" array');
		});

		it('should reject empty keys array', () => {
			const result = validateJWKSStructure({ keys: [] });

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('JWKS must contain at least one key');
		});

		it('should reject key with missing required fields', () => {
			const invalidJWKS = {
				keys: [{ kty: 'RSA' }], // Missing kid, use, alg
			};

			const result = validateJWKSStructure(invalidJWKS);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Key 0: missing "kid" (key ID)');
			expect(result.errors).toContain('Key 0: missing "use" (public key use)');
			expect(result.errors).toContain('Key 0: missing "alg" (algorithm)');
		});

		it('should reject RSA key with missing n or e', () => {
			const invalidJWKS = {
				keys: [
					{
						kty: 'RSA',
						kid: 'key1',
						use: 'sig',
						alg: 'RS256',
						// Missing n and e
					},
				],
			};

			const result = validateJWKSStructure(invalidJWKS);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('RSA Key 0: missing "n" (modulus)');
			expect(result.errors).toContain('RSA Key 0: missing "e" (exponent)');
		});

		it('should reject EC key with missing crv, x, or y', () => {
			const invalidJWKS = {
				keys: [
					{
						kty: 'EC',
						kid: 'key1',
						use: 'sig',
						alg: 'ES256',
						// Missing crv, x, y
					},
				],
			};

			const result = validateJWKSStructure(invalidJWKS);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('EC Key 0: missing "crv" (curve)');
			expect(result.errors).toContain('EC Key 0: missing "x" (x coordinate)');
			expect(result.errors).toContain('EC Key 0: missing "y" (y coordinate)');
		});
	});

	describe('findKeyByID', () => {
		it('should find key by ID', () => {
			const result = findKeyByID(mockJWKS, 'key1');

			expect(result).toEqual(mockJWKS.keys[0]);
		});

		it('should return null when key not found', () => {
			const result = findKeyByID(mockJWKS, 'nonexistent');

			expect(result).toBeNull();
		});
	});

	describe('findKeysByAlgorithm', () => {
		it('should find keys by algorithm', () => {
			const result = findKeysByAlgorithm(mockJWKS, 'RS256');

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(mockJWKS.keys[0]);
		});

		it('should return empty array when no keys found', () => {
			const result = findKeysByAlgorithm(mockJWKS, 'HS256');

			expect(result).toHaveLength(0);
		});
	});

	describe('findKeysByUse', () => {
		it('should find keys by use', () => {
			const result = findKeysByUse(mockJWKS, 'sig');

			expect(result).toHaveLength(2);
			expect(result).toEqual(mockJWKS.keys);
		});

		it('should return empty array when no keys found', () => {
			const result = findKeysByUse(mockJWKS, 'enc');

			expect(result).toHaveLength(0);
		});
	});

	describe('getKeyStatistics', () => {
		it('should return key statistics', () => {
			const result = getKeyStatistics(mockJWKS);

			expect(result).toEqual({
				totalKeys: 2,
				keyTypes: { RSA: 1, EC: 1 },
				algorithms: { RS256: 1, ES256: 1 },
				uses: { sig: 2 },
			});
		});
	});

	describe('formatJWKS', () => {
		it('should format JWKS as pretty JSON', () => {
			const result = formatJWKS(mockJWKS);

			expect(result).toBe(JSON.stringify(mockJWKS, null, 2));
		});
	});

	describe('isJWKS', () => {
		it('should return true for valid JWKS JSON', () => {
			const result = isJWKS(JSON.stringify(mockJWKS));

			expect(result).toBe(true);
		});

		it('should return false for invalid JSON', () => {
			const result = isJWKS('invalid json');

			expect(result).toBe(false);
		});

		it('should return false for JSON without keys array', () => {
			const result = isJWKS(JSON.stringify({ notKeys: [] }));

			expect(result).toBe(false);
		});
	});

	describe('buildJWKSUri', () => {
		it('should build JWKS URI from issuer', () => {
			const result = buildJWKSUri('https://auth.pingone.com/test/as');

			expect(result).toBe('https://auth.pingone.com/test/as/jwks');
		});

		it('should handle issuer with trailing slash', () => {
			const result = buildJWKSUri('https://auth.pingone.com/test/as/');

			expect(result).toBe('https://auth.pingone.com/test/as/jwks');
		});
	});

	describe('buildDiscoveryUri', () => {
		it('should build discovery URI from issuer', () => {
			const result = buildDiscoveryUri('https://auth.pingone.com/test/as');

			expect(result).toBe('https://auth.pingone.com/test/as/.well-known/openid_configuration');
		});

		it('should handle issuer with trailing slash', () => {
			const result = buildDiscoveryUri('https://auth.pingone.com/test/as/');

			expect(result).toBe('https://auth.pingone.com/test/as/.well-known/openid_configuration');
		});
	});

	describe('normalizeIssuer', () => {
		it('should normalize issuer with /as suffix', () => {
			const result = normalizeIssuer('https://auth.pingone.com/test/as');

			expect(result).toEqual([
				'https://auth.pingone.com/test',
				'https://auth.pingone.com/test/as',
				'https://auth.pingone.com/test/as',
			]);
		});

		it('should normalize issuer without /as suffix', () => {
			const result = normalizeIssuer('https://auth.pingone.com/test');

			expect(result).toEqual([
				'https://auth.pingone.com/test',
				'https://auth.pingone.com/test/as',
				'https://auth.pingone.com/test',
			]);
		});

		it('should handle issuer with trailing slash', () => {
			const result = normalizeIssuer('https://auth.pingone.com/test/as/');

			expect(result).toEqual([
				'https://auth.pingone.com/test',
				'https://auth.pingone.com/test/as',
				'https://auth.pingone.com/test/as',
			]);
		});
	});
});
