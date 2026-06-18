// src/flows2/services/__tests__/implicitHybridService.test.ts
import { describe, expect, it } from 'vitest';
import {
	buildAuthorizeUrl,
	exchangeCode,
	mockFragment,
	parseFragment,
} from '../implicitHybridService';
import type { FlowCredentials } from '../../framework/types';

const creds: FlowCredentials = {
	environmentId: 'test-env-123',
	region: 'com',
	clientId: 'implicit-hybrid-client',
	clientSecret: 'implicit-hybrid-secret',
	scope: 'openid profile email',
};

// ── parseFragment ────────────────────────────────────────────────────────────

describe('parseFragment', () => {
	it('parses a fragment with a leading hash', () => {
		const result = parseFragment('#access_token=abc&token_type=Bearer&state=xyz');
		expect(result).toEqual({ access_token: 'abc', token_type: 'Bearer', state: 'xyz' });
	});

	it('parses a fragment without a leading hash', () => {
		const result = parseFragment('access_token=abc&token_type=Bearer&state=xyz');
		expect(result).toEqual({ access_token: 'abc', token_type: 'Bearer', state: 'xyz' });
	});

	it('parses a hybrid fragment with code and id_token', () => {
		const result = parseFragment('#code=my_code&id_token=my_id_token&state=s1');
		expect(result.code).toBe('my_code');
		expect(result.id_token).toBe('my_id_token');
		expect(result.state).toBe('s1');
	});

	it('returns an empty object for an empty fragment', () => {
		expect(parseFragment('')).toEqual({});
		expect(parseFragment('#')).toEqual({});
	});
});

// ── buildAuthorizeUrl ────────────────────────────────────────────────────────

describe('buildAuthorizeUrl', () => {
	it('builds an implicit URL with response_type=token (no OIDC)', () => {
		const url = buildAuthorizeUrl({
			credentials: creds,
			subMode: 'implicit',
			oidc: false,
			redirectUri: 'https://example.com/v2/flows/implicit-hybrid-callback',
			state: 'state-abc',
			nonce: 'nonce-xyz',
		});
		expect(url).toContain('response_type=token');
		expect(url).toContain('response_mode=fragment');
		expect(url).toContain(`client_id=${creds.clientId}`);
		expect(url).toContain('state=state-abc');
	});

	it('builds an OIDC implicit URL with response_type=id_token+token', () => {
		const url = buildAuthorizeUrl({
			credentials: creds,
			subMode: 'implicit',
			oidc: true,
			redirectUri: 'https://example.com/v2/flows/implicit-hybrid-callback',
			state: 'state-abc',
			nonce: 'nonce-xyz',
		});
		expect(url).toContain('response_type=id_token+token');
		expect(url).toContain('nonce=nonce-xyz');
	});

	it('builds a hybrid URL with response_type=code+id_token', () => {
		const url = buildAuthorizeUrl({
			credentials: creds,
			subMode: 'hybrid',
			oidc: true,
			redirectUri: 'https://example.com/v2/flows/implicit-hybrid-callback',
			state: 'state-abc',
			nonce: 'nonce-xyz',
		});
		expect(url).toContain('response_type=code+id_token');
		expect(url).toContain('response_mode=fragment');
	});
});

// ── mockFragment ─────────────────────────────────────────────────────────────

describe('mockFragment — implicit sub-mode', () => {
	it('returns an access_token for non-OIDC implicit', () => {
		const frag = mockFragment('implicit', false, 'state-1', 'nonce-1', creds);
		expect('access_token' in frag).toBe(true);
		if ('access_token' in frag) {
			expect(frag.access_token).toBeTruthy();
			expect(frag.token_type).toBe('Bearer');
			expect(frag.state).toBe('state-1');
			expect('id_token' in frag && frag.id_token).toBeFalsy();
		}
	});

	it('returns an access_token AND id_token for OIDC implicit', () => {
		const frag = mockFragment('implicit', true, 'state-2', 'nonce-2', creds);
		expect('access_token' in frag).toBe(true);
		if ('access_token' in frag) {
			expect(frag.access_token).toBeTruthy();
			expect(frag.id_token).toBeTruthy();
		}
	});
});

describe('mockFragment — hybrid sub-mode', () => {
	it('returns a code AND an id_token (no access_token in front channel)', () => {
		const frag = mockFragment('hybrid', true, 'state-3', 'nonce-3', creds);
		expect('code' in frag).toBe(true);
		if ('code' in frag) {
			expect(frag.code).toBeTruthy();
			expect(frag.id_token).toBeTruthy();
			expect(frag.state).toBe('state-3');
			// No access_token in the hybrid front-channel fragment
			expect('access_token' in frag).toBe(false);
		}
	});
});

// ── exchangeCode (mock path) ─────────────────────────────────────────────────

describe('exchangeCode — mock path (offline)', () => {
	it('resolves with access_token, id_token, and refresh_token', async () => {
		const result = await exchangeCode(
			{
				credentials: creds,
				redirectUri: 'https://example.com/v2/flows/implicit-hybrid-callback',
				code: 'mock_code_abc',
			},
			'mock'
		);
		expect(result.accessToken).toBeTruthy();
		expect(result.idToken).toBeTruthy();
		expect(result.refreshToken).toBeTruthy();
		expect(result.tokenType).toBe('Bearer');
		expect(result.raw).toBeDefined();
	});
});
