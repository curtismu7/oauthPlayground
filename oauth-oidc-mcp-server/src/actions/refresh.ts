/**
 * Refresh token flow — RFC 6749 §6.
 *
 * Exchanges a refresh token for a new access token (and optionally a new refresh token).
 * Used to obtain fresh credentials without re-authenticating the user.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import {
	postToken,
	resolveClientCredentials,
	defaultScope,
} from '../services/oauthClient.js';

const clientAuthShape = {
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	authMethod: z.enum(['client_secret_basic', 'client_secret_post', 'none']).optional(),
} as const;

const inputShape = {
	...providerInputShape,
	...clientAuthShape,
	refreshToken: z.string().trim().describe('Refresh token to exchange.'),
	scope: z
		.string()
		.trim()
		.optional()
		.describe(
			'Optional scope to request (must be subset of original); defaults to OAUTH_DEFAULT_SCOPE if omitted.'
		),
} as const;

const outputShape = {
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

const outputSchema = z.object(outputShape);

const logger = new Logger('RefreshFlow');

export function registerRefreshTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_refresh_token',
		{
			description:
				'Refresh token flow (RFC 6749 §6). Exchanges a refresh token for a new access token.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const tokenEndpoint = requireEndpoint(
					endpoints,
					'token_endpoint',
					'token endpoint'
				);
				const creds = resolveClientCredentials({
					clientId: parsed.clientId,
					clientSecret: parsed.clientSecret,
					authMethod: parsed.authMethod,
				});

				const params: Record<string, string> = {
					grant_type: 'refresh_token',
					refresh_token: parsed.refreshToken,
				};

				const scope = defaultScope(parsed.scope);
				if (scope) {
					params.scope = scope;
				}

				const result = await postToken({
					tokenEndpoint,
					params,
					...creds,
				});

				const structured = outputSchema.parse({
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
							text: `Refresh succeeded: new access_token obtained, expires in ${result.expires_in ?? 'N/A'} seconds.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_refresh_token failed', { error });
				return buildToolErrorResult('oauth_refresh_token', error);
			}
		}
	);
}
