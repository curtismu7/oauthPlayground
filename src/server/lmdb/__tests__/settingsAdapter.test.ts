// @vitest-environment node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const tmp = path.join(os.tmpdir(), `lmdb-settings-test-${process.pid}-${Date.now()}`);

let settingsDB: typeof import('../settingsAdapter.js').settingsDB;
let settingsStore: typeof import('../settingsStore.js');
let envMod: typeof import('../openEnv.js');

beforeAll(async () => {
	process.env.LMDB_PATH = tmp;
	const adapterMod = await import('../settingsAdapter.js');
	settingsDB = adapterMod.settingsDB;
	settingsStore = await import('../settingsStore.js');
	envMod = await import('../openEnv.js');
	await settingsDB.init();
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
	settingsStore.clear();
});

describe('settingsDB adapter', () => {
	it('round-trips a string setting with JSON-encoded get (legacy contract)', async () => {
		await settingsDB.set('custom_domain', 'api.pingdemo.com');
		const raw = await settingsDB.get('custom_domain');
		expect(raw).toBe('"api.pingdemo.com"');
		expect(JSON.parse(raw as string)).toBe('api.pingdemo.com');
	});

	it('returns null for missing keys', async () => {
		expect(await settingsDB.get('missing_key')).toBeNull();
	});

	it('stores region and environment id values', async () => {
		await settingsDB.set('pingone_region', 'us');
		await settingsDB.set('environment_id', 'a1234567-b890-c123-d456-e7890f123456');

		expect(JSON.parse((await settingsDB.get('pingone_region')) as string)).toBe('us');
		expect(JSON.parse((await settingsDB.get('environment_id')) as string)).toBe(
			'a1234567-b890-c123-d456-e7890f123456',
		);
	});
});

describe('settingsStore', () => {
	it('getAll returns every stored key', () => {
		settingsStore.set('a', 1);
		settingsStore.set('b', 'two');
		expect(settingsStore.getAll()).toEqual({ a: 1, b: 'two' });
	});

	it('del removes a key', () => {
		settingsStore.set('x', true);
		settingsStore.del('x');
		expect(settingsStore.get('x')).toBeNull();
	});
});
