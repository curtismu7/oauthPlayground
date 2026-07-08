// src/server/lmdb/migrateWorkerTokensSqlite.js
//
// One-time import of ~/.pingone-playground/worker-tokens.db into LMDB.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { getDb } from './openEnv.js';
import { sealFields } from './crypto.js';

const require = createRequire(import.meta.url);
const LEGACY_DB = path.join(os.homedir(), '.pingone-playground', 'worker-tokens.db');
const MIGRATED_DB = `${LEGACY_DB}.migrated`;
const META_KEY = 'migrated_worker_tokens_sqlite';
const SECRET_PATHS = ['token'];

function metaDb() {
	return getDb('meta');
}

function recordsDb() {
	return getDb('worker_token_records');
}

function activeDb() {
	return getDb('worker_token_active');
}

/** Import legacy worker-tokens.db when present and not yet migrated. */
export function migrateWorkerTokensFromSqlite() {
	if (process.env.VERCEL) return;

	try {
		if (metaDb().getSync(META_KEY)) return;
	} catch {
		return;
	}

	if (!fs.existsSync(LEGACY_DB)) return;

	try {
		const Database = require('better-sqlite3');
		const db = new Database(LEGACY_DB, { readonly: true });
		const rows = db
			.prepare(
				`SELECT id, token, expires_at, created_at, revoked_at, roles, name, metadata
				 FROM worker_tokens ORDER BY created_at ASC`,
			)
			.all();
		db.close();

		let imported = 0;
		let latestActiveId = null;
		const at = Date.now();

		for (const row of rows) {
			if (!row?.id || !row.token) continue;
			if (recordsDb().getSync(row.id)) continue;

			const record = sealFields(
				{
					id: row.id,
					token: row.token,
					expires_at: row.expires_at,
					created_at: row.created_at,
					revoked_at: row.revoked_at ?? null,
					roles: row.roles ? JSON.parse(row.roles) : [],
					name: row.name || 'Worker Token',
					metadata: row.metadata ? JSON.parse(row.metadata) : {},
				},
				SECRET_PATHS,
			);
			recordsDb().putSync(row.id, record);
			imported += 1;

			if (!row.revoked_at && row.expires_at > at) {
				latestActiveId = row.id;
			}
		}

		if (latestActiveId && !activeDb().getSync('_active')) {
			activeDb().putSync('_active', latestActiveId);
		}

		metaDb().putSync(META_KEY, new Date().toISOString());
		fs.renameSync(LEGACY_DB, MIGRATED_DB);
		console.log(`[WorkerTokenStore] Migrated ${imported} token record(s) from worker-tokens.db → LMDB`);
	} catch (err) {
		console.warn('[WorkerTokenStore] worker-tokens.db migration skipped:', err.message);
	}
}
