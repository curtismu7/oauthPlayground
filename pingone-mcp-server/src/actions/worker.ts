import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import {
	issueWorkerToken,
	listApplications,
	toPingOneErrorPayload,
} from '../services/pingoneManagementClient.js';

const workerTokenInputShape = {
	environmentId: z.string().trim().optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	scope: z.string().trim().optional(),
	tokenEndpointAuthMethod: z.enum(['client_secret_post', 'client_secret_basic']).optional(),
} as const;

const workerTokenOutputSchema = z.object({
	success: z.boolean(),
	accessToken: z.string().optional(),
	tokenType: z.string().optional(),
	scope: z.string().optional(),
	expiresIn: z.number().optional(),
	expiresAt: z.string().optional(),
	raw: z.unknown().optional(),
	error: z
		.object({
			status: z.number().nullish(),
			code: z.string().nullish(),
			message: z.string(),
			description: z.string().nullish(),
			details: z.unknown().optional(),
		})
		.optional(),
});

const workerTokenOutputShape = workerTokenOutputSchema.shape;

const listAppsInputShape = {
	environmentId: z.string().trim().optional(),
	region: z.string().trim().optional(),
	workerToken: z.string().trim().optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	scope: z.string().trim().optional(),
	includeSecret: z.boolean().optional(),
	limit: z.number().int().positive().max(200).optional(),
} as const;

const applicationSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	description: z.string().optional(),
	clientId: z.string().optional(),
	type: z.string().optional(),
	status: z.string().optional(),
	redirectUris: z.array(z.string()).optional(),
	postLogoutRedirectUris: z.array(z.string()).optional(),
	scopes: z.array(z.string()).optional(),
	grantTypes: z.array(z.string()).optional(),
	tokenEndpointAuthMethod: z.string().optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

const listAppsOutputSchema = z.object({
	success: z.boolean(),
	applications: z.array(applicationSchema).optional(),
	raw: z.unknown().optional(),
	error: z
		.object({
			status: z.number().nullish(),
			code: z.string().nullish(),
			message: z.string(),
			description: z.string().nullish(),
			details: z.unknown().optional(),
		})
		.optional(),
});

const listAppsOutputShape = listAppsOutputSchema.shape;

function buildErrorResult<T extends z.ZodObject<any>>(
	component: string,
	error: unknown,
	validator: T
) {
	const payload = toPingOneErrorPayload(error);
	const structured = validator.parse({
		success: false,
		error: payload,
	}) as Record<string, unknown>;

	return {
		content: [
			{
				type: 'text' as const,
				text: `${component} failed: ${payload.message}`,
			},
			{
				type: 'text' as const,
				text: `Details: ${JSON.stringify(payload, null, 2)}`,
			},
		],
		structuredContent: structured,
	};
}

export function registerWorkerTools(server: McpServer, logger: Logger) {
	server.registerTool(
		'pingone.workerToken.issue',
		{
			description: 'Exchange PingOne client credentials for a worker token.',
			inputSchema: workerTokenInputShape,
			outputSchema: workerTokenOutputShape,
		},
		async (args) => {
			logger.info('Issuing PingOne worker token', {
				environmentId: args.environmentId,
				clientId: args.clientId,
			});

			try {
				const parsed = z.object(workerTokenInputShape).parse(args);
				const result = await issueWorkerToken(parsed);
				const structured = workerTokenOutputSchema.parse(result as unknown);

				return {
					content: [
						{
							type: 'text' as const,
							text: 'PingOne worker token issued successfully.',
						},
						{
							type: 'text' as const,
							text: `Expires at: ${structured.expiresAt ?? 'unknown'}`,
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.WorkerToken.Issue – Worker token issuance failed', { error });
				return buildErrorResult('PingOne worker token issuance', error, workerTokenOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone.applications.list',
		{
			description: 'List PingOne applications using either a worker token or client credentials.',
			inputSchema: listAppsInputShape,
			outputSchema: listAppsOutputShape,
		},
		async (args) => {
			logger.info('Listing PingOne applications', {
				environmentId: args.environmentId,
				hasWorkerToken: Boolean(args.workerToken),
			});

			try {
				const parsed = z.object(listAppsInputShape).parse(args);
				const result = await listApplications(parsed);
				const structured = listAppsOutputSchema.parse(result as unknown);
				const applications = Array.isArray(structured.applications) ? structured.applications : [];

				return {
					content: [
						{
							type: 'text' as const,
							text: `Retrieved ${applications.length} applications from PingOne.`,
						},
						{
							type: 'text' as const,
							text: JSON.stringify(applications, null, 2),
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.Applications.List – Application listing failed', { error });
				return buildErrorResult('PingOne application listing', error, listAppsOutputSchema);
			}
		}
	);
}
