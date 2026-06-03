/**
 * Token Introspection (RFC 7662).
 *
 * Query an introspection endpoint to obtain metadata about a token (active, expiration, scope, etc.).
 * Requires client authentication if the introspection endpoint enforces it.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import { applyClientAuth } from '../services/oauthClient.js';

const clientAuthShape = {
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	authMethod: z.enum(['client_secret_basic', 'client_secret_post', 'none']).optional(),
} as const;

const inputShape = {
	...providerInputShape,
	...clientAuthShape,
	token: z.string().trim().describe('The token to introspect (access_token or refresh_token).'),
	tokenTypeHint: z
		.enum(['access_token', 'refresh_token'])
		.optional()
		.describe('Hint about the token type: access_token or refresh_token.'),
} as const;

const outputShape = {
	success: z.boolean(),
	active: z.boolean().optional(),
	result: z.record(z.unknown()).optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

const logger = new Logger('IntrospectFlow');

export function registerIntrospectTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_introspect_token',
		{
			description:
				'Token Introspection (RFC 7662). Query an introspection endpoint to inspect token metadata (active status, expiration, scope, etc.). Requires client authentication if the endpoint enforces it.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const introspectionEndpoint = requireEndpoint(
					endpoints,
					'introspection_endpoint',
					'introspection endpoint'
				);

				const params = new URLSearchParams({
					token: parsed.token,
				});

				if (parsed.tokenTypeHint) {
					params.set('token_type_hint', parsed.tokenTypeHint);
				}

				const headers: Record<string, string> = {
					'Content-Type': 'application/x-www-form-urlencoded',
					Accept: 'application/json',
				};

				applyClientAuth(
					params,
					headers,
					parsed.clientId,
					parsed.clientSecret,
					parsed.authMethod ?? 'client_secret_post'
				);

				logger.info('POST introspection endpoint', {
					endpoint: introspectionEndpoint,
					authMethod: parsed.authMethod ?? 'client_secret_post',
				});

				const { data } = await axios.post<Record<string, unknown>>(
					introspectionEndpoint,
					params.toString(),
					{ headers, timeout: 15000 }
				);

				const active = typeof data.active === 'boolean' ? data.active : false;

				const structured = outputSchema.parse({
					success: true,
					active,
					result: data,
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text: `Token introspection succeeded. Token is ${active ? 'active' : 'inactive'}.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_introspect_token failed', { error });
				return buildToolErrorResult('oauth_introspect_token', error);
			}
		}
	);
}
