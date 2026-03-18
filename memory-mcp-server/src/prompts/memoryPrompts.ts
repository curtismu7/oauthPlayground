import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MemoryManager } from '../services/memoryManager.js';

export function registerMemoryPrompts(server: McpServer, memoryManager: MemoryManager): void {
	// Prompt: recall what a user typically uses
	server.prompt(
		'recall-user-setup',
		'Recall the saved preferences and recent flow history for a user so an AI assistant can pick up where they left off',
		{
			userId: z.string().describe('User identifier to recall setup for'),
		},
		async ({ userId }) => {
			let prefsText = 'No saved preferences found.';
			try {
				const prefs = await memoryManager.getUserPreference(userId);
				if (prefs) {
					prefsText = JSON.stringify(prefs, null, 2);
				}
			} catch {
				prefsText = 'Could not load preferences.';
			}

			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please recall the OAuth Playground setup for user "${userId}".\n\nSaved preferences:\n${prefsText}\n\nBased on this, summarise what this user typically works with and suggest what they might want to do next.`,
						},
					},
				],
			};
		}
	);

	// Prompt: debug a failing OAuth flow from memory
	server.prompt(
		'debug-flow-from-memory',
		'Retrieve recorded issues and success patterns for an OAuth flow and suggest a fix',
		{
			userId: z.string().describe('User identifier'),
			flowType: z
				.enum(['admin', 'user', 'pingone'])
				.optional()
				.describe('Flow type to focus on (optional)'),
		},
		async ({ userId, flowType }) => {
			const flowHint = flowType ? ` focusing on the "${flowType}" flow` : '';
			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `I need help debugging an OAuth flow issue${flowHint} for user "${userId}".\n\nPlease:\n1. Use the get-user-preference tool to retrieve saved preferences for this user\n2. Use the update-flow-memory tool to check any recorded issues\n3. Identify patterns in the errors\n4. Suggest a fix based on any recorded success patterns`,
						},
					},
				],
			};
		}
	);

	// Prompt: save the result of a successful flow as a pattern
	server.prompt(
		'record-success-pattern',
		'Guide the AI to save a successful OAuth flow configuration as a reusable pattern',
		{
			userId: z.string().describe('User identifier'),
			flowType: z.enum(['admin', 'user', 'pingone']).describe('Flow type that succeeded'),
			description: z.string().describe('Brief description of what worked'),
		},
		async ({ userId, flowType, description }) => {
			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `The "${flowType}" OAuth flow just succeeded for user "${userId}". ${description}\n\nPlease use the update-flow-memory tool to save this as a success pattern so we can replicate it in future sessions. Include the current configuration details if available.`,
						},
					},
				],
			};
		}
	);
}
