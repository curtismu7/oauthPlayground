// src/lab/services/__tests__/unifiedOAuthBackupServiceV8U.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../unifiedFlowLoggerServiceV8U', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

import { UnifiedOAuthBackupServiceV8U } from '../unifiedOAuthBackupServiceV8U';

describe('UnifiedOAuthBackupServiceV8U.loadOAuthBackup', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('sends dataType so /api/backup/load does not 400', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				key: 'unified_oauth_test',
				environmentId: 'env-1',
				dataType: 'credentials',
				data: JSON.stringify({
					flowType: 'oauth-authz',
					credentials: { clientId: 'c1' },
				}),
			}),
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await UnifiedOAuthBackupServiceV8U.loadOAuthBackup(
			'unified_oauth_test',
			'env-1'
		);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(JSON.parse(String(init.body))).toEqual({
			key: 'unified_oauth_test',
			environmentId: 'env-1',
			dataType: 'credentials',
		});
		expect(result?.credentials).toEqual({ clientId: 'c1' });
	});

	it('treats 400 as missing backup (no ERROR log throw path)', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: false,
			status: 400,
			statusText: 'Bad Request',
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await UnifiedOAuthBackupServiceV8U.loadOAuthBackup('k', 'env');
		expect(result).toBeNull();
	});

	it('skips fetch when environmentId is empty', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);

		const result = await UnifiedOAuthBackupServiceV8U.loadOAuthBackup('k', '');
		expect(result).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
