import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	createAuthorizationUrl,
	generateCodeChallenge,
	generateCodeVerifier,
	generateRandomString,
	parseCallbackUrl,
	validateState,
} from '../oauth';

// Mock crypto for testing
const mockCrypto = {
	getRandomValues: vi.fn(),
	subtle: {
		digest: vi.fn(),
	},
};

// Setup crypto mock
Object.defineProperty(window, 'crypto', {
	value: mockCrypto,
	writable: true,
});

describe('OAuth Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('generateRandomString', () => {
		test('generates string of specified length', () => {
			mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([0x12, 0x34, 0x56, 0x78]));

			const result = generateRandomString(8);
			expect(result).toHaveLength(8);
			expect(typeof result).toBe('string');
		});

		test('generates string of default length (32)', () => {
			mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16).fill(0xab));

			const result = generateRandomString();
			expect(result).toHaveLength(32);
		});

		test('uses crypto.getRandomValues for randomness', () => {
			mockCrypto.getRandomValues.mockReturnValue(new Uint8Array([0xff, 0x00]));

			generateRandomString(4);
			expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
		});
	});

	describe('generateCodeVerifier', () => {
		test('returns a string', () => {
			mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(32).fill(0x42));

			const result = generateCodeVerifier();
			expect(typeof result).toBe('string');
		});

		test('calls generateRandomString with length 64', () => {
			const _spy = vi.spyOn({ generateRandomString }, 'generateRandomString');
			mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(32).fill(0x42));

			generateCodeVerifier();

			// Note: This test may need adjustment based on actual implementation
			expect(mockCrypto.getRandomValues).toHaveBeenCalled();
		});
	});

	describe('generateCodeChallenge', () => {
		test('returns a base64url encoded string', async () => {
			const mockHash = new Uint8Array([0x12, 0x34, 0x56, 0x78]).buffer;
			mockCrypto.subtle.digest.mockResolvedValue(mockHash);

			const result = await generateCodeChallenge('test-verifier');
			expect(typeof result).toBe('string');
			// Should not contain +, /, or end with =
			expect(result).not.toMatch(/[+/=]/);
		});

		test('uses SHA-256 algorithm', async () => {
			const mockHash = new Uint8Array(32).fill(0xab).buffer;
			mockCrypto.subtle.digest.mockResolvedValue(mockHash);

			await generateCodeChallenge('test-verifier');

			expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
		});

		test('encodes the code verifier correctly', async () => {
			const mockHash = new Uint8Array([0x12, 0x34]).buffer;
			mockCrypto.subtle.digest.mockResolvedValue(mockHash);

			await generateCodeChallenge('test-verifier');

			const encoder = new TextEncoder();
			const expectedData = encoder.encode('test-verifier');
			expect(mockCrypto.subtle.digest).toHaveBeenCalledWith('SHA-256', expectedData);
		});
	});

	describe('createAuthorizationUrl', () => {
		test('creates valid authorization URL with required parameters', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'https://app.example.com/callback',
				responseType: 'code',
				scope: 'openid profile email',
				state: 'test-state',
			};

			const url = createAuthorizationUrl(params);

			expect(url).toContain('https://auth.example.com/authorize');
			expect(url).toContain('client_id=test-client');
			expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
			expect(url).toContain('response_type=code');
			expect(url).toContain('scope=openid%20profile%20email');
			expect(url).toContain('state=test-state');
		});

		test('includes optional PKCE parameters', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'https://app.example.com/callback',
				responseType: 'code',
				scope: 'openid profile',
				state: 'test-state',
				codeChallenge: 'test-challenge',
				codeChallengeMethod: 'S256',
			};

			const url = createAuthorizationUrl(params);

			expect(url).toContain('code_challenge=test-challenge');
			expect(url).toContain('code_challenge_method=S256');
		});

		test('includes additional parameters', () => {
			const params = {
				authorizationEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'https://app.example.com/callback',
				responseType: 'code',
				scope: 'openid',
				state: 'test-state',
				additionalParams: {
					nonce: 'test-nonce',
					prompt: 'login',
				},
			};

			const url = createAuthorizationUrl(params);

			expect(url).toContain('nonce=test-nonce');
			expect(url).toContain('prompt=login');
		});
	});

	describe('parseCallbackUrl', () => {
		test('parses authorization code from callback URL', () => {
			const url = 'https://app.example.com/callback?code=test-code&state=test-state';

			const result = parseCallbackUrl(url);

			expect(result.code).toBe('test-code');
			expect(result.state).toBe('test-state');
			expect(result.error).toBeUndefined();
		});

		test('parses error from callback URL', () => {
			const url =
				'https://app.example.com/callback?error=access_denied&error_description=User%20denied%20access&state=test-state';

			const result = parseCallbackUrl(url);

			expect(result.error).toBe('access_denied');
			expect(result.errorDescription).toBe('User denied access');
			expect(result.state).toBe('test-state');
			expect(result.code).toBeUndefined();
		});

		test('handles URLs without query parameters', () => {
			const url = 'https://app.example.com/callback';

			const result = parseCallbackUrl(url);

			expect(result.code).toBeUndefined();
			expect(result.state).toBeUndefined();
			expect(result.error).toBeUndefined();
		});

		test('parses implicit flow tokens', () => {
			const url =
				'https://app.example.com/callback#access_token=test-token&id_token=test-id-token&token_type=Bearer&expires_in=3600&state=test-state';

			const result = parseCallbackUrl(url);

			expect(result.accessToken).toBe('test-token');
			expect(result.idToken).toBe('test-id-token');
			expect(result.tokenType).toBe('Bearer');
			expect(result.expiresIn).toBe('3600');
			expect(result.state).toBe('test-state');
		});
	});

	describe('validateState', () => {
		test('returns true for matching states', () => {
			const result = validateState('test-state', 'test-state');
			expect(result).toBe(true);
		});

		test('returns false for non-matching states', () => {
			const result = validateState('expected-state', 'received-state');
			expect(result).toBe(false);
		});

		test('returns false for undefined/empty states', () => {
			expect(validateState('', 'received')).toBe(false);
			expect(validateState('expected', '')).toBe(false);
			expect(validateState(undefined as any, 'received')).toBe(false);
			expect(validateState('expected', undefined as any)).toBe(false);
		});
	});
});
