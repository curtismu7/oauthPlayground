// src/flows2/content/implicitHybridSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Implicit + Hybrid flow. Each entry pairs what
// the RFC/OIDC spec says against what PingOne specifically does. The through-line
// is that this flow is LEGACY: the OAuth 2.1 draft and the Security BCP (RFC 9700)
// remove the implicit grant entirely because fragment token delivery leaks tokens.
// Claims are kept conservative and factual; RFC/OIDC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const implicitHybridSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'response-type-mode',
		topic: 'response_type / response_mode',
		spec: 'The implicit grant uses response_type=token (and OIDC adds id_token, e.g. "id_token token"); the OIDC hybrid flow uses combinations such as "code id_token". With these response types the default response_mode is fragment, so the values are returned in the URL fragment.',
		specRef: 'RFC 6749 §4.2 / OIDC Core §3.2–§3.3',
		pingone:
			'PingOne issues an id_token and/or access_token in the fragment when the application requests an implicit or hybrid response_type and the app is registered for those grant/response types. The application must be configured to permit the specific response_type; requesting one the app is not enabled for is rejected.',
		note: 'The response_type an application may use is fixed by its PingOne grant-type configuration — you cannot request a broader response_type than the app was registered for.',
	},
	{
		id: 'fragment-token-delivery',
		topic: 'Fragment token delivery risks',
		spec: 'Returning tokens in the URL fragment exposes them to the browser: the fragment is retained in history, can leak via the Referer header, and is readable by any script running on the page. The Security BCP explicitly advises against issuing access tokens in the authorization response.',
		specRef: 'RFC 9700 §2.1.2 (OAuth 2.0 Security BCP)',
		pingone:
			'PingOne can deliver tokens in the fragment for backward compatibility, but its own guidance is to use Authorization Code + PKCE. There is no PingOne setting that makes fragment delivery safe — the exposure is inherent to the response mode, not the provider.',
		note: 'Never log full callback URLs and never place tokens in a query string; even the fragment survives in window.history until the app scrubs it.',
	},
	{
		id: 'nonce-required-implicit',
		topic: 'nonce required for an implicit id_token',
		spec: 'For any flow that returns an id_token from the authorization endpoint (implicit or hybrid), OIDC REQUIRES the nonce parameter. The AS binds it into the id_token nonce claim and the client MUST verify it to defend against id_token replay.',
		specRef: 'OIDC Core §3.2.2.1 / §3.2.2.11',
		pingone:
			'When an OIDC implicit/hybrid request includes nonce, PingOne binds it into the issued id_token so the client can verify equality. Because there is no code exchange to anchor the token, the nonce is the primary replay defense — omitting it removes the only check tying the id_token to this request.',
		note: 'Always send a fresh random nonce for OIDC implicit/hybrid and reject any id_token whose nonce claim does not match; a missing nonce should invalidate the token.',
	},
	{
		id: 'oauth21-removal',
		topic: 'OAuth 2.1 removal of implicit',
		spec: 'The OAuth 2.1 draft consolidates the specs and removes the implicit grant; the Security BCP recommends Authorization Code with PKCE for all client types, including SPAs and native apps, in place of implicit.',
		specRef: 'OAuth 2.1 draft §2.1.2 / RFC 9700 §2.1.2',
		pingone:
			'PingOne supports Authorization Code + PKCE for public clients (SPAs, native apps) — the recommended replacement. Implicit remains available for existing integrations but should not be adopted for new applications on PingOne.',
		note: 'Migrating from implicit to code + PKCE on PingOne is usually just a grant-type/response-type change on the app plus adding PKCE — no new backend is required for public clients.',
	},
	{
		id: 'pingone-response-type-support',
		topic: 'PingOne response_type support',
		spec: 'RFC 6749 and OIDC define the set of valid response_type values (code, token, id_token, and OIDC multi-value combinations). An AS returns unsupported_response_type when asked for a value it does not support for that client.',
		specRef: 'RFC 6749 §4.1.2.1 / §4.2.2.1',
		pingone:
			'PingOne validates the requested response_type against the application configuration. Requesting response_type=token for a client that is not enabled for the implicit grant (for example a public app intended for code + PKCE) yields an unsupported_response_type / invalid request error rather than tokens.',
		note: 'If you see unsupported_response_type, check the Grant Types and allowed response types on the PingOne application before changing the request.',
	},
];
