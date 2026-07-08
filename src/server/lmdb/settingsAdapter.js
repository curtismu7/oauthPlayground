// src/server/lmdb/settingsAdapter.js
//
// Async settingsDB facade backed by LMDB settingsStore. Matches the legacy
// SettingsDatabaseService contract (JSON-string values on get, parsed values on set).

import * as settingsStore from './settingsStore.js';
import { migrateSettingsFromSqlite } from './migrateSettingsSqlite.js';

export const settingsDB = {
	async init() {
		migrateSettingsFromSqlite();
	},

	async get(key) {
		const value = settingsStore.get(key);
		if (value === null || value === undefined) {
			return null;
		}
		return JSON.stringify(value);
	},

	async set(key, value) {
		settingsStore.set(key, value);
	},
};
