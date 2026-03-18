/**
 * MCP tools: PingOne OIDC config and discovery (no auth).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { getOidcConfig as getOidcConfigApi, getOidcDiscovery as getOidcDiscoveryApi } from '../services/pingoneOidcClient.js';

const oidcConfigInputShape = {
	environmentId: z.string().trim().optional().describe('Leave blank — uses environmentId loaded from the playground app storage or PINGONE_ENVIRONMENT_ID env var.'),
	region: z.string().trim().optional(),
} as const;

const oidcConfigOutputShape = {
	success: z.boolean(),
	config: z.record(z.unknown()).optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const oidcDiscoveryInputShape = {
	issuerUrl: z.string().trim().min(1, 'issuerUrl is required'),
} as const;

const oidcDiscoveryOutputShape = {
	success: z.boolean(),
	discovery: z.record(z.unknown()).optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

export function registerOidcTools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'pingone_oidc_config',
		{
			description:
				'Fetch PingOne OIDC discovery document for an environment (.well-known/openid_configuration). No credentials required.',
			inputSchema: oidcConfigInputShape,
			outputSchema: oidcConfigOutputShape,
		},
		async (args) => {
			logger.info('Fetching OIDC config', { environmentId: args.environmentId, region: args.region });
			try {
				const parsed = z.object(oidcConfigInputShape).parse(args);
			const resolvedEnvId =
				parsed.environmentId ??
				process.env.PINGONE_ENVIRONMENT_ID ??
				process.env.VITE_PINGONE_ENVIRONMENT_ID;
			if (!resolvedEnvId) {
				return {
					content: [{ type: 'text' as const, text: 'environmentId is required. Save credentials in the playground app or set PINGONE_ENVIRONMENT_ID.' }],
					structuredContent: { success: false, error: { message: 'environmentId not found in args or storage/env' } },
				};
			}
			const result = await getOidcConfigApi({ ...parsed, environmentId: resolvedEnvId });
				const structured = {
					success: result.success,
					config: result.config,
					raw: result.raw,
					error: result.error,
				} as Record<string, unknown>;
				const text = result.success
					? `OIDC config: ${JSON.stringify(result.config, null, 2)}`
					: `Failed: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.OidcConfig – failed', { error });
				return buildToolErrorResult('pingone_oidc_config', error);
			}
		}
	);

	server.registerTool(
		'pingone_oidc_discovery',
		{
			description:
				'Fetch OIDC discovery from an arbitrary issuer URL (.well-known/openid-configuration). No credentials required.',
			inputSchema: oidcDiscoveryInputShape,
			outputSchema: oidcDiscoveryOutputShape,
		},
		async (args) => {
			logger.info('Fetching OIDC discovery', { issuerUrl: args.issuerUrl });
			try {
				const parsed = z.object(oidcDiscoveryInputShape).parse(args);
				const result = await getOidcDiscoveryApi(parsed);
				const structured = {
					success: result.success,
					discovery: result.discovery,
					raw: result.raw,
					error: result.error,
				} as Record<string, unknown>;
				const text = result.success
					? `OIDC discovery: ${JSON.stringify(result.discovery, null, 2)}`
					: `Failed: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.OidcDiscovery – failed', { error });
				return buildToolErrorResult('pingone_oidc_discovery', error);
			}
		}
	);
}
