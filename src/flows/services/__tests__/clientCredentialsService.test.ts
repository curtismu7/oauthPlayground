// src/flows/services/__tests__/clientCredentialsService.test.ts
import { describe, expect, it } from 'vitest';
import { clientCredentialsService } from '../clientCredentialsService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'worker-client',
	clientSecret: 'worker-secret',
	scope: 'p1:read:user p1:read:device',
	authMethod: 'client_secret_basic',
};

describe('clientCredentialsService — mock path (offline)', () => {
	it('issues a token then introspects it as active', async () => {
		const token = await clientCredentialsService.run({ credentials: creds }, 'mock');
		expect(token.accessToken).toBeTruthy();
		expect(token.tokenType).toBe('Bearer');
		expect(token.scope).toBe('p1:read:user p1:read:device');

		const intro = await clientCredentialsService.introspect(
			token.accessToken as string,
			creds,
			'mock'
		);
		expect(intro.active).toBe(true);
		expect(intro.scope).toBe('p1:read:user p1:read:device');
		expect(intro.token_type).toBe('Bearer');
	});

	it('defaults the mock scope when none is supplied', async () => {
		const token = await clientCredentialsService.run(
			{ credentials: { ...creds, scope: '' } },
			'mock'
		);
		expect(token.scope).toBe('mock:read');
	});
});
