// @vitest-environment node
//
// Unit tests for the LMDB credential store + field encryption. Uses a temp LMDB
// path and a fixed encryption key so seal/open is deterministic. Runs under the
// node env (not jsdom) — lmdb's getRange returns Buffer keys that the jsdom
// realm mis-serializes.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const tmp = path.join(os.tmpdir(), `lmdb-test-${process.pid}-${Date.now()}`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let store: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let crypto: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let envMod: any;

beforeAll(async () => {
	process.env.LMDB_PATH = tmp; // read at module-eval time by openEnv.js
	process.env.PLAYGROUND_ENC_KEY = 'a'.repeat(64); // 32 bytes as hex
	store = await import('../credentialStore.js');
	crypto = await import('../crypto.js');
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

describe('crypto field encryption', () => {
	it('round-trips a sealed field', () => {
		const sealed = crypto.encryptField('secret-value');
		expect(crypto.isEnvelope(sealed)).toBe(true);
		expect(sealed.ct).not.toContain('secret-value');
		expect(crypto.decryptField(sealed)).toBe('secret-value');
	});

	it('passes legacy plaintext through decrypt unchanged', () => {
		expect(crypto.decryptField('plain')).toBe('plain');
	});

	it('openFields degrades to null on an undecryptable envelope (key mismatch)', () => {
		const bad = { __enc: 1, iv: 'AAAAAAAAAAAAAAAA', tag: 'AAAAAAAAAAAAAAAAAAAAAA==', ct: 'AAAA' };
		const out = crypto.openFields({ secret: bad }, ['secret']);
		expect(out.secret).toBeNull();
	});
});

describe('credentialStore', () => {
	it('seals worker token at rest, decrypts on read', () => {
		store.saveWorkerToken('e1', 'tok-abc', Date.now() + 3_600_000);
		const raw = envMod.getDb('worker_tokens').get('e1');
		expect(raw.accessToken.__enc).toBe(1); // sealed on disk
		expect(store.getWorkerToken('e1').accessToken).toBe('tok-abc'); // decrypted on read
	});

	it('keeps non-secret credential fields plaintext, seals the secret', () => {
		store.saveCredentials('e2', { clientId: 'cid', clientSecret: 'sec' });
		const raw = envMod.getDb('credentials').get('e2');
		expect(raw.credentials.clientId).toBe('cid'); // queryable
		expect(raw.credentials.clientSecret.__enc).toBe(1); // sealed
		expect(store.getCredentials('e2').credentials.clientSecret).toBe('sec');
	});

	it('seals per-flow OAuth token value (not just clientSecret)', () => {
		store.saveFlowCredentials('f1', { value: 'access-token-raw', clientSecret: 's' });
		const raw = envMod.getDb('flow_credentials').get('f1');
		expect(raw.credentials.value.__enc).toBe(1);
		expect(store.getFlowCredentials('f1').credentials.value).toBe('access-token-raw');
	});

	it('seals API keys and reads them back', () => {
		store.saveApiKey('groq', 'sk-test');
		const raw = envMod.getDb('apikeys').get('groq');
		expect(raw.key.__enc).toBe(1);
		expect(store.getApiKey('groq')).toBe('sk-test');
	});

	it('purgeExpired removes only expired worker tokens', () => {
		store.saveWorkerToken('valid', 'x', Date.now() + 3_600_000);
		store.saveWorkerToken('expired', 'y', Date.now() - 1);
		const purged = store.purgeExpired();
		expect(purged).toBeGreaterThanOrEqual(1);
		expect(store.getWorkerToken('expired')).toBeNull();
		expect(store.getWorkerToken('valid')).not.toBeNull();
	});

	it('exportAll keeps secrets sealed in the dump', () => {
		const dump = store.exportAll();
		expect(dump.worker_tokens.e1.accessToken.__enc).toBe(1);
		expect(dump.credentials.e2.credentials.clientSecret.__enc).toBe(1);
	});

	it('importAll rejects non-object sections and undefined values', () => {
		const n = store.importAll({ credentials: 'not-an-object', worker_tokens: { k: undefined } });
		expect(n).toBe(0);
	});

	it('importAll restores valid sections', () => {
		const n = store.importAll({ kv: { 'file:x': { a: 1 } } });
		expect(n).toBe(1);
		expect(store.kvGet('file:x')).toEqual({ a: 1 });
	});
});
