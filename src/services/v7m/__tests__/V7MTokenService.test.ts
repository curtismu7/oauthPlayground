/**
 * @file V7MTokenService.test.ts
 * @module v7m/services/__tests__
 * @description Unit tests for V7M token service (PKCE, client auth, error paths)
 */

import { authorizeIssueCode } from '../V7MAuthorizeService';
import { V7MStateStore } from '../V7MStateStore';
import { computePkceS256 } from '../V7MTokenGenerator';
import { tokenExchangeAuthorizationCode } from '../V7MTokenService';

describe('V7MTokenService', () => {
	beforeEach(() => {
		V7MStateStore.clear();
	});

	describe('tokenExchangeAuthorizationCode - PKCE validation', () => {
		it('should validate S256 PKCE correctly', () => {
			const codeVerifier = 'test-verifier-123';
			const codeChallenge = computePkceS256(codeVerifier);
			const req = {
				response_type: 'code' as const,
				client_id: 'test-client',
				redirect_uri: '/callback',
				scope: 'read write',
				code_challenge: codeChallenge,
				code_challenge_method: 'S256' as const,
				userEmail: 'user@example.com',
			};
			const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
			if (res.type !== 'success') throw new Error('Failed to issue code');

			const tokenReq = {
				grant_type: 'authorization_code' as const,
				code: new URL(res.url).searchParams.get('code') || '',
				redirect_uri: '/callback',
				client_id: 'test-client',
				code_verifier: codeVerifier,
				client_secret: 'secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes = tokenExchangeAuthorizationCode(tokenReq);
			expect('error' in tokenRes).toBe(false);
			if ('error' in tokenRes) return;
			expect(tokenRes.access_token).toBeDefined();
		});

		it('should reject invalid code_verifier for S256', () => {
			const codeVerifier = 'test-verifier-123';
			const wrongVerifier = 'wrong-verifier';
			const codeChallenge = computePkceS256(codeVerifier);
			const req = {
				response_type: 'code' as const,
				client_id: 'test-client',
				redirect_uri: '/callback',
				scope: 'read write',
				code_challenge: codeChallenge,
				code_challenge_method: 'S256' as const,
				userEmail: 'user@example.com',
			};
			const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
			if (res.type !== 'success') throw new Error('Failed to issue code');

			const tokenReq = {
				grant_type: 'authorization_code' as const,
				code: new URL(res.url).searchParams.get('code') || '',
				redirect_uri: '/callback',
				client_id: 'test-client',
				code_verifier: wrongVerifier,
				client_secret: 'secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes = tokenExchangeAuthorizationCode(tokenReq);
			expect('error' in tokenRes).toBe(true);
			if (!('error' in tokenRes)) return;
			expect(tokenRes.error).toBe('invalid_grant');
		});

		it('should validate plain PKCE correctly', () => {
			const codeVerifier = 'test-verifier-123';
			const req = {
				response_type: 'code' as const,
				client_id: 'test-client',
				redirect_uri: '/callback',
				scope: 'read write',
				code_challenge: codeVerifier,
				code_challenge_method: 'plain' as const,
				userEmail: 'user@example.com',
			};
			const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
			if (res.type !== 'success') throw new Error('Failed to issue code');

			const tokenReq = {
				grant_type: 'authorization_code' as const,
				code: new URL(res.url).searchParams.get('code') || '',
				redirect_uri: '/callback',
				client_id: 'test-client',
				code_verifier: codeVerifier,
				client_secret: 'secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes = tokenExchangeAuthorizationCode(tokenReq);
			expect('error' in tokenRes).toBe(false);
			if ('error' in tokenRes) return;
			expect(tokenRes.access_token).toBeDefined();
		});
	});

	describe('tokenExchangeAuthorizationCode - client authentication', () => {
		it('should validate client_secret_post authentication', () => {
			const req = {
				response_type: 'code' as const,
				client_id: 'test-client',
				redirect_uri: '/callback',
				scope: 'read write',
				userEmail: 'user@example.com',
			};
			const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
			if (res.type !== 'success') throw new Error('Failed to issue code');

			const tokenReq = {
				grant_type: 'authorization_code' as const,
				code: new URL(res.url).searchParams.get('code') || '',
				redirect_uri: '/callback',
				client_id: 'test-client',
				client_secret: 'secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes = tokenExchangeAuthorizationCode(tokenReq);
			expect('error' in tokenRes).toBe(false);
			if ('error' in tokenRes) return;
			expect(tokenRes.access_token).toBeDefined();
		});

		it('should reject incorrect client_secret', () => {
			const req = {
				response_type: 'code' as const,
				client_id: 'test-client',
				redirect_uri: '/callback',
				scope: 'read write',
				userEmail: 'user@example.com',
			};
			const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
			if (res.type !== 'success') throw new Error('Failed to issue code');

			const tokenReq = {
				grant_type: 'authorization_code' as const,
				code: new URL(res.url).searchParams.get('code') || '',
				redirect_uri: '/callback',
				client_id: 'test-client',
				client_secret: 'wrong-secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes = tokenExchangeAuthorizationCode(tokenReq);
			expect('error' in tokenRes).toBe(true);
			if (!('error' in tokenRes)) return;
			expect(tokenRes.error).toBe('invalid_client');
		});
	});

	describe('tokenExchangeAuthorizationCode - error paths', () => {
		it('should reject invalid authorization code', () => {
			const tokenReq = {
				grant_type: 'authorization_code' as const,
				code: 'invalid-code',
				redirect_uri: '/callback',
				client_id: 'test-client',
				client_secret: 'secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes = tokenExchangeAuthorizationCode(tokenReq);
			expect('error' in tokenRes).toBe(true);
			if (!('error' in tokenRes)) return;
			expect(tokenRes.error).toBe('invalid_grant');
		});

		it('should reject expired authorization code', () => {
			const req = {
				response_type: 'code' as const,
				client_id: 'test-client',
				redirect_uri: '/callback',
				scope: 'read write',
				userEmail: 'user@example.com',
			};
			const pastTime = Math.floor(Date.now() / 1000) - 400;
			const res = authorizeIssueCode(req, pastTime, 300);
			if (res.type !== 'success') throw new Error('Failed to issue code');

			const tokenReq = {
				grant_type: 'authorization_code' as const,
				code: new URL(res.url).searchParams.get('code') || '',
				redirect_uri: '/callback',
				client_id: 'test-client',
				client_secret: 'secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes = tokenExchangeAuthorizationCode(tokenReq);
			expect('error' in tokenRes).toBe(true);
			if (!('error' in tokenRes)) return;
			expect(tokenRes.error).toBe('invalid_grant');
		});

		it('should reject reused authorization code', () => {
			const req = {
				response_type: 'code' as const,
				client_id: 'test-client',
				redirect_uri: '/callback',
				scope: 'read write',
				userEmail: 'user@example.com',
			};
			const res = authorizeIssueCode(req, Math.floor(Date.now() / 1000), 300);
			if (res.type !== 'success') throw new Error('Failed to issue code');
			const code = new URL(res.url).searchParams.get('code') || '';

			const tokenReq1 = {
				grant_type: 'authorization_code' as const,
				code,
				redirect_uri: '/callback',
				client_id: 'test-client',
				client_secret: 'secret',
				expectedClientSecret: 'secret',
				issuer: 'https://mock.issuer',
				environmentId: 'env-123',
				scope: 'read write',
				includeIdToken: false,
			};

			const tokenRes1 = tokenExchangeAuthorizationCode(tokenReq1);
			expect('error' in tokenRes1).toBe(false);

			const tokenRes2 = tokenExchangeAuthorizationCode(tokenReq1);
			expect('error' in tokenRes2).toBe(true);
			if (!('error' in tokenRes2)) return;
			expect(tokenRes2.error).toBe('invalid_grant');
		});
	});
});
