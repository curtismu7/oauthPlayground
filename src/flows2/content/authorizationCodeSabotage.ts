// src/flows2/content/authorizationCodeSabotage.ts
//
// Break-it Lab scenarios for the Authorization Code (+ PKCE) flow. Each scenario names a
// single security parameter to sabotage, the error a real PingOne authorization/token
// endpoint returns in response (RFC 6749 §4.1.2.1 authorization errors and §5.2 token
// errors), and the property that failure proves. Keep ids in sync with the mutation
// registry in ../framework/sabotage.ts.

import type { SabotageScenario } from '../framework/sabotage';

export const authorizationCodeSabotageScenarios: SabotageScenario[] = [
	{
		id: 'tamper-state',
		label: 'Tamper the state parameter',
		stage: 'authorize',
		what: 'Sends a different state on the authorization request than the one stored in the session.',
		expectedError: {
			error: 'state_mismatch',
			error_description:
				'The state returned by the authorization server does not match the value stored before the redirect. The client rejects the response as a possible CSRF / forgery.',
		},
		defends:
			'state binds the authorization response to the session that started it, so a forged callback injected by an attacker is rejected — the OAuth CSRF defense.',
		severity: 'csrf',
	},
	{
		id: 'wrong-verifier',
		label: 'Present the wrong PKCE code_verifier',
		stage: 'exchange',
		what: 'Sends a code_verifier at the token endpoint that does not hash to the code_challenge sent at authorize.',
		expectedError: {
			error: 'invalid_grant',
			error_description:
				'PKCE verification failed: the code_verifier does not match the code_challenge presented on the authorization request.',
			status: 400,
		},
		defends:
			'PKCE proves the client redeeming the code is the same one that began the flow, so an intercepted authorization code is useless without the original code_verifier.',
		severity: 'code-interception',
	},
	{
		id: 'drop-pkce',
		label: 'Drop PKCE entirely (public client)',
		stage: 'authorize',
		what: 'Removes code_challenge / code_challenge_method from the authorization request on a public / OAuth 2.1 client that enforces PKCE.',
		expectedError: {
			error: 'invalid_request',
			error_description:
				'code_challenge is required for this client. PKCE is enforced, so the authorization request is rejected before a code is issued.',
			status: 400,
		},
		defends:
			'Enforcing PKCE on public clients means a stolen authorization code can never be exchanged — the missing code_challenge is rejected up front.',
		severity: 'code-interception',
	},
	{
		id: 'reuse-code',
		label: 'Replay an already-used authorization code',
		stage: 'exchange',
		what: 'Submits an authorization code that has already been exchanged once for tokens.',
		expectedError: {
			error: 'invalid_grant',
			error_description:
				'The authorization code has already been used. Codes are single-use; a second exchange is treated as a replay attack and any tokens issued from the code may be revoked.',
			status: 400,
		},
		defends:
			'Single-use authorization codes mean a code captured and replayed by an attacker is rejected — the first legitimate exchange consumes it.',
		severity: 'replay',
		simulateOnly: true,
	},
	{
		id: 'tamper-redirect-uri',
		label: 'Change redirect_uri at token exchange',
		stage: 'exchange',
		what: 'Sends a redirect_uri to the token endpoint that differs from the one used on the authorization request.',
		expectedError: {
			error: 'invalid_grant',
			error_description:
				'redirect_uri does not match the value used in the authorization request that issued this code.',
			status: 400,
		},
		defends:
			'Binding the token exchange to the exact redirect_uri stops a confused-deputy attack where a code is redeemed against an attacker-controlled callback.',
		severity: 'confused-deputy',
	},
];
