// src/flows2/content/parSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Pushed Authorization Request flow (RFC 9126).
// Each entry pairs what the RFC says against what PingOne specifically does — its
// environment-scoped /as/par endpoint, one-time request_uri semantics, client-auth
// requirement, and per-application enforcement. Claims are kept conservative and
// factual; RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const parSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'par-push-mechanism',
		topic: 'PAR push mechanism',
		spec: 'PAR defines a pushed authorization request endpoint. The client POSTs the authorization request parameters directly to this back-channel endpoint and receives a request_uri that it then uses at the authorization endpoint in place of the individual parameters.',
		specRef: 'RFC 9126 §2',
		pingone:
			'PingOne exposes the PAR endpoint per environment at https://auth.pingone.{region}/{environmentId}/as/par. The client POSTs the same parameters it would otherwise put on /as/authorize (response_type, client_id, redirect_uri, scope, state, code_challenge) and receives a request_uri in the JSON response.',
		note: 'Discover the exact endpoint from the environment metadata (pushed_authorization_request_endpoint) rather than hardcoding it.',
	},
	{
		id: 'request-uri-one-time',
		topic: 'request_uri one-time + short-lived',
		spec: 'The authorization server returns a request_uri and an expires_in. The request_uri is a reference to the stored request; it is short-lived and intended for a single use at the authorization endpoint.',
		specRef: 'RFC 9126 §2.2',
		pingone:
			'PingOne returns request_uri together with expires_in (seconds). The reference is single-use and expires after the returned TTL — replaying a consumed request_uri, or using one after it expires, fails at /as/authorize with invalid_request.',
		note: 'Push again to get a fresh request_uri if the user takes too long or you need to retry — never cache and reuse one.',
	},
	{
		id: 'no-front-channel-params',
		topic: 'Parameters must not also be in the authorize call',
		spec: 'When using a request_uri obtained via PAR, the client sends only client_id and request_uri to the authorization endpoint. The authorization request parameters are taken from the pushed request, not from the front-channel query string.',
		specRef: 'RFC 9126 §4',
		pingone:
			'PingOne builds the authorize URL as /as/authorize?client_id=…&request_uri=… only. The sensitive parameters (scope, redirect_uri, code_challenge) were committed at the PAR endpoint and are referenced by the opaque URI — they are not exposed or re-sent in the browser URL.',
		note: 'Duplicating parameters both in PAR and on the front channel is unnecessary and can be rejected; keep the authorize URL to client_id + request_uri.',
	},
	{
		id: 'par-client-auth',
		topic: 'Client authentication on the PAR endpoint',
		spec: 'The PAR endpoint is a token-endpoint-like back channel: the client authenticates to it using the same client authentication method it uses at the token endpoint. Requests without valid client authentication are rejected.',
		specRef: 'RFC 9126 §2',
		pingone:
			'PingOne requires the application to authenticate on the PAR endpoint using its configured Token Endpoint Authentication Method (client_secret_basic, client_secret_post, or private_key_jwt). A push missing or presenting invalid client credentials returns invalid_client.',
		note: 'PAR raises the bar for public clients: pushing a request still needs some form of client identification, which is why PAR pairs naturally with confidential clients and FAPI profiles.',
	},
	{
		id: 'pingone-par-enforcement',
		topic: 'PingOne PAR endpoint + requiring PAR per app',
		spec: 'PAR is RECOMMENDED in OAuth 2.1 and REQUIRED by FAPI 2.0. The metadata field require_pushed_authorization_requests lets a deployment mandate that an application use PAR for every authorization request.',
		specRef: 'RFC 9126 §6 / FAPI 2.0 Security Profile',
		pingone:
			'PingOne can require PAR on a per-application basis so the app is only permitted to start authorization via /as/par; a direct /as/authorize call with inline parameters is then refused. This is the setting to enable when hardening an app toward FAPI 2.0.',
		note: 'Turn on "require PAR" per application rather than globally, so legacy apps in the same environment are unaffected while sensitive apps are hardened.',
	},
];
