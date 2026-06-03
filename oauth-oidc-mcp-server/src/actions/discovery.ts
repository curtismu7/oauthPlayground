/**
 * OIDC Discovery (RFC 5785, RFC 8414).
 *
 * Resolves OAuth/OIDC endpoints from an issuer URL, PingOne preset, or explicit overrides.
 * Returns the complete endpoint set discovered from the provider.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';

const inputShape = {
	...providerInputShape,
} as const;

const outputShape = {
	success: z.boolean(),
	issuer: z.string().optional(),
	endpoints: z.record(z.unknown()).optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

const logger = new Logger('DiscoveryFlow');

export function registerDiscoveryTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_discover',
		{
			description:
				'Discover OAuth/OIDC endpoints from an issuer URL, PingOne preset, or explicit endpoint overrides. Returns the resolved endpoint set.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);

				const endpointsRecord: Record<string, unknown> = {};
				for (const [key, value] of Object.entries(endpoints)) {
					if (value !== undefined) {
						endpointsRecord[key] = value;
					}
				}

				const structured = outputSchema.parse({
					success: true,
					issuer: endpoints.issuer,
					endpoints: endpointsRecord,
				}) as Record<string, unknown>;

				const endpointsList = Object.entries(endpointsRecord)
					.map(([key, value]) => `${key}: ${value}`)
					.join('\n');

				return {
					content: [
						{
							type: 'text' as const,
							text: `OIDC Discovery succeeded. Discovered endpoints:\n${endpointsList}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_discover failed', { error });
				return buildToolErrorResult('oauth_discover', error);
			}
		}
	);
}
