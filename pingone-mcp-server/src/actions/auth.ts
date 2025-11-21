import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import {
	authenticateUser,
	getUserInfo,
	refreshAccessToken,
	revokeToken,
	toPingOneErrorPayload,
} from '../services/pingoneAuthClient.js';

const loginInputShape = {
	environmentId: z.string().trim().optional(),
	username: z.string().trim().min(1, 'username is required'),
	password: z.string().trim().min(1, 'password is required'),
	scope: z.string().trim().optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
} as const;

const refreshInputShape = {
	environmentId: z.string().trim().optional(),
	refreshToken: z.string().trim().min(1, 'refreshToken is required'),
	scope: z.string().trim().optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
} as const;

const revokeInputShape = {
	environmentId: z.string().trim().optional(),
	token: z.string().trim().min(1, 'token is required'),
	tokenTypeHint: z.enum(['access_token', 'refresh_token']).optional(),
	clientId: z.string().trim().optional(),
	clientSecret: z.string().trim().optional(),
} as const;

const userInfoInputShape = {
	environmentId: z.string().trim().optional(),
	accessToken: z.string().trim().min(1, 'accessToken is required'),
} as const;

const loginInputSchema = z.object(loginInputShape);
const refreshInputSchema = z.object(refreshInputShape);
const revokeInputSchema = z.object(revokeInputShape);
const userInfoInputSchema = z.object(userInfoInputShape);

const errorOutputShape = {
	status: z.number().nullish(),
	code: z.string().nullish(),
	message: z.string().optional(),
	description: z.string().nullish(),
	details: z.unknown().optional(),
} as const;

const tokenResultValidator = z.object({
	success: z.boolean(),
	tokenType: z.string().optional(),
	accessToken: z.string().optional(),
	refreshToken: z.string().optional(),
	idToken: z.string().optional(),
	scope: z.string().optional(),
	expiresIn: z.number().optional(),
	expiresAt: z.string().optional(),
	raw: z.unknown().optional(),
	error: z.object(errorOutputShape).optional(),
});

const operationResultValidator = z.object({
	success: z.boolean(),
	message: z.string().optional(),
	error: z.object(errorOutputShape).optional(),
});

const userInfoResultValidator = z.object({
	success: z.boolean(),
	userInfo: z.record(z.string(), z.unknown()).optional(),
	error: z.object(errorOutputShape).optional(),
});

const tokenOutputSchema = tokenResultValidator.shape;
const operationOutputSchema = operationResultValidator.shape;
const userInfoOutputSchema = userInfoResultValidator.shape;

function buildErrorResult<T extends z.ZodTypeAny>(component: string, error: unknown, validator: T) {
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

function buildSuccessContent(message: string) {
	return [
		{
			type: 'text' as const,
			text: message,
		},
		{
			type: 'text' as const,
			text: 'Token response received. Structured content contains the full payload.',
		},
	];
}

export function registerAuthTools(server: McpServer, logger: Logger) {
	server.registerTool(
		'pingone.auth.login',
		{
			description: 'Authenticate a user against PingOne using username/password credentials.',
			inputSchema: loginInputShape,
			outputSchema: tokenOutputSchema,
		},
		async (args) => {
			logger.info('Authenticating user via MCP', {
				environmentId: args.environmentId,
				username: args.username,
			});

			try {
				const parsed = loginInputSchema.parse(args);
				const result = await authenticateUser(parsed);
				const structured = tokenResultValidator.parse(result) as Record<string, unknown>;
				return {
					content: buildSuccessContent('PingOne authentication succeeded.'),
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.Auth.Login – PingOne authentication failed', { error });
				return buildErrorResult('PingOne authentication', error, tokenResultValidator);
			}
		}
	);

	server.registerTool(
		'pingone.auth.refresh',
		{
			description: 'Use a PingOne refresh token to obtain a new access token.',
			inputSchema: refreshInputShape,
			outputSchema: tokenOutputSchema,
		},
		async (args, _extra) => {
			logger.info('Refreshing PingOne token via MCP', {
				environmentId: args.environmentId,
			});

			try {
				const parsed = refreshInputSchema.parse(args);
				const result = await refreshAccessToken(parsed);
				const structured = tokenResultValidator.parse(result) as Record<string, unknown>;
				return {
					content: buildSuccessContent('PingOne token refresh succeeded.'),
					structuredContent: structured,
				};
			} catch (error) {
				logger.error('MCP.Auth.Refresh – PingOne token refresh failed', { error });
				return buildErrorResult('PingOne token refresh', error, tokenResultValidator);
			}
		}
	);

	server.registerTool(
		'pingone.auth.logout',
		{
			description: 'Revoke an access or refresh token using PingOne revocation endpoint.',
			inputSchema: revokeInputShape,
			outputSchema: operationOutputSchema,
		},
		async (args, _extra) => {
			logger.info('Revoking PingOne token via MCP', {
				environmentId: args.environmentId,
				tokenTypeHint: args.tokenTypeHint,
			});

			try {
				const parsed = revokeInputSchema.parse(args);
				const result = await revokeToken(parsed);
				return {
					content: [
						{
							type: 'text' as const,
							text: result.message ?? 'Token revoked successfully.',
						},
					],
					structuredContent: operationResultValidator.parse({
						success: true,
						message: result.message,
					}) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.Auth.Logout – PingOne token revocation failed', { error });
				return buildErrorResult('PingOne token revocation', error, operationResultValidator);
			}
		}
	);

	server.registerTool(
		'pingone.auth.userinfo',
		{
			description: 'Retrieve the PingOne OpenID Connect userinfo response for an access token.',
			inputSchema: userInfoInputShape,
			outputSchema: userInfoOutputSchema,
		},
		async (args, _extra) => {
			logger.info('Fetching PingOne userinfo via MCP', {
				environmentId: args.environmentId,
			});

			try {
				const parsed = userInfoInputSchema.parse(args);
				const userInfo = await getUserInfo(parsed.environmentId ?? '', parsed.accessToken);
				return {
					content: [
						{
							type: 'text' as const,
							text: 'PingOne userinfo retrieved successfully.',
						},
						{
							type: 'text' as const,
							text: JSON.stringify(userInfo, null, 2),
						},
					],
					structuredContent: userInfoResultValidator.parse({
						success: true,
						userInfo,
					}) as Record<string, unknown>,
				};
			} catch (error) {
				logger.error('MCP.Auth.UserInfo – PingOne userinfo retrieval failed', { error });
				return buildErrorResult('PingOne userinfo retrieval', error, userInfoResultValidator);
			}
		}
	);
}
