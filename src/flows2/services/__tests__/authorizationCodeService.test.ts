// src/flows2/services/__tests__/authorizationCodeService.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { authorizationCodeService } from '../authorizationCodeService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'test-client',
	clientSecret: 'test-secret',
	scope: 'openid profile email',
};
const redirectUri = 'https://localhost:3000/v2/flows/authz-callback';

describe('authorizationCodeService — mock path (offline, end-to-end)', () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it('runs PKCE → authorize → exchange and returns tokens', async () => {
		const pkce = await authorizationCodeService.generatePkce('mock');
		expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
		expect(pkce.codeChallengeMethod).toBe('S256');

		const auth = await authorizationCodeService.authorize(
			{ credentials: creds, redirectUri, state: 'st-1', nonce: 'no-1', codeChallenge: pkce.codeChallenge, oidc: true },
			'mock'
		);
		// mock issues a code in-memory (no URL/redirect)
		expect(auth.code).toBeTruthy();
		expect(auth.url).toBeUndefined();

		const tokens = await authorizationCodeService.exchangeCode(
			{ credentials: creds, redirectUri, code: auth.code as string, codeVerifier: pkce.codeVerifier, oidc: true },
			'mock'
		);
		expect(tokens.accessToken).toBeTruthy();
		expect(tokens.tokenType).toBe('Bearer');
		// OIDC → id_token present
		expect(tokens.idToken).toBeTruthy();
	});

	it('rejects exchange when the PKCE verifier does not match the challenge', async () => {
		const pkce = await authorizationCodeService.generatePkce('mock');
		const auth = await authorizationCodeService.authorize(
			{ credentials: creds, redirectUri, state: 'st-2', codeChallenge: pkce.codeChallenge, oidc: false },
			'mock'
		);
		await expect(
			authorizationCodeService.exchangeCode(
				{ credentials: creds, redirectUri, code: auth.code as string, codeVerifier: 'a-different-verifier-value-0000000000000000' },
				'mock'
			)
		).rejects.toMatchObject({ error: expect.any(String) });
	});

	it('builds a real /as/authorize URL with PKCE + state (no network)', async () => {
		const pkce = await authorizationCodeService.generatePkce('mock');
		const auth = await authorizationCodeService.authorize(
			{ credentials: creds, redirectUri, state: 'st-3', nonce: 'no-3', codeChallenge: pkce.codeChallenge, oidc: true },
			'real'
		);
		expect(auth.url).toContain('https://auth.pingone.com/test-env-123/as/authorize');
		expect(auth.url).toContain('code_challenge_method=S256');
		expect(auth.url).toContain('response_type=code');
		expect(auth.url).toContain('state=st-3');
		expect(auth.url).toContain('nonce=no-3');
	});
});
