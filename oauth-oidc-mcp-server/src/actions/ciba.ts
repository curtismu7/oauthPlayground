/**
 * Client-Initiated Backchannel Authentication — OpenID Connect CIBA Core 1.0.
 *
 * Two tools:
 *   oauth_backchannel_authentication — initiates the backchannel auth request;
 *                                      returns an auth_req_id to poll with.
 *   oauth_poll_ciba_token            — polls the token endpoint until the user approves
 *                                      via their authentication device (e.g. push notification).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult, ConfigError } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import {
	postToken,
	resolveClientCredentials,
	applyClientAuth,
	defaultScope,
} from '../services/oauthClient.js';

const clientAuthShape = {
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	authMethod: z.enum(['client_secret_basic', 'client_secret_post', 'none']).optional(),
} as const;

// ── oauth_backchannel_authentication ──────────────────────────────────────────

const cibaAuthInputShape = {
	...providerInputShape,
	...clientAuthShape,
	scope: z
		.string()
		.trim()
		.optional()
		.describe('Space-separated scopes; defaults to OAUTH_DEFAULT_SCOPE if omitted.'),
	loginHint: z
		.string()
		.trim()
		.optional()
		.describe('Hint to identify the end user (e.g. email, phone number, username).'),
	loginHintToken: z
		.string()
		.trim()
		.optional()
		.describe('A token previously issued by the provider that identifies the end user.'),
	idTokenHint: z
		.string()
		.trim()
		.optional()
		.describe('An ID token issued by the provider, used to identify the end user.'),
	bindingMessage: z
		.string()
		.trim()
		.optional()
		.describe(
			'Human-readable identifier displayed on both the consumption and authentication devices to bind the two flows.'
		),
	requestedExpiry: z
		.number()
		.optional()
		.describe('Requested expiry for auth_req_id in seconds.'),
} as const;

const cibaAuthOutputShape = {
	success: z.boolean(),
	authReqId: z.string().optional(),
	expiresIn: z.number().optional(),
	interval: z.number().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const cibaAuthOutputSchema = z.object(cibaAuthOutputShape);

// ── oauth_poll_ciba_token ─────────────────────────────────────────────────────

const pollCibaInputShape = {
	...providerInputShape,
	...clientAuthShape,
	authReqId: z
		.string()
		.trim()
		.describe('auth_req_id received from oauth_backchannel_authentication.'),
} as const;

const pollCibaOutputShape = {
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

const pollCibaOutputSchema = z.object(pollCibaOutputShape);

// ── registration ──────────────────────────────────────────────────────────────

export function registerCibaTools(server: McpServer, logger: Logger): void {
	// Tool 1: CIBA backchannel authentication request
	server.registerTool(
		'oauth_backchannel_authentication',
		{
			description:
				'OpenID Connect CIBA backchannel authentication request. Initiates an out-of-band authentication flow where the user is contacted via a separate authentication device (e.g. push notification). Returns an auth_req_id to poll with oauth_poll_ciba_token. At least one of loginHint, loginHintToken, or idTokenHint is required.',
			inputSchema: cibaAuthInputShape,
			outputSchema: cibaAuthOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(cibaAuthInputShape).parse(args);

				if (!parsed.loginHint && !parsed.loginHintToken && !parsed.idTokenHint) {
					throw new ConfigError(
						'CIBA requires one of loginHint, loginHintToken, or idTokenHint'
					);
				}

				const endpoints = await resolveFromArgs(parsed);
				const backchannelEndpoint = requireEndpoint(
					endpoints,
					'backchannel_authentication_endpoint',
					'CIBA backchannel authentication endpoint'
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

				const scope = defaultScope(parsed.scope);
				if (scope) params.set('scope', scope);

				if (parsed.loginHint) params.set('login_hint', parsed.loginHint);
				if (parsed.loginHintToken) params.set('login_hint_token', parsed.loginHintToken);
				if (parsed.idTokenHint) params.set('id_token_hint', parsed.idTokenHint);
				if (parsed.bindingMessage) params.set('binding_message', parsed.bindingMessage);
				if (parsed.requestedExpiry != null)
					params.set('requested_expiry', String(parsed.requestedExpiry));

				// client_id required in body for CIBA (confidential client auth may also add it via applyClientAuth)
				if (creds.clientId) params.set('client_id', creds.clientId);

				applyClientAuth(params, headers, creds.clientId, creds.clientSecret, creds.authMethod);

				const { data } = await axios.post<Record<string, unknown>>(
					backchannelEndpoint,
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

				const rawInterval = data.interval;
				const interval =
					typeof rawInterval === 'number'
						? rawInterval
						: typeof rawInterval === 'string'
							? parseInt(rawInterval, 10)
							: undefined;

				const authReqId =
					typeof data.auth_req_id === 'string' ? data.auth_req_id : undefined;

				const structured = cibaAuthOutputSchema.parse({
					success: true,
					authReqId,
					expiresIn: expiresIn != null && !Number.isNaN(expiresIn) ? expiresIn : undefined,
					interval: interval != null && !Number.isNaN(interval) ? interval : undefined,
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text: `CIBA backchannel authentication initiated. auth_req_id: ${authReqId ?? 'N/A'}. Poll oauth_poll_ciba_token at the returned interval until the user approves on their authentication device.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_backchannel_authentication failed', { error });
				return buildToolErrorResult('oauth_backchannel_authentication', error);
			}
		}
	);

	// Tool 2: CIBA token poll
	server.registerTool(
		'oauth_poll_ciba_token',
		{
			description:
				'OpenID Connect CIBA token poll. Exchanges an auth_req_id for tokens using the CIBA grant (urn:openid:params:grant-type:ciba). Returns authorization_pending or slow_down until the user approves on their authentication device. Call this repeatedly at the interval returned by oauth_backchannel_authentication.',
			inputSchema: pollCibaInputShape,
			outputSchema: pollCibaOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(pollCibaInputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const tokenEndpoint = requireEndpoint(endpoints, 'token_endpoint', 'token endpoint');
				const creds = resolveClientCredentials({
					clientId: parsed.clientId,
					clientSecret: parsed.clientSecret,
					authMethod: parsed.authMethod,
				});

				const result = await postToken({
					tokenEndpoint,
					params: {
						grant_type: 'urn:openid:params:grant-type:ciba',
						auth_req_id: parsed.authReqId,
					},
					...creds,
				});

				const structured = pollCibaOutputSchema.parse({
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
							text: `CIBA token obtained: access_token received, expires in ${result.expires_in ?? 'N/A'} seconds.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_poll_ciba_token failed', { error });
				return buildToolErrorResult('oauth_poll_ciba_token', error);
			}
		}
	);
}
