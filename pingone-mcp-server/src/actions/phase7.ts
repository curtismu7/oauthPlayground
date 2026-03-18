/**
 * MCP tools: Phase 7 — password, risk, token exchange, userinfo by URL, flow username/password check.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Logger } from '../services/logger.js';
import { buildToolErrorResult } from '../services/mcpErrors.js';
import { getPasswordState as getPasswordStateApi, sendRecoveryCode as sendRecoveryCodeApi } from '../services/pingonePasswordClient.js';
import { evaluateRisk as evaluateRiskApi } from '../services/pingoneRiskClient.js';
import { tokenExchange as tokenExchangeApi, userinfoByEndpoint as userinfoByEndpointApi } from '../services/pingoneTokenClient.js';
import { checkUsernamePassword as checkUsernamePasswordApi } from '../services/pingoneFlowClient.js';
import { getUserInfo } from '../services/pingoneAuthClient.js';

function wrapResult<T>(structured: T): Record<string, unknown> {
	return structured as Record<string, unknown>;
}

export function registerPhase7Tools(server: McpServer, logger: Logger): void {
	// --- password state ---
	const passwordStateInput = {
		environmentId: z.string().trim().optional(),
		userId: z.string().trim().min(1, 'userId is required'),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;
	const passwordStateOutput = {
		success: z.boolean(),
		passwordState: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_password_state',
		{
			description: 'Get password state for a PingOne user (worker token or client credentials).',
			inputSchema: passwordStateInput,
			outputSchema: passwordStateOutput,
		},
		async (args) => {
			logger.info('Getting password state', { userId: args.userId });
			try {
				const parsed = z.object(passwordStateInput).parse(args);
				const result = await getPasswordStateApi(parsed);
				const text = result.success
					? `Password state: ${JSON.stringify(result.passwordState, null, 2)}`
					: `Failed: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: wrapResult({ success: result.success, passwordState: result.passwordState, raw: result.raw, error: result.error }),
				};
			} catch (error) {
				logger.error('MCP.PasswordState – failed', { error });
				return buildToolErrorResult('pingone_password_state', error);
			}
		}
	);

	// --- send recovery code ---
	const sendRecoveryInput = {
		environmentId: z.string().trim().optional(),
		userId: z.string().trim().min(1, 'userId is required'),
		workerToken: z.string().trim().optional(),
		clientId: z.string().trim().optional(),
		clientSecret: z.string().trim().optional(),
		region: z.string().trim().optional(),
	} as const;
	const sendRecoveryOutput = {
		success: z.boolean(),
		message: z.string().optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_password_send_recovery_code',
		{
			description: 'Send password recovery code to a PingOne user (worker token or client credentials).',
			inputSchema: sendRecoveryInput,
			outputSchema: sendRecoveryOutput,
		},
		async (args) => {
			logger.info('Sending recovery code', { userId: args.userId });
			try {
				const parsed = z.object(sendRecoveryInput).parse(args);
				const result = await sendRecoveryCodeApi(parsed);
				const text = result.success ? (result.message ?? 'Recovery code sent.') : `Failed: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: wrapResult({ success: result.success, message: result.message, raw: result.raw, error: result.error }),
				};
			} catch (error) {
				logger.error('MCP.SendRecoveryCode – failed', { error });
				return buildToolErrorResult('pingone_password_send_recovery_code', error);
			}
		}
	);

	// --- risk evaluation (not implemented: no real PingOne Protect API call) ---
	const riskInput = {
		environmentId: z.string().trim().optional().describe('Leave blank — uses environmentId loaded from the playground app storage or PINGONE_ENVIRONMENT_ID env var.'),
		riskEvent: z.record(z.unknown()),
		workerToken: z.string().trim().optional(),
	} as const;
	const riskOutput = {
		success: z.boolean(),
		result: z.object({
			level: z.string(),
			recommendedAction: z.string(),
			score: z.number(),
			confidence: z.number(),
		}).optional(),
		details: z.record(z.unknown()).optional(),
		metadata: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_risk_evaluation',
		{
			description: 'Risk evaluation: not implemented in this MCP server. No PingOne Protect API is called. Returns NOT_IMPLEMENTED. Use the app or a backend with PingOne Risk/Protect for real evaluations.',
			inputSchema: riskInput,
			outputSchema: riskOutput,
		},
		async (args) => {
			logger.info('Risk evaluation (not implemented)', { environmentId: args.environmentId });
			try {
				const parsed = z.object(riskInput).parse(args);
				const resolvedEnvId =
					parsed.environmentId ??
					process.env.PINGONE_ENVIRONMENT_ID ??
					process.env.VITE_PINGONE_ENVIRONMENT_ID ??
					'';
				const result = await evaluateRiskApi({ ...parsed, environmentId: resolvedEnvId });
				const text = result.success
					? `Risk: ${result.result?.level} (score ${result.result?.score}), action: ${result.result?.recommendedAction}. ${JSON.stringify(result, null, 2)}`
					: `Not implemented: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: wrapResult(result),
				};
			} catch (error) {
				logger.error('MCP.RiskEvaluation – failed', { error });
				return buildToolErrorResult('pingone_risk_evaluation', error);
			}
		}
	);

	// --- token exchange ---
	const tokenExchangeInput = {
		environmentId: z.string().trim().optional().describe('Leave blank — uses environmentId loaded from the playground app storage or PINGONE_ENVIRONMENT_ID env var.'),
		region: z.string().trim().optional(),
		body: z.string().trim().min(1, 'body (URL-encoded token request) is required'),
		authMethod: z.enum(['client_secret_post', 'client_secret_basic']).optional(),
		headers: z.record(z.string()).optional(),
	} as const;
	const tokenExchangeOutput = {
		success: z.boolean(),
		accessToken: z.string().optional(),
		refreshToken: z.string().optional(),
		idToken: z.string().optional(),
		tokenType: z.string().optional(),
		expiresIn: z.number().optional(),
		scope: z.string().optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_token_exchange',
		{
			description: 'Exchange authorization code (or other grant) for tokens. POST to PingOne /as/token. Body must be URL-encoded (grant_type, code, redirect_uri, client_id, etc.).',
			inputSchema: tokenExchangeInput,
			outputSchema: tokenExchangeOutput,
		},
		async (args) => {
			logger.info('Token exchange', { environmentId: args.environmentId });
			try {
				const parsed = z.object(tokenExchangeInput).parse(args);
				const resolvedEnvId =
					parsed.environmentId ??
					process.env.PINGONE_ENVIRONMENT_ID ??
					process.env.VITE_PINGONE_ENVIRONMENT_ID ??
					'';
				const result = await tokenExchangeApi({ ...parsed, environmentId: resolvedEnvId });
				const text = result.success
					? `Tokens received. access_token: ${result.accessToken ? '...' + result.accessToken.slice(-8) : 'none'}. ${JSON.stringify({ tokenType: result.tokenType, expiresIn: result.expiresIn }, null, 2)}`
					: `Failed: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: wrapResult({ success: result.success, accessToken: result.accessToken, refreshToken: result.refreshToken, idToken: result.idToken, tokenType: result.tokenType, expiresIn: result.expiresIn, scope: result.scope, raw: result.raw, error: result.error }),
				};
			} catch (error) {
				logger.error('MCP.TokenExchange – failed', { error });
				return buildToolErrorResult('pingone_token_exchange', error);
			}
		}
	);

	// --- userinfo (by endpoint or by environmentId) ---
	const userinfoInput = {
		accessToken: z.string().trim().min(1, 'accessToken is required'),
		userInfoEndpoint: z.string().trim().optional(),
		environmentId: z.string().trim().optional(),
	} as const;
	const userinfoOutput = {
		success: z.boolean(),
		userInfo: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_userinfo',
		{
			description: 'Call UserInfo with access token. Provide userInfoEndpoint (from discovery) or environmentId to use PingOne userinfo URL.',
			inputSchema: userinfoInput,
			outputSchema: userinfoOutput,
		},
		async (args) => {
			logger.info('UserInfo', { hasEndpoint: !!args.userInfoEndpoint, hasEnv: !!args.environmentId });
			try {
				const parsed = z.object(userinfoInput).parse(args);
				if (parsed.userInfoEndpoint) {
					const result = await userinfoByEndpointApi({ userInfoEndpoint: parsed.userInfoEndpoint, accessToken: parsed.accessToken });
					const text = result.success ? `UserInfo: ${JSON.stringify(result.userInfo, null, 2)}` : `Failed: ${result.error?.message ?? 'Unknown'}`;
					return {
						content: [{ type: 'text' as const, text }],
						structuredContent: wrapResult({ success: result.success, userInfo: result.userInfo, raw: result.raw, error: result.error }),
					};
				}
				const envId = parsed.environmentId ?? process.env.PINGONE_ENVIRONMENT_ID ?? process.env.VITE_PINGONE_ENVIRONMENT_ID;
				if (!envId) {
					return {
						content: [{ type: 'text' as const, text: 'Either userInfoEndpoint or environmentId is required.' }],
						structuredContent: wrapResult({ success: false, error: { message: 'userInfoEndpoint or environmentId required' } }),
					};
				}
				const region = (parsed as { region?: string }).region;
				const userInfo = await getUserInfo(envId, parsed.accessToken, region);
				return {
					content: [{ type: 'text' as const, text: `UserInfo: ${JSON.stringify(userInfo, null, 2)}` }],
					structuredContent: wrapResult({ success: true, userInfo, raw: userInfo }),
				};
			} catch (error) {
				logger.error('MCP.UserInfo – failed', { error });
				return buildToolErrorResult('pingone_userinfo', error);
			}
		}
	);

	// --- check username/password (flow) ---
	const checkUpInput = {
		flowUrl: z.string().trim().min(1, 'flowUrl is required'),
		username: z.string().min(1, 'username is required'),
		password: z.string().min(1, 'password is required'),
		cookies: z.union([z.string(), z.array(z.string())]).optional(),
	} as const;
	const checkUpOutput = {
		success: z.boolean(),
		response: z.record(z.unknown()).optional(),
		raw: z.unknown().optional(),
		error: z.object({ code: z.string().optional(), message: z.string() }).optional(),
	} as const;
	server.registerTool(
		'pingone_check_username_password',
		{
			description: 'Validate username/password in a PingOne flow (usernamePassword.check). Sends credentials to PingOne only. flowUrl from flow step; optional cookies from authorize.',
			inputSchema: checkUpInput,
			outputSchema: checkUpOutput,
		},
		async (args) => {
			logger.info('Check username/password', { flowUrl: args.flowUrl });
			try {
				const parsed = z.object(checkUpInput).parse(args);
				const result = await checkUsernamePasswordApi(parsed);
				const text = result.success
					? `Check result: ${JSON.stringify(result.response, null, 2)}`
					: `Failed: ${result.error?.message ?? 'Unknown'}`;
				return {
					content: [{ type: 'text' as const, text }],
					structuredContent: wrapResult({ success: result.success, response: result.response, raw: result.raw, error: result.error }),
				};
			} catch (error) {
				logger.error('MCP.CheckUsernamePassword – failed', { error });
				return buildToolErrorResult('pingone_check_username_password', error);
			}
		}
	);
}
