/**
 * MCP tool: PingOne token introspection (RFC 7662).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { introspectToken, type IntrospectResult } from '../services/pingoneIntrospectClient.js';

const inputShape = {
	environmentId: z.string().trim().optional(),
	token: z.string().trim().min(1, 'token is required'),
	tokenTypeHint: z.enum(['access_token', 'refresh_token']).optional(),
} as const;

const outputShape = {
	success: z.boolean(),
	active: z.boolean().optional(),
	scope: z.string().optional(),
	client_id: z.string().optional(),
	username: z.string().optional(),
	token_type: z.string().optional(),
	exp: z.number().optional(),
	iat: z.number().optional(),
	sub: z.string().optional(),
	raw: z.record(z.unknown()).optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

export function registerIntrospectTools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'pingone_introspect_token',
		{
			description:
				'Introspect a PingOne access or refresh token (RFC 7662). Returns active, scope, and claims. Uses credentials from storage or env.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			logger.info('Introspecting token via MCP', {
				environmentId: args.environmentId ?? '(from env)',
			});
			try {
				const parsed = z.object(inputShape).parse(args);
				const result: IntrospectResult = await introspectToken({
					environmentId: parsed.environmentId,
					token: parsed.token,
					tokenTypeHint: parsed.tokenTypeHint,
				});
				const structured = outputSchema.parse({
					success: result.success,
					...(result.success
						? {
								active: result.active,
								scope: result.scope,
								client_id: result.client_id,
								username: result.username,
								token_type: result.token_type,
								exp: result.exp,
								iat: result.iat,
								sub: result.sub,
								raw: result.raw,
							}
						: { error: result.error }),
				}) as Record<string, unknown>;
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Token active: ${result.active}. ${JSON.stringify(structured, null, 2)}`
								: `Introspection failed: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP Introspect – failed', { error });
				return buildToolErrorResult('Token introspection', error);
			}
		}
	);
}
