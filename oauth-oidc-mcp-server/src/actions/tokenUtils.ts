/**
 * Token utilities: JWT decoding and verification (sans provider-specific flows).
 *
 * Two tools:
 * - oauth_decode_jwt: Decode a JWT's header and payload without verification (educational).
 * - oauth_verify_jwt: Verify a JWT signature against a remote JWKS endpoint.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { providerInputShape, resolveFromArgs } from '../services/actionHelpers.js';
import { requireEndpoint } from '../services/providerConfig.js';
import {
	decodeJwtParts,
	summarizeClaims,
	isExpired,
	verifySignature,
} from '../services/jwksService.js';

const logger = new Logger('TokenUtilsFlow');

// ============================================================================
// oauth_decode_jwt
// ============================================================================

const decodeInputShape = {
	token: z.string().trim().describe('The JWT token to decode.'),
} as const;

const decodeOutputShape = {
	success: z.boolean(),
	header: z.record(z.unknown()).optional(),
	payload: z.record(z.unknown()).optional(),
	summary: z.string().optional(),
	isExpired: z.boolean().optional(),
	hasSignature: z.boolean().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const decodeOutputSchema = z.object(decodeOutputShape);

// ============================================================================
// oauth_verify_jwt
// ============================================================================

const verifyInputShape = {
	...providerInputShape,
	token: z.string().trim().describe('The JWT token to verify.'),
	issuer: z.string().trim().optional().describe('Expected token issuer (iss claim).'),
	audience: z.string().trim().optional().describe('Expected token audience (aud claim).'),
	algorithms: z
		.array(z.string())
		.optional()
		.describe('Allowed signing algorithms (e.g., [RS256, ES256]). If omitted, any will be accepted.'),
} as const;

const verifyOutputShape = {
	success: z.boolean(),
	valid: z.boolean().optional(),
	payload: z.record(z.unknown()).optional(),
	header: z.record(z.unknown()).optional(),
	algorithm: z.string().optional(),
	kid: z.string().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const verifyOutputSchema = z.object(verifyOutputShape);

// ============================================================================
// Registration
// ============================================================================

export function registerTokenUtilsTools(server: McpServer, _logger: Logger): void {
	// oauth_decode_jwt
	server.registerTool(
		'oauth_decode_jwt',
		{
			description:
				'Decode a JWT header and payload without verification. Returns header, payload, expiry status, and a human-readable summary of standard claims.',
			inputSchema: decodeInputShape,
			outputSchema: decodeOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(decodeInputShape).parse(args);
				const decoded = decodeJwtParts(parsed.token);

				const summary = summarizeClaims(decoded.payload);
				const expired = isExpired(decoded.payload);

				const structured = decodeOutputSchema.parse({
					success: true,
					header: decoded.header,
					payload: decoded.payload,
					summary,
					isExpired: expired,
					hasSignature: decoded.hasSignature,
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text: `JWT decoded successfully:\n\n${summary}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_decode_jwt failed', { error });
				return buildToolErrorResult('oauth_decode_jwt', error);
			}
		}
	);

	// oauth_verify_jwt
	server.registerTool(
		'oauth_verify_jwt',
		{
			description:
				'Verify a JWT signature against a remote JWKS endpoint. Optionally validate issuer, audience, and allowed algorithms. Returns the verified payload and header.',
			inputSchema: verifyInputShape,
			outputSchema: verifyOutputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(verifyInputShape).parse(args);
				const endpoints = await resolveFromArgs(parsed);
				const jwksUri = requireEndpoint(endpoints, 'jwks_uri', 'JWKS URI');

				const result = await verifySignature(parsed.token, jwksUri, {
					issuer: parsed.issuer,
					audience: parsed.audience,
					algorithms: parsed.algorithms,
				});

				if (!result.valid) {
					const structured = verifyOutputSchema.parse({
						success: false,
						valid: false,
						error: {
							code: 'invalid_signature',
							message: result.error ?? 'Signature verification failed',
						},
					}) as Record<string, unknown>;

					return {
						content: [
							{
								type: 'text' as const,
								text: `JWT verification failed: ${result.error}`,
							},
						],
						structuredContent: structured,
					};
				}

				const structured = verifyOutputSchema.parse({
					success: true,
					valid: true,
					payload: result.payload,
					header: result.header,
					algorithm: result.algorithm,
					kid: result.kid,
				}) as Record<string, unknown>;

				return {
					content: [
						{
							type: 'text' as const,
							text: `JWT verified successfully. Algorithm: ${result.algorithm}, Key ID: ${result.kid ?? 'not specified'}.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_verify_jwt failed', { error });
				return buildToolErrorResult('oauth_verify_jwt', error);
			}
		}
	);
}
