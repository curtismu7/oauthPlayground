/**
 * MCP tool: PingOne device authorization (RFC 8628).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import {
	startDeviceAuthorization,
	type DeviceAuthResult,
} from '../services/pingoneDeviceAuthClient.js';

const inputShape = {
	environmentId: z.string().trim().optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	scope: z.string().trim().optional(),
} as const;

const outputShape = {
	success: z.boolean(),
	device_code: z.string().optional(),
	user_code: z.string().optional(),
	verification_uri: z.string().optional(),
	verification_uri_complete: z.string().optional(),
	expires_in: z.number().optional(),
	interval: z.number().optional(),
	raw: z.record(z.unknown()).optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const outputSchema = z.object(outputShape);

export function registerDeviceAuthTools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'pingone_device_authorization',
		{
			description:
				'Start PingOne device authorization flow (RFC 8628). Returns device_code, user_code, and verification_uri. Uses credentials from storage or env.',
			inputSchema: inputShape,
			outputSchema: outputShape,
		},
		async (args) => {
			logger.info('Starting device authorization via MCP', {
				environmentId: args.environmentId ?? '(from env)',
				clientId: args.clientId ?? '(from env)',
			});
			try {
				const parsed = z.object(inputShape).parse(args);
				const result: DeviceAuthResult = await startDeviceAuthorization({
					environmentId: parsed.environmentId,
					clientId: parsed.clientId,
					clientSecret: parsed.clientSecret,
					scope: parsed.scope,
				});
				const structured = outputSchema.parse({
					success: result.success,
					...(result.success
						? {
								device_code: result.device_code,
								user_code: result.user_code,
								verification_uri: result.verification_uri,
								verification_uri_complete: result.verification_uri_complete,
								expires_in: result.expires_in,
								interval: result.interval,
								raw: result.raw,
							}
						: { error: result.error }),
				}) as Record<string, unknown>;
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Device flow started. User code: ${result.user_code}. Verification URI: ${result.verification_uri}. ${JSON.stringify(structured, null, 2)}`
								: `Device authorization failed: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP Device Auth – failed', { error });
				return buildToolErrorResult('Device authorization', error);
			}
		}
	);
}
