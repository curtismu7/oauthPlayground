// src/server/lmdb/migrateSettingsSqlite.js
//
// One-time import of legacy src/server/data/settings.db into the LMDB settings
// sub-DB. Idempotent — guarded by meta.migrated_settings_sqlite.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { getDb } from './openEnv.js';
import * as settingsStore from './settingsStore.js';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_DB = path.join(__dirname, '..', 'data', 'settings.db');
const MIGRATED_DB = `${LEGACY_DB}.migrated`;
const META_KEY = 'migrated_settings_sqlite';

function metaDb() {
	return getDb('meta');
}

/** Import settings.db rows when the legacy file exists and migration has not run. */
export function migrateSettingsFromSqlite() {
	if (process.env.VERCEL) {
		return;
	}

	try {
		if (metaDb().getSync(META_KEY)) {
			return;
		}
	} catch {
		return;
	}

	if (!fs.existsSync(LEGACY_DB)) {
		return;
	}

	try {
		// Optional: only available when better-sqlite3 is installed (dev migration).
		const Database = require('better-sqlite3');
		const db = new Database(LEGACY_DB, { readonly: true });
		const rows = db.prepare('SELECT key, value FROM settings').all();
		db.close();

		let imported = 0;
		for (const row of rows) {
			if (!row?.key || row.value == null) {
				continue;
			}
			if (settingsStore.get(row.key) !== null) {
				continue;
			}
			try {
				settingsStore.set(row.key, JSON.parse(row.value));
				imported += 1;
			} catch {
				settingsStore.set(row.key, row.value);
				imported += 1;
			}
		}

		metaDb().putSync(META_KEY, new Date().toISOString());
		fs.renameSync(LEGACY_DB, MIGRATED_DB);
		console.log(`[⚙️ SETTINGS-STORE] Migrated ${imported} setting(s) from settings.db → LMDB`);
	} catch (err) {
		console.warn('[⚙️ SETTINGS-STORE] settings.db migration skipped:', err.message);
	}
}
