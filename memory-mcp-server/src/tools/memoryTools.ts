import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MemoryManager } from '../services/memoryManager.js';

// Schema definitions
const SaveUserPreferenceSchema = z.object({
	userId: z.string().describe('User identifier'),
	preferences: z
		.object({
			defaultFlow: z.enum(['admin', 'user', 'pingone']).optional().describe('Default OAuth flow'),
			preferredMfaMethod: z
				.enum(['sms', 'email', 'totp', 'push'])
				.optional()
				.describe('Preferred MFA method'),
			rememberCredentials: z.boolean().optional().describe('Whether to remember credentials'),
			autoTestMode: z.boolean().optional().describe('Enable automatic testing mode'),
			debugMode: z.boolean().optional().describe('Enable debug mode'),
			timezone: z.string().optional().describe('User timezone'),
		})
		.describe('User preferences to save'),
});

const GetUserPreferenceSchema = z.object({
	userId: z.string().describe('User identifier'),
});

const UpdateFlowMemorySchema = z.object({
	flowId: z.string().optional().describe('Flow identifier (auto-generated if not provided)'),
	flowType: z.enum(['admin', 'user', 'pingone']).optional().describe('Type of OAuth flow'),
	configuration: z
		.object({
			environmentId: z.string().optional(),
			clientId: z.string().optional(),
			authzClientId: z.string().optional(),
			scopes: z.array(z.string()).optional(),
			redirectUri: z.string().optional(),
		})
		.optional()
		.describe('Flow configuration'),
	issue: z
		.object({
			type: z.enum(['error', 'warning', 'info']),
			message: z.string(),
			resolution: z.string().optional(),
		})
		.optional()
		.describe('Issue to record'),
	successPattern: z
		.object({
			description: z.string(),
			configuration: z.record(z.any()),
		})
		.optional()
		.describe('Success pattern to record'),
});

const SearchHistorySchema = z.object({
	userId: z.string().describe('User identifier'),
	query: z.string().describe('Search query'),
});

export function registerMemoryTools(server: McpServer, memoryManager: MemoryManager): void {
	// Save user preferences
	server.tool(
		'save-user-preference',
		'Save or update user preferences for OAuth playground',
		SaveUserPreferenceSchema.shape,
		async ({ userId, preferences }) => {
			try {
				await memoryManager.saveUserPreference(userId, preferences);
				return {
					content: [
						{
							type: 'text',
							text: `✅ Saved preferences for user ${userId}: ${JSON.stringify(preferences, null, 2)}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to save preferences: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Get user preferences
	server.tool(
		'get-user-preference',
		'Retrieve user preferences and history',
		GetUserPreferenceSchema.shape,
		async ({ userId }) => {
			try {
				const preferences = await memoryManager.getUserPreference(userId);
				return {
					content: [
						{
							type: 'text',
							text: `📋 User preferences for ${userId}:\n\n${JSON.stringify(preferences, null, 2)}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to retrieve preferences: ${String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Update flow memory
	server.tool(
		'update-flow-memory',
		'Update OAuth flow memory with issues, successes, or configuration',
		UpdateFlowMemorySchema.shape,
		async ({ flowId, flowType, configuration, issue, successPattern }) => {
			try {
				// Generate flow ID if not provided
				const finalFlowId = flowId || `flow_${Date.now()}`;

				// Save base flow memory
				await memoryManager.saveFlowMemory({
					flowId: finalFlowId,
					flowType,
					configuration: configuration || { scopes: [] },
				});

				// Add issue if provided
				if (issue) {
					await memoryManager.addFlowIssue(finalFlowId, issue);
				}

				// Add success pattern if provided
				if (successPattern) {
					await memoryManager.addFlowSuccessPattern(finalFlowId, successPattern);
				}

				return {
					content: [
						{
							type: 'text',
							text: `✅ Updated flow memory for ${finalFlowId}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to update flow memory: ${String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Search user history
	server.tool(
		'search-user-history',
		'Search through user preferences and OAuth flow history',
		SearchHistorySchema.shape,
		async ({ userId, query }) => {
			try {
				const results = await memoryManager.searchUserHistory(userId, query);
				return {
					content: [
						{
							type: 'text',
							text: `🔍 Search results for "${query}":\n\n${JSON.stringify(results, null, 2)}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Search failed: ${String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Get common issues
	server.tool(
		'get-common-issues',
		'Get the most common OAuth issues and their resolutions',
		{},
		async () => {
			try {
				const issues = await memoryManager.getCommonIssues();
				return {
					content: [
						{
							type: 'text',
							text: `📊 Common OAuth issues:\n\n${JSON.stringify(issues, null, 2)}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to get common issues: ${String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Update user last used
	server.tool(
		'update-user-last-used',
		'Update the last used flow for a user',
		z.object({
			userId: z.string(),
			flow: z.string(),
			success: z.boolean(),
		}).shape,
		async ({ userId, flow, success }) => {
			try {
				await memoryManager.updateUserLastUsed(userId, flow, success);
				return {
					content: [
						{
							type: 'text',
							text: `✅ Updated last used flow for ${userId}: ${flow} (success: ${success})`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to update last used: ${String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);
}
