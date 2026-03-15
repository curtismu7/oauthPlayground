/**
 * MCP tool: JWT decode (client-side, educational).
 *
 * Decodes the header and payload of any JWT without signature verification.
 * Educational only — confirms claims structure, expiry, audience, etc.
 * Does NOT contact PingOne; no credentials required.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';

/** Decode a base64url segment without signature verification. */
function decodeBase64Url(segment: string): Record<string, unknown> | null {
	try {
		const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
		return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
	} catch {
		return null;
	}
}

const inputShape = {
	token: z.string().trim().min(1, 'token is required — paste the raw JWT string'),
} as const;

const outputShape = {
	success: z.boolean(),
	/** Decoded JWT header (alg, kid, typ, etc.) */
	header: z.record(z.unknown()).optional(),
	/** Decoded JWT payload / claims */
	payload: z.record(z.unknown()).optional(),
	/** Human-readable summary of key claims */
	summary: z.string().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

export function registerTokenUtilsTools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'pingone_decode_jwt',
		{
			description:
				'Decode a JWT (JSON Web Token) without signature verification. Returns header (alg, kid, typ) and payload claims (sub, exp, iat, scope, etc.). Educational only — use for inspecting PingOne access tokens, ID tokens, or any JWT. No credentials required.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			logger.info('Decoding JWT (no sig verification)', {});
			try {
				const parsed = z.object(inputShape).parse(args);
				const parts = parsed.token.split('.');
				if (parts.length < 2 || parts.length > 3) {
					const structured = outputSchema.parse({
						success: false,
						error: { code: 'invalid_jwt', message: 'Not a valid JWT — expected 3 dot-separated base64url segments.' },
					}) as Record<string, unknown>;
					return {
						content: [{ type: 'text' as const, text: 'Invalid JWT format — expected header.payload.signature.' }],
						structuredContent: structured,
					};
				}

				const header = decodeBase64Url(parts[0]);
				const payload = decodeBase64Url(parts[1]);

				if (!header || !payload) {
					const structured = outputSchema.parse({
						success: false,
						error: { code: 'decode_failed', message: 'Could not base64url-decode the JWT header or payload.' },
					}) as Record<string, unknown>;
					return {
						content: [{ type: 'text' as const, text: 'Failed to decode JWT segments.' }],
						structuredContent: structured,
					};
				}

				// Build human-readable summary
				const lines: string[] = [];
				lines.push(`Algorithm: ${header.alg ?? '(none)'}`);
				if (header.kid) lines.push(`Key ID (kid): ${header.kid}`);
				if (payload.sub) lines.push(`Subject (sub): ${payload.sub}`);
				if (payload.iss) lines.push(`Issuer (iss): ${payload.iss}`);
				if (payload.aud) lines.push(`Audience (aud): ${Array.isArray(payload.aud) ? (payload.aud as string[]).join(', ') : String(payload.aud)}`);
				if (typeof payload.exp === 'number') {
					const expDate = new Date(payload.exp * 1000);
					const expired = expDate < new Date();
					lines.push(`Expires (exp): ${expDate.toISOString()} ${expired ? '⚠️ EXPIRED' : '✅ valid'}`);
				}
				if (typeof payload.iat === 'number') {
					lines.push(`Issued at (iat): ${new Date(payload.iat * 1000).toISOString()}`);
				}
				if (payload.scope) lines.push(`Scope: ${payload.scope}`);
				if (payload.client_id) lines.push(`Client ID: ${payload.client_id}`);
				if (payload.env) lines.push(`Environment: ${payload.env}`);
				if (payload.org) lines.push(`Organization: ${payload.org}`);
				if (payload.p1_token_type) lines.push(`PingOne token type: ${payload.p1_token_type}`);

				const summary = lines.join('\n');
				const structured = outputSchema.parse({
					success: true,
					header,
					payload,
					summary,
				}) as Record<string, unknown>;

				const text = [
					'## JWT Decoded (no signature verification)',
					'',
					'### Header',
					JSON.stringify(header, null, 2),
					'',
					'### Payload Claims',
					JSON.stringify(payload, null, 2),
					'',
					'### Summary',
					summary,
					'',
					'> ⚠️ Educational only — no signature verification performed.',
				].join('\n');

				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.DecodeJwt – failed', { error });
				return buildToolErrorResult('pingone_decode_jwt', error);
			}
		}
	);
}
