/**
 * Token Exchange — RFC 8693.
 *
 * The FLAGSHIP delegation tool: exchanges a subject token (e.g. user access token)
 * for a new token with a narrower audience or scoped to an actor (agent/service).
 * Surfaces the `act` claim from the returned JWT to verify the delegation chain.
 *
 * Mirrors the AI-Demo BFF pattern (agentMcpTokenService.js) in an MCP-native form.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import { postToken, resolveClientCredentials, defaultScope } from '../services/oauthClient.js';
import { decodeJwtParts } from '../services/jwksService.js';

const ACCESS_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:access_token';
const TOKEN_EXCHANGE_GRANT = 'urn:ietf:params:oauth:grant-type:token-exchange';

const clientAuthShape = {
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	authMethod: z.enum(['client_secret_basic', 'client_secret_post', 'none']).optional(),
} as const;

const inputShape = {
	...providerInputShape,
	...clientAuthShape,
	subjectToken: z
		.string()
		.trim()
		.describe('The token representing the subject (typically the user access token).'),
	subjectTokenType: z
		.string()
		.trim()
		.optional()
		.describe(
			`Token type URI for subjectToken. Defaults to "${ACCESS_TOKEN_TYPE}".`
		),
	actorToken: z
		.string()
		.trim()
		.optional()
		.describe(
			'Optional actor token representing the delegating service (e.g. agent client-credentials token).'
		),
	actorTokenType: z
		.string()
		.trim()
		.optional()
		.describe(
			`Token type URI for actorToken. Defaults to "${ACCESS_TOKEN_TYPE}" when actorToken is present.`
		),
	requestedTokenType: z
		.string()
		.trim()
		.optional()
		.describe(
			`Requested output token type. Defaults to "${ACCESS_TOKEN_TYPE}".`
		),
	audience: z
		.string()
		.trim()
		.optional()
		.describe('Intended audience of the requested token (resource server URI).'),
	resource: z
		.string()
		.trim()
		.optional()
		.describe('Resource indicator to narrow token scope (RFC 8707).'),
	scope: z
		.string()
		.trim()
		.optional()
		.describe('Space-separated scopes for the requested token.'),
} as const;

const outputShape = {
	success: z.boolean(),
	accessToken: z.string().optional(),
	issuedTokenType: z.string().optional(),
	tokenType: z.string().optional(),
	expiresIn: z.number().optional(),
	scope: z.string().optional(),
	actClaim: z
		.record(z.unknown())
		.optional()
		.describe(
			'The `act` claim from the returned JWT, identifying the current actor in the delegation chain.'
		),
	hasActClaim: z
		.boolean()
		.optional()
		.describe('Whether the returned token contains an `act` (actor) claim.'),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

const logger = new Logger('TokenExchangeFlow');

export function registerTokenExchangeTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_token_exchange',
		{
			description:
				'RFC 8693 Token Exchange — exchange a subject token for a new token with a different ' +
				'audience, scope, or token type. Supports delegation via an optional actor token ' +
				'(produces an `act` claim in the returned JWT). Use this to implement on-behalf-of ' +
				'flows where an agent or service acts on behalf of an authenticated user.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const tokenEndpoint = requireEndpoint(endpoints, 'token_endpoint', 'token endpoint');
				const creds = resolveClientCredentials({
					clientId: parsed.clientId,
					clientSecret: parsed.clientSecret,
					authMethod: parsed.authMethod,
				});

				const subjectTokenType = parsed.subjectTokenType ?? ACCESS_TOKEN_TYPE;
				const requestedTokenType = parsed.requestedTokenType ?? ACCESS_TOKEN_TYPE;

				const params: Record<string, string> = {
					grant_type: TOKEN_EXCHANGE_GRANT,
					subject_token: parsed.subjectToken,
					subject_token_type: subjectTokenType,
					requested_token_type: requestedTokenType,
				};

				if (parsed.actorToken) {
					params.actor_token = parsed.actorToken;
					params.actor_token_type = parsed.actorTokenType ?? ACCESS_TOKEN_TYPE;
				}

				if (parsed.audience) {
					params.audience = parsed.audience;
				}

				if (parsed.resource) {
					params.resource = parsed.resource;
				}

				const scope = defaultScope(parsed.scope);
				if (scope) {
					params.scope = scope;
				}

				const result = await postToken({
					tokenEndpoint,
					params,
					...creds,
				});

				// Decode the returned token (if JWT) to surface the act claim.
				let actClaim: Record<string, unknown> | undefined;
				let hasActClaim = false;

				if (result.access_token) {
					try {
						const decoded = decodeJwtParts(result.access_token);
						if (
							decoded.payload.act !== undefined &&
							typeof decoded.payload.act === 'object' &&
							decoded.payload.act !== null
						) {
							actClaim = decoded.payload.act as Record<string, unknown>;
							hasActClaim = true;
						} else {
							hasActClaim = false;
						}
					} catch {
						// Token is opaque (not a JWT) — skip act claim extraction.
					}
				}

				const structured = outputSchema.parse({
					success: true,
					accessToken: result.access_token,
					issuedTokenType: result.issued_token_type,
					tokenType: result.token_type,
					expiresIn: result.expires_in,
					scope: result.scope,
					actClaim,
					hasActClaim,
				}) as Record<string, unknown>;

				const actSummary = hasActClaim
					? `\n\nDelegation chain confirmed: act claim present — actor is "${String(actClaim?.sub ?? actClaim?.client_id ?? 'unknown')}". ` +
					  'This proves the token was issued via RFC 8693 delegation.'
					: '\n\nNote: no `act` claim found in the returned token. ' +
					  'The authorization server may not emit act claims, or the token may be opaque.';

				return {
					content: [
						{
							type: 'text' as const,
							text:
								`Token exchange succeeded: access_token obtained, expires in ${result.expires_in ?? 'N/A'} seconds.` +
								actSummary,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_token_exchange failed', { error });
				return buildToolErrorResult('oauth_token_exchange', error);
			}
		}
	);
}
