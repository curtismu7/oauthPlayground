// src/flows/content/useCases.ts
//
// Scenario-first catalog over the 16 flows2 flows. Each use case frames a flow
// as a real-world task and lists the concepts it teaches. Consumed by the
// /v2/use-cases page and the UseCaseBanner. Data only — no logic beyond two
// lookups. Scenario/lesson copy is spec-accurate; keep it aligned with the
// flow pages when they change.

export interface UseCaseTheme {
	id: string;
	title: string;
	blurb: string;
	order: number; // 1..7 display order
}

export interface UseCase {
	id: string; // stable; also the ?usecase= value
	themeId: string; // FK to UseCaseTheme.id
	title: string;
	scenario: string;
	lessons: string[];
	flowRoute: string;
}

export const useCaseThemes: UseCaseTheme[] = [
	{
		id: 'sign-users-in',
		title: 'Sign users in',
		blurb: 'Start here. Get a user logged in through the browser the right way.',
		order: 1,
	},
	{
		id: 'know-who',
		title: 'Know who signed in',
		blurb: 'The OAuth → OIDC bridge: turn an access grant into a verified identity.',
		order: 2,
	},
	{
		id: 'no-user',
		title: 'No user present',
		blurb: 'Machine-to-machine: services and jobs that authenticate as themselves.',
		order: 3,
	},
	{
		id: 'awkward-devices',
		title: 'Awkward devices',
		blurb: 'When there is no browser to redirect, or no redirect at all.',
		order: 4,
	},
	{
		id: 'token-lifecycle',
		title: 'Token lifecycle',
		blurb: 'What happens after you have tokens: refresh, validate, revoke.',
		order: 5,
	},
	{
		id: 'hardening',
		title: 'Hardening',
		blurb: 'Raise the security bar against token theft and request tampering.',
		order: 6,
	},
	{
		id: 'graveyard',
		title: 'The graveyard (why not)',
		blurb: 'Deprecated flows — learn the threat model by seeing what went wrong.',
		order: 7,
	},
];

export const useCases: UseCase[] = [
	// 1. Sign users in
	{
		id: 'spa-login',
		themeId: 'sign-users-in',
		title: 'Sign users into a single-page app',
		scenario:
			'A browser-only React/Vue/Angular app has no server to keep a secret. You need to log the user in and get tokens safely from the front end.',
		lessons: [
			'Authorization Code flow with PKCE (no client secret)',
			'Public vs confidential clients',
			'The state parameter defends against CSRF',
			'Front channel (browser redirect) vs back channel (token exchange)',
		],
		flowRoute: '/v2/flows/authorization-code',
	},
	{
		id: 'webapp-login',
		themeId: 'sign-users-in',
		title: 'Sign users into a server-rendered web app',
		scenario:
			'A traditional web app with a backend can hold a client secret. You want the same login, but exchange the code on the server.',
		lessons: [
			'Confidential clients authenticate the token request',
			'Client authentication methods (client_secret_post/basic)',
			'Why the code exchange belongs on the back channel',
		],
		flowRoute: '/v2/flows/authorization-code',
	},
	// 2. Know who signed in
	{
		id: 'discover-provider',
		themeId: 'know-who',
		title: "Discover a provider's OIDC configuration",
		scenario:
			'Before you can verify identities you need the provider\'s endpoints and signing keys — without hardcoding them.',
		lessons: [
			'The /.well-known/openid-configuration discovery document',
			'JWKS: how you fetch the keys that verify an ID token',
			'Endpoints resolved dynamically, not hardcoded',
		],
		flowRoute: '/v2/flows/oidc-discovery',
	},
	{
		id: 'user-identity',
		themeId: 'know-who',
		title: 'Get the signed-in user’s verified identity',
		scenario:
			'You have login working, but now you need to know WHO logged in — a trustworthy identity, not just an access token.',
		lessons: [
			'OAuth authorizes; OIDC authenticates',
			'ID token vs access token',
			'The openid scope and the nonce (replay defense)',
			'Scopes vs claims',
		],
		flowRoute: '/v2/flows/authorization-code',
	},
	{
		id: 'userinfo',
		themeId: 'know-who',
		title: 'Fetch profile claims after login',
		scenario:
			'You need the user’s name, email, or other profile attributes after they sign in.',
		lessons: [
			'The UserInfo endpoint',
			'UserInfo claims vs ID-token claims',
			'Presenting the access token as a bearer credential',
		],
		flowRoute: '/v2/flows/userinfo',
	},
	// 3. No user present
	{
		id: 'backend-api',
		themeId: 'no-user',
		title: 'A backend job calls an API',
		scenario:
			'A cron job or microservice needs to call an API. There is no user and no browser — the service authenticates as itself.',
		lessons: [
			'Client Credentials grant',
			'Machine identity: no user, no redirect, no consent',
			'Client authentication methods',
		],
		flowRoute: '/v2/flows/client-credentials',
	},
	{
		id: 'token-exchange',
		themeId: 'no-user',
		title: 'One service acts on behalf of another',
		scenario:
			'Service A holds a token and needs to call Service B as the same user, trading one token for another.',
		lessons: [
			'Token Exchange (RFC 8693)',
			'subject_token and delegation',
			'Impersonation vs delegation semantics',
		],
		flowRoute: '/v2/flows/token-exchange',
	},
	{
		id: 'saml-bearer',
		themeId: 'no-user',
		title: 'Bridge a SAML assertion to an OAuth token',
		scenario:
			'An existing SAML identity federation needs to obtain OAuth access tokens for newer APIs.',
		lessons: [
			'The SAML 2.0 bearer assertion grant',
			'Bridging legacy federation to OAuth',
		],
		flowRoute: '/v2/flows/saml-bearer',
	},
	// 4. Awkward devices
	{
		id: 'device-login',
		themeId: 'awkward-devices',
		title: 'Sign in on a TV, console, or CLI',
		scenario:
			'A device with no keyboard or browser (smart TV, game console, CLI tool) needs the user to log in on their phone instead.',
		lessons: [
			'Device Authorization grant',
			'User code and verification URI',
			'Polling the token endpoint until the user approves',
		],
		flowRoute: '/v2/flows/device-authorization',
	},
	{
		id: 'redirectless',
		themeId: 'awkward-devices',
		title: 'Native/embedded login without a browser redirect',
		scenario:
			'A native or embedded app wants to drive the login UI itself instead of handing off to a browser redirect.',
		lessons: [
			'PingOne pi.flow (redirectless) response handling',
			'Driving the flow without a redirect URI',
			'Trade-offs vs the standard redirect flow',
		],
		flowRoute: '/v2/flows/redirectless',
	},
	// 5. Token lifecycle
	{
		id: 'stay-signed-in',
		themeId: 'token-lifecycle',
		title: 'Keep a user signed in without re-prompting',
		scenario:
			'Access tokens expire quickly. You want the user to stay logged in without logging in again every few minutes.',
		lessons: [
			'Refresh tokens and refresh token rotation',
			'The offline_access scope',
			'Access-token expiry and renewal',
		],
		flowRoute: '/v2/flows/refresh-token',
	},
	{
		id: 'validate-token',
		themeId: 'token-lifecycle',
		title: 'Check whether a token is still valid',
		scenario:
			'A resource server receives a token and must decide whether it is active and what it grants.',
		lessons: [
			'Token Introspection endpoint',
			'Opaque tokens vs self-validating JWTs',
			'The active flag and returned metadata',
		],
		flowRoute: '/v2/flows/token-introspection',
	},
	{
		id: 'revoke-token',
		themeId: 'token-lifecycle',
		title: 'Kill a stolen or logged-out token',
		scenario:
			'A user logs out or a token leaks. You need to invalidate it immediately.',
		lessons: [
			'Token Revocation endpoint',
			'Revoking a token vs ending a session',
			'Effect on associated refresh tokens',
		],
		flowRoute: '/v2/flows/token-revocation',
	},
	// 6. Hardening
	{
		id: 'sender-constrain',
		themeId: 'hardening',
		title: 'Stop stolen tokens from being replayed',
		scenario:
			'A bearer token works for anyone who holds it. You want a token that only works for the client it was issued to.',
		lessons: [
			'DPoP sender-constraining (RFC 9449)',
			'Proof-of-possession keys',
			'Bearer vs sender-constrained tokens',
		],
		flowRoute: '/v2/flows/dpop',
	},
	{
		id: 'protect-request',
		themeId: 'hardening',
		title: 'Protect the authorization request itself',
		scenario:
			'Authorization parameters travel through the browser URL where they can be tampered with. You want to push them to the server first.',
		lessons: [
			'Pushed Authorization Requests (RFC 9126)',
			'Request confidentiality and integrity',
			'request_uri instead of front-channel parameters',
		],
		flowRoute: '/v2/flows/par',
	},
	// 7. The graveyard
	{
		id: 'implicit',
		themeId: 'graveyard',
		title: 'Why the Implicit flow is discouraged',
		scenario:
			'The Implicit flow returned tokens directly in the URL fragment. See why it has been replaced by Authorization Code + PKCE.',
		lessons: [
			'Tokens in the URL fragment leak easily',
			'No back channel means no client authentication',
			'Replaced by Authorization Code with PKCE',
		],
		flowRoute: '/v2/flows/implicit-hybrid',
	},
	{
		id: 'hybrid',
		themeId: 'graveyard',
		title: 'Why Hybrid exists and its trade-offs',
		scenario:
			'Hybrid mixes response types to get an ID token up front. Understand the front-channel risk it introduces.',
		lessons: [
			'Mixed response types (code id_token)',
			'Front-channel ID token exposure',
			'When (rarely) it is justified',
		],
		flowRoute: '/v2/flows/hybrid',
	},
	{
		id: 'ropc',
		themeId: 'graveyard',
		title: 'Why you should never collect passwords directly',
		scenario:
			'ROPC has the app take the user’s password directly. See why this defeats the point of OAuth.',
		lessons: [
			'The password anti-pattern',
			'No consent screen, no redirect protections',
			'No MFA or step-up possible',
		],
		flowRoute: '/v2/flows/ropc',
	},
];

export function getUseCase(id: string): UseCase | undefined {
	return useCases.find((u) => u.id === id);
}

export function useCasesByTheme(themeId: string): UseCase[] {
	return useCases.filter((u) => u.themeId === themeId);
}
