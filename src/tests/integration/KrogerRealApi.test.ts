// src/tests/integration/KrogerRealApi.test.ts
// Verifies live PingOne APIs backing the Kroger MFA experience.

import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';

const envId = process.env.PINGONE_ENVIRONMENT_ID;
const clientId = process.env.PINGONE_CLIENT_ID;
const clientSecret = process.env.PINGONE_CLIENT_SECRET;
const apiBase = process.env.PINGONE_API_URL ?? 'https://auth.pingone.com';
const usernameUnderTest = process.env.KROGER_E2E_USERNAME ?? 'curtis7';

if (!envId || !clientId || !clientSecret) {
	throw new Error('PINGONE credentials are required. Ensure PINGONE_ENVIRONMENT_ID, PINGONE_CLIENT_ID, and PINGONE_CLIENT_SECRET are set.');
}

const tokenEndpoint = `${apiBase.replace(/\/$/, '')}/${envId}/as/token`;
const managementApiBase = `https://api.pingone.com/v1/environments/${envId}`;

describe.skipIf(process.env.CI === 'true')('Kroger MFA real PingOne API', () => {
	let workerToken: string;
	let krogerUserId: string;

	beforeAll(async () => {
		// Increase the timeout for live HTTP calls.
		const timeout = 60_000;
		vi.setConfig({ testTimeout: timeout, hookTimeout: timeout });
	});

	it('obtains a worker token via client_credentials', async () => {
		const body = new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: clientId,
			client_secret: clientSecret,
			scope: 'p1:read:user p1:read:device p1:update:device',
		});

		const response = await fetch(tokenEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: body.toString(),
		});

		const payload = await response.json();

		if (!response.ok) {
			throw new Error(`Worker token request failed: ${response.status} ${response.statusText} ${JSON.stringify(payload)}`);
		}

		expect(payload).toHaveProperty('access_token');
		expect(typeof payload.access_token).toBe('string');
		expect(payload.token_type).toMatch(/bearer/i);

		workerToken = payload.access_token as string;
	});

	it('fetches the Kroger demo user profile', async () => {
		expect(workerToken).toBeTruthy();

		const filterParam = encodeURIComponent(`username eq "${usernameUnderTest}"`);
		const lookupUrl = `${managementApiBase}/users?filter=${filterParam}&limit=1`;
		const response = await fetch(lookupUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				Accept: 'application/json',
			},
		});

		const payload = await response.json();

		if (!response.ok) {
			throw new Error(`User lookup failed: ${response.status} ${response.statusText} ${JSON.stringify(payload)}`);
		}

		expect(payload?._embedded?.users).toBeInstanceOf(Array);
		expect(payload._embedded.users.length).toBeGreaterThan(0);

		const [user] = payload._embedded.users;
		expect(user).toHaveProperty('id');
		expect(user).toHaveProperty('username', usernameUnderTest);

		krogerUserId = user.id as string;
	});

	it('retrieves MFA devices for the Kroger user', async () => {
		expect(workerToken).toBeTruthy();
		expect(krogerUserId).toBeTruthy();

		const devicesUrl = `${managementApiBase}/users/${krogerUserId}/mfaDevices`;
		const response = await fetch(devicesUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${workerToken}`,
				Accept: 'application/json',
			},
		});

		const payload = await response.json();

		if (!response.ok) {
			throw new Error(`MFA device lookup failed: ${response.status} ${response.statusText} ${JSON.stringify(payload)}`);
		}

		expect(payload?._embedded?.mfaDevices).toBeInstanceOf(Array);
	});
});


