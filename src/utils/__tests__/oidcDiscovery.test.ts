// src/utils/__tests__/oidcDiscovery.test.ts - Tests for OIDC discovery utilities
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	discoverOIDCConfiguration,
	buildDiscoveryUrl,
	buildWellKnownUrl,
	getBaseUrl,
	getBackendUrl,
	fetchWithRetry,
	validateEnvironmentId,
	extractEnvironmentIdFromUrl,
	validateOIDCConfiguration,
	getSupportedFeatures,
	DiscoveryOptions,
	OIDCConfiguration,
} from '../oidcDiscovery';

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

describe('OIDC Discovery Utilities', () => {
	const mockOIDCConfig: OIDCConfiguration = {
		issuer: 'https://auth.pingone.com/test/as',
		authorization_endpoint: 'https://auth.pingone.com/test/as/authorize',
		token_endpoint: 'https://auth.pingone.com/test/as/token',
		userinfo_endpoint: 'https://auth.pingone.com/test/as/userinfo',
		jwks_uri: 'https://auth.pingone.com/test/as/jwks',
		scopes_supported: ['openid', 'profile', 'email'],
		response_types_supported: ['code', 'id_token'],
		grant_types_supported: ['authorization_code', 'implicit'],
		subject_types_supported: ['public'],
		id_token_signing_alg_values_supported: ['RS256'],
		token_endpoint_auth_methods_supported: ['client_secret_basic'],
		claims_supported: ['sub', 'iss', 'aud'],
		code_challenge_methods_supported: ['S256'],
		request_parameter_supported: true,
		request_uri_parameter_supported: true,
		require_request_uri_registration: false,
		end_session_endpoint: 'https://auth.pingone.com/test/as/signoff',
		revocation_endpoint: 'https://auth.pingone.com/test/as/revoke',
		introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
		device_authorization_endpoint: 'https://auth.pingone.com/test/as/device',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('discoverOIDCConfiguration', () => {
		it('should discover OIDC configuration successfully', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockOIDCConfig),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				region: 'us',
				useBackendProxy: false,
			};

			const result = await discoverOIDCConfiguration(options);

			expect(result.success).toBe(true);
			expect(result.configuration).toEqual(mockOIDCConfig);
			expect(result.environmentId).toBe('test-env-id');
			expect(result.region).toBe('us');
		});

		it('should use backend proxy by default', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockOIDCConfig),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
			};

			await discoverOIDCConfiguration(options);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/discovery'),
				expect.any(Object)
			);
		});

		it('should use direct discovery when proxy disabled', async () => {
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(mockOIDCConfig),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				useBackendProxy: false,
			};

			await discoverOIDCConfiguration(options);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/.well-known/openid_configuration'),
				expect.any(Object)
			);
		});

		it('should return fallback configuration on failure', async () => {
			const mockResponse = {
				ok: false,
				status: 404,
				statusText: 'Not Found',
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				enableFallback: true,
			};

			const result = await discoverOIDCConfiguration(options);

			expect(result.success).toBe(true);
			expect(result.fallback).toBe(true);
			expect(result.configuration?.issuer).toBe('https://auth.pingone.com/test-env-id/as');
		});

		it('should fail when fallback disabled', async () => {
			const mockResponse = {
				ok: false,
				status: 404,
				statusText: 'Not Found',
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				enableFallback: false,
			};

			const result = await discoverOIDCConfiguration(options);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Discovery failed: 404 Not Found');
		});

		it('should validate required fields', async () => {
			const invalidConfig = {
				issuer: 'https://auth.pingone.com/test/as',
				// Missing required fields
			};
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue(invalidConfig),
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				enableFallback: false,
			};

			const result = await discoverOIDCConfiguration(options);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Invalid OpenID configuration: missing required fields');
		});

		it('should handle network errors', async () => {
			(global.fetch as any).mockRejectedValue(new Error('Network error'));

			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				enableFallback: false,
			};

			const result = await discoverOIDCConfiguration(options);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Network error');
		});
	});

	describe('buildDiscoveryUrl', () => {
		it('should build backend proxy URL', () => {
			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				region: 'us',
				useBackendProxy: true,
			};

			const result = buildDiscoveryUrl(options);

			expect(result).toContain('/api/discovery');
			expect(result).toContain('environment_id=test-env-id');
			expect(result).toContain('region=us');
		});

		it('should build direct discovery URL', () => {
			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				region: 'us',
				useBackendProxy: false,
			};

			const result = buildDiscoveryUrl(options);

			expect(result).toContain('/.well-known/openid_configuration');
		});

		it('should use custom backend URL', () => {
			const options: DiscoveryOptions = {
				environmentId: 'test-env-id',
				useBackendProxy: true,
				backendProxyUrl: 'https://custom-backend.com',
			};

			const result = buildDiscoveryUrl(options);

			expect(result).toContain('https://custom-backend.com');
		});
	});

	describe('buildWellKnownUrl', () => {
		it('should build well-known URL', () => {
			const result = buildWellKnownUrl('https://auth.pingone.com/test/as');

			expect(result).toBe('https://auth.pingone.com/test/as/.well-known/openid_configuration');
		});

		it('should handle issuer with trailing slash', () => {
			const result = buildWellKnownUrl('https://auth.pingone.com/test/as/');

			expect(result).toBe('https://auth.pingone.com/test/as/.well-known/openid_configuration');
		});
	});

	describe('getBaseUrl', () => {
		it('should return correct base URL for US region', () => {
			const result = getBaseUrl('us');

			expect(result).toBe('https://auth.pingone.com');
		});

		it('should return correct base URL for EU region', () => {
			const result = getBaseUrl('eu');

			expect(result).toBe('https://auth.pingone.eu');
		});

		it('should return correct base URL for CA region', () => {
			const result = getBaseUrl('ca');

			expect(result).toBe('https://auth.pingone.ca');
		});

		it('should return correct base URL for AP region', () => {
			const result = getBaseUrl('ap');

			expect(result).toBe('https://auth.pingone.asia');
		});

		it('should default to US for unknown region', () => {
			const result = getBaseUrl('unknown');

			expect(result).toBe('https://auth.pingone.com');
		});

		it('should handle case insensitive region', () => {
			const result = getBaseUrl('EU');

			expect(result).toBe('https://auth.pingone.eu');
		});
	});

	describe('getBackendUrl', () => {
		it('should return production URL in production', () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const result = getBackendUrl();

			expect(result).toBe('https://oauth-playground.vercel.app');

			process.env.NODE_ENV = originalEnv;
		});

		it('should return localhost URL in development', () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'development';

			const result = getBackendUrl();

			expect(result).toBe('https://localhost:3001');

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe('fetchWithRetry', () => {
		it('should succeed on first attempt', async () => {
			const mockResponse = {
				ok: true,
				status: 200,
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await fetchWithRetry('https://example.com');

			expect(result).toBe(mockResponse);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it('should retry on server errors', async () => {
			const mockResponse = {
				ok: false,
				status: 500,
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await fetchWithRetry('https://example.com', { retries: 2 });

			expect(result).toBe(mockResponse);
			expect(global.fetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
		});

		it('should not retry on client errors', async () => {
			const mockResponse = {
				ok: false,
				status: 404,
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const result = await fetchWithRetry('https://example.com', { retries: 3 });

			expect(result).toBe(mockResponse);
			expect(global.fetch).toHaveBeenCalledTimes(1); // No retries for 4xx
		});

		it('should retry on network errors', async () => {
			(global.fetch as any)
				.mockRejectedValueOnce(new Error('Network error'))
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValue({ ok: true, status: 200 });

			const result = await fetchWithRetry('https://example.com', { retries: 3 });

			expect(result.ok).toBe(true);
			expect(global.fetch).toHaveBeenCalledTimes(3);
		});

		it('should respect timeout', async () => {
			const mockResponse = {
				ok: true,
				status: 200,
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			await fetchWithRetry('https://example.com', { timeout: 1000 });

			expect(global.fetch).toHaveBeenCalledWith(
				'https://example.com',
				expect.objectContaining({
					signal: expect.any(AbortSignal),
				})
			);
		});

		it('should use exponential backoff', async () => {
			const mockResponse = {
				ok: false,
				status: 500,
			};
			(global.fetch as any).mockResolvedValue(mockResponse);

			const startTime = Date.now();
			await fetchWithRetry('https://example.com', { retries: 2 });
			const endTime = Date.now();

			// Should have waited at least 1 second (1000ms + 2000ms)
			expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
		});
	});

	describe('validateEnvironmentId', () => {
		it('should validate correct UUID format', () => {
			const validId = '12345678-1234-1234-1234-123456789abc';

			expect(validateEnvironmentId(validId)).toBe(true);
		});

		it('should reject invalid UUID format', () => {
			const invalidIds = [
				'invalid-id',
				'12345678-1234-1234-1234-123456789ab', // Too short
				'12345678-1234-1234-1234-123456789abcd', // Too long
				'12345678_1234_1234_1234_123456789abc', // Wrong separator
				'',
			];

			invalidIds.forEach((id) => {
				expect(validateEnvironmentId(id)).toBe(false);
			});
		});

		it('should handle case insensitive UUIDs', () => {
			const validId = '12345678-1234-1234-1234-123456789ABC';

			expect(validateEnvironmentId(validId)).toBe(true);
		});
	});

	describe('extractEnvironmentIdFromUrl', () => {
		it('should extract environment ID from PingOne URL', () => {
			const url = 'https://auth.pingone.com/12345678-1234-1234-1234-123456789abc/as/authorize';

			const result = extractEnvironmentIdFromUrl(url);

			expect(result).toBe('12345678-1234-1234-1234-123456789abc');
		});

		it('should return null for invalid URL', () => {
			const result = extractEnvironmentIdFromUrl('not-a-url');

			expect(result).toBeNull();
		});

		it('should return null when no environment ID found', () => {
			const url = 'https://example.com/path';

			const result = extractEnvironmentIdFromUrl(url);

			expect(result).toBeNull();
		});
	});

	describe('validateOIDCConfiguration', () => {
		it('should validate correct configuration', () => {
			const result = validateOIDCConfiguration(mockOIDCConfig);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject configuration with missing required fields', () => {
			const invalidConfig = {
				issuer: 'https://auth.pingone.com/test/as',
				// Missing required fields
			};

			const result = validateOIDCConfiguration(invalidConfig as any);

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should reject configuration with invalid URLs', () => {
			const invalidConfig = {
				...mockOIDCConfig,
				issuer: 'not-a-url',
			};

			const result = validateOIDCConfiguration(invalidConfig);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Invalid URL in issuer: not-a-url');
		});
	});

	describe('getSupportedFeatures', () => {
		it('should detect supported features', () => {
			const configWithFeatures = {
				...mockOIDCConfig,
				code_challenge_methods_supported: ['S256'],
				pushed_authorization_request_endpoint: 'https://auth.pingone.com/test/as/par',
				device_authorization_endpoint: 'https://auth.pingone.com/test/as/device',
				backchannel_authentication_endpoint: 'https://auth.pingone.com/test/as/bca',
				introspection_endpoint: 'https://auth.pingone.com/test/as/introspect',
				revocation_endpoint: 'https://auth.pingone.com/test/as/revoke',
			};

			const features = getSupportedFeatures(configWithFeatures);

			expect(features.pkce).toBe(true);
			expect(features.par).toBe(true);
			expect(features.deviceCode).toBe(true);
			expect(features.backchannelAuth).toBe(true);
			expect(features.introspection).toBe(true);
			expect(features.revocation).toBe(true);
		});

		it('should detect unsupported features', () => {
			const configWithoutFeatures = {
				...mockOIDCConfig,
				code_challenge_methods_supported: [],
				// No PAR, device code, backchannel auth, introspection, or revocation endpoints
			};

			const features = getSupportedFeatures(configWithoutFeatures);

			expect(features.pkce).toBe(false);
			expect(features.par).toBe(false);
			expect(features.deviceCode).toBe(false);
			expect(features.backchannelAuth).toBe(false);
			expect(features.introspection).toBe(false);
			expect(features.revocation).toBe(false);
		});
	});
});
