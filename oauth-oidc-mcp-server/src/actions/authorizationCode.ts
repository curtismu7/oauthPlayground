/**
 * Authorization Code flow — RFC 6749 §4.1 + PKCE RFC 7636.
 *
 * Two tools:
 *   oauth_build_authorization_url  — construct the URL the user is redirected to (§4.1.1)
 *   oauth_exchange_authorization_code — swap the code for tokens at the token endpoint (§4.1.3)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import { postToken, resolveClientCredentials } from '../services/oauthClient.js';
import { generatePkcePair, randomString } from '../services/pkceService.js';

const clientAuthShape = {
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	authMethod: z.enum(['client_secret_basic', 'client_secret_post', 'none']).optional(),
} as const;

// ---------------------------------------------------------------------------
// oauth_build_authorization_url
// ---------------------------------------------------------------------------

const buildUrlInputShape = {
	...providerInputShape,
	clientId: z.string().trim().describe('OAuth 2.0 client_id (required for authorization URL).'),
	redirectUri: z
		.string()
		.trim()
		.describe('Redirect URI registered with the authorization server.'),
	scope: z.string().trim().optional().describe('Space-separated scopes to request.'),
	state: z
		.string()
		.trim()
		.optional()
		.describe('CSRF state token; a random value is generated when omitted (recommended).'),
	nonce: z
		.string()
		.trim()
		.optional()
		.describe('OIDC nonce to bind the ID token; a random value is generated when omitted.'),
	usePkce: z
		.boolean()
		.optional()
		.describe('Include PKCE code_challenge (RFC 7636). Defaults to true — strongly recommended.'),
	responseType: z
		.string()
		.trim()
		.optional()
		.describe('response_type parameter. Defaults to "code".'),
} as const;

const buildUrlOutputShape = {
	success: z.boolean(),
	authorizationUrl: z.string().optional().describe('The complete authorization URL to redirect to.'),
	codeVerifier: z
		.string()
		.optional()
		.describe('PKCE code_verifier — SAVE THIS; required to complete the code exchange.'),
	state: z.string().optional().describe('State value sent in the URL (generated if not supplied).'),
	nonce: z.string().optional().describe('Nonce value sent in the URL (generated if not supplied).'),
	codeChallenge: z.string().optional().describe('S256 code_challenge included in the URL.'),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const buildUrlOutputSchema = z.object(buildUrlOutputShape);

// ---------------------------------------------------------------------------
// oauth_exchange_authorization_code
// ---------------------------------------------------------------------------

const exchangeInputShape = {
	...providerInputShape,
	...clientAuthShape,
	code: z.string().trim().describe('Authorization code returned by the authorization server.'),
	redirectUri: z
		.string()
		.trim()
		.describe('Must exactly match the redirect_uri used when building the authorization URL.'),
	codeVerifier: z
		.string()
		.trim()
		.optional()
		.describe('PKCE code_verifier (required when PKCE was used to build the URL).'),
} as const;

const exchangeOutputShape = {
	success: z.boolean(),
	accessToken: z.string().optional(),
	tokenType: z.string().optional(),
	expiresIn: z.number().optional(),
	expiresAt: z.string().optional(),
	refreshToken: z.string().optional(),
	idToken: z.string().optional(),
	scope: z.string().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const exchangeOutputSchema = z.object(exchangeOutputShape);

// ---------------------------------------------------------------------------

const logger = new Logger('AuthorizationCodeFlow');

export function registerAuthorizationCodeTools(server: McpServer, _logger: Logger): void {
	// --- Tool 1: Build the authorization URL ---
	server.registerTool(
		'oauth_build_authorization_url',
		{
			description:
				'Build an OAuth 2.0 authorization URL (RFC 6749 §4.1.1) with optional PKCE (RFC 7636). ' +
				'Returns the URL to redirect the user to, plus the PKCE code_verifier — you MUST save ' +
				'the code_verifier to complete the exchange later. State and nonce are auto-generated ' +
				'when omitted.',
			inputSchema: buildUrlInputShape,
			outputSchema: buildUrlOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(buildUrlInputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const authorizationEndpoint = requireEndpoint(
					endpoints,
					'authorization_endpoint',
					'authorization endpoint'
				);

				const responseType = parsed.responseType ?? 'code';
				const state = parsed.state ?? randomString();
				const nonce = parsed.nonce ?? randomString();

				const params = new URLSearchParams();
				params.set('response_type', responseType);
				params.set('client_id', parsed.clientId);
				params.set('redirect_uri', parsed.redirectUri);
				params.set('state', state);
				params.set('nonce', nonce);
				if (parsed.scope) params.set('scope', parsed.scope);

				let codeVerifier: string | undefined;
				let codeChallenge: string | undefined;

				if (parsed.usePkce !== false) {
					const pkce = generatePkcePair();
					codeVerifier = pkce.codeVerifier;
					codeChallenge = pkce.codeChallenge;
					params.set('code_challenge', codeChallenge);
					params.set('code_challenge_method', 'S256');
				}

				const authorizationUrl = `${authorizationEndpoint}?${params.toString()}`;

				const structured = buildUrlOutputSchema.parse({
					success: true,
					authorizationUrl,
					codeVerifier,
					state,
					nonce,
					codeChallenge,
				}) as Record<string, unknown>;

				const pkceWarning = codeVerifier
					? '\n\nIMPORTANT: Save the returned codeVerifier — it is required to complete the ' +
					  'authorization code exchange. It cannot be recovered once lost.'
					: '';

				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Authorization URL built successfully. Redirect the user to authorizationUrl to begin the flow.${pkceWarning}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_build_authorization_url failed', { error });
				return buildToolErrorResult('oauth_build_authorization_url', error);
			}
		}
	);

	// --- Tool 2: Exchange the authorization code for tokens ---
	server.registerTool(
		'oauth_exchange_authorization_code',
		{
			description:
				'Exchange an authorization code for tokens (RFC 6749 §4.1.3). ' +
				'Provide the code returned by the authorization server and the redirect_uri used ' +
				'in the authorization request. Include codeVerifier when PKCE was used.',
			inputSchema: exchangeInputShape,
			outputSchema: exchangeOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(exchangeInputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const tokenEndpoint = requireEndpoint(endpoints, 'token_endpoint', 'token endpoint');
				const creds = resolveClientCredentials({
					clientId: parsed.clientId,
					clientSecret: parsed.clientSecret,
					authMethod: parsed.authMethod,
				});

				const params: Record<string, string> = {
					grant_type: 'authorization_code',
					code: parsed.code,
					redirect_uri: parsed.redirectUri,
				};

				if (parsed.codeVerifier) {
					params.code_verifier = parsed.codeVerifier;
				}

				const result = await postToken({
					tokenEndpoint,
					params,
					...creds,
				});

				const structured = exchangeOutputSchema.parse({
					success: true,
					accessToken: result.access_token,
					tokenType: result.token_type,
					expiresIn: result.expires_in,
					expiresAt: result.expires_at,
					refreshToken: result.refresh_token,
					idToken: result.id_token,
					scope: result.scope,
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Authorization code exchange succeeded: access_token obtained, expires in ${result.expires_in ?? 'N/A'} seconds.` +
								(result.refresh_token ? ' Refresh token included.' : '') +
								(result.id_token ? ' ID token included.' : ''),
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_exchange_authorization_code failed', { error });
				return buildToolErrorResult('oauth_exchange_authorization_code', error);
			}
		}
	);
}
