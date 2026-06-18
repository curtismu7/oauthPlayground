// src/flows2/services/__tests__/refreshTokenService.test.ts
import { describe, expect, it } from 'vitest';
import { refreshTokenService } from '../refreshTokenService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'refresh-client',
	clientSecret: 'refresh-secret',
	scope: 'openid profile',
	authMethod: 'client_secret_post',
};

const INPUT_REFRESH_TOKEN = 'original-refresh-token-abc123';

describe('refreshTokenService — mock path (offline)', () => {
	it('returns a truthy access_token', async () => {
		const result = await refreshTokenService.refresh(creds, INPUT_REFRESH_TOKEN, 'mock');
		expect(result.token.accessToken).toBeTruthy();
	});

	it('mock rotates: new refresh_token is truthy and differs from the submitted one', async () => {
		const result = await refreshTokenService.refresh(creds, INPUT_REFRESH_TOKEN, 'mock');
		expect(result.token.refreshToken).toBeTruthy();
		expect(result.token.refreshToken).not.toBe(INPUT_REFRESH_TOKEN);
		expect(result.rotated).toBe(true);
	});

	it('echoes the submitted refresh_token back for comparison', async () => {
		const result = await refreshTokenService.refresh(creds, INPUT_REFRESH_TOKEN, 'mock');
		expect(result.submittedRefreshToken).toBe(INPUT_REFRESH_TOKEN);
	});

	it('token includes expected fields', async () => {
		const result = await refreshTokenService.refresh(creds, INPUT_REFRESH_TOKEN, 'mock');
		expect(result.token.tokenType).toBe('Bearer');
		expect(result.token.expiresIn).toBeGreaterThan(0);
		expect(result.token.scope).toBe('openid profile');
	});
});
