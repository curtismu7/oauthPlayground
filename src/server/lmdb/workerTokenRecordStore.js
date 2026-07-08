// src/server/lmdb/workerTokenRecordStore.js
//
// Worker token history/revocation store backed by LMDB. Replaces the SQLite
// workerTokenDatabaseService (~/.pingone-playground/worker-tokens.db).
//
// Sub-DBs:
//   worker_token_records  key <tokenId>  -> sealed record
//   worker_token_active   key _active     -> <tokenId> pointer to current token

import { randomUUID } from 'node:crypto';
import { getDb } from './openEnv.js';
import { openFields, sealFields } from './crypto.js';
import { migrateWorkerTokensFromSqlite } from './migrateWorkerTokensSqlite.js';

const MODULE_TAG = '[WorkerTokenStore]';
const ACTIVE_KEY = '_active';
const SECRET_PATHS = ['token'];

const recordsDb = () => getDb('worker_token_records');
const activeDb = () => getDb('worker_token_active');

function now() {
	return Date.now();
}

function openRecord(raw) {
	if (!raw) return null;
	return openFields(raw, SECRET_PATHS);
}

function sealRecord(record) {
	return sealFields(record, SECRET_PATHS);
}

function computeStatus(record, at = now()) {
	if (record.revoked_at) return 'revoked';
	if (record.expires_at < at) return 'expired';
	if (record.expires_at - at < 5 * 60 * 1000) return 'expiring';
	return 'active';
}

function toHistoryRow(record, at = now()) {
	const row = openRecord(record);
	if (!row) return null;
	const status = computeStatus(row, at);
	return {
		id: row.id,
		token: row.token,
		expires_at: row.expires_at,
		created_at: row.created_at,
		revoked_at: row.revoked_at ?? null,
		roles: row.roles || [],
		name: row.name || 'Worker Token',
		status,
		expiresIn: Math.max(0, row.expires_at - at),
	};
}

function setActive(id) {
	activeDb().putSync(ACTIVE_KEY, id);
}

function getActiveId() {
	return activeDb().getSync(ACTIVE_KEY) ?? null;
}

function findLatestActiveRecord(at = now()) {
	let best = null;
	for (const { value } of recordsDb().getRange()) {
		const row = openRecord(value);
		if (!row || row.revoked_at || row.expires_at <= at) continue;
		if (!best || row.created_at > best.created_at) best = row;
	}
	return best;
}

function cleanupExpired() {
	const at = now();
	let removed = 0;
	for (const { key, value } of recordsDb().getRange()) {
		const row = openRecord(value);
		if (!row || row.revoked_at || row.expires_at >= at) continue;
		recordsDb().removeSync(key);
		removed += 1;
		if (getActiveId() === key) {
			activeDb().removeSync(ACTIVE_KEY);
		}
	}
	if (removed > 0) {
		console.log(`${MODULE_TAG} Cleaned up ${removed} expired token(s)`);
	}
}

export const workerTokenRecordStore = {
	createToken(token, expiresAt, roles, name, metadata = {}) {
		const id = randomUUID();
		const created = now();
		const record = sealRecord({
			id,
			token,
			expires_at: expiresAt || created + 3600000,
			created_at: created,
			revoked_at: null,
			roles: roles || [],
			name: name || 'Worker Token',
			metadata: metadata || {},
		});
		recordsDb().putSync(id, record);
		setActive(id);
		console.log(`${MODULE_TAG} Created token:`, id);
		return { id, created_at: created };
	},

	getActiveToken() {
		const activeId = getActiveId();
		let row = activeId ? openRecord(recordsDb().getSync(activeId)) : null;
		const at = now();
		if (!row || row.revoked_at || row.expires_at <= at) {
			row = findLatestActiveRecord(at);
			if (row) setActive(row.id);
		}
		if (!row) return null;
		return {
			id: row.id,
			token: row.token,
			expires_at: row.expires_at,
			created_at: row.created_at,
			roles: row.roles || [],
			name: row.name || 'Worker Token',
		};
	},

	getTokenById(id) {
		const row = openRecord(recordsDb().getSync(id));
		if (!row) return null;
		const at = now();
		const status = computeStatus(row, at);
		return {
			id: row.id,
			token: row.token,
			expires_at: row.expires_at,
			created_at: row.created_at,
			revoked_at: row.revoked_at ?? null,
			roles: row.roles || [],
			name: row.name || 'Worker Token',
			status,
			expiresIn: Math.max(0, row.expires_at - at),
		};
	},

	revokeToken(id) {
		const raw = recordsDb().getSync(id);
		const row = openRecord(raw);
		if (!row || row.revoked_at) return false;
		const at = now();
		recordsDb().putSync(
			id,
			sealRecord({
				...row,
				revoked_at: at,
			}),
		);
		if (getActiveId() === id) {
			activeDb().removeSync(ACTIVE_KEY);
		}
		console.log(`${MODULE_TAG} Revoked token:`, id);
		return true;
	},

	getHistory(limit = 50) {
		const rows = [];
		for (const { value } of recordsDb().getRange()) {
			const mapped = toHistoryRow(value);
			if (mapped) rows.push(mapped);
		}
		rows.sort((a, b) => b.created_at - a.created_at);
		return rows.slice(0, limit);
	},

	deleteToken(id) {
		const removed = recordsDb().removeSync(id);
		if (getActiveId() === id) {
			activeDb().removeSync(ACTIVE_KEY);
		}
		return Boolean(removed);
	},

	purgeExpired() {
		cleanupExpired();
	},

	startCleanupInterval() {
		migrateWorkerTokensFromSqlite();
		cleanupExpired();
		setInterval(() => cleanupExpired(), 5 * 60 * 1000);
		console.log(`${MODULE_TAG} Started cleanup interval (5 min)`);
	},
};
