/**
 * MCP tool: PingOne token introspection (RFC 7662).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { introspectToken, type IntrospectResult } from '../services/pingoneIntrospectClient.js';

/** Decode a base64url segment without signature verification. */
function decodeBase64Url(segment: string): Record<string, unknown> | null {
	try {
		const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
		return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
	} catch {
		return null;
	}
}

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
	/** JWT header decoded without signature verification (alg, kid, typ) */
	decodedHeader: z.record(z.unknown()).optional(),
	/** JWT payload decoded without signature verification */
	decodedPayload: z.record(z.unknown()).optional(),
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

				// Decode JWT header and payload without signature verification (educational / informational)
				const jwtParts = parsed.token.split('.');
				const decodedHeader = jwtParts.length >= 2 ? decodeBase64Url(jwtParts[0]) : null;
				const decodedPayload = jwtParts.length >= 2 ? decodeBase64Url(jwtParts[1]) : null;

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
								...(decodedHeader ? { decodedHeader } : {}),
								...(decodedPayload ? { decodedPayload } : {}),
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
