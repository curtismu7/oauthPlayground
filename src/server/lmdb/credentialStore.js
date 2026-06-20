// src/server/lmdb/credentialStore.js
//
// The single backend store for worker tokens + all credentials, backed by the
// project's own LMDB (see openEnv.js). All ops are synchronous.
//
// Sub-DBs:
//   worker_tokens     key <envId>            -> { accessToken, expiresAt, savedAt }
//   credentials       key <envId>|__worker_token__ -> { credentials, savedAt }
//   flow_credentials  key <flowKey>          -> { credentials, savedAt, flowKey }
//   kv                key <string>           -> any JSON (file:* , mcp-config, etc.)

import { getDb } from './openEnv.js';

const workerTokens = () => getDb('worker_tokens');
const credentials = () => getDb('credentials');
const flowCredentials = () => getDb('flow_credentials');
const kv = () => getDb('kv');

const now = () => Date.now();

// ---- worker tokens ----------------------------------------------------------
export function saveWorkerToken(envId, accessToken, expiresAt) {
	if (!envId || !accessToken) return false;
	workerTokens().putSync(envId, { accessToken, expiresAt: expiresAt ?? null, savedAt: now() });
	return true;
}
export function getWorkerToken(envId) {
	if (!envId) return null;
	return workerTokens().get(envId) ?? null;
}
export function deleteWorkerToken(envId) {
	if (!envId) return false;
	return workerTokens().removeSync(envId);
}
export function getAllWorkerTokens() {
	const out = {};
	for (const { key, value } of workerTokens().getRange()) out[key] = value;
	return out;
}

// ---- credentials (worker creds + global config, keyed by envId) -------------
export function saveCredentials(key, creds) {
	if (!key || !creds) return false;
	credentials().putSync(key, { credentials: creds, savedAt: now() });
	return true;
}
export function getCredentials(key) {
	if (!key) return null;
	return credentials().get(key) ?? null;
}
export function deleteCredentials(key) {
	if (!key) return false;
	return credentials().removeSync(key);
}
export function getAllCredentials() {
	const out = {};
	for (const { key, value } of credentials().getRange()) out[key] = value;
	return out;
}

// ---- per-flow OAuth credentials (keyed by flowKey) --------------------------
export function saveFlowCredentials(flowKey, creds) {
	if (!flowKey || !creds) return false;
	flowCredentials().putSync(flowKey, { credentials: creds, savedAt: now(), flowKey });
	return true;
}
export function getFlowCredentials(flowKey) {
	if (!flowKey) return null;
	return flowCredentials().get(flowKey) ?? null;
}
export function deleteFlowCredentials(flowKey) {
	if (!flowKey) return false;
	return flowCredentials().removeSync(flowKey);
}
export function getAllFlowCredentials() {
	const out = {};
	for (const { key, value } of flowCredentials().getRange()) out[key] = value;
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

// True once at least one record exists anywhere (used to skip boot migration).
export function hasAnyData() {
	for (const _ of workerTokens().getRange()) return true;
	for (const _ of credentials().getRange()) return true;
	for (const _ of flowCredentials().getRange()) return true;
	return false;
}
