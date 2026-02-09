/**
 * @file userApiRoutes.js
 * @module server/routes
 * @description API routes for user database operations
 * @version 1.0.0
 * @since 2026-02-02
 *
 * Provides REST endpoints for:
 * - User search and retrieval
 * - Sync status monitoring
 * - Manual sync operations
 */

import { userDatabaseService } from '../services/userDatabaseService.js';

const MODULE_TAG = '[🔍 USER-API]';

/**
 * User API routes
 */
export function setupUserApiRoutes(app) {
	// Search users endpoint
	app.get('/api/users/search', async (req, res) => {
		try {
			const { environmentId, q: query, limit = 100, offset = 0 } = req.query;

			if (!environmentId) {
				return res.status(400).json({
					error: 'environmentId is required',
				});
			}

			const limitNum = Math.min(parseInt(limit, 10) || 100, 1000); // Max 1000 results
			const offsetNum = parseInt(offset, 10) || 0;

			const users = await userDatabaseService.searchUsers(
				environmentId,
				query,
				limitNum,
				offsetNum
			);

			res.json({
				users,
				query,
				limit: limitNum,
				offset: offsetNum,
				total: users.length,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Search error:`, error);
			res.status(500).json({
				error: 'Search failed',
				details: error.message,
			});
		}
	});

	// Get recent users endpoint
	app.get('/api/users/recent/:environmentId', async (req, res) => {
		try {
			const { environmentId } = req.params;
			const { limit = 100 } = req.query;

			const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);

			const users = await userDatabaseService.getRecentUsers(environmentId, limitNum);

			res.json({
				users,
				limit: limitNum,
				total: users.length,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Recent users error:`, error);
			res.status(500).json({
				error: 'Failed to get recent users',
				details: error.message,
			});
		}
	});

	// Get user count endpoint
	app.get('/api/users/count/:environmentId', async (req, res) => {
		try {
			const { environmentId } = req.params;

			const count = await userDatabaseService.getUserCount(environmentId);

			res.json({
				environmentId,
				totalUsers: count,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Count error:`, error);
			res.status(500).json({
				error: 'Failed to get user count',
				details: error.message,
			});
		}
	});

	// Get sync metadata endpoint
	app.get('/api/users/sync-metadata/:environmentId', async (req, res) => {
		try {
			const { environmentId } = req.params;

			const metadata = await userDatabaseService.getSyncMetadata(environmentId);

			res.json(metadata);
		} catch (error) {
			console.error(`${MODULE_TAG} Metadata error:`, error);
			res.status(500).json({
				error: 'Failed to get sync metadata',
				details: error.message,
			});
		}
	});

	// Clear environment data endpoint (admin only)
	app.delete('/api/users/clear/:environmentId', async (req, res) => {
		try {
			const { environmentId } = req.params;

			// TODO: Add authentication/authorization check
			userDatabaseService.clearEnvironmentData(environmentId);

			res.json({
				message: `Cleared data for environment ${environmentId}`,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Clear error:`, error);
			res.status(500).json({
				error: 'Failed to clear environment data',
				details: error.message,
			});
		}
	});

	// Sync users endpoint (incremental or full)
	app.post('/api/users/sync/:environmentId', async (req, res) => {
		try {
			const { environmentId } = req.params;
			const { incremental = true, maxPages = 100, delayMs = 100, workerToken } = req.body;

			if (!workerToken) {
				return res.status(400).json({
					error: 'Worker token is required',
					message: 'Please provide workerToken in the request body',
				});
			}

			console.log(
				`${MODULE_TAG} Starting ${incremental ? 'incremental' : 'full'} sync for ${environmentId}`
			);

			let result;
			if (incremental) {
				result = await userDatabaseService.incrementalSync(environmentId, {
					workerToken,
					maxPages,
					delayMs,
					onProgress: (totalFetched, pages, _users) => {
						console.log(`${MODULE_TAG} Progress: ${totalFetched} users across ${pages} pages`);
					},
				});
			} else {
				result = await userDatabaseService.fullSync(environmentId, {
					workerToken,
					maxPages,
					delayMs,
					onProgress: (totalFetched, pages, _users) => {
						console.log(`${MODULE_TAG} Progress: ${totalFetched} users across ${pages} pages`);
					},
				});
			}

			res.json({
				success: true,
				...result,
				message: `${incremental ? 'Incremental' : 'Full'} sync completed`,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Sync error:`, error);
			res.status(500).json({
				error: 'Sync failed',
				details: error.message,
			});
		}
	});

	// Get sync status endpoint
	app.get('/api/users/sync-status/:environmentId', async (req, res) => {
		try {
			const { environmentId } = req.params;

			const metadata = await userDatabaseService.getSyncMetadata(environmentId);
			const userCount = await userDatabaseService.getUserCount(environmentId);

			res.json({
				environmentId,
				totalUsers: userCount,
				...metadata,
				isSyncing: metadata.sync_in_progress === 1,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Sync status error:`, error);
			res.status(500).json({
				error: 'Failed to get sync status',
				details: error.message,
			});
		}
	});

	// Bulk insert users endpoint (for CLI tool)
	app.post('/api/users/bulk-insert', async (req, res) => {
		try {
			const { environmentId, users, clearFirst = false } = req.body;

			if (!environmentId) {
				return res.status(400).json({
					error: 'environmentId is required',
				});
			}

			if (!Array.isArray(users)) {
				return res.status(400).json({
					error: 'users must be an array',
				});
			}

			console.log(
				`${MODULE_TAG} Bulk insert: ${users.length} users for ${environmentId} (clear first: ${clearFirst})`
			);

			// Clear existing data if requested
			if (clearFirst) {
				await userDatabaseService.clearEnvironmentData(environmentId);
				console.log(`${MODULE_TAG} Cleared existing data for ${environmentId}`);
			}

			// Insert users in batches
			let insertedCount = 0;
			const updatedCount = 0;
			const batchSize = 500;

			for (let i = 0; i < users.length; i += batchSize) {
				const batch = users.slice(i, i + batchSize);

				// Save batch to database
				await userDatabaseService.saveUsers(environmentId, batch, i + batch.length >= users.length);

				insertedCount += batch.length;
				console.log(
					`${MODULE_TAG} Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedCount}/${users.length}`
				);
			}

			res.json({
				success: true,
				environmentId,
				insertedCount,
				updatedCount,
				totalUsers: users.length,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Bulk insert error:`, error);
			res.status(500).json({
				error: 'Bulk insert failed',
				details: error.message,
			});
		}
	});
}
