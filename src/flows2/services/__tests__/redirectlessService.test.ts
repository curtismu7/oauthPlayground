// src/flows2/services/__tests__/redirectlessService.test.ts
import { describe, expect, it } from 'vitest';
import { redirectlessService } from '../redirectlessService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-456',
	region: 'com',
	clientId: 'redirectless-client',
	clientSecret: 'redirectless-secret',
	scope: 'openid profile email',
	authMethod: 'client_secret_post',
};

describe('redirectlessService — mock path (offline)', () => {
	it('startAuthorize returns a non-COMPLETED status requiring credentials', async () => {
		const state = await redirectlessService.startAuthorize(creds, 'mock');
		expect(state.flowId).toBeTruthy();
		expect(state.status).not.toBe('COMPLETED');
		expect(state.status).toBe('USERNAME_PASSWORD_REQUIRED');
		expect(state.sessionId).toBeTruthy();
	});

	it('submitCredentials advances the flow to COMPLETED', async () => {
		const state = await redirectlessService.startAuthorize(creds, 'mock');
		const advanced = await redirectlessService.submitCredentials(
			creds,
			state,
			'testuser@example.com',
			'Password123!',
			'mock'
		);
		expect(advanced.status).toBe('COMPLETED');
		expect(advanced.flowId).toBe(state.flowId);
	});

	it('poll after submitCredentials returns complete with a truthy access_token', async () => {
		const state = await redirectlessService.startAuthorize(creds, 'mock');
		const advanced = await redirectlessService.submitCredentials(
			creds,
			state,
			'testuser@example.com',
			'Password123!',
			'mock'
		);
		const result = await redirectlessService.poll(creds, advanced, 'mock');
		expect(result.status).toBe('complete');
		expect(result.token?.accessToken).toBeTruthy();
		expect(result.token?.idToken).toBeTruthy();
		expect(result.token?.refreshToken).toBe('mock-refresh-token');
		expect(result.token?.scope).toContain('openid');
	});
});
