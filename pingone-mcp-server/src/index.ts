import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAuthTools } from './actions/auth.js';
import { registerDeviceAuthTools } from './actions/deviceAuth.js';
import { registerIntrospectTools } from './actions/introspect.js';
import { registerTokenUtilsTools } from './actions/tokenUtils.js';
import { registerMfaTools } from './actions/mfa.js';
import { registerOidcTools } from './actions/oidc.js';
import { registerPhase7Tools } from './actions/phase7.js';
import { registerPhase8Tools } from './actions/phase8.js';
import { registerRedirectlessTools } from './actions/redirectless.js';
import { registerSubscriptionTools } from './actions/subscriptions.js';
import { registerGroupTools } from './actions/groups.js';
import { registerUserTools } from './actions/users.js';
import { registerWorkerTools } from './actions/worker.js';
import { loadCredentialsFromStorage } from './services/credentialLoader.js';
import { Logger } from './services/logger.js';
import { registerPingOneResources } from './services/pingoneResources.js';
import { registerTrainingModule } from './services/trainingModule.js';

async function main() {
	// Use credentials from app storage (~/.pingone-playground/credentials/mcp-config.json) or env
	loadCredentialsFromStorage();

	const logger = new Logger('MCP');
	logger.info('Starting PingOne MCP server');

	const server = new McpServer(
		{ name: 'pingone-mcp-server', version: '0.1.0' },
		{
			capabilities: { tools: { listChanged: true }, resources: { listChanged: true } },
			debouncedNotificationMethods: ['notifications/tools/list_changed', 'notifications/resources/list_changed'],
		}
	);
	registerAuthTools(server, logger);
	registerTrainingModule(server, logger);
	registerWorkerTools(server, logger);
	registerUserTools(server, logger);
	registerMfaTools(server, logger);
	registerOidcTools(server, logger);
	registerPhase7Tools(server, logger);
	registerPhase8Tools(server, logger);
	registerSubscriptionTools(server, logger);
	registerIntrospectTools(server, logger);
	registerTokenUtilsTools(server, logger);
	registerDeviceAuthTools(server, logger);
	registerRedirectlessTools(server, logger);
	registerGroupTools(server, logger);
	registerPingOneResources(server, logger);

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
