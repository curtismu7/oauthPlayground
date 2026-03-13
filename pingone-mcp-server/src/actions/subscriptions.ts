/**
 * MCP tools: PingOne Webhook Subscriptions (CRUD).
 * Phase 8 — Subscriptions: list, get, create, update, delete.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import {
	listSubscriptions,
	getSubscription,
	createSubscription,
	updateSubscription,
	deleteSubscription,
} from '../services/pingoneSubscriptionsClient.js';

const credentialsShape = {
	environmentId: z.string().trim().optional(),
	workerToken: z.string().trim().min(1, 'workerToken is required'),
	region: z
		.enum(['us', 'na', 'eu', 'ca', 'ap', 'asia', 'au', 'sg'])
		.optional()
		.describe('PingOne region (default: na/com).'),
} as const;

const subscriptionOutputShape = {
	success: z.boolean(),
	subscription: z.record(z.unknown()).optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const subscriptionsListOutputShape = {
	success: z.boolean(),
	subscriptions: z.array(z.record(z.unknown())).optional(),
	raw: z.unknown().optional(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

const deleteOutputShape = {
	success: z.boolean(),
	error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
} as const;

export function registerSubscriptionTools(server: McpServer, logger: Logger): void {
	// ── List Subscriptions ──────────────────────────────────────────────────────
	server.registerTool(
		'pingone_list_subscriptions',
		{
			description:
				'List all webhook subscriptions in a PingOne environment. ' +
				'PingOne API: GET /environments/{envId}/subscriptions. ' +
				'Requires a worker token with subscription read scope.',
			inputSchema: credentialsShape,
			outputSchema: subscriptionsListOutputShape,
		},
		async (args) => {
			logger.info('Listing PingOne webhook subscriptions', { environmentId: args.environmentId ?? '(from env)' });
			try {
				const parsed = z.object(credentialsShape).parse(args);
				const result = await listSubscriptions(parsed);
				const count = result.subscriptions?.length ?? 0;
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Found ${count} subscription(s).\n${JSON.stringify(result.subscriptions ?? [], null, 2)}`
								: `Failed: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: { success: result.success, subscriptions: result.subscriptions, raw: result.raw, error: result.error } as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.ListSubscriptions – failed', { error });
				return buildToolErrorResult('pingone_list_subscriptions', error);
			}
		}
	);

	// ── Get Subscription ────────────────────────────────────────────────────────
	const getSubInput = {
		...credentialsShape,
		subscriptionId: z.string().trim().min(1, 'subscriptionId is required'),
	} as const;
	server.registerTool(
		'pingone_get_subscription',
		{
			description:
				'Get a single webhook subscription by ID. ' +
				'PingOne API: GET /environments/{envId}/subscriptions/{subscriptionId}.',
			inputSchema: getSubInput,
			outputSchema: subscriptionOutputShape,
		},
		async (args) => {
			logger.info('Getting subscription', { subscriptionId: args.subscriptionId });
			try {
				const parsed = z.object(getSubInput).parse(args);
				const result = await getSubscription(parsed);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Subscription: ${JSON.stringify(result.subscription, null, 2)}`
								: `Failed: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: { success: result.success, subscription: result.subscription, raw: result.raw, error: result.error } as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetSubscription – failed', { error });
				return buildToolErrorResult('pingone_get_subscription', error);
			}
		}
	);

	// ── Create Subscription ─────────────────────────────────────────────────────
	const createSubInput = {
		...credentialsShape,
		name: z.string().trim().min(1, 'name is required').describe('Subscription name.'),
		httpEndpointUrl: z.string().url('httpEndpointUrl must be a valid URL').describe('Webhook endpoint URL.'),
		httpEndpointHeaders: z
			.record(z.string())
			.optional()
			.describe('Optional HTTP headers to include with webhook deliveries.'),
		filterTags: z
			.array(z.string())
			.optional()
			.describe('Event filter tags (e.g. ["ACCOUNT.USER_STATUS_CHANGED"]).'),
		enabled: z.boolean().optional().describe('Whether the subscription is enabled (default: true).'),
		format: z
			.enum(['ACTIVITY', 'SPLUNK'])
			.optional()
			.describe('Payload format. Defaults to ACTIVITY.'),
		verifyTlsCertificates: z
			.boolean()
			.optional()
			.describe('Whether to verify TLS certificates on the endpoint.'),
	} as const;
	server.registerTool(
		'pingone_create_subscription',
		{
			description:
				'Create a new webhook subscription in PingOne. ' +
				'PingOne API: POST /environments/{envId}/subscriptions. ' +
				'Requires name and httpEndpointUrl. Filter tags control which events are delivered.',
			inputSchema: createSubInput,
			outputSchema: subscriptionOutputShape,
		},
		async (args) => {
			logger.info('Creating subscription', { name: args.name, url: args.httpEndpointUrl });
			try {
				const parsed = z.object(createSubInput).parse(args);
				const result = await createSubscription(parsed);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Created subscription "${args.name}" (id: ${(result.subscription as Record<string, unknown>)?.id ?? 'unknown'}).\n${JSON.stringify(result.subscription, null, 2)}`
								: `Failed to create subscription: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: { success: result.success, subscription: result.subscription, raw: result.raw, error: result.error } as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.CreateSubscription – failed', { error });
				return buildToolErrorResult('pingone_create_subscription', error);
			}
		}
	);

	// ── Update Subscription ─────────────────────────────────────────────────────
	const updateSubInput = {
		...credentialsShape,
		subscriptionId: z.string().trim().min(1, 'subscriptionId is required'),
		name: z.string().trim().optional(),
		httpEndpointUrl: z.string().url().optional(),
		httpEndpointHeaders: z.record(z.string()).optional(),
		filterTags: z.array(z.string()).optional(),
		enabled: z.boolean().optional(),
		format: z.enum(['ACTIVITY', 'SPLUNK']).optional(),
		verifyTlsCertificates: z.boolean().optional(),
	} as const;
	server.registerTool(
		'pingone_update_subscription',
		{
			description:
				'Update an existing webhook subscription. ' +
				'PingOne API: PUT /environments/{envId}/subscriptions/{subscriptionId}. ' +
				'Pass only the fields you want to change.',
			inputSchema: updateSubInput,
			outputSchema: subscriptionOutputShape,
		},
		async (args) => {
			logger.info('Updating subscription', { subscriptionId: args.subscriptionId });
			try {
				const parsed = z.object(updateSubInput).parse(args);
				const { subscriptionId, environmentId, workerToken, region, ...fields } = parsed;
				const updates: Record<string, unknown> = {};
				if (fields.name !== undefined) updates.name = fields.name;
				if (fields.httpEndpointUrl !== undefined || fields.httpEndpointHeaders !== undefined) {
					updates.httpEndpoint = {
						...(fields.httpEndpointUrl !== undefined ? { url: fields.httpEndpointUrl } : {}),
						...(fields.httpEndpointHeaders !== undefined ? { headers: fields.httpEndpointHeaders } : {}),
					};
				}
				if (fields.filterTags !== undefined) updates.filterTags = fields.filterTags;
				if (fields.enabled !== undefined) updates.enabled = fields.enabled;
				if (fields.format !== undefined) updates.format = fields.format;
				if (fields.verifyTlsCertificates !== undefined) updates.verifyTlsCertificates = fields.verifyTlsCertificates;

				const result = await updateSubscription({ environmentId, workerToken, region, subscriptionId, updates });
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Updated subscription ${subscriptionId}.\n${JSON.stringify(result.subscription, null, 2)}`
								: `Failed to update subscription: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: { success: result.success, subscription: result.subscription, raw: result.raw, error: result.error } as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.UpdateSubscription – failed', { error });
				return buildToolErrorResult('pingone_update_subscription', error);
			}
		}
	);

	// ── Delete Subscription ─────────────────────────────────────────────────────
	const deleteSubInput = {
		...credentialsShape,
		subscriptionId: z.string().trim().min(1, 'subscriptionId is required'),
	} as const;
	server.registerTool(
		'pingone_delete_subscription',
		{
			description:
				'Delete a webhook subscription by ID. ' +
				'PingOne API: DELETE /environments/{envId}/subscriptions/{subscriptionId}. ' +
				'Returns 204 No Content on success.',
			inputSchema: deleteSubInput,
			outputSchema: deleteOutputShape,
		},
		async (args) => {
			logger.info('Deleting subscription', { subscriptionId: args.subscriptionId });
			try {
				const parsed = z.object(deleteSubInput).parse(args);
				const result = await deleteSubscription(parsed);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Subscription ${args.subscriptionId} deleted successfully.`
								: `Failed to delete subscription: ${result.error?.message ?? 'Unknown'}`,
						},
					],
					structuredContent: { success: result.success, error: result.error } as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.DeleteSubscription – failed', { error });
				return buildToolErrorResult('pingone_delete_subscription', error);
			}
		}
	);
}
