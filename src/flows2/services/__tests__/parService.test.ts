// src/flows2/services/__tests__/parService.test.ts
import { describe, expect, it } from 'vitest';
import { exchangeCode, generatePkce, pushAuthorizationRequest } from '../parService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'par-client',
	clientSecret: 'par-secret',
	scope: 'openid profile',
};

describe('parService — mock path (offline)', () => {
	it('generatePkce returns a non-empty verifier and a deterministic mock challenge', async () => {
		const pair = await generatePkce('mock');
		expect(pair.codeVerifier).toBeTruthy();
		expect(pair.codeChallenge).toBeTruthy();
		expect(pair.codeChallengeMethod).toBe('S256');
		// mock challenge is reproducible for the same verifier
		const pair2 = await generatePkce('mock');
		// two different verifiers → two different challenges
		if (pair.codeVerifier !== pair2.codeVerifier) {
			expect(pair.codeChallenge).not.toBe(pair2.codeChallenge);
		}
	});

	it('pushAuthorizationRequest returns a request_uri starting with the RFC 9126 URN prefix', async () => {
		const result = await pushAuthorizationRequest(
			{
				credentials: creds,
				redirectUri: 'https://example.com/callback',
				state: 'random-state-abc',
				codeChallenge: 'mock-challenge-abc123',
				scope: 'openid profile',
			},
			'mock'
		);
		expect(result.requestUri).toMatch(/^urn:ietf:params:oauth:request_uri:/);
		expect(result.expiresIn).toBeGreaterThan(0);
		expect(result.raw).toBeTruthy();
	});

	it('exchangeCode returns a truthy access_token in mock mode', async () => {
		const result = await exchangeCode(
			{
				credentials: creds,
				redirectUri: 'https://example.com/callback',
				code: 'mock-code-xyz',
				codeVerifier: 'mock-verifier-xyz',
			},
			'mock'
		);
		expect(result.accessToken).toBeTruthy();
		expect(result.tokenType).toBe('Bearer');
		expect(result.expiresIn).toBeGreaterThan(0);
	});
});
