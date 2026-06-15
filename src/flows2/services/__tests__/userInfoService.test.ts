// src/flows2/services/__tests__/userInfoService.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { userInfoEndpointFor, userInfoService } from '../userInfoService';

describe('userInfoService — mock path (offline)', () => {
	it('returns canned OIDC claims without network call', async () => {
		const fetchSpy = vi.spyOn(global, 'fetch');
		const result = await userInfoService.run(
			{ environmentId: 'env-1', region: 'com', accessToken: 'tok' },
			'mock'
		);
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(result._mock).toBe(true);
		expect(result.sub).toBeDefined();
		expect(result.email).toBeDefined();
		fetchSpy.mockRestore();
	});

	it('includes standard OIDC claims in mock response', async () => {
		const result = await userInfoService.run(
			{ environmentId: 'env-1', region: 'com', accessToken: 'tok' },
			'mock'
		);
		expect(result.sub).toMatch(/^mock-user-/);
		expect(result.name).toBe('Demo User');
		expect(result.given_name).toBe('Demo');
		expect(result.family_name).toBe('User');
		expect(result.email).toBe('demo.user@example.com');
		expect(result.email_verified).toBe(true);
	});
});

describe('userInfoService — real path (fetch)', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('GETs /api/userinfo with correct query params', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ sub: 'user-1', email: 'test@example.com' }),
		} as Response);

		const result = await userInfoService.run(
			{ environmentId: 'env-1', region: 'com', accessToken: 'mytoken' },
			'real'
		);

		expect(global.fetch).toHaveBeenCalledWith(
			expect.stringContaining('/api/userinfo?access_token=mytoken&environment_id=env-1')
		);
		expect(result.sub).toBe('user-1');
		expect(result.email).toBe('test@example.com');
	});

	it('throws a structured error when the response is not OK', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: async () => ({ error: 'invalid_token', error_description: 'Token expired' }),
		} as Response);

		await expect(
			userInfoService.run(
				{ environmentId: 'env-1', region: 'com', accessToken: 'expired-token' },
				'real'
			)
		).rejects.toMatchObject({
			error: 'invalid_token',
			error_description: 'Token expired',
			status: 401,
		});
	});

	it('throws a structured error when the JSON body contains an error field', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ error: 'access_denied', error_description: 'Insufficient scope' }),
		} as Response);

		await expect(
			userInfoService.run(
				{ environmentId: 'env-1', region: 'com', accessToken: 'scope-token' },
				'real'
			)
		).rejects.toMatchObject({
			error: 'access_denied',
		});
	});

	it('uses a fallback error when the server returns no error body', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({}),
		} as Response);

		await expect(
			userInfoService.run(
				{ environmentId: 'env-1', region: 'com', accessToken: 'tok' },
				'real'
			)
		).rejects.toMatchObject({
			error: 'userinfo_failed',
			status: 500,
		});
	});
});

describe('userInfoEndpointFor', () => {
	it('returns the PingOne userinfo endpoint for the com region', () => {
		expect(userInfoEndpointFor('my-env', 'com')).toBe(
			'https://auth.pingone.com/my-env/as/userinfo'
		);
	});

	it('returns the PingOne userinfo endpoint for the EU region', () => {
		expect(userInfoEndpointFor('my-env', 'eu')).toBe(
			'https://auth.pingone.eu/my-env/as/userinfo'
		);
	});

	it('returns the PingOne userinfo endpoint for the CA region', () => {
		expect(userInfoEndpointFor('my-env', 'ca')).toBe(
			'https://auth.pingone.ca/my-env/as/userinfo'
		);
	});

	it('returns the PingOne userinfo endpoint for the AP region', () => {
		expect(userInfoEndpointFor('my-env', 'ap')).toBe(
			'https://auth.pingone.asia/my-env/as/userinfo'
		);
	});
});
