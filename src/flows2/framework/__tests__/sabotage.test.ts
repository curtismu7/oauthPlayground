// src/flows2/framework/__tests__/sabotage.test.ts
import { describe, expect, it } from 'vitest';
import { applyAuthzCodeSabotage } from '../sabotage';
import { authorizationCodeSabotageScenarios } from '../../content/authorizationCodeSabotage';

const authorizeParams = {
	state: 'original-state-uuid',
	nonce: 'original-nonce',
	codeChallenge: 'original-challenge',
	redirectUri: 'https://localhost:3000/callback',
};

const exchangeParams = {
	code: 'auth-code-123',
	codeVerifier: 'original-verifier',
	redirectUri: 'https://localhost:3000/callback',
};

describe('applyAuthzCodeSabotage', () => {
	it('tamper-state changes only the state on the authorize request', () => {
		const out = applyAuthzCodeSabotage('tamper-state', 'authorize', authorizeParams);
		expect(out.state).not.toBe(authorizeParams.state);
		expect(out.nonce).toBe(authorizeParams.nonce);
		expect(out.codeChallenge).toBe(authorizeParams.codeChallenge);
	});

	it('wrong-verifier changes the codeVerifier on the exchange request', () => {
		const out = applyAuthzCodeSabotage('wrong-verifier', 'exchange', exchangeParams);
		expect(out.codeVerifier).not.toBe(exchangeParams.codeVerifier);
		expect(out.code).toBe(exchangeParams.code);
	});

	it('drop-pkce removes the PKCE params from the authorize request', () => {
		const out = applyAuthzCodeSabotage('drop-pkce', 'authorize', authorizeParams);
		expect('codeChallenge' in out).toBe(false);
		expect(out.state).toBe(authorizeParams.state);
	});

	it('returns the identical params reference for an unknown id', () => {
		const out = applyAuthzCodeSabotage('does-not-exist', 'authorize', authorizeParams);
		expect(out).toBe(authorizeParams);
	});

	it('returns params unchanged when the id targets a different stage', () => {
		// tamper-state is an authorize scenario; asking for it at the exchange stage is a no-op.
		const out = applyAuthzCodeSabotage('tamper-state', 'exchange', exchangeParams);
		expect(out).toBe(exchangeParams);
	});

	it('returns params unchanged for a simulateOnly scenario (reuse-code)', () => {
		const out = applyAuthzCodeSabotage('reuse-code', 'exchange', exchangeParams);
		expect(out).toBe(exchangeParams);
	});

	it('returns params unchanged when no scenario is selected (null)', () => {
		const out = applyAuthzCodeSabotage(null, 'authorize', authorizeParams);
		expect(out).toBe(authorizeParams);
	});

	it('content scenarios stay in sync: every simulateOnly scenario is a no-op mutation', () => {
		for (const s of authorizationCodeSabotageScenarios) {
			if (!s.simulateOnly) continue;
			const params = { code: 'c', codeVerifier: 'v', redirectUri: 'r' };
			expect(applyAuthzCodeSabotage(s.id, s.stage, params)).toBe(params);
		}
	});
});
