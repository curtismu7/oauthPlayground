/**
 * @file workerTokenApiRoutes.js
 * @description Worker token generation, retrieval, revocation endpoints
 * POST /api/worker-tokens — generate token
 * GET /api/worker-tokens — get active token + status
 * DELETE /api/worker-tokens/:id — revoke token
 * GET /api/worker-tokens/history — token history
 */

import { workerTokenDatabaseService } from '../services/workerTokenDatabaseService.js';
import { acquireWorkerToken } from '../services/workerTokenAcquisitionService.js';

export function setupWorkerTokenRoutes(app) {
	/**
	 * POST /api/worker-tokens
	 * Generate a new worker token
	 * Body: { environmentId, clientId, clientSecret, region, authMethod, customDomain?, roles?, name? }
	 */
	app.post('/api/worker-tokens', async (req, res) => {
		try {
			const { environmentId, clientId, clientSecret, region, authMethod, customDomain, roles, name } =
				req.body;

			// Validate required fields
			if (!environmentId || !clientId || !clientSecret || !region || !authMethod) {
				return res.status(400).json({
					error: 'Missing required fields: environmentId, clientId, clientSecret, region, authMethod',
				});
			}

			// Call existing worker token acquisition service
			const result = await acquireWorkerToken({
				environmentId,
				clientId,
				clientSecret,
				scopes: ['openid'], // Worker tokens only use openid scope
				region,
				authMethod,
				customDomain,
			});

			// Store in database
			const dbResult = workerTokenDatabaseService.createToken(
				result.token,
				result.expiresAt, // expiration time in ms
				roles || [],
				name || 'Worker Token',
				{ clientId, environmentId, region }
			);

			// Set HTTP-only cookie (1 hour)
			res.cookie('wt_token', result.token, {
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 3600000, // 1 hour
				path: '/',
			});

			res.json({
				success: true,
				id: dbResult.id,
				token: result.token,
				expiresAt: result.expiresAt,
				authMethodUsed: result.authMethodUsed,
			});
		} catch (err) {
			console.error('[WorkerTokenAPI] POST error:', err.message);
			res.status(500).json({
				error: err.message || 'Failed to generate worker token',
			});
		}
	});

	/**
	 * GET /api/worker-tokens
	 * Get current active worker token + status
	 */
	app.get('/api/worker-tokens', (_req, res) => {
		try {
			const token = workerTokenDatabaseService.getActiveToken();
			if (!token) {
				return res.json({ active: null });
			}

			const now = Date.now();
			const status =
				token.expires_at < now
					? 'expired'
					: token.expires_at - now < 5 * 60 * 1000
						? 'expiring'
						: 'active';

			res.json({
				active: {
					id: token.id,
					expiresAt: token.expires_at,
					createdAt: token.created_at,
					expiresIn: Math.max(0, token.expires_at - now),
					status,
					roles: token.roles || [],
					name: token.name || 'Worker Token',
				},
			});
		} catch (err) {
			console.error('[WorkerTokenAPI] GET error:', err.message);
			res.status(500).json({ error: err.message });
		}
	});

	/**
	 * GET /api/worker-tokens/:id
	 * Get specific token by ID with full details
	 */
	app.get('/api/worker-tokens/:id', (req, res) => {
		try {
			const token = workerTokenDatabaseService.getTokenById(req.params.id);
			if (!token) {
				return res.status(404).json({ error: 'Token not found' });
			}

			res.json(token);
		} catch (err) {
			console.error('[WorkerTokenAPI] GET/:id error:', err.message);
			res.status(500).json({ error: err.message });
		}
	});

	/**
	 * DELETE /api/worker-tokens/:id
	 * Revoke a token by ID
	 */
	app.delete('/api/worker-tokens/:id', (req, res) => {
		try {
			const success = workerTokenDatabaseService.revokeToken(req.params.id);
			if (!success) {
				return res.status(404).json({ error: 'Token not found or already revoked' });
			}

			// Clear cookie
			res.clearCookie('wt_token', { path: '/' });

			res.json({ success: true, message: 'Token revoked' });
		} catch (err) {
			console.error('[WorkerTokenAPI] DELETE error:', err.message);
			res.status(500).json({ error: err.message });
		}
	});

	/**
	 * GET /api/worker-tokens/history
	 * Get token history (active, revoked, expired)
	 */
	app.get('/api/worker-tokens/history', (_req, res) => {
		try {
			const history = workerTokenDatabaseService.getHistory(50);
			res.json({ history });
		} catch (err) {
			console.error('[WorkerTokenAPI] GET /history error:', err.message);
			res.status(500).json({ error: err.message });
		}
	});

	// Start cleanup interval on server startup
	workerTokenDatabaseService.startCleanupInterval();
	console.log('[WorkerTokenAPI] Routes registered');
}
