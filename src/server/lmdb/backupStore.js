// src/server/lmdb/backupStore.js
// [💾 BACKUP-STORE]
//
// Backup record storage backed by LMDB. Consolidates backup and worker token
// persistence into a single store. All operations are synchronous.
//
// Sub-DBs:
//   backups        key <envId>|<dataType>|<backupKey> -> { key, environmentId, dataType, data, saved_at, expires_at }
//   worker_tokens  (consolidated from credentialStore.js)

import { getDb } from './openEnv.js';

const backups = () => getDb('backups');
const workerTokens = () => getDb('worker_tokens');

const now = () => Date.now();

// ---- backups ----------------------------------------------------------------

/**
 * Save a backup record.
 * @param {string} key - The backup key (e.g., "oauth-state", "session-data")
 * @param {string} environmentId - The PingOne environment ID
 * @param {string} dataType - The type of data (e.g., "state", "token", "config")
 * @param {any} data - The data to backup (stored as JSON)
 * @param {number|null} expiresAt - Epoch ms when backup expires, or null for no expiry
 * @returns {boolean} True if saved
 */
export function saveBackup(key, environmentId, dataType, data, expiresAt = null) {
	if (!key || !environmentId || !dataType) return false;
	const dbKey = `${environmentId}|${dataType}|${key}`;
	const val = {
		key,
		environmentId,
		dataType,
		data,
		saved_at: now(),
		expires_at: expiresAt,
	};
	backups().putSync(dbKey, val);
	return true;
}

/**
 * Retrieve a backup record.
 * @param {string} key - The backup key
 * @param {string} environmentId - The PingOne environment ID
 * @returns {object|null} The backup record, or null if not found or expired
 */
export function getBackup(key, environmentId, dataType) {
	if (!key || !environmentId || !dataType) return null;
	const dbKey = `${environmentId}|${dataType}|${key}`;
	const v = backups().get(dbKey);
	if (!v) return null;
	// Check expiry
	if (v.expires_at && v.expires_at < now()) {
		backups().removeSync(dbKey);
		return null;
	}
	return v;
}

/**
 * List all backups for a given environment and data type.
 * @param {string} environmentId - The PingOne environment ID
 * @param {string} dataType - The data type to filter by
 * @returns {array} Array of backup records
 */
export function listBackups(environmentId, dataType) {
	if (!environmentId || !dataType) return [];
	const prefix = `${environmentId}|${dataType}|`;
	const out = [];
	const now_ms = now();
	for (const { key, value } of backups().getRange()) {
		if (key.startsWith(prefix)) {
			// Skip expired
			if (value.expires_at && value.expires_at < now_ms) continue;
			out.push(value);
		}
	}
	return out;
}

/**
 * Delete a single backup record.
 * @param {string} key - The backup key
 * @param {string} environmentId - The PingOne environment ID
 * @returns {boolean} True if deleted
 */
export function deleteBackup(key, environmentId, dataType) {
	if (!key || !environmentId || !dataType) return false;
	const dbKey = `${environmentId}|${dataType}|${key}`;
	return backups().removeSync(dbKey);
}

/**
 * Remove all expired backup records.
 * @returns {number} Count of deleted records
 */
export function deleteExpiredBackups() {
	let deleted = 0;
	const now_ms = now();
	// Collect keys to delete during iteration
	const toDelete = [];
	for (const { key, value } of backups().getRange()) {
		if (value.expires_at && value.expires_at < now_ms) {
			toDelete.push(key);
		}
	}
	// Delete after iteration
	for (const key of toDelete) {
		backups().removeSync(key);
		deleted++;
	}
	return deleted;
}

/**
 * Delete all backup records for a given environment.
 * @param {string} environmentId - The PingOne environment ID
 * @returns {number} Count of deleted records
 */
export function clearEnvironmentBackups(environmentId) {
	if (!environmentId) return 0;
	let deleted = 0;
	const toDelete = [];
	// Find all keys for this environment
	for (const { key } of backups().getRange()) {
		if (key.startsWith(`${environmentId}|`)) {
			toDelete.push(key);
		}
	}
	// Delete after iteration
	for (const key of toDelete) {
		backups().removeSync(key);
		deleted++;
	}
	return deleted;
}

// ---- worker tokens (consolidation point) ------------------------------------

/**
 * Get all worker tokens. Delegated to workerTokens DB.
 * @returns {object} Map of envId -> token record (encrypted at rest)
 */
export function getAllWorkerTokens() {
	const out = {};
	for (const { key, value } of workerTokens().getRange()) {
		out[key] = value;
	}
	return out;
}
