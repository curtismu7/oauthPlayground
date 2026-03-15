/**
 * MCP tools: PingOne group management (list, get, create, update, delete).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import {
	listGroups as listGroupsApi,
	getGroup as getGroupApi,
	createGroup as createGroupApi,
	updateGroup as updateGroupApi,
	deleteGroup as deleteGroupApi,
} from '../services/pingoneGroupClient.js';

// ─── Shared schemas ──────────────────────────────────────────────────────────

const groupBaseShape = {
	environmentId: z.string().trim().optional(),
	workerToken: z.string().trim().optional().describe(
		'Worker token with group scope. If omitted, clientId+clientSecret are used to auto-issue.'
	),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	region: z.string().trim().optional().describe(
		'PingOne region: com (NA), eu, ca, ap/asia, au, sg. Inferred from environmentId if omitted.'
	),
} as const;

const groupResultShape = {
	success: z.boolean(),
	group: z.record(z.unknown()).optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const opResultShape = {
	success: z.boolean(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

// ─── registerGroupTools ──────────────────────────────────────────────────────

export function registerGroupTools(server: McpServer, logger: Logger) {
	// ── pingone_list_groups ──────────────────────────────────────────────────
	server.registerTool(
		'pingone_list_groups',
		{
			description:
				'List PingOne groups in an environment. Supports optional SCIM filter (e.g. `name eq "Admins"`), limit, and pagination via nextPageUrl. Worker token requires p1:read:group scope.',
			inputSchema: {
				...groupBaseShape,
				filter: z.string().trim().optional().describe('SCIM filter, e.g. name eq "Admins"'),
				limit: z.number().int().min(1).max(200).optional().describe('Max groups to return (default 100).'),
				nextPageUrl: z.string().trim().optional().describe('Next page URL from previous response. Omit for first page.'),
			},
			outputSchema: {
				success: z.boolean(),
				groups: z.array(z.record(z.unknown())).optional(),
				count: z.number().optional(),
				size: z.number().optional(),
				nextPageUrl: z.string().optional(),
				raw: z.unknown().optional(),
				error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
			},
		},
		async (args) => {
			logger.info('Listing PingOne groups', { environmentId: args.environmentId, filter: args.filter });
			try {
				const result = await listGroupsApi(args);
				const size = result.groups?.length ?? 0;
				const paginationNote = result.nextPageUrl ? ` More pages available — pass nextPageUrl for the next page.` : '';
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Retrieved ${size} group(s) on this page.${paginationNote}`
								: `Failed: ${result.error?.message}`,
						},
						...(result.success
							? [{ type: 'text' as const, text: JSON.stringify(result.groups, null, 2) }]
							: []),
					],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.ListGroups – failed', { error });
				return buildToolErrorResult(error, 'PingOne list groups');
			}
		}
	);

	// ── pingone_get_group ────────────────────────────────────────────────────
	server.registerTool(
		'pingone_get_group',
		{
			description:
				'Get a single PingOne group by ID. Worker token requires p1:read:group scope.',
			inputSchema: {
				...groupBaseShape,
				groupId: z.string().trim().min(1, 'groupId is required'),
			},
			outputSchema: groupResultShape,
		},
		async (args) => {
			logger.info('Getting PingOne group', { environmentId: args.environmentId, groupId: args.groupId });
			try {
				const result = await getGroupApi(args);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? JSON.stringify(result.group, null, 2)
								: `Failed: ${result.error?.message}`,
						},
					],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetGroup – failed', { error });
				return buildToolErrorResult(error, 'PingOne get group');
			}
		}
	);

	// ── pingone_create_group ─────────────────────────────────────────────────
	server.registerTool(
		'pingone_create_group',
		{
			description:
				'Create a new PingOne group. The `group` object must include at minimum `name`. Optionally include `description` and `population.id`. Worker token requires p1:create:group scope.',
			inputSchema: {
				...groupBaseShape,
				group: z
					.record(z.unknown())
					.describe('Group definition. Must include `name`. Optionally: `description`, `population.id`.'),
			},
			outputSchema: groupResultShape,
		},
		async (args) => {
			logger.info('Creating PingOne group', { environmentId: args.environmentId });
			try {
				const result = await createGroupApi(args);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Group created: ${(result.group as Record<string, unknown>)?.['name'] ?? (result.group as Record<string, unknown>)?.['id'] ?? 'unknown'}`
								: `Failed: ${result.error?.message}`,
						},
					],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.CreateGroup – failed', { error });
				return buildToolErrorResult(error, 'PingOne create group');
			}
		}
	);

	// ── pingone_update_group ─────────────────────────────────────────────────
	server.registerTool(
		'pingone_update_group',
		{
			description:
				'Update a PingOne group (PATCH semantics — provide only the fields to change). Worker token requires p1:update:group scope.',
			inputSchema: {
				...groupBaseShape,
				groupId: z.string().trim().min(1, 'groupId is required'),
				updates: z
					.record(z.unknown())
					.describe('Fields to update on the group, e.g. { "name": "New Name", "description": "..." }'),
			},
			outputSchema: groupResultShape,
		},
		async (args) => {
			logger.info('Updating PingOne group', { environmentId: args.environmentId, groupId: args.groupId });
			try {
				const result = await updateGroupApi(args);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? 'Group updated successfully.'
								: `Failed: ${result.error?.message}`,
						},
					],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.UpdateGroup – failed', { error });
				return buildToolErrorResult(error, 'PingOne update group');
			}
		}
	);

	// ── pingone_delete_group ─────────────────────────────────────────────────
	server.registerTool(
		'pingone_delete_group',
		{
			description:
				'Delete a PingOne group by ID. This is irreversible. Worker token requires p1:delete:group scope.',
			inputSchema: {
				...groupBaseShape,
				groupId: z.string().trim().min(1, 'groupId is required'),
			},
			outputSchema: opResultShape,
		},
		async (args) => {
			logger.info('Deleting PingOne group', { environmentId: args.environmentId, groupId: args.groupId });
			try {
				const result = await deleteGroupApi(args);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Group ${args.groupId} deleted successfully.`
								: `Failed: ${result.error?.message}`,
						},
					],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.DeleteGroup – failed', { error });
				return buildToolErrorResult(error, 'PingOne delete group');
			}
		}
	);
}
