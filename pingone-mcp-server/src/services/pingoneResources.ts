/**
 * Dynamic MCP resources for PingOne (e.g. applications list).
 * Allows the AI to read config without calling tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from './logger.js';
import { listApplications } from './pingoneManagementClient.js';

const APPLICATIONS_RESOURCE_NAME = 'pingone-applications';
const APPLICATIONS_URI = 'pingone://applications';

export function registerPingOneResources(server: McpServer, logger: Logger): void {
	server.resource(
		APPLICATIONS_RESOURCE_NAME,
		APPLICATIONS_URI,
		{
			title: 'PingOne applications',
			description: 'Current list of PingOne applications (uses credentials from storage or env).',
		},
		async () => {
			logger.info('Serving PingOne applications resource');
			try {
				const result = await listApplications({});
				const text = result.success
					? JSON.stringify(
							{ success: true, count: result.applications?.length ?? 0, applications: result.applications },
							null,
							2
						)
					: JSON.stringify({ success: false, error: (result as { error?: unknown }).error }, null, 2);
				return {
					contents: [
						{
							uri: APPLICATIONS_URI,
							type: 'text' as const,
							text,
						},
					],
				};
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				logger.error('PingOne applications resource failed', { error: message });
				return {
					contents: [
						{
							uri: APPLICATIONS_URI,
							type: 'text' as const,
							text: JSON.stringify({ success: false, error: message }, null, 2),
						},
					],
				};
			}
		}
	);
}
