// src/flows/services/__tests__/tokenRevocationService.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { revocationEndpointFor, tokenRevocationService } from '../tokenRevocationService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'test-client',
	clientSecret: 'test-secret',
	authMethod: 'client_secret_post',
};

describe('tokenRevocationService — mock path (offline)', () => {
	it('returns { revoked: true, _mock: true } without network call', async () => {
		const fetchSpy = vi.spyOn(global, 'fetch');
		const result = await tokenRevocationService.run(
			{ credentials: creds, token: 'some-access-token' },
			'mock'
		);
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(result.revoked).toBe(true);
		expect(result._mock).toBe(true);
		fetchSpy.mockRestore();
	});

	it('ignores tokenTypeHint in mock mode and still revokes', async () => {
		const result = await tokenRevocationService.run(
			{ credentials: creds, token: 'some-token', tokenTypeHint: 'refresh_token' },
			'mock'
		);
		expect(result.revoked).toBe(true);
		expect(result._mock).toBe(true);
	});
});

describe('tokenRevocationService — real path (fetch)', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('POSTs to /api/pingone/revoke with correct body', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ revoked: true }),
		} as Response);

		const result = await tokenRevocationService.run(
			{ credentials: creds, token: 'access-token-abc' },
			'real'
		);

		expect(global.fetch).toHaveBeenCalledWith(
			'/api/pingone/revoke',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					environment_id: creds.environmentId,
					region: creds.region,
					client_id: creds.clientId,
					client_secret: creds.clientSecret,
					token: 'access-token-abc',
					token_type_hint: undefined,
				}),
			})
		);
		expect(result.revoked).toBe(true);
	});

	it('includes token_type_hint in the request body when provided', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ revoked: true }),
		} as Response);

		await tokenRevocationService.run(
			{ credentials: creds, token: 'refresh-token-xyz', tokenTypeHint: 'refresh_token' },
			'real'
		);

		expect(global.fetch).toHaveBeenCalledWith(
			'/api/pingone/revoke',
			expect.objectContaining({
				body: JSON.stringify({
					environment_id: creds.environmentId,
					region: creds.region,
					client_id: creds.clientId,
					client_secret: creds.clientSecret,
					token: 'refresh-token-xyz',
					token_type_hint: 'refresh_token',
				}),
			})
		);
	});

	it('throws a structured error on non-OK response', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: async () => ({ error: 'invalid_client', error_description: 'Bad credentials' }),
		} as Response);

		await expect(
			tokenRevocationService.run(
				{ credentials: creds, token: 'tok' },
				'real'
			)
		).rejects.toMatchObject({
			error: 'invalid_client',
			error_description: 'Bad credentials',
			status: 401,
		});
	});

	it('uses a fallback error when the server returns no error body', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({}),
		} as Response);

		await expect(
			tokenRevocationService.run(
				{ credentials: creds, token: 'tok' },
				'real'
			)
		).rejects.toMatchObject({
			error: 'revocation_failed',
			status: 500,
		});
	});
});

describe('revocationEndpointFor', () => {
	it('returns the PingOne revocation endpoint for the com region', () => {
		expect(revocationEndpointFor(creds)).toBe(
			'https://auth.pingone.com/test-env-123/as/revoke'
		);
	});

	it('returns the PingOne revocation endpoint for the EU region', () => {
		expect(revocationEndpointFor({ ...creds, region: 'eu' })).toBe(
			'https://auth.pingone.eu/test-env-123/as/revoke'
		);
	});

	it('returns the PingOne revocation endpoint for the CA region', () => {
		expect(revocationEndpointFor({ ...creds, region: 'ca' })).toBe(
			'https://auth.pingone.ca/test-env-123/as/revoke'
		);
	});

	it('returns the PingOne revocation endpoint for the AP region', () => {
		expect(revocationEndpointFor({ ...creds, region: 'ap' })).toBe(
			'https://auth.pingone.asia/test-env-123/as/revoke'
		);
	});
});
