/**
 * Token Revocation (RFC 7009).
 *
 * Revoke an access token or refresh token at the revocation endpoint.
 * RFC 7009 returns 200 OK on success (no body).
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
	token: z.string().trim().describe('The token to revoke (access_token or refresh_token).'),
	tokenTypeHint: z
		.enum(['access_token', 'refresh_token'])
		.optional()
		.describe('Hint about the token type: access_token or refresh_token.'),
} as const;

const outputShape = {
	success: z.boolean(),
	revoked: z.boolean().optional(),
	message: z.string().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

const logger = new Logger('RevokeFlow');

export function registerRevokeTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_revoke_token',
		{
			description:
				'Token Revocation (RFC 7009). Revoke an access token or refresh token at the revocation endpoint. RFC 7009 returns 200 on success.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const revocationEndpoint = requireEndpoint(
					endpoints,
					'revocation_endpoint',
					'revocation endpoint'
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

				logger.info('POST revocation endpoint', {
					endpoint: revocationEndpoint,
					authMethod: parsed.authMethod ?? 'client_secret_post',
				});

				await axios.post(revocationEndpoint, params.toString(), {
					headers,
					timeout: 15000,
				});

				const structured = outputSchema.parse({
					success: true,
					revoked: true,
					message: 'Token revoked successfully.',
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text: 'Token revoked successfully.',
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_revoke_token failed', { error });
				return buildToolErrorResult('oauth_revoke_token', error);
			}
		}
	);
}
