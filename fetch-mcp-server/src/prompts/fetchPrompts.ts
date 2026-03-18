import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerFetchPrompts(server: McpServer): void {
	// Prompt: test an OIDC discovery endpoint and summarise what's available
	server.prompt(
		'test-oidc-discovery',
		'Fetch the OIDC discovery document for a PingOne environment and summarise the available endpoints and grant types',
		{
			environmentId: z.string().describe('PingOne environment ID'),
			region: z
				.enum(['us', 'eu', 'ap', 'ca'])

				.default('us')
				.describe('PingOne region (default: us)'),
		},
		async ({ environmentId, region }) => {
			const regionMap: Record<string, string> = {
				us: 'auth.pingone.com',
				eu: 'auth.pingone.eu',
				ap: 'auth.pingone.asia',
				ca: 'auth.pingone.ca',
			};
			const host = regionMap[region ?? 'us'];
			const discoveryUrl = `https://${host}/${environmentId}/as/.well-known/openid-configuration`;

			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please test the OIDC discovery endpoint for PingOne environment "${environmentId}" (${region} region).\n\n1. Use the fetch tool to GET: ${discoveryUrl}\n2. Parse the JSON response\n3. Summarise:\n   - Available endpoints (authorization_endpoint, token_endpoint, introspection_endpoint, userinfo_endpoint, end_session_endpoint)\n   - Supported grant types (grant_types_supported)\n   - Supported response types (response_types_supported)\n   - Supported scopes (scopes_supported)\n   - PKCE support (code_challenge_methods_supported)\n4. Flag any missing endpoints that are typically expected`,
						},
					},
				],
			};
		}
	);

	// Prompt: validate a bearer token against an introspection endpoint
	server.prompt(
		'validate-bearer-token',
		'Introspect a bearer token against a PingOne environment and report its claims and validity',
		{
			token: z.string().describe('Bearer token to validate'),
			environmentId: z.string().describe('PingOne environment ID'),
			clientId: z.string().describe('Client ID for introspection auth'),
			clientSecret: z.string().describe('Client secret for introspection auth'),
			region: z
				.enum(['us', 'eu', 'ap', 'ca'])

				.default('us')
				.describe('PingOne region (default: us)'),
		},
		async ({ token, environmentId, clientId, clientSecret, region }) => {
			const regionMap: Record<string, string> = {
				us: 'auth.pingone.com',
				eu: 'auth.pingone.eu',
				ap: 'auth.pingone.asia',
				ca: 'auth.pingone.ca',
			};
			const host = regionMap[region ?? 'us'];
			const introspectUrl = `https://${host}/${environmentId}/as/introspect`;
			const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please validate the following bearer token against the PingOne introspection endpoint.\n\nUse the fetch tool with:\n- Method: POST\n- URL: ${introspectUrl}\n- Headers: { "Authorization": "Basic ${credentials}", "Content-Type": "application/x-www-form-urlencoded" }\n- Body: token=${token}\n\nFrom the response, report:\n- Is the token active (active: true/false)?\n- Token type and expiry (exp, iat)\n- Subject (sub) and client_id\n- Granted scopes\n- If inactive, possible reason (expired, revoked, wrong audience)`,
						},
					},
				],
			};
		}
	);

	// Prompt: health-check all well-known endpoints for an OAuth server
	server.prompt(
		'oauth-server-health-check',
		'Run a health check against all standard OAuth/OIDC endpoints for a given base URL and report which are reachable',
		{
			baseUrl: z
				.string()
				.describe('Base URL of the OAuth server (e.g. https://auth.pingone.com/{envId}/as)'),
		},
		async ({ baseUrl }) => {
			return {
				messages: [
					{
						role: 'user',
						content: {
							type: 'text',
							text: `Please run a health check against the OAuth server at: ${baseUrl}\n\nUse the fetch tool (HEAD or GET) to check each of these endpoints:\n1. ${baseUrl}/.well-known/openid-configuration\n2. ${baseUrl}/authorize  (expect 400 or redirect — not 5xx)\n3. ${baseUrl}/token      (expect 400 — not 5xx)\n4. ${baseUrl}/introspect (expect 400 or 401 — not 5xx)\n5. ${baseUrl}/userinfo   (expect 401 — not 5xx)\n6. ${baseUrl}/jwks       (expect 200 with keys)\n\nFor each endpoint report: HTTP status, response time (ms), and whether it's considered healthy. Flag any that return 5xx or are unreachable.`,
						},
					},
				],
			};
		}
	);
}
