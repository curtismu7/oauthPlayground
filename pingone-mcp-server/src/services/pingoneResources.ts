/**
 * Dynamic MCP resources for PingOne — static list and URI-template based lookups.
 * Allows the AI to read config without calling tools.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from './logger.js';
import { getApplication, listApplications } from './pingoneManagementClient.js';
import { getGroup } from './pingoneGroupClient.js';
import { getUser } from './pingoneUserClient.js';
import { getOidcConfig } from './pingoneOidcClient.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function errorContents(uri: string, err: unknown): { contents: { uri: string; mimeType: string; text: string }[] } {
	const message = err instanceof Error ? err.message : String(err);
	return {
		contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ success: false, error: message }, null, 2) }],
	};
}

function jsonContents(uri: string, data: unknown): { contents: { uri: string; mimeType: string; text: string }[] } {
	return {
		contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
	};
}

// ─── registration ────────────────────────────────────────────────────────────

export function registerPingOneResources(server: McpServer, logger: Logger): void {

	// ── Static: applications list ─────────────────────────────────────────────
	server.resource(
		'pingone-applications',
		'pingone://applications',
		{
			title: 'PingOne applications',
			description: 'Current list of PingOne applications (uses credentials from storage or env).',
		},
		async () => {
			logger.info('Serving PingOne applications list resource');
			try {
				const result = await listApplications({});
				return jsonContents('pingone://applications', {
					success: result.success,
					count: result.applications?.length ?? 0,
					applications: result.applications,
					error: (result as { error?: unknown }).error,
				});
			} catch (err) {
				logger.error('PingOne applications resource failed', { error: err });
				return errorContents('pingone://applications', err);
			}
		}
	);

	// ── Template: single user by ID ───────────────────────────────────────────
	server.resource(
		'pingone-user',
		new ResourceTemplate('pingone://users/{userId}', { list: undefined }),
		{
			title: 'PingOne user',
			description: 'Fetch a specific PingOne user by ID. URI: pingone://users/{userId}',
		},
		async (uri, variables) => {
			const userId = String(variables.userId);
			logger.info('Serving PingOne user resource', { userId });
			try {
				const result = await getUser({ userId });
				return jsonContents(uri.toString(), { success: result.success, user: result.user, error: result.error });
			} catch (err) {
				logger.error('PingOne user resource failed', { userId, error: err });
				return errorContents(uri.toString(), err);
			}
		}
	);

	// ── Template: single application by ID ───────────────────────────────────
	server.resource(
		'pingone-application',
		new ResourceTemplate('pingone://applications/{appId}', { list: undefined }),
		{
			title: 'PingOne application',
			description: 'Fetch a specific PingOne application by ID. URI: pingone://applications/{appId}',
		},
		async (uri, variables) => {
			const appId = String(variables.appId);
			logger.info('Serving PingOne application resource', { appId });
			try {
				const result = await getApplication({ appId });
				return jsonContents(uri.toString(), { success: result.success, application: result.application, error: (result as { error?: unknown }).error });
			} catch (err) {
				logger.error('PingOne application resource failed', { appId, error: err });
				return errorContents(uri.toString(), err);
			}
		}
	);

	// ── Template: single group by ID ─────────────────────────────────────────
	server.resource(
		'pingone-group',
		new ResourceTemplate('pingone://groups/{groupId}', { list: undefined }),
		{
			title: 'PingOne group',
			description: 'Fetch a specific PingOne group by ID. URI: pingone://groups/{groupId}',
		},
		async (uri, variables) => {
			const groupId = String(variables.groupId);
			logger.info('Serving PingOne group resource', { groupId });
			try {
				const result = await getGroup({ groupId });
				return jsonContents(uri.toString(), { success: result.success, group: result.group, error: result.error });
			} catch (err) {
				logger.error('PingOne group resource failed', { groupId, error: err });
				return errorContents(uri.toString(), err);
			}
		}
	);

	// ── Template: OIDC discovery for an environment ───────────────────────────
	server.resource(
		'pingone-oidc-discovery',
		new ResourceTemplate('pingone://environments/{environmentId}/oidc', { list: undefined }),
		{
			title: 'PingOne OIDC discovery',
			description:
				'Fetch the OIDC discovery document (.well-known/openid_configuration) for a PingOne environment. ' +
				'URI: pingone://environments/{environmentId}/oidc',
		},
		async (uri, variables) => {
			const environmentId = String(variables.environmentId);
			logger.info('Serving PingOne OIDC discovery resource', { environmentId });
			try {
				const result = await getOidcConfig({ environmentId });
				return jsonContents(uri.toString(), { success: result.success, config: result.config, error: result.error });
			} catch (err) {
				logger.error('PingOne OIDC discovery resource failed', { environmentId, error: err });
				return errorContents(uri.toString(), err);
			}
		}
	);
}
