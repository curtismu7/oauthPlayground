/**
 * Pushed Authorization Request — RFC 9126.
 *
 * The client POSTs authorization parameters to the AS's PAR endpoint in advance,
 * receiving a request_uri. The authorization endpoint is then invoked with
 * ?client_id=...&request_uri=... instead of the full parameter set. This keeps
 * sensitive parameters off the browser front-channel and enables request signing.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import { resolveClientCredentials, applyClientAuth, defaultScope } from '../services/oauthClient.js';

const clientAuthShape = {
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	authMethod: z.enum(['client_secret_basic', 'client_secret_post', 'none']).optional(),
} as const;

const inputShape = {
	...providerInputShape,
	...clientAuthShape,
	redirectUri: z.string().trim().describe('Redirect URI registered with the authorization server.'),
	scope: z
		.string()
		.trim()
		.optional()
		.describe('Space-separated scopes; defaults to OAUTH_DEFAULT_SCOPE if omitted.'),
	state: z
		.string()
		.trim()
		.optional()
		.describe('Opaque state value for CSRF protection, returned at the redirect.'),
	responseType: z
		.string()
		.trim()
		.optional()
		.describe("OAuth response type; defaults to 'code'."),
	codeChallenge: z
		.string()
		.trim()
		.optional()
		.describe('PKCE code challenge (base64url-encoded SHA-256 of the code verifier).'),
	codeChallengeMethod: z
		.string()
		.trim()
		.optional()
		.describe("PKCE method; defaults to 'S256' when codeChallenge is present."),
	extraParams: z
		.record(z.string())
		.optional()
		.describe('Additional authorization parameters to include in the PAR body.'),
} as const;

const outputShape = {
	success: z.boolean(),
	requestUri: z.string().optional(),
	expiresIn: z.number().optional(),
	authorizationUrl: z.string().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

export function registerParTools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'oauth_pushed_authorization_request',
		{
			description:
				'Pushed Authorization Request (RFC 9126). POSTs authorization parameters to the AS PAR endpoint, receiving a request_uri. Use the request_uri at the authorization endpoint as: ?client_id=<client_id>&request_uri=<request_uri>. Keeps sensitive parameters off the browser front-channel and supports request signing.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const parEndpoint = requireEndpoint(
					endpoints,
					'pushed_authorization_request_endpoint',
					'PAR endpoint'
				);
				const creds = resolveClientCredentials({
					clientId: parsed.clientId,
					clientSecret: parsed.clientSecret,
					authMethod: parsed.authMethod,
				});

				const params = new URLSearchParams();
				const headers: Record<string, string> = {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				};

				// client_id is required in the PAR body so the AS can associate the request_uri
				if (creds.clientId) params.set('client_id', creds.clientId);

				params.set('response_type', parsed.responseType ?? 'code');
				params.set('redirect_uri', parsed.redirectUri);

				const scope = defaultScope(parsed.scope);
				if (scope) params.set('scope', scope);

				if (parsed.state) params.set('state', parsed.state);

				if (parsed.codeChallenge) {
					params.set('code_challenge', parsed.codeChallenge);
					params.set('code_challenge_method', parsed.codeChallengeMethod ?? 'S256');
				}

				if (parsed.extraParams) {
					for (const [key, value] of Object.entries(parsed.extraParams)) {
						params.set(key, value);
					}
				}

				applyClientAuth(params, headers, creds.clientId, creds.clientSecret, creds.authMethod);

				const { data } = await axios.post<Record<string, unknown>>(
					parEndpoint,
					params.toString(),
					{ headers, timeout: 15000 }
				);

				const rawExpiresIn = data.expires_in;
				const expiresIn =
					typeof rawExpiresIn === 'number'
						? rawExpiresIn
						: typeof rawExpiresIn === 'string'
							? parseInt(rawExpiresIn, 10)
							: undefined;

				const requestUri =
					typeof data.request_uri === 'string' ? data.request_uri : undefined;

				// Construct a ready-to-use authorization URL when both endpoint and request_uri are available
				const authEndpoint = endpoints.authorization_endpoint;
				let authorizationUrl: string | undefined;
				if (authEndpoint && requestUri && creds.clientId) {
					const authParams = new URLSearchParams({
						client_id: creds.clientId,
						request_uri: requestUri,
					});
					authorizationUrl = `${authEndpoint}?${authParams.toString()}`;
				}

				const structured = outputSchema.parse({
					success: true,
					requestUri,
					expiresIn: expiresIn != null && !Number.isNaN(expiresIn) ? expiresIn : undefined,
					authorizationUrl,
				}) as Record<string, unknown>;

				const summary = authorizationUrl
					? `PAR succeeded. Use the authorization endpoint with: ?client_id=${creds.clientId ?? ''}&request_uri=${requestUri ?? ''}. Ready-to-use URL: ${authorizationUrl}`
					: `PAR succeeded. Use request_uri at the authorization endpoint as: ?client_id=<client_id>&request_uri=${requestUri ?? 'N/A'}`;

				return {
					content: [{ type: 'text' as const, text: summary }],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_pushed_authorization_request failed', { error });
				return buildToolErrorResult('oauth_pushed_authorization_request', error);
			}
		}
	);
}
