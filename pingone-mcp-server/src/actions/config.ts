/**
 * MCP tool: pingone_show_stored_config
 * Returns the credentials currently loaded from storage / env, so users can
 * verify what the server is using before calling other tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { loadCredentialsFromStorage } from '../services/credentialLoader.js';

const showConfigOutputShape = {
	environmentId: z.string().optional(),
	clientId: z.string().optional(),
	clientSecretLoaded: z.boolean(),
	apiUrl: z.string().optional(),
	source: z.enum(['storage', 'env', 'none']),
	message: z.string(),
} as const;

export function registerConfigTools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'pingone_show_stored_config',
		{
			description:
				'Show the PingOne credentials currently loaded by this MCP server from storage ' +
				'(~/.pingone-playground/credentials/mcp-config.json) or environment variables. ' +
				'The client_secret is never returned — only whether one is loaded. ' +
				'Use this to confirm credentials are available before running other tools without entering them manually.',
			inputSchema: {},
			outputSchema: showConfigOutputShape,
		},
		async (_args) => {
			logger.info('Showing stored MCP config');

			// Re-read from disk so we always show the freshest state
			const stored = loadCredentialsFromStorage();

			const envId =
				stored.environmentId ??
				process.env.PINGONE_ENVIRONMENT_ID ??
				process.env.VITE_PINGONE_ENVIRONMENT_ID;
			const clientId =
				stored.clientId ??
				process.env.PINGONE_CLIENT_ID ??
				process.env.VITE_PINGONE_CLIENT_ID;
			const secret =
				stored.clientSecret ??
				process.env.PINGONE_CLIENT_SECRET ??
				process.env.VITE_PINGONE_CLIENT_SECRET;
			const apiUrl = stored.apiUrl ?? process.env.PINGONE_API_URL;

			const source: 'storage' | 'env' | 'none' = stored.environmentId
				? 'storage'
				: envId
				? 'env'
				: 'none';

			const result = {
				environmentId: envId,
				clientId,
				clientSecretLoaded: Boolean(secret),
				apiUrl,
				source,
				message:
					source === 'none'
						? 'No credentials found. Save credentials in the playground app first, or set PINGONE_ENVIRONMENT_ID / PINGONE_CLIENT_ID / PINGONE_CLIENT_SECRET environment variables.'
						: `Credentials loaded from ${source}. environmentId and clientId are available; client_secret is ${secret ? 'loaded' : 'missing'}.`,
			};

			const text =
				`source: ${result.source}\n` +
				`environmentId: ${result.environmentId ?? '(not set)'}\n` +
				`clientId: ${result.clientId ?? '(not set)'}\n` +
				`clientSecret: ${result.clientSecretLoaded ? '*** (loaded)' : '(not set)'}\n` +
				`apiUrl: ${result.apiUrl ?? '(default)'}\n\n` +
				result.message;

			return {
				content: [{ type: 'text' as const, text }],
				structuredContent: result,
			};
		}
	);
}
