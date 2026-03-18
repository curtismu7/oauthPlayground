/**
 * MCP tools: PingOne user get, list, groups, roles, lookup; population get/list (worker token).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import {
	getUser as getUserApi,
	listUsers as listUsersApi,
	getUserGroups as getUserGroupsApi,
	getUserRoles as getUserRolesApi,
	lookupUsers as lookupUsersApi,
	getPopulation as getPopulationApi,
	listPopulations as listPopulationsApi,
	getUserConsents as getUserConsentsApi,
	createUser as createUserApi,
	updateUser as updateUserApi,
	deleteUser as deleteUserApi,
	addUserToGroup as addUserToGroupApi,
	removeUserFromGroup as removeUserFromGroupApi,
} from '../services/pingoneUserClient.js';

const getUserInputShape = {
	environmentId: z.string().trim().optional().describe('Leave blank — uses credentials loaded from the playground app storage. Call pingone_show_stored_config to verify.'),
	userId: z.string().trim().min(1, 'userId is required'),
	workerToken: z.string().trim().optional().describe('Leave blank — server will auto-fetch a token using stored credentials.'),
	clientId: z.string().trim().optional().describe('Leave blank — uses client_id loaded from the playground app storage.'),
	clientSecret: z.string().trim().optional().describe('Leave blank — uses client_secret loaded from the playground app storage.'),
	region: z.string().trim().optional(),
} as const;

const getUserOutputShape = {
	success: z.boolean(),
	user: z.record(z.unknown()).optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const listUsersInputShape = {
	environmentId: z.string().trim().optional().describe('Leave blank — uses credentials loaded from the playground app storage. Call pingone_show_stored_config to verify.'),
	workerToken: z.string().trim().optional().describe('Leave blank — server will auto-fetch a token using stored credentials.'),
	clientId: z.string().trim().optional().describe('Leave blank — uses client_id loaded from the playground app storage.'),
	clientSecret: z.string().trim().optional().describe('Leave blank — uses client_secret loaded from the playground app storage.'),
	region: z.string().trim().optional(),
	filter: z.string().trim().optional(),
	limit: z.number().int().min(1).max(200).optional(),
	/** Next page URL from previous response. Omit for first page. */
	nextPageUrl: z.string().trim().optional(),
} as const;

const listUsersOutputShape = {
	success: z.boolean(),
	users: z.array(z.record(z.unknown())).optional(),
	count: z.number().optional(),
	size: z.number().optional(),
	nextPageUrl: z.string().optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const getUserOutputSchema = z.object(getUserOutputShape);
const listUsersOutputSchema = z.object(listUsersOutputShape);

export function registerUserTools(server: McpServer, logger: Logger): void {
	server.registerTool(
		'pingone_get_user',
		{
			description:
				'Get a PingOne user profile by ID. Uses worker token or client credentials from storage/env.',
			inputSchema: getUserInputShape,
			outputSchema: getUserOutputShape,
		},
		async (args, extra) => {
			logger.info('Getting PingOne user', { userId: args.userId, environmentId: args.environmentId ?? '(from env)' });
			try {
				const parsed = z.object(getUserInputShape).parse(args);
				const signal = (extra as { signal?: AbortSignal })?.signal;
				const result = await getUserApi({ ...parsed, signal });
				const structured = getUserOutputSchema.parse({
					success: result.success,
					user: result.user,
					raw: result.raw,
					error: result.error,
				}) as Record<string, unknown>;
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `User: ${JSON.stringify(result.user, null, 2)}`
								: `Get user failed: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.GetUser – Get user failed', { error });
				return buildToolErrorResult('pingone_get_user', error);
			}
		}
	);

	server.registerTool(
		'pingone_list_users',
		{
			description:
				'List PingOne users with optional SCIM filter. Uses worker token or client credentials from storage/env.',
			inputSchema: listUsersInputShape,
			outputSchema: listUsersOutputShape,
		},
		async (args, extra) => {
			logger.info('Listing PingOne users', { environmentId: args.environmentId ?? '(from env)', filter: args.filter });
			try {
				const parsed = z.object(listUsersInputShape).parse(args);
				const signal = (extra as { signal?: AbortSignal })?.signal;
				const result = await listUsersApi({ ...parsed, signal });
				const structured = listUsersOutputSchema.parse({
					success: result.success,
					users: result.users,
					count: result.count,
					size: result.size,
					nextPageUrl: result.nextPageUrl,
					raw: result.raw,
					error: result.error,
				}) as Record<string, unknown>;
				const size = result.size ?? result.users?.length ?? 0;
				const paginationHint = result.nextPageUrl
					? ` More pages: pass nextPageUrl for next page.`
					: '';
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Found ${size} user(s) on this page${result.count != null ? ` (total: ${result.count})` : ''}.${paginationHint} ${JSON.stringify(result.users ?? [], null, 2)}`
								: `List users failed: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.ListUsers – List users failed', { error });
				return buildToolErrorResult('pingone_list_users', error);
			}
		}
	);

	const userGroupsInput = {
		environmentId: z.string().trim().optional(),
		userId: z.string().trim().min(1, 'userId is required'),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;
	const userGroupsOutput = {
		success: z.boolean(),
		groups: z.array(z.record(z.unknown())).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_get_user_groups',
		{
			description: 'Get groups for a PingOne user (memberOfGroups). Uses worker token or client credentials.',
			inputSchema: userGroupsInput,
			outputSchema: userGroupsOutput,
		},
		async (args) => {
			logger.info('Getting user groups', { userId: args.userId });
			try {
				const parsed = z.object(userGroupsInput).parse(args);
				const result = await getUserGroupsApi(parsed);
				const structured = { success: result.success, groups: result.groups, raw: result.raw, error: result.error };
				return {
					content: [{ type: 'text' as const, text: result.success ? `Groups: ${JSON.stringify(result.groups ?? [], null, 2)}` : `Failed: ${result.error?.message ?? 'Unknown'}` }],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetUserGroups – failed', { error });
				return buildToolErrorResult('pingone_get_user_groups', error);
			}
		}
	);

	const userRolesInput = {
		environmentId: z.string().trim().optional(),
		userId: z.string().trim().min(1, 'userId is required'),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;
	const userRolesOutput = {
		success: z.boolean(),
		roles: z.array(z.record(z.unknown())).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_get_user_roles',
		{
			description: 'Get role assignments for a PingOne user. Uses worker token or client credentials.',
			inputSchema: userRolesInput,
			outputSchema: userRolesOutput,
		},
		async (args) => {
			logger.info('Getting user roles', { userId: args.userId });
			try {
				const parsed = z.object(userRolesInput).parse(args);
				const result = await getUserRolesApi(parsed);
				const structured = { success: result.success, roles: result.roles, raw: result.raw, error: result.error };
				return {
					content: [{ type: 'text' as const, text: result.success ? `Roles: ${JSON.stringify(result.roles ?? [], null, 2)}` : `Failed: ${result.error?.message ?? 'Unknown'}` }],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetUserRoles – failed', { error });
				return buildToolErrorResult('pingone_get_user_roles', error);
			}
		}
	);

	const lookupUsersInput = {
		environmentId: z.string().trim().optional(),
		identifier: z.string().trim().min(1, 'identifier is required'),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;
	const lookupUsersOutput = {
		success: z.boolean(),
		users: z.array(z.record(z.unknown())).optional(),
		user: z.record(z.unknown()).optional(),
		matchType: z.enum(['id', 'filter']).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_lookup_users',
		{
			description: 'Look up PingOne users by identifier (UUID → direct; else username/email filter). Uses worker token or client credentials.',
			inputSchema: lookupUsersInput,
			outputSchema: lookupUsersOutput,
		},
		async (args) => {
			logger.info('Looking up users', { identifier: args.identifier });
			try {
				const parsed = z.object(lookupUsersInput).parse(args);
				const result = await lookupUsersApi(parsed);
				const structured = { success: result.success, users: result.users, user: result.user, matchType: result.matchType, raw: result.raw, error: result.error };
				const text = result.success
					? `Match: ${result.matchType}. ${(result.users?.length ?? 0)} user(s): ${JSON.stringify(result.users ?? [], null, 2)}`
					: `Failed: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.LookupUsers – failed', { error });
				return buildToolErrorResult('pingone_lookup_users', error);
			}
		}
	);

	const getPopulationInput = {
		environmentId: z.string().trim().optional(),
		populationId: z.string().trim().min(1, 'populationId is required'),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;
	const getPopulationOutput = {
		success: z.boolean(),
		population: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_get_population',
		{
			description: 'Get a PingOne population by ID. Uses worker token or client credentials.',
			inputSchema: getPopulationInput,
			outputSchema: getPopulationOutput,
		},
		async (args) => {
			logger.info('Getting population', { populationId: args.populationId });
			try {
				const parsed = z.object(getPopulationInput).parse(args);
				const result = await getPopulationApi(parsed);
				const structured = { success: result.success, population: result.population, raw: result.raw, error: result.error };
				return {
					content: [{ type: 'text' as const, text: result.success ? `Population: ${JSON.stringify(result.population, null, 2)}` : `Failed: ${result.error?.message ?? 'Unknown'}` }],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetPopulation – failed', { error });
				return buildToolErrorResult('pingone_get_population', error);
			}
		}
	);

	const listPopulationsInput = {
		environmentId: z.string().trim().optional(),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
		limit: z.number().int().min(1).max(200).optional(),
		nextPageUrl: z.string().trim().optional().describe('Next page URL from previous response. Omit for first page.'),
	} as const;
	const listPopulationsOutput = {
		success: z.boolean(),
		populations: z.array(z.record(z.unknown())).optional(),
		count: z.number().optional(),
		size: z.number().optional(),
		nextPageUrl: z.string().optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_list_populations',
		{
			description: 'List PingOne populations in the environment. Supports pagination via nextPageUrl. Uses worker token or client credentials.',
			inputSchema: listPopulationsInput,
			outputSchema: listPopulationsOutput,
		},
		async (args) => {
			logger.info('Listing populations');
			try {
				const parsed = z.object(listPopulationsInput).parse(args);
				const result = await listPopulationsApi(parsed);
				const structured = {
					success: result.success,
					populations: result.populations,
					count: result.count,
					size: result.size,
					nextPageUrl: result.nextPageUrl,
					raw: result.raw,
					error: result.error,
				};
				const size = result.populations?.length ?? 0;
				const paginationNote = result.nextPageUrl ? ' More pages available — pass nextPageUrl for next page.' : '';
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Found ${size} population(s) on this page.${paginationNote} ${JSON.stringify(result.populations ?? [], null, 2)}`
								: `Failed: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.ListPopulations – failed', { error });
				return buildToolErrorResult('pingone_list_populations', error);
			}
		}
	);

	const getUserConsentsInput = {
		environmentId: z.string().trim().optional(),
		userId: z.string().trim().min(1, 'userId is required'),
		accessToken: z.string().trim().optional().describe('User access token (preferred for consent scope). Falls back to workerToken.'),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
		limit: z.number().int().min(1).max(200).optional().describe('Max consents to return (default: 200).'),
	} as const;
	const getUserConsentsOutput = {
		success: z.boolean(),
		consents: z.array(z.record(z.unknown())).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_get_user_consents',
		{
			description:
				'Get consent records for a PingOne user. ' +
				'PingOne API: GET /environments/{envId}/users/{userId}/consents. ' +
				'Prefers an accessToken (user context with consent scope); falls back to workerToken (returns empty if 403). ' +
				'Returns list of consent objects (scope, application, status, dates).',
			inputSchema: getUserConsentsInput,
			outputSchema: getUserConsentsOutput,
		},
		async (args) => {
			logger.info('Getting user consents', { userId: args.userId });
			try {
				const parsed = z.object(getUserConsentsInput).parse(args);
				const result = await getUserConsentsApi(parsed);
				const structured = { success: result.success, consents: result.consents, raw: result.raw, error: result.error };
				const count = result.consents?.length ?? 0;
				const text = result.success
					? `Found ${count} consent record(s) for user ${args.userId}. ${JSON.stringify(result.consents ?? [], null, 2)}`
					: `Failed to get consents: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetUserConsents – failed', { error });
				return buildToolErrorResult('pingone_get_user_consents', error);
			}
		}
	);

	// ── User CRUD ─────────────────────────────────────────────────────────────

	const workerBaseShape = {
		environmentId: z.string().trim().optional(),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;

	const userResultShape = {
		success: z.boolean(),
		user: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;

	const opResultShape = {
		success: z.boolean(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;

	server.registerTool(
		'pingone_create_user',
		{
			description:
				'Create a new PingOne user. ' +
				'PingOne API: POST /environments/{envId}/users. ' +
				'The `user` object must include at minimum `username` and `population.id` (object with `id` key). ' +
				'Worker token requires p1:create:user scope.',
			inputSchema: {
				...workerBaseShape,
				user: z.record(z.unknown()).describe('User attributes object. Must include `username` and `population.id` at minimum.'),
			},
			outputSchema: userResultShape,
		},
		async (args) => {
			logger.info('Creating PingOne user', { username: (args.user as Record<string, unknown>)?.username });
			try {
				const parsed = z.object({ ...workerBaseShape, user: z.record(z.unknown()) }).parse(args);
				const result = await createUserApi(parsed);
				const text = result.success
					? `User created: ${JSON.stringify(result.user, null, 2)}`
					: `Failed to create user: ${result.error?.message ?? 'Unknown error'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.CreateUser – failed', { error });
				return buildToolErrorResult('pingone_create_user', error);
			}
		}
	);

	server.registerTool(
		'pingone_update_user',
		{
			description:
				'Update (PATCH) a PingOne user profile — only specified fields are changed. ' +
				'PingOne API: PATCH /environments/{envId}/users/{userId}. ' +
				'Worker token requires p1:update:user scope.',
			inputSchema: {
				...workerBaseShape,
				userId: z.string().trim().min(1, 'userId is required'),
				updates: z.record(z.unknown()).describe('Fields to update. Only provided fields are changed.'),
			},
			outputSchema: userResultShape,
		},
		async (args) => {
			logger.info('Updating PingOne user', { userId: args.userId });
			try {
				const parsed = z.object({ ...workerBaseShape, userId: z.string().trim().min(1), updates: z.record(z.unknown()) }).parse(args);
				const result = await updateUserApi(parsed);
				const text = result.success
					? `User updated: ${JSON.stringify(result.user, null, 2)}`
					: `Failed to update user: ${result.error?.message ?? 'Unknown error'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.UpdateUser – failed', { error });
				return buildToolErrorResult('pingone_update_user', error);
			}
		}
	);

	server.registerTool(
		'pingone_delete_user',
		{
			description:
				'Delete a PingOne user permanently. ' +
				'PingOne API: DELETE /environments/{envId}/users/{userId}. ' +
				'Worker token requires p1:delete:user scope. This action is irreversible.',
			inputSchema: {
				...workerBaseShape,
				userId: z.string().trim().min(1, 'userId is required'),
			},
			outputSchema: opResultShape,
		},
		async (args) => {
			logger.info('Deleting PingOne user', { userId: args.userId });
			try {
				const parsed = z.object({ ...workerBaseShape, userId: z.string().trim().min(1) }).parse(args);
				const result = await deleteUserApi(parsed);
				const text = result.success
					? `User ${args.userId} deleted successfully.`
					: `Failed to delete user: ${result.error?.message ?? 'Unknown error'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.DeleteUser – failed', { error });
				return buildToolErrorResult('pingone_delete_user', error);
			}
		}
	);

	// ── User group membership ─────────────────────────────────────────────────

	const groupMembershipShape = {
		...workerBaseShape,
		userId: z.string().trim().min(1, 'userId is required'),
		groupId: z.string().trim().min(1, 'groupId is required'),
	} as const;

	const groupMembershipResultShape = {
		success: z.boolean(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;

	server.registerTool(
		'pingone_add_user_to_group',
		{
			description:
				'Add a PingOne user to a group. ' +
				'PingOne API: POST /environments/{envId}/users/{userId}/memberOfGroups. ' +
				'Worker token requires p1:update:userMembership scope.',
			inputSchema: groupMembershipShape,
			outputSchema: groupMembershipResultShape,
		},
		async (args) => {
			logger.info('Adding user to group', { userId: args.userId, groupId: args.groupId });
			try {
				const parsed = z.object(groupMembershipShape).parse(args);
				const result = await addUserToGroupApi(parsed);
				const text = result.success
					? `User ${args.userId} added to group ${args.groupId}.`
					: `Failed to add user to group: ${result.error?.message ?? 'Unknown error'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.AddUserToGroup – failed', { error });
				return buildToolErrorResult('pingone_add_user_to_group', error);
			}
		}
	);

	server.registerTool(
		'pingone_remove_user_from_group',
		{
			description:
				'Remove a PingOne user from a group. ' +
				'PingOne API: DELETE /environments/{envId}/users/{userId}/memberOfGroups/{groupId}. ' +
				'Worker token requires p1:delete:userMembership scope.',
			inputSchema: groupMembershipShape,
			outputSchema: opResultShape,
		},
		async (args) => {
			logger.info('Removing user from group', { userId: args.userId, groupId: args.groupId });
			try {
				const parsed = z.object(groupMembershipShape).parse(args);
				const result = await removeUserFromGroupApi(parsed);
				const text = result.success
					? `User ${args.userId} removed from group ${args.groupId}.`
					: `Failed to remove user from group: ${result.error?.message ?? 'Unknown error'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: result as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.RemoveUserFromGroup – failed', { error });
				return buildToolErrorResult('pingone_remove_user_from_group', error);
			}
		}
	);
}
