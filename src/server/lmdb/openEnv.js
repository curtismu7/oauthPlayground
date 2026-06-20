// src/server/lmdb/openEnv.js
//
// oauthPlayground's OWN central LMDB environment — independent of AI-Demo.
// One env, named sub-DBs (encoding: 'json'), synchronous put/get/del.
//
// Data path lives under src/server/data/ which is:
//   - persisted in prod via the `oauth-data:/app/src/server/data` Docker volume
//   - excluded from the image by .dockerignore
//   - gitignored for local dev
// Override with LMDB_PATH (used by tests).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open } from 'lmdb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = path.join(__dirname, '..', 'data', 'lmdb');

export const LMDB_PATH = process.env.LMDB_PATH || DEFAULT_PATH;

let _env = null;
const _dbs = new Map();

export function openEnv() {
	if (_env) return _env;
	fs.mkdirSync(LMDB_PATH, { recursive: true });
	_env = open({
		path: LMDB_PATH,
		maxDbs: 8,
		// 64 MB — credential/token data is tiny. If this is ever exhausted, puts
		// throw MDB_MAP_FULL; raising it requires closing + reopening the env with
		// a larger mapSize (LMDB cannot grow the map of an open env here).
		mapSize: 64 * 1024 * 1024,
		noSync: false,
	});
	return _env;
}

export function getDb(name) {
	let db = _dbs.get(name);
	if (db) return db;
	db = openEnv().openDB(name, { encoding: 'json' });
	_dbs.set(name, db);
	return db;
}

export function closeEnv() {
	if (!_env) return;
	_env.close();
	_env = null;
	_dbs.clear();
}
