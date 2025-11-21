/**
 * @file V7MTokenGenerator.test.ts
 * @module v7m/services/__tests__
 * @description Unit tests for V7M token generator (access, ID, refresh tokens)
 */

import type { V7MTokenSeed, V7MTokenTtls } from '../V7MTokenGenerator';
import { generateV7MTokens } from '../V7MTokenGenerator';

describe('V7MTokenGenerator', () => {
	const baseSeed: V7MTokenSeed = {
		clientId: 'test-client',
		environmentId: 'env-123',
		issuer: 'https://mock.issuer/v7m',
		userEmail: 'user@example.com',
		userId: 'user-123',
		nonce: 'n-0S6_WzA2Mj',
		scope: 'openid profile email',
		audience: 'test-client',
	};

	const defaultTtls: V7MTokenTtls = {
		accessTokenSeconds: 3600,
		idTokenSeconds: 3600,
		refreshTokenSeconds: 86400,
	};

	describe('generateV7MTokens', () => {
		it('should generate deterministic tokens from same seed', () => {
			const now = Math.floor(Date.now() / 1000);
			const tokens1 = generateV7MTokens(baseSeed, now, defaultTtls, true, undefined);
			const tokens2 = generateV7MTokens(baseSeed, now, defaultTtls, true, undefined);

			expect(tokens1.access_token).toBe(tokens2.access_token);
			expect(tokens1.id_token).toBe(tokens2.id_token);
			expect(tokens1.refresh_token).toBe(tokens2.refresh_token);
		});

		it('should generate ID token when includeIdToken is true', () => {
			const now = Math.floor(Date.now() / 1000);
			const tokens = generateV7MTokens(baseSeed, now, defaultTtls, true, undefined);

			expect(tokens.id_token).toBeDefined();
			expect(tokens.id_token?.startsWith('eyJ')).toBe(true);
		});

		it('should not generate ID token when includeIdToken is false', () => {
			const now = Math.floor(Date.now() / 1000);
			const tokens = generateV7MTokens(baseSeed, now, defaultTtls, false, undefined);

			expect(tokens.id_token).toBeUndefined();
		});

		it('should generate refresh token', () => {
			const now = Math.floor(Date.now() / 1000);
			const tokens = generateV7MTokens(baseSeed, now, defaultTtls, false, undefined);

			expect(tokens.refresh_token).toBeDefined();
			expect(typeof tokens.refresh_token).toBe('string');
		});

		it('should include expires_in for access token', () => {
			const now = Math.floor(Date.now() / 1000);
			const tokens = generateV7MTokens(baseSeed, now, defaultTtls, false, undefined);

			expect(tokens.expires_in).toBe(3600);
		});

		it('should use custom TTLs when provided', () => {
			const now = Math.floor(Date.now() / 1000);
			const customTtls: V7MTokenTtls = {
				accessTokenSeconds: 1800,
				idTokenSeconds: 1800,
				refreshTokenSeconds: 43200,
			};
			const tokens = generateV7MTokens(baseSeed, now, customTtls, false, undefined);

			expect(tokens.expires_in).toBe(1800);
		});

		it('should include at_hash in ID token when access token exists', () => {
			const now = Math.floor(Date.now() / 1000);
			const tokens = generateV7MTokens(baseSeed, now, defaultTtls, true, undefined);

			if (tokens.id_token) {
				const parts = tokens.id_token.split('.');
				expect(parts.length).toBe(3);
				const payload = JSON.parse(atob(parts[1]));
				expect(payload.at_hash).toBeDefined();
			}
		});

		it('should include c_hash in ID token when authorization code provided', () => {
			const now = Math.floor(Date.now() / 1000);
			const code = 'abc123code';
			const tokens = generateV7MTokens(baseSeed, now, defaultTtls, true, code);

			if (tokens.id_token) {
				const parts = tokens.id_token.split('.');
				const payload = JSON.parse(atob(parts[1]));
				expect(payload.c_hash).toBeDefined();
			}
		});
	});
});
