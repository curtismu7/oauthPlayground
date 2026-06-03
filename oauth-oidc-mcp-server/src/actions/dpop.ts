/**
 * DPoP (Demonstration of Proof-of-Possession) — RFC 9449.
 *
 * Generates a signed DPoP proof JWT that binds a token request or API call
 * to a specific key pair. Ephemeral key pairs are generated when none are supplied;
 * callers should reuse the returned key for subsequent requests to the same resource.
 *
 * No provider resolution is needed — DPoP proofs are purely client-side key operations.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { createDpopProof } from '../services/dpopService.js';

const inputShape = {
	htm: z
		.string()
		.trim()
		.describe('HTTP method of the request the proof covers (e.g. POST, GET).'),
	htu: z
		.string()
		.trim()
		.describe(
			'HTTP target URI of the request (query and fragment are stripped per RFC 9449 §4.2).'
		),
	alg: z
		.enum(['ES256', 'RS256'])
		.optional()
		.describe('Signing algorithm. Defaults to ES256 (recommended).'),
	accessToken: z
		.string()
		.trim()
		.optional()
		.describe(
			'Access token to bind via the `ath` claim (BASE64URL(SHA256(token))). Required when using DPoP with an already-issued token.'
		),
	nonce: z
		.string()
		.trim()
		.optional()
		.describe('Server-provided DPoP nonce (from a WWW-Authenticate or DPoP-Nonce header).'),
	privateJwk: z
		.record(z.unknown())
		.optional()
		.describe('Existing private JWK to reuse. When omitted, a fresh key pair is generated.'),
	publicJwk: z
		.record(z.unknown())
		.optional()
		.describe('Matching public JWK (required when privateJwk is supplied).'),
} as const;

const outputShape = {
	success: z.boolean(),
	proof: z.string().optional().describe('Signed DPoP proof JWT — attach as the `DPoP` header.'),
	publicJwk: z
		.record(z.unknown())
		.optional()
		.describe('Public JWK for the key used to sign this proof.'),
	privateJwk: z
		.record(z.unknown())
		.optional()
		.describe(
			'Private JWK — store securely and reuse for subsequent requests to the same resource.'
		),
	thumbprint: z
		.string()
		.optional()
		.describe('JWK Thumbprint (JKT) of the public key — used as the `cnf.jkt` binding in tokens.'),
	jti: z
		.string()
		.optional()
		.describe('Unique JWT ID of this proof — the server uses this to detect replay.'),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

const logger = new Logger('DpopTool');

export function registerDpopTools(server: McpServer, _logger: Logger): void {
	server.registerTool(
		'oauth_generate_dpop_proof',
		{
			description:
				'Generate a DPoP (Demonstration of Proof-of-Possession) proof JWT (RFC 9449). ' +
				'A new ephemeral key pair is generated when none is supplied — reuse the returned ' +
				'privateJwk + publicJwk for all subsequent requests to the same resource server. ' +
				'Attach the returned proof as the `DPoP` header on your token or API request.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			try {
				const parsed = z.object(inputShape).parse(args);

				const result = await createDpopProof({
					htm: parsed.htm,
					htu: parsed.htu,
					alg: parsed.alg,
					accessToken: parsed.accessToken,
					nonce: parsed.nonce,
					privateJwk: parsed.privateJwk as never,
					publicJwk: parsed.publicJwk as never,
				});

				const structured = outputSchema.parse({
					success: true,
					proof: result.proof,
					publicJwk: result.publicJwk as unknown as Record<string, unknown>,
					privateJwk: result.privateJwk as unknown as Record<string, unknown>,
					thumbprint: result.thumbprint,
					jti: result.jti,
				}) as Record<string, unknown>;

				const keyNote = parsed.privateJwk
					? 'Existing key pair reused.'
					: 'New ephemeral key pair generated — save privateJwk + publicJwk to reuse for subsequent requests to the same resource.';

				return {
					content: [
						{
							type: 'text' as const,
							text:
								`DPoP proof generated for ${result.htm} ${result.htu}. ` +
								`${keyNote}\n\n` +
								`Attach the proof as the HTTP header: DPoP: <proof>\n` +
								`JWK Thumbprint (JKT): ${result.thumbprint} — the authorization server will bind this to the issued token's cnf.jkt claim.\n` +
								`JTI: ${result.jti} — single-use; generate a new proof for each request.`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('oauth_generate_dpop_proof failed', { error });
				return buildToolErrorResult('oauth_generate_dpop_proof', error);
			}
		}
	);
}
