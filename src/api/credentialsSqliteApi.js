/**
 * @file credentialsSqliteApi.js
 * @description Server-side API for enhanced credentials, backed by the project's
 *              central LMDB store (see src/server/lmdb/credentialStore.js).
 *
 * Historically this wrote a separate `enhanced_credentials.db` SQLite file; it now
 * delegates to the one LMDB credential store so there is a single source of truth.
 * The route names keep the `/sqlite/` path for client compatibility.
 */

import * as credentialStore from '../server/lmdb/credentialStore.js';
import { logger } from '../utils/logger.js';

const MODULE_TAG = '[🔐 CREDENTIALS-STORE-API]';

// Build the enriched credential object the client expects from a raw payload.
function buildEnriched(environmentId, credentials, timestamp, prevCreated) {
	const nowIso = new Date().toISOString();
	return {
		environmentId,
		clientId: credentials.clientId ?? null,
		clientSecret: credentials.clientSecret ?? null,
		issuerUrl: credentials.issuerUrl ?? null,
		redirectUri: credentials.redirectUri ?? null,
		postLogoutRedirectUri: credentials.postLogoutRedirectUri ?? null,
		logoutUri: credentials.logoutUri ?? null,
		scopes: credentials.scopes ?? null,
		loginHint: credentials.loginHint ?? null,
		clientAuthMethod: credentials.clientAuthMethod ?? null,
		responseType: credentials.responseType ?? null,
		interactionHistory: Array.isArray(credentials.interactionHistory)
			? credentials.interactionHistory
			: [],
		metadata: {
			lastUpdated: timestamp || nowIso,
			createdAt: prevCreated || credentials.metadata?.createdAt || nowIso,
			storageBackends: credentials.metadata?.storageBackends || [],
			syncStatus: credentials.metadata?.syncStatus || 'synced',
			version: (credentials.metadata?.version || 0) + 1,
		},
	};
}

/**
 * Express middleware for credentials API (LMDB-backed).
 */
function credentialsSqliteApi(app) {
	app.get('/api/credentials/sqlite/health', (_req, res) => {
		res.status(200).json({ status: 'healthy', backend: 'lmdb' });
	});

	// Save credentials (insert or update, version-bumped).
	app.post('/api/credentials/sqlite/save', (req, res) => {
		try {
			const { environmentId, credentials, timestamp } = req.body ?? {};
			if (!environmentId || !credentials) {
				return res
					.status(400)
					.json({ error: 'Missing required fields: environmentId, credentials' });
			}
			const prev = credentialStore.getCredentials(environmentId);
			const prevCreated = prev?.credentials?.metadata?.createdAt;
			const enriched = buildEnriched(environmentId, credentials, timestamp, prevCreated);
			credentialStore.saveCredentials(environmentId, enriched);
			logger.info(`${MODULE_TAG} Credentials saved: ${environmentId}`);
			res.json({ success: true, environmentId });
		} catch (error) {
			logger.error(`${MODULE_TAG} Save failed:`, error);
			res.status(500).json({ error: 'Failed to save credentials' });
		}
	});

	// Load credentials for one environment.
	app.get('/api/credentials/sqlite/load', (req, res) => {
		try {
			const { environmentId } = req.query;
			if (!environmentId) {
				return res.status(400).json({ error: 'Missing environmentId parameter' });
			}
			const entry = credentialStore.getCredentials(String(environmentId));
			res.json({ credentials: entry?.credentials ?? null });
		} catch (error) {
			logger.error(`${MODULE_TAG} Load failed:`, error);
			res.status(500).json({ error: 'Failed to load credentials' });
		}
	});

	// List all credentials.
	app.get('/api/credentials/sqlite/list', (_req, res) => {
		try {
			const all = credentialStore.getAllCredentials();
			const credentials = Object.values(all)
				.map((e) => e?.credentials)
				.filter(Boolean)
				.sort((a, b) =>
					String(b?.metadata?.lastUpdated || '').localeCompare(String(a?.metadata?.lastUpdated || ''))
				);
			res.json({ credentials });
		} catch (error) {
			logger.error(`${MODULE_TAG} List failed:`, error);
			res.status(500).json({ error: 'Failed to list credentials' });
		}
	});

	// Clear credentials for one environment.
	app.delete('/api/credentials/sqlite/clear', (req, res) => {
		try {
			const { environmentId } = req.body ?? {};
			if (!environmentId) {
				return res.status(400).json({ error: 'Missing environmentId in request body' });
			}
			credentialStore.deleteCredentials(environmentId);
			logger.info(`${MODULE_TAG} Credentials cleared: ${environmentId}`);
			res.json({ success: true, environmentId });
		} catch (error) {
			logger.error(`${MODULE_TAG} Clear failed:`, error);
			res.status(500).json({ error: 'Failed to clear credentials' });
		}
	});

	// Interaction analytics, aggregated from the stored interactionHistory.
	app.get('/api/credentials/sqlite/analytics', (req, res) => {
		try {
			const { environmentId } = req.query;
			const all = credentialStore.getAllCredentials();
			const buckets = new Map();
			for (const [key, entry] of Object.entries(all)) {
				if (environmentId && key !== environmentId) continue;
				for (const i of entry?.credentials?.interactionHistory || []) {
					const k = `${i.appName || '?'}::${i.flowType || '?'}`;
					const b = buckets.get(k) || {
						app_name: i.appName || null,
						flow_type: i.flowType || null,
						interaction_count: 0,
						first_interaction: i.timestamp,
						last_interaction: i.timestamp,
					};
					b.interaction_count++;
					if (i.timestamp < b.first_interaction) b.first_interaction = i.timestamp;
					if (i.timestamp > b.last_interaction) b.last_interaction = i.timestamp;
					buckets.set(k, b);
				}
			}
			const analytics = [...buckets.values()].sort(
				(a, b) => b.interaction_count - a.interaction_count
			);
			res.json({ analytics });
		} catch (error) {
			logger.error(`${MODULE_TAG} Analytics failed:`, error);
			res.status(500).json({ error: 'Failed to get analytics' });
		}
	});

	// Storage usage statistics.
	app.get('/api/credentials/sqlite/stats', (_req, res) => {
		try {
			const all = credentialStore.getAllCredentials();
			const creds = Object.values(all)
				.map((e) => e?.credentials)
				.filter(Boolean);
			const clientIds = new Set();
			let withSecrets = 0;
			let totalInteractions = 0;
			const apps = new Set();
			const flows = new Set();
			const users = new Set();
			for (const c of creds) {
				if (c.clientId) clientIds.add(c.clientId);
				if (c.clientSecret) withSecrets++;
				for (const i of c.interactionHistory || []) {
					totalInteractions++;
					if (i.appName) apps.add(i.appName);
					if (i.flowType) flows.add(i.flowType);
					if (i.username) users.add(i.username);
				}
			}
			res.json({
				stats: {
					total_credentials: creds.length,
					unique_clients: clientIds.size,
					unique_environments: creds.length,
					credentials_with_secrets: withSecrets,
					total_interactions: totalInteractions,
					unique_apps: apps.size,
					unique_flow_types: flows.size,
					unique_users: users.size,
					backend: 'lmdb',
				},
			});
		} catch (error) {
			logger.error(`${MODULE_TAG} Stats failed:`, error);
			res.status(500).json({ error: 'Failed to get stats' });
		}
	});

	logger.info(`${MODULE_TAG} API endpoints registered (LMDB-backed)`);
}

// Kept for import compatibility (no-ops now — LMDB has no open connection to close).
async function initializeDatabase() {
	return null;
}
async function shutdown() {}

export { credentialsSqliteApi, initializeDatabase, shutdown };
