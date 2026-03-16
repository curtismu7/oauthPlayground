import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { FetchManager } from '../services/fetchManager.js';

// Schema definitions
const FetchSchema = z.object({
	url: z.string().describe('URL to fetch'),
	method: z
		.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
		.optional()
		.describe('HTTP method'),
	headers: z.record(z.string()).optional().describe('HTTP headers'),
	body: z.string().optional().describe('Request body'),
	timeout: z.number().optional().describe('Timeout in milliseconds'),
	allowRedirects: z.boolean().optional().describe('Follow redirects'),
	validateSSL: z.boolean().optional().describe('Validate SSL certificates'),
});

const FetchAndParseSchema = z.object({
	url: z.string().describe('URL to fetch and parse'),
	method: z
		.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
		.optional()
		.describe('HTTP method'),
	headers: z.record(z.string()).optional().describe('HTTP headers'),
	body: z.string().optional().describe('Request body'),
	timeout: z.number().optional().describe('Timeout in milliseconds'),
});

const TestOAuthEndpointSchema = z.object({
	baseUrl: z.string().describe('Base URL of OAuth server'),
	path: z.string().describe('Endpoint path (e.g., /oauth/token)'),
	token: z.string().optional().describe('Bearer token for testing'),
});

const TestRedirectFlowSchema = z.object({
	startUrl: z.string().describe('Starting URL for redirect test'),
	maxRedirects: z.number().optional().default(5).describe('Maximum redirects to follow'),
});

const TestWellKnownEndpointsSchema = z.object({
	baseUrl: z.string().describe('Base URL of OAuth server'),
});

const GetHistorySchema = z.object({
	limit: z.number().optional().describe('Limit number of results'),
});

export function registerFetchTools(server: McpServer, fetchManager: FetchManager): void {
	// Basic fetch
	server.tool(
		'fetch',
		'Fetch a URL and return the response',
		FetchSchema.shape,
		async ({ url, method, headers, body, timeout, allowRedirects, validateSSL }) => {
			try {
				const response = await fetchManager.fetch({
					url,
					method,
					headers,
					body,
					timeout,
					allowRedirects,
					validateSSL,
				});

				const summary = `${response.status} ${response.statusText} (${response.responseTime}ms)`;
				const bodyPreview =
					response.body.length > 500 ? response.body.substring(0, 500) + '...' : response.body;

				return {
					content: [
						{
							type: 'text',
							text: `🌐 ${summary}\n\n📄 Response body:\n${bodyPreview}\n\n📋 Headers:\n${JSON.stringify(response.headers, null, 2)}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Fetch and parse
	server.tool(
		'fetch-and-parse',
		'Fetch a URL and parse JSON/HTML content',
		FetchAndParseSchema.shape,
		async ({ url, method, headers, body, timeout }) => {
			try {
				const response = await fetchManager.fetchAndParse({
					url,
					method,
					headers,
					body,
					timeout,
				});

				const summary = `${response.status} ${response.statusText} (${response.responseTime}ms)`;
				let content = `🌐 ${summary}\n\n📄 Response body:\n${response.body}`;

				if (response.parsedContent) {
					content += `\n\n🔍 Parsed content:\n${JSON.stringify(response.parsedContent, null, 2)}`;
				}

				return {
					content: [
						{
							type: 'text',
							text: content,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Fetch and parse failed: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Test OAuth endpoint
	server.tool(
		'test-oauth-endpoint',
		'Test an OAuth endpoint and analyze the response',
		TestOAuthEndpointSchema.shape,
		async ({ baseUrl, path, token }) => {
			try {
				const result = await fetchManager.testOAuthEndpoint(baseUrl, path, token);

				const emoji = result.result === 'pass' ? '✅' : result.result === 'warning' ? '⚠️' : '❌';
				let content = `${emoji} ${result.test}: ${result.message}\n⏱️ ${result.responseTime}ms`;

				if (result.details) {
					content += `\n\n📋 Details:\n${JSON.stringify(result.details, null, 2)}`;
				}

				return {
					content: [
						{
							type: 'text',
							text: content,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ OAuth endpoint test failed: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Test redirect flow
	server.tool(
		'test-redirect-flow',
		'Test OAuth redirect flow and analyze redirect chain',
		TestRedirectFlowSchema.shape,
		async ({ startUrl, maxRedirects }) => {
			try {
				const result = await fetchManager.testRedirectFlow(startUrl, maxRedirects);

				const emoji = result.result === 'pass' ? '✅' : result.result === 'warning' ? '⚠️' : '❌';
				let content = `${emoji} ${result.test}: ${result.message}\n⏱️ ${result.responseTime}ms`;

				if (result.details) {
					content += `\n\n📋 Details:\n${JSON.stringify(result.details, null, 2)}`;
				}

				return {
					content: [
						{
							type: 'text',
							text: content,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Redirect flow test failed: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Test well-known endpoints
	server.tool(
		'test-well-known-endpoints',
		'Test OAuth well-known endpoints (openid_configuration, oauth-authorization-server, jwks.json)',
		TestWellKnownEndpointsSchema.shape,
		async ({ baseUrl }) => {
			try {
				const results = await fetchManager.testWellKnownEndpoints(baseUrl);

				const content = results
					.map((result) => {
						const emoji =
							result.result === 'pass' ? '✅' : result.result === 'warning' ? '⚠️' : '❌';
						return `${emoji} ${result.test}: ${result.message} (${result.responseTime}ms)`;
					})
					.join('\n');

				return {
					content: [
						{
							type: 'text',
							text: `🔍 Well-known endpoint tests for ${baseUrl}:\n\n${content}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Well-known endpoints test failed: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Get request history
	server.tool(
		'get-request-history',
		'Get the history of fetch requests',
		GetHistorySchema.shape,
		async ({ limit }) => {
			try {
				const history = fetchManager.getRequestHistory(limit);

				const content = history
					.map(
						(response) =>
							`${response.status} ${response.statusText} ${response.url} (${response.responseTime}ms)`
					)
					.join('\n');

				return {
					content: [
						{
							type: 'text',
							text: `📚 Request history${limit ? ` (last ${limit})` : ''}:\n\n${content}`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ Failed to get request history: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);

	// Get analytics
	server.tool('get-fetch-analytics', 'Get analytics about fetch requests', {}, async () => {
		try {
			const analytics = fetchManager.getAnalytics();

			const content = `📊 Fetch Analytics:
📈 Total requests: ${analytics.totalRequests}
⏱️ Average response time: ${analytics.averageResponseTime.toFixed(2)}ms

📋 Status codes:
${Object.entries(analytics.statusCodes)
	.map(([code, count]) => `  ${code}: ${count}`)
	.join('\n')}

🌐 Top domains:
${analytics.topDomains.map(({ domain, count }) => `  ${domain}: ${count}`).join('\n')}`;

			return {
				content: [
					{
						type: 'text',
						text: content,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: `❌ Failed to get analytics: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	});

	// Clear history
	server.tool('clear-fetch-history', 'Clear the fetch request history', {}, async () => {
		try {
			fetchManager.clearHistory();
			return {
				content: [
					{
						type: 'text',
						text: '🧹 Fetch history cleared',
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: `❌ Failed to clear history: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
				isError: true,
			};
		}
	});

	// Comprehensive OAuth flow test
	server.tool(
		'test-oauth-flow',
		'Run comprehensive OAuth flow tests',
		z.object({
			baseUrl: z.string().describe('Base URL of OAuth server'),
			tokenEndpoint: z.string().optional().describe('Token endpoint path'),
			authEndpoint: z.string().optional().describe('Authorization endpoint path'),
			token: z.string().optional().describe('Bearer token for testing'),
		}).shape,
		async ({ baseUrl, tokenEndpoint, authEndpoint, token }) => {
			try {
				const results = [];

				// Test well-known endpoints
				const wellKnownResults = await fetchManager.testWellKnownEndpoints(baseUrl);
				results.push(...wellKnownResults);

				// Test token endpoint
				if (tokenEndpoint) {
					const tokenResult = await fetchManager.testOAuthEndpoint(baseUrl, tokenEndpoint, token);
					tokenResult.test = 'Token endpoint';
					results.push(tokenResult);
				}

				// Test authorization endpoint
				if (authEndpoint) {
					const authResult = await fetchManager.testOAuthEndpoint(baseUrl, authEndpoint);
					authResult.test = 'Authorization endpoint';
					results.push(authResult);
				}

				// Test redirect flow to auth endpoint
				if (authEndpoint) {
					const fullAuthUrl = `${baseUrl.replace(/\/$/, '')}/${authEndpoint.replace(/^\//, '')}`;
					const redirectResult = await fetchManager.testRedirectFlow(fullAuthUrl);
					redirectResult.test = 'Authorization redirect flow';
					results.push(redirectResult);
				}

				const content = results
					.map((result) => {
						const emoji =
							result.result === 'pass' ? '✅' : result.result === 'warning' ? '⚠️' : '❌';
						return `${emoji} ${result.test}: ${result.message} (${result.responseTime}ms)`;
					})
					.join('\n');

				const passCount = results.filter((r) => r.result === 'pass').length;
				const warningCount = results.filter((r) => r.result === 'warning').length;
				const failCount = results.filter((r) => r.result === 'fail').length;

				return {
					content: [
						{
							type: 'text',
							text: `🔍 Comprehensive OAuth Flow Tests for ${baseUrl}:\n\n${content}\n\n📊 Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failed`,
						},
					],
				};
			} catch (error) {
				return {
					content: [
						{
							type: 'text',
							text: `❌ OAuth flow test failed: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		}
	);
}
