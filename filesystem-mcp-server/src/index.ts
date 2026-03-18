import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FilesystemManager } from './services/filesystemManager.js';
import { registerFilesystemTools } from './tools/filesystemTools.js';
import { registerFilesystemPrompts } from './prompts/filesystemPrompts.js';

async function main() {
	const filesystemManager = new FilesystemManager();
	await filesystemManager.initialize();

	const server = new McpServer(
		{
			name: 'oauth-playground-filesystem-server',
			version: '0.1.0',
		},
		{
			capabilities: {
				tools: { listChanged: true },
				resources: { listChanged: true },
				prompts: { listChanged: true },
			},
		}
	);

	// Register filesystem tools
	registerFilesystemTools(server, filesystemManager);

	// Register filesystem prompts
	registerFilesystemPrompts(server, filesystemManager);

	const transport = new StdioServerTransport();
	await server.connect(transport);

	// Graceful shutdown
	process.on('SIGINT', async () => {
		await filesystemManager.shutdown();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error('Filesystem MCP Server failed to start:', error);
	process.exit(1);
});
