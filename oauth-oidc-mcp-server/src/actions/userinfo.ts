/**
 * OIDC UserInfo endpoint — OpenID Connect Core 1.0 §5.3.
 *
 * Fetches user claims from the userinfo endpoint using a valid access token.
 * Unlike token-endpoint flows, this is a GET request with Bearer auth.
 */

import axios from 'axios';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';

const inputShape = {
	...providerInputShape,
	accessToken: z.string().trim().describe('Access token to use for userinfo request.'),
} as const;

const outputShape = {
	success: z.boolean(),
	claims: z.record(z.unknown()).optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

const logger = new Logger('UserInfoFlow');

export function registerUserInfoTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_userinfo',
		{
			description:
				'OIDC UserInfo endpoint (OpenID Connect Core 1.0 §5.3). Fetches user identity claims using a valid access token.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const userInfoUrl = requireEndpoint(
					endpoints,
					'userinfo_endpoint',
					'userinfo endpoint'
				);

				logger.info('Fetching userinfo', { url: userInfoUrl });

				const { data } = await axios.get<Record<string, unknown>>(userInfoUrl, {
					headers: {
						Authorization: `Bearer ${parsed.accessToken}`,
						Accept: 'application/json',
					},
					timeout: 10000,
				});

				const structured = outputSchema.parse({
					success: true,
					claims: data,
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text: `UserInfo fetch succeeded: obtained ${Object.keys(data).length} claim(s).`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_userinfo failed', { error });
				return buildToolErrorResult('oauth_userinfo', error);
			}
		}
	);
}
