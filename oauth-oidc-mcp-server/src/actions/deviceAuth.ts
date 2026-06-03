/**
 * Device Authorization Grant — RFC 8628.
 *
 * Two tools:
 *   oauth_device_authorization — §3.1: request device_code + user_code from the AS.
 *   oauth_poll_device_token    — §3.4: poll the token endpoint until the user approves.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
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

// ── oauth_device_authorization ────────────────────────────────────────────────

const deviceAuthInputShape = {
	...providerInputShape,
	...clientAuthShape,
	scope: z
		.string()
		.trim()
		.optional()
		.describe('Space-separated scopes; defaults to OAUTH_DEFAULT_SCOPE if omitted.'),
} as const;

const deviceAuthOutputShape = {
	success: z.boolean(),
	deviceCode: z.string().optional(),
	userCode: z.string().optional(),
	verificationUri: z.string().optional(),
	verificationUriComplete: z.string().optional(),
	expiresIn: z.number().optional(),
	interval: z.number().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const deviceAuthOutputSchema = z.object(deviceAuthOutputShape);

// ── oauth_poll_device_token ───────────────────────────────────────────────────

const pollDeviceInputShape = {
	...providerInputShape,
	...clientAuthShape,
	deviceCode: z.string().trim().describe('device_code received from oauth_device_authorization.'),
} as const;

const pollDeviceOutputShape = {
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

const pollDeviceOutputSchema = z.object(pollDeviceOutputShape);

// ── registration ──────────────────────────────────────────────────────────────

export function registerDeviceAuthTools(server: McpServer, logger: Logger): void {
	// Tool 1: RFC 8628 §3.1 — request device code
	server.registerTool(
		'oauth_device_authorization',
		{
			description:
				'Device Authorization Grant (RFC 8628 §3.1). Requests a device_code and user_code from the authorization server. The user visits the verification_uri and enters the user_code to authorize the device.',
			inputSchema: deviceAuthInputShape,
			outputSchema: deviceAuthOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(deviceAuthInputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const deviceAuthEndpoint = requireEndpoint(
					endpoints,
					'device_authorization_endpoint',
					'device authorization endpoint'
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

				// Many providers require client_id in the body for device flow regardless of
				// auth method; always set it explicitly before applyClientAuth so it is present.
				if (creds.clientId) params.set('client_id', creds.clientId);

				applyClientAuth(params, headers, creds.clientId, creds.clientSecret, creds.authMethod);

				const { data } = await axios.post<Record<string, unknown>>(
					deviceAuthEndpoint,
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

				const structured = deviceAuthOutputSchema.parse({
					success: true,
					deviceCode:
						typeof data.device_code === 'string' ? data.device_code : undefined,
					userCode: typeof data.user_code === 'string' ? data.user_code : undefined,
					verificationUri:
						typeof data.verification_uri === 'string'
							? data.verification_uri
							: undefined,
					verificationUriComplete:
						typeof data.verification_uri_complete === 'string'
							? data.verification_uri_complete
							: undefined,
					expiresIn: expiresIn != null && !Number.isNaN(expiresIn) ? expiresIn : undefined,
					interval: interval != null && !Number.isNaN(interval) ? interval : undefined,
				}) as Record<string, unknown>;

				const userCode = typeof data.user_code === 'string' ? data.user_code : 'N/A';
				const verificationUri =
					typeof data.verification_uri === 'string' ? data.verification_uri : 'N/A';

				return {
					content: [
						{
							type: 'text' as const,
							text: `Device authorization initiated. Visit ${verificationUri} and enter user code: ${userCode}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_device_authorization failed', { error });
				return buildToolErrorResult('oauth_device_authorization', error);
			}
		}
	);

	// Tool 2: RFC 8628 §3.4 — poll token endpoint
	server.registerTool(
		'oauth_poll_device_token',
		{
			description:
				'Device Authorization Grant (RFC 8628 §3.4). Polls the token endpoint with a device_code. Returns authorization_pending or slow_down until the user approves, then returns the access token. Call this repeatedly at the interval returned by oauth_device_authorization.',
			inputSchema: pollDeviceInputShape,
			outputSchema: pollDeviceOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(pollDeviceInputShape).parse(args);
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
						grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
						device_code: parsed.deviceCode,
					},
					...creds,
				});

				const structured = pollDeviceOutputSchema.parse({
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
							text: `Device token obtained: access_token received, expires in ${result.expires_in ?? 'N/A'} seconds.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_poll_device_token failed', { error });
				return buildToolErrorResult('oauth_poll_device_token', error);
			}
		}
	);
}
