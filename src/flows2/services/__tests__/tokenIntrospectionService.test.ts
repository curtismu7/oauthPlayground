// src/flows2/services/__tests__/tokenIntrospectionService.test.ts
import { describe, expect, it } from 'vitest';
import {
	introspectionEndpointFor,
	tokenIntrospectionService,
} from '../tokenIntrospectionService';
import { decodeJwtPayload } from '../pingone';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'rs-client',
	clientSecret: 'rs-secret',
	authMethod: 'client_secret_post',
};

// Minimal unsigned JWTs (header.payload.) for offline decoding.
function jwt(payload: Record<string, unknown>): string {
	const b64 = (o: unknown) => btoa(JSON.stringify(o));
	return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`;
}

const now = Math.floor(Date.now() / 1000);

describe('tokenIntrospectionService — mock path (offline)', () => {
	it('reports a live token as active with its claims', async () => {
		const token = jwt({ sub: 'user-1', scope: 'openid profile', client_id: 'rs-client', exp: now + 3600, iat: now });
		const r = await tokenIntrospectionService.run({ credentials: creds, token }, 'mock');
		expect(r.active).toBe(true);
		expect(r.scope).toBe('openid profile');
		expect(r.sub).toBe('user-1');
		expect(r.token_type).toBe('Bearer');
	});

	it('answers ONLY { active: false } for an expired token (RFC 7662 §2.2)', async () => {
		const token = jwt({ sub: 'user-1', scope: 'openid', exp: now - 10 });
		const r = await tokenIntrospectionService.run({ credentials: creds, token }, 'mock');
		expect(r.active).toBe(false);
		expect(r.sub).toBeUndefined();
		expect(r.scope).toBeUndefined();
	});

	it('reports an opaque (non-JWT) token as inactive in mock mode', async () => {
		const r = await tokenIntrospectionService.run({ credentials: creds, token: 'opaque-token-xyz' }, 'mock');
		expect(r.active).toBe(false);
	});

	it('surfaces the act claim of a delegated token', async () => {
		const token = jwt({ sub: 'user-1', exp: now + 600, act: { sub: 'svc-1' } });
		const r = await tokenIntrospectionService.run({ credentials: creds, token }, 'mock');
		expect((r.act as Record<string, unknown>)?.sub).toBe('svc-1');
	});

	it('decodes a JWT locally and returns null for opaque tokens', () => {
		const token = jwt({ sub: 'user-1' });
		expect(decodeJwtPayload(token)?.sub).toBe('user-1');
		expect(decodeJwtPayload('opaque')).toBeNull();
	});

	it('builds the PingOne introspection endpoint with a normalized region', () => {
		expect(introspectionEndpointFor(creds)).toBe(
			'https://auth.pingone.com/test-env-123/as/introspect'
		);
		expect(introspectionEndpointFor({ ...creds, region: 'AP ' })).toBe(
			'https://auth.pingone.asia/test-env-123/as/introspect'
		);
	});
});
