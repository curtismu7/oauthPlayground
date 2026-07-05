// src/flows2/content/learningPaths.ts
//
// The curriculum spine over the existing flows2 flows. Three ordered tracks, each a
// sequence of steps that deep-link to a real /v2/flows/* page, with 2–3 checkpoint
// questions between steps. This is declarative content only — the store
// (../services/learningProgress.ts) tracks which steps a learner has completed, and
// the UI (../learning/*) renders it.
//
// Checkpoint questions reuse the shape of the existing quiz content in
// src/services/v7EducationalContentService.ts ({ question, options, correctAnswer,
// explanation }); several are harvested directly from there, the rest authored to be
// spec-accurate. Every flowRoute below is a live route registered in App.tsx.

export interface Checkpoint {
	question: string;
	options: string[];
	/** Index into `options` of the correct answer. */
	correctAnswer: number;
	explanation: string;
}

export interface PathStep {
	/** Stable id, unique within the whole curriculum (used as the completion key). */
	id: string;
	/** A live /v2/flows/* route this step teaches. */
	flowRoute: string;
	title: string;
	/** One sentence: why this flow sits here in the sequence. */
	why: string;
	checkpoints: Checkpoint[];
}

export interface LearningPath {
	id: 'oauth-fundamentals' | 'oidc' | 'advanced-pingone';
	title: string;
	summary: string;
	/** Emoji marker for the track card. */
	icon: string;
	steps: PathStep[];
}

export const learningPaths: LearningPath[] = [
	{
		id: 'oauth-fundamentals',
		title: 'OAuth 2.0 Fundamentals',
		summary:
			'Start here. Learn the grant types that matter, from the simplest machine-to-machine call to the browser redirect flow every web app uses — then how tokens are refreshed, inspected, and revoked.',
		icon: '🔑',
		steps: [
			{
				id: 'fund-client-credentials',
				flowRoute: '/v2/flows/client-credentials',
				title: 'Client Credentials',
				why: 'The simplest grant — no user, no redirect. A service authenticates as itself to get an access token, so you can focus on the token endpoint before adding browser complexity.',
				checkpoints: [
					{
						question:
							'Which OAuth grant type is designed for machine-to-machine access with no user present?',
						options: ['authorization_code', 'client_credentials', 'password', 'implicit'],
						correctAnswer: 1,
						explanation:
							'The client_credentials grant lets a confidential client authenticate as itself (not on behalf of a user) to obtain an access token for its own resources.',
					},
					{
						question: 'Why does the client credentials flow never return an ID token?',
						options: [
							'ID tokens are deprecated',
							'There is no user to describe — the token represents the application itself',
							'The client secret replaces the ID token',
							'PingOne disables ID tokens for all flows',
						],
						correctAnswer: 1,
						explanation:
							'An ID token asserts facts about an authenticated user. Client credentials has no user, so only an access token is issued.',
					},
				],
			},
			{
				id: 'fund-authorization-code',
				flowRoute: '/v2/flows/authorization-code',
				title: 'Authorization Code + PKCE',
				why: 'The flow that matters most. The user authenticates at PingOne and returns with a one-time code, exchanged (with a PKCE verifier) for tokens — the secure default for web and mobile apps.',
				checkpoints: [
					{
						question: 'What is the primary purpose of the state parameter in OAuth 2.0?',
						options: [
							'To store user information',
							'To prevent CSRF attacks',
							'To encrypt the authorization code',
							'To validate the client credentials',
						],
						correctAnswer: 1,
						explanation:
							'The state parameter prevents CSRF by letting the client verify that the authorization response corresponds to the request it started.',
					},
					{
						question: 'What does PKCE (code_verifier / code_challenge) defend against?',
						options: [
							'Phishing of the user password',
							'Interception of the authorization code by a malicious app',
							'Token expiry',
							'Cross-origin requests',
						],
						correctAnswer: 1,
						explanation:
							'PKCE binds the authorization code to the client instance that started the flow, so a code intercepted on the redirect is useless without the matching verifier.',
					},
					{
						question: 'Which parameter is required in the authorization request for this flow?',
						options: ['scope', 'state', 'response_type', 'redirect_uri'],
						correctAnswer: 2,
						explanation:
							'response_type is required and must be "code" for the authorization code flow.',
					},
				],
			},
			{
				id: 'fund-refresh-token',
				flowRoute: '/v2/flows/refresh-token',
				title: 'Refresh Token',
				why: 'Access tokens are short-lived by design. A refresh token exchanges for a fresh access token without sending the user back through login — the mechanism behind staying signed in.',
				checkpoints: [
					{
						question: 'What is a refresh token used for?',
						options: [
							'To obtain a new access token without re-authenticating the user',
							'To encrypt the access token',
							'To identify the user to the resource server',
							'To register the client application',
						],
						correctAnswer: 0,
						explanation:
							'A refresh token is presented to the token endpoint (grant_type=refresh_token) to get a new access token when the old one expires, avoiding another user login.',
					},
					{
						question: 'Which scope must typically be requested to receive a refresh token?',
						options: ['openid', 'profile', 'offline_access', 'email'],
						correctAnswer: 2,
						explanation:
							'offline_access signals that the client wants a refresh token for continued access while the user is offline.',
					},
				],
			},
			{
				id: 'fund-token-introspection',
				flowRoute: '/v2/flows/token-introspection',
				title: 'Token Introspection',
				why: 'A resource server needs to know whether an access token is still valid and what it grants. RFC 7662 introspection answers that — the server side of the token lifecycle.',
				checkpoints: [
					{
						question: 'What does the RFC 7662 token introspection endpoint tell a resource server?',
						options: [
							'The user’s password',
							'Whether a token is active, plus its scope, expiry, and subject',
							'How to refresh the token',
							'The client secret',
						],
						correctAnswer: 1,
						explanation:
							'Introspection returns an "active" boolean and, when active, metadata such as scope, exp, sub, and client_id so the resource server can make an authorization decision.',
					},
				],
			},
			{
				id: 'fund-token-revocation',
				flowRoute: '/v2/flows/token-revocation',
				title: 'Token Revocation',
				why: 'Closing the loop: RFC 7009 lets a client proactively invalidate a token on logout or compromise, rather than waiting for it to expire.',
				checkpoints: [
					{
						question: 'Why revoke a token instead of just letting it expire?',
						options: [
							'Revocation makes the token last longer',
							'To immediately invalidate it on logout or suspected compromise',
							'Revocation is required before every API call',
							'It converts an access token into a refresh token',
						],
						correctAnswer: 1,
						explanation:
							'RFC 7009 revocation immediately invalidates a token so a leaked or logged-out token cannot be used for the remainder of its natural lifetime.',
					},
				],
			},
		],
	},
	{
		id: 'oidc',
		title: 'OpenID Connect',
		summary:
			'OAuth authorizes; OIDC authenticates. Layer identity on top of the code flow — discovery, the ID token and nonce, why implicit/hybrid are discouraged, and reading user claims from UserInfo.',
		icon: '🪪',
		steps: [
			{
				id: 'oidc-discovery',
				flowRoute: '/v2/flows/oidc-discovery',
				title: 'OIDC Discovery',
				why: 'Before any OIDC flow, a client discovers the provider’s endpoints and keys from a well-known document — so you never hardcode URLs and can verify token signatures.',
				checkpoints: [
					{
						question:
							'What does the OIDC discovery document (/.well-known/openid-configuration) provide?',
						options: [
							'The user’s profile data',
							'The provider’s endpoints, supported scopes, and JWKS URI for verifying tokens',
							'A list of registered users',
							'The client secret',
						],
						correctAnswer: 1,
						explanation:
							'Discovery publishes the authorization/token/userinfo endpoints, supported capabilities, and the jwks_uri used to fetch signing keys — so clients configure themselves dynamically.',
					},
				],
			},
			{
				id: 'oidc-authorization-code',
				flowRoute: '/v2/flows/authorization-code',
				title: 'Authorization Code with openid',
				why: 'The same code flow, now with the openid scope: PingOne returns an ID token (with a nonce you must verify) alongside the access token. This is authentication done right.',
				checkpoints: [
					{
						question: 'What is the primary purpose of the nonce parameter in OpenID Connect?',
						options: [
							'To prevent replay attacks by binding the ID token to the request',
							'To encrypt the ID token',
							'To store the user’s session',
							'To select the signing algorithm',
						],
						correctAnswer: 0,
						explanation:
							'The nonce is sent on the authorization request and returned unchanged inside the ID token; the client compares them to detect token replay.',
					},
					{
						question: 'Which scope is required to receive an ID token from an OIDC provider?',
						options: ['profile', 'openid', 'email', 'offline_access'],
						correctAnswer: 1,
						explanation:
							'The openid scope is what turns an OAuth authorization request into an OIDC one and gates issuance of the ID token.',
					},
				],
			},
			{
				id: 'oidc-implicit-hybrid',
				flowRoute: '/v2/flows/implicit-hybrid',
				title: 'Implicit & Hybrid (and why to avoid them)',
				why: 'Historically the browser got tokens straight from the authorization endpoint. Understand these flows — and why the code flow with PKCE has replaced them for security.',
				checkpoints: [
					{
						question: 'Why is the implicit flow discouraged in OAuth 2.1?',
						options: [
							'It is too slow',
							'Returning tokens in the URL fragment exposes them to interception and leakage',
							'It requires a client secret',
							'It does not support OIDC',
						],
						correctAnswer: 1,
						explanation:
							'Implicit returns access/ID tokens directly in the redirect fragment, where they can leak via history, referrer, or scripts. OAuth 2.1 removes it in favor of code + PKCE.',
					},
				],
			},
			{
				id: 'oidc-userinfo',
				flowRoute: '/v2/flows/userinfo',
				title: 'UserInfo',
				why: 'The ID token proves who signed in; the UserInfo endpoint returns fuller, up-to-date claims about them using the access token — where authentication becomes usable profile data.',
				checkpoints: [
					{
						question: 'What credential does a client present to the UserInfo endpoint?',
						options: ['The ID token', 'The access token', 'The client secret', 'The refresh token'],
						correctAnswer: 1,
						explanation:
							'UserInfo is an OAuth-protected resource: the client sends the access token as a Bearer token and receives claims about the authenticated user.',
					},
				],
			},
		],
	},
	{
		id: 'advanced-pingone',
		title: 'Advanced & PingOne',
		summary:
			'Where PingOne’s implementation is richest. Harden the request with PAR, bind tokens to a key with DPoP, exchange and delegate tokens, and handle input-constrained devices — the flows enterprises actually deploy.',
		icon: '🛡️',
		steps: [
			{
				id: 'adv-par',
				flowRoute: '/v2/flows/par',
				title: 'Pushed Authorization Requests (PAR)',
				why: 'Instead of putting authorization parameters in the browser URL, the client pushes them to PingOne over a back channel first and references them by handle — tamper-proofing the request.',
				checkpoints: [
					{
						question: 'What problem does Pushed Authorization Requests (RFC 9126) solve?',
						options: [
							'It speeds up token exchange',
							'It moves authorization parameters off the front channel so they can’t be tampered with or leaked in the URL',
							'It removes the need for a redirect URI',
							'It replaces PKCE',
						],
						correctAnswer: 1,
						explanation:
							'PAR has the client POST the authorization parameters directly to the AS, which returns a request_uri handle used at the authorize endpoint — the sensitive parameters never travel through the browser.',
					},
				],
			},
			{
				id: 'adv-dpop',
				flowRoute: '/v2/flows/dpop',
				title: 'DPoP — Sender-Constrained Tokens',
				why: 'A bearer token works for anyone who holds it. DPoP (RFC 9449) binds the token to a key the client proves it owns on every call, so a stolen token alone is useless.',
				checkpoints: [
					{
						question: 'What does DPoP (RFC 9449) add to an access token?',
						options: [
							'A longer expiry',
							'Sender-constraining — the token is bound to a client key that must be proven on each request',
							'Encryption of the payload',
							'A refresh capability',
						],
						correctAnswer: 1,
						explanation:
							'DPoP binds the token to a public key; the client signs a proof JWT per request, so an exfiltrated token cannot be replayed without the private key.',
					},
				],
			},
			{
				id: 'adv-token-exchange',
				flowRoute: '/v2/flows/token-exchange',
				title: 'Token Exchange',
				why: 'RFC 8693 lets one token be traded for another — impersonation and delegation across services, the backbone of secure microservice and API-gateway architectures.',
				checkpoints: [
					{
						question: 'What is a primary use of RFC 8693 token exchange?',
						options: [
							'Logging the user out',
							'Trading a token for another with different scope/audience for delegation across services',
							'Generating a client secret',
							'Discovering endpoints',
						],
						correctAnswer: 1,
						explanation:
							'Token exchange lets a service swap a subject token for one scoped to a downstream service (delegation/impersonation), so trust propagates without resharing the original credential.',
					},
				],
			},
			{
				id: 'adv-device-authorization',
				flowRoute: '/v2/flows/device-authorization',
				title: 'Device Authorization',
				why: 'TVs and CLIs have no browser or keyboard for a redirect. RFC 8628 lets the device show a code the user enters on their phone — OAuth for input-constrained hardware.',
				checkpoints: [
					{
						question: 'Why does the device authorization grant (RFC 8628) exist?',
						options: [
							'To make login faster on laptops',
							'To let input-constrained devices (TVs, CLIs) authorize via a code entered on a second device',
							'To avoid using access tokens',
							'To replace client credentials',
						],
						correctAnswer: 1,
						explanation:
							'The device flow shows a user_code and verification URL; the user completes login on a phone/laptop while the device polls the token endpoint — no redirect on the device itself.',
					},
				],
			},
			{
				id: 'adv-redirectless',
				flowRoute: '/v2/flows/redirectless',
				title: 'Redirectless (pi.flow)',
				why: 'PingOne’s pi.flow response mode runs the whole authentication as an API exchange with no browser redirect — powering fully custom, embedded login experiences.',
				checkpoints: [
					{
						question: 'What distinguishes a redirectless (pi.flow) authentication?',
						options: [
							'It skips authentication entirely',
							'The flow is driven through API calls with no browser redirect, enabling a fully custom UI',
							'It only works for machine-to-machine',
							'It removes the need for tokens',
						],
						correctAnswer: 1,
						explanation:
							'With PingOne’s pi.flow response mode the client orchestrates each authentication step via API responses instead of a browser redirect, so the app fully controls the login UI.',
					},
				],
			},
		],
	},
];

/** Flatten to a lookup of stepId -> { path, step } for progress math and routing. */
export function allPathSteps(): Array<{ path: LearningPath; step: PathStep }> {
	return learningPaths.flatMap((path) => path.steps.map((step) => ({ path, step })));
}

export function findPath(pathId: string): LearningPath | undefined {
	return learningPaths.find((p) => p.id === pathId);
}
