// src/flows2/services/__tests__/ropcService.test.ts
import { describe, expect, it } from 'vitest';
import { ropcService } from '../ropcService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-456',
	region: 'com',
	clientId: 'ropc-client',
	clientSecret: 'ropc-secret',
	scope: 'openid profile',
	authMethod: 'client_secret_post',
};

const USERNAME = 'alice@example.com';
const PASSWORD = 'hunter2';

describe('ropcService — mock path (offline)', () => {
	it('returns a truthy access_token', async () => {
		const result = await ropcService.runPasswordGrant(creds, USERNAME, PASSWORD, 'mock');
		expect(result.accessToken).toBeTruthy();
	});

	it('returns an id_token and refresh_token', async () => {
		const result = await ropcService.runPasswordGrant(creds, USERNAME, PASSWORD, 'mock');
		expect(result.idToken).toBeTruthy();
		expect(result.refreshToken).toBeTruthy();
	});

	it('does NOT include the password anywhere in the returned result', async () => {
		const result = await ropcService.runPasswordGrant(creds, USERNAME, PASSWORD, 'mock');
		// Serialise the entire result (including raw) and assert the password is absent
		const serialised = JSON.stringify(result);
		expect(serialised).not.toContain(PASSWORD);
	});

	it('raw result does NOT contain the password', async () => {
		const result = await ropcService.runPasswordGrant(creds, USERNAME, PASSWORD, 'mock');
		const rawStr = JSON.stringify(result.raw);
		expect(rawStr).not.toContain(PASSWORD);
	});
});
