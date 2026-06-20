import { beforeEach, describe, expect, it, vi } from 'vitest';

const { saveCredentials, saveToken, setEnvironmentId, pingOneFetch } = vi.hoisted(() => ({
	saveCredentials: vi.fn(),
	saveToken: vi.fn(),
	setEnvironmentId: vi.fn(),
	pingOneFetch: vi.fn(),
}));

vi.mock('@/services/unifiedWorkerTokenService', () => ({
	unifiedWorkerTokenService: { saveCredentials, saveToken },
}));
vi.mock('@/services/environmentService', () => ({
	environmentService: { setEnvironmentId },
}));
vi.mock('@/utils/logger', () => ({
	logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('@/utils/pingOneFetch', () => ({ default: pingOneFetch }));

import { acquireWorkerToken } from '../workerTokenAcquisitionService';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
	return {
		ok,
		status,
		statusText: ok ? 'OK' : 'Error',
		json: async () => body,
		text: async () => JSON.stringify(body),
	} as unknown as Response;
}

const base = {
	environmentId: 'env1',
	clientId: 'cid',
	clientSecret: 'sec',
	scopes: ['read'],
	region: 'us' as const,
	authMethod: 'client_secret_basic' as const,
};

describe('acquireWorkerToken', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		saveCredentials.mockResolvedValue(undefined);
		saveToken.mockResolvedValue(undefined);
	});

	it('returns the token and persists token + environment on success', async () => {
		pingOneFetch.mockResolvedValueOnce(jsonResponse({ access_token: 'T', expires_in: 3600 }));
		const res = await acquireWorkerToken(base);

		expect(res.token).toBe('T');
		expect(res.authMethodUsed).toBe('client_secret_basic');
		expect(saveToken).toHaveBeenCalledWith('T', expect.any(Number));
		expect(setEnvironmentId).toHaveBeenCalledWith('env1', { region: 'us' });

		const [url, opts] = pingOneFetch.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('https://auth.pingone.com/env1/as/token');
		expect((opts.headers as Record<string, string>).Authorization).toMatch(/^Basic /);
	});

	it('resolves the regional endpoint (eu) and honors a custom domain', async () => {
		pingOneFetch.mockResolvedValueOnce(jsonResponse({ access_token: 'T', expires_in: 60 }));
		await acquireWorkerToken({ ...base, region: 'eu', customDomain: 'auth.acme.com' });
		expect((pingOneFetch.mock.calls[0] as [string])[0]).toBe('https://auth.acme.com/env1/as/token');
	});

	it('uses post body (no Basic header) for client_secret_post', async () => {
		pingOneFetch.mockResolvedValueOnce(jsonResponse({ access_token: 'T', expires_in: 60 }));
		await acquireWorkerToken({ ...base, authMethod: 'client_secret_post' });
		const [, opts] = pingOneFetch.mock.calls[0] as [string, RequestInit];
		expect((opts.headers as Record<string, string>).Authorization).toBeUndefined();
		expect(opts.body).toContain('client_secret=sec');
	});

	it('rejects when required fields are missing (no network call)', async () => {
		await expect(acquireWorkerToken({ ...base, clientId: '' })).rejects.toThrow(/required/i);
		expect(pingOneFetch).not.toHaveBeenCalled();
	});

	it('rejects when no scopes are provided', async () => {
		await expect(acquireWorkerToken({ ...base, scopes: [] })).rejects.toThrow(/scope/i);
	});

	it('auto-retries the opposite auth method on mismatch and re-persists it', async () => {
		pingOneFetch
			.mockResolvedValueOnce(
				jsonResponse(
					{ error: 'invalid_client', error_description: 'client authentication failed' },
					false,
					401
				)
			)
			.mockResolvedValueOnce(jsonResponse({ access_token: 'T2', expires_in: 1000 }));

		const res = await acquireWorkerToken(base);
		expect(res.token).toBe('T2');
		expect(res.authMethodUsed).toBe('client_secret_post');
		expect(pingOneFetch).toHaveBeenCalledTimes(2);
		// initial save + corrected-method re-save
		expect(saveCredentials).toHaveBeenCalledTimes(2);
		expect(saveCredentials.mock.calls[1][0]).toMatchObject({
			tokenEndpointAuthMethod: 'client_secret_post',
		});
	});

	it('surfaces a non-mismatch error without retrying', async () => {
		pingOneFetch.mockResolvedValueOnce(
			jsonResponse({ error: 'invalid_request', error_description: 'bad scope' }, false, 400)
		);
		await expect(acquireWorkerToken(base)).rejects.toThrow(/bad scope/);
		expect(pingOneFetch).toHaveBeenCalledTimes(1);
	});

	it('throws when the response has no access_token', async () => {
		pingOneFetch.mockResolvedValueOnce(jsonResponse({ token_type: 'Bearer' }));
		await expect(acquireWorkerToken(base)).rejects.toThrow(/no access token/i);
	});
});
