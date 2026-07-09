// src/services/__tests__/workerTokenManager.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadCredentialsMock, saveTokenMock, loadTokenDataMock, clearTokenMock } = vi.hoisted(() => ({
	loadCredentialsMock: vi.fn(),
	saveTokenMock: vi.fn(),
	loadTokenDataMock: vi.fn(),
	clearTokenMock: vi.fn(),
}));

vi.mock('../workerTokenRepository', () => ({
	workerTokenRepository: {
		loadCredentials: loadCredentialsMock,
		saveCredentials: vi.fn(),
		saveToken: saveTokenMock,
		loadTokenData: loadTokenDataMock,
		clearToken: clearTokenMock,
		clearCredentials: vi.fn(),
	},
}));

vi.mock('../../utils/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { WorkerTokenManager } from '../workerTokenManager';

describe('WorkerTokenManager', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		loadTokenDataMock.mockResolvedValue(null);
		// Reset singleton between tests
		(WorkerTokenManager as unknown as { instance: WorkerTokenManager | null }).instance = null;
	});

	it('preserves tokenEndpointAuthMethod from stored credentials', async () => {
		loadCredentialsMock.mockResolvedValue({
			environmentId: 'env-1',
			clientId: 'client-1',
			clientSecret: 'secret-1',
			scopes: ['openid'],
			region: 'us',
			tokenEndpoint: 'https://auth.pingone.com/env-1/as/token',
			tokenEndpointAuthMethod: 'client_secret_basic',
		});

		const manager = WorkerTokenManager.getInstance();
		const creds = await manager.loadCredentials();

		expect(creds?.tokenEndpointAuthMethod).toBe('client_secret_basic');
	});

	it('uses client_secret_basic Authorization header when configured', async () => {
		loadCredentialsMock.mockResolvedValue({
			environmentId: 'env-1',
			clientId: 'client-1',
			clientSecret: 'secret-1',
			scopes: [],
			region: 'us',
			tokenEndpoint: 'https://auth.pingone.com/env-1/as/token',
			tokenEndpointAuthMethod: 'client_secret_basic',
		});

		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				access_token: 'tok-basic',
				token_type: 'Bearer',
				expires_in: 3600,
			}),
		});
		vi.stubGlobal('fetch', fetchMock);

		const manager = WorkerTokenManager.getInstance();
		const token = await manager.getWorkerToken();

		expect(token).toBe('tok-basic');
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(headers.Authorization).toMatch(/^Basic /);
		expect(String(init.body)).not.toContain('client_secret=');
	});

	it('does not retry on invalid_client / 401 auth failures', async () => {
		loadCredentialsMock.mockResolvedValue({
			environmentId: 'env-1',
			clientId: 'client-1',
			clientSecret: 'bad-secret',
			scopes: [],
			region: 'us',
			tokenEndpoint: 'https://auth.pingone.com/env-1/as/token',
			tokenEndpointAuthMethod: 'client_secret_post',
		});

		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 401,
			statusText: '',
			text: async () =>
				JSON.stringify({
					error: 'invalid_client',
					error_description: 'Request denied: Unsupported authentication method',
				}),
		});
		vi.stubGlobal('fetch', fetchMock);

		const manager = WorkerTokenManager.getInstance();
		await expect(manager.getWorkerToken()).rejects.toThrow(/Failed to fetch Worker Token/);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('retries transient failures up to max attempts', async () => {
		loadCredentialsMock.mockResolvedValue({
			environmentId: 'env-1',
			clientId: 'client-1',
			clientSecret: 'secret-1',
			scopes: [],
			region: 'us',
			tokenEndpoint: 'https://auth.pingone.com/env-1/as/token',
			tokenEndpointAuthMethod: 'client_secret_post',
		});

		const fetchMock = vi
			.fn()
			.mockRejectedValueOnce(new Error('Network down'))
			.mockRejectedValueOnce(new Error('Network down'))
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					access_token: 'tok-retry',
					token_type: 'Bearer',
					expires_in: 3600,
				}),
			});
		vi.stubGlobal('fetch', fetchMock);
		vi.useFakeTimers();

		const manager = WorkerTokenManager.getInstance();
		const pending = manager.getWorkerToken();
		await vi.runAllTimersAsync();
		await expect(pending).resolves.toBe('tok-retry');
		expect(fetchMock).toHaveBeenCalledTimes(3);

		vi.useRealTimers();
	});
});
