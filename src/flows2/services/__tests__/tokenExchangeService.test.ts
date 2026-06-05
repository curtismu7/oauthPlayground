// src/flows2/services/__tests__/tokenExchangeService.test.ts
import { describe, expect, it } from 'vitest';
import { tokenExchangeService } from '../tokenExchangeService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'actor-client',
	clientSecret: 'actor-secret',
	authMethod: 'client_secret_post',
};

// Minimal unsigned JWTs (header.payload.) for offline decoding.
function jwt(payload: Record<string, unknown>): string {
	const b64 = (o: unknown) => btoa(JSON.stringify(o));
	return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`;
}

const subjectWithMayAct = jwt({ sub: 'user-1', scope: 'openid profile', may_act: { sub: 'svc-1' } });
const actor = jwt({ sub: 'svc-1', client_id: 'actor-client' });

describe('tokenExchangeService — mock path (offline)', () => {
	it('exchanges a subject token and carries the act claim when delegating', async () => {
		const r = await tokenExchangeService.run(
			{ credentials: creds, subjectToken: subjectWithMayAct, actorToken: actor, requestedScopes: 'openid' },
			'mock'
		);
		expect(r.accessToken).toBeTruthy();
		expect(r.tokenType).toBe('Bearer');
		expect(r.scope).toBe('openid');
		expect((r.raw.act as Record<string, unknown>)?.sub).toBe('svc-1');
	});

	it('approves may_act when the subject names the actor', async () => {
		const v = await tokenExchangeService.validateMayAct(subjectWithMayAct, actor, 'mock');
		expect(v.valid).toBe(true);
		expect(v.actClaim?.sub).toBe('svc-1');
	});

	it('rejects may_act when the subject has no may_act claim', async () => {
		const subjectNoMayAct = jwt({ sub: 'user-1', scope: 'openid' });
		const v = await tokenExchangeService.validateMayAct(subjectNoMayAct, actor, 'mock');
		expect(v.valid).toBe(false);
		expect(v.error).toBe('invalid_request');
	});

	it('introspects the issued token as active', async () => {
		const r = await tokenExchangeService.run(
			{ credentials: creds, subjectToken: subjectWithMayAct },
			'mock'
		);
		const intro = await tokenExchangeService.introspect(r.accessToken as string, creds, 'mock');
		expect(intro.active).toBe(true);
		expect(intro.token_type).toBe('Bearer');
	});
});
