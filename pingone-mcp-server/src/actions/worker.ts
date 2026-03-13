import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import {
	createApplication,
	deleteApplication,
	getApplication,
	getApplicationResources,
	getApplicationSecret,
	issueWorkerToken,
	listApplications,
	rotateApplicationSecret,
	toPingOneErrorPayload,
	updateApplication,
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

const getAppInputShape = {
	environmentId: z.string().trim().optional(),
	appId: z.string().trim(),
	workerToken: z.string().trim().optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	region: z.string().trim().optional(),
} as const;

const getAppResourcesInputShape = {
	environmentId: z.string().trim().optional(),
	appId: z.string().trim().min(1, 'appId is required'),
	workerToken: z.string().trim().optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
	region: z.string().trim().optional(),
} as const;

const getAppResourcesOutputSchema = z.object({
	success: z.boolean(),
	resources: z.array(z.record(z.unknown())).optional(),
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

const getAppOutputSchema = z.object({
	success: z.boolean(),
	application: applicationSchema.optional(),
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

/** Shared handler for worker token issue (used by both pingone.workerToken.issue and pingone_get_worker_token). */
async function handleIssueWorkerToken(
	args: unknown,
	logger: Logger
): Promise<{ content: Array<{ type: 'text'; text: string }>; structuredContent: Record<string, unknown> }> {
	logger.info('Issuing PingOne worker token', {
		environmentId: (args as Record<string, unknown>)?.environmentId,
		clientId: (args as Record<string, unknown>)?.clientId,
	});

	try {
		const parsed = z.object(workerTokenInputShape).parse(args);
		const result = await issueWorkerToken(parsed);
		const structured = workerTokenOutputSchema.parse(result as unknown) as Record<string, unknown>;

		return {
			content: [
				{ type: 'text' as const, text: 'PingOne worker token issued successfully.' },
				{ type: 'text' as const, text: `Expires at: ${structured.expiresAt ?? 'unknown'}` },
			],
			structuredContent: structured,
		};
	} catch (error) {
		logger.error('MCP.WorkerToken.Issue – Worker token issuance failed', { error });
		return buildErrorResult('PingOne worker token issuance', error, workerTokenOutputSchema);
	}
}

const workerTokenIssueToolConfig = {
	description: 'Exchange PingOne client credentials for a worker token. Uses credentials from storage or env if not provided.',
	inputSchema: workerTokenInputShape,
	outputSchema: workerTokenOutputShape,
} as const;

export function registerWorkerTools(server: McpServer, logger: Logger) {
	server.registerTool('pingone.workerToken.issue', workerTokenIssueToolConfig, (args) =>
		handleIssueWorkerToken(args, logger)
	);

	server.registerTool('pingone_get_worker_token', workerTokenIssueToolConfig, (args) =>
		handleIssueWorkerToken(args, logger)
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

	server.registerTool(
		'pingone_get_application',
		{
			description: 'Get a single PingOne application by ID (worker token or client credentials).',
			inputSchema: getAppInputShape,
			outputSchema: getAppOutputSchema,
		},
		async (args) => {
			logger.info('Getting PingOne application', {
				environmentId: args.environmentId,
				appId: args.appId,
			});

			try {
				const parsed = z.object(getAppInputShape).parse(args);
				const result = await getApplication(parsed);
				const structured = getAppOutputSchema.parse(result as unknown);
				const app = structured.application;

				return {
					content: [
						{
							type: 'text' as const,
							text: app
								? `Application: ${app.name ?? app.id} (${app.id})`
								: 'Application not found.',
						},
						{
							type: 'text' as const,
							text: JSON.stringify(structured.application ?? structured, null, 2),
						},
					],
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.GetApplication – Get application failed', { error });
				return buildErrorResult('PingOne get application', error, getAppOutputSchema);
			}
		}
	);

	server.registerTool(
		'pingone_get_application_resources',
		{
			description: 'Get resource (scopes) configuration for a PingOne application. Uses worker token or client credentials.',
			inputSchema: getAppResourcesInputShape,
			outputSchema: getAppResourcesOutputSchema,
		},
		async (args) => {
			logger.info('Getting application resources', {
				environmentId: args.environmentId,
				appId: args.appId,
			});

			try {
				const parsed = z.object(getAppResourcesInputShape).parse(args);
				const result = await getApplicationResources(parsed);
				const structured = getAppResourcesOutputSchema.parse({
					success: result.success,
					resources: result.resources,
					raw: result.raw,
					error: !result.success && 'error' in result ? result.error : undefined,
				});
				const count = result.resources?.length ?? 0;
				return {
					content: [
						{
							type: 'text' as const,
							text: result.success
								? `Application resources (${count}): ${JSON.stringify(result.resources ?? [], null, 2)}`
								: `Failed: ${'error' in result ? result.error?.message : 'Unknown'}`,
						},
					],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetApplicationResources – failed', { error });
				return buildErrorResult('PingOne get application resources', error, getAppResourcesOutputSchema);
			}
		}
	);

	// ─── Application CRUD ─────────────────────────────────────────────────

	const appCrudBaseShape = {
		environmentId: z.string().trim().optional(),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;

	const appResultSchema = z.object({
		success: z.boolean(),
		application: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ status: z.number().nullish(), code: z.string().nullish(), message: z.string(), description: z.string().nullish(), details: z.unknown().optional() }).optional(),
	});

	const deleteResultSchema = z.object({
		success: z.boolean(),
		error: z.object({ status: z.number().nullish(), code: z.string().nullish(), message: z.string(), description: z.string().nullish(), details: z.unknown().optional() }).optional(),
	});

	const secretResultSchema = z.object({
		success: z.boolean(),
		secret: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ status: z.number().nullish(), code: z.string().nullish(), message: z.string(), description: z.string().nullish(), details: z.unknown().optional() }).optional(),
	});

	server.registerTool(
		'pingone_create_application',
		{
			description: 'Create a new PingOne application. The `application` object must include at minimum `name` and `type` (e.g. "WEB_APP", "NATIVE_APP", "WORKER", "SERVICE"). Worker token requires p1:create:application scope.',
			inputSchema: {
				...appCrudBaseShape,
				application: z.record(z.unknown()).describe('Full application definition. Must include name and type.'),
			},
			outputSchema: appResultSchema.shape,
		},
		async (args) => {
			logger.info('Creating PingOne application', { environmentId: args.environmentId });
			try {
				const result = await createApplication(args as Parameters<typeof createApplication>[0]);
				const structured = appResultSchema.parse(result);
				return {
					content: [{
						type: 'text' as const,
						text: result.success
							? `Application created: ${(result.application as Record<string,unknown>)?.['name'] ?? (result.application as Record<string,unknown>)?.['id'] ?? 'unknown'}`
							: `Failed: ${result.error?.message}`,
					}],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.CreateApplication – failed', { error });
				return buildErrorResult('PingOne create application', error, appResultSchema);
			}
		}
	);

	server.registerTool(
		'pingone_update_application',
		{
			description: 'Update an existing PingOne application (PATCH). Provide only the fields to change. Worker token requires p1:update:application scope.',
			inputSchema: {
				...appCrudBaseShape,
				appId: z.string().trim().min(1, 'appId is required'),
				updates: z.record(z.unknown()).describe('Fields to update on the application (PATCH semantics).'),
			},
			outputSchema: appResultSchema.shape,
		},
		async (args) => {
			logger.info('Updating PingOne application', { environmentId: args.environmentId, appId: args.appId });
			try {
				const result = await updateApplication(args as Parameters<typeof updateApplication>[0]);
				const structured = appResultSchema.parse(result);
				return {
					content: [{
						type: 'text' as const,
						text: result.success ? 'Application updated successfully.' : `Failed: ${result.error?.message}`,
					}],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.UpdateApplication – failed', { error });
				return buildErrorResult('PingOne update application', error, appResultSchema);
			}
		}
	);

	server.registerTool(
		'pingone_delete_application',
		{
			description: 'Delete a PingOne application by ID. This is irreversible. Worker token requires p1:delete:application scope.',
			inputSchema: {
				...appCrudBaseShape,
				appId: z.string().trim().min(1, 'appId is required'),
			},
			outputSchema: deleteResultSchema.shape,
		},
		async (args) => {
			logger.info('Deleting PingOne application', { environmentId: args.environmentId, appId: args.appId });
			try {
				const result = await deleteApplication(args as Parameters<typeof deleteApplication>[0]);
				const structured = deleteResultSchema.parse(result);
				return {
					content: [{
						type: 'text' as const,
						text: result.success ? `Application ${args.appId} deleted successfully.` : `Failed: ${result.error?.message}`,
					}],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.DeleteApplication – failed', { error });
				return buildErrorResult('PingOne delete application', error, deleteResultSchema);
			}
		}
	);

	server.registerTool(
		'pingone_get_application_secret',
		{
			description: 'Retrieve the current client secret for a PingOne application. Worker token requires p1:read:application scope.',
			inputSchema: {
				...appCrudBaseShape,
				appId: z.string().trim().min(1, 'appId is required'),
			},
			outputSchema: secretResultSchema.shape,
		},
		async (args) => {
			logger.info('Getting application secret', { environmentId: args.environmentId, appId: args.appId });
			try {
				const result = await getApplicationSecret(args as Parameters<typeof getApplicationSecret>[0]);
				const structured = secretResultSchema.parse(result);
				return {
					content: [{
						type: 'text' as const,
						text: result.success ? JSON.stringify(result.secret, null, 2) : `Failed: ${result.error?.message}`,
					}],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.GetApplicationSecret – failed', { error });
				return buildErrorResult('PingOne get application secret', error, secretResultSchema);
			}
		}
	);

	server.registerTool(
		'pingone_rotate_application_secret',
		{
			description: 'Rotate (regenerate) the client secret for a PingOne application. Returns the new secret. Worker token requires p1:update:application scope.',
			inputSchema: {
				...appCrudBaseShape,
				appId: z.string().trim().min(1, 'appId is required'),
			},
			outputSchema: secretResultSchema.shape,
		},
		async (args) => {
			logger.info('Rotating application secret', { environmentId: args.environmentId, appId: args.appId });
			try {
				const result = await rotateApplicationSecret(args as Parameters<typeof rotateApplicationSecret>[0]);
				const structured = secretResultSchema.parse(result);
				return {
					content: [{
						type: 'text' as const,
						text: result.success ? 'Application secret rotated successfully.' : `Failed: ${result.error?.message}`,
					}],
					structuredContent: structured as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.RotateApplicationSecret – failed', { error });
				return buildErrorResult('PingOne rotate application secret', error, secretResultSchema);
			}
		}
	);
}
