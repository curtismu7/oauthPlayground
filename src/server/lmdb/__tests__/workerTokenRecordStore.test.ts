// @vitest-environment node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const tmp = path.join(os.tmpdir(), `lmdb-wt-records-${process.pid}-${Date.now()}`);

let store: typeof import('../workerTokenRecordStore.js').workerTokenRecordStore;
let envMod: typeof import('../openEnv.js');

beforeAll(async () => {
	process.env.LMDB_PATH = tmp;
	process.env.PLAYGROUND_ENC_KEY = 'b'.repeat(64);
	const mod = await import('../workerTokenRecordStore.js');
	store = mod.workerTokenRecordStore;
	envMod = await import('../openEnv.js');
});

afterAll(() => {
	try {
		envMod.closeEnv();
	} catch {
		/* ignore */
	}
	fs.rmSync(tmp, { recursive: true, force: true });
});

beforeEach(() => {
	for (const { key } of envMod.getDb('worker_token_records').getRange()) {
		envMod.getDb('worker_token_records').removeSync(key);
	}
	envMod.getDb('worker_token_active').removeSync('_active');
});

describe('workerTokenRecordStore', () => {
	it('creates and retrieves the active token', () => {
		const expiresAt = Date.now() + 3600000;
		const created = store.createToken('secret-token', expiresAt, ['admin'], 'Test Token', {
			environmentId: 'env-1',
		});
		expect(created.id).toBeTruthy();

		const active = store.getActiveToken();
		expect(active?.id).toBe(created.id);
		expect(active?.token).toBe('secret-token');
		expect(active?.expires_at).toBe(expiresAt);
	});

	it('revokes a token and clears active pointer', () => {
		const { id } = store.createToken('revoke-me', Date.now() + 3600000, [], 'Revoke');
		expect(store.revokeToken(id)).toBe(true);
		expect(store.getActiveToken()).toBeNull();
		const row = store.getTokenById(id);
		expect(row?.status).toBe('revoked');
	});

	it('returns history newest-first with status', () => {
		store.createToken('one', Date.now() + 3600000, [], 'One');
		store.createToken('two', Date.now() + 3600000, [], 'Two');
		const history = store.getHistory(10);
		expect(history).toHaveLength(2);
		expect(history[0].name).toBe('Two');
		expect(history[0].status).toBe('active');
	});

	it('removes expired tokens on purge', () => {
		const { id } = store.createToken('old', Date.now() - 1000, [], 'Expired');
		store.purgeExpired();
		expect(store.getTokenById(id)).toBeNull();
	});
});
