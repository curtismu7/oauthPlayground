/**
 * MCP tools: Phase 8 — Organization Licensing.
 * Tool: pingone_get_organization_licenses
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { getOrganizationLicenses } from '../services/pingoneLicensingClient.js';

const getLicensesInputShape = {
	workerToken: z
		.string()
		.trim()
		.optional()
		.describe('Worker token with org/licensing read scope. Falls back to PINGONE_WORKER_TOKEN env var.'),
	organizationId: z
		.string()
		.trim()
		.optional()
		.describe('Organization ID. If omitted, the first accessible organization is used.'),
} as const;

const getLicensesOutputShape = {
	success: z.boolean(),
	organization: z.record(z.unknown()).optional(),
	licenses: z.array(z.record(z.unknown())).optional(),
	environmentLicenseMap: z.record(
		z.object({
			licenseId: z.string(),
			licenseName: z.string(),
			licenseStatus: z.string(),
			licenseType: z.string().optional(),
		})
	).optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

export function registerPhase8Tools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'pingone_get_organization_licenses',
		{
			description:
				'Get organization information and license assignments for a PingOne organization. ' +
				'PingOne APIs called: ' +
				'(1) GET /organizations (or /organizations/{orgId}) — fetch org details; ' +
				'(2) GET /organizations/{orgId}/licenses — fetch license catalog; ' +
				'(3) GET /licenses/{licId}/environments — map each license to its assigned environments. ' +
				'Requires a worker token with organization and licensing read scope. ' +
				'Returns organization info, list of licenses, and a map of environmentId → license details.',
			inputSchema: getLicensesInputShape,
			outputSchema: getLicensesOutputShape,
		},
		async (args) => {
			logger.info('Getting organization licenses', { organizationId: args.organizationId ?? '(auto-detect)' });
			try {
				const parsed = z.object(getLicensesInputShape).parse(args);
				const result = await getOrganizationLicenses(parsed);

				const licCount = result.licenses?.length ?? 0;
				const envCount = Object.keys(result.environmentLicenseMap ?? {}).length;
				const summary = result.success
					? `Organization: ${(result.organization?.name as string) ?? result.organization?.id ?? 'unknown'}\n` +
					  `Licenses: ${licCount} license(s)\n` +
					  `Environment-license mappings: ${envCount} environment(s)\n\n` +
					  `Licenses:\n${JSON.stringify(result.licenses ?? [], null, 2)}\n\n` +
					  `Environment → License map:\n${JSON.stringify(result.environmentLicenseMap ?? {}, null, 2)}`
					: `Failed to get organization licenses: ${result.error?.message ?? 'Unknown'}`;

				const structured = {
					success: result.success,
					organization: result.organization,
					licenses: result.licenses,
					environmentLicenseMap: result.environmentLicenseMap,
					raw: result.raw,
					error: result.error,
				};

				return {
					content: [{ type: 'text' as const, text: summary }],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetOrganizationLicenses – failed', { error });
				return buildToolErrorResult('pingone_get_organization_licenses', error);
			}
		}
	);
}
