// src/server/lmdb/settingsStore.js
//
// Synchronous settings storage using LMDB 'settings' sub-DB.
// Replaces SettingsDatabaseService with a minimal functional API.
// All operations are synchronous — no promises, no async callbacks.

import { getDb } from './openEnv.js';

const MODULE_TAG = '[⚙️ SETTINGS-STORE]';

export function get(key) {
	const db = getDb('settings');
	const value = db.getSync(key);
	return value !== undefined ? value : null;
}

export function set(key, value) {
	const db = getDb('settings');
	db.putSync(key, value);
}

export function del(key) {
	const db = getDb('settings');
	db.removeSync(key);
}

export function getAll() {
	const db = getDb('settings');
	const result = {};

	for (const { key, value } of db.getRange({})) {
		result[key] = value;
	}

	return result;
}

export function clear() {
	const db = getDb('settings');

	for (const { key } of db.getRange({})) {
		db.removeSync(key);
	}
}
