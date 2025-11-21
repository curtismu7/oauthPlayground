import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAuthTools } from './actions/auth.js';
import { registerMfaTools } from './actions/mfa.js';
import { registerRedirectlessTools } from './actions/redirectless.js';
import { registerWorkerTools } from './actions/worker.js';
import { Logger } from './services/logger.js';
import { registerTrainingModule } from './services/trainingModule.js';

async function main() {
	const logger = new Logger('MCP');
	logger.info('Starting PingOne MCP server');

	const server = new McpServer({ name: 'pingone-mcp-server', version: '0.1.0' });
	registerAuthTools(server, logger);
	registerTrainingModule(server, logger);
	registerWorkerTools(server, logger);
	registerMfaTools(server, logger);
	registerRedirectlessTools(server, logger);

	const transport = new StdioServerTransport();
	await server.connect(transport);

	logger.info('PingOne MCP server is running');

	process.on('SIGINT', async () => {
		logger.info('Received SIGINT, shutting down');
		await server.close();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error('[MCP] Server failed to start', error);
	process.exit(1);
});
