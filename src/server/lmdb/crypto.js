// src/server/lmdb/crypto.js
//
// Field-level AES-256-GCM for secrets stored in LMDB (client secrets, tokens,
// API keys, password hashes). Only sensitive fields are sealed so the rest of a
// record stays plaintext/queryable.
//
// Key source: PLAYGROUND_ENC_KEY (32 bytes as 64-hex or base64). If unset, a key
// is generated once into a gitignored file next to the data dir (dev convenience;
// production should set the env var / mount a secret).

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_FILE = path.join(__dirname, '..', 'data', '.enc-key');
const ALGO = 'aes-256-gcm';

function parseKey(raw) {
	const s = String(raw).trim();
	let buf;
	if (/^[0-9a-fA-F]{64}$/.test(s)) buf = Buffer.from(s, 'hex');
	else buf = Buffer.from(s, 'base64');
	return buf.length === 32 ? buf : null;
}

let _key = null;
function getKey() {
	if (_key) return _key;
	const fromEnv = process.env.PLAYGROUND_ENC_KEY && parseKey(process.env.PLAYGROUND_ENC_KEY);
	if (fromEnv) {
		_key = fromEnv;
		return _key;
	}
	try {
		if (fs.existsSync(KEY_FILE)) {
			const k = parseKey(fs.readFileSync(KEY_FILE, 'utf8'));
			if (k) {
				_key = k;
				return _key;
			}
		}
		const gen = crypto.randomBytes(32);
		fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
		fs.writeFileSync(KEY_FILE, gen.toString('hex'), { mode: 0o600 });
		console.warn(
			'⚠️ PLAYGROUND_ENC_KEY not set — generated a dev key at src/server/data/.enc-key. Set the env var in production.'
		);
		_key = gen;
		return _key;
	} catch (e) {
		// Last resort: a RANDOM per-process key so the server still runs. Data
		// sealed under it won't survive a restart, but it is never a predictable
		// constant (which would let anyone with the source decrypt secrets).
		console.warn('⚠️ Could not persist an encryption key — using a random per-process key:', e?.message);
		_key = crypto.randomBytes(32);
		return _key;
	}
}

let _warnedKeyMismatch = false;
function warnKeyMismatch() {
	if (_warnedKeyMismatch) return;
	_warnedKeyMismatch = true;
	console.warn(
		'⚠️ Could not decrypt a stored secret — PLAYGROUND_ENC_KEY likely changed. Affected fields read as null until re-saved.'
	);
}

export function isEnvelope(v) {
	return Boolean(v && typeof v === 'object' && v.__enc === 1 && v.iv && v.tag && v.ct);
}

export function encryptField(plaintext) {
	if (plaintext == null) return plaintext;
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
	const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
	return {
		__enc: 1,
		iv: iv.toString('base64'),
		tag: cipher.getAuthTag().toString('base64'),
		ct: ct.toString('base64'),
	};
}

export function decryptField(env) {
	if (!isEnvelope(env)) return env; // legacy plaintext passes through
	const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(env.iv, 'base64'));
	decipher.setAuthTag(Buffer.from(env.tag, 'base64'));
	const pt = Buffer.concat([
		decipher.update(Buffer.from(env.ct, 'base64')),
		decipher.final(),
	]);
	return pt.toString('utf8');
}

function getPath(obj, dotted) {
	return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, dotted, value) {
	const keys = dotted.split('.');
	let o = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		if (o[keys[i]] == null || typeof o[keys[i]] !== 'object') return;
		o = o[keys[i]];
	}
	o[keys[keys.length - 1]] = value;
}

/** Encrypt the given dot-paths in-place on a clone; returns the sealed clone. */
export function sealFields(obj, paths) {
	if (!obj || !paths?.length) return obj;
	const clone = structuredClone(obj);
	for (const p of paths) {
		const v = getPath(clone, p);
		if (v != null && !isEnvelope(v)) setPath(clone, p, encryptField(v));
	}
	return clone;
}

/** Decrypt the given dot-paths in-place on a clone; returns the opened clone. */
export function openFields(obj, paths) {
	if (!obj || !paths?.length) return obj;
	const clone = structuredClone(obj);
	for (const p of paths) {
		const v = getPath(clone, p);
		if (isEnvelope(v)) {
			try {
				setPath(clone, p, decryptField(v));
			} catch {
				// Wrong/rotated key — degrade to null rather than 500 on every read.
				setPath(clone, p, null);
				warnKeyMismatch();
			}
		}
	}
	return clone;
}
