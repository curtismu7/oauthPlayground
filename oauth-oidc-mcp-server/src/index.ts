import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Logger } from './services/logger.js';

// Discovery & token utilities
import { registerDiscoveryTools } from './actions/discovery.js';
import { registerTokenUtilsTools } from './actions/tokenUtils.js';

// Grant-based flows
import { registerPasswordTools } from './actions/password.js';
import { registerRefreshTools } from './actions/refresh.js';
import { registerClientCredentialsTools } from './actions/clientCredentials.js';
import { registerAuthorizationCodeTools } from './actions/authorizationCode.js';
import { registerTokenExchangeTools } from './actions/tokenExchange.js';
import { registerDeviceAuthTools } from './actions/deviceAuth.js';
import { registerCibaTools } from './actions/ciba.js';

// Request/proof helpers
import { registerParTools } from './actions/par.js';
import { registerDpopTools } from './actions/dpop.js';

// Token lifecycle
import { registerIntrospectTools } from './actions/introspect.js';
import { registerRevokeTools } from './actions/revoke.js';
import { registerUserInfoTools } from './actions/userinfo.js';

async function main() {
	const logger = new Logger('OAuth-OIDC');
	logger.info('Starting provider-agnostic OAuth/OIDC MCP server');

	const server = new McpServer(
		{ name: 'oauth-oidc-mcp-server', version: '0.1.0' },
		{
			capabilities: { tools: { listChanged: true } },
			debouncedNotificationMethods: ['notifications/tools/list_changed'],
		}
	);

	// Discovery & JWT inspection
	registerDiscoveryTools(server, logger);
	registerTokenUtilsTools(server, logger);

	// Grant-based flows
	registerPasswordTools(server, logger);
	registerRefreshTools(server, logger);
	registerClientCredentialsTools(server, logger);
	registerAuthorizationCodeTools(server, logger);
	registerTokenExchangeTools(server, logger);
	registerDeviceAuthTools(server, logger);
	registerCibaTools(server, logger);

	// Request/proof helpers
	registerParTools(server, logger);
	registerDpopTools(server, logger);

	// Token lifecycle
	registerIntrospectTools(server, logger);
	registerRevokeTools(server, logger);
	registerUserInfoTools(server, logger);

	const transport = new StdioServerTransport();
	await server.connect(transport);

	logger.info('OAuth/OIDC MCP server is running');

	process.on('SIGINT', async () => {
		logger.info('Received SIGINT, shutting down');
		await server.close();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error('[OAuth-OIDC] Server failed to start', error);
	process.exit(1);
});
