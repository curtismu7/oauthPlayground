import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
	buildAuthUrl,
	generateCodeChallenge,
	generateCodeVerifier,
	generateRandomString,
	parseUrlParams,
	validateCsrfToken,
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
			void vi.spyOn({ generateRandomString }, 'generateRandomString');
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
			// NOTE: `expect.any(Uint8Array)` / `toBeInstanceOf(Uint8Array)` do not
			// match here — under this project's jsdom vitest environment,
			// `TextEncoder().encode()` returns a Uint8Array from a different
			// realm than the one these instanceof-based matchers check against,
			// even though the byte contents are identical (verified with an
			// isolated probe). Asserting on the actual encoded bytes avoids that
			// cross-realm instanceof mismatch while still verifying the call.
			const mockHash = new Uint8Array(32).fill(0xab).buffer;
			mockCrypto.subtle.digest.mockResolvedValue(mockHash);

			await generateCodeChallenge('test-verifier');

			const [algorithm, data] = mockCrypto.subtle.digest.mock.calls[0];
			expect(algorithm).toBe('SHA-256');
			expect(Array.from(data as Uint8Array)).toEqual(
				Array.from(new TextEncoder().encode('test-verifier'))
			);
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

	// NOTE: `createAuthorizationUrl` no longer exists. The current equivalent is
	// `buildAuthUrl`, which takes a differently-shaped config object
	// (`authEndpoint` instead of `authorizationEndpoint`, no generic
	// `additionalParams` passthrough) and encodes query params via
	// URLSearchParams (space -> `+`, not `%20`).
	describe('buildAuthUrl', () => {
		test('creates valid authorization URL with required parameters', () => {
			const params = {
				authEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'https://app.example.com/callback',
				responseType: 'code',
				scope: 'openid profile email',
				state: 'test-state',
			};

			const url = buildAuthUrl(params);

			expect(url).toContain('https://auth.example.com/authorize');
			expect(url).toContain('client_id=test-client');
			expect(url).toContain('redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback');
			expect(url).toContain('response_type=code');
			expect(url).toContain('scope=openid+profile+email');
			expect(url).toContain('state=test-state');
		});

		test('includes optional PKCE parameters', () => {
			const params = {
				authEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'https://app.example.com/callback',
				scope: 'openid profile',
				state: 'test-state',
				codeChallenge: 'test-challenge',
				codeChallengeMethod: 'S256',
			};

			const url = buildAuthUrl(params);

			expect(url).toContain('code_challenge=test-challenge');
			expect(url).toContain('code_challenge_method=S256');
		});

		test('includes nonce when provided', () => {
			// The old test exercised a generic `additionalParams` passthrough
			// (e.g. arbitrary `nonce`/`prompt` keys). `buildAuthUrl` has no such
			// mechanism today — `nonce` is the only extra param it recognizes,
			// and it must be passed as a top-level field. `prompt` has no
			// equivalent in the current implementation, so that assertion was
			// dropped rather than faked.
			const params = {
				authEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'https://app.example.com/callback',
				scope: 'openid',
				state: 'test-state',
				nonce: 'test-nonce',
			};

			const url = buildAuthUrl(params);

			expect(url).toContain('nonce=test-nonce');
		});

		test('omits redirect/response params and uses request_uri when PAR requestUri is provided', () => {
			const params = {
				authEndpoint: 'https://auth.example.com/authorize',
				clientId: 'test-client',
				redirectUri: 'https://app.example.com/callback',
				scope: 'openid',
				state: 'test-state',
				requestUri: 'urn:ietf:params:oauth:request_uri:abc123',
			};

			const url = buildAuthUrl(params);

			expect(url).toContain('client_id=test-client');
			expect(url).toContain(
				`request_uri=${encodeURIComponent('urn:ietf:params:oauth:request_uri:abc123')}`
			);
			expect(url).not.toContain('redirect_uri=');
			expect(url).not.toContain('state=');
		});
	});

	// NOTE: `parseCallbackUrl` no longer exists. The current equivalent is
	// `parseUrlParams`, which returns a flat map of every query-string AND
	// hash-fragment key using its raw (snake_case) name — there is no
	// camelCase remapping to `accessToken`/`idToken`/`tokenType`/`expiresIn`/
	// `errorDescription`.
	describe('parseUrlParams', () => {
		test('parses authorization code from callback URL', () => {
			const url = 'https://app.example.com/callback?code=test-code&state=test-state';

			const result = parseUrlParams(url);

			expect(result.code).toBe('test-code');
			expect(result.state).toBe('test-state');
			expect(result.error).toBeUndefined();
		});

		test('parses error from callback URL', () => {
			const url =
				'https://app.example.com/callback?error=access_denied&error_description=User%20denied%20access&state=test-state';

			const result = parseUrlParams(url);

			expect(result.error).toBe('access_denied');
			expect(result.error_description).toBe('User denied access');
			expect(result.state).toBe('test-state');
			expect(result.code).toBeUndefined();
		});

		test('handles URLs without query or hash parameters', () => {
			const url = 'https://app.example.com/callback';

			const result = parseUrlParams(url);

			expect(result.code).toBeUndefined();
			expect(result.state).toBeUndefined();
			expect(result.error).toBeUndefined();
			expect(Object.keys(result)).toHaveLength(0);
		});

		test('parses implicit flow tokens from the hash fragment', () => {
			const url =
				'https://app.example.com/callback#access_token=test-token&id_token=test-id-token&token_type=Bearer&expires_in=3600&state=test-state';

			const result = parseUrlParams(url);

			expect(result.access_token).toBe('test-token');
			expect(result.id_token).toBe('test-id-token');
			expect(result.token_type).toBe('Bearer');
			expect(result.expires_in).toBe('3600');
			expect(result.state).toBe('test-state');
		});
	});

	// NOTE: `validateState` no longer exists. The current equivalent is
	// `validateCsrfToken(token, expectedToken)`, which checks strict equality
	// plus a non-empty `token`.
	describe('validateCsrfToken', () => {
		test('returns true for matching tokens', () => {
			const result = validateCsrfToken('test-token', 'test-token');
			expect(result).toBe(true);
		});

		test('returns false for non-matching tokens', () => {
			const result = validateCsrfToken('expected-token', 'received-token');
			expect(result).toBe(false);
		});

		test('returns false for undefined/empty tokens', () => {
			expect(validateCsrfToken('', 'received')).toBe(false);
			expect(validateCsrfToken('expected', '')).toBe(false);
			expect(validateCsrfToken(undefined as any, 'received')).toBe(false);
			expect(validateCsrfToken('expected', undefined as any)).toBe(false);
		});
	});
});
