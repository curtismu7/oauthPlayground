// src/flows2/content/tokenExchangeSpecVsPingOne.ts
//
// "Spec vs PingOne" entries for the Token Exchange flow (RFC 8693). Each entry pairs
// what the spec defines for trading one token for another with what PingOne specifically
// does — notably that PingOne issues exchanged tokens for custom resources and enforces
// the subject's may_act rule for delegation. Claims are kept conservative and factual;
// RFC sections are cited in specRef.

import type { SpecVsPingOneEntry } from '../framework/SpecVsPingOne';

export const tokenExchangeSpecVsPingOne: SpecVsPingOneEntry[] = [
	{
		id: 'exchange-request-params',
		topic: 'Token exchange request parameters',
		spec: 'The client POSTs grant_type=urn:ietf:params:oauth:grant-type:token-exchange to the token endpoint with a subject_token and its subject_token_type. Optional parameters include requested_token_type, resource/audience (the intended relying party), scope, and actor_token / actor_token_type for delegation.',
		specRef: 'RFC 8693 §2.1',
		pingone:
			'PingOne accepts the token-exchange grant at its environment-scoped /as/token endpoint. This playground sends the subject_token plus optional requested scopes and an audience/resource indicator; the requesting client authenticates with its own credentials. The BFF assembles the request so the browser never handles the client secret directly.',
		note: 'subject_token_type must accurately describe the token you are presenting (e.g. urn:ietf:params:oauth:token-type:access_token) — a mismatch is rejected as invalid_request.',
	},
	{
		id: 'impersonation-vs-delegation',
		topic: 'Impersonation vs delegation',
		spec: 'Without an actor_token the exchange is impersonation: the issued token represents the subject alone. Supplying an actor_token requests delegation: the issued token carries an act claim naming the actor acting on the subject’s behalf, and the subject’s may_act claim governs whether that actor is permitted.',
		specRef: 'RFC 8693 §1.1 / §4.1',
		pingone:
			'PingOne enforces delegation through the subject token’s may_act claim: when an actor_token is supplied, the BFF validates that the subject’s may_act names the actor before issuing a token with an act claim. If may_act is absent or does not match the actor, delegation is refused.',
		note: 'Use the "Validate delegation (may_act)" action to see exactly why a delegation is approved or rejected before running the exchange.',
	},
	{
		id: 'issued-token-type',
		topic: 'issued_token_type in the response',
		spec: 'The response is a token-exchange response whose issued_token_type names the type of the returned security token (for example urn:ietf:params:oauth:token-type:access_token). token_type describes how the token is used (e.g. Bearer). The client must read issued_token_type rather than assume it.',
		specRef: 'RFC 8693 §2.2.1',
		pingone:
			'PingOne returns the exchanged token with an issued_token_type indicating an access token and token_type=Bearer. When delegation was approved the decoded token carries an act claim recording the delegation chain, which the Inspect step surfaces via RFC 7662 introspection.',
		note: 'Do not hardcode the returned token type — branch on issued_token_type so the flow still works if the server returns a different type.',
	},
	{
		id: 'audience-resource',
		topic: 'Audience / resource targeting',
		spec: 'The optional resource and audience parameters (RFC 8707) let the client name the protected resource the issued token is intended for, so the authorization server can scope and audience-restrict the new token. Requesting a target the subject is not entitled to is rejected with invalid_target.',
		specRef: 'RFC 8693 §2.1 / RFC 8707',
		pingone:
			'PingOne token exchange issues tokens for custom resources defined in the environment. The audience/resource must correspond to a resource the requesting client and subject are authorized for; an unauthorized target is refused rather than silently broadened.',
		note: 'PingOne only mints exchanged tokens for custom resources — target the correct custom-resource audience, not PingOne’s own management API.',
	},
	{
		id: 'pingone-constraints',
		topic: 'PingOne support and constraints',
		spec: 'RFC 8693 is an OAuth extension grant; a server advertises support by listing the token-exchange grant type in its metadata. Clients should not assume every environment enables it.',
		specRef: 'RFC 8693 §2',
		pingone:
			'Token exchange must be enabled on the PingOne environment/application and, in practice, issues tokens scoped to custom resources with delegation gated by may_act. This playground defaults the requested scope to a custom-resource scope for that reason; confirm the grant is enabled on your application before relying on it.',
		note: 'If the exchange returns unsupported_grant_type, the token-exchange grant is not enabled on that application — enable it in the PingOne admin console.',
	},
];
