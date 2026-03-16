import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FetchManager } from './services/fetchManager.js';
import { registerFetchTools } from './tools/fetchTools.js';

async function main() {
	const fetchManager = new FetchManager();
	await fetchManager.initialize();

	const server = new McpServer(
		{
			name: 'oauth-playground-fetch-server',
			version: '0.1.0',
		},
		{
			capabilities: {
				tools: { listChanged: true },
				resources: { listChanged: true },
			},
		}
	);

	// Register fetch tools
	registerFetchTools(server, fetchManager);

	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Graceful shutdown
	process.on('SIGINT', async () => {
		await fetchManager.shutdown();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error('Fetch MCP Server failed to start:', error);
	process.exit(1);
});
