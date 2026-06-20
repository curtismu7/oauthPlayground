// src/server/lmdb/credentialStore.js
//
// The single backend store for worker tokens + all credentials, backed by the
// project's own LMDB (see openEnv.js). All ops are synchronous. Secret fields are
// sealed at rest with AES-256-GCM (see crypto.js).
//
// Sub-DBs:
//   worker_tokens     key <envId>            -> { accessToken*, expiresAt, savedAt }
//   credentials       key <envId>|__worker_token__ -> { credentials*, savedAt }
//   flow_credentials  key <flowKey>          -> { credentials*, savedAt, flowKey }
//   apikeys           key <service>          -> { key*, savedAt }
//   kv                key <string>           -> any JSON (file:* , mcp-config, etc.)
//   meta              key <string>           -> scalars (schema_version, migration flags)
//   * = field encrypted at rest

import { getDb } from './openEnv.js';
import { openFields, sealFields } from './crypto.js';

const workerTokens = () => getDb('worker_tokens');
const credentials = () => getDb('credentials');
const flowCredentials = () => getDb('flow_credentials');
const apiKeys = () => getDb('apikeys');
const kv = () => getDb('kv');
const meta = () => getDb('meta');

const now = () => Date.now();

const SECRET = {
	worker_tokens: ['accessToken', 'refreshToken'],
	credentials: ['credentials.clientSecret'],
	// Per-flow records carry the actual OAuth tokens (UnifiedToken.value) plus the
	// client secret — seal all token-bearing fields, not just the secret.
	flow_credentials: [
		'credentials.clientSecret',
		'credentials.value',
		'credentials.accessToken',
		'credentials.refreshToken',
		'credentials.idToken',
	],
	apikeys: ['key'],
};

// ---- worker tokens ----------------------------------------------------------
export function saveWorkerToken(envId, accessToken, expiresAt) {
	if (!envId || !accessToken) return false;
	const val = sealFields(
		{ accessToken, expiresAt: expiresAt ?? null, savedAt: now() },
		SECRET.worker_tokens
	);
	workerTokens().putSync(envId, val);
	return true;
}
export function getWorkerToken(envId) {
	if (!envId) return null;
	const v = workerTokens().get(envId);
	return v ? openFields(v, SECRET.worker_tokens) : null;
}
export function deleteWorkerToken(envId) {
	if (!envId) return false;
	return workerTokens().removeSync(envId);
}
export function getAllWorkerTokens() {
	const out = {};
	for (const { key, value } of workerTokens().getRange()) out[key] = openFields(value, SECRET.worker_tokens);
	return out;
}

// ---- credentials (worker creds + global config, keyed by envId) -------------
export function saveCredentials(key, creds) {
	if (!key || !creds) return false;
	credentials().putSync(key, sealFields({ credentials: creds, savedAt: now() }, SECRET.credentials));
	return true;
}
export function getCredentials(key) {
	if (!key) return null;
	const v = credentials().get(key);
	return v ? openFields(v, SECRET.credentials) : null;
}
export function deleteCredentials(key) {
	if (!key) return false;
	return credentials().removeSync(key);
}
export function getAllCredentials() {
	const out = {};
	for (const { key, value } of credentials().getRange()) out[key] = openFields(value, SECRET.credentials);
	return out;
}

// ---- per-flow OAuth credentials (keyed by flowKey) --------------------------
export function saveFlowCredentials(flowKey, creds) {
	if (!flowKey || !creds) return false;
	flowCredentials().putSync(
		flowKey,
		sealFields({ credentials: creds, savedAt: now(), flowKey }, SECRET.flow_credentials)
	);
	return true;
}
export function getFlowCredentials(flowKey) {
	if (!flowKey) return null;
	const v = flowCredentials().get(flowKey);
	return v ? openFields(v, SECRET.flow_credentials) : null;
}
export function deleteFlowCredentials(flowKey) {
	if (!flowKey) return false;
	return flowCredentials().removeSync(flowKey);
}
export function getAllFlowCredentials() {
	const out = {};
	for (const { key, value } of flowCredentials().getRange())
		out[key] = openFields(value, SECRET.flow_credentials);
	return out;
}

// ---- API keys (keyed by service) -------------------------------------------
export function saveApiKey(service, key) {
	if (!service || !key) return false;
	apiKeys().putSync(service, sealFields({ key, savedAt: now() }, SECRET.apikeys));
	return true;
}
export function getApiKey(service) {
	if (!service) return null;
	const v = apiKeys().get(service);
	return v ? openFields(v, SECRET.apikeys).key : null;
}
export function deleteApiKey(service) {
	if (!service) return false;
	return apiKeys().removeSync(service);
}
export function getAllApiKeys() {
	const out = {};
	for (const { key, value } of apiKeys().getRange()) out[key] = openFields(value, SECRET.apikeys).key;
	return out;
}

// ---- generic KV -------------------------------------------------------------
export function kvSet(key, value) {
	if (!key) return false;
	kv().putSync(key, value);
	return true;
}
export function kvGet(key) {
	if (!key) return null;
	return kv().get(key) ?? null;
}
export function kvDelete(key) {
	if (!key) return false;
	return kv().removeSync(key);
}

// ---- meta (schema version, migration flags) --------------------------------
export function metaGet(key) {
	if (!key) return null;
	return meta().get(key) ?? null;
}
export function metaSet(key, value) {
	if (!key) return false;
	meta().putSync(key, value);
	return true;
}

// True once at least one record exists anywhere (used to skip boot migration).
export function hasAnyData() {
	for (const _ of workerTokens().getRange()) return true;
	for (const _ of credentials().getRange()) return true;
	for (const _ of flowCredentials().getRange()) return true;
	return false;
}

// Raw (sealed) export of every sub-DB for portable backup. Secret fields stay
// encrypted in the dump, so it is safe to copy. importAll writes them back as-is.
const ALL_DBS = ['worker_tokens', 'credentials', 'flow_credentials', 'apikeys', 'kv', 'meta'];
export function exportAll() {
	const out = {};
	for (const name of ALL_DBS) {
		const o = {};
		for (const { key, value } of getDb(name).getRange()) o[key] = value;
		out[name] = o;
	}
	return out;
}
export function importAll(dump) {
	let count = 0;
	for (const name of ALL_DBS) {
		const section = dump?.[name];
		if (!section || typeof section !== 'object' || Array.isArray(section)) continue;
		const db = getDb(name);
		for (const [key, value] of Object.entries(section)) {
			// Only restore plain-object/scalar values under string keys.
			if (typeof key !== 'string' || value === undefined) continue;
			db.putSync(key, value);
			count++;
		}
	}
	return count;
}

// Remove expired token records; returns the number purged. Called by the sweep.
export function purgeExpired(nowMs = Date.now()) {
	let purged = 0;
	for (const { key, value } of workerTokens().getRange()) {
		if (value?.expiresAt && value.expiresAt < nowMs) {
			workerTokens().removeSync(key);
			purged++;
		}
	}
	return purged;
}
