// src/flows2/content/refreshTokenSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Refresh Token grant (RFC 6749 §6 /
// OAuth 2.1 §4.3). Each entry pairs what the RFC says with what PingOne
// specifically does — its environment-scoped token endpoint, the offline_access
// requirement for issuing a refresh token, and refresh-token rotation. Claims are
// kept conservative and factual; RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const refreshTokenSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'refresh-grant',
		topic: 'refresh_token grant',
		spec: 'If the authorization server issued a refresh token, the client may present it with grant_type=refresh_token to obtain a new access token (and optionally a new refresh token) without involving the resource owner again.',
		specRef: 'RFC 6749 §6',
		pingone:
			'PingOne exchanges the refresh_token at the environment-scoped token endpoint https://auth.pingone.{region}/{environmentId}/as/token. The application must be configured with the Refresh Token grant enabled; the response carries a new access_token and, with rotation on, a new refresh_token.',
		note: 'Enable the Refresh Token grant on the PingOne application, and set the Refresh Token Duration so the token has a lifetime before it expires.',
	},
	{
		id: 'offline-access',
		topic: 'Getting a refresh token (offline_access)',
		spec: 'A refresh token is only returned if the authorization server chooses to issue one. In OpenID Connect the offline_access scope is the standard signal that the client wants a refresh token usable while the user is away.',
		specRef: 'RFC 6749 §1.5 / OIDC Core §11',
		pingone:
			'PingOne issues a refresh_token when the originating flow requested it — the application must have the Refresh Token grant enabled and the request must include a qualifying scope (offline_access, or openid where the app is configured to return a refresh token). No qualifying scope, no refresh_token to exchange here.',
		note: 'This flow only exchanges a refresh_token; obtain one first from the Authorization Code or Device flow with offline_access.',
	},
	{
		id: 'client-authentication',
		topic: 'Client authentication on refresh',
		spec: 'A confidential client MUST authenticate when refreshing. Public clients do not authenticate but MUST be bound another way — OAuth 2.1 requires PKCE for public clients and sender-constraining or rotation for their refresh tokens.',
		specRef: 'RFC 6749 §6 / OAuth 2.1 §4.3',
		pingone:
			'PingOne authenticates confidential apps at the token endpoint with the configured method (client_secret_basic or client_secret_post). A wrong or missing secret is rejected with invalid_client (HTTP 401). Public clients present no secret and rely on rotation/PKCE binding instead.',
		note: 'The Break-it Lab reproduces the invalid_client rejection by corrupting the client_secret on the refresh request.',
	},
	{
		id: 'rotation',
		topic: 'Refresh token rotation',
		spec: 'OAuth 2.1 requires that refresh tokens for public clients either be sender-constrained or rotated: on each use the server issues a new refresh token and invalidates the previous one, bounding the lifetime of a stolen token to a single use.',
		specRef: 'OAuth 2.1 §4.3.1',
		pingone:
			'PingOne supports refresh-token rotation: when enabled, each successful exchange returns a NEW refresh_token and the submitted one becomes invalid immediately. This flow compares the submitted and returned tokens and flags whether rotation occurred.',
		note: 'If the returned refresh_token equals the submitted one, rotation is off for the app — check the application’s refresh-token settings in PingOne.',
	},
	{
		id: 'reuse-revocation',
		topic: 'Reused-token revocation',
		spec: 'The security best-current-practice recommends that if a rotated (already-used) refresh token is presented again, the authorization server treat it as a compromise signal and revoke the entire refresh-token family for that grant.',
		specRef: 'draft-ietf-oauth-security-topics §4.14',
		pingone:
			'When rotation is enabled, replaying a rotated-away refresh_token is rejected with invalid_grant; PingOne can revoke the associated grant so neither the attacker nor the legitimate client can continue to refresh — forcing a fresh authorization.',
		note: 'Reuse detection is what makes rotation valuable — always discard the old token the instant a new one is returned.',
	},
	{
		id: 'scope-narrowing',
		topic: 'scope on refresh',
		spec: 'The refresh request MAY include scope, but the requested scope MUST NOT include any scope not originally granted; the server may issue an access token with the same or a narrower scope, never a broader one.',
		specRef: 'RFC 6749 §6',
		pingone:
			'PingOne honors a scope parameter on refresh only as a narrowing of what was originally granted. Requesting a scope beyond the original grant is rejected with invalid_scope; omitting scope reuses the originally granted set.',
		note: 'Use scope on refresh to down-scope a token for a specific call — never expect to gain new access this way.',
	},
];
