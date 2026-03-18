import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FilesystemManager } from '../services/filesystemManager.js';

export function registerFilesystemPrompts(
	server: McpServer,
	filesystemManager: FilesystemManager
): void {
	// Prompt: review a saved config and suggest improvements
	server.prompt(
		'review-flow-config',
		'Load a saved OAuth flow configuration and ask the AI to review it for correctness and security',
		{
			flowId: z.string().describe('Flow identifier to review'),
		},
		async ({ flowId }) => {
			let configText = 'No configuration found for this flow ID.';
			try {
				const config = await filesystemManager.loadConfig(flowId);
				if (config) {
					configText = JSON.stringify(config, null, 2);
				}
			} catch {
				configText = 'Could not load configuration.';
			}

			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please review the following saved OAuth flow configuration for flow "${flowId}" and identify any issues, missing fields, or security concerns:\n\n\`\`\`json\n${configText}\n\`\`\`\n\nCheck for:\n- Missing required fields (redirectUri, scopes, clientId, environmentId)\n- Insecure settings (e.g. validateSSL: false in production)\n- Scope over-provisioning\n- Any fields that look like test/placeholder values`,
						},
					},
				],
			};
		}
	);

	// Prompt: list all configs and decide what to clean up
	server.prompt(
		'audit-saved-configs',
		'List all saved OAuth flow configurations and identify stale or duplicate entries to clean up',
		{},
		async () => {
			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please audit all saved OAuth flow configurations:\n\n1. Use the list-configs tool to get all saved flow IDs\n2. For each, use load-config to inspect the content\n3. Identify:\n   - Duplicate configurations (same clientId/environmentId combination)\n   - Stale configs (missing key fields or clearly test data)\n   - Configs that could be consolidated\n4. Recommend which ones to delete and which to keep`,
						},
					},
				],
			};
		}
	);

	// Prompt: export configs before a migration or deployment
	server.prompt(
		'export-configs-for-migration',
		'Export all saved flow configurations in preparation for a migration or environment change',
		{
			targetEnvironment: z
				.string()
				.optional()
				.describe('Target environment name (e.g. staging, production)'),
		},
		async ({ targetEnvironment }) => {
			const envNote = targetEnvironment
				? ` for migration to "${targetEnvironment}"`
				: '';
			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please prepare an export of all saved OAuth flow configurations${envNote}:\n\n1. Use list-configs to enumerate all flow IDs\n2. For each flow, use load-config to read the configuration\n3. Compile them into a single JSON export object keyed by flowId\n4. Flag any configs that contain environment-specific values (environmentId, clientId) that will need to be updated for the target environment\n5. Provide the complete export as a code block`,
						},
					},
				],
			};
		}
	);
}
