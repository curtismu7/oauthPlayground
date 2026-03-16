import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { MemoryManager } from './services/memoryManager.js';
import { registerMemoryTools } from './tools/memoryTools.js';

async function main() {
	const memoryManager = new MemoryManager();
	await memoryManager.initialize();

	const server = new McpServer(
		{
			name: 'oauth-playground-memory-server',
			version: '0.1.0',
		},
		{
			capabilities: {
				tools: { listChanged: true },
				resources: { listChanged: true },
			},
		}
	);

	// Register memory tools
	registerMemoryTools(server, memoryManager);

	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Graceful shutdown
	process.on('SIGINT', async () => {
		await memoryManager.shutdown();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error('Memory MCP Server failed to start:', error);
	process.exit(1);
});
