/**
 * @file brave-search-server.ts
 * @module server/mcp
 * @description Custom Brave Search MCP server that uses stored API keys
 * @version 1.0.0
 * @since 2026-03-11
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import { McpApiKeyBridge } from '../services/mcpApiKeyBridge';

const server = new Server(
	{
		name: 'brave-search-secure',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'brave_search',
				description: 'Search the web using Brave Search API',
				inputSchema: {
					type: 'object',
					properties: {
						query: {
							type: 'string',
							description: 'Search query',
						},
					},
					required: ['query'],
				},
			},
		],
	};
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	if (name === 'brave_search') {
		const query = args?.query as string;

		if (!query || typeof query !== 'string') {
			throw new Error('Invalid query: query must be a non-empty string');
		}

		try {
			// Get API key from secure storage
			const apiKey = await McpApiKeyBridge.getApiKey('brave-search');

			if (!apiKey) {
				return {
					content: [
						{
							type: 'text',
							text: 'Brave Search API key not configured. Please add your API key in the Configuration page.',
						},
					],
				};
			}

			const url = new URL('https://api.search.brave.com/res/v1/web/search');
			url.searchParams.set('q', query);
			url.searchParams.set('count', '10');

			const response = await fetch(url.toString(), {
				headers: {
					Accept: 'application/json',
					'X-Subscription-Token': apiKey,
				},
			});

			if (!response.ok) {
				throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
			}

			const data = (await response.json()) as any;
			const results = data.web?.results || [];

			if (results.length === 0) {
				return {
					content: [
						{
							type: 'text',
							text: `No results found for query: "${query}"`,
						},
					],
				};
			}

			// Format results
			const formattedResults = results
				.map((result: any, index: number) => {
					return `${index + 1}. ${result.title}\n   ${result.description}\n   URL: ${result.url}`;
				})
				.join('\n\n');

			return {
				content: [
					{
						type: 'text',
						text: `Search results for "${query}":\n\n${formattedResults}`,
					},
				],
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			return {
				content: [
					{
						type: 'text',
						text: `Error performing search: ${errorMessage}`,
					},
				],
			};
		}
	}

	throw new Error(`Unknown tool: ${name}`);
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('Brave Search MCP server running on stdio');
}

if (require.main === module) {
	main().catch((error) => {
		console.error('Server error:', error);
		process.exit(1);
	});
}
