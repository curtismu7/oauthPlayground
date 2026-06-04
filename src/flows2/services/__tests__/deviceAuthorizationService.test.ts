// src/flows2/services/__tests__/deviceAuthorizationService.test.ts
import { describe, expect, it } from 'vitest';
import { deviceAuthorizationService } from '../deviceAuthorizationService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'device-client',
	clientSecret: 'device-secret',
	scope: 'openid profile',
	authMethod: 'client_secret_post',
};

describe('deviceAuthorizationService — mock path (offline)', () => {
	it('returns a device + user code with a poll interval', async () => {
		const d = await deviceAuthorizationService.requestDeviceCode(creds, 'mock');
		expect(d.deviceCode).toBeTruthy();
		expect(d.userCode).toBe('WDJB-MJHT');
		expect(d.verificationUriComplete).toContain('user_code=');
		expect(d.interval).toBeGreaterThan(0);
		expect(d.expiresIn).toBeGreaterThan(0);
	});

	it('simulates authorization_pending then completes with tokens', async () => {
		const d = await deviceAuthorizationService.requestDeviceCode(creds, 'mock');

		const p0 = await deviceAuthorizationService.pollOnce(creds, d.deviceCode, 'mock', 0);
		expect(p0.status).toBe('pending');
		expect(p0.token).toBeUndefined();

		const p1 = await deviceAuthorizationService.pollOnce(creds, d.deviceCode, 'mock', 1);
		expect(p1.status).toBe('pending');

		const done = await deviceAuthorizationService.pollOnce(creds, d.deviceCode, 'mock', 2);
		expect(done.status).toBe('complete');
		expect(done.token?.accessToken).toBeTruthy();
		expect(done.token?.idToken).toBeTruthy();
		expect(done.token?.refreshToken).toBe('mock-refresh-token');
		expect(done.token?.scope).toBe('openid profile');
	});
});
