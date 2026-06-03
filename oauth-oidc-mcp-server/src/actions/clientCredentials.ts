/**
 * Client Credentials flow — RFC 6749 §4.4.
 *
 * For service-to-service (machine-to-machine) authentication.
 * Client credentials are required; no user is involved.
 * May support optional audience and resource parameters for token scoping.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import {
	postToken,
	resolveClientCredentials,
	defaultScope,
} from '../services/oauthClient.js';

const clientAuthShape = {
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	authMethod: z.enum(['client_secret_basic', 'client_secret_post', 'none']).optional(),
} as const;

const inputShape = {
	...providerInputShape,
	...clientAuthShape,
	scope: z
		.string()
		.trim()
		.optional()
		.describe('Space-separated scopes; defaults to OAUTH_DEFAULT_SCOPE if omitted.'),
	audience: z
		.string()
		.trim()
		.optional()
		.describe('Optional audience hint to narrow token scope (OIDC extension).'),
	resource: z
		.string()
		.trim()
		.optional()
		.describe(
			'Optional resource indicator to scope token for a specific API (RFC 8707 extension).'
		),
} as const;

const outputShape = {
	success: z.boolean(),
	accessToken: z.string().optional(),
	tokenType: z.string().optional(),
	expiresIn: z.number().optional(),
	expiresAt: z.string().optional(),
	refreshToken: z.string().optional(),
	idToken: z.string().optional(),
	scope: z.string().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

const logger = new Logger('ClientCredentialsFlow');

export function registerClientCredentialsTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_client_credentials',
		{
			description:
				'Client Credentials flow (RFC 6749 §4.4). Service-to-service authentication without user involvement. Optionally narrows token scope with audience or resource.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const tokenEndpoint = requireEndpoint(
					endpoints,
					'token_endpoint',
					'token endpoint'
				);
				const creds = resolveClientCredentials({
					clientId: parsed.clientId,
					clientSecret: parsed.clientSecret,
					authMethod: parsed.authMethod,
				});

				const params: Record<string, string> = {
					grant_type: 'client_credentials',
				};

				const scope = defaultScope(parsed.scope);
				if (scope) {
					params.scope = scope;
				}

				if (parsed.audience) {
					params.audience = parsed.audience;
				}

				if (parsed.resource) {
					params.resource = parsed.resource;
				}

				const result = await postToken({
					tokenEndpoint,
					params,
					...creds,
				});

				const structured = outputSchema.parse({
					success: true,
					accessToken: result.access_token,
					tokenType: result.token_type,
					expiresIn: result.expires_in,
					expiresAt: result.expires_at,
					refreshToken: result.refresh_token,
					idToken: result.id_token,
					scope: result.scope,
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text: `Client credentials grant succeeded: access_token obtained, expires in ${result.expires_in ?? 'N/A'} seconds.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_client_credentials failed', { error });
				return buildToolErrorResult('oauth_client_credentials', error);
			}
		}
	);
}
