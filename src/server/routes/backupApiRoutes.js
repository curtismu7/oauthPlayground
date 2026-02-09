/**
 * @file backupApiRoutes.js
 * @module server/routes
 * @description API routes for backup operations
 * @version 1.0.0
 * @since 2026-02-02
 */

import { backupDatabaseService } from '../services/backupDatabaseService.js';

const MODULE_TAG = '[🔄 BACKUP-API]';

/**
 * Backup API routes
 */
export function setupBackupApiRoutes(app) {
	// Save backup
	app.post('/api/backup/save', async (req, res) => {
		try {
			const { key, environmentId, dataType, data, expiresAt } = req.body;

			if (!key || !environmentId || !dataType || data === undefined) {
				return res.status(400).json({
					error: 'Missing required fields: key, environmentId, dataType, data',
				});
			}

			await backupDatabaseService.saveBackup(key, environmentId, dataType, data, expiresAt);

			res.json({ success: true });
		} catch (error) {
			console.error(`${MODULE_TAG} Save error:`, error);
			res.status(500).json({
				error: 'Failed to save backup',
				details: error.message,
			});
		}
	});

	// Load backup
	app.post('/api/backup/load', async (req, res) => {
		try {
			const { key, environmentId } = req.body;

			if (!key || !environmentId) {
				return res.status(400).json({
					error: 'Missing required fields: key, environmentId',
				});
			}

			const backup = await backupDatabaseService.loadBackup(key, environmentId);

			if (!backup) {
				return res.status(404).json({
					error: 'Backup not found or expired',
				});
			}

			res.json(backup);
		} catch (error) {
			console.error(`${MODULE_TAG} Load error:`, error);
			res.status(500).json({
				error: 'Failed to load backup',
				details: error.message,
			});
		}
	});

	// Delete backup
	app.post('/api/backup/delete', async (req, res) => {
		try {
			const { key, environmentId } = req.body;

			if (!key || !environmentId) {
				return res.status(400).json({
					error: 'Missing required fields: key, environmentId',
				});
			}

			await backupDatabaseService.deleteBackup(key, environmentId);

			res.json({ success: true });
		} catch (error) {
			console.error(`${MODULE_TAG} Delete error:`, error);
			res.status(500).json({
				error: 'Failed to delete backup',
				details: error.message,
			});
		}
	});

	// List backups
	app.post('/api/backup/list', async (req, res) => {
		try {
			const { environmentId, dataType } = req.body;

			if (!environmentId) {
				return res.status(400).json({
					error: 'environmentId is required',
				});
			}

			const backups = await backupDatabaseService.listBackups(environmentId, dataType);

			res.json({ backups });
		} catch (error) {
			console.error(`${MODULE_TAG} List error:`, error);
			res.status(500).json({
				error: 'Failed to list backups',
				details: error.message,
			});
		}
	});

	// Clear environment backups
	app.post('/api/backup/clear-environment', async (req, res) => {
		try {
			const { environmentId } = req.body;

			if (!environmentId) {
				return res.status(400).json({
					error: 'environmentId is required',
				});
			}

			const count = await backupDatabaseService.clearEnvironment(environmentId);

			res.json({
				success: true,
				deletedCount: count,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Clear error:`, error);
			res.status(500).json({
				error: 'Failed to clear environment',
				details: error.message,
			});
		}
	});

	// Get stats (all envs or for a specific environmentId)
	app.get('/api/backup/stats', async (_req, res) => {
		try {
			const stats = await backupDatabaseService.getStats(null);
			res.json(stats);
		} catch (error) {
			console.error(`${MODULE_TAG} Stats error:`, error);
			res.status(500).json({
				error: 'Failed to get stats',
				details: error.message,
			});
		}
	});
	app.get('/api/backup/stats/:environmentId', async (req, res) => {
		try {
			const { environmentId } = req.params;
			const stats = await backupDatabaseService.getStats(environmentId);
			res.json(stats);
		} catch (error) {
			console.error(`${MODULE_TAG} Stats error:`, error);
			res.status(500).json({
				error: 'Failed to get stats',
				details: error.message,
			});
		}
	});

	// Cleanup expired backups (maintenance endpoint)
	app.post('/api/backup/cleanup', async (_req, res) => {
		try {
			const count = await backupDatabaseService.cleanupExpired();

			res.json({
				success: true,
				cleanedCount: count,
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Cleanup error:`, error);
			res.status(500).json({
				error: 'Failed to cleanup',
				details: error.message,
			});
		}
	});
}
