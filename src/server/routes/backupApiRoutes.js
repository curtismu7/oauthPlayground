/**
 * @file backupApiRoutes.js
 * @module server/routes
 * @description API routes for backup operations
 * @version 1.0.0
 * @since 2026-02-02
 */

import * as backupStore from '../lmdb/backupStore.js';

import { logger } from '../utils/logger.js';

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

			await backupStore.saveBackup(key, environmentId, dataType, data, expiresAt);

			res.json({ success: true });
		} catch (error) {

			logger.error(`${MODULE_TAG} Save error:`, error);
			res.status(500).json({
				error: 'Failed to save backup',
				details: error.message,
			});
		}
	});

	// Load backup
	app.post('/api/backup/load', async (req, res) => {
		try {
			const { key, environmentId, dataType } = req.body;

			if (!key || !environmentId || !dataType) {
				return res.status(400).json({
					error: 'Missing required fields: key, environmentId, dataType',
				});
			}

			const backup = await backupStore.getBackup(key, environmentId, dataType);

			if (!backup) {
				return res.status(404).json({
					error: 'Backup not found or expired',
				});
			}

			res.json(backup);
		} catch (error) {
			logger.error(`${MODULE_TAG} Load error:`, error);
			res.status(500).json({
				error: 'Failed to load backup',
				details: error.message,
			});
		}
	});

	// Delete backup
	app.post('/api/backup/delete', async (req, res) => {
		try {
			const { key, environmentId, dataType } = req.body;

			if (!key || !environmentId || !dataType) {
				return res.status(400).json({
					error: 'Missing required fields: key, environmentId, dataType',
				});
			}

			await backupStore.deleteBackup(key, environmentId, dataType);

			res.json({ success: true });
		} catch (error) {
			logger.error(`${MODULE_TAG} Delete error:`, error);
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

			const backups = await backupStore.listBackups(environmentId, dataType);

			res.json({ backups });
		} catch (error) {
			logger.error(`${MODULE_TAG} List error:`, error);
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

			const count = await backupStore.clearEnvironmentBackups(environmentId);

			res.json({
				success: true,
				deletedCount: count,
			});
		} catch (error) {
			logger.error(`${MODULE_TAG} Clear error:`, error);
			res.status(500).json({
				error: 'Failed to clear environment',
				details: error.message,
			});
		}
	});

	// Cleanup expired backups (maintenance endpoint)
	app.post('/api/backup/cleanup', async (_req, res) => {
		try {
			const count = await backupStore.deleteExpiredBackups();

			res.json({
				success: true,
				cleanedCount: count,
			});
		} catch (error) {
			logger.error(`${MODULE_TAG} Cleanup error:`, error);
			res.status(500).json({
				error: 'Failed to cleanup',
				details: error.message,
			});
		}
	});
}
